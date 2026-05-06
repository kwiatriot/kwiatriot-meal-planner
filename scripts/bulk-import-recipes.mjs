#!/usr/bin/env node
/**
 * bulk-import-recipes.mjs
 * ─────────────────────────────────────────────────────────────────────────────
 * Bulk imports Hello Fresh recipe card photos into Supabase via Claude Vision.
 * Supports two-sided cards — pairs front/back images into a single API call.
 *
 * NAMING CONVENTION (pick one and stick to it):
 *   bibimbap_front.jpg  +  bibimbap_back.jpg
 *   bibimbap_1.jpg      +  bibimbap_2.jpg
 *   bibimbap-front.jpg  +  bibimbap-back.jpg
 *   bibimbap.jpg                                ← single-sided, still works
 *
 * Usage:
 *   node bulk-import-recipes.mjs ./photos
 *   node bulk-import-recipes.mjs ./photos --dry-run       # extract only, no DB write
 *   node bulk-import-recipes.mjs ./photos --batch         # Batch API (50% cheaper)
 *   node bulk-import-recipes.mjs ./photos --delay=2000    # 2s between requests
 *
 * Prerequisites:
 *   npm install @supabase/supabase-js
 *
 * Env vars (copy from your .env.local):
 *   ANTHROPIC_API_KEY
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SECRET_KEY
 */

// ─── PYTHON DEV NOTE ─────────────────────────────────────────────────────────
// Python: import os, sys, json, pathlib, base64
// Node (ESM): named imports from built-in modules prefixed with 'node:'
// Destructuring { readFileSync } is like: from pathlib import Path
// ─────────────────────────────────────────────────────────────────────────────
import { readFileSync, readdirSync, statSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, extname, basename } from 'node:path';
import { createClient } from '@supabase/supabase-js';

// ─── CONFIG ───────────────────────────────────────────────────────────────────

// ─── PYTHON DEV NOTE ─────────────────────────────────────────────────────────
// Python: os.environ.get('KEY')  →  returns None if missing
// Node:   process.env.KEY        →  returns undefined if missing
// ?? is "nullish coalescing" — like Python's `or` but only triggers on
// null/undefined, not all falsy values. So '' ?? 'x' stays '' (unlike '' or 'x').
// ─────────────────────────────────────────────────────────────────────────────
const ANTHROPIC_API_KEY   = process.env.ANTHROPIC_API_KEY   ?? '';
const SUPABASE_URL        = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const SUPABASE_SECRET_KEY = process.env.SUPABASE_SECRET_KEY ?? '';

const SUPPORTED_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.heic']);

// Regex patterns that identify front/back sides in a filename
// ─── PYTHON DEV NOTE ─────────────────────────────────────────────────────────
// Python: re.compile(r'[_-](front|1)(\.\w+)$', re.IGNORECASE)
// JS:     /pattern/i  — the 'i' flag = re.IGNORECASE. No re.compile() needed;
//         regex literals are compiled at parse time. The /i flag is appended
//         directly to the closing slash.
// ─────────────────────────────────────────────────────────────────────────────
const FRONT_PATTERN = /[_-](front|1)(\.\w+)$/i;
const BACK_PATTERN  = /[_-](back|2)(\.\w+)$/i;
const SIDE_PATTERN  = /[_-](front|back|1|2)(\.\w+)$/i;

const EXTRACT_PROMPT = `You are a recipe data extractor. Analyze these Hello Fresh recipe card images (front and back of the same card) and extract ALL data into a single JSON object. Return ONLY valid JSON — no markdown, no explanation, no backticks.

The front of the card typically has: recipe name, ingredients list with quantities, nutrition info, prep/cook time, servings.
The back of the card typically has: step-by-step cooking instructions, tips.

Required shape:
{
  "name": "full recipe name",
  "type": "dinner" or "lunch" or "snack",
  "description": "1-2 sentence description of the dish",
  "prep_time_min": number,
  "cook_time_min": number,
  "servings": number,
  "tags": ["array", "of", "relevant", "tags like cuisine, protein-type, etc"],
  "ingredients": [
    { "name": "ingredient name", "quantity": number_or_null, "unit": "string_or_null", "category": "produce|proteins|dairy|grains|pantry|frozen|other" }
  ],
  "instructions": "Full step-by-step instructions. Each step on its own line.",
  "nutrition": {
    "calories": number_or_null,
    "protein_g": number_or_null,
    "carbs_g": number_or_null,
    "fat_g": number_or_null,
    "fiber_g": number_or_null
  }
}

Be thorough — extract every visible ingredient, every instruction step, and all nutrition data shown on the card.`;

