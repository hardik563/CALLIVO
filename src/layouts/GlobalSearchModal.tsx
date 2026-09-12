import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useUiStore } from '../stores/uiStore';
import { Meeting, Contact, Recording } from '../types';
import { Search, Video, Users, Film, ArrowRight, X } from 'lucide-react';
import { meetingsApi, contactsApi, recordingsApi } from '../lib/api';
import { Avatar } from '../components/ui/Avatar';

export const GlobalSearchModal: React.FC = () => {
  const navigate = useNavigate();
  const { isGlobalSearchOpen, setGlobalSearchOpen } = useUiStore();
  const [query, setQuery] = useState('');
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [recordings, setRecordings] = useState<Recording[]>([]);

  useEffect(() => {
    if (!isGlobalSearchOpen) return;

    meetingsApi.list().then((res) => {
      if (res.success && Array.isArray(res.meetings)) {
        setMeetings(res.meetings);
      }
    }).catch(() => {});

    contactsApi.list().then((res) => {
      if (res.success && Array.isArray(res.contacts)) {
        setContacts(res.contacts);
      }
    }).catch(() => {});

    recordingsApi.list().then((res) => {
      if (res.success && Array.isArray(res.recordings)) {
        setRecordings(res.recordings);
      }
    }).catch(() => {});
  }, [isGlobalSearchOpen]);

  if (!isGlobalSearchOpen) return null;

  const filteredMeetings: Meeting[] = meetings.filter((m: Meeting) =>
    (m.title || '').toLowerCase().includes(query.toLowerCase()) || (m.id || '').toLowerCase().includes(query.toLowerCase())
  );

  const filteredContacts: Contact[] = contacts.filter((c: Contact) =>
    (c.name || '').toLowerCase().includes(query.toLowerCase()) || (c.email || '').toLowerCase().includes(query.toLowerCase())
  );

  const filteredRecordings: Recording[] = recordings.filter((r: Recording) =>
    (r.meetingTitle || '').toLowerCase().includes(query.toLowerCase())
  );

  const hasResults = filteredMeetings.length > 0 || filteredContacts.length > 0 || filteredRecordings.length > 0;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/75 backdrop-blur-md"
          onClick={() => setGlobalSearchOpen(false)}
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: -10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -10 }}
          className="relative w-full max-w-xl bg-surface border border-slate-300 dark:border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden z-10 text-slate-900 dark:text-slate-100"
        >
          {/* Header */}
          <div className="flex items-center px-4 py-3.5 border-b border-slate-200 dark:border-slate-800">
            <Search className="w-5 h-5 text-brand-500 mr-3 shrink-0" />
            <input
              type="text"
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search meetings, contacts, recordings..."
              className="w-full bg-transparent border-none text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none"
            />
            <button
              onClick={() => setGlobalSearchOpen(false)}
              className="p-1 rounded-lg hover:bg-surface-elevated text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Results Sections */}
          <div className="max-h-96 overflow-y-auto p-4 space-y-4">
            {/* Meetings */}
            {filteredMeetings.length > 0 && (
              <div>
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2 flex items-center gap-1.5">
                  <Video className="w-3.5 h-3.5 text-brand-500" /> Meetings ({filteredMeetings.length})
                </h4>
                <div className="space-y-1">
                  {filteredMeetings.map((m: Meeting) => (
                    <button
                      key={m.id}
                      onClick={() => {
                        navigate(`/meetings/${m.id}/lobby`);
                        setGlobalSearchOpen(false);
                      }}
                      className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-surface-elevated text-left text-xs transition-colors group"
                    >
                      <div>
                        <p className="font-semibold text-slate-900 dark:text-white group-hover:text-brand-500">{m.title}</p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">{m.id} • {m.date} {m.time}</p>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Contacts */}
            {filteredContacts.length > 0 && (
              <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-indigo-500" /> Contacts ({filteredContacts.length})
                </h4>
                <div className="space-y-1">
                  {filteredContacts.map((c: Contact) => (
                    <button
                      key={c.id}
                      onClick={() => {
                        navigate('/contacts');
                        setGlobalSearchOpen(false);
                      }}
                      className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-surface-elevated text-left text-xs transition-colors group"
                    >
                      <div className="flex items-center gap-2.5">
                        <Avatar name={c.name} src={c.avatar} size="sm" />
                        <div>
                          <p className="font-semibold text-slate-900 dark:text-white group-hover:text-brand-500">{c.name}</p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400">{c.email || c.role}</p>
                        </div>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Recordings */}
            {filteredRecordings.length > 0 && (
              <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2 flex items-center gap-1.5">
                  <Film className="w-3.5 h-3.5 text-amber-500" /> Recordings ({filteredRecordings.length})
                </h4>
                <div className="space-y-1">
                  {filteredRecordings.map((r: Recording) => (
                    <button
                      key={r.id}
                      onClick={() => {
                        navigate('/recordings');
                        setGlobalSearchOpen(false);
                      }}
                      className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-surface-elevated text-left text-xs transition-colors group"
                    >
                      <div>
                        <p className="font-semibold text-slate-900 dark:text-white group-hover:text-brand-500">{r.meetingTitle}</p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">{r.date} • {r.duration}</p>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {!hasResults && query.trim() && (
              <div className="py-8 text-center text-xs text-slate-500 dark:text-slate-400">
                No matching results found for "{query}"
              </div>
            )}

            {!hasResults && !query.trim() && (
              <div className="py-8 text-center text-xs text-slate-400 dark:text-slate-500">
                Type to search across your meetings, contacts, and recordings
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
