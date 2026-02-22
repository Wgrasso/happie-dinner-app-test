-- 30 Real Recipes for Happie Dinner
-- Run this in Supabase SQL Editor to populate the recipes table.

INSERT INTO public.recipes (name, description, image, cooking_time_minutes, cuisine_type, ingredients, steps) VALUES

-- 1
('Spaghetti Bolognese',
 'Classic Italian meat sauce with rich tomato flavor, slow-simmered with herbs and served over al dente spaghetti.',
 'https://images.unsplash.com/photo-1622973536968-3ead9e780960?w=600',
 45, 'Italian',
 ARRAY['400g spaghetti','500g ground beef','1 onion, diced','3 cloves garlic, minced','400g crushed tomatoes','2 tbsp tomato paste','1 tsp dried oregano','1 tsp dried basil','Salt and pepper','Parmesan cheese'],
 ARRAY['Cook spaghetti according to package directions.','Brown the ground beef in a large pan, drain excess fat.','Sauté onion and garlic until soft.','Add crushed tomatoes, tomato paste, oregano, and basil.','Simmer for 20 minutes, stirring occasionally.','Season with salt and pepper.','Serve sauce over spaghetti, top with Parmesan.']),


-- 2
('Chicken Tikka Masala',
 'Tender chicken pieces in a creamy, spiced tomato sauce. A beloved British-Indian classic.',
 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=600',
 40, 'Indian',
 ARRAY['600g chicken breast, cubed','200ml yogurt','2 tbsp tikka masala paste','1 onion, diced','3 cloves garlic, minced','400g crushed tomatoes','200ml heavy cream','1 tsp cumin','1 tsp paprika','Fresh cilantro','Basmati rice'],
 ARRAY['Marinate chicken in yogurt and tikka paste for 30 minutes.','Grill or pan-fry chicken until charred and cooked through.','Sauté onion and garlic in a large pan.','Add crushed tomatoes, cumin, and paprika. Simmer 10 minutes.','Stir in cream and add the cooked chicken.','Simmer together for 5 minutes.','Garnish with cilantro, serve with basmati rice.']),

-- 3
('Caesar Salad',
 'Crisp romaine lettuce with creamy Caesar dressing, crunchy croutons, and shaved Parmesan.',
 'https://images.unsplash.com/photo-1546793665-c74683f339c1?w=600',
 15, 'American',
 ARRAY['1 large head romaine lettuce','50g Parmesan cheese, shaved','1 cup croutons','2 anchovy fillets','1 clove garlic','1 egg yolk','1 tbsp Dijon mustard','2 tbsp lemon juice','100ml olive oil','Salt and pepper'],
 ARRAY['Wash and chop romaine lettuce into bite-sized pieces.','Mash anchovies and garlic into a paste.','Whisk in egg yolk, Dijon, and lemon juice.','Slowly drizzle in olive oil while whisking to emulsify.','Season dressing with salt and pepper.','Toss lettuce with dressing.','Top with croutons and shaved Parmesan.']),

-- 4
('Pad Thai',
 'Stir-fried rice noodles with shrimp, egg, bean sprouts, and a tangy tamarind sauce.',
 'https://images.unsplash.com/photo-1559314809-0d155014e29e?w=600',
 30, 'Thai',
 ARRAY['200g rice noodles','200g shrimp, peeled','2 eggs','100g bean sprouts','3 green onions, sliced','50g crushed peanuts','2 tbsp tamarind paste','2 tbsp fish sauce','1 tbsp sugar','1 lime','Vegetable oil'],
 ARRAY['Soak rice noodles in warm water for 20 minutes, then drain.','Mix tamarind paste, fish sauce, and sugar for the sauce.','Heat oil in a wok over high heat. Cook shrimp until pink, set aside.','Scramble eggs in the wok.','Add noodles and sauce, toss until coated.','Add shrimp back, along with bean sprouts and green onions.','Serve topped with crushed peanuts and a lime wedge.']),

-- 5
('Mushroom Risotto',
 'Creamy Arborio rice slowly cooked with mixed mushrooms, white wine, and Parmesan.',
 'https://images.unsplash.com/photo-1476124369491-e7addf5db371?w=600',
 40, 'Italian',
 ARRAY['300g Arborio rice','300g mixed mushrooms, sliced','1 onion, finely diced','2 cloves garlic, minced','150ml white wine','1L warm vegetable broth','50g butter','60g Parmesan, grated','2 tbsp olive oil','Fresh thyme'],
 ARRAY['Sauté mushrooms in olive oil until golden, set aside.','In the same pan, cook onion and garlic in butter until soft.','Add Arborio rice, stir for 1 minute.','Pour in white wine, stir until absorbed.','Add broth one ladle at a time, stirring constantly until absorbed before adding more.','After 18-20 minutes, stir in mushrooms and Parmesan.','Season and garnish with fresh thyme.']),