const SINGLE_SIDE_PROMPT = EXTRACT_PROMPT
  .replace(
    'Analyze these Hello Fresh recipe card images (front and back of the same card)',
    'Analyze this Hello Fresh recipe card image'
  )
  .replace(
    '\n\nThe front of the card typically has: recipe name, ingredients list with quantities, nutrition info, prep/cook time, servings.\nThe back of the card typically has: step-by-step cooking instructions, tips.\n',
    '\n'
  );

// ─── ARG PARSING ──────────────────────────────────────────────────────────────
// ─── PYTHON DEV NOTE ─────────────────────────────────────────────────────────
// Python: argparse.ArgumentParser()
// Node:   process.argv is a raw array: ['node', 'script.mjs', ...your_args]
// We slice off index 0+1 and parse manually. For real CLIs use 'commander' or 'yargs'.
// ─────────────────────────────────────────────────────────────────────────────
const args      = process.argv.slice(2);
const photoDir  = args.find(a => !a.startsWith('--')) ?? './photos';
const DRY_RUN   = args.includes('--dry-run');
const USE_BATCH = args.includes('--batch');
const delayArg  = args.find(a => a.startsWith('--delay='));
const DELAY_MS  = delayArg ? parseInt(delayArg.split('=')[1], 10) : 1500;

// ─── HELPERS ──────────────────────────────────────────────────────────────────

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/** Map file extension to MIME type accepted by the Anthropic API */
function mimeType(ext) {
  const map = { '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
                '.png': 'image/png',  '.webp': 'image/webp', '.heic': 'image/jpeg' };
  return map[ext.toLowerCase()] ?? 'image/jpeg';
}

/**
 * Convert image file to base64 string.
 * ─── PYTHON DEV NOTE ────────────────────────────────────────────────────────
 * Python: base64.b64encode(open(path, 'rb').read()).decode('utf-8')
 * Node:   readFileSync() returns a Buffer (Node's bytes object).
 *         .toString('base64') encodes it — Buffer is a Node global, no import needed.
 * ─────────────────────────────────────────────────────────────────────────────
 */
function toBase64(filePath) {
  return readFileSync(filePath).toString('base64');
}

/** Strip JSON code fences if the model accidentally wraps its output */
function parseJSON(raw) {
  const cleaned = raw.replace(/^```json\s*/i, '').replace(/```\s*$/, '').trim();
  return JSON.parse(cleaned);
}

// ─── CARD PAIRING ─────────────────────────────────────────────────────────────

/**
 * Scan a directory and group images into front/back card pairs.
 *
 * ─── PYTHON DEV NOTE ────────────────────────────────────────────────────────
 * Array.reduce() is JS's equivalent of Python's functools.reduce() or a
 * dict-building loop:
 *   acc = {}
 *   for item in files:
 *       acc = update(acc, item)
 *   return acc
 *
 * Object.entries(obj) = list(obj.items()) in Python
 * .map(([key, val]) => ...) is tuple unpacking, same as: for k, v in items
 * ─────────────────────────────────────────────────────────────────────────────
 */
