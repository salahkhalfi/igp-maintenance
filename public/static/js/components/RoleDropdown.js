// Composant de sélection de rôle custom (remplace <select> natif pour mobile)
const RoleDropdown = ({ value, onChange, disabled, currentUserRole, variant = 'blue' }) => {
    const [isOpen, setIsOpen] = React.useState(false);
    const [dropdownPosition, setDropdownPosition] = React.useState({ top: 0, left: 0, width: 0 });
    const dropdownRef = React.useRef(null);
    const buttonRef = React.useRef(null);
    const portalRef = React.useRef(null);

    // Styles selon le variant (blue pour création, green pour édition) - mémorisés
    const styles = React.useMemo(() => ({
        blue: {
            button: 'from-white/90 to-blue-50/80 border-blue-300 focus:ring-blue-500 focus:border-blue-500',
            chevron: 'text-blue-500',
            shadow: '0 6px 20px rgba(59, 130, 246, 0.15), inset 0 1px 3px rgba(255, 255, 255, 0.5)',
            border: 'border-blue-300'
        },
        green: {
            button: 'from-white/90 to-green-50/80 border-green-300 focus:ring-green-500 focus:border-green-500',
            chevron: 'text-green-500',
            shadow: '0 6px 20px rgba(34, 197, 94, 0.15), inset 0 1px 3px rgba(255, 255, 255, 0.5)',
            border: 'border-green-300'
        }
    }), []);

    const currentStyle = styles[variant];

    // Définition des rôles organisés par catégorie - mémorisés
    const roleGroups = React.useMemo(() => [
        {
            label: '📊 Direction',
            roles: [
                { value: 'director', label: 'Directeur Général' },
                ...(currentUserRole === 'admin' ? [{ value: 'admin', label: 'Administrateur' }] : [])
            ]
        },
        {
            label: '⚙️ Management Maintenance',
            roles: [
                { value: 'supervisor', label: 'Superviseur' },
                { value: 'coordinator', label: 'Coordonnateur Maintenance' },
                { value: 'planner', label: 'Planificateur Maintenance' }
            ]
        },
        {
            label: '🔧 Technique',
            roles: [
                { value: 'senior_technician', label: 'Technicien Senior' },
                { value: 'technician', label: 'Technicien' }
            ]
        },
        {
            label: '🏭 Production',
            roles: [
                { value: 'team_leader', label: 'Chef Équipe Production' },
                { value: 'furnace_operator', label: 'Opérateur Four' },
                { value: 'operator', label: 'Opérateur' }
            ]
        },
        {
            label: '🛡️ Support',
            roles: [
                { value: 'safety_officer', label: 'Agent Santé & Sécurité' },
                { value: 'quality_inspector', label: 'Inspecteur Qualité' },
                { value: 'storekeeper', label: 'Magasinier' }
            ]
        },
        {
            label: '👁️ Transversal',
            roles: [
                { value: 'viewer', label: 'Lecture Seule' }
            ]
        }
    ], [currentUserRole]);

    // Trouver le label du rôle sélectionné - mémorisé
    const getSelectedLabel = React.useCallback(() => {
        for (const group of roleGroups) {
            const role = group.roles.find(r => r.value === value);
            if (role) return role.label;
        }
        return 'Sélectionner un rôle';
    }, [roleGroups, value]);

    // Calculer la position du dropdown quand il s'ouvre ou lors du resize/scroll
    const updatePosition = React.useCallback(() => {
        if (buttonRef.current) {
            const rect = buttonRef.current.getBoundingClientRect();
            setDropdownPosition({
                top: rect.bottom + window.scrollY + 8,
                left: rect.left + window.scrollX,
                width: rect.width
            });
        }
    }, []);

    React.useEffect(() => {
        if (isOpen) {
            updatePosition();
            window.addEventListener('resize', updatePosition);
            window.addEventListener('scroll', updatePosition, true);

            return () => {
                window.removeEventListener('resize', updatePosition);
                window.removeEventListener('scroll', updatePosition, true);
            };
        }
    }, [isOpen, updatePosition]);

    // Fermer le dropdown si on clique à l'extérieur - optimisé avec useCallback
    const handleClickOutside = React.useCallback((event) => {
        // Vérifier si le clic est sur le bouton, le dropdown conteneur ou le portal
        if (
            buttonRef.current && buttonRef.current.contains(event.target) ||
            dropdownRef.current && dropdownRef.current.contains(event.target) ||
            portalRef.current && portalRef.current.contains(event.target)
        ) {
            return;
        }
        setIsOpen(false);
    }, []);

    React.useEffect(() => {
        if (isOpen) {
            // Utiliser capture phase pour attraper les événements avant les autres handlers
            document.addEventListener('mousedown', handleClickOutside, true);
            document.addEventListener('touchstart', handleClickOutside, true);

            return () => {
                document.removeEventListener('mousedown', handleClickOutside, true);
                document.removeEventListener('touchstart', handleClickOutside, true);
            };
        }
    }, [isOpen, handleClickOutside]);

    // Gestion de la sélection - optimisée avec useCallback
    const handleSelect = React.useCallback((roleValue) => {
        onChange({ target: { value: roleValue } });
        setIsOpen(false);
    }, [onChange]);

    // Créer le dropdown content avec ref pour le portal
    const dropdownContent = isOpen && React.createElement('div', {
        ref: portalRef,
        className: 'fixed z-[10000] bg-white border-2 ' + currentStyle.border + ' rounded-xl shadow-2xl max-h-[60vh] overflow-y-auto',
        style: {
            top: dropdownPosition.top + 'px',
            left: dropdownPosition.left + 'px',
            width: dropdownPosition.width + 'px',
            pointerEvents: 'auto'
        }
    },
        roleGroups.map((group, groupIndex) =>
            group.roles.length > 0 && React.createElement('div', { key: groupIndex },
                // En-tête de groupe
                React.createElement('div', {
                    className: 'px-3 py-2 bg-gray-100 text-gray-700 font-bold text-xs sm:text-sm sticky top-0 z-[1]'
                }, group.label),
                // Options du groupe
                group.roles.map(role =>
                    React.createElement('button', {
                        key: role.value,
                        type: 'button',
                        onClick: () => handleSelect(role.value),
                        className: 'w-full px-4 py-3 text-left text-sm sm:text-base hover:bg-blue-50 transition-colors ' + (value === role.value ? 'bg-blue-100 font-semibold text-blue-700' : 'text-gray-800')
                    },
                        role.label,
                        value === role.value && React.createElement('i', {
                            className: 'fas fa-check ml-2 text-blue-600'
                        })
                    )
                )
            )
        )
    );

    return React.createElement('div', {
        ref: dropdownRef,
        className: 'relative w-full'
    },
        // Bouton principal
        React.createElement('button', {
            ref: buttonRef,
            type: 'button',
            onClick: () => !disabled && setIsOpen(!isOpen),
            disabled: disabled,
            className: 'w-full px-2 py-2 sm:px-4 sm:py-3 text-sm sm:text-base text-left bg-gradient-to-br ' + currentStyle.button + ' backdrop-blur-sm border-2 rounded-xl shadow-lg focus:outline-none focus:ring-2 transition-all hover:shadow-xl cursor-pointer font-medium sm:font-semibold ' + (disabled ? 'opacity-50 cursor-not-allowed' : '') + ' flex justify-between items-center',
            style: { boxShadow: currentStyle.shadow }
        },
            React.createElement('span', { className: 'truncate pr-2' }, getSelectedLabel()),
            React.createElement('i', {
                className: 'fas fa-chevron-' + (isOpen ? 'up' : 'down') + ' ' + currentStyle.chevron + ' transition-transform text-xs sm:text-sm flex-shrink-0'
            })
        ),

        // Rendre le dropdown via portal directement dans le body
        isOpen && (typeof ReactDOM !== 'undefined' && ReactDOM.createPortal)
            ? ReactDOM.createPortal(dropdownContent, document.body)
            : dropdownContent
    );
};
