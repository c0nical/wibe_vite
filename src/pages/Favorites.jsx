import React, { useEffect, useState } from "react";
import { db, auth } from "../firebase";
import { collection, query, where, getDocs, deleteDoc, doc } from "firebase/firestore";
import { Trash2, ChevronUp, ChevronDown, Filter, List, ChevronLeft } from "lucide-react";
import { motion } from "framer-motion";
import Skeleton from "react-loading-skeleton";
import { SkeletonTheme } from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

const Favorites = ({ setCurrentTrack, setIsPlaying, setCurrentCategoryTracks, showToast }) => {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortConfig, setSortConfig] = useState({ key: "addedAt", direction: "desc" });
  const [mobileSortOpen, setMobileSortOpen] = useState(false);

  // Загрузка избранного
  useEffect(() => {
    const fetchFavorites = async () => {
      const user = auth.currentUser;
      if (user) {
        const q = query(collection(db, "favorites"), where("userId", "==", user.uid));
        const snapshot = await getDocs(q);
        setFavorites(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        setLoading(false);
      }
    };
    fetchFavorites();
  }, []);

  // Сортировка
  const sortedFavorites = React.useMemo(() => {
    return [...favorites].sort((a, b) => {
      if (sortConfig.key === "addedAt") {
        return sortConfig.direction === "asc" 
          ? new Date(a.addedAt) - new Date(b.addedAt)
          : new Date(b.addedAt) - new Date(a.addedAt);
      }
      if (sortConfig.key === "duration") {
        return sortConfig.direction === "asc" 
          ? a.duration - b.duration 
          : b.duration - a.duration;
      }
      return sortConfig.direction === "asc"
        ? a[sortConfig.key]?.localeCompare(b[sortConfig.key])
        : b[sortConfig.key]?.localeCompare(a[sortConfig.key]);
    });
  }, [favorites, sortConfig]);

  // Переключение сортировки
  const requestSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc"
    }));
    setMobileSortOpen(false);
  };

  // Воспроизведение трека
  const handlePlayTrack = (track) => {
    setCurrentTrack({
      id: track.trackId,
      name: track.trackName,
      artist_name: track.artistName,
      audio: track.trackUrl,
      album_image: track.albumImage,
      duration: track.duration
    });
    setIsPlaying(true);
    setCurrentCategoryTracks(favorites.map(t => ({
      id: t.trackId,
      name: t.trackName,
      artist_name: t.artistName,
      audio: t.trackUrl,
      album_image: t.albumImage,
      duration: t.duration
    })));
  };

  // Удаление из избранного
  const handleRemoveFavorite = async (trackId, e) => {
    e.stopPropagation();
    const user = auth.currentUser;
    if (user) {
      await deleteDoc(doc(db, "favorites", trackId));
      setFavorites(favorites.filter(track => track.id !== trackId));
      showToast("Трек удалён из избранного!");
    }
  };

  // Форматирование времени
  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Иконка сортировки
  const SortIcon = ({ field }) => {
    if (sortConfig.key !== field) return <Filter size={16} className="opacity-50" />;
    return sortConfig.direction === "asc" ? <ChevronUp size={16} /> : <ChevronDown size={16} />;
  };

  return (
    <SkeletonTheme baseColor="#4F4F4F" highlightColor="#A6A6A6">
      <div className="text-white p-4 pb-34 md:pb-4"> {/* Добавлен отступ для мини-плеера */}
        {/* Заголовок и сортировка для десктопа */}
        <div className="hidden md:flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Избранное</h1>
          <div className="flex gap-2 text-sm text-gray-400">
            {["addedAt", "trackName", "artistName", "duration"].map((key) => (
              <button
                key={key}
                onClick={() => requestSort(key)}
                className={`px-3 py-1 rounded-full flex items-center gap-1 ${
                  sortConfig.key === key ? "bg-neutral-700" : "hover:bg-neutral-800"
                }`}
              >
                <SortIcon field={key} />
                <span>
                  {key === "addedAt" && "Дата"}
                  {key === "trackName" && "Название"}
                  {key === "artistName" && "Исполнитель"}
                  {key === "duration" && "Длительность"}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Мобильный заголовок и сортировка */}
        <div className="md:hidden flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold">Избранное</h1>
          <button 
            onClick={() => setMobileSortOpen(true)}
            className="p-2 bg-neutral-700 rounded-full"
          >
            <List size={20} />
          </button>
        </div>

        {/* Мобильное меню сортировки */}
        {mobileSortOpen && (
          <div className="md:hidden fixed inset-0 bg-black bg-opacity-90 z-50 flex flex-col p-4">
            <button 
              onClick={() => setMobileSortOpen(false)}
              className="self-start mb-6 p-2"
            >
              <ChevronLeft size={24} />
            </button>
            
            <h2 className="text-xl font-bold mb-4">Сортировка</h2>
            {["addedAt", "trackName", "artistName", "duration"].map((key) => (
              <button
                key={key}
                onClick={() => requestSort(key)}
                className={`py-3 px-4 text-left rounded-lg flex items-center justify-between ${
                  sortConfig.key === key ? "bg-neutral-700" : "bg-neutral-800"
                }`}
              >
                <span>
                  {key === "addedAt" && "По дате добавления"}
                  {key === "trackName" && "По названию трека"}
                  {key === "artistName" && "По исполнителю"}
                  {key === "duration" && "По длительности"}
                </span>
                <SortIcon field={key} />
              </button>
            ))}
          </div>
        )}

        {/* Список треков */}
        {loading ? (
          <div className="space-y-3">
            {Array(5).fill().map((_, i) => (
              <div key={i} className="flex items-center gap-3 p-3">
                <Skeleton width={52} height={52} circle />
                <div className="flex-1">
                  <Skeleton width="70%" height={16} />
                  <Skeleton width="50%" height={14} className="mt-1" />
                </div>
                <Skeleton width={40} height={16} />
              </div>
            ))}
          </div>
        ) : favorites.length === 0 ? (
          <p className="text-gray-400 text-center py-8">Нет избранных треков</p>
        ) : (
          <div className="space-y-2">
            {sortedFavorites.map((track) => (
              <motion.div
                key={track.id}
                className="flex items-center gap-3 p-3 bg-neutral-800 hover:bg-neutral-700 transition rounded-lg"
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handlePlayTrack(track)}
              >
                {track.albumImage ? (
                  <img
                    src={track.albumImage}
                    alt={track.trackName}
                    className="w-12 h-12 md:w-14 md:h-14 object-cover rounded-lg"
                  />
                ) : (
                  <div className="w-12 h-12 md:w-14 md:h-14 bg-neutral-700 rounded-lg" />
                )}

                <div className="flex-1 min-w-0">
                  <h3 className="font-medium truncate">{track.trackName}</h3>
                  <p className="text-sm text-gray-400 truncate">{track.artistName}</p>
                </div>

                <div className="flex items-center gap-2">
                  <p className="text-sm text-gray-400 whitespace-nowrap">
                    {formatDuration(track.duration)}
                  </p>
                  <button
                    onClick={(e) => handleRemoveFavorite(track.id, e)}
                    className="text-red-500 hover:text-red-400 p-1"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </SkeletonTheme>
  );
};

export default Favorites;