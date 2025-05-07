import React, { useState, useEffect, useRef, useCallback } from "react";
import { BrowserRouter as Router, Routes, Route, Link, useLocation, Navigate, useNavigate } from "react-router-dom";
import SidebarPlayer from "./components/SidebarPlayer";
import Home from "./pages/Home";
import Library from "./pages/Library";
import Login from "./pages/Login";
import SignUp from "./pages/SignUp";
import AuthLayout from "./components/AuthLayout";
import ProtectedRoute from "./components/ProtectedRoute";
import Profile from "./pages/Profile";
import TitlePage from "./pages/TitlePage";
import Favorites from "./pages/Favorites";
import MyTracks from "./pages/MyTracks";
import SearchResults from "./pages/SearchResults";
import Toast from "./components/Toast";
import { Search, Menu, Heart, ListPlus, Repeat, X } from "lucide-react";
import { Play, Pause, SkipBack, SkipForward } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { auth, db } from "./firebase";
import { useAuthState } from "react-firebase-hooks/auth";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import { getPlaylists, addTrackToPlaylist } from "./components/firestoreService";
import { collection, query, where, getDocs, addDoc, deleteDoc } from "firebase/firestore";

function Loader() {
  return (
    <motion.div
      className="h-screen flex items-center justify-center bg-[#1C1C1C] text-white"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      <motion.div
        className="w-16 h-16 border-4 border-white border-t-transparent rounded-full"
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
      />
    </motion.div>
  );
}

class ErrorBoundary extends React.Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="h-screen flex items-center justify-center bg-[#1C1C1C] text-white">
          <div className="text-center">
            <h1 className="text-2xl mb-4">Что-то пошло не так 😔</h1>
            <p>{this.state.error?.message || "Неизвестная ошибка"}</p>
            <button
              className="mt-4 bg-white px-4 py-2 rounded hover:bg-neutral-200"
              onClick={() => window.location.reload()}
            >
              Перезагрузить
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const MiniPlayer = ({ currentTrack, isPlaying, setIsPlaying, onOpenFullPlayer, miniPlayerRef }) => {
  if (!currentTrack) return null;

  return (
    <motion.div
      ref={miniPlayerRef}
      className="md:hidden fixed bottom-0 left-0 right-0 bg-[#272727] m-6 p-6 flex items-center rounded-lg space-x-4 cursor-pointer z-50"
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onOpenFullPlayer}
    >
      {currentTrack.album_image ? (
        <img
          src={currentTrack.album_image}
          alt={currentTrack.album_name || currentTrack.name}
          className="w-15 h-15 object-cover rounded"
        />
      ) : (
        <div className="w-15 h-15 bg-neutral-700 rounded flex items-center justify-center">
          <svg className="w-6 h-6 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
            <path d="M9 16V8l7 4-7 4z" />
          </svg>
        </div>
      )}
      <div className="flex-1">
        <p className="text-xl">{currentTrack.name}</p>
        <p className="text-gray-400">{currentTrack.artist_name}</p>
      </div>
      <motion.button
        onClick={(e) => {
          e.stopPropagation();
          setIsPlaying(!isPlaying);
        }}
        className="text-white"
        animate={isPlaying ? { scale: [1, 1.1, 1] } : { scale: 1 }}
        transition={isPlaying ? { repeat: Infinity, duration: 1 } : {}}
      >
        {isPlaying ? <Pause size={50} /> : <Play size={50} />}
      </motion.button>
    </motion.div>
  );
};