function getCardPairs(dir) {
  let files;
  try {
    files = readdirSync(dir)
      .filter(f => SUPPORTED_EXTENSIONS.has(extname(f).toLowerCase()))
      .map(f => join(dir, f))
      .filter(f => statSync(f).isFile());
  } catch {
    console.error(`❌ Cannot read directory: ${dir}`);
    process.exit(1);
  }

  if (!files.length) {
    console.error(`❌ No supported images found in: ${dir}`);
    process.exit(1);
  }

  // Group by base name — strip the _front/_back/_1/_2 suffix to get the key
  // e.g. "bibimbap_front.jpg" and "bibimbap_back.jpg" both → key "bibimbap"
  const groups = files.reduce((acc, filePath) => {
    const name = basename(filePath);
    const base = name.replace(SIDE_PATTERN, '');  // strip side suffix + extension handled by replace
    if (!acc[base]) acc[base] = {};

    if (FRONT_PATTERN.test(name))     acc[base].front = filePath;
    else if (BACK_PATTERN.test(name)) acc[base].back  = filePath;
    else                              acc[base].front = filePath; // no suffix → treat as single-sided front

    return acc;
  }, {});

  return Object.entries(groups).map(([base, sides]) => ({
    base,
    front:      sides.front ?? null,
    back:       sides.back  ?? null,
    isTwoSided: !!(sides.front && sides.back),
  }));
}

/**
 * Build the API message content array — 1 or 2 image blocks + prompt text.
 *
 * ─── PYTHON DEV NOTE ────────────────────────────────────────────────────────
 * The API content array is like a Python list of dicts:
 *   [{'type': 'image', 'source': {...}}, {'type': 'text', 'text': '...'}]
 * JS object literal { key: value } = Python dict {'key': value}
 * ─────────────────────────────────────────────────────────────────────────────
 */
function buildMessageContent(pair) {
  const content = [];

  if (pair.front) {
    content.push({
      type:   'image',
      source: { type: 'base64', media_type: mimeType(extname(pair.front)), data: toBase64(pair.front) },
    });
  }

  if (pair.back) {
    content.push({
      type:   'image',
      source: { type: 'base64', media_type: mimeType(extname(pair.back)), data: toBase64(pair.back) },
    });
  }

  content.push({
    type: 'text',
    text: pair.isTwoSided ? EXTRACT_PROMPT : SINGLE_SIDE_PROMPT,
  });

  return content;
}

// ─── STANDARD API ─────────────────────────────────────────────────────────────

async function extractRecipeStandard(pair) {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method:  'POST',
    headers: {
      'Content-Type':      'application/json',
      'x-api-key':         ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model:    'claude-sonnet-4-20250514',
      max_tokens: 1500,
      messages: [{ role: 'user', content: buildMessageContent(pair) }],
    }),
  });

  if (!response.ok) throw new Error(`API error ${response.status}: ${await response.text()}`);
  const data = await response.json();
  return parseJSON(data.content?.[0]?.text ?? '');
}

// ─── BATCH API ────────────────────────────────────────────────────────────────
// ─── PYTHON DEV NOTE ─────────────────────────────────────────────────────────
// Batch API = async job queue, like Celery in Python.
// POST all jobs → get a batch ID → poll until done → fetch JSONL results.
// 50% cheaper, but results arrive in ~5-15 minutes rather than immediately.
// ─────────────────────────────────────────────────────────────────────────────

async function submitBatch(pairs) {
  const requests = pairs.map((pair, i) => ({
    custom_id: `recipe-${i}-${pair.base}`,
    params: {
      model:      'claude-sonnet-4-20250514',
      max_tokens: 1500,
      messages:   [{ role: 'user', content: buildMessageContent(pair) }],
    },
  }));

  const res = await fetch('https://api.anthropic.com/v1/messages/batches', {
    method:  'POST',
    headers: {
      'Content-Type':      'application/json',
      'x-api-key':         ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
      'anthropic-beta':    'message-batches-2024-09-24',
    },
    body: JSON.stringify({ requests }),
  });

  if (!res.ok) throw new Error(`Batch submit failed: ${await res.text()}`);
  return (await res.json()).id;
}

async function pollBatchUntilDone(batchId) {
  const headers = {
    'x-api-key':         ANTHROPIC_API_KEY,
    'anthropic-version': '2023-06-01',
    'anthropic-beta':    'message-batches-2024-09-24',
  };
  let ticks = 0;
  while (true) {
    await sleep(10_000);
    const data = await (await fetch(
      `https://api.anthropic.com/v1/messages/batches/${batchId}`, { headers }
    )).json();
    ticks++;
    process.stdout.write(`\r⏳ Batch: ${data.processing_status} (${ticks * 10}s elapsed)...`);
    if (data.processing_status === 'ended') { console.log('\n✅ Batch complete'); return; }
  }
}

