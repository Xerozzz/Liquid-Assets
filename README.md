# Cocktail App

## Description

Cocktail app for bartenders to input their own custom recipes, note the prices of their ingredients/cocktails and even homemade recipes.

### Key features:

- Ingredient Management: Add, edit, delete, and search ingredients (with cost per unit)
- Recipe Management: Add, edit, delete, and search cocktail recipes (with ingredient amounts, costs, and instructions)
- Inventory Tracking: See current stock and what cocktails you can make
- Cost Calculation: Automatic calculation of each drink’s cost

### Project Requirements:

- All-in-one vue.js frontend application
- Multi-page (require router)
- TODO: Need to think about how to store data (MySQL?)
- No need for authentication (meant for local hosting and private use)

### DB Tables:

- Cocktail/Mocktail Recipes
- Ingredients Costs and Stock
- Homemade Ingredient Recipes + Cost

### DB Schema

1. Recipes
   - Name
   - Glass
   - Ingredients and ML and cost (to be automatically calculated)
   - Step to Make
   - Garnish
   - Notes
   - Image
   - ABV (to be auto calculated)
   - Ratio
2. Ingredients

   - Cost
   - Original Quantity per item
   - cost/ml/g/item
   - In stock?

3. HM Ingredients

   - Name
   - Steps to Make
   - Ingredients and ML and cost (to be automatically calculated)
   - Notes
   - Ratio
   - Cost/ML (auto calculated)

4. Glassware
   - Volume
   - Volume to fill
   - Brand
   - Model

### Pages:

1. Home Page
2. Cocktails/Mocktails Page
3. Ingredients Page
4. Homemade Ingredients Page
5. Glassware Page

### Features:

1. Creating cocktail/mocktail recipe
2. Creating ingredients and associated costs
3. Editing whether ingredients in stock
4. Creating homemade ingredient recipes
5. Cost of cocktails and HM ingredients automatically calculated
6. Comparison of homemade vs store-bought ingredient prices
7. Automatically adjusting of volumes based on ratio (i.e. how much to use when making 2x or 3x of drink, or when making a drink with different total volume/individual volume)
8. Conversion of units (Oz -> ML etc)
9. Show what kind of drinks can be made by ingredients present
10. Show what drinks can be made from a specific ingredient

## Project Setup

```sh
npm install
```

### Compile and Hot-Reload for Development

```sh
npm run dev
```

### Compile and Minify for Production

```sh
npm run build
```

### Lint with [ESLint](https://eslint.org/)

```sh
npm run lint
```
