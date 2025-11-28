import { useConfirmDialog } from '../hooks/useConfirmDialog';
import ConfirmDialog from './ConfirmDialog';

export default function ConfirmDialogProvider() {
    const { isOpen, title, message, confirmText, cancelText, isDangerous, confirm, cancel } = useConfirmDialog();

    if (!isOpen) return null;

    return (
        <ConfirmDialog
            title={title}
            message={message}
            confirmText={confirmText}
            cancelText={cancelText}
            isDangerous={isDangerous}
            onConfirm={confirm}
            onCancel={cancel}
        />
    );
}
