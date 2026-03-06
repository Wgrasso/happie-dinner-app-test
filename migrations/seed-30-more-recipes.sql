-- 30 Additional Recipes for Happie Dinner
-- Run this in Supabase SQL Editor to add more variety to the recipes table.

INSERT INTO public.recipes (name, description, image, cooking_time_minutes, cuisine_type, ingredients, steps) VALUES

-- 1
('Beef Stroganoff',
 'Tender beef strips in a rich, creamy mushroom and sour cream sauce served over egg noodles.',
 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600',
 35, 'Russian',
 ARRAY['500g beef sirloin, sliced thin','250g mushrooms, sliced','1 onion, diced','2 cloves garlic, minced','200ml sour cream','150ml beef broth','2 tbsp flour','2 tbsp butter','1 tbsp Dijon mustard','400g egg noodles','Fresh parsley'],
 ARRAY['Cook egg noodles according to package, drain and set aside.','Season beef with salt and pepper. Sear in butter over high heat, 2 minutes. Set aside.','In the same pan, sauté onion and garlic until soft.','Add mushrooms, cook until golden, about 5 minutes.','Sprinkle flour over mushrooms, stir for 1 minute.','Pour in beef broth, simmer until slightly thickened.','Stir in sour cream and mustard. Return beef to the pan.','Simmer gently for 3 minutes (do not boil). Serve over noodles with parsley.']),

-- 2
('Falafel Plate',
 'Crispy, herb-packed chickpea fritters with tahini sauce, fresh salad, and warm pita.',
 'https://images.unsplash.com/photo-1593001874117-c99c800e3eb6?w=600',
 40, 'Middle Eastern',
 ARRAY['400g canned chickpeas, drained','1 onion, roughly chopped','4 cloves garlic','Large bunch fresh parsley','Large bunch fresh cilantro','1 tsp cumin','1 tsp coriander','3 tbsp flour','Salt and pepper','Vegetable oil for frying','Pita bread','Tahini sauce'],
 ARRAY['Pat chickpeas dry with a towel.','Pulse chickpeas, onion, garlic, parsley, and cilantro in a food processor until coarsely ground.','Mix in cumin, coriander, flour, salt and pepper.','Refrigerate mixture for 30 minutes.','Shape into small patties or balls.','Fry in 2cm of oil for 3 minutes per side until golden.','Drain on paper towels.','Serve with pita, tahini, and fresh salad.']),

-- 3
('Chicken Parmesan',
 'Breaded chicken cutlets topped with marinara and melted mozzarella, served with spaghetti.',
 'https://images.unsplash.com/photo-1632778149955-e80f8ceca2e8?w=600',
 40, 'Italian-American',
 ARRAY['4 chicken breasts, pounded thin','100g breadcrumbs','50g Parmesan, grated','2 eggs, beaten','200ml marinara sauce','200g mozzarella, shredded','400g spaghetti','Olive oil','Salt and pepper','Fresh basil'],
 ARRAY['Preheat oven to 200°C.','Mix breadcrumbs with Parmesan, salt and pepper.','Dip chicken in egg, then coat with breadcrumb mixture.','Pan-fry chicken in olive oil for 3 minutes per side until golden.','Transfer to a baking dish. Spoon marinara over each piece.','Top with mozzarella.','Bake for 15 minutes until cheese is bubbly and golden.','Serve over cooked spaghetti with fresh basil.']),

-- 4
('Tom Yum Soup',
 'Spicy and sour Thai soup with shrimp, mushrooms, lemongrass, and fragrant lime leaves.',
 'https://images.unsplash.com/photo-1548943487-a2e4e43b4853?w=600',
 25, 'Thai',
 ARRAY['300g shrimp, peeled','200g mushrooms, halved','3 stalks lemongrass, bruised','5 kaffir lime leaves','3 slices galangal','3 Thai chilies, crushed','1L chicken broth','3 tbsp fish sauce','3 tbsp lime juice','1 tbsp chili paste','Fresh cilantro','Cherry tomatoes'],
 ARRAY['Bring broth to a boil with lemongrass, galangal, and lime leaves.','Simmer for 5 minutes to infuse flavors.','Add mushrooms and tomatoes, cook 3 minutes.','Add shrimp, cook until pink, about 2 minutes.','Stir in fish sauce, lime juice, and chili paste.','Add crushed chilies to taste.','Remove from heat. Discard lemongrass and galangal.','Garnish with cilantro and serve hot.']),

