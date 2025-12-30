/**
 * OnboardingTour - Tour de bienvenue interactif
 * Solution custom légère (~5KB) - Zéro dépendance externe
 * 
 * Affiche un guide pas-à-pas pour les nouveaux utilisateurs
 * Adapté selon le rôle (admin/supervisor vs operator/technician)
 */

const OnboardingTour = ({ currentUser, onComplete, isVisible }) => {
    const [currentStep, setCurrentStep] = React.useState(0);
    const [tooltipPosition, setTooltipPosition] = React.useState({ top: 0, left: 0 });
    const [highlightRect, setHighlightRect] = React.useState(null);
    const [isAnimating, setIsAnimating] = React.useState(false);

    // Définir les étapes selon le rôle
    const getSteps = () => {
        const isDirecteur = currentUser?.role === 'admin' || currentUser?.role === 'supervisor';
        
        const baseSteps = [
            {
                target: '[data-tour="kanban"]',
                title: 'Votre tableau de bord',
                content: 'Bienvenue ! Vos tickets de maintenance sont organisés par statut. Glissez-déposez pour changer leur état.',
                position: 'center'
            },
            {
                target: '[data-tour="new-ticket"]',
                title: 'Signaler un problème',
                content: 'Cliquez ici pour créer un nouveau ticket de maintenance. Vous pouvez même ajouter des photos !',
                position: 'bottom-left'
            },
            {
                target: '[data-tour="search"]',
                title: 'Recherche rapide',
                content: 'Trouvez un ticket par machine, mot-clé ou numéro. Tapez au moins 2 caractères pour lancer la recherche.',
                position: 'bottom'
            },
            {
                target: '[data-tour="menu"]',
                title: 'Menu principal',
                content: 'Accédez à toutes les fonctionnalités depuis ce menu : statistiques, paramètres, gestion des utilisateurs...',
                position: 'bottom-left'
            }
        ];

        // Étapes supplémentaires pour admin/supervisor (dans le menu hamburger)
        // NOTE: Ces éléments sont dans le menu, donc on les retire pour l'instant
        // L'utilisateur les découvrira naturellement via le menu

        // Étape finale
        baseSteps.push({
            target: null,
            title: 'Vous êtes prêt !',
            content: isDirecteur 
                ? 'Vous pouvez maintenant gérer votre équipe efficacement. Besoin d\'aide ? Cliquez sur le menu pour accéder au support.'
                : 'Vous pouvez maintenant signaler des problèmes et suivre vos tickets. Bonne utilisation !',
            position: 'center',
            isFinal: true
        });

        return baseSteps;
    };

    const steps = React.useMemo(() => getSteps(), [currentUser?.role]);

    // Calculer la position du tooltip
    const calculatePosition = React.useCallback((targetElement, position) => {
        const tooltipWidth = 320;
        const tooltipHeight = 200;
        const padding = 12;

        if (!targetElement) {
            // Position centrée pour les étapes sans cible
            return {
                top: window.innerHeight / 2 - tooltipHeight / 2,
                left: window.innerWidth / 2 - tooltipWidth / 2,
                highlightRect: null
            };
        }

        const rect = targetElement.getBoundingClientRect();
        let top, left;

        switch (position) {
            case 'bottom':
                top = rect.bottom + padding;
                left = rect.left + (rect.width / 2) - (tooltipWidth / 2);
                break;
            case 'bottom-left':
                top = rect.bottom + padding;
                left = rect.left;
                // Si trop à droite, ajuster
                if (left + tooltipWidth > window.innerWidth - 20) {
                    left = window.innerWidth - tooltipWidth - 20;
                }
                break;
            case 'bottom-right':
                top = rect.bottom + padding;
                left = rect.right - tooltipWidth;
                break;
            case 'top':
                top = rect.top - tooltipHeight - padding;
                left = rect.left + (rect.width / 2) - (tooltipWidth / 2);
                break;
            case 'left':
                top = rect.top + (rect.height / 2) - (tooltipHeight / 2);
                left = rect.left - tooltipWidth - padding;
                break;
            case 'right':
                top = rect.top + (rect.height / 2) - (tooltipHeight / 2);
                left = rect.right + padding;
                break;
            default: // center
                top = window.innerHeight / 2 - (tooltipHeight / 2);
                left = window.innerWidth / 2 - (tooltipWidth / 2);
        }

        // Assurer que le tooltip reste dans la fenêtre
        left = Math.max(10, Math.min(left, window.innerWidth - tooltipWidth - 10));
        top = Math.max(10, Math.min(top, window.innerHeight - tooltipHeight - 10));

        return {
            top,
            left,
            highlightRect: {
                top: rect.top - 5,
                left: rect.left - 5,
                width: rect.width + 10,
                height: rect.height + 10
            }
        };
    }, []);

    // Trouver l'élément cible
    const findTargetElement = React.useCallback((step) => {
        if (!step.target) return null;

        // Essayer le sélecteur principal
        let element = document.querySelector(step.target);
        
        // Debug: log si élément non trouvé
        if (!element) {
            console.warn('[Onboarding] Element not found:', step.target);
        } else {
            console.log('[Onboarding] Found element:', step.target, element);
        }

        return element;
    }, []);

    // Mettre à jour la position quand l'étape change
    React.useEffect(() => {
        if (!isVisible) return;

        const step = steps[currentStep];
        const targetElement = findTargetElement(step);
        const { top, left, highlightRect: rect } = calculatePosition(targetElement, step.position);

        setIsAnimating(true);
        setTooltipPosition({ top, left });
        setHighlightRect(rect);

        // Scroll l'élément en vue si nécessaire
        if (targetElement) {
            targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }

        const timer = setTimeout(() => setIsAnimating(false), 300);
        return () => clearTimeout(timer);
    }, [currentStep, isVisible, steps, findTargetElement, calculatePosition]);

    // Gestion des touches clavier
    React.useEffect(() => {
        if (!isVisible) return;

        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                handleSkip();
            } else if (e.key === 'ArrowRight' || e.key === 'Enter') {
                handleNext();
            } else if (e.key === 'ArrowLeft' && currentStep > 0) {
                setCurrentStep(prev => prev - 1);
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isVisible, currentStep]);

    const handleNext = () => {
        if (currentStep < steps.length - 1) {
            setCurrentStep(prev => prev + 1);
        } else {
            handleComplete();
        }
    };

    const handleSkip = () => {
        handleComplete();
    };

    const handleComplete = async () => {
        try {
            // Sauvegarder dans les préférences utilisateur
            const token = localStorage.getItem('authToken') || authToken;
            if (token) {
                await axios.put('/api/preferences/onboarding_completed', { value: true }, {
                    headers: { Authorization: `Bearer ${token}` }
                });
            }
            // Aussi stocker en local pour éviter les appels répétés
            localStorage.setItem('onboarding_completed', 'true');
        } catch (error) {
            console.warn('Erreur sauvegarde onboarding:', error);
            // Même en cas d'erreur, marquer comme complété localement
            localStorage.setItem('onboarding_completed', 'true');
        }
        
        if (onComplete) onComplete();
    };

    if (!isVisible) return null;

    const step = steps[currentStep];

    return React.createElement('div', {
        className: 'fixed inset-0 z-[9999]',
        style: { pointerEvents: 'auto' }
    },
        // Overlay sombre avec découpe pour l'élément ciblé
        React.createElement('div', {
            className: 'absolute inset-0 bg-black/60 transition-opacity duration-300',
            onClick: handleSkip
        }),

        // Zone de surbrillance autour de l'élément ciblé
        highlightRect && React.createElement('div', {
            className: 'absolute border-2 border-blue-400 rounded-lg shadow-lg transition-all duration-300',
            style: {
                top: highlightRect.top,
                left: highlightRect.left,
                width: highlightRect.width,
                height: highlightRect.height,
                boxShadow: '0 0 0 9999px rgba(0,0,0,0.6), 0 0 20px rgba(59, 130, 246, 0.5)',
                pointerEvents: 'none'
            }
        }),

        // Tooltip
        React.createElement('div', {
            className: `absolute bg-white rounded-xl shadow-2xl p-4 transition-all duration-300 ${isAnimating ? 'opacity-90 scale-95' : 'opacity-100 scale-100'}`,
            style: {
                top: tooltipPosition.top,
                left: tooltipPosition.left,
                width: '320px',
                maxWidth: 'calc(100vw - 40px)',
                pointerEvents: 'auto',
                zIndex: 10000
            }
        },
            // Indicateur d'étape
            React.createElement('div', { className: 'flex items-center justify-between mb-3' },
                React.createElement('div', { className: 'flex gap-1.5' },
                    steps.map((_, idx) => React.createElement('div', {
                        key: idx,
                        className: `w-2 h-2 rounded-full transition-all ${idx === currentStep ? 'bg-blue-500 w-4' : idx < currentStep ? 'bg-blue-300' : 'bg-gray-200'}`
                    }))
                ),
                React.createElement('span', { className: 'text-xs text-gray-400' },
                    `${currentStep + 1}/${steps.length}`
                )
            ),

            // Titre
            React.createElement('h3', { className: 'text-lg font-bold text-gray-800 mb-2' },
                step.title
            ),

            // Contenu
            React.createElement('p', { className: 'text-sm text-gray-600 mb-4 leading-relaxed' },
                step.content
            ),

            // Boutons
            React.createElement('div', { className: 'flex items-center justify-between' },
                React.createElement('button', {
                    onClick: handleSkip,
                    className: 'text-sm text-gray-400 hover:text-gray-600 transition-colors'
                }, 'Passer'),

                React.createElement('div', { className: 'flex gap-2' },
                    currentStep > 0 && React.createElement('button', {
                        onClick: () => setCurrentStep(prev => prev - 1),
                        className: 'px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors'
                    }, '← Précédent'),

                    React.createElement('button', {
                        onClick: handleNext,
                        className: 'px-4 py-1.5 text-sm font-medium text-white bg-blue-500 hover:bg-blue-600 rounded-lg transition-colors shadow-sm'
                    }, step.isFinal ? 'Terminer ✓' : 'Suivant →')
                )
            ),

            // Raccourcis clavier
            React.createElement('div', { className: 'mt-3 pt-3 border-t border-gray-100 text-center' },
                React.createElement('span', { className: 'text-xs text-gray-400' },
                    '↑↓ pour naviguer • Échap pour fermer'
                )
            )
        )
    );
};

// Exposer globalement pour utilisation dans MainApp
window.OnboardingTour = OnboardingTour;
