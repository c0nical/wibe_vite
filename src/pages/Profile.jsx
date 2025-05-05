import React, { useState, useEffect } from "react";
import { auth, db } from "../firebase";
import { signOut, updateProfile } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { useAuthState } from "react-firebase-hooks/auth";
import { collection, query, where, getDocs } from "firebase/firestore";
import gravatarUrl from "gravatar-url";
import { motion } from "framer-motion";

const Profile = () => {
  const navigate = useNavigate();
  const [user, loading] = useAuthState(auth);
  const [displayName, setDisplayName] = useState("");
  const [stats, setStats] = useState({ favorites: 0, playlists: 0 });

  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName || "");
      fetchStats();
    }
  }, [user]);

  const fetchStats = async () => {
    const favoritesQuery = query(collection(db, "favorites"), where("userId", "==", user.uid));
    const playlistsQuery = query(collection(db, "playlists"), where("userId", "==", user.uid));
    const [favoritesSnap, playlistsSnap] = await Promise.all([getDocs(favoritesQuery), getDocs(playlistsQuery)]);
    setStats({
      favorites: favoritesSnap.docs.length,
      playlists: playlistsSnap.docs.length,
    });
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/login");
    } catch (error) {
      console.error("Ошибка выхода:", error.message);
    }
  };

  const handleUpdateName = async () => {
    try {
      await updateProfile(auth.currentUser, { displayName });
      alert("Имя обновлено!");
    } catch (error) {
      console.error("Ошибка обновления имени:", error.message);
    }
  };

  if (loading) {
    return <div className="p-4">Загрузка...</div>;
  }

  if (!user) {
    return <div className="p-4">Пользователь не авторизован.</div>;
  }

  const photoURL = gravatarUrl(user.email, {
    size: 200,
    default: "retro",
  });

  return (
    <motion.div
      className="p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <h2 className="text-2xl font-bold mb-4">Личный кабинет</h2>
      <div className="flex flex-col md:flex-row flex- gap-6 mb-6">
        <div className="flex flex-col sm:flex-row items-center gap-4 bg-neutral-700 p-4 rounded-lg w-full">
          <img src={photoURL} alt="Аватар" className="w-24 h-24 rounded-lg" />
          <div className="flex-1 min-w-0">
            <h3 className="text-xl font-bold truncate">{user.displayName || "Пользователь"}</h3>
            <p className="text-neutral-400 truncate">{user.email}</p>
            <p className="text-sm text-neutral-500 truncate">
              Зарегистрирован: {new Date(user.metadata.creationTime).toLocaleDateString()}
            </p>
          </div>
        </div>
        <div className="bg-neutral-700 p-4 rounded-lg flex-1">
          <h3 className="text-lg font-semibold mb-2">Статистика</h3>
          <p>Избранных треков: {stats.favorites}</p>
          <p>Плейлистов: {stats.playlists}</p>
        </div>
      </div>
      <div className="bg-neutral-700 p-4 rounded-lg mb-6">
        <h3 className="text-lg font-semibold mb-2">Редактировать профиль</h3>
        <input
          type="text"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="Ваше имя"
          className="p-2 bg-neutral-600 text-white rounded w-full mb-2"
        />
        <motion.button
          onClick={handleUpdateName}
          className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          Сохранить
        </motion.button>
      </div>
      <motion.button
        onClick={handleLogout}
        className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        Выйти
      </motion.button>
    </motion.div>
  );
};

export default Profile;