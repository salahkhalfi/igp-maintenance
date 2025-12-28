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

    // ========== IMPRESSION PDF PLANNING - MULTI-FORMAT ==========
    const [showPrintModal, setShowPrintModal] = React.useState(false);
    const [printFormat, setPrintFormat] = React.useState('month');
    const [selectedPrintDate, setSelectedPrintDate] = React.useState(null);
    
    const handlePrintPlanning = () => {
        setSelectedPrintDate(new Date(currentDate));
        setShowPrintModal(true);
    };
    
    const executePrint = async (format, selectedDate) => {
        setShowPrintModal(false);
        // Utiliser la date passée par le modal, sinon fallback sur currentDate
        const baseDate = selectedDate || selectedPrintDate || currentDate;
        const year = baseDate.getFullYear();
        const month = baseDate.getMonth();
        
        // Charger les infos compagnie
        let companyTitle = 'Système de Maintenance';
        let companySubtitle = '';
        let logoUrl = '';
        try {
            const [titleRes, subtitleRes] = await Promise.all([
                axios.get('/api/settings/company_title').catch(() => null),
                axios.get('/api/settings/company_subtitle').catch(() => null)
            ]);
            if (titleRes?.data?.value) companyTitle = titleRes.data.value;
            if (subtitleRes?.data?.value) companySubtitle = subtitleRes.data.value;
            logoUrl = '/api/settings/logo?t=' + Date.now();
        } catch (e) { /* Utiliser valeurs par défaut */ }
        
        // Charger tous les tickets planifiés
        let allTickets = [];
        try {
            const ticketsRes = await axios.get('/api/tickets?status=assigned,in_progress,diagnostic,waiting_parts,received');
            if (ticketsRes?.data?.tickets) {
                allTickets = ticketsRes.data.tickets.filter(t => t.scheduled_date);
            }
        } catch (e) { /* Ignorer */ }
        
        // Couleurs par catégorie
        const categoryColors = {
            blue: { bg: '#dbeafe', border: '#3b82f6', text: '#1e40af' },
            green: { bg: '#dcfce7', border: '#22c55e', text: '#166534' },
            red: { bg: '#fee2e2', border: '#ef4444', text: '#991b1b' },
            yellow: { bg: '#fef9c3', border: '#eab308', text: '#854d0e' },
            purple: { bg: '#f3e8ff', border: '#a855f7', text: '#6b21a8' },
            orange: { bg: '#ffedd5', border: '#f97316', text: '#9a3412' },
            gray: { bg: '#f3f4f6', border: '#6b7280', text: '#374151' }
        };
        
        const priorityColors = { critical: '#dc2626', high: '#ea580c', medium: '#ca8a04', low: '#16a34a' };
        const priorityLabels = { critical: 'CRITIQUE', high: 'HAUTE', medium: 'MOYENNE', low: 'BASSE' };
        const statusLabels = { received: 'Reçu', assigned: 'Assigné', in_progress: 'En cours', diagnostic: 'Diagnostic', waiting_parts: 'Attente pièces', completed: 'Terminé' };
        
        let printContent = '';
        
        // ===== FORMAT MOIS - Timeline Stratégique =====
        if (format === 'month') {
            const monthName = baseDate.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
            const daysInMonth = new Date(year, month + 1, 0).getDate();
            
            const monthEvents = events.filter(e => {
                const d = new Date(e.date);
                return d.getMonth() === month && d.getFullYear() === year;
            }).sort((a, b) => new Date(a.date) - new Date(b.date));
            
            const monthTickets = allTickets.filter(t => {
                const d = new Date(t.scheduled_date);
                return d.getMonth() === month && d.getFullYear() === year;
            }).sort((a, b) => new Date(a.scheduled_date) - new Date(b.scheduled_date));
            
            // Grouper par jour
            const dayGroups = {};
            for (let d = 1; d <= daysInMonth; d++) {
                const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
                const dayDate = new Date(year, month, d);
                const dayEvents = monthEvents.filter(e => e.date === dateStr);
                const dayTickets = monthTickets.filter(t => new Date(t.scheduled_date).getDate() === d);
                if (dayEvents.length > 0 || dayTickets.length > 0) {
                    dayGroups[d] = { date: dayDate, events: dayEvents, tickets: dayTickets };
                }
            }
            
            // KPIs
            const totalEvents = monthEvents.length;
            const totalTickets = monthTickets.length;
            const criticalTickets = monthTickets.filter(t => t.priority === 'critical' || t.priority === 'high').length;
            const categoryStats = categories.map(cat => ({
                ...cat,
                count: monthEvents.filter(e => e.type === cat.id).length
            })).filter(c => c.count > 0);
            
            // Timeline HTML
            let timelineHtml = '';
            Object.keys(dayGroups).forEach(day => {
                const group = dayGroups[day];
                const dateLabel = group.date.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
                const isWeekend = group.date.getDay() === 0 || group.date.getDay() === 6;
                
                let itemsHtml = '';
                group.events.forEach(evt => {
                    const cat = categories.find(c => c.id === evt.type);
                    const colors = categoryColors[cat?.color] || categoryColors.gray;
                    itemsHtml += `
                        <div class="timeline-event" style="border-left-color: ${colors.border}; background: ${colors.bg};">
                            <div class="event-header">
                                <span class="event-time">${evt.time || '—'}</span>
                                <span class="event-category" style="color: ${colors.text};">${cat?.label || evt.type}</span>
                                <span class="event-status ${evt.status}">${evt.status === 'tentative' ? '⏳' : '✅'}</span>
                            </div>
                            <div class="event-title">${evt.title}</div>
                            ${evt.details ? `<div class="event-details">${evt.details}</div>` : ''}
                        </div>
                    `;
                });
                group.tickets.forEach(ticket => {
                    const schedTime = new Date(ticket.scheduled_date);
                    const timeStr = schedTime.getHours() ? schedTime.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : '—';
                    itemsHtml += `
                        <div class="timeline-ticket">
                            <div class="ticket-header">
                                <span class="ticket-time">${timeStr}</span>
                                <span class="ticket-priority" style="color: ${priorityColors[ticket.priority] || '#374151'};">${priorityLabels[ticket.priority] || ticket.priority}</span>
                                <span class="ticket-id">#${ticket.ticket_id}</span>
                            </div>
                            <div class="ticket-title">🔧 ${ticket.title}</div>
                            <div class="ticket-meta">
                                ${ticket.assignee_name ? `<span>👤 ${ticket.assignee_name}</span>` : '<span class="unassigned">⚠️ Non assigné</span>'}
                                ${ticket.machine_name ? `<span>🏭 ${ticket.machine_name}</span>` : ''}
                            </div>
                        </div>
                    `;
                });
                
                const itemCount = group.events.length + group.tickets.length;
                timelineHtml += `
                    <div class="timeline-day ${isWeekend ? 'weekend' : ''}">
                        <div class="day-header">
                            <span class="day-date">${dateLabel}</span>
                            <span class="day-count">${itemCount} élément${itemCount > 1 ? 's' : ''}</span>
                        </div>
                        <div class="day-items">${itemsHtml}</div>
                    </div>
                `;
            });
            
            if (Object.keys(dayGroups).length === 0) {
                timelineHtml = '<div class="no-data">Aucun événement ou maintenance planifié ce mois</div>';
            }
            
            printContent = `
                <html>
                <head>
                    <title>Planning Mensuel - ${monthName}</title>
                    <style>
                        @page { size: A4; margin: 0; }
                        * { box-sizing: border-box; margin: 0; padding: 0; }
                        body { font-family: 'Segoe UI', -apple-system, Arial, sans-serif; padding: 18mm 15mm 20mm 15mm; font-size: 11px; color: #1a1a1a; line-height: 1.4; }
                        
                        /* === HEADER === */
                        .header { display: flex; justify-content: space-between; align-items: center; padding-bottom: 14px; margin-bottom: 16px; border-bottom: 2px solid #d1d5db; }
                        .company-section { display: flex; align-items: center; gap: 12px; }
                        .company-logo { max-height: 40px; max-width: 90px; }
                        .company-info { }
                        .company-title { font-size: 15px; font-weight: 700; color: #111827; }
                        .company-subtitle { font-size: 10px; color: #4b5563; margin-top: 2px; }
                        .report-section { text-align: right; }
                        .report-badge { display: inline-block; background: #1e40af; color: white; font-size: 9px; font-weight: 600; padding: 3px 8px; border-radius: 3px; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 5px; }
                        .report-title { font-size: 13px; font-weight: 700; color: #111827; text-transform: capitalize; }
                        .report-generated { font-size: 9px; color: #6b7280; margin-top: 3px; }
                        
                        /* === KPI BAR === */
                        .kpi-bar { display: flex; gap: 0; margin-bottom: 16px; border: 1px solid #d1d5db; border-radius: 6px; overflow: hidden; }
                        .kpi-item { flex: 1; text-align: center; padding: 10px 6px; border-right: 1px solid #d1d5db; background: #f9fafb; }
                        .kpi-item:last-child { border-right: none; }
                        .kpi-value { font-size: 20px; font-weight: 700; color: #111827; }
                        .kpi-label { font-size: 8px; color: #4b5563; text-transform: uppercase; letter-spacing: 0.3px; margin-top: 2px; }
                        .kpi-item.highlight { background: #fef3c7; }
                        .kpi-item.highlight .kpi-value { color: #92400e; }
                        .kpi-item.alert .kpi-value { color: #b91c1c; }
                        
                        /* === CATEGORY BAR === */
                        .category-bar { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 16px; }
                        .cat-badge { padding: 3px 8px; border-radius: 12px; font-size: 9px; font-weight: 600; }
                        
                        /* === TIMELINE DAYS === */
                        .timeline-day { margin-bottom: 10px; border: 1px solid #d1d5db; border-radius: 6px; overflow: hidden; page-break-inside: avoid; }
                        .timeline-day.weekend { opacity: 0.75; }
                        .day-header { display: flex; justify-content: space-between; align-items: center; padding: 8px 12px; background: #f3f4f6; border-bottom: 1px solid #d1d5db; }
                        .day-date { font-weight: 600; font-size: 11px; color: #111827; text-transform: capitalize; }
                        .day-count { font-size: 9px; color: #4b5563; }
                        .day-items { padding: 8px 12px; background: white; }
                        
                        /* === TIMELINE ITEMS === */
                        .timeline-event { display: flex; gap: 10px; padding: 8px 10px; margin-bottom: 6px; border-radius: 4px; border-left: 3px solid #d1d5db; background: #f9fafb; }
                        .timeline-event:last-child { margin-bottom: 0; }
                        .event-header { display: flex; gap: 8px; align-items: center; margin-bottom: 3px; font-size: 9px; }
                        .event-time { font-weight: 600; color: #374151; min-width: 42px; }
                        .event-category { font-weight: 600; }
                        .event-status { margin-left: auto; font-size: 9px; color: #4b5563; }
                        .event-title { font-weight: 600; font-size: 11px; color: #111827; }
                        .event-details { font-size: 9px; color: #4b5563; margin-top: 2px; }
                        
                        .timeline-ticket { display: flex; gap: 10px; padding: 8px 10px; margin-bottom: 6px; border-left: 3px solid #d97706; background: #fffbeb; border-radius: 4px; }
                        .timeline-ticket:last-child { margin-bottom: 0; }
                        .ticket-header { display: flex; gap: 8px; align-items: center; margin-bottom: 3px; font-size: 9px; }
                        .ticket-time { font-weight: 600; color: #374151; min-width: 42px; }
                        .ticket-priority { font-weight: 700; font-size: 8px; background: currentColor; color: white; padding: 2px 6px; border-radius: 8px; }
                        .ticket-id { margin-left: auto; color: #4b5563; font-size: 9px; }
                        .ticket-title { font-weight: 600; font-size: 11px; color: #78350f; }
                        .ticket-meta { display: flex; gap: 10px; font-size: 9px; color: #57534e; margin-top: 4px; }
                        .ticket-meta .unassigned { color: #b91c1c; font-weight: 600; }
                        
                        .no-data { text-align: center; padding: 30px; color: #6b7280; font-style: italic; background: #f9fafb; border-radius: 6px; border: 1px solid #d1d5db; }
                        
                        /* === FOOTER === */
                        .footer { margin-top: 16px; padding-top: 10px; border-top: 1px solid #d1d5db; display: flex; justify-content: space-between; align-items: center; font-size: 9px; color: #6b7280; }
                        
                        @media print { 
                            body { padding: 18mm 15mm 20mm 15mm !important; print-color-adjust: exact; -webkit-print-color-adjust: exact; } 
                            .timeline-day { page-break-inside: avoid; } 
                        }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <div class="company-section">
                            <img src="${logoUrl}" class="company-logo" onerror="this.style.display='none'" />
                            <div class="company-info">
                                <div class="company-title">${companyTitle}</div>
                                ${companySubtitle ? `<div class="company-subtitle">${companySubtitle}</div>` : ''}
                            </div>
                        </div>
                        <div class="report-section">
                            <div class="report-badge">Vue Mensuelle</div>
                            <div class="report-title">${monthName}</div>
                            <div class="report-generated">Généré le ${new Date().toLocaleString('fr-FR')}</div>
                        </div>
                    </div>
                    
                    <div class="kpi-bar">
                        <div class="kpi-item"><div class="kpi-value">${totalEvents}</div><div class="kpi-label">Événements</div></div>
                        <div class="kpi-item highlight"><div class="kpi-value">${totalTickets}</div><div class="kpi-label">Maintenances</div></div>
                        <div class="kpi-item ${criticalTickets > 0 ? 'alert' : ''}"><div class="kpi-value">${criticalTickets}</div><div class="kpi-label">Priorité haute</div></div>
                        <div class="kpi-item"><div class="kpi-value">${Object.keys(dayGroups).length}</div><div class="kpi-label">Jours actifs</div></div>
                    </div>
                    
                    ${categoryStats.length > 0 ? `<div class="category-bar">${categoryStats.map(cat => {
                        const colors = categoryColors[cat.color] || categoryColors.gray;
                        return `<span class="cat-badge" style="background: ${colors.bg}; color: ${colors.text}; border: 1px solid ${colors.border};">${cat.label}: ${cat.count}</span>`;
                    }).join('')}</div>` : ''}
                    
                    ${timelineHtml}
                    
                    <div class="footer">
                        <span>Document confidentiel • Ne pas diffuser</span>
                        <span>${companySubtitle || 'Gestion Maintenance'}</span>
                    </div>
                </body>
                </html>
            `;
        }
        
        // ===== FORMAT SEMAINE - Timeline Vertical (comme le mois) =====
        else if (format === 'week') {
            const startOfWeek = new Date(baseDate);
            const dayOfWeek = startOfWeek.getDay();
            startOfWeek.setDate(startOfWeek.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1)); // Lundi
            
            const weekDays = [];
            for (let i = 0; i < 7; i++) {
                const day = new Date(startOfWeek);
                day.setDate(day.getDate() + i);
                weekDays.push(day);
            }
            
            const weekStart = weekDays[0].toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' });
            const weekEnd = weekDays[6].toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
            const weekNum = Math.ceil((((startOfWeek - new Date(startOfWeek.getFullYear(), 0, 1)) / 86400000) + 1) / 7);
            
            // Collecter les données de la semaine
            let weekEvents = [];
            let weekTickets = [];
            weekDays.forEach(day => {
                const dateStr = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, '0')}-${String(day.getDate()).padStart(2, '0')}`;
                const dayEvts = events.filter(e => e.date === dateStr);
                const dayTkts = allTickets.filter(t => new Date(t.scheduled_date).toDateString() === day.toDateString());
                weekEvents.push(...dayEvts);
                weekTickets.push(...dayTkts);
            });
            
            // KPIs
            const totalEvents = weekEvents.length;
            const totalTickets = weekTickets.length;
            const criticalTickets = weekTickets.filter(t => t.priority === 'critical' || t.priority === 'high').length;
            const daysWithActivity = weekDays.filter(day => {
                const dateStr = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, '0')}-${String(day.getDate()).padStart(2, '0')}`;
                return events.some(e => e.date === dateStr) || allTickets.some(t => new Date(t.scheduled_date).toDateString() === day.toDateString());
            }).length;
            
            // Timeline HTML - format vertical par jour
            let timelineHtml = '';
            weekDays.forEach((day, idx) => {
                const dateStr = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, '0')}-${String(day.getDate()).padStart(2, '0')}`;
                const dayEvents = events.filter(e => e.date === dateStr).sort((a, b) => (a.time || '').localeCompare(b.time || ''));
                const dayTickets = allTickets.filter(t => new Date(t.scheduled_date).toDateString() === day.toDateString())
                    .sort((a, b) => new Date(a.scheduled_date) - new Date(b.scheduled_date));
                
                const isToday = day.toDateString() === new Date().toDateString();
                const isWeekend = idx >= 5;
                const dateLabel = day.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
                const itemCount = dayEvents.length + dayTickets.length;
                
                let itemsHtml = '';
                
                // Événements du jour
                dayEvents.forEach(evt => {
                    const cat = categories.find(c => c.id === evt.type);
                    const colors = categoryColors[cat?.color] || categoryColors.gray;
                    itemsHtml += `
                        <div class="timeline-item event-item" style="border-left-color: ${colors.border}; background: ${colors.bg};">
                            <div class="item-time">${evt.time || '—'}</div>
                            <div class="item-content">
                                <div class="item-header">
                                    <span class="item-category" style="color: ${colors.text};">${cat?.label || evt.type}</span>
                                    <span class="item-status">${evt.status === 'tentative' ? '⏳ Provisoire' : '✓ Confirmé'}</span>
                                </div>
                                <div class="item-title">${evt.title}</div>
                                ${evt.details ? `<div class="item-details">${evt.details}</div>` : ''}
                            </div>
                        </div>
                    `;
                });
                
                // Tickets du jour
                dayTickets.forEach(ticket => {
                    const schedTime = new Date(ticket.scheduled_date);
                    const timeStr = schedTime.getHours() ? schedTime.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : '—';
                    itemsHtml += `
                        <div class="timeline-item ticket-item">
                            <div class="item-time">${timeStr}</div>
                            <div class="item-content">
                                <div class="item-header">
                                    <span class="item-priority" style="background: ${priorityColors[ticket.priority] || '#6b7280'};">${priorityLabels[ticket.priority] || 'N/A'}</span>
                                    <span class="item-ticket-id">#${ticket.ticket_id}</span>
                                </div>
                                <div class="item-title">${ticket.title}</div>
                                <div class="item-meta">
                                    ${ticket.assignee_name ? `<span class="meta-assignee">👤 ${ticket.assignee_name}</span>` : '<span class="meta-unassigned">⚠ Non assigné</span>'}
                                    ${ticket.machine_name ? `<span class="meta-machine">⚙ ${ticket.machine_name}</span>` : ''}
                                </div>
                            </div>
                        </div>
                    `;
                });
                
                // Jour sans activité
                if (!itemsHtml) {
                    itemsHtml = `<div class="empty-day">${isWeekend ? 'Week-end' : 'Aucune activité planifiée'}</div>`;
                }
                
                timelineHtml += `
                    <div class="day-block ${isToday ? 'today' : ''} ${isWeekend ? 'weekend' : ''} ${itemCount === 0 ? 'empty' : ''}">
                        <div class="day-header">
                            <div class="day-label">
                                <span class="day-name">${dateLabel}</span>
                                ${isToday ? '<span class="today-badge">Aujourd\'hui</span>' : ''}
                            </div>
                            <span class="day-count">${itemCount > 0 ? itemCount + ' élément' + (itemCount > 1 ? 's' : '') : ''}</span>
                        </div>
                        <div class="day-content">${itemsHtml}</div>
                    </div>
                `;
            });
            
            printContent = `
                <html>
                <head>
                    <title>Planning Semaine ${weekNum} - ${weekStart} au ${weekEnd}</title>
                    <style>
                        @page { size: A4; margin: 0; }
                        * { box-sizing: border-box; margin: 0; padding: 0; }
                        body { font-family: 'Segoe UI', -apple-system, Arial, sans-serif; padding: 18mm 15mm 20mm 15mm; font-size: 11px; color: #1a1a1a; line-height: 1.4; }
                        
                        /* === HEADER === */
                        .header { display: flex; justify-content: space-between; align-items: center; padding-bottom: 14px; margin-bottom: 16px; border-bottom: 2px solid #d1d5db; }
                        .company-section { display: flex; align-items: center; gap: 12px; }
                        .company-logo { max-height: 40px; max-width: 90px; }
                        .company-info { }
                        .company-title { font-size: 15px; font-weight: 700; color: #111827; }
                        .company-subtitle { font-size: 10px; color: #4b5563; margin-top: 2px; }
                        .report-section { text-align: right; }
                        .report-badge { display: inline-block; background: #1e40af; color: white; font-size: 9px; font-weight: 600; padding: 3px 8px; border-radius: 3px; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 5px; }
                        .report-title { font-size: 13px; font-weight: 700; color: #111827; }
                        .report-period { font-size: 10px; color: #4b5563; margin-top: 3px; }
                        .report-generated { font-size: 9px; color: #6b7280; margin-top: 3px; }
                        
                        /* === KPI BAR === */
                        .kpi-bar { display: flex; gap: 0; margin-bottom: 16px; border: 1px solid #d1d5db; border-radius: 6px; overflow: hidden; }
                        .kpi-item { flex: 1; text-align: center; padding: 10px 6px; border-right: 1px solid #d1d5db; background: #f9fafb; }
                        .kpi-item:last-child { border-right: none; }
                        .kpi-value { font-size: 20px; font-weight: 700; color: #111827; }
                        .kpi-label { font-size: 8px; color: #4b5563; text-transform: uppercase; letter-spacing: 0.3px; margin-top: 2px; }
                        .kpi-item.highlight { background: #fef3c7; }
                        .kpi-item.highlight .kpi-value { color: #92400e; }
                        .kpi-item.alert .kpi-value { color: #b91c1c; }
                        
                        /* === TIMELINE DAYS === */
                        .day-block { margin-bottom: 10px; border: 1px solid #d1d5db; border-radius: 6px; overflow: hidden; page-break-inside: avoid; }
                        .day-block.empty { opacity: 0.65; }
                        .day-block.weekend { background: #f9fafb; }
                        .day-block.today { border: 2px solid #1e40af; }
                        
                        .day-header { display: flex; justify-content: space-between; align-items: center; padding: 8px 12px; background: #f3f4f6; border-bottom: 1px solid #d1d5db; }
                        .day-label { display: flex; align-items: center; gap: 8px; }
                        .day-name { font-weight: 600; font-size: 11px; color: #111827; text-transform: capitalize; }
                        .today-badge { font-size: 8px; font-weight: 600; color: #1e40af; background: #dbeafe; padding: 2px 6px; border-radius: 8px; }
                        .day-count { font-size: 9px; color: #4b5563; }
                        
                        .day-content { padding: 8px 12px; background: white; }
                        
                        /* === TIMELINE ITEMS === */
                        .timeline-item { display: flex; gap: 10px; padding: 8px 10px; margin-bottom: 6px; border-radius: 4px; border-left: 3px solid #d1d5db; background: #f9fafb; }
                        .timeline-item:last-child { margin-bottom: 0; }
                        
                        .timeline-item.event-item { }
                        .timeline-item.ticket-item { border-left-color: #d97706; background: #fffbeb; }
                        
                        .item-time { min-width: 42px; font-weight: 600; font-size: 10px; color: #374151; padding-top: 2px; }
                        .item-content { flex: 1; }
                        .item-header { display: flex; align-items: center; gap: 6px; margin-bottom: 3px; }
                        .item-category { font-size: 9px; font-weight: 600; }
                        .item-status { font-size: 8px; color: #4b5563; margin-left: auto; }
                        .item-priority { font-size: 8px; font-weight: 600; color: white; padding: 2px 6px; border-radius: 8px; }
                        .item-ticket-id { font-size: 9px; color: #4b5563; margin-left: auto; }
                        .item-title { font-size: 11px; font-weight: 600; color: #111827; }
                        .item-details { font-size: 9px; color: #4b5563; margin-top: 2px; }
                        .item-meta { display: flex; gap: 10px; margin-top: 4px; font-size: 9px; color: #4b5563; }
                        .meta-unassigned { color: #b91c1c; font-weight: 600; }
                        
                        .empty-day { text-align: center; padding: 14px; color: #6b7280; font-style: italic; font-size: 10px; }
                        
                        /* === FOOTER === */
                        .footer { margin-top: 16px; padding-top: 10px; border-top: 1px solid #d1d5db; display: flex; justify-content: space-between; align-items: center; font-size: 9px; color: #6b7280; }
                        .footer-left { }
                        .footer-right { text-align: right; }
                        
                        @media print { 
                            body { padding: 18mm 15mm 20mm 15mm !important; print-color-adjust: exact; -webkit-print-color-adjust: exact; } 
                            .day-block { page-break-inside: avoid; }
                        }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <div class="company-section">
                            <img src="${logoUrl}" class="company-logo" onerror="this.style.display='none'" />
                            <div class="company-info">
                                <div class="company-title">${companyTitle}</div>
                                ${companySubtitle ? `<div class="company-subtitle">${companySubtitle}</div>` : ''}
                            </div>
                        </div>
                        <div class="report-section">
                            <div class="report-badge">Semaine ${weekNum}</div>
                            <div class="report-title">Planning Hebdomadaire</div>
                            <div class="report-period">${weekStart} — ${weekEnd}</div>
                            <div class="report-generated">Généré le ${new Date().toLocaleString('fr-FR')}</div>
                        </div>
                    </div>
                    
                    <div class="kpi-bar">
                        <div class="kpi-item"><div class="kpi-value">${totalEvents}</div><div class="kpi-label">Événements</div></div>
                        <div class="kpi-item highlight"><div class="kpi-value">${totalTickets}</div><div class="kpi-label">Maintenances</div></div>
                        <div class="kpi-item ${criticalTickets > 0 ? 'alert' : ''}"><div class="kpi-value">${criticalTickets}</div><div class="kpi-label">Priorité haute</div></div>
                        <div class="kpi-item"><div class="kpi-value">${daysWithActivity}/7</div><div class="kpi-label">Jours actifs</div></div>
                    </div>
                    
                    ${timelineHtml}
                    
                    <div class="footer">
                        <div class="footer-left">Document confidentiel • Ne pas diffuser</div>
                        <div class="footer-right">${companySubtitle || 'Gestion Maintenance'}</div>
                    </div>
                </body>
                </html>
            `;
        }
        
        const printWindow = window.open('', '_blank', 'width=1000,height=800');
        printWindow.document.write(printContent);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => printWindow.print(), 500);
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
                        onClick: handlePrintPlanning,
                        title: 'Imprimer le planning (PDF)',
                        className: 'w-10 h-10 flex items-center justify-center rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-green-50 hover:text-green-600 transition shadow-sm'
                    }, React.createElement('i', { className: 'fas fa-print' })),

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
        }),

        // Modal de sélection du format d'impression avec sélecteur de dates
        showPrintModal && React.createElement(PrintExportModal, {
            currentDate,
            onClose: () => setShowPrintModal(false),
            onPrint: executePrint
        })
    );
};

// ========== MODAL D'EXPORT / IMPRESSION ==========
const PrintExportModal = ({ currentDate, onClose, onPrint }) => {
    const [selectedFormat, setSelectedFormat] = React.useState('month');
    const [printDate, setPrintDate] = React.useState(() => {
        const d = currentDate || new Date();
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    });
    const [isGeneratingAI, setIsGeneratingAI] = React.useState(false);
    const [aiReport, setAiReport] = React.useState(null);
    const [customInstructions, setCustomInstructions] = React.useState('');
    
    // Suggestions intelligentes - simples et directes (Rapports)
    const quickSuggestions = [
        { icon: '📊', label: 'Rapport mensuel', value: 'Rapport de synthèse mensuel pour la direction' },
        { icon: '📝', label: 'Note de service', value: 'Rédiger une note de service concernant : ' },
        { icon: '📋', label: 'Compte-rendu', value: 'Compte-rendu de réunion/incident : ' },
        { icon: '👷', label: 'Bilan technicien', value: 'Analyse de performance des techniciens' },
        { icon: '🏭', label: 'Bilan machines', value: 'État et disponibilité du parc machines' },
        { icon: '⚠️', label: 'Incidents critiques', value: 'Rapport sur les incidents critiques du mois' }
    ];
    
    // Catégories de documents Secrétaire de Direction
    const secretaryCategories = [
        { id: 'correspondance', label: 'Correspondance', icon: '✉️', documents: [
            { icon: '📧', label: 'Lettre officielle', value: 'Rédiger une lettre officielle à [destinataire] concernant : ' },
            { icon: '🤝', label: 'Lettre de partenariat', value: 'Proposition de partenariat commercial avec : ' },
            { icon: '📬', label: 'Réponse fournisseur', value: 'Réponse à une demande de fournisseur concernant : ' },
            { icon: '🙏', label: 'Lettre de remerciement', value: 'Lettre de remerciement adressée à : ' }
        ]},
        { id: 'subventions', label: 'Subventions', icon: '💰', documents: [
            { icon: '🇨🇦', label: 'Subvention fédérale (PARI-CNRC)', value: 'Demande de subvention au Programme d\'aide à la recherche industrielle (PARI-CNRC) pour le projet : ' },
            { icon: '⚜️', label: 'Subvention Québec (Investissement QC)', value: 'Demande de subvention à Investissement Québec pour le projet de : ' },
            { icon: '🔬', label: 'Crédit R&D (RS&DE)', value: 'Préparation du dossier de crédit d\'impôt RS&DE pour les activités de recherche et développement : ' },
            { icon: '🌱', label: 'Programme écologique', value: 'Demande au Fonds Écoleader / Fonds vert pour le projet environnemental : ' },
            { icon: '👷', label: 'Subvention formation', value: 'Demande de subvention à Emploi-Québec pour la formation des employés sur : ' }
        ]},
        { id: 'administratif', label: 'Administratif', icon: '📁', documents: [
            { icon: '📜', label: 'Procès-verbal', value: 'Rédiger le procès-verbal de la réunion du conseil d\'administration du : ' },
            { icon: '📋', label: 'Politique interne', value: 'Rédiger une politique interne concernant : ' },
            { icon: '📑', label: 'Contrat type', value: 'Préparer un contrat type pour : ' },
            { icon: '⚖️', label: 'Mise en demeure', value: 'Rédiger une mise en demeure adressée à [nom] pour : ' }
        ]},
        { id: 'rh', label: 'Ressources Humaines', icon: '👥', documents: [
            { icon: '📄', label: 'Offre d\'emploi', value: 'Rédiger une offre d\'emploi pour le poste de : ' },
            { icon: '✅', label: 'Lettre d\'embauche', value: 'Lettre d\'offre d\'embauche pour [nom] au poste de : ' },
            { icon: '📝', label: 'Évaluation employé', value: 'Formulaire d\'évaluation de performance pour : ' },
            { icon: '🚪', label: 'Lettre de fin d\'emploi', value: 'Lettre de fin d\'emploi / cessation pour : ' }
        ]},
        { id: 'technique', label: 'Documents Techniques', icon: '🔧', documents: [
            { icon: '📖', label: 'Manuel de procédure', value: 'Rédiger un manuel de procédure pour : ' },
            { icon: '🔒', label: 'Fiche de sécurité', value: 'Fiche de données de sécurité (FDS) pour le produit : ' },
            { icon: '📐', label: 'Spécification technique', value: 'Spécification technique détaillée pour : ' },
            { icon: '✔️', label: 'Liste de vérification', value: 'Checklist / liste de vérification pour : ' }
        ]},
        { id: 'financier', label: 'Documents Financiers', icon: '💼', documents: [
            { icon: '💵', label: 'Demande de financement', value: 'Demande de financement bancaire pour le projet : ' },
            { icon: '📊', label: 'Plan d\'affaires', value: 'Section du plan d\'affaires concernant : ' },
            { icon: '🧾', label: 'Justificatif de dépenses', value: 'Justificatif de dépenses pour le projet/subvention : ' },
            { icon: '📈', label: 'Rapport financier', value: 'Rapport financier périodique incluant : ' }
        ]},
        { id: 'creatif', label: 'Créatif / Libre', icon: '🎨', documents: [
            { icon: '🌐', label: 'Texte site web', value: 'Rédiger un texte promotionnel pour notre site web présentant : ' },
            { icon: '📰', label: 'Communiqué de presse', value: 'Communiqué de presse annonçant : ' },
            { icon: '🎤', label: 'Discours / Allocution', value: 'Rédiger un discours pour [occasion] sur le thème : ' },
            { icon: '📢', label: 'Brochure / Dépliant', value: 'Créer le contenu d\'une brochure de présentation de l\'entreprise mettant en avant : ' },
            { icon: '💡', label: 'Pitch commercial', value: 'Rédiger un pitch commercial pour présenter nos services à : ' },
            { icon: '📝', label: 'Autre (libre)', value: '' }
        ]}
    ];
    
    const [selectedSecretaryCategory, setSelectedSecretaryCategory] = React.useState('correspondance');
    const [secretaryInstructions, setSecretaryInstructions] = React.useState('');
    const [secretaryReport, setSecretaryReport] = React.useState(null);
    const [isGeneratingSecretary, setIsGeneratingSecretary] = React.useState(false);
    const [showSecretaryHelp, setShowSecretaryHelp] = React.useState(false);
    
    // Trucs & Astuces pour la Secrétaire IA
    const secretaryHelpTips = [
        '💡 Soyez précis : "Lettre au fournisseur ABC pour retard livraison" > "Lettre fournisseur"',
        '📅 Incluez les dates : "réunion du 15 janvier", "projet démarré en mars 2024"',
        '💰 Montants exacts : "subvention de 50 000$", "investissement de 200 000$"',
        '👤 Nommez les destinataires : "M. Jean Tremblay, Directeur", "Mme Lavoie de Investissement Québec"',
        '🎯 Précisez l\'objectif : "pour obtenir un financement", "pour relancer la commande"',
        '📊 L\'IA utilise vos données réelles : tickets, machines, équipes pour enrichir les documents'
    ];
    
    const getDateLabel = () => {
        const d = new Date(printDate);
        if (selectedFormat === 'month' || selectedFormat === 'ai-report') {
            return d.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
        } else {
            const startOfWeek = new Date(d);
            const dayOfWeek = startOfWeek.getDay();
            startOfWeek.setDate(startOfWeek.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1));
            const endOfWeek = new Date(startOfWeek);
            endOfWeek.setDate(endOfWeek.getDate() + 6);
            return `${startOfWeek.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })} — ${endOfWeek.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}`;
        }
    };
    
    const handlePrint = () => {
        if (selectedFormat === 'ai-report') {
            generateAIReport();
        } else if (selectedFormat === 'secretary') {
            generateSecretaryDocument();
        } else {
            onPrint(selectedFormat, new Date(printDate));
            onClose();
        }
    };
    
    // Génération du rapport automatisé
    const generateAIReport = async () => {
        setIsGeneratingAI(true);
        setAiReport(null);
        try {
            const d = new Date(printDate);
            const response = await axios.post('/api/ai/report', {
                period: 'month',
                startDate: new Date(d.getFullYear(), d.getMonth(), 1).toISOString(),
                endDate: new Date(d.getFullYear(), d.getMonth() + 1, 1).toISOString(),
                reportType: 'summary',
                customInstructions: customInstructions.trim() || null
            });
            
            if (response.data.success) {
                setAiReport(response.data);
            } else {
                window.showToast && window.showToast('Erreur de génération du rapport', 'error');
            }
        } catch (err) {
            console.error('AI Report error:', err);
            window.showToast && window.showToast('Erreur: ' + (err.response?.data?.error || err.message), 'error');
        } finally {
            setIsGeneratingAI(false);
        }
    };
    
    // Convertir Markdown en HTML pour impression
    const markdownToHtml = (md) => {
        if (!md) return '';
        return md
            // Tables Markdown
            .replace(/\|(.+)\|\n\|[-:\s|]+\|\n((?:\|.+\|\n?)+)/g, (match, header, rows) => {
                const headers = header.split('|').filter(h => h.trim()).map(h => `<th>${h.trim()}</th>`).join('');
                const bodyRows = rows.trim().split('\n').map(row => {
                    const cells = row.split('|').filter(c => c.trim()).map(c => `<td>${c.trim()}</td>`).join('');
                    return `<tr>${cells}</tr>`;
                }).join('');
                return `<table><thead><tr>${headers}</tr></thead><tbody>${bodyRows}</tbody></table>`;
            })
            // Headers
            .replace(/^### (.+)$/gm, '<h3>$1</h3>')
            .replace(/^## (.+)$/gm, '<h2>$1</h2>')
            .replace(/^# (.+)$/gm, '<h1>$1</h1>')
            // Bold et Italic
            .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
            .replace(/\*([^*]+)\*/g, '<em>$1</em>')
            // Listes à puces
            .replace(/^\* (.+)$/gm, '<li>$1</li>')
            .replace(/^- (.+)$/gm, '<li>$1</li>')
            .replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>')
            // Listes numérotées
            .replace(/^\d+\. (.+)$/gm, '<li>$1</li>')
            // Paragraphes (lignes vides)
            .replace(/\n\n/g, '</p><p>')
            // Retours à la ligne simples
            .replace(/\n/g, '<br>')
            // Wrapper
            .replace(/^/, '<p>').replace(/$/, '</p>')
            // Nettoyage
            .replace(/<p><\/p>/g, '')
            .replace(/<p>(<h[123]>)/g, '$1')
            .replace(/(<\/h[123]>)<\/p>/g, '$1')
            .replace(/<p>(<ul>)/g, '$1')
            .replace(/(<\/ul>)<\/p>/g, '$1')
            .replace(/<p>(<table>)/g, '$1')
            .replace(/(<\/table>)<\/p>/g, '$1');
    };
    
    // Impression du rapport - Design Élégant Corporate v4
    const printAIReport = async () => {
        if (!aiReport) return;
        
        // Charger les infos de la compagnie depuis l'API
        let companyShortName = 'IGP';
        let companySubtitle = '';
        let logoUrl = '/api/settings/logo';
        let primaryColor = '#0f4c81'; // Bleu corporate par défaut
        try {
            const settingsRes = await axios.get('/api/settings/config/public');
            if (settingsRes.data) {
                companyShortName = settingsRes.data.company_short_name || 'IGP';
                companySubtitle = settingsRes.data.company_subtitle || '';
                if (settingsRes.data.company_logo_url) {
                    logoUrl = settingsRes.data.company_logo_url;
                }
                if (settingsRes.data.primary_color) {
                    primaryColor = settingsRes.data.primary_color;
                }
            }
        } catch (e) { console.log('Settings not loaded'); }
        
        // Nom de l'app = Nom court + " Gestion"
        const appName = companyShortName + ' Gestion';
        
        const printWindow = window.open('', '_blank');
        const d = new Date(printDate);
        const monthLabel = d.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
        const monthLabelCaps = monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1);
        const todayFormatted = new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
        
        // Type de document basé sur les instructions
        const ci = (customInstructions || '').toLowerCase();
        const docType = ci.includes('note') ? 'Note de service' 
            : ci.includes('compte-rendu') ? 'Compte-rendu'
            : ci.includes('mémo') ? 'Mémo'
            : ci.includes('bilan') ? 'Bilan d\'activité'
            : ci.includes('incident') ? 'Rapport d\'incident'
            : 'Rapport de gestion';
        
        const reportHtml = markdownToHtml(aiReport.report);
        const refNumber = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(Date.now()).slice(-4)}`;
        
        printWindow.document.write(`<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<title>${docType} - ${monthLabelCaps}</title>
<style>
/* Marges d'impression - IMPORTANT: utiliser padding sur body car @page margin n'est pas fiable */
@page { 
    size: A4; 
    margin: 0;
}

* { 
    box-sizing: border-box; 
    margin: 0; 
    padding: 0; 
}

html { 
    width: 100%;
    height: 100%;
}

body { 
    font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
    font-size: 11pt;
    line-height: 1.7;
    color: #333;
    /* Marges forcées via padding - plus fiable que @page margin */
    padding: 20mm 18mm 25mm 18mm;
    min-height: 100%;
}

/* Wrapper principal */
.page-wrapper {
    max-width: 100%;
    margin: 0;
}

/* ══════════ HEADER ══════════ */
.header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 25pt;
    padding-bottom: 15pt;
    border-bottom: 1pt solid #e0e0e0;
}
.header-left {
    display: flex;
    align-items: center;
}
.logo {
    height: 45pt;
    margin-right: 15pt;
}
.brand {
    border-left: 2pt solid #0066cc;
    padding-left: 15pt;
}
.brand-name {
    font-size: 16pt;
    font-weight: 600;
    color: #1a1a1a;
    letter-spacing: 0.5pt;
}
.brand-sub {
    font-size: 9pt;
    color: #555;
    margin-top: 4pt;
    max-width: 250pt;
}
.header-right {
    text-align: right;
    font-size: 10pt;
    color: #555;
}
.header-right .ref {
    font-size: 9pt;
    color: #888;
    margin-top: 4pt;
}

/* ══════════ TITLE ══════════ */
.title-block {
    text-align: center;
    padding: 25pt 0;
    margin-bottom: 25pt;
    background: linear-gradient(to right, #f8f9fa, #fff, #f8f9fa);
    border-top: 3pt solid #1a1a1a;
    border-bottom: 1pt solid #ddd;
}
.title-block h1 {
    font-size: 20pt;
    font-weight: 700;
    color: #1a1a1a;
    text-transform: uppercase;
    letter-spacing: 3pt;
}
.title-block .period {
    font-size: 12pt;
    color: #555;
    margin-top: 10pt;
    font-weight: 400;
}

/* ══════════ SUMMARY BOX ══════════ */
.summary-box {
    background: #f5f7fa;
    padding: 18pt 22pt;
    margin-bottom: 25pt;
    border-left: 4pt solid #0066cc;
    border-radius: 0 4pt 4pt 0;
}
.summary-box .label {
    font-size: 8pt;
    text-transform: uppercase;
    letter-spacing: 1.5pt;
    color: #888;
    margin-bottom: 8pt;
    font-weight: 600;
}
.summary-box .text {
    font-size: 11pt;
    color: #333;
    line-height: 1.6;
}

/* ══════════ KPI ROW ══════════ */
.kpi-row {
    display: flex;
    justify-content: space-around;
    margin-bottom: 30pt;
    padding: 20pt 0;
    background: #fafbfc;
    border: 1pt solid #e8e8e8;
    border-radius: 4pt;
}
.kpi-item {
    text-align: center;
    flex: 1;
    padding: 0 10pt;
    border-right: 1pt solid #e0e0e0;
}
.kpi-item:last-child {
    border-right: none;
}
.kpi-value {
    font-size: 36pt;
    font-weight: 300;
    color: #1a1a1a;
    line-height: 1.2;
}
.kpi-value.alert {
    color: #c62828;
    font-weight: 500;
}
.kpi-label {
    font-size: 8pt;
    text-transform: uppercase;
    letter-spacing: 1.5pt;
    color: #777;
    margin-top: 8pt;
    font-weight: 500;
}

/* ══════════ CONTENT ══════════ */
.content {
    line-height: 1.5;
}

.content h1 {
    font-size: 12pt;
    font-weight: 700;
    color: #1a1a1a;
    text-transform: uppercase;
    letter-spacing: 0.5pt;
    margin: 16pt 0 8pt;
    padding-bottom: 5pt;
    border-bottom: 1.5pt solid #1a1a1a;
}
.content h1:first-child { margin-top: 0; }

.content h2 {
    font-size: 11pt;
    font-weight: 600;
    color: #333;
    margin: 12pt 0 6pt;
    padding-left: 8pt;
    border-left: 2pt solid #0066cc;
}

.content h3 {
    font-size: 10.5pt;
    font-weight: 600;
    color: #444;
    margin: 10pt 0 5pt;
}

.content p {
    margin: 6pt 0;
    text-align: justify;
    line-height: 1.5;
}

.content ul, .content ol { 
    margin: 8pt 0 8pt 20pt;
}
.content li { 
    margin: 3pt 0;
    line-height: 1.45;
}

.content strong { font-weight: 600; }
.content em { font-style: italic; }

/* ══════════ TABLES ══════════ */
table {
    width: 100%;
    border-collapse: collapse;
    margin: 18pt 0;
    font-size: 10pt;
}
th {
    background: #f0f2f5;
    border: 1pt solid #ddd;
    padding: 10pt 8pt;
    text-align: left;
    font-weight: 600;
    font-size: 9pt;
    text-transform: uppercase;
    color: #444;
}
td {
    border: 1pt solid #ddd;
    padding: 9pt 8pt;
    line-height: 1.5;
}
tr:nth-child(even) { background: #fafafa; }

/* ══════════ FOOTER ══════════ */
.footer {
    margin-top: 50pt;
    padding-top: 15pt;
    border-top: 1pt solid #ddd;
    display: flex;
    justify-content: space-between;
    font-size: 9pt;
    color: #888;
}
.footer .conf {
    text-transform: uppercase;
    letter-spacing: 1pt;
    font-weight: 500;
}

/* ══════════ PRINT STYLES ══════════ */
@media print {
    body { 
        -webkit-print-color-adjust: exact !important; 
        print-color-adjust: exact !important;
        /* GARDER le padding pour les marges */
        padding: 20mm 18mm 25mm 18mm !important;
    }
    .kpi-row, .title-block, .summary-box { 
        page-break-inside: avoid; 
    }
    h1, h2, h3 { 
        page-break-after: avoid; 
    }
}
</style>
</head>
<body>
<div class="page-wrapper">

<div class="header">
    <div class="header-left">
        <img src="${logoUrl}" alt="" class="logo" onerror="this.style.display='none'">
        <div class="brand">
            <div class="brand-name">${appName}</div>
            <div class="brand-sub">${companySubtitle}</div>
        </div>
    </div>
    <div class="header-right">
        <div>${todayFormatted}</div>
        <div class="ref">Réf. ${refNumber}</div>
    </div>
</div>

<div class="title-block">
    <h1>${docType}</h1>
    <div class="period">${monthLabelCaps}</div>
</div>

${aiReport.customFocus ? `
<div class="summary-box">
    <div class="label">Objet</div>
    <div class="text">${aiReport.customFocus}</div>
</div>
` : ''}

<div class="kpi-row">
    <div class="kpi-item">
        <div class="kpi-value">${aiReport.kpis?.ticketsCreated || 0}</div>
        <div class="kpi-label">Créés</div>
    </div>
    <div class="kpi-item">
        <div class="kpi-value">${aiReport.kpis?.ticketsCompleted || 0}</div>
        <div class="kpi-label">Terminés</div>
    </div>
    <div class="kpi-item">
        <div class="kpi-value">${aiReport.kpis?.activeTickets || 0}</div>
        <div class="kpi-label">En cours</div>
    </div>
    <div class="kpi-item">
        <div class="kpi-value${(aiReport.kpis?.criticalTickets || 0) > 0 ? ' alert' : ''}">${aiReport.kpis?.criticalTickets || 0}</div>
        <div class="kpi-label">Critiques</div>
    </div>
</div>

<div class="content">
${reportHtml}
</div>

<div class="footer">
    <span class="conf">Document confidentiel</span>
    <span>${companySubtitle}</span>
</div>

</div>
</body>
</html>`);
        printWindow.document.close();
        setTimeout(() => printWindow.print(), 500);
    };
    
    // NOTE: ai-report et secretary ont été déplacés vers SecretariatModal (bouton Secrétariat dans le header)
    const formatOptions = [
        { id: 'month', label: 'Planning mensuel', desc: 'Vue calendrier du mois', icon: 'fa-calendar-alt', color: 'blue' },
        { id: 'week', label: 'Planning hebdo', desc: 'Vue de la semaine', icon: 'fa-calendar-week', color: 'emerald' }
    ];
    
    const colorStyles = {
        blue: { bg: 'bg-blue-50', border: 'border-blue-500', text: 'text-blue-600', ring: 'ring-blue-200' },
        emerald: { bg: 'bg-emerald-50', border: 'border-emerald-500', text: 'text-emerald-600', ring: 'ring-emerald-200' },
        purple: { bg: 'bg-purple-50', border: 'border-purple-500', text: 'text-purple-600', ring: 'ring-purple-200' },
        indigo: { bg: 'bg-indigo-50', border: 'border-indigo-500', text: 'text-indigo-600', ring: 'ring-indigo-200' }
    };
    
    // Génération document Secrétaire de Direction
    const generateSecretaryDocument = async () => {
        if (!secretaryInstructions.trim()) {
            window.showToast && window.showToast('Veuillez décrire le document souhaité', 'warning');
            return;
        }
        setIsGeneratingSecretary(true);
        setSecretaryReport(null);
        try {
            const response = await axios.post('/api/ai/secretary', {
                documentType: selectedSecretaryCategory,
                instructions: secretaryInstructions.trim()
            });
            
            if (response.data.success) {
                setSecretaryReport(response.data);
            } else {
                window.showToast && window.showToast('Erreur de génération', 'error');
            }
        } catch (err) {
            console.error('Secretary AI error:', err);
            window.showToast && window.showToast('Erreur: ' + (err.response?.data?.error || err.message), 'error');
        } finally {
            setIsGeneratingSecretary(false);
        }
    };
    
    // Impression document Secrétaire
    const printSecretaryDocument = async () => {
        if (!secretaryReport) return;
        
        let companyShortName = 'IGP';
        let companySubtitle = '';
        let logoUrl = '/api/settings/logo';
        try {
            const settingsRes = await axios.get('/api/settings/config/public');
            if (settingsRes.data) {
                companyShortName = settingsRes.data.company_short_name || 'IGP';
                companySubtitle = settingsRes.data.company_subtitle || '';
                if (settingsRes.data.company_logo_url) logoUrl = settingsRes.data.company_logo_url;
            }
        } catch (e) { }
        
        const printWindow = window.open('', '_blank');
        const todayFormatted = new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
        const reportHtml = markdownToHtml(secretaryReport.document);
        const docTitle = secretaryReport.title || 'Document';
        
        printWindow.document.write(`<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<title>${docTitle}</title>
<style>
@page { size: A4; margin: 0; }
* { box-sizing: border-box; margin: 0; padding: 0; }
body { 
    font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
    font-size: 11pt; line-height: 1.7; color: #333;
    padding: 20mm 18mm 25mm 18mm;
}
.header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 25pt; padding-bottom: 15pt; border-bottom: 1pt solid #e0e0e0; }
.header-left { display: flex; align-items: center; }
.logo { height: 45pt; margin-right: 15pt; }
.brand { border-left: 2pt solid #4f46e5; padding-left: 15pt; }
.brand-name { font-size: 16pt; font-weight: 600; color: #1a1a1a; }
.brand-sub { font-size: 9pt; color: #555; margin-top: 4pt; max-width: 250pt; }
.header-right { text-align: right; font-size: 10pt; color: #555; }
.title-block { text-align: center; padding: 20pt 0; margin-bottom: 20pt; border-bottom: 2pt solid #4f46e5; }
.title-block h1 { font-size: 18pt; font-weight: 700; color: #1a1a1a; }
.content { font-size: 11pt; }
.content h2 { font-size: 14pt; color: #1a1a1a; margin: 18pt 0 10pt; border-bottom: 1pt solid #eee; padding-bottom: 6pt; }
.content h3 { font-size: 12pt; color: #333; margin: 15pt 0 8pt; }
.content p { margin-bottom: 10pt; text-align: justify; }
.content ul, .content ol { margin: 10pt 0 10pt 20pt; }
.content li { margin-bottom: 5pt; }
.content strong { color: #1a1a1a; }
.content table { width: 100%; border-collapse: collapse; margin: 12pt 0; font-size: 10pt; }
.content th, .content td { border: 1pt solid #ddd; padding: 8pt; text-align: left; }
.content th { background: #f8f8f8; font-weight: 600; }
.footer { margin-top: 30pt; padding-top: 15pt; border-top: 1pt solid #ddd; font-size: 9pt; color: #666; text-align: center; }
@media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
</style>
</head>
<body>
<div class="header">
    <div class="header-left">
        <img src="${logoUrl}" class="logo" onerror="this.style.display='none'">
        <div class="brand">
            <div class="brand-name">${companyShortName}</div>
            <div class="brand-sub">${companySubtitle}</div>
        </div>
    </div>
    <div class="header-right">
        <div>${todayFormatted}</div>
    </div>
</div>
<div class="title-block">
    <h1>${docTitle}</h1>
</div>
<div class="content">
    ${reportHtml}
</div>
<div class="footer">
    Document généré par ${companyShortName} - Secrétariat de Direction
</div>
</body>
</html>`);
        
        printWindow.document.close();
        setTimeout(() => { printWindow.print(); }, 300);
    };
    
    // Modal avec scroll et design professionnel
    return React.createElement('div', { 
        className: 'fixed inset-0 z-[200] overflow-y-auto',
        style: { background: 'rgba(0, 0, 0, 0.5)' }
    },
        React.createElement('div', { 
            className: 'min-h-screen px-4 py-8 flex items-start justify-center'
        },
            React.createElement('div', { 
                className: 'w-full max-w-lg bg-white rounded-xl shadow-xl relative',
                onClick: (e) => e.stopPropagation()
            },
                // Header - clean et pro
                React.createElement('div', { className: 'px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50 rounded-t-xl' },
                    React.createElement('div', {},
                        React.createElement('h2', { className: 'text-lg font-semibold text-gray-900' }, 'Exporter le planning'),
                        React.createElement('p', { className: 'text-sm text-gray-500' }, 'Choisissez le format et la période')
                    ),
                    React.createElement('button', {
                        onClick: onClose,
                        className: 'w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:bg-gray-200 hover:text-gray-600 transition'
                    }, React.createElement('i', { className: 'fas fa-times' }))
                ),
                
                // Content 
                React.createElement('div', { className: 'p-6 space-y-5' },
                    // Format selector
                    React.createElement('div', {},
                        React.createElement('label', { className: 'block text-sm font-medium text-gray-700 mb-3' }, 'Type de document'),
                        React.createElement('div', { className: 'grid grid-cols-2 gap-3' },
                            formatOptions.map(opt => {
                                const isSelected = selectedFormat === opt.id;
                                return React.createElement('button', {
                                    key: opt.id,
                                    onClick: () => setSelectedFormat(opt.id),
                                    className: `p-4 rounded-lg border-2 text-center transition-all ${
                                        isSelected 
                                            ? 'border-gray-900 bg-gray-900 text-white' 
                                            : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                                    }`
                                },
                                    React.createElement('i', { className: `fas ${opt.icon} text-xl mb-2 ${isSelected ? 'text-white' : 'text-gray-400'}` }),
                                    React.createElement('div', { className: 'text-sm font-medium' }, opt.label),
                                    React.createElement('div', { className: `text-xs mt-1 ${isSelected ? 'text-gray-300' : 'text-gray-400'}` }, opt.desc)
                                );
                            })
                        )
                    ),
                    
                    // Date picker
                    React.createElement('div', {},
                        React.createElement('label', { className: 'block text-sm font-medium text-gray-700 mb-2' }, 
                            selectedFormat === 'week' ? 'Semaine' : 'Mois'
                        ),
                        React.createElement('input', {
                            type: selectedFormat === 'week' ? 'date' : 'month',
                            value: selectedFormat === 'week' ? printDate : printDate.substring(0, 7),
                            onChange: (e) => {
                                setPrintDate(selectedFormat === 'week' ? e.target.value : e.target.value + '-01');
                            },
                            className: 'w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-gray-900 focus:ring-1 focus:ring-gray-900 outline-none text-gray-900'
                        }),
                        React.createElement('p', { className: 'mt-2 text-sm text-gray-500' }, 
                            'Période sélectionnée : ', 
                            React.createElement('span', { className: 'font-medium text-gray-900' }, getDateLabel())
                        )
                    ),
                    
                    // Section Rapports Automatisés
                    selectedFormat === 'ai-report' && React.createElement('div', { className: 'bg-gray-50 rounded-lg p-4 border border-gray-200' },
                        React.createElement('div', { className: 'flex items-center gap-2 mb-4' },
                            React.createElement('i', { className: 'fas fa-file-invoice text-gray-600' }),
                            React.createElement('span', { className: 'text-sm font-medium text-gray-900' }, 'Type de document')
                        ),
                        // Suggestions
                        React.createElement('div', { className: 'grid grid-cols-2 gap-2 mb-4' },
                            quickSuggestions.map((s, i) => React.createElement('button', {
                                key: i,
                                type: 'button',
                                onClick: () => setCustomInstructions(s.value),
                                className: `flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-all ${
                                    customInstructions === s.value 
                                        ? 'bg-gray-900 text-white' 
                                        : 'bg-white text-gray-700 border border-gray-200 hover:border-gray-400'
                                }`
                            }, 
                                React.createElement('span', {}, s.icon),
                                React.createElement('span', { className: 'truncate' }, s.label)
                            ))
                        ),
                        // Textarea
                        React.createElement('textarea', {
                            value: customInstructions,
                            onChange: (e) => setCustomInstructions(e.target.value),
                            placeholder: 'Ou décrivez précisément ce dont vous avez besoin...',
                            rows: 3,
                            className: 'w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-gray-900 focus:ring-1 focus:ring-gray-900 outline-none text-gray-900 text-sm resize-none'
                        })
                    ),
                    
                    // Section Secrétaire de Direction
                    selectedFormat === 'secretary' && React.createElement('div', { className: 'bg-indigo-50 rounded-lg p-4 border border-indigo-200' },
                        React.createElement('div', { className: 'flex items-center justify-between mb-4' },
                            React.createElement('div', { className: 'flex items-center gap-2' },
                                React.createElement('i', { className: 'fas fa-user-tie text-indigo-600' }),
                                React.createElement('span', { className: 'text-sm font-medium text-gray-900' }, 'Secrétaire de Direction IA'),
                                React.createElement('span', { className: 'text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full' }, 'Lois QC/CA')
                            ),
                            React.createElement('button', {
                                onClick: () => setShowSecretaryHelp(!showSecretaryHelp),
                                className: `p-1.5 rounded-full transition-colors ${showSecretaryHelp ? 'bg-indigo-200 text-indigo-800' : 'hover:bg-indigo-100 text-indigo-600'}`,
                                title: 'Trucs & Astuces'
                            },
                                React.createElement('i', { className: 'fas fa-question-circle' })
                            )
                        ),
                        // Panneau d'aide
                        showSecretaryHelp && React.createElement('div', { 
                            className: 'mb-4 p-3 bg-gradient-to-r from-amber-50 to-yellow-50 rounded-lg border border-amber-200'
                        },
                            React.createElement('div', { className: 'flex items-center gap-2 mb-2' },
                                React.createElement('i', { className: 'fas fa-lightbulb text-amber-600' }),
                                React.createElement('span', { className: 'text-sm font-semibold text-amber-800' }, 'Trucs & Astuces pour de meilleurs résultats')
                            ),
                            React.createElement('ul', { className: 'space-y-1' },
                                secretaryHelpTips.map((tip, i) => 
                                    React.createElement('li', { key: i, className: 'text-xs text-amber-700 flex items-start gap-1.5' },
                                        React.createElement('span', { className: 'mt-0.5' }, '•'),
                                        React.createElement('span', {}, tip)
                                    )
                                )
                            )
                        ),
                        // Catégories de documents
                        React.createElement('div', { className: 'flex flex-wrap gap-2 mb-4' },
                            secretaryCategories.map(cat => React.createElement('button', {
                                key: cat.id,
                                type: 'button',
                                onClick: () => { setSelectedSecretaryCategory(cat.id); setSecretaryInstructions(''); },
                                className: `flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg transition-all ${
                                    selectedSecretaryCategory === cat.id 
                                        ? 'bg-indigo-600 text-white' 
                                        : 'bg-white text-gray-700 border border-gray-200 hover:border-indigo-300'
                                }`
                            }, 
                                React.createElement('span', {}, cat.icon),
                                React.createElement('span', {}, cat.label)
                            ))
                        ),
                        // Types de documents de la catégorie sélectionnée
                        React.createElement('div', { className: 'grid grid-cols-2 gap-2 mb-4' },
                            (secretaryCategories.find(c => c.id === selectedSecretaryCategory)?.documents || []).map((doc, i) => 
                                React.createElement('button', {
                                    key: i,
                                    type: 'button',
                                    onClick: () => setSecretaryInstructions(doc.value),
                                    className: `flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-all text-left ${
                                        secretaryInstructions === doc.value 
                                            ? 'bg-indigo-600 text-white' 
                                            : 'bg-white text-gray-700 border border-gray-200 hover:border-indigo-400'
                                    }`
                                }, 
                                    React.createElement('span', { className: 'text-base' }, doc.icon),
                                    React.createElement('span', { className: 'truncate' }, doc.label)
                                )
                            )
                        ),
                        // Textarea pour instructions personnalisées
                        React.createElement('textarea', {
                            value: secretaryInstructions,
                            onChange: (e) => setSecretaryInstructions(e.target.value),
                            placeholder: 'Décrivez le document souhaité avec tous les détails pertinents (destinataire, objet, contexte, montants, dates, etc.)...',
                            rows: 4,
                            className: 'w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none text-gray-900 text-sm resize-none'
                        }),
                        // Info sur les connaissances légales
                        React.createElement('div', { className: 'mt-3 p-3 bg-white rounded-lg border border-indigo-100' },
                            React.createElement('div', { className: 'text-xs text-gray-600' },
                                React.createElement('span', { className: 'font-medium text-indigo-700' }, '💡 Connaissances intégrées: '),
                                'Lois canadiennes et québécoises applicables à l\'industrie manufacturière, programmes de subventions (PARI-CNRC, IQ, RS&DE, Emploi-Québec), normes de rédaction administrative.'
                            )
                        )
                    ),
                    
                    // Document Secrétaire généré
                    secretaryReport && selectedFormat === 'secretary' && React.createElement('div', { className: 'bg-green-50 rounded-lg p-4 border border-green-200' },
                        React.createElement('div', { className: 'flex items-center justify-between mb-3' },
                            React.createElement('div', { className: 'flex items-center gap-2' },
                                React.createElement('i', { className: 'fas fa-check-circle text-green-600' }),
                                React.createElement('span', { className: 'text-sm font-medium text-green-800' }, secretaryReport.title || 'Document généré')
                            ),
                            React.createElement('button', {
                                onClick: printSecretaryDocument,
                                className: 'px-3 py-1.5 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition'
                            }, 'Imprimer')
                        ),
                        React.createElement('div', { className: 'bg-white rounded-lg p-3 max-h-48 overflow-y-auto text-sm text-gray-700 whitespace-pre-wrap border border-green-100' },
                            secretaryReport.document
                        )
                    ),
                    
                    // Rapport généré
                    aiReport && selectedFormat === 'ai-report' && React.createElement('div', { className: 'bg-green-50 rounded-lg p-4 border border-green-200' },
                        React.createElement('div', { className: 'flex items-center justify-between mb-3' },
                            React.createElement('div', { className: 'flex items-center gap-2' },
                                React.createElement('i', { className: 'fas fa-check-circle text-green-600' }),
                                React.createElement('span', { className: 'text-sm font-medium text-green-800' }, 'Document généré')
                            ),
                            React.createElement('button', {
                                onClick: printAIReport,
                                className: 'px-3 py-1.5 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition'
                            }, 'Imprimer')
                        ),
                        React.createElement('div', { className: 'bg-white rounded-lg p-3 max-h-40 overflow-y-auto text-sm text-gray-700 whitespace-pre-wrap border border-green-100' },
                            aiReport.report
                        )
                    )
                ),
                
                // Footer
                React.createElement('div', { className: 'px-6 py-4 border-t border-gray-200 flex justify-end gap-3 bg-gray-50 rounded-b-xl' },
                    React.createElement('button', {
                        onClick: onClose,
                        className: 'px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition'
                    }, 'Annuler'),
                    (selectedFormat === 'ai-report' || selectedFormat === 'secretary') 
                        ? React.createElement('button', {
                            onClick: handlePrint,
                            disabled: isGeneratingAI || isGeneratingSecretary,
                            className: `px-5 py-2.5 text-sm font-medium text-white rounded-lg transition flex items-center gap-2 ${
                                selectedFormat === 'secretary' ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-gray-900 hover:bg-gray-800'
                            } ${(isGeneratingAI || isGeneratingSecretary) ? 'opacity-50 cursor-not-allowed' : ''}`
                        }, 
                            (isGeneratingAI || isGeneratingSecretary)
                                ? React.createElement('i', { className: 'fas fa-spinner fa-spin' })
                                : React.createElement('i', { className: selectedFormat === 'secretary' ? 'fas fa-magic' : 'fas fa-file-alt' }),
                            (isGeneratingAI || isGeneratingSecretary) ? 'Génération IA...' : (selectedFormat === 'secretary' ? 'Rédiger le document' : 'Générer le rapport')
                        )
                        : React.createElement('button', {
                            onClick: handlePrint,
                            className: 'px-5 py-2.5 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-800 transition flex items-center gap-2'
                        }, 
                            React.createElement('i', { className: 'fas fa-download' }),
                            'Exporter'
                        )
                )
            )
        )
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