-- 5
('Moussaka',
 'Layered Greek casserole with eggplant, spiced lamb, and creamy béchamel topping.',
 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=600',
 90, 'Greek',
 ARRAY['3 large eggplants, sliced','500g ground lamb','1 onion, diced','3 cloves garlic, minced','400g crushed tomatoes','1 tsp cinnamon','1 tsp allspice','50g butter','50g flour','500ml milk','100g Parmesan, grated','Olive oil','Salt and pepper'],
 ARRAY['Salt eggplant slices, let sit 20 minutes, pat dry.','Brush with olive oil and grill or roast until golden.','Brown lamb with onion and garlic. Drain fat.','Add tomatoes, cinnamon, allspice. Simmer 15 minutes.','Make béchamel: melt butter, stir in flour, gradually whisk in milk. Add half the Parmesan.','Layer in a baking dish: eggplant, meat sauce, eggplant, meat sauce.','Pour béchamel on top, sprinkle with remaining Parmesan.','Bake at 180°C for 40 minutes until golden.']),

-- 6
('Poke Bowl',
 'Fresh Hawaiian-inspired bowl with marinated raw tuna, rice, avocado, and colorful toppings.',
 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600',
 20, 'Hawaiian',
 ARRAY['400g sushi-grade tuna, cubed','2 cups sushi rice, cooked','2 tbsp soy sauce','1 tbsp sesame oil','1 tsp rice vinegar','1 avocado, sliced','1 cucumber, sliced','Edamame','Seaweed salad','Sesame seeds','Pickled ginger','Sriracha mayo'],
 ARRAY['Cook sushi rice and let it cool slightly.','Marinate tuna cubes in soy sauce, sesame oil, and rice vinegar for 10 minutes.','Divide rice between bowls.','Arrange marinated tuna, avocado, cucumber, and edamame on top.','Add seaweed salad and pickled ginger.','Drizzle with sriracha mayo.','Sprinkle with sesame seeds and serve.']),

-- 7
('Shepherd''s Pie',
 'Hearty lamb mince with vegetables topped with creamy mashed potatoes and baked until golden.',
 'https://images.unsplash.com/photo-1600803907087-f56d462fd26b?w=600',
 60, 'British',
 ARRAY['500g ground lamb','1 onion, diced','2 carrots, diced','100g frozen peas','2 cloves garlic, minced','2 tbsp tomato paste','200ml beef broth','1 tbsp Worcestershire sauce','800g potatoes, peeled and cubed','60g butter','100ml milk','Salt and pepper'],
 ARRAY['Boil potatoes until tender, mash with butter and milk. Season.','Brown lamb in a pan, drain excess fat.','Add onion, carrots, and garlic. Cook 5 minutes.','Stir in tomato paste, broth, and Worcestershire sauce.','Simmer for 15 minutes until sauce thickens. Add peas.','Transfer to a baking dish.','Spread mashed potatoes evenly on top, fork the surface.','Bake at 200°C for 25 minutes until golden and bubbling.']),

-- 8
('Ceviche',
 'Citrus-cured fresh white fish with red onion, cilantro, chili, and crispy tortilla chips.',
 'https://images.unsplash.com/photo-1535399831218-d5bd36d1a6b3?w=600',
 25, 'Peruvian',
 ARRAY['500g firm white fish, cubed small','6 limes, juiced','1 red onion, thinly sliced','2 tomatoes, diced','1 jalapeño, minced','Large bunch cilantro, chopped','1 avocado, diced','Salt and pepper','Tortilla chips','Sweet potato (optional)'],
 ARRAY['Place fish cubes in a glass bowl.','Pour lime juice over the fish, ensuring it is fully covered.','Refrigerate for 20 minutes until fish is opaque.','Drain most of the lime juice.','Toss in red onion, tomatoes, jalapeño, and cilantro.','Season with salt and pepper.','Gently fold in avocado.','Serve immediately with tortilla chips.']),

