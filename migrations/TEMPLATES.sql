-- ============================================
-- TEMPLATE: Nieuwe chef toevoegen
-- ============================================
-- Vul de velden in en draai in Supabase SQL Editor

INSERT INTO chef_profiles (id, name, tag, profile_image, description, links)
VALUES (
  gen_random_uuid(),             -- ID (automatisch)
  'NAAM VAN DE CHEF',            -- Volledige naam
  'username',                    -- Tag zonder @ (wordt getoond als @username)
  'https://example.com/foto.jpg',-- Profielfoto URL
  'Korte bio over de chef',      -- Beschrijving
  '{"instagram": "https://instagram.com/username", "tiktok": "https://tiktok.com/@username"}'
);


-- ============================================
-- TEMPLATE: Nieuw recept toevoegen (met chef)
-- ============================================
-- Stap 1: Zoek het chef_id op (of gebruik NULL als er geen chef is)
-- SELECT id FROM chef_profiles WHERE tag = 'username';
--
-- Stap 2: Vul onderstaande template in en draai in Supabase SQL Editor

-- Het recept
INSERT INTO recipes (id, name, description, image, cooking_time_minutes, cuisine_type, ingredients, steps, chef_id)
VALUES (
  gen_random_uuid(),                       -- ID (automatisch)
  'NAAM VAN HET GERECHT',                 -- Naam
  'Korte grappige beschrijving van het gerecht. Dit is wat gebruikers zien onder de titel.',
  'https://images.unsplash.com/photo-xxx?w=600',  -- Foto URL (gebruik Unsplash of upload naar Supabase storage)
  '30',                                    -- Kooktijd in minuten
  'Italiaans',                             -- Keuken type (Italiaans, Aziatisch, Mexicaans, Nederlands, etc.)
  ARRAY[
    '400g pasta',                          -- Ingredienten als losse strings
    '1 ui, gesnipperd',                    -- Zet het GETAL VOORAAN zodat de portie-scaler werkt
    '2 tenen knoflook, geperst',           -- "Peper en zout" zonder getal wordt niet geschaald
    'Peper en zout'
  ],
  ARRAY[
    'Stap 1: Doe dit eerst.',              -- Bereidingsstappen als losse strings
    'Stap 2: Dan dit.',
    'Stap 3: Serveer en geniet.'
  ],
  NULL                                     -- chef_id: NULL of het UUID van de chef
  -- Om een chef te koppelen, vervang NULL met:
  -- (SELECT id FROM chef_profiles WHERE tag = 'username')
);

-- De extra info (portiegrootte + kosten)
-- Draai dit NA het recept hierboven
INSERT INTO recipe_extras (recipe_id, recipe_name, default_servings, estimated_cost)
VALUES (
  (SELECT id FROM recipes WHERE name = 'NAAM VAN HET GERECHT'),  -- Moet exact matchen met de naam hierboven
  'NAAM VAN HET GERECHT',     -- Zelfde naam als hierboven
  4,                           -- Standaard aantal personen (ruime inschatting)
  7.00                         -- Geschatte totaalkosten in euro's
);


-- ============================================
-- TEMPLATE: Nieuw recept toevoegen (zonder chef)
-- ============================================
-- Korte versie als er geen chef bij hoort

INSERT INTO recipes (id, name, description, image, cooking_time_minutes, cuisine_type, ingredients, steps)
VALUES (
  gen_random_uuid(),
  'NAAM VAN HET GERECHT',
  'Beschrijving van het gerecht.',
  'https://images.unsplash.com/photo-xxx?w=600',
  '25',
  'Nederlands',
  ARRAY[
    '500g aardappelen',
    '1 ui, gesnipperd',
    'Peper en zout'
  ],
  ARRAY[
    'Stap 1.',
    'Stap 2.',
    'Stap 3.'
  ]
);

INSERT INTO recipe_extras (recipe_id, recipe_name, default_servings, estimated_cost)
VALUES (
  (SELECT id FROM recipes WHERE name = 'NAAM VAN HET GERECHT'),
  'NAAM VAN HET GERECHT',
  4,
  5.00
);


-- ============================================
-- TIPS
-- ============================================
-- - Ingredienten: zet het getal VOORAAN ("400g pasta", "2 eieren", "1 tl komijn")
--   Dan werkt de portie-scaler automatisch
-- - Ingredienten zonder getal ("Peper en zout", "Scheut olijfolie") worden niet geschaald
-- - Keuken types die al gebruikt worden:
--   Italiaans, Aziatisch, Mexicaans, Nederlands, Frans, Grieks,
--   Amerikaans, Japans, Turks, Midden-Oosters, Internationaal
-- - Foto's: gebruik Unsplash (gratis) met ?w=600 voor goede kwaliteit
-- - estimated_cost: schat de TOTALE kosten, niet per persoon
-- - default_servings: hoeveel mensen kunnen ervan eten met deze hoeveelheden
