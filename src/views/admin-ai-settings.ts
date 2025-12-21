
// Route de configuration des paramètres IA (Admin)

export const adminAiSettingsHTML = `<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Cerveau de l'IA - Configuration</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
    <style>
        .setting-card { transition: all 0.2s; }
        .setting-card:focus-within { transform: scale(1.01); box-shadow: 0 10px 30px rgba(59, 130, 246, 0.1); border-color: #3b82f6; }
        textarea { resize: vertical; min-height: 120px; font-family: 'Menlo', 'Monaco', 'Courier New', monospace; font-size: 0.85rem; }
    </style>
</head>
<body class="bg-gray-50 font-sans text-gray-800">

    <!-- Header -->
    <header class="bg-gradient-to-r from-purple-700 to-indigo-800 text-white shadow-xl sticky top-0 z-50">
        <div class="container mx-auto px-4 py-4 flex justify-between items-center">
            <div class="flex items-center gap-4">
                <div class="bg-white/10 p-2 rounded-lg">
                    <i class="fas fa-brain text-2xl animate-pulse"></i>
                </div>
                <div>
                    <h1 class="text-xl font-bold tracking-tight">Cerveau de l'IA</h1>
                    <p class="text-xs text-purple-200 uppercase tracking-widest font-semibold">Configuration cognitive & Identité</p>
                </div>
            </div>
            <div class="flex items-center gap-3">
                <a href="/" class="bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg text-sm font-medium transition-all inline-flex items-center">
                    <i class="fas fa-arrow-left mr-2"></i>Retour
                </a>
                <button onclick="saveAllSettings()" id="saveBtn" class="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-lg text-sm font-bold shadow-lg shadow-green-500/30 transition-all flex items-center">
                    <i class="fas fa-save mr-2"></i>SAUVEGARDER
                </button>
            </div>
        </div>
    </header>

    <main class="container mx-auto px-4 py-8 max-w-5xl">
        
        <!-- Intro -->
        <div class="bg-blue-50 border-l-4 border-blue-500 p-4 mb-8 rounded-r-lg shadow-sm">
            <div class="flex items-start">
                <i class="fas fa-info-circle text-blue-500 mt-1 mr-3 text-xl"></i>
                <div>
                    <h3 class="font-bold text-blue-800">Configuration SaaS Universelle</h3>
                    <p class="text-sm text-blue-700 mt-1">
                        C'est ici que vous définissez la personnalité et les connaissances de votre IA. 
                        Modifiez ces textes pour adapter l'IA à n'importe quelle industrie (Boulangerie, Garage, Usine, etc.) sans toucher au code.
                    </p>
                </div>
            </div>
        </div>

        <div id="loading" class="text-center py-20">
            <i class="fas fa-circle-notch fa-spin text-5xl text-purple-200"></i>
            <p class="mt-4 text-gray-400 font-medium">Chargement des synapses...</p>
        </div>

        <form id="settingsForm" class="space-y-8 hidden">
            
            <!-- SECTION 1: IDENTITÉ -->
            <section>
                <div class="flex items-center gap-2 mb-4">
                    <span class="bg-purple-100 text-purple-700 w-8 h-8 flex items-center justify-center rounded-full font-bold text-sm">1</span>
                    <h2 class="text-xl font-bold text-gray-800">Identité & Structure</h2>
                </div>
                
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div class="bg-white p-5 rounded-xl border border-gray-200 shadow-sm setting-card">
                        <label class="block text-sm font-bold text-gray-700 mb-2 flex justify-between">
                            <span><i class="fas fa-id-card mr-2 text-purple-500"></i>Carte d'Identité</span>
                            <span class="text-xs text-gray-400 font-normal">Nom, Adresse, Contact</span>
                        </label>
                        <textarea id="ai_identity_block" class="w-full bg-slate-50 border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"></textarea>
                    </div>

                    <div class="bg-white p-5 rounded-xl border border-gray-200 shadow-sm setting-card">
                        <label class="block text-sm font-bold text-gray-700 mb-2 flex justify-between">
                            <span><i class="fas fa-sitemap mr-2 text-purple-500"></i>Hiérarchie & Autorité</span>
                            <span class="text-xs text-gray-400 font-normal">Qui sont les "Boss" fictifs ?</span>
                        </label>
                        <textarea id="ai_hierarchy_block" class="w-full bg-slate-50 border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"></textarea>
                    </div>
                </div>
            </section>

            <!-- SECTION 2: PSYCHOLOGIE -->
            <section>
                <div class="flex items-center gap-2 mb-4 pt-4 border-t border-gray-100">
                    <span class="bg-indigo-100 text-indigo-700 w-8 h-8 flex items-center justify-center rounded-full font-bold text-sm">2</span>
                    <h2 class="text-xl font-bold text-gray-800">Psychologie & Comportement</h2>
                </div>

                <div class="grid grid-cols-1 gap-6">
                    <div class="bg-white p-5 rounded-xl border border-gray-200 shadow-sm setting-card">
                        <label class="block text-sm font-bold text-gray-700 mb-2 flex justify-between">
                            <span><i class="fas fa-theater-masks mr-2 text-indigo-500"></i>Caractère & Personnalité</span>
                            <span class="text-xs text-gray-400 font-normal">Ton, attitude, humour</span>
                        </label>
                        <textarea id="ai_character_block" class="w-full bg-slate-50 border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all h-32"></textarea>
                    </div>

                    <div class="bg-white p-5 rounded-xl border border-gray-200 shadow-sm setting-card">
                        <label class="block text-sm font-bold text-gray-700 mb-2 flex justify-between">
                            <span><i class="fas fa-traffic-light mr-2 text-red-500"></i>Règles & Garde-fous (Guardrails)</span>
                            <span class="text-xs text-gray-400 font-normal">Limites strictes, sécurité, interdits</span>
                        </label>
                        <textarea id="ai_rules_block" class="w-full bg-red-50 border-red-100 rounded-lg p-3 focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all h-40 text-gray-700"></textarea>
                    </div>
                </div>
            </section>

            <!-- SECTION 3: SAVOIR -->
            <section>
                <div class="flex items-center gap-2 mb-4 pt-4 border-t border-gray-100">
                    <span class="bg-green-100 text-green-700 w-8 h-8 flex items-center justify-center rounded-full font-bold text-sm">3</span>
                    <h2 class="text-xl font-bold text-gray-800">Base de Connaissances (Le "Manuel")</h2>
                </div>

                <div class="bg-white p-1 rounded-xl border border-gray-200 shadow-lg setting-card">
                    <div class="bg-gray-800 text-gray-300 p-2 rounded-t-lg text-xs font-mono flex justify-between items-center px-4">
                        <span>KNOWLEDGE_BASE.md</span>
                        <span class="opacity-50">Markdown Supported</span>
                    </div>
                    <textarea id="ai_knowledge_block" class="w-full bg-white border-0 rounded-b-lg p-4 focus:ring-0 text-gray-800 h-[500px] leading-relaxed"></textarea>
                </div>
            </section>

            <!-- SECTION 4: CONTEXTE USINE -->
             <section>
                <div class="flex items-center gap-2 mb-4 pt-4 border-t border-gray-100">
                    <span class="bg-orange-100 text-orange-700 w-8 h-8 flex items-center justify-center rounded-full font-bold text-sm">4</span>
                    <h2 class="text-xl font-bold text-gray-800">Contexte Opérationnel</h2>
                </div>

                <div class="bg-white p-5 rounded-xl border border-gray-200 shadow-sm setting-card">
                    <label class="block text-sm font-bold text-gray-700 mb-2 flex justify-between">
                        <span><i class="fas fa-industry mr-2 text-orange-500"></i>Réalité Terrain</span>
                        <span class="text-xs text-gray-400 font-normal">Qu'est-ce qu'on fabrique ici ?</span>
                    </label>
                    <textarea id="ai_custom_context" class="w-full bg-slate-50 border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all h-32"></textarea>
                </div>
            </section>

            <!-- SECTION 5: PROMPTS TECHNIQUES -->
            <section>
                <div class="flex items-center gap-2 mb-4 pt-4 border-t border-gray-100">
                    <span class="bg-cyan-100 text-cyan-700 w-8 h-8 flex items-center justify-center rounded-full font-bold text-sm">5</span>
                    <h2 class="text-xl font-bold text-gray-800">Prompts Techniques (Création Vocale & Analyse)</h2>
                </div>

                <div class="grid grid-cols-1 gap-6">
                    <div class="bg-white p-5 rounded-xl border border-gray-200 shadow-sm setting-card">
                        <label class="block text-sm font-bold text-gray-700 mb-2 flex justify-between">
                            <span><i class="fas fa-microphone mr-2 text-cyan-500"></i>Contexte Whisper (Transcription Audio)</span>
                            <span class="text-xs text-gray-400 font-normal">Aide à la reconnaissance vocale</span>
                        </label>
                        <textarea id="ai_whisper_context" class="w-full bg-slate-50 border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all h-20"></textarea>
                        <p class="text-xs text-gray-400 mt-1">Ex: "Contexte: maintenance industrielle. Langues: Français québécois et anglais."</p>
                    </div>

                    <div class="bg-white p-5 rounded-xl border border-gray-200 shadow-sm setting-card">
                        <label class="block text-sm font-bold text-gray-700 mb-2 flex justify-between">
                            <span><i class="fas fa-waveform mr-2 text-cyan-500"></i>Extraction Vocale → JSON</span>
                            <span class="text-xs text-gray-400 font-normal">Convertit la voix en ticket structuré</span>
                        </label>
                        <textarea id="ai_voice_extraction_prompt" class="w-full bg-slate-50 border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all h-48"></textarea>
                        <p class="text-xs text-gray-400 mt-1">⚠️ CRITIQUE : Ce prompt définit comment la création vocale de tickets fonctionne. Doit retourner du JSON valide.</p>
                    </div>
                </div>
            </section>

            <!-- SECTION 6: PROMPTS ANALYSE -->
            <section>
                <div class="flex items-center gap-2 mb-4 pt-4 border-t border-gray-100">
                    <span class="bg-pink-100 text-pink-700 w-8 h-8 flex items-center justify-center rounded-full font-bold text-sm">6</span>
                    <h2 class="text-xl font-bold text-gray-800">Prompts d'Analyse</h2>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div class="bg-white p-5 rounded-xl border border-gray-200 shadow-sm setting-card">
                        <label class="block text-sm font-bold text-gray-700 mb-2 flex justify-between">
                            <span><i class="fas fa-ticket mr-2 text-pink-500"></i>Analyse de Ticket</span>
                            <span class="text-xs text-gray-400 font-normal">Suggestion priorité/actions</span>
                        </label>
                        <textarea id="ai_ticket_analysis_prompt" class="w-full bg-slate-50 border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all h-24"></textarea>
                    </div>

                    <div class="bg-white p-5 rounded-xl border border-gray-200 shadow-sm setting-card">
                        <label class="block text-sm font-bold text-gray-700 mb-2 flex justify-between">
                            <span><i class="fas fa-image mr-2 text-pink-500"></i>Analyse d'Image</span>
                            <span class="text-xs text-gray-400 font-normal">Vision IA sur photos</span>
                        </label>
                        <textarea id="ai_image_analysis_prompt" class="w-full bg-slate-50 border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all h-24"></textarea>
                    </div>

                    <div class="bg-white p-5 rounded-xl border border-gray-200 shadow-sm setting-card md:col-span-2">
                        <label class="block text-sm font-bold text-gray-700 mb-2 flex justify-between">
                            <span><i class="fas fa-file-alt mr-2 text-pink-500"></i>Résumé</span>
                            <span class="text-xs text-gray-400 font-normal">Pour générer des synthèses</span>
                        </label>
                        <textarea id="ai_summary_prompt" class="w-full bg-slate-50 border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all h-20"></textarea>
                    </div>
                </div>
            </section>

            <!-- SECTION 7: IDENTITÉ ASSISTANT -->
            <section>
                <div class="flex items-center gap-2 mb-4 pt-4 border-t border-gray-100">
                    <span class="bg-violet-100 text-violet-700 w-8 h-8 flex items-center justify-center rounded-full font-bold text-sm">7</span>
                    <h2 class="text-xl font-bold text-gray-800">Identité de l'Assistant</h2>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div class="bg-white p-5 rounded-xl border border-gray-200 shadow-sm setting-card">
                        <label class="block text-sm font-bold text-gray-700 mb-2 flex justify-between">
                            <span><i class="fas fa-robot mr-2 text-violet-500"></i>Nom de l'Assistant</span>
                        </label>
                        <input type="text" id="ai_expert_name" class="w-full bg-slate-50 border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all" placeholder="Ex: L'Assistant IGP">
                    </div>

                    <div class="bg-white p-5 rounded-xl border border-gray-200 shadow-sm setting-card">
                        <label class="block text-sm font-bold text-gray-700 mb-2 flex justify-between">
                            <span><i class="fas fa-user-circle mr-2 text-violet-500"></i>Clé Avatar (R2)</span>
                        </label>
                        <input type="text" id="ai_expert_avatar_key" class="w-full bg-slate-50 border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all" placeholder="avatars/ai-avatar-xxx.jpeg" readonly>
                        <p class="text-xs text-gray-400 mt-1">Modifiable via IGP Connect → Info groupe</p>
                    </div>
                </div>
            </section>

        </form>

    </main>

    <script>
        const API_URL = '/api/settings';
        const KEYS = [
            // Section 1-4: Identité & Comportement
            'ai_identity_block', 
            'ai_hierarchy_block', 
            'ai_character_block', 
            'ai_knowledge_block', 
            'ai_rules_block', 
            'ai_custom_context',
            // Section 5: Prompts Techniques
            'ai_whisper_context',
            'ai_voice_extraction_prompt',
            // Section 6: Prompts Analyse
            'ai_ticket_analysis_prompt',
            'ai_image_analysis_prompt',
            'ai_summary_prompt',
            // Section 7: Identité Assistant
            'ai_expert_name',
            'ai_expert_avatar_key'
        ];

        // Auth Check
        const token = localStorage.getItem('auth_token');
        if (!token) window.location.href = '/';

        async function loadSettings() {
            try {
                // Parallel fetching for speed
                const promises = KEYS.map(key => 
                    fetch(API_URL + '/' + key, {
                        headers: { 'Authorization': 'Bearer ' + token }
                    }).then(res => res.json())
                );

                const results = await Promise.all(promises);

                results.forEach((data, index) => {
                    const key = KEYS[index];
                    const el = document.getElementById(key);
                    if (el) {
                        el.value = data.setting_value || "";
                    }
                });

                document.getElementById('loading').classList.add('hidden');
                document.getElementById('settingsForm').classList.remove('hidden');

            } catch (err) {
                alert("Erreur de chargement: " + err.message);
            }
        }

        async function saveAllSettings() {
            const btn = document.getElementById('saveBtn');
            const originalContent = btn.innerHTML;
            btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>SAUVEGARDE...';
            btn.disabled = true;

            try {
                // Sequential saving to ensure order and reliability
                for (const key of KEYS) {
                    const el = document.getElementById(key);
                    if (!el) continue;

                    await fetch(API_URL + '/' + key, {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': 'Bearer ' + token
                        },
                        body: JSON.stringify({ value: el.value })
                    });
                }

                // Success Feedback
                btn.innerHTML = '<i class="fas fa-check mr-2"></i>SUCCÈS !';
                btn.classList.remove('bg-green-500');
                btn.classList.add('bg-blue-600');
                
                setTimeout(() => {
                    btn.innerHTML = originalContent;
                    btn.classList.add('bg-green-500');
                    btn.classList.remove('bg-blue-600');
                    btn.disabled = false;
                }, 2000);

            } catch (err) {
                alert("Erreur de sauvegarde: " + err.message);
                btn.innerHTML = '<i class="fas fa-exclamation-triangle mr-2"></i>ERREUR';
                btn.disabled = false;
            }
        }

        // Init
        loadSettings();

    </script>

    <!-- Footer avec stats -->
    <footer class="bg-gray-100 border-t border-gray-200 mt-12 py-6">
        <div class="container mx-auto px-4 max-w-5xl">
            <div class="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-gray-500">
                <div class="flex items-center gap-2">
                    <i class="fas fa-database text-gray-400"></i>
                    <span>13 paramètres IA configurables</span>
                </div>
                <div class="flex items-center gap-2">
                    <i class="fas fa-shield-alt text-green-500"></i>
                    <span>Modifications sauvegardées en temps réel dans la base de données</span>
                </div>
                <div class="text-xs text-gray-400">
                    Phase 3.2 - Architecture Zero Hardcode
                </div>
            </div>
        </div>
    </footer>
</body>
</html>`;
