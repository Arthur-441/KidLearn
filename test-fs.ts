import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc, updateDoc } from "firebase/firestore";
import fs from "fs";

const config = JSON.parse(fs.readFileSync("firebase-applet-config.json", "utf8"));
export const app = initializeApp(config);
export const db = getFirestore(app);

// Oh wait, I can't simulate the logged-in user with the web SDK easily. I would need to parse credentials or use a test account.
