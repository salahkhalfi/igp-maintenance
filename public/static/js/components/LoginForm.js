const LoginForm = ({ onLogin }) => {
    const [email, setEmail] = React.useState('');
    const [password, setPassword] = React.useState('');
    const [showPassword, setShowPassword] = React.useState(false);
    const [rememberMe, setRememberMe] = React.useState(false);
    const [loginTitle, setLoginTitle] = React.useState(DEFAULT_COMPANY_TITLE);
    const [loginSubtitle, setLoginSubtitle] = React.useState(DEFAULT_COMPANY_SUBTITLE);
    const [bannerIndex, setBannerIndex] = React.useState(0);
    const [isAnimating, setIsAnimating] = React.useState(true);

    const bannerMessages = [
        { text: "BIENVENUE MARC", icon: "👋", color: "from-blue-500 to-indigo-600" },
        { text: "VERSION STABILISÉE", icon: "💎", color: "from-emerald-500 to-teal-600" },
        { text: "PRÊTE POUR VALIDATION", icon: "🚀", color: "from-violet-500 to-purple-600" }
    ];

    React.useEffect(() => {
        const interval = setInterval(() => {
            setIsAnimating(false);
            setTimeout(() => {
                setBannerIndex((prev) => (prev + 1) % bannerMessages.length);
                setIsAnimating(true);
            }, 500); // Temps de la sortie
        }, 4000); // Temps d'affichage
        return () => clearInterval(interval);
    }, []);

    const currentBanner = bannerMessages[bannerIndex];

    // Charger dynamiquement le titre et sous-titre à chaque affichage du login
    React.useEffect(() => {
        const loadLoginSettings = async () => {
            try {
                const titleRes = await axios.get(API_URL + '/settings/company_title');
                if (titleRes.data.setting_value) {
                    setLoginTitle(titleRes.data.setting_value);
                }
            } catch (error) {
                // Titre par défaut utilisé
            }

            try {
                const subtitleRes = await axios.get(API_URL + '/settings/company_subtitle');
                if (subtitleRes.data.setting_value) {
                    setLoginSubtitle(subtitleRes.data.setting_value);
                }
            } catch (error) {
                // Sous-titre par défaut utilisé
            }
        };

        loadLoginSettings();
    }, []); // Exécuter une fois au montage du composant

    const handleSubmit = (e) => {
        e.preventDefault();
        onLogin(email, password, rememberMe);
    };

    const handleInvalidEmail = (e) => {
        e.target.setCustomValidity("Veuillez remplir ce champ.");
    };

    const handleInvalidPassword = (e) => {
        e.target.setCustomValidity("Veuillez remplir ce champ.");
    };

    const handleInputEmail = (e) => {
        e.target.setCustomValidity("");
        setEmail(e.target.value);
    };

    const handleInputPassword = (e) => {
        e.target.setCustomValidity("");
        setPassword(e.target.value);
    };

    return React.createElement('div', {
        className: 'min-h-screen flex items-center justify-center relative',
        style: {
            // Image de fond (fixe)
            backgroundImage: 'url(/static/maintenance-bg-premium.jpg)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundAttachment: 'fixed'
        }
    },
        // Overlay sombre pour améliorer le contraste et faire ressortir la carte
        React.createElement('div', {
            className: 'absolute inset-0 bg-black/20 backdrop-blur-[3px]',
            style: { zIndex: 0 }
        }),

        React.createElement('div', {
            className: 'p-6 sm:p-8 rounded-2xl w-full max-w-md mx-4 relative', // Compact padding on mobile
            style: {
                zIndex: 1, // Au-dessus de l'overlay
                background: 'rgba(255, 255, 255, 0.25)', // Plus opaque pour lisibilité
                backdropFilter: 'blur(25px) saturate(180%)', // Flou plus intense type iOS
                WebkitBackdropFilter: 'blur(25px) saturate(180%)',
                boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.3) inset', // Ombre portée + bordure interne subtile
                border: '1px solid rgba(255, 255, 255, 0.2)'
            }
        },
            React.createElement('div', { className: 'text-center mb-4 sm:mb-8' }, // Reduced margin on mobile
                React.createElement('img', {
                    src: '/api/settings/logo?t=' + Date.now(),
                    alt: 'IGP Logo',
                    className: 'h-14 sm:h-20 w-auto mx-auto mb-2 sm:mb-4 drop-shadow-md', // Smaller logo and margin on mobile
                    onError: (e) => {
                        e.target.src = '/static/logo-igp.png';
                    }
                }),
                React.createElement('h1', {
                    className: 'text-lg sm:text-xl md:text-2xl font-bold mb-2 px-2 break-words',
                    style: {
                        wordBreak: 'break-word',
                        overflowWrap: 'break-word',
                        color: '#003B73',
                        textShadow: '0 2px 4px rgba(255,255,255,0.5)' // Ombre blanche pour détacher le texte bleu
                    }
                }, loginTitle),
                
                // BANNIÈRE PREMIUM ANIMÉE
                React.createElement('div', { 
                    className: 'relative overflow-hidden inline-flex items-center justify-center px-4 sm:px-6 py-1.5 sm:py-2 mb-3 sm:mb-4 rounded-full shadow-lg border border-white/40 backdrop-blur-md', // Compact banner
                    style: {
                        background: 'linear-gradient(135deg, rgba(255,255,255,0.4), rgba(255,255,255,0.2))',
                        boxShadow: '0 8px 20px rgba(0, 0, 0, 0.15)',
                        minWidth: '260px',
                        transition: 'all 0.5s ease'
                    }
                },
                    // Fond coloré subtil qui change
                    React.createElement('div', {
                        className: `absolute inset-0 opacity-20 bg-gradient-to-r ${currentBanner.color} transition-all duration-1000`
                    }),
                    
                    // Texte animé
                    React.createElement('div', {
                        className: `flex items-center font-bold text-xs sm:text-sm tracking-wide text-gray-800 transition-all duration-500 transform ${
                            isAnimating 
                                ? 'opacity-100 translate-y-0 scale-100 blur-none' 
                                : 'opacity-0 translate-y-4 scale-95 blur-sm'
                        }`,
                        style: { textShadow: '0 1px 2px rgba(255,255,255,0.8)' }
                    },
                        React.createElement('span', { className: 'mr-3 text-base' }, currentBanner.icon),
                        React.createElement('span', {}, currentBanner.text)
                    )
                ),

                React.createElement('p', {
                    className: 'text-xs sm:text-sm px-4 break-words font-semibold',
                    style: {
                        wordBreak: 'break-word',
                        overflowWrap: 'break-word',
                        color: '#374151', // Gris plus foncé pour contraste
                        textShadow: '0 1px 2px rgba(255,255,255,0.8)'
                    }
                }, loginSubtitle)
            ),
            React.createElement('form', {
                onSubmit: handleSubmit,
                autoComplete: 'off'
            },
                React.createElement('div', { className: 'mb-3 sm:mb-4' }, // Reduced margin
                    React.createElement('label', { className: 'block text-gray-800 text-sm font-bold mb-1 sm:mb-2 shadow-black/5 drop-shadow-sm' },
                        React.createElement('i', { className: 'fas fa-envelope mr-2 text-blue-700' }),
                        'Email'
                    ),
                    React.createElement('input', {
                        type: 'email',
                        name: 'email',
                        autoComplete: 'off',
                        'data-lpignore': 'true',
                        'data-form-type': 'other',
                        className: 'w-full px-3 py-2.5 border border-white/50 bg-white/70 backdrop-blur-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all shadow-inner',
                        value: email,
                        onChange: handleInputEmail,
                        onInvalid: handleInvalidEmail,
                        placeholder: 'votre.email@igpglass.ca',
                        required: true
                    })
                ),
                React.createElement('div', { className: 'mb-4 sm:mb-6' }, // Reduced margin
                    React.createElement('label', { className: 'block text-gray-800 text-sm font-bold mb-1 sm:mb-2 shadow-black/5 drop-shadow-sm' },
                        React.createElement('i', { className: 'fas fa-lock mr-2 text-blue-700' }),
                        'Mot de passe'
                    ),
                    React.createElement('div', { className: 'relative' },
                        React.createElement('input', {
                            type: showPassword ? 'text' : 'password',
                            name: 'password',
                            autoComplete: 'new-password',
                            'data-lpignore': 'true',
                            'data-form-type': 'other',
                            className: 'w-full px-3 py-2.5 pr-10 border border-white/50 bg-white/70 backdrop-blur-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all shadow-inner',
                            value: password,
                            onChange: handleInputPassword,
                            onInvalid: handleInvalidPassword,
                            placeholder: '••••••••',
                            required: true
                        }),
                        React.createElement('button', {
                            type: 'button',
                            onClick: () => setShowPassword(!showPassword),
                            className: 'absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-blue-700 transition-colors',
                            'aria-label': showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'
                        },
                            React.createElement('i', {
                                className: showPassword ? 'fas fa-eye-slash' : 'fas fa-eye'
                            })
                        )
                    )
                ),
                React.createElement('div', { className: 'mb-4 sm:mb-6' }, // Reduced margin
                    React.createElement('label', { className: 'flex items-center cursor-pointer group' },
                        React.createElement('input', {
                            type: 'checkbox',
                            checked: rememberMe,
                            onChange: (e) => setRememberMe(e.target.checked),
                            className: 'mr-2 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500 cursor-pointer'
                        }),
                        React.createElement('span', { className: 'text-sm text-gray-800 font-bold drop-shadow-sm group-hover:text-blue-800 transition-colors' },
                            React.createElement('i', { className: 'fas fa-clock mr-1.5 text-blue-600' }),
                            'Se souvenir de moi (30 jours)'
                        )
                    )
                ),
                React.createElement('button', {
                    type: 'submit',
                    className: 'w-full bg-gradient-to-r from-blue-700 to-blue-900 text-white font-bold py-3 px-4 rounded-xl hover:from-blue-800 hover:to-blue-950 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 shadow-lg hover:shadow-xl border border-blue-500/30'
                },
                    React.createElement('i', { className: 'fas fa-sign-in-alt mr-2' }),
                    'Se connecter'
                )
            ),
            React.createElement('div', { className: 'mt-4 sm:mt-8 pt-4 sm:pt-6 border-t border-gray-200/30 text-center' }, // Compact footer
                React.createElement('p', { className: 'text-[10px] sm:text-xs text-gray-700 font-medium drop-shadow-sm' }, // Smaller text on mobile
                    React.createElement('i', { className: 'fas fa-code mr-1 opacity-70' }),
                    'Conçue par ',
                    React.createElement('span', { className: 'font-bold text-blue-900' }, "Le département des Technologies de l'Information des Produits Verriers International (IGP) Inc.")
                )
            )
        )
    );
};