async function fetchBatchResults(batchId) {
  const res  = await fetch(`https://api.anthropic.com/v1/messages/batches/${batchId}/results`, {
    headers: {
      'x-api-key':         ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
      'anthropic-beta':    'message-batches-2024-09-24',
    },
  });
  const text = await res.text();
  // JSONL = newline-delimited JSON, one result object per line
  return text.trim().split('\n').filter(Boolean).map(l => JSON.parse(l));
}

// ─── SUPABASE INSERT ──────────────────────────────────────────────────────────

async function insertRecipe(supabase, recipe, label) {
  const row = {
    name:          recipe.name,
    type:          recipe.type          ?? 'dinner',
    description:   recipe.description   ?? null,
    ingredients:   recipe.ingredients   ?? [],
    instructions:  recipe.instructions  ?? null,
    nutrition:     recipe.nutrition     ?? null,
    prep_time_min: recipe.prep_time_min ?? null,
    cook_time_min: recipe.cook_time_min ?? null,
    servings:      recipe.servings      ?? 2,
    tags:          recipe.tags          ?? [],
    is_favorite:   false,
  };
  const { data, error } = await supabase.from('recipes').insert(row).select();
  if (error) throw new Error(`DB insert failed for "${label}": ${error.message}`);
  return data[0];
}

// ─── REPORTING ────────────────────────────────────────────────────────────────

function printPairingReport(pairs) {
  const two = pairs.filter(p => p.isTwoSided);
  const one = pairs.filter(p => !p.isTwoSided);
  console.log(`\n📇 Card pairing:`);
  console.log(`   ${two.length} two-sided pairs`);
  if (one.length) {
    console.log(`   ${one.length} single-sided (missing front or back):`);
    one.forEach(p => console.log(`     ⚠️  ${p.base} — only ${p.front ? 'front' : 'back'} found`));
  }
  console.log('');
}

function printSummary(results) {
  const ok   = results.filter(r => r.status === 'ok');
  const fail = results.filter(r => r.status === 'error');
  const warn = results.filter(r => r.status === 'warning');

  console.log('\n══════════════════════════════════════════════════════');
  console.log(`  IMPORT COMPLETE`);
  console.log(`  ✅ ${ok.length} succeeded   ❌ ${fail.length} failed   ⚠️  ${warn.length} warnings`);
  console.log('══════════════════════════════════════════════════════');

  if (ok.length) {
    console.log('\n✅ Imported:');
    ok.forEach(r => console.log(`  ${r.twoSided ? '(2-sided)' : '(1-sided)'}  "${r.name}"  ←  ${r.base}`));
  }
  if (warn.length) {
    console.log('\n⚠️  Warnings:');
    warn.forEach(r => console.log(`  • ${r.base}: ${r.warning}`));
  }
  if (fail.length) {
    console.log('\n❌ Failed:');
    fail.forEach(r => console.log(`  • ${r.base}: ${r.error}`));
  }

  // Cost estimate: 2-sided ~3000 input tokens, 1-sided ~1800. Output ~600.
  // Sonnet 4.6: $3/M input, $15/M output. Batch = 50% off.
  const inputTokens  = ok.reduce((sum, r) => sum + (r.twoSided ? 3000 : 1800), 0);
  const outputTokens = ok.length * 600;
  let cost = (inputTokens / 1_000_000 * 3) + (outputTokens / 1_000_000 * 15);
  if (USE_BATCH) cost *= 0.5;
  console.log(`\n💰 Estimated cost: $${cost.toFixed(4)} for ${ok.length} cards`);
  if (USE_BATCH) console.log('   (Batch API 50% discount applied)');
}

// ─── VALIDATE ENV ─────────────────────────────────────────────────────────────

