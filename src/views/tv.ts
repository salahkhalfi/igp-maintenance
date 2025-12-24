
export const tvHTML = `
<!DOCTYPE html>
<html lang="fr" class="h-full bg-slate-950 text-white overflow-hidden">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <!-- Force software rendering to prevent Chrome GPU crashes on TV displays -->
    <meta name="renderer" content="software">
    <meta http-equiv="X-UA-Compatible" content="IE=edge,chrome=1">
    <title>Vision - Planning Live</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
    <script src="https://cdn.jsdelivr.net/npm/dayjs@1.11.10/dayjs.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/dayjs@1.11.10/locale/fr.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700;800&family=Inter:wght@400;600;800&display=swap');

        body {
            font-family: 'Inter', sans-serif;
        }
        
        .font-mono {
            font-family: 'JetBrains Mono', monospace;
        }

        /* Animation de défilement fluide pour la timeline */
        .scrolling-container {
            mask-image: linear-gradient(to bottom, transparent, black 5%, black 90%, transparent);
            -webkit-mask-image: linear-gradient(to bottom, transparent, black 5%, black 90%, transparent);
        }

        /* Carte Glassmorphism High Contrast */
        .glass-panel {
            background: rgba(30, 41, 59, 0.7);
            backdrop-filter: blur(12px);
            border: 1px solid rgba(255, 255, 255, 0.1);
            box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.37);
        }

        .glass-panel-urgent {
            background: rgba(127, 29, 29, 0.2);
            border: 2px solid rgba(239, 68, 68, 0.6);
            box-shadow: 0 0 20px rgba(220, 38, 38, 0.2);
            /* DISABLED: animation: pulse-border - causes Chrome crash */
        }

        .glass-panel-active {
            background: rgba(20, 83, 45, 0.2);
            border: 1px solid rgba(34, 197, 94, 0.3);
        }

        /* ALL KEYFRAME ANIMATIONS DISABLED - Causes Chrome GPU crashes on TV displays */
        .animate-pulse-slow {
            /* DISABLED for TV stability */
            opacity: 1;
        }

        .text-shadow {
            text-shadow: 0 2px 4px rgba(0,0,0,0.5);
        }

        /* Status Pill */
        .status-pill {
            display: inline-flex;
            align-items: center;
            padding: 0.25em 0.75em;
            border-radius: 9999px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.05em;
        }

        /* Custom Scrollbar (hidden mostly) */
        ::-webkit-scrollbar {
            width: 0px;
            background: transparent;
        }
        
        .timeline-line {
            position: absolute;
            left: 24px;
            top: 0;
            bottom: 0;
            width: 2px;
            background: linear-gradient(to bottom, #3b82f6, #6366f1, rgba(99, 102, 241, 0));
            z-index: 0;
        }

        /* TV Remote Accessibility & Focus Indicators */
        /* ==========================================================================
           ACTIVE STATE: PREMIUM LIGHT THEME (Hover & Focus)
           "Projector Effect" with Premium Colors (Blue/Gold/Slate)
           ========================================================================== */
        
        /* DISABLED: transitions cause Chrome GPU issues on TV displays */
        [tabindex="0"] {
            /* transition disabled for TV stability */
        }

        /* FORCE CPU RENDERING - Prevent Chrome GPU crashes on TV displays */
        /* Exception: .news-ticker-text needs transform for JS animation */
        *:not(.news-ticker-text) {
            -webkit-backface-visibility: visible !important;
            backface-visibility: visible !important;
            -webkit-perspective: none !important;
            perspective: none !important;
            will-change: auto !important;
        }
        
        /* Disable CSS transitions for most elements */
        /* IMPORTANT: Do NOT use *:not() here - it breaks child animations */
        /* Instead, we selectively enable animations where needed */
        body, header, main, section, footer, div:not(.news-ticker-text), span:not(.news-ticker-text) {
            /* transition: none; - DISABLED to allow hover effects */
        }
        
        /* NEWS TICKER - MUST ANIMATE */
        /* Override any global rules - ticker needs transform animation */
        .news-ticker-text {
            display: inline-block !important;
            white-space: nowrap !important;
            padding-left: 100%;
            -webkit-animation: ticker var(--ticker-duration, 20s) linear infinite !important;
            animation: ticker var(--ticker-duration, 20s) linear infinite !important;
            -webkit-transform: translateZ(0);
            transform: translateZ(0);
        }

        /* 1. CARD HIGHLIGHT (Background & Border) */
        /* Target specific items using .interactive-card class to avoid Parent Container triggering all children */
        .interactive-card:focus,
        .interactive-card:focus-visible,
        .interactive-card:hover {
            /* Premium White/Blue Gradient Background */
            background: linear-gradient(135deg, #ffffff 0%, #f0f9ff 100%) !important;
            
            /* Vibrant Border */
            border: 2px solid #3b82f6 !important; /* Blue-500 */
            
            /* Subtle glow - no overflow */
            box-shadow: 
                0 0 0 3px rgba(59, 130, 246, 0.4), /* Blue Ring */
                0 8px 20px -8px rgba(37, 99, 235, 0.4) !important; /* Subtle shadow */
            
            /* FIXED: Removed scale/translateX to prevent overflow into adjacent column */
            transform: none;
            z-index: 10; /* Lower z-index, stay within container */
            position: relative;
        }

        /* 2. TYPOGRAPHY (High Contrast & Color) */
        .interactive-card:focus h3,
        .interactive-card:focus-visible h3, 
        .interactive-card:hover h3,
        .interactive-card:focus .font-bold.text-white,
        .interactive-card:focus-visible .font-bold.text-white,
        .interactive-card:hover .font-bold.text-white {
            color: #0f172a !important; /* Slate-900 */
            text-shadow: none !important;
        }

        /* Subtitles/Meta becomes Slate Blue */
        .interactive-card:focus .text-slate-400,
        .interactive-card:focus-visible .text-slate-400, 
        .interactive-card:hover .text-slate-400,
        .interactive-card:focus .text-slate-500,
        .interactive-card:focus-visible .text-slate-500, 
        .interactive-card:hover .text-slate-500 {
            color: #475569 !important; /* Slate-600 */
            font-weight: 600;
        }

        /* 3. ICONOGRAPHY (Vibrant Colors) */
        .interactive-card:focus .bg-slate-800,
        .interactive-card:focus-visible .bg-slate-800, 
        .interactive-card:hover .bg-slate-800,
        .interactive-card:focus .bg-slate-700,
        .interactive-card:focus-visible .bg-slate-700, 
        .interactive-card:hover .bg-slate-700 {
            background-color: #dbeafe !important; /* Blue-100 */
            border-color: #93c5fd !important; /* Blue-300 */
        }
        
        .interactive-card:focus i,
        .interactive-card:focus-visible i,
        .interactive-card:hover i {
            color: #2563eb !important; /* Blue-600 */
        }

        .interactive-card:focus .text-red-500,
        .interactive-card:focus-visible .text-red-500,
        .interactive-card:hover .text-red-500 {
            color: #dc2626 !important; /* Red-600 */
        }

        /* 4. PERSON CARDS - Keep dark background for contrast on white card */
        .interactive-card:focus .person-card,
        .interactive-card:focus-visible .person-card,
        .interactive-card:hover .person-card {
            background: #1e293b !important; /* Slate-800 solid */
            border: 2px solid #3b82f6 !important; /* Blue border for pop */
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3) !important;
        }

        .interactive-card:focus .person-label,
        .interactive-card:focus-visible .person-label,
        .interactive-card:hover .person-label {
            color: #cbd5e1 !important; /* Slate-300 - visible on dark */
        }

        /* CRITICAL: Person names must stay WHITE on dark person-card */
        .interactive-card:focus .person-card .person-name,
        .interactive-card:focus-visible .person-card .person-name,
        .interactive-card:hover .person-card .person-name {
            color: #ffffff !important; /* Pure white */
            text-shadow: 0 1px 2px rgba(0,0,0,0.5) !important;
        }

        /* Green assignee name stays green but brighter */
        .interactive-card:focus .person-card .text-green-400,
        .interactive-card:focus-visible .person-card .text-green-400,
        .interactive-card:hover .person-card .text-green-400 {
            color: #4ade80 !important; /* Bright green-400 */
            text-shadow: 0 1px 2px rgba(0,0,0,0.5) !important;
        }

        /* 5. TITLES & MACHINE TEXT - black on white card background */
        .interactive-card:focus .ticket-title,
        .interactive-card:focus-visible .ticket-title,
        .interactive-card:hover .ticket-title {
            color: #0f172a !important; /* Near black */
        }

        .interactive-card:focus .ticket-machine,
        .interactive-card:focus-visible .ticket-machine,
        .interactive-card:hover .ticket-machine {
            color: #1e40af !important; /* Dark blue */
        }

        /* 5b. LINK ICON - becomes prominent on hover */
        .interactive-card:focus .ticket-link-icon,
        .interactive-card:focus-visible .ticket-link-icon,
        .interactive-card:hover .ticket-link-icon {
            color: #2563eb !important; /* Blue-600 */
            transform: scale(1.2);
        }

        /* 6. AVATARS - Enhanced visibility on hover */
        .interactive-card:focus .person-card img[class*="rounded-full"],
        .interactive-card:focus-visible .person-card img[class*="rounded-full"],
        .interactive-card:hover .person-card img[class*="rounded-full"] {
            border-color: #60a5fa !important; /* Blue-400 */
            box-shadow: 0 0 0 3px rgba(96, 165, 250, 0.4), 0 2px 8px rgba(0,0,0,0.3) !important;
        }

        /* Initial circles - ensure visible on dark bg */
        .interactive-card:focus .person-card div[class*="rounded-full"][class*="bg-"],
        .interactive-card:focus-visible .person-card div[class*="rounded-full"][class*="bg-"],
        .interactive-card:hover .person-card div[class*="rounded-full"][class*="bg-"] {
            box-shadow: 0 0 0 2px rgba(255,255,255,0.3), 0 2px 8px rgba(0,0,0,0.3) !important;
        }

        /* Remove default outline */
        :focus-visible {
            outline: none !important;
        }

        /* DISABLED: scroll-behavior smooth causes GPU issues on TV */
        html {
            scroll-behavior: auto;
        }
        /* IMAGE POPUP PANEL (Above Details) */
        #image-popup-panel {
            position: fixed;
            bottom: 35vh; /* Positioned above the max-height of details panel */
            left: 50%;
            transform: translateX(-50%);
            opacity: 0;
            /* DISABLED: transition for TV stability */
            z-index: 140; /* Above details panel (100) */
            pointer-events: none;
            display: flex;
            justify-content: center;
            align-items: flex-end;
            width: 100%;
        }
        
        #image-popup-panel.visible {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
        }

        /* Details Panel - Bottom Sheet */
        #details-panel {
            position: fixed;
            bottom: -40vh; /* Hidden by default */
            left: 0;
            right: 0;
            height: auto; /* Allow auto height based on content */
            min-height: 15vh;
            max-height: 35vh;
            background: rgba(15, 23, 42, 0.95); /* Slate-900 */
            backdrop-filter: blur(20px);
            border-top: 1px solid rgba(255, 255, 255, 0.2);
            box-shadow: 0 -10px 40px rgba(0, 0, 0, 0.5);
            /* DISABLED: transition for TV stability */
            z-index: 100;
            /* padding handled by classes */
            display: flex;
            /* gap handled by classes */
            color: white;
            pointer-events: none; /* Fix for chaotic hover behavior */
        }

        #details-panel.visible {
            bottom: 0;
        }

        .detail-icon-box {
            width: 120px;
            height: 120px;
            border-radius: 24px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 4rem;
            flex-shrink: 0;
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .detail-content {
            flex: 1;
            display: flex;
            flex-col-direction: column;
            justify-content: center;
        }

        /* News Ticker - CSS animation restored (isolated, won't crash) */
        @keyframes ticker {
            0% { transform: translateX(0); }
            100% { transform: translateX(-100%); }
        }
        /* .news-ticker-text styles defined above with !important */
        .mask-linear {
            mask-image: linear-gradient(to right, transparent, black 5%, black 95%, transparent);
            -webkit-mask-image: linear-gradient(to right, transparent, black 5%, black 95%, transparent);
        }
        /* BROADCAST MESSAGE (Premium - Emerald Theme) */
        .bg-slate-900\/90 { /* Adjust fallback if needed, but inline classes override */ }

        /* BROADCAST OVERLAY */
        #broadcast-overlay {
            opacity: 0;
            pointer-events: none;
            /* DISABLED: transition for TV stability */
        }
        #broadcast-overlay.visible {
            opacity: 1;
            pointer-events: auto;
        }
        .gallery-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 1rem;
        }
        
        /* DISABLED: fadeInUp animation causes GPU issues on TV */
        .animate-fade-in-up {
            opacity: 1;
        }

        /* ============================================
           TV ASPECT RATIO & RESPONSIVE FIXES
           ============================================ */
        
        /* Prevent image distortion - ONLY for img tags */
        img.rounded-full {
            object-fit: cover;
            aspect-ratio: 1 / 1;
        }
        
        /* Avatar circles - MUST have explicit max size to prevent explosion */
        div[class*="rounded-full"][class*="bg-"] {
            max-width: 56px !important;  /* xl:w-14 = 56px */
            max-height: 56px !important;
            flex-shrink: 0 !important;
        }

        /* Ultra-wide TV (21:9) - More horizontal space */
        @media (min-aspect-ratio: 21/9) {
            main > section:first-child { flex: 0 0 70%; }
            main > section:last-child { flex: 0 0 30%; }
        }

        /* Standard TV (16:9) - Default layout */
        @media (min-aspect-ratio: 16/9) and (max-aspect-ratio: 21/9) {
            main > section:first-child { flex: 0 0 60%; }
            main > section:last-child { flex: 0 0 40%; }
        }

        /* Older TV / Monitor (4:3) - More vertical space needed */
        @media (max-aspect-ratio: 4/3) {
            main { flex-direction: column !important; }
            main > section:first-child { 
                flex: 0 0 55%; 
                width: 100% !important;
                border-right: none !important;
                border-bottom: 1px solid rgb(30, 41, 59) !important;
            }
            main > section:last-child { 
                flex: 0 0 45%; 
                width: 100% !important;
            }
        }

        /* Small screens / Vertical TV setup */
        @media (max-width: 1024px) {
            main { flex-direction: column !important; }
            main > section { 
                width: 100% !important; 
                min-height: 45vh;
            }
        }

        /* Prevent text overflow */
        .line-clamp-1, .line-clamp-2, .truncate {
            overflow: hidden;
            text-overflow: ellipsis;
        }

        /* Ensure cards don't stretch weirdly */
        .interactive-card {
            max-width: 100%;
            box-sizing: border-box;
        }

        /* Fix flex item shrinking issues */
        .flex-shrink-0 { flex-shrink: 0 !important; }
        .min-w-0 { min-width: 0 !important; }
    </style>
</head>
<body class="h-screen flex flex-col p-1 lg:p-4 bg-slate-950 overflow-hidden">

    <!-- BROADCAST OVERLAY (Full Screen) -->
    <div id="broadcast-overlay" class="fixed inset-0 z-[200] bg-slate-950 flex flex-col items-center justify-center p-8 lg:p-16 text-center">
        <div id="broadcast-content-container" class="max-w-7xl w-full h-full flex flex-col items-center justify-center relative">
            <!-- Injected via JS -->
        </div>
        <!-- Progress Bar -->
        <div class="absolute bottom-0 left-0 w-full h-2 bg-slate-800">
            <div id="broadcast-progress" class="h-full bg-emerald-500 w-0"></div>
        </div>
    </div>

    <!-- IMAGE POPUP PANEL (Above Details) -->
    <div id="image-popup-panel">
        <img id="popup-image" src="" class="max-h-[45vh] max-w-[80vw] rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] border-4 border-slate-700/50 object-contain bg-slate-900/80 backdrop-blur-sm">
    </div>

    <!-- DETAILS PANEL (Bottom Sheet) -->
    <div id="details-panel" class="p-4 lg:p-8 gap-4 lg:gap-8">
        <div class="detail-content w-full flex flex-col justify-center">
            <div class="flex items-center gap-2 lg:gap-4 mb-2 lg:mb-4">
                <span id="detail-badge" class="hidden px-2 lg:px-3 py-0.5 lg:py-1 rounded text-xs lg:text-sm font-bold uppercase border">BADGE</span>
                <div id="detail-meta" class="text-blue-400 font-mono text-sm lg:text-lg uppercase tracking-widest">METADATA • INFO</div>
            </div>
            <p id="detail-desc" class="text-slate-200 text-xl lg:text-3xl font-light leading-snug lg:leading-relaxed max-w-7xl">Description complète...</p>
        </div>
    </div>

    <!-- LOADING SCREEN -->
    <div id="loading" class="fixed inset-0 bg-slate-950 z-50 flex items-center justify-center">
        <div class="text-center">
            <div class="rounded-full h-32 w-32 border-4 border-blue-500 mx-auto mb-8"></div>
            <h2 class="text-4xl font-bold text-blue-400 tracking-wider">VISION</h2>
            <p class="text-slate-500 mt-4 text-xl">Chargement du planning...</p>
        </div>
    </div>

    <!-- SETUP SCREEN (Overlay) -->
    <div id="setup-screen" class="hidden fixed inset-0 z-[300] flex items-center justify-center bg-slate-950">
        <div class="p-8 rounded-xl border border-slate-700 shadow-2xl max-w-md w-full text-center bg-slate-900">
            <div class="mb-6 text-blue-500">
                <i class="fas fa-shield-alt text-5xl"></i>
            </div>
            <h1 class="text-2xl font-bold mb-2 uppercase tracking-wide text-white">Accès Sécurisé</h1>
            <p class="mb-6 text-sm text-slate-400">Tableau de bord industriel</p>
            <input type="text" id="access-key" placeholder="Clé d'autorisation" 
                class="w-full rounded-lg p-3 text-center mb-4 focus:outline-none font-mono border bg-slate-800 text-white border-slate-700 focus:border-blue-500 transition-colors">
            <button onclick="saveKey()" class="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-lg uppercase tracking-wider transition-colors">
                Connexion
            </button>
        </div>
    </div>

    <!-- HEADER -->
    <header class="h-16 flex-none bg-slate-900/90 border-b border-slate-800 flex items-center justify-between px-4 lg:px-6 relative z-10 backdrop-blur-md gap-4">
        <div class="flex items-center gap-4 w-auto flex-shrink-0">
            <img src="/api/settings/logo?t=tv" onerror="this.onerror=null; this.src='/static/logo-igp.png'" alt="Logo" class="h-8 lg:h-10 w-auto transition-all duration-500">
            <div class="h-6 w-px bg-slate-700 hidden sm:block"></div>
            <div class="hidden sm:block">
                <h1 class="text-base lg:text-lg font-bold text-white tracking-tight leading-none">PLANNING</h1>
                <p class="text-blue-400 text-xs lg:text-sm font-mono font-bold tracking-widest uppercase leading-none mt-0.5">Dashboard</p>
            </div>
        </div>

        <!-- BROADCAST MESSAGE (Premium) -->
        <div class="flex-1 flex justify-start items-center z-20 min-w-0">
            <div id="tv-broadcast" class="hidden relative flex items-center gap-2 lg:gap-4 pl-2 pr-4 lg:pr-6 py-1.5 lg:py-2 rounded-full bg-slate-900/90 border border-emerald-500/50 backdrop-blur-xl shadow-[0_0_20px_rgba(16,185,129,0.4)] transition-all duration-500 w-full max-w-full group overflow-hidden">
                <!-- Ambient Glow Behind -->
                <div class="absolute inset-0 bg-gradient-to-r from-emerald-500/20 via-green-500/10 to-transparent opacity-100"></div>
                
                <!-- Icon Bubble -->
                <div class="relative h-10 w-10 rounded-full bg-gradient-to-br from-emerald-600 to-green-500 flex items-center justify-center shadow-[0_0_15px_rgba(16,185,129,0.6)] flex-shrink-0 border border-white/20 z-10">
                    <i class="fas fa-bullhorn text-white text-sm drop-shadow-md"></i>
                </div>
                
                <!-- Text (Ticker) -->
                <div class="flex-1 overflow-hidden relative h-8 flex items-center mask-linear z-10 w-full">
                    <span id="tv-broadcast-text" class="news-ticker-text text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl font-bold text-emerald-100 tracking-wide leading-tight font-sans drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)] pb-0.5" style="text-shadow: 0 0 15px rgba(52, 211, 153, 0.6);">Message...</span>
                </div>
            </div>
        </div>

        <div class="flex items-center gap-4 w-auto pl-4 justify-end flex-shrink-0">
            <!-- WEATHER WIDGET (Compact) -->
            <!-- Weather removed from here -->
                
                
                    
                </div>
            </div>

            <!-- CLOCK (Compact) -->
            <div class="text-right font-mono leading-none">
                <div id="clock-time" class="text-4xl font-bold text-white tracking-tighter">--:--</div>
                <div id="clock-date" class="text-xs lg:text-sm text-blue-300 font-semibold uppercase mt-0.5">---</div>
            </div>
        </div>
    </header>

    <!-- MAIN CONTENT GRID - Responsive for different TV aspect ratios -->
    <main class="flex-1 flex flex-col lg:flex-row overflow-hidden relative">
        
        <!-- LEFT COLUMN: TODAY (responsive width) -->
        <section class="w-full lg:w-[55%] xl:w-[60%] 2xl:w-[65%] flex flex-col border-b lg:border-b-0 lg:border-r border-slate-800 bg-slate-900/50 relative p-3 lg:p-4 xl:p-6 min-h-[50vh] lg:min-h-0 overflow-hidden">
            
            <!-- Header Today -->
            <div class="flex items-center justify-between gap-3 mb-4 border-b border-slate-800/50 pb-3">
                <div class="flex items-center gap-3">
                    <div class="bg-blue-600 h-6 w-1 rounded-full shadow-[0_0_15px_rgba(37,99,235,0.5)]"></div>
                    <h2 class="text-xl lg:text-3xl font-bold text-white tracking-tight uppercase">
                        Aujourd'hui
                    </h2>
                </div>

                <div class="flex items-center gap-2 lg:gap-3">
                    <i id="weather-icon" class="fas fa-cloud-sun text-yellow-400 text-xl lg:text-2xl"></i>
                    <div id="weather-temp" class="text-xl lg:text-2xl font-bold text-white leading-none">--°</div>
                </div>

                <span id="today-date-large" class="text-sm md:text-lg lg:text-xl xl:text-2xl text-blue-400 font-mono font-bold uppercase tracking-widest">...</span>
            </div>

            <!-- ACTIVE CONTENT SCROLL -->
            <div id="today-content" class="flex-1 overflow-y-auto space-y-3 pr-2 scrolling-container pt-6 pb-[50vh] focus:outline-none" tabindex="0">
                <!-- Content injected via JS -->
            </div>

            <!-- EMPTY STATE -->
            <div id="today-empty" class="hidden h-full flex flex-col items-center justify-center opacity-30 scale-75">
                <i class="fas fa-check-circle text-7xl mb-4"></i>
                <h3 class="text-2xl font-bold">R.A.S.</h3>
            </div>

        </section>

        <!-- RIGHT COLUMN: TIMELINE (responsive width) -->
        <section class="w-full lg:w-[45%] xl:w-[40%] 2xl:w-[35%] bg-slate-950 relative flex flex-col min-h-[40vh] lg:min-h-0 overflow-hidden">
            <div class="p-3 lg:p-4 border-b border-slate-800 bg-slate-900 z-20 shadow-xl flex justify-between items-center">
                <h2 class="text-lg md:text-xl lg:text-2xl xl:text-3xl font-bold text-blue-100 flex items-center gap-2 lg:gap-3 whitespace-nowrap">
                    <i class="fas fa-history text-blue-500"></i>
                    PLANNING À VENIR
                </h2>
                <button id="btn-fullscreen" class="p-2 lg:p-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-blue-400 hover:text-white transition-all duration-300 focus:ring-4 focus:ring-blue-500 outline-none border border-slate-700" onclick="toggleFullscreen()" tabindex="0">
                    <i class="fas fa-expand text-lg lg:text-2xl"></i>
                </button>
            </div>
            
            <div id="timeline-content" class="flex-1 overflow-y-auto p-4 pl-8 space-y-6 relative scrolling-container focus:outline-none pb-[50vh]" tabindex="0">
                <!-- Line background -->
                <div class="timeline-line"></div>
                <!-- Content injected via JS -->
            </div>
        </section>

    </main>

    <script>
        dayjs.locale('fr');

        // ==========================================
        // CONFIGURATION & CONSTANTS
        // ==========================================
        const CONFIG = {
            REFRESH_INTERVAL: 60000,    // 60s
            SCROLL_SPEED: 50,           // px/step
            DETAILS: {
                SHOW_DELAY: 500,        // ms before popup appears (Optimized)
                HIDE_DELAY: 300         // ms before popup disappears
            },
            BROADCAST_INTERVAL: 20000   // 20s per message (Aligned with Ticker)
        };

        let TV_KEY = new URLSearchParams(window.location.search).get('key');
        
        // ==========================================
        // STATE MANAGEMENT
        // ==========================================
        const State = {
            appData: null,
            lastDataHash: '',
            isPaused: false,
            broadcastIndex: 0, // Current rotation index
            timers: {
                detailsShow: null,
                detailsHide: null,
                scroll: null,
                clock: null,
                weather: null,
                data: null,
                broadcast: null // Timer for message rotation
            },
            tickerObserver: null
        };

        // ==========================================
        // BROADCAST OVERLAY MANAGER (RICH MEDIA)
        // ==========================================
        const BroadcastOverlayManager = {
            messages: [],
            timer: null,
            progressTimer: null,
            currentIndex: 0,
            isShowing: false,
            
            init(messages) {
                // Check if messages changed to avoid reset?
                // Simple approach: just update list. If timer running, it picks up new list next time.
                // If empty before and now full, start.
                const wasEmpty = this.messages.length === 0;
                this.messages = messages || [];
                
                if (this.messages.length > 0 && wasEmpty) {
                    this.scheduleNext();
                } else if (this.messages.length === 0) {
                    this.stop();
                }
            },

            stop() {
                if (this.timer) clearTimeout(this.timer);
                if (this.progressTimer) clearInterval(this.progressTimer);
                this.hide();
            },

            scheduleNext() {
                if (this.messages.length === 0) return;
                
                // Wait 45s before showing next overlay (Dashboard time)
                this.timer = setTimeout(() => {
                    this.showNext();
                }, 45000); 
            },

            showNext() {
                // If user is interacting, delay
                if (State.isPaused && !this.isShowing) {
                    this.scheduleNext();
                    return;
                }

                const msg = this.messages[this.currentIndex];
                this.currentIndex = (this.currentIndex + 1) % this.messages.length;
                
                this.render(msg);
                this.show();
                
                // Progress Bar
                const duration = (msg.display_duration || 15) * 1000;
                const start = Date.now();
                const bar = document.getElementById('broadcast-progress');
                if(bar) bar.style.width = '0%';
                
                if (this.progressTimer) clearInterval(this.progressTimer);
                this.progressTimer = setInterval(() => {
                    const elapsed = Date.now() - start;
                    const pct = Math.min(100, (elapsed / duration) * 100);
                    if(bar) bar.style.width = pct + '%';
                    
                    if (elapsed >= duration) {
                        clearInterval(this.progressTimer);
                        this.hide();
                        this.scheduleNext();
                    }
                }, 50);
            },

            render(msg) {
                const container = document.getElementById('broadcast-content-container');
                if (!container) return;

                let html = '';
                
                const titleHtml = msg.title ? \`<h1 class="text-5xl lg:text-7xl font-bold text-white mb-8 font-display tracking-tight drop-shadow-lg">\${msg.title}</h1>\` : '';
                const contentHtml = msg.content ? \`<p class="text-2xl lg:text-4xl text-slate-200 max-w-5xl leading-relaxed font-light drop-shadow-md whitespace-pre-line">\${msg.content}</p>\` : '';
                
                // ALERT TYPE: Critical machine down alerts (auto-generated)
                if (msg.type === 'alert') {
                    html = \`
                        <div class="flex flex-col items-center animate-fade-in-up w-full">
                            <div class="bg-red-600/90 backdrop-blur-xl rounded-3xl p-12 shadow-2xl border-4 border-red-400 max-w-4xl">
                                <div class="flex items-center justify-center gap-6 mb-6">
                                    <i class="fas fa-exclamation-triangle text-white text-6xl lg:text-8xl drop-shadow-lg"></i>
                                </div>
                                <h1 class="text-4xl lg:text-6xl font-black text-white text-center mb-4 tracking-tight drop-shadow-lg">\${msg.title || 'ALERTE'}</h1>
                                <p class="text-2xl lg:text-3xl text-red-100 text-center font-medium drop-shadow-md">\${msg.content || ''}</p>
                            </div>
                        </div>
                    \`;
                } else if (msg.type === 'image_text' || msg.type === 'text') { 
                    const imgHtml = (msg.media_urls && msg.media_urls.length > 0) 
                        ? \`<img src="\${msg.media_urls[0]}" class="max-h-[60vh] w-auto rounded-3xl shadow-2xl border-4 border-white/10 mb-8 object-contain bg-black/20">\` 
                        : '';
                    
                    html = \`
                        <div class="flex flex-col items-center animate-fade-in-up w-full">
                            \${titleHtml}
                            \${imgHtml}
                            \${contentHtml}
                        </div>
                    \`;
                } else if (msg.type === 'gallery') {
                    const images = msg.media_urls || [];
                    const gridHtml = images.slice(0, 6).map(url => \`
                        <div class="aspect-video rounded-2xl overflow-hidden shadow-xl border-2 border-white/10 bg-black/50">
                            <img src="\${url}" class="w-full h-full object-cover">
                        </div>
                    \`).join('');
                    
                    html = \`
                        <div class="flex flex-col items-center w-full h-full justify-center animate-fade-in-up">
                            \${titleHtml}
                            <div class="gallery-grid w-full gap-6 lg:gap-8 p-4 mb-8">
                                \${gridHtml}
                            </div>
                            \${contentHtml}
                        </div>
                    \`;
                }
                
                container.innerHTML = html;
            },

            show() {
                this.isShowing = true;
                const el = document.getElementById('broadcast-overlay');
                if (el) el.classList.add('visible');
                // Pause other rotations
                PresentationManager.stop();
            },

            hide() {
                this.isShowing = false;
                const el = document.getElementById('broadcast-overlay');
                if (el) el.classList.remove('visible');
                // Resume other rotations
                PresentationManager.start();
            }
        };

        // ==========================================
        // PRESENTATION MANAGER (AUTO-CYCLE)
        // ==========================================
        const PresentationManager = {
            timer: null,
            currentIndex: -1,
            CYCLE_DURATION: 10000, // 10 seconds per item (Optimized for readability)

            start() {
                this.stop();
                
                // If we are starting from scratch or resuming, handle gracefully
                // To avoid jumping immediately on resume, we show current first
                if (this.currentIndex === -1) {
                    this.next();
                } else {
                    // Resume mode: Re-focus current item for full duration before advancing
                    this.showCurrent();
                    this.timer = setTimeout(() => this.next(), this.CYCLE_DURATION);
                }
            },

            stop() {
                if (this.timer) clearTimeout(this.timer);
            },

            next() {
                if (State.isPaused) return;

                const allItems = this.getAllItems();
                if (allItems.length === 0) return;

                // Move to next index
                this.currentIndex = (this.currentIndex + 1) % allItems.length;

                // Fluidity: Reset timeline scroll when cycle restarts
                if (this.currentIndex === 0) {
                    const timelineContainer = document.getElementById('timeline-content');
                    if (timelineContainer) timelineContainer.scrollTo({ top: 0, behavior: 'auto' });
                }

                this.showCurrent();

                // Schedule next cycle
                this.timer = setTimeout(() => {
                    this.next();
                }, this.CYCLE_DURATION);
            },

            getAllItems() {
                const todayItems = Array.from(document.querySelectorAll('#today-content [tabindex="0"]'));
                const timelineItems = Array.from(document.querySelectorAll('#timeline-content [tabindex="0"]'));
                return [...todayItems, ...timelineItems];
            },

            showCurrent() {
                const allItems = this.getAllItems();
                if (allItems.length === 0) return;

                // Safety check for index out of bounds (e.g. after list update)
                if (this.currentIndex >= allItems.length || this.currentIndex < 0) {
                    this.currentIndex = 0;
                }

                const item = allItems[this.currentIndex];
                if (item) {
                    // Focus triggers existing listeners (DetailsManager.show)
                    item.focus({ preventScroll: true });
                    
                    // Smooth scroll to center (KEY: prevents hiding behind popup)
                    item.scrollIntoView({ behavior: 'auto', block: 'center' });
                }
            }
        };

        // ==========================================
        // INACTIVITY MANAGER (AUTO-RESUME)
        // ==========================================
        const InactivityManager = {
            timer: null,
            DELAY: 15000, // 15 seconds idle before resuming

            init() {
                // Listen to inputs
                ['keydown', 'mousemove', 'click', 'touchstart'].forEach(evt => {
                    document.addEventListener(evt, () => this.reset());
                });
                this.reset();
            },

            reset() {
                State.isPaused = true;
                PresentationManager.stop(); // Stop cycle immediately on interaction
                
                if (this.timer) clearTimeout(this.timer);
                this.timer = setTimeout(() => this.handleTimeout(), this.DELAY);
            },

            handleTimeout() {
                // If an element is focused, blur it to resume auto-scroll
                if (document.activeElement && document.activeElement !== document.body) {
                    document.activeElement.blur();
                }
                
                // Ensure popup is closed
                DetailsManager.hide();
                
                // Ensure scroll resumes (double safety)
                State.isPaused = false;
                
                // Resume Presentation Mode
                PresentationManager.start();
            }
        };

        // ==========================================
        // NAVIGATION MANAGER (KEYBOARD / REMOTE)
        // ==========================================
        const NavigationManager = {
            init() {
                document.addEventListener('keydown', (e) => {
                    const key = e.key;
                    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(key)) {
                        e.preventDefault();
                        this.handleNavigation(key);
                    }
                });
            },

            handleNavigation(key) {
                const active = document.activeElement;
                const todayList = document.getElementById('today-content');
                const timelineList = document.getElementById('timeline-content');
                const btnFullscreen = document.getElementById('btn-fullscreen');

                const getItems = (container) => Array.from(container.querySelectorAll('[tabindex="0"]:not(.hidden)'));

                // 1. Special Case: Fullscreen Button Focus
                if (active === btnFullscreen) {
                    if (key === 'ArrowDown') {
                        // Return to content (Try Today first, then Timeline)
                        const target = getItems(todayList)[0] || getItems(timelineList)[0];
                        if (target) {
                            target.focus();
                            target.scrollIntoView({ block: 'center', behavior: 'auto' });
                        }
                    }
                    return;
                }

                // 2. Identify where we are
                let currentContainer = null;
                if (todayList.contains(active)) currentContainer = todayList;
                else if (timelineList.contains(active)) currentContainer = timelineList;

                // Default focus if nothing active
                if (!currentContainer) {
                    const first = getItems(todayList)[0] || getItems(timelineList)[0];
                    if (first) {
                        first.focus();
                        first.scrollIntoView({ block: 'center', behavior: 'auto' });
                    }
                    return;
                }

                const items = getItems(currentContainer);
                const currentIndex = items.indexOf(active);

                if (key === 'ArrowUp') {
                    if (currentIndex > 0) {
                        const target = items[currentIndex - 1];
                        target.focus();
                        target.scrollIntoView({ block: 'center', behavior: 'auto' });
                    } else {
                        // TOP OF LIST -> Go to Header (Fullscreen Button)
                        if (btnFullscreen) btnFullscreen.focus();
                    }
                } else if (key === 'ArrowDown') {
                    if (currentIndex < items.length - 1) {
                        const target = items[currentIndex + 1];
                        target.focus();
                        target.scrollIntoView({ block: 'center', behavior: 'auto' });
                    }
                } else if (key === 'ArrowRight') {
                    if (currentContainer === todayList) {
                        const targetItems = getItems(timelineList);
                        if (targetItems.length > 0) {
                            // Find closest item by vertical position approximation or just first
                            // For TV stability, first visible is often safest, but let's try top
                            targetItems[0].focus();
                            targetItems[0].scrollIntoView({ block: 'center', behavior: 'auto' });
                        }
                    }
                } else if (key === 'ArrowLeft') {
                    if (currentContainer === timelineList) {
                        const targetItems = getItems(todayList);
                        if (targetItems.length > 0) {
                            targetItems[0].focus();
                            targetItems[0].scrollIntoView({ block: 'center', behavior: 'auto' });
                        }
                    }
                }
            }
        };

        // ==========================================
        // DETAILS PANEL MANAGER
        // ==========================================
        const DetailsManager = {
            elements: {},

            init() {
                this.elements = {
                    panel: document.getElementById('details-panel'),
                    desc: document.getElementById('detail-desc'),
                    meta: document.getElementById('detail-meta'),
                    badge: document.getElementById('detail-badge'),
                    imagePanel: document.getElementById('image-popup-panel'),
                    image: document.getElementById('popup-image')
                };

                // Close on Escape/Backspace
                document.addEventListener('keydown', (e) => {
                    if (e.key === 'Escape' || e.key === 'Backspace') {
                        this.hideImmediate();
                    }
                });
            },

            // Validate if item has enough content to show popup
            hasContent(item) {
                const data = item.data;
                const hasImg = !!data.image_url;

                if (item.type === 'ticket') {
                    return (data.description && data.description.trim().length > 0) || hasImg;
                } else {
                    // Use 'details' for events, 'description' is for tickets
                    const hasDetails = data.details && data.details.trim().length > 0;
                    const hasCat = data.category_label && data.category_label.trim().length > 0;
                    return hasDetails || hasCat || hasImg;
                }
            },

            updateDOM(item) {
                const { desc, meta, badge, imagePanel, image } = this.elements;
                const data = item.data;
                
                // Handle Image
                if (data.image_url) {
                    image.src = data.image_url;
                    image.onload = () => imagePanel.classList.add('loaded');
                } else {
                    image.src = '';
                }

                // Reset Badge
                badge.classList.add('hidden');
                badge.className = 'hidden px-2 lg:px-3 py-0.5 lg:py-1 rounded text-xs lg:text-sm font-bold uppercase border'; 

                if (item.type === 'ticket') {
                    desc.textContent = data.description || '';
                    meta.textContent = \`TICKET #\${data.ticket_id} • \${data.machine_name} • \${data.assignee_name || 'Non assigné'}\`;
                    
                    // Badge
                    badge.classList.remove('hidden');
                    if (data.status === 'in_progress') {
                        badge.textContent = 'EN COURS';
                        badge.classList.add('bg-green-900', 'text-green-300', 'border-green-700');
                    } else {
                        badge.textContent = 'PLANIFIÉ';
                        badge.classList.add('bg-blue-900', 'text-blue-300', 'border-blue-700');
                    }

                } else {
                    // Use 'details' property for events
                    desc.textContent = data.details || data.category_label || '';
                    meta.textContent = \`ÉVÉNEMENT • \${dayjs(data.date).format('D MMMM YYYY')} \${data.time ? '• ' + data.time.substring(0,5) : ''}\`;
                    
                    // Badge
                    if (data.category_label) {
                        badge.classList.remove('hidden');
                        badge.textContent = data.category_label;
                        badge.classList.add('bg-slate-800', 'text-slate-300', 'border-slate-600');
                    }
                }
            },

            show(item) {
                if (!this.hasContent(item)) {
                    this.hideImmediate();
                    return;
                }
                this.updateDOM(item);
                this.elements.panel.classList.add('visible');
                
                // Show Image Panel if URL exists
                if (item.data.image_url) {
                    this.elements.imagePanel.classList.add('visible');
                } else {
                    this.elements.imagePanel.classList.remove('visible');
                }
            },

            hide() {
                this.elements.panel.classList.remove('visible');
                this.elements.imagePanel.classList.remove('visible');
            },
            // TIMERS LOGIC
            clearTimers() {
                if (State.timers.detailsShow) clearTimeout(State.timers.detailsShow);
                if (State.timers.detailsHide) clearTimeout(State.timers.detailsHide);
            },

            scheduleShow(item) {
                this.clearTimers();
                State.timers.detailsShow = setTimeout(() => {
                    this.show(item);
                }, CONFIG.DETAILS.SHOW_DELAY);
            },

            scheduleHide() {
                this.clearTimers();
                State.timers.detailsHide = setTimeout(() => {
                    this.hide();
                }, CONFIG.DETAILS.HIDE_DELAY);
            },

            hideImmediate() {
                this.clearTimers();
                this.hide();
            },

            // Attach standard events to an element
            attachEvents(element, item) {
                // Show Triggers (Delayed)
                const triggerShow = () => this.scheduleShow(item);
                element.addEventListener('focus', triggerShow);
                element.addEventListener('mouseenter', triggerShow);
                element.addEventListener('touchstart', triggerShow, { passive: true });

                // Hide Triggers (Delayed)
                // 1. Blur always schedules hide (focus lost)
                element.addEventListener('blur', () => this.scheduleHide());

                // 2. Mouse/Touch leave only hide if NOT focused (prevents accidental hide during auto-scroll)
                const triggerHideIfNotFocused = () => {
                     if (document.activeElement !== element) {
                         this.scheduleHide();
                     }
                };
                element.addEventListener('mouseleave', triggerHideIfNotFocused);
                element.addEventListener('touchend', triggerHideIfNotFocused);

                // Instant Show (Click)
                element.addEventListener('click', () => {
                    this.clearTimers();
                    this.show(item);
                });
            }
        };

        // ==========================================
        // CORE FUNCTIONS
        // ==========================================

        function saveKey() {
            const val = document.getElementById('access-key').value.trim();
            if(val) {
                localStorage.setItem('igp_tv_key', val);
                // Reload with new key
                const url = new URL(window.location.href);
                url.searchParams.set('key', val);
                window.location.href = url.toString();
            }
        }

        async function init() {
            // Auth Check
            if (!TV_KEY) TV_KEY = localStorage.getItem('igp_tv_key');
            
            if (!TV_KEY) {
                document.getElementById('loading').classList.add('hidden');
                document.getElementById('setup-screen').classList.remove('hidden');
                return;
            }

            if (TV_KEY) localStorage.setItem('igp_tv_key', TV_KEY);

            // Init Modules
            InactivityManager.init();
            NavigationManager.init();
            DetailsManager.init();
            updateClock();
            fetchWeather();
            
            // Schedule Updates
            State.timers.clock = setInterval(updateClock, 1000);
            State.timers.weather = setInterval(fetchWeather, 600000); // 10min
            State.timers.data = setInterval(loadData, CONFIG.REFRESH_INTERVAL);
            // Broadcast timer: Check for time-based updates (active/inactive notes)
            // We show all active notes in a continuous ticker, so we don't rotate index.
            State.timers.broadcast = setInterval(() => {
                renderBroadcast(); 
            }, 10000);

            // Initial Load
            await loadData();
            
            // Start Systems
            startTimelineAutoScroll();
            setupFullscreen();
            // setupInitialFocus(); // Replaced by PresentationManager
            
            // Start Presentation Mode
            setTimeout(() => PresentationManager.start(), 2000);
        }

        function updateClock() {
            const now = dayjs();
            document.getElementById('clock-time').textContent = now.format('HH:mm');
            document.getElementById('clock-date').textContent = now.format('dddd D MMM');
            document.getElementById('today-date-large').textContent = now.format('D MMMM YYYY');
        }

        async function fetchWeather() {
            try {
                // Get location from State.appData (loaded from API) or use defaults
                const loc = (State.appData && State.appData.location) || { latitude: '45.5017', longitude: '-73.5673', timezone: 'America/Toronto' };
                const res = await axios.get(\`https://api.open-meteo.com/v1/forecast?latitude=\${loc.latitude}&longitude=\${loc.longitude}&current=temperature_2m,weather_code&timezone=\${encodeURIComponent(loc.timezone)}\`);
                if (res.data && res.data.current) {
                    const { temperature_2m, weather_code } = res.data.current;
                    const temp = Math.round(temperature_2m);
                    
                    let icon = 'fa-sun', color = 'text-yellow-400';
                    if (weather_code >= 1 && weather_code <= 3) { icon = 'fa-cloud-sun'; color = 'text-blue-200'; }
                    else if (weather_code >= 45 && weather_code <= 48) { icon = 'fa-smog'; color = 'text-slate-400'; }
                    else if (weather_code >= 51 && weather_code <= 67) { icon = 'fa-cloud-rain'; color = 'text-blue-400'; }
                    else if (weather_code >= 71 && weather_code <= 77) { icon = 'fa-snowflake'; color = 'text-sky-400'; }
                    else if (weather_code >= 80 && weather_code <= 82) { icon = 'fa-cloud-showers-heavy'; color = 'text-blue-500'; }
                    else if (weather_code >= 95) { icon = 'fa-bolt'; color = 'text-yellow-500'; }

                    document.getElementById('weather-temp').className = \`text-xl lg:text-2xl font-bold leading-none \${color}\`; document.getElementById('weather-temp').textContent = \`\${temp}°\`;
                    document.getElementById('weather-icon').className = \`fas \${icon} \${color} text-xl lg:text-2xl\`;
                }
            } catch (e) {
                console.error("Weather Error:", e);
            }
        }

        async function loadData() {
            try {
                if (!TV_KEY) {
                    document.getElementById('loading').classList.add('hidden');
                    document.getElementById('setup-screen').classList.remove('hidden');
                    return;
                }

                const response = await axios.get('/api/tv/data?key=' + TV_KEY);
                const newDataHash = JSON.stringify(response.data);
                
                if (newDataHash === State.lastDataHash) {
                    // Just update clock and status, skip DOM rebuild
                    return;
                }

                State.lastDataHash = newDataHash;
                State.appData = response.data;
                
                document.getElementById('loading').classList.add('hidden');
                
                // Pause presentation during render to avoid index conflicts
                PresentationManager.stop();

                renderDashboard();
                
                // Initialize Broadcast Overlay with new rich messages
                if (State.appData.broadcast_messages) {
                    BroadcastOverlayManager.init(State.appData.broadcast_messages);
                }
                
                // Resume presentation (will re-validate index and show current)
                PresentationManager.start();

            } catch (error) {
                console.error("Load Error:", error);
                if (error.response && error.response.status === 403) {
                    localStorage.removeItem('igp_tv_key');
                    document.getElementById('loading').classList.add('hidden');
                    document.getElementById('setup-screen').classList.remove('hidden');
                }
            }
        }

        // ==========================================
        // RENDERING
        // ==========================================

        function renderDashboard() {
            renderBroadcast(); // Force immediate update on data load
            renderTodayColumn();
            renderUpcomingTimeline();
        }

        
        // ==========================================
        // DYNAMIC BROADCAST THEME
        // ==========================================
        function applyBroadcastTheme(isScheduled) {
            const el = document.getElementById('tv-broadcast');
            const glow = document.getElementById('broadcast-glow');
            const iconContainer = document.getElementById('broadcast-icon-container');
            const icon = document.getElementById('broadcast-icon');
            
            if (!el || !glow || !iconContainer || !icon) return;

            const theme = isScheduled ? {
                border: 'border-amber-500/50',
                shadow: 'shadow-[0_0_20px_rgba(245,158,11,0.4)]',
                glow: 'from-amber-500/20 via-orange-500/10',
                iconBg: 'from-amber-600 to-orange-500',
                iconShadow: 'shadow-[0_0_15px_rgba(245,158,11,0.6)]',
                iconClass: 'fa-clock'
            } : {
                border: 'border-emerald-500/50',
                shadow: 'shadow-[0_0_20px_rgba(16,185,129,0.4)]',
                glow: 'from-emerald-500/20 via-green-500/10',
                iconBg: 'from-emerald-600 to-green-500',
                iconShadow: 'shadow-[0_0_15px_rgba(16,185,129,0.6)]',
                iconClass: 'fa-bullhorn'
            };
            
            // Apply Classes
            // Note: We maintain base layout classes and just swap theme colors
            el.className = \`relative flex items-center gap-2 lg:gap-4 pl-2 pr-4 lg:pr-6 py-1.5 lg:py-2 rounded-full bg-slate-900/90 backdrop-blur-xl transition-all duration-500 w-full max-w-full group overflow-hidden \${theme.border} \${theme.shadow}\`;
            
            glow.className = \`absolute inset-0 bg-gradient-to-r \${theme.glow} to-transparent opacity-100 transition-all duration-500\`;
            
            iconContainer.className = \`relative h-10 w-10 rounded-full bg-gradient-to-br \${theme.iconBg} flex items-center justify-center \${theme.iconShadow} flex-shrink-0 border border-white/20 z-10 transition-all duration-500\`;
            
            // Only change icon class if needed to prevent flicker
            if (!icon.classList.contains(theme.iconClass)) {
                icon.className = \`fas \${theme.iconClass} text-white text-sm drop-shadow-md\`;
            }
        }

        function setupTickerObserver() {
            if (State.tickerObserver) {
                State.tickerObserver.disconnect();
            }
            
            const container = document.getElementById('tv-broadcast');
            // We observe the items inside the scrolling text
            const items = document.querySelectorAll('.broadcast-item');
            
            if (items.length === 0) return;
            
            State.tickerObserver = new IntersectionObserver((entries) => {
                // Find the entry that is most visible or just entering?
                // Since text scrolls right-to-left, we want to catch the one entering from the right (mostly)
                // OR the one that is currently dominant.
                
                // Let's filter for intersecting entries
                const visible = entries.filter(e => e.isIntersecting);
                
                if (visible.length > 0) {
                    // If multiple are visible, which one dictates the theme?
                    // The one on the right is the "New" one coming in.
                    // The one on the left is the "Old" one leaving.
                    // Let's pick the one that just entered (last one in DOM usually? No)
                    // Let's pick the one with highest intersectionRatio?
                    // Or simply: if ANY scheduled item is visible, go Scheduled (High Alert)?
                    // But user wants distinction.
                    
                    // Logic: If the "Leading" (left-most) item is leaving, we might be looking at the next one.
                    // Simple logic: Use the last visible item (the one entering/most recently entered).
                    // Because that's what catches the eye as "New info".
                    
                    // Sort by DOM order?
                    // Actually, let's just use the first intersecting one for now, or prioritize Scheduled.
                    
                    // Better UX: If a scheduled message is on screen, show Urgent Icon.
                    const hasScheduled = visible.some(e => e.target.dataset.scheduled === 'true');
                    applyBroadcastTheme(hasScheduled);
                }
            }, {
                root: container,
                threshold: 0.1 // Trigger as soon as 10% is visible
            });
            
            items.forEach(i => State.tickerObserver.observe(i));
        }


        function renderBroadcast() {
            const broadcastEl = document.getElementById('tv-broadcast');
            console.log('[TICKER DEBUG] renderBroadcast called, broadcastEl:', !!broadcastEl);
            
            const notes = State.appData.broadcast_notes || [];
            console.log('[TICKER DEBUG] broadcast_notes:', notes.length, notes);
            let combinedHTML = '';
            let isContainerScheduled = false; // Initial state
            let plainText = '';

            if (notes.length > 0) {
                const now = dayjs();
                const todayStr = now.format('YYYY-MM-DD');
                console.log('[TICKER DEBUG] todayStr:', todayStr);

                const activeNotes = notes.filter(n => {
                    if (!n.time) {
                        if (n.date && n.date !== todayStr) return false;
                        return true;
                    }
                    if (n.date && n.date !== todayStr) return false;
                    const startTime = dayjs(todayStr + 'T' + n.time);
                    let endTime;
                    if (n.end_time) endTime = dayjs(todayStr + 'T' + n.end_time);
                    else endTime = startTime.add(1, 'hour');
                    return now.isAfter(startTime) && now.isBefore(endTime);
                });
                console.log('[TICKER DEBUG] activeNotes after filter:', activeNotes.length, activeNotes);

                if (activeNotes.length > 0) {
                    // Determine initial theme based on first item
                    isContainerScheduled = !!activeNotes[0].time;
                    
                    const separator = '<span class="mx-8 text-slate-500/50 text-sm flex items-center"><i class="fas fa-circle text-[6px]"></i></span>';
                    
                    combinedHTML = activeNotes.map(n => {
                        const isSched = !!n.time;
                        const colorClass = isSched ? 'text-amber-100' : 'text-emerald-100';
                        const iconClass = isSched ? 'fa-clock' : 'fa-bullhorn';
                        const shadowStyle = isSched ? 'text-shadow: 0 0 15px rgba(251, 191, 36, 0.6);' : 'text-shadow: 0 0 15px rgba(52, 211, 153, 0.6);';
                        
                        // Wrap in .broadcast-item for Observer
                        return \`<span class="broadcast-item inline-flex items-center" data-scheduled="\${isSched}">
                                    <span class="\${colorClass} inline-flex items-center" style="\${shadowStyle}">
                                        <i class="fas \${iconClass} mr-2 opacity-80"></i>\${n.text}
                                    </span>
                                </span>\`;
                    }).join(separator);
                    
                    plainText = activeNotes.map(n => n.text).join(' ');
                }
            }

            if (!combinedHTML) {
                 const msg = State.appData.message || State.appData.broadcast_message;
                 if (msg) {
                     combinedHTML = \`<span class="broadcast-item inline-flex items-center" data-scheduled="false">
                                        <span class="text-emerald-100 inline-flex items-center" style="text-shadow: 0 0 15px rgba(52, 211, 153, 0.6);">
                                            <i class="fas fa-bullhorn mr-2 opacity-80"></i>\${msg}
                                        </span>
                                     </span>\`;
                     plainText = msg;
                 } else if (State.appData.tickets) {
                     const note = State.appData.tickets.find(t => t.type === 'note' && t.is_dashboard);
                     if (note) {
                         const txt = note.title || note.description;
                         combinedHTML = \`<span class="broadcast-item inline-flex items-center" data-scheduled="false">
                                            <span class="text-emerald-100 inline-flex items-center" style="text-shadow: 0 0 15px rgba(52, 211, 153, 0.6);">
                                                <i class="fas fa-bullhorn mr-2 opacity-80"></i>\${txt}
                                            </span>
                                         </span>\`;
                         plainText = txt;
                     }
                 }
            }

            if (combinedHTML) {
                const signature = plainText + '|' + isContainerScheduled;
                if (broadcastEl.dataset.signature === signature) return;
                broadcastEl.dataset.signature = signature;

                // Initial Theme (will be updated by Observer)
                const theme = isContainerScheduled ? {
                    border: 'border-amber-500/50',
                    shadow: 'shadow-[0_0_20px_rgba(245,158,11,0.4)]',
                    glow: 'from-amber-500/20 via-orange-500/10',
                    iconBg: 'from-amber-600 to-orange-500',
                    iconShadow: 'shadow-[0_0_15px_rgba(245,158,11,0.6)]',
                    iconClass: 'fa-clock'
                } : {
                    border: 'border-emerald-500/50',
                    shadow: 'shadow-[0_0_20px_rgba(16,185,129,0.4)]',
                    glow: 'from-emerald-500/20 via-green-500/10',
                    iconBg: 'from-emerald-600 to-green-500',
                    iconShadow: 'shadow-[0_0_15px_rgba(16,185,129,0.6)]',
                    iconClass: 'fa-bullhorn'
                };

                const duration = Math.max(20, 10 + (plainText.length * 0.15));

                broadcastEl.className = \`hidden relative flex items-center gap-2 lg:gap-4 pl-2 pr-4 lg:pr-6 py-1.5 lg:py-2 rounded-full bg-slate-900/90 backdrop-blur-xl transition-all duration-500 w-full max-w-full group overflow-hidden \${theme.border} \${theme.shadow}\`;
                
                // Add IDs for dynamic updates
                broadcastEl.innerHTML = \`
                    <div id="broadcast-glow" class="absolute inset-0 bg-gradient-to-r \${theme.glow} to-transparent opacity-100 transition-all duration-500"></div>
                    <div id="broadcast-icon-container" class="relative h-10 w-10 rounded-full bg-gradient-to-br \${theme.iconBg} flex items-center justify-center \${theme.iconShadow} flex-shrink-0 border border-white/20 z-10 transition-all duration-500">
                        <i id="broadcast-icon" class="fas \${theme.iconClass} text-white text-sm drop-shadow-md"></i>
                    </div>
                    <div class="flex-1 overflow-hidden relative h-8 flex items-center mask-linear z-10 w-full">
                        <span class="news-ticker-text text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl font-bold tracking-wide leading-tight font-sans drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)] pb-0.5" style="--ticker-duration: \${duration}s;">
                           \${combinedHTML}
                        </span>
                    </div>
                \`;

                broadcastEl.classList.remove('hidden');
                console.log('[TICKER DEBUG] Ticker shown! combinedHTML length:', combinedHTML.length);
                
                // Init Observer
                setTimeout(setupTickerObserver, 100);
            } else {
                broadcastEl.classList.add('hidden');
                broadcastEl.dataset.signature = '';
                console.log('[TICKER DEBUG] Ticker hidden - no combinedHTML');
            }
        }

        // Space before next function
        
        function createItemElement(item, isToday = false) {
            const el = document.createElement('div');
            el.setAttribute('tabindex', '0');
            
            const baseClasses = 'relative outline-none transition-all duration-300 focus:ring-4 focus:ring-blue-500 focus:scale-[1.02] cursor-pointer';
            
            if (item.type === 'ticket') {
                const t = item.data;
                const isCritical = t.priority === 'critical';
                const isInProgress = t.status === 'in_progress';
                
                // Make ticket card clickable - opens ticket in main app
                const ticketUrl = '/?ticket=' + t.id;
                el.setAttribute('data-ticket-url', ticketUrl);
                el.setAttribute('data-ticket-id', t.ticket_id);
                el.setAttribute('role', 'link');
                el.setAttribute('aria-label', 'Ouvrir le ticket ' + t.ticket_id);
                el.onclick = function(e) {
                    // Open in new tab (Ctrl/Cmd+Click) or same tab
                    if (e.ctrlKey || e.metaKey) {
                        window.open(ticketUrl, '_blank');
                    } else {
                        window.location.href = ticketUrl;
                    }
                };
                el.onkeydown = function(e) {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        window.location.href = ticketUrl;
                    }
                };
                
                let statusClasses = '';
                if (isCritical) statusClasses = 'glass-panel-urgent';
                else if (isInProgress) statusClasses = 'glass-panel-active';

                // Helper: Generate avatar HTML (photo or initials)
                // URL pattern: /api/auth/avatar/{userId}?v={avatarKey}
                function getAvatarHtml(userId, avatarKey, initial, name, colorClass, size) {
                    size = size || 'w-10 h-10 xl:w-14 xl:h-14';
                    const bgClass = colorClass.replace('border-', 'bg-').replace('/50', '');
                    if (userId && avatarKey) {
                        return '<img src="/api/auth/avatar/' + userId + '?v=' + avatarKey + '" alt="' + name + '" class="' + size + ' rounded-full object-cover border-2 ' + colorClass + '" onerror="this.style.display=\\'none\\';this.nextElementSibling.style.display=\\'flex\\';"><div class="' + size + ' rounded-full ' + bgClass + ' hidden items-center justify-center text-white font-bold text-base xl:text-xl">' + initial + '</div>';
                    }
                    return '<div class="' + size + ' rounded-full ' + bgClass + ' flex items-center justify-center text-white font-bold text-base xl:text-xl">' + initial + '</div>';
                }

                // Different styling for Today vs Timeline
                if (isToday) {
                    // TODAY: Professional card layout with avatars
                    el.className = \`\${baseClasses} glass-panel \${statusClasses} rounded-xl p-4 xl:p-6 mb-3 xl:mb-4 interactive-card\`;
                    el.innerHTML = \`
                        <!-- Header: ID + Status badges + Link icon -->
                        <div class="flex items-center justify-between mb-3">
                            <div class="flex items-center gap-2 xl:gap-3">
                                <span class="text-lg xl:text-2xl">\${isCritical ? '🔴' : (isInProgress ? '⚡' : '🎫')}</span>
                                <span class="font-mono text-slate-400 text-sm xl:text-xl font-semibold">#\${t.ticket_id}</span>
                                \${isInProgress ? '<span class="status-pill bg-green-500 text-black text-xs xl:text-sm px-2 xl:px-3 py-0.5 xl:py-1 font-bold">EN COURS</span>' : ''}
                                \${isCritical ? '<span class="status-pill bg-red-600 text-white text-xs xl:text-sm px-2 xl:px-3 py-0.5 xl:py-1 font-bold">CRITIQUE</span>' : ''}
                            </div>
                            <div class="text-slate-500 hover:text-blue-400 transition-colors ticket-link-icon" title="Cliquer pour ouvrir le ticket">
                                <i class="fas fa-external-link-alt text-sm xl:text-lg"></i>
                            </div>
                        </div>
                        
                        <!-- Title -->
                        <h3 class="text-xl xl:text-3xl font-bold text-white mb-3 leading-tight line-clamp-2 ticket-title">\${t.title}</h3>
                        
                        <!-- Machine -->
                        <div class="flex items-center gap-2 text-blue-300 text-sm xl:text-lg font-mono mb-4 ticket-machine">
                            <i class="fas fa-industry"></i>
                            \${t.machine_name}
                        </div>
                        
                        <!-- People: Two columns with avatars (responsive wrap) -->
                        <div class="flex flex-wrap gap-2 xl:gap-4 mt-auto pt-3 border-t border-slate-700/50">
                            <!-- Signalé par (Creator) -->
                            <div class="flex-1 min-w-[140px] bg-slate-800/80 rounded-lg p-2 xl:p-3 person-card">
                                <div class="text-slate-300 text-xs xl:text-sm uppercase tracking-wider font-semibold mb-2 person-label">
                                    Signalé par
                                </div>
                                <div class="flex items-center gap-2 xl:gap-3 min-w-0">
                                    \${getAvatarHtml(t.reporter_id, t.reporter_avatar, t.reporter_initial || '?', t.reporter_name || 'Inconnu', 'border-blue-500/50')}
                                    <div class="text-white text-sm xl:text-xl font-bold truncate person-name min-w-0 flex-1">\${t.reporter_name || 'Inconnu'}</div>
                                </div>
                            </div>
                            
                            <!-- Intervenant (Assignee) -->
                            <div class="flex-1 min-w-[140px] bg-slate-800/80 rounded-lg p-2 xl:p-3 \${t.assignee_name ? 'border border-green-500/40' : 'border border-slate-700/50'} person-card">
                                <div class="text-slate-300 text-xs xl:text-sm uppercase tracking-wider font-semibold mb-2 person-label">
                                    Intervenant
                                </div>
                                <div class="flex items-center gap-2 xl:gap-3 min-w-0">
                                    \${t.assignee_name 
                                        ? getAvatarHtml(t.assignee_id, t.assignee_avatar, t.assignee_initial || '?', t.assignee_name, 'border-green-500/50')
                                        : '<div class="w-10 h-10 xl:w-14 xl:h-14 rounded-full bg-slate-700 flex items-center justify-center text-slate-500 flex-shrink-0"><i class="fas fa-user-clock text-lg xl:text-2xl"></i></div>'
                                    }
                                    <div class="\${t.assignee_name ? 'text-green-400' : 'text-slate-500 italic'} text-sm xl:text-xl font-bold truncate person-name min-w-0 flex-1">
                                        \${t.assignee_name || 'Non assigné'}
                                    </div>
                                </div>
                            </div>
                        </div>
                    \`;
                } else {
                    // TIMELINE: Compact with mini avatars
                    function getMiniAvatar(userId, avatarKey, initial, name, borderColor) {
                        if (userId && avatarKey) {
                            return '<img src="/api/auth/avatar/' + userId + '?v=' + avatarKey + '" alt="' + name + '" class="w-6 h-6 rounded-full object-cover border ' + borderColor + '" onerror="this.outerHTML=\\'<div class=\\\\\\\'w-6 h-6 rounded-full bg-slate-600 flex items-center justify-center text-white text-xs font-bold\\\\\\\'>' + initial + '</div>\\'">';
                        }
                        return '<div class="w-6 h-6 rounded-full bg-slate-600 flex items-center justify-center text-white text-xs font-bold">' + initial + '</div>';
                    }
                    
                    el.className = 'ml-4 lg:ml-8 mb-2 lg:mb-4 bg-slate-800/50 rounded-lg p-2 lg:p-4 border border-slate-700 relative outline-none cursor-pointer interactive-card';
                    el.innerHTML = \`
                        <div class="flex flex-wrap justify-between items-start gap-y-1 mb-1">
                            <div class="font-bold text-white text-base lg:text-xl leading-snug line-clamp-1 ticket-title flex-1">\${t.title}</div>
                            <div class="flex items-center gap-2">
                                \${isCritical ? '<i class="fas fa-exclamation-triangle text-red-500 text-sm lg:text-base"></i>' : ''}
                                <i class="fas fa-external-link-alt text-slate-600 text-xs ticket-link-icon" title="Ouvrir le ticket"></i>
                            </div>
                        </div>
                        <div class="flex flex-wrap items-center justify-between gap-2 text-xs lg:text-sm">
                            <div class="flex items-center gap-2 text-slate-400 ticket-machine">
                                <i class="fas fa-industry text-blue-400"></i>
                                <span class="truncate max-w-[120px] lg:max-w-[200px]">\${t.machine_name}</span>
                            </div>
                            <div class="flex items-center gap-2">
                                <!-- Reporter mini avatar -->
                                <div class="flex items-center gap-1" title="Signalé par \${t.reporter_name || '?'}">
                                    \${getMiniAvatar(t.reporter_id, t.reporter_avatar, t.reporter_initial || '?', t.reporter_name || '?', 'border-blue-500/50')}
                                    <span class="text-slate-400 person-name">\${t.reporter_name || '?'}</span>
                                </div>
                                <!-- Assignee mini avatar -->
                                \${t.assignee_name 
                                    ? \`<div class="flex items-center gap-1" title="Intervenant: \${t.assignee_name}">
                                        <span class="text-slate-600">→</span>
                                        \${getMiniAvatar(t.assignee_id, t.assignee_avatar, t.assignee_initial || '?', t.assignee_name, 'border-green-500/50')}
                                        <span class="text-green-400 person-name">\${t.assignee_name}</span>
                                      </div>\`
                                    : '<span class="text-slate-600 italic text-xs">Non assigné</span>'
                                }
                            </div>
                        </div>
                    \`;
                }

            } else {
                const e = item.data;
                if (isToday) {
                    // TODAY EVENT: Reduced icon (h-10), smaller title (text-lg)
                    el.className = \`\${baseClasses} glass-panel rounded-xl p-3 xl:p-6 mb-3 xl:mb-4 border-l-4 xl:border-l-8 border-blue-500 interactive-card\`;
                    if (e.category_color) el.style.borderLeftColor = e.category_color;

                    el.innerHTML = \`
                        <div class="flex items-center gap-3 xl:gap-5">
                            <div class="h-8 w-8 lg:h-10 lg:w-10 xl:h-16 xl:w-16 rounded-full bg-slate-800 flex items-center justify-center text-lg xl:text-3xl flex-shrink-0">
                                <i class="fas \${e.category_icon || 'fa-calendar'} text-slate-200"></i>
                            </div>
                            <div class="w-full min-w-0">
                                <div class="flex flex-wrap justify-between items-start gap-y-1">
                                    <h3 class="text-lg xl:text-3xl font-bold text-white pr-2 xl:pr-4 line-clamp-2 leading-tight whitespace-normal">\${e.title}</h3>
                                    \${e.time ? '<span class="text-xs xl:text-xl font-mono font-bold text-cyan-300 bg-slate-800/80 border border-slate-600 px-2 xl:px-2 xl:px-3 py-0.5 xl:py-1 rounded ml-auto whitespace-nowrap">' + e.time.substring(0, 5) + '</span>' : ''}
                                </div>
                                <p class="text-slate-400 text-xs xl:text-xl line-clamp-2 leading-snug whitespace-normal">\${e.description || e.category_label}</p>
                            </div>
                        </div>
                    \`;
                } else {
                    // TIMELINE EVENT: Very Compact
                    el.className = 'ml-4 lg:ml-8 mb-2 lg:mb-4 bg-slate-800/50 rounded-lg p-2 lg:p-4 border border-slate-700 relative transition-all duration-300 outline-none cursor-pointer interactive-card';
                    el.innerHTML = \`
                        <div class="flex items-center gap-2 lg:gap-4">
                            <div class="h-8 w-8 lg:h-10 lg:w-10 rounded bg-slate-700 flex items-center justify-center flex-shrink-0">
                                <i class="fas \${e.category_icon || 'fa-calendar-day'} text-base lg:text-lg text-slate-300"></i>
                            </div>
                            <div class="flex-1 min-w-0">
                                <div class="flex flex-wrap items-center gap-x-2 lg:gap-x-3 gap-y-1">
                                    \${e.time ? '<span class="font-mono font-bold text-cyan-300 text-sm lg:text-base bg-slate-900 px-1.5 lg:px-2 py-0.5 rounded border border-slate-600 shadow-sm">' + e.time.substring(0, 5) + '</span>' : ''}
                                    <div class="font-bold text-white text-base lg:text-xl leading-none line-clamp-2 whitespace-normal">\${e.title}</div>
                                </div>
                                <div class="text-slate-500 text-sm lg:text-base mt-0.5 lg:mt-1 line-clamp-1 whitespace-normal">\${e.category_label}</div>
                            </div>
                        </div>
                    \`;
                }
            }

            // Attach Interactions
            DetailsManager.attachEvents(el, item);
            
            return el;
        }

        function renderTodayColumn() {
            const container = document.getElementById('today-content');
            container.innerHTML = '';
            
            const todayStr = dayjs().format('YYYY-MM-DD');
            let items = [];

            // Filter & Sort
            State.appData.events.forEach(e => {
                if (e.date.split('T')[0] === todayStr) {
                    items.push({ type: 'event', data: e, sortTime: dayjs(e.date).valueOf() });
                }
            });
            
            State.appData.tickets.forEach(t => {
                const isScheduled = t.scheduled_date && dayjs(t.scheduled_date).format('YYYY-MM-DD') === todayStr;
                const isActive = t.status === 'in_progress';
                if (isScheduled || isActive) {
                    items.push({ type: 'ticket', data: t, sortTime: isActive ? 0 : dayjs(t.scheduled_date).valueOf() });
                }
            });

            items.sort((a, b) => a.sortTime - b.sortTime);

            // Render
            const emptyState = document.getElementById('today-empty');
            if (items.length === 0) {
                emptyState.classList.remove('hidden');
                container.classList.add('hidden');
            } else {
                emptyState.classList.add('hidden');
                container.classList.remove('hidden');
                items.forEach(item => container.appendChild(createItemElement(item, true)));
            }
        }

        function renderUpcomingTimeline() {
            const container = document.getElementById('timeline-content');
            container.innerHTML = '<div class="timeline-line"></div>';
            
            const todayStr = dayjs().format('YYYY-MM-DD');
            const timelineMap = {};

            // Group Items
            const addItem = (date, item) => {
                if (date <= todayStr) return;
                if (!timelineMap[date]) timelineMap[date] = [];
                timelineMap[date].push(item);
            };

            State.appData.events.forEach(e => 
                addItem(e.date.split('T')[0], { type: 'event', data: e }));
                
            State.appData.tickets.forEach(t => {
                if(t.scheduled_date) addItem(dayjs(t.scheduled_date).format('YYYY-MM-DD'), { type: 'ticket', data: t });
            });

            const dates = Object.keys(timelineMap).sort();

            if (dates.length === 0) {
                container.innerHTML += \`
                    <div class="text-center mt-20 opacity-50">
                        <i class="fas fa-calendar-times text-6xl mb-4"></i>
                        <p class="text-xl">Rien de prévu prochainement</p>
                    </div>
                \`;
                return;
            }

            dates.forEach(dateStr => {
                const dateObj = dayjs(dateStr);
                const header = document.createElement('div');
                header.className = 'relative z-10 mb-3 lg:mb-6 mt-2 lg:mt-4';
                header.innerHTML = \`
                    <div class="flex items-center gap-2 lg:gap-4">
                        <div class="bg-slate-900 border-2 border-blue-500 rounded-full h-4 w-4 -ml-[9px]"></div>
                        <span class="text-blue-400 font-mono font-bold text-sm lg:text-sm lg:text-lg uppercase tracking-widest">
                            \${dateObj.format('dddd D MMMM')}
                        </span>
                    </div>
                \`;
                container.appendChild(header);

                timelineMap[dateStr].forEach(item => {
                    container.appendChild(createItemElement(item, false));
                });
            });
        }

        // ==========================================
        // AUTO SCROLL & UTILS
        // ==========================================

        function startTimelineAutoScroll() {
            // Legacy function kept for structure, but auto-scroll is now fully handled 
            // by PresentationManager which cycles through items and scrolls them into view.
            // This prevents conflict between linear scrolling and focus-based scrolling.
        }

        function toggleFullscreen() {
            if (!document.fullscreenElement) {
                document.documentElement.requestFullscreen().catch(() => {});
            } else if (document.exitFullscreen) {
                document.exitFullscreen();
            }
        }

        function setupFullscreen() {
            const enable = () => {
                if (!document.fullscreenElement) toggleFullscreen();
                ['click', 'touchstart', 'keydown'].forEach(e => document.removeEventListener(e, enable));
            };
            ['click', 'touchstart', 'keydown'].forEach(e => document.addEventListener(e, enable));
        }

        function setupInitialFocus() {
            setTimeout(() => {
                const first = document.querySelector('[tabindex="0"]');
                if (first) first.focus();
            }, 1000);
        }

        // ==========================================
        // BOOTSTRAP
        // ==========================================
        window.addEventListener('DOMContentLoaded', init);

    </script>
</body>
</html>
`;
