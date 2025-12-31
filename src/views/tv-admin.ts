export const tvAdminHTML = `
<!DOCTYPE html>
<html lang="fr" class="bg-gray-50">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Administration TV</title>
    <link rel="stylesheet" href="/static/styles.css">
    <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
    <script src="https://cdn.jsdelivr.net/npm/dayjs@1.11.10/dayjs.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
</head>
<body class="text-gray-900">

    <!-- Navigation -->
    <nav class="bg-white shadow-sm border-b border-gray-200">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="flex justify-between h-16">
                <div class="flex">
                    <div class="flex-shrink-0 flex items-center gap-3">
                        <div class="bg-blue-600 rounded-lg p-2">
                            <i class="fas fa-tv text-white"></i>
                        </div>
                        <span class="font-bold text-xl text-gray-800">Admin TV</span>
                    </div>
                    <div class="hidden sm:ml-6 sm:flex sm:space-x-8">
                        <a href="/" class="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                            <i class="fas fa-arrow-left mr-2"></i> Retour App
                        </a>
                        <a href="#" class="border-blue-500 text-gray-900 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                            Messages Diffusion
                        </a>
                    </div>
                </div>
                <div class="flex items-center">
                    <button onclick="openConfigModal()" class="text-gray-500 hover:text-blue-600 p-2 rounded-full hover:bg-gray-100 transition-colors" title="Configuration Écran">
                        <i class="fas fa-cog text-xl"></i>
                    </button>
                </div>
            </div>
        </div>
    </nav>

    <!-- Main Content -->
    <div class="max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
        
        <!-- Header -->
        <div class="md:flex md:items-center md:justify-between mb-8">
            <div class="flex-1 min-w-0">
                <h2 class="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
                    Messages de Diffusion
                </h2>
                <p class="mt-1 text-sm text-gray-500">
                    Gérez les contenus affichés sur les écrans TV de l'usine (Messages, Bienvenue, Photos).
                </p>
            </div>
            <div class="mt-4 flex md:mt-0 md:ml-4">
                <button onclick="openModal()" class="ml-3 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                    <i class="fas fa-plus mr-2"></i> Nouveau Message
                </button>
            </div>
        </div>

        <!-- List -->
        <div class="bg-white shadow overflow-hidden sm:rounded-md">
            <ul id="messages-list" class="divide-y divide-gray-200">
                <!-- Items injected here -->
                <li class="p-12 text-center text-gray-500">
                    <i class="fas fa-circle-notch fa-spin text-3xl mb-4 text-blue-500"></i><br>Chargement...
                </li>
            </ul>
        </div>
    </div>

    <!-- Edit/Create Modal -->
    <div id="modal" class="fixed z-50 inset-0 overflow-y-auto hidden" aria-labelledby="modal-title" role="dialog" aria-modal="true">
        <div class="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" onclick="closeModal()"></div>
            <span class="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            
            <div class="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl w-full">
                <form id="message-form" onsubmit="handleSave(event)">
                    <input type="hidden" id="msg-id">
                    
                    <div class="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                        <div class="sm:flex sm:items-start">
                            <div class="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                                <h3 class="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                                    Nouveau Message
                                </h3>
                                
                                <div class="mt-6 grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                                    
                                    <!-- Type -->
                                    <div class="sm:col-span-3">
                                        <label class="block text-sm font-medium text-gray-700">Type de contenu</label>
                                        <select id="msg-type" onchange="updateFormUI()" class="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md">
                                            <option value="text">Texte Simple (Bandeau)</option>
                                            <option value="image_text">Image + Texte (Bienvenue)</option>
                                            <option value="gallery">Galerie Photos (Événement)</option>
                                        </select>
                                    </div>

                                    <!-- Priority -->
                                    <div class="sm:col-span-3">
                                        <label class="block text-sm font-medium text-gray-700">Priorité</label>
                                        <select id="msg-priority" class="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md">
                                            <option value="0">Normale</option>
                                            <option value="1">Haute</option>
                                            <option value="2">Urgente</option>
                                        </select>
                                    </div>

                                    <!-- Title -->
                                    <div class="sm:col-span-6">
                                        <label class="block text-sm font-medium text-gray-700">Titre (Optionnel)</label>
                                        <input type="text" id="msg-title" class="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md">
                                    </div>

                                    <!-- Content -->
                                    <div class="sm:col-span-6">
                                        <label class="block text-sm font-medium text-gray-700">Message / Description</label>
                                        <textarea id="msg-content" rows="3" class="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"></textarea>
                                    </div>

                                    <!-- Images Upload -->
                                    <div class="sm:col-span-6" id="field-images">
                                        <label class="block text-sm font-medium text-gray-700 mb-2">Images / Photos</label>
                                        
                                        <!-- Drop Zone -->
                                        <div class="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md hover:bg-gray-50 transition-colors cursor-pointer relative" id="drop-zone">
                                            <input type="file" id="file-upload" class="absolute inset-0 w-full h-full opacity-0 cursor-pointer" multiple accept="image/*" onchange="handleFiles(this.files)">
                                            <div class="space-y-1 text-center">
                                                <i class="fas fa-images text-gray-400 text-3xl mb-2"></i>
                                                <div class="flex text-sm text-gray-600 justify-center">
                                                    <span class="font-medium text-blue-600 hover:text-blue-500">Téléverser des fichiers</span>
                                                </div>
                                                <p class="text-xs text-gray-500">PNG, JPG, GIF jusqu'à 10MB</p>
                                            </div>
                                        </div>

                                        <!-- Preview List -->
                                        <div id="images-preview" class="grid grid-cols-3 gap-4 mt-4"></div>
                                    </div>

                                    <!-- Dates -->
                                    <div class="sm:col-span-3">
                                        <label class="block text-sm font-medium text-gray-700">Date début (Optionnel)</label>
                                        <input type="datetime-local" id="msg-start" class="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md">
                                    </div>

                                    <div class="sm:col-span-3">
                                        <label class="block text-sm font-medium text-gray-700">Date fin (Optionnel)</label>
                                        <input type="datetime-local" id="msg-end" class="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md">
                                    </div>

                                    <!-- Duration -->
                                    <div class="sm:col-span-3">
                                        <label class="block text-sm font-medium text-gray-700">Durée affichage (sec)</label>
                                        <input type="number" id="msg-duration" value="15" min="5" max="300" class="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md">
                                    </div>

                                    <!-- Active -->
                                    <div class="sm:col-span-3 flex items-center pt-6">
                                        <input id="msg-active" type="checkbox" checked class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded">
                                        <label for="msg-active" class="ml-2 block text-sm text-gray-900">
                                            Actif immédiatement
                                        </label>
                                    </div>

                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                        <button type="submit" id="btn-save" class="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm">
                            Enregistrer
                        </button>
                        <button type="button" onclick="closeModal()" class="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm">
                            Annuler
                        </button>
                    </div>
                </form>
            </div>
        </div>
    </div>

    <!-- Config Modal -->
    <div id="config-modal" class="fixed z-50 inset-0 overflow-y-auto hidden">
        <div class="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div class="fixed inset-0 bg-gray-500 bg-opacity-75" onclick="closeConfigModal()"></div>
            <div class="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg w-full sm:p-6">
                <div>
                    <div class="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100">
                        <i class="fas fa-link text-blue-600"></i>
                    </div>
                    <div class="mt-3 text-center sm:mt-5">
                        <h3 class="text-lg leading-6 font-medium text-gray-900">Configuration Écran</h3>
                        <div class="mt-2">
                            <p class="text-sm text-gray-500 mb-4">Utilisez ce lien sur votre Smart TV ou Chromecast pour afficher le planning.</p>
                            
                            <div class="flex items-center gap-2 p-2 bg-gray-100 rounded border border-gray-200">
                                <input type="text" id="tv-url" readonly class="w-full bg-transparent border-none text-sm text-gray-600 focus:ring-0">
                                <button onclick="copyLink()" class="text-blue-600 hover:text-blue-800 font-bold text-sm px-2">COPIER</button>
                            </div>
                            
                            <button onclick="regenerateKey()" class="mt-6 w-full inline-flex justify-center rounded-md border border-red-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-red-700 hover:bg-red-50 sm:text-sm">
                                <i class="fas fa-sync mr-2 mt-0.5"></i> Régénérer la clé (Déconnecte tout)
                            </button>
                        </div>
                    </div>
                </div>
                <div class="mt-5 sm:mt-6">
                    <button type="button" onclick="closeConfigModal()" class="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 sm:text-sm">
                        Fermer
                    </button>
                </div>
            </div>
        </div>
    </div>

    <script>
        // ==========================================
        // STATE & INIT
        // ==========================================
        let currentMessages = [];
        let currentMediaUrls = []; // Array of uploaded URLs for the form
        
        // Check Auth
        const token = localStorage.getItem('token');
        if (!token) {
            window.location.href = '/?redirect=/admin/tv';
        }
        
        // Axios config
        axios.defaults.headers.common['Authorization'] = 'Bearer ' + token;

        async function init() {
            await loadMessages();
        }
        
        // ==========================================
        // API CALLS
        // ==========================================
        async function loadMessages() {
            try {
                const res = await axios.get('/api/tv/admin/messages');
                currentMessages = res.data.messages;
                renderList();
            } catch (e) {
                console.error(e);
                alert('Erreur chargement messages. Vérifiez vos permissions.');
            }
        }

        async function saveMessage(data) {
            try {
                const id = document.getElementById('msg-id').value;
                if (id) {
                    await axios.put('/api/tv/admin/messages/' + id, data);
                } else {
                    await axios.post('/api/tv/admin/messages', data);
                }
                closeModal();
                loadMessages();
            } catch (e) {
                console.error(e);
                alert('Erreur enregistrement: ' + (e.response?.data?.error || e.message));
            }
        }

        async function deleteMessage(id) {
            if (!confirm('Voulez-vous vraiment supprimer ce message ?')) return;
            try {
                await axios.delete('/api/tv/admin/messages/' + id);
                loadMessages();
            } catch (e) {
                alert('Erreur suppression');
            }
        }

        async function handleFiles(files) {
            if (!files.length) return;
            
            const btn = document.getElementById('drop-zone');
            const originalContent = btn.innerHTML;
            btn.innerHTML = '<div class="py-4"><i class="fas fa-circle-notch fa-spin text-blue-500 text-2xl"></i><p class="mt-2 text-sm text-gray-500">Upload en cours...</p></div>';
            
            try {
                for (let file of files) {
                    const formData = new FormData();
                    formData.append('file', file);
                    
                    const res = await axios.post('/api/media/broadcast/upload', formData, {
                        headers: { 'Content-Type': 'multipart/form-data' }
                    });
                    
                    if (res.data.success) {
                        currentMediaUrls.push(res.data.url);
                    }
                }
                renderImagesPreview();
            } catch (e) {
                console.error(e);
                alert('Erreur upload: ' + (e.response?.data?.error || e.message));
            } finally {
                btn.innerHTML = originalContent;
            }
        }
        
        async function loadConfig() {
            try {
                const res = await axios.get('/api/tv/admin/config');
                document.getElementById('tv-url').value = res.data.url;
            } catch (e) {
                alert('Erreur chargement config');
            }
        }
        
        async function regenerateKey() {
            if (!confirm('ATTENTION: Cela déconnectera tous les écrans TV actuels. Continuer ?')) return;
            try {
                const res = await axios.post('/api/tv/admin/regenerate');
                document.getElementById('tv-url').value = res.data.url;
                alert('Nouvelle clé générée ! Mettez à jour vos écrans.');
            } catch (e) {
                alert('Erreur régénération');
            }
        }

        // ==========================================
        // UI FUNCTIONS
        // ==========================================
        function renderList() {
            const list = document.getElementById('messages-list');
            
            if (currentMessages.length === 0) {
                list.innerHTML = '<li class="p-8 text-center text-gray-500">Aucun message de diffusion. Créez-en un !</li>';
                return;
            }

            list.innerHTML = currentMessages.map(msg => {
                const typeIcon = {
                    'text': 'fa-bullhorn',
                    'image_text': 'fa-image',
                    'gallery': 'fa-images'
                }[msg.type] || 'fa-question';
                
                const typeLabel = {
                    'text': 'Texte',
                    'image_text': 'Image + Texte',
                    'gallery': 'Galerie'
                }[msg.type];
                
                const statusColor = msg.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800';
                const activeLabel = msg.is_active ? 'Actif' : 'Inactif';
                
                return \`
                    <li class="block hover:bg-gray-50 transition-colors">
                        <div class="px-4 py-4 sm:px-6 flex items-center justify-between">
                            <div class="flex items-center gap-4 flex-1 min-w-0">
                                <div class="flex-shrink-0 h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                                    <i class="fas \${typeIcon} text-blue-600"></i>
                                </div>
                                <div class="min-w-0 flex-1">
                                    <div class="flex items-center gap-2">
                                        <p class="text-sm font-medium text-blue-600 truncate">\${msg.title || 'Sans titre'}</p>
                                        <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-50 text-blue-600 border border-blue-100">\${typeLabel}</span>
                                        <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full \${statusColor}">\${activeLabel}</span>
                                    </div>
                                    <div class="mt-1 flex items-center text-sm text-gray-500 truncate">
                                        <span class="truncate">\${msg.content || '(Pas de contenu)'}</span>
                                    </div>
                                </div>
                            </div>
                            <div class="flex items-center gap-2">
                                <button onclick='editMessage(\${JSON.stringify(msg).replace(/'/g, "&#39;")})' class="p-2 text-gray-400 hover:text-blue-600">
                                    <i class="fas fa-edit"></i>
                                </button>
                                <button onclick="deleteMessage(\${msg.id})" class="p-2 text-gray-400 hover:text-red-600">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </div>
                        </div>
                    </li>
                \`;
            }).join('');
        }

        function renderImagesPreview() {
            const container = document.getElementById('images-preview');
            container.innerHTML = currentMediaUrls.map((url, index) => \`
                <div class="relative group aspect-video bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
                    <img src="\${url}" class="w-full h-full object-cover">
                    <button onclick="removeImage(\${index})" class="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1 h-6 w-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm">
                        <i class="fas fa-times text-xs"></i>
                    </button>
                </div>
            \`).join('');
        }
        
        function removeImage(index) {
            currentMediaUrls.splice(index, 1);
            renderImagesPreview();
        }

        function updateFormUI() {
            const type = document.getElementById('msg-type').value;
            const imgField = document.getElementById('field-images');
            
            if (type === 'text') {
                imgField.classList.add('hidden');
            } else {
                imgField.classList.remove('hidden');
            }
        }

        // ==========================================
        // HANDLERS
        // ==========================================
        function openModal() {
            // Reset form
            document.getElementById('message-form').reset();
            document.getElementById('msg-id').value = '';
            document.getElementById('modal-title').innerText = 'Nouveau Message';
            currentMediaUrls = [];
            renderImagesPreview();
            updateFormUI();
            
            document.getElementById('modal').classList.remove('hidden');
        }

        function closeModal() {
            document.getElementById('modal').classList.add('hidden');
        }
        
        function editMessage(msg) {
            document.getElementById('msg-id').value = msg.id;
            document.getElementById('modal-title').innerText = 'Modifier Message #' + msg.id;
            
            document.getElementById('msg-type').value = msg.type;
            document.getElementById('msg-priority').value = msg.priority;
            document.getElementById('msg-title').value = msg.title || '';
            document.getElementById('msg-content').value = msg.content || '';
            document.getElementById('msg-duration').value = msg.display_duration;
            document.getElementById('msg-active').checked = msg.is_active;
            
            if (msg.start_date) document.getElementById('msg-start').value = msg.start_date.substring(0, 16);
            if (msg.end_date) document.getElementById('msg-end').value = msg.end_date.substring(0, 16);
            
            currentMediaUrls = msg.media_urls || [];
            renderImagesPreview();
            updateFormUI();
            
            document.getElementById('modal').classList.remove('hidden');
        }

        function handleSave(e) {
            e.preventDefault();
            
            const data = {
                type: document.getElementById('msg-type').value,
                priority: parseInt(document.getElementById('msg-priority').value),
                title: document.getElementById('msg-title').value,
                content: document.getElementById('msg-content').value,
                display_duration: parseInt(document.getElementById('msg-duration').value),
                is_active: document.getElementById('msg-active').checked,
                start_date: document.getElementById('msg-start').value || null,
                end_date: document.getElementById('msg-end').value || null,
                media_urls: currentMediaUrls
            };
            
            saveMessage(data);
        }
        
        function openConfigModal() {
            loadConfig();
            document.getElementById('config-modal').classList.remove('hidden');
        }
        
        function closeConfigModal() {
            document.getElementById('config-modal').classList.add('hidden');
        }
        
        function copyLink() {
            const input = document.getElementById('tv-url');
            input.select();
            document.execCommand('copy');
            alert('Lien copié !');
        }

        // Init
        document.addEventListener('DOMContentLoaded', init);

    </script>
</body>
</html>
`;