-- 6
('Fish Tacos',
 'Crispy battered white fish in warm tortillas with cabbage slaw and a zesty lime crema.',
 'https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?w=600',
 25, 'Mexican',
 ARRAY['400g white fish fillets','8 small tortillas','2 cups shredded cabbage','100ml sour cream','2 limes','1 avocado','1 tsp cumin','1 tsp paprika','100g flour','Salt and pepper','Vegetable oil'],
 ARRAY['Mix flour, cumin, paprika, salt and pepper. Coat fish pieces.','Fry fish in oil until golden and crispy, about 3 minutes per side.','Mix sour cream with juice of 1 lime for the crema.','Toss cabbage with a squeeze of lime juice.','Warm tortillas in a dry pan.','Assemble: tortilla, cabbage, fish, avocado slices, and crema.','Serve with lime wedges.']),

-- 7
('Greek Salad',
 'Fresh tomatoes, cucumber, red onion, olives, and feta cheese with a simple olive oil dressing.',
 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=600',
 10, 'Greek',
 ARRAY['4 large tomatoes, chopped','1 cucumber, chopped','1 red onion, thinly sliced','200g feta cheese','100g Kalamata olives','3 tbsp extra virgin olive oil','1 tbsp red wine vinegar','1 tsp dried oregano','Salt and pepper'],
 ARRAY['Chop tomatoes and cucumber into chunks.','Thinly slice the red onion.','Combine vegetables in a large bowl.','Add olives and crumble feta on top.','Whisk olive oil, red wine vinegar, and oregano.','Drizzle dressing over the salad.','Season with salt and pepper, serve immediately.']),

-- 8
('Beef Stir Fry',
 'Tender strips of beef with colorful vegetables in a savory soy-ginger sauce.',
 'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=600',
 20, 'Asian',
 ARRAY['400g beef sirloin, thinly sliced','1 red bell pepper, sliced','1 broccoli head, cut into florets','2 carrots, julienned','3 tbsp soy sauce','1 tbsp sesame oil','1 tbsp cornstarch','2 cloves garlic, minced','1 tbsp fresh ginger, grated','Jasmine rice'],
 ARRAY['Toss beef with 1 tbsp soy sauce and cornstarch.','Heat sesame oil in a wok over high heat.','Stir-fry beef for 2 minutes until browned, set aside.','Add garlic and ginger, cook 30 seconds.','Add vegetables, stir-fry for 3-4 minutes until crisp-tender.','Return beef, add remaining soy sauce.','Serve over jasmine rice.']),

-- 9
('Tomato Soup',
 'Velvety smooth tomato soup made from roasted tomatoes, finished with a swirl of cream.',
 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=600',
 35, 'American',
 ARRAY['1kg ripe tomatoes, halved','1 onion, quartered','4 cloves garlic','3 tbsp olive oil','500ml vegetable broth','100ml heavy cream','1 tsp sugar','Fresh basil','Salt and pepper','Crusty bread'],
 ARRAY['Preheat oven to 200°C. Place tomatoes, onion, and garlic on a baking tray.','Drizzle with olive oil, season with salt and pepper.','Roast for 25 minutes until charred.','Transfer everything to a pot, add broth and sugar.','Blend until smooth with an immersion blender.','Stir in cream, heat through.','Serve with fresh basil and crusty bread.']),

-- 10
('Chicken Fajitas',
 'Sizzling spiced chicken with peppers and onions, served with warm tortillas and all the toppings.',
 'https://images.unsplash.com/photo-1613514785940-daed07799d9b?w=600',
 25, 'Mexican',
 ARRAY['500g chicken breast, sliced','2 bell peppers, sliced','1 large onion, sliced','2 tbsp fajita seasoning','2 tbsp olive oil','8 flour tortillas','Sour cream','Guacamole','Salsa','Lime wedges'],
 ARRAY['Toss chicken with fajita seasoning and 1 tbsp olive oil.','Heat remaining oil in a large skillet over high heat.','Cook chicken for 5-6 minutes until done, set aside.','In the same pan, cook peppers and onions for 4 minutes.','Return chicken to the pan, toss together.','Warm tortillas in a dry pan or microwave.','Serve with sour cream, guacamole, salsa, and lime.']),

