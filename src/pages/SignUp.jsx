import { useState } from "react";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { auth } from "../firebase";
import { Link, useNavigate } from "react-router-dom";
import gravatarUrl from "gravatar-url"; // Импортируем библиотеку
import { FaUser, FaEnvelope, FaLock } from "react-icons/fa"; // Импортируем иконки

const SignUp = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSignUp = async (e) => {
    e.preventDefault();
    setError("");

    try {
      // Регистрируем пользователя
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Генерируем аватарку через Gravatar
      const photoURL = gravatarUrl(email, {
        size: 200, // Размер аватарки
        default: "retro", // Дефолтная аватарка, если email не зарегистрирован на Gravatar
      });

      // Обновляем профиль пользователя
      await updateProfile(user, {
        displayName,
        photoURL,
      });

      navigate("/"); // Перенаправляем на главную страницу
    } catch (error) {
      console.error("Ошибка регистрации:", error.message);
      setError(error.message);
    }
  };

  return (
    <div className="w-full max-w-md"> {/* Увеличил ширину формы */}
      <h2 className="text-2xl font-bold mb-6 text-center text-white">Регистрация</h2>
      {error && <p className="text-white bg-red-500 text-center mb-4 rounded-lg p-2">{error}</p>}
      <form onSubmit={handleSignUp} className="space-y-3">
        {/* Лейбл и инпут для имени */}
        <div className="space-y-2">
          <label htmlFor="displayName" className="block text-sm font-medium text-white">
            Имя
          </label>
          <div className="relative">
            <FaUser className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" /> {/* Иконка */}
            <input
              type="text"
              id="displayName"
              placeholder="Введите ваше имя"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border-solid rounded-lg focus:outline-none focus:ring-2 focus:ring-white bg-black text-white transition-all duration-300 focus:ring-offset-2 focus:ring-offset-black"
            />
          </div>
        </div>

        {/* Лейбл и инпут для email */}
        <div className="space-y-2">
          <label htmlFor="email" className="block text-sm font-medium text-white">
            Email
          </label>
          <div className="relative">
            <FaEnvelope className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" /> {/* Иконка */}
            <input
              type="email"
              id="email"
              placeholder="Введите ваш email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border-solid rounded-lg focus:outline-none focus:ring-2 focus:ring-white bg-black text-white transition-all duration-300 focus:ring-offset-2 focus:ring-offset-black"
            />
          </div>
        </div>

        {/* Лейбл и инпут для пароля */}
        <div className="space-y-2">
          <label htmlFor="password" className="block text-sm font-medium text-white">
            Пароль
          </label>
          <div className="relative">
            <FaLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" /> {/* Иконка */}
            <input
              type="password"
              id="password"
              placeholder="Введите ваш пароль"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border-solid rounded-lg focus:outline-none focus:ring-2 focus:ring-white bg-black text-white transition-all duration-300 focus:ring-offset-2 focus:ring-offset-black"
            />
          </div>
        </div>

        {/* Кнопка регистрации */}
        <button
          type="submit"
          className="w-full mt-5 bg-inherit border-2 text-white font-bold py-3 rounded-lg hover:bg-white hover:text-black hover:border-white transition duration-200 cursor-pointer"
        >
          Зарегистрироваться
        </button>
      </form>

      {/* Ссылка на вход */}
      <div className="flex justify-center align-center flex-col mt-6 gap-3 text-center items-center">
        <span className="text-white">Уже есть аккаунт? </span>
        <Link
          to="/login"
          className="w-max text-black bg-white px-4 py-2 rounded-lg hover:text-white transition duration-200 hover:bg-black"
        >
          Войти
        </Link>
      </div>
    </div>
  );
};

export default SignUp;