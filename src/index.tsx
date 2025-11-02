import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { authMiddleware, adminOnly, technicianOrAdmin } from './middlewares/auth';
import auth from './routes/auth';
import tickets from './routes/tickets';
import machines from './routes/machines';
import media from './routes/media';
import comments from './routes/comments';
import type { Bindings } from './types';

const app = new Hono<{ Bindings: Bindings }>();


app.use('/api/*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
}));


app.use('/api/auth/me', authMiddleware);


app.route('/api/auth', auth);


app.use('/api/tickets/*', authMiddleware);
app.route('/api/tickets', tickets);


app.use('/api/machines/*', authMiddleware);
app.route('/api/machines', machines);



app.route('/api/media', media);


app.route('/api/comments', comments);


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
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
    <script>
        tailwind.config = {
            theme: {
                extend: {
                    colors: {
                        'igp-blue': '#0A2463',
                        'igp-blue-light': '#1E3A8A',
                        'igp-blue-lighter': '#3B82F6',
                        'igp-orange': '#FB5607',
                        'igp-orange-light': '#FF6B35',
                        'igp-red': '#DC2626',
                        'igp-green': '#059669',
                        'igp-purple': '#7C3AED',
                        'igp-yellow': '#F59E0B',
                        'igp-gray': '#F8FAFC',
                        'igp-dark': '#0F172A',
                    },
                    fontFamily: {
                        'sans': ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
                    },
                    boxShadow: {
                        'premium': '0 10px 40px rgba(0, 0, 0, 0.08)',
                        'premium-lg': '0 20px 60px rgba(0, 0, 0, 0.12)',
                        'card': '0 2px 8px rgba(0, 0, 0, 0.04), 0 1px 2px rgba(0, 0, 0, 0.06)',
                        'card-hover': '0 8px 24px rgba(0, 0, 0, 0.12), 0 2px 6px rgba(0, 0, 0, 0.08)',
                    }
                }
            }
        }
    </script>
    <style>
        * {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
        }
        
        body {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
        }
        
        .kanban-column {
            min-height: 500px;
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(20px);
            border-radius: 16px;
            padding: 20px;
            border: 1px solid rgba(255, 255, 255, 0.3);
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .kanban-column:hover {
            transform: translateY(-2px);
            box-shadow: 0 12px 48px rgba(0, 0, 0, 0.15);
        }
        
        .ticket-card {
            background: white;
            border-radius: 12px;
            padding: 16px;
            margin-bottom: 12px;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04), 0 1px 2px rgba(0, 0, 0, 0.06);
            cursor: grab;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            user-select: none;
            -webkit-user-select: none;
            -webkit-tap-highlight-color: transparent;
            border: 1px solid rgba(0, 0, 0, 0.04);
            position: relative;
            overflow: hidden;
        }
        
        .ticket-card::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 3px;
            background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
            opacity: 0;
            transition: opacity 0.3s ease;
        }
        
        .ticket-card:hover::before {
            opacity: 1;
        }
        
        .ticket-card:hover {
            box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12), 0 2px 6px rgba(0, 0, 0, 0.08);
            transform: translateY(-4px) scale(1.01);
        }
        
        .ticket-card:active {
            cursor: grabbing;
            transform: scale(0.98);
        }
        
        .ticket-card.dragging {
            opacity: 0.6;
            cursor: grabbing;
            transform: rotate(3deg) scale(1.05);
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
        }
        .ticket-card.long-press-active {
            background: linear-gradient(135deg, #667eea15 0%, #764ba215 100%);
            box-shadow: 0 12px 32px rgba(102, 126, 234, 0.4);
            transform: scale(1.02);
        }
        
        .kanban-column.drag-over {
            background: rgba(219, 234, 254, 0.6);
            border: 2px dashed #3b82f6;
            transform: scale(1.02);
        }
        
        .kanban-column.drag-valid {
            background: rgba(209, 250, 229, 0.6);
            border: 2px dashed #10b981;
            box-shadow: 0 0 0 4px rgba(16, 185, 129, 0.1);
        }
        
        .kanban-column.drag-invalid {
            background: rgba(254, 226, 226, 0.6);
            border: 2px dashed #ef4444;
            box-shadow: 0 0 0 4px rgba(239, 68, 68, 0.1);
        }
        .priority-high {
            border-left: 4px solid #ef4444;
            background: linear-gradient(to right, rgba(239, 68, 68, 0.05) 0%, transparent 50%);
        }
        
        .priority-critical {
            border-left: 4px solid #dc2626;
            background: linear-gradient(to right, rgba(220, 38, 38, 0.08) 0%, transparent 50%);
            animation: pulse-critical 2s infinite;
        }
        
        @keyframes pulse-critical {
            0%, 100% { box-shadow: 0 2px 8px rgba(220, 38, 38, 0.1); }
            50% { box-shadow: 0 2px 16px rgba(220, 38, 38, 0.3); }
        }
        
        .priority-medium {
            border-left: 4px solid #f59e0b;
            background: linear-gradient(to right, rgba(245, 158, 11, 0.05) 0%, transparent 50%);
        }
        
        .priority-low {
            border-left: 4px solid #10b981;
            background: linear-gradient(to right, rgba(16, 185, 129, 0.05) 0%, transparent 50%);
        }
        .modal {
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(15, 23, 42, 0.75);
            backdrop-filter: blur(8px);
            z-index: 1000;
            overflow-y: auto;
            -webkit-overflow-scrolling: touch;
            animation: fadeIn 0.2s ease;
        }
        
        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }
        
        @keyframes slideUp {
            from { 
                opacity: 0;
                transform: translateY(20px) scale(0.95);
            }
            to { 
                opacity: 1;
                transform: translateY(0) scale(1);
            }
        }
        
        .modal.active {
            display: flex;
            align-items: flex-start;
            justify-content: center;
            padding: 20px 0;
        }
        
        .modal-content {
            animation: slideUp 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
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
            border-radius: 12px;
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2), 0 0 0 1px rgba(0, 0, 0, 0.05);
            z-index: 2000;
            min-width: 220px;
            padding: 8px;
            backdrop-filter: blur(20px);
            animation: slideUp 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .context-menu-item {
            padding: 12px 16px;
            cursor: pointer;
            display: flex;
            align-items: center;
            transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
            font-size: 14px;
            font-weight: 500;
            border-radius: 8px;
            position: relative;
        }
        
        .context-menu-item:hover {
            background: linear-gradient(135deg, #667eea15 0%, #764ba215 100%);
            transform: translateX(4px);
            padding-left: 20px;
        }
        
        .context-menu-item:active {
            background: linear-gradient(135deg, #667eea25 0%, #764ba225 100%);
            transform: scale(0.98);
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
        
        
        const getStatusLabel = (status) => {
            const statusLabels = {
                'received': 'Requête Reçue',
                'diagnostic': 'Diagnostic',
                'in_progress': 'En Cours',
                'waiting_parts': 'En Attente Pièces',
                'completed': 'Terminé',
                'archived': 'Archivé'
            };
            return statusLabels[status] || status;
        };
        
        
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
        
        
        const CreateTicketModal = ({ show, onClose, machines, onTicketCreated }) => {
            const [title, setTitle] = React.useState('');
            const [description, setDescription] = React.useState('');
            const [reporterName, setReporterName] = React.useState('');
            const [machineId, setMachineId] = React.useState('');
            const [priority, setPriority] = React.useState('medium');
            const [mediaFiles, setMediaFiles] = React.useState([]);
            const [mediaPreviews, setMediaPreviews] = React.useState([]);
            const [submitting, setSubmitting] = React.useState(false);
            const [uploadProgress, setUploadProgress] = React.useState(0);
            
            const handleFileChange = (e) => {
                const files = Array.from(e.target.files);
                setMediaFiles(prevFiles => [...prevFiles, ...files]);
                
                
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
                    
                    const response = await axios.post(API_URL + '/tickets', {
                        title,
                        description,
                        reporter_name: reporterName,
                        machine_id: parseInt(machineId),
                        priority
                    });
                    
                    const ticketId = response.data.ticket.id;
                    
                    
                    if (mediaFiles.length > 0) {
                        await uploadMediaFiles(ticketId);
                    }
                    
                    alert('Ticket créé avec succès !' + (mediaFiles.length > 0 ? ' (' + mediaFiles.length + ' média(s) uploadé(s))' : ''));
                    
                    
                    setTitle('');
                    setDescription('');
                    setReporterName('');
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
                    className: 'modal-content bg-white/95 backdrop-blur-2xl rounded-3xl p-6 md:p-10 max-w-3xl w-full mx-4 my-auto border border-white/20',
                    onClick: (e) => e.stopPropagation(),
                    style: { marginTop: 'auto', marginBottom: 'auto', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' }
                },
                    React.createElement('div', { className: 'flex justify-between items-center mb-8 pb-6 border-b-2 border-gradient-to-r from-igp-blue to-igp-orange' },
                        React.createElement('div', { className: 'flex items-center gap-3' },
                            React.createElement('div', { className: 'w-14 h-14 bg-gradient-to-br from-igp-orange to-igp-orange-light rounded-2xl flex items-center justify-center shadow-premium' },
                                React.createElement('i', { className: 'fas fa-plus-circle text-white text-2xl' })
                            ),
                            React.createElement('h2', { 
                                className: 'text-3xl font-bold bg-gradient-to-r from-igp-blue to-igp-orange bg-clip-text text-transparent',
                                style: { WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }
                            }, 'Nouvelle Demande')
                        ),
                        React.createElement('button', {
                            onClick: onClose,
                            className: 'w-10 h-10 flex items-center justify-center rounded-xl hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-all duration-200'
                        },
                            React.createElement('i', { className: 'fas fa-times text-xl' })
                        )
                    ),
                    React.createElement('form', { onSubmit: handleSubmit },
                        React.createElement('div', { className: 'mb-6' },
                            React.createElement('label', { className: 'flex items-center gap-2 text-gray-700 text-sm font-bold mb-3' },
                                React.createElement('i', { className: 'fas fa-heading text-igp-blue' }),
                                React.createElement('span', null, 'Titre du problème'),
                                React.createElement('span', { className: 'text-red-500' }, '*')
                            ),
                            React.createElement('input', {
                                type: 'text',
                                className: 'w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-igp-blue focus:border-igp-blue transition-all duration-200 font-medium',
                                value: title,
                                onChange: (e) => setTitle(e.target.value),
                                placeholder: 'Ex: Bruit anormal sur la machine',
                                required: true
                            })
                        ),
                        React.createElement('div', { className: 'mb-6' },
                            React.createElement('label', { className: 'flex items-center gap-2 text-gray-700 text-sm font-bold mb-3' },
                                React.createElement('i', { className: 'fas fa-align-left text-igp-blue' }),
                                React.createElement('span', null, 'Description détaillée'),
                                React.createElement('span', { className: 'text-red-500' }, '*')
                            ),
                            React.createElement('textarea', {
                                className: 'w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-igp-blue focus:border-igp-blue transition-all duration-200 font-medium resize-none',
                                value: description,
                                onChange: (e) => setDescription(e.target.value),
                                placeholder: 'Décrivez le problème en détail...',
                                rows: 4,
                                required: true
                            })
                        ),
                        React.createElement('div', { className: 'mb-4' },
                            React.createElement('label', { className: 'block text-gray-700 text-sm font-bold mb-2' },
                                React.createElement('i', { className: 'fas fa-user mr-2' }),
                                'Votre nom *'
                            ),
                            React.createElement('input', {
                                type: 'text',
                                className: 'w-full px-3 py-2 border-2 border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-igp-blue focus:border-transparent',
                                value: reporterName,
                                onChange: (e) => setReporterName(e.target.value),
                                placeholder: 'Ex: Jean Tremblay',
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
                            mediaPreviews.length > 0 ? React.createElement('div', { className: 'mt-3 grid grid-cols-3 gap-2' },
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
                            ) : null,
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
                        React.createElement('div', { className: 'flex justify-end gap-4 mt-8 pt-6 border-t-2 border-gray-100' },
                            React.createElement('button', {
                                type: 'button',
                                onClick: onClose,
                                className: 'px-8 py-3 border-2 border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50 hover:border-gray-300 font-semibold transition-all duration-200 hover:scale-105'
                            }, 
                                React.createElement('i', { className: 'fas fa-times mr-2' }),
                                React.createElement('span', null, 'Annuler')
                            ),
                            React.createElement('button', {
                                type: 'submit',
                                disabled: submitting,
                                className: 'group relative px-8 py-3 bg-gradient-to-r from-igp-orange to-igp-orange-light text-white rounded-xl hover:shadow-premium font-bold transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 overflow-hidden'
                            },
                                React.createElement('div', { 
                                    className: 'absolute inset-0 bg-white opacity-0 group-hover:opacity-20 transition-opacity'
                                }),
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
            ));
        };
        
        
        const TicketDetailsModal = ({ show, onClose, ticketId, currentUser, onTicketDeleted }) => {
            const [ticket, setTicket] = React.useState(null);
            const [loading, setLoading] = React.useState(true);
            const [selectedMedia, setSelectedMedia] = React.useState(null);
            const [comments, setComments] = React.useState([]);
            const [newComment, setNewComment] = React.useState('');
            const [commentAuthor, setCommentAuthor] = React.useState('');
            const [commentRole, setCommentRole] = React.useState('Opérateur');
            const [submittingComment, setSubmittingComment] = React.useState(false);
            const [uploadingMedia, setUploadingMedia] = React.useState(false);
            const [newMediaFiles, setNewMediaFiles] = React.useState([]);
            const [newMediaPreviews, setNewMediaPreviews] = React.useState([]);
            
            React.useEffect(() => {
                if (show && ticketId) {
                    loadTicketDetails();
                    loadComments();
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
            
            const loadComments = async () => {
                try {
                    const response = await axios.get(API_URL + '/comments/ticket/' + ticketId);
                    setComments(response.data.comments || []);
                } catch (error) {
                    console.error('Erreur chargement commentaires:', error);
                }
            };
            
            const handleDeleteTicket = async () => {
                if (!confirm('Êtes-vous sûr de vouloir supprimer ce ticket ? Cette action est irréversible.')) {
                    return;
                }
                
                try {
                    await axios.delete(API_URL + '/tickets/' + ticketId);
                    alert('Ticket supprimé avec succès');
                    onClose();
                    if (onTicketDeleted) onTicketDeleted();
                } catch (error) {
                    alert('Erreur lors de la suppression: ' + (error.response?.data?.error || 'Erreur inconnue'));
                }
            };
            
            const handleAddComment = async (e) => {
                e.preventDefault();
                if (!newComment.trim() || !commentAuthor.trim()) {
                    alert('Veuillez remplir votre nom et le commentaire');
                    return;
                }
                
                setSubmittingComment(true);
                try {
                    await axios.post(API_URL + '/comments', {
                        ticket_id: ticketId,
                        user_name: commentAuthor,
                        user_role: commentRole,
                        comment: newComment
                    });
                    
                    setNewComment('');
                    setCommentAuthor('');
                    loadComments();
                } catch (error) {
                    alert('Erreur lors de l\\'ajout du commentaire');
                } finally {
                    setSubmittingComment(false);
                }
            };
            
            const handleNewMediaChange = (e) => {
                const files = Array.from(e.target.files);
                setNewMediaFiles(prevFiles => [...prevFiles, ...files]);
                
                files.forEach(file => {
                    const reader = new FileReader();
                    reader.onloadend = () => {
                        setNewMediaPreviews(prev => [...prev, {
                            url: reader.result,
                            type: file.type,
                            name: file.name,
                            size: file.size
                        }]);
                    };
                    reader.readAsDataURL(file);
                });
            };
            
            const handleUploadNewMedia = async () => {
                if (newMediaFiles.length === 0) return;
                
                setUploadingMedia(true);
                try {
                    for (let i = 0; i < newMediaFiles.length; i++) {
                        const file = newMediaFiles[i];
                        const formData = new FormData();
                        formData.append('file', file);
                        formData.append('ticket_id', ticketId);
                        
                        await axios.post(API_URL + '/media/upload', formData, {
                            headers: { 'Content-Type': 'multipart/form-data' }
                        });
                    }
                    
                    alert('Médias ajoutés avec succès !');
                    setNewMediaFiles([]);
                    setNewMediaPreviews([]);
                    loadTicketDetails();
                } catch (error) {
                    alert('Erreur lors de l\\'upload des médias');
                } finally {
                    setUploadingMedia(false);
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
                        React.createElement('div', { className: 'flex gap-3' },
                            (ticket && currentUser && (
                                (currentUser.role === 'technician') || 
                                (currentUser.role === 'admin') ||
                                (currentUser.role === 'operator' && ticket.reported_by === currentUser.id)
                            )) ? React.createElement('button', {
                                onClick: handleDeleteTicket,
                                className: 'text-red-500 hover:text-red-700 transition-colors',
                                title: 'Supprimer ce ticket'
                            },
                                React.createElement('i', { className: 'fas fa-trash-alt fa-2x' })
                            ) : null,
                            React.createElement('button', {
                                onClick: onClose,
                                className: 'text-gray-500 hover:text-gray-700'
                            },
                                React.createElement('i', { className: 'fas fa-times fa-2x' })
                            )
                        )
                    ),
                    
                    loading ? React.createElement('div', { className: 'text-center py-8' },
                        React.createElement('i', { className: 'fas fa-spinner fa-spin fa-3x text-igp-blue' }),
                        React.createElement('p', { className: 'mt-4 text-gray-600' }, 'Chargement...')
                    ) : ticket ? React.createElement('div', {},
                        
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
                                    React.createElement('span', { className: 'text-gray-600' }, getStatusLabel(ticket.status))
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
                        
                        
                        (ticket.media && ticket.media.length > 0) ? React.createElement('div', { className: 'mb-6' },
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
                        ) : null,
                        
                        
                        (!ticket.media || ticket.media.length === 0) ? React.createElement('div', { className: 'mb-6 text-center py-8 bg-gray-50 rounded' },
                            React.createElement('i', { className: 'fas fa-camera text-gray-400 text-4xl mb-2' }),
                            React.createElement('p', { className: 'text-gray-500' }, 'Aucune photo ou vidéo attachée à ce ticket')
                        ) : null,
                        
                        
                        React.createElement('div', { className: 'mb-6 border-t-2 border-gray-200 pt-6' },
                            React.createElement('h4', { className: 'text-lg font-bold text-gray-800 mb-4 flex items-center' },
                                React.createElement('i', { className: 'fas fa-comments mr-2 text-igp-blue' }),
                                'Commentaires et Notes (' + comments.length + ')'
                            ),
                            
                            
                            comments.length > 0 ? React.createElement('div', { className: 'space-y-3 mb-4 max-h-64 overflow-y-auto' },
                                comments.map(comment =>
                                    React.createElement('div', { 
                                        key: comment.id,
                                        className: 'bg-gray-50 rounded-lg p-3 border-l-4 ' + 
                                                   (comment.user_role === 'Technicien' ? 'border-igp-orange' : 'border-igp-blue')
                                    },
                                        React.createElement('div', { className: 'flex justify-between items-start mb-2' },
                                            React.createElement('div', { className: 'flex items-center gap-2' },
                                                React.createElement('i', { 
                                                    className: 'fas ' + (comment.user_role === 'Technicien' ? 'fa-wrench' : 'fa-user') + ' text-sm text-gray-600'
                                                }),
                                                React.createElement('span', { className: 'font-semibold text-gray-800' }, comment.user_name),
                                                React.createElement('span', { className: 'text-xs text-gray-500 bg-gray-200 px-2 py-1 rounded' }, 
                                                    comment.user_role || 'Opérateur'
                                                )
                                            ),
                                            React.createElement('span', { className: 'text-xs text-gray-500' },
                                                new Date(comment.created_at).toLocaleString('fr-FR')
                                            )
                                        ),
                                        React.createElement('p', { className: 'text-gray-700 text-sm whitespace-pre-wrap' }, comment.comment)
                                    )
                                )
                            ) : React.createElement('div', { className: 'text-center py-6 bg-gray-50 rounded mb-4' },
                                React.createElement('i', { className: 'fas fa-comment-slash text-gray-400 text-3xl mb-2' }),
                                React.createElement('p', { className: 'text-gray-500 text-sm' }, 'Aucun commentaire pour le moment')
                            ),
                            
                            
                            React.createElement('form', { 
                                onSubmit: handleAddComment,
                                className: 'bg-blue-50 rounded-lg p-4 border-2 border-igp-blue'
                            },
                                React.createElement('h5', { className: 'font-semibold text-gray-800 mb-3 flex items-center' },
                                    React.createElement('i', { className: 'fas fa-plus-circle mr-2 text-igp-blue' }),
                                    'Ajouter un commentaire'
                                ),
                                
                                
                                React.createElement('div', { className: 'grid grid-cols-1 md:grid-cols-2 gap-3 mb-3' },
                                    React.createElement('div', {},
                                        React.createElement('label', { className: 'block text-sm font-semibold text-gray-700 mb-1' },
                                            React.createElement('i', { className: 'fas fa-user mr-1' }),
                                            'Votre nom *'
                                        ),
                                        React.createElement('input', {
                                            type: 'text',
                                            value: commentAuthor,
                                            onChange: (e) => setCommentAuthor(e.target.value),
                                            placeholder: 'Ex: Jean Tremblay',
                                            required: true,
                                            className: 'w-full px-3 py-2 border-2 border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-igp-blue focus:border-transparent'
                                        })
                                    ),
                                    React.createElement('div', {},
                                        React.createElement('label', { className: 'block text-sm font-semibold text-gray-700 mb-1' },
                                            React.createElement('i', { className: 'fas fa-user-tag mr-1' }),
                                            'Rôle'
                                        ),
                                        React.createElement('select', {
                                            value: commentRole,
                                            onChange: (e) => setCommentRole(e.target.value),
                                            className: 'w-full px-3 py-2 border-2 border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-igp-blue focus:border-transparent'
                                        },
                                            React.createElement('option', { value: 'Opérateur' }, '👨‍💼 Opérateur'),
                                            React.createElement('option', { value: 'Technicien' }, '🔧 Technicien')
                                        )
                                    )
                                ),
                                
                                
                                React.createElement('div', { className: 'mb-3' },
                                    React.createElement('label', { className: 'block text-sm font-semibold text-gray-700 mb-1' },
                                        React.createElement('i', { className: 'fas fa-comment mr-1' }),
                                        'Commentaire *'
                                    ),
                                    React.createElement('textarea', {
                                        value: newComment,
                                        onChange: (e) => setNewComment(e.target.value),
                                        placeholder: 'Ex: Pièce commandée, livraison prévue jeudi...',
                                        required: true,
                                        rows: 3,
                                        className: 'w-full px-3 py-2 border-2 border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-igp-blue focus:border-transparent resize-none'
                                    })
                                ),
                                
                                
                                React.createElement('button', {
                                    type: 'submit',
                                    disabled: submittingComment,
                                    className: 'w-full px-4 py-2 bg-igp-blue text-white rounded-md hover:bg-blue-800 transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed'
                                },
                                    submittingComment 
                                        ? React.createElement('span', {},
                                            React.createElement('i', { className: 'fas fa-spinner fa-spin mr-2' }),
                                            'Envoi en cours...'
                                        )
                                        : React.createElement('span', {},
                                            React.createElement('i', { className: 'fas fa-paper-plane mr-2' }),
                                            'Publier le commentaire'
                                        )
                                )
                            )
                        ),
                        
                        
                        React.createElement('div', { className: 'mb-6 border-t-2 border-gray-200 pt-6' },
                            React.createElement('h4', { className: 'text-lg font-bold text-gray-800 mb-4 flex items-center' },
                                React.createElement('i', { className: 'fas fa-camera-retro mr-2 text-igp-orange' }),
                                'Ajouter des photos/vidéos supplémentaires'
                            ),
                            
                            
                            newMediaPreviews.length > 0 ? React.createElement('div', { className: 'mb-4' },
                                React.createElement('p', { className: 'text-sm font-semibold text-gray-700 mb-2' },
                                    React.createElement('i', { className: 'fas fa-images mr-1' }),
                                    newMediaPreviews.length + ' fichier(s) sélectionné(s)'
                                ),
                                React.createElement('div', { className: 'grid grid-cols-2 md:grid-cols-4 gap-3 mb-3' },
                                    newMediaPreviews.map((preview, index) =>
                                        React.createElement('div', { 
                                            key: index,
                                            className: 'relative group'
                                        },
                                            preview.type.startsWith('image/')
                                                ? React.createElement('img', {
                                                    src: preview.url,
                                                    alt: preview.name,
                                                    className: 'w-full h-24 object-cover rounded border-2 border-igp-orange'
                                                })
                                                : React.createElement('div', { className: 'w-full h-24 bg-gray-200 rounded border-2 border-igp-orange flex items-center justify-center' },
                                                    React.createElement('i', { className: 'fas fa-video fa-2x text-gray-500' })
                                                ),
                                            React.createElement('button', {
                                                type: 'button',
                                                onClick: () => {
                                                    setNewMediaFiles(prevFiles => prevFiles.filter((_, i) => i !== index));
                                                    setNewMediaPreviews(prevPreviews => prevPreviews.filter((_, i) => i !== index));
                                                },
                                                className: 'absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-700 transition-all'
                                            },
                                                React.createElement('i', { className: 'fas fa-times text-xs' })
                                            ),
                                            React.createElement('div', { className: 'absolute bottom-1 left-1 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded max-w-full truncate' },
                                                preview.name
                                            )
                                        )
                                    )
                                ),
                                React.createElement('button', {
                                    onClick: handleUploadNewMedia,
                                    disabled: uploadingMedia,
                                    className: 'w-full px-4 py-2 bg-igp-orange text-white rounded-md hover:bg-orange-700 transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed'
                                },
                                    uploadingMedia
                                        ? React.createElement('span', {},
                                            React.createElement('i', { className: 'fas fa-spinner fa-spin mr-2' }),
                                            'Upload en cours...'
                                        )
                                        : React.createElement('span', {},
                                            React.createElement('i', { className: 'fas fa-cloud-upload-alt mr-2' }),
                                            'Uploader ces fichiers'
                                        )
                                )
                            ) : null,
                            
                            
                            React.createElement('div', { className: 'text-center' },
                                React.createElement('label', { 
                                    className: 'inline-block px-6 py-3 bg-gray-100 border-2 border-dashed border-gray-400 rounded-lg cursor-pointer hover:bg-gray-200 hover:border-igp-orange transition-all'
                                },
                                    React.createElement('input', {
                                        type: 'file',
                                        multiple: true,
                                        accept: 'image/*,video/*',
                                        onChange: handleNewMediaChange,
                                        className: 'hidden'
                                    }),
                                    React.createElement('i', { className: 'fas fa-plus-circle text-2xl text-igp-orange mb-2 block' }),
                                    React.createElement('span', { className: 'text-sm font-semibold text-gray-700' },
                                        'Cliquer pour sélectionner des fichiers'
                                    ),
                                    React.createElement('p', { className: 'text-xs text-gray-500 mt-1' },
                                        'Photos (JPG, PNG) ou vidéos (MP4, MOV)'
                                    )
                                )
                            )
                        ),
                        
                        
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
                
                
                selectedMedia ? React.createElement('div', {
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
                ) : null
            );
        };
        
        
        const MainApp = ({ tickets, machines, currentUser, onLogout, onRefresh, showCreateModal, setShowCreateModal, onTicketCreated }) => {
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
                
                if (e.type === 'click' && !e.defaultPrevented) {
                    setSelectedTicketId(ticket.id);
                    setShowDetailsModal(true);
                }
            };
            
            const handleContextMenu = (e, ticket) => {
                e.preventDefault();
                e.stopPropagation();
                
                
                if (currentUser && currentUser.role === 'operator') {
                    return;
                }
                
                
                const menuWidth = 200;
                const menuHeight = 300;
                let x = e.pageX || (e.touches && e.touches[0].pageX);
                let y = e.pageY || (e.touches && e.touches[0].pageY);
                
                
                if (x + menuWidth > window.innerWidth) {
                    x = window.innerWidth - menuWidth - 10;
                }
                
                
                if (y + menuHeight > window.innerHeight + window.scrollY) {
                    y = window.innerHeight + window.scrollY - menuHeight - 10;
                }
                
                setContextMenu({
                    x: x,
                    y: y,
                    ticket: ticket
                });
            };
            
            
            const [draggedTicket, setDraggedTicket] = React.useState(null);
            const [dragOverColumn, setDragOverColumn] = React.useState(null);
            
            
            const handleDragStart = (e, ticket) => {
                
                if (currentUser && currentUser.role === 'operator') {
                    e.preventDefault();
                    return;
                }
                
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
            
            
            const touchDragStart = React.useRef(null);
            const touchDragTicket = React.useRef(null);
            
            const handleTouchStart = (e, ticket) => {
                
                if (currentUser && currentUser.role === 'operator') {
                    return;
                }
                
                const touch = e.touches[0];
                touchDragStart.current = { x: touch.clientX, y: touch.clientY };
                touchDragTicket.current = ticket;
            };
            
            const handleTouchMove = (e) => {
                if (!touchDragStart.current || !touchDragTicket.current) return;
                
                const touch = e.touches[0];
                const deltaX = Math.abs(touch.clientX - touchDragStart.current.x);
                const deltaY = Math.abs(touch.clientY - touchDragStart.current.y);
                
                
                if (deltaX > 10 || deltaY > 10) {
                    e.preventDefault();
                    setDraggedTicket(touchDragTicket.current);
                    
                    
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
            
            return React.createElement('div', { className: 'min-h-screen' },
                
                React.createElement(CreateTicketModal, {
                    show: showCreateModal,
                    onClose: () => setShowCreateModal(false),
                    machines: machines,
                    onTicketCreated: onTicketCreated
                }),
                
                
                React.createElement(TicketDetailsModal, {
                    show: showDetailsModal,
                    onClose: () => {
                        setShowDetailsModal(false);
                        setSelectedTicketId(null);
                    },
                    ticketId: selectedTicketId,
                    currentUser: currentUser,
                    onTicketDeleted: () => {
                        setShowDetailsModal(false);
                        setSelectedTicketId(null);
                        onTicketCreated(); // Refresh ticket list
                    }
                }),
                
                
                React.createElement('header', { 
                    className: 'backdrop-blur-xl bg-white/90 shadow-premium border-b border-white/20',
                    style: { backdropFilter: 'blur(20px)' }
                },
                    React.createElement('div', { className: 'container mx-auto px-6 py-4' },
                        React.createElement('div', { className: 'flex flex-col md:flex-row justify-between items-start md:items-center gap-6' },
                            React.createElement('div', { className: 'flex items-center gap-4 w-full md:w-auto' },
                                React.createElement('div', { 
                                    className: 'bg-gradient-to-br from-igp-blue to-igp-blue-light p-3 rounded-2xl shadow-card'
                                },
                                    React.createElement('img', { 
                                        src: '/static/logo-igp.png', 
                                        alt: 'IGP Logo',
                                        className: 'h-12 md:h-14 w-auto object-contain brightness-0 invert'
                                    })
                                ),
                                React.createElement('div', { className: 'flex-1' },
                                    React.createElement('h1', { 
                                        className: 'text-2xl md:text-3xl font-bold bg-gradient-to-r from-igp-blue via-igp-blue-light to-igp-orange bg-clip-text text-transparent',
                                        style: { WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }
                                    }, 'Système de Maintenance'),
                                    React.createElement('p', { className: 'text-sm md:text-base text-gray-600 font-medium mt-1' }, 
                                        'Les Produits Verriers International Inc.'
                                    ),
                                    React.createElement('div', { className: 'flex items-center gap-3 mt-2' },
                                        React.createElement('div', { className: 'flex items-center gap-2 px-3 py-1 bg-gradient-to-r from-orange-50 to-orange-100 rounded-full' },
                                            React.createElement('div', { className: 'w-2 h-2 bg-igp-orange rounded-full animate-pulse' }),
                                            React.createElement('span', { className: 'text-xs font-bold text-igp-orange' }, 
                                                tickets.length + ' tickets actifs'
                                            )
                                        ),
                                        React.createElement('div', { className: 'flex items-center gap-2 px-3 py-1 bg-gradient-to-r from-green-50 to-emerald-100 rounded-full' },
                                            React.createElement('i', { className: 'fas fa-check-circle text-igp-green text-xs' }),
                                            React.createElement('span', { className: 'text-xs font-bold text-igp-green' }, 
                                                tickets.filter(t => t.status === 'completed').length + ' complétés'
                                            )
                                        )
                                    )
                                )
                            ),
                            React.createElement('div', { className: 'flex flex-wrap gap-3' },
                                React.createElement('button', {
                                    onClick: () => setShowCreateModal(true),
                                    className: 'group relative px-6 py-3 bg-gradient-to-r from-igp-orange to-igp-orange-light text-white rounded-xl hover:shadow-premium font-bold transition-all duration-300 hover:scale-105 overflow-hidden'
                                },
                                    React.createElement('div', { 
                                        className: 'absolute inset-0 bg-white opacity-0 group-hover:opacity-20 transition-opacity'
                                    }),
                                    React.createElement('i', { className: 'fas fa-plus mr-2' }),
                                    React.createElement('span', null, 'Nouvelle Demande')
                                ),
                                React.createElement('button', {
                                    onClick: onRefresh,
                                    className: 'px-5 py-3 bg-white/80 backdrop-blur-sm text-igp-blue border-2 border-igp-blue/20 rounded-xl hover:bg-white hover:border-igp-blue hover:shadow-card font-semibold transition-all duration-300 hover:scale-105'
                                },
                                    React.createElement('i', { className: 'fas fa-sync-alt mr-2' }),
                                    React.createElement('span', null, 'Actualiser')
                                ),
                                React.createElement('button', {
                                    onClick: onLogout,
                                    className: 'px-5 py-3 bg-white/60 backdrop-blur-sm text-gray-700 border-2 border-gray-200 rounded-xl hover:bg-white hover:border-gray-300 hover:shadow-card font-semibold transition-all duration-300'
                                },
                                    React.createElement('i', { className: 'fas fa-sign-out-alt mr-2' }),
                                    React.createElement('span', null, 'Déconnexion')
                                )
                            )
                        )
                    )
                ),
                
                
                React.createElement('div', { className: 'container mx-auto px-6 py-8' },
                    React.createElement('div', { className: 'kanban-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6' },
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
                                React.createElement('div', { className: 'mb-5 pb-4 border-b-2 border-gray-100' },
                                    React.createElement('div', { className: 'flex items-center justify-between' },
                                        React.createElement('div', { className: 'flex items-center gap-2' },
                                            React.createElement('div', { 
                                                className: 'w-10 h-10 rounded-xl bg-gradient-to-br from-' + status.color + '-400 to-' + status.color + '-600 flex items-center justify-center shadow-md'
                                            },
                                                React.createElement('i', { className: 'fas fa-' + status.icon + ' text-white text-sm' })
                                            ),
                                            React.createElement('h3', { className: 'font-bold text-gray-800 text-base' }, status.label)
                                        ),
                                        React.createElement('div', { 
                                            className: 'flex items-center justify-center w-8 h-8 bg-gradient-to-br from-' + status.color + '-50 to-' + status.color + '-100 text-' + status.color + '-700 text-sm font-bold rounded-lg shadow-sm'
                                        }, getTicketsByStatus(status.key).length)
                                    )
                                ),
                                React.createElement('div', { className: 'space-y-3' },
                                    getTicketsByStatus(status.key).map(ticket => {
                                        return React.createElement('div', {
                                            key: ticket.id,
                                            className: 'ticket-card priority-' + ticket.priority + (draggedTicket?.id === ticket.id ? ' dragging' : ''),
                                            draggable: currentUser && currentUser.role !== 'operator',
                                            onClick: (e) => handleTicketClick(e, ticket),
                                            onDragStart: (e) => handleDragStart(e, ticket),
                                            onDragEnd: handleDragEnd,
                                            onTouchStart: (e) => handleTouchStart(e, ticket),
                                            onTouchMove: handleTouchMove,
                                            onTouchEnd: handleTouchEnd,
                                            onContextMenu: (e) => handleContextMenu(e, ticket),
                                            title: currentUser && currentUser.role === 'operator' 
                                                ? 'Cliquer pour détails | Clic droit: menu' 
                                                : 'Cliquer pour détails | Glisser pour déplacer | Clic droit: menu'
                                        },
                                            React.createElement('div', { className: 'flex justify-between items-start mb-3' },
                                                React.createElement('span', { 
                                                    className: 'text-xs text-gray-400 font-mono font-bold tracking-wider'
                                                }, ticket.ticket_id),
                                                React.createElement('div', { 
                                                    className: 'flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-bold text-xs shadow-sm ' + 
                                                    (ticket.priority === 'critical' ? 'bg-gradient-to-r from-red-500 to-red-600 text-white' :
                                                     ticket.priority === 'high' ? 'bg-gradient-to-r from-orange-400 to-orange-500 text-white' :
                                                     ticket.priority === 'medium' ? 'bg-gradient-to-r from-yellow-400 to-amber-500 text-white' :
                                                     'bg-gradient-to-r from-green-400 to-emerald-500 text-white')
                                                }, 
                                                    React.createElement('span', null,
                                                        ticket.priority === 'critical' ? '🔴' :
                                                        ticket.priority === 'high' ? '🟠' :
                                                        ticket.priority === 'medium' ? '🟡' :
                                                        '🟢'
                                                    ),
                                                    React.createElement('span', null,
                                                        ticket.priority === 'critical' ? 'CRITIQUE' :
                                                        ticket.priority === 'high' ? 'HAUTE' :
                                                        ticket.priority === 'medium' ? 'MOYENNE' :
                                                        'FAIBLE'
                                                    )
                                                )
                                            ),
                                            React.createElement('h4', { className: 'font-bold text-gray-900 mb-2 text-base leading-tight' }, ticket.title),
                                            React.createElement('div', { className: 'flex items-center gap-2 mb-3 pb-3 border-b border-gray-100' },
                                                React.createElement('div', { className: 'flex items-center gap-1.5 px-2 py-1 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg flex-1' },
                                                    React.createElement('i', { className: 'fas fa-cog text-igp-blue text-xs' }),
                                                    React.createElement('span', { className: 'text-xs font-semibold text-gray-700 truncate' }, 
                                                        ticket.machine_type + ' ' + ticket.model
                                                    )
                                                )
                                            ),
                                            React.createElement('div', { className: 'flex items-center justify-between' },
                                                ticket.media_count > 0 ? React.createElement('div', { className: 'flex items-center gap-1.5 px-2 py-1 bg-purple-50 rounded-lg' },
                                                    React.createElement('i', { className: 'fas fa-images text-igp-purple text-xs' }),
                                                    React.createElement('span', { className: 'text-xs font-bold text-igp-purple' }, ticket.media_count)
                                                ) : React.createElement('div', null),
                                                React.createElement('div', { className: 'flex items-center gap-1.5 text-xs text-gray-500 font-medium' },
                                                    React.createElement('i', { className: 'far fa-clock' }),
                                                    React.createElement('span', null, new Date(ticket.created_at).toLocaleDateString('fr-FR'))
                                                )
                                            )
                                        );
                                    })
                                )
                            );
                        })
                    )
                ),
                
                
                contextMenu ? React.createElement('div', {
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
                            isCurrentStatus ? React.createElement('span', { className: 'ml-2 text-xs text-gray-400' }, '(actuel)') : null
                        );
                    })
                ) : null
            );
        };
        
        
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
                currentUser: currentUser,
                onLogout: logout,
                onRefresh: loadData,
                showCreateModal,
                setShowCreateModal,
                onTicketCreated: loadData
            });
        };
        
        
        const root = ReactDOM.createRoot(document.getElementById('root'));
        root.render(React.createElement(App));
    </script>
</body>
</html>
  `);
});


// Route de test simple
app.get('/test', (c) => {
  return c.html(`
<!DOCTYPE html>
<html>
<head>
    <title>Test Simple</title>
    <script crossorigin src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
    <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
</head>
<body>
    <div id="root"></div>
    <script>
        const App = () => {
            return React.createElement('div', { style: { padding: '20px', fontSize: '24px', fontFamily: 'Arial' } },
                'Hello World! React fonctionne! ✅'
            );
        };
        
        const root = ReactDOM.createRoot(document.getElementById('root'));
        root.render(React.createElement(App));
    </script>
</body>
</html>
  `);
});

app.get('/api/health', (c) => {
  return c.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    version: '1.8.0'
  });
});

export default app;
