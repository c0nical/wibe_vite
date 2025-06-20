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
          className="hidden lg:flex flex-1 w-full lg:w-auto text-white text-4xl lg:text-6xl font-bold text-center lg:text-left"
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <div className="flex flex-col items-center justify-center text-center gap-5 select-none">
            <p className="text-nowrap">Найди свой</p>
            <p className="text-black text-stroke">wibe</p>
          </div>
        </motion.div>

        {/* Центральный контейнер с формой */}
        <div className="relative bg-white/10 p-8 border border-white/10 backdrop-blur-xs rounded-lg 
                        shadow-[0_0_75px_rgba(255,255,255,0.1)] w-full max-w-md min-h-[500px] 
                        transition-all duration-300 overflow-hidden flex flex-col">
          <div className="flex flex-1 items-center justify-center p-4">
            <div className="flex flex-1 items-start justify-center p-6 select-none">
              <motion.img
                src="/assets/img/logo/logo.png"
                className="w-42 object-contain drop-shadow-[0_0_15px_rgba(255,255,255,0.5)] pointer-events-none"
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
          className="hidden lg:flex flex-1 w-full lg:w-auto text-white text-4xl lg:text-6xl font-bold text-center lg:text-right"
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <div className="flex flex-col items-center justify-center text-center gap-5 select-none">
            <p className="text-nowrap">Погрузись в</p>
            <p className="text-black text-stroke">музыку</p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default AuthLayout;