import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { UserRole, RoleVariant } from '../types';

interface RoleDropdownProps {
    value: string;
    onChange: (e: { target: { value: string } }) => void;
    disabled?: boolean;
    currentUserRole: UserRole | string; // String autorisé pour compatibilité
    variant?: RoleVariant;
}

interface RoleGroup {
    label: string;
    roles: { value: string; label: string }[];
}

const RoleDropdown: React.FC<RoleDropdownProps> = ({ 
    value, 
    onChange, 
    disabled = false, 
    currentUserRole, 
    variant = 'blue' 
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });
    const dropdownRef = useRef<HTMLDivElement>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);
    
    // Styles selon le variant (blue pour création, green pour édition)
    const styles = useMemo(() => ({
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

    const [roleGroups, setRoleGroups] = useState<RoleGroup[]>([]);
    const [loading, setLoading] = useState(true);

    // Mapping des catégories (hardcodé pour l'instant pour matcher l'UI)
    const CATEGORY_MAPPING: Record<string, string> = {
        'director': '📊 Direction',
        'admin': '📊 Direction',
        'supervisor': '⚙️ Management Maintenance',
        'coordinator': '⚙️ Management Maintenance',
        'planner': '⚙️ Management Maintenance',
        'senior_technician': '🔧 Technique',
        'technician': '🔧 Technique',
        'team_leader': '🏭 Production',
        'furnace_operator': '🏭 Production',
        'operator': '🏭 Production',
        'safety_officer': '🛡️ Support',
        'quality_inspector': '🛡️ Support',
        'storekeeper': '🛡️ Support',
        'viewer': '👁️ Transversal'
    };

    useEffect(() => {
        const fetchRoles = async () => {
            try {
                const token = localStorage.getItem('token');
                // Fallback si pas de token (ex: dev) ou si l'API échoue
                // Mais on essaie d'abord l'API
                const response = await fetch('/api/roles', {
                    headers: token ? { 'Authorization': `Bearer ${token}` } : {}
                });

                if (!response.ok) {
                    throw new Error('Failed to fetch roles');
                }

                const data = await response.json();
                const apiRoles: any[] = data.roles || [];

                // Grouper les rôles
                const groups: Record<string, { value: string; label: string }[]> = {
                    '📊 Direction': [],
                    '⚙️ Management Maintenance': [],
                    '🔧 Technique': [],
                    '🏭 Production': [],
                    '🛡️ Support': [],
                    '👁️ Transversal': [],
                    'Autres': []
                };

                apiRoles.forEach(role => {
                    // Si le rôle est "admin" et l'utilisateur n'est pas admin, ne pas l'afficher
                    if (role.slug === 'admin' && currentUserRole !== 'admin') {
                        return;
                    }

                    const category = CATEGORY_MAPPING[role.slug] || 'Autres';
                    if (!groups[category]) groups[category] = [];
                    
                    groups[category].push({
                        value: role.slug, // Utiliser le slug comme valeur (ex: technician)
                        label: role.name || role.slug // Utiliser le nom d'affichage (ex: Électromécanicien)
                    });
                });

                // Convertir en tableau de groupes
                const formattedGroups: RoleGroup[] = Object.entries(groups)
                    .filter(([_, roles]) => roles.length > 0)
                    .map(([label, roles]) => ({ label, roles }));

                // Trier les groupes selon l'ordre défini implicitement par l'objet (ou hardcodé)
                // Pour l'instant on fait confiance à l'ordre d'insertion ou on force l'ordre
                const ORDER = [
                    '📊 Direction',
                    '⚙️ Management Maintenance',
                    '🔧 Technique',
                    '🏭 Production',
                    '🛡️ Support',
                    '👁️ Transversal',
                    'Autres'
                ];
                
                formattedGroups.sort((a, b) => {
                    const indexA = ORDER.indexOf(a.label);
                    const indexB = ORDER.indexOf(b.label);
                    return (indexA === -1 ? 999 : indexA) - (indexB === -1 ? 999 : indexB);
                });

                setRoleGroups(formattedGroups);
            } catch (error) {
                console.error('Error loading roles:', error);
                // Fallback aux rôles hardcodés si erreur (pour robustesse)
                const fallbackGroups = [
                    {
                        label: '📊 Direction',
                        roles: [
                            { value: 'director', label: 'Directeur Général' }
                        ]
                    },
                    // ... autres groupes (simplifiés pour fallback)
                    {
                        label: '🔧 Technique',
                        roles: [
                            { value: 'technician', label: 'Technicien' }
                        ]
                    }
                ];
                if (currentUserRole === 'admin') {
                    fallbackGroups[0].roles.push({ value: 'admin', label: 'Administrateur' });
                }
                setRoleGroups(fallbackGroups);
            } finally {
                setLoading(false);
            }
        };

        fetchRoles();
    }, [currentUserRole]);

    // Trouver le label du rôle sélectionné
    const getSelectedLabel = useCallback(() => {
        if (loading) return 'Chargement...';
        for (const group of roleGroups) {
            const role = group.roles.find(r => r.value === value);
            if (role) return role.label;
        }
        // Si pas trouvé dans les groupes (ex: rôle supprimé ou old data), afficher la valeur
        return value || 'Sélectionner un rôle';
    }, [roleGroups, value, loading]);

    // Calculer la position du dropdown
    const updatePosition = useCallback(() => {
        if (buttonRef.current) {
            const rect = buttonRef.current.getBoundingClientRect();
            setDropdownPosition({
                top: rect.bottom + window.scrollY + 8,
                left: rect.left + window.scrollX,
                width: rect.width
            });
        }
    }, []);

    useEffect(() => {
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

    // Fermer le dropdown si on clique à l'extérieur
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent | TouchEvent) => {
            // Ignorer si le clic est dans le dropdown ou sur le bouton
            if (
                buttonRef.current?.contains(event.target as Node) ||
                dropdownRef.current?.contains(event.target as Node) ||
                (event.target as Element).closest('.role-dropdown-portal')
            ) {
                return;
            }
            setIsOpen(false);
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside, true);
            document.addEventListener('touchstart', handleClickOutside, true);
            return () => {
                document.removeEventListener('mousedown', handleClickOutside, true);
                document.removeEventListener('touchstart', handleClickOutside, true);
            };
        }
    }, [isOpen]);

    const handleSelect = useCallback((roleValue: string) => {
        onChange({ target: { value: roleValue } });
        setIsOpen(false);
    }, [onChange]);

    const dropdownContent = isOpen ? (
        <div
            className={`role-dropdown-portal fixed z-[10000] bg-white border-2 ${currentStyle.border} rounded-xl shadow-2xl max-h-[60vh] overflow-y-auto`}
            style={{
                top: `${dropdownPosition.top}px`,
                left: `${dropdownPosition.left}px`,
                width: `${dropdownPosition.width}px`,
                pointerEvents: 'auto'
            }}
        >
            {roleGroups.map((group, groupIndex) =>
                group.roles.length > 0 && (
                    <div key={groupIndex}>
                        <div className="px-3 py-2 bg-gray-100 text-gray-700 font-bold text-xs sm:text-sm sticky top-0 z-[1]">
                            {group.label}
                        </div>
                        {group.roles.map(role => (
                            <button
                                key={role.value}
                                type="button"
                                onClick={() => handleSelect(role.value)}
                                className={`w-full px-4 py-3 text-left text-sm sm:text-base hover:bg-blue-50 transition-colors ${
                                    value === role.value ? 'bg-blue-100 font-semibold text-blue-700' : 'text-gray-800'
                                }`}
                            >
                                {role.label}
                                {value === role.value && (
                                    <i className="fas fa-check ml-2 text-blue-600"></i>
                                )}
                            </button>
                        ))}
                    </div>
                )
            )}
        </div>
    ) : null;

    return (
        <div ref={dropdownRef} className="relative w-full">
            <button
                ref={buttonRef}
                type="button"
                onClick={() => !disabled && setIsOpen(!isOpen)}
                disabled={disabled}
                className={`w-full px-2 py-2 sm:px-4 sm:py-3 text-sm sm:text-base text-left bg-gradient-to-br ${currentStyle.button} border-2 rounded-xl shadow-lg focus:outline-none focus:ring-2 transition-all hover:shadow-xl cursor-pointer font-medium sm:font-semibold ${disabled ? 'opacity-50 cursor-not-allowed' : ''} flex justify-between items-center`}
                style={{ boxShadow: currentStyle.shadow }}
            >
                <span className="truncate pr-2">{getSelectedLabel()}</span>
                <i className={`fas fa-chevron-${isOpen ? 'up' : 'down'} ${currentStyle.chevron} transition-transform text-xs sm:text-sm flex-shrink-0`}></i>
            </button>

            {isOpen && createPortal(dropdownContent, document.body)}
        </div>
    );
};

export default RoleDropdown;