const ProductionPlanning = ({ onClose }) => {
    // État pour le mois affiché (Initialisé à Décembre 2025)
    const [currentDate, setCurrentDate] = React.useState(new Date(2025, 11, 1));

    const getMonthName = (date) => {
        return date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
    };

    const handlePrevMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    };

    const handleNextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    };
    
    const [activeFilter, setActiveFilter] = React.useState('all');
    
    // CATEGORIES STATE
    const [categories, setCategories] = React.useState([
        { id: 'cut', label: 'Mise en Prod', icon: 'fa-layer-group', color: 'blue' },
        { id: 'ship', label: 'Expéditions', icon: 'fa-truck', color: 'green' },
        { id: 'maintenance', label: 'Maintenance', icon: 'fa-tools', color: 'red' },
        { id: 'reminder', label: 'Rappel / Note', icon: 'fa-info-circle', color: 'yellow' },
        { id: 'blocked', label: 'Bloqué', icon: 'fa-ban', color: 'red' } // Added default blocked category
    ]);
    const [showCategoryModal, setShowCategoryModal] = React.useState(false);
    const [editingCategory, setEditingCategory] = React.useState(null);

    // HELPERS FOR STYLES & ICONS
    const getCategoryStyle = (type, status) => {
        const cat = categories.find(c => c.id === type);
        const color = cat ? cat.color : 'gray';
        const isTentative = status === 'tentative';
        
        const themes = {
            blue: 'bg-blue-50 text-blue-900 border-blue-600',
            green: 'bg-green-50 text-green-900 border-green-600',
            red: 'bg-red-50 text-red-900 border-red-600',
            yellow: 'bg-yellow-50 text-yellow-900 border-yellow-500',
            purple: 'bg-purple-50 text-purple-900 border-purple-600',
            orange: 'bg-orange-50 text-orange-900 border-orange-600',
            gray: 'bg-gray-100 text-gray-800 border-gray-400'
        };
        
        const base = themes[color] || themes.gray;
        return isTentative ? `${base} border-dashed opacity-80 border-l-4` : `${base} border-solid border-l-4`;
    };

    const getCategoryIcon = (type) => {
        const cat = categories.find(c => c.id === type);
        return cat ? cat.icon : 'fa-circle';
    };

    // Handle Save Category (Add or Update)
    const handleSaveCategory = (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        
        if (editingCategory) {
            // UPDATE EXISTING
            setCategories(categories.map(c => 
                c.id === editingCategory.id ? {
                    ...c,
                    label: formData.get('label'),
                    color: formData.get('color'),
                    icon: formData.get('icon')
                } : c
            ));
            setEditingCategory(null);
        } else {
            // CREATE NEW
            const newCat = {
                id: 'cat_' + Date.now(),
                label: formData.get('label'),
                color: formData.get('color'),
                icon: formData.get('icon')
            };
            setCategories([...categories, newCat]);
        }
        e.target.reset();
    };

    // Handle Edit Click
    const handleEditCategoryClick = (cat) => {
        setEditingCategory(cat);
    };

    // Handle Cancel Edit
    const handleCancelEdit = () => {
        setEditingCategory(null);
    };

    // Handle Delete Category
    const handleDeleteCategory = (id) => {
        if (confirm('Supprimer cette catégorie ? Les événements existants perdront leur style.')) {
            setCategories(categories.filter(c => c.id !== id));
            if (editingCategory && editingCategory.id === id) {
                setEditingCategory(null);
            }
        }
    };
    // Format date: "YYYY-MM-DD"
    const [events, setEvents] = React.useState([
        // DÉCEMBRE 2025 (SEMAINE 1)
        { id: 101, date: '2025-12-01', type: 'cut', status: 'confirmed', title: 'Coupe: Vitrerie MTL (#4402)', details: '6mm Clair - 50 feuilles' },
        { id: 102, date: '2025-12-02', type: 'cut', status: 'confirmed', title: 'Coupe: Projet Gym', details: 'Miroir 6mm - Joint poli' },
        { id: 103, date: '2025-12-03', type: 'ship', status: 'confirmed', title: 'LIVRAISON: Tour Condo', details: '2 Chevalets - Camion A' },
        { id: 104, date: '2025-12-03', type: 'cut', status: 'tentative', title: 'Coupe: Douches B.Dépôt', details: 'En attente verre 10mm' },
        
        // DÉCEMBRE 2025 (SEMAINE 2)
        { id: 105, date: '2025-12-08', type: 'cut', status: 'confirmed', title: 'Coupe: Lot Douches', details: 'Bain Dépôt - Urgent' },
        { id: 106, date: '2025-12-09', type: 'maintenance', status: 'confirmed', title: 'ARRÊT FOUR (8h-12h)', details: 'Maint. Préventive' },
        { id: 107, date: '2025-12-10', type: 'ship', status: 'confirmed', title: 'LIVRAISON: Vitrerie MTL', details: 'Commande #4402' },
        { id: 108, date: '2025-12-11', type: 'reminder', status: 'info', title: 'Arrivage: Caisse Jumbo', details: 'Verre Low-E - Quai 2' },
        { id: 109, date: '2025-12-12', type: 'ship', status: 'tentative', title: 'LIVRAISON: Bain Dépôt', details: 'À confirmer avec client' },

        // DÉCEMBRE 2025 (SEMAINE 3)
        { id: 110, date: '2025-12-15', type: 'cut', status: 'confirmed', title: 'Coupe: Garde-corps Stade', details: '12mm Trempé - 200mc' },
        { id: 111, date: '2025-12-16', type: 'cut', status: 'confirmed', title: 'Coupe: Projet Bureau', details: 'Cloisons verre' },
        { id: 112, date: '2025-12-18', type: 'reminder', status: 'info', title: 'Inventaire Fin d\'année', details: 'Préparer feuilles comptage' },
        { id: 113, date: '2025-12-19', type: 'ship', status: 'confirmed', title: 'LIVRAISON: Garde-corps', details: 'Chantier Stade Olympique' },

        // JANVIER 2026 (Exemple)
        { id: 201, date: '2026-01-05', type: 'cut', status: 'confirmed', title: 'Reprise Production', details: 'Retour congés' }
    ]);

    // État pour le Drag & Drop
    const [draggedEventId, setDraggedEventId] = React.useState(null);
    // Toggle Sidebar Mobile
    const [showMobileNotes, setShowMobileNotes] = React.useState(false);
    
    // NOTIFICATIONS SYSTEM
    const [notificationPerm, setNotificationPerm] = React.useState(
        typeof Notification !== 'undefined' ? Notification.permission : 'default'
    );

    const requestNotificationPermission = () => {
        if (!('Notification' in window)) {
            alert("Ce navigateur ne supporte pas les notifications desktop");
            return;
        }
        Notification.requestPermission().then(permission => {
            setNotificationPerm(permission);
            if (permission === 'granted') {
                new Notification("Notifications activées", {
                    body: "Vous recevrez désormais des alertes pour vos tâches.",
                    icon: "/favicon.ico"
                });
            }
        });
    };

    // Liste "Aide-Mémoire"
    const [plannerNotes, setPlannerNotes] = React.useState([
        { id: 1, text: 'Vérifier dispo chevalets L', time: '10:00', done: false, priority: 'high', notified: false },
        { id: 2, text: 'Confirmer rdv transporteur', time: '14:30', done: true, priority: 'medium', notified: true },
        { id: 3, text: 'Relancer fournisseur', time: '', done: false, priority: 'high', notified: false },
    ]);

    // Vérification périodique des rappels (toutes les 30 secondes)
    React.useEffect(() => {
        if (notificationPerm !== 'granted') return;

        const interval = setInterval(() => {
            const now = new Date();
            const currentHours = String(now.getHours()).padStart(2, '0');
            const currentMinutes = String(now.getMinutes()).padStart(2, '0');
            const currentTime = `${currentHours}:${currentMinutes}`;

            setPlannerNotes(prevNotes => prevNotes.map(note => {
                if (!note.done && !note.notified && note.time === currentTime) {
                    // TRIGGER NOTIFICATION
                    new Notification("Rappel IGP Production", {
                        body: note.text,
                        icon: "https://cdn-icons-png.flaticon.com/512/1028/1028918.png" // Generic warning icon
                    });
                    // Jouer un petit son (optionnel)
                    // const audio = new Audio('/static/alert.mp3'); audio.play().catch(e => {});
                    
                    return { ...note, notified: true };
                }
                return note;
            }));
        }, 30000);

        return () => clearInterval(interval);
    }, [notificationPerm]);

    // Add Note Handler
    const handleAddNote = (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const text = formData.get('text');
        const time = formData.get('time');
        if (!text) return;

        const newNote = {
            id: Date.now(),
            text: text,
            time: time, // "HH:MM"
            done: false,
            priority: 'medium',
            notified: false
        };
        setPlannerNotes([...plannerNotes, newNote]);
        e.target.reset();
    };

    // Toggle Note Done
    const toggleNote = (id) => {
        setPlannerNotes(plannerNotes.map(n => n.id === id ? { ...n, done: !n.done } : n));
    };

    // Delete Note
    const deleteNote = (id) => {
        setPlannerNotes(plannerNotes.filter(n => n.id !== id));
    };

    // Add/Edit Modal State
    const [showAddModal, setShowAddModal] = React.useState(false);
    const [selectedEvent, setSelectedEvent] = React.useState(null); // null = mode création
    const [newEventDate, setNewEventDate] = React.useState(''); // Format "YYYY-MM-DD"

    // Open Edit Modal
    const handleEditEventClick = (e, evt) => {
        e.stopPropagation(); // Empêcher le déclenchement du drag start si on clique
        setSelectedEvent(evt);
        setNewEventDate(evt.date);
        setShowAddModal(true);
    };

    // Handle Add/Update Event
    const handleSaveEvent = (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const dateVal = formData.get('date'); // "YYYY-MM-DD"
        
        if (selectedEvent) {
            // MODE MODIFICATION
            setEvents(prevEvents => prevEvents.map(evt => {
                if (evt.id === selectedEvent.id) {
                    return {
                        ...evt,
                        date: dateVal,
                        type: formData.get('type'),
                        title: formData.get('title'),
                        details: formData.get('details')
                    };
                }
                return evt;
            }));
        } else {
            // MODE CRÉATION
            const newEvent = {
                id: Date.now(),
                date: dateVal,
                type: formData.get('type'),
                status: 'confirmed',
                title: formData.get('title'),
                details: formData.get('details')
            };
            setEvents([...events, newEvent]);
        }
        setShowAddModal(false);
        setSelectedEvent(null);
    };

    // Handle Delete Event
    const handleDeleteEvent = () => {
        if (selectedEvent) {
            setEvents(prevEvents => prevEvents.filter(evt => evt.id !== selectedEvent.id));
            setShowAddModal(false);
            setSelectedEvent(null);
        }
    };

    // Gestion du Drag
    const handleDragStart = (e, eventId) => {
        setDraggedEventId(eventId);
        e.dataTransfer.effectAllowed = 'move';
        // Petite astuce pour l'image fantôme (optionnel)
        e.target.style.opacity = '0.5';
    };

    const handleDragEnd = (e) => {
        e.target.style.opacity = '1';
        setDraggedEventId(null);
    };

    const handleDragOver = (e) => {
        e.preventDefault(); // Nécessaire pour autoriser le Drop
        e.dataTransfer.dropEffect = 'move';
    };

    const handleDrop = (e, targetDate) => {
        e.preventDefault();
        if (!draggedEventId || !targetDate) return;

        setEvents(prevEvents => prevEvents.map(evt => {
            if (evt.id === draggedEventId) {
                return { ...evt, date: targetDate };
            }
            return evt;
        }));
    };

    // Liste "Aide-Mémoire"
    // (Déplacé dans le state plus haut pour être mutable)
    
    // Génération de la grille dynamique
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth(); // 0-11
    const daysInMonth = new Date(year, month + 1, 0).getDate(); // Nombre de jours
    
    // Générer les jours du mois actuel
    const days = Array.from({ length: daysInMonth }, (_, i) => {
        const dayNum = i + 1;
        const dateObj = new Date(year, month, dayNum);
        // Format YYYY-MM-DD local (attention au fuseau, mais ici on simplifie)
        // On force le format "YYYY-MM-DD" manuellement pour éviter les soucis de timezone
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
        return {
            num: dayNum,
            dateStr: dateStr,
            dayOfWeek: dateObj.getDay() // 0=Dimanche, 1=Lundi...
        };
    });

    // Filtrer pour n'avoir que les jours de la semaine (Lundi=1 à Vendredi=5)
    const workDays = days.filter(d => d.dayOfWeek >= 1 && d.dayOfWeek <= 5);

    const getEventsForDay = (dateStr) => {
        return events.filter(e => {
            if (e.date !== dateStr) return false;
            if (activeFilter === 'all') return true;
            return e.type === activeFilter;
        });
    };

    return React.createElement('div', { className: 'fixed inset-0 z-[150] bg-gray-100 flex flex-col animate-fadeIn' },
        // HEADER
        React.createElement('div', { className: 'bg-white border-b px-3 lg:px-6 py-2 lg:py-3 flex justify-between items-center shadow-sm z-20 shrink-0' },
            React.createElement('div', { className: 'flex-1 min-w-0' },
                React.createElement('h1', { className: 'text-lg lg:text-2xl font-bold text-slate-800 flex items-center gap-2 lg:gap-3 truncate' },
                    React.createElement('div', { className: 'bg-blue-600 text-white w-8 h-8 rounded-lg flex items-center justify-center shadow-sm shrink-0' },
                        React.createElement('i', { className: 'far fa-calendar-alt text-lg' })
                    ),
                    React.createElement('span', { className: 'truncate' }, 'Planning & Production')
                ),
                React.createElement('div', { className: 'flex items-center gap-2 text-xs text-slate-500 mt-1' },
                    React.createElement('span', null, 'IGP Glass'),
                    React.createElement('i', { className: 'fas fa-circle text-[4px] text-slate-300' }),
                    React.createElement('span', null, 'Vue Directeur')
                )
            ),
            React.createElement('div', { className: 'flex items-center gap-3' },
                // Bouton Gestion Catégories
                React.createElement('button', { 
                    onClick: () => setShowCategoryModal(true),
                    className: 'w-10 h-10 flex items-center justify-center rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 transition shadow-sm'
                }, React.createElement('i', { className: 'fas fa-cog' })),

                // Bouton Notes Mobile
                React.createElement('button', { 
                    onClick: () => setShowMobileNotes(!showMobileNotes),
                    className: `lg:hidden w-10 h-10 flex items-center justify-center rounded-lg transition ${showMobileNotes ? 'bg-yellow-100 text-yellow-600' : 'bg-gray-100 text-gray-500'}`
                }, React.createElement('i', { className: 'fas fa-sticky-note' })),

                React.createElement('button', { 
                    onClick: () => { 
                        // Date par défaut : Aujourd'hui ou le 1er du mois affiché
                        const today = new Date();
                        const defaultDate = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(Math.max(1, Math.min(today.getDate(), daysInMonth))).padStart(2, '0')}`;
                        setNewEventDate(defaultDate); 
                        setSelectedEvent(null);
                        setShowAddModal(true); 
                    },
                    className: 'hidden sm:flex px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-md transition font-semibold items-center gap-2' 
                },
                    React.createElement('i', { className: 'fas fa-plus' }),
                    'Nouvel Événement'
                ),
                React.createElement('div', { className: 'h-8 w-px bg-gray-200 mx-1' }),
                React.createElement('button', {
                    onClick: onClose,
                    className: 'bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg font-medium transition shadow-sm'
                }, 'Fermer')
            )
        ),

        // FILTERS & TOOLBAR
        React.createElement('div', { className: 'bg-white border-b px-2 lg:px-6 py-2 flex flex-wrap lg:flex-nowrap gap-2 lg:gap-4 items-center shadow-sm z-10 shrink-0' },
            React.createElement('span', { className: 'text-xs font-bold text-slate-400 uppercase tracking-wider mr-1 lg:mr-2 shrink-0' }, 'Filtres :'),
            
            React.createElement('div', { className: 'flex flex-wrap gap-2 items-center pr-4' },
                React.createElement('button', {
                    onClick: () => setActiveFilter('all'),
                    className: `px-3 py-1.5 rounded-full text-xs lg:text-sm font-medium transition border whitespace-nowrap ${activeFilter === 'all' ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'}`
                }, 'Tout Voir'),
                
                categories.map(cat => 
                    React.createElement('button', {
                        key: cat.id,
                        onClick: () => setActiveFilter(cat.id),
                        className: `px-3 py-1.5 rounded-full text-xs lg:text-sm font-medium transition flex items-center gap-2 border whitespace-nowrap ${
                            activeFilter === cat.id 
                                ? 'bg-slate-100 border-slate-400 text-slate-800 shadow-inner' 
                                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                        }`
                    }, React.createElement('i', { className: `fas ${cat.icon} text-xs opacity-70` }), cat.label)
                )
            ),

            React.createElement('div', { className: 'flex-1 min-w-[20px]' }), // Spacer
            
            React.createElement('div', { className: 'flex bg-gray-100 rounded-lg p-1 shrink-0' },
                React.createElement('button', { 
                    onClick: handlePrevMonth,
                    className: 'w-8 h-8 flex items-center justify-center bg-white shadow-sm rounded text-slate-700 hover:bg-slate-50' 
                }, React.createElement('i', { className: 'fas fa-chevron-left' })),
                React.createElement('span', { className: 'px-2 lg:px-4 flex items-center font-bold text-slate-700 text-xs lg:text-sm whitespace-nowrap capitalize w-32 justify-center' }, getMonthName(currentDate)),
                React.createElement('button', { 
                    onClick: handleNextMonth,
                    className: 'w-8 h-8 flex items-center justify-center bg-white shadow-sm rounded text-slate-700 hover:bg-slate-50' 
                }, React.createElement('i', { className: 'fas fa-chevron-right' }))
            )
        ),

        // MAIN CONTENT (GRID + SIDEBAR)
        React.createElement('div', { className: 'flex-1 flex flex-col lg:flex-row overflow-hidden relative' },
            
            // CALENDAR GRID
            React.createElement('div', { className: 'flex-1 flex flex-col bg-slate-50 lg:border-r border-gray-200 overflow-hidden' },
                // Days Header (5 jours - Desktop Only)
                React.createElement('div', { className: 'hidden lg:grid grid-cols-5 border-b bg-white shadow-sm' },
                    ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi'].map(day => 
                        React.createElement('div', { key: day, className: 'py-3 text-center text-xs font-bold text-slate-400 uppercase tracking-wider' }, day)
                    )
                ),

                // Calendar Cells
                React.createElement('div', { className: 'grid grid-cols-1 lg:grid-cols-5 flex-1 overflow-y-auto p-3 lg:p-4 gap-3 lg:gap-4 pb-20 lg:pb-4' },
                    workDays.map((dayObj, idx) => {
                        const dayEvents = getEventsForDay(dayObj.dateStr);
                        const dayNames = ['Dim', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Sam'];
                        
                        return React.createElement('div', { 
                            key: dayObj.dateStr, 
                            onDragOver: handleDragOver,
                            onDrop: (e) => handleDrop(e, dayObj.dateStr),
                            className: `rounded-xl border bg-white border-slate-200 hover:shadow-md hover:border-blue-300 p-3 flex flex-col gap-2 relative transition-all group min-h-[140px]` 
                        },
                            React.createElement('div', { className: 'flex justify-between items-start mb-1' },
                                React.createElement('div', { className: 'flex items-center gap-2' },
                                    React.createElement('span', { 
                                        className: `text-lg font-bold w-8 h-8 flex items-center justify-center rounded-full ${
                                            dayObj.num === new Date().getDate() && currentDate.getMonth() === new Date().getMonth() ? 'bg-blue-600 text-white shadow-md' : 'text-slate-700 bg-slate-100'
                                        }` 
                                    }, dayObj.num),
                                    // Mobile Day Name
                                    React.createElement('span', { className: 'lg:hidden text-sm font-bold text-slate-500 uppercase' }, dayNames[dayObj.dayOfWeek])
                                ),
                                // Add Button (Visible on Hover)
                                React.createElement('button', { 
                                    onClick: () => { setSelectedEvent(null); setNewEventDate(dayObj.dateStr); setShowAddModal(true); },
                                    className: 'opacity-0 group-hover:opacity-100 text-slate-400 hover:text-blue-600 transition p-1' 
                                }, React.createElement('i', { className: 'fas fa-plus-circle text-lg' }))
                            ),
                            
                            // Events List
                            React.createElement('div', { className: 'flex-1 overflow-y-auto space-y-1 custom-scrollbar' },
                                dayEvents.map((evt, eIdx) => 
                                    React.createElement('div', { 
                                        key: eIdx, 
                                        draggable: true,
                                        onClick: (e) => handleEditEventClick(e, evt),
                                        onDragStart: (e) => handleDragStart(e, evt.id),
                                        onDragEnd: handleDragEnd,
                                        className: `text-xs p-2 rounded-lg shadow-sm cursor-pointer hover:scale-[1.02] transition-transform border border-transparent ${getCategoryStyle(evt.type, evt.status)}`,
                                        title: 'Cliquez pour modifier'
                                    },
                                        React.createElement('div', { className: 'flex items-center justify-between mb-0.5' },
                                            React.createElement('div', { className: 'flex items-center gap-1.5' },
                                                React.createElement('i', { className: `fas ${getCategoryIcon(evt.type)}` }),
                                                React.createElement('span', { className: 'font-bold truncate max-w-[80px]' }, categories.find(c => c.id === evt.type)?.label || 'Autre')
                                            ),
                                            evt.status === 'tentative' && React.createElement('i', { className: 'fas fa-question-circle opacity-50' })
                                        ),
                                        React.createElement('div', { className: 'truncate font-medium leading-tight' }, evt.title),
                                        evt.details && React.createElement('div', { className: 'text-[10px] opacity-75 truncate mt-0.5' }, evt.details)
                                    )
                                )
                            )
                        );
                    })
                )
            ),

            // SIDEBAR "AIDE-MÉMOIRE" (Responsive Drawer)
            React.createElement('div', { className: `${showMobileNotes ? 'absolute inset-0 z-50' : 'hidden'} lg:relative lg:flex lg:w-80 bg-white border-l border-gray-200 flex-col shadow-xl transition-all` },
                React.createElement('div', { className: 'p-5 border-b bg-slate-50 flex justify-between items-center' },
                    React.createElement('h3', { className: 'font-bold text-slate-800 flex items-center gap-2' },
                        React.createElement('div', { className: 'w-6 h-6 rounded bg-yellow-100 text-yellow-600 flex items-center justify-center' },
                            React.createElement('i', { className: 'fas fa-sticky-note text-xs' })
                        ),
                        'Notes & Rappels'
                    ),
                    // Notification Toggle
                    React.createElement('button', {
                        onClick: requestNotificationPermission,
                        title: notificationPerm === 'granted' ? 'Notifications actives' : 'Activer les notifications',
                        className: `w-8 h-8 rounded-full flex items-center justify-center transition ${
                            notificationPerm === 'granted' 
                                ? 'bg-blue-100 text-blue-600' 
                                : 'bg-gray-100 text-gray-400 hover:bg-gray-200 animate-pulse'
                        }`
                    }, React.createElement('i', { className: `fas ${notificationPerm === 'granted' ? 'fa-bell' : 'fa-bell-slash'}` })),

                    // Close Button Mobile Only
                    React.createElement('button', { 
                        onClick: () => setShowMobileNotes(false),
                        className: 'lg:hidden text-slate-400 hover:text-slate-600 ml-2'
                    }, React.createElement('i', { className: 'fas fa-times text-lg' }))
                ),
                React.createElement('p', { className: 'text-xs text-slate-500 px-5 pb-2 border-b border-slate-100 lg:border-none lg:pb-0 lg:px-0 lg:pl-14 lg:-mt-4' }, 'Votre To-Do list personnelle'),
                
                React.createElement('div', { className: 'flex-1 overflow-y-auto p-4 space-y-3' },
                    plannerNotes.map(note => 
                        React.createElement('div', { key: note.id, className: 'bg-white p-3 rounded-xl border border-gray-100 shadow-sm hover:shadow-md hover:border-blue-200 transition group animate-slideIn relative' },
                            // Delete button (visible on hover)
                            React.createElement('button', {
                                onClick: () => deleteNote(note.id),
                                className: 'absolute top-2 right-2 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition'
                            }, React.createElement('i', { className: 'fas fa-times' })),

                            React.createElement('div', { className: 'flex items-start gap-3' },
                                React.createElement('div', { 
                                    onClick: () => toggleNote(note.id),
                                    className: `mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center cursor-pointer transition ${
                                        note.done 
                                            ? 'bg-green-500 border-green-500 text-white' 
                                            : 'border-gray-300 hover:border-blue-400 text-transparent'
                                    }`,
                                }, React.createElement('i', { className: 'fas fa-check text-xs' })),
                                React.createElement('div', { className: 'flex-1 pr-4' },
                                    React.createElement('p', { className: `text-sm leading-snug font-medium ${note.done ? 'text-gray-400 line-through' : 'text-slate-700'}` }, note.text),
                                    
                                    // Meta info (Time & Priority)
                                    React.createElement('div', { className: 'mt-2 flex items-center gap-2' },
                                        note.time && React.createElement('span', { className: `text-[10px] px-2 py-0.5 rounded-full font-bold flex items-center gap-1 ${note.notified ? 'bg-gray-100 text-gray-500' : 'bg-blue-50 text-blue-600'}` },
                                            React.createElement('i', { className: 'far fa-clock' }),
                                            note.time
                                        ),
                                        note.priority === 'high' && !note.done && React.createElement('span', { className: 'text-[10px] px-2 py-0.5 bg-red-50 text-red-600 rounded-full font-bold uppercase tracking-wide' }, 'Urgent')
                                    )
                                )
                            )
                        )
                    )
                ),

                // Add Input
                React.createElement('div', { className: 'p-4 border-t bg-gray-50' },
                    React.createElement('form', { onSubmit: handleAddNote, className: 'relative flex flex-col gap-2' },
                        React.createElement('input', { 
                            name: 'text',
                            type: 'text', 
                            required: true,
                            placeholder: 'Ajouter une tâche...',
                            className: 'w-full pl-4 pr-4 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 transition'
                        }),
                        React.createElement('div', { className: 'flex gap-2' },
                            React.createElement('input', { 
                                name: 'time',
                                type: 'time',
                                className: 'w-24 px-2 py-2 text-xs bg-white border border-gray-200 rounded-lg text-gray-600 focus:ring-2 focus:ring-blue-500'
                            }),
                            React.createElement('button', { 
                                type: 'submit',
                                className: 'flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg py-2 text-xs font-bold transition shadow-sm flex items-center justify-center gap-2' 
                            },
                                'Ajouter',
                                React.createElement('i', { className: 'fas fa-plus' })
                            )
                        )
                    )
                )
            ),

            // ADD EVENT MODAL (Responsive Fix)
            showAddModal && React.createElement('div', { className: 'fixed inset-0 z-[200] bg-black/50 overflow-y-auto animate-fadeIn' },
                React.createElement('div', { className: 'flex min-h-full items-center justify-center p-4' },
                    React.createElement('div', { className: 'bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-scaleIn relative' },
                        // Modal Header
                        React.createElement('div', { className: 'bg-slate-50 px-6 py-4 border-b flex justify-between items-center' },
                            React.createElement('h3', { className: 'font-bold text-lg text-slate-800' }, selectedEvent ? 'Modifier l\'Événement' : 'Ajouter un Événement'),
                            React.createElement('button', { 
                                onClick: () => setShowAddModal(false),
                                className: 'text-slate-400 hover:text-slate-600 w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-200 transition'
                            }, React.createElement('i', { className: 'fas fa-times' }))
                        ),
                        // Modal Form
                        React.createElement('form', { onSubmit: handleSaveEvent, className: 'p-6 space-y-5' },
                            // Date & Type Row
                            React.createElement('div', { className: 'grid grid-cols-1 sm:grid-cols-2 gap-4' },
                                React.createElement('div', null,
                                    React.createElement('label', { className: 'block text-xs font-bold text-slate-500 uppercase mb-1' }, 'Date'),
                                    React.createElement('input', { 
                                        name: 'date', 
                                        type: 'date',
                                        defaultValue: newEventDate,
                                        required: true,
                                        className: 'w-full p-2.5 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition font-medium text-slate-700' 
                                    })
                                ),
                                React.createElement('div', null,
                                    React.createElement('label', { className: 'block text-xs font-bold text-slate-500 uppercase mb-1' }, 'Type'),
                                    React.createElement('select', { 
                                        name: 'type', 
                                        defaultValue: selectedEvent ? selectedEvent.type : (categories[0]?.id || ''),
                                        className: 'w-full p-2.5 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition font-medium text-slate-700' 
                                    },
                                        categories.map(cat => 
                                            React.createElement('option', { key: cat.id, value: cat.id }, cat.label)
                                        )
                                    )
                                )
                            ),
                            
                            // Title Input
                            React.createElement('div', null,
                                React.createElement('label', { className: 'block text-xs font-bold text-slate-500 uppercase mb-1' }, 'Titre de l\'événement'),
                                React.createElement('input', { 
                                    name: 'title', 
                                    type: 'text', 
                                    defaultValue: selectedEvent ? selectedEvent.title : '',
                                    placeholder: 'Ex: Commande #1234 - Client ABC',
                                    required: true,
                                    className: 'w-full p-2.5 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition font-medium text-slate-700' 
                                })
                            ),

                            // Details Input
                            React.createElement('div', null,
                                React.createElement('label', { className: 'block text-xs font-bold text-slate-500 uppercase mb-1' }, 'Détails / Notes'),
                                React.createElement('textarea', { 
                                    name: 'details', 
                                    rows: 3,
                                    defaultValue: selectedEvent ? selectedEvent.details : '',
                                    placeholder: 'Spécifications, contacts, contraintes...',
                                    className: 'w-full p-2.5 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition font-medium text-slate-700 resize-none' 
                                })
                            ),

                            // Footer Buttons
                            React.createElement('div', { className: 'flex flex-col-reverse sm:flex-row justify-between items-center gap-3 pt-2' },
                                // Delete Button (Only in Edit Mode)
                                selectedEvent ? React.createElement('button', {
                                    type: 'button',
                                    onClick: handleDeleteEvent,
                                    className: 'w-full sm:w-auto text-red-500 hover:text-red-700 hover:bg-red-50 px-3 py-2 rounded-lg font-medium transition text-sm flex items-center justify-center gap-2'
                                }, React.createElement('i', { className: 'fas fa-trash-alt' }), 'Supprimer') : React.createElement('div', { className: 'hidden sm:block' }),

                                React.createElement('div', { className: 'flex w-full sm:w-auto gap-3' },
                                    React.createElement('button', { 
                                        type: 'button',
                                        onClick: () => setShowAddModal(false),
                                        className: 'flex-1 sm:flex-none px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium transition text-center' 
                                    }, 'Annuler'),
                                    React.createElement('button', { 
                                        type: 'submit',
                                        className: 'flex-1 sm:flex-none px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold shadow-lg shadow-blue-200 transition flex items-center justify-center gap-2' 
                                    }, React.createElement('i', { className: 'fas fa-check' }), selectedEvent ? 'Enregistrer' : 'Ajouter')
                                )
                            )
                        )
                    )
                )
            ),

            // CATEGORY MANAGEMENT MODAL
            showCategoryModal && React.createElement('div', { className: 'fixed inset-0 z-[200] bg-black/50 overflow-y-auto animate-fadeIn' },
                React.createElement('div', { className: 'flex min-h-full items-center justify-center p-4' },
                    React.createElement('div', { className: 'bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-scaleIn relative' },
                        // Header
                        React.createElement('div', { className: 'bg-slate-50 px-6 py-4 border-b flex justify-between items-center' },
                            React.createElement('h3', { className: 'font-bold text-lg text-slate-800' }, 'Gérer les Catégories'),
                            React.createElement('button', { 
                                onClick: () => setShowCategoryModal(false),
                                className: 'text-slate-400 hover:text-slate-600 w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-200 transition'
                            }, React.createElement('i', { className: 'fas fa-times' }))
                        ),
                        
                        // Body
                        React.createElement('div', { className: 'p-6' },
                            // List
                            React.createElement('div', { className: 'space-y-2 mb-6' },
                                React.createElement('label', { className: 'block text-xs font-bold text-slate-500 uppercase mb-2' }, 'Catégories Existantes'),
                                categories.map(cat => 
                                    React.createElement('div', { key: cat.id, className: `flex items-center justify-between p-3 rounded-lg border transition ${editingCategory && editingCategory.id === cat.id ? 'bg-blue-50 border-blue-300 ring-1 ring-blue-300' : 'bg-slate-50 border-slate-200'}` },
                                        React.createElement('div', { className: 'flex items-center gap-3' },
                                            React.createElement('div', { className: `w-8 h-8 rounded-full flex items-center justify-center bg-${cat.color === 'blue' ? 'blue' : cat.color === 'green' ? 'green' : cat.color === 'red' ? 'red' : cat.color === 'purple' ? 'purple' : cat.color === 'orange' ? 'orange' : 'yellow'}-100 text-${cat.color === 'blue' ? 'blue' : cat.color === 'green' ? 'green' : cat.color === 'red' ? 'red' : cat.color === 'purple' ? 'purple' : cat.color === 'orange' ? 'orange' : 'yellow'}-600` },
                                                React.createElement('i', { className: `fas ${cat.icon}` })
                                            ),
                                            React.createElement('span', { className: 'font-medium text-slate-700' }, cat.label)
                                        ),
                                        React.createElement('div', { className: 'flex items-center gap-1' },
                                            React.createElement('button', {
                                                onClick: () => handleEditCategoryClick(cat),
                                                className: 'text-slate-400 hover:text-blue-600 p-2 hover:bg-blue-50 rounded-lg transition'
                                            }, React.createElement('i', { className: 'fas fa-pen' })),
                                            React.createElement('button', {
                                                onClick: () => handleDeleteCategory(cat.id),
                                                className: 'text-red-400 hover:text-red-600 p-2 hover:bg-red-50 rounded-lg transition'
                                            }, React.createElement('i', { className: 'fas fa-trash-alt' }))
                                        )
                                    )
                                )
                            ),

                            // Add/Edit Form
                            React.createElement('form', { 
                                key: editingCategory ? editingCategory.id : 'new', // Re-mount to reset default values
                                onSubmit: handleSaveCategory, 
                                className: `p-4 rounded-xl border transition ${editingCategory ? 'bg-blue-50 border-blue-200 shadow-md' : 'bg-slate-50 border-slate-200'}` 
                            },
                                React.createElement('div', { className: 'flex justify-between items-center mb-3' },
                                    React.createElement('label', { className: `block text-xs font-bold uppercase ${editingCategory ? 'text-blue-800' : 'text-slate-500'}` }, 
                                        editingCategory ? 'Modifier la catégorie' : 'Ajouter une nouvelle catégorie'
                                    ),
                                    editingCategory && React.createElement('button', {
                                        type: 'button',
                                        onClick: handleCancelEdit,
                                        className: 'text-xs text-blue-600 hover:underline'
                                    }, 'Annuler')
                                ),
                                
                                React.createElement('div', { className: 'space-y-3' },
                                    React.createElement('input', { 
                                        name: 'label', 
                                        defaultValue: editingCategory ? editingCategory.label : '',
                                        placeholder: 'Nom (ex: Réunion)', 
                                        required: true, 
                                        className: 'w-full p-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                                    }),
                                    React.createElement('div', { className: 'grid grid-cols-2 gap-3' },
                                        React.createElement('select', { 
                                            name: 'icon', 
                                            defaultValue: editingCategory ? editingCategory.icon : 'fa-circle',
                                            className: 'w-full p-2 border border-slate-300 rounded-lg text-sm' 
                                        },
                                            React.createElement('option', { value: 'fa-circle' }, '⚫ Cercle'),
                                            React.createElement('option', { value: 'fa-star' }, '⭐ Étoile'),
                                            React.createElement('option', { value: 'fa-user' }, '👤 Utilisateur'),
                                            React.createElement('option', { value: 'fa-truck' }, '🚚 Camion'),
                                            React.createElement('option', { value: 'fa-tools' }, '🛠️ Outils'),
                                            React.createElement('option', { value: 'fa-bolt' }, '⚡ Éclair'),
                                            React.createElement('option', { value: 'fa-file-alt' }, '📄 Document'),
                                            React.createElement('option', { value: 'fa-exclamation-triangle' }, '⚠️ Attention'),
                                            React.createElement('option', { value: 'fa-ban' }, '🚫 Interdit'),
                                            React.createElement('option', { value: 'fa-info-circle' }, 'ℹ️ Info'),
                                            React.createElement('option', { value: 'fa-check-circle' }, '✅ Valide'),
                                            React.createElement('option', { value: 'fa-clock' }, '🕒 Horloge')
                                        ),
                                        React.createElement('select', { 
                                            name: 'color', 
                                            defaultValue: editingCategory ? editingCategory.color : 'blue',
                                            className: 'w-full p-2 border border-slate-300 rounded-lg text-sm' 
                                        },
                                            React.createElement('option', { value: 'blue' }, '🔵 Bleu'),
                                            React.createElement('option', { value: 'green' }, '🟢 Vert'),
                                            React.createElement('option', { value: 'red' }, '🔴 Rouge'),
                                            React.createElement('option', { value: 'yellow' }, '🟡 Jaune'),
                                            React.createElement('option', { value: 'purple' }, '🟣 Violet'),
                                            React.createElement('option', { value: 'orange' }, '🟠 Orange'),
                                            React.createElement('option', { value: 'gray' }, '⚪ Gris')
                                        )
                                    ),
                                    React.createElement('button', { 
                                        type: 'submit',
                                        className: `w-full py-2 rounded-lg font-bold text-sm transition shadow-sm flex items-center justify-center gap-2 ${
                                            editingCategory 
                                                ? 'bg-blue-600 text-white hover:bg-blue-700' 
                                                : 'bg-slate-800 text-white hover:bg-slate-900'
                                        }`
                                    }, 
                                        React.createElement('i', { className: editingCategory ? 'fas fa-save' : 'fas fa-plus' }),
                                        editingCategory ? 'Enregistrer les modifications' : 'Ajouter'
                                    )
                                )
                            )
                        )
                    )
                )
            )
        )
    );
};