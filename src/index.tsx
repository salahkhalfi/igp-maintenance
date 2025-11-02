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

// Routes publiques d'authentification
app.route('/api/auth', auth);

// Routes protégées - nécessitent une authentification
app.use('/api/tickets/*', authMiddleware);
app.use('/api/machines/*', authMiddleware);
app.use('/api/media/*', authMiddleware);

// Routes des tickets
app.route('/api/tickets', tickets);

// Routes des machines (création/modification/suppression réservées aux admins)
app.get('/api/machines', async (c) => machines.fetch(c.req.raw, c.env));
app.get('/api/machines/:id', async (c) => machines.fetch(c.req.raw, c.env));
app.post('/api/machines', adminOnly, async (c) => machines.fetch(c.req.raw, c.env));
app.patch('/api/machines/:id', adminOnly, async (c) => machines.fetch(c.req.raw, c.env));
app.delete('/api/machines/:id', adminOnly, async (c) => machines.fetch(c.req.raw, c.env));

// Routes des médias
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
    <script src="https://cdn.jsdelivr.net/npm/@hello-pangea/dnd@16.5.0/dist/dnd.umd.js"></script>
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
        }
        .ticket-card:active {
            cursor: grabbing;
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
    </style>
</head>
<body class="bg-gray-50">
    <div id="root"></div>
    
    <script>
        // Application React chargée depuis le fichier séparé
        // Pour le développement initial, l'interface est directement dans le HTML
        
        const API_URL = '/api';
        let authToken = localStorage.getItem('auth_token');
        let currentUser = null;
        
        // Configuration Axios
        if (authToken) {
            axios.defaults.headers.common['Authorization'] = 'Bearer ' + authToken;
        }
        
        // Application principale
        const App = () => {
            const [isLoggedIn, setIsLoggedIn] = React.useState(!!authToken);
            const [tickets, setTickets] = React.useState([]);
            const [loading, setLoading] = React.useState(true);
            
            React.useEffect(() => {
                if (isLoggedIn) {
                    loadTickets();
                }
            }, [isLoggedIn]);
            
            const loadTickets = async () => {
                try {
                    const response = await axios.get(API_URL + '/tickets');
                    setTickets(response.data.tickets);
                    setLoading(false);
                } catch (error) {
                    console.error('Erreur chargement tickets:', error);
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
                onLogout: logout,
                onRefresh: loadTickets
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
                        React.createElement('p', {}, 'Compte de test:'),
                        React.createElement('p', {}, 'admin@maintenance.com / password123')
                    )
                )
            );
        };
        
        // Application principale avec tableau Kanban
        const MainApp = ({ tickets, onLogout, onRefresh }) => {
            const [localTickets, setLocalTickets] = React.useState(tickets);
            const [isDragging, setIsDragging] = React.useState(false);
            
            React.useEffect(() => {
                setLocalTickets(tickets);
            }, [tickets]);
            
            const statuses = [
                { key: 'received', label: 'Requête Reçue', icon: 'inbox', color: 'blue' },
                { key: 'diagnostic', label: 'Diagnostic', icon: 'search', color: 'yellow' },
                { key: 'in_progress', label: 'En Cours', icon: 'wrench', color: 'orange' },
                { key: 'waiting_parts', label: 'En Attente Pièces', icon: 'clock', color: 'purple' },
                { key: 'completed', label: 'Terminé', icon: 'check-circle', color: 'green' },
                { key: 'archived', label: 'Archivé', icon: 'archive', color: 'gray' }
            ];
            
            const getTicketsByStatus = (status) => {
                return localTickets.filter(t => t.status === status);
            };
            
            const handleDragEnd = async (result) => {
                setIsDragging(false);
                
                if (!result.destination) {
                    return;
                }
                
                const ticketId = parseInt(result.draggableId.replace('ticket-', ''));
                const newStatus = result.destination.droppableId;
                const oldStatus = result.source.droppableId;
                
                if (newStatus === oldStatus) {
                    return;
                }
                
                // Mise à jour optimiste de l'interface
                setLocalTickets(prevTickets => 
                    prevTickets.map(ticket => 
                        ticket.id === ticketId 
                            ? { ...ticket, status: newStatus }
                            : ticket
                    )
                );
                
                // Mise à jour sur le serveur
                try {
                    await axios.patch(API_URL + '/tickets/' + ticketId, {
                        status: newStatus,
                        comment: 'Déplacement de ' + oldStatus + ' vers ' + newStatus
                    });
                } catch (error) {
                    console.error('Erreur mise à jour ticket:', error);
                    // Rollback en cas d'erreur
                    setLocalTickets(tickets);
                    alert('Erreur lors du déplacement du ticket');
                }
            };
            
            const handleDragStart = () => {
                setIsDragging(true);
            };
            
            return React.createElement('div', { className: 'min-h-screen bg-gray-50' },
                // Header
                React.createElement('header', { className: 'bg-white shadow-md' },
                    React.createElement('div', { className: 'container mx-auto px-4 py-4 flex justify-between items-center' },
                        React.createElement('div', { className: 'flex items-center' },
                            React.createElement('i', { className: 'fas fa-tools text-3xl text-blue-500 mr-3' }),
                            React.createElement('h1', { className: 'text-2xl font-bold text-gray-800' }, 'Gestion de Maintenance')
                        ),
                        React.createElement('div', { className: 'flex items-center space-x-4' },
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
                
                // Tableau Kanban avec Drag & Drop
                React.createElement('div', { className: 'container mx-auto px-4 py-6' },
                    React.createElement(window.DragDropContext.DragDropContext, { onDragEnd: handleDragEnd, onDragStart: handleDragStart },
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
                                    React.createElement(window.DragDropContext.Droppable, { droppableId: status.key }, (provided, snapshot) =>
                                        React.createElement('div', 
                                            Object.assign({
                                                ref: provided.innerRef,
                                                className: 'space-y-3 min-h-[300px] ' + (snapshot.isDraggingOver ? 'bg-blue-50 rounded-lg' : ''),
                                                style: {
                                                    minHeight: '300px',
                                                    transition: 'background-color 0.2s ease'
                                                }
                                            }, provided.droppableProps),
                                            getTicketsByStatus(status.key).map((ticket, index) =>
                                                React.createElement(window.DragDropContext.Draggable, { 
                                                    key: ticket.id, 
                                                    draggableId: 'ticket-' + ticket.id, 
                                                    index: index 
                                                }, (provided, snapshot) =>
                                                    React.createElement('div',
                                                        Object.assign({
                                                            ref: provided.innerRef,
                                                            className: 'ticket-card priority-' + ticket.priority + (snapshot.isDragging ? ' shadow-2xl' : ''),
                                                            style: Object.assign({}, provided.draggableProps.style, {
                                                                cursor: isDragging ? 'grabbing' : 'grab'
                                                            })
                                                        }, provided.draggableProps, provided.dragHandleProps),
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
                                            ),
                                            provided.placeholder
                                        )
                                    )
                                )
                            )
                        )
                    )
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

// Route de santé pour vérifier que l'API fonctionne
app.get('/api/health', (c) => {
  return c.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

export default app;
