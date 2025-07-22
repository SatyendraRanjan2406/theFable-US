
import { generateStoryWithOpenAI } from './openaiStoryGenerator';

export const generateStoryContent = async (
  storyOutline: string, 
  pages: number, 
  characterName: string, 
  genre: string, 
  bookType: string = 'comic',
  message?: string,
  characterAge?: string,
  characterGender?: string,
  openaiApiKey?: string
) => {
  //console.log(`Generating ${bookType} story with ${pages} pages for ${characterName} in ${genre} genre`);
  
  // Use OpenAI if API key is provided
  if (openaiApiKey && characterAge && characterGender) {
    try {
      //console.log('Using OpenAI for story generation');
      const result = await generateStoryWithOpenAI({
        characterName,
        characterAge,
        characterGender,
        genre,
        storyOutline,
        message,
        pages
      }, openaiApiKey);
      return result.story; // Extract story from the object
    } catch (error) {
      console.error('OpenAI generation failed, falling back to default:', error);
      // Fall back to default generation
    }
  }
  
  // Default generation logic
  if (bookType === 'comic') {
    return generateComicBookStory(characterName, genre, pages, storyOutline, message);
  } else {
    return generateIllustrativeStory(characterName, genre, pages, storyOutline, message);
  }
};

const generateIllustrativeStory = (
  characterName: string, 
  genre: string, 
  pages: number, 
  storyOutline?: string, 
  message?: string
) => {
  const scenes = storyOutline 
    ? generateCustomScenes(characterName, genre, storyOutline, message)
    : getGenreScenes(characterName, genre);
  
  let storyPages = [];
  
  for (let page = 1; page <= pages; page++) {
    const sceneIndex = Math.min(page - 1, scenes.length - 1);
    const scene = scenes[sceneIndex];
    
    if (page <= scenes.length) {
      storyPages.push(`**Page ${page}**\n\n${scene}`);
    } else {
      const additionalScene = generateAdditionalScene(characterName, genre, page);
      storyPages.push(`**Page ${page}**\n\n${additionalScene}`);
    }
  }
  
  return storyPages.join('\n\n---\n\n');
};

const generateComicBookStory = (
  characterName: string, 
  genre: string, 
  pages: number, 
  storyOutline?: string, 
  message?: string
) => {
  const comicScenes = storyOutline 
    ? generateCustomComicScenes(characterName, genre, storyOutline, message)
    : getGenreComicScenes(characterName, genre);
  
  let storyPages = [];
  
  for (let page = 1; page <= pages; page++) {
    let pagePanels = [];
    const panelsPerPage = 2; // Changed to 2 panels per page
    
    for (let panel = 1; panel <= panelsPerPage; panel++) {
      const sceneIndex = Math.min(((page - 1) * panelsPerPage + panel - 1), comicScenes.length - 1);
      const scene = comicScenes[sceneIndex] || generateAdditionalComicPanel(characterName, genre, page, panel);
      
      pagePanels.push(`**Panel ${panel}:** ${scene}`);
    }
    
    storyPages.push(`**Page ${page}**\n\n${pagePanels.join('\n\n')}`);
  }
  
  return storyPages.join('\n\n---\n\n');
};

const generateCustomScenes = (
  characterName: string, 
  genre: string, 
  outline: string, 
  message?: string
) => {
  // Parse the outline into key plot points
  const plotPoints = outline.split(/[.,;!?]/).filter(point => point.trim().length > 10);
  
  const baseGenreStyle = getGenreStyle(genre);
  const messageText = message ? ` The story should incorporate this important lesson: ${message}` : '';
  
  return plotPoints.map((point, index) => {
    const trimmedPoint = point.trim();
    return `In this exciting chapter, ${characterName} ${trimmedPoint.toLowerCase()}. ${baseGenreStyle} The adventure unfolds with vivid details as ${characterName} faces new challenges and discovers inner strength.${messageText}`;
  });
};