-- 11
('Carbonara',
 'Authentic Roman pasta with egg, Pecorino Romano, crispy guanciale, and black pepper.',
 'https://images.unsplash.com/photo-1612874742237-6526221588e3?w=600',
 20, 'Italian',
 ARRAY['400g spaghetti','200g guanciale or pancetta, diced','4 egg yolks','80g Pecorino Romano, grated','Freshly ground black pepper','Salt'],
 ARRAY['Cook spaghetti in salted water until al dente. Reserve 1 cup pasta water.','Crisp guanciale in a pan over medium heat until golden.','Whisk egg yolks with Pecorino and plenty of black pepper.','Drain pasta, add to the pan with guanciale (heat OFF).','Quickly toss in the egg mixture, stirring vigorously.','Add pasta water a splash at a time for a creamy sauce.','Serve immediately with extra Pecorino and pepper.']),

-- 12
('Thai Green Curry',
 'Aromatic coconut curry with chicken, Thai basil, bamboo shoots, and green beans.',
 'https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?w=600',
 30, 'Thai',
 ARRAY['500g chicken thigh, sliced','400ml coconut milk','3 tbsp green curry paste','100g green beans, trimmed','100g bamboo shoots','1 tbsp fish sauce','1 tbsp palm sugar','Thai basil leaves','2 kaffir lime leaves','Jasmine rice'],
 ARRAY['Heat a splash of coconut milk in a wok until it splits.','Fry green curry paste for 1 minute until fragrant.','Add chicken, stir-fry for 3 minutes.','Pour in remaining coconut milk, lime leaves, fish sauce, and sugar.','Simmer for 10 minutes.','Add green beans and bamboo shoots, cook 5 more minutes.','Stir in Thai basil, serve with jasmine rice.']),

-- 13
('Beef Burger',
 'Juicy homemade beef patties with melted cheese, lettuce, tomato, and special sauce.',
 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600',
 25, 'American',
 ARRAY['500g ground beef','4 burger buns','4 slices cheddar cheese','Lettuce leaves','1 tomato, sliced','1 red onion, sliced','Pickles','Ketchup','Mustard','Salt and pepper'],
 ARRAY['Divide beef into 4 portions, shape into patties.','Season generously with salt and pepper.','Grill or pan-fry over high heat, 4 minutes per side for medium.','Add cheese in the last minute, cover to melt.','Toast buns on the grill.','Assemble: bun, lettuce, patty, tomato, onion, pickles, sauces.','Serve immediately.']),

-- 14
('Pesto Pasta',
 'Fresh basil pesto tossed with pasta, cherry tomatoes, and toasted pine nuts.',
 'https://images.unsplash.com/photo-1473093295043-cdd812d0e601?w=600',
 20, 'Italian',
 ARRAY['400g penne pasta','50g fresh basil leaves','30g pine nuts','2 cloves garlic','60g Parmesan, grated','100ml extra virgin olive oil','200g cherry tomatoes, halved','Salt and pepper'],
 ARRAY['Toast pine nuts in a dry pan until golden.','Blend basil, pine nuts, garlic, and Parmesan in a food processor.','Stream in olive oil while blending until smooth.','Season pesto with salt and pepper.','Cook pasta al dente, reserve 1/2 cup pasta water.','Toss pasta with pesto, adding pasta water for creaminess.','Top with halved cherry tomatoes and extra Parmesan.']),

-- 15
('Salmon Teriyaki',
 'Glazed salmon fillets with a sweet and savory teriyaki sauce, served with steamed rice.',
 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=600',
 25, 'Japanese',
 ARRAY['4 salmon fillets','4 tbsp soy sauce','2 tbsp mirin','2 tbsp sake or white wine','1 tbsp sugar','1 tbsp vegetable oil','Sesame seeds','Green onions, sliced','Steamed rice','Steamed broccoli'],
 ARRAY['Mix soy sauce, mirin, sake, and sugar for the teriyaki sauce.','Pat salmon dry, season with salt.','Heat oil in a non-stick pan over medium-high heat.','Cook salmon skin-side down for 4 minutes.','Flip, pour teriyaki sauce into the pan.','Cook 3 more minutes, spooning sauce over the fish.','Serve over rice with broccoli, garnish with sesame seeds and green onions.']),

