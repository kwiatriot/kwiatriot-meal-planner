-- Week 1 Recipes seed
-- Run via: Supabase dashboard → SQL Editor → paste and execute
-- Or: supabase db execute --file supabase/seeds/week1_recipes.sql (requires linked project)

insert into recipes (name, type, description, prep_time_min, cook_time_min, servings, ingredients, instructions, nutrition)
values

-- ─── LUNCHES ───────────────────────────────────────────────────────────────

(
  'Greek Chicken Bowl',
  'lunch',
  'Grilled chicken over seasoned rice with cucumber, cherry tomatoes, kalamata olives, and feta. Light, filling, and easy to prep ahead.',
  15, 20, 2,
  '[
    {"name":"chicken breast","quantity":300,"unit":"g","category":"proteins"},
    {"name":"cooked white rice","quantity":200,"unit":"g","category":"grains"},
    {"name":"cucumber","quantity":1,"unit":"medium","category":"produce"},
    {"name":"cherry tomatoes","quantity":150,"unit":"g","category":"produce"},
    {"name":"kalamata olives","quantity":40,"unit":"g","category":"pantry"},
    {"name":"feta cheese","quantity":60,"unit":"g","category":"dairy"},
    {"name":"olive oil","quantity":2,"unit":"tbsp","category":"pantry"},
    {"name":"lemon juice","quantity":1,"unit":"tbsp","category":"produce"},
    {"name":"dried oregano","quantity":1,"unit":"tsp","category":"pantry"},
    {"name":"garlic powder","quantity":0.5,"unit":"tsp","category":"pantry"}
  ]',
  'Season chicken with oregano, garlic powder, salt, and pepper. Grill or pan-fry over medium-high heat 6-7 min per side until cooked through. Rest 5 min, then slice. Divide rice between bowls. Top with chicken, cucumber, tomatoes, olives, and feta. Drizzle with olive oil and lemon juice.',
  '{"calories":520,"protein_g":45,"carbs_g":38,"fat_g":18,"fiber_g":3}'
),

(
  'Turkey & Avocado Wrap',
  'lunch',
  'Sliced turkey breast, ripe avocado, romaine, and tomato in a whole-wheat tortilla with a light honey-mustard spread.',
  10, 0, 2,
  '[
    {"name":"sliced turkey breast","quantity":200,"unit":"g","category":"proteins"},
    {"name":"whole-wheat flour tortillas","quantity":2,"unit":"large","category":"grains"},
    {"name":"avocado","quantity":1,"unit":"medium","category":"produce"},
    {"name":"romaine lettuce","quantity":2,"unit":"leaves","category":"produce"},
    {"name":"tomato","quantity":1,"unit":"medium","category":"produce"},
    {"name":"dijon mustard","quantity":1,"unit":"tbsp","category":"pantry"},
    {"name":"honey","quantity":1,"unit":"tsp","category":"pantry"},
    {"name":"salt","quantity":0.25,"unit":"tsp","category":"pantry"},
    {"name":"black pepper","quantity":0.25,"unit":"tsp","category":"pantry"}
  ]',
  'Mash avocado with salt and pepper. Mix mustard and honey together. Lay tortillas flat. Spread honey-mustard, then avocado. Layer turkey, lettuce, and sliced tomato. Roll tightly and slice diagonally.',
  '{"calories":440,"protein_g":32,"carbs_g":35,"fat_g":16,"fiber_g":7}'
),

(
  'Black Bean & Veggie Burrito',
  'lunch',
  'Hearty black bean and rice burrito loaded with sautéed peppers, corn, and shredded cheese. Great for meal prep.',
  10, 15, 2,
  '[
    {"name":"canned black beans","quantity":400,"unit":"g","category":"pantry"},
    {"name":"cooked brown rice","quantity":200,"unit":"g","category":"grains"},
    {"name":"whole-wheat flour tortillas","quantity":2,"unit":"large","category":"grains"},
    {"name":"red bell pepper","quantity":1,"unit":"medium","category":"produce"},
    {"name":"frozen corn","quantity":100,"unit":"g","category":"frozen"},
    {"name":"red onion","quantity":0.5,"unit":"medium","category":"produce"},
    {"name":"shredded cheddar","quantity":60,"unit":"g","category":"dairy"},
    {"name":"cumin","quantity":1,"unit":"tsp","category":"pantry"},
    {"name":"chili powder","quantity":0.5,"unit":"tsp","category":"pantry"},
    {"name":"olive oil","quantity":1,"unit":"tbsp","category":"pantry"},
    {"name":"salsa","quantity":3,"unit":"tbsp","category":"pantry"}
  ]',
  'Heat oil in a skillet. Sauté onion and bell pepper 4-5 min. Add corn, drained beans, cumin, and chili powder. Cook 3 min until heated through. Warm tortillas. Divide rice, bean mixture, cheese, and salsa between tortillas. Roll into burritos.',
  '{"calories":510,"protein_g":22,"carbs_g":68,"fat_g":14,"fiber_g":14}'
),

