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
    title: "Puppy",
    text: "A young one of a dog is a puppy! Puppies love to play and say woof woof.",
    emoji: "🐶",
    type: "lesson",
    audioUrl:
      "https://upload.wikimedia.org/wikipedia/commons/1/15/Dog_barking_2.ogg",
  },
  {
    title: "Cow",
    text: "A cow makes a sound like Moo! Cows live on a farm and eat green grass.",
    emoji: "🐄",
    type: "lesson",
    audioUrl: "https://upload.wikimedia.org/wikipedia/commons/d/d3/Bovine.ogg",
  },
  {
    title: "Bird",
    text: "A bird lives in a cozy nest! Birds fly high in the sky and sing sweet songs.",
    emoji: "🐦",
    type: "lesson",
    audioUrl:
      "https://upload.wikimedia.org/wikipedia/commons/5/5e/Common_Blackbird_%28Turdus_merula%29_by_Isai_Xolo.ogg",
  },
  {
    title: "Kitten",
    text: "A young one of a cat is a kitten! Kittens love to sleep in the sun and say meow.",
    emoji: "🐱",
    type: "lesson",
    audioUrl:
      "https://upload.wikimedia.org/wikipedia/commons/1/1d/Cat_Meow_2.ogg",
  },
  {
    title: "Lion",
    text: "A lion lives in a den! Lions have loud roars and are the kings of the jungle.",
    emoji: "🦁",
    type: "lesson",
    audioUrl:
      "https://upload.wikimedia.org/wikipedia/commons/c/c2/Lion_Roar.ogg",
  },
];

const shapesLessons: LessonContent[] = [
  {
    title: "Circle",
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
        text: "Can you think of a wheel? A wheel is a circle that rolls!",
        emoji: "🛞",
      },
    ],
  },
  {
    title: "Square",
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
        text: "A box has square faces! Let's build with square blocks.",
        emoji: "📦",
      },
    ],
  },
  {
    title: "Triangle",
    text: "A triangle has three sides and three points! Like a slice of yummy pizza.",
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
        text: "A slice of pizza or a tent... both are triangles!",
        emoji: "⛺",
      },
    ],
  },
  {
    title: "Star",
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
    title: "Rectangle",
    text: "A rectangle has four sides, but two are long and two are short!",
    emoji: "▭",
    type: "lesson",
    scenes: [
      {
        text: "Like a door or a book, rectangles are tall or wide!",
        emoji: "🚪",
        interaction: {
          type: "choose",
          prompt: "Which shape is a rectangle?",
          options: ["🔵 Circle", "🟩 Square", "📙 Book"],
          answerIndex: 2,
        },
      },
      {
        text: "Imagine a box that someone pulled longer... that's a rectangle!",
        emoji: "📘",
      },
    ],
  },
];

const numbersLessons: LessonContent[] = [
  {
    title: "Number One",
    text: "One is like a single apple. Just one, standing all alone! Let's count: One!",
    emoji: "1️⃣",
    type: "lesson",
  },
  {
    title: "Number Two",
    text: "Two is like a pair of shoes. One for each foot! Let's count: One, Two!",
    emoji: "2️⃣",
    type: "lesson",
  },
  {
    title: "Number Three",
    text: "Three is like a tricycle with three wheels! Let's count: One, Two, Three!",
    emoji: "3️⃣",
    type: "lesson",
  },
  {
    title: "Number Four",
    text: "Four is like a car with four wheels! Let's count: One, Two, Three, Four!",
    emoji: "4️⃣",
    type: "lesson",
  },
  {
    title: "Number Five",
    text: "Five is like the fingers on one hand! Let's count: One, Two, Three, Four, Five! High five!",
    emoji: "5️⃣",
    type: "lesson",
  },
];

