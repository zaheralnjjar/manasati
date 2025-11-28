import { create } from 'zustand';
import { dbOperations, DB_KEYS } from '../utils/db';

export interface WhatsAppContact {
    id: string;
    name: string;
    phoneNumber: string; // Format: country code + number (e.g., "966501234567")
    addedAt: number;
}

interface WhatsAppState {
    favoriteContacts: WhatsAppContact[];
    addContact: (contact: Omit<WhatsAppContact, 'id' | 'addedAt'>) => Promise<void>;
    updateContact: (id: string, updates: Partial<Omit<WhatsAppContact, 'id' | 'addedAt'>>) => Promise<void>;
    removeContact: (id: string) => Promise<void>;
    getFavorites: () => WhatsAppContact[];
    initialize: () => Promise<void>;
}

export const useWhatsAppStore = create<WhatsAppState>((set, get) => ({
    favoriteContacts: [],

    addContact: async (contactData) => {
        const newContact: WhatsAppContact = {
            ...contactData,
            id: crypto.randomUUID(),
            addedAt: Date.now()
        };

        const updated = [...get().favoriteContacts, newContact];
        set({ favoriteContacts: updated });
        await dbOperations.saveData(DB_KEYS.WHATSAPP_CONTACTS, updated);
    },

    updateContact: async (id, updates) => {
        const updated = get().favoriteContacts.map(contact =>
            contact.id === id ? { ...contact, ...updates } : contact
        );
        set({ favoriteContacts: updated });
        await dbOperations.saveData(DB_KEYS.WHATSAPP_CONTACTS, updated);
    },

    removeContact: async (id) => {
        const updated = get().favoriteContacts.filter(contact => contact.id !== id);
        set({ favoriteContacts: updated });
        await dbOperations.saveData(DB_KEYS.WHATSAPP_CONTACTS, updated);
    },

    getFavorites: () => {
        return get().favoriteContacts;
    },

    initialize: async () => {
        try {
            const contacts = await dbOperations.getData<WhatsAppContact[]>(DB_KEYS.WHATSAPP_CONTACTS, []);
            set({ favoriteContacts: contacts || [] });
        } catch (error) {
            console.error('Failed to load WhatsApp contacts:', error);
            set({ favoriteContacts: [] });
        }
    }
}));