-- 9
('Teriyaki Chicken Bowl',
 'Glossy teriyaki-glazed chicken thighs over fluffy rice with steamed vegetables and pickled ginger.',
 'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=600',
 30, 'Japanese',
 ARRAY['600g chicken thighs, boneless','4 tbsp soy sauce','3 tbsp mirin','2 tbsp sake','1 tbsp sugar','1 tbsp cornstarch mixed with 2 tbsp water','Steamed rice','Steamed broccoli','Sliced carrots','Sesame seeds','Pickled ginger'],
 ARRAY['Mix soy sauce, mirin, sake, and sugar for the teriyaki sauce.','Score chicken thighs lightly on the skin side.','Pan-fry chicken skin-side down for 5 minutes until crispy.','Flip and cook 4 more minutes.','Pour teriyaki sauce into the pan, let it bubble.','Add cornstarch slurry to thicken the glaze.','Slice chicken and arrange over rice with steamed vegetables.','Drizzle with extra sauce, sprinkle sesame seeds.']),

-- 10
('Croque Monsieur',
 'Classic French hot sandwich with ham, Gruyère cheese, and creamy béchamel sauce.',
 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=600',
 20, 'French',
 ARRAY['8 slices white bread','8 slices ham','200g Gruyère cheese, grated','30g butter','30g flour','250ml milk','1 tsp Dijon mustard','Nutmeg','Salt and pepper'],
 ARRAY['Make béchamel: melt butter, stir in flour, gradually add milk. Cook until thick.','Season with mustard, nutmeg, salt and pepper.','Spread béchamel on all bread slices.','Layer ham and half the Gruyère on 4 slices.','Top with remaining bread, béchamel side down.','Spread more béchamel on top of each sandwich.','Sprinkle with remaining Gruyère.','Bake at 200°C for 10 minutes until golden and bubbly.']),

-- 11
('Vietnamese Pho',
 'Fragrant beef noodle soup with a rich star anise broth, fresh herbs, and rice noodles.',
 'https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?w=600',
 45, 'Vietnamese',
 ARRAY['300g beef sirloin, thinly sliced','200g rice noodles','1.5L beef broth','2 star anise','1 cinnamon stick','3 cloves','1 onion, halved and charred','3cm ginger, charred','2 tbsp fish sauce','Bean sprouts','Thai basil','Lime wedges','Hoisin sauce','Sriracha'],
 ARRAY['Char onion and ginger under a broiler until blackened.','Simmer broth with star anise, cinnamon, cloves, charred onion, and ginger for 30 minutes.','Strain broth, discard solids. Season with fish sauce.','Cook rice noodles according to package.','Divide noodles between bowls.','Arrange raw beef slices on top.','Ladle boiling broth over the beef (it will cook instantly).','Serve with bean sprouts, basil, lime, hoisin, and sriracha.']),

-- 12
('Enchiladas Verdes',
 'Rolled tortillas filled with shredded chicken, covered in tangy green salsa and melted cheese.',
 'https://images.unsplash.com/photo-1534352956036-cd81e27dd615?w=600',
 40, 'Mexican',
 ARRAY['8 corn tortillas','400g cooked chicken, shredded','500ml salsa verde','200g Monterey Jack cheese, shredded','200ml sour cream','1 onion, diced','2 cloves garlic, minced','Fresh cilantro','Lime wedges','Olive oil'],
 ARRAY['Preheat oven to 190°C.','Warm tortillas briefly in a dry pan to make them pliable.','Mix shredded chicken with half the cheese and diced onion.','Fill each tortilla with the chicken mixture, roll tightly.','Place seam-side down in a greased baking dish.','Pour salsa verde evenly over the enchiladas.','Top with remaining cheese.','Bake for 20 minutes. Serve with sour cream, cilantro, and lime.']),

-- 13
('Gnocchi with Sage Butter',
 'Pillowy potato gnocchi tossed in golden brown butter with crispy sage leaves and Parmesan.',
 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=600',
 35, 'Italian',
 ARRAY['500g potato gnocchi','80g butter','12 fresh sage leaves','60g Parmesan, grated','2 cloves garlic, lightly crushed','Salt and pepper','Pine nuts (optional)'],
 ARRAY['Cook gnocchi in salted boiling water until they float. Drain, reserving 1/2 cup water.','Melt butter in a large pan over medium heat.','Add sage leaves and garlic, cook until butter turns golden brown and sage is crispy.','Remove garlic cloves.','Add gnocchi to the pan, toss gently in the sage butter.','Add a splash of pasta water if needed for the sauce.','Season with salt and pepper.','Serve with grated Parmesan and pine nuts if desired.']),

