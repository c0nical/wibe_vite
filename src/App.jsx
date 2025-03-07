import React, { useState, useEffect } from "react";
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
import SearchResults from "./pages/SearchResults";
import { FaSearch, FaBars } from "react-icons/fa";
import { BiPlay, BiPause } from "react-icons/bi";
import { motion, AnimatePresence } from "framer-motion";
import { auth } from "./firebase";
import { useAuthState } from "react-firebase-hooks/auth";

function Loader() {
  return (
    <div className="h-screen flex items-center justify-center bg-[#1C1C1C] text-white">
      <p className="text-xl">Загрузка...</p>
    </div>
  );
}

const MiniPlayer = ({ currentTrack, isPlaying, onPlayPause, onOpenFullPlayer }) => {
  if (!currentTrack) return null;

  return (
    <motion.div
      className="md:hidden fixed bottom-0 left-0 right-0 bg-[#272727] m-6 p-6 flex items-center rounded-lg space-x-4 cursor-pointer z-50"
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onOpenFullPlayer}
    >
      <img
        src={currentTrack.album_image}
        alt={currentTrack.album_name}
        className="w-15 h-15 object-cover rounded"
      />
      <div className="flex-1">
        <p className="text-xl">{currentTrack.name}</p>
        <p className="text-gray-400">{currentTrack.artist_name}</p>
      </div>
      <motion.button
        onClick={(e) => {
          e.stopPropagation();
          onPlayPause();
        }}
        className="text-white"
        animate={isPlaying ? { scale: [1, 1.1, 1] } : { scale: 1 }}
        transition={isPlaying ? { repeat: Infinity, duration: 1 } : {}}
      >
        {isPlaying ? <BiPause size={50} /> : <BiPlay size={50} />}
      </motion.button>
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
      <div className="flex gap-6 items-center">
        <img src="/assets/img/logo/logo.svg" onClick={() => navigate("/")} className="w-12 cursor-pointer" alt="Logo" />
        <div className="relative">
          <input
            type="text"
            placeholder="Поиск"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={handleKeyPress}
            className="pl-10 pr-4 py-2 rounded bg-neutral-700 text-white focus:outline-none w-64"
          />
          <button
            onClick={handleSearch}
            className="absolute inset-y-0 left-0 flex items-center pl-3 text-neutral-400 hover:text-green-500"
          >
            <FaSearch size={18} />
          </button>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <button className="md:hidden text-white" onClick={() => setIsMenuOpen(true)}>
          <FaBars size={24} />
        </button>
        <Link to="/profile" className="bg-gray-700 px-4 py-2 rounded hover:bg-gray-600 hidden md:block">
          Личный кабинет
        </Link>
      </div>
    </header>
  );
};

const AppLayout = ({ user, currentTrack, setCurrentTrack, isPlaying, setIsPlaying }) => {
  const location = useLocation();
  const [hoverPos, setHoverPos] = useState({ top: 0, isVisible: false });
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isPlayerOpen, setIsPlayerOpen] = useState(false);

  useEffect(() => {
    const hideHover = setTimeout(() => setHoverPos(null), 2000);
    return () => clearTimeout(hideHover);
  }, [hoverPos]);

  const onNext = () => console.log("Next track");
  const onPrevious = () => console.log("Previous track");

  if (["/", "/login", "/signup"].includes(location.pathname)) {
    return null;
  }

  return (
    <div className="h-screen flex flex-col bg-gradient-to-b from-[#1a1a1a] to-[#000000] text-white overflow-hidden">
      <Header setIsMenuOpen={setIsMenuOpen} />
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {user && (
          <aside className="hidden md:block w-64 bg-[#2E2E2E] h-full flex-shrink-0 overflow-y-auto relative">
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
              onPlayPause={() => setIsPlaying(!isPlaying)}
              onNext={onNext}
              onPrevious={onPrevious}
            />
          </aside>
        )}
        <main className="flex-1 p-6 overflow-y-auto bg-gradient-to-b from-[#1a1a1a] to-[#000000]">
          <Routes>
            <Route element={<ProtectedRoute user={user} />}>
              <Route path="/home" element={<Home setCurrentTrack={setCurrentTrack} setIsPlaying={setIsPlaying} />} />
              <Route path="/library" element={<Library />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/favorites" element={<Favorites setCurrentTrack={setCurrentTrack} setIsPlaying={setIsPlaying} />} />
              <Route path="/search" element={<SearchResults />} />
            </Route>
          </Routes>
        </main>
      </div>

      {isMenuOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 md:hidden">
          <div className="bg-[#2E2E2E] w-64 h-full p-4">
            <button className="text-white mb-4" onClick={() => setIsMenuOpen(false)}>
              Закрыть
            </button>
            {[
              { path: "/home", label: "Главная" },
              { path: "/library", label: "Библиотека" },
              { path: "/favorites", label: "Избранное" },
              { path: "/profile", label: "Личный кабинет" },
            ].map((item, index) => (
              <Link
                key={index}
                to={item.path}
                className="block px-4 py-2 text-white hover:bg-neutral-600 rounded"
                onClick={() => setIsMenuOpen(false)}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      )}

      <MiniPlayer
        currentTrack={currentTrack}
        isPlaying={isPlaying}
        onPlayPause={() => setIsPlaying(!isPlaying)}
        onOpenFullPlayer={() => setIsPlayerOpen(true)}
      />

{/* Полный плеер в модалке снизу */}
<AnimatePresence>
      {isPlayerOpen && (
        <motion.div
          className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <motion.div
            className="bg-[#272727] p-4 m-4 rounded-lg w-full max-w-md"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ duration: 0.5, type: "spring", stiffness: 100 }}
          >
            <SidebarPlayer
              currentTrack={currentTrack}
              isPlaying={isPlaying}
              onPlayPause={() => setIsPlaying(!isPlaying)}
              onNext={onNext}
              onPrevious={onPrevious}
            />
            <button
              className="mt-4 text-white bg-red-500 px-4 py-2 rounded w-full"
              onClick={() => setIsPlayerOpen(false)}
            >
              Закрыть
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
    </div>
  );
};

function App() {
  const [currentTrack, setCurrentTrack] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [user, loading] = useAuthState(auth);

  if (loading) return <Loader />;

  return (
    <Router>
      <Routes>
        <Route path="/" element={!user ? <TitlePage /> : <Navigate to="/home" replace />} />
        <Route element={<AuthLayout />}>
          <Route path="/login" element={user ? <Navigate to="/home" replace /> : <Login />} />
          <Route path="/signup" element={user ? <Navigate to="/home" replace /> : <SignUp />} />
        </Route>
        <Route
          path="/*"
          element={<AppLayout user={user} currentTrack={currentTrack} setCurrentTrack={setCurrentTrack} isPlaying={isPlaying} setIsPlaying={setIsPlaying} />}
        />
      </Routes>
    </Router>
  );
}

export default App;