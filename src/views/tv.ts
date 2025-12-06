
export const tvHTML = `
<!DOCTYPE html>
<html lang="fr" class="h-full bg-slate-950 text-white overflow-hidden">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>IGP Vision - Planning Live</title>
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
            border: 1px solid rgba(239, 68, 68, 0.4);
            box-shadow: 0 0 20px rgba(220, 38, 38, 0.2);
            animation: pulse-border 4s infinite;
        }

        .glass-panel-active {
            background: rgba(20, 83, 45, 0.2);
            border: 1px solid rgba(34, 197, 94, 0.3);
        }

        @keyframes pulse-border {
            0% { border-color: rgba(239, 68, 68, 0.4); }
            50% { border-color: rgba(239, 68, 68, 0.8); }
            100% { border-color: rgba(239, 68, 68, 0.4); }
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
        
        /* Common Transition */
        [tabindex="0"] {
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
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
            
            /* Luxurious Glow/Shadow */
            box-shadow: 
                0 0 0 4px rgba(59, 130, 246, 0.3), /* Blue Ring */
                0 20px 50px -12px rgba(37, 99, 235, 0.5) !important; /* Blue Ambient Glow */
            
            transform: scale(1.03) translateX(10px);
            z-index: 50;
        }
        
        /* Reset transform for Today items (they don't need translateX as much, or maybe they do?) 
           Today items are in a col. Let's keep the pop effect but maybe less X shift? 
           Let's keep it consistent for now. */

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

        /* Remove default outline */
        :focus-visible {
            outline: none !important;
        }

        /* Smooth scrolling for D-pad */
        html {
            scroll-behavior: smooth;
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
            transition: bottom 0.4s cubic-bezier(0.16, 1, 0.3, 1);
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
    </style>
</head>
<body class="h-screen flex flex-col">

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
            <div class="animate-spin rounded-full h-32 w-32 border-t-4 border-b-4 border-blue-500 mx-auto mb-8"></div>
            <h2 class="text-4xl font-bold text-blue-400 tracking-wider">IGP VISION</h2>
            <p class="text-slate-500 mt-4 text-xl">Chargement du planning...</p>
        </div>
    </div>

    <!-- HEADER -->
    <header class="h-16 flex-none bg-slate-900/90 border-b border-slate-800 flex items-center justify-between px-6 relative z-10 backdrop-blur-md">
        <div class="flex items-center gap-4 w-1/4 flex-shrink-0">
            <img src="/api/settings/logo?t=tv" onerror="this.onerror=null; this.src='/static/logo-igp.png'" alt="IGP" class="h-10 w-auto transition-all duration-500">
            <div class="h-6 w-px bg-slate-700"></div>
            <div>
                <h1 class="text-lg font-bold text-white tracking-tight leading-none">PLANNING IGP</h1>
                <p class="text-blue-400 text-[10px] font-mono font-bold tracking-widest uppercase leading-none mt-0.5">Dashboard</p>
            </div>
        </div>

        <!-- BROADCAST MESSAGE (Compact) -->
        <div class="flex-1 flex justify-start items-center px-6 z-20 min-w-0 mr-4">
            <div id="tv-broadcast" class="hidden relative flex items-center gap-3 pl-1.5 pr-4 py-1 rounded-full bg-slate-900/80 border border-slate-700/50 backdrop-blur-xl shadow-lg transition-all duration-500 max-w-full group">
                <!-- Icon Bubble -->
                <div class="relative h-8 w-8 rounded-full bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center shadow-blue-900/50 flex-shrink-0 border border-white/10">
                    <i class="fas fa-bullhorn text-white text-xs animate-pulse"></i>
                </div>
                
                <!-- Text -->
                <span id="tv-broadcast-text" class="relative text-2xl font-bold text-slate-100 tracking-tight leading-tight font-sans truncate">Message...</span>
            </div>
        </div>

        <div class="flex items-center gap-8 w-1/4 justify-end flex-shrink-0">
            <!-- WEATHER WIDGET (Compact) -->
            <div class="flex items-center gap-3 border-r border-slate-700 pr-6 hidden xl:flex">
                <i id="weather-icon" class="fas fa-cloud-sun text-yellow-400 text-2xl"></i>
                <div class="text-right">
                    <div id="weather-temp" class="text-2xl font-bold text-white leading-none">--°</div>
                </div>
            </div>

            <!-- CLOCK (Compact) -->
            <div class="text-right font-mono leading-none">
                <div id="clock-time" class="text-4xl font-bold text-white tracking-tighter">--:--</div>
                <div id="clock-date" class="text-xs text-blue-300 font-semibold uppercase mt-0.5">---</div>
            </div>
        </div>
    </header>

    <!-- MAIN CONTENT GRID -->
    <main class="flex-1 flex overflow-hidden relative">
        
        <!-- LEFT COLUMN: TODAY (60%) -->
        <section class="w-[60%] flex flex-col border-r border-slate-800 bg-slate-900/50 relative p-6">
            
            <!-- Header Today -->
            <div class="flex items-center gap-3 mb-4 border-b border-slate-800/50 pb-3">
                <div class="bg-blue-600 h-6 w-1 rounded-full shadow-[0_0_15px_rgba(37,99,235,0.5)]"></div>
                <h2 class="text-3xl font-bold text-white tracking-tight uppercase flex items-center gap-3">
                    Aujourd'hui
                </h2>
                <span id="today-date-large" class="text-sm text-blue-400/80 font-mono font-bold uppercase tracking-widest ml-auto">...</span>
            </div>

            <!-- ACTIVE CONTENT SCROLL -->
            <div id="today-content" class="flex-1 overflow-y-auto space-y-3 pr-2 scrolling-container pb-[50vh] focus:outline-none" tabindex="0">
                <!-- Content injected via JS -->
            </div>

            <!-- EMPTY STATE -->
            <div id="today-empty" class="hidden h-full flex flex-col items-center justify-center opacity-30 scale-75">
                <i class="fas fa-check-circle text-7xl mb-4"></i>
                <h3 class="text-2xl font-bold">R.A.S.</h3>
            </div>

        </section>

        <!-- RIGHT COLUMN: TIMELINE (40%) -->
        <section class="w-[40%] bg-slate-950 relative flex flex-col">
            <div class="p-4 border-b border-slate-800 bg-slate-900 z-20 shadow-xl flex justify-between items-center">
                <h2 class="text-xl lg:text-3xl font-bold text-blue-100 flex items-center gap-2 lg:gap-3">
                    <i class="fas fa-history text-blue-500"></i>
                    PLANNING À VENIR
                </h2>
                <button id="btn-fullscreen" class="p-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-blue-400 hover:text-white transition-all duration-300 focus:ring-4 focus:ring-blue-500 outline-none border border-slate-700" onclick="toggleFullscreen()" tabindex="0">
                    <i class="fas fa-expand text-2xl"></i>
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
            BROADCAST_INTERVAL: 10000   // 10s per message in rotation
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
                this.next();
            },

            stop() {
                if (this.timer) clearTimeout(this.timer);
            },

            next() {
                if (State.isPaused) return;

                // Combine both lists for a unified presentation cycle
                const todayItems = Array.from(document.querySelectorAll('#today-content [tabindex="0"]'));
                const timelineItems = Array.from(document.querySelectorAll('#timeline-content [tabindex="0"]'));
                
                // Determine priority: If there are items today, cycle them, then cycle timeline
                const allItems = [...todayItems, ...timelineItems];
                
                if (allItems.length === 0) return;

                // Move to next index
                this.currentIndex = (this.currentIndex + 1) % allItems.length;
                const item = allItems[this.currentIndex];

                // Highlight interaction
                if (item) {
                    // Focus triggers existing listeners (DetailsManager.show)
                    item.focus({ preventScroll: true });
                    
                    // Smooth scroll to center (KEY: prevents hiding behind popup)
                    item.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }

                // Schedule next cycle
                this.timer = setTimeout(() => {
                    this.next();
                }, this.CYCLE_DURATION);
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
                            target.scrollIntoView({ block: 'center', behavior: 'smooth' });
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
                        first.scrollIntoView({ block: 'center', behavior: 'smooth' });
                    }
                    return;
                }

                const items = getItems(currentContainer);
                const currentIndex = items.indexOf(active);

                if (key === 'ArrowUp') {
                    if (currentIndex > 0) {
                        const target = items[currentIndex - 1];
                        target.focus();
                        target.scrollIntoView({ block: 'center', behavior: 'smooth' });
                    } else {
                        // TOP OF LIST -> Go to Header (Fullscreen Button)
                        if (btnFullscreen) btnFullscreen.focus();
                    }
                } else if (key === 'ArrowDown') {
                    if (currentIndex < items.length - 1) {
                        const target = items[currentIndex + 1];
                        target.focus();
                        target.scrollIntoView({ block: 'center', behavior: 'smooth' });
                    }
                } else if (key === 'ArrowRight') {
                    if (currentContainer === todayList) {
                        const targetItems = getItems(timelineList);
                        if (targetItems.length > 0) {
                            // Find closest item by vertical position approximation or just first
                            // For TV stability, first visible is often safest, but let's try top
                            targetItems[0].focus();
                            targetItems[0].scrollIntoView({ block: 'center', behavior: 'smooth' });
                        }
                    }
                } else if (key === 'ArrowLeft') {
                    if (currentContainer === timelineList) {
                        const targetItems = getItems(todayList);
                        if (targetItems.length > 0) {
                            targetItems[0].focus();
                            targetItems[0].scrollIntoView({ block: 'center', behavior: 'smooth' });
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
                    badge: document.getElementById('detail-badge')
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
                if (item.type === 'ticket') {
                    const t = item.data;
                    return t.description && t.description.trim().length > 0;
                } else {
                    const e = item.data;
                    // Use 'details' for events, 'description' is for tickets
                    const hasDetails = e.details && e.details.trim().length > 0;
                    const hasCat = e.category_label && e.category_label.trim().length > 0;
                    return hasDetails || hasCat;
                }
            },

            updateDOM(item) {
                const { desc, meta, badge } = this.elements;
                
                // Reset Badge
                badge.classList.add('hidden');
                badge.className = 'hidden px-2 lg:px-3 py-0.5 lg:py-1 rounded text-xs lg:text-sm font-bold uppercase border'; 

                if (item.type === 'ticket') {
                    const t = item.data;
                    desc.textContent = t.description;
                    meta.textContent = \`TICKET #\${t.ticket_id} • \${t.machine_name} • \${t.assignee_name || 'Non assigné'}\`;
                    
                    // Badge
                    badge.classList.remove('hidden');
                    if (t.status === 'in_progress') {
                        badge.textContent = 'EN COURS';
                        badge.classList.add('bg-green-900', 'text-green-300', 'border-green-700');
                    } else {
                        badge.textContent = 'PLANIFIÉ';
                        badge.classList.add('bg-blue-900', 'text-blue-300', 'border-blue-700');
                    }

                } else {
                    const e = item.data;
                    // Use 'details' property for events
                    desc.textContent = e.details || e.category_label;
                    meta.textContent = \`ÉVÉNEMENT • \${dayjs(e.date).format('D MMMM YYYY')} \${e.time ? '• ' + e.time.substring(0,5) : ''}\`;
                    
                    // Badge
                    if (e.category_label) {
                        badge.classList.remove('hidden');
                        badge.textContent = e.category_label;
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
            },

            hide() {
                this.elements.panel.classList.remove('visible');
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

        async function init() {
            // Auth Check
            if (!TV_KEY) TV_KEY = localStorage.getItem('igp_tv_key');
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
            // Broadcast rotation timer (Priority logic is checked inside renderBroadcast called by clock/update)
            State.timers.broadcast = setInterval(() => {
                State.broadcastIndex++;
                renderBroadcast(); // Re-render to show next message
            }, CONFIG.BROADCAST_INTERVAL);

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
                const res = await axios.get('https://api.open-meteo.com/v1/forecast?latitude=45.5017&longitude=-73.5673&current=temperature_2m,weather_code&timezone=America%2FToronto');
                if (res.data && res.data.current) {
                    const { temperature_2m, weather_code } = res.data.current;
                    const temp = Math.round(temperature_2m);
                    
                    let icon = 'fa-sun', color = 'text-yellow-400';
                    if (weather_code >= 1 && weather_code <= 3) { icon = 'fa-cloud-sun'; color = 'text-gray-300'; }
                    else if (weather_code >= 45 && weather_code <= 48) { icon = 'fa-smog'; color = 'text-slate-400'; }
                    else if (weather_code >= 51 && weather_code <= 67) { icon = 'fa-cloud-rain'; color = 'text-blue-400'; }
                    else if (weather_code >= 71 && weather_code <= 77) { icon = 'fa-snowflake'; color = 'text-white'; }
                    else if (weather_code >= 80 && weather_code <= 82) { icon = 'fa-cloud-showers-heavy'; color = 'text-blue-500'; }
                    else if (weather_code >= 95) { icon = 'fa-bolt'; color = 'text-yellow-500'; }

                    document.getElementById('weather-temp').textContent = \`\${temp}°\`;
                    document.getElementById('weather-icon').className = \`fas \${icon} \${color} text-4xl\`;
                }
            } catch (e) {
                console.error("Weather Error:", e);
            }
        }

        async function loadData() {
            try {
                if (!TV_KEY) {
                    window.location.href = '/tv-login.html';
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
                
                renderDashboard();

            } catch (error) {
                console.error("Load Error:", error);
                if (error.response && error.response.status === 403) {
                    localStorage.removeItem('igp_tv_key');
                    alert("Clé d'accès invalide.");
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

        function renderBroadcast() {
            const broadcastEl = document.getElementById('tv-broadcast');
            const broadcastText = document.getElementById('tv-broadcast-text');
            
            let msg = null;

            // 1. Get all potential notes
            // Prioritize 'broadcast_notes' array from new API, fallback to 'message' legacy
            const notes = State.appData.broadcast_notes || [];
            
            if (notes.length > 0) {
                const now = dayjs();
                const currentTimeStr = now.format('HH:mm');
                const todayStr = now.format('YYYY-MM-DD');

                // 2. Check for PRIORITY OVERRIDE (Time-based)
                // A note is PRIORITY if:
                // - It has a specific TIME defined
                // - AND we are within its window [Time, EndTime] (or [Time, Time+1h] default)
                // - AND it is scheduled for Today (or no date = daily recur)
                const priorityNotes = notes.filter(n => {
                    if (!n.time) return false; // No time = No priority override

                    // Check Date (If defined, must match today. If null, assumes daily/immediate)
                    if (n.date && n.date !== todayStr) return false;

                    const startTime = dayjs(\`\${todayStr}T\${n.time}\`);
                    
                    // Determine End Time
                    let endTime;
                    if (n.end_time) {
                        endTime = dayjs(\`\${todayStr}T\${n.end_time}\`);
                    } else {
                        // Default duration: 1 hour if no end time specified
                        endTime = startTime.add(1, 'hour');
                    }

                    // Check if NOW is within window
                    return now.isAfter(startTime) && now.isBefore(endTime);
                });

                if (priorityNotes.length > 0) {
                    // PRIORITY MODE: Rotate only among priority notes
                    // Using broadcastIndex ensures we rotate if multiple priorities overlap
                    const note = priorityNotes[State.broadcastIndex % priorityNotes.length];
                    msg = note.text;
                } else {
                    // STANDARD MODE: Rotate among ALL notes (or just non-priority ones?)
                    // User requirement: "notes without date/time -> rotate". 
                    // Let's include ALL valid notes in the rotation when no priority is active.
                    const note = notes[State.broadcastIndex % notes.length];
                    msg = note.text;
                }

            } else {
                // Fallback Legacy
                msg = State.appData.message || State.appData.broadcast_message;
                
                // Optional: Look for a note tagged 'dashboard' in tickets if not in root (Fallback)
                if (!msg && State.appData.tickets) {
                    const note = State.appData.tickets.find(t => t.type === 'note' && t.is_dashboard);
                    if (note) msg = note.title || note.description;
                }
            }

            if (msg) {
                broadcastText.textContent = msg;
                broadcastEl.classList.remove('hidden');
            } else {
                broadcastEl.classList.add('hidden');
            }
        }

        function createItemElement(item, isToday = false) {
            const el = document.createElement('div');
            el.setAttribute('tabindex', '0');
            
            const baseClasses = 'relative outline-none transition-all duration-300 focus:ring-4 focus:ring-blue-500 focus:scale-[1.02] cursor-pointer';
            
            if (item.type === 'ticket') {
                const t = item.data;
                const isCritical = t.priority === 'critical';
                const isInProgress = t.status === 'in_progress';
                
                let statusClasses = '';
                if (isCritical) statusClasses = 'glass-panel-urgent';
                else if (isInProgress) statusClasses = 'glass-panel-active';

                // Different styling for Today vs Timeline
                if (isToday) {
                    // TODAY: Reduced padding (p-4), smaller fonts
                    el.className = \`\${baseClasses} glass-panel \${statusClasses} rounded-xl p-3 xl:p-6 mb-3 xl:mb-4 interactive-card\`;
                    el.innerHTML = \`
                        <div class="flex flex-wrap justify-between items-start mb-2 gap-y-1">
                            <div class="flex items-center gap-2 xl:gap-3">
                                <span class="text-lg xl:text-3xl">\${isCritical ? '🔴' : (isInProgress ? '⚡' : '🎫')}</span>
                                <span class="font-mono text-slate-400 text-xs xl:text-xl">#\${t.ticket_id}</span>
                                \${isInProgress ? '<span class="status-pill bg-green-500 text-black text-[10px] xl:text-sm px-2 xl:px-3 py-0.5 xl:py-1 animate-pulse">EN COURS</span>' : ''}
                                \${isCritical ? '<span class="status-pill bg-red-600 text-white text-[10px] xl:text-sm px-2 xl:px-3 py-0.5 xl:py-1 animate-pulse">CRITIQUE</span>' : ''}
                            </div>
                            <div class="text-right">
                                <div class="text-base xl:text-2xl font-bold text-white leading-none">\${t.assignee_name || 'Non assigné'}</div>
                                <div class="text-slate-400 text-[10px] xl:text-sm uppercase tracking-wider">Intervenant</div>
                            </div>
                        </div>
                        <h3 class="text-lg xl:text-3xl font-bold text-white mb-2 leading-tight line-clamp-2 whitespace-normal">\${t.title}</h3>
                        <div class="flex items-center gap-2 text-blue-300 text-xs xl:text-xl font-mono mt-2">
                            <i class="fas fa-industry"></i>
                            \${t.machine_name}
                        </div>
                    \`;
                } else {
                    // TIMELINE: Compact
                    el.className = 'ml-4 lg:ml-8 mb-2 lg:mb-4 bg-slate-800/50 rounded-lg p-2 lg:p-4 border border-slate-700 relative transition-all duration-300 outline-none cursor-pointer interactive-card';
                    el.innerHTML = \`
                        <div class="flex flex-wrap justify-between items-start gap-y-1">
                            <div class="font-bold text-white text-base lg:text-xl leading-snug line-clamp-2 whitespace-normal">\${t.title}</div>
                            \${isCritical ? '<i class="fas fa-exclamation-triangle text-red-500 text-sm lg:text-base"></i>' : ''}
                        </div>
                        <div class="text-slate-400 text-sm lg:text-sm lg:text-base mt-0.5 lg:mt-1 lg:mt-2 flex flex-wrap items-center gap-2">
                            <i class="fas fa-wrench text-xs lg:text-sm"></i>
                            \${t.machine_name}
                            <span class="ml-auto font-mono text-blue-300">\${t.assignee_name || '?'}</span>
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
                if (dayjs(e.date).format('YYYY-MM-DD') === todayStr) {
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
                addItem(dayjs(e.date).format('YYYY-MM-DD'), { type: 'event', data: e }));
                
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