-- 14
('Korean Fried Chicken',
 'Ultra-crispy double-fried chicken wings coated in a sweet, spicy gochujang glaze.',
 'https://images.unsplash.com/photo-1575932444877-5106bee2a599?w=600',
 45, 'Korean',
 ARRAY['1kg chicken wings','100g cornstarch','50g flour','1 tsp baking powder','3 tbsp gochujang','2 tbsp soy sauce','2 tbsp honey','1 tbsp rice vinegar','2 cloves garlic, minced','1 tbsp ginger, grated','Sesame seeds','Vegetable oil for frying'],
 ARRAY['Mix cornstarch, flour, baking powder, salt. Coat chicken wings.','Fry in 170°C oil for 10 minutes. Remove and rest 5 minutes.','Fry again at 190°C for 5 minutes until extra crispy.','Mix gochujang, soy sauce, honey, rice vinegar, garlic, and ginger in a pan.','Heat sauce until it bubbles and thickens slightly.','Toss crispy chicken in the glaze.','Sprinkle with sesame seeds.','Serve immediately.']),

-- 15
('Minestrone Soup',
 'Hearty Italian vegetable soup with beans, pasta, and a rich tomato broth.',
 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=600',
 40, 'Italian',
 ARRAY['400g canned cannellini beans','150g small pasta (ditalini)','2 carrots, diced','2 celery stalks, diced','1 zucchini, diced','1 onion, diced','3 cloves garlic, minced','400g crushed tomatoes','1L vegetable broth','2 tbsp olive oil','Fresh basil','Parmesan rind (optional)','Salt and pepper'],
 ARRAY['Heat olive oil in a large pot. Sauté onion, carrots, and celery for 5 minutes.','Add garlic and zucchini, cook 2 more minutes.','Pour in crushed tomatoes and broth. Add Parmesan rind if using.','Bring to a boil, then simmer for 15 minutes.','Add beans and pasta, cook until pasta is tender.','Remove Parmesan rind. Season with salt and pepper.','Ladle into bowls, drizzle with olive oil.','Garnish with fresh basil and grated Parmesan.']),

-- 16
('Banh Mi Sandwich',
 'Crusty Vietnamese baguette with marinated pork, pickled vegetables, and fresh herbs.',
 'https://images.unsplash.com/photo-1600688640154-9619e002df30?w=600',
 35, 'Vietnamese',
 ARRAY['2 baguettes','300g pork loin, thinly sliced','2 tbsp soy sauce','1 tbsp fish sauce','1 tbsp sugar','1 carrot, julienned','1 daikon radish, julienned','100ml rice vinegar','Cucumber, sliced','Fresh cilantro','Jalapeño, sliced','Mayonnaise','Sriracha'],
 ARRAY['Marinate pork in soy sauce, fish sauce, and sugar for 15 minutes.','Quick-pickle carrot and daikon in rice vinegar with a pinch of sugar for 15 minutes.','Grill or pan-fry pork until caramelized.','Slice baguettes lengthwise, toast lightly.','Spread mayonnaise and sriracha inside.','Layer pork, pickled vegetables, cucumber, cilantro, and jalapeño.','Press sandwiches gently together.','Cut in half and serve.']),

-- 17
('Eggplant Parmesan',
 'Layers of breaded eggplant, marinara sauce, and melted mozzarella baked until bubbling.',
 'https://images.unsplash.com/photo-1625944525533-473f1a3d54e7?w=600',
 60, 'Italian',
 ARRAY['2 large eggplants, sliced 1cm thick','200g breadcrumbs','100g Parmesan, grated','2 eggs, beaten','400ml marinara sauce','250g mozzarella, sliced','Fresh basil','Olive oil','Salt and pepper'],
 ARRAY['Salt eggplant slices and let sit 20 minutes. Pat dry.','Dip slices in egg, then in breadcrumbs mixed with half the Parmesan.','Pan-fry in olive oil until golden on both sides. Drain on paper towels.','Preheat oven to 190°C.','Spread thin layer of marinara in a baking dish.','Layer eggplant, marinara, mozzarella. Repeat layers.','Top with remaining Parmesan.','Bake 25 minutes until bubbly. Rest 10 minutes. Garnish with basil.']),

