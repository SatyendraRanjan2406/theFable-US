
-- Create a table to store curated stories
CREATE TABLE public.curated_stories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  genre TEXT NOT NULL,
  icon_name TEXT,
  story_content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Insert the Space Adventure story
INSERT INTO public.curated_stories (title, slug, description, genre, icon_name, story_content) VALUES (
  'Space Adventure',
  'space-adventure',
  'Blast off into the cosmos for an intergalactic journey',
  'adventure',
  'rocket',
  '## ✨ {{character_name}}''s Journey Through the Planets

Once upon a time, in a quiet town on Earth, there lived a {{character_age}}-year-old explorer who loved the stars more than anything else. Every night, {{character_name}} would look up at the sky and imagine visiting each planet.

One evening, as {{character_name}} lay on the grass stargazing, a shimmering comet landed gently beside them. Out stepped a silver robot with glowing blue eyes.

"Greetings," it beeped. "I am Nova. The Galaxy Council has chosen you to explore the planets of the solar system. Ready for lift-off?"

{{character_name}} blinked. "Yes, absolutely!"

With a whoosh, they zoomed into the stars aboard a glowing spaceship called **The Star Hopper**.

### 🌑 Mercury – The Rocky Oven

{{character_name}} first landed on **Mercury**, the closest planet to the Sun.

"Whoa, it''s scorching hot here!" they said, hopping onto the gray, rocky surface.

Nova nodded. "No atmosphere to hold heat—or protect from the Sun. Temperatures swing wildly."

Mercury had deep craters and cliffs, and the sky was pitch black, even during the day. {{character_name}} touched a rock—**it was hot enough to cook eggs!**

### 🌕 Venus – The Yellow Storm

Next stop: **Venus**. As soon as the doors opened, thick yellow clouds swirled around them.

"The air''s full of carbon dioxide and sulfuric acid," Nova warned. "Crushing pressure. We''ll stay in the ship."

{{character_name}} watched as lightning flashed across the sky and volcanoes rumbled below. "It''s like a boiling, poisonous thunderstorm planet!"

### 🌍 Earth – The Blue Oasis

Back on Earth briefly, {{character_name}} saw how special their home was. Blue oceans, green forests, white clouds.

"No other planet like it," Nova said softly. "Air to breathe. Water to drink. Life everywhere."

{{character_name}} smiled. "I''ll never take it for granted again."

### 🔴 Mars – The Dusty Red Desert

On **Mars**, the red dust danced in the thin air.

"Gravity''s lower," {{character_name}} said, bouncing a little. "And those are the biggest volcanoes and canyons I''ve ever seen!"

They explored **Olympus Mons**, a volcano taller than three Everests, and gazed into **Valles Marineris**, a canyon so long it could stretch across continents.

Nova added, "Scientists think Mars once had water. Maybe even life."

### 🌪 Jupiter – The Giant with Stormy Eyes

They couldn''t land on **Jupiter**—it''s made of gas! But they flew close to see the **Great Red Spot**, a swirling storm bigger than Earth.

Thunder rolled. Lightning flashed. The clouds were striped in orange, white, and brown.

{{character_name}} gasped. "It''s like a giant painting of storms!"

They visited the moon **Europa**, covered in ice. "Beneath it, there might be an ocean," Nova whispered.

### 💍 Saturn – The Ringed Beauty

Saturn looked magical, surrounded by wide rings made of ice and rock.

"Can I slide on the rings?" {{character_name}} asked.

"Only in your dreams," Nova chuckled.

They zoomed past moons like **Titan**, where thick orange skies and lakes of methane gave it a spooky, alien feel.

### ❄️ Uranus – The Tilted Ice World

{{character_name}} giggled as they reached **Uranus**, which spun on its side like a rolling ball.

"It''s icy and gassy," Nova explained.

It was quiet, cold, and mysterious. The rings were thin and dark, and the cold made the windows frost up.

### 🌊 Neptune – The Windy Blue Giant

Last came **Neptune**, deep blue and full of violent storms. Winds here blew faster than sound.

They hovered above its surface, watching dark spots spin and clouds whip by like smoke in a storm.

"It''s like a frozen hurricane planet!" {{character_name}} shouted.

### 🏠 Return Home

After visiting all eight planets, {{character_name}} and Nova returned to Earth.

"You are the first human to tour the solar system," Nova said. "What will you do now?"

"I''ll tell everyone," {{character_name}} said. "And protect our beautiful planet."

As Nova waved goodbye and vanished with the Star Hopper, {{character_name}} looked up at the sky again, heart full of wonder.'
);

-- Insert the other curated stories as placeholders
INSERT INTO public.curated_stories (title, slug, description, genre, icon_name, story_content) VALUES 
(
  'Know your body',
  'know-your-body',
  'Discover the amazing secrets of how your body works',
  'adventure',
  'heart',
  'An educational adventure through the human body, discovering how different systems work together to keep us healthy and strong.'
),
(
  'Discover ancient wonders',
  'discover-ancient-wonders',
  'Explore mysterious civilizations and lost treasures',
  'adventure',
  'globe',
  'A thrilling journey through ancient civilizations, uncovering lost treasures and learning about the mysteries of the past.'
);

-- Create an index for faster lookups by slug
CREATE INDEX idx_curated_stories_slug ON public.curated_stories(slug);

-- Add Row Level Security (RLS) - make stories publicly readable
ALTER TABLE public.curated_stories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Curated stories are publicly readable" 
  ON public.curated_stories 
  FOR SELECT 
  USING (true);