const generateCustomComicScenes = (
  characterName: string, 
  genre: string, 
  outline: string, 
  message?: string
) => {
  const plotPoints = outline.split(/[.,;!?]/).filter(point => point.trim().length > 5);
  const baseGenreStyle = getGenreStyle(genre);
  const messageText = message ? ` Remember this important lesson: ${message}` : '';
  
  let comicPanels = [];
  
  plotPoints.forEach((point, index) => {
    const trimmedPoint = point.trim();
    // Generate detailed panels for each plot point
    comicPanels.push(
      `*${characterName} stands with determination, eyes bright with courage* ${characterName}: "Today feels different - like something amazing is about to happen!" *The scene shows ${characterName} in their familiar surroundings, but there's an air of anticipation*`,
      `*Detailed scene showing ${trimmedPoint.toLowerCase()} with rich background details* Narrator: "${baseGenreStyle} ${characterName} discovers that this moment will change everything." *The environment around ${characterName} reflects the ${genre} atmosphere with vivid colors and engaging details*`,
      `*Close-up of ${characterName}'s face showing mixed emotions of excitement and nervousness* ${characterName}: "I know I can handle whatever comes my way!" *Background shows the setting that matches the story's mood and genre*`,
      `*Dynamic action scene related to ${trimmedPoint.toLowerCase()} with detailed environment and characters* Sound effects fill the air as ${characterName} takes decisive action. *The scene captures the essence of ${genre} storytelling with rich visual details*`,
      `*${characterName} triumphantly overcoming the challenge, surrounded by supporting details that enhance the story* ${characterName}: "I did it! I really did it!" *The victory scene shows personal growth and achievement*`,
      `*${characterName} walking forward with newfound confidence, the scene showing progression and hope* ${characterName} thinks to themselves: "Every challenge makes me stronger.${messageText}" *The background suggests new adventures ahead*`
    );
  });
  
  return comicPanels;
};

const getGenreStyle = (genre: string) => {
  const styles = {
    adventure: "The excitement builds as our brave hero faces thrilling challenges in this epic adventure. Every step forward reveals new wonders and tests of courage.",
    fairytale: "Magic sparkles in the air as this enchanting tale unfolds with wonder, mystery, and heartwarming discoveries that touch the soul.",
    romance: "Warm feelings of friendship and kindness fill the story as hearts connect and beautiful relationships bloom like flowers in spring.",
    humour: "Laughter echoes through every scene as delightfully silly situations create joyful moments that bring smiles to everyone involved."
  };
  
  return styles[genre as keyof typeof styles] || styles.adventure;
};

