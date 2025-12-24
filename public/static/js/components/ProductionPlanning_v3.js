const ProductionPlanning = ({ onClose }) => {
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
    const [viewMode, setViewMode] = React.useState('calendar');
    
    const DEFAULT_CATEGORIES = [
        { id: 'prod', label: 'Production', icon: 'fa-industry', color: 'blue' },
        { id: 'maint', label: 'Maintenance', icon: 'fa-tools', color: 'orange' },
        { id: 'log', label: 'Logistique', icon: 'fa-truck', color: 'purple' },
        { id: 'qual', label: 'Qualité', icon: 'fa-clipboard-check', color: 'green' },
        { id: 'sst', label: 'SST / Sécurité', icon: 'fa-hard-hat', color: 'red' },
        { id: 'admin', label: 'Admin / RH', icon: 'fa-users', color: 'gray' }
    ];

    const [categories, setCategories] = React.useState(DEFAULT_CATEGORIES);
    const [showCategoryModal, setShowCategoryModal] = React.useState(false);
    const [editingCategory, setEditingCategory] = React.useState(null);

    const [events, setEvents] = React.useState([]);
    const [plannerNotes, setPlannerNotes] = React.useState([]);

    const [isRefreshing, setIsRefreshing] = React.useState(false);

    const loadData = () => {
        setIsRefreshing(true);
        axios.get('/api/planning?t=' + Date.now())
            .then(res => {
                const data = res.data;
                if (data.categories && Array.isArray(data.categories) && data.categories.length > 0) {
                    setCategories(data.categories);
                }
                if (data.events) setEvents(data.events);
                if (data.notes) setPlannerNotes(data.notes);
            })
            .catch(err => {
                console.error('Error loading planning data:', err);
            })
            .finally(() => {
                setIsRefreshing(false);
            });
    };

    React.useEffect(() => {
        loadData();
    }, []);

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

    const handleSaveCategory = (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        
        if (editingCategory) {
            const updatedCat = {
                label: formData.get('label'),
                color: formData.get('color'),
                icon: formData.get('icon')
            };
            
            setCategories(categories.map(c => 
                c.id === editingCategory.id ? { ...c, ...updatedCat } : c
            ));
            setEditingCategory(null);

            axios.put(`/api/planning/categories/${editingCategory.id}`, updatedCat)
                .catch(err => console.error('Error updating category:', err));

        } else {
            const newCat = {
                id: 'cat_' + Date.now(),
                label: formData.get('label'),
                color: formData.get('color'),
                icon: formData.get('icon')
            };
            
            setCategories([...categories, newCat]);

            axios.post('/api/planning/categories', newCat)
                .catch(err => console.error('Error creating category:', err));
        }
        e.target.reset();
    };

    const handleEditCategoryClick = (cat) => {
        setEditingCategory(cat);
    };

    const handleCancelEdit = () => {
        setEditingCategory(null);
    };

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

    const [draggedEventId, setDraggedEventId] = React.useState(null);
    const [showMobileNotes, setShowMobileNotes] = React.useState(false);
    
    const [showShareModal, setShowShareModal] = React.useState(false);

    const handleSharePlanning = async (userId, message) => {
        try {
            await axios.post('/api/planning/share', { targetUserId: userId, message });
            alert('Invitation envoyée avec succès !');
        } catch (err) {
            console.error(err);
            alert('Erreur lors de l\'envoi : ' + (err.response?.data?.error || err.message));
            throw err;
        }
    };

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
                        new Notification("Rappel IGP Production", {
                            body: note.text,
                            icon: "https://cdn-icons-png.flaticon.com/512/1028/1028918.png"
                        });
                        
                        hasChanges = true;
                        return { ...note, notified: true };
                    }
                    return note;
                });
                return hasChanges ? nextNotes : prevNotes;
            });
        }, 30000);

        return () => clearInterval(interval);
    }, [notificationPerm]);

    const handleAddNote = (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const text = formData.get('text');
        const time = formData.get('time');
        const date = formData.get('date');
        const is_dashboard = formData.get('is_dashboard') === 'on';

        if (!text) return;

        const newNote = {
            id: Date.now(),
            text: text,
            time: time,
            date: date,
            done: false,
            priority: 'medium',
            notified: false,
            is_dashboard: is_dashboard
        };
        
        setPlannerNotes(current => {
            const updatedNotes = [...current, newNote];
            // Note: On permet maintenant d'avoir plusieurs notes "Dashboard" actives
            // La logique exclusive a été retirée du backend et du frontend
            return updatedNotes;
        });
        
        axios.post('/api/planning/notes', newNote)
        .then(res => {
             const savedNote = res.data;
             setPlannerNotes(current => current.map(n => n.id === newNote.id ? savedNote : n));
        })
        .catch(err => {
            console.error('Error adding note:', err);
            alert('Erreur lors de l\'ajout : ' + (err.response?.data?.error || err.message));
            setPlannerNotes(current => current.filter(n => n.id !== newNote.id));
        });
        
        e.target.reset();
    };

    const handleUpdateNote = (id, updatedData) => {
        // Optimistic update
        setPlannerNotes(current => current.map(n => {
            if (n.id === id) {
                return { ...n, ...updatedData };
            }
            return n;
        }));

        axios.put(`/api/planning/notes/${id}`, updatedData)
            .then(res => {
                if (res.data.note) {
                    // Update with real server data (handles int/bool conversion)
                    setPlannerNotes(current => current.map(n => n.id === id ? res.data.note : n));
                }
            })
            .catch(err => {
                console.error('Error updating note:', err);
                alert('Erreur lors de la mise à jour : ' + (err.response?.data?.error || err.message));
                // Revert optimistic update on error
                setPlannerNotes(current => current.map(n => n.id === id ? { ...n, is_dashboard: !updatedData.is_dashboard } : n));
            });
    };

    const toggleNote = (id) => {
        const note = plannerNotes.find(n => n.id === id);
        if (!note) return;
        handleUpdateNote(id, { done: !note.done });
    };

    const deleteNote = (id) => {
        setPlannerNotes(plannerNotes.filter(n => n.id !== id));
        
        axios.delete(`/api/planning/notes/${id}`)
            .catch(err => console.error('Error deleting note:', err));
    };

    const [showAddModal, setShowAddModal] = React.useState(false);
    const [selectedEvent, setSelectedEvent] = React.useState(null);
    const [newEventDate, setNewEventDate] = React.useState('');

    const handleEditEventClick = (e, evt) => {
        e.stopPropagation();
        setSelectedEvent(evt);
        setNewEventDate(evt.date);
        setShowAddModal(true);
    };

    const handleSaveEvent = (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const dateVal = formData.get('date');
        const showOnTv = formData.get('show_on_tv') === 'on';
        const isPopup = formData.get('is_popup') === 'on';
        const imageUrl = formData.get('image_url');
        const displayDuration = formData.get('display_duration');
        
        if (selectedEvent) {
            const updatedEvent = {
                date: dateVal,
                time: formData.get('time'),
                type: formData.get('type'),
                title: formData.get('title'),
                details: formData.get('details'),
                show_on_tv: showOnTv,
                is_popup: isPopup,
                image_url: imageUrl,
                display_duration: displayDuration ? parseInt(displayDuration) : 15
            };

            setEvents(prevEvents => prevEvents.map(evt => {
                if (evt.id === selectedEvent.id) {
                    return { ...evt, ...updatedEvent };
                }
                return evt;
            }));
            
            axios.put(`/api/planning/events/${selectedEvent.id}`, updatedEvent)
                .catch(err => console.error('Error updating event:', err));

        } else {
            const newEvent = {
                id: Date.now(),
                date: dateVal,
                time: formData.get('time'),
                type: formData.get('type'),
                status: 'confirmed',
                title: formData.get('title'),
                details: formData.get('details'),
                show_on_tv: showOnTv,
                is_popup: isPopup,
                image_url: imageUrl,
                display_duration: displayDuration ? parseInt(displayDuration) : 15
            };
            
            setEvents([...events, newEvent]);

            axios.post('/api/planning/events', newEvent)
            .then(res => {
                const savedEvent = res.data;
                setEvents(currentEvents => currentEvents.map(evt => 
                    evt.id === newEvent.id ? savedEvent : evt
                ));
            })
            .catch(err => console.error('Error creating event:', err));
        }
        setShowAddModal(false);
        setSelectedEvent(null);
    };

    const handleDeleteEvent = () => {
        if (selectedEvent) {
            setEvents(prevEvents => prevEvents.filter(evt => evt.id !== selectedEvent.id));
            
            axios.delete(`/api/planning/events/${selectedEvent.id}`)
                .catch(err => console.error('Error deleting event:', err));
            
            setShowAddModal(false);
            setSelectedEvent(null);
        }
    };

    const handleDragStart = (e, eventId) => {
        setDraggedEventId(eventId);
        e.dataTransfer.effectAllowed = 'move';
        e.target.style.opacity = '0.5';
    };

    const handleDragEnd = (e) => {
        e.target.style.opacity = '1';
        setDraggedEventId(null);
    };

    const handleDragOver = (e) => {
        e.preventDefault();
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

        axios.put(`/api/planning/events/${draggedEventId}`, { date: targetDate })
            .catch(err => console.error('Error moving event:', err));
    };

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    const days = Array.from({ length: daysInMonth }, (_, i) => {
        const dayNum = i + 1;
        const dateObj = new Date(year, month, dayNum);
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
        return {
            num: dayNum,
            dateStr: dateStr,
            dayOfWeek: dateObj.getDay()
        };
    });

    // Show all days including weekends
    const displayDays = days;

    const getEventsForDay = (dateStr) => {
        return events.filter(e => {
            if (e.date !== dateStr) return false;
            if (activeFilter === 'all') return true;
            return e.type == activeFilter; // Loose equality for number/string mismatch
        });
    };

    return React.createElement('div', { className: 'fixed inset-0 z-[150] bg-gray-100 flex flex-col animate-fadeIn' },
        React.createElement('div', { className: 'bg-white border-b p-3 lg:px-6 lg:py-3 flex flex-col md:flex-row justify-between items-start md:items-center gap-3 md:gap-0 shadow-sm z-20 shrink-0' },
            React.createElement('div', { className: 'flex-1 min-w-0 w-full md:w-auto' },
                React.createElement('h1', { className: 'text-lg lg:text-2xl font-bold text-slate-800 flex items-center gap-2 lg:gap-3 truncate' },
                    React.createElement('div', { className: 'bg-blue-600 text-white w-8 h-8 rounded-lg flex items-center justify-center shadow-sm shrink-0' },
                        React.createElement('i', { className: 'far fa-calendar-alt text-lg' })
                    ),
                    React.createElement('span', { className: 'truncate' }, 'Planning & Production')
                ),
                React.createElement('div', { className: 'flex items-center gap-2 text-xs text-slate-500 mt-1' },
                    React.createElement('span', null, window.APP_COMPANY_NAME || 'Entreprise'),
                    React.createElement('i', { className: 'fas fa-circle text-[4px] text-slate-300' }),
                    React.createElement('span', null, 'Vue Directeur')
                )
            ),
            React.createElement('div', { className: 'flex items-center justify-between md:justify-end gap-2 w-full md:w-auto' },
                React.createElement('div', { className: 'flex items-center gap-2' },
                    React.createElement('button', { 
                        onClick: () => setShowCategoryModal(true),
                        className: 'w-10 h-10 flex items-center justify-center rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 transition shadow-sm'
                    }, React.createElement('i', { className: 'fas fa-cog' })),

                    React.createElement('button', { 
                        onClick: () => setShowMobileNotes(!showMobileNotes),
                        className: `lg:hidden w-10 h-10 flex items-center justify-center rounded-lg transition ${showMobileNotes ? 'bg-yellow-100 text-yellow-600' : 'bg-gray-100 text-gray-500'}`
                    }, React.createElement('i', { className: 'fas fa-sticky-note' }))
                ),

                React.createElement('div', { className: 'flex items-center gap-2' },
                    React.createElement('button', { 
                        onClick: loadData,
                        title: 'Rafraîchir les données',
                        className: 'w-10 h-10 flex items-center justify-center rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 transition shadow-sm'
                    }, React.createElement('i', { className: `fas fa-sync-alt ${isRefreshing ? 'fa-spin text-blue-600' : ''}` })),

                    React.createElement('button', {
                        onClick: () => setShowShareModal(true),
                        title: 'Partager le planning',
                        className: 'w-10 h-10 flex items-center justify-center rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-blue-50 hover:text-blue-600 transition shadow-sm'
                    }, React.createElement('i', { className: 'fas fa-share-alt' })),

                    React.createElement('button', { 
                        onClick: () => setViewMode(viewMode === 'calendar' ? 'list' : 'calendar'),
                        title: viewMode === 'calendar' ? 'Passer en vue TV / Liste' : 'Passer en vue Calendrier',
                        className: `w-10 h-10 flex items-center justify-center rounded-lg border transition shadow-sm ${viewMode === 'list' ? 'bg-slate-800 text-white border-slate-900' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`
                    }, React.createElement('i', { className: viewMode === 'calendar' ? 'fas fa-tv' : 'fas fa-calendar-alt' })),

                    // Bouton Admin TV
                    React.createElement('button', { 
                        onClick: () => window.open('/admin/tv', '_blank'),
                        title: 'Configuration écran TV',
                        className: 'w-10 h-10 flex items-center justify-center rounded-lg border transition shadow-sm bg-white border-slate-200 text-purple-600 hover:bg-purple-50 hover:border-purple-300'
                    }, React.createElement('i', { className: 'fas fa-desktop' })),

                    React.createElement('button', { 
                        onClick: () => { 
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
                    React.createElement('div', { className: 'h-8 w-px bg-gray-200 mx-1 hidden md:block' }),
                    React.createElement('button', {
                        onClick: onClose,
                        className: 'bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg font-medium transition shadow-sm'
                    }, 'Fermer')
                )
            )
        ),

        React.createElement('div', { className: 'bg-white border-b py-2 px-2 lg:px-6 flex flex-col lg:flex-row gap-3 lg:gap-4 items-stretch lg:items-center shadow-sm z-10 shrink-0' },
            React.createElement('div', { className: 'flex items-center overflow-hidden w-full lg:w-auto min-w-0' },
                React.createElement('span', { className: 'text-xs font-bold text-slate-400 uppercase tracking-wider mr-2 shrink-0 hidden lg:inline' }, 'Filtres :'),
                
                React.createElement('div', { 
                    className: 'flex overflow-x-auto gap-2 items-center pb-2 lg:pb-0 w-full no-scrollbar mask-linear-fade',
                    style: { scrollbarWidth: 'none', msOverflowStyle: 'none', WebkitOverflowScrolling: 'touch' }
                },
                    React.createElement('button', {
                        onClick: () => setActiveFilter('all'),
                        className: `px-4 py-2 rounded-full text-sm font-bold transition-all duration-200 border whitespace-nowrap flex-shrink-0 ${activeFilter === 'all' ? 'bg-slate-800 text-white border-slate-900 shadow-md transform scale-105' : 'bg-white text-slate-600 border-slate-300 hover:border-slate-400 shadow-sm'}`
                    }, 'Tout Voir'),
                    
                    categories.length === 0 ? React.createElement('span', { className: 'text-xs text-gray-400 italic whitespace-nowrap px-2' }, 'Aucune catégorie') : null,

                    categories.map(cat => {
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

        React.createElement('div', { className: 'flex-1 flex flex-col lg:flex-row overflow-hidden relative' },
            
            viewMode === 'list' ? (
                React.createElement('div', { className: 'flex-1 flex flex-col bg-slate-50 lg:border-r border-gray-200 overflow-y-auto p-4 lg:p-8' },
                    React.createElement('div', { className: 'max-w-5xl mx-auto w-full space-y-8' },
                        (() => {
                            const filteredEvents = events.filter(evt => {
                                const evtDate = new Date(evt.date);
                                if (evtDate.getMonth() !== currentDate.getMonth() || evtDate.getFullYear() !== currentDate.getFullYear()) return false;
                                if (activeFilter !== 'all' && evt.type !== activeFilter) return false;
                                return true;
                            }).sort((a, b) => new Date(a.date) - new Date(b.date));

                            if (filteredEvents.length === 0) {
                                return React.createElement('div', { className: 'text-center py-20 text-gray-400' },
                                    React.createElement('i', { className: 'fas fa-calendar-times text-6xl mb-4 opacity-50' }),
                                    React.createElement('p', { className: 'text-xl font-medium' }, 'Aucun événement pour ce mois')
                                );
                            }

                            const eventsByDate = filteredEvents.reduce((acc, evt) => {
                                if (!acc[evt.date]) acc[evt.date] = [];
                                acc[evt.date].push(evt);
                                return acc;
                            }, {});

                            return Object.keys(eventsByDate).map(dateStr => {
                                const dateObj = new Date(dateStr);
                                const dateLabel = dateObj.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
                                
                                return React.createElement('div', { key: dateStr, className: 'animate-slideIn' },
                                    React.createElement('h3', { className: 'text-2xl font-bold text-slate-800 mb-4 capitalize flex items-center gap-3 border-b border-slate-200 pb-2' }, 
                                        React.createElement('span', { className: 'text-blue-600' }, dateObj.getDate()),
                                        dateLabel
                                    ),
                                    React.createElement('div', { className: 'grid gap-4' },
                                        eventsByDate[dateStr].map(evt => {
                                            const cat = categories.find(c => c.id === evt.type);
                                            const baseStyle = getCategoryStyle(evt.type, evt.status);
                                            
                                            return React.createElement('div', { 
                                                key: evt.id,
                                                onClick: (e) => handleEditEventClick(e, evt),
                                                className: `bg-white rounded-xl shadow-sm border-l-8 p-6 cursor-pointer hover:shadow-lg transition-all ${baseStyle.replace('border-l-4', 'border-l-8')}`
                                            },
                                                React.createElement('div', { className: 'flex flex-col md:flex-row md:items-start justify-between gap-4' },
                                                    React.createElement('div', { className: 'flex-1' },
                                                        React.createElement('div', { className: 'flex items-center gap-3 mb-2' },
                                                            React.createElement('span', { className: `px-3 py-1 rounded-full text-sm font-bold uppercase tracking-wider flex items-center gap-2 w-fit ${
                                                                cat?.color === 'blue' ? 'bg-blue-100 text-blue-800' :
                                                                cat?.color === 'green' ? 'bg-green-100 text-green-800' :
                                                                cat?.color === 'red' ? 'bg-red-100 text-red-800' :
                                                                cat?.color === 'yellow' ? 'bg-yellow-100 text-yellow-800' :
                                                                'bg-gray-100 text-gray-800'
                                                            }` },
                                                                React.createElement('i', { className: `fas ${cat?.icon || 'fa-circle'}` }),
                                                                cat?.label || 'Autre'
                                                            ),
                                                            evt.status === 'tentative' && React.createElement('span', { className: 'text-amber-500 font-bold text-sm flex items-center gap-1' },
                                                                React.createElement('i', { className: 'fas fa-question-circle' }), 'À confirmer'
                                                            )
                                                        ),
                                                        React.createElement('h4', { className: 'text-2xl font-bold text-slate-900 mb-2 leading-snug flex items-center gap-2' }, 
                                                            evt.time && React.createElement('span', { className: 'text-lg font-mono font-normal text-slate-500 bg-slate-100 px-2 py-0.5 rounded' }, evt.time),
                                                            evt.title
                                                        ),
                                                        evt.details && React.createElement('div', { className: 'text-lg text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-lg border border-slate-100 mt-2' }, 
                                                            evt.details.split('\n').map((line, i) => React.createElement('p', { key: i, className: 'mb-1 last:mb-0' }, line))
                                                        )
                                                    ),
                                                    React.createElement('div', { className: 'flex items-center gap-2 md:flex-col shrink-0' },
                                                        React.createElement('button', { className: 'w-12 h-12 flex items-center justify-center rounded-full bg-slate-100 text-slate-400 hover:bg-blue-50 hover:text-blue-600 transition' },
                                                            React.createElement('i', { className: 'fas fa-pen text-xl' })
                                                        )
                                                    )
                                                )
                                            );
                                        })
                                    )
                                );
                            });
                        })()
                    )
                )
            ) : (
                React.createElement('div', { className: 'flex-1 flex flex-col bg-slate-50 lg:border-r border-gray-200 overflow-hidden' },
                    React.createElement('div', { className: 'hidden lg:grid grid-cols-7 border-b bg-white shadow-sm' },
                        ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'].map(day => 
                            React.createElement('div', { key: day, className: 'py-3 text-center text-xs font-bold text-slate-400 uppercase tracking-wider' }, day)
                        )
                    ),

                    React.createElement('div', { className: 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-7 flex-1 overflow-y-auto p-3 lg:p-4 gap-3 lg:gap-4 pb-20 lg:pb-4' },
                        // Add empty cells for offset to align first day
                        Array.from({ length: new Date(year, month, 1).getDay() }).map((_, i) => 
                            React.createElement('div', { key: `empty-${i}`, className: 'hidden lg:block bg-transparent' })
                        ),
                        displayDays.map((dayObj, idx) => {
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
                                        React.createElement('span', { className: 'lg:hidden text-sm font-bold text-slate-500 uppercase' }, dayNames[dayObj.dayOfWeek])
                                    ),
                                    React.createElement('div', { className: 'flex items-center gap-1' },
                                        dayEvents.length > 0 && React.createElement('span', { 
                                            className: 'text-[10px] font-bold text-slate-500 bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded-md' 
                                        }, `${dayEvents.length}`),
                                        React.createElement('button', { 
                                            onClick: () => { setSelectedEvent(null); setNewEventDate(dayObj.dateStr); setShowAddModal(true); },
                                            className: 'opacity-100 lg:opacity-0 lg:group-hover:opacity-100 text-slate-400 hover:text-blue-600 transition p-1' 
                                        }, React.createElement('i', { className: 'fas fa-plus-circle text-lg' }))
                                    )
                                ),
                                
                                React.createElement('div', { className: 'flex-1 overflow-y-auto space-y-1 custom-scrollbar' },
                                    dayEvents.map((evt, eIdx) => 
                                        React.createElement('div', { 
                                            key: evt.id || eIdx, 
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
                                            React.createElement('div', { className: 'truncate font-medium leading-tight' }, 
                                                evt.time && React.createElement('span', { className: 'mr-1 font-mono text-[10px] opacity-75 bg-white/50 px-1 rounded' }, evt.time),
                                                evt.title
                                            ),
                                            evt.details && React.createElement('div', { className: 'text-[10px] opacity-75 truncate mt-0.5' }, evt.details)
                                        )
                                    )
                                )
                            );
                        })
                    )
                )
            ),

            viewMode === 'calendar' ? React.createElement(window.PlanningNotes, {
                notes: plannerNotes,
                showMobile: showMobileNotes,
                onCloseMobile: () => setShowMobileNotes(false),
                onAdd: handleAddNote,
                onUpdate: handleUpdateNote,
                onToggle: toggleNote,
                onDelete: deleteNote,
                notificationPerm: notificationPerm,
                onRequestPerm: requestNotificationPermission
            }) : null
        ),

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
        }),

        showShareModal && React.createElement(ShareModal, {
            onClose: () => setShowShareModal(false),
            onShare: handleSharePlanning
        })
    );
};

const ShareModal = ({ onClose, onShare }) => {
    const [users, setUsers] = React.useState([]);
    const [selectedUser, setSelectedUser] = React.useState('');
    const [message, setMessage] = React.useState('');
    const [loading, setLoading] = React.useState(true);
    const [sending, setSending] = React.useState(false);
    const [error, setError] = React.useState(null);

    React.useEffect(() => {
        axios.get('/api/messages/available-users')
            .then(res => {
                setUsers(res.data.users || []);
                setLoading(false);
            })
            .catch(err => {
                console.error('Error fetching users:', err);
                setError('Impossible de charger les utilisateurs');
                setLoading(false);
            });
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!selectedUser) return;
        
        setSending(true);
        try {
            await onShare(selectedUser, message);
            onClose();
        } catch (err) {
            setError('Erreur lors du partage');
            setSending(false);
        }
    };

    return React.createElement('div', { className: 'fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fadeIn' },
        React.createElement('div', { className: 'bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-slideUp' },
            React.createElement('div', { className: 'p-4 border-b flex justify-between items-center bg-gray-50' },
                React.createElement('h3', { className: 'font-bold text-gray-800 flex items-center gap-2' },
                    React.createElement('i', { className: 'fas fa-share-alt text-blue-600' }),
                    'Partager le planning'
                ),
                React.createElement('button', { onClick: onClose, className: 'text-gray-400 hover:text-gray-600' },
                    React.createElement('i', { className: 'fas fa-times' })
                )
            ),
            React.createElement('form', { onSubmit: handleSubmit, className: 'p-6' },
                error && React.createElement('div', { className: 'mb-4 p-3 bg-red-50 text-red-600 rounded-md text-sm' }, error),
                
                React.createElement('div', { className: 'mb-4' },
                    React.createElement('label', { className: 'block text-sm font-medium text-gray-700 mb-1' }, 'Destinataire'),
                    loading ? 
                        React.createElement('div', { className: 'text-sm text-gray-500' }, 'Chargement...') :
                        React.createElement('select', {
                            className: 'w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 outline-none',
                            value: selectedUser,
                            onChange: (e) => setSelectedUser(e.target.value),
                            required: true
                        },
                            React.createElement('option', { value: '' }, '-- Sélectionner un utilisateur --'),
                            users.map(u => React.createElement('option', { key: u.id, value: u.id }, u.full_name || u.email))
                        )
                ),
                
                React.createElement('div', { className: 'mb-6' },
                    React.createElement('label', { className: 'block text-sm font-medium text-gray-700 mb-1' }, 'Message (optionnel)'),
                    React.createElement('textarea', {
                        className: 'w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 outline-none text-sm',
                        rows: 3,
                        value: message,
                        onChange: (e) => setMessage(e.target.value),
                        placeholder: "Je vous invite à consulter le planning de production..."
                    })
                ),
                
                React.createElement('div', { className: 'flex justify-end gap-3' },
                    React.createElement('button', {
                        type: 'button',
                        onClick: onClose,
                        className: 'px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-md'
                    }, 'Annuler'),
                    React.createElement('button', {
                        type: 'submit',
                        disabled: !selectedUser || sending,
                        className: `px-4 py-2 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-md shadow-sm flex items-center gap-2 ${sending ? 'opacity-70 cursor-not-allowed' : ''}`
                    },
                        sending && React.createElement('i', { className: 'fas fa-spinner fa-spin' }),
                        'Envoyer l\'invitation'
                    )
                )
            )
        )
    );
};

window.ProductionPlanning = ProductionPlanning;