const MobilePlayerModal = ({
  currentTrack,
  isPlaying,
  setIsPlaying,
  playNextTrack,
  playPreviousTrack,
  onClose,
  playedTime,
  duration,
  setPlayedTime,
  handleProgressBarClick,
  playerRef,
  showToast,
  isLooping,
  setIsLooping,
}) => {
  const [favorites, setFavorites] = useState([]);
  const [isBuffering, setIsBuffering] = useState(false);
  const [playlists, setPlaylists] = useState([]);
  const [showPlaylistMenu, setShowPlaylistMenu] = useState(false);
  const user = auth.currentUser;

  useEffect(() => {
    const fetchFavoritesAndPlaylists = async () => {
      if (user) {
        try {
          const q = query(collection(db, "favorites"), where("userId", "==", user.uid));
          const querySnapshot = await getDocs(q);
          setFavorites(querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
          const playlistData = await getPlaylists(user.uid);
          setPlaylists(playlistData);
        } catch (error) {
          showToast("Ошибка загрузки данных!");
        }
      }
    };
    fetchFavoritesAndPlaylists();
  }, [user, showToast]);

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

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}:${secs < 10 ? "0" : ""}${secs}`;
  };

  if (!currentTrack) return null;

  const isFavorite = favorites.some((f) => f.trackId === currentTrack?.id);
  const isUserTrack = !currentTrack?.album_image;

  return (
    <motion.div
      className="bg-[#272727] p-4 m-4 rounded-lg w-full max-w-md"
      initial={{ y: "100%" }}
      animate={{ y: 0 }}
      exit={{ y: "100%" }}
      transition={{ duration: 0.5, type: "spring", stiffness: 100 }}
    >
      <div className="flex flex-col items-center">
        <div className="relative">
          {isBuffering ? (
            <Skeleton width={128} height={128} borderRadius={8} />
          ) : currentTrack.album_image ? (
            <img
              src={currentTrack.album_image}
              alt={currentTrack.album_name || currentTrack.name}
              className="w-32 h-32 object-cover rounded-lg mb-4"
            />
          ) : (
            <div className="w-32 h-32 bg-neutral-700 rounded-lg mb-4 flex items-center justify-center">
              <svg className="w-12 h-12 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                <path d="M9 16V8l7 4-7 4z" />
              </svg>
            </div>
          )}
        </div>
        <div className="mb-2 text-center">
          <h2 className="text-xl font-semibold">{currentTrack.name}</h2>
          <p className="text-sm text-gray-400">{currentTrack.artist_name}</p>
        </div>
        <div className="w-full my-4">
          <div
            className="relative w-full h-2 bg-neutral-700 rounded-full cursor-pointer"
            onClick={(e) => handleProgressBarClick(e, playerRef)}
          >
            <div
              className="absolute top-0 left-0 h-2 bg-white rounded-full"
              style={{ width: `${(playedTime / duration) * 100 || 0}%` }}
            ></div>
          </div>
          <div className="flex justify-between text-sm text-gray-400 mt-1">
            <span>{formatTime(playedTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
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
          {!isUserTrack && (
            <button
              onClick={handleFavoriteClick}
              className={`text-xl text-gray-400 hover:text-white ${isFavorite ? "text-red-500" : ""}`}
            >
              <Heart fill={isFavorite ? "red" : "none"} />
            </button>
          )}
          <div className="relative flex">
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
          <button
            onClick={() => setIsLooping(!isLooping)}
            className={`text-xl ${isLooping ? "text-green-500" : "text-gray-400"} hover:text-white`}
          >
            <Repeat />
          </button>
        </div>
        <button
          className="mt-4 text-white bg-red-500 px-4 py-2 rounded w-full"
          onClick={onClose}
        >
          Закрыть
        </button>
      </div>
    </motion.div>
  );
};

const Header = ({ setIsMenuOpen }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();

  const handleSearch = () => {
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  return (
    <header className="flex justify-between items-center bg-[#0F0F0F] p-4 shadow-md relative">
      <div className="flex items-center gap-8 w-full">
        <img src="/assets/img/logo/logo.svg" onClick={() => navigate("/")} className="w-12 cursor-pointer" alt ZE="Logo" />
        <div className="relative flex-1 max-w-[600px]">
          <input
            type="text"
            placeholder="Поиск"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={handleKeyPress}
            className="w-full pl-10 pr-10 py-2 rounded bg-neutral-700 text-white focus:outline-none"
          />
          <button
            onClick={handleSearch}
            className="absolute inset-y-0 left-0 flex items-center pl-3 text-neutral-400 hover:text-white"
          >
            <Search size={18} />
          </button>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-neutral-400 hover:text-red-500"
            >
              ✕
            </button>
          )}
        </div>
      </div>
      <div className="flex items-center gap-4">
        <button
          className="md:hidden text-white mr-8"
          onClick={() => setIsMenuOpen(true)}
          onTouchStart={() => setIsMenuOpen(true)}
        >
          <Menu size={24} />
        </button>
        <Link to="/profile" className="hidden md:flex bg-neutral-700 p-2 rounded hover:bg-neutral-600">
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </Link>
      </div>
    </header>
  );
};

const AppLayout = ({ user, currentTrack, setCurrentTrack, isPlaying, setIsPlaying, playNextTrack, playPreviousTrack, setCurrentCategoryTracks, playedTime, setPlayedTime, duration, setDuration, handleProgressBarClick, playerRef, showToast, isLooping, setIsLooping, backgroundColor, setBackgroundColor }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [hoverPos, setHoverPos] = useState({ top: 0, isVisible: false });
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isPlayerOpen, setIsPlayerOpen] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const mobileMenuRef = useRef(null);
  const miniPlayerRef = useRef(null);

  useEffect(() => {
    const hideHover = setTimeout(() => setHoverPos(null), 2000);
    return () => clearTimeout(hideHover);
  }, [hoverPos]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isAnimating) return;
      if (
        mobileMenuRef.current &&
        !mobileMenuRef.current.contains(event.target) &&
        miniPlayerRef.current &&
        !miniPlayerRef.current.contains(event.target)
      ) {
        setIsMenuOpen(false);
      }
    };
    if (isMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isMenuOpen, isAnimating]);

  useEffect(() => {
    if (isMenuOpen) {
      setIsAnimating(true);
      const timer = setTimeout(() => setIsAnimating(false), 400);
      return () => clearTimeout(timer);
    }
  }, [isMenuOpen]);

  if (["/", "/login", "/signup"].includes(location.pathname)) {
    return null;
  }

  return (
    <div className="h-screen flex flex-col bg-transparent text-white overflow-hidden">
      {/* Фон: видео или сплошной цвет */}
      <div className="fixed top-0 left-0 w-full h-full z-[-10]">
        {backgroundColor ? (
          <div
            className="absolute top-0 left-0 w-full h-full transition-colors duration-500"
            style={{ backgroundColor }}
          />
        ) : (
          <div className="absolute top-0 left-0 w-full h-full bg-black">
            <video
              autoPlay
              loop
              muted
              playsInline
              className="absolute top-0 left-0 w-full h-full object-cover"
              onError={(e) => console.error("Video failed to load:", e.target.error)}
              onLoadedData={() => console.log("Video loaded successfully")}
            >
              <source src="/videos/bg.webm" type="video/webm" />
              <source src="/videos/bg.mp4" type="video/mp4" />
              Your browser does not support the video tag.
            </video>
          </div>
        )}
      </div>

      <Header setIsMenuOpen={setIsMenuOpen} />
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {user && (
          <aside className="hidden md:block w-64 bg-[#2E2E2E] mt-5 ml-5 h-full flex-shrink-0 height-screen rounded-lg border-1 border-white/10 overflow-y-auto relative">
            <nav className="p-4 relative">
              <div
                className="absolute bg-neutral-600 transition-all duration-300 rounded"
                style={{
                  width: "calc(100% - 2rem)",
                  height: "40px",
                  top: hoverPos?.top || 0,
                  left: "1rem",
                  opacity: hoverPos?.isVisible ? 1 : 0,
                }}
              ></div>
              {[
                { path: "/home", label: "Главная" },
                { path: "/library", label: "Библиотека" },
                { path: "/favorites", label: "Избранное" },
                { path: "/mytracks", label: "Свои треки" },
              ].map((item, index) => (
                <Link
                  key={index}
                  to={item.path}
                  className="block relative px-4 py-2 rounded mt-2 hover:outline hover:outline-2 hover:outline-neutral-500"
                  onMouseEnter={(e) => setHoverPos({ top: e.target.offsetTop, isVisible: true })}
                  onMouseLeave={() => setHoverPos((prev) => ({ ...prev, isVisible: false }))}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
            <SidebarPlayer
              currentTrack={currentTrack}
              isPlaying={isPlaying}
              setIsPlaying={setIsPlaying}
              playNextTrack={playNextTrack}
              playPreviousTrack={playPreviousTrack}
              setPlayedTime={setPlayedTime}
              playedTime={playedTime}
              duration={duration}
              setDuration={setDuration}
              handleProgressBarClick={handleProgressBarClick}
              playerRef={playerRef}
              showToast={showToast}
              isLooping={isLooping}
              setIsLooping={setIsLooping}
            />
          </aside>
        )}
        <main className="flex-1 p-6 overflow-y-auto bg-transparent">
          <Routes>
            <Route element={<ProtectedRoute user={user} />}>
              <Route path="/home" element={<Home setCurrentTrack={setCurrentTrack} setIsPlaying={setIsPlaying} setCurrentCategoryTracks={setCurrentCategoryTracks} showToast={showToast} />} />
              <Route path="/library" element={<Library setCurrentTrack={setCurrentTrack} setIsPlaying={setIsPlaying} setCurrentCategoryTracks={setCurrentCategoryTracks} showToast={showToast} />} />
              <Route
                path="/profile"
                element={
                  <Profile
                    backgroundColor={backgroundColor}
                    setBackgroundColor={setBackgroundColor}
                  />
                }
              />
              <Route path="/favorites" element={<Favorites setCurrentTrack={setCurrentTrack} setIsPlaying={setIsPlaying} setCurrentCategoryTracks={setCurrentCategoryTracks} showToast={showToast} />} />
              <Route path="/mytracks" element={<MyTracks setCurrentTrack={setCurrentTrack} setIsPlaying={setIsPlaying} setCurrentCategoryTracks={setCurrentCategoryTracks} showToast={showToast} />} />
              <Route path="/search" element={<SearchResults setCurrentTrack={setCurrentTrack} setIsPlaying={setIsPlaying} setCurrentCategoryTracks={setCurrentCategoryTracks} showToast={showToast} />} />
            </Route>
          </Routes>
        </main>
      </div>

      <MiniPlayer
        currentTrack={currentTrack}
        isPlaying={isPlaying}
        setIsPlaying={setIsPlaying}
        onOpenFullPlayer={() => setIsPlayerOpen(true)}
        miniPlayerRef={miniPlayerRef}
      />

      <AnimatePresence>
        {isPlayerOpen && (
          <motion.div
            className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <MobilePlayerModal
              currentTrack={currentTrack}
              isPlaying={isPlaying}
              setIsPlaying={setIsPlaying}
              playNextTrack={playNextTrack}
              playPreviousTrack={playPreviousTrack}
              onClose={() => setIsPlayerOpen(false)}
              playedTime={playedTime}
              duration={duration}
              setPlayedTime={setPlayedTime}
              handleProgressBarClick={handleProgressBarClick}
              playerRef={playerRef}
              showToast={showToast}
              isLooping={isLooping}
              setIsLooping={setIsLooping}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            ref={mobileMenuRef}
            className="md:hidden fixed inset-0 bg-[#2E2E2E] z-50 flex flex-col"
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
          >
            <div className="flex justify-between items-center p-4 border-b border-neutral-700">
              <img src="/assets/img/logo/logo.svg" className="w-12" alt="Logo" />
              <button
                onClick={() => setIsMenuOpen(false)}
                className="text-white"
              >
                <X size={24} />
              </button>
            </div>
            <nav className="flex flex-col p-4">
              {[
                { path: "/home", label: "Главная" },
                { path: "/library", label: "Библиотека" },
                { path: "/favorites", label: "Избранное" },
                { path: "/mytracks", label: "Свои треки" },
                { path: "/profile", label: "Профиль" },
              ].map((item, index) => (
                <Link
                  key={index}
                  to={item.path}
                  className="block px-4 py-2 text-lg hover:bg-neutral-600 rounded"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

function App() {
  const [currentTrack, setCurrentTrack] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentCategoryTracks, setCurrentCategoryTracks] = useState([]);
  const [playedTime, setPlayedTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLooping, setIsLooping] = useState(false);
  const [user, loading] = useAuthState(auth);
  const [toast, setToast] = useState({ message: "", isVisible: false });
  const playerRef = useRef(null);
  const [backgroundColor, setBackgroundColor] = useState(() => {
    const storedColor = localStorage.getItem("backgroundColor");
    console.log("Initial backgroundColor from localStorage:", storedColor);
    return storedColor && storedColor !== "" ? storedColor : null;
  });

  const showToast = useCallback((message) => {
    setToast({ message, isVisible: true });
    setTimeout(() => setToast({ message: "", isVisible: false }), 3000);
  }, []);

  useEffect(() => {
    console.log("Saving backgroundColor to localStorage:", backgroundColor);
    localStorage.setItem("backgroundColor", backgroundColor || "");
  }, [backgroundColor]);

  const handleProgressBarClick = (e, playerRef) => {
    const progressBar = e.currentTarget;
    const clickPositionX = e.nativeEvent.offsetX;
    const progressBarWidth = progressBar.offsetWidth;
    const newPlayedTime = (clickPositionX / progressBarWidth) * duration;
    setPlayedTime(newPlayedTime);
    if (playerRef.current) {
      playerRef.current.seekTo(newPlayedTime / duration, "fraction");
    }
  };

  const playNextTrack = () => {
    console.log("playNextTrack called, currentCategoryTracks:", currentCategoryTracks);
    if (!currentTrack || !currentCategoryTracks.length) {
      console.log("No currentTrack or empty currentCategoryTracks");
      return;
    }
    const currentIndex = currentCategoryTracks.findIndex((t) => t.id === currentTrack.id);
    console.log("Current index:", currentIndex);
    if (currentIndex < currentCategoryTracks.length - 1) {
      const nextTrack = currentCategoryTracks[currentIndex + 1];
      console.log("Switching to next track:", nextTrack);
      setCurrentTrack(nextTrack);
      setIsPlaying(true);
    } else {
      console.log("No next track available");
    }
  };

  const playPreviousTrack = () => {
    console.log("playPreviousTrack called, currentCategoryTracks:", currentCategoryTracks);
    if (!currentTrack || !currentCategoryTracks.length) {
      console.log("No currentTrack or empty currentCategoryTracks");
      return;
    }
    const currentIndex = currentCategoryTracks.findIndex((t) => t.id === currentTrack.id);
    console.log("Current index:", currentIndex);
    if (currentIndex > 0) {
      const prevTrack = currentCategoryTracks[currentIndex - 1];
      console.log("Switching to previous track:", prevTrack);
      setCurrentTrack(prevTrack);
      setIsPlaying(true);
    } else {
      console.log("No previous track available");
    }
  };

  if (loading) return <Loader />;

  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <ErrorBoundary>
        <Toast message={toast.message} isVisible={toast.isVisible} onClose={() => setToast({ message: "", isVisible: false })} />
        <Routes>
          <Route path="/" element={!user ? <TitlePage /> : <Navigate to="/home" replace />} />
          <Route element={<AuthLayout />}>
            <Route path="/login" element={user ? <Navigate to="/home" replace /> : <Login />} />
            <Route path="/signup" element={user ? <Navigate to="/home" replace /> : <SignUp />} />
          </Route>
          <Route
            path="/*"
            element={
              <AppLayout
                user={user}
                currentTrack={currentTrack}
                setCurrentTrack={setCurrentTrack}
                isPlaying={isPlaying}
                setIsPlaying={setIsPlaying}
                playNextTrack={playNextTrack}
                playPreviousTrack={playPreviousTrack}
                setCurrentCategoryTracks={setCurrentCategoryTracks}
                playedTime={playedTime}
                setPlayedTime={setPlayedTime}
                duration={duration}
                setDuration={setDuration}
                handleProgressBarClick={handleProgressBarClick}
                playerRef={playerRef}
                showToast={showToast}
                isLooping={isLooping}
                setIsLooping={setIsLooping}
                backgroundColor={backgroundColor}
                setBackgroundColor={setBackgroundColor}
              />
            }
          />
        </Routes>
      </ErrorBoundary>
    </Router>
  );
}

export default App;