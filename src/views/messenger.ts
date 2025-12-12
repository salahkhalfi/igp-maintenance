export const messengerHTML = `<!DOCTYPE html>
<html lang="fr" class="h-full bg-gray-100">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>Messenger</title>
    <meta name="theme-color" content="#128C7E">
    <meta name="mobile-web-app-capable" content="yes">
    <link rel="icon" type="image/png" href="/icon-192.png">
    <link rel="stylesheet" href="/static/styles.css">
    <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
    <style>
        /* WhatsApp-like Styles */
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
        .bg-wa-dark { background-color: #111b21; }
        .bg-wa-header { background-color: #202c33; }
        .bg-wa-input { background-color: #2a3942; }
        .text-wa-gray { color: #8696a0; }
        .bg-wa-green { background-color: #00a884; }
        .bg-wa-outgoing { background-color: #005c4b; }
        .bg-wa-incoming { background-color: #202c33; }
        
        /* Mobile optimizations */
        @media (max-width: 640px) {
            .h-screen-safe { height: 100dvh; }
        }
    </style>
    <!-- SCRIPT DYNAMIQUE -->
    <script type="module">
        // Charger le manifeste Vite pour trouver le bon fichier JS hashé
        fetch('/static/client/.vite/manifest.json')
            .then(res => res.json())
            .then(manifest => {
                // Trouver l'entrée 'src/messenger/index.html' dans le manifeste
                const entry = manifest['src/messenger/index.html'];
                if (entry && entry.file) {
                    const script = document.createElement('script');
                    script.type = 'module';
                    script.src = '/static/client/' + entry.file;
                    document.head.appendChild(script);
                    
                    // Charger aussi les imports CSS ou JS si nécessaire
                    if (entry.imports) {
                        entry.imports.forEach(imp => {
                            const preload = document.createElement('link');
                            preload.rel = 'modulepreload';
                            preload.href = '/static/client/' + manifest[imp].file;
                            document.head.appendChild(preload);
                        });
                    }
                } else {
                    console.error('Manifest entry not found');
                    // Fallback manuel si le manifest change
                    const script = document.createElement('script');
                    script.type = 'module';
                    // Essayer de trouver le fichier messenger dans le dossier si possible, sinon erreur
                    // Ici on ne peut pas deviner le hash sans manifest
                }
            })
            .catch(err => console.error('Failed to load manifest', err));
    </script>
</head>
<body class="h-full overflow-hidden">
    <div id="root" class="h-full flex flex-col">
        <!-- Loading State -->
        <div class="flex-1 flex items-center justify-center bg-[#111b21]">
            <div class="text-center">
                <i class="fab fa-whatsapp text-6xl text-[#00a884] mb-4 animate-pulse"></i>
                <div class="text-[#8696a0] font-medium">Chargement Messenger...</div>
            </div>
        </div>
    </div>
</body>
</html>`;
