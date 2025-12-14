import React, { useState, useRef } from 'react';

const AudioPlayer = ({ src, isMe }: { src: string, isMe: boolean }) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [progress, setProgress] = useState(0);
    const [duration, setDuration] = useState(0);
    const audioRef = useRef<HTMLAudioElement>(null);

    const togglePlay = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!audioRef.current) return;
        
        if (isPlaying) {
            audioRef.current.pause();
        } else {
            audioRef.current.play().catch(e => console.error("Audio play failed", e));
        }
        setIsPlaying(!isPlaying);
    };

    const formatTime = (time: number) => {
        if (!time || isNaN(time)) return "0:00";
        const m = Math.floor(time / 60);
        const s = Math.floor(time % 60);
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    return (
        // DESIGN UPDATE: Compact mode for mobile
        <div className="flex items-center gap-2 md:gap-4 py-1 pr-2 min-w-[180px] md:min-w-[240px] max-w-[220px] md:max-w-[300px] select-none">
            
            {/* BOUTON PLAY PREMIUM */}
            <button 
                onClick={togglePlay}
                className={`w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center flex-shrink-0 transition-all shadow-md active:scale-95 ${
                    isMe 
                    ? 'bg-white text-emerald-600' 
                    : 'bg-emerald-500 text-white hover:bg-emerald-400'
                }`}
            >
                <i className={`fas ${isPlaying ? 'fa-pause' : 'fa-play ml-1'} text-lg md:text-xl`}></i>
            </button>

            <div className="flex-1 flex flex-col justify-center gap-1 min-w-0">
                {/* Visualisation Onde Sonore - Compacte (14 barres) */}
                <div className="h-6 md:h-8 flex items-center gap-0.5 md:gap-1">
                    {[...Array(14)].map((_, i) => (
                        <div 
                            key={i} 
                            className={`w-1 rounded-full transition-all duration-300 ${
                                i/14 * 100 < progress 
                                    ? (isMe ? 'bg-white/90' : 'bg-emerald-500') 
                                    : (isMe ? 'bg-emerald-900/30' : 'bg-gray-600') 
                            }`}
                            style={{ 
                                height: [30, 50, 70, 40, 60, 90, 45, 80, 55, 75, 45, 65, 40, 30][i] + '%',
                                animation: isPlaying ? `pulse 0.4s infinite alternate ${i * 0.05}s` : 'none'
                            }}
                        />
                    ))}
                </div>
                
                {/* Timer Discret */}
                <div className={`text-[9px] md:text-[10px] font-bold font-mono tracking-widest ${isMe ? 'text-emerald-100/80' : 'text-gray-400'}`}>
                    {isPlaying ? formatTime(audioRef.current?.currentTime || 0) : formatTime(duration)}
                </div>
            </div>

            <audio 
                ref={audioRef} 
                src={src} 
                preload="metadata"
                playsInline
                onTimeUpdate={() => {
                    if (audioRef.current && audioRef.current.duration) {
                        setProgress((audioRef.current.currentTime / audioRef.current.duration) * 100);
                    }
                }}
                onLoadedMetadata={() => audioRef.current && setDuration(audioRef.current.duration)}
                onEnded={() => { setIsPlaying(false); setProgress(0); }}
                className="hidden" 
            />
        </div>
    );
};

export default AudioPlayer;