const getGenreScenes = (characterName: string, genre: string) => {
  const scenes = {
    adventure: [
      `${characterName} awakens to golden sunlight streaming through their bedroom window, casting magical patterns on the wall. As they stretch and yawn, something extraordinary catches their eye - an ancient, weathered piece of parchment peeking out from beneath their bed. With trembling hands, ${characterName} carefully unfolds what appears to be a genuine treasure map! The yellowed paper crackles softly as it reveals intricate drawings of winding forest paths, mysterious symbols, and a bold red X marking an unknown destination. ${characterName}'s heart pounds with excitement as they trace the elaborate route with their finger, imagining the incredible adventures that await in the Enchanted Forest beyond their neighborhood.`,
      
      `Without hesitation, ${characterName} springs into action, their mind racing with preparations for the journey ahead. They carefully pack their trusty backpack with essential supplies: a gleaming water bottle, nutritious crackers, a reliable flashlight, and their grandmother's lucky charm that has protected their family for generations. The crisp morning air fills their lungs as they step outside, the mysterious map clutched securely in their hands. The path to the Enchanted Forest begins just beyond their familiar neighborhood, marked by two magnificent oak trees whose ancient branches seem to form a natural archway. As ${characterName} approaches this mystical entrance, the trees whisper ancient secrets in the gentle breeze, and a wise old owl with piercing golden eyes perches majestically above, watching their approach with knowing intelligence.`,
      
      `The enchanted forest path leads ${characterName} deeper into a realm where magic feels as real as the earth beneath their feet. Towering trees stretch toward the heavens, their emerald leaves shimmering with an otherworldly glow in the dappled sunlight. Colorful butterflies dance through the air like living rainbows, leaving trails of sparkling fairy dust that twinkles and fades. The ancient map guides ${characterName} to a crystal-clear river that sings melodious songs as it flows over smooth stones. With no bridge in sight, ${characterName} notices several fallen logs scattered nearby. Using clever thinking and determination, they carefully arrange the logs into a sturdy makeshift bridge. Step by cautious step, arms outstretched for perfect balance, ${characterName} crosses the singing river safely. On the far shore, they discover the entrance to a mysterious cave adorned with glowing crystals that pulse with inner light, marking the beginning of their greatest adventure yet.`
    ],
    
    fairytale: [
      `In the magnificent Kingdom of Chromia, where roses sang lullabies in harmonious choir and butterflies painted magnificent rainbows across the azure sky, lived a kind-hearted child named ${characterName}. Their charming cottage nestled at the kingdom's edge, surrounded by enchanted gardens where every flower possessed a unique voice and personality. ${characterName} spent blissful days listening to the melodious concerts performed by singing roses and watching the giggling daisies dance in the warm morning breeze. But one devastating morning, darkness fell upon their magical world. Greybeard, a bitter old wizard consumed by jealousy of the kingdom's beauty and joy, cast a terrible spell. Slowly but relentlessly, all the magnificent colors began draining away like water flowing down an endless drain, leaving behind a world of grey emptiness and silence.`,
      
      `As the final traces of color vanished from the once-vibrant kingdom, ${characterName} felt profound sadness settling in their heart like a heavy stone. The previously joyful kingdom now resembled a faded black and white photograph, devoid of life and happiness. Citizens wandered aimlessly with drooping shoulders and expressions of deep despair. But ${characterName} possessed something that couldn't be stolen - an unshakeable hope burning bright within their soul. They remembered their wise grandmother's stories about the legendary Crystal of Colors, a magical gem containing all the world's colors within its radiant heart. According to ancient legend, only someone with a pure heart and genuine kindness could find this precious treasure. With unwavering determination, ${characterName} made a courageous decision to embark on a perilous quest to locate the Crystal of Colors and restore joy to their beloved kingdom.`,
      
      `The treacherous journey led ${characterName} through the mysterious Whispering Woods, where even the mighty trees had lost their vibrant green but still rustled with ancient wisdom and hidden secrets. Along the winding path, they encountered various creatures suffering from the wizard's cruel spell - a melancholy rabbit whose soft fur had turned grey, a family of squirrels desperately searching for their colorful acorns, and a lonely fox mourning the loss of his beautiful red coat. Instead of hurrying past these suffering souls, ${characterName} stopped to offer comfort and assistance. They generously shared their meager bread with the hungry rabbit, patiently helped the worried squirrels search through fallen leaves for hidden acorns, and spent precious time consoling the heartbroken fox with gentle words and warm embraces. With each selfless act of kindness, something magical occurred - tiny sparks of brilliant color flickered briefly around ${characterName} like stars twinkling in the grey twilight.`
    ],
    
    romance: [
      `${characterName} had earned a wonderful reputation throughout their neighborhood as the friendliest, most welcoming child anyone had ever encountered. With a radiant smile perpetually brightening their face and kind words ready for every person they met, ${characterName} possessed a remarkable gift for making others feel valued, accepted, and loved. On this particular sun-drenched Saturday morning, ${characterName} decided to visit the local park with their treasured storybook tucked securely under their arm. The park bustled with joyful activity - families playing elaborate games, dogs running freely across the green grass, and children's laughter echoing from the colorful playground equipment. However, as ${characterName} strolled along the winding path enjoying the beautiful scenery, they noticed a solitary figure sitting alone on a weathered bench near the peaceful duck pond. Another child, appearing to be about their same age, sat watching the graceful ducks swim by with a deeply wistful expression, occasionally releasing heavy sighs that spoke of loneliness and sadness.`,
      
      `With characteristic courage and genuine compassion, ${characterName} approached the lonely bench slowly and carefully, not wanting to startle the melancholy child or make them feel uncomfortable. "Hello there," ${characterName} said with their most welcoming smile, radiating warmth and friendliness, "I'm ${characterName}. I couldn't help but notice you sitting here by yourself, and I was wondering if you might like some company?" The child looked up with obvious surprise, then managed to return a small but genuine smile. "I'm Alex," they replied softly, their voice carrying traces of sadness. "I just moved to this neighborhood last week with my family, and I don't know anyone yet. I was hoping to make new friends at the park, but everyone already seems to have their own established groups and friendships." ${characterName}'s kind heart immediately went out to Alex, feeling deep empathy for their situation.`,
      
      `As ${characterName} and Alex settled comfortably together on the sun-warmed bench, sharing the colorful pages of ${characterName}'s favorite storybook and laughing heartily at the amusing illustrations, something beautiful and magical began to unfold between them. They discovered numerous shared interests and preferences - both loved adventure stories featuring brave heroes, tales of magical creatures and far-off lands, and humorous stories that made them giggle until their sides ached with laughter. They learned they both enjoyed collecting smooth, shiny rocks from beaches and riverbanks, both considered chocolate ice cream the ultimate treat, and both had beloved pet cats who behaved more like loyal dogs than typical felines. The afternoon flew by like a dream as they talked animatedly, shared personal stories about their families and dreams, fed grateful breadcrumbs to the appreciative ducks, and discovered the joy of true friendship. Other children in the park began noticing their infectious laughter and gradually approached to join their impromptu gathering, creating a wonderful circle of new friendships.`
    ],
    
    humour: [
      `Meet ${characterName}, officially recognized as the most wonderfully silly and delightfully creative child in their entire neighborhood! While other children might spend their mornings following ordinary routines like eating cereal and watching cartoons, ${characterName} always had much more imaginative and entertaining ideas about how to begin each day. This particular bright morning, ${characterName} awakened with what they considered the most brilliant and revolutionary idea ever conceived: it was finally time to teach Mr. Bubbles, their beloved pet goldfish, the fine art of synchronized dancing! "This is going to be absolutely amazing and possibly make us both famous!" ${characterName} announced enthusiastically to their empty bedroom, bouncing out of bed with more explosive energy than a kangaroo on a trampoline. After carefully selecting and putting on their most colorful and eye-catching outfit (polka dot pants paired with a striped shirt, because normal fashion rules clearly don't apply when you're about to make entertainment history), ${characterName} marched determinedly downstairs to the sunny living room.`,
      
      `"Okay, Mr. Bubbles," ${characterName} announced with utmost seriousness and professional authority, turning on their most upbeat and energetic music, "today you're going to master the sophisticated and elegant art of aquatic dancing!" ${characterName} began demonstrating the most ridiculously entertaining dance moves imaginable - wiggling enthusiastically like an energetic earthworm, flapping their arms with great enthusiasm like an excited chicken, and spinning around rapidly like a colorful tornado. To everyone's absolute amazement and surprise (especially Mr. Bubbles'), the little golden fish actually began swimming in perfect circles and performing what looked remarkably like underwater choreography! The infectious music and uncontrollable laughter soon attracted the attention of the entire household. Mom appeared downstairs rubbing her sleepy eyes in confusion, Dad emerged from his home office looking thoroughly puzzled, and even Grandma shuffled into the room wearing her favorite fuzzy slippers and expressing bewilderment at the joyful commotion.`,
      
      `Feeling tremendously proud of their remarkable success as an innovative dance instructor and wanting to continue their helpful streak, ${characterName} confidently decided to surprise their entire family by preparing what they were certain would be the most delicious and memorable breakfast ever created. "I'll amaze everyone with my incredible culinary skills!" they declared with supreme confidence, marching into the kitchen with the determination of a professional chef. However, ${characterName}'s actual cooking abilities were approximately as developed and refined as their fish-training talents. They confidently cracked fresh eggs into the hot pan (accidentally including several pieces of crunchy shell for what they considered "extra texture and nutrition"), generously sprinkled what they firmly believed was sugar on top of everything (but was actually salt from a very similar-looking container), and carefully poured refreshing orange juice into everyone's favorite cups (accidentally adding more salt instead of sugar to the beverages as well). When the unsuspecting family gathered around the table for their "special" breakfast, the first sip and bite resulted in the most hilariously shocked and unforgettable facial expressions ever witnessed in breakfast history.`
    ]
  };
  
  return scenes[genre as keyof typeof scenes] || scenes.adventure;
};

