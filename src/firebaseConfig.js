// src/firebaseConfig.js
import dotenv from "dotenv";

dotenv.config();

export const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
  measurementId: process.env.VITE_FIREBASE_MEASUREMENT_ID,
};

// Проверка, что все переменные загружены
for (const [key, value] of Object.entries(firebaseConfig)) {
  if (!value && key !== "measurementId") { // measurementId опционален
    console.error(`Ошибка: ${key} не определен в .env`);
  }
}