-- 18
('Fish and Chips',
 'Crispy beer-battered cod with thick-cut chips, mushy peas, and tartar sauce.',
 'https://images.unsplash.com/photo-1579208030886-b1f5b8d4e1d8?w=600',
 45, 'British',
 ARRAY['4 cod fillets','200g flour','250ml cold beer','1 tsp baking powder','1kg potatoes, cut into thick chips','Vegetable oil for frying','200g frozen peas','Mint','Butter','Lemon wedges','Tartar sauce','Salt'],
 ARRAY['Soak cut potatoes in cold water for 30 minutes. Drain and dry.','Fry chips at 160°C for 8 minutes. Remove and set aside.','Mix flour, baking powder, and salt. Whisk in cold beer until smooth.','Pat fish dry, dust lightly with flour, then dip in batter.','Fry fish at 180°C for 5-6 minutes until golden.','Re-fry chips at 190°C for 3 minutes until crispy.','Cook peas, mash with butter and mint.','Serve fish and chips with mushy peas, lemon, and tartar sauce.']),

-- 19
('Tacos al Pastor',
 'Mexican street tacos with marinated pork, pineapple, onion, cilantro, and salsa verde.',
 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=600',
 40, 'Mexican',
 ARRAY['600g pork shoulder, thinly sliced','3 dried guajillo chilies','2 chipotle peppers in adobo','3 cloves garlic','100ml pineapple juice','1 tsp cumin','1 tsp oregano','Pineapple rings','Small corn tortillas','White onion, diced','Fresh cilantro','Lime wedges','Salsa verde'],
 ARRAY['Toast guajillo chilies briefly, then soak in hot water for 15 minutes.','Blend soaked chilies, chipotles, garlic, pineapple juice, cumin, and oregano into a smooth paste.','Marinate pork slices in the paste for at least 30 minutes.','Grill or pan-fry pork until charred and cooked through.','Grill pineapple rings until caramelized. Chop into small pieces.','Warm tortillas on a dry griddle.','Fill tortillas with pork and pineapple.','Top with onion, cilantro, and a squeeze of lime. Serve with salsa verde.']),

-- 20
('Spinach and Ricotta Stuffed Shells',
 'Jumbo pasta shells filled with creamy ricotta and spinach, baked in marinara sauce.',
 'https://images.unsplash.com/photo-1621996346565-e3dbc353d2c5?w=600',
 50, 'Italian',
 ARRAY['20 jumbo pasta shells','500g ricotta cheese','200g frozen spinach, thawed and drained','1 egg','100g Parmesan, grated','200g mozzarella, shredded','500ml marinara sauce','2 cloves garlic, minced','Nutmeg','Salt and pepper','Fresh basil'],
 ARRAY['Preheat oven to 190°C. Cook shells until just al dente. Drain.','Squeeze all moisture from spinach.','Mix ricotta, spinach, egg, half the Parmesan, garlic, nutmeg, salt and pepper.','Spread half the marinara in a baking dish.','Fill each shell generously with the ricotta mixture.','Nestle shells in the dish. Pour remaining marinara on top.','Sprinkle with mozzarella and remaining Parmesan.','Bake 25 minutes until bubbly. Garnish with fresh basil.']),

-- 21
('Lamb Kebabs',
 'Grilled marinated lamb skewers with warm spices, served with tzatziki and flatbread.',
 'https://images.unsplash.com/photo-1529006557810-274b9b2fc783?w=600',
 30, 'Turkish',
 ARRAY['600g lamb leg, cubed','1 onion, grated','3 cloves garlic, minced','2 tbsp olive oil','1 tsp cumin','1 tsp paprika','1 tsp coriander','200g yogurt','1 cucumber, grated','2 tbsp lemon juice','Fresh mint','Flatbread','Salt and pepper'],
 ARRAY['Mix lamb with grated onion, garlic, olive oil, cumin, paprika, coriander, salt and pepper.','Marinate for at least 30 minutes.','Thread lamb onto skewers.','Make tzatziki: mix yogurt, grated cucumber, lemon juice, mint, salt.','Grill skewers on high heat, 3-4 minutes per side.','Warm flatbread on the grill.','Serve kebabs on flatbread with tzatziki.','Garnish with extra mint and a squeeze of lemon.']),

