import React, { useState } from "react";
import { motion } from "framer-motion";

const VideoBackground = () => {
  const [isLoaded, setIsLoaded] = useState(false);

  return (
    <div className="fixed top-0 left-0 w-full h-full z-[0] overflow-hidden">
      {/* Чёрный фон до загрузки видео */}
      <motion.div
        className="absolute top-0 left-0 w-full h-full bg-black"
        initial={{ opacity: 1 }}
        animate={{ opacity: isLoaded ? 0 : 1 }}
        transition={{ duration: 1 }}
      />

      {/* Видео */}
      <video
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
        poster="/images/video-placeholder.jpg"
        className="w-full h-full object-cover"
        onLoadedData={() => setIsLoaded(true)} // Меняем состояние при загрузке
      >
        <source src="/videos/background-video.webm" type="video/webm" />
        <source src="/videos/background-video.mp4" type="video/mp4" />
      </video>

      {/* Затемнение видео */}
      <div className="absolute top-0 left-0 w-full h-full bg-black/50"></div>
    </div>
  );
};

export default VideoBackground;
