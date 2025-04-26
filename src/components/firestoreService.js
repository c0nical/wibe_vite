// firestoreService.js
import { db } from "../firebase";
import { doc, setDoc, deleteDoc, getDoc, collection, addDoc, updateDoc, arrayUnion, arrayRemove, getDocs } from "firebase/firestore";
import axios from "axios";

// Переключение трека в избранном
export const toggleFavoriteTrack = async (userId, track) => {
  if (!userId) {
    throw new Error("Пользователь не авторизован");
  }
  const trackRef = doc(db, `users/${userId}/favorites`, track.id);

  try {
    const docSnap = await getDoc(trackRef);
    if (docSnap.exists()) {
      await deleteDoc(trackRef);
      console.log(`Трек ${track.name} удалён из избранного`);
      return false;
    } else {
      const response = await axios.get("https://api.jamendo.com/v3.0/tracks/", {
        params: {
          client_id: import.meta.env.VITE_JAMENDO_API_KEY,
          format: "json",
          id: track.id,
          include: "musicinfo", // Используем musicinfo для жанров
        },
      });
      console.log("Jamendo API response (firestoreService):", response.data);
      const trackData = response.data.results[0];
      const genres = trackData?.musicinfo?.tags || [];

      await setDoc(trackRef, {
        id: track.id,
        name: track.name,
        artist_name: track.artist_name,
        audio: track.audio,
        album_image: track.album_image,
        duration: track.duration,
        genres,
      });
      console.log(`Трек ${track.name} добавлен в избранное с жанрами:`, genres);
      return true;
    }
  } catch (error) {
    console.error("Ошибка при обновлении избранного:", error);
    throw error;
  }
};

// Создание плейлиста
export const createPlaylist = async (userId, playlistName) => {
  if (!userId) {
    throw new Error("Пользователь не авторизован");
  }
  if (!playlistName.trim()) {
    throw new Error("Название плейлиста не может быть пустым");
  }
  try {
    const playlistsRef = collection(db, `users/${userId}/playlists`);
    const newPlaylist = await addDoc(playlistsRef, {
      name: playlistName,
      tracks: [],
      createdAt: new Date().toISOString(),
    });
    console.log(`Плейлист "${playlistName}" создан!`);
    return newPlaylist.id;
  } catch (error) {
    console.error("Ошибка при создании плейлиста:", error);
    throw error;
  }
};

// Добавление трека в плейлист
export const addTrackToPlaylist = async (userId, playlistId, track) => {
  if (!userId || !playlistId) {
    throw new Error("Пользователь или плейлист не указан");
  }
  try {
    const playlistRef = doc(db, `users/${userId}/playlists/${playlistId}`);
    const trackData = {
      id: track.id,
      name: track.name,
      artist_name: track.artist_name,
      audio: track.audio,
      album_image: track.album_image,
      duration: track.duration,
    };
    await updateDoc(playlistRef, {
      tracks: arrayUnion(trackData),
    });
    console.log(`Трек "${track.name}" добавлен в плейлист!`);
  } catch (error) {
    console.error("Ошибка при добавлении трека в плейлист:", error);
    throw error;
  }
};

// Удаление трека из плейлиста
export const removeTrackFromPlaylist = async (userId, playlistId, trackId) => {
  if (!userId || !playlistId || !trackId) {
    throw new Error("Пользователь, плейлист или трек не указан");
  }
  try {
    const playlistRef = doc(db, `users/${userId}/playlists/${playlistId}`);
    const playlistSnap = await getDoc(playlistRef);
    if (playlistSnap.exists()) {
      const playlistData = playlistSnap.data();
      const trackToRemove = playlistData.tracks.find((t) => t.id === trackId);
      if (trackToRemove) {
        await updateDoc(playlistRef, {
          tracks: arrayRemove(trackToRemove),
        });
        console.log(`Трек с ID ${trackId} удалён из плейлиста`);
      }
    }
  } catch (error) {
    console.error("Ошибка при удалении трека из плейлиста:", error);
    throw error;
  }
};

// Получение списка плейлистов
export const getPlaylists = async (userId) => {
  if (!userId) {
    throw new Error("Пользователь не авторизован");
  }
  try {
    const playlistsRef = collection(db, `users/${userId}/playlists`);
    const querySnapshot = await getDocs(playlistsRef);
    const playlists = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    console.log(`Загружено ${playlists.length} плейлистов`);
    return playlists;
  } catch (error) {
    console.error("Ошибка при загрузке плейлистов:", error);
    throw error;
  }
};

// Удаление плейлиста
export const deletePlaylist = async (userId, playlistId) => {
  if (!userId || !playlistId) {
    throw new Error("Пользователь или плейлист не указан");
  }
  try {
    const playlistRef = doc(db, `users/${userId}/playlists/${playlistId}`);
    await deleteDoc(playlistRef);
    console.log(`Плейлист с ID ${playlistId} удалён`);
  } catch (error) {
    console.error("Ошибка при удалении плейлиста:", error);
    throw error;
  }
};