const lettersLessons: LessonContent[] = [
  {
    title: "Letter A",
    text: "A is for Apple! Apples are red and crunchy. Ah, Ah, Apple!",
    emoji: "🍎",
    type: "lesson",
  },
  {
    title: "Letter B",
    text: "B is for Bear! Bears are big and furry. Buh, Buh, Bear!",
    emoji: "🐻",
    type: "lesson",
  },
  {
    title: "Letter C",
    text: "C is for Cat! Cats love to play and say meow. Cuh, Cuh, Cat!",
    emoji: "🐱",
    type: "lesson",
  },
  {
    title: "Letter D",
    text: "D is for Dog! Dogs are man's best friend. Duh, Duh, Dog!",
    emoji: "🐶",
    type: "lesson",
  },
  {
    title: "Letter E",
    text: "E is for Elephant! Elephants have a long trunk. Eh, Eh, Elephant!",
    emoji: "🐘",
    type: "lesson",
  },
];

const colorsLessons: LessonContent[] = [
  {
    title: "Red",
    text: "Red is the color of a juicy strawberry or a bright fire engine!",
    emoji: "🍓",
    type: "lesson",
    scenes: [
      {
        text: "Red is warm and bright! Try finding something red.",
        emoji: "🍎",
        interaction: {
          type: "choose",
          prompt: "Which of these is red?",
          options: ["🟦 Blue box", "🔴 Red strawberry", "🟢 Green leaf"],
          answerIndex: 1,
        },
      },
      {
        text: "Fire trucks are red so everyone can see them quickly!",
        emoji: "🚒",
      },
    ],
  },
  {
    title: "Blue",
    text: "Blue is the color of the big sky and the deep ocean!",
    emoji: "🌊",
    type: "lesson",
    scenes: [
      {
        text: "Blue is cool and calm like the waves of the sea.",
        emoji: "💧",
        interaction: {
          type: "choose",
          prompt: "Which of these is blue?",
          options: ["🌊 Ocean waves", "☀️ Yellow sun", "🍓 Red apple"],
          answerIndex: 0,
        },
      },
      { text: "Look up on a clear day, the whole sky is blue!", emoji: "🌤️" },
    ],
  },
  {
    title: "Yellow",
    text: "Yellow is the color of the bright, warm sun and sweet bananas!",
    emoji: "☀️",
    type: "lesson",
    scenes: [
      {
        text: "Yellow shines just like gold and light! It's super happy.",
        emoji: "🌻",
        interaction: {
          type: "choose",
          prompt: "Find the yellow thing!",
          options: ["🔴 Red cherry", "🔵 Blue sky", "🍌 Sweet banana"],
          answerIndex: 2,
        },
      },
      { text: "Bees love yellow flowers! Buzz buzz!", emoji: "🐝" },
    ],
  },
  {
    title: "Green",
    text: "Green is the color of the grass and leaves on the trees!",
    emoji: "🍃",
    type: "lesson",
    scenes: [
      {
        text: "Green means nature and growing! Frogs and turtles are green.",
        emoji: "🐢",
        interaction: {
          type: "choose",
          prompt: "Which of these is green?",
          options: ["🐸 Little frog", "🔴 Stop sign", "🔵 Blue bird"],
          answerIndex: 0,
        },
      },
      {
        text: "When spring comes, everything turns green and beautiful!",
        emoji: "🌱",
      },
    ],
  },
  {
    title: "Orange",
    text: "Orange is the color of a sweet, juicy orange and crunchy carrots!",
    emoji: "🥕",
    type: "lesson",
    scenes: [
      {
        text: "Orange is bright and fun! Tigers and pumpkins are orange.",
        emoji: "🎃",
        interaction: {
          type: "choose",
          prompt: "Can you spot the orange object?",
          options: ["🔵 Blue whale", "🥕 Crunchy carrot", "🔴 Red rose"],
          answerIndex: 1,
        },
      },
      { text: "Did you know mixing Red and Yellow makes Orange?", emoji: "🎨" },
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
  return [...lessons].sort(() => 0.5 - Math.random());
};