(
  'Tuna Salad Stuffed Peppers',
  'lunch',
  'Classic tuna salad packed into crisp bell pepper halves — low-carb, high-protein, and ready in minutes.',
  10, 0, 2,
  '[
    {"name":"canned tuna in water","quantity":280,"unit":"g","category":"proteins"},
    {"name":"bell peppers","quantity":2,"unit":"large","category":"produce"},
    {"name":"celery","quantity":2,"unit":"stalks","category":"produce"},
    {"name":"red onion","quantity":0.25,"unit":"medium","category":"produce"},
    {"name":"greek yogurt","quantity":3,"unit":"tbsp","category":"dairy"},
    {"name":"dijon mustard","quantity":1,"unit":"tsp","category":"pantry"},
    {"name":"lemon juice","quantity":1,"unit":"tbsp","category":"produce"},
    {"name":"fresh dill","quantity":1,"unit":"tbsp","category":"produce"},
    {"name":"salt","quantity":0.25,"unit":"tsp","category":"pantry"},
    {"name":"black pepper","quantity":0.25,"unit":"tsp","category":"pantry"}
  ]',
  'Drain tuna well. Mix with finely diced celery, red onion, Greek yogurt, mustard, lemon juice, and dill. Season to taste. Halve peppers and remove seeds. Spoon tuna salad generously into each half.',
  '{"calories":280,"protein_g":38,"carbs_g":10,"fat_g":6,"fiber_g":2}'
),

-- ─── DINNERS ───────────────────────────────────────────────────────────────

(
  'Lemon Herb Salmon with Asparagus',
  'dinner',
  'Oven-baked salmon fillets with garlic, lemon, and fresh herbs alongside roasted asparagus and quinoa.',
  10, 20, 2,
  '[
    {"name":"salmon fillets","quantity":340,"unit":"g","category":"proteins"},
    {"name":"asparagus","quantity":250,"unit":"g","category":"produce"},
    {"name":"quinoa","quantity":150,"unit":"g","category":"grains"},
    {"name":"lemon","quantity":1,"unit":"medium","category":"produce"},
    {"name":"garlic cloves","quantity":3,"unit":"cloves","category":"produce"},
    {"name":"olive oil","quantity":2,"unit":"tbsp","category":"pantry"},
    {"name":"fresh parsley","quantity":2,"unit":"tbsp","category":"produce"},
    {"name":"fresh dill","quantity":1,"unit":"tbsp","category":"produce"},
    {"name":"salt","quantity":0.5,"unit":"tsp","category":"pantry"},
    {"name":"black pepper","quantity":0.25,"unit":"tsp","category":"pantry"}
  ]',
  'Preheat oven to 200°C (400°F). Cook quinoa per package instructions. Toss asparagus with olive oil, salt, and pepper on a baking sheet. Nestle salmon on the same sheet. Top salmon with minced garlic, lemon slices, herbs, and a drizzle of olive oil. Bake 15-18 min until salmon flakes easily. Serve over quinoa.',
  '{"calories":560,"protein_g":48,"carbs_g":38,"fat_g":20,"fiber_g":5}'
),

(
  'Ground Turkey Tacos',
  'dinner',
  'Seasoned ground turkey in corn tortillas with shredded cabbage, pico de gallo, lime crema, and cotija cheese.',
  10, 15, 2,
  '[
    {"name":"ground turkey","quantity":400,"unit":"g","category":"proteins"},
    {"name":"corn tortillas","quantity":6,"unit":"small","category":"grains"},
    {"name":"shredded green cabbage","quantity":100,"unit":"g","category":"produce"},
    {"name":"tomato","quantity":2,"unit":"medium","category":"produce"},
    {"name":"white onion","quantity":0.5,"unit":"medium","category":"produce"},
    {"name":"fresh cilantro","quantity":2,"unit":"tbsp","category":"produce"},
    {"name":"lime","quantity":2,"unit":"medium","category":"produce"},
    {"name":"sour cream","quantity":3,"unit":"tbsp","category":"dairy"},
    {"name":"cotija cheese","quantity":30,"unit":"g","category":"dairy"},
    {"name":"cumin","quantity":1,"unit":"tsp","category":"pantry"},
    {"name":"smoked paprika","quantity":0.5,"unit":"tsp","category":"pantry"},
    {"name":"garlic powder","quantity":0.5,"unit":"tsp","category":"pantry"},
    {"name":"olive oil","quantity":1,"unit":"tbsp","category":"pantry"}
  ]',
  'Cook turkey in oil over medium-high heat, breaking it up, 8-10 min until browned. Add cumin, paprika, garlic powder, salt, and a splash of water. Cook 2 more min. Make pico: dice tomato, onion, cilantro, lime juice, salt. Mix lime juice into sour cream for crema. Warm tortillas. Build tacos: turkey, cabbage, pico, crema, cotija.',
  '{"calories":580,"protein_g":42,"carbs_g":42,"fat_g":22,"fiber_g":5}'
),

