import React from "react";
import PlaylistManager from "../components/PlaylistManager";

const Library = ({ setCurrentTrack, setIsPlaying, setCurrentCategoryTracks }) => {
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Библиотека</h1>
      <PlaylistManager
        setCurrentTrack={setCurrentTrack}
        setIsPlaying={setIsPlaying}
        setCurrentCategoryTracks={setCurrentCategoryTracks}
      />
    </div>
  );
};

export default Library;