# Cocktail App

## Description

Cocktail app for bartenders to input their own custom recipes, note the prices of their ingredients/cocktails and even homemade recipes.

Key features:

- Ingredient Management: Add, edit, delete, and search ingredients (with cost per unit)
- Recipe Management: Add, edit, delete, and search cocktail recipes (with ingredient amounts, costs, and instructions)
- Inventory Tracking: See current stock and what cocktails you can make
- Cost Calculation: Automatic calculation of each drink’s cost

Project Requirements:

- All-in-one vue.js frontend application
- Multi-page (require router)
- TODO: Need to think about how to store data (MySQL?)
- No need for authentication (meant for local hosting and private use)

DB Tables:

- Cocktail/Mocktail Recipes
- Ingredients Costs
- Homemade Ingredient Recipes + Cost
- Ingredients and Quantity

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
