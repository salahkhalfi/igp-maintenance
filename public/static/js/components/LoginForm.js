const LoginForm = ({ onLogin }) => {
    const [email, setEmail] = React.useState('');
    const [password, setPassword] = React.useState('');
    const [showPassword, setShowPassword] = React.useState(false);
    const [rememberMe, setRememberMe] = React.useState(false);
    const [loginTitle, setLoginTitle] = React.useState(DEFAULT_COMPANY_TITLE);
    const [loginSubtitle, setLoginSubtitle] = React.useState(DEFAULT_COMPANY_SUBTITLE);
    const [bannerIndex, setBannerIndex] = React.useState(0);

    const bannerMessages = [
        { text: "BONJOUR MARC", icon: "fa-hand-sparkles" },
        { text: "APPLICATION PRÊTE POUR LES TESTS", icon: "fa-check-circle" }
    ];

    React.useEffect(() => {
        const interval = setInterval(() => {
            setBannerIndex((prev) => (prev + 1) % bannerMessages.length);
        }, 3000);
        return () => clearInterval(interval);
    }, []);

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
        className: 'min-h-screen flex items-center justify-center',
        style: {
            backgroundImage: 'url(/static/login-background.jpg)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundAttachment: 'fixed'
        }
    },
        React.createElement('div', {
            className: 'p-8 rounded-2xl w-96 max-w-md mx-4',
            style: {
                background: 'rgba(255, 255, 255, 0.15)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
                border: '1px solid rgba(255, 255, 255, 0.18)'
            }
        },
            React.createElement('div', { className: 'text-center mb-8' },
                React.createElement('img', {
                    src: '/api/settings/logo?t=' + Date.now(),
                    alt: 'IGP Logo',
                    className: 'h-20 w-auto mx-auto mb-4',
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
                        textShadow: '0 2px 4px rgba(0,0,0,0.3), 0 0 8px rgba(255,255,255,0.8)'
                    }
                }, loginTitle),
                React.createElement('div', { className: 'inline-block px-3 py-1 mb-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white text-xs font-bold rounded-full shadow-md animate-pulse' },
                    React.createElement('i', { className: `fas ${bannerMessages[bannerIndex].icon} mr-2` }),
                    bannerMessages[bannerIndex].text
                ),
                React.createElement('p', {
                    className: 'text-xs sm:text-sm px-4 break-words font-semibold',
                    style: {
                        wordBreak: 'break-word',
                        overflowWrap: 'break-word',
                        color: '#1f2937',
                        textShadow: '0 1px 3px rgba(0,0,0,0.4), 0 0 8px rgba(255,255,255,0.9)'
                    }
                }, loginSubtitle)
            ),
            React.createElement('form', {
                onSubmit: handleSubmit,
                autoComplete: 'off'
            },
                React.createElement('div', { className: 'mb-4' },
                    React.createElement('label', { className: 'block text-gray-700 text-sm font-bold mb-2' },
                        React.createElement('i', { className: 'fas fa-envelope mr-2 text-igp-blue' }),
                        'Email'
                    ),
                    React.createElement('input', {
                        type: 'email',
                        name: 'email',
                        autoComplete: 'off',
                        className: 'w-full px-3 py-2 border-2 border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-igp-blue focus:border-transparent',
                        value: email,
                        onChange: handleInputEmail,
                        onInvalid: handleInvalidEmail,
                        placeholder: 'votre.email@igpglass.ca',
                        required: true
                    })
                ),
                React.createElement('div', { className: 'mb-6' },
                    React.createElement('label', { className: 'block text-gray-700 text-sm font-bold mb-2' },
                        React.createElement('i', { className: 'fas fa-lock mr-2 text-igp-blue' }),
                        'Mot de passe'
                    ),
                    React.createElement('div', { className: 'relative' },
                        React.createElement('input', {
                            type: showPassword ? 'text' : 'password',
                            name: 'password',
                            autoComplete: 'new-password',
                            className: 'w-full px-3 py-2 pr-10 border-2 border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-igp-blue focus:border-transparent',
                            value: password,
                            onChange: handleInputPassword,
                            onInvalid: handleInvalidPassword,
                            placeholder: '••••••••',
                            required: true
                        }),
                        React.createElement('button', {
                            type: 'button',
                            onClick: () => setShowPassword(!showPassword),
                            className: 'absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-igp-blue transition-colors',
                            'aria-label': showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'
                        },
                            React.createElement('i', {
                                className: showPassword ? 'fas fa-eye-slash' : 'fas fa-eye'
                            })
                        )
                    )
                ),
                React.createElement('div', { className: 'mb-6' },
                    React.createElement('label', { className: 'flex items-center cursor-pointer' },
                        React.createElement('input', {
                            type: 'checkbox',
                            checked: rememberMe,
                            onChange: (e) => setRememberMe(e.target.checked),
                            className: 'mr-2 h-4 w-4 text-igp-blue border-gray-300 rounded focus:ring-2 focus:ring-igp-blue'
                        }),
                        React.createElement('span', { className: 'text-sm text-white font-semibold drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]' },
                            React.createElement('i', { className: 'fas fa-clock mr-1 text-blue-300' }),
                            'Se souvenir de moi (30 jours)'
                        )
                    )
                ),
                React.createElement('button', {
                    type: 'submit',
                    className: 'w-full bg-igp-blue text-white font-bold py-3 px-4 rounded-md hover:bg-igp-blue-dark transition duration-200 shadow-lg'
                },
                    React.createElement('i', { className: 'fas fa-sign-in-alt mr-2' }),
                    'Se connecter'
                )
            ),
            React.createElement('div', { className: 'mt-8 pt-6 border-t border-gray-200 text-center' },
                React.createElement('p', { className: 'text-xs text-gray-500' },
                    React.createElement('i', { className: 'fas fa-code mr-1' }),
                    'Conçue par ',
                    React.createElement('span', { className: 'font-bold text-igp-blue' }, "Le département des Technologies de l'Information des Produits Verriers International (IGP) Inc.")
                )
            )
        )
    );
};
