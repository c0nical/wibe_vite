import React from "react";
import { Outlet } from "react-router-dom";
import VideoBackground from "./VideoBackground";
import { motion } from "framer-motion";

const AuthLayout = () => {
  return (
    <div className="relative w-full h-screen flex justify-center items-center">
      <VideoBackground />
      <div className="relative z-10 w-full max-w-6xl mx-auto flex flex-col lg:flex-row justify-between items-center gap-8 px-4">
        {/* Левый контейнер с текстом */}
        <motion.div
          className="flex-1 w-full lg:w-auto text-white text-4xl lg:text-6xl font-bold text-center lg:text-left mb-8 lg:mb-0"
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <div className="flex flex-col items-center justify-center align-center text-center">
          <p className="text-nowrap">Найди свой</p>
          <p className="text-green-500">WIBE</p>
          </div>
        </motion.div>

        {/* Центральный контейнер с формой */}
        <div className="relative bg-white/15 p-8 border border-white/10 backdrop-blur-xs rounded-lg 
                      shadow-[0_0_75px_rgba(255,255,255,0.1)] min-h-[780px]
                      before:absolute before:inset-0 before:-z-10 
                      before:rounded-lg before:bg-white/10 before:blur-xl before:opacity-50
                      w-full max-w-md min-h-[500px] transition-all duration-300 overflow-hidden flex flex-col">
          <div className="flex flex-1 align-center justify-center p-4">
            <div className="flex flex-1 align-center items-start justify-center p-6">
              <motion.img
                src="/assets/img/logo/logo.png"
                className="w-42 object-contain drop-shadow-[0_0_15px_rgba(255,255,255,0.5)]"
                alt="Logo"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
              />
            </div>
          </div>
          <div className="flex-1 flex flex-col justify-center">
            <Outlet />
          </div>
        </div>

        {/* Правый контейнер с текстом */}
        <motion.div
          className="flex-1 w-full lg:w-auto text-white text-4xl lg:text-6xl font-bold text-center lg:text-right mt-8 lg:mt-0"
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <div className="flex flex-col items-center justify-center align-center text-center">
          <p className="text-nowrap">Погрузись в</p>
          <p className="text-green-500">музыку</p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default AuthLayout;