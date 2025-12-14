import React, { useState, useRef, useEffect } from 'react';
import { Mic, Loader2, StopCircle, Sparkles } from 'lucide-react';

// Copied helper to ensure independence
const getAuthToken = () => localStorage.getItem('auth_token');

interface VoiceTicketFabProps {
    onTicketDetected: (data: any) => void;
    // Added for Messenger integration
    className?: string;
    style?: React.CSSProperties;
}

export const VoiceTicketFab: React.FC<VoiceTicketFabProps> = ({ onTicketDetected, className, style }) => {
    const [status, setStatus] = useState<'idle' | 'recording' | 'analyzing' | 'error'>('idle');
    const [timer, setTimer] = useState(0);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);
    const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
            if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
                mediaRecorderRef.current.stop();
            }
        };
    }, []);

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            // STRICT PARITY WITH MAIN APP
            const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
            
            mediaRecorderRef.current = mediaRecorder;
            chunksRef.current = [];

            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) chunksRef.current.push(e.data);
            };

            mediaRecorder.onstop = async () => {
                // STRICT PARITY WITH MAIN APP
                const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
                await analyzeAudio(blob);
                
                // Stop tracks
                stream.getTracks().forEach(track => track.stop());
            };

            mediaRecorder.start();
            setStatus('recording');
            setTimer(0);
            
            timerIntervalRef.current = setInterval(() => {
                setTimer(prev => prev + 1);
            }, 1000);

        } catch (err) {
            console.error("Microphone access denied:", err);
            alert("Impossible d'accéder au micro. Vérifiez les permissions.");
            setStatus('idle');
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
            mediaRecorderRef.current.stop();
            if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
            setStatus('analyzing');
        }
    };

    const analyzeAudio = async (blob: Blob) => {
        try {
            const formData = new FormData();
            // STRICT PARITY WITH MAIN APP: filename must be voice_ticket.webm
            formData.append('file', blob, 'voice_ticket.webm');

            const token = getAuthToken();
            const response = await fetch('/api/ai/analyze-ticket', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });

            if (!response.ok) {
                const txt = await response.text();
                throw new Error("Erreur serveur: " + txt);
            }

            const data = await response.json();
            console.log("🤖 AI Analysis Result:", data);
            
            // Pass the data to parent
            onTicketDetected(data);
            setStatus('idle');

        } catch (err) {
            console.error("AI Analysis failed:", err);
            alert("L'analyse a échoué. Veuillez réessayer.");
            setStatus('error');
            setTimeout(() => setStatus('idle'), 2000);
        }
    };

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    // Adjusted classNames to allow override for Messenger Footer
    // If className is provided, we use it instead of fixed positioning
    const containerClass = className || "fixed bottom-6 right-6 z-[9990]";

    return (
        <div className={containerClass} style={style}>
            {/* Status Tooltip - Position adjusted relative to button */}
            {status === 'recording' && (
                <div className="fixed bottom-24 left-1/2 transform -translate-x-1/2 bg-red-600 text-white px-4 py-2 rounded-full font-bold shadow-lg animate-pulse flex items-center gap-2 whitespace-nowrap z-50">
                    <div className="w-3 h-3 bg-white rounded-full animate-ping"></div>
                    Enregistrement... {formatTime(timer)}
                </div>
            )}
            
            {status === 'analyzing' && (
                <div className="fixed bottom-24 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white px-4 py-2 rounded-full font-bold shadow-lg flex items-center gap-2 whitespace-nowrap z-50">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Analyse en cours...
                </div>
            )}

            {/* Main Button */}
            <button
                onClick={status === 'recording' ? stopRecording : startRecording}
                disabled={status === 'analyzing'}
                className={`w-12 h-12 md:w-12 md:h-12 rounded-full shadow-lg flex items-center justify-center transition-all transform hover:scale-105 active:scale-95 border border-white/10
                    ${status === 'recording' 
                        ? 'bg-red-500 hover:bg-red-600 ring-4 ring-red-200' 
                        : status === 'analyzing'
                            ? 'bg-blue-400 cursor-wait'
                            : 'bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700'
                    }
                `}
                title="Créer un ticket par la voix"
                // Prevent click propagation to chat interface
                onMouseDown={(e) => e.stopPropagation()} 
                onTouchStart={(e) => e.stopPropagation()}
            >
                {status === 'recording' ? (
                    <StopCircle className="w-6 h-6 text-white" />
                ) : status === 'analyzing' ? (
                    <Sparkles className="w-6 h-6 text-white animate-spin" />
                ) : (
                    <Sparkles className="w-6 h-6 text-white" /> 
                )}
            </button>
        </div>
    );
};

export default VoiceTicketFab;
