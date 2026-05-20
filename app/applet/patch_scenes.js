const fs = require('fs');
let code = fs.readFileSync('src/utils/gameLogic.ts', 'utf-8');

const replacements = {
  "Dogs say woof woof": 'objectName: "Dog", ',
  "Cats say meow": 'objectName: "Cat", ',
  "Goldfish swim": 'objectName: "Goldfish", ',
  "Cows say moooo": 'objectName: "Cow", ',
  "Pigs say oink": 'objectName: "Pig", ',
  "Chickens say cluck": 'objectName: "Chicken", ',
  "Lions say ROAR": 'objectName: "Lion", ',
  "Elephants have huge ears": 'objectName: "Elephant", ',
  "Monkeys love swinging": 'objectName: "Monkey", ',
  
  "This is number ONE": 'objectName: "One", ',
  "This is number TWO": 'objectName: "Two", ',
  "This is number THREE": 'objectName: "Three", ',
  "This is number FOUR": 'objectName: "Four", ',
  "This is number FIVE": 'objectName: "Five", ',
  "This is number SIX": 'objectName: "Six", ',
  "This is number SEVEN": 'objectName: "Seven", ',
  "This is number EIGHT": 'objectName: "Eight", ',
  "This is number NINE": 'objectName: "Nine", ',
  "This is number TEN": 'objectName: "Ten", ',
  
  "Red is bright": 'objectName: "Red", ',
  "Blue is the color": 'objectName: "Blue", ',
  "Yellow is happy": 'objectName: "Yellow", ',
  "Green is the color": 'objectName: "Green", ',
  "Orange is bright": 'objectName: "Orange", ',
  "Purple is magical": 'objectName: "Purple", ',
  "Pink is sweet": 'objectName: "Pink", ',
  "Brown is the color": 'objectName: "Brown", ',
  "Black is dark": 'objectName: "Black", ',
  "White is clean": 'objectName: "White", ',
  "Mixing black and white": 'objectName: "Grey", ',
};

for (const [key, val] of Object.entries(replacements)) {
  code = code.replace(
    new RegExp(`({ text: "${key}.*?", emoji`),
    `{ ${val}text: "${key}`
  );
  code = code.replace(
    new RegExp(`({ \\n\\s*text: "${key}.*?", \\n\\s*emoji`),
    `{\n        ${val}\n        text: "${key}`
  );
}

fs.writeFileSync('src/utils/gameLogic.ts', code);