const getGenreComicScenes = (characterName: string, genre: string) => {
  const comicScenes = {
    adventure: [
      `*Detailed panel showing ${characterName}'s cozy bedroom with golden sunlight streaming through curtains, creating warm patterns on the wooden floor* ${characterName} stretches and yawns: "What a beautiful morning! But wait... what's that mysterious paper under my bed?"`,
      `*Close-up dramatic shot of ${characterName} carefully unfolding an ancient, weathered treasure map with intricate drawings and mysterious symbols* ${characterName} gasps in excitement: "A real treasure map! This is absolutely incredible and life-changing!"`,
      `*Wide panel showing ${characterName} energetically packing a sturdy backpack with essential supplies, items scattered on the bed* ${characterName} thinks determinedly: "Adventure calls to me, and I must answer! Time to prepare for the journey of a lifetime!"`,
      `*Majestic panel depicting ${characterName} approaching the forest entrance marked by two towering oak trees forming a natural archway, morning mist swirling mysteriously* Narrator: "The Enchanted Forest beckons with ancient secrets and untold mysteries..."`,
      `*Wise old owl with piercing golden eyes perched majestically on a gnarled branch, speaking to ${characterName} below* Owl speaks wisely: "Young adventurer, the treacherous path ahead will test your courage, but the greatest treasures are found within your heart!"`,
      `*Determined shot of ${characterName} gripping the map tightly, eyes blazing with courage and excitement* ${characterName} declares boldly: "I'm ready for anything this adventure brings! Let the journey begin!"`,
      `*Enchanting forest scene with towering trees, magical creatures, and sparkling butterflies creating rainbow trails* ${characterName} marvels in wonder: "This mystical place is more amazing than I ever imagined possible!"`,
      `*Dynamic panel showing ${characterName} facing a rushing river with crystalline water singing melodious tunes* ${characterName} puzzles thoughtfully: "How am I going to cross this magical singing river safely?"`,
      `*Creative problem-solving scene of ${characterName} cleverly arranging fallen logs into a makeshift bridge with careful precision* ${characterName} thinks confidently: "I can figure this out with determination and clever thinking!"`,
      `*Suspenseful panel of ${characterName} carefully balancing while crossing the log bridge, arms outstretched, water sparkling below* ${characterName} encourages themselves: "Almost there... steady steps and careful balance!"`,
      `*Magnificent discovery shot of ${characterName} finding a mysterious cave entrance adorned with glowing crystals that pulse with inner light* ${characterName} exclaims in awe: "The map was absolutely right! The greatest treasure must be hidden inside this magical cave!"`,
      `*Triumphant final panel showing ${characterName} emerging from the cave with newfound confidence, a golden glow surrounding them* ${characterName} declares with wisdom: "I found the real treasure - believing in myself and my abilities!"`
    ],
    
    fairytale: [
      `*Sweeping panoramic view of the magnificent Kingdom of Chromia with singing roses, rainbow butterflies, and colorful magical atmosphere* Narrator: "In the enchanted Kingdom of Chromia, where magic fills every corner and wonder never ends..."`,
      `*Peaceful scene of ${characterName} in their cottage garden, surrounded by singing roses and giggling daisies, pure joy on their face* ${characterName} smiles contentedly: "I absolutely love living in such a magical and wonderful place where every day brings new surprises!"`,
      `*Dark, ominous panel showing the evil wizard Greybeard casting his terrible spell with swirling grey magic emanating from his staff* Greybeard snarls wickedly: "Let all joy, color, and happiness disappear forever from this kingdom!"`,
      `*Heartbreaking scene showing vibrant colors draining from flowers, sky, and everything beautiful, leaving grey emptiness behind* ${characterName} cries out in horror: "No! What's happening to our beautiful, magical kingdom?"`,
      `*Determined shot of ${characterName} looking at the grey, lifeless kingdom with unwavering resolve in their eyes* ${characterName} declares with determination: "I must find the legendary Crystal of Colors and save our beloved kingdom!"`,
      `*Touching scene of ${characterName} packing their bag with their grandmother's precious lucky necklace glinting in the dim light* ${characterName} whispers hopefully: "Grandma's ancient stories and wisdom will guide me on this perilous journey!"`,
      `*Compassionate panel showing ${characterName} sharing bread with a sad grey rabbit in the desolate Whispering Woods* ${characterName} says kindly: "Here, take some of my food. We'll get through this difficult time together, I promise!"`,
      `*Magical moment as tiny sparks of brilliant color appear around ${characterName} after their act of kindness* The grateful rabbit speaks: "Your incredible kindness and pure heart bring hope to our darkened world!"`,
      `*Beautiful scene of ${characterName} comforting other grey woodland animals with gentle hugs and encouraging words* ${characterName} promises warmly: "We'll overcome this curse together through love, kindness, and unwavering hope!"`,
      `*More vibrant color sparks growing brighter and more numerous around ${characterName}'s pure heart* The wise fox observes: "Your heart is pure and true, young one, and that gives us all hope!"`,
      `*Climactic discovery of ${characterName} finding the magnificent Crystal of Colors glowing with every imaginable hue and color* ${characterName} gasps in wonder: "The legendary Crystal of Colors! It's more beautiful than I ever dreamed possible!"`,
      `*Triumphant finale showing the kingdom restored to full vibrant color with ${characterName} celebrated as the hero* Everyone cheers joyfully: "Thank you for saving our kingdom and bringing back all the magic and wonder!"`
    ],
    
    romance: [
      `*Cheerful scene of ${characterName} walking through the sun-drenched park with their favorite book tucked under their arm* ${characterName} thinks happily: "What a perfect day for reading and making new friends in this beautiful park!"`,
      `*Observant panel showing ${characterName} noticing lonely Alex sitting alone on a bench near the peaceful duck pond* ${characterName} thinks compassionately: "That child looks sad and lonely. I should go offer friendship and kindness!"`,
      `*Warm interaction scene of ${characterName} approaching Alex with a genuine, welcoming smile* ${characterName} says friendlily: "Hi there! I'm ${characterName}. Would you like some company on this beautiful day?"`,
      `*Close-up of Alex looking up with surprise and hope, a small grateful smile beginning to form* Alex responds softly: "I'm Alex. I just moved here last week and don't know anyone yet. I'd love some company!"`,
      `*Cozy panel of ${characterName} sitting beside Alex, opening their colorful storybook to share* ${characterName} offers generously: "Well, now you know me! Want to read this amazing book together and become friends?"`,
      `*Joyful scene of both children laughing heartily at funny pictures in the book, their friendship blossoming naturally* Alex exclaims delightedly: "This story is absolutely hilarious! I love your sense of humor and kindness!"`,
      `*Sweet moment of ${characterName} and Alex feeding breadcrumbs to grateful ducks while sharing stories* ${characterName} observes happily: "We have so much in common! This friendship feels absolutely perfect and meant to be!"`,
      `*Welcoming scene of other children approaching their bench, drawn by the infectious laughter and joy* A curious child asks: "Can we join your story time? You both look like you're having so much fun!"`,
      `*Heartwarming group scene of multiple children gathered around ${characterName} and Alex, all laughing and sharing stories* Alex says gratefully: "Thank you for being so incredibly kind and welcoming to me on my first day!"`,
      `*Joyful play scene showing all the children playing together happily in the park* ${characterName} reflects wisely: "True friendship and kindness always make everything in life better and more meaningful!"`,
      `*Emotional goodbye hug between ${characterName} and Alex as the day ends* Alex promises earnestly: "Best friends forever and always, no matter what happens!"`,
      `*Final panel of ${characterName} walking home with a huge satisfied smile and warm heart* ${characterName} thinks contentedly: "Kindness and love really do create the most beautiful magic in the world!"`
    ],
    
    humour: [
      `*Energetic scene of ${characterName} waking up with wild, messy hair and an enormous mischievous grin* ${characterName} announces enthusiastically: "Today is the perfect day for Mr. Bubbles' first professional dance lesson!"`,
      `*Comical dressing scene of ${characterName} putting on their ridiculous polka dot pants and striped shirt combination* ${characterName} declares fashionably: "This is absolutely perfect dancing attire for making entertainment history!"`,
      `*Hilarious panel showing ${characterName} demonstrating absurdly silly dance moves to their bewildered goldfish* ${characterName} instructs seriously: "Follow my expert lead, Mr. Bubbles! Wiggle like this!"`,
      `*Amazing shot of Mr. Bubbles actually swimming in perfect circles in his bowl* Mr. Bubbles seems to say: "Blub blub blub!" (Translation: "I'm actually dancing and loving it!")`,
      `*Confused scene of family members appearing in pajamas, looking completely puzzled by the music and commotion* Mom asks sleepily: "What in the world is all this joyful music and laughter about?"`,
      `*Fantastic group dance scene with the whole family dancing enthusiastically with ${characterName} and Mr. Bubbles* Dad laughs heartily: "This is absolutely the best and most fun morning we've had in years!"`,
      `*Confident scene of ${characterName} marching into the kitchen with supreme cooking confidence* ${characterName} declares boldly: "Time to create the world's most amazing and delicious breakfast ever!"`,
      `*Disastrous cooking scene of ${characterName} cracking eggs with shells falling everywhere* ${characterName} rationalizes optimistically: "Extra crunchy protein for enhanced nutrition!"`,
      `*Comical mistake of ${characterName} adding salt instead of sugar to everything* ${characterName} thinks helpfully: "A little extra seasoning makes everything taste better!"`,
      `*Priceless reaction shots of the family taking first bites with absolutely shocked expressions* Everyone simultaneously: "BLEGH! What is this unusual flavor?"`,
      `*Heartwarming scene of everyone laughing hysterically together despite the terrible breakfast* Mom chuckles lovingly: "This tastes absolutely terrible... but it's wonderfully hilarious and memorable!"`,
      `*Final proud panel of ${characterName} grinning with enormous satisfaction* ${characterName} concludes triumphantly: "See? I made everyone incredibly happy and brought joy to our home!"`
    ]
  };
  
  return comicScenes[genre as keyof typeof comicScenes] || comicScenes.adventure;
};

