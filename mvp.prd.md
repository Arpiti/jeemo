# 🥘 Smart Meal Suggester Tool – MVP PRD

**A minimal, multilingual WhatsApp/Telegram bot that suggests meal recipes based on simple inputs (meal type, diet preference, available ingredients, cuisine). Recipes come with calories, macros, and a YouTube link for walkthroughs. Optimized for all users with minimal input. Designed for utility, not monetization (for now), but built to scale.**

---

## 👥 User Stories

- As a user, I want to receive recipe suggestions on WhatsApp/Telegram by answering a few simple questions.

- As a user, I want the tool to speak to me in simple language (English/Hinglish/vernacular) so I can easily follow along.

- As a user, I want to pick ingredients from a list instead of typing them.

- As a user, I want the recipes to be appropriate for my dietary preference (veg/non-veg/etc).

- As a user, I want the calorie count and macros for each recipe.

- As a user, I want to see a YouTube video for the recipe if available.

---

## 💡 User Experience (`UX`) Flow

### Entry Point:
User sends “Hi” or “Meal” to the WhatsApp/Telegram bot.

### Step-by-Step Bot Flow:

#### 👋 Welcome Message
- “Hi! 👩‍🍳 Let’s help you decide what to cook today.”
- Language option: English | Hindi | Tamil | Telugu | Bengali | Other (future localized strings)

#### 🍽️ Meal Selection
- Bot: “Which meal are you planning?”
- Options:  
  - Breakfast  
  - Lunch  
  - Snacks  
  - Dinner

#### 🥦 Meal Type
- Bot: “What’s your meal type today?”
- Options:  
  - Vegetarian  
  - Eggitarian  
  - Non Vegetarian

#### 🧂 Ingredients
- Bot: “Select what you have in the kitchen”
- Show 20 checkboxes dynamically based on meal + diet type
- Option: “Enter your hero ingredient” (open text)
- Option: “More options” (shows 20 more)

#### 🌍 Cuisine
- Bot: “What are you in the mood for?”
- Options:  
  - North Indian  
  - South Indian  
  - Thai  
  - Mexican  
  - Italian  
  - Continental  
  - Mediterranean  
  - Chinese  
  - Surprise Me

#### 🍛 Recipe Suggestions
- Bot shows 10 suggestions like:  
  1. Rajma Masala (480 cal)  
  2. Paneer Bhurji (320 cal)  
  ...

#### 📋 Recipe Detail
On selection:
- Ingredients (bullet list)
- Instructions (steps)
- Macros (protein, carbs, fat)
- YouTube Link: “Watch how to cook 🍳” → [link]

---

## 📖 Narrative

Imagine a 34-year-old woman living in Toronto. Her children are grown, her husband is working, and she finds herself unsure what to cook for lunch. She opens WhatsApp — her daily comfort zone — and types “Lunch ideas.” A friendly bot guides her step-by-step, asking what she’s in the mood for, what she has in the kitchen, and what cuisine she likes. In 30 seconds, she has ten recipes she can actually make. She taps one, sees a familiar dish she remembers from home, and watches a YouTube video on how to cook it.

This is not just a recipe bot. It’s a friendly nudge toward healthier, happier food decisions for the diaspora — personalized, culturally aware, and frictionless.

---

## 📊 Success Metrics

### Usage KPIs
- % of users who complete full suggestion flow (`activation rate`)
- Avg time to first recipe delivered
- Retention (7-day repeat usage)
- Top used languages
- Click-through rate on YouTube links

### Qualitative
- Feedback via in-bot emoji reactions or simple thumbs up/down
- Optional follow-up: “Was this helpful?”

---

## ⚙️ Technical Considerations

- **Platform:**  
  `Telegram Bot API`, `WhatsApp` (via Twilio API) - Phase 2

- **Bot Backend:**  
  - GPT + Prompt engineering, RAG (2Mn Recipe dataset) + LLM (GPT-style) for ingredient parsing + recipe ranking - Phase 2 
  - AI agent (YouTube scraper via search API or custom agent)

- **Language Handling:**  
  Localized strings pulled from a JSON/lang DB, support fallback to English

- **Recipe Dataset:**  
  - Curated + AI-generated recipes with associated metadata  
  - Store calories and macros in structured format

- **Hosting:**  
  Lightweight cloud function architecture (e.g. AWS Lambda, Firebase Functions)

- **Analytics:**  
  Track key actions: button clicks, recipe views, feedback

---

## 📅 Milestones & Sequencing

### Phase 1 – MVP Bot (02 weeks)
- Telegram bot up and running
- Meal → Diet → Ingredient → Cuisine → Recipe Flow
- Basic LLM + recipe dataset (if possible, we could do a RAG with this dataset)
- YouTube agent working for links
- Multilingual support (English + 1-2 languages)

### Phase 2 – Feedback Loop (01 week)
- Collect emoji/thumbs up/down after recipes
- Track drop-offs and optimize question flow
- Start website (recipe browser + late login flow)

### Phase 3 – Website Integration (01 week)
- Simple recipe viewer
- Optional: save favorite recipes, generate weekly plans
- Email-based login (optional)

---

## 🎯 Goals

### Business Goals
- Validate demand for a smart meal suggester tool for the Indian diaspora.
- Build an early user base through WhatsApp/Telegram (viral-friendly, low-friction entry).
- Collect usage data and feedback to improve the recipe engine.
- Lay the foundation for monetizable versions (e.g. website, personalized meal plans, premium features).

### User Goals
- Quickly decide “what to cook” using ingredients they already have.
- Reduce decision fatigue, especially for elderly or busy users.
- Get healthy, culturally relevant recipes in a familiar messaging app.
- Avoid typing or navigating complex apps.

### Non-Goals
- No user logins or saved profiles in MVP.
- No integration with grocery shopping or delivery services.
- No nutritionist-generated plans (LLM and recipe dataset only).
- No monetization in MVP (free only).
