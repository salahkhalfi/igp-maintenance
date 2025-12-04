const ProductionPlanning = ({ onClose }) => {
    // État pour le mois affiché (Initialisé au mois courant)
    const [currentDate, setCurrentDate] = React.useState(new Date());

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
    
    // CATEGORIES STATE - Init with defaults to prevent "empty screen" syndrome
    const DEFAULT_CATEGORIES = [
        { id: 'cut', label: 'Mise en Prod', icon: 'fa-layer-group', color: 'blue' },
        { id: 'ship', label: 'Expéditions', icon: 'fa-truck', color: 'green' },
        { id: 'maintenance', label: 'Maintenance', icon: 'fa-tools', color: 'red' },
        { id: 'reminder', label: 'Rappel / Note', icon: 'fa-info-circle', color: 'yellow' },
        { id: 'blocked', label: 'Bloqué', icon: 'fa-ban', color: 'red' }
    ];

    const [categories, setCategories] = React.useState(DEFAULT_CATEGORIES);
    const [showCategoryModal, setShowCategoryModal] = React.useState(false);
    const [editingCategory, setEditingCategory] = React.useState(null);

    // EVENTS STATE
    const [events, setEvents] = React.useState([]);

    // NOTES STATE
    const [plannerNotes, setPlannerNotes] = React.useState([]);

    // LOAD DATA FROM API
    React.useEffect(() => {
        // Ajouter un timestamp pour éviter le cache navigateur/proxy
        axios.get('/api/planning?t=' + Date.now())
            .then(res => {
                const data = res.data;
                if (data.categories && Array.isArray(data.categories) && data.categories.length > 0) {
                    setCategories(data.categories);
                }
                // If empty from API, we keep the defaults (fail-safe)
                
                if (data.events) setEvents(data.events);
                if (data.notes) setPlannerNotes(data.notes);
            })
            .catch(err => {
                console.error('Error loading planning data:', err);
                // Fallback visuel en cas d'erreur (optionnel, mais utile pour debug mobile)
                // alert("Erreur de chargement des données planning"); 
            });
    }, []);

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
            const updatedCat = {
                label: formData.get('label'),
                color: formData.get('color'),
                icon: formData.get('icon')
            };
            
            // Optimistic UI Update
            setCategories(categories.map(c => 
                c.id === editingCategory.id ? { ...c, ...updatedCat } : c
            ));
            setEditingCategory(null);

            axios.put(`/api/planning/categories/${editingCategory.id}`, updatedCat)
                .catch(err => console.error('Error updating category:', err));

        } else {
            // CREATE NEW
            const newCat = {
                id: 'cat_' + Date.now(),
                label: formData.get('label'),
                color: formData.get('color'),
                icon: formData.get('icon')
            };
            
            // Optimistic UI Update
            setCategories([...categories, newCat]);

            axios.post('/api/planning/categories', newCat)
                .catch(err => console.error('Error creating category:', err));
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
            
            axios.delete(`/api/planning/categories/${id}`)
                .catch(err => console.error('Error deleting category:', err));
        }
    };

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
    // (Déplacé dans le state plus haut pour être mutable)

    // Vérification périodique des rappels (toutes les 30 secondes)
    React.useEffect(() => {
        if (notificationPerm !== 'granted') return;

        const interval = setInterval(() => {
            const now = new Date();
            const currentHours = String(now.getHours()).padStart(2, '0');
            const currentMinutes = String(now.getMinutes()).padStart(2, '0');
            const currentTime = `${currentHours}:${currentMinutes}`;

            setPlannerNotes(prevNotes => {
                let hasChanges = false;
                const nextNotes = prevNotes.map(note => {
                    if (!note.done && !note.notified && note.time === currentTime) {
                        // TRIGGER NOTIFICATION
                        new Notification("Rappel IGP Production", {
                            body: note.text,
                            icon: "https://cdn-icons-png.flaticon.com/512/1028/1028918.png" // Generic warning icon
                        });
                        
                        hasChanges = true;
                        return { ...note, notified: true };
                    }
                    return note;
                });
                
                // Only update state if needed to avoid loops/re-renders, 
                // and maybe sync 'notified' status to DB? 
                // For now, just local state update to avoid repeated alerts.
                return hasChanges ? nextNotes : prevNotes;
            });
        }, 30000);

        return () => clearInterval(interval);
    }, [notificationPerm]);

    // Add Note Handler
    const handleAddNote = (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const text = formData.get('text');
        const time = formData.get('time');
        const date = formData.get('date');
        if (!text) return;

        const newNote = {
            id: Date.now(), // Temp ID
            text: text,
            time: time,
            date: date,
            done: false,
            priority: 'medium',
            notified: false
        };
        
        setPlannerNotes([...plannerNotes, newNote]);
        
        axios.post('/api/planning/notes', newNote)
        .then(res => {
             const savedNote = res.data;
             setPlannerNotes(current => current.map(n => n.id === newNote.id ? savedNote : n));
        })
        .catch(err => console.error('Error adding note:', err));
        
        e.target.reset();
    };

    // Update Note Handler (New)
    const handleUpdateNote = (id, updatedData) => {
        // Optimistic Update
        setPlannerNotes(current => current.map(n => n.id === id ? { ...n, ...updatedData } : n));

        axios.put(`/api/planning/notes/${id}`, updatedData)
            .catch(err => console.error('Error updating note:', err));
    };

    // Toggle Note Done
    const toggleNote = (id) => {
        const note = plannerNotes.find(n => n.id === id);
        if (!note) return;
        handleUpdateNote(id, { done: !note.done });
    };

    // Delete Note
    const deleteNote = (id) => {
        setPlannerNotes(plannerNotes.filter(n => n.id !== id));
        
        axios.delete(`/api/planning/notes/${id}`)
            .catch(err => console.error('Error deleting note:', err));
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
            const updatedEvent = {
                date: dateVal,
                type: formData.get('type'),
                title: formData.get('title'),
                details: formData.get('details')
            };

            // Optimistic
            setEvents(prevEvents => prevEvents.map(evt => {
                if (evt.id === selectedEvent.id) {
                    return { ...evt, ...updatedEvent };
                }
                return evt;
            }));
            
            axios.put(`/api/planning/events/${selectedEvent.id}`, updatedEvent)
                .catch(err => console.error('Error updating event:', err));

        } else {
            // MODE CRÉATION
            const newEvent = {
                id: Date.now(), // Temporary ID for UI
                date: dateVal,
                type: formData.get('type'),
                status: 'confirmed',
                title: formData.get('title'),
                details: formData.get('details')
            };
            
            // Optimistic UI update (temporary ID)
            setEvents([...events, newEvent]);

            axios.post('/api/planning/events', newEvent)
            .then(res => {
                const savedEvent = res.data;
                // Replace temporary ID with real DB ID
                setEvents(currentEvents => currentEvents.map(evt => 
                    evt.id === newEvent.id ? savedEvent : evt
                ));
            })
            .catch(err => console.error('Error creating event:', err));
        }
        setShowAddModal(false);
        setSelectedEvent(null);
    };

    // Handle Delete Event
    const handleDeleteEvent = () => {
        if (selectedEvent) {
            // Optimistic
            setEvents(prevEvents => prevEvents.filter(evt => evt.id !== selectedEvent.id));
            
            axios.delete(`/api/planning/events/${selectedEvent.id}`)
                .catch(err => console.error('Error deleting event:', err));
            
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

        // Optimistic UI Update
        setEvents(prevEvents => prevEvents.map(evt => {
            if (evt.id === draggedEventId) {
                return { ...evt, date: targetDate };
            }
            return evt;
        }));

        // API Call
        axios.put(`/api/planning/events/${draggedEventId}`, { date: targetDate })
            .catch(err => console.error('Error moving event:', err));
    };

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
                    className: 'flex px-3 lg:px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-md transition font-semibold items-center gap-2' 
                },
                    React.createElement('i', { className: 'fas fa-plus' }),
                    React.createElement('span', { className: 'hidden sm:inline' }, 'Nouvel Événement')
                ),
                React.createElement('div', { className: 'h-8 w-px bg-gray-200 mx-1' }),
                React.createElement('button', {
                    onClick: onClose,
                    className: 'bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg font-medium transition shadow-sm'
                }, 'Fermer')
            )
        ),

        // FILTERS & TOOLBAR
        React.createElement('div', { className: 'bg-white border-b py-2 px-2 lg:px-6 flex flex-col lg:flex-row gap-3 lg:gap-4 items-stretch lg:items-center shadow-sm z-10 shrink-0' },
            
            // 1. FILTERS CONTAINER (Scrollable on Mobile)
            React.createElement('div', { className: 'flex items-center overflow-hidden w-full lg:w-auto min-w-0' },
                React.createElement('span', { className: 'text-xs font-bold text-slate-400 uppercase tracking-wider mr-2 shrink-0 hidden lg:inline' }, 'Filtres :'),
                
                React.createElement('div', { 
                    className: 'flex overflow-x-auto gap-2 items-center pb-2 lg:pb-0 w-full no-scrollbar mask-linear-fade',
                    style: { scrollbarWidth: 'none', msOverflowStyle: 'none', WebkitOverflowScrolling: 'touch' } // Smooth scrolling
                },
                    React.createElement('button', {
                        onClick: () => setActiveFilter('all'),
                        className: `px-4 py-2 rounded-full text-sm font-bold transition-all duration-200 border whitespace-nowrap flex-shrink-0 ${activeFilter === 'all' ? 'bg-slate-800 text-white border-slate-900 shadow-md transform scale-105' : 'bg-white text-slate-600 border-slate-300 hover:border-slate-400 shadow-sm'}`
                    }, 'Tout Voir'),
                    
                    categories.length === 0 ? React.createElement('span', { className: 'text-xs text-gray-400 italic whitespace-nowrap px-2' }, 'Aucune catégorie') : null,

                    categories.map(cat => {
                        // Style dynamique basé sur la couleur de la catégorie
                        const colorStyles = {
                            blue:   activeFilter === cat.id ? 'bg-blue-600 text-white border-blue-700 shadow-md transform scale-105'   : 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100',
                            green:  activeFilter === cat.id ? 'bg-green-600 text-white border-green-700 shadow-md transform scale-105' : 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100',
                            red:    activeFilter === cat.id ? 'bg-red-600 text-white border-red-700 shadow-md transform scale-105'   : 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100',
                            yellow: activeFilter === cat.id ? 'bg-yellow-500 text-white border-yellow-600 shadow-md transform scale-105' : 'bg-yellow-50 text-yellow-700 border-yellow-200 hover:bg-yellow-100',
                            purple: activeFilter === cat.id ? 'bg-purple-600 text-white border-purple-700 shadow-md transform scale-105' : 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100',
                            orange: activeFilter === cat.id ? 'bg-orange-600 text-white border-orange-700 shadow-md transform scale-105' : 'bg-orange-50 text-orange-800 border-orange-200 hover:bg-orange-100',
                            gray:   activeFilter === cat.id ? 'bg-gray-600 text-white border-gray-700 shadow-md transform scale-105'   : 'bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200',
                        };
                        const style = colorStyles[cat.color] || colorStyles.gray;

                        return React.createElement('button', {
                            key: cat.id,
                            onClick: () => setActiveFilter(cat.id),
                            className: `px-4 py-2 rounded-full text-sm font-bold transition-all duration-200 flex items-center gap-2 border whitespace-nowrap flex-shrink-0 ${style}`
                        }, 
                            React.createElement('i', { className: `fas ${cat.icon} ${activeFilter === cat.id ? 'text-white' : ''} text-sm` }), 
                            cat.label
                        );
                    })
                )
            ),

            // 2. NAVIGATION (Month)
            React.createElement('div', { className: 'flex justify-center lg:justify-end lg:ml-auto shrink-0' },
                React.createElement('div', { className: 'flex bg-gray-100 rounded-lg p-1 shadow-inner' },
                    React.createElement('button', { 
                        onClick: handlePrevMonth,
                        className: 'w-10 h-8 flex items-center justify-center bg-white shadow-sm rounded text-slate-700 hover:bg-slate-50 active:scale-95 transition' 
                    }, React.createElement('i', { className: 'fas fa-chevron-left' })),
                    
                    React.createElement('span', { className: 'px-4 flex items-center justify-center font-bold text-slate-700 text-sm whitespace-nowrap capitalize w-36' }, getMonthName(currentDate)),
                    
                    React.createElement('button', { 
                        onClick: handleNextMonth,
                        className: 'w-10 h-8 flex items-center justify-center bg-white shadow-sm rounded text-slate-700 hover:bg-slate-50 active:scale-95 transition' 
                    }, React.createElement('i', { className: 'fas fa-chevron-right' }))
                )
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
                React.createElement('div', { className: 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 flex-1 overflow-y-auto p-3 lg:p-4 gap-3 lg:gap-4 pb-20 lg:pb-4' },
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
                                // Add Button (Always visible on mobile, hover on desktop)
                                React.createElement('button', { 
                                    onClick: () => { setSelectedEvent(null); setNewEventDate(dayObj.dateStr); setShowAddModal(true); },
                                    className: 'opacity-100 lg:opacity-0 lg:group-hover:opacity-100 text-slate-400 hover:text-blue-600 transition p-1' 
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

            // Utilisation du composant PlanningNotes nettoyé
            React.createElement(window.PlanningNotes, {
                notes: plannerNotes,
                showMobile: showMobileNotes,
                onCloseMobile: () => setShowMobileNotes(false),
                onAdd: handleAddNote,
                onUpdate: handleUpdateNote, // New prop
                onToggle: toggleNote,
                onDelete: deleteNote,
                notificationPerm: notificationPerm,
                onRequestPerm: requestNotificationPermission
            })
        ),

        // Utilisation du composant PlanningModals nettoyé
        React.createElement(window.PlanningModals, {
            showAddModal,
            setShowAddModal,
            selectedEvent,
            newEventDate,
            categories,
            onSaveEvent: handleSaveEvent,
            onDeleteEvent: handleDeleteEvent,
            showCategoryModal,
            setShowCategoryModal,
            editingCategory,
            onEditCategoryClick: handleEditCategoryClick,
            onCancelEditCategory: handleCancelEdit,
            onDeleteCategory: handleDeleteCategory,
            onSaveCategory: handleSaveCategory
        })
    );
};

// Make it available globally
window.ProductionPlanning = ProductionPlanning;