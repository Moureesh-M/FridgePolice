const { v4: uuidv4 } = require('uuid');

const seedData = [
  {
    id: uuidv4(),
    name: 'Milk',
    quantity: 1000,
    servingSize: 250,
    expiryDate: '2026-04-20'
  },
  {
    id: uuidv4(),
    name: 'Yogurt',
    quantity: 500,
    servingSize: 125,
    expiryDate: '2026-04-18'
  },
  {
    id: uuidv4(),
    name: 'Cheese',
    quantity: 300,
    servingSize: 50,
    expiryDate: '2026-05-01'
  },
  {
    id: uuidv4(),
    name: 'Butter',
    quantity: 200,
    servingSize: 25,
    expiryDate: '2026-05-05'
  },
  {
    id: uuidv4(),
    name: 'Eggs',
    quantity: 12,
    servingSize: 2,
    expiryDate: '2026-04-22'
  },
  {
    id: uuidv4(),
    name: 'Orange Juice',
    quantity: 800,
    servingSize: 200,
    expiryDate: '2026-04-17'
  },
  {
    id: uuidv4(),
    name: 'Bread',
    quantity: 400,
    servingSize: 100,
    expiryDate: '2026-04-16'
  },
  {
    id: uuidv4(),
    name: 'Chicken Breast',
    quantity: 600,
    servingSize: 150,
    expiryDate: '2026-04-19'
  },
  {
    id: uuidv4(),
    name: 'Salad Mix',
    quantity: 250,
    servingSize: 50,
    expiryDate: '2026-04-16'
  },
  {
    id: uuidv4(),
    name: 'Tomatoes',
    quantity: 400,
    servingSize: 100,
    expiryDate: '2026-04-20'
  }
];

module.exports = seedData;
