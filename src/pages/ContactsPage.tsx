import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useContactsStore } from '../stores/contactsStore';
import { useMeetingStore } from '../stores/meetingStore';
import { useToast } from '../components/ui/Toast';
import { Tabs } from '../components/ui/Tabs';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Avatar } from '../components/ui/Avatar';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { generateMeetingId } from '../lib/utils';
import {
  Search,
  Video,
  MessageSquare,
  Star,
  UserPlus,
  Mail,
  Users,
  Trash2,
} from 'lucide-react';

export const ContactsPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    contacts,
    isLoading,
    fetchContacts,
    searchQuery,
    setSearchQuery,
    activeFilter,
    setActiveFilter,
    toggleFavorite,
    addContact,
    removeContact,
  } = useContactsStore();
  const { setActiveMeeting } = useMeetingStore();
  const { success, error: toastError } = useToast();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchContacts();
  }, []);

  const filterTabs = [
    { id: 'all', label: 'All Contacts', count: contacts.length },
    { id: 'favorites', label: 'Favorites', count: contacts.filter((c) => c.isFavorite).length },
    { id: 'online', label: 'Online', count: contacts.filter((c) => c.status === 'online').length },
    { id: 'in_meeting', label: 'In Meeting', count: contacts.filter((c) => c.status === 'in_meeting').length },
    { id: 'offline', label: 'Offline', count: contacts.filter((c) => c.status === 'offline').length },
  ];

  const filteredContacts = contacts
    .filter((c) => {
      if (activeFilter === 'all') return true;
      if (activeFilter === 'favorites') return c.isFavorite;
      return c.status === activeFilter;
    })
    .filter(
      (c) =>
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

  const handleStartCall = (contactName: string) => {
    const id = generateMeetingId();
    setActiveMeeting({
      id,
      title: `Call with ${contactName}`,
      isHost: true,
    });
    navigate(`/room/${id}`);
  };

  const handleAddContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail.trim() || !newEmail.includes('@')) {
      toastError('Invalid Email', 'Please provide a valid user email.');
      return;
    }

    try {
      setIsSubmitting(true);
      await addContact(newEmail.trim());
      success('Contact Added', `${newEmail} has been added to your network.`);
      setNewEmail('');
      setIsAddModalOpen(false);
    } catch (err: any) {
      toastError('Could Not Add Contact', err.message || 'User may not exist or is already in your contacts.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Enterprise Contacts</h1>
          <p className="text-xs text-slate-400 mt-1">Directory of colleagues, teammates, and frequent collaborators</p>
        </div>

        <Button
          variant="glow"
          size="sm"
          onClick={() => setIsAddModalOpen(true)}
          leftIcon={<UserPlus className="w-4 h-4" />}
          className="shadow-glow-sm self-start sm:self-auto"
        >
          Add Contact
        </Button>
      </div>

      {/* Tabs & Search Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <Tabs
          tabs={filterTabs}
          activeTab={activeFilter}
          onChange={(id) => setActiveFilter(id as any)}
        />

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search contacts by name or email..."
            className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-[#15191F] border border-[#242A33] text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>
      </div>

      {/* Contacts Grid */}
      {isLoading ? (
        <div className="py-16 text-center text-xs text-slate-400 bg-[#101318] rounded-3xl border border-[#242A33]">
          <div className="w-6 h-6 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          Loading contacts directory...
        </div>
      ) : filteredContacts.length === 0 ? (
        <div className="py-16 text-center text-xs text-slate-400 bg-[#101318] rounded-3xl border border-dashed border-[#242A33] space-y-3">
          <Users className="w-8 h-8 text-slate-600 mx-auto" />
          <p>No contacts found in this list.</p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsAddModalOpen(true)}
            className="text-xs text-emerald-400 border-emerald-500/30 hover:bg-emerald-950/20"
          >
            Add Your First Contact
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredContacts.map((contact) => (
            <Card
              key={contact.id}
              interactive={true}
              glow={true}
              className="p-5 flex flex-col justify-between space-y-4 bg-[#101318] border-[#242A33]"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <Avatar
                    name={contact.name}
                    src={contact.avatar}
                    size="lg"
                    status={contact.status}
                  />
                  <div>
                    <h3 className="text-sm font-bold text-white leading-snug">{contact.name}</h3>
                    <p className="text-xs text-slate-400">{contact.role}</p>
                    <div className="flex items-center gap-1 text-[11px] text-slate-500 mt-0.5">
                      <Mail className="w-3 h-3 text-slate-600" />
                      <span className="truncate max-w-[150px]">{contact.email}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => toggleFavorite(contact.id)}
                    className="p-1 rounded-lg text-slate-500 hover:text-amber-400 transition-colors"
                    title={contact.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                  >
                    <Star
                      className={`w-4 h-4 ${
                        contact.isFavorite
                          ? 'fill-amber-400 text-amber-400'
                          : 'text-slate-600 hover:text-amber-400'
                      }`}
                    />
                  </button>
                  <button
                    onClick={() => removeContact(contact.id)}
                    className="p-1 rounded-lg text-slate-500 hover:text-rose-400 transition-colors"
                    title="Remove contact"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#242A33]">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => handleStartCall(contact.name)}
                  leftIcon={<Video className="w-3.5 h-3.5" />}
                  className="w-full text-xs h-8"
                >
                  Start Call
                </Button>

                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => navigate('/messages')}
                  leftIcon={<MessageSquare className="w-3.5 h-3.5" />}
                  className="w-full text-xs h-8"
                >
                  Message
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Add Contact Modal */}
      {isAddModalOpen && (
        <Modal
          isOpen={true}
          onClose={() => setIsAddModalOpen(false)}
          title="Add New Teammate to Contacts"
          maxWidth="sm"
        >
          <form onSubmit={handleAddContact} className="space-y-4">
            <p className="text-xs text-slate-400">
              Enter the email address of a registered CALLIVO user to connect directly with them.
            </p>

            <Input
              label="Teammate Email"
              type="email"
              placeholder="colleague@company.com"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              required
              autoFocus
            />

            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="ghost"
                size="sm"
                type="button"
                onClick={() => setIsAddModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                type="submit"
                isLoading={isSubmitting}
                leftIcon={<UserPlus className="w-4 h-4" />}
              >
                Add Contact
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
