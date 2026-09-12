import { create } from 'zustand';
import { Contact } from '../types';
import { contactsApi } from '../lib/api';

interface ContactsState {
  contacts: Contact[];
  isLoading: boolean;
  searchQuery: string;
  activeFilter: 'all' | 'favorites' | 'online' | 'in_meeting' | 'offline';

  fetchContacts: () => Promise<void>;
  setSearchQuery: (query: string) => void;
  setActiveFilter: (filter: 'all' | 'favorites' | 'online' | 'in_meeting' | 'offline') => void;
  toggleFavorite: (id: string) => Promise<void>;
  addContact: (email: string) => Promise<any>;
  removeContact: (id: string) => Promise<void>;
}

export const useContactsStore = create<ContactsState>((set, get) => ({
  contacts: [],
  isLoading: false,
  searchQuery: '',
  activeFilter: 'all',

  fetchContacts: async () => {
    try {
      set({ isLoading: true });
      const res = await contactsApi.list();
      if (res.success && Array.isArray(res.contacts)) {
        const mapped: Contact[] = res.contacts.map((c: any) => ({
          id: c.contactId || c.id,
          name: c.name,
          email: c.email,
          role: c.role || 'Member',
          status: c.status || 'offline',
          avatar: c.avatar || '',
          phone: c.phone || '',
          isFavorite: c.isFavorite || false,
        }));
        set({ contacts: mapped, isLoading: false });
        return;
      }
    } catch (err: any) {
      console.warn('Failed to fetch contacts from API:', err.message);
    }
    set({ isLoading: false });
  },

  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setActiveFilter: (activeFilter) => set({ activeFilter }),

  toggleFavorite: async (id) => {
    set((state) => ({
      contacts: state.contacts.map((c) =>
        c.id === id ? { ...c, isFavorite: !c.isFavorite } : c
      ),
    }));

    try {
      await contactsApi.toggleFavorite(id);
    } catch (err) {
      console.warn('Could not sync favorite state to backend:', err);
    }
  },

  addContact: async (email) => {
    const res = await contactsApi.add(email);
    if (res.success && res.contact) {
      const c = res.contact;
      const newC: Contact = {
        id: c.contactId || c.id,
        name: c.contactUser?.name || c.name || email.split('@')[0],
        email: c.contactUser?.email || email,
        role: c.contactUser?.role || 'Member',
        status: (c.contactUser?.status as any) || 'offline',
        avatar: c.contactUser?.avatar || '',
        phone: '',
        isFavorite: false,
      };
      set((state) => ({ contacts: [newC, ...state.contacts] }));
      return newC;
    }
  },

  removeContact: async (id) => {
    set((state) => ({
      contacts: state.contacts.filter((c) => c.id !== id),
    }));

    try {
      await contactsApi.remove(id);
    } catch (err) {
      console.warn('Could not remove contact from backend:', err);
    }
  },
}));
