import React, { useState } from "react";
import { Link } from "react-router-dom";
import { auth } from "../firebase";
import { signInWithEmailAndPassword } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { FaEnvelope, FaLock } from "react-icons/fa"; // Импортируем иконки

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(""); // Добавим состояние для ошибок
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(""); // Сбрасываем ошибку перед попыткой входа
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate("/"); // Перенаправление на главную страницу после входа
    } catch (error) {
      console.error("Ошибка входа:", error.message);
      setError("Неверный email или пароль"); // Показываем ошибку пользователю
    }
  };

  return (
    <div className="w-full flex-1"> {/* Добавил flex-1 */}
      <h2 className="text-2xl font-bold mb-6 text-center text-white">Вход</h2>
      {error && <p className="text-white bg-red-500 text-center mb-4 rounded-lg p-2">{error}</p>}
      <form onSubmit={handleLogin} className="space-y-3">
        {/* Лейбл и инпут для email */}
        <div className="space-y-1">
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
        <div className="space-y-1">
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

        {/* Кнопка входа */}
        <button
          type="submit"
          className="w-full mt-5 bg-inherit border-2 text-white font-bold py-3 rounded-lg hover:bg-white hover:text-black hover:border-white transition duration-200 cursor-pointer"
        >
          Войти
        </button>
      </form>

      {/* Ссылка на регистрацию */}
      <div className="flex justify-center align-center flex-col mt-6 gap-3 text-center items-center">
        <span className="text-white">Нет аккаунта? </span>
        <Link
          to="/signup"
          className="w-max text-black bg-white px-4 py-2 rounded-lg hover:text-white transition duration-200 hover:bg-black"
        >
          Зарегистрироваться
        </Link>
      </div>
    </div>
  );
};

export default Login;