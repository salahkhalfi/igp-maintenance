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
    // isSuperAdmin = vendeur SaaS (salah [at] khalfi [dot] com) - accès TOTAL
    const [isSuperAdmin, setIsSuperAdmin] = React.useState(false);
    // isClientAdmin = admin entreprise cliente - accès aux paramètres de son entreprise (logo, titre, etc.)
    const [isClientAdmin, setIsClientAdmin] = React.useState(false);

    // États pour l'application (admin uniquement)
    const [companyTitle, setCompanyTitle] = React.useState('Système de Gestion Interne'); // Nom de l'application
    
    // États pour l'entreprise (NOUVEAUX - Phase 1)
    const [companyName, setCompanyName] = React.useState(''); // Nom officiel entreprise
    const [companyAddress, setCompanyAddress] = React.useState(''); // Adresse complète
    const [companyEmail, setCompanyEmail] = React.useState(''); // Courriel officiel
    const [companyPhone, setCompanyPhone] = React.useState(''); // Téléphone
    
    // Legacy: company_subtitle (sera migré vers company_name)
    const [companySubtitle, setCompanySubtitle] = React.useState('');
    
    // États d'édition
    const [editingTitle, setEditingTitle] = React.useState(false);
    const [editingCompanyName, setEditingCompanyName] = React.useState(false);
    const [editingAddress, setEditingAddress] = React.useState(false);
    const [editingEmail, setEditingEmail] = React.useState(false);
    const [editingPhone, setEditingPhone] = React.useState(false);
    
    // Valeurs temporaires
    const [tempTitle, setTempTitle] = React.useState('');
    const [tempCompanyName, setTempCompanyName] = React.useState('');
    const [tempAddress, setTempAddress] = React.useState('');
    const [tempEmail, setTempEmail] = React.useState('');
    const [tempPhone, setTempPhone] = React.useState('');
    
    // États de sauvegarde
    const [savingTitle, setSavingTitle] = React.useState(false);
    const [savingCompanyName, setSavingCompanyName] = React.useState(false);
    const [savingAddress, setSavingAddress] = React.useState(false);
    const [savingEmail, setSavingEmail] = React.useState(false);
    const [savingPhone, setSavingPhone] = React.useState(false);
    
    // Legacy (pour compatibilité)
    const [editingSubtitle, setEditingSubtitle] = React.useState(false);
    const [tempSubtitle, setTempSubtitle] = React.useState('');
    const [savingSubtitle, setSavingSubtitle] = React.useState(false);

    // État pour le contexte AI personnalisé
    const [aiCustomContext, setAiCustomContext] = React.useState('');
    const [editingAiContext, setEditingAiContext] = React.useState(false);
    const [tempAiContext, setTempAiContext] = React.useState('');
    const [savingAiContext, setSavingAiContext] = React.useState(false);

    // États pour le nom de l'application Messagerie (Custom Messenger Name)
    const [messengerAppName, setMessengerAppName] = React.useState('Connect');
    const [editingMessengerName, setEditingMessengerName] = React.useState(false);
    const [tempMessengerName, setTempMessengerName] = React.useState('');
    const [savingMessengerName, setSavingMessengerName] = React.useState(false);

    // États pour le Domaine (Base URL)
    const [baseUrl, setBaseUrl] = React.useState('');
    const [editingBaseUrl, setEditingBaseUrl] = React.useState(false);
    const [tempBaseUrl, setTempBaseUrl] = React.useState('');
    const [savingBaseUrl, setSavingBaseUrl] = React.useState(false);

    // États pour le Webhook URL (Intégrations: Pabbly, Make, Zapier, etc.)
    const [webhookUrl, setWebhookUrl] = React.useState('');
    const [editingWebhookUrl, setEditingWebhookUrl] = React.useState(false);
    const [tempWebhookUrl, setTempWebhookUrl] = React.useState('');
    const [savingWebhookUrl, setSavingWebhookUrl] = React.useState(false);

    // État pour le Rate Limiting (protection anti-abus)
    const [rateLimitEnabled, setRateLimitEnabled] = React.useState(false);
    const [savingRateLimit, setSavingRateLimit] = React.useState(false);

    // États pour les Placeholders personnalisables (SaaS)
    const [placeholders, setPlaceholders] = React.useState({
        placeholder_machine_type: 'Ex: Équipement, Machine...',
        placeholder_location: 'Ex: Zone A, Atelier...',
        placeholder_manufacturer: 'Ex: Marque, Fabricant...'
    });
    const [editingPlaceholders, setEditingPlaceholders] = React.useState(false);
    const [tempPlaceholders, setTempPlaceholders] = React.useState({});
    const [savingPlaceholders, setSavingPlaceholders] = React.useState(false);

    // États Modules
    const [licenses, setLicenses] = React.useState({
        planning: true,
        statistics: true,
        notifications: true,
        messaging: true,
        machines: true
    });
    const [preferences, setPreferences] = React.useState({
        planning: true,
        statistics: true,
        notifications: true,
        messaging: true,
        machines: true
    });

    React.useEffect(() => {
        if (show) {
            // Vérifier d'abord les niveaux d'accès, puis charger les settings
            const init = async () => {
                // ARCHITECTURE DES PERMISSIONS:
                // - isSuperAdmin (vendeur SaaS): accès TOTAL (Anti-Abus, URLs, Maintenance DB, Webhooks)
                // - isClientAdmin (admin entreprise): accès aux paramètres de SON entreprise (Logo, Titre, Contexte IA)
                
                let isSuperAdminUser = false;
                let isClientAdminUser = false;
                
                if (currentUser) {
                    // SuperAdmin = is_super_admin flag TRUE en base de données
                    if (currentUser.isSuperAdmin === true) {
                        isSuperAdminUser = true;
                        isClientAdminUser = true; // SuperAdmin a AUSSI accès aux fonctions client admin
                    }
                    // Client Admin = role === 'admin' mais PAS superadmin
                    else if (currentUser.role === 'admin') {
                        isClientAdminUser = true;
                    }
                }
                
                setIsSuperAdmin(isSuperAdminUser);
                setIsClientAdmin(isClientAdminUser);
                
                // Load settings - superadmin voit tout, client admin voit les sections entreprise
                await loadSettingsWithAdmin(isClientAdminUser);
                loadModules();
            };
            init();
        }
    }, [show, currentUser]);

    const loadModules = async () => {
        try {
            // Charger les licences (État réel)
            const resLic = await axios.get(API_URL + '/settings/modules/status');
            setLicenses(resLic.data);

            // Charger les préférences client
            const resPref = await axios.get(API_URL + '/settings/modules/preferences');
            setPreferences(resPref.data);
        } catch (e) {
            console.error(e);
        }
    };

    const toggleModule = async (key) => {
        if (isSuperAdmin) {
            // Super Admin: Modifie les LICENCES
            const newLicenses = { ...licenses, [key]: !licenses[key] };
            setLicenses(newLicenses); // Optimistic
            try {
                await axios.put(API_URL + '/settings/modules/status', newLicenses);
                if (window.onModulesChange) window.onModulesChange(newLicenses);
            } catch (e) {
                alert("Erreur sauvegarde licence");
                setLicenses(licenses); // Revert
            }
        } else {
            // Client Admin: Modifie ses PRÉFÉRENCES
            // Impossible d'activer si pas de licence
            if (!licenses[key] && !preferences[key]) {
                alert("Ce module n'est pas inclus dans votre abonnement.");
                return;
            }
            
            const newPreferences = { ...preferences, [key]: !preferences[key] };
            setPreferences(newPreferences); // Optimistic
            try {
                await axios.put(API_URL + '/settings/modules/preferences', newPreferences);
                if (window.onModulesChange) window.onModulesChange(newPreferences);
            } catch (e) {
                alert("Erreur sauvegarde préférence");
                setPreferences(preferences); // Revert
            }
        }
    };

    const checkSuperAdmin = async () => {
        try {
            // Vérifier si l'utilisateur actuel est SUPERADMIN (vendeur SaaS)
            // IMPORTANT: isSuperAdmin vient de la DB (is_super_admin = 1)
            // Seul le vendeur (salah [at] khalfi [dot] com) a accès aux paramètres système critiques
            // Les admins client (support@maintenance-app.com) n'ont PAS accès à ces sections
            if (currentUser && currentUser.isSuperAdmin === true) {
                setIsSuperAdmin(true);
            } else {
                setIsSuperAdmin(false);
            }
        } catch (error) {
            setIsSuperAdmin(false);
        }
    };

    const loadSettingsWithAdmin = async (isAdmin) => {
        setLoading(true);
        try {
            const response = await axios.get(API_URL + '/settings/timezone_offset_hours');
            setTimezoneOffset(response.data.setting_value);

            // Charger paramètres application et entreprise (admin uniquement)
            if (isAdmin) {
                // 1. Nom de l'application (company_title)
                try {
                    const titleResponse = await axios.get(API_URL + '/settings/company_title');
                    if (titleResponse.data.setting_value) {
                        setCompanyTitle(titleResponse.data.setting_value);
                    }
                } catch (error) {
                    // Titre par défaut
                }

                // 2. Nom officiel de l'entreprise (NOUVEAU)
                try {
                    const nameResponse = await axios.get(API_URL + '/settings/company_name');
                    if (nameResponse.data.setting_value) {
                        setCompanyName(nameResponse.data.setting_value);
                    }
                } catch (error) {
                    // Fallback: utiliser company_subtitle si company_name n'existe pas encore
                }

                // 3. Legacy: company_subtitle (pour migration)
                try {
                    const subtitleResponse = await axios.get(API_URL + '/settings/company_subtitle');
                    if (subtitleResponse.data.setting_value) {
                        setCompanySubtitle(subtitleResponse.data.setting_value);
                        // Si company_name est vide, utiliser subtitle comme fallback
                        if (!companyName) {
                            setCompanyName(subtitleResponse.data.setting_value);
                        }
                    }
                } catch (error) {
                    // Sous-titre par défaut
                }

                // 4. Adresse de l'entreprise
                try {
                    const addressResponse = await axios.get(API_URL + '/settings/company_address');
                    if (addressResponse.data.setting_value) {
                        setCompanyAddress(addressResponse.data.setting_value);
                    }
                } catch (error) {
                    // Adresse par défaut vide
                }

                // 5. Courriel officiel (NOUVEAU)
                try {
                    const emailResponse = await axios.get(API_URL + '/settings/company_email');
                    if (emailResponse.data.setting_value) {
                        setCompanyEmail(emailResponse.data.setting_value);
                    }
                } catch (error) {
                    // Courriel par défaut vide
                }

                // 6. Téléphone (NOUVEAU)
                try {
                    const phoneResponse = await axios.get(API_URL + '/settings/company_phone');
                    if (phoneResponse.data.setting_value) {
                        setCompanyPhone(phoneResponse.data.setting_value);
                    }
                } catch (error) {
                    // Téléphone par défaut vide
                }

                try {
                    const aiContextResponse = await axios.get(API_URL + '/settings/ai_custom_context');
                    if (aiContextResponse.data.setting_value) {
                        setAiCustomContext(aiContextResponse.data.setting_value);
                    }
                } catch (error) {
                    // Contexte AI par défaut vide
                }

                try {
                    const messengerNameResponse = await axios.get(API_URL + '/settings/messenger_app_name');
                    if (messengerNameResponse.data.setting_value) {
                        setMessengerAppName(messengerNameResponse.data.setting_value);
                    }
                } catch (error) {
                    // Default messenger name
                }

                try {
                    const baseUrlResponse = await axios.get(API_URL + '/settings/app_base_url');
                    if (baseUrlResponse.data.value) {
                        setBaseUrl(baseUrlResponse.data.value);
                    } else {
                        setBaseUrl(window.location.origin);
                    }
                } catch (error) {
                    setBaseUrl(window.location.origin);
                }

                // Charger le Webhook URL
                try {
                    const webhookUrlResponse = await axios.get(API_URL + '/settings/webhook_url');
                    if (webhookUrlResponse.data.setting_value) {
                        setWebhookUrl(webhookUrlResponse.data.setting_value);
                    }
                } catch (error) {
                    // Webhook non configuré (normal pour nouvelle installation)
                }

                // Charger l'état du Rate Limiting
                try {
                    const rateLimitResponse = await axios.get(API_URL + '/settings/rate_limit_enabled');
                    setRateLimitEnabled(rateLimitResponse.data.setting_value === 'true');
                } catch (error) {
                    // Rate limit désactivé par défaut
                    setRateLimitEnabled(false);
                }

                // Charger les Placeholders personnalisables
                try {
                    const placeholdersResponse = await axios.get(API_URL + '/settings/placeholders');
                    if (placeholdersResponse.data) {
                        setPlaceholders(placeholdersResponse.data);
                    }
                } catch (error) {
                    // Placeholders par défaut
                }
            }
        } catch (error) {
            // Erreur silencieuse
        } finally {
            setLoading(false);
        }
    };

    // Handlers pour les Placeholders
    const handleEditPlaceholders = () => {
        setTempPlaceholders({ ...placeholders });
        setEditingPlaceholders(true);
    };

    const handleCancelEditPlaceholders = () => {
        setEditingPlaceholders(false);
        setTempPlaceholders({});
    };

    const handleSavePlaceholders = async () => {
        setSavingPlaceholders(true);
        try {
            await axios.put(API_URL + '/settings/placeholders', tempPlaceholders, {
                headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') }
            });
            setPlaceholders(tempPlaceholders);
            setEditingPlaceholders(false);
            alert('Exemples mis à jour avec succès !');
        } catch (error) {
            alert('Erreur: ' + (error.response?.data?.error || 'Erreur serveur'));
        } finally {
            setSavingPlaceholders(false);
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

    // Fonctions pour gérer le nom de l'entreprise (NOUVEAU)
    const handleStartEditCompanyName = () => {
        setTempCompanyName(companyName);
        setEditingCompanyName(true);
    };

    const handleCancelEditCompanyName = () => {
        setTempCompanyName('');
        setEditingCompanyName(false);
    };

    const handleSaveCompanyName = async () => {
        if (!tempCompanyName.trim()) {
            alert('Le nom de l\'entreprise ne peut pas être vide');
            return;
        }
        if (tempCompanyName.trim().length > 150) {
            alert('Le nom ne peut pas dépasser 150 caractères');
            return;
        }

        setSavingCompanyName(true);
        try {
            await axios.put(API_URL + '/settings/company_name', {
                value: tempCompanyName.trim()
            });

            setCompanyName(tempCompanyName.trim());
            setEditingCompanyName(false);
            setTempCompanyName('');

            alert('Nom de l\'entreprise mis à jour avec succès!');
        } catch (error) {
            alert('Erreur: ' + (error.response?.data?.error || 'Erreur serveur'));
        } finally {
            setSavingCompanyName(false);
        }
    };

    // Fonctions pour gérer l'adresse
    const handleStartEditAddress = () => {
        setTempAddress(companyAddress);
        setEditingAddress(true);
    };

    const handleCancelEditAddress = () => {
        setTempAddress('');
        setEditingAddress(false);
    };

    const handleSaveAddress = async () => {
        if (tempAddress.trim().length > 200) {
            alert('L\'adresse ne peut pas dépasser 200 caractères');
            return;
        }

        setSavingAddress(true);
        try {
            await axios.put(API_URL + '/settings/company_address', {
                value: tempAddress.trim()
            });

            setCompanyAddress(tempAddress.trim());
            setEditingAddress(false);
            setTempAddress('');

            alert('Adresse mise à jour avec succès!');
        } catch (error) {
            alert('Erreur: ' + (error.response?.data?.error || 'Erreur serveur'));
        } finally {
            setSavingAddress(false);
        }
    };

    // Fonctions pour gérer le courriel (NOUVEAU)
    const handleStartEditEmail = () => {
        setTempEmail(companyEmail);
        setEditingEmail(true);
    };

    const handleCancelEditEmail = () => {
        setTempEmail('');
        setEditingEmail(false);
    };

    const handleSaveEmail = async () => {
        const email = tempEmail.trim();
        if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            alert('Format de courriel invalide');
            return;
        }
        if (email.length > 100) {
            alert('Le courriel ne peut pas dépasser 100 caractères');
            return;
        }

        setSavingEmail(true);
        try {
            await axios.put(API_URL + '/settings/company_email', { value: email });

            setCompanyEmail(email);
            setEditingEmail(false);
            setTempEmail('');

            alert('Courriel mis à jour avec succès!');
        } catch (error) {
            alert('Erreur: ' + (error.response?.data?.error || 'Erreur serveur'));
        } finally {
            setSavingEmail(false);
        }
    };

    // Fonctions pour gérer le téléphone (NOUVEAU)
    const handleStartEditPhone = () => {
        setTempPhone(companyPhone);
        setEditingPhone(true);
    };

    const handleCancelEditPhone = () => {
        setTempPhone('');
        setEditingPhone(false);
    };

    const handleSavePhone = async () => {
        const phone = tempPhone.trim();
        if (phone.length > 30) {
            alert('Le téléphone ne peut pas dépasser 30 caractères');
            return;
        }

        setSavingPhone(true);
        try {
            await axios.put(API_URL + '/settings/company_phone', { value: phone });

            setCompanyPhone(phone);
            setEditingPhone(false);
            setTempPhone('');

            alert('Téléphone mis à jour avec succès!');
        } catch (error) {
            alert('Erreur: ' + (error.response?.data?.error || 'Erreur serveur'));
        } finally {
            setSavingPhone(false);
        }
    };

    // Fonctions pour gérer le contexte AI
    const handleStartEditAiContext = () => {
        setTempAiContext(aiCustomContext);
        setEditingAiContext(true);
    };

    const handleCancelEditAiContext = () => {
        setTempAiContext('');
        setEditingAiContext(false);
    };

    const handleSaveAiContext = async () => {
        if (tempAiContext.length > 30000) {
            alert('Le contexte AI ne peut pas dépasser 30000 caractères');
            return;
        }

        setSavingAiContext(true);
        try {
            await axios.put(API_URL + '/settings/ai_custom_context', {
                value: tempAiContext.trim()
            });

            setAiCustomContext(tempAiContext.trim());
            setEditingAiContext(false);
            setTempAiContext('');

            alert('Contexte AI mis à jour avec succès!');
        } catch (error) {
            alert('Erreur: ' + (error.response?.data?.error || 'Erreur serveur'));
        } finally {
            setSavingAiContext(false);
        }
    };

    // Fonctions pour gérer le nom de la messagerie
    const handleStartEditMessengerName = () => {
        setTempMessengerName(messengerAppName);
        setEditingMessengerName(true);
    };

    const handleCancelEditMessengerName = () => {
        setTempMessengerName('');
        setEditingMessengerName(false);
    };

    const handleSaveMessengerName = async () => {
        if (!tempMessengerName.trim()) {
            alert('Le nom ne peut pas être vide');
            return;
        }
        
        if (tempMessengerName.length > 50) {
            alert('Le nom ne peut pas dépasser 50 caractères');
            return;
        }

        setSavingMessengerName(true);
        try {
            await axios.put(API_URL + '/settings/messenger_app_name', {
                value: tempMessengerName.trim()
            });

            setMessengerAppName(tempMessengerName.trim());
            setEditingMessengerName(false);
            setTempMessengerName('');

            alert('Nom de l\'application messagerie mis à jour ! La page va se recharger...');
            setTimeout(() => {
                window.location.reload();
            }, 1500);
        } catch (error) {
            alert('Erreur: ' + (error.response?.data?.error || 'Erreur serveur'));
        } finally {
            setSavingMessengerName(false);
        }
    };

    // Fonctions pour gérer le Domaine
    const handleStartEditBaseUrl = () => {
        setTempBaseUrl(baseUrl);
        setEditingBaseUrl(true);
    };

    const handleCancelEditBaseUrl = () => {
        setTempBaseUrl('');
        setEditingBaseUrl(false);
    };

    const handleAutoDetectBaseUrl = () => {
        setTempBaseUrl(window.location.origin);
    };

    const handleSaveBaseUrl = async () => {
        let cleanUrl = tempBaseUrl.trim();
        if (!cleanUrl) {
            alert('L\'URL ne peut pas être vide');
            return;
        }
        if (cleanUrl.endsWith('/')) cleanUrl = cleanUrl.slice(0, -1);
        if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
            cleanUrl = 'https://' + cleanUrl;
        }

        setSavingBaseUrl(true);
        try {
            await axios.put(API_URL + '/settings/app_base_url', { value: cleanUrl });
            setBaseUrl(cleanUrl);
            setEditingBaseUrl(false);
            setTempBaseUrl('');
            alert('Domaine mis à jour avec succès !');
        } catch (error) {
            alert('Erreur: ' + (error.response?.data?.error || 'Erreur serveur'));
        } finally {
            setSavingBaseUrl(false);
        }
    };

    // Fonctions pour gérer le Webhook URL (Intégrations)
    const handleStartEditWebhookUrl = () => {
        setTempWebhookUrl(webhookUrl);
        setEditingWebhookUrl(true);
    };

    const handleCancelEditWebhookUrl = () => {
        setTempWebhookUrl('');
        setEditingWebhookUrl(false);
    };

    const handleSaveWebhookUrl = async () => {
        let cleanUrl = tempWebhookUrl.trim();
        // Allow empty URL to disable webhooks
        if (cleanUrl && !cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
            cleanUrl = 'https://' + cleanUrl;
        }

        setSavingWebhookUrl(true);
        try {
            await axios.put(API_URL + '/settings/webhook_url', { value: cleanUrl });
            setWebhookUrl(cleanUrl);
            setEditingWebhookUrl(false);
            setTempWebhookUrl('');
            alert(cleanUrl ? 'Webhook configuré avec succès !' : 'Webhook désactivé.');
        } catch (error) {
            alert('Erreur: ' + (error.response?.data?.error || 'Erreur serveur'));
        } finally {
            setSavingWebhookUrl(false);
        }
    };

    // Fonction pour toggle le Rate Limiting
    const handleToggleRateLimit = async () => {
        const newValue = !rateLimitEnabled;
        setSavingRateLimit(true);
        try {
            await axios.put(API_URL + '/settings/rate_limit_enabled', { value: newValue ? 'true' : 'false' });
            setRateLimitEnabled(newValue);
            alert(newValue ? 'Protection anti-abus ACTIVÉE' : 'Protection anti-abus DÉSACTIVÉE');
        } catch (error) {
            alert('Erreur: ' + (error.response?.data?.error || 'Erreur serveur'));
        } finally {
            setSavingRateLimit(false);
        }
    };

    // Fonction pour lancer le nettoyage (Janitor) manuel
    const [cleaning, setCleaning] = React.useState(false);
    const handleManualCleanup = async () => {
        if (!confirm('Lancer le nettoyage manuel ?\n\nCela supprimera :\n- Événements > 3 mois\n- Notes terminées > 30 jours\n- Et optimisera la base de données.')) return;

        setCleaning(true);
        try {
            // On utilise le token CRON_SECRET injecté côté serveur, 
            // mais ici c'est un appel client. 
            // Il faut soit un endpoint admin sécurisé par Auth (user), soit on expose une route admin/cleanup.
            // Option choisie : Route admin sécurisée qui appelle la logique du janitor
            // Wait, la route /api/cron/cleanup-old-data demande le CRON_SECRET.
            // Le client ne connait PAS le CRON_SECRET.
            // Solution : On va modifier SystemSettingsModal pour appeler un nouvel endpoint API standard (admin only) qui lui appellera le cleanup.
            // Ou plus simple: On suppose que l'admin est logué et on a créé une route protégée dans `settings.ts` ?
            // Non, j'ai mis la route dans `cron.ts` protégée par CRON_SECRET.
            
            // CORRECTION LIVE : Je vais ajouter un fetch vers une route spéciale admin dans `settings.ts`
            // qui proxy vers la logique de nettoyage.
            // Pour l'instant, je simule un appel API classique (il faudra ajouter la route dans le backend)
            const response = await axios.post(API_URL + '/settings/trigger-cleanup'); 
            
            alert('Nettoyage terminé avec succès !\n\n' + JSON.stringify(response.data.deleted, null, 2));
        } catch (error) {
            // Fallback si la route n'existe pas encore
            alert('Erreur ou fonction non disponible: ' + (error.response?.data?.error || error.message));
        } finally {
            setCleaning(false);
        }
    };

    if (!show) return null;

    return React.createElement('div', {
        className: 'fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[10000] p-4 backdrop-blur-sm',
        onClick: onClose
    },
        React.createElement('div', {
            className: 'bg-white rounded-lg border border-gray-300 max-w-2xl w-full max-h-[85vh] sm:max-h-[90vh] overflow-hidden',
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

                    // Section Gestion des Modules (Licensing) - REMOVED BY ROLLBACK
                    // (isSuperAdmin || currentUser?.role === 'admin') && null,

                    // Section Protection Anti-Abus (SUPERADMIN ONLY - vendeur SaaS uniquement)
                    isSuperAdmin && React.createElement('div', { className: 'border-t border-gray-300 pt-6 mt-6' },
                        React.createElement('div', { className: 'bg-red-50 border border-red-200 rounded-lg p-4' },
                            React.createElement('div', { className: 'flex items-start gap-3' },
                                React.createElement('i', { className: 'fas fa-shield-alt text-red-600 text-xl mt-1' }),
                                React.createElement('div', { className: 'flex-1' },
                                    React.createElement('div', { className: 'flex items-center justify-between' },
                                        React.createElement('div', {},
                                            React.createElement('h3', { className: 'font-bold text-red-900 mb-1 flex items-center gap-2' },
                                                "Protection Anti-Abus",
                                                React.createElement('span', { className: 'text-xs bg-red-600 text-white px-2 py-0.5 rounded' }, 'VENDEUR'),
                                                React.createElement('span', { className: 'text-xs px-2 py-0.5 rounded ' + (rateLimitEnabled ? 'bg-green-600 text-white' : 'bg-gray-400 text-white') }, 
                                                    rateLimitEnabled ? 'ACTIVÉ' : 'DÉSACTIVÉ'
                                                )
                                            ),
                                            React.createElement('p', { className: 'text-sm text-red-800' },
                                                rateLimitEnabled 
                                                    ? "Limite les tentatives de connexion et les appels API pour protéger contre les attaques."
                                                    : "Désactivé pour le développement. Activer pour la production."
                                            )
                                        ),
                                        React.createElement('button', {
                                            onClick: handleToggleRateLimit,
                                            disabled: savingRateLimit,
                                            className: 'ml-4 px-4 py-2 rounded-lg font-bold text-sm transition shadow-sm flex items-center gap-2 ' + 
                                                (rateLimitEnabled 
                                                    ? 'bg-gray-500 hover:bg-gray-600 text-white' 
                                                    : 'bg-green-600 hover:bg-green-700 text-white')
                                        },
                                            savingRateLimit && React.createElement('i', { className: 'fas fa-spinner fa-spin' }),
                                            rateLimitEnabled ? 'Désactiver' : 'Activer'
                                        )
                                    )
                                )
                            )
                        )
                    ),

                    // Section Personnalisation des Exemples (CLIENT ADMIN - accessible aux admins clients)
                    isClientAdmin && React.createElement('div', { className: 'border-t border-gray-300 pt-6 mt-6' },
                        React.createElement('div', { className: 'bg-teal-50 border border-teal-200 rounded-lg p-4 mb-4' },
                            React.createElement('div', { className: 'flex items-start gap-3' },
                                React.createElement('i', { className: 'fas fa-industry text-teal-600 text-xl mt-1' }),
                                React.createElement('div', { className: 'flex-1' },
                                    React.createElement('h3', { className: 'font-bold text-teal-900 mb-2 flex items-center gap-2' },
                                        "Exemples des formulaires",
                                        React.createElement('span', { className: 'text-xs bg-teal-600 text-white px-2 py-1 rounded' }, 'ADMIN')
                                    ),
                                    React.createElement('p', { className: 'text-sm text-teal-800 mb-3' },
                                        "Personnalisez les textes d'aide affichés dans les formulaires de création de machines et de tickets."
                                    ),
                                    
                                    !editingPlaceholders ? React.createElement('div', { className: 'space-y-2' },
                                        React.createElement('div', { className: 'grid grid-cols-1 md:grid-cols-3 gap-2 text-sm' },
                                            React.createElement('div', { className: 'bg-white rounded p-2 border border-teal-100' },
                                                React.createElement('span', { className: 'text-gray-500' }, 'Type: '),
                                                React.createElement('span', { className: 'font-medium' }, placeholders.placeholder_machine_type || 'Non défini')
                                            ),
                                            React.createElement('div', { className: 'bg-white rounded p-2 border border-teal-100' },
                                                React.createElement('span', { className: 'text-gray-500' }, 'Lieu: '),
                                                React.createElement('span', { className: 'font-medium' }, placeholders.placeholder_location || 'Non défini')
                                            ),
                                            React.createElement('div', { className: 'bg-white rounded p-2 border border-teal-100' },
                                                React.createElement('span', { className: 'text-gray-500' }, 'Fabricant: '),
                                                React.createElement('span', { className: 'font-medium' }, placeholders.placeholder_manufacturer || 'Non défini')
                                            )
                                        ),
                                        React.createElement('button', {
                                            onClick: handleEditPlaceholders,
                                            className: 'mt-3 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-semibold transition-all flex items-center gap-2 text-sm',
                                            type: 'button'
                                        },
                                            React.createElement('i', { className: 'fas fa-edit' }),
                                            'Personnaliser les exemples'
                                        )
                                    ) : React.createElement('div', { className: 'space-y-3 bg-white rounded-lg p-4 border border-teal-200' },
                                        React.createElement('div', {},
                                            React.createElement('label', { className: 'block text-xs font-semibold text-gray-600 mb-1' }, 'Type d\'équipement'),
                                            React.createElement('input', {
                                                type: 'text',
                                                value: tempPlaceholders.placeholder_machine_type || '',
                                                onChange: (e) => setTempPlaceholders({...tempPlaceholders, placeholder_machine_type: e.target.value}),
                                                placeholder: 'Ex: Équipement, Machine CNC, Véhicule...',
                                                className: 'w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-teal-500 text-sm',
                                                disabled: savingPlaceholders
                                            })
                                        ),
                                        React.createElement('div', {},
                                            React.createElement('label', { className: 'block text-xs font-semibold text-gray-600 mb-1' }, 'Emplacement'),
                                            React.createElement('input', {
                                                type: 'text',
                                                value: tempPlaceholders.placeholder_location || '',
                                                onChange: (e) => setTempPlaceholders({...tempPlaceholders, placeholder_location: e.target.value}),
                                                placeholder: 'Ex: Zone A, Atelier, Entrepôt...',
                                                className: 'w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-teal-500 text-sm',
                                                disabled: savingPlaceholders
                                            })
                                        ),
                                        React.createElement('div', {},
                                            React.createElement('label', { className: 'block text-xs font-semibold text-gray-600 mb-1' }, 'Fabricant / Marque'),
                                            React.createElement('input', {
                                                type: 'text',
                                                value: tempPlaceholders.placeholder_manufacturer || '',
                                                onChange: (e) => setTempPlaceholders({...tempPlaceholders, placeholder_manufacturer: e.target.value}),
                                                placeholder: 'Ex: Marque, Fabricant...',
                                                className: 'w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-teal-500 text-sm',
                                                disabled: savingPlaceholders
                                            })
                                        ),
                                        React.createElement('div', { className: 'flex justify-end gap-2 pt-2' },
                                            React.createElement('button', {
                                                onClick: handleCancelEditPlaceholders,
                                                disabled: savingPlaceholders,
                                                className: 'px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded-lg font-semibold transition-all text-sm disabled:opacity-50',
                                                type: 'button'
                                            }, 'Annuler'),
                                            React.createElement('button', {
                                                onClick: handleSavePlaceholders,
                                                disabled: savingPlaceholders,
                                                className: 'px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-all flex items-center gap-2 text-sm disabled:opacity-50',
                                                type: 'button'
                                            },
                                                savingPlaceholders && React.createElement('i', { className: 'fas fa-spinner fa-spin' }),
                                                savingPlaceholders ? 'Enregistrement...' : 'Enregistrer'
                                            )
                                        )
                                    )
                                )
                            )
                        )
                    ),

                    // Section Maintenance Base de Données (SUPERADMIN ONLY - vendeur SaaS uniquement)
                    isSuperAdmin && React.createElement('div', { className: 'border-t border-gray-300 pt-6 mt-6' },
                        React.createElement('div', { className: 'bg-orange-50 border border-orange-200 rounded-lg p-4 mb-4' },
                            React.createElement('div', { className: 'flex items-start gap-3' },
                                React.createElement('i', { className: 'fas fa-broom text-orange-600 text-xl mt-1' }),
                                React.createElement('div', {},
                                    React.createElement('h3', { className: 'font-bold text-orange-900 mb-2 flex items-center gap-2' }, 
                                        "Maintenance Base de Données",
                                        React.createElement('span', { className: 'text-xs bg-red-600 text-white px-2 py-1 rounded' }, 'VENDEUR')
                                    ),
                                    React.createElement('p', { className: 'text-sm text-orange-800 mb-2' },
                                        "Nettoyage manuel des données obsolètes (Le Concierge)."
                                    ),
                                    React.createElement('button', {
                                        onClick: handleManualCleanup,
                                        disabled: cleaning,
                                        className: 'mt-2 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-bold text-sm transition shadow-sm flex items-center gap-2 disabled:opacity-50'
                                    }, 
                                        cleaning && React.createElement('i', { className: 'fas fa-spinner fa-spin' }),
                                        cleaning ? 'Nettoyage...' : 'Lancer le nettoyage maintenant'
                                    )
                                )
                            )
                        )
                    ),

                    // Section Configuration du Domaine (SUPERADMIN ONLY - vendeur SaaS uniquement)
                    isSuperAdmin && React.createElement('div', { className: 'border-t border-gray-300 pt-6 mt-6' },
                        React.createElement('div', { className: 'bg-indigo-50 border border-indigo-200 rounded-lg p-4 mb-4' },
                            React.createElement('div', { className: 'flex items-start gap-3' },
                                React.createElement('i', { className: 'fas fa-globe text-indigo-600 text-xl mt-1' }),
                                React.createElement('div', {},
                                    React.createElement('h3', { className: 'font-bold text-indigo-900 mb-2 flex items-center gap-2' },
                                        "Domaine & URL Système",
                                        React.createElement('span', { className: 'text-xs bg-red-600 text-white px-2 py-1 rounded' }, 'VENDEUR')
                                    ),
                                    React.createElement('p', { className: 'text-sm text-indigo-800 mb-2' },
                                        "Définit l'URL de base utilisée par l'Expert et les notifications pour générer des liens."
                                    )
                                )
                            )
                        ),

                        React.createElement('div', { className: 'mb-4' },
                            React.createElement('label', { className: 'block text-sm font-semibold text-gray-700 mb-2' },
                                React.createElement('i', { className: 'fas fa-link mr-2' }),
                                'URL de base (Base URL)'
                            ),
                            !editingBaseUrl ? React.createElement('div', { className: 'flex flex-col sm:flex-row gap-3 items-start sm:items-center' },
                                React.createElement('div', { className: 'flex-1 bg-gray-100 border-2 border-gray-300 rounded-lg p-3 text-gray-800 font-mono text-sm' },
                                    baseUrl || (typeof window !== 'undefined' ? window.location.origin : '')
                                ),
                                React.createElement('button', {
                                    onClick: handleStartEditBaseUrl,
                                    className: 'px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold transition-all flex items-center gap-2 text-sm',
                                    type: 'button'
                                },
                                    React.createElement('i', { className: 'fas fa-edit' }),
                                    'Configurer'
                                )
                            ) : React.createElement('div', { className: 'space-y-3' },
                                React.createElement('div', { className: 'flex gap-2' },
                                    React.createElement('input', {
                                        type: 'text',
                                        value: tempBaseUrl,
                                        onChange: (e) => setTempBaseUrl(e.target.value),
                                        placeholder: 'https://votre-domaine.com',
                                        className: 'flex-1 px-4 py-2.5 border-2 border-indigo-300 rounded-lg focus:outline-none focus:border-indigo-500 font-mono text-sm',
                                        disabled: savingBaseUrl
                                    }),
                                    React.createElement('button', {
                                        onClick: handleAutoDetectBaseUrl,
                                        className: 'px-3 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-semibold text-sm whitespace-nowrap',
                                        title: 'Auto-détecter l\'URL actuelle',
                                        type: 'button'
                                    },
                                        React.createElement('i', { className: 'fas fa-magic' }),
                                        ' Auto'
                                    )
                                ),
                                React.createElement('div', { className: 'flex items-center justify-end gap-2' },
                                    React.createElement('button', {
                                        onClick: handleCancelEditBaseUrl,
                                        disabled: savingBaseUrl,
                                        className: 'px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded-lg font-semibold transition-all text-sm disabled:opacity-50',
                                        type: 'button'
                                    }, 'Annuler'),
                                    React.createElement('button', {
                                        onClick: handleSaveBaseUrl,
                                        disabled: !tempBaseUrl.trim() || savingBaseUrl,
                                        className: 'px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-all flex items-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed',
                                        type: 'button'
                                    },
                                        savingBaseUrl && React.createElement('i', { className: 'fas fa-spinner fa-spin' }),
                                        savingBaseUrl ? 'Enregistrement...' : 'Enregistrer'
                                    )
                                )
                            )
                        )
                    ),

                    // Section Webhook / Intégrations (SUPERADMIN ONLY - vendeur SaaS uniquement)
                    isSuperAdmin && React.createElement('div', { className: 'border-t border-gray-300 pt-6 mt-6' },
                        React.createElement('div', { className: 'bg-teal-50 border border-teal-200 rounded-lg p-4 mb-4' },
                            React.createElement('div', { className: 'flex items-start gap-3' },
                                React.createElement('i', { className: 'fas fa-plug text-teal-600 text-xl mt-1' }),
                                React.createElement('div', {},
                                    React.createElement('h3', { className: 'font-bold text-teal-900 mb-2 flex items-center gap-2' },
                                        "Intégrations & Webhooks",
                                        React.createElement('span', { className: 'text-xs bg-red-600 text-white px-2 py-1 rounded' }, 'VENDEUR')
                                    ),
                                    React.createElement('p', { className: 'text-sm text-teal-800 mb-2' },
                                        "Connectez votre application à des services externes (Pabbly, Make, Zapier, n8n...)."
                                    ),
                                    React.createElement('p', { className: 'text-xs text-teal-700' },
                                        "Les événements (ticket créé, en retard, etc.) seront envoyés à cette URL."
                                    )
                                )
                            )
                        ),

                        React.createElement('div', { className: 'mb-4' },
                            React.createElement('label', { className: 'block text-sm font-semibold text-gray-700 mb-2' },
                                React.createElement('i', { className: 'fas fa-link mr-2' }),
                                'URL du Webhook (laisser vide pour désactiver)'
                            ),
                            !editingWebhookUrl ? React.createElement('div', { className: 'flex flex-col sm:flex-row gap-3 items-start sm:items-center' },
                                React.createElement('div', { className: 'flex-1 bg-gray-100 border-2 border-gray-300 rounded-lg p-3 text-gray-800 font-mono text-sm truncate' },
                                    webhookUrl || React.createElement('span', { className: 'text-gray-500 italic' }, 'Non configuré (notifications désactivées)')
                                ),
                                React.createElement('button', {
                                    onClick: handleStartEditWebhookUrl,
                                    className: 'px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-semibold transition-all flex items-center gap-2 text-sm',
                                    type: 'button'
                                },
                                    React.createElement('i', { className: 'fas fa-edit' }),
                                    'Configurer'
                                )
                            ) : React.createElement('div', { className: 'space-y-3' },
                                React.createElement('input', {
                                    type: 'text',
                                    value: tempWebhookUrl,
                                    onChange: (e) => setTempWebhookUrl(e.target.value),
                                    placeholder: 'https://connect.pabbly.com/workflow/... ou https://hook.make.com/...',
                                    className: 'w-full px-4 py-2.5 border-2 border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 font-mono text-sm',
                                    disabled: savingWebhookUrl
                                }),
                                React.createElement('div', { className: 'flex items-center justify-end gap-2' },
                                    React.createElement('button', {
                                        onClick: handleCancelEditWebhookUrl,
                                        disabled: savingWebhookUrl,
                                        className: 'px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded-lg font-semibold transition-all text-sm disabled:opacity-50',
                                        type: 'button'
                                    }, 'Annuler'),
                                    React.createElement('button', {
                                        onClick: handleSaveWebhookUrl,
                                        disabled: savingWebhookUrl,
                                        className: 'px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-all flex items-center gap-2 text-sm disabled:opacity-50',
                                        type: 'button'
                                    },
                                        savingWebhookUrl && React.createElement('i', { className: 'fas fa-spinner fa-spin' }),
                                        savingWebhookUrl ? 'Enregistrement...' : 'Enregistrer'
                                    )
                                )
                            )
                        )
                    ),

                    // Section Logo de l'entreprise (CLIENT ADMIN - accessible aux admins clients)
                    isClientAdmin && React.createElement('div', { className: 'border-t border-gray-300 pt-6 mt-6' },
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
                                        e.target.src = '/logo.png';
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

                    // Section Application (CLIENT ADMIN)
                    isClientAdmin && React.createElement('div', { className: 'border-t border-gray-300 pt-6 mt-6' },
                        React.createElement('div', { className: 'bg-indigo-50 border border-indigo-200 rounded-lg p-4 mb-4' },
                            React.createElement('div', { className: 'flex items-start gap-3' },
                                React.createElement('i', { className: 'fas fa-desktop text-indigo-600 text-xl mt-1' }),
                                React.createElement('div', {},
                                    React.createElement('h3', { className: 'font-bold text-indigo-900 mb-2 flex items-center gap-2' },
                                        "Paramètres de l'Application",
                                        React.createElement('span', { className: 'text-xs bg-indigo-600 text-white px-2 py-1 rounded' }, 'ADMIN')
                                    ),
                                    React.createElement('p', { className: 'text-sm text-indigo-800' },
                                        "Nom et identité de l'application."
                                    )
                                )
                            )
                        ),

                        // 1. Nom de l'application
                        React.createElement('div', { className: 'mb-4' },
                            React.createElement('label', { className: 'block text-sm font-semibold text-gray-700 mb-2' },
                                React.createElement('i', { className: 'fas fa-heading mr-2' }),
                                "Nom de l'application"
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
                                    placeholder: 'Ex: Système de Gestion Interne',
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
                        )
                    ),

                    // Section Entreprise (CLIENT ADMIN)
                    isClientAdmin && React.createElement('div', { className: 'border-t border-gray-300 pt-6 mt-6' },
                        React.createElement('div', { className: 'bg-emerald-50 border border-emerald-200 rounded-lg p-4 mb-4' },
                            React.createElement('div', { className: 'flex items-start gap-3' },
                                React.createElement('i', { className: 'fas fa-building text-emerald-600 text-xl mt-1' }),
                                React.createElement('div', {},
                                    React.createElement('h3', { className: 'font-bold text-emerald-900 mb-2 flex items-center gap-2' },
                                        "Informations de l'Entreprise",
                                        React.createElement('span', { className: 'text-xs bg-emerald-600 text-white px-2 py-1 rounded' }, 'ADMIN')
                                    ),
                                    React.createElement('p', { className: 'text-sm text-emerald-800' },
                                        "Ces informations apparaissent sur les documents imprimés et les correspondances."
                                    )
                                )
                            )
                        ),

                        // 2. Nom de l'entreprise (NOUVEAU - company_name)
                        React.createElement('div', { className: 'mb-4' },
                            React.createElement('label', { className: 'block text-sm font-semibold text-gray-700 mb-2' },
                                React.createElement('i', { className: 'fas fa-building mr-2' }),
                                "Nom officiel de l'entreprise"
                            ),
                            !editingCompanyName ? React.createElement('div', { className: 'flex flex-col sm:flex-row gap-3 items-start sm:items-center' },
                                React.createElement('div', { className: 'flex-1 bg-gray-100 border-2 border-gray-300 rounded-lg p-3 text-gray-800' },
                                    companyName || React.createElement('span', { className: 'text-gray-400 italic' }, 'Non configuré')
                                ),
                                React.createElement('button', {
                                    onClick: handleStartEditCompanyName,
                                    className: 'px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-all flex items-center gap-2 text-sm',
                                    type: 'button'
                                },
                                    React.createElement('i', { className: 'fas fa-edit' }),
                                    'Modifier'
                                )
                            ) : React.createElement('div', { className: 'space-y-3' },
                                React.createElement('input', {
                                    type: 'text',
                                    value: tempCompanyName,
                                    onChange: (e) => setTempCompanyName(e.target.value),
                                    placeholder: 'Ex: Les Produits Verriers International Inc.',
                                    maxLength: 150,
                                    className: 'w-full px-4 py-2.5 border-2 border-blue-300 rounded-lg focus:outline-none focus:border-blue-500',
                                    disabled: savingCompanyName
                                }),
                                React.createElement('div', { className: 'flex items-center justify-between' },
                                    React.createElement('span', { className: 'text-xs text-gray-600' },
                                        tempCompanyName.length + '/150 caractères'
                                    ),
                                    React.createElement('div', { className: 'flex gap-2' },
                                        React.createElement('button', {
                                            onClick: handleCancelEditCompanyName,
                                            disabled: savingCompanyName,
                                            className: 'px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded-lg font-semibold transition-all text-sm disabled:opacity-50',
                                            type: 'button'
                                        }, 'Annuler'),
                                        React.createElement('button', {
                                            onClick: handleSaveCompanyName,
                                            disabled: !tempCompanyName.trim() || savingCompanyName,
                                            className: 'px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-all flex items-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed',
                                            type: 'button'
                                        },
                                            savingCompanyName && React.createElement('i', { className: 'fas fa-spinner fa-spin' }),
                                            savingCompanyName ? 'Enregistrement...' : 'Enregistrer'
                                        )
                                    )
                                )
                            )
                        ),

                        // 3. Adresse de l'entreprise
                        React.createElement('div', { className: 'mb-4' },
                            React.createElement('label', { className: 'block text-sm font-semibold text-gray-700 mb-2' },
                                React.createElement('i', { className: 'fas fa-map-marker-alt mr-2' }),
                                "Adresse de l'entreprise"
                            ),
                            !editingAddress ? React.createElement('div', { className: 'flex flex-col sm:flex-row gap-3 items-start sm:items-center' },
                                React.createElement('div', { className: 'flex-1 bg-gray-100 border-2 border-gray-300 rounded-lg p-3 text-gray-800' },
                                    companyAddress || React.createElement('span', { className: 'text-gray-400 italic' }, 'Non configurée')
                                ),
                                React.createElement('button', {
                                    onClick: handleStartEditAddress,
                                    className: 'px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-all flex items-center gap-2 text-sm',
                                    type: 'button'
                                },
                                    React.createElement('i', { className: 'fas fa-edit' }),
                                    'Modifier'
                                )
                            ) : React.createElement('div', { className: 'space-y-3' },
                                React.createElement('input', {
                                    type: 'text',
                                    value: tempAddress,
                                    onChange: (e) => setTempAddress(e.target.value),
                                    placeholder: 'Ex: 9150 Bd Maurice-Duplessis, Montréal, QC H1E 7C2',
                                    maxLength: 200,
                                    className: 'w-full px-4 py-2.5 border-2 border-blue-300 rounded-lg focus:outline-none focus:border-blue-500',
                                    disabled: savingAddress
                                }),
                                React.createElement('div', { className: 'flex items-center justify-between' },
                                    React.createElement('span', { className: 'text-xs text-gray-600' },
                                        tempAddress.length + '/200 caractères'
                                    ),
                                    React.createElement('div', { className: 'flex gap-2' },
                                        React.createElement('button', {
                                            onClick: handleCancelEditAddress,
                                            disabled: savingAddress,
                                            className: 'px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded-lg font-semibold transition-all text-sm disabled:opacity-50',
                                            type: 'button'
                                        }, 'Annuler'),
                                        React.createElement('button', {
                                            onClick: handleSaveAddress,
                                            disabled: savingAddress,
                                            className: 'px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-all flex items-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed',
                                            type: 'button'
                                        },
                                            savingAddress && React.createElement('i', { className: 'fas fa-spinner fa-spin' }),
                                            savingAddress ? 'Enregistrement...' : 'Enregistrer'
                                        )
                                    )
                                )
                            )
                        ),

                        // 4. Courriel officiel (NOUVEAU)
                        React.createElement('div', { className: 'mb-4' },
                            React.createElement('label', { className: 'block text-sm font-semibold text-gray-700 mb-2' },
                                React.createElement('i', { className: 'fas fa-envelope mr-2' }),
                                "Courriel officiel"
                            ),
                            !editingEmail ? React.createElement('div', { className: 'flex flex-col sm:flex-row gap-3 items-start sm:items-center' },
                                React.createElement('div', { className: 'flex-1 bg-gray-100 border-2 border-gray-300 rounded-lg p-3 text-gray-800' },
                                    companyEmail || React.createElement('span', { className: 'text-gray-400 italic' }, 'Non configuré')
                                ),
                                React.createElement('button', {
                                    onClick: handleStartEditEmail,
                                    className: 'px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-all flex items-center gap-2 text-sm',
                                    type: 'button'
                                },
                                    React.createElement('i', { className: 'fas fa-edit' }),
                                    'Modifier'
                                )
                            ) : React.createElement('div', { className: 'space-y-3' },
                                React.createElement('input', {
                                    type: 'email',
                                    value: tempEmail,
                                    onChange: (e) => setTempEmail(e.target.value),
                                    placeholder: 'Ex: info@entreprise.com',
                                    maxLength: 100,
                                    className: 'w-full px-4 py-2.5 border-2 border-blue-300 rounded-lg focus:outline-none focus:border-blue-500',
                                    disabled: savingEmail
                                }),
                                React.createElement('div', { className: 'flex items-center justify-between' },
                                    React.createElement('span', { className: 'text-xs text-gray-600' },
                                        tempEmail.length + '/100 caractères'
                                    ),
                                    React.createElement('div', { className: 'flex gap-2' },
                                        React.createElement('button', {
                                            onClick: handleCancelEditEmail,
                                            disabled: savingEmail,
                                            className: 'px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded-lg font-semibold transition-all text-sm disabled:opacity-50',
                                            type: 'button'
                                        }, 'Annuler'),
                                        React.createElement('button', {
                                            onClick: handleSaveEmail,
                                            disabled: savingEmail,
                                            className: 'px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-all flex items-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed',
                                            type: 'button'
                                        },
                                            savingEmail && React.createElement('i', { className: 'fas fa-spinner fa-spin' }),
                                            savingEmail ? 'Enregistrement...' : 'Enregistrer'
                                        )
                                    )
                                )
                            )
                        ),

                        // 5. Téléphone (NOUVEAU)
                        React.createElement('div', { className: 'mb-4' },
                            React.createElement('label', { className: 'block text-sm font-semibold text-gray-700 mb-2' },
                                React.createElement('i', { className: 'fas fa-phone mr-2' }),
                                "Téléphone"
                            ),
                            !editingPhone ? React.createElement('div', { className: 'flex flex-col sm:flex-row gap-3 items-start sm:items-center' },
                                React.createElement('div', { className: 'flex-1 bg-gray-100 border-2 border-gray-300 rounded-lg p-3 text-gray-800' },
                                    companyPhone || React.createElement('span', { className: 'text-gray-400 italic' }, 'Non configuré')
                                ),
                                React.createElement('button', {
                                    onClick: handleStartEditPhone,
                                    className: 'px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-all flex items-center gap-2 text-sm',
                                    type: 'button'
                                },
                                    React.createElement('i', { className: 'fas fa-edit' }),
                                    'Modifier'
                                )
                            ) : React.createElement('div', { className: 'space-y-3' },
                                React.createElement('input', {
                                    type: 'tel',
                                    value: tempPhone,
                                    onChange: (e) => setTempPhone(e.target.value),
                                    placeholder: 'Ex: 514-494-1940',
                                    maxLength: 30,
                                    className: 'w-full px-4 py-2.5 border-2 border-blue-300 rounded-lg focus:outline-none focus:border-blue-500',
                                    disabled: savingPhone
                                }),
                                React.createElement('div', { className: 'flex items-center justify-between' },
                                    React.createElement('span', { className: 'text-xs text-gray-600' },
                                        tempPhone.length + '/30 caractères'
                                    ),
                                    React.createElement('div', { className: 'flex gap-2' },
                                        React.createElement('button', {
                                            onClick: handleCancelEditPhone,
                                            disabled: savingPhone,
                                            className: 'px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded-lg font-semibold transition-all text-sm disabled:opacity-50',
                                            type: 'button'
                                        }, 'Annuler'),
                                        React.createElement('button', {
                                            onClick: handleSavePhone,
                                            disabled: savingPhone,
                                            className: 'px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-all flex items-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed',
                                            type: 'button'
                                        },
                                            savingPhone && React.createElement('i', { className: 'fas fa-spinner fa-spin' }),
                                            savingPhone ? 'Enregistrement...' : 'Enregistrer'
                                        )
                                    )
                                )
                            )
                        )
                    ),

                    // Section Messagerie (CLIENT ADMIN)
                    isClientAdmin && React.createElement('div', { className: 'border-t border-gray-300 pt-6 mt-6' },
                        React.createElement('div', { className: 'bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4' },
                            React.createElement('div', { className: 'flex items-start gap-3' },
                                React.createElement('i', { className: 'fas fa-comments text-blue-600 text-xl mt-1' }),
                                React.createElement('div', {},
                                    React.createElement('h3', { className: 'font-bold text-blue-900 mb-2 flex items-center gap-2' },
                                        "Paramètres de Messagerie",
                                        React.createElement('span', { className: 'text-xs bg-blue-600 text-white px-2 py-1 rounded' }, 'ADMIN')
                                    ),
                                    React.createElement('p', { className: 'text-sm text-blue-800' },
                                        "Configuration du module de messagerie."
                                    )
                                )
                            )
                        ),

                        // Édition du nom Messagerie
                        React.createElement('div', { className: 'mb-0' },
                            React.createElement('label', { className: 'block text-sm font-semibold text-gray-700 mb-2' },
                                React.createElement('i', { className: 'fas fa-comments mr-2' }),
                                'Nom du bouton "Connect" (Messagerie externe)'
                            ),
                            !editingMessengerName ? React.createElement('div', { className: 'flex flex-col sm:flex-row gap-3 items-start sm:items-center' },
                                React.createElement('div', { className: 'flex-1 bg-gray-100 border-2 border-gray-300 rounded-lg p-3 text-gray-800' },
                                    messengerAppName
                                ),
                                React.createElement('button', {
                                    onClick: handleStartEditMessengerName,
                                    className: 'px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-all flex items-center gap-2 text-sm',
                                    type: 'button'
                                },
                                    React.createElement('i', { className: 'fas fa-edit' }),
                                    'Modifier'
                                )
                            ) : React.createElement('div', { className: 'space-y-3' },
                                React.createElement('input', {
                                    type: 'text',
                                    value: tempMessengerName,
                                    onChange: (e) => setTempMessengerName(e.target.value),
                                    placeholder: 'Ex: Connect, Ma Messagerie...',
                                    maxLength: 50,
                                    className: 'w-full px-4 py-2.5 border-2 border-blue-300 rounded-lg focus:outline-none focus:border-blue-500',
                                    disabled: savingMessengerName
                                }),
                                React.createElement('div', { className: 'flex items-center justify-between' },
                                    React.createElement('span', { className: 'text-xs text-gray-600' },
                                        tempMessengerName.length + '/50 caractères'
                                    ),
                                    React.createElement('div', { className: 'flex gap-2' },
                                        React.createElement('button', {
                                            onClick: handleCancelEditMessengerName,
                                            disabled: savingMessengerName,
                                            className: 'px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded-lg font-semibold transition-all text-sm disabled:opacity-50',
                                            type: 'button'
                                        }, 'Annuler'),
                                        React.createElement('button', {
                                            onClick: handleSaveMessengerName,
                                            disabled: !tempMessengerName.trim() || savingMessengerName,
                                            className: 'px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-all flex items-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed',
                                            type: 'button'
                                        },
                                            savingMessengerName && React.createElement('i', { className: 'fas fa-spinner fa-spin' }),
                                            savingMessengerName ? 'Enregistrement...' : 'Enregistrer'
                                        )
                                    )
                                )
                            )
                        )
                    ),

                    // Section Contexte AI Personnalisé (CLIENT ADMIN - accessible aux admins clients)
                    isClientAdmin && React.createElement('div', { className: 'border-t border-gray-300 pt-6 mt-6' },
                        React.createElement('div', { className: 'bg-green-50 border border-green-200 rounded-lg p-4 mb-4' },
                            React.createElement('div', { className: 'flex items-start gap-3' },
                                React.createElement('i', { className: 'fas fa-user-tie text-green-600 text-xl mt-1' }),
                                React.createElement('div', {},
                                    React.createElement('h3', { className: 'font-bold text-green-900 mb-2 flex items-center gap-2' },
                                        "Configuration de l'Expert",
                                        React.createElement('span', { className: 'text-xs bg-purple-600 text-white px-2 py-1 rounded' }, 'NOUVEAU')
                                    ),
                                    React.createElement('p', { className: 'text-sm text-green-800 mb-2' },
                                        "Configurez l'identité, le caractère et les connaissances techniques de votre Expert."
                                    ),
                                    React.createElement('div', { className: 'mt-3' },
                                        React.createElement('a', {
                                            href: '/admin/ai-settings',
                                            className: 'inline-flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold text-sm transition shadow-sm gap-2',
                                            target: '_self' // Ouvrir dans la même fenêtre ou _blank
                                        },
                                            React.createElement('i', { className: 'fas fa-sliders-h' }),
                                            "Ouvrir le Configurateur Avancé"
                                        )
                                    )
                                )
                            )
                        ),

                        // Legacy AI Context (Reduced Visibility)
                        React.createElement('details', { className: 'mb-0 group' },
                            React.createElement('summary', { className: 'cursor-pointer text-sm font-semibold text-gray-500 hover:text-gray-700 mb-2 flex items-center select-none' },
                                React.createElement('i', { className: 'fas fa-chevron-right mr-2 transition-transform group-open:rotate-90' }),
                                'Voir l\'ancien éditeur de contexte (Legacy)'
                            ),
                            React.createElement('div', { className: 'pl-4 border-l-2 border-gray-200 mt-2' },
                                React.createElement('label', { className: 'block text-sm font-semibold text-gray-700 mb-2' },
                                    React.createElement('i', { className: 'fas fa-file-alt mr-2' }),
                                    'Prompt Principal & Contexte'
                                ),
                                !editingAiContext ? React.createElement('div', { className: 'flex flex-col gap-3' },
                                    React.createElement('div', { className: 'bg-gray-100 border-2 border-gray-300 rounded-lg p-3 text-gray-800 whitespace-pre-wrap min-h-[60px] text-sm font-mono' },
                                        aiCustomContext || React.createElement('div', { className: 'text-gray-500 italic' }, 
                                            React.createElement('p', { className: 'font-bold mb-1' }, 'Prompt par défaut actif :'),
                                            "RÔLE : Expert Industriel Senior...",
                                            React.createElement('br'),
                                            "(Cliquez sur Modifier pour voir ou personnaliser le prompt complet)"
                                        )
                                    ),
                                    React.createElement('button', {
                                        onClick: handleStartEditAiContext,
                                        className: 'self-start px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-semibold transition-all flex items-center gap-2 text-sm',
                                        type: 'button'
                                    },
                                        React.createElement('i', { className: 'fas fa-edit' }),
                                        'Modifier (Legacy)'
                                    )
                                ) : React.createElement('div', { className: 'space-y-3' },
                                    React.createElement('div', { className: 'flex justify-end' },
                                        React.createElement('button', {
                                            onClick: () => setTempAiContext(`RÔLE : Expert Industriel Senior

MISSION :
Assister les techniciens et administrateurs dans la maintenance, le diagnostic de pannes et l'optimisation de la production.

RÈGLES D'OR :
1. SÉCURITÉ AVANT TOUT : Rappeler systématiquement les procédures de sécurité avant toute intervention.
2. CONTEXTE INDUSTRIEL : Se concentrer uniquement sur les machines, la maintenance, la production et la sécurité.
3. TON PROFESSIONNEL : Être direct, précis et factuel.

CONTEXTE :
- Nous sommes une entreprise de production industrielle.
- Les équipements critiques doivent être maintenus en priorité.
- La production fonctionne en continu.`),
                                            className: 'text-xs text-blue-600 hover:text-blue-800 underline',
                                            type: 'button'
                                        }, 'Charger le modèle par défaut')
                                    ),
                                    React.createElement('textarea', {
                                        value: tempAiContext,
                                        onChange: (e) => setTempAiContext(e.target.value),
                                        placeholder: 'Ex: Nous sommes une usine de fabrication de verre. Les machines critiques sont les Fours et les CNC. La sécurité est la priorité absolue.',
                                        maxLength: 30000,
                                        rows: 6,
                                        className: 'w-full px-4 py-2.5 border-2 border-blue-300 rounded-lg focus:outline-none focus:border-blue-500',
                                        disabled: savingAiContext
                                    }),
                                    React.createElement('div', { className: 'flex items-center justify-between' },
                                        React.createElement('span', { className: 'text-xs text-gray-600' },
                                            tempAiContext.length + '/30000 caractères'
                                        ),
                                        React.createElement('div', { className: 'flex gap-2' },
                                            React.createElement('button', {
                                                onClick: handleCancelEditAiContext,
                                                disabled: savingAiContext,
                                                className: 'px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded-lg font-semibold transition-all text-sm disabled:opacity-50',
                                                type: 'button'
                                            }, 'Annuler'),
                                            React.createElement('button', {
                                                onClick: handleSaveAiContext,
                                                disabled: savingAiContext,
                                                className: 'px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-all flex items-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed',
                                                type: 'button'
                                            },
                                                savingAiContext && React.createElement('i', { className: 'fas fa-spinner fa-spin' }),
                                                savingAiContext ? 'Enregistrement...' : 'Enregistrer'
                                            )
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
