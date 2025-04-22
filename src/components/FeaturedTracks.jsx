import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import Skeleton from "react-loading-skeleton";
import { SkeletonTheme } from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import { ChevronLeft, ChevronRight, Heart } from "lucide-react";
import { db, auth } from "../firebase";
import { collection, query, where, getDocs, addDoc, deleteDoc } from "firebase/firestore";

const FeaturedTracks = ({
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

  const fetchTracks = async (newOffset = 0) => {
    try {
      const response = await axios.get("https://api.jamendo.com/v3.0/tracks/", {
        params: {
          client_id: import.meta.env.VITE_JAMENDO_API_KEY,
          format: "json",
          limit: 10,
          offset: newOffset,
          order: "popularity_week",
        },
      });

      if (newOffset === 0) {
        setTracks(response.data.results);
      } else {
        setTracks((prev) => [...prev, ...response.data.results]);
      }
    } catch (error) {
      console.error("Ошибка при загрузке избранных треков:", error);
      showToast("Ошибка загрузки треков!");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTracks(offset);
  }, [offset]);

  useEffect(() => {
    if (setCurrentCategoryTracks && tracks.length) {
      setCurrentCategoryTracks(tracks);
    }
  }, [tracks, setCurrentCategoryTracks]);

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

  const handleTrackClick = async (track) => {
    console.log(`Featured track clicked: ${track.name}, Tracks:`, tracks);
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
          const favoriteData = {
            userId: user.uid,
            trackId: track.id,
            trackName: track.name,
            trackArtist: track.artist_name,
            trackUrl: track.audio,
            albumImage: track.album_image,
            artistName: track.artist_name,
            duration: track.duration,
          };
          await addDoc(collection(db, "favorites"), favoriteData);
          setFavorites([...favorites, { id: track.id, ...favoriteData }]);
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
    <SkeletonTheme baseColor="#4F4F4F" highlightColor="#A6A6A6">
      <div className="mb-8 bg-neutral-900 p-5 rounded-lg">
        <div className="flex justify-between items-center mb-4 bg-gray-800 p-4 rounded-lg">
          <h2 className="text-2xl font-semibold">Избранные треки</h2>
          <div className="flex gap-2">
            <button
              onClick={() => handleScroll(-1)}
              className="p-2 bg-inherit border-2 border-solid border-gray-600 rounded hover:bg-gray-600"
            >
              <ChevronLeft size={24} />
            </button>
            <button
              onClick={() => handleScroll(1)}
              className="p-2 bg-inherit border-2 border-solid border-gray-600 rounded hover:bg-gray-600"
            >
              <ChevronRight size={24} />
            </button>
          </div>
        </div>
        <div
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto snap-x snap-mandatory p-2 md:overflow-x-hidden md:snap-x md:snap-mandatory"
        >
          {loading && tracks.length === 0
            ? Array(5)
                .fill()
                .map((_, index) => (
                  <div
                    key={index}
                    className="bg-neutral-800 p-4 rounded-lg shadow-md flex flex-col items-center min-w-[180px] snap-start"
                  >
                    <Skeleton width={160} height={160} borderRadius={8} />
                    <h2 className="mt-4">
                      <Skeleton width={120} height={20} />
                    </h2>
                    <p className="mt-2">
                      <Skeleton width={100} height={15} />
                    </p>
                  </div>
                ))
            : tracks.map((track, index) => {
                const isLast = index === tracks.length - 1;
                const isFavorite = favorites.some((f) => f.trackId === track.id);
                return (
                  <div
                    ref={isLast ? lastTrackRef : null}
                    key={`featured-${track.id}`}
                    className={`bg-neutral-800 p-4 rounded-lg shadow-md hover:bg-neutral-700 transition cursor-pointer flex flex-col items-center min-w-[180px] snap-start ${
                      currentTrack?.id === track.id && isPlaying ? "bg-green-700" : ""
                    }`}
                    onClick={() => handleTrackClick(track)}
                  >
                    <div className="mb-4 relative">
                      {track.album_image ? (
                        <img
                          src={track.album_image}
                          alt={track.album_name}
                          className="w-40 h-40 object-cover rounded-lg"
                        />
                      ) : (
                        <div className="w-40 h-40 bg-gray-600 rounded-lg"></div>
                      )}
                      <button
                        onClick={(e) => handleFavoriteClick(track, e)}
                        className={`absolute top-2 right-2 text-xl ${isFavorite ? "text-red-500" : "text-gray-400"} hover:text-white`}
                      >
                        <Heart fill={isFavorite ? "red" : "none"} />
                      </button>
                    </div>
                    <h3 className="text-lg font-semibold text-center h-12 overflow-hidden">
                      {track.name}
                    </h3>
                    <p className="text-sm text-gray-400 text-center">{track.artist_name}</p>
                  </div>
                );
              })}
        </div>
      </div>
    </SkeletonTheme>
  );
};

export default FeaturedTracks;