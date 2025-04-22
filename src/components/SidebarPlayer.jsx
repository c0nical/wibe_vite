import React, { useState, useEffect, useRef } from "react";
import ReactPlayer from "react-player";
import { Volume2, VolumeX, Heart, ListPlus } from "lucide-react";
import { SkipBack, Play, Pause, SkipForward } from "lucide-react";
import { auth, db } from "../firebase";
import { motion } from "framer-motion";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import { collection, query, where, getDocs, addDoc, deleteDoc } from "firebase/firestore";
import { getPlaylists, addTrackToPlaylist } from "./firestoreService";

const SidebarPlayer = ({
  currentTrack,
  isPlaying,
  setIsPlaying,
  playNextTrack,
  playPreviousTrack,
  setPlayedTime,
  playedTime,
  duration,
  setDuration,
  handleProgressBarClick,
  playerRef,
  showToast,
}) => {
  const [volume, setVolume] = useState(() => {
    return parseFloat(localStorage.getItem("playerVolume")) || 0.5;
  });
  const [prevVolume, setPrevVolume] = useState(volume);
  const [favorites, setFavorites] = useState([]);
  const [isBuffering, setIsBuffering] = useState(false);
  const [playlists, setPlaylists] = useState([]);
  const [showPlaylistMenu, setShowPlaylistMenu] = useState(false);
  const user = auth.currentUser;

  useEffect(() => {
    const fetchFavoritesAndPlaylists = async () => {
      if (user) {
        try {
          // Загрузка избранного
          const q = query(collection(db, "favorites"), where("userId", "==", user.uid));
          const querySnapshot = await getDocs(q);
          setFavorites(querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
          // Загрузка плейлистов
          const playlistData = await getPlaylists(user.uid);
          setPlaylists(playlistData);
        } catch (error) {
          showToast("Ошибка загрузки данных!");
        }
      }
    };
    fetchFavoritesAndPlaylists();
  }, [user, showToast]);

  useEffect(() => {
    localStorage.setItem("playerVolume", volume);
  }, [volume]);

  const handleProgress = (state) => {
    setPlayedTime(state.playedSeconds);
  };

  const handleDuration = (dur) => {
    setDuration(dur);
  };

  const toggleMute = () => {
    if (volume > 0) {
      setPrevVolume(volume);
      setVolume(0);
    } else {
      setVolume(prevVolume);
    }
  };

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}:${secs < 10 ? "0" : ""}${secs}`;
  };

  const handleFavoriteClick = async (e) => {
    e.stopPropagation();
    if (!user) {
      showToast("Авторизуйтесь, чтобы добавить в избранное!");
      return;
    }
    try {
      const q = query(
        collection(db, "favorites"),
        where("userId", "==", user.uid),
        where("trackId", "==", currentTrack.id)
      );
      const querySnapshot = await getDocs(q);
      if (querySnapshot.empty) {
        const favoriteData = {
          userId: user.uid,
          trackId: currentTrack.id,
          trackName: currentTrack.name,
          trackArtist: currentTrack.artist_name,
          trackUrl: currentTrack.audio,
          albumImage: currentTrack.album_image,
          artistName: currentTrack.artist_name,
          duration: currentTrack.duration,
        };
        const docRef = await addDoc(collection(db, "favorites"), favoriteData);
        setFavorites([...favorites, { id: docRef.id, ...favoriteData }]);
        showToast("Трек добавлен в избранное!");
      } else {
        querySnapshot.forEach(async (doc) => {
          await deleteDoc(doc.ref);
        });
        setFavorites(favorites.filter((f) => f.trackId !== currentTrack.id));
        showToast("Трек удалён из избранного!");
      }
    } catch (error) {
      console.error("Ошибка при добавлении/удалении в избранное:", error);
      showToast("Ошибка при работе с избранным!");
    }
  };

  const handleAddToPlaylist = async (playlistId) => {
    if (!user) {
      showToast("Авторизуйтесь, чтобы добавить в плейлист!");
      return;
    }
    if (!currentTrack) {
      showToast("Трек не выбран!");
      return;
    }
    try {
      await addTrackToPlaylist(user.uid, playlistId, currentTrack);
      showToast("Трек добавлен в плейлист!");
      setShowPlaylistMenu(false);
    } catch (error) {
      showToast("Ошибка при добавлении в плейлист!");
    }
  };

  const isFavorite = favorites.some((f) => f.trackId === currentTrack?.id);

  return (
    <div className="bg-[#272727] p-8 flex flex-col items-center">
      {currentTrack ? (
        <>
          <div className="relative">
            {isBuffering ? (
              <Skeleton width={128} height={128} borderRadius={8} />
            ) : (
              currentTrack.album_image && (
                <img
                  src={currentTrack.album_image}
                  alt={currentTrack.album_name}
                  className="w-32 h-32 object-cover rounded-lg mb-4"
                />
              )
            )}
          </div>

          <div className="mb-2 text-center">
            <h2 className="text-xl font-semibold">{currentTrack.name}</h2>
            <p className="text-sm text-gray-400">{currentTrack.artist_name}</p>
          </div>

          <div className="w-full my-4">
            <ReactPlayer
              ref={playerRef}
              url={currentTrack ? currentTrack.audio : null}
              playing={isPlaying}
              controls={false}
              width="0"
              height="0"
              volume={volume}
              onProgress={handleProgress}
              onDuration={handleDuration}
              onBuffer={() => setIsBuffering(true)}
              onBufferEnd={() => setIsBuffering(false)}
              onError={(e) => {
                console.error("Ошибка загрузки трека:", e);
                setIsBuffering(false);
                showToast("Ошибка загрузки трека!");
              }}
            />

            <div
              className="relative w-full h-2 bg-gray-600 rounded-full cursor-pointer"
              onClick={(e) => handleProgressBarClick(e, playerRef)}
            >
              <div
                className="absolute top-0 left-0 h-2 bg-green-500 rounded-full"
                style={{ width: `${(playedTime / duration) * 100 || 0}%` }}
              ></div>
            </div>
            <div className="flex justify-between text-sm text-gray-400 mt-1">
              <span>{formatTime(playedTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          <div className="relative flex items-center mt-4 space-x-2">
            <button className="text-xl text-gray-400 hover:text-white" onClick={toggleMute}>
              {volume > 0 ? <Volume2 /> : <VolumeX />}
            </button>

            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={volume}
              onChange={(e) => setVolume(parseFloat(e.target.value))}
              className="w-32"
            />
          </div>

          <div className="flex justify-around items-center w-full mt-4">
            <button
              onClick={playPreviousTrack}
              className="text-3xl text-gray-400 hover:text-white"
            >
              <SkipBack />
            </button>

            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="text-3xl px-4 py-2 text-gray-400 hover:text-white flex items-center"
            >
              {isPlaying ? <Pause /> : <Play />}
            </button>

            <button
              onClick={playNextTrack}
              className="text-3xl text-gray-400 hover:text-white"
            >
              <SkipForward />
            </button>
          </div>

          <div className="flex gap-4 mt-4">
            <button
              onClick={handleFavoriteClick}
              className={`text-xl text-gray-400 hover:text-white ${isFavorite ? "text-red-500" : ""}`}
            >
              <Heart fill={isFavorite ? "red" : "none"} />
            </button>
            <div className="relative">
              <button
                onClick={() => setShowPlaylistMenu(!showPlaylistMenu)}
                className="text-xl text-gray-400 hover:text-white"
              >
                <ListPlus />
              </button>
              {showPlaylistMenu && (
                <div className="absolute bottom-8 left-0 bg-neutral-700 rounded shadow-lg z-10">
                  {playlists.length > 0 ? (
                    playlists.map((playlist) => (
                      <button
                        key={playlist.id}
                        className="block px-4 py-2 text-white hover:bg-neutral-600 w-full text-left"
                        onClick={() => handleAddToPlaylist(playlist.id)}
                      >
                        {playlist.name}
                      </button>
                    ))
                  ) : (
                    <div className="px-4 py-2 text-gray-400">Нет плейлистов</div>
                  )}
                </div>
              )}
            </div>
          </div>
        </>
      ) : (
        <div className="text-center text-gray-400">Выберите трек для воспроизведения</div>
      )}
    </div>
  );
};

export default SidebarPlayer;