(
  'Chicken Stir-Fry',
  'dinner',
  'Quick one-pan stir-fry with chicken, broccoli, snap peas, and bell pepper in a savory ginger-soy sauce over jasmine rice.',
  15, 15, 2,
  '[
    {"name":"chicken breast","quantity":350,"unit":"g","category":"proteins"},
    {"name":"jasmine rice","quantity":180,"unit":"g","category":"grains"},
    {"name":"broccoli florets","quantity":200,"unit":"g","category":"produce"},
    {"name":"snap peas","quantity":100,"unit":"g","category":"produce"},
    {"name":"red bell pepper","quantity":1,"unit":"medium","category":"produce"},
    {"name":"garlic cloves","quantity":3,"unit":"cloves","category":"produce"},
    {"name":"fresh ginger","quantity":1,"unit":"tsp","category":"produce"},
    {"name":"soy sauce","quantity":3,"unit":"tbsp","category":"pantry"},
    {"name":"sesame oil","quantity":1,"unit":"tsp","category":"pantry"},
    {"name":"cornstarch","quantity":1,"unit":"tbsp","category":"pantry"},
    {"name":"vegetable oil","quantity":2,"unit":"tbsp","category":"pantry"},
    {"name":"sesame seeds","quantity":1,"unit":"tsp","category":"pantry"}
  ]',
  'Cook rice per package instructions. Slice chicken thin; toss with cornstarch, 1 tbsp soy sauce. Heat oil in wok or large skillet on high. Stir-fry chicken 4-5 min until golden; set aside. Add broccoli and peppers; cook 3 min. Add snap peas, garlic, ginger; cook 1 min. Return chicken. Add remaining soy sauce and sesame oil; toss 1 min. Serve over rice, garnish with sesame seeds.',
  '{"calories":545,"protein_g":46,"carbs_g":52,"fat_g":14,"fiber_g":5}'
),

(
  'Turkey Meatball Pasta',
  'dinner',
  'Lean turkey meatballs simmered in marinara sauce served over whole-wheat spaghetti with parmesan.',
  20, 25, 2,
  '[
    {"name":"ground turkey","quantity":350,"unit":"g","category":"proteins"},
    {"name":"whole-wheat spaghetti","quantity":180,"unit":"g","category":"grains"},
    {"name":"marinara sauce","quantity":400,"unit":"g","category":"pantry"},
    {"name":"egg","quantity":1,"unit":"large","category":"proteins"},
    {"name":"parmesan cheese","quantity":40,"unit":"g","category":"dairy"},
    {"name":"breadcrumbs","quantity":30,"unit":"g","category":"grains"},
    {"name":"garlic cloves","quantity":3,"unit":"cloves","category":"produce"},
    {"name":"fresh basil","quantity":2,"unit":"tbsp","category":"produce"},
    {"name":"dried oregano","quantity":1,"unit":"tsp","category":"pantry"},
    {"name":"olive oil","quantity":1,"unit":"tbsp","category":"pantry"},
    {"name":"salt","quantity":0.5,"unit":"tsp","category":"pantry"},
    {"name":"black pepper","quantity":0.25,"unit":"tsp","category":"pantry"}
  ]',
  'Mix turkey, egg, half the parmesan, breadcrumbs, minced garlic, oregano, salt, and pepper. Roll into 16 meatballs. Heat oil in large skillet; brown meatballs on all sides 5-6 min. Pour marinara over meatballs; simmer 12-15 min until cooked through. Meanwhile cook pasta per package instructions. Serve pasta topped with meatballs and sauce, remaining parmesan, and fresh basil.',
  '{"calories":620,"protein_g":50,"carbs_g":62,"fat_g":18,"fiber_g":8}'
);
