// Composant : Modales (Ajout Événement + Gestion Catégories)
// v3.2.0 - Responsive optimisé pour mobile
console.log('PlanningModals loaded v3.2.0 - Mobile Responsive');

const PlanningModals = ({ 
    showAddModal, 
    setShowAddModal, 
    selectedEvent, 
    newEventDate, 
    categories, 
    onSaveEvent, 
    onDeleteEvent,
    showCategoryModal,
    setShowCategoryModal,
    editingCategory,
    onEditCategoryClick,
    onCancelEditCategory,
    onDeleteCategory,
    onSaveCategory
}) => {
    // State for TV options visibility
    const [showTvExtras, setShowTvExtras] = React.useState(false);
    const [uploading, setUploading] = React.useState(false);
    const [imageUrl, setImageUrl] = React.useState(null);
    const [showTvHelp, setShowTvHelp] = React.useState(false);

    // Update state when modal opens or event changes
    React.useEffect(() => {
        if (showAddModal) {
            const isVisible = selectedEvent ? (selectedEvent.show_on_tv !== 0 && selectedEvent.show_on_tv !== false) : true;
            setShowTvExtras(isVisible);
            setImageUrl(selectedEvent ? selectedEvent.image_url : '');
            setShowTvHelp(false);
        }
    }, [showAddModal, selectedEvent]);

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setUploading(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const token = localStorage.getItem('auth_token');
            const response = await fetch('/api/media/broadcast/upload', {
                method: 'POST',
                headers: {
                    'Authorization': 'Bearer ' + token
                },
                body: formData
            });

            if (!response.ok) throw new Error('Upload failed');
            
            const data = await response.json();
            if (data.success && data.url) {
                setImageUrl(data.url);
            }
        } catch (error) {
            console.error('Upload error:', error);
            alert('Erreur lors de l\'upload de l\'image');
        } finally {
            setUploading(false);
        }
    };

    return React.createElement(React.Fragment, null,
        // ADD EVENT MODAL
        showAddModal && React.createElement('div', { 
            className: 'fixed inset-0 z-[200] bg-black/50 overflow-y-auto animate-fadeIn',
            onClick: (e) => { if (e.target === e.currentTarget) setShowAddModal(false); }
        },
            React.createElement('div', { className: 'flex min-h-full items-end sm:items-center justify-center p-0 sm:p-4' },
                React.createElement('div', { className: 'bg-white sm:rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-scaleIn relative rounded-t-2xl sm:rounded-b-xl' },
                    // Modal Header - Compact sur mobile
                    React.createElement('div', { className: 'bg-gradient-to-r from-slate-800 to-slate-700 px-4 py-3 sm:px-6 sm:py-4 flex justify-between items-center' },
                        React.createElement('div', { className: 'flex items-center gap-2 sm:gap-3 min-w-0' },
                            React.createElement('div', { className: 'w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0' },
                                React.createElement('i', { className: 'fas fa-calendar-plus text-white text-sm sm:text-lg' })
                            ),
                            React.createElement('div', { className: 'min-w-0' },
                                React.createElement('h3', { className: 'font-bold text-base sm:text-lg text-white truncate' }, selectedEvent ? 'Modifier' : 'Nouvel Événement'),
                                React.createElement('p', { className: 'text-xs text-slate-300 hidden sm:block' }, 'Planning de production')
                            )
                        ),
                        React.createElement('button', { 
                            onClick: () => setShowAddModal(false),
                            className: 'text-white/70 hover:text-white w-10 h-10 sm:w-9 sm:h-9 flex items-center justify-center rounded-lg hover:bg-white/10 transition flex-shrink-0'
                        }, React.createElement('i', { className: 'fas fa-times text-lg' }))
                    ),

                    // Modal Form - Scrollable avec max-height sur mobile
                    React.createElement('form', { 
                        onSubmit: onSaveEvent, 
                        className: 'p-4 sm:p-6 space-y-4 sm:space-y-5 max-h-[70vh] sm:max-h-[75vh] overflow-y-auto' 
                    },
                        
                        // === SECTION 1: INFORMATIONS DE BASE ===
                        React.createElement('div', { className: 'space-y-3 sm:space-y-4' },
                            // Date & Time Row - 2 colonnes sur mobile
                            React.createElement('div', { className: 'grid grid-cols-2 gap-2 sm:gap-3' },
                                React.createElement('div', null,
                                    React.createElement('label', { className: 'block text-xs font-semibold text-slate-500 uppercase mb-1' }, 'Date'),
                                    React.createElement('input', { 
                                        name: 'date', 
                                        type: 'date',
                                        defaultValue: newEventDate,
                                        required: true,
                                        className: 'w-full p-2 sm:p-2.5 border border-slate-200 rounded-lg bg-slate-50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition text-sm font-medium text-slate-700' 
                                    })
                                ),
                                React.createElement('div', null,
                                    React.createElement('label', { className: 'block text-xs font-semibold text-slate-500 uppercase mb-1' }, 'Heure'),
                                    React.createElement('input', { 
                                        name: 'time', 
                                        type: 'time', 
                                        defaultValue: selectedEvent ? selectedEvent.time : '',
                                        className: 'w-full p-2 sm:p-2.5 border border-slate-200 rounded-lg bg-slate-50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition text-sm font-medium text-slate-700' 
                                    })
                                )
                            ),
                            
                            // Catégorie - Pleine largeur
                            React.createElement('div', null,
                                React.createElement('label', { className: 'block text-xs font-semibold text-slate-500 uppercase mb-1' }, 'Catégorie'),
                                React.createElement('select', { 
                                    name: 'type', 
                                    defaultValue: selectedEvent ? selectedEvent.type : (categories[0]?.id || ''),
                                    className: 'w-full p-2 sm:p-2.5 border border-slate-200 rounded-lg bg-slate-50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition text-sm font-medium text-slate-700' 
                                },
                                    categories.map(cat => 
                                        React.createElement('option', { key: cat.id, value: cat.id }, cat.label)
                                    )
                                )
                            ),
                            
                            // Title Input
                            React.createElement('div', null,
                                React.createElement('label', { className: 'block text-xs font-semibold text-slate-500 uppercase mb-1' }, 
                                    React.createElement('i', { className: 'fas fa-heading mr-1 text-slate-400' }),
                                    'Titre'
                                ),
                                React.createElement('input', { 
                                    name: 'title', 
                                    type: 'text', 
                                    defaultValue: selectedEvent ? selectedEvent.title : '',
                                    placeholder: 'Ex: Commande #1234',
                                    required: true,
                                    className: 'w-full p-2.5 sm:p-3 border border-slate-200 rounded-lg bg-slate-50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition text-sm font-medium text-slate-700 placeholder-slate-400' 
                                })
                            ),

                            // Details Input
                            React.createElement('div', null,
                                React.createElement('label', { className: 'block text-xs font-semibold text-slate-500 uppercase mb-1' }, 
                                    React.createElement('i', { className: 'fas fa-align-left mr-1 text-slate-400' }),
                                    'Description'
                                ),
                                React.createElement('textarea', { 
                                    name: 'details', 
                                    rows: 2,
                                    defaultValue: selectedEvent ? selectedEvent.details : '',
                                    placeholder: 'Spécifications, contacts...',
                                    className: 'w-full p-2.5 sm:p-3 border border-slate-200 rounded-lg bg-slate-50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition text-sm font-medium text-slate-700 resize-none placeholder-slate-400' 
                                })
                            )
                        ),

                        // === SECTION 2: DIFFUSION TV (Responsive) ===
                        React.createElement('div', { className: 'rounded-xl border-2 border-dashed border-slate-200 overflow-hidden' },
                            // Header avec toggle - Design compact
                            React.createElement('div', { 
                                className: `p-3 sm:p-4 cursor-pointer transition-all ${showTvExtras ? 'bg-purple-50 border-b border-purple-100' : 'bg-slate-50 hover:bg-slate-100'}`,
                                onClick: () => setShowTvExtras(!showTvExtras)
                            },
                                React.createElement('div', { className: 'flex items-center justify-between gap-2' },
                                    React.createElement('div', { className: 'flex items-center gap-2 sm:gap-3 min-w-0' },
                                        React.createElement('div', { className: `w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center transition-all flex-shrink-0 ${showTvExtras ? 'bg-purple-500 text-white' : 'bg-slate-200 text-slate-500'}` },
                                            React.createElement('i', { className: 'fas fa-tv text-sm sm:text-base' })
                                        ),
                                        React.createElement('div', { className: 'min-w-0' },
                                            React.createElement('div', { className: 'flex items-center gap-1 sm:gap-2' },
                                                React.createElement('span', { className: 'font-bold text-slate-800 text-sm sm:text-base' }, 'Diffuser TV'),
                                                React.createElement('button', {
                                                    type: 'button',
                                                    onClick: (e) => { e.stopPropagation(); setShowTvHelp(!showTvHelp); },
                                                    className: 'w-5 h-5 rounded-full bg-slate-200 hover:bg-purple-200 text-slate-500 hover:text-purple-600 flex items-center justify-center text-xs transition'
                                                }, React.createElement('i', { className: 'fas fa-question' }))
                                            ),
                                            React.createElement('p', { className: 'text-xs text-slate-500 hidden sm:block' }, 'Afficher sur l\'écran usine')
                                        )
                                    ),
                                    // Toggle switch
                                    React.createElement('div', { 
                                        className: 'relative flex-shrink-0',
                                        onClick: (e) => e.stopPropagation()
                                    },
                                        React.createElement('input', { 
                                            type: 'checkbox', 
                                            name: 'show_on_tv', 
                                            id: 'show_on_tv',
                                            checked: showTvExtras,
                                            onChange: (e) => setShowTvExtras(e.target.checked),
                                            className: 'sr-only peer'
                                        }),
                                        React.createElement('div', { 
                                            className: 'w-11 h-6 bg-slate-300 rounded-full peer peer-checked:bg-purple-500 transition-colors cursor-pointer',
                                            onClick: () => setShowTvExtras(!showTvExtras)
                                        }),
                                        React.createElement('div', { 
                                            className: `absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${showTvExtras ? 'translate-x-5' : ''}`,
                                            onClick: () => setShowTvExtras(!showTvExtras)
                                        })
                                    )
                                )
                            ),

                            // Info bulle d'aide (conditionnel)
                            showTvHelp && React.createElement('div', { className: 'mx-3 sm:mx-4 mt-2 sm:mt-3 mb-1 p-2 sm:p-3 bg-blue-50 border border-blue-200 rounded-lg' },
                                React.createElement('div', { className: 'flex gap-2' },
                                    React.createElement('i', { className: 'fas fa-info-circle text-blue-500 mt-0.5 flex-shrink-0' }),
                                    React.createElement('div', { className: 'text-xs text-blue-700' },
                                        React.createElement('p', { className: 'font-semibold mb-1' }, 'Diffusion TV'),
                                        React.createElement('ul', { className: 'ml-3 list-disc space-y-0.5' },
                                            React.createElement('li', {}, 'Ajouter une image'),
                                            React.createElement('li', {}, 'Mode POPUP pour urgences'),
                                            React.createElement('li', {}, 'Définir la durée')
                                        )
                                    )
                                )
                            ),
                            
                            // Options TV (conditionnel) - Compact sur mobile
                            showTvExtras && React.createElement('div', { className: 'p-3 sm:p-4 space-y-3 sm:space-y-4 bg-white' },
                                
                                // Mode POPUP - Plus compact sur mobile
                                React.createElement('div', { className: 'flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg border border-slate-200 hover:border-purple-300 hover:bg-purple-50/50 transition cursor-pointer',
                                    onClick: () => {
                                        const checkbox = document.getElementById('is_popup');
                                        if (checkbox) checkbox.click();
                                    }
                                },
                                    React.createElement('input', { 
                                        type: 'checkbox', 
                                        name: 'is_popup', 
                                        id: 'is_popup',
                                        defaultChecked: selectedEvent ? (selectedEvent.is_popup === 1 || selectedEvent.is_popup === true) : false,
                                        className: 'w-5 h-5 text-purple-600 rounded focus:ring-purple-500 border-slate-300 cursor-pointer flex-shrink-0' 
                                    }),
                                    React.createElement('div', { className: 'flex-1 min-w-0' },
                                        React.createElement('div', { className: 'flex items-center gap-1 sm:gap-2 flex-wrap' },
                                            React.createElement('span', { className: 'font-semibold text-slate-800 text-sm' }, 'Mode Alerte'),
                                            React.createElement('span', { className: 'px-1.5 py-0.5 bg-orange-100 text-orange-700 text-xs font-bold rounded' }, 'URGENT')
                                        ),
                                        React.createElement('p', { className: 'text-xs text-slate-500 mt-0.5 line-clamp-1 sm:line-clamp-none' }, 
                                            'Plein écran, interrompt le défilement'
                                        )
                                    )
                                ),

                                // Section Image - Simplifiée sur mobile
                                React.createElement('div', { className: 'space-y-2 sm:space-y-3' },
                                    React.createElement('div', { className: 'flex items-center justify-between' },
                                        React.createElement('label', { className: 'flex items-center gap-1 sm:gap-2 text-sm font-semibold text-slate-700' },
                                            React.createElement('i', { className: 'fas fa-image text-purple-500' }),
                                            'Image'
                                        ),
                                        imageUrl && React.createElement('button', {
                                            type: 'button',
                                            onClick: () => setImageUrl(''),
                                            className: 'text-xs text-red-500 hover:text-red-700 flex items-center gap-1 p-1'
                                        }, React.createElement('i', { className: 'fas fa-trash-alt' }))
                                    ),
                                    
                                    // Zone de drop / upload - Compact sur mobile
                                    !imageUrl ? React.createElement('div', { className: 'space-y-2' },
                                        React.createElement('label', { 
                                            className: 'flex flex-col items-center justify-center w-full h-24 sm:h-32 border-2 border-dashed border-slate-300 rounded-xl bg-slate-50 hover:bg-purple-50 hover:border-purple-300 cursor-pointer transition group'
                                        },
                                            React.createElement('div', { className: 'flex flex-col items-center justify-center p-2' },
                                                React.createElement('i', { className: `fas ${uploading ? 'fa-spinner fa-spin' : 'fa-cloud-upload-alt'} text-2xl sm:text-3xl text-slate-400 group-hover:text-purple-500 mb-1 sm:mb-2 transition` }),
                                                React.createElement('p', { className: 'text-xs sm:text-sm text-slate-600 font-medium text-center' }, 
                                                    uploading ? 'Envoi...' : 'Choisir une image'
                                                ),
                                                React.createElement('p', { className: 'text-xs text-slate-400 hidden sm:block' }, 'PNG, JPG (max 5MB)')
                                            ),
                                            React.createElement('input', {
                                                type: 'file',
                                                accept: 'image/*',
                                                className: 'hidden',
                                                onChange: handleImageUpload,
                                                disabled: uploading
                                            })
                                        ),
                                        // URL input - Toujours visible mais compact
                                        React.createElement('div', { className: 'relative' },
                                            React.createElement('i', { className: 'fas fa-link absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm' }),
                                            React.createElement('input', { 
                                                name: 'image_url', 
                                                type: 'text', 
                                                value: imageUrl || '',
                                                onChange: (e) => setImageUrl(e.target.value),
                                                placeholder: 'Ou coller une URL...',
                                                className: 'w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500 placeholder-slate-400' 
                                            })
                                        )
                                    ) : 
                                    // Preview de l'image - Compact sur mobile
                                    React.createElement('div', { className: 'relative' },
                                        React.createElement('div', { className: 'relative h-28 sm:h-40 w-full rounded-xl overflow-hidden border-2 border-purple-200 bg-slate-100' },
                                            React.createElement('img', { 
                                                src: imageUrl, 
                                                className: 'h-full w-full object-contain',
                                                onError: (e) => { e.target.style.display = 'none'; }
                                            }),
                                            React.createElement('div', { className: 'absolute top-1 right-1 sm:top-2 sm:right-2 px-1.5 sm:px-2 py-0.5 sm:py-1 bg-green-500 text-white text-xs font-bold rounded flex items-center gap-1' },
                                                React.createElement('i', { className: 'fas fa-check text-xs' }),
                                                React.createElement('span', { className: 'hidden sm:inline' }, 'Prête')
                                            )
                                        ),
                                        React.createElement('input', { 
                                            type: 'hidden',
                                            name: 'image_url', 
                                            value: imageUrl || ''
                                        })
                                    )
                                ),

                                // Durée avec slider - Compact sur mobile
                                React.createElement('div', { className: 'space-y-1.5 sm:space-y-2' },
                                    React.createElement('div', { className: 'flex items-center justify-between' },
                                        React.createElement('label', { className: 'flex items-center gap-1 sm:gap-2 text-sm font-semibold text-slate-700' },
                                            React.createElement('i', { className: 'fas fa-stopwatch text-purple-500' }),
                                            React.createElement('span', { className: 'hidden sm:inline' }, 'Durée d\'affichage'),
                                            React.createElement('span', { className: 'sm:hidden' }, 'Durée')
                                        ),
                                        React.createElement('span', { className: 'text-sm font-bold text-purple-600', id: 'duration-display' }, 
                                            (selectedEvent?.display_duration || 15) + 's'
                                        )
                                    ),
                                    React.createElement('div', { className: 'flex items-center gap-2 sm:gap-3' },
                                        React.createElement('span', { className: 'text-xs text-slate-400' }, '5s'),
                                        React.createElement('input', { 
                                            name: 'display_duration', 
                                            type: 'range', 
                                            min: 5, 
                                            max: 60,
                                            step: 5,
                                            defaultValue: selectedEvent ? (selectedEvent.display_duration || 15) : 15,
                                            className: 'flex-1 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-purple-500',
                                            onChange: (e) => {
                                                const display = document.getElementById('duration-display');
                                                if (display) display.textContent = e.target.value + 's';
                                            }
                                        }),
                                        React.createElement('span', { className: 'text-xs text-slate-400' }, '60s')
                                    )
                                )
                            )
                        )
                    ),

                    // Footer Buttons - Sticky sur mobile, hors du scroll
                    React.createElement('div', { className: 'sticky bottom-0 bg-white border-t border-slate-200 px-4 py-3 sm:px-6 sm:py-4' },
                        // Mobile: boutons empilés verticalement
                        React.createElement('div', { className: 'flex flex-col sm:flex-row sm:justify-between gap-2 sm:gap-3' },
                            // Actions principales (Annuler + Enregistrer) - En haut sur mobile
                            React.createElement('div', { className: 'flex gap-2 sm:order-2' },
                                React.createElement('button', { 
                                    type: 'button',
                                    onClick: () => setShowAddModal(false),
                                    className: 'flex-1 sm:flex-none px-4 py-2.5 text-slate-600 hover:bg-slate-100 rounded-lg font-medium transition text-sm text-center border border-slate-200' 
                                }, 'Annuler'),
                                React.createElement('button', { 
                                    type: 'submit',
                                    className: 'flex-1 sm:flex-none px-5 py-2.5 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white rounded-lg font-bold shadow-lg shadow-blue-200 transition flex items-center justify-center gap-1.5' 
                                }, 
                                    React.createElement('i', { className: 'fas fa-check' }), 
                                    React.createElement('span', {}, selectedEvent ? 'Enregistrer' : 'Créer')
                                )
                            ),
                            // Bouton Supprimer - En bas sur mobile, à gauche sur desktop
                            selectedEvent && React.createElement('button', {
                                type: 'button',
                                onClick: onDeleteEvent,
                                className: 'sm:order-1 text-red-500 hover:text-red-700 hover:bg-red-50 px-4 py-2.5 rounded-lg font-medium transition text-sm flex items-center justify-center gap-1.5 border border-red-200 sm:border-0'
                            }, 
                                React.createElement('i', { className: 'fas fa-trash-alt' }), 
                                React.createElement('span', {}, 'Supprimer')
                            )
                        )
                    )
                )
            )
        ),

        // CATEGORY MANAGEMENT MODAL - Aussi responsive
        showCategoryModal && React.createElement('div', { 
            className: 'fixed inset-0 z-[200] bg-black/50 overflow-y-auto animate-fadeIn',
            onClick: (e) => { if (e.target === e.currentTarget) setShowCategoryModal(false); }
        },
            React.createElement('div', { className: 'flex min-h-full items-end sm:items-center justify-center p-0 sm:p-4' },
                React.createElement('div', { className: 'bg-white sm:rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-scaleIn relative rounded-t-2xl sm:rounded-b-xl' },
                    // Header
                    React.createElement('div', { className: 'bg-gradient-to-r from-slate-800 to-slate-700 px-4 py-3 sm:px-6 sm:py-4 flex justify-between items-center' },
                        React.createElement('div', { className: 'flex items-center gap-2 sm:gap-3' },
                            React.createElement('div', { className: 'w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-white/10 flex items-center justify-center' },
                                React.createElement('i', { className: 'fas fa-tags text-white text-sm sm:text-lg' })
                            ),
                            React.createElement('h3', { className: 'font-bold text-base sm:text-lg text-white' }, 'Catégories')
                        ),
                        React.createElement('button', { 
                            onClick: () => setShowCategoryModal(false),
                            className: 'text-white/70 hover:text-white w-10 h-10 sm:w-9 sm:h-9 flex items-center justify-center rounded-lg hover:bg-white/10 transition'
                        }, React.createElement('i', { className: 'fas fa-times text-lg' }))
                    ),
                    
                    // Body - Scrollable sur mobile
                    React.createElement('div', { className: 'p-4 sm:p-6 max-h-[70vh] overflow-y-auto' },
                        // List
                        React.createElement('div', { className: 'space-y-2 mb-4 sm:mb-6' },
                            React.createElement('label', { className: 'block text-xs font-bold text-slate-500 uppercase mb-2' }, 'Catégories'),
                            categories.map(cat => 
                                React.createElement('div', { key: cat.id, className: `flex items-center justify-between p-2 sm:p-3 rounded-lg border transition ${editingCategory && editingCategory.id === cat.id ? 'bg-blue-50 border-blue-300 ring-1 ring-blue-300' : 'bg-slate-50 border-slate-200'}` },
                                    React.createElement('div', { className: 'flex items-center gap-2 sm:gap-3 min-w-0' },
                                        React.createElement('div', { 
                                            className: `w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0`,
                                            style: { 
                                                backgroundColor: cat.color === 'blue' ? '#DBEAFE' : cat.color === 'green' ? '#D1FAE5' : cat.color === 'red' ? '#FEE2E2' : cat.color === 'purple' ? '#E9D5FF' : cat.color === 'orange' ? '#FFEDD5' : '#FEF3C7',
                                                color: cat.color === 'blue' ? '#2563EB' : cat.color === 'green' ? '#16A34A' : cat.color === 'red' ? '#DC2626' : cat.color === 'purple' ? '#9333EA' : cat.color === 'orange' ? '#EA580C' : '#CA8A04'
                                            }
                                        },
                                            React.createElement('i', { className: `fas ${cat.icon} text-sm` })
                                        ),
                                        React.createElement('span', { className: 'font-medium text-slate-700 text-sm truncate' }, cat.label)
                                    ),
                                    React.createElement('div', { className: 'flex items-center gap-0.5 sm:gap-1 flex-shrink-0' },
                                        React.createElement('button', {
                                            type: 'button',
                                            onClick: () => onEditCategoryClick(cat),
                                            className: 'text-slate-400 hover:text-blue-600 w-9 h-9 sm:p-2 hover:bg-blue-50 rounded-lg transition flex items-center justify-center'
                                        }, React.createElement('i', { className: 'fas fa-pen' })),
                                        React.createElement('button', {
                                            type: 'button',
                                            onClick: () => onDeleteCategory(cat.id),
                                            className: 'text-red-400 hover:text-red-600 w-9 h-9 sm:p-2 hover:bg-red-50 rounded-lg transition flex items-center justify-center'
                                        }, React.createElement('i', { className: 'fas fa-trash-alt' }))
                                    )
                                )
                            )
                        ),

                        // Add/Edit Form
                        React.createElement('form', { 
                            key: editingCategory ? editingCategory.id : 'new',
                            onSubmit: onSaveCategory, 
                            className: `p-3 sm:p-4 rounded-xl border transition ${editingCategory ? 'bg-blue-50 border-blue-200 shadow-md' : 'bg-slate-50 border-slate-200'}` 
                        },
                            React.createElement('div', { className: 'flex justify-between items-center mb-2 sm:mb-3' },
                                React.createElement('label', { className: `block text-xs font-bold uppercase ${editingCategory ? 'text-blue-800' : 'text-slate-500'}` }, 
                                    editingCategory ? 'Modifier' : 'Nouvelle catégorie'
                                ),
                                editingCategory && React.createElement('button', {
                                    type: 'button',
                                    onClick: onCancelEditCategory,
                                    className: 'text-xs text-blue-600 hover:underline p-1'
                                }, 'Annuler')
                            ),
                            
                            React.createElement('div', { className: 'space-y-2 sm:space-y-3' },
                                React.createElement('input', { 
                                    name: 'label', 
                                    defaultValue: editingCategory ? editingCategory.label : '',
                                    placeholder: 'Nom (ex: Réunion)', 
                                    required: true, 
                                    className: 'w-full p-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                                }),
                                React.createElement('div', { className: 'grid grid-cols-2 gap-2' },
                                    React.createElement('select', { 
                                        name: 'color', 
                                        defaultValue: editingCategory ? editingCategory.color : 'blue',
                                        className: 'p-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                                    },
                                        [['blue', 'Bleu'], ['green', 'Vert'], ['red', 'Rouge'], ['yellow', 'Jaune'], ['purple', 'Violet'], ['orange', 'Orange']].map(([val, label]) =>
                                            React.createElement('option', { key: val, value: val }, label)
                                        )
                                    ),
                                    React.createElement('select', { 
                                        name: 'icon', 
                                        defaultValue: editingCategory ? editingCategory.icon : 'fa-tag',
                                        className: 'p-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                                    },
                                        [['fa-tag', 'Tag'], ['fa-cog', 'Engrenage'], ['fa-truck', 'Camion'], ['fa-wrench', 'Clé'], ['fa-calendar', 'Calendrier'], ['fa-star', 'Étoile'], ['fa-bolt', 'Éclair'], ['fa-shield-alt', 'SST']].map(([val, label]) =>
                                            React.createElement('option', { key: val, value: val }, label)
                                        )
                                    )
                                ),
                                React.createElement('button', {
                                    type: 'submit',
                                    className: `w-full py-2.5 rounded-lg font-medium text-sm transition ${editingCategory ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-slate-200 hover:bg-slate-300 text-slate-700'}`
                                }, editingCategory ? 'Enregistrer' : 'Ajouter')
                            )
                        )
                    )
                )
            )
        )
    );
};

window.PlanningModals = PlanningModals;
