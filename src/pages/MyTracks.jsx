import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import Skeleton from "react-loading-skeleton";
import { SkeletonTheme } from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import { Trash2, Upload, Filter, ChevronUp, ChevronDown, List, ChevronLeft } from "lucide-react";
import { openDB } from "idb";

const MyTracks = ({ setCurrentTrack, setIsPlaying, setCurrentCategoryTracks, showToast }) => {
  const [tracks, setTracks] = useState([]);
  const [loading, setLoading] = useState(true);
  const fileInputRef = useRef(null);
  const [sortConfig, setSortConfig] = useState({ key: "addedAt", direction: "desc" });
  const [mobileSortOpen, setMobileSortOpen] = useState(false);

  // Инициализация IndexedDB
  const dbPromise = openDB("userTracksDB", 1, {
    upgrade(db) {
      db.createObjectStore("tracks", { keyPath: "id" });
    },
  });

  // Загрузка треков из IndexedDB
  useEffect(() => {
    const loadTracks = async () => {
      try {
        const db = await dbPromise;
        const storedTracks = await db.getAll("tracks");
        setTracks(storedTracks);
        setCurrentCategoryTracks(storedTracks.map(track => ({
          id: track.id,
          name: track.name,
          artist_name: track.artist || "Неизвестный исполнитель",
          audio: URL.createObjectURL(track.data),
          album_image: null,
          duration: track.duration || 0,
        })));
      } catch (error) {
        console.error("Ошибка загрузки треков:", error);
        showToast("Ошибка загрузки треков!");
      } finally {
        setLoading(false);
      }
    };
    loadTracks();
  }, [setCurrentCategoryTracks, showToast]);

  // Сортировка треков
  const sortedTracks = React.useMemo(() => {
    return [...tracks].sort((a, b) => {
      if (sortConfig.key === "addedAt") {
        return sortConfig.direction === "asc"
          ? parseInt(a.id) - parseInt(b.id)
          : parseInt(b.id) - parseInt(a.id);
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
  }, [tracks, sortConfig]);

  // Переключение сортировки
  const requestSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
    setMobileSortOpen(false);
  };

  // Обработка загрузки нового трека
  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file || !file.type.startsWith("audio/")) {
      showToast("Пожалуйста, выберите аудиофайл!");
      return;
    }

    try {
      const audio = new Audio();
      audio.src = URL.createObjectURL(file);
      const duration = await new Promise((resolve) => {
        audio.onloadedmetadata = () => resolve(audio.duration);
      });

      const trackData = {
        id: Date.now().toString(),
        name: file.name.replace(/\.[^/.]+$/, ""),
        artist: "Пользователь",
        data: file,
        duration: Math.floor(duration),
      };

      const db = await dbPromise;
      await db.put("tracks", trackData);

      setTracks((prev) => [...prev, trackData]);
      setCurrentCategoryTracks((prev) => [
        ...prev,
        {
          id: trackData.id,
          name: trackData.name,
          artist_name: trackData.artist,
          audio: URL.createObjectURL(trackData.data),
          album_image: null,
          duration: trackData.duration,
        },
      ]);
      showToast("Трек успешно загружен!");
    } catch (error) {
      console.error("Ошибка при загрузке трека:", error);
      showToast("Ошибка при загрузке трека!");
    }
  };

  // Удаление трека
  const handleRemoveTrack = async (trackId, e) => {
    e.stopPropagation();
    try {
      const db = await dbPromise;
      await db.delete("tracks", trackId);
      setTracks((prev) => prev.filter((track) => track.id !== trackId));
      setCurrentCategoryTracks((prev) => prev.filter((track) => track.id !== trackId));
      showToast("Трек удалён!");
    } catch (error) {
      console.error("Ошибка при удалении трека:", error);
      showToast("Ошибка при удалении трека!");
    }
  };

  // Воспроизведение трека
  const handlePlayTrack = (track) => {
    setCurrentTrack({
      id: track.id,
      name: track.name,
      artist_name: track.artist || "Неизвестный исполнитель",
      audio: URL.createObjectURL(track.data),
      album_image: null,
      duration: track.duration || 0,
    });
    setIsPlaying(true);
    setCurrentCategoryTracks(sortedTracks.map(t => ({
      id: t.id,
      name: t.name,
      artist_name: t.artist || "Неизвестный исполнитель",
      audio: URL.createObjectURL(t.data),
      album_image: null,
      duration: t.duration || 0,
    })));
  };

  // Форматирование длительности
  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  // Иконка сортировки
  const SortIcon = ({ field }) => {
    if (sortConfig.key !== field) return <Filter size={16} className="opacity-50" />;
    return sortConfig.direction === "asc" ? <ChevronUp size={16} /> : <ChevronDown size={16} />;
  };

  return (
    <SkeletonTheme baseColor="#4F4F4F" highlightColor="#A6A6A6">
      <div className="text-white p-4 pb-34 md:pb-4">
        {/* Заголовок и сортировка для десктопа */}
        <div className="hidden md:flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Свои треки</h1>
          <div className="flex gap-2 text-sm text-gray-400">
            {["addedAt", "name", "duration"].map((key) => (
              <button
                key={key}
                onClick={() => requestSort(key)}
                className={`px-3 py-1 rounded-full flex items-center cursor-pointer gap-1 ${
                  sortConfig.key === key ? "bg-neutral-700" : "hover:bg-neutral-800"
                }`}
              >
                <SortIcon field={key} />
                <span>
                  {key === "addedAt" && "Дата"}
                  {key === "name" && "Название"}
                  {key === "duration" && "Длительность"}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Мобильный заголовок и сортировка */}
        <div className="md:hidden flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold">Свои треки</h1>
          <div className="flex items-center gap-2">
            <button
              onClick={() => fileInputRef.current.click()}
              className="bg-green-500 text-white px-3 py-1 rounded-lg hover:bg-green-600 flex items-center gap-2"
            >
              <Upload size={16} />
              Загрузить
            </button>
            <button
              onClick={() => setMobileSortOpen(true)}
              className="p-2 bg-neutral-700 rounded-full"
            >
              <List size={20} />
            </button>
          </div>
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
            {["addedAt", "name", "duration"].map((key) => (
              <button
                key={key}
                onClick={() => requestSort(key)}
                className={`py-3 px-4 text-left rounded-lg flex items-center justify-between ${
                  sortConfig.key === key ? "bg-neutral-700" : "bg-neutral-800"
                }`}
              >
                <span>
                  {key === "addedAt" && "По дате добавления"}
                  {key === "name" && "По названию трека"}
                  {key === "duration" && "По длительности"}
                </span>
                <SortIcon field={key} />
              </button>
            ))}
          </div>
        )}

        {/* Кнопка загрузки для десктопа */}
        <div className="hidden md:flex justify-end mb-4">
          <button
            onClick={() => fileInputRef.current.click()}
            className="bg-white text-black px-4 py-2 rounded-lg hover:bg-neutral-200 cursor-pointer flex items-center gap-2"
          >
            <Upload size={18} />
            Загрузить трек
          </button>
        </div>

        <input
          type="file"
          accept="audio/*"
          ref={fileInputRef}
          className="hidden"
          onChange={handleFileUpload}
        />

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
        ) : sortedTracks.length === 0 ? (
          <p className="text-gray-400 text-center py-8">Нет загруженных треков</p>
        ) : (
          <div className="space-y-2">
            {sortedTracks.map((track) => (
              <motion.div
                key={track.id}
                className="flex items-center gap-3 p-3 border-1 border-white/10 bg-neutral-800 cursor-pointer hover:bg-neutral-700 transition rounded-lg"
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handlePlayTrack(track)}
              >
                <div className="w-12 h-12 md:w-14 md:h-14 bg-neutral-700 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M9 16V8l7 4-7 4z" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium truncate">{track.name}</h3>
                  <p className="text-sm text-gray-400 truncate">{track.artist || "Неизвестный исполнитель"}</p>
                </div>
                <div className="flex items-center gap-2">
                  <p className="text-sm text-gray-400 whitespace-nowrap">
                    {formatDuration(track.duration)}
                  </p>
                  <button
                    onClick={(e) => handleRemoveTrack(track.id, e)}
                    className="text-red-500 hover:text-red-400 p-1"
                  >
                    <Trash2 size={18} className="cursor-pointer" />
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

export default MyTracks;