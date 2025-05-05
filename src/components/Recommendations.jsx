import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import Skeleton from "react-loading-skeleton";
import { SkeletonTheme } from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import { ChevronLeft, ChevronRight, Heart, RefreshCw } from "lucide-react";
import { auth, db } from "../firebase";
import { collection, query, where, getDocs, addDoc, deleteDoc } from "firebase/firestore";
import { getTopGenres, getRecommendedTracks } from "./recommendationService.js";

const Recommendations = ({
  setCurrentTrack,
  setIsPlaying,
  currentTrack,
  isPlaying,
  setCurrentCategoryTracks,
  showToast,
}) => {
  const [recommendedTracks, setRecommendedTracks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [offset, setOffset] = useState(0);
  const [favorites, setFavorites] = useState([]);
  const [refreshKey, setRefreshKey] = useState(Date.now());
  const user = auth.currentUser;
  const scrollRef = useRef(null);
  const lastTrackRef = useRef(null);

  // Загружаем избранное пользователя
  useEffect(() => {
    const fetchFavorites = async () => {
      if (user) {
        const q = query(collection(db, "favorites"), where("userId", "==", user.uid));
        const querySnapshot = await getDocs(q);
        setFavorites(querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
      }
    };
    fetchFavorites();
  }, [user]);

  // Загружаем рекомендации
  const fetchRecommendations = async (newOffset = 0, seed = refreshKey) => {
    if (!user) {
      console.log("No user logged in, skipping recommendations");
      setRecommendedTracks([]);
      setLoading(false);
      return;
    }

    try {
      const topGenres = await getTopGenres(user.uid);
      console.log("Fetched top genres:", topGenres);
      if (topGenres.length === 0) {
        console.log("No top genres found, returning empty recommendations");
        setRecommendedTracks([]);
        setLoading(false);
        return;
      }

      const tracks = await getRecommendedTracks(user.uid, topGenres, newOffset, seed);
      console.log("Fetched recommended tracks:", tracks);

      // Фильтруем новые треки, исключая уже существующие по track.id
      const existingIds = new Set(recommendedTracks.map((track) => track.id));
      const uniqueTracks = tracks.filter((track) => !existingIds.has(track.id));

      if (newOffset === 0) {
        setRecommendedTracks(uniqueTracks);
      } else {
        setRecommendedTracks((prev) => [...prev, ...uniqueTracks]);
      }

      if (setCurrentCategoryTracks && uniqueTracks.length) {
        setCurrentCategoryTracks(uniqueTracks);
      }
    } catch (error) {
      console.error("Ошибка при загрузке рекомендаций:", error);
      showToast("Ошибка загрузки рекомендаций!");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecommendations(offset, refreshKey);
  }, [user, showToast, offset, refreshKey]);

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
  }, [recommendedTracks, loading]);

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

  // Обработчик решафла рекомендаций
  const handleRefresh = () => {
    setOffset(0); // Сбрасываем offset для нового набора
    setRefreshKey(Date.now()); // Новый seed для API
    setRecommendedTracks([]); // Очищаем текущие треки
    setLoading(true); // Показываем загрузку
  };

  // Обработчик клика по треку
  const handleTrackClick = async (track) => {
    console.log("Track clicked:", track.name, "Recommendations:", recommendedTracks);
    try {
      await fetch(track.audio);
      if (currentTrack?.id === track.id) {
        setIsPlaying(!isPlaying);
      } else {
        setCurrentTrack(track);
        setIsPlaying(true);
        if (setCurrentCategoryTracks) {
          setCurrentCategoryTracks(recommendedTracks);
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
    if (!user) {
      showToast("Авторизуйтесь, чтобы добавить в избранное!");
      return;
    }

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
        console.log("Jamendo API response (Recommendations):", response.data);
        const trackData = response.data.results[0];
        const genres = trackData?.musicinfo?.tags?.genres || [];

        const favoriteData = {
          userId: user.uid,
          trackId: track.id,
          trackName: track.name,
          trackArtist: track.artist_name,
          trackUrl: track.audio,
          albumImage: track.album_image,
          artistName: track.artist_name,
          duration: track.duration,
          genres: { genres },
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
  };

  return (
    <SkeletonTheme baseColor="#4F4F4F" highlightColor="#A6A6A6">
      <div className="mb-8 bg-neutral-900 p-5 sm:p-3 rounded-lg max-w-full box-border">
        <div className="flex justify-between items-center mb-4 bg-gray-800 p-4 sm:p-2 rounded-lg">
          <h2 className="text-2xl sm:text-lg font-semibold">Рекомендации</h2>
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
            <button
              onClick={handleRefresh}
              className="w-10 h-10 sm:w-8 sm:h-8 flex items-center justify-center bg-inherit border-2 border-solid border-gray-600 rounded hover:bg-gray-600"
              title="Обновить рекомендации"
            >
              <RefreshCw size={24} className="sm:w-5 sm:h-5" />
            </button>
          </div>
        </div>
        <div
          ref={scrollRef}
          className="flex gap-4 sm:gap-2 overflow-x-auto snap-x snap-mandatory p-2 sm:p-1 max-w-full custom-scrollbar"
        >
          {loading && recommendedTracks.length === 0 ? (
            Array(5)
              .fill()
              .map((_, index) => <TrackSkeleton key={`skeleton-${index}`} />)
          ) : !user ? (
            <p className="text-gray-400 text-sm sm:text-xs">Войдите, чтобы увидеть рекомендации</p>
          ) : recommendedTracks.length === 0 ? (
            <p className="text-gray-400 text-sm sm:text-xs">Добавьте треки в избранное для рекомендаций</p>
          ) : (
            recommendedTracks.map((track, index) => {
              const isLast = index === recommendedTracks.length - 1;
              const isFavorite = favorites.some((f) => f.trackId === track.id);
              return (
                <div
                  ref={isLast ? lastTrackRef : null}
                  key={`recommendations-${track.id}-${offset}-${index}`}
                  className={`bg-neutral-800 p-4 sm:p-2 rounded-lg shadow-md hover:bg-neutral-700 transition cursor-pointer flex flex-col items-center min-w-35 max-w-35 snap-start flex-shrink-0 ${
                    currentTrack?.id === track.id && isPlaying ? "bg-green-700" : ""
                  }`}
                  onClick={() => handleTrackClick(track)}
                >
                  <div className="mb-4 sm:mb-2 relative">
                    {track.album_image ? (
                      <img
                        src={track.album_image}
                        alt={track.album_name || track.name}
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
            })
          )}
        </div>
      </div>
    </SkeletonTheme>
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

export default Recommendations;