import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { serveStatic } from 'hono/cloudflare-workers';
import { authMiddleware, adminOnly, technicianOrAdmin } from './middlewares/auth';
import auth from './routes/auth';
import tickets from './routes/tickets';
import machines from './routes/machines';
import media from './routes/media';
import type { Bindings } from './types';

const app = new Hono<{ Bindings: Bindings }>();

// Middleware CORS pour les API
app.use('/api/*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
}));

// Middleware sur /api/auth/me seulement (AVANT la route)
app.use('/api/auth/me', authMiddleware);

// Routes d'authentification (login, register sont publiques, me est protégée)
app.route('/api/auth', auth);

// Routes des tickets (protégées)
app.use('/api/tickets/*', authMiddleware);
app.route('/api/tickets', tickets);

// Routes des machines (protégées)
app.use('/api/machines/*', authMiddleware);
app.route('/api/machines', machines);

// Routes des médias (GET public pour images, POST/DELETE protégés)
// On doit définir les routes PUIS ajouter les middlewares sur certaines routes
app.route('/api/media', media);

// Page d'accueil avec interface React
app.get('/', (c) => {
  return c.html(`
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>IGP - Système de Gestion de Maintenance</title>
    <link rel="icon" type="image/png" href="/static/logo-igp.png">
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
    <script crossorigin src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
    <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
    <script>
        tailwind.config = {
            theme: {
                extend: {
                    colors: {
                        'igp-blue': '#1e40af',
                        'igp-orange': '#ea580c',
                        'igp-red': '#dc2626',
                    }
                }
            }
        }
    </script>
    <style>
        .kanban-column {
            min-height: 400px;
            background: #f8f9fa;
            border-radius: 8px;
            padding: 16px;
        }
        .ticket-card {
            background: white;
            border-radius: 6px;
            padding: 12px;
            margin-bottom: 12px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
            cursor: grab;
            transition: all 0.2s;
            user-select: none;
            -webkit-user-select: none;
            -webkit-tap-highlight-color: transparent;
        }
        .ticket-card:hover {
            box-shadow: 0 4px 6px rgba(0,0,0,0.15);
            transform: translateY(-2px);
        }
        .ticket-card:active {
            cursor: grabbing;
        }
        .ticket-card.dragging {
            opacity: 0.5;
            cursor: grabbing;
            transform: rotate(2deg);
        }
        .ticket-card.long-press-active {
            background: #eff6ff;
            box-shadow: 0 6px 12px rgba(59, 130, 246, 0.3);
        }
        .kanban-column.drag-over {
            background: #dbeafe;
            border: 2px dashed #3b82f6;
        }
        .kanban-column.drag-valid {
            background: #d1fae5;
            border: 2px dashed #10b981;
        }
        .kanban-column.drag-invalid {
            background: #fee2e2;
            border: 2px dashed #ef4444;
        }
        .priority-high {
            border-left: 4px solid #ef4444;
        }
        .priority-critical {
            border-left: 4px solid #dc2626;
        }
        .priority-medium {
            border-left: 4px solid #f59e0b;
        }
        .priority-low {
            border-left: 4px solid #10b981;
        }
        .modal {
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.5);
            z-index: 1000;
            overflow-y: auto;
            -webkit-overflow-scrolling: touch;
        }
        .modal.active {
            display: flex;
            align-items: flex-start;
            justify-content: center;
            padding: 20px 0;
        }
        @media (max-width: 640px) {
            .modal.active {
                padding: 10px 0;
                align-items: flex-start;
            }
        }
        .context-menu {
            position: fixed;
            background: white;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 2000;
            min-width: 200px;
            padding: 8px 0;
        }
        .context-menu-item {
            padding: 12px 20px;
            cursor: pointer;
            display: flex;
            align-items: center;
            transition: background 0.2s;
            font-size: 15px;
        }
        .context-menu-item:hover {
            background: #f3f4f6;
        }
        .context-menu-item:active {
            background: #e5e7eb;
        }
        .context-menu-item i {
            margin-right: 12px;
            width: 20px;
        }
        
        /* MOBILE RESPONSIVE STYLES */
        @media (max-width: 1024px) {
            .kanban-grid {
                display: flex;
                flex-direction: column;
                gap: 16px;
            }
            .kanban-column {
                min-height: auto;
                width: 100%;
            }
            .header-actions {
                flex-direction: column;
                gap: 8px;
                width: 100%;
            }
            .header-actions button {
                width: 100%;
                padding: 12px 16px;
                font-size: 16px;
            }
            .ticket-card {
                padding: 16px;
                font-size: 15px;
                min-height: 44px;
            }
            .context-menu-item {
                padding: 16px 20px;
                font-size: 16px;
                min-height: 48px;
            }
            .modal-content {
                width: 95vw !important;
                max-width: 95vw !important;
                margin: 10px;
            }
        }
        
        @media (max-width: 640px) {
            .header-title {
                flex-direction: column;
                align-items: flex-start;
            }
            .header-title h1 {
                font-size: 20px;
            }
            .kanban-column-header h3 {
                font-size: 14px;
            }
        }
    </style>
</head>
<body class="bg-gray-50">
    <div id="root"></div>
    
    <script>
        const API_URL = '/api';
        let authToken = localStorage.getItem('auth_token');
        let currentUser = null;
        
        if (authToken) {
            axios.defaults.headers.common['Authorization'] = 'Bearer ' + authToken;
        }
        
        // Application principale
        const App = () => {
            const [isLoggedIn, setIsLoggedIn] = React.useState(!!authToken);
            const [tickets, setTickets] = React.useState([]);
            const [machines, setMachines] = React.useState([]);
            const [loading, setLoading] = React.useState(true);
            const [showCreateModal, setShowCreateModal] = React.useState(false);
            const [contextMenu, setContextMenu] = React.useState(null);
            
            React.useEffect(() => {
                if (isLoggedIn) {
                    loadData();
                }
            }, [isLoggedIn]);
            
            const loadData = async () => {
                try {
                    const [ticketsRes, machinesRes, userRes] = await Promise.all([
                        axios.get(API_URL + '/tickets'),
                        axios.get(API_URL + '/machines'),
                        axios.get(API_URL + '/auth/me')
                    ]);
                    setTickets(ticketsRes.data.tickets);
                    setMachines(machinesRes.data.machines);
                    currentUser = userRes.data.user;
                    setLoading(false);
                } catch (error) {
                    console.error('Erreur chargement:', error);
                    if (error.response?.status === 401) {
                        logout();
                    }
                }
            };
            
            const login = async (email, password) => {
                try {
                    const response = await axios.post(API_URL + '/auth/login', { email, password });
                    authToken = response.data.token;
                    currentUser = response.data.user;
                    localStorage.setItem('auth_token', authToken);
                    axios.defaults.headers.common['Authorization'] = 'Bearer ' + authToken;
                    setIsLoggedIn(true);
                } catch (error) {
                    alert('Erreur de connexion: ' + (error.response?.data?.error || 'Erreur inconnue'));
                }
            };
            
            const logout = () => {
                localStorage.removeItem('auth_token');
                delete axios.defaults.headers.common['Authorization'];
                authToken = null;
                currentUser = null;
                setIsLoggedIn(false);
            };
            
            if (!isLoggedIn) {
                return React.createElement(LoginForm, { onLogin: login });
            }
            
            if (loading) {
                return React.createElement('div', { className: 'flex items-center justify-center h-screen' },
                    React.createElement('div', { className: 'text-center' },
                        React.createElement('i', { className: 'fas fa-spinner fa-spin fa-3x text-blue-500 mb-4' }),
                        React.createElement('p', { className: 'text-gray-600' }, 'Chargement...')
                    )
                );
            }
            
            return React.createElement(MainApp, { 
                tickets, 
                machines,
                onLogout: logout,
                onRefresh: loadData,
                showCreateModal,
                setShowCreateModal,
                onTicketCreated: loadData
            });
        };
        
        // Formulaire de connexion
        const LoginForm = ({ onLogin }) => {
            const [email, setEmail] = React.useState('admin@igpglass.ca');
            const [password, setPassword] = React.useState('password123');
            
            const handleSubmit = (e) => {
                e.preventDefault();
                onLogin(email, password);
            };
            
            return React.createElement('div', { className: 'min-h-screen flex items-center justify-center bg-gradient-to-br from-igp-blue to-blue-900' },
                React.createElement('div', { className: 'bg-white p-8 rounded-lg shadow-2xl w-96 max-w-md mx-4' },
                    React.createElement('div', { className: 'text-center mb-8' },
                        React.createElement('img', { 
                            src: '/static/logo-igp.png', 
                            alt: 'IGP Logo',
                            className: 'h-20 w-auto mx-auto mb-4'
                        }),
                        React.createElement('h1', { className: 'text-2xl font-bold text-igp-blue mb-2' }, 'Système de Maintenance'),
                        React.createElement('p', { className: 'text-sm text-gray-600 mb-1' }, 'Les Produits Verriers International'),
                        React.createElement('p', { className: 'text-xs text-igp-orange font-semibold' }, '(IGP) Inc.')
                    ),
                    React.createElement('form', { onSubmit: handleSubmit },
                        React.createElement('div', { className: 'mb-4' },
                            React.createElement('label', { className: 'block text-gray-700 text-sm font-bold mb-2' }, 
                                React.createElement('i', { className: 'fas fa-envelope mr-2 text-igp-blue' }),
                                'Email'
                            ),
                            React.createElement('input', {
                                type: 'email',
                                className: 'w-full px-3 py-2 border-2 border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-igp-blue focus:border-transparent',
                                value: email,
                                onChange: (e) => setEmail(e.target.value),
                                placeholder: 'votre.email@igpglass.ca',
                                required: true
                            })
                        ),
                        React.createElement('div', { className: 'mb-6' },
                            React.createElement('label', { className: 'block text-gray-700 text-sm font-bold mb-2' }, 
                                React.createElement('i', { className: 'fas fa-lock mr-2 text-igp-blue' }),
                                'Mot de passe'
                            ),
                            React.createElement('input', {
                                type: 'password',
                                className: 'w-full px-3 py-2 border-2 border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-igp-blue focus:border-transparent',
                                value: password,
                                onChange: (e) => setPassword(e.target.value),
                                placeholder: '••••••••',
                                required: true
                            })
                        ),
                        React.createElement('button', {
                            type: 'submit',
                            className: 'w-full bg-igp-orange text-white font-bold py-3 px-4 rounded-md hover:bg-orange-700 transition duration-200 shadow-lg'
                        }, 
                            React.createElement('i', { className: 'fas fa-sign-in-alt mr-2' }),
                            'Se connecter'
                        )
                    ),
                    React.createElement('div', { className: 'mt-4 text-sm text-gray-600 text-center' },
                        React.createElement('p', { className: 'font-semibold' }, 'Comptes de test:'),
                        React.createElement('p', { className: 'text-igp-blue' }, 'admin@igpglass.ca'),
                        React.createElement('p', { className: 'text-igp-blue' }, 'technicien@igpglass.ca'),
                        React.createElement('p', { className: 'text-igp-blue' }, 'operateur@igpglass.ca')
                    )
                )
            );
        };
        
        // Modal de création de ticket
        const CreateTicketModal = ({ show, onClose, machines, onTicketCreated }) => {
            const [title, setTitle] = React.useState('');
            const [description, setDescription] = React.useState('');
            const [machineId, setMachineId] = React.useState('');
            const [priority, setPriority] = React.useState('medium');
            const [mediaFiles, setMediaFiles] = React.useState([]);
            const [mediaPreviews, setMediaPreviews] = React.useState([]);
            const [submitting, setSubmitting] = React.useState(false);
            const [uploadProgress, setUploadProgress] = React.useState(0);
            
            const handleFileChange = (e) => {
                const files = Array.from(e.target.files);
                setMediaFiles(prevFiles => [...prevFiles, ...files]);
                
                // Créer des aperçus pour les images/vidéos
                files.forEach(file => {
                    const reader = new FileReader();
                    reader.onloadend = () => {
                        setMediaPreviews(prev => [...prev, {
                            url: reader.result,
                            type: file.type,
                            name: file.name,
                            size: file.size
                        }]);
                    };
                    reader.readAsDataURL(file);
                });
            };
            
            const removeMedia = (index) => {
                setMediaFiles(prev => prev.filter((_, i) => i !== index));
                setMediaPreviews(prev => prev.filter((_, i) => i !== index));
            };
            
            const uploadMediaFiles = async (ticketId) => {
                if (mediaFiles.length === 0) return;
                
                for (let i = 0; i < mediaFiles.length; i++) {
                    const file = mediaFiles[i];
                    const formData = new FormData();
                    formData.append('file', file);
                    formData.append('ticket_id', ticketId);
                    
                    try {
                        await axios.post(API_URL + '/media/upload', formData, {
                            headers: { 'Content-Type': 'multipart/form-data' }
                        });
                        setUploadProgress(Math.round(((i + 1) / mediaFiles.length) * 100));
                    } catch (error) {
                        console.error('Erreur upload média:', error);
                    }
                }
            };
            
            const handleSubmit = async (e) => {
                e.preventDefault();
                setSubmitting(true);
                setUploadProgress(0);
                
                try {
                    // 1. Créer le ticket
                    const response = await axios.post(API_URL + '/tickets', {
                        title,
                        description,
                        machine_id: parseInt(machineId),
                        priority
                    });
                    
                    const ticketId = response.data.ticket.id;
                    
                    // 2. Uploader les médias si présents
                    if (mediaFiles.length > 0) {
                        await uploadMediaFiles(ticketId);
                    }
                    
                    alert('Ticket créé avec succès !' + (mediaFiles.length > 0 ? ' (' + mediaFiles.length + ' média(s) uploadé(s))' : ''));
                    
                    // Reset form
                    setTitle('');
                    setDescription('');
                    setMachineId('');
                    setPriority('medium');
                    setMediaFiles([]);
                    setMediaPreviews([]);
                    setUploadProgress(0);
                    onClose();
                    onTicketCreated();
                } catch (error) {
                    alert('Erreur: ' + (error.response?.data?.error || 'Erreur inconnue'));
                } finally {
                    setSubmitting(false);
                }
            };
            
            if (!show) return null;
            
            return React.createElement('div', { 
                className: 'modal active',
                onClick: onClose
            },
                React.createElement('div', {
                    className: 'modal-content bg-white rounded-lg p-4 md:p-8 max-w-2xl w-full mx-4 my-auto',
                    onClick: (e) => e.stopPropagation(),
                    style: { marginTop: 'auto', marginBottom: 'auto' }
                },
                    React.createElement('div', { className: 'flex justify-between items-center mb-6 border-b-2 border-igp-blue pb-4' },
                        React.createElement('h2', { className: 'text-2xl font-bold text-igp-blue' },
                            React.createElement('i', { className: 'fas fa-plus-circle mr-2 text-igp-orange' }),
                            'Nouvelle Demande de Maintenance'
                        ),
                        React.createElement('button', {
                            onClick: onClose,
                            className: 'text-gray-500 hover:text-gray-700'
                        },
                            React.createElement('i', { className: 'fas fa-times fa-2x' })
                        )
                    ),
                    React.createElement('form', { onSubmit: handleSubmit },
                        React.createElement('div', { className: 'mb-4' },
                            React.createElement('label', { className: 'block text-gray-700 text-sm font-bold mb-2' },
                                React.createElement('i', { className: 'fas fa-heading mr-2' }),
                                'Titre du problème *'
                            ),
                            React.createElement('input', {
                                type: 'text',
                                className: 'w-full px-3 py-2 border-2 border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-igp-blue focus:border-transparent',
                                value: title,
                                onChange: (e) => setTitle(e.target.value),
                                placeholder: 'Ex: Bruit anormal sur la machine',
                                required: true
                            })
                        ),
                        React.createElement('div', { className: 'mb-4' },
                            React.createElement('label', { className: 'block text-gray-700 text-sm font-bold mb-2' },
                                React.createElement('i', { className: 'fas fa-align-left mr-2' }),
                                'Description détaillée *'
                            ),
                            React.createElement('textarea', {
                                className: 'w-full px-3 py-2 border-2 border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-igp-blue focus:border-transparent',
                                value: description,
                                onChange: (e) => setDescription(e.target.value),
                                placeholder: 'Décrivez le problème en détail...',
                                rows: 4,
                                required: true
                            })
                        ),
                        React.createElement('div', { className: 'mb-4' },
                            React.createElement('label', { className: 'block text-gray-700 text-sm font-bold mb-2' },
                                React.createElement('i', { className: 'fas fa-cog mr-2' }),
                                'Machine concernée *'
                            ),
                            React.createElement('select', {
                                className: 'w-full px-3 py-2 border-2 border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-igp-blue focus:border-transparent',
                                value: machineId,
                                onChange: (e) => setMachineId(e.target.value),
                                required: true
                            },
                                React.createElement('option', { value: '' }, '-- Sélectionnez une machine --'),
                                machines.map(m => 
                                    React.createElement('option', { key: m.id, value: m.id },
                                        m.machine_type + ' ' + m.model + ' - ' + m.location
                                    )
                                )
                            )
                        ),
                        React.createElement('div', { className: 'mb-4' },
                            React.createElement('label', { className: 'block text-gray-700 text-sm font-bold mb-2' },
                                React.createElement('i', { className: 'fas fa-camera mr-2 text-igp-orange' }),
                                'Photos / Vidéos du problème'
                            ),
                            React.createElement('input', {
                                type: 'file',
                                accept: 'image/*,video/*',
                                capture: 'environment',
                                multiple: true,
                                onChange: handleFileChange,
                                className: 'hidden',
                                id: 'media-upload'
                            }),
                            React.createElement('label', {
                                htmlFor: 'media-upload',
                                className: 'w-full px-4 py-3 border-2 border-dashed border-igp-blue rounded-md text-center cursor-pointer hover:bg-blue-50 transition-all flex items-center justify-center text-igp-blue font-semibold'
                            },
                                React.createElement('i', { className: 'fas fa-camera mr-2' }),
                                'Prendre une photo ou vidéo'
                            ),
                            mediaPreviews.length > 0 && React.createElement('div', { className: 'mt-3 grid grid-cols-3 gap-2' },
                                mediaPreviews.map((preview, index) =>
                                    React.createElement('div', { 
                                        key: index, 
                                        className: 'relative group'
                                    },
                                        preview.type.startsWith('image/') 
                                            ? React.createElement('img', {
                                                src: preview.url,
                                                alt: preview.name,
                                                className: 'w-full h-24 object-cover rounded border-2 border-gray-300'
                                            })
                                            : React.createElement('video', {
                                                src: preview.url,
                                                className: 'w-full h-24 object-cover rounded border-2 border-gray-300',
                                                controls: false
                                            }),
                                        React.createElement('button', {
                                            type: 'button',
                                            onClick: () => removeMedia(index),
                                            className: 'absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity'
                                        },
                                            React.createElement('i', { className: 'fas fa-times text-xs' })
                                        ),
                                        React.createElement('div', { className: 'absolute bottom-1 left-1 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded' },
                                            preview.type.startsWith('image/') ? '📷' : '🎥',
                                            ' ' + Math.round(preview.size / 1024) + ' KB'
                                        )
                                    )
                                )
                            )
                        ),
                        React.createElement('div', { className: 'mb-6' },
                            React.createElement('label', { className: 'block text-gray-700 text-sm font-bold mb-2' },
                                React.createElement('i', { className: 'fas fa-exclamation-triangle mr-2' }),
                                'Priorité *'
                            ),
                            React.createElement('div', { className: 'grid grid-cols-4 gap-2' },
                                ['low', 'medium', 'high', 'critical'].map(p =>
                                    React.createElement('button', {
                                        key: p,
                                        type: 'button',
                                        onClick: () => setPriority(p),
                                        className: 'px-4 py-2 rounded-md text-sm font-semibold transition-all ' + 
                                            (priority === p 
                                                ? 'bg-igp-orange text-white shadow-md' 
                                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300')
                                    },
                                        p === 'low' ? '🟢 Faible' :
                                        p === 'medium' ? '🟡 Moyenne' :
                                        p === 'high' ? '🟠 Haute' :
                                        '🔴 Critique'
                                    )
                                )
                            )
                        ),
                        React.createElement('div', { className: 'flex justify-end space-x-4 mt-6 pt-4 border-t-2 border-gray-200' },
                            React.createElement('button', {
                                type: 'button',
                                onClick: onClose,
                                className: 'px-6 py-2 border-2 border-gray-300 rounded-md text-gray-700 hover:bg-gray-100 transition-all'
                            }, 
                                React.createElement('i', { className: 'fas fa-times mr-2' }),
                                'Annuler'
                            ),
                            React.createElement('button', {
                                type: 'submit',
                                disabled: submitting,
                                className: 'px-6 py-2 bg-igp-orange text-white rounded-md hover:bg-orange-700 disabled:bg-gray-400 shadow-md transition-all'
                            },
                                submitting 
                                    ? React.createElement('i', { className: 'fas fa-spinner fa-spin mr-2' })
                                    : React.createElement('i', { className: 'fas fa-check mr-2' }),
                                submitting 
                                    ? (uploadProgress > 0 ? 'Upload: ' + uploadProgress + '%' : 'Création...')
                                    : 'Créer le ticket' + (mediaFiles.length > 0 ? ' (' + mediaFiles.length + ' média(s))' : '')
                            )
                        )
                    )
                )
            );
        };
        
        // Modal de détails du ticket avec galerie de médias
        const TicketDetailsModal = ({ show, onClose, ticketId }) => {
            const [ticket, setTicket] = React.useState(null);
            const [loading, setLoading] = React.useState(true);
            const [selectedMedia, setSelectedMedia] = React.useState(null);
            
            React.useEffect(() => {
                if (show && ticketId) {
                    loadTicketDetails();
                }
            }, [show, ticketId]);
            
            const loadTicketDetails = async () => {
                try {
                    setLoading(true);
                    const response = await axios.get(API_URL + '/tickets/' + ticketId);
                    setTicket(response.data.ticket);
                } catch (error) {
                    console.error('Erreur chargement ticket:', error);
                    alert('Erreur lors du chargement des détails du ticket');
                } finally {
                    setLoading(false);
                }
            };
            
            if (!show) return null;
            
            return React.createElement('div', { 
                className: 'modal active',
                onClick: onClose
            },
                React.createElement('div', {
                    className: 'modal-content bg-white rounded-lg p-4 md:p-8 max-w-4xl w-full mx-4 my-auto',
                    onClick: (e) => e.stopPropagation(),
                    style: { marginTop: 'auto', marginBottom: 'auto', maxHeight: '90vh', overflowY: 'auto' }
                },
                    React.createElement('div', { className: 'flex justify-between items-center mb-6 border-b-2 border-igp-blue pb-4' },
                        React.createElement('h2', { className: 'text-2xl font-bold text-igp-blue' },
                            React.createElement('i', { className: 'fas fa-ticket-alt mr-2 text-igp-orange' }),
                            'Détails du Ticket'
                        ),
                        React.createElement('button', {
                            onClick: onClose,
                            className: 'text-gray-500 hover:text-gray-700'
                        },
                            React.createElement('i', { className: 'fas fa-times fa-2x' })
                        )
                    ),
                    
                    loading ? React.createElement('div', { className: 'text-center py-8' },
                        React.createElement('i', { className: 'fas fa-spinner fa-spin fa-3x text-igp-blue' }),
                        React.createElement('p', { className: 'mt-4 text-gray-600' }, 'Chargement...')
                    ) : ticket ? React.createElement('div', {},
                        // Informations du ticket
                        React.createElement('div', { className: 'mb-6' },
                            React.createElement('div', { className: 'flex items-center justify-between mb-4' },
                                React.createElement('span', { className: 'text-lg font-mono text-gray-700' }, ticket.ticket_id),
                                React.createElement('span', { 
                                    className: 'px-3 py-1 rounded font-semibold ' + 
                                    (ticket.priority === 'critical' ? 'bg-red-100 text-red-800' :
                                     ticket.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                                     ticket.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                     'bg-green-100 text-green-800')
                                }, 
                                    ticket.priority === 'critical' ? '🔴 CRITIQUE' :
                                    ticket.priority === 'high' ? '🟠 HAUTE' :
                                    ticket.priority === 'medium' ? '🟡 MOYENNE' :
                                    '🟢 FAIBLE'
                                )
                            ),
                            React.createElement('h3', { className: 'text-xl font-bold text-gray-800 mb-2' }, ticket.title),
                            React.createElement('p', { className: 'text-gray-600 mb-4' }, ticket.description),
                            React.createElement('div', { className: 'grid grid-cols-2 gap-4 text-sm' },
                                React.createElement('div', {},
                                    React.createElement('span', { className: 'font-semibold text-gray-700' }, 'Machine: '),
                                    React.createElement('span', { className: 'text-gray-600' }, ticket.machine_type + ' ' + ticket.model)
                                ),
                                React.createElement('div', {},
                                    React.createElement('span', { className: 'font-semibold text-gray-700' }, 'Statut: '),
                                    React.createElement('span', { className: 'text-gray-600' }, ticket.status)
                                ),
                                React.createElement('div', {},
                                    React.createElement('span', { className: 'font-semibold text-gray-700' }, 'Créé le: '),
                                    React.createElement('span', { className: 'text-gray-600' }, 
                                        new Date(ticket.created_at).toLocaleString('fr-FR')
                                    )
                                ),
                                React.createElement('div', {},
                                    React.createElement('span', { className: 'font-semibold text-gray-700' }, 'Rapporté par: '),
                                    React.createElement('span', { className: 'text-gray-600' }, ticket.reporter_name || 'N/A')
                                )
                            )
                        ),
                        
                        // Galerie de médias
                        ticket.media && ticket.media.length > 0 && React.createElement('div', { className: 'mb-6' },
                            React.createElement('h4', { className: 'text-lg font-bold text-gray-800 mb-3 flex items-center' },
                                React.createElement('i', { className: 'fas fa-images mr-2 text-igp-orange' }),
                                'Photos et Vidéos (' + ticket.media.length + ')'
                            ),
                            React.createElement('div', { className: 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3' },
                                ticket.media.map((media, index) =>
                                    React.createElement('div', { 
                                        key: media.id,
                                        className: 'relative group cursor-pointer',
                                        onClick: () => setSelectedMedia(media)
                                    },
                                        media.file_type.startsWith('image/') 
                                            ? React.createElement('img', {
                                                src: API_URL + '/media/' + media.id,
                                                alt: media.file_name,
                                                className: 'w-full h-32 object-cover rounded border-2 border-gray-300 hover:border-igp-blue transition-all'
                                            })
                                            : React.createElement('div', { className: 'w-full h-32 bg-gray-200 rounded border-2 border-gray-300 hover:border-igp-blue transition-all flex items-center justify-center' },
                                                React.createElement('i', { className: 'fas fa-video fa-3x text-gray-500' })
                                            ),
                                        React.createElement('div', { className: 'absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all rounded flex items-center justify-center' },
                                            React.createElement('i', { className: 'fas fa-search-plus text-white text-2xl opacity-0 group-hover:opacity-100 transition-all' })
                                        ),
                                        React.createElement('div', { className: 'absolute bottom-1 left-1 bg-black bg-opacity-60 text-white text-xs px-2 py-1 rounded' },
                                            media.file_type.startsWith('image/') ? '📷' : '🎥'
                                        )
                                    )
                                )
                            )
                        ),
                        
                        // Message si pas de médias
                        (!ticket.media || ticket.media.length === 0) && React.createElement('div', { className: 'mb-6 text-center py-8 bg-gray-50 rounded' },
                            React.createElement('i', { className: 'fas fa-camera text-gray-400 text-4xl mb-2' }),
                            React.createElement('p', { className: 'text-gray-500' }, 'Aucune photo ou vidéo attachée à ce ticket')
                        ),
                        
                        // Bouton fermer
                        React.createElement('div', { className: 'flex justify-end mt-6 pt-4 border-t-2 border-gray-200' },
                            React.createElement('button', {
                                onClick: onClose,
                                className: 'px-6 py-2 bg-igp-blue text-white rounded-md hover:bg-blue-800 transition-all'
                            },
                                React.createElement('i', { className: 'fas fa-times mr-2' }),
                                'Fermer'
                            )
                        )
                    ) : React.createElement('div', { className: 'text-center py-8' },
                        React.createElement('p', { className: 'text-red-600' }, 'Erreur lors du chargement du ticket')
                    )
                ),
                
                // Lightbox pour médias en plein écran
                selectedMedia && React.createElement('div', {
                    className: 'fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4',
                    onClick: () => setSelectedMedia(null)
                },
                    React.createElement('div', { className: 'relative max-w-6xl max-h-full' },
                        React.createElement('button', {
                            onClick: () => setSelectedMedia(null),
                            className: 'absolute top-2 right-2 bg-white text-gray-800 rounded-full w-10 h-10 flex items-center justify-center hover:bg-gray-200 transition-all z-10'
                        },
                            React.createElement('i', { className: 'fas fa-times fa-lg' })
                        ),
                        selectedMedia.file_type.startsWith('image/')
                            ? React.createElement('img', {
                                src: API_URL + '/media/' + selectedMedia.id,
                                alt: selectedMedia.file_name,
                                className: 'max-w-full max-h-screen object-contain',
                                onClick: (e) => e.stopPropagation()
                            })
                            : React.createElement('video', {
                                src: API_URL + '/media/' + selectedMedia.id,
                                controls: true,
                                className: 'max-w-full max-h-screen',
                                onClick: (e) => e.stopPropagation()
                            }),
                        React.createElement('div', { className: 'absolute bottom-2 left-2 bg-black bg-opacity-70 text-white px-3 py-2 rounded text-sm' },
                            selectedMedia.file_name + ' - ' + Math.round(selectedMedia.file_size / 1024) + ' KB'
                        )
                    )
                )
            );
        };
        
        // Application principale
        const MainApp = ({ tickets, machines, onLogout, onRefresh, showCreateModal, setShowCreateModal, onTicketCreated }) => {
            const [contextMenu, setContextMenu] = React.useState(null);
            const [selectedTicketId, setSelectedTicketId] = React.useState(null);
            const [showDetailsModal, setShowDetailsModal] = React.useState(false);
            
            const statuses = [
                { key: 'received', label: 'Requête Reçue', icon: 'inbox', color: 'blue' },
                { key: 'diagnostic', label: 'Diagnostic', icon: 'search', color: 'yellow' },
                { key: 'in_progress', label: 'En Cours', icon: 'wrench', color: 'orange' },
                { key: 'waiting_parts', label: 'En Attente Pièces', icon: 'clock', color: 'purple' },
                { key: 'completed', label: 'Terminé', icon: 'check-circle', color: 'green' },
                { key: 'archived', label: 'Archivé', icon: 'archive', color: 'gray' }
            ];
            
            // Fermer le menu contextuel au clic ailleurs
            React.useEffect(() => {
                const handleClick = () => setContextMenu(null);
                document.addEventListener('click', handleClick);
                return () => document.removeEventListener('click', handleClick);
            }, []);
            
            const getTicketsByStatus = (status) => {
                return tickets.filter(t => t.status === status);
            };
            
            const moveTicketToStatus = async (ticket, newStatus) => {
                if (ticket.status === newStatus) return;
                
                try {
                    await axios.patch(API_URL + '/tickets/' + ticket.id, {
                        status: newStatus,
                        comment: 'Changement de statut: ' + ticket.status + ' → ' + newStatus
                    });
                    onTicketCreated(); // Refresh
                } catch (error) {
                    alert('Erreur lors du déplacement: ' + (error.response?.data?.error || 'Erreur inconnue'));
                }
            };
            
            const moveTicketToNext = async (ticket, e) => {
                e.stopPropagation();
                const statusFlow = ['received', 'diagnostic', 'in_progress', 'waiting_parts', 'completed', 'archived'];
                const currentIndex = statusFlow.indexOf(ticket.status);
                
                if (currentIndex === -1 || currentIndex === statusFlow.length - 1) {
                    return; // Déjà au dernier statut
                }
                
                const nextStatus = statusFlow[currentIndex + 1];
                await moveTicketToStatus(ticket, nextStatus);
            };
            
            const handleTicketClick = (e, ticket) => {
                // Si c'est un clic normal (pas drag, pas contextmenu), ouvrir les détails
                if (e.type === 'click' && !e.defaultPrevented) {
                    setSelectedTicketId(ticket.id);
                    setShowDetailsModal(true);
                }
            };
            
            const handleContextMenu = (e, ticket) => {
                e.preventDefault();
                e.stopPropagation();
                
                // Position du menu (ajuster pour éviter de sortir de l'écran)
                const menuWidth = 200;
                const menuHeight = 300;
                let x = e.pageX || (e.touches && e.touches[0].pageX);
                let y = e.pageY || (e.touches && e.touches[0].pageY);
                
                // Ajuster si trop proche du bord droit
                if (x + menuWidth > window.innerWidth) {
                    x = window.innerWidth - menuWidth - 10;
                }
                
                // Ajuster si trop proche du bord bas
                if (y + menuHeight > window.innerHeight + window.scrollY) {
                    y = window.innerHeight + window.scrollY - menuHeight - 10;
                }
                
                setContextMenu({
                    x: x,
                    y: y,
                    ticket: ticket
                });
            };
            
            // État pour le drag and drop
            const [draggedTicket, setDraggedTicket] = React.useState(null);
            const [dragOverColumn, setDragOverColumn] = React.useState(null);
            
            // Handlers pour le drag-and-drop (Desktop)
            const handleDragStart = (e, ticket) => {
                setDraggedTicket(ticket);
                e.currentTarget.classList.add('dragging');
                e.dataTransfer.effectAllowed = 'move';
                e.dataTransfer.setData('text/plain', ticket.id);
            };
            
            const handleDragEnd = (e) => {
                e.currentTarget.classList.remove('dragging');
                setDraggedTicket(null);
                setDragOverColumn(null);
            };
            
            const handleDragOver = (e, status) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
                setDragOverColumn(status);
            };
            
            const handleDragLeave = (e) => {
                setDragOverColumn(null);
            };
            
            const handleDrop = async (e, targetStatus) => {
                e.preventDefault();
                setDragOverColumn(null);
                
                if (!draggedTicket) return;
                
                if (draggedTicket.status !== targetStatus) {
                    await moveTicketToStatus(draggedTicket, targetStatus);
                }
                
                setDraggedTicket(null);
            };
            
            // Gestion du touch drag pour mobile
            const touchDragStart = React.useRef(null);
            const touchDragTicket = React.useRef(null);
            
            const handleTouchStart = (e, ticket) => {
                const touch = e.touches[0];
                touchDragStart.current = { x: touch.clientX, y: touch.clientY };
                touchDragTicket.current = ticket;
            };
            
            const handleTouchMove = (e) => {
                if (!touchDragStart.current || !touchDragTicket.current) return;
                
                const touch = e.touches[0];
                const deltaX = Math.abs(touch.clientX - touchDragStart.current.x);
                const deltaY = Math.abs(touch.clientY - touchDragStart.current.y);
                
                // Si mouvement significatif, on considère que c'est un drag
                if (deltaX > 10 || deltaY > 10) {
                    e.preventDefault();
                    setDraggedTicket(touchDragTicket.current);
                    
                    // Trouver la colonne sous le doigt
                    const element = document.elementFromPoint(touch.clientX, touch.clientY);
                    const column = element?.closest('.kanban-column');
                    if (column) {
                        const status = column.getAttribute('data-status');
                        setDragOverColumn(status);
                    }
                }
            };
            
            const handleTouchEnd = async (e) => {
                if (draggedTicket && dragOverColumn && draggedTicket.status !== dragOverColumn) {
                    await moveTicketToStatus(draggedTicket, dragOverColumn);
                }
                
                touchDragStart.current = null;
                touchDragTicket.current = null;
                setDraggedTicket(null);
                setDragOverColumn(null);
            };
            
            return React.createElement('div', { className: 'min-h-screen bg-gray-50' },
                // Modal de création
                React.createElement(CreateTicketModal, {
                    show: showCreateModal,
                    onClose: () => setShowCreateModal(false),
                    machines: machines,
                    onTicketCreated: onTicketCreated
                }),
                
                // Modal de détails avec galerie
                React.createElement(TicketDetailsModal, {
                    show: showDetailsModal,
                    onClose: () => {
                        setShowDetailsModal(false);
                        setSelectedTicketId(null);
                    },
                    ticketId: selectedTicketId
                }),
                
                // Header
                React.createElement('header', { className: 'bg-white shadow-lg border-b-4 border-igp-blue' },
                    React.createElement('div', { className: 'container mx-auto px-4 py-3' },
                        React.createElement('div', { className: 'flex justify-between items-center mb-4 md:mb-0 header-title' },
                            React.createElement('div', { className: 'flex items-center space-x-3' },
                                React.createElement('img', { 
                                    src: '/static/logo-igp.png', 
                                    alt: 'IGP Logo',
                                    className: 'h-12 md:h-16 w-auto object-contain'
                                }),
                                React.createElement('div', { className: 'border-l-2 border-gray-300 pl-3' },
                                    React.createElement('h1', { className: 'text-lg md:text-xl font-bold text-igp-blue' }, 'Système de Maintenance'),
                                    React.createElement('p', { className: 'text-xs md:text-sm text-gray-600' }, 
                                        'Les Produits Verriers International (IGP) Inc.'
                                    ),
                                    React.createElement('p', { className: 'text-xs text-igp-orange font-semibold' }, 
                                        tickets.length + ' tickets actifs'
                                    )
                                )
                            )
                        ),
                        React.createElement('div', { className: 'flex flex-col md:flex-row md:items-center space-y-2 md:space-y-0 md:space-x-4 header-actions' },
                            React.createElement('button', {
                                onClick: () => setShowCreateModal(true),
                                className: 'px-4 py-2 bg-igp-orange text-white rounded-md hover:bg-orange-700 font-semibold shadow-md transition-all'
                            },
                                React.createElement('i', { className: 'fas fa-plus mr-2' }),
                                'Nouvelle Demande'
                            ),
                            React.createElement('button', {
                                onClick: onRefresh,
                                className: 'px-4 py-2 bg-igp-blue text-white rounded-md hover:bg-blue-800 shadow-md transition-all'
                            },
                                React.createElement('i', { className: 'fas fa-sync-alt mr-2' }),
                                'Actualiser'
                            ),
                            React.createElement('button', {
                                onClick: onLogout,
                                className: 'px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 shadow-md transition-all'
                            },
                                React.createElement('i', { className: 'fas fa-sign-out-alt mr-2' }),
                                'Déconnexion'
                            )
                        )
                    )
                ),
                
                // Tableau Kanban
                React.createElement('div', { className: 'container mx-auto px-4 py-6' },
                    React.createElement('div', { className: 'kanban-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4' },
                        statuses.map(status => {
                            const isDragOver = dragOverColumn === status.key;
                            const columnClass = 'kanban-column' + (isDragOver ? ' drag-over' : '');
                            
                            return React.createElement('div', { 
                                key: status.key, 
                                className: columnClass,
                                'data-status': status.key,
                                onDragOver: (e) => handleDragOver(e, status.key),
                                onDragLeave: handleDragLeave,
                                onDrop: (e) => handleDrop(e, status.key)
                            },
                                React.createElement('div', { className: 'mb-4 flex items-center justify-between kanban-column-header' },
                                    React.createElement('div', { className: 'flex items-center' },
                                        React.createElement('i', { className: 'fas fa-' + status.icon + ' text-' + status.color + '-500 mr-2' }),
                                        React.createElement('h3', { className: 'font-bold text-gray-700 text-sm md:text-base' }, status.label)
                                    ),
                                    React.createElement('span', { 
                                        className: 'bg-' + status.color + '-100 text-' + status.color + '-800 text-xs font-semibold px-2 py-1 rounded-full'
                                    }, getTicketsByStatus(status.key).length)
                                ),
                                React.createElement('div', { className: 'space-y-3' },
                                    getTicketsByStatus(status.key).map(ticket => {
                                        return React.createElement('div', {
                                            key: ticket.id,
                                            className: 'ticket-card priority-' + ticket.priority + (draggedTicket?.id === ticket.id ? ' dragging' : ''),
                                            draggable: true,
                                            onClick: (e) => handleTicketClick(e, ticket),
                                            onDragStart: (e) => handleDragStart(e, ticket),
                                            onDragEnd: handleDragEnd,
                                            onTouchStart: (e) => handleTouchStart(e, ticket),
                                            onTouchMove: handleTouchMove,
                                            onTouchEnd: handleTouchEnd,
                                            onContextMenu: (e) => handleContextMenu(e, ticket),
                                            title: 'Cliquer pour détails | Glisser pour déplacer | Clic droit: menu'
                                        },
                                            React.createElement('div', { className: 'flex justify-between items-start mb-2' },
                                                React.createElement('span', { className: 'text-xs text-gray-500 font-mono' }, ticket.ticket_id),
                                                React.createElement('span', { 
                                                    className: 'text-xs px-2 py-1 rounded font-semibold ' + 
                                                    (ticket.priority === 'critical' ? 'bg-red-100 text-red-800' :
                                                     ticket.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                                                     ticket.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                                     'bg-green-100 text-green-800')
                                                }, 
                                                    ticket.priority === 'critical' ? 'CRITIQUE' :
                                                    ticket.priority === 'high' ? 'HAUTE' :
                                                    ticket.priority === 'medium' ? 'MOYENNE' :
                                                    'FAIBLE'
                                                )
                                            ),
                                            React.createElement('h4', { className: 'font-semibold text-gray-800 mb-1 text-sm' }, ticket.title),
                                            React.createElement('p', { className: 'text-xs text-gray-600 mb-2' }, ticket.machine_type + ' ' + ticket.model),
                                            // Afficher les médias attachés
                                            ticket.media_count > 0 && React.createElement('div', { className: 'mb-2 flex items-center text-xs text-igp-blue font-semibold' },
                                                React.createElement('i', { className: 'fas fa-camera mr-1' }),
                                                ticket.media_count + ' photo(s)/vidéo(s)'
                                            ),
                                            React.createElement('div', { className: 'flex items-center text-xs text-gray-500' },
                                                React.createElement('i', { className: 'far fa-clock mr-1' }),
                                                new Date(ticket.created_at).toLocaleDateString('fr-FR')
                                            )
                                        );
                                    })
                                )
                            );
                        })
                    )
                ),
                
                // Menu contextuel
                contextMenu && React.createElement('div', {
                    className: 'context-menu',
                    style: {
                        top: contextMenu.y + 'px',
                        left: contextMenu.x + 'px'
                    }
                },
                    React.createElement('div', { className: 'font-bold text-xs text-gray-500 px-3 py-2 border-b' },
                        'Déplacer vers:'
                    ),
                    statuses.map(status => {
                        const isCurrentStatus = status.key === contextMenu.ticket.status;
                        return React.createElement('div', {
                            key: status.key,
                            className: 'context-menu-item' + (isCurrentStatus ? ' bg-gray-100 cursor-not-allowed' : ''),
                            onClick: (e) => {
                                e.stopPropagation();
                                if (!isCurrentStatus) {
                                    moveTicketToStatus(contextMenu.ticket, status.key);
                                    setContextMenu(null);
                                }
                            }
                        },
                            React.createElement('i', { 
                                className: 'fas fa-' + status.icon + ' text-' + status.color + '-500 mr-2' 
                            }),
                            status.label,
                            isCurrentStatus && React.createElement('span', { className: 'ml-2 text-xs text-gray-400' }, '(actuel)')
                        );
                    })
                )
            );
        };
        
        // Démarrer l'application
        const root = ReactDOM.createRoot(document.getElementById('root'));
        root.render(React.createElement(App));
    </script>
</body>
</html>
  `);
});

// Route de santé
app.get('/api/health', (c) => {
  return c.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    version: '1.6.1'
  });
});

export default app;
