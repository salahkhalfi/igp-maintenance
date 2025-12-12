const VoiceTicketFab = ({ onTicketDetected }) => {
    const [isRecording, setIsRecording] = React.useState(false);
    const [isAnalyzing, setIsAnalyzing] = React.useState(false);
    const [mediaRecorder, setMediaRecorder] = React.useState(null);

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const recorder = new MediaRecorder(stream);
            const chunks = [];

            recorder.ondataavailable = (e) => {
                if (e.data.size > 0) chunks.push(e.data);
            };

            recorder.onstop = async () => {
                const audioBlob = new Blob(chunks, { type: 'audio/webm' });
                await analyzeAudio(audioBlob);
                stream.getTracks().forEach(track => track.stop()); // Stop mic
            };

            recorder.start();
            setMediaRecorder(recorder);
            setIsRecording(true);
        } catch (err) {
            console.error("Error accessing microphone:", err);
            alert("Impossible d'accéder au microphone. Vérifiez vos permissions.");
        }
    };

    const stopRecording = () => {
        if (mediaRecorder && isRecording) {
            mediaRecorder.stop();
            setIsRecording(false);
            setIsAnalyzing(true);
        }
    };

    const analyzeAudio = async (audioBlob) => {
        const formData = new FormData();
        formData.append('file', audioBlob, 'recording.webm');

        try {
            const response = await axios.post('/api/ai/analyze-ticket', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            if (response.data) {
                // Ensure priority is lowercase for the select input
                if (response.data.priority) {
                    response.data.priority = response.data.priority.toLowerCase();
                }
                onTicketDetected(response.data);
            }
        } catch (error) {
            console.error("AI Analysis failed:", error);
            alert("Erreur lors de l'analyse vocale: " + (error.response?.data?.error || error.message));
        } finally {
            setIsAnalyzing(false);
        }
    };

    return React.createElement('div', {
        className: 'fixed bottom-6 right-6 z-[2000] flex flex-col items-end gap-2',
        style: { touchAction: 'none' } // Prevent scrolling while touching FAB
    },
        // Status Bubble
        (isRecording || isAnalyzing) ? React.createElement('div', {
            className: 'bg-white px-4 py-2 rounded-lg shadow-lg mb-2 text-sm font-bold animate-fadeIn border border-gray-200'
        }, isRecording ? "🔴 Enregistrement..." : "🤖 Analyse IA...") : null,

        // FAB Button
        React.createElement('button', {
            onClick: isRecording ? stopRecording : startRecording,
            disabled: isAnalyzing,
            className: `w-16 h-16 rounded-full shadow-2xl flex items-center justify-center transition-all transform active:scale-95 ${
                isRecording 
                ? 'bg-red-600 animate-pulse ring-4 ring-red-300' 
                : isAnalyzing
                ? 'bg-gray-400 cursor-wait'
                : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 hover:shadow-blue-500/50'
            }`
        },
            React.createElement('i', {
                className: `fas ${isRecording ? 'fa-stop' : isAnalyzing ? 'fa-spinner fa-spin' : 'fa-microphone'} text-white text-2xl`
            })
        )
    );
};

// Expose globally
window.VoiceTicketFab = VoiceTicketFab;
