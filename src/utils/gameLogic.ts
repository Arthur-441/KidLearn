import {
  doc,
  getDoc,
  updateDoc,
  arrayUnion,
  increment,
  addDoc,
  collection,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase";

export async function saveGameResult(
  userId: string,
  childId: string,
  subject: string,
  score: number,
  total: number,
  starsEarned: number,
  issues: string[],
  timeTaken: number,
  badgeId: string | null = null,
) {
  const childRef = doc(db, "users", userId, "children", childId);
  const resultsRef = collection(
    db,
    "users",
    userId,
    "children",
    childId,
    "results",
  );

  const updates: any = {
    stars: increment(starsEarned),
    gamesPlayed: increment(1),
    dailyStars: increment(starsEarned),
    dailyGames: increment(1),
  };

  if (badgeId) {
    updates.badges = arrayUnion(badgeId);
    updates.dailyBadges = increment(1);
  }

  try {
    await updateDoc(childRef, updates);
    await addDoc(resultsRef, {
      subject,
      score,
      total,
      starsEarned,
      issues,
      timeTaken,
      createdAt: serverTimestamp(),
    });
  } catch (err) {
    console.error("saveGameResult error:", err);
    throw err;
  }
}

export type GameQuestion = {
  text: string;
  type: string;
  options: { id: string; label: string; bg: string }[];
  answerId: string;
  audioUrl?: string;
  hint?: string;
};

export type InteractiveElement = {
  type: "find" | "choose";
  options: string[];
  answerIndex: number;
  prompt: string;
};

export type LessonContent = {
  title: string;
  text: string;
  emoji: string;
  type: "lesson";
  soundWord?: string;
  audioUrl?: string;
  scenes?: {
    text: string;
    emoji: string;
    letter?: string;
    objectName?: string;
    interaction?: InteractiveElement;
  }[];
};

const colorQuestions = [
  {
    text: "Which color is the apple?",
    hint: "Look for the red circle!",
    type: "color",
    options: [
      { id: "red", label: "🔴 Red", bg: "#ef5350" },
      { id: "blue", label: "🔵 Blue", bg: "#42a5f5" },
      { id: "green", label: "🟢 Green", bg: "#66bb6a" },
    ],
    answerId: "red",
  },
  {
    text: "Find the Yellow star",
    hint: "It starts with the letter Y and shines bright!",
    type: "color",
    options: [
      { id: "yellow", label: "⭐ Yellow", bg: "#ffee58" },
      { id: "purple", label: "🟣 Purple", bg: "#ab47bc" },
      { id: "orange", label: "🟠 Orange", bg: "#ffa726" },
    ],
    answerId: "yellow",
  },
  {
    text: "What color is the gross vegetable? (Broccoli)",
    hint: "Broccoli is the color of grass!",
    type: "color",
    options: [
      { id: "green", label: "🥦 Green", bg: "#66bb6a" },
      { id: "red", label: "🔴 Red", bg: "#ef5350" },
      { id: "black", label: "⚫ Black", bg: "#263238" },
    ],
    answerId: "green",
  },
  {
    text: "What color is the sky?",
    hint: "Look for the cool, calm blue color.",
    type: "color",
    options: [
      { id: "pink", label: "🌸 Pink", bg: "#f48fb1" },
      { id: "blue", label: "🌥️ Blue", bg: "#42a5f5" },
      { id: "yellow", label: "☀️ Yellow", bg: "#ffee58" },
    ],
    answerId: "blue",
  },
  {
    text: "Pick the Orange basketball",
    hint: "An orange basketball matches the color orange!",
    type: "color",
    options: [
      { id: "blue", label: "🔵 Blue", bg: "#42a5f5" },
      { id: "orange", label: "🏀 Orange", bg: "#ffa726" },
      { id: "red", label: "🔴 Red", bg: "#ef5350" },
    ],
    answerId: "orange",
  },
];

const shapesQuestions = [
  {
    text: "Which one is a Circle?",
    hint: "A circle is completely round with no corners.",
    type: "shape",
    options: [
      { id: "circle", label: "🔴 Circle", bg: "#ef5350" },
      { id: "square", label: "🟦 Square", bg: "#42a5f5" },
      { id: "triangle", label: "🔺 Triangle", bg: "#66bb6a" },
    ],
    answerId: "circle",
  },
  {
    text: "Find the Triangle",
    hint: "A triangle has exactly three sides.",
    type: "shape",
    options: [
      { id: "square", label: "🟩 Square", bg: "#66bb6a" },
      { id: "triangle", label: "🔺 Triangle", bg: "#ffa726" },
      { id: "circle", label: "🔵 Circle", bg: "#42a5f5" },
    ],
    answerId: "triangle",
  },
  {
    text: "What shape is a box?",
    hint: "A box is built with squares that have four equal sides.",
    type: "shape",
    options: [
      { id: "triangle", label: "🔺 Triangle", bg: "#ef5350" },
      { id: "square", label: "📦 Square", bg: "#ab47bc" },
      { id: "circle", label: "🔴 Circle", bg: "#ef5350" },
    ],
    answerId: "square",
  },
  {
    text: "Find the Star!",
    hint: "A star shines bright and often is drawn with 5 points.",
    type: "shape",
    options: [
      { id: "star", label: "⭐ Star", bg: "#ffee58" },
      { id: "circle", label: "🔵 Circle", bg: "#42a5f5" },
      { id: "heart", label: "💖 Heart", bg: "#f48fb1" },
    ],
    answerId: "star",
  },
  {
    text: "What shape is a slice of pizza?",
    hint: "A slice of pizza comes to a point and has three sides.",
    type: "shape",
    options: [
      { id: "circle", label: "🔴 Circle", bg: "#ef5350" },
      { id: "square", label: "🟦 Square", bg: "#42a5f5" },
      { id: "triangle", label: "🍕 Triangle", bg: "#ffa726" },
    ],
    answerId: "triangle",
  },
];

const numbersQuestions = [
  {
    text: "Count the apples: 🍎🍎🍎",
    hint: "Count them slowly: one, two, three!",
    type: "number",
    options: [
      { id: "2", label: "2", bg: "#ef5350" },
      { id: "3", label: "3", bg: "#42a5f5" },
      { id: "4", label: "4", bg: "#66bb6a" },
    ],
    answerId: "3",
  },
  {
    text: "What number comes after 4?",
    hint: "Hold up 4 fingers, then add 1 more. That makes 5!",
    type: "number",
    options: [
      { id: "3", label: "3", bg: "#ffee58" },
      { id: "5", label: "5", bg: "#ab47bc" },
      { id: "6", label: "6", bg: "#ffa726" },
    ],
    answerId: "5",
  },
  {
    text: "Find the number SEVEN",
    hint: "Look for the number that comes right after six.",
    type: "number",
    options: [
      { id: "6", label: "6", bg: "#66bb6a" },
      { id: "7", label: "7", bg: "#ef5350" },
      { id: "8", label: "8", bg: "#263238" },
    ],
    answerId: "7",
  },
  {
    text: "Count the stars: ⭐⭐",
    hint: "One, two! There are two stars.",
    type: "number",
    options: [
      { id: "1", label: "1", bg: "#f48fb1" },
      { id: "2", label: "2", bg: "#42a5f5" },
      { id: "3", label: "3", bg: "#ffee58" },
    ],
    answerId: "2",
  },
  {
    text: "Which number is the biggest?",
    hint: "Nine is the highest number here, almost ten!",
    type: "number",
    options: [
      { id: "1", label: "1", bg: "#42a5f5" },
      { id: "9", label: "9", bg: "#ffa726" },
      { id: "5", label: "5", bg: "#ef5350" },
    ],
    answerId: "9",
  },
];

const lettersQuestions = [
  {
    text: "What letter does 'Apple' start with?",
    hint: "Ah, Ah, Apple! It starts with the very first letter of the alphabet, A.",
    type: "text",
    options: [
      { id: "A", label: "A", bg: "#ef5350" },
      { id: "B", label: "B", bg: "#42a5f5" },
      { id: "C", label: "C", bg: "#66bb6a" },
    ],
    answerId: "A",
  },
  {
    text: "Find the letter 'M'",
    hint: "M has two humps, like a monkey!",
    type: "text",
    options: [
      { id: "N", label: "N", bg: "#ffee58" },
      { id: "M", label: "M", bg: "#ab47bc" },
      { id: "W", label: "W", bg: "#ffa726" },
    ],
    answerId: "M",
  },
  {
    text: "What comes after A, B, C?",
    hint: "A, B, C, D... D is for Dog!",
    type: "text",
    options: [
      { id: "D", label: "D", bg: "#66bb6a" },
      { id: "E", label: "E", bg: "#ef5350" },
      { id: "F", label: "F", bg: "#263238" },
    ],
    answerId: "D",
  },
  {
    text: "Which letter sounds like 'Sssss' (Snake)?",
    hint: "It looks just like a curvy snake! The letter S.",
    type: "text",
    options: [
      { id: "Z", label: "Z", bg: "#f48fb1" },
      { id: "S", label: "S", bg: "#42a5f5" },
      { id: "C", label: "C", bg: "#ffee58" },
    ],
    answerId: "S",
  },
  {
    text: "Find the vowel 'O'",
    hint: "The letter O is perfectly round, just like a circle.",
    type: "text",
    options: [
      { id: "O", label: "O", bg: "#42a5f5" },
      { id: "Q", label: "Q", bg: "#ffa726" },
      { id: "C", label: "C", bg: "#ef5350" },
    ],
    answerId: "O",
  },
];

const animalsQuestions = [
  {
    text: "Which animal says 'Woof Woof'?",
    hint: "A dog is man's best friend and barks Woof Woof!",
    type: "animal",
    options: [
      { id: "dog", label: "🐶 Dog", bg: "#42a5f5" },
      { id: "cat", label: "🐱 Cat", bg: "#ef5350" },
      { id: "cow", label: "🐄 Cow", bg: "#66bb6a" },
    ],
    answerId: "dog",
    audioUrl:
      "https://upload.wikimedia.org/wikipedia/commons/1/15/Dog_barking_2.ogg",
  },
  {
    text: "Which animal says 'Moo'?",
    hint: "A cow gives us milk and lives on a farm.",
    type: "animal",
    options: [
      { id: "cow", label: "🐄 Cow", bg: "#66bb6a" },
      { id: "lion", label: "🦁 Lion", bg: "#ffa726" },
      { id: "bird", label: "🐦 Bird", bg: "#42a5f5" },
    ],
    answerId: "cow",
    audioUrl: "https://upload.wikimedia.org/wikipedia/commons/d/d3/Bovine.ogg",
  },
  {
    text: "Which animal says 'Meow'?",
    hint: "A cat is soft and loves to purr.",
    type: "animal",
    options: [
      { id: "cat", label: "🐱 Cat", bg: "#ef5350" },
      { id: "dog", label: "🐶 Dog", bg: "#42a5f5" },
      { id: "lion", label: "🦁 Lion", bg: "#ffa726" },
    ],
    answerId: "cat",
    audioUrl:
      "https://upload.wikimedia.org/wikipedia/commons/1/1d/Cat_Meow_2.ogg",
  },
  {
    text: "Who is the king of the jungle?",
    hint: "A lion has a big mane and a loud roar!",
    type: "animal",
    options: [
      { id: "lion", label: "🦁 Lion", bg: "#ffa726" },
      { id: "cow", label: "🐄 Cow", bg: "#66bb6a" },
      { id: "bird", label: "🐦 Bird", bg: "#42a5f5" },
    ],
    answerId: "lion",
    audioUrl:
      "https://upload.wikimedia.org/wikipedia/commons/c/c2/Lion_Roar.ogg",
  },
  {
    text: "Which animal flies and sings sweet songs?",
    hint: "A bird has feathers and flies in the sky.",
    type: "animal",
    options: [
      { id: "bird", label: "🐦 Bird", bg: "#42a5f5" },
      { id: "cat", label: "🐱 Cat", bg: "#ef5350" },
      { id: "dog", label: "🐶 Dog", bg: "#42a5f5" },
    ],
    answerId: "bird",
    audioUrl:
      "https://upload.wikimedia.org/wikipedia/commons/5/5e/Common_Blackbird_%28Turdus_merula%29_by_Isai_Xolo.ogg",
  },
];

const rhymesLessons: LessonContent[] = [
  {
    title: "A Tisket, A Tasket",
    text: "A tisket, a tasket...\nA green and yellow basket.\nI wrote a letter to my love,\nAnd on the way I dropped it.\n\nI dropped it, I dropped it,\nAnd on the way I dropped it.\nA little boy, he picked it up...\nAnd put it in his pocket!",
    emoji: "🧺",
    type: "lesson",
  },
  {
    title: "A Wise Old Owl",
    text: "A wise old owl, lived in an oak...\nThe more he saw, the less he spoke.\nThe less he spoke, the more he heard...\nWhy can't we all be like that wise old bird?\n\nHe watched the moon, he watched the sun...\nHe watched the children, having fun.\nSitting quietly, day and night...\nUntil he took his evening flight!",
    emoji: "🦉",
    type: "lesson",
  },
  {
    title: "Baa, Baa Black Sheep",
    text: "Baa, baa, black sheep...\nHave you any wool?\nYes sir, yes sir...\nThree bags full!\n\nOne for my master,\nAnd one for my dame...\nAnd one for the little boy,\nWho lives down the lane!",
    emoji: "🐑",
    type: "lesson",
  },
  {
    title: "Cobbler Mend My Shoe",
    text: "Cobbler, cobbler, mend my shoe...\nGet it done by half past two.\nStitch it up, and stitch it down...\nThen I'll give you half a crown.\n\nIf half a crown, is far too much...\nI'll give you a silver button to touch!\nSo sew it strong, and sew it neat...\nTo keep the cold from off my feet!",
    emoji: "👞",
    type: "lesson",
  },
  {
    title: "Eensy Weensy Spider",
    text: "The eensy weensy spider,\nClimbed up the water spout...\nDown came the rain,\nAnd washed the spider out.\n\nOut came the sun,\nAnd dried up all the rain...\nAnd the eensy weensy spider,\nClimbed up the spout again!",
    emoji: "🕷️",
    type: "lesson",
  },
];

const animalsLessons: LessonContent[] = [
  {
    title: "Lesson 1: Pets",
    text: "Pets are animals that live at home with us! They are our best friends.",
    emoji: "🐶",
    type: "lesson",
    scenes: [
      { text: "Dogs say woof woof! They love to play and run.", emoji: "🐶", objectName: "Dog", interaction: { type: "choose", prompt: "Which one is a dog?", options: ["🐱", "🐶", "🐟"], answerIndex: 1 } },
      { text: "Cats say meow! They love to sleep in the warm sun.", emoji: "🐱", objectName: "Cat", interaction: { type: "choose", prompt: "Which one is a cat?", options: ["🐶", "🐹", "🐱"], answerIndex: 2 } },
      { text: "Goldfish swim in bowls! Blub, blub, blub.", emoji: "🐟", objectName: "Goldfish" },
    ]
  },
  {
    title: "Lesson 2: Farm Animals",
    text: "Farm animals live on big farms and help us! Let's meet them.",
    emoji: "🐄",
    type: "lesson",
    scenes: [
      { text: "Cows say moooo! Cows give us yummy milk.", emoji: "🐄", objectName: "Cow", interaction: { type: "choose", prompt: "Which one is a cow?", options: ["🐄", "🐑", "🐖"], answerIndex: 0 } },
      { text: "Pigs say oink oink! Pigs love rolling in the mud.", emoji: "🐖", objectName: "Pig", interaction: { type: "choose", prompt: "Where is the pig?", options: ["🐓", "🐖", "🐎"], answerIndex: 1 } },
      { text: "Chickens say cluck cluck! They lay eggs for breakfast.", emoji: "🐓", objectName: "Chicken" },
    ]
  },
  {
    title: "Lesson 3: Wild Animals",
    text: "Wild animals live far away in jungles and forests! They are very amazing.",
    emoji: "🦁",
    type: "lesson",
    scenes: [
      { text: "Lions say ROAR! They are the kings of the jungle.", emoji: "🦁", objectName: "Lion", interaction: { type: "choose", prompt: "Find the roaring lion!", options: ["🐻", "🐘", "🦁"], answerIndex: 2 } },
      { text: "Elephants have huge ears and a long trunk! Trumpet!", emoji: "🐘", objectName: "Elephant", interaction: { type: "choose", prompt: "Which one is an elephant?", options: ["🐘", "🦒", "🦓"], answerIndex: 0 } },
      { text: "Monkeys love swinging on high trees!", emoji: "🐒", objectName: "Monkey" },
    ]
  },
];

const shapesLessons: LessonContent[] = [
  {
    title: "Lesson 1: Circle",
    text: "A circle is round like a wheel! It goes round and round with no corners.",
    emoji: "🔵",
    type: "lesson",
    scenes: [
      {
        text: "Look at the smooth edge. A circle is perfectly round everywhere!",
        emoji: "🔵",
        interaction: {
          type: "choose",
          prompt: "Which of these is a circle?",
          options: ["🟦 Square", "🔵 Circle", "🔺 Triangle"],
          answerIndex: 1,
        },
      },
      {
        text: "Can you think of a wheel? A wheel is a circle that rolls! Car wheels, bicycle wheels, all circles!",
        emoji: "🛞",
      },
    ],
  },
  {
    title: "Lesson 2: Square",
    text: "A square has four equal sides! Like a box or a window in your house.",
    emoji: "⏹️",
    type: "lesson",
    scenes: [
      {
        text: "Look closely, all four sides of a square are exactly the same length!",
        emoji: "⏹️",
        interaction: {
          type: "choose",
          prompt: "Which of these has 4 equal sides?",
          options: ["🔵 Circle", "⭐ Star", "🟩 Square"],
          answerIndex: 2,
        },
      },
      {
        text: "Building blocks are often shaped like squares. Let's stack them up high!",
        emoji: "📦",
      },
    ],
  },
  {
    title: "Lesson 3: Triangle",
    text: "A triangle has three sides and three sharp points! Like a delicious slice of pizza.",
    emoji: "🔺",
    type: "lesson",
    scenes: [
      {
        text: "Count the points! 1, 2, 3! All triangles have three sharp points.",
        emoji: "🔺",
        interaction: {
          type: "choose",
          prompt: "Can you find the triangle?",
          options: ["🔺 Triangle", "🔵 Circle", "⏹️ Square"],
          answerIndex: 0,
        },
      },
      {
        text: "A slice of pizza or a roof on a house... both are shaped like triangles!",
        emoji: "⛺",
      },
    ],
  },
  {
    title: "Lesson 4: Star",
    text: "A star shines bright in the night sky! It has five little points.",
    emoji: "⭐",
    type: "lesson",
    scenes: [
      {
        text: "Stars are pointy all around! Many have five points.",
        emoji: "⭐",
        interaction: {
          type: "choose",
          prompt: "Find the glowing star!",
          options: ["🔴 Circle", "⭐ Star", "🌊 Blue"],
          answerIndex: 1,
        },
      },
      {
        text: "Twinkle twinkle little star, how I wonder what you are!",
        emoji: "✨",
      },
    ],
  },
  {
    title: "Lesson 5: Rectangle",
    text: "A rectangle has four sides too, but two are long and two are short!",
    emoji: "▭",
    type: "lesson",
    scenes: [
      {
        text: "Imagine pulling a square to make it longer... that's a rectangle!",
        emoji: "🚪",
        interaction: {
          type: "choose",
          prompt: "Which shape is a rectangle?",
          options: ["🔵 Circle", "🟩 Square", "📙 Book"],
          answerIndex: 2,
        },
      },
      {
        text: "A door, a phone, and a book are all rectangles. Look around your house for rectangles!",
        emoji: "📘",
      },
    ],
  },
];

const numbersLessons: LessonContent[] = [
  {
    title: "Lesson 1: Numbers 1 to 3",
    text: "Let's learn how to count to three! One, two, three! Are you ready?",
    emoji: "🔢",
    type: "lesson",
    scenes: [
      { text: "This is number ONE! One is like a single apple.", emoji: "1️⃣ 🍎", objectName: "One", interaction: { type: "choose", prompt: "Which is number 1?", options: ["2️⃣", "1️⃣", "3️⃣"], answerIndex: 1 } },
      { text: "This is number TWO! Two is like a pair of shoes. One, two!", emoji: "2️⃣ 👟", objectName: "Two", interaction: { type: "choose", prompt: "Which is number 2?", options: ["3️⃣", "1️⃣", "2️⃣"], answerIndex: 2 } },
      { text: "This is number THREE! A tricycle has three wheels. One, two, three!", emoji: "3️⃣ 🚲", objectName: "Three", interaction: { type: "choose", prompt: "Which is number 3?", options: ["3️⃣", "2️⃣", "4️⃣"], answerIndex: 0 } },
    ]
  },
  {
    title: "Lesson 2: Numbers 4 to 6",
    text: "Let's learn numbers four, five, and six! Let's keep counting!",
    emoji: "🔢",
    type: "lesson",
    scenes: [
      { text: "This is number FOUR! Four is like a car with four wheels.", emoji: "4️⃣ 🚗", objectName: "Four", interaction: { type: "choose", prompt: "Find number 4!", options: ["5️⃣", "2️⃣", "4️⃣"], answerIndex: 2 } },
      { text: "This is number FIVE! You have five fingers on your hand! High five!", emoji: "5️⃣ ✋", objectName: "Five", interaction: { type: "choose", prompt: "Find number 5!", options: ["4️⃣", "5️⃣", "6️⃣"], answerIndex: 1 } },
      { text: "This is number SIX! An insect has six legs. Let's count them all!", emoji: "6️⃣ 🐞", objectName: "Six" }
    ]
  },
  {
    title: "Lesson 3: Numbers 7 to 10",
    text: "Almost to ten! Let's count seven, eight, nine, and ten!!",
    emoji: "🌟",
    type: "lesson",
    scenes: [
      { text: "This is number SEVEN! Seven colors in a beautiful rainbow.", emoji: "7️⃣ 🌈", objectName: "Seven", interaction: { type: "choose", prompt: "Where is number 7?", options: ["7️⃣", "8️⃣", "9️⃣"], answerIndex: 0 } },
      { text: "This is number EIGHT! An octopus has eight long arms.", emoji: "8️⃣ 🐙", objectName: "Eight", interaction: { type: "choose", prompt: "Where is number 8?", options: ["1️⃣0️⃣", "7️⃣", "8️⃣"], answerIndex: 2 } },
      { text: "This is number NINE! Cats are said to have nine lives.", emoji: "9️⃣ 🐱", objectName: "Nine" },
      { text: "This is number TEN! Ten little toes on your two feet! We did it! One to Ten!", emoji: "🔟 👣", objectName: "Ten" }
    ]
  }
];

const lettersLessons: LessonContent[] = [
  {
    title: "Lesson 1: A to E",
    text: "Let's explore the first letters! A is for Apple, B is for Bear, C is for Cat, D is for Dog, and E is for Elephant!",
    emoji: "🍎",
    type: "lesson",
    scenes: [
      { text: "A is for Apple! Ah, ah, apple! Apples are red and crunchy.", emoji: "🍎", letter: "Aa", objectName: "Apple", interaction: { type: "choose", prompt: "Which one starts with A?", options: ["🍎 Apple", "🐶 Dog", "🐱 Cat"], answerIndex: 0 } },
      { text: "B is for Bear! Buh, buh, bear! Bears sleep all winter.", emoji: "🐻", letter: "Bb", objectName: "Bear", interaction: { type: "choose", prompt: "Which one starts with B?", options: ["🐘 Elephant", "🐻 Bear", "🍎 Apple"], answerIndex: 1 } },
      { text: "C is for Cat! Cuh, cuh, cat! Cats love to play. Meow!", emoji: "🐱", letter: "Cc", objectName: "Cat" },
      { text: "D is for Dog! Duh, duh, dog! Dogs are our best friends. Woof!", emoji: "🐶", letter: "Dd", objectName: "Dog" },
      { text: "E is for Elephant! Eh, eh, elephant! Elephants have large ears and a long trunk!", emoji: "🐘", letter: "Ee", objectName: "Elephant" },
    ],
  },
  {
    title: "Lesson 2: F to J",
    text: "Let's explore five more letters! F is for Fish, G is for Goat, H is for Hippo, I is for Iguana, and J is for Jaguar!",
    emoji: "🐟",
    type: "lesson",
    scenes: [
      { text: "F is for Fish! Fuh, fuh, fish! Fish swim in the deep blue ocean.", emoji: "🐟", letter: "Ff", objectName: "Fish", interaction: { type: "choose", prompt: "Which one starts with F?", options: ["🐻 Bear", "🐟 Fish", "🐐 Goat"], answerIndex: 1 } },
      { text: "G is for Goat! Guh, guh, goat! Goats love eating grass.", emoji: "🐐", letter: "Gg", objectName: "Goat" },
      { text: "H is for Hippo! Huh, huh, hippo! Hippos love to splash in the water.", emoji: "🦛", letter: "Hh", objectName: "Hippo" },
      { text: "I is for Iguana! Ih, ih, iguana! Iguanas are green lizards.", emoji: "🦎", letter: "Ii", objectName: "Iguana" },
      { text: "J is for Jaguar! Juh, juh, jaguar! Jaguars are very fast cats.", emoji: "🐆", letter: "Jj", objectName: "Jaguar" },
    ],
  },
  {
    title: "Lesson 3: K to O",
    text: "Let's explore more letters! K is for Kangaroo, L is for Lion, M is for Monkey, N is for Nest, and O is for Owl!",
    emoji: "🦘",
    type: "lesson",
    scenes: [
      { text: "K is for Kangaroo! Kuh, kuh, kangaroo! Kangaroos hop, hop, hop!", emoji: "🦘", letter: "Kk", objectName: "Kangaroo" },
      { text: "L is for Lion! Llllll, lion! The lion is king of the jungle. Roar!", emoji: "🦁", letter: "Ll", objectName: "Lion", interaction: { type: "choose", prompt: "Which one starts with L?", options: ["🐟 Fish", "🦁 Lion", "🦉 Owl"], answerIndex: 1 } },
      { text: "M is for Monkey! Mmmm, monkey! Monkeys swing from the trees.", emoji: "🐒", letter: "Mm", objectName: "Monkey" },
      { text: "N is for Nest! Nnnn, nest! Birds lay eggs in cozy nests.", emoji: "🪹", letter: "Nn", objectName: "Nest" },
      { text: "O is for Owl! Ah, ah, owl! Owls stay awake at night.", emoji: "🦉", letter: "Oo", objectName: "Owl" },
    ],
  },
  {
    title: "Lesson 4: P to T",
    text: "Let's explore more letters! P is for Panda, Q is for Quail, R is for Rabbit, S is for Snake, and T is for Tiger!",
    emoji: "🐼",
    type: "lesson",
    scenes: [
      { text: "P is for Panda! Puh, puh, panda! Pandas eat lots of bamboo.", emoji: "🐼", letter: "Pp", objectName: "Panda" },
      { text: "Q is for Quail! Qwuh, qwuh, quail! A quail is a small bird.", emoji: "🐦", letter: "Qq", objectName: "Quail" },
      { text: "R is for Rabbit! Rrrr, rabbit! Rabbits love eating carrots.", emoji: "🐇", letter: "Rr", objectName: "Rabbit", interaction: { type: "choose", prompt: "Which one starts with R?", options: ["🐼 Panda", "🐇 Rabbit", "🐍 Snake"], answerIndex: 1 } },
      { text: "S is for Snake! Sssss, snake! Snakes slither on the ground.", emoji: "🐍", letter: "Ss", objectName: "Snake" },
      { text: "T is for Tiger! Tuh, tuh, tiger! Tigers have beautiful stripes.", emoji: "🐅", letter: "Tt", objectName: "Tiger" },
    ],
  },
  {
    title: "Lesson 5: U to Z",
    text: "The final letters! U is for Unicorn, V is for Vulture, W is for Whale, X is for X-ray, Y is for Yak, and Z is for Zebra!",
    emoji: "🦄",
    type: "lesson",
    scenes: [
      { text: "U is for Unicorn! Unicorns are magical creatures.", emoji: "🦄", letter: "Uu", objectName: "Unicorn" },
      { text: "V is for Vulture! Vuh, vuh, vulture! Vultures fly high gracefully.", emoji: "🦅", letter: "Vv", objectName: "Vulture" },
      { text: "W is for Whale! Wuh, wuh, whale! Whales are the largest ocean animals.", emoji: "🐋", letter: "Ww", objectName: "Whale", interaction: { type: "choose", prompt: "Which one starts with W?", options: ["🐋 Whale", "🦓 Zebra", "🦄 Unicorn"], answerIndex: 0 } },
      { text: "X is for X-ray! X-rays let us see through things!", emoji: "🩻", letter: "Xx", objectName: "X-ray" },
      { text: "Y is for Yak! Yuh, yuh, yak! Yaks have a lot of fur to stay warm.", emoji: "🐂", letter: "Yy", objectName: "Yak" },
      { text: "Z is for Zebra! Zuh, zuh, zebra! Zebras have black and white stripes.", emoji: "🦓", letter: "Zz", objectName: "Zebra" },
    ],
  },
];

const colorsLessons: LessonContent[] = [
  {
    title: "Lesson 1: Primary Colors",
    text: "Let's learn the primary colors! Red, Blue, and Yellow!",
    emoji: "🎨",
    type: "lesson",
    scenes: [
      { text: "Red is bright and warm! Apples and strawberries are red.", emoji: "🍎", objectName: "Red", interaction: { type: "choose", prompt: "Which is a red apple?", options: ["🔵", "🍎", "🟡"], answerIndex: 1 } },
      { text: "Blue is cool and calm! The sky and the ocean are blue.", emoji: "🌊", objectName: "Blue", interaction: { type: "choose", prompt: "Find the blue wave!", options: ["🌊", "🔥", "⛰️"], answerIndex: 0 } },
      { text: "Yellow shines like the warm sun! Bananas are yellow too.", emoji: "🍌", objectName: "Yellow", interaction: { type: "choose", prompt: "Find the yellow sun!", options: ["☀️", "🌙", "☁️"], answerIndex: 0 } },
    ],
  },
  {
    title: "Lesson 2: Secondary Colors",
    text: "Secondary colors are made by mixing primary colors! Green, Orange, and Purple!",
    emoji: "🧪",
    type: "lesson",
    scenes: [
      { text: "Green is the color of nature! Leaves, frogs, and grass are green.", emoji: "🐸", objectName: "Green", interaction: { type: "choose", prompt: "Which is a green frog?", options: ["🐸", "🐷", "🦋"], answerIndex: 0 } },
      { text: "Orange is bright and fun! Oranges and pumpkins are orange.", emoji: "🎃", objectName: "Orange", interaction: { type: "choose", prompt: "Find the orange pumpkin!", options: ["🍎", "🎃", "🍇"], answerIndex: 1 } },
      { text: "Purple is magical! Grapes and eggplants are purple.", emoji: "🍇", objectName: "Purple", interaction: { type: "choose", prompt: "Where are the purple grapes?", options: ["🍌", "🍏", "🍇"], answerIndex: 2 } },
    ],
  },
  {
    title: "Lesson 3: Light & Dark",
    text: "Colors can be light or dark! A light blue sky, or a dark blue night.",
    emoji: "🌗",
    type: "lesson",
    scenes: [
      { text: "Light colors have lots of white in them! Like a soft pink flower.", emoji: "🌸", interaction: { type: "choose", prompt: "Which flower is pink?", options: ["🌸", "🌻", "🥀"], answerIndex: 0 } },
      { text: "Dark colors have black mixed in! Like the deep dark ocean.", emoji: "🌊" },
      { text: "Mixing black and white makes grey! Grey clouds mean rain.", emoji: "🌧️" },
    ],
  },
];

const storiesLessons: LessonContent[] = [
  {
    title: "The Thirsty Crow",
    text: "Once, a thirsty crow found a pitcher with a little water in it. He couldn't reach the water. So, he dropped pebbles in one by one until the water rose to the top! Then he drank the water and flew away. The lesson is: Where there is a will, there is a way.",
    emoji: "🐦",
    type: "lesson",
    scenes: [
      {
        text: "It was a hot summer day. A thirsty crow flew across the fields looking for water.",
        emoji: "🐦 ☀️",
      },
      {
        text: "The crow found a pitcher with a little water in it at the bottom.",
        emoji: "🐦 🏺",
        interaction: {
          type: "find",
          options: ["🏺", "🌳", "🍎"],
          answerIndex: 0,
          prompt: "Find the pitcher!",
        },
      },
      {
        text: "He tried to drink from it, but his beak couldn't reach the water. He was very sad.",
        emoji: "🐦 😣",
      },
      {
        text: "Then, he saw some pebbles nearby and got a clever idea!",
        emoji: "🐦 💡",
      },
      {
        text: "He dropped the pebbles into the pitcher one by one.",
        emoji: "🪨 🏺",
        interaction: {
          type: "choose",
          options: ["🍃", "🪨", "🥖"],
          answerIndex: 1,
          prompt: "What did the crow drop in?",
        },
      },
      {
        text: "Slowly, the water rose to the top! He drank the water and flew away happily.",
        emoji: "🐦 💧 ✨",
      },
      {
        text: "The lesson learned: Where there is a will, there is a way!",
        emoji: "🧠 🎓 ✨",
      },
    ],
  },
  {
    title: "The Tortoise & The Hare",
    text: "The hare bragged about how fast he could run and challenged the slow tortoise to a race. The hare ran fast but stopped to take a nap. The tortoise walked slowly but never stopped, and won the race! The lesson is: Slow and steady wins the race.",
    emoji: "🐢",
    type: "lesson",
    scenes: [
      {
        text: "There was once a hare who bragged about how fast he could run.",
        emoji: "🐇 💨",
      },
      {
        text: "He challenged the slow tortoise to a race, laughing at him.",
        emoji: "🐇 🏁 🐢",
      },
      {
        text: "The race started! The hare ran extremely fast and was soon far ahead.",
        emoji: "🐇 ⚡🌳",
      },
      {
        text: "Thinking he had plenty of time, the hare stopped under a tree to take a nap.",
        emoji: "🐇 💤",
        interaction: {
          type: "find",
          options: ["🏃", "💤", "🍎"],
          answerIndex: 1,
          prompt: "The hare is sleeping! Find the Zzzs.",
        },
      },
      {
        text: "Meanwhile, the tortoise kept walking, slowly but steadily, and never stopped.",
        emoji: "🐢 🚶",
      },
      {
        text: "When the hare woke up, he saw the tortoise crossing the finish line!",
        emoji: "😲 🐇",
      },
      {
        text: "The tortoise won the race!",
        emoji: "🐢 🏆 ✨",
        interaction: {
          type: "find",
          options: ["🥇", "🏆", "🪁"],
          answerIndex: 1,
          prompt: "Find the trophy!",
        },
      },
      {
        text: "The lesson learned: Slow and steady wins the race!",
        emoji: "🧠 🎓 ✨",
      },
    ],
  },
  {
    title: "The Lion & The Mouse",
    text: "A small mouse accidentally woke up a sleeping lion. The lion let the mouse go. Later, the lion got caught in a net. The little mouse heard the lion roar and chewed through the ropes to free him! The lesson is: Even the smallest creature can help the biggest.",
    emoji: "🦁",
    type: "lesson",
    scenes: [
      {
        text: "One day, a huge lion was sleeping peacefully in the forest.",
        emoji: "🦁 💤 🌳",
      },
      {
        text: "A small mouse accidentally ran across the lion's nose and woke him up!",
        emoji: "🐁 🦁 😲",
      },
      {
        text: "The angry lion caught the mouse, but the mouse begged for his life.",
        emoji: "🦁 🐾 🐁",
      },
      {
        text: "The lion laughed at the idea that a mouse could help him, but let him go.",
        emoji: "🦁 😂 👋",
      },
      {
        text: "A few days later, hunters trapped the lion in a strong net.",
        emoji: "🦁 🕸️ 😣",
        interaction: {
          type: "find",
          options: ["🕸️", "🌲", "📦"],
          answerIndex: 0,
          prompt: "Find the net catching the lion!",
        },
      },
      {
        text: "The little mouse heard the lion's roar and came running.",
        emoji: "🐁 🏃 🔊",
      },
      {
        text: "He chewed through the thick ropes with his sharp teeth to free him!",
        emoji: "🐁 🦷 🦁 ✨",
        interaction: {
          type: "choose",
          options: ["🐁", "🐘", "🐒"],
          answerIndex: 0,
          prompt: "Who saved the lion?",
        },
      },
      {
        text: "The lesson learned: Even the smallest friends can do big things!",
        emoji: "🧠 🎓 ✨",
      },
    ],
  },
  {
    title: "The Boy Who Cried Wolf",
    text: "A boy watched sheep and tricked villagers by crying 'Wolf!' when there was none. When a real wolf came, he cried for help but nobody believed him. The lesson is: No one believes a liar, even when they tell the truth.",
    emoji: "👦",
    type: "lesson",
    scenes: [
      {
        text: "There was a shepherd boy who watched his sheep near a village.",
        emoji: "👦 🐑 ⛰️",
      },
      {
        text: "He got bored and decided to play a trick. He cried out, 'Wolf!'",
        emoji: "👦 🗣️ 🐺",
      },
      {
        text: "The villagers ran up the hill to help, but saw there was no wolf.",
        emoji: "👨‍🌾 🏃 ❌",
      },
      {
        text: "The boy just laughed at them. Soon after, he did the same trick again.",
        emoji: "👦 😂 👥",
      },
      {
        text: "But later that day, a real, scary wolf actually came out of the forest!",
        emoji: "🐺 🌲 😱",
      },
      {
        text: "The boy cried for help, but the villagers thought it was another trick.",
        emoji: "👦 🗣️ 🙅‍♂️",
      },
      {
        text: "Nobody came to help, and the wolf chased the sheep away.",
        emoji: "🐺 🐑 🏃",
        interaction: {
          type: "find",
          options: ["🐑", "🐺", "🐄"],
          answerIndex: 1,
          prompt: "Find the real wolf!",
        },
      },
      {
        text: "The lesson learned: Nobody believes a liar, even if they tell the truth!",
        emoji: "🧠 🎓 ✨",
      },
    ],
  },
  {
    title: "The Golden Goose",
    text: "A farmer had a goose that laid one golden egg every day. He became greedy and wanted all the gold at once, so he cut the goose open, but found nothing! The lesson is: Greed leads to ruin.",
    emoji: "🪿",
    type: "lesson",
    scenes: [
      {
        text: "A poor farmer was lucky enough to own a very special goose.",
        emoji: "👨‍🌾 🪿 🛖",
      },
      {
        text: "Every single day, this amazing goose laid one shiny, golden egg.",
        emoji: "🪿 🥚 ✨",
        interaction: {
          type: "find",
          options: ["🍎", "🥚", "🍞"],
          answerIndex: 1,
          prompt: "Find the golden egg!",
        },
      },
      {
        text: "The farmer sold the eggs and slowly became very rich.",
        emoji: "👨‍🌾 💰 📈",
      },
      {
        text: "But soon, the farmer became greedy. He didn't want to wait day by day.",
        emoji: "👨‍🌾 🤑 ⏳",
      },
      {
        text: "He thought the goose must be full of gold inside.",
        emoji: "👨‍🌾 🤔 🪙",
      },
      {
        text: "He cut the goose open to get all the gold at once, but found nothing!",
        emoji: "👨‍🌾 🪿 ❌",
      },
      {
        text: "He had lost his special goose and would never get more golden eggs.",
        emoji: "😭 📉 💸",
      },
      {
        text: "The lesson learned: Greed leads to ruin. Be happy with what you have!",
        emoji: "🧠 🎓 ✨",
      },
    ],
  },
  {
    title: "The Fox and the Grapes",
    text: "A hungry fox saw some ripe grapes high on a vine. He jumped and jumped, but couldn't reach them. Giving up, he told himself they were probably sour anyway! The lesson is: It's easy to despise what you cannot get.",
    emoji: "🦊",
    type: "lesson",
    scenes: [
      { text: "On a hot day, a hungry fox was walking through a quiet orchard.", emoji: "🦊 ☀️ 🌳" },
      { text: "He saw a delicious-looking bunch of purple grapes hanging high on a vine.", emoji: "🦊 👀 🍇" },
      { text: "'Those grapes will perfectly quench my thirst!' he said to himself.", emoji: "🦊 🤤 🍇" },
      { text: "He took a running jump, but missed the grapes by a few inches.", emoji: "🦊 💨 ❌", interaction: { type: "choose", prompt: "Did he reach them?", options: ["Yes", "No"], answerIndex: 1 } },
      { text: "He tried again and again, jumping as high as he could, but failed every time.", emoji: "🦊 🦘 😓" },
      { text: "Finally, tired and out of breath, he gave up and sat on the ground.", emoji: "🦊 喘 ⬇️" },
      { text: "As he walked away, he muttered, 'I'm sure those grapes were sour anyway!'", emoji: "🦊 🍋 🚶" },
      { text: "The lesson learned: It is easy to despise what you cannot get.", emoji: "🧠 🎓 ✨" },
    ]
  },
  {
    title: "The Ant and the Grasshopper",
    text: "While the ant worked hard all summer storing food, the grasshopper just sang and played. When winter came, the ant was warm and fed, but the grasshopper was freezing and hungry. The lesson is: Prepare today for the needs of tomorrow.",
    emoji: "🐜",
    type: "lesson",
    scenes: [
      { text: "It was a beautiful summer day. A grasshopper was hopping about, playing his fiddle.", emoji: "🦗 🎻 ☀️" },
      { text: "An ant passed by, carrying a heavy grain of wheat to his nest.", emoji: "🐜 🌾 💦" },
      { text: "The grasshopper laughed. 'Why work so hard? Come and play with me!'", emoji: "🦗 😂 🎾" },
      { text: "'I am storing food for the winter,' the ant replied. 'You should do the same.'", emoji: "🐜 ❄️ 🍎", interaction: { type: "choose", prompt: "What was the ant preparing for?", options: ["Winter", "A party", "Bedtime"], answerIndex: 0 } },
      { text: "But the grasshopper didn't listen and went back to his playing.", emoji: "🦗 🎵 🌻" },
      { text: "When the cold winter arrived, the ground was covered in deep snow.", emoji: "❄️ 🌨️ 🥶" },
      { text: "The grasshopper had no food. He went to the ant's house and begged for a crumb.", emoji: "🦗 🥣 🚪" },
      { text: "The ant said, 'If you had worked in summer, you wouldn't be hungry now.'", emoji: "🐜 🍞 ☝️" },
      { text: "The lesson learned: Prepare today for the needs of tomorrow. There is a time for work and a time for play.", emoji: "🧠 🎓 ✨" },
    ]
  },
  {
    title: "The Dog and His Reflection",
    text: "A dog stole a juicy bone and was carrying it home. While crossing a bridge, he saw his reflection in the water and thought it was another dog with a bigger bone. Snapping at it, he dropped his own bone into the river! The lesson is: Be content with what you have.",
    emoji: "🐕",
    type: "lesson",
    scenes: [
      { text: "A stray dog found a lovely, juicy bone and snatched it up in his mouth.", emoji: "🐕 🍖 🏃" },
      { text: "He hurried home to eat it in peace, feeling very lucky.", emoji: "🐕 😋 🏡" },
      { text: "On his way, he had to cross a narrow wooden bridge over a deep stream.", emoji: "🐕 🌉 💧" },
      { text: "Looking down, he saw his own reflection staring back at him from the water.", emoji: "🐕 👀 💦" },
      { text: "The dog didn't know it was his reflection. He thought it was another dog!", emoji: "🐕 💭 🐕", interaction: { type: "choose", prompt: "What did the dog see?", options: ["A fish", "His reflection", "A cat"], answerIndex: 1 } },
      { text: "He thought, 'That dog's bone looks bigger than mine! I want it!'", emoji: "🐕 🤤 🍖" },
      { text: "Greedy for more, he opened his mouth to bark at the other dog.", emoji: "🐕 🗣️ 💢" },
      { text: "SPLASH! His own bone fell out of his mouth and sank to the bottom of the stream.", emoji: "🍖 💦 😭" },
      { text: "The greedy dog was left with nothing but his hungry tummy.", emoji: "🐕 😔 💨" },
      { text: "The lesson learned: Be content with what you have. Greed loses everything.", emoji: "🧠 🎓 ✨" },
    ]
  },
  {
    title: "The Wind and the Sun",
    text: "The Wind and the Sun argued over who was stronger. They tried to make a traveler take off his coat. The Wind blew fiercely, but he held it tighter. The Sun shone warmly, and the traveler took it off willingly. The lesson is: Gentleness is better than force.",
    emoji: "☀️",
    type: "lesson",
    scenes: [
      { text: "The mighty North Wind and the bright Sun had a big argument about who was stronger.", emoji: "🌬️ ⚡ ☀️" },
      { text: "They saw a traveler walking along the road wearing a thick, heavy coat.", emoji: "🚶 🧥 👀" },
      { text: "'Whoever can make that traveler take off his coat is the strongest,' agreed the Sun.", emoji: "☀️ 🤝 🌬️" },
      { text: "The Wind went first. He blew as hard and fiercely as he possibly could.", emoji: "🌬️ 💨 🌪️", interaction: { type: "choose", prompt: "Who went first?", options: ["The Moon", "The Wind", "The Sun"], answerIndex: 1 } },
      { text: "But the harder he blew, the tighter the shivering traveler held onto his coat.", emoji: "🚶 🥶 🧥" },
      { text: "Finally, the Wind gave up. Now, it was the Sun's turn to try.", emoji: "🌬️ 😓 👎" },
      { text: "The Sun came out and shone brightly, sending warm, gentle rays down to the earth.", emoji: "☀️ ✨ 🌡️" },
      { text: "The traveler felt the pleasant heat. He stopped walking and began to sweat.", emoji: "🚶 🥵 💧" },
      { text: "Soon, it was so hot that the traveler willingly took off his thick coat.", emoji: "👕 🧥 🙌" },
      { text: "The lesson learned: Gentleness and warm persuasion are stronger than force and anger.", emoji: "🧠 🎓 ✨" },
    ]
  },
  {
    title: "The Two Frogs",
    text: "Two frogs fell into a deep pit. The other frogs said it was too deep and they shouldn't try to jump. One frog listened and gave up, dying. The other was deaf, thought they were cheering him on, and jumped until he escaped! The lesson is: Ignore negative people.",
    emoji: "🐸",
    type: "lesson",
    scenes: [
      { text: "A group of frogs was traveling through the woods when two of them fell into a deep pit.", emoji: "🐸 🐸 🕳️" },
      { text: "The other frogs gathered around the top of the pit. 'It's too deep! You'll never get out!' they yelled.", emoji: "🐸 🗣️ 🙅‍♂️" },
      { text: "The two frogs ignored them and tried jumping with all their might.", emoji: "🐸 🦘 💦" },
      { text: "But the frogs above kept saying, 'Stop trying! Just give up!'", emoji: "🐸 👎 🛑" },
      { text: "Hearing this, one of the frogs lost hope, gave up, and sadly died.", emoji: "🐸 😔 💀", interaction: { type: "choose", prompt: "What did one frog do?", options: ["Flew out", "Give up", "Dug a hole"], answerIndex: 1 } },
      { text: "The other frog continued to jump as hard as he could.", emoji: "🐸 🌟 💪" },
      { text: "The crowd yelled louder for him to stop the pain and just give up.", emoji: "🐸 📣 😤" },
      { text: "But the frog jumped even harder and suddenly, he made it out of the pit!", emoji: "🐸 ✨ 🙌" },
      { text: "The other frogs asked, 'Did you not hear us?' The frog explained that he was deaf.", emoji: "🐸 👂 ❌" },
      { text: "He thought they were cheering him on the whole time! His deafness saved him.", emoji: "🐸 🥰 📣" },
      { text: "The lesson learned: Words have power. Always encourage others, and ignore negative voices!", emoji: "🧠 🎓 ✨" },
    ]
  },
  {
    title: "The Magic Brush",
    text: "A poor boy named Ma Liang loved to draw but couldn't afford a brush. A magical man gave him a brush that brought everything he painted to life! He helped poor villagers, but a greedy emperor stole the brush. Ma Liang tricked the emperor and escaped. The lesson is: Use your gifts for good.",
    emoji: "🖌️",
    type: "lesson",
    scenes: [
      { text: "Ma Liang was a poor boy who loved drawing. He drew with a stick in the sand because he had no brush.", emoji: "👦 🪵 🏖️" },
      { text: "One night, an old man appeared in his dream and gave him a magic paintbrush.", emoji: "🧙‍♂️ ✨ 🖌️" },
      { text: "When Ma Liang woke up, the brush was real! He painted a bird, and it flew right off the paper!", emoji: "👦 🐦 ✨" },
      { text: "He realized the brush's power and decided to only use it to help the poor villagers.", emoji: "👦 ❤️ 🛖", interaction: { type: "choose", prompt: "Who did he help?", options: ["The rich", "The poor", "The angry"], answerIndex: 1 } },
      { text: "He painted a plow for a farmer, a net for a fisherman, and food for the hungry.", emoji: "🖌️ 🌾 🐟" },
      { text: "Word reached a greedy emperor. He sent his guards to arrest Ma Liang and steal the brush.", emoji: "👑 💂‍♂️ 😠" },
      { text: "The emperor tried to paint a mountain of gold, but it just became a pile of ordinary rocks.", emoji: "👑 🖌️ 🪨" },
      { text: "The magic only worked for Ma Liang! The emperor forced him to draw an island of gold.", emoji: "👑 🗣️ 🏝️" },
      { text: "Ma Liang drew the island, and then a ship for the emperor to sail there.", emoji: "🖌️ ⛵ 🏝️" },
      { text: "Once the greedy emperor and his guards were on the ship, Ma Liang painted a huge storm!", emoji: "🖌️ 🌪️ 🌊" },
      { text: "The ship was blown far away, and they never returned. Ma Liang returned to helping people.", emoji: "👦 🏠 ❤️" },
      { text: "The lesson learned: Always use your talents to do good, not for selfish greed.", emoji: "🧠 🎓 ✨" },
    ]
  },
  {
    title: "The Oak and the Reeds",
    text: "A giant, proud oak tree mocked the thin, flexible reeds for bending in the wind. A terrible hurricane arrived. The oak tree stood stiff and fought the wind, but was uprooted and destroyed. The reeds bent low with the wind and survived. The lesson is: Flexibility is better than stubbornness.",
    emoji: "🌳",
    type: "lesson",
    scenes: [
      { text: "A massive, proud oak tree stood by a river. Near it grew some thin, green reeds.", emoji: "🌳 🌊 🌾" },
      { text: "The oak boasted, 'I am strong and mighty! You reeds are weak and bend at every breeze.'", emoji: "🌳 🗣️ 🌾" },
      { text: "The reeds replied gently, 'We bend to stay safe. It is better to yield than to break.'", emoji: "🌾 😌 🍃" },
      { text: "Suddenly, a terrible, howling hurricane swept across the land.", emoji: "🌪️ 🌧️ 😱", interaction: { type: "choose", prompt: "What came?", options: ["A sunny day", "A hurricane", "A quiet night"], answerIndex: 1 } },
      { text: "The stubborn oak tree refused to bend. It fought the furious wind with all its might.", emoji: "🌳 😤 🌪️" },
      { text: "The wind blew harder, and with a loud CRACK, the heavy oak tree was uprooted and fell.", emoji: "🌳 💥 🪵" },
      { text: "The thin reeds bowed low to the ground. The wind blew right over them without causing harm.", emoji: "🌾 🙇 🌬️" },
      { text: "When the storm passed, the reeds stood back up, safe and sound, while the oak lay destroyed.", emoji: "🌾 ✨ 🪵" },
      { text: "The lesson learned: It is better to be flexible and yield than to be stubborn and break.", emoji: "🧠 🎓 ✨" },
    ]
  },
  {
    title: "The Town Mouse & Country Mouse",
    text: "A town mouse visits his cousin in the peaceful country but finds the food plain. He invites his cousin to the city for a feast. In the city, they eat delicious food but are constantly terrified by dogs and cats. The country mouse returns home. The lesson is: Better beans and bacon in peace than cakes and ale in fear.",
    emoji: "🐁",
    type: "lesson",
    scenes: [
      { text: "A Country Mouse invited his cousin, the Town Mouse, to visit his quiet country hole.", emoji: "🌾 🐭 🤝 🐭 🏙️" },
      { text: "He offered him simple food like roots, corn, and fresh water.", emoji: "🐭 🌽 💧" },
      { text: "The Town Mouse turned up his nose. 'This food is boring! Come to the city and eat like a king.'", emoji: "🏙️ 🐭 😒 👑" },
      { text: "So, the two mice traveled to a grand house in the bustling city.", emoji: "🐭 🐭 🚶 🏰", interaction: { type: "choose", prompt: "Where did they go?", options: ["To the beach", "To the city", "To the moon"], answerIndex: 1 } },
      { text: "They sneaked into the dining room and found a huge feast of cheese, cakes, and meat!", emoji: "🧀 🍰 🍗 😍" },
      { text: "Just as they started to eat, a huge, scary cat jumped onto the table with a loud MEOOOOW!", emoji: "🐈 😱 💢" },
      { text: "The mice ran for their lives and hid in a tiny, dark hole, trembling with fear.", emoji: "🐭 🐭 🕳️ 🥶" },
      { text: "The Country Mouse packed his tiny bag. 'I am going back to the country,' he said.", emoji: "🌾 🐭 🎒 👋" },
      { text: "The lesson learned: A simple, peaceful life is much better than a rich life full of fear and danger.", emoji: "🧠 🎓 ✨" },
    ]
  },
  {
    title: "The Peacock and the Crane",
    text: "A proud peacock brags to a crane about his magnificent, colorful feathers, mocking the crane's plain gray feathers. The crane replies that his feathers allow him to fly high up into the clouds and see the world, while the peacock can only walk on the dirt. The lesson is: Usefulness is better than just looking beautiful.",
    emoji: "🦚",
    type: "lesson",
    scenes: [
      { text: "A peacock was very proud of his beautiful, shimmering tail feathers.", emoji: "🦚 ✨ 😍" },
      { text: "He strutted around the forest every day, showing off his magnificent colors.", emoji: "🦚 🚶 🌲" },
      { text: "One day, he met a crane by a quiet pond. The crane had very plain gray feathers.", emoji: "🦚 🤝 🦩" },
      { text: "The peacock sneered, 'Look at my glorious feathers! You look so dull and grey.'", emoji: "🦚 👑 😒", interaction: { type: "choose", prompt: "Who had the colorful feathers?", options: ["The crane", "The peacock", "The owl"], answerIndex: 1 } },
      { text: "The crane looked at the peacock's heavy tail, then looked up at the vast blue sky...", emoji: "🦩 👀 ☁️" },
      { text: "'It is true,' the crane replied. 'Your feathers are much more beautiful than mine.'", emoji: "🦩 🗣️ ✨" },
      { text: "'But my plain feathers lift me high above the clouds. I can fly and see the whole world!'", emoji: "🦩 ☁️ 🌍" },
      { text: "'While you, with all your beautiful feathers, are stuck down here, walking in the dirt.'", emoji: "🦩 ⬇️ 🐓" },
      { text: "The lesson learned: True beauty and usefulness are more than just a fancy appearance.", emoji: "🧠 🎓 ✨" },
    ]
  },
  {
    title: "The Bear and the Two Travelers",
    text: "Two travelers are walking through a forest when a huge bear appears. One friend quickly climbs a tree to hide, leaving the other behind. The second friend lies still, pretending to be dead. The bear sniffs him and leaves. The lesson is: True misfortune puts friendship to the test.",
    emoji: "🐻",
    type: "lesson",
    scenes: [
      { text: "Two friends, Jack and Leo, were traveling together through a dense, dark forest.", emoji: "🚶 🚶 🌲" },
      { text: "Suddenly, a huge, angry bear stepped out onto the path right in front of them!", emoji: "🐻 😱 🌲" },
      { text: "Jack panicked. Without warning Leo, he scrambled up the nearest tall tree to hide.", emoji: "Jack 🌳 🧗‍♂️" },
      { text: "Leo couldn't climb. Left alone, he fell flat on the ground and held his breath.", emoji: "Leo 🧍‍♂️ ⬇️", interaction: { type: "choose", prompt: "What did Leo do?", options: ["He fought the bear", "He played dead", "He ran away"], answerIndex: 1 } },
      { text: "The bear waddled over to Leo. It sniffed around his ears, his nose, and his neck.", emoji: "🐻 👃 Leo" },
      { text: "Leo stayed absolutely quiet. Thinking he was dead, the bear turned and walked away.", emoji: "🐻 🚶 🌲" },
      { text: "When the bear was gone, Jack climbed down. 'What did the bear whisper to you?' he joked.", emoji: "Jack 😁 🌳" },
      { text: "Leo looked at him coldly. 'He told me never to trust a friend who abandons me in danger.'", emoji: "Leo 😠 🗣️" },
      { text: "The lesson learned: A friend in need is a friend indeed. Misfortune tests true friendship.", emoji: "🧠 🎓 ✨" },
    ]
  }
];

export const getQuestions = (subject: string): GameQuestion[] => {
  let questions = [];
  switch (subject) {
    case "shapes":
      questions = shapesQuestions;
      break;
    case "numbers":
      questions = numbersQuestions;
      break;
    case "letters":
      questions = lettersQuestions;
      break;
    case "animals":
      questions = animalsQuestions;
      break;
    case "colors":
    default:
      questions = colorQuestions;
      break;
  }
  return [...questions].sort(() => 0.5 - Math.random());
};

export const getLessons = (subject: string): LessonContent[] => {
  let lessons = [];
  switch (subject) {
    case "rhymes":
      lessons = rhymesLessons;
      break;
    case "animals":
      lessons = animalsLessons;
      break;
    case "stories":
      lessons = storiesLessons;
      break;
    case "shapes":
      lessons = shapesLessons;
      break;
    case "numbers":
      lessons = numbersLessons;
      break;
    case "letters":
      lessons = lettersLessons;
      break;
    case "colors":
      lessons = colorsLessons;
      break;
    default:
      lessons = rhymesLessons;
      break;
  }
  return [...lessons];
};
