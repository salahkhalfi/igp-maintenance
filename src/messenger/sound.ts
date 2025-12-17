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
        
        // Method 2 REMOVED: Unnecessary Web Audio API Context creation causing errors
    },

    play: function() {
        // Always reset to ensure it plays from start
        this.audio.currentTime = 0;
        this.audio.volume = 1.0;
        
        const promise = this.audio.play();
        if (promise !== undefined) {
            promise.catch(error => {
                if (error.name === 'NotAllowedError') {
                    console.warn("🔇 Notification sound blocked by browser (waiting for user interaction).");
                } else {
                    console.error("❌ Notification sound failed:", error);
                }
            });
        }
        return promise;
    }
};