if (!ANTHROPIC_API_KEY) { console.error('❌ Missing ANTHROPIC_API_KEY'); process.exit(1); }
if (!DRY_RUN && (!SUPABASE_URL || !SUPABASE_SECRET_KEY)) {
  console.error('❌ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SECRET_KEY');
  process.exit(1);
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────

const pairs    = getCardPairs(photoDir);
const supabase = DRY_RUN ? null : createClient(SUPABASE_URL, SUPABASE_SECRET_KEY);
const outDir   = './recipe-json-output';
mkdirSync(outDir, { recursive: true });

console.log(`\n🍽️  Kwiatriot Recipe Card Bulk Importer`);
console.log(`   Directory : ${photoDir}`);
console.log(`   Cards     : ${pairs.length} (${pairs.filter(p => p.isTwoSided).length} two-sided)`);
console.log(`   Mode      : ${USE_BATCH ? '📦 Batch API (~10min, 50% cheaper)' : '⚡ Standard API'}`);
console.log(`   Dry run   : ${DRY_RUN ? 'YES — no DB writes' : 'NO — writing to Supabase'}`);

printPairingReport(pairs);

const results = [];

// ══════════════════════════════════════════════════════════
// PATH A: Standard API — one card at a time
// ══════════════════════════════════════════════════════════
if (!USE_BATCH) {
  for (let i = 0; i < pairs.length; i++) {
    const pair = pairs[i];
    console.log(`[${i + 1}/${pairs.length}] 📸 ${pair.isTwoSided ? '(2-sided)' : '(1-sided)'} ${pair.base}`);

    try {
      const recipe   = await extractRecipeStandard(pair);
      const jsonPath = join(outDir, `${pair.base}.json`);
      writeFileSync(jsonPath, JSON.stringify(recipe, null, 2));

      if (!DRY_RUN) {
        const inserted = await insertRecipe(supabase, recipe, pair.base);
        console.log(`   ✅ "${recipe.name}" → id: ${inserted.id}`);
      } else {
        console.log(`   🧪 "${recipe.name}" → ${jsonPath}`);
      }

      results.push({ status: 'ok', name: recipe.name, base: pair.base, twoSided: pair.isTwoSided });
      if (!pair.isTwoSided) {
        results.push({ status: 'warning', base: pair.base,
          warning: `Only ${pair.front ? 'front' : 'back'} found — some data may be missing` });
      }
    } catch (err) {
      console.error(`   ❌ ${err.message}`);
      results.push({ status: 'error', base: pair.base, error: err.message });
    }

    if (i < pairs.length - 1) await sleep(DELAY_MS);
  }
}

// ══════════════════════════════════════════════════════════
// PATH B: Batch API — submit all, poll, insert results
// ══════════════════════════════════════════════════════════
else {
  console.log(`📦 Submitting ${pairs.length} cards to Batch API...`);
  const batchId = await submitBatch(pairs);
  console.log(`   Batch ID: ${batchId}\n`);

  await pollBatchUntilDone(batchId);
  const rawResults = await fetchBatchResults(batchId);

  for (let i = 0; i < rawResults.length; i++) {
    const result = rawResults[i];
    const pair   = pairs[i];

    if (result.result?.type !== 'succeeded') {
      console.error(`❌ Failed: ${result.custom_id}`);
      results.push({ status: 'error', base: pair?.base ?? result.custom_id,
        error: JSON.stringify(result.result) });
      continue;
    }

    try {
      const recipe   = parseJSON(result.result.message.content?.[0]?.text ?? '');
      const jsonPath = join(outDir, `${pair.base}.json`);
      writeFileSync(jsonPath, JSON.stringify(recipe, null, 2));

      if (!DRY_RUN) {
        const inserted = await insertRecipe(supabase, recipe, pair.base);
        console.log(`✅ "${recipe.name}" → id: ${inserted.id}`);
      } else {
        console.log(`🧪 "${recipe.name}"`);
      }

      results.push({ status: 'ok', name: recipe.name, base: pair.base, twoSided: pair.isTwoSided });
      if (!pair.isTwoSided) {
        results.push({ status: 'warning', base: pair.base,
          warning: `Only ${pair.front ? 'front' : 'back'} found` });
      }
    } catch (err) {
      results.push({ status: 'error', base: pair.base, error: err.message });
    }
  }
}

printSummary(results);

writeFileSync('./import-results.json', JSON.stringify(results, null, 2));
console.log(`\n📄 Results log : ./import-results.json`);
console.log(`📁 JSON previews: ${outDir}/\n`);
