import React, { useState, useEffect } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import { FaPlay } from "react-icons/fa";

const FeaturedTracks = ({ setCurrentTrack, setIsPlaying, currentTrack, isPlaying }) => {
  const [tracks, setTracks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFeaturedTracks = async () => {
      try {
        const response = await axios.get("https://api.jamendo.com/v3.0/tracks/", {
          params: {
            client_id: import.meta.env.VITE_JAMENDO_API_KEY,
            format: "json",
            limit: 3,
            order: "popularity_total",
          },
        });
        setTracks(response.data.results);
      } catch (error) {
        console.error("Ошибка при загрузке избранных треков:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchFeaturedTracks();
  }, []);

  const handleTrackClick = (track) => {
    if (currentTrack?.id === track.id && isPlaying) {
      setIsPlaying(false);
    } else {
      setCurrentTrack(track);
      setIsPlaying(true);
    }
  };

  return (
    <div className="mb-12">
      <h2 className="text-2xl font-bold mb-4">Избранные треки</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {loading
          ? Array(3)
              .fill()
              .map((_, index) => (
                <div key={index} className="relative w-full h-64 bg-gray-600 rounded-lg"></div>
              ))
          : tracks.map((track, index) => (
              <motion.div
                key={track.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="relative cursor-pointer group"
                onClick={() => handleTrackClick(track)}
              >
                <img
                  src={track.album_image}
                  alt={track.album_name}
                  className="w-full h-64 object-cover rounded-lg"
                />
                {/* Текст поверх обложки с фоном */}
                <div className="absolute bottom-0 left-0 right-0 p-4 bg-black/50 text-white">
                  <h3 className="text-lg font-semibold">{track.name}</h3>
                  <p className="text-sm text-gray-300">{track.artist_name}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {Math.floor(track.duration / 60)}:{(track.duration % 60).toString().padStart(2, "0")}
                  </p>
                </div>
                {/* Иконка воспроизведения при наведении */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <FaPlay size={48} className="text-white" />
                </div>
              </motion.div>
            ))}
      </div>
    </div>
  );
};

export default FeaturedTracks;