-- 22
('Clam Chowder',
 'Creamy New England-style soup with tender clams, potatoes, and smoky bacon.',
 'https://images.unsplash.com/photo-1588566565463-180a5b2090d2?w=600',
 40, 'American',
 ARRAY['500g canned clams with juice','4 slices bacon, diced','1 onion, diced','2 celery stalks, diced','3 potatoes, cubed','3 tbsp flour','500ml milk','250ml heavy cream','2 tbsp butter','Fresh thyme','Oyster crackers','Salt and pepper'],
 ARRAY['Cook bacon in a large pot until crispy. Remove, keep the fat.','Add butter, onion, and celery. Sauté 5 minutes.','Sprinkle flour, stir for 1 minute.','Add potatoes and clam juice. Simmer until potatoes are tender, about 15 minutes.','Pour in milk and cream. Add clams and thyme.','Heat through gently (do not boil).','Stir in crispy bacon. Season with salt and pepper.','Serve with oyster crackers.']),

-- 23
('Chicken Satay',
 'Grilled chicken skewers with a creamy peanut dipping sauce and cucumber relish.',
 'https://images.unsplash.com/photo-1529563021893-cc83c992d75d?w=600',
 35, 'Indonesian',
 ARRAY['600g chicken breast, sliced into strips','3 tbsp soy sauce','1 tbsp curry powder','1 tbsp turmeric','1 tbsp sugar','100g peanut butter','200ml coconut milk','2 tbsp sweet chili sauce','1 tbsp lime juice','Cucumber','Red onion','Rice vinegar','Wooden skewers'],
 ARRAY['Mix soy sauce, curry powder, turmeric, and sugar. Marinate chicken 20 minutes.','Thread chicken onto soaked wooden skewers.','Make peanut sauce: warm peanut butter, coconut milk, sweet chili, and lime juice.','Make relish: dice cucumber and red onion, toss with rice vinegar and sugar.','Grill skewers on high heat, 3 minutes per side.','Warm peanut sauce gently, thin with water if needed.','Serve skewers with peanut sauce and cucumber relish.','Garnish with crushed peanuts and lime.']),

-- 24
('Caprese Salad',
 'Simple Italian salad with ripe tomatoes, fresh mozzarella, basil, and balsamic glaze.',
 'https://images.unsplash.com/photo-1592417817098-8fd3d9eb14a5?w=600',
 10, 'Italian',
 ARRAY['4 large ripe tomatoes','300g fresh mozzarella (buffalo if available)','Large bunch fresh basil','3 tbsp extra virgin olive oil','2 tbsp balsamic glaze','Flaky sea salt','Freshly ground black pepper'],
 ARRAY['Slice tomatoes and mozzarella into even rounds.','Arrange alternating slices of tomato and mozzarella on a platter.','Tuck fresh basil leaves between the slices.','Drizzle generously with olive oil.','Drizzle balsamic glaze over the top.','Season with flaky sea salt and black pepper.','Serve immediately at room temperature.']),

-- 25
('Jambalaya',
 'Spicy Louisiana one-pot dish with chicken, andouille sausage, shrimp, and rice.',
 'https://images.unsplash.com/photo-1534939561126-855b8675edd7?w=600',
 45, 'Cajun',
 ARRAY['300g chicken thigh, cubed','200g andouille sausage, sliced','200g shrimp, peeled','300g long-grain rice','1 onion, diced','1 green bell pepper, diced','2 celery stalks, diced','3 cloves garlic, minced','400g crushed tomatoes','500ml chicken broth','2 tsp Cajun seasoning','2 bay leaves','Green onions'],
 ARRAY['Brown chicken in a large pot. Set aside.','Cook sausage until browned. Set aside.','Sauté onion, pepper, celery, and garlic for 5 minutes.','Add tomatoes, broth, Cajun seasoning, and bay leaves. Bring to a boil.','Stir in rice, chicken, and sausage.','Cover and simmer on low for 20 minutes.','Add shrimp in the last 5 minutes of cooking.','Fluff with a fork, discard bay leaves. Garnish with green onions.']),

-- 26
('Churros',
 'Crispy fried Spanish dough sticks rolled in cinnamon sugar with warm chocolate sauce.',
 'https://images.unsplash.com/photo-1624371414361-e670246e0a04?w=600',
 30, 'Spanish',
 ARRAY['250ml water','100g butter','150g flour','3 eggs','1 tsp vanilla extract','100g sugar','2 tsp cinnamon','200g dark chocolate','150ml heavy cream','Vegetable oil for frying','Pinch of salt'],
 ARRAY['Heat water and butter in a saucepan until boiling.','Remove from heat. Add flour and salt, stir vigorously until a dough forms.','Let cool slightly, then beat in eggs one at a time and vanilla.','Transfer dough to a piping bag with a star tip.','Heat oil to 180°C. Pipe 10cm strips directly into the oil.','Fry for 3-4 minutes until golden, turning once.','Drain on paper towels. Roll in cinnamon sugar.','Make sauce: heat cream, pour over chopped chocolate, stir until smooth. Serve for dipping.']),