-- 16
('Shakshuka',
 'Eggs poached in a spiced tomato and pepper sauce. Perfect for breakfast or dinner.',
 'https://images.unsplash.com/photo-1590412200988-a436970781fa?w=600',
 25, 'Middle Eastern',
 ARRAY['6 eggs','400g crushed tomatoes','2 red bell peppers, diced','1 onion, diced','3 cloves garlic, minced','1 tsp cumin','1 tsp paprika','1/2 tsp chili flakes','Fresh cilantro','Crusty bread','Olive oil'],
 ARRAY['Heat olive oil in a large skillet. Sauté onion and peppers for 5 minutes.','Add garlic, cumin, paprika, and chili flakes. Cook 1 minute.','Pour in crushed tomatoes, simmer for 10 minutes.','Make 6 wells in the sauce, crack an egg into each.','Cover and cook for 5-7 minutes until whites are set.','Garnish with fresh cilantro.','Serve with crusty bread for dipping.']),

-- 17
('Fried Rice',
 'Quick and satisfying wok-fried rice with vegetables, egg, and soy sauce.',
 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=600',
 15, 'Chinese',
 ARRAY['3 cups cooked rice (day-old is best)','2 eggs, beaten','100g frozen peas','2 carrots, diced small','3 green onions, sliced','3 tbsp soy sauce','1 tbsp sesame oil','2 cloves garlic, minced','Vegetable oil'],
 ARRAY['Heat vegetable oil in a wok over high heat.','Add carrots and peas, stir-fry for 2 minutes.','Push vegetables aside, scramble eggs in the wok.','Add cold rice, break up any clumps.','Pour in soy sauce and sesame oil, toss everything together.','Add garlic and green onions, stir-fry 1 more minute.','Serve immediately.']),

-- 18
('Pulled Pork Sandwich',
 'Slow-cooked tender pulled pork with smoky BBQ sauce on a soft brioche bun.',
 'https://images.unsplash.com/photo-1513185158878-8d8c2a2a3da3?w=600',
 240, 'American',
 ARRAY['1.5kg pork shoulder','250ml BBQ sauce','1 onion, quartered','3 cloves garlic','2 tbsp brown sugar','1 tbsp smoked paprika','1 tsp cumin','250ml apple cider vinegar','Brioche buns','Coleslaw'],
 ARRAY['Rub pork with brown sugar, paprika, cumin, salt, and pepper.','Place pork in slow cooker with onion, garlic, and apple cider vinegar.','Cook on low for 8 hours or high for 4 hours.','Shred pork with two forks, discard fat.','Mix shredded pork with BBQ sauce.','Toast brioche buns.','Pile pork on buns, top with coleslaw.']),

-- 19
('Margherita Pizza',
 'Simple and perfect — fresh mozzarella, San Marzano tomatoes, and basil on a crispy crust.',
 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=600',
 30, 'Italian',
 ARRAY['300g pizza dough','200g San Marzano tomatoes, crushed','200g fresh mozzarella','Fresh basil leaves','2 tbsp olive oil','1 tsp salt','Semolina flour for dusting'],
 ARRAY['Preheat oven to its maximum (ideally 250°C or higher) with a baking sheet inside.','Stretch dough into a round on a floured surface.','Spread crushed tomatoes evenly, leaving a border.','Tear mozzarella into pieces and distribute over the pizza.','Drizzle with olive oil.','Slide onto the hot baking sheet, bake for 8-10 minutes.','Top with fresh basil leaves, slice, and serve.']),

-- 20
('Butter Chicken',
 'Tender chicken in a rich, buttery tomato-cream sauce with warm spices. An Indian favorite.',
 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=600',
 35, 'Indian',
 ARRAY['600g chicken thigh, cubed','200ml yogurt','2 tbsp butter','1 onion, diced','3 cloves garlic, minced','1 tbsp ginger, grated','400g crushed tomatoes','200ml heavy cream','2 tsp garam masala','1 tsp turmeric','1 tsp chili powder','Naan bread','Basmati rice'],
 ARRAY['Marinate chicken in yogurt, garam masala, and turmeric for 30 minutes.','Melt butter in a large pan, cook chicken until browned. Set aside.','Sauté onion, garlic, and ginger until fragrant.','Add crushed tomatoes, chili powder, and remaining garam masala.','Simmer for 15 minutes.','Stir in cream and add chicken back.','Simmer 5 more minutes. Serve with naan and rice.']),

