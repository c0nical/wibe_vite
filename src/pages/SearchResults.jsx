import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import TrackList from "../components/TrackList";

const SearchResults = ({ setCurrentTrack, setIsPlaying, setCurrentCategoryTracks }) => {
  const [searchResults, setSearchResults] = useState([]);
  const location = useLocation();

  useEffect(() => {
    const query = new URLSearchParams(location.search).get("q");
    if (query) {
      fetch(`https://api.jamendo.com/v3.0/tracks/?client_id=${process.env.REACT_APP_JAMENDO_CLIENT_ID}&format=json&limit=20&search=${encodeURIComponent(query)}`)
        .then((response) => response.json())
        .then((data) => {
          const tracks = data.results.map((track) => ({
            id: track.id,
            name: track.name,
            artist_name: track.artist_name,
            audio: track.audio,
            album_image: track.image,
            duration: track.duration,
          }));
          setSearchResults(tracks);
        })
        .catch((error) => console.error("Ошибка поиска:", error));
    }
  }, [location.search]);

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Результаты поиска</h2>
      {searchResults.length > 0 ? (
        <TrackList
          tracks={searchResults}
          category="search"
          setCurrentTrack={setCurrentTrack}
          setIsPlaying={setIsPlaying}
          setCurrentCategoryTracks={setCurrentCategoryTracks}
        />
      ) : (
        <p>Ничего не найдено.</p>
      )}
    </div>
  );
};

export default SearchResults;