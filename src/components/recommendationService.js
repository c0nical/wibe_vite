import { db } from "../firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import axios from "axios";

// Функция для перемешивания массива (Fisher-Yates shuffle)
const shuffleArray = (array) => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

// Получаем топ-3 жанра на основе избранного пользователя
export const getTopGenres = async (userId) => {
  try {
    if (!userId) {
      console.warn("No userId provided for getTopGenres");
      return [];
    }

    const q = query(collection(db, "favorites"), where("userId", "==", userId));
    const snapshot = await getDocs(q);
    const favorites = snapshot.docs.map((doc) => doc.data());
    console.log("Favorites:", favorites);

    const genreCount = {};
    if (!Array.isArray(favorites) || favorites.length === 0) {
      console.warn("Favorites is empty or not an array:", favorites);
      return [];
    }

    favorites.forEach((track) => {
      let genres = track.genres || [];

      // Если genres — объект, извлекаем genres.genres
      if (genres && !Array.isArray(genres)) {
        console.warn(`Track ${track.trackName} has object genres:`, genres);
        if (genres.genres && Array.isArray(genres.genres)) {
          genres = genres.genres;
        } else {
          console.warn(`Track ${track.trackName} has invalid genres format, skipping`);
          return;
        }
      }

      // Подсчитываем жанры, если это массив
      if (Array.isArray(genres)) {
        genres.forEach((genre) => {
          if (typeof genre === "string") {
            genreCount[genre] = (genreCount[genre] || 0) + 1;
          }
        });
      } else {
        console.warn(`Track ${track.trackName} has invalid genres:`, genres);
      }
    });

    const sortedGenres = Object.entries(genreCount)
      .sort(([, a], [, b]) => b - a)
      .map(([genre]) => genre);
    console.log("Top genres:", sortedGenres);

    return sortedGenres.slice(0, 3);
  } catch (error) {
    console.error("Error in getTopGenres:", error);
    return [];
  }
};

// Получаем рекомендованные треки на основе топ-жанров
export const getRecommendedTracks = async (userId, topGenres, offset = 0, randomSeed = Date.now()) => {
  try {
    if (!userId) {
      console.warn("No userId provided for getRecommendedTracks");
      return [];
    }

    const favoriteQuery = query(collection(db, "favorites"), where("userId", "==", userId));
    const favoriteSnapshot = await getDocs(favoriteQuery);
    const favoriteIds = favoriteSnapshot.docs.map((doc) => doc.data().trackId);
    console.log("Favorite track IDs:", favoriteIds);

    if (topGenres.length === 0) {
      console.warn("No genres provided for recommendations");
      return [];
    }

    console.log("Requesting with genres:", topGenres, "Offset:", offset, "RandomSeed:", randomSeed);

    const response = await axios.get("https://api.jamendo.com/v3.0/tracks/", {
      params: {
        client_id: import.meta.env.VITE_JAMENDO_API_KEY,
        format: "json",
        limit: 30, // Увеличиваем для большего пула треков
        tags: topGenres.join(" "), // OR-логика для жанров
        order: "popularity_total",
        boost: "popularity_total",
        offset: offset,
        include: "musicinfo",
        random: randomSeed, // Добавляем для разнообразия
      },
    });
    console.log("API response:", response.data);
    console.log("API results length:", response.data.results.length);

    // Маппинг жанров
    const genreMapping = {
      poprock: "pop",
      indie: "pop",
      electro: "electronic",
      electropop: "electronic",
      house: "electronic",
      dance: "electronic",
      countryrock: "country",
      folk: "country",
      funkyhouse: "electronic",
    };

    const filteredTracks = response.data.results
      .filter((track) => !favoriteIds.includes(track.id))
      .filter((track) => {
        const trackGenres = (track?.musicinfo?.tags?.genres || []).map((g) => genreMapping[g] || g);
        console.log(`Track ${track.name} mapped genres:`, trackGenres);
        if (!Array.isArray(trackGenres)) {
          console.warn(`Track ${track.name} has invalid genres:`, trackGenres);
          return false;
        }
        return trackGenres.some((genre) => topGenres.includes(genre));
      });

    // Перемешиваем треки и берём первые 10
    const shuffledTracks = shuffleArray(filteredTracks).slice(0, 10);
    console.log("Filtered and shuffled recommended tracks:", shuffledTracks);
    return shuffledTracks;
  } catch (error) {
    console.error("Error in getRecommendedTracks:", error);
    if (error.response) {
      console.error("API error response:", error.response.data);
    }
    return [];
  }
};