import { create } from 'zustand';

interface ConfirmDialogState {
    isOpen: boolean;
    title: string;
    message: string;
    confirmText: string;
    cancelText: string;
    isDangerous: boolean;
    onConfirm: (() => void) | null;
    onCancel: (() => void) | null;
}

interface ConfirmDialogStore extends ConfirmDialogState {
    openDialog: (options: {
        title: string;
        message: string;
        confirmText?: string;
        cancelText?: string;
        isDangerous?: boolean;
        onConfirm: () => void;
        onCancel?: () => void;
    }) => void;
    closeDialog: () => void;
    confirm: () => void;
    cancel: () => void;
}

const initialState: ConfirmDialogState = {
    isOpen: false,
    title: '',
    message: '',
    confirmText: 'تأكيد',
    cancelText: 'إلغاء',
    isDangerous: false,
    onConfirm: null,
    onCancel: null,
};

export const useConfirmDialog = create<ConfirmDialogStore>((set, get) => ({
    ...initialState,

    openDialog: (options) => {
        set({
            isOpen: true,
            title: options.title,
            message: options.message,
            confirmText: options.confirmText || 'تأكيد',
            cancelText: options.cancelText || 'إلغاء',
            isDangerous: options.isDangerous || false,
            onConfirm: options.onConfirm,
            onCancel: options.onCancel || null,
        });
    },

    closeDialog: () => {
        set(initialState);
    },

    confirm: () => {
        const { onConfirm } = get();
        if (onConfirm) {
            onConfirm();
        }
        get().closeDialog();
    },

    cancel: () => {
        const { onCancel } = get();
        if (onCancel) {
            onCancel();
        }
        get().closeDialog();
    },
}));
