# 🍽️ Kwiatriot Meal Planner

A full-stack web app for weekly meal planning, grocery list generation, and meal history tracking. Built as a learning project using Next.js, Supabase, and Vercel.

## About

This app replaces our Hello Fresh subscription with a custom, cost-free system. It's designed for two users (my wife and I) to:

- Select lunches, dinners, and snacks each week from a curated recipe library
- Automatically generate a categorized grocery list every Friday
- Track meal history and re-use favorites
- Plan meals up to 2 weeks in advance

## Tech Stack

| Layer | Tool |
|---|---|
| Framework | [Next.js 16](https://nextjs.org) (App Router) |
| Styling | [Tailwind CSS](https://tailwindcss.com) |
| Auth + DB | [Supabase](https://supabase.com) |
| Hosting | [Vercel](https://vercel.com) |
| Recipe docs | Google Drive |
| Project tracking | Notion |

## Getting Started

### Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) account (free tier)
- A [Vercel](https://vercel.com) account (free tier)

### Local Setup

```bash
# Clone the repo
git clone https://github.com/kwiatriot/kwiatriot-meal-planner.git
cd kwiatriot-meal-planner

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.local
# Fill in your Supabase URL and anon key in .env.local

# Run database migrations
npx supabase db push

# Start the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

## Project Structure

```
src/
├── app/
│   ├── login/              # Auth screen
│   ├── dashboard/          # Home — current week at a glance
│   ├── meal-selector/      # Pick meals for the week
│   ├── shopping-list/      # Auto-generated grocery list
│   ├── history/            # Past weeks + favorites
│   ├── plan-ahead/         # Future week planning (up to 2 weeks)
│   └── api/
│       ├── auth/           # Auth endpoints
│       ├── meal-plans/     # Meal plan CRUD
│       ├── recipes/        # Recipe library
│       └── shopping-list/  # List generation
├── components/
│   ├── ui/                 # Shared UI components
│   ├── meals/              # Meal card, selector components
│   └── shopping/           # Shopping list components
├── lib/
│   ├── supabase.ts         # Supabase client
│   ├── utils.ts            # Shared utilities
│   └── shopping.ts         # Shopping list aggregation logic
├── types/
│   └── index.ts            # TypeScript types
└── hooks/
    └── useMealPlan.ts      # Meal plan data hook
supabase/
└── migrations/
    └── 001_initial_schema.sql
```

## Database Schema

```sql
users            -- id, email, name
recipes          -- id, name, type, ingredients[], nutrition, drive_doc_id
meal_plans       -- id, week_start_date, status (draft/locked)
meal_selections  -- id, meal_plan_id, recipe_id, meal_type, day_of_week
shopping_items   -- id, meal_plan_id, ingredient, quantity, category, checked
```

## Weekly Rhythm

| Day | Action |
|---|---|
| Saturday | Groceries delivered |
| Sunday | Meal prep |
| Mon – Thu | Select meals for next week (modifiable) |
| Friday | Plan locks, shopping list auto-generated |

## Build Roadmap

- **Phase 1 — Core**: Auth, recipe library, meal selector, shopping list, Vercel deploy
- **Phase 2 — Planning & History**: Future week planning, Friday auto-lock, history view
- **Phase 3 — Polish**: Favorites, week ratings, meal reuse, Friday reminders

## Environment Variables

Copy `.env.example` to `.env.local` and fill in:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_key
SUPABASE_SECRET_KEY=your_supabase_secret_key
```

## Contributing

This is a personal project. Feel free to fork and adapt for your own use!

---

Built with ❤️ and Claude
