import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import Skeleton from "react-loading-skeleton";
import { SkeletonTheme } from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import { ChevronLeft, ChevronRight, Heart } from "lucide-react";
import FeaturedTracks from "./FeaturedTracks";
import Recommendations from "./Recommendations";
import { db, auth } from "../firebase";
import { collection, query, where, getDocs, addDoc, deleteDoc } from "firebase/firestore";

// Определяем категории для отображения треков
const categories = [
  { title: "Новинки", params: { order: "releasedate" } },
  { title: "Популярные", params: { order: "popularity_total" } },
  { title: "Жанр: Рок", params: { tag: "rock" } },
];

const TrackList = ({
  setCurrentTrack,
  setIsPlaying,
  currentTrack,
  isPlaying,
  setCurrentCategoryTracks,
  showToast,
}) => {
  return (
    <SkeletonTheme baseColor="#4F4F4F" highlightColor="#A6A6A6">
      <div className="text-white max-w-full overflow-x-hidden box-border">
        <h1 className="text-3xl font-bold mb-6 sm:text-2xl">Главная</h1>
        <FeaturedTracks
          setCurrentTrack={setCurrentTrack}
          setIsPlaying={setIsPlaying}
          currentTrack={currentTrack}
          isPlaying={isPlaying}
          setCurrentCategoryTracks={setCurrentCategoryTracks}
          showToast={showToast}
        />
        <Recommendations
          setCurrentTrack={setCurrentTrack}
          setIsPlaying={setIsPlaying}
          currentTrack={currentTrack}
          isPlaying={isPlaying}
          setCurrentCategoryTracks={setCurrentCategoryTracks}
          showToast={showToast}
        />
        {categories.map((category, index) => (
          <TrackCategory
            key={index}
            title={category.title}
            params={category.params}
            setCurrentTrack={setCurrentTrack}
            setIsPlaying={setIsPlaying}
            currentTrack={currentTrack}
            isPlaying={isPlaying}
            setCurrentCategoryTracks={setCurrentCategoryTracks}
            showToast={showToast}
          />
        ))}
      </div>
    </SkeletonTheme>
  );
};

