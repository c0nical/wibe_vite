import React, { useState, useEffect, useRef } from "react";
import ReactPlayer from "react-player";
import { FaVolumeUp, FaVolumeMute, FaHeart, FaRegHeart } from "react-icons/fa";
import { BiSkipPrevious, BiPlay, BiPause, BiSkipNext } from "react-icons/bi";
import { db, auth } from "../firebase";
import { collection, addDoc, query, where, getDocs } from "firebase/firestore";

const SidebarPlayer = ({ currentTrack, onPlayPause, onNext, onPrevious, isPlaying }) => {
    const [playedTime, setPlayedTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [volume, setVolume] = useState(() => {
        return parseFloat(localStorage.getItem("playerVolume")) || 0.5;
    });
    const [prevVolume, setPrevVolume] = useState(volume);
    const [isFavorite, setIsFavorite] = useState(false);
    const playerRef = useRef(null);

    useEffect(() => {
        if (currentTrack) {
            checkIfFavorite(currentTrack.id);
        }
    }, [currentTrack]);

    useEffect(() => {
        localStorage.setItem("playerVolume", volume);
    }, [volume]);

    const checkIfFavorite = async (trackId) => {
        const user = auth.currentUser;
        if (user) {
            try {
                const q = query(
                    collection(db, "favorites"),
                    where("userId", "==", user.uid),
                    where("trackId", "==", trackId)
                );
                const querySnapshot = await getDocs(q);
                setIsFavorite(!querySnapshot.empty);
            } catch (error) {
                console.error("Ошибка при проверке избранного:", error);
            }
        }
    };

    const handleProgress = (state) => {
        setPlayedTime(state.playedSeconds);
    };

    const handleDuration = (duration) => {
        setDuration(duration);
    };

    const handleProgressBarClick = (e) => {
        const progressBar = e.currentTarget;
        const clickPositionX = e.nativeEvent.offsetX;
        const progressBarWidth = progressBar.offsetWidth;
        const newPlayedTime = (clickPositionX / progressBarWidth) * duration;

        if (playerRef.current) {
            playerRef.current.seekTo(newPlayedTime, "seconds");
        }
    };

    const toggleMute = () => {
        if (volume > 0) {
            setPrevVolume(volume);
            setVolume(0);
        } else {
            setVolume(prevVolume);
        }
    };

    const formatTime = (seconds) => {
        const minutes = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${minutes}:${secs < 10 ? "0" : ""}${secs}`;
    };

    const handleFavoriteClick = async () => {
        const user = auth.currentUser;
        if (user) {
            try {
                const q = query(
                    collection(db, "favorites"),
                    where("userId", "==", user.uid),
                    where("trackId", "==", currentTrack.id)
                );
                const querySnapshot = await getDocs(q);
                if (querySnapshot.empty) {
                    const favoriteData = {
                        userId: user.uid,
                        trackId: currentTrack.id,
                        trackName: currentTrack.name,
                        trackArtist: currentTrack.artist_name,
                        trackUrl: currentTrack.audio,
                        albumImage: currentTrack.album_image,
                        artistName: currentTrack.artist_name,
                        duration: currentTrack.duration,
                    };
                    await addDoc(collection(db, "favorites"), favoriteData);
                    setIsFavorite(true);
                } else {
                    setIsFavorite(false);
                }
            } catch (error) {
                console.error("Ошибка при добавлении в избранное:", error);
            }
        } else {
            console.log("Пользователь не авторизован");
        }
    };

    return (
        <div className="bg-[#272727] p-8 flex flex-col items-center">
            {currentTrack ? (
                <>
                    {currentTrack.album_image && (
                        <img
                            src={currentTrack.album_image}
                            alt={currentTrack.album_name}
                            className="w-32 h-32 object-cover rounded-lg mb-4"
                        />
                    )}

                    <div className="mb-2 text-center">
                        <h2 className="text-xl font-semibold">{currentTrack.name}</h2>
                        <p className="text-sm text-gray-400">{currentTrack.artist_name}</p>
                    </div>

                    <div className="w-full my-4">
                        <ReactPlayer
                            ref={playerRef}
                            url={currentTrack ? currentTrack.audio : null}
                            playing={isPlaying}
                            controls={false}
                            width="0"
                            height="0"
                            volume={volume}
                            onProgress={handleProgress}
                            onDuration={handleDuration}
                        />

                        <div
                            className="relative w-full h-2 bg-gray-600 rounded-full cursor-pointer"
                            onClick={handleProgressBarClick}
                        >
                            <div
                                className="absolute top-0 left-0 h-2 bg-green-500 rounded-full"
                                style={{ width: `${(playedTime / duration) * 100}%` }}
                            ></div>
                        </div>
                        <div className="flex justify-between text-sm text-gray-400 mt-1">
                            <span>{formatTime(playedTime)}</span>
                            <span>{formatTime(duration)}</span>
                        </div>
                    </div>

                    {/* Регулятор громкости */}
                    <div className="relative flex items-center mt-4 space-x-2">
                        <button className="text-xl text-gray-400 hover:text-white" onClick={toggleMute}>
                            {volume > 0 ? <FaVolumeUp /> : <FaVolumeMute />}
                        </button>

                        <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.01"
                            value={volume}
                            onChange={(e) => setVolume(parseFloat(e.target.value))}
                            className="w-32"
                        />
                    </div>

                    <div className="flex justify-around items-center w-full mt-4">
                        <button onClick={onPrevious} className="text-3xl text-gray-400 hover:text-white">
                            <BiSkipPrevious />
                        </button>

                        <button onClick={onPlayPause} className="text-3xl px-4 py-2 text-gray-400 hover:text-white flex items-center">
                            {isPlaying ? <BiPause /> : <BiPlay />}
                        </button>

                        <button onClick={onNext} className="text-3xl text-gray-400 hover:text-white">
                            <BiSkipNext />
                        </button>
                    </div>

                    <button
                        onClick={handleFavoriteClick}
                        className={`text-xl text-gray-400 hover:text-white mt-4 ${isFavorite ? "text-red-500" : ""}`}
                    >
                        {isFavorite ? <FaHeart /> : <FaRegHeart />}
                    </button>
                </>
            ) : (
                <div className="text-center text-gray-400">Выберите трек для воспроизведения</div>
            )}
        </div>
    );
};

export default SidebarPlayer;
