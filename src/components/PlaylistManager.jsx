import React, { useState, useEffect } from "react";
import { auth } from "../firebase";
import { FaPlus, FaTrash, FaPlay } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import { createPlaylist, getPlaylists, deletePlaylist, addTrackToPlaylist, removeTrackFromPlaylist } from "../components/firestoreService";

const PlaylistManager = ({ setCurrentTrack, setIsPlaying, setCurrentCategoryTracks, showToast }) => {
  const [playlists, setPlaylists] = useState([]);
  const [newPlaylistName, setNewPlaylistName] = useState("");
  const [selectedPlaylist, setSelectedPlaylist] = useState(null);
  const user = auth.currentUser;

  useEffect(() => {
    if (user) {
      fetchPlaylists();
    }
  }, [user]);

  const fetchPlaylists = async () => {
    try {
      const playlistData = await getPlaylists(user.uid);
      setPlaylists(playlistData);
    } catch (error) {
      showToast("Ошибка загрузки плейлистов!");
    }
  };

  const handleCreatePlaylist = async () => {
    if (!user) {
      showToast("Авторизуйтесь, чтобы создать плейлист!");
      return;
    }
    if (!newPlaylistName.trim()) {
      showToast("Введите название плейлиста!");
      return;
    }
    try {
      await createPlaylist(user.uid, newPlaylistName);
      setNewPlaylistName("");
      fetchPlaylists();
      showToast("Плейлист создан!");
    } catch (error) {
      showToast("Ошибка при создании плейлиста!");
    }
  };

  const handleDeletePlaylist = async (playlistId) => {
    try {
      await deletePlaylist(user.uid, playlistId);
      fetchPlaylists();
      setSelectedPlaylist(null);
      showToast("Плейлист удалён!");
    } catch (error) {
      showToast("Ошибка при удалении плейлиста!");
    }
  };

  const handleDeleteTrackFromPlaylist = async (playlistId, trackId) => {
    try {
      await removeTrackFromPlaylist(user.uid, playlistId, trackId);
      fetchPlaylists();
      if (selectedPlaylist && selectedPlaylist.id === playlistId) {
        const updatedTracks = selectedPlaylist.tracks.filter((track) => track.id !== trackId);
        setSelectedPlaylist({ ...selectedPlaylist, tracks: updatedTracks });
      }
      showToast("Трек удалён из плейлиста!");
    } catch (error) {
      showToast("Ошибка при удалении трека!");
    }
  };

  const playPlaylist = (playlist) => {
    if (playlist.tracks.length > 0) {
      setCurrentCategoryTracks(playlist.tracks);
      setCurrentTrack(playlist.tracks[0]);
      setIsPlaying(true);
      showToast(`Воспроизведение плейлиста: ${playlist.name}`);
    } else {
      showToast("Плейлист пуст!");
    }
  };

  const playTrack = (track) => {
    setCurrentTrack(track);
    setIsPlaying(true);
    showToast(`Воспроизведение: ${track.name}`);
  };

  return (
    <motion.div
      className="bg-neutral-900 p-6 rounded-lg shadow-lg"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <h2 className="text-2xl font-bold mb-4 text-white">Мои плейлисты</h2>

      {/* Создание нового плейлиста */}
      <div className="flex gap-2 mb-6">
        <input
          type="text"
          value={newPlaylistName}
          onChange={(e) => setNewPlaylistName(e.target.value)}
          placeholder="Название плейлиста"
          className="flex-1 p-2 bg-neutral-700 text-white rounded focus:outline-none focus:ring-2 focus:ring-white"
        />
        <motion.button
          onClick={handleCreatePlaylist}
          className="p-2 bg-white text-black rounded hover:bg-neutral-200"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <FaPlus />
        </motion.button>
      </div>

      {/* Список плейлистов */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <AnimatePresence>
          {playlists.map((playlist) => (
            <motion.div
              key={playlist.id}
              className="bg-neutral-800 p-4 rounded-lg cursor-pointer hover:bg-neutral-700 transition"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
              onClick={() => setSelectedPlaylist(playlist)}
            >
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-white">{playlist.name}</h3>
                <div className="flex gap-2">
                  <motion.button
                    onClick={(e) => {
                      e.stopPropagation();
                      playPlaylist(playlist);
                    }}
                    className="p-2 text-gray-400 hover:text-white"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <FaPlay />
                  </motion.button>
                  <motion.button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeletePlaylist(playlist.id);
                    }}
                    className="p-2 text-gray-400 hover:text-red-500"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <FaTrash />
                  </motion.button>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Отображение треков в выбранном плейлисте */}
      {selectedPlaylist && (
        <motion.div
          className="mt-6 bg-neutral-800 p-6 rounded-lg"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h3 className="text-xl font-bold mb-4 text-white">{selectedPlaylist.name}</h3>
          {selectedPlaylist.tracks.length > 0 ? (
            <div className="space-y-4">
              <AnimatePresence>
                {selectedPlaylist.tracks.map((track, index) => (
                  <motion.div
                    key={`${track.id}-${index}`}
                    className="flex justify-between items-center bg-neutral-700 p-2 sm:p-3 rounded-lg hover:bg-neutral-600 transition"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                  >
                    <div
                      className="flex items-center gap-4 cursor-pointer flex-1 min-w-0"
                      onClick={() => playTrack(track)}
                    >
                      <img
                        src={track.album_image}
                        alt={track.name}
                        className="w-10 h-10 sm:w-12 sm:h-12 object-cover rounded"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-semibold truncate">{track.name}</p>
                        <p className="text-gray-400 text-sm truncate">{track.artist_name}</p>
                      </div>
                    </div>
                    <motion.button
                      onClick={() => handleDeleteTrackFromPlaylist(selectedPlaylist.id, track.id)}
                      className="p-2 text-gray-400 hover:text-red-500 flex-shrink-0"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <FaTrash />
                    </motion.button>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          ) : (
            <p className="text-gray-400">В этом плейлисте пока нет треков.</p>
          )}
        </motion.div>
      )}
    </motion.div>
  );
};

export default PlaylistManager;