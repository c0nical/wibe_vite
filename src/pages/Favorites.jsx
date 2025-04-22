import React, { useEffect, useState } from "react";
import { db, auth } from "../firebase";
import { collection, query, where, getDocs, deleteDoc, doc } from "firebase/firestore";
import { Trash2 } from "lucide-react";
import { motion } from "framer-motion";
import Skeleton from "react-loading-skeleton";
import { SkeletonTheme } from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

const Favorites = ({ setCurrentTrack, setIsPlaying, setCurrentCategoryTracks, showToast }) => {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFavorites = async () => {
      const user = auth.currentUser;
      if (user) {
        const favoritesQuery = query(
          collection(db, "favorites"),
          where("userId", "==", user.uid)
        );
        const querySnapshot = await getDocs(favoritesQuery);
        const favoriteTracks = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setFavorites(favoriteTracks);
        setLoading(false);
      }
    };
    fetchFavorites();
  }, []);

  const handlePlayTrack = (track) => {
    const formattedTrack = {
      id: track.trackId,
      name: track.trackName,
      artist_name: track.artistName,
      audio: track.trackUrl,
      album_image: track.albumImage,
      duration: track.duration,
    };
    console.log("Форматированный трек:", formattedTrack);
    setCurrentTrack(formattedTrack);
    setIsPlaying(true);
    setCurrentCategoryTracks(favorites.map((t) => ({
      id: t.trackId,
      name: t.trackName,
      artist_name: t.artistName,
      audio: t.trackUrl,
      album_image: t.albumImage,
      duration: t.duration,
    })));
  };

  const handleRemoveFavorite = async (trackId, e) => {
    e.stopPropagation();
    const user = auth.currentUser;
    if (user) {
      const docRef = doc(db, "favorites", trackId);
      await deleteDoc(docRef);
      setFavorites(favorites.filter((track) => track.id !== trackId));
      showToast("Трек удалён из избранного!");
    }
  };

  const formatDuration = (durationInSeconds) => {
    const minutes = Math.floor(durationInSeconds / 60);
    const seconds = durationInSeconds % 60;
    return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
  };

  return (
    <SkeletonTheme baseColor="#4F4F4F" highlightColor="#A6A6A6">
      <div className="text-white p-4">
        <h1 className="text-3xl font-bold mb-6">Избранное</h1>
        {loading ? (
          <div className="space-y-4">
            {Array(4)
              .fill()
              .map((_, index) => (
                <div key={index} className="flex items-center gap-4">
                  <Skeleton width={64} height={64} borderRadius={8} />
                  <div className="flex-1">
                    <Skeleton width={200} height={20} />
                    <Skeleton width={150} height={15} className="mt-2" />
                  </div>
                  <Skeleton width={40} height={20} />
                </div>
              ))}
          </div>
        ) : favorites.length === 0 ? (
          <p className="text-gray-400">Нет избранных треков</p>
        ) : (
          <div className="space-y-4">
            {favorites.map((track) => (
              <motion.div
                key={track.id}
                className="flex items-center gap-4 bg-neutral-800 p-4 rounded-lg shadow-md hover:bg-neutral-700 transition cursor-pointer"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handlePlayTrack(track)}
              >
                {track.albumImage ? (
                  <img
                    src={track.albumImage}
                    alt={track.trackName}
                    className="w-16 h-16 object-cover rounded-lg"
                  />
                ) : (
                  <div className="w-16 h-16 bg-gray-600 rounded-lg"></div>
                )}
                <div className="flex-1">
                  <h3 className="text-lg font-semibold">{track.trackName}</h3>
                  <p className="text-sm text-gray-400">{track.artistName}</p>
                </div>
                <p className="text-sm text-gray-400">{formatDuration(track.duration)}</p>
                <button
                  onClick={(e) => handleRemoveFavorite(track.id, e)}
                  className="text-xl text-red-500 hover:text-white"
                >
                  <Trash2 />
                </button>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </SkeletonTheme>
  );
};

export default Favorites;