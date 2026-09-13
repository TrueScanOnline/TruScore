import { simulateV02FoodDrinkClass } from '../../../nutrition/v02FoodDrinkDeterminant';

describe('v0.2 Food / Drink determinant — section 17.4', () => {
  it('Orange juice, 1 L, categories empty → Drink', () => {
    const result = simulateV02FoodDrinkClass({
      productName: 'Orange juice',
      quantity: '1 L',
      categoriesTags: [],
    });
    expect(result.productClass).toBe('drink');
    expect(result.provisionalDrinkStep).toBe('step1_volume');
  });

  it('Full-cream milk, 2 L, category only dairies → Drink', () => {
    const result = simulateV02FoodDrinkClass({
      productName: 'Full-cream milk',
      quantity: '2 L',
      categoriesTags: ['en:dairies'],
    });
    expect(result.productClass).toBe('drink');
    expect(result.provisionalDrinkStep).toBe('step1_volume');
    expect(result.foodVetoEvidence).toBeNull();
  });

  it('Double espresso beverage, 250 mL, categories empty → Drink', () => {
    const result = simulateV02FoodDrinkClass({
      productName: 'Double espresso beverage',
      quantity: '250 mL',
      categoriesTags: [],
    });
    expect(result.productClass).toBe('drink');
  });

  it('Soup, 500 mL → Food', () => {
    const result = simulateV02FoodDrinkClass({
      productName: 'Tomato soup',
      quantity: '500 mL',
      categoriesTags: [],
    });
    expect(result.productClass).toBe('food');
    expect(result.foodVetoFamily).toBe('soup_broth');
  });

  it('Hot sauce, 150 mL → Food', () => {
    const result = simulateV02FoodDrinkClass({
      productName: 'Hot sauce',
      quantity: '150 mL',
      categoriesTags: [],
    });
    expect(result.productClass).toBe('food');
    expect(result.foodVetoFamily).toBe('sauce_gravy');
  });

  it('Gravy, 250 mL → Food', () => {
    const result = simulateV02FoodDrinkClass({
      productName: 'Gravy',
      quantity: '250 mL',
      categoriesTags: [],
    });
    expect(result.productClass).toBe('food');
    expect(result.foodVetoFamily).toBe('sauce_gravy');
  });

  it('Salad dressing, 250 mL → Food', () => {
    const result = simulateV02FoodDrinkClass({
      productName: 'Salad dressing',
      quantity: '250 mL',
      categoriesTags: [],
    });
    expect(result.productClass).toBe('food');
    expect(result.foodVetoFamily).toBe('dressing');
  });

  it('Olive oil, 750 mL → Food', () => {
    const result = simulateV02FoodDrinkClass({
      productName: 'Olive oil',
      quantity: '750 mL',
      categoriesTags: [],
    });
    expect(result.productClass).toBe('food');
    expect(result.foodVetoFamily).toBe('oil');
  });

  it('Honey with volume evidence → Food', () => {
    const result = simulateV02FoodDrinkClass({
      productName: 'Honey',
      quantity: '500 mL',
      categoriesTags: [],
    });
    expect(result.productClass).toBe('food');
    expect(result.foodVetoFamily).toBe('honey');
  });

  it('Ice cream, 1 L → Food', () => {
    const result = simulateV02FoodDrinkClass({
      productName: 'Vanilla ice cream',
      quantity: '1 L',
      categoriesTags: [],
    });
    expect(result.productClass).toBe('food');
    expect(result.foodVetoFamily).toBe('ice_cream');
  });

  it('Ordinary yoghurt, 160 g → Food', () => {
    const result = simulateV02FoodDrinkClass({
      productName: 'Natural yoghurt',
      quantity: '160 g',
      categoriesTags: ['en:yogurts'],
    });
    expect(result.productClass).toBe('food');
  });

  it('Yoghurt drink explicitly named; unit absent → Drink', () => {
    const result = simulateV02FoodDrinkClass({
      productName: 'Strawberry yoghurt drink',
      categoriesTags: [],
    });
    expect(result.productClass).toBe('drink');
    expect(result.provisionalDrinkStep).toBe('step3_explicit_identity');
    expect(result.foodVetoEvidence).toBeNull();
  });

  it('Drinking yoghurt explicitly named → Food', () => {
    const result = simulateV02FoodDrinkClass({
      productName: 'Drinking yoghurt',
      categoriesTags: [],
    });
    expect(result.productClass).toBe('food');
  });

  it('Approved powdered beverage + reliable prepared nutrition → Drink', () => {
    const result = simulateV02FoodDrinkClass({
      productName: 'Chocolate drink powder',
      quantity: '400 g',
      nutritionDataPreparedPer: '100ml',
      nutriments: { sugars_prepared_100ml: 10.5 },
    });
    expect(result.productClass).toBe('drink');
    expect(result.provisionalDrinkStep).toBe('step2_prepared');
  });

  it('Baked beans, 420 g → Food', () => {
    const result = simulateV02FoodDrinkClass({
      productName: 'Baked beans',
      quantity: '420 g',
      categoriesTags: ['en:legumes'],
    });
    expect(result.productClass).toBe('food');
    expect(result.provisionalDrink).toBe(false);
  });

  it('Unclear product, no volume/drink evidence → Food', () => {
    const result = simulateV02FoodDrinkClass({
      productName: 'Mystery product',
      categoriesTags: [],
    });
    expect(result.productClass).toBe('food');
  });

  it('Volume product with broad dairies tag only → Drink unless veto', () => {
    const result = simulateV02FoodDrinkClass({
      productName: 'Full cream milk',
      quantity: '2 L',
      categoriesTags: ['en:dairies'],
    });
    expect(result.productClass).toBe('drink');
    expect(result.foodVetoEvidence).toBeNull();
  });

  it('Volume product with plant-based-foods-and-beverages only → Drink unless veto', () => {
    const result = simulateV02FoodDrinkClass({
      productName: 'Almond milk',
      quantity: '1 L',
      categoriesTags: ['en:plant-based-foods-and-beverages'],
    });
    expect(result.productClass).toBe('drink');
    expect(result.foodVetoEvidence).toBeNull();
  });

  it('does not match drink as substring inside drinking for step 3', () => {
    const result = simulateV02FoodDrinkClass({
      productName: 'Drinking yoghurt',
      quantity: '1 L',
      categoriesTags: [],
    });
    expect(result.productClass).toBe('food');
    expect(result.foodVetoFamily).toBe('yoghurt');
  });

  it('oilseed name does not trigger oil Food-veto', () => {
    const result = simulateV02FoodDrinkClass({
      productName: 'Sunflower oilseed spread',
      quantity: '500 g',
      categoriesTags: ['en:oilseeds'],
    });
    expect(result.productClass).toBe('food');
    expect(result.foodVetoFamily).not.toBe('oil');
  });
});

