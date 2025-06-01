import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const TitlePage = () => {
    const navigate = useNavigate();

    useEffect(() => {
        // Проверяем, показывалась ли титульная страница
        const isVisited = localStorage.getItem("titlePageVisited");
        if (isVisited) {
            navigate("/login"); // Перенаправляем на страницу входа
        }
    }, [navigate]);

    const handleStart = () => {
        localStorage.setItem("titlePageVisited", "true"); // Запоминаем, что страницу показали
        navigate("/login"); // Переход на страницу входа
    };

    return (
        <div className="flex flex-col items-center justify-between h-screen bg-neutral-900 text-white px-4">
            {/* Верхняя часть: Дипломный проект */}
            <div className="mt-8">
                <p className="text-2xl">Дипломный проект</p>
            </div>

            {/* Центральная часть: Логотип, заголовок, автор, кнопка */}
            <div className="flex flex-col items-center justify-center text-center">
                <img src="/assets/img/logo/logo.png" className="w-48" alt="Logo" />
                <h1 className="text-4xl font-bold mt-4">Веб-приложение для стриминга музыки</h1>
                <p className="mt-2 text-2xl">Разработано: Сергей Ситдиков Фёдорович</p>
                <button
                    onClick={handleStart}
                    className="mt-4 px-6 py-2 bg-inherit border-2 text-white font-bold rounded-lg hover:bg-white hover:text-black transition duration-200"
                >
                    Перейти в приложение
                </button>
            </div>

            {/* Нижняя часть: Учреждение и подпись с годом */}
            <div className="flex flex-col items-center mb-8">
                <p className="text-xl text-center max-w-2xl">
                    Государственное бюджетное профессиональное образовательное учреждение "Пермский краевой колледж "ОНИКС"
                </p>
                <p className="mt-4 text-lg">Пермь, {new Date().getFullYear()}</p>
            </div>
        </div>
    );
};

export default TitlePage;