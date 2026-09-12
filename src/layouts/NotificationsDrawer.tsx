import React from 'react';
import { Drawer } from '../components/ui/Drawer';
import { useNotificationStore } from '../stores/notificationStore';
import { AppNotification } from '../types';
import { Video, Mail, Film, MessageSquare, Bell, Check, Trash2, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';

export const NotificationsDrawer: React.FC = () => {
  const navigate = useNavigate();
  const {
    notifications,
    isDrawerOpen,
    setDrawerOpen,
    markAsRead,
    markAllAsRead,
    clearAll,
  } = useNotificationStore();

  const unreadCount = notifications.filter((n: AppNotification) => !n.isRead).length;

  const icons: Record<AppNotification['type'], React.ReactNode> = {
    meeting: <Video className="w-4 h-4 text-emerald-400" />,
    invite: <Mail className="w-4 h-4 text-indigo-400" />,
    recording: <Film className="w-4 h-4 text-amber-400" />,
    message: <MessageSquare className="w-4 h-4 text-brand-400" />,
    system: <Bell className="w-4 h-4 text-slate-400" />,
  };

  return (
    <Drawer
      isOpen={isDrawerOpen}
      onClose={() => setDrawerOpen(false)}
      title="Notification Center"
      subtitle={`${unreadCount} unread alerts`}
      className="w-full sm:w-96"
    >
      <div className="flex flex-col h-full -m-5">
        {/* Quick Actions Header */}
        <div className="flex items-center justify-between p-3.5 border-b border-slate-800 bg-surface-elevated/40">
          <Button
            variant="ghost"
            size="sm"
            onClick={markAllAsRead}
            disabled={unreadCount === 0}
            leftIcon={<Check className="w-3.5 h-3.5" />}
            className="text-xs h-7"
          >
            Mark all read
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={clearAll}
            disabled={notifications.length === 0}
            leftIcon={<Trash2 className="w-3.5 h-3.5 text-rose-400" />}
            className="text-xs h-7 text-rose-400 hover:text-rose-300"
          >
            Clear all
          </Button>
        </div>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
          {notifications.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-500">
              You're all caught up! No active notifications.
            </div>
          ) : (
            notifications.map((n: AppNotification) => (
              <div
                key={n.id}
                onClick={() => {
                  markAsRead(n.id);
                  if (n.actionUrl) {
                    navigate(n.actionUrl);
                    setDrawerOpen(false);
                  }
                }}
                className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                  !n.isRead
                    ? 'bg-surface-elevated/90 border-brand-500/40 shadow-sm'
                    : 'bg-surface/50 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-slate-800 shrink-0">
                    {icons[n.type] || <Bell className="w-4 h-4 text-slate-400" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <p className="text-xs font-semibold text-white truncate">{n.title}</p>
                      <span className="text-[10px] text-slate-500 shrink-0">{n.time}</span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                      {n.message}
                    </p>
                    {n.actionUrl && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-brand-400 mt-2 hover:underline">
                        View details <ArrowRight className="w-3 h-3" />
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </Drawer>
  );
};