-- 21
('Ramen',
 'Comforting Japanese noodle soup with a rich broth, soft-boiled egg, and tender pork.',
 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=600',
 45, 'Japanese',
 ARRAY['200g ramen noodles','1L chicken broth','2 tbsp soy sauce','1 tbsp miso paste','2 soft-boiled eggs','200g pork belly, sliced','Nori sheets','Green onions, sliced','Bean sprouts','Sesame oil','Chili oil (optional)'],
 ARRAY['Bring broth to a simmer, whisk in soy sauce and miso paste.','Sear pork belly slices in a hot pan until crispy.','Cook ramen noodles according to package, drain.','Boil eggs for 6.5 minutes, ice bath, peel, and halve.','Divide noodles between bowls.','Ladle hot broth over the noodles.','Top with pork, egg halves, nori, green onions, bean sprouts, and a drizzle of sesame oil.']),

-- 22
('Quiche Lorraine',
 'Flaky pastry filled with a savory custard of eggs, cream, bacon, and Gruyère cheese.',
 'https://images.unsplash.com/photo-1608039829572-9b0076e7b812?w=600',
 50, 'French',
 ARRAY['1 pie crust (store-bought or homemade)','200g bacon, diced','150g Gruyère cheese, grated','4 eggs','300ml heavy cream','1 onion, thinly sliced','Nutmeg','Salt and pepper'],
 ARRAY['Preheat oven to 180°C. Blind bake pie crust for 10 minutes.','Cook bacon until crispy. Sauté onion until soft.','Spread bacon and onion over the crust. Sprinkle with Gruyère.','Whisk eggs, cream, nutmeg, salt, and pepper.','Pour custard over the filling.','Bake for 30-35 minutes until golden and set.','Let cool 10 minutes before slicing.']),

-- 23
('Bibimbap',
 'Korean mixed rice bowl with seasoned vegetables, gochujang sauce, and a fried egg on top.',
 'https://images.unsplash.com/photo-1553163147-622ab57be1c7?w=600',
 35, 'Korean',
 ARRAY['2 cups steamed rice','200g beef mince or sliced','1 carrot, julienned','1 zucchini, julienned','100g spinach','100g bean sprouts','2 eggs','3 tbsp gochujang','2 tbsp sesame oil','1 tbsp soy sauce','Sesame seeds'],
 ARRAY['Season and cook beef in a hot pan. Set aside.','Blanch spinach and bean sprouts separately, season with sesame oil.','Sauté carrot and zucchini separately until just tender.','Fry eggs sunny-side up.','Divide rice between bowls.','Arrange vegetables, beef, and egg on top of rice.','Serve with gochujang and sesame seeds. Mix everything together before eating.']),

-- 24
('Lasagna',
 'Layers of pasta, rich meat ragù, creamy béchamel, and melted mozzarella baked to perfection.',
 'https://images.unsplash.com/photo-1574894709920-11b28e7367e3?w=600',
 90, 'Italian',
 ARRAY['12 lasagna sheets','500g ground beef','1 onion, diced','400g crushed tomatoes','2 tbsp tomato paste','50g butter','50g flour','500ml milk','200g mozzarella, shredded','60g Parmesan, grated','Nutmeg','Salt and pepper'],
 ARRAY['Brown beef with onion. Add tomatoes and tomato paste, simmer 20 minutes.','Make béchamel: melt butter, stir in flour, gradually add milk. Cook until thick. Season with nutmeg.','Preheat oven to 180°C.','Layer in a baking dish: meat sauce, pasta sheets, béchamel. Repeat 3 times.','Top with mozzarella and Parmesan.','Cover with foil, bake 30 minutes. Remove foil, bake 15 more.','Rest 10 minutes before serving.']),

-- 25
('Hummus Bowl',
 'Creamy homemade hummus with roasted chickpeas, veggies, feta, and warm pita bread.',
 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=600',
 20, 'Middle Eastern',
 ARRAY['400g canned chickpeas','3 tbsp tahini','2 cloves garlic','3 tbsp lemon juice','3 tbsp olive oil','1 cucumber, diced','200g cherry tomatoes, halved','100g feta cheese','Paprika','Pita bread','Salt'],
 ARRAY['Drain chickpeas, reserve a handful for topping.','Blend chickpeas, tahini, garlic, lemon juice, 2 tbsp olive oil, and salt until smooth.','Roast reserved chickpeas with olive oil and paprika at 200°C for 15 minutes.','Spread hummus in bowls.','Top with cucumber, tomatoes, feta, and roasted chickpeas.','Drizzle with olive oil and sprinkle paprika.','Serve with warm pita bread.']),