-- 27
('Chicken Quesadilla',
 'Crispy tortillas stuffed with seasoned chicken, melted cheese, peppers, and salsa.',
 'https://images.unsplash.com/photo-1618040996337-56904b7850b9?w=600',
 20, 'Mexican',
 ARRAY['4 large flour tortillas','300g cooked chicken, shredded','200g cheddar or Monterey Jack cheese, shredded','1 red bell pepper, diced','1 jalapeño, minced','100g black beans, drained','1 tsp cumin','Sour cream','Guacamole','Salsa','Olive oil'],
 ARRAY['Mix chicken with bell pepper, jalapeño, black beans, and cumin.','Place a tortilla in a dry pan over medium heat.','Sprinkle cheese on half the tortilla.','Add chicken mixture on top of the cheese.','Add more cheese, fold tortilla in half.','Cook 2-3 minutes per side until golden and cheese melts.','Repeat with remaining tortillas.','Cut into wedges. Serve with sour cream, guacamole, and salsa.']),

-- 28
('Ratatouille',
 'Elegant Provençal vegetable dish with layered zucchini, eggplant, tomato, and peppers.',
 'https://images.unsplash.com/photo-1572453800999-e8d2d1589b7c?w=600',
 60, 'French',
 ARRAY['2 zucchini, thinly sliced','1 eggplant, thinly sliced','4 tomatoes, thinly sliced','1 yellow squash, thinly sliced','400ml marinara sauce','1 onion, diced','3 cloves garlic, minced','2 tbsp olive oil','Fresh thyme','Fresh basil','Salt and pepper'],
 ARRAY['Preheat oven to 190°C.','Spread marinara sauce in the bottom of a baking dish. Mix in diced onion and garlic.','Arrange alternating slices of zucchini, eggplant, tomato, and squash in tight rows.','Drizzle with olive oil. Season with salt, pepper, and fresh thyme.','Cover tightly with foil.','Bake for 40 minutes covered.','Remove foil, bake 15 more minutes until vegetables are tender.','Garnish with fresh basil and a drizzle of olive oil.']),

-- 29
('Dumplings (Jiaozi)',
 'Handmade Chinese dumplings with a savory pork and chive filling, pan-fried until crispy.',
 'https://images.unsplash.com/photo-1496116218417-1a781b1c416c?w=600',
 50, 'Chinese',
 ARRAY['300g ground pork','100g Chinese chives or green onions, finely chopped','2 tbsp soy sauce','1 tbsp sesame oil','1 tbsp ginger, grated','1 clove garlic, minced','40 dumpling wrappers','Vegetable oil','Water','Soy sauce for dipping','Rice vinegar','Chili oil'],
 ARRAY['Mix pork, chives, soy sauce, sesame oil, ginger, and garlic.','Place a spoonful of filling in the center of each wrapper.','Moisten edges with water, fold and pleat to seal.','Heat oil in a non-stick pan over medium-high heat.','Place dumplings flat-side down, cook 2 minutes until bottoms are golden.','Add 100ml water, cover immediately. Steam for 6 minutes.','Remove lid, let remaining water evaporate until bottoms crisp again.','Serve with soy sauce, rice vinegar, and chili oil.']),

-- 30
('Banana Bread',
 'Moist, tender banana bread with a golden crust — perfect for using up ripe bananas.',
 'https://images.unsplash.com/photo-1605090930601-81e6b1f3d1c9?w=600',
 60, 'American',
 ARRAY['3 ripe bananas, mashed','100g butter, melted','150g sugar','1 egg','1 tsp vanilla extract','250g flour','1 tsp baking soda','1/2 tsp salt','1 tsp cinnamon','Walnuts (optional)','Chocolate chips (optional)'],
 ARRAY['Preheat oven to 175°C. Grease a loaf pan.','Mash bananas in a large bowl.','Stir in melted butter, sugar, egg, and vanilla.','Mix flour, baking soda, salt, and cinnamon. Fold into banana mixture.','Fold in walnuts or chocolate chips if using.','Pour batter into the prepared pan.','Bake for 55-60 minutes until a toothpick comes out clean.','Cool in pan for 10 minutes, then turn out onto a wire rack.']);
