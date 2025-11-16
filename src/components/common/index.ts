/**
 * 📦 Common Components - Export centralisé
 *
 * Permet d'importer tous les composants communs depuis un seul endroit:
 *
 * @example
 * import { Button, FormInput, Modal } from './components/common';
 */

// Buttons
export { Button, IconButton } from './Button';
export type { ButtonProps } from './Button';

// Form Inputs
export { FormInput, TextArea, Select } from './FormInput';
export type { FormInputProps, TextAreaProps, SelectProps } from './FormInput';

// Modals
export { Modal, ConfirmModal, SuccessModal, ErrorModal } from './Modal';
export type {
  ModalProps,
  ConfirmModalProps,
  SuccessModalProps,
  ErrorModalProps
} from './Modal';
