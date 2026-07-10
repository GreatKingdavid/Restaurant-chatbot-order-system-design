// Restaurant menu data.
//
// Each item can have one or more "option groups" (e.g. Size, Protein,
// Spice Level). Every choice inside a group has a price delta added to the
// item's base price. Customers pick these using the same number-select
// system as the rest of the bot.

const MENU = [
  {
    id: 1,
    name: 'Jollof Rice',
    basePrice: 6000,
    optionGroups: [
      { name: 'Size', choices: [{ label: 'Regular', delta: 0 }, { label: 'Large', delta: 300 }] },
      {
        name: 'Protein',
        choices: [
          { label: 'None', delta: 0 },
          { label: 'Chicken', delta: 300 },
          { label: 'Beef', delta: 400 },
          { label: 'Fish', delta: 500 },
        ],
      },
    ],
  },
  {
    id: 2,
    name: 'Fried Rice',
    basePrice: 5000,
    optionGroups: [
      { name: 'Size', choices: [{ label: 'Regular', delta: 0 }, { label: 'Large', delta: 300 }] },
      {
        name: 'Protein',
        choices: [
          { label: 'None', delta: 0 },
          { label: 'Chicken', delta: 300 },
          { label: 'Beef', delta: 400 },
          { label: 'Fish', delta: 500 },
        ],
      },
    ],
  },
  {
    id: 3,
    name: 'Pounded Yam & Egusi Soup',
    basePrice: 10000,
    optionGroups: [
      {
        name: 'Protein',
        choices: [
          { label: 'Goat Meat', delta: 400 },
          { label: 'Beef', delta: 300 },
          { label: 'Fish', delta: 500 },
        ],
      },
    ],
  },
  {
    id: 4,
    name: 'Suya (Spicy Grilled Beef Skewers)',
    basePrice: 3200,
    optionGroups: [
      {
        name: 'Spice Level',
        choices: [
          { label: 'Mild', delta: 0 },
          { label: 'Hot', delta: 0 },
          { label: 'Extra Hot', delta: 100},
        ],
      },
    ],
  },
  {
    id: 5,
    name: 'Chicken Wings',
    basePrice: 4000,
    optionGroups: [
      { name: 'Spice Level', choices: [{ label: 'Mild', delta: 0 }, { label: 'Hot', delta: 100 }] },
    ],
  },
  {
    id: 6,
    name: 'Grilled Fish',
    basePrice: 12000,
    optionGroups: [
      { name: 'Size', choices: [{ label: 'Regular', delta: 0 }, { label: 'Large', delta: 400 }] },
    ],
  },
  { id: 7, name: 'Meat Pie', basePrice: 3000, optionGroups: [] },
  {
    id: 8,
    name: 'Chapman (Drink)',
    basePrice: 4000,
    optionGroups: [
      { name: 'Size', choices: [{ label: 'Small', delta: 0 }, { label: 'Large', delta: 200 }] },
    ],
  },
  { id: 9, name: 'Zobo (Drink)', basePrice: 3000, optionGroups: [] },
  {
    id: 10,
    name: 'Ice Cream',
    basePrice: 5000,
    optionGroups: [
      {
        name: 'Flavor',
        choices: [
          { label: 'Vanilla', delta: 0 },
          { label: 'Chocolate', delta: 0 },
          { label: 'Strawberry', delta: 0 },
        ],
      },
    ],
  },
];

module.exports = MENU;
