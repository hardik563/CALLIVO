import React, { useState } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { useUiStore } from '../stores/uiStore';
import { useAuthStore } from '../stores/authStore';
import { useToast } from '../components/ui/Toast';
import { helpdeskApi } from '../lib/api';
import {
  Keyboard,
  Shield,
  Sparkles,
  Phone,
  Mail,
  Send,
  CheckCircle2,
  Search,
  Clock,
  HelpCircle,
  Headphones,
} from 'lucide-react';

export const HelpPage: React.FC = () => {
  const { setKeyboardShortcutsOpen } = useUiStore();
  const { user } = useAuthStore();
  const { success, error: toastError } = useToast();

  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [category, setCategory] = useState('Technical Support');
  const [priority, setPriority] = useState('medium');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedTicket, setSubmittedTicket] = useState<any | null>(null);

  // Ticket Lookup state
  const [searchRef, setSearchRef] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchedTicket, setSearchedTicket] = useState<any | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);

  const handleTicketSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !email.trim() || !subject.trim() || !message.trim()) {
      toastError('Missing Fields', 'Please provide name, email, subject, and message.');
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await helpdeskApi.submitTicket({
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim() || undefined,
        category,
        priority,
        subject: subject.trim(),
        message: message.trim(),
      });

      if (res.success && res.ticket) {
        setSubmittedTicket(res.ticket);
        success('Ticket Dispatched', `Reference #${res.ticket.referenceCode} logged and sent to Support.`);
        setSubject('');
        setMessage('');
      }
    } catch (err: any) {
      toastError('Submission Failed', err.message || 'Could not send ticket. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSearchTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchRef.trim()) return;

    try {
      setIsSearching(true);
      setSearchError(null);
      const res = await helpdeskApi.getTicketByRef(searchRef.trim());
      if (res.success && res.ticket) {
        setSearchedTicket(res.ticket);
      }
    } catch (err: any) {
      setSearchedTicket(null);
      setSearchError(err.message || 'Ticket not found.');
    } finally {
      setIsSearching(false);
    }
  };

  const faqs = [
    {
      q: 'Do meeting guests need to download any software?',
      a: 'No. CALLIVO runs natively in modern web browsers (Chrome, Edge, Safari, Firefox). Guests can simply click a meeting link and join with their browser camera and microphone.',
    },
    {
      q: 'How does CALLIVO Spatial 3D Mode work?',
      a: 'Spatial 3D mode uses WebGL and Three.js to position participant video panels inside an interactive 3D conference room with directional audio and realistic spatial geometry.',
    },
    {
      q: 'Is my audio and video stream encrypted?',
      a: 'Yes. Every CALLIVO conference uses WebRTC with DTLS-SRTP and AES-256 peer encryption. Media streams travel encrypted directly between browsers.',
    },
    {
      q: 'How do I test my camera and microphone before joining?',
      a: 'Every meeting opens in the Pre-Meeting Lobby, which gives you a full preview of your camera, background effects, and a live microphone frequency meter.',
    },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Help Center & Support Desk</h1>
        <p className="text-xs text-slate-400 mt-1">Get immediate technical assistance, file tickets, or view platform documentation</p>
      </div>

      {/* Direct Contact Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-5 bg-[#101318] border-[#242A33] flex flex-col justify-between space-y-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400">
              <Phone className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">Direct Phone Support</h3>
              <p className="text-xs text-slate-400">Immediate telephone hotline</p>
            </div>
          </div>
          <div>
            <a
              href="tel:+917395007338"
              className="text-sm font-mono font-bold text-emerald-400 hover:text-emerald-300 transition-colors"
            >
              +91 7395007338
            </a>
            <p className="text-[11px] text-slate-400 mt-0.5">Contact: Hardik Dhamija (Lead Engineer)</p>
          </div>
        </Card>

        <Card className="p-5 bg-[#101318] border-[#242A33] flex flex-col justify-between space-y-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">Email Support</h3>
              <p className="text-xs text-slate-400">Direct response inbox</p>
            </div>
          </div>
          <div>
            <a
              href="mailto:hardikdhamija676@gmail.com"
              className="text-xs font-mono font-bold text-indigo-300 hover:text-indigo-200 transition-colors break-all"
            >
              hardikdhamija676@gmail.com
            </a>
            <p className="text-[11px] text-slate-400 mt-0.5">Average response: &lt; 2 hours</p>
          </div>
        </Card>

        <Card className="p-5 bg-[#101318] border-[#242A33] flex flex-col justify-between space-y-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400">
              <Headphones className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">Priority SLA</h3>
              <p className="text-xs text-slate-400">Enterprise meeting assistance</p>
            </div>
          </div>
          <div>
            <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> 24/7 Operations
            </span>
            <p className="text-[11px] text-slate-400 mt-0.5">Live monitoring for mission-critical meetings</p>
          </div>
        </Card>
      </div>

      {/* Main Grid: Ticket Submission Form & Track Ticket */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Support Ticket Submission Form */}
        <div className="lg:col-span-2">
          <Card className="p-6 sm:p-7 bg-[#101318] border-[#242A33] space-y-5">
            <div className="border-b border-[#242A33] pb-4">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Send className="w-4 h-4 text-emerald-400" />
                Submit a Support Ticket
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Your ticket will be saved to our system and dispatched directly to Hardik Dhamija via Resend.
              </p>
            </div>

            {submittedTicket && (
              <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-500/40 text-xs space-y-2">
                <div className="flex items-center gap-2 text-emerald-400 font-bold">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Ticket Logged Successfully!</span>
                </div>
                <p className="text-slate-300">
                  Ticket Reference Code:{' '}
                  <strong className="font-mono text-white bg-black/40 px-2 py-0.5 rounded border border-emerald-500/30">
                    {submittedTicket.referenceCode}
                  </strong>
                </p>
                <p className="text-slate-400 text-[11px]">
                  An email notification has been dispatched to <strong>hardikdhamija676@gmail.com</strong>. Our team will review your inquiry shortly.
                </p>
              </div>
            )}

            <form onSubmit={handleTicketSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Your Name"
                  placeholder="Full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
                <Input
                  label="Email Address"
                  type="email"
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Input
                  label="Phone Number (Optional)"
                  placeholder="+91..."
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Issue Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl bg-[#15191F] border border-[#242A33] text-xs text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="Technical Support">Technical Support</option>
                    <option value="Audio/Video Issues">Audio/Video Issues</option>
                    <option value="Account & Security">Account & Security</option>
                    <option value="Enterprise Sales">Enterprise Sales</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Priority</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl bg-[#15191F] border border-[#242A33] text-xs text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>

              <Input
                label="Subject"
                placeholder="Brief summary of the issue"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                required
              />

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Message Description</label>
                <textarea
                  rows={4}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Please describe what happened, steps to reproduce, or details about your conference issue..."
                  required
                  className="w-full p-3 rounded-xl bg-[#15191F] border border-[#242A33] text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <Button
                type="submit"
                variant="primary"
                isLoading={isSubmitting}
                leftIcon={<Send className="w-4 h-4" />}
                className="w-full sm:w-auto"
              >
                Submit Support Ticket
              </Button>
            </form>
          </Card>
        </div>

        {/* Track Ticket / Quick Tools Column */}
        <div className="space-y-6">
          {/* Ticket Reference Lookup */}
          <Card className="p-5 bg-[#101318] border-[#242A33] space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Search className="w-4 h-4 text-indigo-400" />
              Check Ticket Status
            </h3>
            <p className="text-xs text-slate-400">
              Enter your reference code (e.g. <code>HD-123456</code>) to view ticket progress.
            </p>

            <form onSubmit={handleSearchTicket} className="flex gap-2">
              <input
                type="text"
                placeholder="HD-XXXXXX"
                value={searchRef}
                onChange={(e) => setSearchRef(e.target.value)}
                className="flex-1 h-9 px-3 rounded-lg bg-[#15191F] border border-[#242A33] text-xs text-white font-mono placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
              <Button type="submit" variant="secondary" size="sm" isLoading={isSearching}>
                Lookup
              </Button>
            </form>

            {searchedTicket && (
              <div className="p-3 rounded-lg bg-[#15191F] border border-[#242A33] text-xs space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-emerald-400 font-bold">{searchedTicket.referenceCode}</span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold uppercase">
                    {searchedTicket.status}
                  </span>
                </div>
                <p className="font-medium text-white">{searchedTicket.subject}</p>
                <p className="text-[11px] text-slate-400">Category: {searchedTicket.category}</p>
                <p className="text-[11px] text-slate-500">Submitted: {new Date(searchedTicket.createdAt).toLocaleDateString()}</p>
              </div>
            )}

            {searchError && (
              <div className="p-2.5 rounded-lg bg-rose-950/30 border border-rose-500/30 text-rose-300 text-xs">
                {searchError}
              </div>
            )}
          </Card>

          {/* Quick Action Tiles */}
          <div className="space-y-3">
            <Card
              interactive={true}
              onClick={() => setKeyboardShortcutsOpen(true)}
              className="p-4 bg-[#101318] border-[#242A33] flex items-center justify-between cursor-pointer hover:border-slate-600 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-brand-500/10 text-brand-400">
                  <Keyboard className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-white">Keyboard Hotkeys</h4>
                  <p className="text-[11px] text-slate-400">Mute, video, chat shortcuts</p>
                </div>
              </div>
              <span className="text-xs text-brand-400">View →</span>
            </Card>

            <Card className="p-4 bg-[#101318] border-[#242A33] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
                  <Shield className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-white">Security & Encryption</h4>
                  <p className="text-[11px] text-slate-400">WebRTC DTLS-SRTP 256-bit</p>
                </div>
              </div>
              <span className="text-xs text-emerald-400">Audited</span>
            </Card>
          </div>
        </div>
      </div>

      {/* Frequently Asked Questions */}
      <Card className="p-6 sm:p-8 bg-[#101318] border-[#242A33] space-y-6">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <HelpCircle className="w-4 h-4 text-emerald-400" />
          Frequently Asked Questions
        </h3>
        <div className="space-y-4 divide-y divide-[#242A33]">
          {faqs.map((faq, i) => (
            <div key={i} className={i > 0 ? 'pt-4 space-y-1.5' : 'space-y-1.5'}>
              <h4 className="text-sm font-semibold text-slate-200">{faq.q}</h4>
              <p className="text-xs text-slate-400 leading-relaxed">{faq.a}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};
