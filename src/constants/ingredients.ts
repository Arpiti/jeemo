import { DietType, MealType } from '../types/session.interface';

export const COMMON_INGREDIENTS = {
  [DietType.VEGETARIAN]: {
    [MealType.BREAKFAST]: [
      'Oats', 'Milk', 'Eggs', 'Bread', 'Butter', 'Honey', 'Banana', 'Apple',
      'Yogurt', 'Cheese', 'Tomato', 'Onion', 'Green Chili', 'Ginger', 'Potato', 
      'Paneer', 'Rice', 'Semolina', 'Coconut', 'Jaggery'
    ],
    [MealType.LUNCH]: [
      'Rice', 'Wheat Flour', 'Lentils', 'Chickpeas', 'Kidney Beans', 'Paneer',
      'Potato', 'Cauliflower', 'Spinach', 'Tomato', 'Onion', 'Garlic', 'Ginger',
      'Green Chili', 'Coriander', 'Cumin', 'Turmeric', 'Red Chili', 'Yogurt', 'Oil'
    ],
    [MealType.SNACKS]: [
      'Chickpea Flour', 'Potato', 'Onion', 'Green Chili', 'Ginger', 'Chat Masala',
      'Tamarind', 'Mint', 'Coriander', 'Puffed Rice', 'Sev', 'Bread', 'Cheese',
      'Butter', 'Tea Leaves', 'Milk', 'Biscuits', 'Nuts', 'Dates', 'Coconut'
    ],
    [MealType.DINNER]: [
      'Rice', 'Wheat Flour', 'Lentils', 'Mixed Vegetables', 'Paneer', 'Mushroom',
      'Bell Pepper', 'Broccoli', 'Carrot', 'Peas', 'Tomato', 'Onion', 'Garlic',
      'Ginger', 'Spinach', 'Fenugreek', 'Cauliflower', 'Eggplant', 'Yogurt', 'Ghee'
    ]
  },
  [DietType.EGGITARIAN]: {
    [MealType.BREAKFAST]: [
      'Eggs', 'Bread', 'Milk', 'Butter', 'Cheese', 'Tomato', 'Onion', 'Bell Pepper',
      'Spinach', 'Mushroom', 'Ham', 'Bacon', 'Oats', 'Banana', 'Honey', 'Yogurt',
      'Avocado', 'Olive Oil', 'Salt', 'Black Pepper'
    ],
    [MealType.LUNCH]: [
      'Eggs', 'Rice', 'Pasta', 'Bread', 'Cheese', 'Vegetables', 'Lentils', 'Quinoa',
      'Potato', 'Sweet Potato', 'Broccoli', 'Zucchini', 'Tomato', 'Onion', 'Garlic',
      'Herbs', 'Olive Oil', 'Vinegar', 'Nuts', 'Seeds'
    ],
    [MealType.SNACKS]: [
      'Eggs', 'Bread', 'Crackers', 'Cheese', 'Avocado', 'Hummus', 'Vegetables',
      'Nuts', 'Yogurt', 'Berries', 'Dark Chocolate', 'Protein Powder', 'Milk',
      'Peanut Butter', 'Banana', 'Apple', 'Carrots', 'Celery', 'Cucumber', 'Olives'
    ],
    [MealType.DINNER]: [
      'Eggs', 'Rice', 'Pasta', 'Quinoa', 'Vegetables', 'Legumes', 'Tofu', 'Tempeh',
      'Sweet Potato', 'Broccoli', 'Asparagus', 'Brussels Sprouts', 'Kale', 'Spinach',
      'Tomato', 'Onion', 'Garlic', 'Ginger', 'Herbs', 'Spices'
    ]
  },
  [DietType.NON_VEGETARIAN]: {
    [MealType.BREAKFAST]: [
      'Eggs', 'Chicken', 'Turkey', 'Bacon', 'Sausage', 'Salmon', 'Bread', 'Butter',
      'Cheese', 'Milk', 'Tomato', 'Onion', 'Bell Pepper', 'Spinach', 'Mushroom',
      'Hash Browns', 'Oats', 'Yogurt', 'Honey', 'Berries'
    ],
    [MealType.LUNCH]: [
      'Chicken', 'Beef', 'Pork', 'Fish', 'Shrimp', 'Rice', 'Pasta', 'Bread',
      'Potato', 'Vegetables', 'Salad Greens', 'Tomato', 'Onion', 'Garlic', 'Ginger',
      'Lemon', 'Olive Oil', 'Herbs', 'Spices', 'Cheese'
    ],
    [MealType.SNACKS]: [
      'Chicken Wings', 'Fish Fingers', 'Meat Balls', 'Jerky', 'Cheese', 'Crackers',
      'Nuts', 'Olives', 'Eggs', 'Avocado', 'Hummus', 'Vegetables', 'Fruits',
      'Yogurt', 'Dark Chocolate', 'Protein Bar', 'Smoothie', 'Milk', 'Honey', 'Berries'
    ],
    [MealType.DINNER]: [
      'Chicken', 'Beef', 'Pork', 'Lamb', 'Fish', 'Seafood', 'Rice', 'Pasta', 'Potato',
      'Vegetables', 'Salad', 'Broccoli', 'Asparagus', 'Green Beans', 'Carrots',
      'Onion', 'Garlic', 'Herbs', 'Spices', 'Wine'
    ]
  }
};

export const getIngredientsForMealAndDiet = (mealType: MealType, dietType: DietType): string[] => {
  return COMMON_INGREDIENTS[dietType]?.[mealType] || [];
};