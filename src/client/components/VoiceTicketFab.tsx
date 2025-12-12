
import React, { useState, useRef, useEffect } from 'react';
import { Mic, Loader2, StopCircle, Sparkles } from 'lucide-react';
import { getAuthToken } from '../api';

interface VoiceTicketFabProps {
    onTicketDetected: (data: any) => void;
}

export const VoiceTicketFab: React.FC<VoiceTicketFabProps> = ({ onTicketDetected }) => {
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
            const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
            
            mediaRecorderRef.current = mediaRecorder;
            chunksRef.current = [];

            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) chunksRef.current.push(e.data);
            };

            mediaRecorder.onstop = async () => {
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
            formData.append('file', blob, 'voice_ticket.webm');

            const token = getAuthToken();
            // Note: We use relative path assuming this runs on same origin
            // Adjust base URL if needed (e.g. from api.ts client config)
            const response = await fetch('/api/ai/analyze-ticket', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });

            if (!response.ok) {
                throw new Error("Erreur serveur");
            }

            const data = await response.json();
            console.log("🤖 AI Analysis Result:", data);
            
            // Pass the data to parent to open the modal
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

    return (
        <div className="fixed bottom-6 right-6 z-[9990]">
            {/* Status Tooltip */}
            {status === 'recording' && (
                <div className="absolute bottom-20 right-0 bg-red-600 text-white px-4 py-2 rounded-full font-bold shadow-lg animate-pulse flex items-center gap-2 whitespace-nowrap">
                    <div className="w-3 h-3 bg-white rounded-full animate-ping"></div>
                    Enregistrement... {formatTime(timer)}
                </div>
            )}
            
            {status === 'analyzing' && (
                <div className="absolute bottom-20 right-0 bg-blue-600 text-white px-4 py-2 rounded-full font-bold shadow-lg flex items-center gap-2 whitespace-nowrap">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Analyse IA en cours...
                </div>
            )}

            {/* Main Button */}
            <button
                onClick={status === 'recording' ? stopRecording : startRecording}
                disabled={status === 'analyzing'}
                className={`w-16 h-16 rounded-full shadow-2xl flex items-center justify-center transition-all transform hover:scale-105 active:scale-95
                    ${status === 'recording' 
                        ? 'bg-red-500 hover:bg-red-600 ring-4 ring-red-200' 
                        : status === 'analyzing'
                            ? 'bg-blue-400 cursor-wait'
                            : 'bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700'
                    }
                `}
                title="Créer un ticket par la voix (IA)"
            >
                {status === 'recording' ? (
                    <StopCircle className="w-8 h-8 text-white" />
                ) : status === 'analyzing' ? (
                    <Sparkles className="w-8 h-8 text-white animate-spin" />
                ) : (
                    <Mic className="w-8 h-8 text-white" />
                )}
            </button>
        </div>
    );
};

export default VoiceTicketFab;
