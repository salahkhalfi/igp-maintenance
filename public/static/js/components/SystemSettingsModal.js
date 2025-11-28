// ===== MODAL PARAMETRES SYSTEME (ADMIN) =====
const SystemSettingsModal = ({ show, onClose, currentUser }) => {
    const [timezoneOffset, setTimezoneOffset] = React.useState('-5');
    const [loading, setLoading] = React.useState(true);
    const [saving, setSaving] = React.useState(false);

    // États pour l'upload du logo (admin uniquement)
    const [logoFile, setLogoFile] = React.useState(null);
    const [logoPreview, setLogoPreview] = React.useState(null);
    const [uploadingLogo, setUploadingLogo] = React.useState(false);
    const [currentLogoUrl, setCurrentLogoUrl] = React.useState('/api/settings/logo');
    const [logoRefreshKey, setLogoRefreshKey] = React.useState(Date.now());
    const [isSuperAdmin, setIsSuperAdmin] = React.useState(false);

    // États pour titre/sous-titre (admin uniquement)
    const [companyTitle, setCompanyTitle] = React.useState('Gestion de la maintenance et des réparations');
    const [companySubtitle, setCompanySubtitle] = React.useState('Les Produits Verriers International (IGP) Inc.');
    const [editingTitle, setEditingTitle] = React.useState(false);
    const [editingSubtitle, setEditingSubtitle] = React.useState(false);
    const [tempTitle, setTempTitle] = React.useState('');
    const [tempSubtitle, setTempSubtitle] = React.useState('');
    const [savingTitle, setSavingTitle] = React.useState(false);
    const [savingSubtitle, setSavingSubtitle] = React.useState(false);

    React.useEffect(() => {
        if (show) {
            loadSettings();
            checkSuperAdmin();
        }
    }, [show]);

    const checkSuperAdmin = async () => {
        try {
            // Vérifier si l'utilisateur actuel est admin
            // Tous les admins (role='admin') peuvent modifier le logo, titre et sous-titre
            // Le backend vérifie avec adminOnly middleware
            if (currentUser && currentUser.role === 'admin') {
                setIsSuperAdmin(true);
            } else {
                setIsSuperAdmin(false);
            }
        } catch (error) {
            setIsSuperAdmin(false);
        }
    };

    const loadSettings = async () => {
        setLoading(true);
        try {
            const response = await axios.get(API_URL + '/settings/timezone_offset_hours');
            setTimezoneOffset(response.data.setting_value);

            // Charger titre et sous-titre (super admin uniquement)
            if (isSuperAdmin) {
                try {
                    const titleResponse = await axios.get(API_URL + '/settings/company_title');
                    if (titleResponse.data.setting_value) {
                        setCompanyTitle(titleResponse.data.setting_value);
                    }
                } catch (error) {
                    // Titre par défaut
                }

                try {
                    const subtitleResponse = await axios.get(API_URL + '/settings/company_subtitle');
                    if (subtitleResponse.data.setting_value) {
                        setCompanySubtitle(subtitleResponse.data.setting_value);
                    }
                } catch (error) {
                    // Sous-titre par défaut
                }
            }
        } catch (error) {
            // Erreur silencieuse
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await axios.put(API_URL + '/settings/timezone_offset_hours', {
                value: timezoneOffset
            });
            // Mettre a jour le localStorage immediatement pour que les changements soient visibles
            localStorage.setItem('timezone_offset_hours', timezoneOffset);
            alert("Paramètres mis à jour avec succès!");
            onClose();
        } catch (error) {
            alert('Erreur: ' + (error.response?.data?.error || 'Erreur serveur'));
        } finally {
            setSaving(false);
        }
    };

    // Fonction pour gérer la sélection de fichier logo
    const handleLogoFileChange = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validation du type
        const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
        if (!allowedTypes.includes(file.type)) {
            alert('Type de fichier non autorisé. Utilisez PNG, JPEG ou WEBP.');
            return;
        }

        // Validation de la taille (500 KB max)
        if (file.size > 500 * 1024) {
            alert('Fichier trop volumineux (' + (file.size / 1024).toFixed(0) + ' KB). Maximum: 500 KB');
            return;
        }

        setLogoFile(file);

        // Créer une preview
        const reader = new FileReader();
        reader.onloadend = () => {
            setLogoPreview(reader.result);
        };
        reader.readAsDataURL(file);
    };

    // Fonction pour uploader le logo
    const handleUploadLogo = async () => {
        if (!logoFile) {
            alert('Veuillez sélectionner un fichier');
            return;
        }

        setUploadingLogo(true);
        try {
            const formData = new FormData();
            formData.append('logo', logoFile);

            const response = await axios.post(API_URL + '/settings/upload-logo', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });

            // Rafraîchir le logo affiché
            setLogoRefreshKey(Date.now());
            setLogoFile(null);
            setLogoPreview(null);

            alert('Logo uploadé avec succès! La page va se recharger pour afficher le nouveau logo...');

            // Forcer le rechargement de la page pour voir le nouveau logo partout
            setTimeout(() => {
                window.location.reload();
            }, 1500);
        } catch (error) {
            alert('Erreur: ' + (error.response?.data?.error || 'Erreur serveur'));
            setUploadingLogo(false);
        }
    };

    // Fonction pour réinitialiser le logo
    const handleResetLogo = async () => {
        if (!confirm('Voulez-vous vraiment réinitialiser le logo au logo par défaut?')) {
            return;
        }

        setUploadingLogo(true);
        try {
            await axios.delete(API_URL + '/settings/logo');

            // Rafraîchir le logo
            setLogoRefreshKey(Date.now());
            setLogoFile(null);
            setLogoPreview(null);

            alert('Logo réinitialisé avec succès! La page va se recharger pour afficher le logo par défaut...');

            // Forcer le rechargement de la page
            setTimeout(() => {
                window.location.reload();
            }, 1500);
        } catch (error) {
            alert('Erreur: ' + (error.response?.data?.error || 'Erreur serveur'));
            setUploadingLogo(false);
        }
    };

    // Fonctions pour gérer le titre
    const handleStartEditTitle = () => {
        setTempTitle(companyTitle);
        setEditingTitle(true);
    };

    const handleCancelEditTitle = () => {
        setTempTitle('');
        setEditingTitle(false);
    };

    const handleSaveTitle = async () => {
        if (!tempTitle.trim()) {
            alert('Le titre ne peut pas être vide');
            return;
        }

        if (tempTitle.trim().length > 100) {
            alert('Le titre ne peut pas dépasser 100 caractères');
            return;
        }

        setSavingTitle(true);
        try {
            await axios.put(API_URL + '/settings/title', {
                value: tempTitle.trim()
            });

            setCompanyTitle(tempTitle.trim());
            setEditingTitle(false);
            setTempTitle('');

            alert('Titre mis à jour avec succès! La page va se recharger...');
            setTimeout(() => {
                window.location.reload();
            }, 1500);
        } catch (error) {
            alert('Erreur: ' + (error.response?.data?.error || 'Erreur serveur'));
        } finally {
            setSavingTitle(false);
        }
    };

    // Fonctions pour gérer le sous-titre
    const handleStartEditSubtitle = () => {
        setTempSubtitle(companySubtitle);
        setEditingSubtitle(true);
    };

    const handleCancelEditSubtitle = () => {
        setTempSubtitle('');
        setEditingSubtitle(false);
    };

    const handleSaveSubtitle = async () => {
        if (!tempSubtitle.trim()) {
            alert('Le sous-titre ne peut pas être vide');
            return;
        }

        if (tempSubtitle.trim().length > 150) {
            alert('Le sous-titre ne peut pas dépasser 150 caractères');
            return;
        }

        setSavingSubtitle(true);
        try {
            await axios.put(API_URL + '/settings/subtitle', {
                value: tempSubtitle.trim()
            });

            setCompanySubtitle(tempSubtitle.trim());
            setEditingSubtitle(false);
            setTempSubtitle('');

            alert('Sous-titre mis à jour avec succès! La page va se recharger...');
            setTimeout(() => {
                window.location.reload();
            }, 1500);
        } catch (error) {
            alert('Erreur: ' + (error.response?.data?.error || 'Erreur serveur'));
        } finally {
            setSavingSubtitle(false);
        }
    };

    if (!show) return null;

    return React.createElement('div', {
        className: 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4',
        onClick: onClose
    },
        React.createElement('div', {
            className: 'bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden',
            onClick: (e) => e.stopPropagation()
        },
            React.createElement('div', { className: 'p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50' },
                React.createElement('div', { className: 'flex items-center justify-between' },
                    React.createElement('h2', { className: 'text-2xl font-bold text-gray-800 flex items-center gap-2' },
                        React.createElement('i', { className: 'fas fa-cog' }),
                        "Paramètres Système"
                    ),
                    React.createElement('button', {
                        onClick: onClose,
                        className: 'text-gray-500 hover:text-gray-700 text-2xl',
                        type: 'button'
                    }, '×')
                )
            ),

            React.createElement('div', { className: 'p-6 overflow-y-auto', style: { maxHeight: 'calc(90vh - 180px)' } },
                loading ? React.createElement('div', { className: 'text-center py-8' },
                    React.createElement('i', { className: 'fas fa-spinner fa-spin text-3xl text-blue-600' })
                ) : React.createElement('div', { className: 'space-y-6' },
                    React.createElement('div', { className: 'bg-blue-50 border border-blue-200 rounded-lg p-4' },
                        React.createElement('div', { className: 'flex items-start gap-3' },
                            React.createElement('i', { className: 'fas fa-info-circle text-blue-600 text-xl mt-1' }),
                            React.createElement('div', {},
                                React.createElement('h3', { className: 'font-bold text-blue-900 mb-2' }, "À propos du décalage horaire"),
                                React.createElement('p', { className: 'text-sm text-blue-800 mb-2' },
                                    "Le décalage horaire permet d'ajuster l'heure du serveur pour correspondre à votre fuseau horaire local."
                                ),
                                React.createElement('ul', { className: 'text-sm text-blue-800 space-y-1 list-disc list-inside' },
                                    React.createElement('li', {}, 'Hiver (EST): -5 heures'),
                                    React.createElement('li', {}, 'Ete (EDT): -4 heures'),
                                    React.createElement('li', {}, 'Impacte: alertes retard, countdowns')
                                )
                            )
                        )
                    ),

                    React.createElement('div', {},
                        React.createElement('label', { className: 'block text-sm font-semibold text-gray-700 mb-2' },
                            React.createElement('i', { className: 'fas fa-clock mr-2' }),
                            'Decalage horaire (heures par rapport a UTC)'
                        ),
                        React.createElement('select', {
                            value: timezoneOffset,
                            onChange: (e) => setTimezoneOffset(e.target.value),
                            className: 'w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg font-semibold'
                        },
                            React.createElement('option', { value: '-12' }, 'UTC-12'),
                            React.createElement('option', { value: '-11' }, 'UTC-11'),
                            React.createElement('option', { value: '-10' }, 'UTC-10 (Hawaii)'),
                            React.createElement('option', { value: '-9' }, 'UTC-9 (Alaska)'),
                            React.createElement('option', { value: '-8' }, 'UTC-8 (PST)'),
                            React.createElement('option', { value: '-7' }, 'UTC-7 (MST)'),
                            React.createElement('option', { value: '-6' }, 'UTC-6 (CST)'),
                            React.createElement('option', { value: '-5' }, 'UTC-5 (EST - Hiver Quebec)'),
                            React.createElement('option', { value: '-4' }, 'UTC-4 (EDT - Ete Quebec)'),
                            React.createElement('option', { value: '-3' }, 'UTC-3'),
                            React.createElement('option', { value: '-2' }, 'UTC-2'),
                            React.createElement('option', { value: '-1' }, 'UTC-1'),
                            React.createElement('option', { value: '0' }, 'UTC+0 (Londres)'),
                            React.createElement('option', { value: '1' }, 'UTC+1 (Paris)'),
                            React.createElement('option', { value: '2' }, 'UTC+2'),
                            React.createElement('option', { value: '3' }, 'UTC+3'),
                            React.createElement('option', { value: '4' }, 'UTC+4'),
                            React.createElement('option', { value: '5' }, 'UTC+5'),
                            React.createElement('option', { value: '6' }, 'UTC+6'),
                            React.createElement('option', { value: '7' }, 'UTC+7'),
                            React.createElement('option', { value: '8' }, 'UTC+8 (Hong Kong)'),
                            React.createElement('option', { value: '9' }, 'UTC+9 (Tokyo)'),
                            React.createElement('option', { value: '10' }, 'UTC+10 (Sydney)'),
                            React.createElement('option', { value: '11' }, 'UTC+11'),
                            React.createElement('option', { value: '12' }, 'UTC+12'),
                            React.createElement('option', { value: '13' }, 'UTC+13'),
                            React.createElement('option', { value: '14' }, 'UTC+14')
                        ),
                        React.createElement('p', { className: 'mt-2 text-sm text-gray-600' },
                            'Actuellement selectionne: UTC',
                            timezoneOffset,
                            ' (',
                            parseInt(timezoneOffset) === -5 ? 'EST - Hiver Quebec' :
                            parseInt(timezoneOffset) === -4 ? 'EDT - Ete Quebec' :
                            'Personnalise',
                            ')'
                        )
                    ),

                    React.createElement('div', { className: 'bg-yellow-50 border border-yellow-200 rounded-lg p-4' },
                        React.createElement('div', { className: 'flex items-start gap-3' },
                            React.createElement('i', { className: 'fas fa-exclamation-triangle text-yellow-600 text-xl mt-1' }),
                            React.createElement('div', {},
                                React.createElement('h3', { className: 'font-bold text-yellow-900 mb-1' }, "Attention"),
                                React.createElement('p', { className: 'text-sm text-yellow-800' },
                                    "Changez ce paramètre uniquement lors du changement d'heure (mars et novembre)."
                                )
                            )
                        )
                    ),

                    // Section Logo de l'entreprise (ADMIN UNIQUEMENT)
                    isSuperAdmin && React.createElement('div', { className: 'border-t border-gray-300 pt-6 mt-6' },
                        React.createElement('div', { className: 'bg-purple-50 border border-purple-200 rounded-lg p-4 mb-4' },
                            React.createElement('div', { className: 'flex items-start gap-3' },
                                React.createElement('i', { className: 'fas fa-image text-purple-600 text-xl mt-1' }),
                                React.createElement('div', {},
                                    React.createElement('h3', { className: 'font-bold text-purple-900 mb-2 flex items-center gap-2' },
                                        "Logo de l'entreprise",
                                        React.createElement('span', { className: 'text-xs bg-blue-600 text-white px-2 py-1 rounded' }, 'ADMIN')
                                    ),
                                    React.createElement('p', { className: 'text-sm text-purple-800 mb-2' },
                                        "Personnalisez le logo affiché dans l'application."
                                    ),
                                    React.createElement('ul', { className: 'text-sm text-purple-800 space-y-1 list-disc list-inside' },
                                        React.createElement('li', {}, 'Format: PNG transparent recommandé'),
                                        React.createElement('li', {}, 'Dimensions: 200×80 pixels (ratio 2.5:1)'),
                                        React.createElement('li', {}, 'Taille max: 500 KB')
                                    )
                                )
                            )
                        ),

                        // Logo actuel
                        React.createElement('div', { className: 'mb-4' },
                            React.createElement('label', { className: 'block text-sm font-semibold text-gray-700 mb-2' },
                                React.createElement('i', { className: 'fas fa-eye mr-2' }),
                                'Logo actuel'
                            ),
                            React.createElement('div', { className: 'bg-gray-100 border-2 border-gray-300 rounded-lg p-4 flex items-center justify-center' },
                                React.createElement('img', {
                                    src: currentLogoUrl + '?t=' + logoRefreshKey,
                                    alt: 'Logo actuel',
                                    className: 'max-h-20 max-w-full object-contain',
                                    onError: (e) => {
                                        e.target.src = '/static/logo-igp.png';
                                    }
                                })
                            )
                        ),

                        // Upload nouveau logo
                        React.createElement('div', { className: 'mb-4' },
                            React.createElement('label', { className: 'block text-sm font-semibold text-gray-700 mb-2' },
                                React.createElement('i', { className: 'fas fa-upload mr-2' }),
                                'Uploader un nouveau logo'
                            ),
                            // Bouton personnalisé pour sélectionner le fichier (en français)
                            React.createElement('div', { className: 'flex flex-col sm:flex-row gap-3 items-start sm:items-center' },
                                React.createElement('label', {
                                    className: 'cursor-pointer px-4 py-2 bg-purple-100 hover:bg-purple-200 text-purple-700 font-semibold rounded-lg border-2 border-purple-300 transition-all flex items-center gap-2 ' + (uploadingLogo ? 'opacity-50 cursor-not-allowed' : ''),
                                    style: { pointerEvents: uploadingLogo ? 'none' : 'auto' }
                                },
                                    React.createElement('i', { className: 'fas fa-folder-open' }),
                                    React.createElement('span', {}, 'Choisir un fichier'),
                                    React.createElement('input', {
                                        type: 'file',
                                        accept: 'image/png,image/jpeg,image/jpg,image/webp',
                                        onChange: handleLogoFileChange,
                                        disabled: uploadingLogo,
                                        className: 'hidden'
                                    })
                                ),
                                React.createElement('span', { className: 'text-sm text-gray-600' },
                                    logoFile ? logoFile.name : 'Aucun fichier sélectionné'
                                )
                            ),
                            logoPreview && React.createElement('div', { className: 'mt-3 bg-white border-2 border-purple-300 rounded-lg p-3 sm:p-4' },
                                React.createElement('p', { className: 'text-sm font-semibold text-gray-700 mb-2' }, 'Aperçu:'),
                                React.createElement('div', { className: 'flex items-center justify-center' },
                                    React.createElement('img', {
                                        src: logoPreview,
                                        alt: 'Aperçu',
                                        className: 'max-h-20 max-w-full object-contain'
                                    })
                                )
                            )
                        ),

                        // Boutons d'action
                        React.createElement('div', { className: 'flex flex-col sm:flex-row gap-3' },
                            React.createElement('button', {
                                onClick: handleUploadLogo,
                                disabled: !logoFile || uploadingLogo,
                                className: 'flex-1 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base',
                                type: 'button'
                            },
                                uploadingLogo && React.createElement('i', { className: 'fas fa-spinner fa-spin' }),
                                uploadingLogo ? 'Upload en cours...' : 'Uploader le logo'
                            ),
                            React.createElement('button', {
                                onClick: handleResetLogo,
                                disabled: uploadingLogo,
                                className: 'px-4 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-lg font-semibold transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base',
                                type: 'button',
                                title: 'Réinitialiser au logo par défaut'
                            },
                                React.createElement('i', { className: 'fas fa-undo' }),
                                React.createElement('span', { className: 'hidden sm:inline' }, 'Réinitialiser'),
                                React.createElement('span', { className: 'sm:hidden' }, 'Reset')
                            )
                        )
                    ),

                    // Section Titre et Sous-titre (ADMIN UNIQUEMENT)
                    isSuperAdmin && React.createElement('div', { className: 'border-t border-gray-300 pt-6 mt-6' },
                        React.createElement('div', { className: 'bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4' },
                            React.createElement('div', { className: 'flex items-start gap-3' },
                                React.createElement('i', { className: 'fas fa-heading text-blue-600 text-xl mt-1' }),
                                React.createElement('div', {},
                                    React.createElement('h3', { className: 'font-bold text-blue-900 mb-2 flex items-center gap-2' },
                                        "Titre et Sous-titre de l'application",
                                        React.createElement('span', { className: 'text-xs bg-blue-600 text-white px-2 py-1 rounded' }, 'ADMIN')
                                    ),
                                    React.createElement('p', { className: 'text-sm text-blue-800 mb-2' },
                                        "Personnalisez le titre et le sous-titre affichés dans l'en-tête de l'application."
                                    ),
                                    React.createElement('ul', { className: 'text-sm text-blue-800 space-y-1 list-disc list-inside' },
                                        React.createElement('li', {}, 'Titre: maximum 100 caractères'),
                                        React.createElement('li', {}, 'Sous-titre: maximum 150 caractères'),
                                        React.createElement('li', {}, 'Les caractères spéciaux sont supportés (é, è, à, ç, etc.)')
                                    )
                                )
                            )
                        ),

                        // Édition du titre
                        React.createElement('div', { className: 'mb-4' },
                            React.createElement('label', { className: 'block text-sm font-semibold text-gray-700 mb-2' },
                                React.createElement('i', { className: 'fas fa-heading mr-2' }),
                                'Titre principal'
                            ),
                            !editingTitle ? React.createElement('div', { className: 'flex flex-col sm:flex-row gap-3 items-start sm:items-center' },
                                React.createElement('div', { className: 'flex-1 bg-gray-100 border-2 border-gray-300 rounded-lg p-3 text-gray-800' },
                                    companyTitle
                                ),
                                React.createElement('button', {
                                    onClick: handleStartEditTitle,
                                    className: 'px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-all flex items-center gap-2 text-sm',
                                    type: 'button'
                                },
                                    React.createElement('i', { className: 'fas fa-edit' }),
                                    'Modifier'
                                )
                            ) : React.createElement('div', { className: 'space-y-3' },
                                React.createElement('input', {
                                    type: 'text',
                                    value: tempTitle,
                                    onChange: (e) => setTempTitle(e.target.value),
                                    placeholder: 'Entrez le nouveau titre',
                                    maxLength: 100,
                                    className: 'w-full px-4 py-2.5 border-2 border-blue-300 rounded-lg focus:outline-none focus:border-blue-500',
                                    disabled: savingTitle
                                }),
                                React.createElement('div', { className: 'flex items-center justify-between' },
                                    React.createElement('span', { className: 'text-xs text-gray-600' },
                                        tempTitle.length + '/100 caractères'
                                    ),
                                    React.createElement('div', { className: 'flex gap-2' },
                                        React.createElement('button', {
                                            onClick: handleCancelEditTitle,
                                            disabled: savingTitle,
                                            className: 'px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded-lg font-semibold transition-all text-sm disabled:opacity-50',
                                            type: 'button'
                                        }, 'Annuler'),
                                        React.createElement('button', {
                                            onClick: handleSaveTitle,
                                            disabled: !tempTitle.trim() || savingTitle,
                                            className: 'px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-all flex items-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed',
                                            type: 'button'
                                        },
                                            savingTitle && React.createElement('i', { className: 'fas fa-spinner fa-spin' }),
                                            savingTitle ? 'Enregistrement...' : 'Enregistrer'
                                        )
                                    )
                                )
                            )
                        ),

                        // Édition du sous-titre
                        React.createElement('div', { className: 'mb-0' },
                            React.createElement('label', { className: 'block text-sm font-semibold text-gray-700 mb-2' },
                                React.createElement('i', { className: 'fas fa-align-left mr-2' }),
                                'Sous-titre'
                            ),
                            !editingSubtitle ? React.createElement('div', { className: 'flex flex-col sm:flex-row gap-3 items-start sm:items-center' },
                                React.createElement('div', { className: 'flex-1 bg-gray-100 border-2 border-gray-300 rounded-lg p-3 text-gray-800' },
                                    companySubtitle
                                ),
                                React.createElement('button', {
                                    onClick: handleStartEditSubtitle,
                                    className: 'px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-all flex items-center gap-2 text-sm',
                                    type: 'button'
                                },
                                    React.createElement('i', { className: 'fas fa-edit' }),
                                    'Modifier'
                                )
                            ) : React.createElement('div', { className: 'space-y-3' },
                                React.createElement('input', {
                                    type: 'text',
                                    value: tempSubtitle,
                                    onChange: (e) => setTempSubtitle(e.target.value),
                                    placeholder: 'Entrez le nouveau sous-titre',
                                    maxLength: 150,
                                    className: 'w-full px-4 py-2.5 border-2 border-blue-300 rounded-lg focus:outline-none focus:border-blue-500',
                                    disabled: savingSubtitle
                                }),
                                React.createElement('div', { className: 'flex items-center justify-between' },
                                    React.createElement('span', { className: 'text-xs text-gray-600' },
                                        tempSubtitle.length + '/150 caractères'
                                    ),
                                    React.createElement('div', { className: 'flex gap-2' },
                                        React.createElement('button', {
                                            onClick: handleCancelEditSubtitle,
                                            disabled: savingSubtitle,
                                            className: 'px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded-lg font-semibold transition-all text-sm disabled:opacity-50',
                                            type: 'button'
                                        }, 'Annuler'),
                                        React.createElement('button', {
                                            onClick: handleSaveSubtitle,
                                            disabled: !tempSubtitle.trim() || savingSubtitle,
                                            className: 'px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-all flex items-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed',
                                            type: 'button'
                                        },
                                            savingSubtitle && React.createElement('i', { className: 'fas fa-spinner fa-spin' }),
                                            savingSubtitle ? 'Enregistrement...' : 'Enregistrer'
                                        )
                                    )
                                )
                            )
                        )
                    )
                ),

                React.createElement('div', { className: 'p-6 border-t border-gray-200 bg-gray-50 flex justify-end gap-3' },
                    React.createElement('button', {
                        onClick: onClose,
                        disabled: saving,
                        className: 'px-6 py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded-lg font-semibold transition-all',
                        type: 'button'
                    }, 'Annuler'),
                    React.createElement('button', {
                        onClick: handleSave,
                        disabled: saving,
                        className: 'px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-all flex items-center gap-2',
                        type: 'button'
                    },
                        saving && React.createElement('i', { className: 'fas fa-spinner fa-spin' }),
                        saving ? 'Enregistrement...' : 'Enregistrer'
                    )
                )
            )
        )
    );
};