const TrackCategory = ({
  title,
  params,
  setCurrentTrack,
  setIsPlaying,
  currentTrack,
  isPlaying,
  setCurrentCategoryTracks,
  showToast,
}) => {
  const [tracks, setTracks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [offset, setOffset] = useState(0);
  const [favorites, setFavorites] = useState([]);
  const scrollRef = useRef(null);
  const lastTrackRef = useRef(null);

  // Загружаем избранное пользователя
  useEffect(() => {
    const fetchFavorites = async () => {
      const user = auth.currentUser;
      if (user) {
        const q = query(collection(db, "favorites"), where("userId", "==", user.uid));
        const querySnapshot = await getDocs(q);
        setFavorites(querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
      }
    };
    fetchFavorites();
  }, []);

  // Загружаем треки с Jamendo API
  const fetchTracks = async (newOffset = 0) => {
    try {
      const response = await axios.get("https://api.jamendo.com/v3.0/tracks/", {
        params: {
          client_id: import.meta.env.VITE_JAMENDO_API_KEY,
          format: "json",
          limit: 10,
          offset: newOffset,
          ...params,
        },
      });

      if (newOffset === 0) {
        setTracks(response.data.results);
      } else {
        setTracks((prev) => [...prev, ...response.data.results]);
      }
    } catch (error) {
      console.error(`Ошибка при загрузке треков для ${title}:`, error);
      showToast("Ошибка загрузки треков!");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTracks(offset);
  }, [params, title, offset]);

  // Обновляем текущие треки категории
  useEffect(() => {
    if (setCurrentCategoryTracks && tracks.length) {
      setCurrentCategoryTracks(tracks);
    }
  }, [tracks, setCurrentCategoryTracks]);

  // Настраиваем бесконечную прокрутку с IntersectionObserver
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loading) {
          setOffset((prev) => prev + 10);
        }
      },
      { threshold: 1 }
    );

    if (lastTrackRef.current) {
      observer.observe(lastTrackRef.current);
    }

    return () => {
      if (lastTrackRef.current) {
        observer.unobserve(lastTrackRef.current);
      }
    };
  }, [tracks, loading]);

  // Обработчик прокрутки треков влево/вправо
  const handleScroll = (direction) => {
    if (scrollRef.current) {
      const card = scrollRef.current.firstChild;
      if (card) {
        const cardWidth = card.offsetWidth;
        const marginRight = parseInt(window.getComputedStyle(card).marginRight) || 16;
        const totalWidth = cardWidth + marginRight;
        scrollRef.current.scrollBy({ left: direction * totalWidth, behavior: "smooth" });
      }
    }
  };

  // Обработчик клика по треку
  const handleTrackClick = async (track) => {
    console.log(`Track clicked: ${track.name}, Category: ${title}, Tracks:`, tracks);
    try {
      await fetch(track.audio);
      if (currentTrack?.id === track.id) {
        setIsPlaying(!isPlaying);
      } else {
        setCurrentTrack(track);
        setIsPlaying(true);
        if (setCurrentCategoryTracks) {
          setCurrentCategoryTracks(tracks);
        }
      }
    } catch (error) {
      console.error(`Ошибка загрузки трека ${track.name}:`, error);
      showToast("Ошибка загрузки трека!");
    }
  };

  // Обработчик добавления/удаления трека в избранное
  const handleFavoriteClick = async (track, e) => {
    e.stopPropagation();
    const user = auth.currentUser;
    if (user) {
      try {
        const q = query(
          collection(db, "favorites"),
          where("userId", "==", user.uid),
          where("trackId", "==", track.id)
        );
        const querySnapshot = await getDocs(q);
        if (querySnapshot.empty) {
          const response = await axios.get("https://api.jamendo.com/v3.0/tracks/", {
            params: {
              client_id: import.meta.env.VITE_JAMENDO_API_KEY,
              format: "json",
              id: track.id,
              include: "musicinfo",
            },
          });
          console.log("Jamendo API response (TrackList):", response.data);
          const trackData = response.data.results[0];
          const genres = trackData?.musicinfo?.tags || [];

          const favoriteData = {
            userId: user.uid,
            trackId: track.id,
            trackName: track.name,
            trackArtist: track.artist_name,
            trackUrl: track.audio,
            albumImage: track.album_image,
            artistName: track.artist_name,
            duration: track.duration,
            genres,
          };
          const docRef = await addDoc(collection(db, "favorites"), favoriteData);
          setFavorites([...favorites, { id: docRef.id, ...favoriteData }]);
          showToast("Трек добавлен в избранное!");
        } else {
          querySnapshot.forEach(async (doc) => {
            await deleteDoc(doc.ref);
          });
          setFavorites(favorites.filter((f) => f.trackId !== track.id));
          showToast("Трек удалён из избранного!");
        }
      } catch (error) {
        console.error("Ошибка при добавлении/удалении в избранное:", error);
        showToast("Ошибка при работе с избранным!");
      }
    } else {
      showToast("Авторизуйтесь, чтобы добавить в избранное!");
    }
  };

  return (
    <div className="mb-8 bg-neutral-900 p-5 sm:p-3 rounded-lg max-w-full box-border">
      <div className="flex justify-between items-center mb-4 bg-gray-800 p-4 sm:p-2 rounded-lg">
        <h2 className="text-2xl sm:text-lg font-semibold">{title}</h2>
        <div className="flex gap-2 items-center">
          <button
            onClick={() => handleScroll(-1)}
            className="w-10 h-10 sm:w-8 sm:h-8 flex items-center justify-center bg-inherit border-2 border-solid border-gray-600 rounded hover:bg-gray-600"
          >
            <ChevronLeft size={24} className="sm:w-5 sm:h-5" />
          </button>
          <button
            onClick={() => handleScroll(1)}
            className="w-10 h-10 sm:w-8 sm:h-8 flex items-center justify-center bg-inherit border-2 border-solid border-gray-600 rounded hover:bg-gray-600"
          >
            <ChevronRight size={24} className="sm:w-5 sm:h-5" />
          </button>
        </div>
      </div>
      <div
        ref={scrollRef}
        className="flex gap-4 sm:gap-2 overflow-x-auto snap-x snap-mandatory p-2 sm:p-1 max-w-full custom-scrollbar"
      >
        {loading && tracks.length === 0
          ? Array(5)
              .fill()
              .map((_, index) => <TrackSkeleton key={index} />)
          : tracks.map((track, index) => {
              const isLast = index === tracks.length - 1;
              const isFavorite = favorites.some((f) => f.trackId === track.id);
              return (
                <div
                  ref={isLast ? lastTrackRef : null}
                  key={`${title}-${track.id}`}
                  className={`bg-neutral-800 p-4 sm:p-2 rounded-lg shadow-md hover:bg-neutral-700 transition cursor-pointer flex flex-col items-center min-w-35 max-w-35 snap-start flex-shrink-0 ${
                    currentTrack?.id === track.id && isPlaying ? "bg-green-700" : ""
                  }`}
                  onClick={() => handleTrackClick(track)}
                >
                  <div className="mb-4 sm:mb-2 relative">
                    {track.album_image ? (
                      <img
                        src={track.album_image}
                        alt={track.album_name}
                        className="w-40 h-40 sm:w-28 sm:h-28 object-cover rounded-lg"
                      />
                    ) : (
                      <div className="w-40 h-40 sm:w-28 sm:h-28 bg-gray-600 rounded-lg"></div>
                    )}
                    <button
                      onClick={(e) => handleFavoriteClick(track, e)}
                      className={`absolute top-2 sm:top-1 right-2 sm:right-1 text-xl sm:text-base ${
                        isFavorite ? "text-red-500" : "text-gray-400"
                      } hover:text-white`}
                    >
                      <Heart fill={isFavorite ? "red" : "none"} />
                    </button>
                  </div>
                  <h3
                    className="text-lg sm:text-sm font-semibold text-center h-12 sm:h-10 overflow-hidden"
                    style={{
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                    }}
                  >
                    {track.name}
                  </h3>
                  <p className="text-sm sm:text-xs text-gray-400 text-center mt-2">{track.artist_name}</p>
                </div>
              );
            })}
      </div>
    </div>
  );
};

// Компонент-заглушка для загрузки треков
const TrackSkeleton = () => (
  <div className="bg-neutral-800 p-4 sm:p-2 rounded-lg shadow-md flex flex-col items-center min-w-[180px] sm:min-w-[120px] h-[300px] sm:h-[240px] snap-start flex-shrink-0">
    <Skeleton width={160} height={160} borderRadius={8} className="sm:w-28 sm:h-28" />
    <h2 className="mt-4 sm:mt-2">
      <Skeleton width={120} height={20} className="sm:w-80 sm:h-16" />
    </h2>
    <p className="mt-2 sm:mt-1">
      <Skeleton width={100} height={15} className="sm:w-60 sm:h-12" />
    </p>
  </div>
);

export default TrackList;