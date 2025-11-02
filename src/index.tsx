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

// Routes des médias (protégées)
app.use('/api/media/*', authMiddleware);

app.route('/api/media', media);

// Servir les fichiers statiques depuis /static/*
app.use('/static/*', serveStatic({ root: './public' }));

// Page d'accueil avec interface React
app.get('/', (c) => {
  return c.html(`
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Système de Gestion de Maintenance Industrielle</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
    <script crossorigin src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
    <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
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
            cursor: pointer;
            transition: all 0.2s;
        }
        .ticket-card:hover {
            box-shadow: 0 4px 6px rgba(0,0,0,0.15);
            transform: translateY(-2px);
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
        }
        .modal.active {
            display: flex;
            align-items: center;
            justify-content: center;
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
            padding: 10px 16px;
            cursor: pointer;
            display: flex;
            align-items: center;
            transition: background 0.2s;
        }
        .context-menu-item:hover {
            background: #f3f4f6;
        }
        .context-menu-item i {
            margin-right: 8px;
            width: 20px;
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
            const [email, setEmail] = React.useState('admin@maintenance.com');
            const [password, setPassword] = React.useState('password123');
            
            const handleSubmit = (e) => {
                e.preventDefault();
                onLogin(email, password);
            };
            
            return React.createElement('div', { className: 'min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600' },
                React.createElement('div', { className: 'bg-white p-8 rounded-lg shadow-2xl w-96' },
                    React.createElement('div', { className: 'text-center mb-8' },
                        React.createElement('i', { className: 'fas fa-tools fa-4x text-blue-500 mb-4' }),
                        React.createElement('h1', { className: 'text-2xl font-bold text-gray-800' }, 'Gestion de Maintenance'),
                        React.createElement('p', { className: 'text-gray-600' }, 'Connexion au système')
                    ),
                    React.createElement('form', { onSubmit: handleSubmit },
                        React.createElement('div', { className: 'mb-4' },
                            React.createElement('label', { className: 'block text-gray-700 text-sm font-bold mb-2' }, 'Email'),
                            React.createElement('input', {
                                type: 'email',
                                className: 'w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500',
                                value: email,
                                onChange: (e) => setEmail(e.target.value),
                                required: true
                            })
                        ),
                        React.createElement('div', { className: 'mb-6' },
                            React.createElement('label', { className: 'block text-gray-700 text-sm font-bold mb-2' }, 'Mot de passe'),
                            React.createElement('input', {
                                type: 'password',
                                className: 'w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500',
                                value: password,
                                onChange: (e) => setPassword(e.target.value),
                                required: true
                            })
                        ),
                        React.createElement('button', {
                            type: 'submit',
                            className: 'w-full bg-blue-500 text-white font-bold py-2 px-4 rounded-md hover:bg-blue-600 transition duration-200'
                        }, 'Se connecter')
                    ),
                    React.createElement('div', { className: 'mt-4 text-sm text-gray-600 text-center' },
                        React.createElement('p', {}, 'Comptes de test:'),
                        React.createElement('p', {}, 'admin@maintenance.com'),
                        React.createElement('p', {}, 'operator@maintenance.com')
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
            const [submitting, setSubmitting] = React.useState(false);
            
            const handleSubmit = async (e) => {
                e.preventDefault();
                setSubmitting(true);
                
                try {
                    await axios.post(API_URL + '/tickets', {
                        title,
                        description,
                        machine_id: parseInt(machineId),
                        priority
                    });
                    
                    alert('Ticket créé avec succès !');
                    setTitle('');
                    setDescription('');
                    setMachineId('');
                    setPriority('medium');
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
                    className: 'bg-white rounded-lg p-8 max-w-2xl w-full mx-4',
                    onClick: (e) => e.stopPropagation()
                },
                    React.createElement('div', { className: 'flex justify-between items-center mb-6' },
                        React.createElement('h2', { className: 'text-2xl font-bold text-gray-800' },
                            React.createElement('i', { className: 'fas fa-plus-circle mr-2 text-blue-500' }),
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
                                className: 'w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500',
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
                                className: 'w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500',
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
                                className: 'w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500',
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
                                        className: 'px-4 py-2 rounded-md text-sm font-semibold ' + 
                                            (priority === p 
                                                ? 'bg-blue-500 text-white' 
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
                        React.createElement('div', { className: 'flex justify-end space-x-4' },
                            React.createElement('button', {
                                type: 'button',
                                onClick: onClose,
                                className: 'px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100'
                            }, 'Annuler'),
                            React.createElement('button', {
                                type: 'submit',
                                disabled: submitting,
                                className: 'px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-gray-400'
                            },
                                submitting 
                                    ? React.createElement('i', { className: 'fas fa-spinner fa-spin mr-2' })
                                    : React.createElement('i', { className: 'fas fa-check mr-2' }),
                                submitting ? 'Création...' : 'Créer le ticket'
                            )
                        )
                    )
                )
            );
        };
        
        // Application principale
        const MainApp = ({ tickets, machines, onLogout, onRefresh, showCreateModal, setShowCreateModal, onTicketCreated }) => {
            const [contextMenu, setContextMenu] = React.useState(null);
            
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
            
            const handleContextMenu = (e, ticket) => {
                e.preventDefault();
                e.stopPropagation();
                setContextMenu({
                    x: e.pageX,
                    y: e.pageY,
                    ticket: ticket
                });
            };
            
            return React.createElement('div', { className: 'min-h-screen bg-gray-50' },
                // Modal de création
                React.createElement(CreateTicketModal, {
                    show: showCreateModal,
                    onClose: () => setShowCreateModal(false),
                    machines: machines,
                    onTicketCreated: onTicketCreated
                }),
                
                // Header
                React.createElement('header', { className: 'bg-white shadow-md' },
                    React.createElement('div', { className: 'container mx-auto px-4 py-4 flex justify-between items-center' },
                        React.createElement('div', { className: 'flex items-center' },
                            React.createElement('i', { className: 'fas fa-tools text-3xl text-blue-500 mr-3' }),
                            React.createElement('div', {},
                                React.createElement('h1', { className: 'text-2xl font-bold text-gray-800' }, 'Gestion de Maintenance'),
                                React.createElement('p', { className: 'text-sm text-gray-600' }, tickets.length + ' tickets actifs')
                            )
                        ),
                        React.createElement('div', { className: 'flex items-center space-x-4' },
                            React.createElement('button', {
                                onClick: () => setShowCreateModal(true),
                                className: 'px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 font-semibold'
                            },
                                React.createElement('i', { className: 'fas fa-plus mr-2' }),
                                'Nouvelle Demande'
                            ),
                            React.createElement('button', {
                                onClick: onRefresh,
                                className: 'px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600'
                            },
                                React.createElement('i', { className: 'fas fa-sync-alt mr-2' }),
                                'Actualiser'
                            ),
                            React.createElement('button', {
                                onClick: onLogout,
                                className: 'px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600'
                            },
                                React.createElement('i', { className: 'fas fa-sign-out-alt mr-2' }),
                                'Déconnexion'
                            )
                        )
                    )
                ),
                
                // Tableau Kanban
                React.createElement('div', { className: 'container mx-auto px-4 py-6' },
                    React.createElement('div', { className: 'grid grid-cols-6 gap-4' },
                        statuses.map(status =>
                            React.createElement('div', { key: status.key, className: 'kanban-column' },
                                React.createElement('div', { className: 'mb-4 flex items-center justify-between' },
                                    React.createElement('div', { className: 'flex items-center' },
                                        React.createElement('i', { className: 'fas fa-' + status.icon + ' text-' + status.color + '-500 mr-2' }),
                                        React.createElement('h3', { className: 'font-bold text-gray-700' }, status.label)
                                    ),
                                    React.createElement('span', { 
                                        className: 'bg-' + status.color + '-100 text-' + status.color + '-800 text-xs font-semibold px-2 py-1 rounded-full'
                                    }, getTicketsByStatus(status.key).length)
                                ),
                                React.createElement('div', { className: 'space-y-3' },
                                    getTicketsByStatus(status.key).map(ticket =>
                                        React.createElement('div', {
                                            key: ticket.id,
                                            className: 'ticket-card priority-' + ticket.priority,
                                            onClick: (e) => moveTicketToNext(ticket, e),
                                            onContextMenu: (e) => handleContextMenu(e, ticket),
                                            title: 'Clic gauche: colonne suivante | Clic droit: choisir le statut'
                                        },
                                            React.createElement('div', { className: 'flex justify-between items-start mb-2' },
                                                React.createElement('span', { className: 'text-xs text-gray-500 font-mono' }, ticket.ticket_id),
                                                React.createElement('span', { 
                                                    className: 'text-xs px-2 py-1 rounded ' + 
                                                    (ticket.priority === 'critical' ? 'bg-red-100 text-red-800' :
                                                     ticket.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                                                     ticket.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                                     'bg-green-100 text-green-800')
                                                }, ticket.priority.toUpperCase())
                                            ),
                                            React.createElement('h4', { className: 'font-semibold text-gray-800 mb-1 text-sm' }, ticket.title),
                                            React.createElement('p', { className: 'text-xs text-gray-600 mb-2' }, ticket.machine_type + ' ' + ticket.model),
                                            React.createElement('div', { className: 'flex items-center text-xs text-gray-500' },
                                                React.createElement('i', { className: 'far fa-clock mr-1' }),
                                                new Date(ticket.created_at).toLocaleDateString('fr-FR')
                                            )
                                        )
                                    )
                                )
                            )
                        )
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
    version: '1.2.0'
  });
});

export default app;
