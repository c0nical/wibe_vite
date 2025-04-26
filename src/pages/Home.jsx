// Home.jsx
import React from "react";
import TrackList from "../components/TrackList";
import Recommendations from "../components/Recommendations";

const Home = ({ setCurrentTrack, setIsPlaying, showToast }) => {
  return (
    <div>
      <TrackList
        setCurrentTrack={setCurrentTrack}
        setIsPlaying={setIsPlaying}
        showToast={showToast}
      />
    </div>
  );
};

export default Home;