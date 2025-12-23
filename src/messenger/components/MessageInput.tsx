import React, { useState, useRef, useEffect } from 'react';
import { formatDuration } from '../utils';
import VoiceTicketFab from './VoiceTicketFab';

interface MessageInputProps {
    input: string;
    setInput: React.Dispatch<React.SetStateAction<string>>;
    onSendText: () => void;
    onSendAudio: (file: File, transcription?: string) => void;
    onFileSelect: (file: File) => void;
    isSending: boolean;
    onTicketDetected: (data: any) => void;
    textareaRef: React.RefObject<HTMLTextAreaElement>;
    canCreateTickets?: boolean; // RBAC permission check
}

const MessageInput: React.FC<MessageInputProps> = ({
    input,
    setInput,
    onSendText,
    onSendAudio,
    onFileSelect,
    isSending,
    onTicketDetected,
    textareaRef,
    canCreateTickets = false
}) => {
    const [isRecording, setIsRecording] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const [isDictating, setIsDictating] = useState(false);
    const [showEmoji, setShowEmoji] = useState(false);
    const [isInputExpanded, setIsInputExpanded] = useState(false);

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const timerRef = useRef<any>(null);
    const liveTranscriptRef = useRef<string>('');
    const recognitionRef = useRef<any>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const inputTimeoutRef = useRef<any>(null);

    const commonEmojis = ['👍', '❤️', '😂', '😮', '😢', '👏', '🔥', '🎉', '🤔', '✅', '❌', '👋'];

    const [showActionsMenu, setShowActionsMenu] = useState(false);

    // Auto-resize and persistent expansion logic
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = '48px'; 
            const scrollHeight = textareaRef.current.scrollHeight;
            textareaRef.current.style.height = `${Math.min(scrollHeight, 128)}px`;
        }
        
        if (input.trim().length > 0) {
            setIsInputExpanded(true);
            if (inputTimeoutRef.current) clearTimeout(inputTimeoutRef.current);
        }
    }, [input]);

    const handleInputInteraction = (currentValue?: string) => {
        setIsInputExpanded(true);
        if (inputTimeoutRef.current) {
            clearTimeout(inputTimeoutRef.current);
        }
        
        const valueToCheck = currentValue !== undefined ? currentValue : input;

        // Only auto-collapse if empty
        if (valueToCheck.trim().length === 0) {
            inputTimeoutRef.current = setTimeout(() => {
                setIsInputExpanded(false);
            }, 1000);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        handleInputInteraction();
        if (e.key === 'Enter' && !e.shiftKey) { 
            e.preventDefault(); 
            handleSend(); 
        }
    };

    const handleSend = () => {
        onSendText();
        setShowEmoji(false);
        if (inputTimeoutRef.current) clearTimeout(inputTimeoutRef.current);
        inputTimeoutRef.current = setTimeout(() => setIsInputExpanded(false), 1000);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            onFileSelect(e.target.files[0]);
            setShowActionsMenu(false);
        }
    };

    // --- DICTATION ---
    const startDictation = () => {
        if (isRecording) {
            alert("Impossible de dicter pendant l'enregistrement d'un message vocal.");
            return;
        }

        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SpeechRecognition) {
            alert("La dictée vocale n'est pas supportée par votre navigateur.");
            return;
        }

        if (isDictating) return;

        const recognition = new SpeechRecognition();
        recognition.lang = 'fr-FR';
        recognition.continuous = false;
        recognition.interimResults = false;

        recognition.onstart = () => setIsDictating(true);
        
        recognition.onend = () => {
            setIsDictating(false);
            if (textareaRef.current) {
                textareaRef.current.focus();
                textareaRef.current.setSelectionRange(textareaRef.current.value.length, textareaRef.current.value.length);
            }
        };
        
        recognition.onerror = (event: any) => {
            console.error("Dictation error", event.error);
            setIsDictating(false);
        };

        recognition.onresult = (event: any) => {
            const transcript = event.results[0][0].transcript;
            setInput(prev => {
                const space = prev.length > 0 && !prev.endsWith(' ') ? ' ' : '';
                return prev + space + transcript;
            });
            handleInputInteraction(input + " " + transcript);
        };

        recognition.start();
    };

    // --- VOICE RECORDING ---
    const startRecording = async () => {
        if (isDictating) {
            alert("Veuillez terminer la dictée de texte avant d'enregistrer un message vocal.");
            return;
        }
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            audioChunksRef.current = [];
            mediaRecorder.ondataavailable = (event) => { if (event.data.size > 0) audioChunksRef.current.push(event.data); };
            mediaRecorder.start();

            // Hybrid Speech Recognition
            const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
            if (SpeechRecognition) {
                const recognition = new SpeechRecognition();
                recognition.lang = 'fr-CA';
                recognition.continuous = true;
                recognition.interimResults = true;
                liveTranscriptRef.current = '';

                recognition.onresult = (event: any) => {
                   let finalTranscript = '';
                   for (let i = event.resultIndex; i < event.results.length; ++i) {
                       if (event.results[i].isFinal) {
                           finalTranscript += event.results[i][0].transcript;
                       }
                   }
                   if (finalTranscript) {
                       liveTranscriptRef.current += (liveTranscriptRef.current ? ' ' : '') + finalTranscript;
                   }
                };

                recognition.onerror = () => {}; 
                recognition.start();
                recognitionRef.current = recognition;
            }

            setIsRecording(true);
            setRecordingTime(0);
            timerRef.current = setInterval(() => setRecordingTime(prev => prev + 1), 1000);
        } catch (err) { alert("Impossible d'accéder au microphone."); }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.onstop = async () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                const audioFile = new File([audioBlob], "voice_message.webm", { type: 'audio/webm' });
                
                if (recognitionRef.current) {
                    try { recognitionRef.current.stop(); } catch(e) {}
                    recognitionRef.current = null;
                }
                const transcription = liveTranscriptRef.current;

                setIsRecording(false);
                setRecordingTime(0);
                clearInterval(timerRef.current);
                mediaRecorderRef.current?.stream.getTracks().forEach(track => track.stop());

                onSendAudio(audioFile, transcription);
            };
            mediaRecorderRef.current.stop();
        }
    };

    const cancelRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            
            if (recognitionRef.current) {
                try { recognitionRef.current.stop(); } catch(e) {}
                recognitionRef.current = null;
            }
            liveTranscriptRef.current = '';

            setIsRecording(false);
            setRecordingTime(0);
            clearInterval(timerRef.current);
            mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
        }
    };

    return (
        <footer className="glass-header p-4 md:p-6 z-20 flex-shrink-0 border-t border-white/5">
            <div className="max-w-5xl mx-auto flex flex-col md:flex-row md:items-end gap-3 relative">
                {/* EMOJI PICKER */}
                {showEmoji && !isRecording && (
                    <div className="absolute bottom-full right-0 mb-4 bg-[#151515] border border-white/10 rounded-3xl shadow-2xl p-4 grid grid-cols-6 gap-2 w-80 animate-slide-up backdrop-blur-xl z-50">
                        {commonEmojis.map(emoji => (
                            <button key={emoji} onClick={() => {
                                setInput(prev => prev + emoji);
                                handleInputInteraction(input + emoji);
                            }} className="text-3xl hover:bg-white/10 rounded-xl p-3 transition-all hover:scale-110">{emoji}</button>
                        ))}
                    </div>
                )}

                {/* ACTIONS MENU (LEFT) - PREMIUM SVG ICONS */}
                {showActionsMenu && !isRecording && (
                    <div className="absolute bottom-full left-0 mb-4 bg-[#151515] border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-slide-up backdrop-blur-xl z-50 w-64">
                        <div className="p-2 flex flex-col gap-1">
                            <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-3 p-3 hover:bg-white/10 rounded-xl text-white transition-colors group">
                                <div className="w-10 h-10 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center group-hover:bg-blue-500 group-hover:text-white transition-all border border-blue-500/20">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/></svg>
                                </div>
                                <div>
                                    <span className="font-bold text-sm block">Photo & Média</span>
                                    <span className="text-[10px] text-gray-500 block">Galerie ou Caméra</span>
                                </div>
                            </button>
                            
                            <div className="relative">
                                <button className="w-full flex items-center gap-3 p-3 hover:bg-white/10 rounded-xl text-white transition-colors group opacity-50 cursor-not-allowed">
                                    <div className="w-10 h-10 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center group-hover:bg-purple-500 group-hover:text-white transition-all border border-purple-500/20">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/><path d="M5 3v4"/><path d="M9 5h4"/><path d="M19 17v4"/><path d="M17 19h4"/></svg>
                                    </div>
                                    <div>
                                        <span className="font-bold text-sm block">Ticket IA</span>
                                        <span className="text-[10px] text-purple-400 block font-bold">Bientôt disponible</span>
                                    </div>
                                </button>
                            </div>

                            <button className="flex items-center gap-3 p-3 hover:bg-white/10 rounded-xl text-white transition-colors group opacity-50 cursor-not-allowed">
                                <div className="w-10 h-10 rounded-full bg-orange-500/20 text-orange-400 flex items-center justify-center group-hover:bg-orange-500 group-hover:text-white transition-all border border-orange-500/20">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 8V4H8"/><rect width="16" height="12" x="4" y="8" rx="2"/><path d="M2 14h2"/><path d="M20 14h2"/><path d="M15 13v2"/><path d="M9 13v2"/></svg>
                                </div>
                                <div>
                                    <span className="font-bold text-sm block">Expert Industriel</span>
                                    <span className="text-[10px] text-orange-400 block font-bold">Bientôt disponible</span>
                                </div>
                            </button>
                        </div>
                    </div>
                )}

                {isRecording ? (
                    <div className="flex-1 flex items-center justify-between px-6 py-3 animate-pulse bg-red-500/10 rounded-[2rem] border border-red-500/20 h-[56px] w-full backdrop-blur-md">
                        <div className="flex items-center gap-4 text-white">
                            <div className="w-3 h-3 rounded-full bg-red-500 animate-ping"></div>
                            <span className="font-mono text-lg text-red-400 font-bold tracking-widest">{formatDuration(recordingTime)}</span>
                        </div>
                        <div className="flex items-center gap-4">
                            <button onClick={cancelRecording} className="text-gray-400 hover:text-white text-xs font-bold uppercase tracking-widest px-2 hover:underline">Annuler</button>
                            <button onClick={stopRecording} className="w-10 h-10 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 shadow-lg shadow-red-500/30 transition-all transform hover:scale-110">
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" x2="11" y1="2" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                            </button>
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="flex gap-2 items-center md:items-end md:pb-1 md:mr-2 w-full md:w-auto">
                            <div 
                                className={`transition-all duration-300 ease-in-out overflow-hidden flex-shrink-0 ${isInputExpanded ? 'w-0 opacity-0 md:w-12 md:opacity-100' : 'w-12 opacity-100'}`}
                            >
                                <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
                                <button onClick={() => fileInputRef.current?.click()} className="w-12 h-12 rounded-full bg-[#1a1a1a] hover:bg-[#252525] border border-white/10 text-emerald-500 hover:text-emerald-400 flex items-center justify-center transition-all shadow-lg group">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="group-hover:rotate-90 transition-transform duration-300"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
                                </button>
                            </div>

                            {/* Voice Ticket FAB - only show if user has permission */}
                            {canCreateTickets && (
                                <div className="flex-shrink-0 relative z-50">
                                    <VoiceTicketFab 
                                        onTicketDetected={onTicketDetected} 
                                        className="relative" 
                                    />
                                </div>
                            )}
                        </div>

                        <div className="flex-1 flex gap-2 w-full md:w-auto items-end">
                            <div className="flex-1 bg-[#1a1a1a] border border-white/10 rounded-[1.5rem] flex items-end p-1.5 pl-5 gap-2 shadow-inner focus-within:border-emerald-500/50 focus-within:bg-[#202020] transition-all relative">
                                <textarea 
                                    ref={textareaRef}
                                    value={input}
                                    onChange={e => {
                                        setInput(e.target.value);
                                        handleInputInteraction(e.target.value);
                                    }}
                                    onFocus={() => handleInputInteraction()}
                                    onKeyDown={handleKeyPress}
                                    placeholder="Message..." 
                                    className="bg-transparent text-white w-full max-h-32 focus:outline-none placeholder-gray-500 resize-none text-[15px] font-medium leading-relaxed custom-scrollbar py-3"
                                    rows={1}
                                    style={{ minHeight: '48px' }}
                                />
                                <button onClick={() => setShowEmoji(!showEmoji)} className={`w-10 h-10 flex-shrink-0 rounded-full hover:bg-white/10 transition-all flex items-center justify-center ${showEmoji ? 'text-emerald-400' : 'text-gray-400 hover:text-white'}`}>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" x2="9.01" y1="9" y2="9"/><line x1="15" x2="15.01" y1="9" y2="9"/></svg>
                                </button>
                                
                                <button 
                                    onClick={startDictation}
                                    className={`w-10 h-10 flex-shrink-0 rounded-full hover:bg-white/10 transition-all flex items-center justify-center ${isDictating ? 'text-red-500 animate-pulse' : 'text-gray-400 hover:text-white'}`}
                                    title="Dictée vocale (Texte)"
                                >
                                    {/* DICTATION ICON: MICROPHONE (TEXT) */}
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" x2="12" y1="19" y2="22"/></svg>
                                </button>
                            </div>

                            <div className="pb-1 flex-shrink-0">
                                {input.trim() ? (
                                    <button 
                                        onClick={handleSend} 
                                        disabled={isSending}
                                        className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg shadow-emerald-900/30 transition-all transform ${isSending ? 'bg-gray-700 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-500 hover:scale-105 active:scale-95 text-white'}`}
                                    >
                                        {isSending ? <i className="fas fa-circle-notch fa-spin text-lg"></i> : (
                                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-0.5"><line x1="22" x2="11" y1="2" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                                        )}
                                    </button>
                                ) : (
                                    <button 
                                        onClick={startRecording} 
                                        className="w-12 h-12 rounded-full bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center hover:from-red-600 hover:to-rose-700 transition-all shadow-lg shadow-red-500/30 transform active:scale-95 border border-white/10" 
                                        title="Maintenir pour message vocal"
                                    >
                                        {/* VOICE NOTE ICON: SOUND WAVE */}
                                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white drop-shadow-md"><path d="M12 3v18"/><path d="M6 8v8"/><path d="M18 8v8"/><path d="M2 12h2"/><path d="M20 12h2"/></svg>
                                    </button>
                                )}
                            </div>
                        </div>
                    </>
                )}
            </div>
        </footer>
    );
};

export default MessageInput;
