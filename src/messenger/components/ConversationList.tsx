        // SERVICE WORKER SOUND LISTENER (For Background/Lock Screen sounds that SW sends to window if visible)
        const swSoundListener = (event: MessageEvent) => {
            if (event.data && event.data.type === 'PLAY_NOTIFICATION_SOUND') {
                SoundManager.play().catch(e => console.error("SW triggered sound blocked", e));
            }
        };
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.addEventListener('message', swSoundListener);
        }