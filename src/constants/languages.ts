export const LANGUAGES = {
  en: 'English',
  hi: 'Hindi',
  hinglish: 'Hinglish',
};

export const MESSAGES = {
  en: {
    welcome:
      "Hi! 👩‍🍳 Let's help you decide what to cook today.\nFirst, please select your preferred language:",
    meal_selection: 'Which meal are you planning?',
    diet_selection: "What's your meal type today?",
    ingredient_selection: 'Select what you have in the kitchen (Atleast 1):',
    cuisine_selection:
      "What cuisine matches your ingredients? 🤔\n(Pick something that makes sense with what you have - let's not confuse the chef! 👨‍🍳)",
    generating_recipes: '🍳 Generating delicious recipes for you...',
    recipe_suggestions: 'Here are some recipe suggestions for you:',
    recipe_details: '📋 Recipe Details:',
    ingredients_label: '🥘 Ingredients:',
    steps_label: '👨‍🍳 Instructions:',
    macros_label: '📊 Nutrition (per serving):',
    video_label: '📺 Watch how to cook:',
    error_message:
      'Sorry, something went wrong. Please try again by sending /start',
    try_again: 'Try Again',
    back: 'Back',
    next: 'Next',
    done: 'Done',
    custom_ingredient: 'Enter custom ingredient',
    more_options: 'More options',
    surprise_me: 'Surprise Me',
  },
  hi: {
    welcome:
      'नमस्ते! 👩‍🍳 आज आप क्या बनाना चाहते हैं, मैं आपकी मदद करूंगी।\nपहले अपनी पसंदीदा भाषा चुनें:',
    meal_selection: 'आप कौन सा खाना बनाने की योजना बना रहे हैं?',
    diet_selection: 'आज आपका खाना कैसा होगा?',
    ingredient_selection: 'रसोई में आपके पास क्या है उसे चुनें:',
    cuisine_selection:
      'कौन सा cuisine आपके ingredients के साथ match करेगा? 🤔\n(कुछ ऐसा चुनें जो आपके पास की चीज़ों से बन सके - chef को confuse न करें! 👨‍🍳)',
    generating_recipes: '🍳 आपके लिए स्वादिष्ट रेसिपी तैयार की जा रही है...',
    recipe_suggestions: 'यहाँ आपके लिए कुछ रेसिपी सुझाव हैं:',
    recipe_details: '📋 रेसिपी विवरण:',
    ingredients_label: '🥘 सामग्री:',
    steps_label: '👨‍🍳 बनाने की विधि:',
    macros_label: '📊 पोषण (प्रति सर्विंग):',
    video_label: '📺 बनाने का तरीका देखें:',
    error_message:
      'क्षमा करें, कुछ गलत हुआ। कृपया /start भेजकर फिर से कोशिश करें',
    try_again: 'फिर कोशिश करें',
    back: 'वापस',
    next: 'आगे',
    done: 'हो गया',
    custom_ingredient: 'अपनी सामग्री लिखें',
    more_options: 'और विकल्प',
    surprise_me: 'मुझे सरप्राइज़ करें',
  },
  hinglish: {
    welcome:
      'Hi! 👩‍🍳 Aaj aap kya banana chahte hain, main aapki help karungi.\nPehle apni favorite language choose kariye:',
    meal_selection: 'Aap konsa meal plan kar rahe hain?',
    diet_selection: 'Aaj aapka khana kaisa hoga?',
    ingredient_selection: 'Kitchen mein aapke paas kya hai select kariye:',
    cuisine_selection:
      'Konsa cuisine aapke ingredients ke saath match karega? 🤔\n(Kuch aisa choose kariye jo aapke paas ki cheezों se ban sake - chef ko confuse na kariye! 👨‍🍳)',
    generating_recipes: '🍳 Aapke liye tasty recipes ready ki ja rahi hain...',
    recipe_suggestions: 'Yahan aapke liye kuch recipe suggestions hain:',
    recipe_details: '📋 Recipe Details:',
    ingredients_label: '🥘 Ingredients:',
    steps_label: '👨‍🍳 Banane ka tarika:',
    macros_label: '📊 Nutrition (per serving):',
    video_label: '📺 Banane ka video dekhiye:',
    error_message:
      'Sorry, kuch galat hua. Please /start bhejkar phir try kariye',
    try_again: 'Phir Try Kariye',
    back: 'Wapas',
    next: 'Aage',
    done: 'Ho Gaya',
    custom_ingredient: 'Apna ingredient likhiye',
    more_options: 'Aur options',
    surprise_me: 'Mujhe Surprise Kariye',
  },
};

export const getLocalizedMessage = (key: string, language: string): string => {
  const lang = language in MESSAGES ? language : 'en';
  return MESSAGES[lang][key] || MESSAGES.en[key] || key;
};