-- 26
('Shrimp Scampi',
 'Plump shrimp sautéed in garlic butter and white wine, tossed with linguine and parsley.',
 'https://images.unsplash.com/photo-1563379926898-05f4575a45d8?w=600',
 20, 'Italian',
 ARRAY['400g linguine','500g large shrimp, peeled','4 cloves garlic, minced','60g butter','100ml white wine','2 tbsp lemon juice','Red pepper flakes','Fresh parsley, chopped','Salt and pepper','Olive oil'],
 ARRAY['Cook linguine al dente. Reserve 1 cup pasta water.','Heat butter and olive oil in a large pan.','Add garlic and red pepper flakes, cook 30 seconds.','Add shrimp, cook 2 minutes per side until pink.','Pour in white wine and lemon juice, simmer 2 minutes.','Add pasta, toss with sauce. Add pasta water if needed.','Garnish with fresh parsley and serve.']),

-- 27
('Pancakes',
 'Fluffy American-style pancakes served with maple syrup, butter, and fresh berries.',
 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=600',
 20, 'American',
 ARRAY['200g flour','2 tbsp sugar','2 tsp baking powder','1/4 tsp salt','250ml milk','1 egg','30g melted butter','1 tsp vanilla extract','Maple syrup','Fresh berries','Extra butter for serving'],
 ARRAY['Whisk flour, sugar, baking powder, and salt in a bowl.','In another bowl, whisk milk, egg, melted butter, and vanilla.','Pour wet into dry, stir until just combined (lumps are OK).','Heat a non-stick pan over medium heat, lightly butter it.','Pour 1/4 cup batter per pancake. Cook until bubbles form, flip.','Cook 1-2 more minutes until golden.','Stack and serve with maple syrup, butter, and fresh berries.']),

-- 28
('Gazpacho',
 'Refreshing chilled Spanish tomato soup — perfect for hot summer days.',
 'https://images.unsplash.com/photo-1592401668670-46e8a0b44339?w=600',
 15, 'Spanish',
 ARRAY['1kg ripe tomatoes','1 cucumber, peeled','1 red bell pepper','1 small red onion','2 cloves garlic','3 tbsp olive oil','2 tbsp sherry vinegar','Salt and pepper','Crusty bread','Fresh basil'],
 ARRAY['Roughly chop tomatoes, cucumber, pepper, and onion.','Add all vegetables and garlic to a blender.','Blend until smooth (or leave slightly chunky if preferred).','Add olive oil and sherry vinegar, blend briefly.','Season with salt and pepper.','Chill in the fridge for at least 1 hour.','Serve cold with a drizzle of olive oil, basil, and crusty bread.']),

-- 29
('Chicken Wrap',
 'Grilled chicken with avocado, crispy lettuce, tomato, and ranch dressing in a flour tortilla.',
 'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=600',
 20, 'American',
 ARRAY['2 chicken breasts','4 large flour tortillas','1 avocado, sliced','Lettuce leaves','2 tomatoes, sliced','100ml ranch dressing','1 tsp garlic powder','1 tsp paprika','Salt and pepper','Olive oil'],
 ARRAY['Season chicken with garlic powder, paprika, salt, and pepper.','Grill or pan-fry chicken for 5-6 minutes per side until cooked.','Let chicken rest 5 minutes, then slice.','Warm tortillas in a dry pan.','Layer lettuce, chicken, avocado, and tomato on each tortilla.','Drizzle with ranch dressing.','Fold and roll tightly. Cut in half and serve.']),

-- 30
('Chocolate Lava Cake',
 'Warm, gooey chocolate cake with a molten center. An irresistible dessert for chocolate lovers.',
 'https://images.unsplash.com/photo-1624353365286-3f8d62daad51?w=600',
 25, 'French',
 ARRAY['200g dark chocolate','100g butter','3 eggs','3 egg yolks','80g sugar','30g flour','Butter and cocoa for ramekins','Powdered sugar','Vanilla ice cream'],
 ARRAY['Preheat oven to 220°C. Butter 4 ramekins and dust with cocoa powder.','Melt chocolate and butter together, let cool slightly.','Whisk eggs, egg yolks, and sugar until thick and pale.','Fold chocolate mixture into egg mixture.','Gently fold in flour.','Divide batter among ramekins.','Bake for 12-14 minutes (edges set, center jiggles). Invert onto plates, dust with powdered sugar, serve with ice cream.']);