const generateAdditionalScene = (characterName: string, genre: string, pageNumber: number) => {
  const additionalScenes = {
    adventure: [
      `Deep within the mystical crystal cave, ${characterName} discovers ancient wall paintings that tell epic stories of brave adventurers who came before them through the centuries. The magnificent paintings glow with supernatural inner light, showing detailed scenes of incredible courage, unwavering determination, and unbreakable friendship bonds. As ${characterName} carefully traces the painted figures with their trembling finger, they hear a gentle, wise voice echoing mysteriously through the cavernous chambers: "True treasure lies not in gold, silver, or precious jewels, but in the incredible journey itself and the courage you discover burning within your own heart." The surrounding crystals pulse brighter with each word, reflecting ${characterName}'s growing confidence and the life-changing realization that they have already found something far more valuable than any material treasure could ever be.`,
      
      `As ${characterName} emerges triumphantly from the magical cave, they discover that the entire enchanted forest has transformed dramatically around them. The ancient trees seem taller and more majestic than before, the colorful flowers bloom with even more vibrant beauty, and even the fresh air feels more alive and energizing. A diverse family of woodland creatures - fluffy rabbits, playful squirrels, and graceful deer - gather around ${characterName} as if celebrating their incredible achievement with a natural festival. The wise owl from their earlier encounter swoops down gracefully and perches nearby with obvious pride. "You have learned the greatest and most important lesson of all," the owl says with deep satisfaction and wisdom. "Adventure is not about reaching a specific destination, but about discovering who you truly are along the transformative way." ${characterName} feels a warm, golden glow of accomplishment spreading through their entire chest like sunshine.`
    ],
    
    fairytale: [
      `The magnificent Crystal of Colors begins singing the most beautiful, ethereal melody ${characterName} has ever heard in their entire life. As the heavenly music fills the air with magic, streams of brilliant color flow out like dancing ribbons of pure light - deep blues reminiscent of ocean waves, bright reds like delicate rose petals, golden yellows like warm sunshine, and every imaginable shade in between. The vibrant colors dance gracefully through the air, painting everything they touch back to glorious life with renewed beauty. ${characterName} watches in absolute wonder and amazement as the grey, lifeless world transforms before their eyes, becoming even more beautiful and magical than it was before the terrible curse. The crystal's enchanting song seems to whisper that genuine kindness and unconditional love are the most powerful magic of all.`,
      
      `As ${characterName} returns triumphantly to the kingdom carrying the precious Crystal of Colors, they are greeted by cheering crowds of people and creatures whose vibrant colors have been completely restored. The flowers sing even more beautifully than before, the butterflies paint even more magnificent rainbows across the sky, and everyone's smile seems brighter and more joyful than ever. The entire kingdom celebrates with the grandest festival ever seen, with ${characterName} honored as the guest of honor and beloved hero. Even Greybeard the wizard appears, no longer grumpy but smiling genuinely and deeply apologetic, his own grey robes now transformed into brilliant purple. He has learned the valuable lesson that spreading joy and happiness brings much more satisfaction than trying to steal it from others.`
    ],
    
    romance: [
      `${characterName} and Alex decide to start an official "Kindness Club" at their school, dedicated to helping other children who might be feeling lonely, left out, or new to the community. They design colorful friendship bracelets to give to new students, organize special lunch buddy programs for kids who sit alone, and create a beautiful "compliment jar" where students can leave encouraging notes for each other. Their beautiful friendship becomes the strong foundation for a whole network of caring relationships throughout their school community. Teachers and parents are amazed at how much happier and more inclusive the school environment becomes through their efforts.`,
      
      `During the wonderful summer holidays, ${characterName} and Alex embark on daily adventures around their neighborhood, always looking for creative ways to spread kindness and make new friends. They organize sidewalk chalk art festivals, set up cheerful lemonade stands to raise money for local animal shelters, and start a neighborhood book exchange where children can share their favorite stories. Their incredible friendship shows everyone around them that the best way to find true happiness is to help others find theirs first.`
    ],
    
    humour: [
      `Inspired by their breakfast "success," ${characterName} decides to help with the family laundry next. With the absolute best of intentions, they load the washing machine with all the white clothes and add what they think is regular detergent but is actually red fabric dye. When the washing cycle finishes, every white sock, shirt, and sheet has turned a lovely shade of bright pink! Instead of being upset, the family decides they love their new pink wardrobe and declares it the most fashionable household in the neighborhood. ${characterName} beams with pride at their accidental fashion revolution.`,
      
      `On a trip to the grocery store, ${characterName} volunteers to help put away the frozen foods while Mom shops for vegetables. With characteristic enthusiasm but questionable organization skills, ${characterName} puts the ice cream in the bread aisle, the frozen peas with the breakfast cereals, and the bread in the freezer section. When other shoppers discover bread next to the frozen fish and ice cream melting near the bagels, instead of being annoyed, everyone starts laughing and helps put things back where they belong. The store manager is so amused that they give ${characterName} an honorary "Assistant Store Reorganizer" badge.`
    ]
  };
  
  const scenes = additionalScenes[genre as keyof typeof additionalScenes] || additionalScenes.adventure;
  const sceneIndex = (pageNumber - 4) % scenes.length;
  return scenes[sceneIndex];
};

