// --- Sound Manager (Robust Fix) ---

export const SoundManager = {
    audio: new Audio('/static/notification.mp3'),
    
    // Force browser to accept audio by playing a silent buffer via Web Audio API
    unlock: function() {
        // Method 1: HTML5 Audio Unlock
        this.audio.volume = 0;
        this.audio.play().then(() => {
            this.audio.pause();
            this.audio.currentTime = 0;
            this.audio.volume = 1;
        }).catch(() => {});

        // Method 2: Web Audio API Unlock (IOS/Mobile specific)
        try {
            const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
            if (AudioContext) {
                const ctx = new AudioContext();
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.connect(gain);
                gain.connect(ctx.destination);
                gain.gain.value = 0; // Silent
                osc.start(0);
                osc.stop(0.001);
                console.log("🔊 Audio Engine Unlocked");
            }
        } catch (e) {
            console.error("Audio Context unlock failed", e);
        }
    },

    play: function() {
        // Always reset to ensure it plays from start
        this.audio.currentTime = 0;
        this.audio.volume = 1.0;
        
        const promise = this.audio.play();
        if (promise !== undefined) {
            promise.catch(error => {
                console.error("❌ Notification sound failed:", error);
            });
        }
        return promise;
    }
};