describe('v0.2 Stage 1 corrective regressions', () => {
  it('product quantity 500 g + structured serving unit mL → conflicting structured evidence does not establish Drink', () => {
    const result = simulateV02FoodDrinkClass({
      productName: 'CousCous',
      quantity: '500 g',
      servingSize: '0.5 Cup (100 g)',
      productQuantity: 500,
      productQuantityUnit: 'g',
      servingQuantity: 100,
      servingQuantityUnit: 'ml',
      categoriesTags: ['en:pastas'],
    });
    expect(result.provisionalDrink).toBe(false);
    expect(result.productClass).toBe('food');
  });

  it('structured product volume with serving unit absent → may still establish Drink', () => {
    const result = simulateV02FoodDrinkClass({
      productName: 'Just Juice Orange Mango',
      quantity: '1 L',
      productQuantity: 1000,
      productQuantityUnit: 'ml',
      servingQuantityUnit: null,
      categoriesTags: [],
    });
    expect(result.provisionalDrink).toBe(true);
    expect(result.provisionalDrinkStep).toBe('step1_volume');
    expect(result.productClass).toBe('drink');
  });

  it('structured serving volume with product unit absent → may still establish Drink', () => {
    const result = simulateV02FoodDrinkClass({
      productName: 'Our Finest Non-Homogenised Milk',
      servingQuantity: 250,
      servingQuantityUnit: 'ml',
      productQuantityUnit: null,
      categoriesTags: ['en:dairies'],
    });
    expect(result.provisionalDrink).toBe(true);
    expect(result.provisionalDrinkStep).toBe('step1_volume');
    expect(result.productClass).toBe('drink');
  });

  it('both structured units volume → Drink evidence established', () => {
    const result = simulateV02FoodDrinkClass({
      productName: 'Coca-Cola Classic',
      productQuantity: 375,
      productQuantityUnit: 'ml',
      servingQuantity: 375,
      servingQuantityUnit: 'ml',
      categoriesTags: [],
    });
    expect(result.provisionalDrink).toBe(true);
    expect(result.provisionalDrinkStep).toBe('step1_volume');
    expect(result.provisionalDrinkEvidence.length).toBeGreaterThanOrEqual(2);
    expect(result.productClass).toBe('drink');
  });

  it('generic yoghurt ancestor plus explicit yoghurt/yogurt-drink evidence → yoghurt veto does not fire', () => {
    const result = simulateV02FoodDrinkClass({
      productName: 'Probiotic Drink',
      productQuantity: 325,
      productQuantityUnit: 'ml',
      servingQuantity: 65,
      servingQuantityUnit: 'ml',
      categoriesTags: ['en:beverages', 'en:yogurts', 'en:yogurt-drinks'],
    });
    expect(result.provisionalDrink).toBe(true);
    expect(result.foodVetoEvidence).toBeNull();
    expect(result.productClass).toBe('drink');
  });

  it('literal drinking yoghurt/yogurt → Food', () => {
    const drinkingYoghurt = simulateV02FoodDrinkClass({
      productName: 'Drinking yoghurt',
      quantity: '1 L',
      productQuantity: 1000,
      productQuantityUnit: 'ml',
      categoriesTags: [],
    });
    expect(drinkingYoghurt.productClass).toBe('food');
    expect(drinkingYoghurt.foodVetoFamily).toBe('yoghurt');

    const drinkingYogurt = simulateV02FoodDrinkClass({
      productName: 'Drinking yogurt',
      quantity: '1 L',
      productQuantity: 1000,
      productQuantityUnit: 'ml',
      categoriesTags: [],
    });
    expect(drinkingYogurt.productClass).toBe('food');
    expect(drinkingYogurt.foodVetoFamily).toBe('yoghurt');
  });

  it('existing tea-via-exact-OFF-beverage evidence remains Drink', () => {
    const result = simulateV02FoodDrinkClass({
      productName: 'Twinings English Breakfast Tea Bags',
      quantity: '100 g',
      productQuantity: 100,
      productQuantityUnit: 'g',
      categoriesTags: ['en:beverages', 'en:teas'],
    });
    expect(result.provisionalDrinkStep).toBe('step3_explicit_identity');
    expect(result.provisionalDrinkEvidence.some((e) => e.includes('beverages'))).toBe(true);
    expect(result.productClass).toBe('drink');
  });
});