const generateAdditionalComicPanel = (characterName: string, genre: string, page: number, panel: number) => {
  const additionalPanels = {
    adventure: [
      `*${characterName} examining magnificent glowing cave paintings with detailed ancient artwork* ${characterName} whispers in awe: "These incredible paintings tell amazing stories of brave heroes!"`,
      `*Mystical ancient voice echoing through the crystal cave chambers* Wise Voice speaks: "True treasure lies within your courageous heart, brave young one!"`,
      `*${characterName} emerging from the cave with newfound confidence and golden glow* ${characterName} declares with wisdom: "I understand now - the journey was the real treasure!"`,
      `*Diverse forest creatures gathering around ${characterName} in celebration* Grateful rabbit says: "Welcome back, our beloved hero and friend!"`,
      `*Wise owl flying overhead with obvious pride and satisfaction* Owl proclaims: "You have found the greatest treasure of all - self-belief!"`,
      `*${characterName} walking home with new confidence and purpose* ${characterName} thinks: "I can face any adventure life brings me now!"`
    ],
    
    fairytale: [
      `*Crystal singing with beautiful musical notes floating all around* Crystal sings: "♪ Kindness and love are the greatest magic! ♪"`,
      `*Streams of vibrant color flowing gracefully from the crystal* ${characterName} exclaims joyfully: "It's working! All the beautiful colors are returning!"`,
      `*Kingdom transforming back to vibrant, magical colors* Narrator: "Magic spreads throughout the land like wildfire!"`,
      `*Crowds of people cheering enthusiastically for ${characterName}* Crowd chants: "Our hero has saved us all!"`,
      `*Reformed wizard bowing respectfully to ${characterName}* Greybeard apologizes: "Forgive me! I've learned my lesson about kindness!"`,
      `*Kingdom celebration with ${characterName} as guest of honor* ${characterName} proclaims: "Love and kindness always win!"`
    ],
    
    romance: [
      `*${characterName} and Alex making colorful friendship bracelets together* Alex suggests: "These will help other kids feel welcome and included!"`,
      `*Kids at school wearing beautiful, colorful bracelets* Student says gratefully: "Thanks for including me in your group!"`,
      `*${characterName} and Alex reading encouraging compliments from jar* ${characterName} observes: "Look how happy everyone is now!"`,
      `*Summer sidewalk chalk art festival with neighborhood families* ${characterName} says: "Art brings everyone together in friendship!"`,
      `*Lemonade stand with "For Animal Shelter" sign* Alex declares: "We're making a real difference in our community!"`,
      `*Neighborhood book exchange with happy families participating* Parent comments: "What wonderful young leaders these children are!"`
    ],
    
    humour: [
      `*${characterName} adding red dye to washing machine* ${characterName} assumes: "This red bottle looks like soap!"`,
      `*Family discovering all their pink clothes* Mom exclaims: "Our white clothes are... bright pink!"`,
      `*Family modeling their pink outfits proudly* Dad laughs: "We're the most stylish family ever!"`,
      `*${characterName} putting ice cream with bread* ${characterName} thinks: "I'm helping organize the store perfectly!"`,
      `*Confused shoppers finding misplaced items* Shopper wonders: "Why is there bread in the freezer?"`,
      `*Everyone laughing and helping reorganize* Manager chuckles: "You're our honorary assistant reorganizer!"`
    ]
  };
  
  const panels = additionalPanels[genre as keyof typeof additionalPanels] || additionalPanels.adventure;
  const panelIndex = ((page - 3) * 2 + panel - 1) % panels.length; // Changed to 2 panels per page
  return panels[panelIndex];
};

export const getStoryTemplates = (characterName: string, characterAge: string, message: string, bookType: string) => {
  // This function is now mainly used for backward compatibility
  // The main story generation is handled by generateStoryContent
  return {
    adventure: `Adventure story for ${characterName}`,
    fairytale: `Fairytale story for ${characterName}`,
    romance: `Romance story for ${characterName}`,
    humour: `Humour story for ${characterName}`
  };
};
