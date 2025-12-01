/**
 * 🔘 Button Component - Composant Bouton Réutilisable
 *
 * Remplace 62+ occurrences de boutons dupliqués dans index.tsx
 *
 * @example
 * <Button onClick={handleSave} icon="save">Sauvegarder</Button>
 * <Button variant="danger" onClick={handleDelete} icon="trash">Supprimer</Button>
 * <Button variant="secondary" disabled>Annuler</Button>
 */

import React from 'react';

export interface ButtonProps {
  children: React.ReactNode;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  type?: 'button' | 'submit' | 'reset';
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'warning' | 'info';
  icon?: string;
  iconPosition?: 'left' | 'right';
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function Button({
  children,
  onClick,
  type = 'button',
  variant = 'primary',
  icon,
  iconPosition = 'left',
  disabled = false,
  loading = false,
  fullWidth = false,
  size = 'md',
  className = ''
}: ButtonProps) {

  // Variants de couleur
  const variants = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/50',
    secondary: 'bg-gray-600 hover:bg-gray-700 text-white shadow-lg shadow-gray-500/50',
    danger: 'bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-500/50',
    success: 'bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-500/50',
    warning: 'bg-amber-600 hover:bg-amber-700 text-white shadow-lg shadow-amber-500/50',
    info: 'bg-cyan-600 hover:bg-cyan-700 text-white shadow-lg shadow-cyan-500/50'
  };

  // Tailles
  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg'
  };

  // Classes combinées
  const buttonClasses = [
    'rounded-lg font-semibold transition-all duration-200',
    'focus:outline-none focus:ring-2 focus:ring-offset-2',
    variants[variant],
    sizes[size],
    fullWidth ? 'w-full' : '',
    disabled || loading ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105',
    className
  ].filter(Boolean).join(' ');

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={buttonClasses}
    >
      {loading ? (
        <>
          <i className="fas fa-spinner fa-spin mr-2" />
          Chargement...
        </>
      ) : (
        <>
          {icon && iconPosition === 'left' && (
            <i className={`fas fa-${icon} mr-2`} />
          )}
          {children}
          {icon && iconPosition === 'right' && (
            <i className={`fas fa-${icon} ml-2`} />
          )}
        </>
      )}
    </button>
  );
}

/**
 * Bouton icon-only (sans texte)
 */
export function IconButton({
  icon,
  onClick,
  variant = 'primary',
  size = 'md',
  disabled = false,
  title,
  className = ''
}: {
  icon: string;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  variant?: ButtonProps['variant'];
  size?: ButtonProps['size'];
  disabled?: boolean;
  title?: string;
  className?: string;
}) {
  const variants = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white',
    secondary: 'bg-gray-600 hover:bg-gray-700 text-white',
    danger: 'bg-red-600 hover:bg-red-700 text-white',
    success: 'bg-green-600 hover:bg-green-700 text-white',
    warning: 'bg-amber-600 hover:bg-amber-700 text-white',
    info: 'bg-cyan-600 hover:bg-cyan-700 text-white'
  };

  const sizes = {
    sm: 'p-1.5 text-sm',
    md: 'p-2 text-base',
    lg: 'p-3 text-lg'
  };

  const buttonClasses = [
    'rounded-lg transition-all duration-200',
    'focus:outline-none focus:ring-2',
    variants[variant],
    sizes[size],
    disabled ? 'opacity-50 cursor-not-allowed' : 'hover:scale-110',
    className
  ].filter(Boolean).join(' ');

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={buttonClasses}
    >
      <i className={`fas fa-${icon}`} />
    </button>
  );
}
