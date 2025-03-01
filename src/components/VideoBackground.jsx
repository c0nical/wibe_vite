import React from "react";

const VideoBackground = () => {
  return (
    <div className="fixed top-0 left-0 w-full h-full z-[0] overflow-hidden">
<video 
  autoPlay 
  loop 
  muted 
  playsInline 
  preload="auto" 
  poster="/images/video-placeholder.jpg"
  className="w-full h-full object-cover">
  <source src="/videos/background-video.webm" type="video/webm" />
  <source src="/videos/background-video.mp4" type="video/mp4" />
</video>
      {/* Затемнение */}
      <div className="absolute top-0 left-0 w-full h-full bg-black/50"></div>
    </div>
  );
};

export default VideoBackground;