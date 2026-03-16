-- New table: recipe_extras
-- Separate from recipes table to avoid breaking the live app
-- Links to recipes by recipe name (not FK, to be safe)

CREATE TABLE IF NOT EXISTS recipe_extras (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  recipe_id UUID REFERENCES recipes(id) ON DELETE CASCADE,
  recipe_name TEXT NOT NULL,
  default_servings INTEGER NOT NULL DEFAULT 4,
  estimated_cost NUMERIC(5,2),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create unique index on recipe_id to prevent duplicates
CREATE UNIQUE INDEX IF NOT EXISTS idx_recipe_extras_recipe_id ON recipe_extras(recipe_id);

-- Enable RLS
ALTER TABLE recipe_extras ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to read
CREATE POLICY "Anyone can read recipe_extras"
  ON recipe_extras FOR SELECT
  TO authenticated
  USING (true);

-- Insert data for all recipes
-- Format: (recipe_id, recipe_name, default_servings, estimated_cost)

INSERT INTO recipe_extras (recipe_id, recipe_name, default_servings, estimated_cost) VALUES
  ('17a97e46-d235-4c1b-b00b-2738e52e0098', 'Huisgenoten indrukken shakshuka', 3, 5.00),
  ('3320a08e-267d-43c7-aab8-95a864e2c472', 'Meal prep zondag wraps', 6, 10.00),
  ('3eb28f2a-a038-48fb-9fed-cd40ab60d451', '3 euro budget linzensoep', 4, 3.00),
  ('3ec78beb-a90c-4642-87d3-3432e0c43951', 'Magnetron kapot ovenpasta', 4, 6.00),
  ('3f2bda34-50a6-4842-9487-eab539a3013b', 'bami goreng', 3, 5.00),
  ('42d7155f-36cf-4474-8df2-15fe1cd02e55', 'Spaghetti carbonara', 4, 6.00),
  ('4495cae7-19e6-4f43-803f-84a2cc86f98c', 'Groente moet ook maar eens salade', 4, 5.00),
  ('493a2e4f-b5a1-4071-95be-365bccab6ee9', 'Studiefinanciering is op pasta pesto', 4, 5.00),
  ('4e2ee090-34d9-4026-95c6-bd8ab8217e62', 'Netflix & grill pizza', 2, 5.00),
  ('5012c168-48dc-47ea-92d1-d3259401786c', 'Koelkast schoonmaak omelet', 2, 3.00),
  ('54ec53df-9fd9-4e75-8a6f-7c5d1a96466c', 'Zomerse koude pastasalade', 4, 6.00),
  ('5c2f9c4c-e155-40c4-800b-f6ff09e11a89', 'Te lui om te koken quesadilla''s', 2, 4.00),
  ('624864c6-2851-4cae-afb9-105b11c1dff0', 'Studentenhuis mac & cheese', 4, 5.00),
  ('6617b0c0-da18-459a-8228-6138886359cb', 'Geen zin in afwassen wokschotel', 3, 6.00),
  ('7f3b18de-d50d-49d8-bfd5-5adfbf5e3d24', 'Salaris net binnen biefstuk', 2, 12.00),
  ('7fd2b4b9-fe74-460d-a9a2-cd0a8461d6c7', 'gewoon tomatensoep', 4, 4.00),
  ('a0407061-f6da-4e14-9a36-06af9869e1df', 'Arancini met bloedsinaasappel salade en zoete aardappel puree', 5, 18.00),
  ('a57def8a-c11f-46dd-91cb-587f54feb324', 'Einde van de maand stamppot', 4, 5.00),
  ('bc8f98ef-6a27-4da8-9ad1-7155e9d06f03', 'Introweek chili con carne', 4, 7.00),
  ('bedf4c3d-0e5c-4ff7-aba6-6140e244bfa0', 'Nasi goreng', 3, 4.00),
  ('c5ed0567-7f01-40bc-a8b9-e7f666b9740f', 'Eerste date risotto', 3, 7.00),
  ('df9c78e5-deed-478c-8a34-a815383773a4', 'Niks meer in de ijskast spaghetti', 4, 3.00),
  ('e01adb03-a41b-4fae-8158-f28d8ae550e6', 'Collegevrije dag ramen', 2, 5.00),
  ('e26ad82c-a1ef-439b-87fa-8780290604c7', 'Tacos met zalm en ananas salsa', 4, 14.00),
  ('ed51510a-7a91-4305-a64d-220d1fedbe95', 'Vrijdagavond kebab bowl', 3, 6.00),
  ('f59e7f8c-6e69-47c8-bd15-3e2d24225c65', 'Romige pistachepesto pasta met burrata en pancetta', 4, 12.00)
ON CONFLICT (recipe_id) DO NOTHING;
