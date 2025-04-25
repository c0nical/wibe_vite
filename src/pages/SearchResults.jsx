import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { db, auth } from "../firebase";
import { collection, query, where, getDocs, addDoc, deleteDoc } from "firebase/firestore";
import { Heart, Trash2 } from "lucide-react";
import { motion } from "framer-motion";
import Skeleton from "react-loading-skeleton";
import { SkeletonTheme } from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

const SearchResults = ({ setCurrentTrack, setIsPlaying, setCurrentCategoryTracks, showToast }) => {
  const [searchResults, setSearchResults] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  // Загружаем избранное пользователя
  useEffect(() => {
    const fetchFavorites = async () => {
      const user = auth.currentUser;
      if (user) {
        const q = query(collection(db, "favorites"), where("userId", "==", user.uid));
        const querySnapshot = await getDocs(q);
        setFavorites(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      }
    };
    fetchFavorites();
  }, []);

  // Поиск треков
  useEffect(() => {
    const searchQuery = new URLSearchParams(location.search).get("q");
    if (searchQuery) {
      setLoading(true);
      fetch(`https://api.jamendo.com/v3.0/tracks/?client_id=${import.meta.env.VITE_JAMENDO_API_KEY}&format=json&limit=20&search=${encodeURIComponent(searchQuery)}`)
        .then(res => res.json())
        .then(data => {
          const formattedTracks = data.results.map(track => ({
            id: track.id,
            name: track.name,
            artist_name: track.artist_name,
            audio: track.audio,
            album_image: track.image || track.album_image,
            duration: track.duration,
            tags: track.tags || ''
          }));
          setSearchResults(formattedTracks);
          setCurrentCategoryTracks(formattedTracks);
        })
        .catch(err => {
          console.error("Search error:", err);
          showToast("Ошибка поиска");
        })
        .finally(() => setLoading(false));
    }
  }, [location.search]);

  const handlePlayTrack = (track) => {
    setCurrentTrack(track);
    setIsPlaying(true);
  };

  const handleFavoriteClick = async (track, e) => {
    e.stopPropagation();
    const user = auth.currentUser;
    if (!user) {
      showToast("Авторизуйтесь, чтобы добавить в избранное");
      return;
    }

    const isFavorite = favorites.some(f => f.trackId === track.id);
    
    try {
      if (isFavorite) {
        // Удаляем из избранного
        const favoriteDoc = favorites.find(f => f.trackId === track.id);
        if (favoriteDoc) {
          await deleteDoc(doc(db, "favorites", favoriteDoc.id));
          setFavorites(favorites.filter(f => f.id !== favoriteDoc.id));
          showToast("Трек удалён из избранного");
        }
      } else {
        // Добавляем в избранное
        const favoriteData = {
          userId: user.uid,
          trackId: track.id,
          trackName: track.name,
          trackArtist: track.artist_name,
          trackUrl: track.audio,
          albumImage: track.album_image,
          artistName: track.artist_name,
          duration: track.duration,
          tags: track.tags,
          addedAt: new Date().toISOString()
        };
        const docRef = await addDoc(collection(db, "favorites"), favoriteData);
        setFavorites([...favorites, { id: docRef.id, ...favoriteData }]);
        showToast("Трек добавлен в избранное");
      }
    } catch (error) {
      console.error("Favorite error:", error);
      showToast("Ошибка при изменении избранного");
    }
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <SkeletonTheme baseColor="#4F4F4F" highlightColor="#A6A6A6">
      <div className="text-white p-4">
        <h1 className="text-3xl font-bold mb-6">
          Результаты поиска: "{new URLSearchParams(location.search).get("q")}"
        </h1>
        
        {loading ? (
          <div className="space-y-4">
            {Array(5).fill().map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton width={64} height={64} borderRadius={8} />
                <div className="flex-1">
                  <Skeleton width={200} height={20} />
                  <Skeleton width={150} height={15} className="mt-2" />
                </div>
                <Skeleton width={40} height={20} />
              </div>
            ))}
          </div>
        ) : searchResults.length === 0 ? (
          <p className="text-gray-400">Ничего не найдено</p>
        ) : (
          <div className="space-y-3">
            {searchResults.map(track => {
              const isFavorite = favorites.some(f => f.trackId === track.id);
              
              return (
                <motion.div
                  key={track.id}
                  className="flex items-center gap-4 bg-neutral-800 p-3 rounded-lg hover:bg-neutral-700 cursor-pointer"
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handlePlayTrack(track)}
                >
                  {track.album_image ? (
                    <img
                      src={track.album_image}
                      alt={track.name}
                      className="w-14 h-14 object-cover rounded-lg"
                    />
                  ) : (
                    <div className="w-14 h-14 bg-neutral-700 rounded-lg" />
                  )}
                  
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium truncate">{track.name}</h3>
                    <p className="text-sm text-gray-400 truncate">{track.artist_name}</p>
                  </div>
                  
                  <p className="text-sm text-gray-400">
                    {formatDuration(track.duration)}
                  </p>
                  
                  <button
                    onClick={(e) => handleFavoriteClick(track, e)}
                    className="p-2 text-gray-400 hover:text-white"
                  >
                    {isFavorite ? (
                      <Heart className="text-red-500" fill="currentColor" size={18} />
                    ) : (
                      <Heart size={18} />
                    )}
                  </button>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </SkeletonTheme>
  );
};

export default SearchResults;