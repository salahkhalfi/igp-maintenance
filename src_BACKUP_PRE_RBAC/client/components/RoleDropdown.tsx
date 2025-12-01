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

    const roleGroups: RoleGroup[] = useMemo(() => {
        const baseGroups = [
            {
                label: '📊 Direction',
                roles: [
                    { value: 'director', label: 'Directeur Général' }
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
        ];

        if (currentUserRole === 'admin') {
            baseGroups[0].roles.push({ value: 'admin', label: 'Administrateur' });
        }

        return baseGroups;
    }, [currentUserRole]);

    // Trouver le label du rôle sélectionné
    const getSelectedLabel = useCallback(() => {
        for (const group of roleGroups) {
            const role = group.roles.find(r => r.value === value);
            if (role) return role.label;
        }
        return 'Sélectionner un rôle';
    }, [roleGroups, value]);

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