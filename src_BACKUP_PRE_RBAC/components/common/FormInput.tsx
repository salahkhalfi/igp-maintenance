/**
 * 📝 FormInput Component - Champ de Formulaire Réutilisable
 *
 * Remplace 16+ occurrences de champs input dupliqués dans index.tsx
 *
 * @example
 * <FormInput
 *   label="Email"
 *   type="email"
 *   value={email}
 *   onChange={(e) => setEmail(e.target.value)}
 *   required
 * />
 */

import React from 'react';

export interface FormInputProps {
  label: string;
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url' | 'date' | 'datetime-local' | 'time';
  value: string | number;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onInvalid?: (e: React.InvalidEvent<HTMLInputElement>) => void;
  onInput?: (e: React.FormEvent<HTMLInputElement>) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  error?: string;
  helper?: string;
  icon?: string;
  min?: number | string;
  max?: number | string;
  step?: number | string;
  pattern?: string;
  autoComplete?: string;
  className?: string;
}

export function FormInput({
  label,
  type = 'text',
  value,
  onChange,
  onInvalid,
  onInput,
  placeholder = '',
  required = false,
  disabled = false,
  error,
  helper,
  icon,
  min,
  max,
  step,
  pattern,
  autoComplete,
  className = ''
}: FormInputProps) {

  const inputClasses = [
    'w-full px-3 py-2',
    'bg-white/80 backdrop-blur-sm',
    'border-2 rounded-lg',
    'shadow-sm transition-all',
    'focus:outline-none focus:ring-2',
    error
      ? 'border-red-500 focus:border-red-500 focus:ring-red-200'
      : 'border-gray-300 focus:border-blue-500 focus:ring-blue-200',
    disabled ? 'opacity-50 cursor-not-allowed bg-gray-100' : '',
    icon ? 'pl-10' : '',
    className
  ].filter(Boolean).join(' ');

  return (
    <div className="mb-4">
      {/* Label */}
      <label className="block text-gray-700 text-sm font-bold mb-2">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>

      {/* Input Container */}
      <div className="relative">
        {/* Icon */}
        {icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <i className={`fas fa-${icon} text-gray-400`} />
          </div>
        )}

        {/* Input Field */}
        <input
          type={type}
          value={value}
          onChange={onChange}
          onInvalid={onInvalid}
          onInput={onInput}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          min={min}
          max={max}
          step={step}
          pattern={pattern}
          autoComplete={autoComplete}
          className={inputClasses}
        />
      </div>

      {/* Error Message */}
      {error && (
        <p className="mt-1 text-sm text-red-600 flex items-center">
          <i className="fas fa-exclamation-circle mr-1" />
          {error}
        </p>
      )}

      {/* Helper Text */}
      {helper && !error && (
        <p className="mt-1 text-sm text-gray-500">
          {helper}
        </p>
      )}
    </div>
  );
}

/**
 * TextArea Component
 */
export interface TextAreaProps {
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onInvalid?: (e: React.InvalidEvent<HTMLTextAreaElement>) => void;
  onInput?: (e: React.FormEvent<HTMLTextAreaElement>) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  error?: string;
  helper?: string;
  rows?: number;
  maxLength?: number;
  className?: string;
}

export function TextArea({
  label,
  value,
  onChange,
  onInvalid,
  onInput,
  placeholder = '',
  required = false,
  disabled = false,
  error,
  helper,
  rows = 4,
  maxLength,
  className = ''
}: TextAreaProps) {

  const textareaClasses = [
    'w-full px-3 py-2',
    'bg-white/80 backdrop-blur-sm',
    'border-2 rounded-lg',
    'shadow-sm transition-all resize-y',
    'focus:outline-none focus:ring-2',
    error
      ? 'border-red-500 focus:border-red-500 focus:ring-red-200'
      : 'border-gray-300 focus:border-blue-500 focus:ring-blue-200',
    disabled ? 'opacity-50 cursor-not-allowed bg-gray-100' : '',
    className
  ].filter(Boolean).join(' ');

  return (
    <div className="mb-4">
      {/* Label */}
      <label className="block text-gray-700 text-sm font-bold mb-2">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
        {maxLength && (
          <span className="text-gray-500 font-normal text-xs ml-2">
            ({value.length}/{maxLength})
          </span>
        )}
      </label>

      {/* TextArea Field */}
      <textarea
        value={value}
        onChange={onChange}
        onInvalid={onInvalid}
        onInput={onInput}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        rows={rows}
        maxLength={maxLength}
        className={textareaClasses}
      />

      {/* Error Message */}
      {error && (
        <p className="mt-1 text-sm text-red-600 flex items-center">
          <i className="fas fa-exclamation-circle mr-1" />
          {error}
        </p>
      )}

      {/* Helper Text */}
      {helper && !error && (
        <p className="mt-1 text-sm text-gray-500">
          {helper}
        </p>
      )}
    </div>
  );
}

/**
 * Select Component
 */
export interface SelectProps {
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  options: Array<{ value: string; label: string }>;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  error?: string;
  helper?: string;
  icon?: string;
  className?: string;
}

export function Select({
  label,
  value,
  onChange,
  options,
  placeholder = 'Sélectionner...',
  required = false,
  disabled = false,
  error,
  helper,
  icon,
  className = ''
}: SelectProps) {

  const selectClasses = [
    'w-full px-3 py-2',
    'bg-white/80 backdrop-blur-sm',
    'border-2 rounded-lg',
    'shadow-sm transition-all',
    'focus:outline-none focus:ring-2',
    error
      ? 'border-red-500 focus:border-red-500 focus:ring-red-200'
      : 'border-gray-300 focus:border-blue-500 focus:ring-blue-200',
    disabled ? 'opacity-50 cursor-not-allowed bg-gray-100' : '',
    icon ? 'pl-10' : '',
    className
  ].filter(Boolean).join(' ');

  return (
    <div className="mb-4">
      {/* Label */}
      <label className="block text-gray-700 text-sm font-bold mb-2">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>

      {/* Select Container */}
      <div className="relative">
        {/* Icon */}
        {icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <i className={`fas fa-${icon} text-gray-400`} />
          </div>
        )}

        {/* Select Field */}
        <select
          value={value}
          onChange={onChange}
          required={required}
          disabled={disabled}
          className={selectClasses}
        >
          <option value="">{placeholder}</option>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {/* Error Message */}
      {error && (
        <p className="mt-1 text-sm text-red-600 flex items-center">
          <i className="fas fa-exclamation-circle mr-1" />
          {error}
        </p>
      )}

      {/* Helper Text */}
      {helper && !error && (
        <p className="mt-1 text-sm text-gray-500">
          {helper}
        </p>
      )}
    </div>
  );
}
