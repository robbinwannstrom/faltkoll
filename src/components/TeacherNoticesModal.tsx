import React, { useState, useEffect } from 'react';
import { TeacherNotification, UserAccount } from '../types';
import {
  Bell,
  X,
  Plus,
  AlertTriangle,
  Send,
  CheckCircle2,
  Calendar,
  User,
  ShieldCheck,
  Megaphone,
} from 'lucide-react';

interface TeacherNoticesModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserAccount | null;
  onUnreadCountChanged?: (count: number) => void;
}

export const TeacherNoticesModal: React.FC<TeacherNoticesModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onUnreadCountChanged,
}) => {
  const [notifications, setNotifications] = useState<TeacherNotification[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [showBroadcastForm, setShowBroadcastForm] = useState(false);

  // New notice form state
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [priority, setPriority] = useState<'NORMAL' | 'URGENT'>('NORMAL');
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  const isTeacherOrAdmin =
    currentUser?.role === 'TEACHER' || currentUser?.role === 'ADMIN';

  const fetchNotices = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/notifications');
      if (res.ok) {
        const data = await res.json();
        const list = data.notifications || [];
        setNotifications(list);

        // Calculate unread count for current user
        if (currentUser) {
          const unread = list.filter(
            (n: TeacherNotification) => !n.readBy || !n.readBy.includes(currentUser.id)
          ).length;
          if (onUnreadCountChanged) onUnreadCountChanged(unread);
        }
      }
    } catch (err) {
      console.warn('Kunde inte läsa notiser från servern:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchNotices();
      setFeedbackMsg(null);
    }
  }, [isOpen]);

  const handleSendNotice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) return;

    try {
      setIsBroadcasting(true);
      const res = await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          message: message.trim(),
          priority,
          authorName: currentUser?.displayName || 'Lärare',
          authorRole: currentUser?.role || 'TEACHER',
        }),
      });

      if (res.ok) {
        setTitle('');
        setMessage('');
        setShowBroadcastForm(false);
        setFeedbackMsg('Notisen har skickats ut till alla användare och elever!');
        await fetchNotices();
      } else {
        const err = await res.json();
        alert('Kunde inte skicka notis: ' + (err?.error || 'Serverfel'));
      }
    } catch (e: any) {
      alert('Nätverksfel vid utskick: ' + e?.message);
    } finally {
      setIsBroadcasting(false);
    }
  };

  const handleMarkAsRead = async (noticeId: string) => {
    if (!currentUser) return;
    try {
      await fetch(`/api/notifications/${noticeId}/read`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id }),
      });
      // Locally update
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === noticeId
            ? { ...n, readBy: [...(n.readBy || []), currentUser.id] }
            : n
        )
      );
    } catch {
      // Ignore
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="bg-[#10131d] border border-slate-700/90 rounded-2xl max-w-2xl w-full p-4 sm:p-6 shadow-2xl flex flex-col space-y-4 my-auto max-h-[92vh]">
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center font-bold">
              <Megaphone className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-white">
                  Lärarnotiser & Meddelanden
                </h3>
                <span className="text-xs font-mono font-bold bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full border border-slate-700">
                  {notifications.length} st
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Instruktioner och viktiga påminnelser från skola och handledare
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center cursor-pointer transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action feedback message */}
        {feedbackMsg && (
          <div className="bg-emerald-950/80 border border-emerald-600/70 rounded-xl p-3 flex items-center gap-2.5 text-xs sm:text-sm text-emerald-200">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{feedbackMsg}</span>
          </div>
        )}

        {/* Teacher Broadcast Panel Trigger */}
        {isTeacherOrAdmin && (
          <div className="bg-[#151926] border border-amber-500/30 rounded-xl p-3.5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-400">
                <ShieldCheck className="w-4 h-4" />
                <span>Lärarpanel: Skicka ut information till klassen/fältet</span>
              </div>
              <button
                type="button"
                onClick={() => setShowBroadcastForm(!showBroadcastForm)}
                className="text-xs font-bold text-sky-400 hover:underline cursor-pointer"
              >
                {showBroadcastForm ? 'Avbryt utskick' : '+ Skriv ny notis'}
              </button>
            </div>

            {showBroadcastForm && (
              <form onSubmit={handleSendNotice} className="space-y-3 pt-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Rubrik:
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="T.ex. Glöm inte kryssmått och laser vid schakt 2"
                    className="w-full min-h-[42px] px-3 bg-slate-950 border border-slate-700 focus:border-amber-400 rounded-xl text-white text-xs sm:text-sm outline-none font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Meddelande till alla elever / användare:
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Skriv instruktion, toleranskrav enligt AMA eller samlingstid..."
                    className="w-full p-3 bg-slate-950 border border-slate-700 focus:border-amber-400 rounded-xl text-white text-xs sm:text-sm outline-none resize-none"
                  />
                </div>

                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-slate-400">Prioritet:</span>
                    <button
                      type="button"
                      onClick={() => setPriority('NORMAL')}
                      className={`px-3 py-1 rounded-lg border font-bold cursor-pointer ${
                        priority === 'NORMAL'
                          ? 'bg-slate-800 text-sky-300 border-sky-500'
                          : 'bg-slate-950 text-slate-500 border-slate-800'
                      }`}
                    >
                      Normal
                    </button>
                    <button
                      type="button"
                      onClick={() => setPriority('URGENT')}
                      className={`px-3 py-1 rounded-lg border font-bold cursor-pointer ${
                        priority === 'URGENT'
                          ? 'bg-rose-950 text-rose-300 border-rose-500'
                          : 'bg-slate-950 text-slate-500 border-slate-800'
                      }`}
                    >
                      🚨 Viktigt / Akut
                    </button>
                  </div>

                  <button
                    type="submit"
                    disabled={isBroadcasting}
                    className="min-h-[42px] px-5 bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-950 font-bold text-xs sm:text-sm rounded-xl flex items-center gap-2 cursor-pointer shadow-md transition-all"
                  >
                    <Send className="w-4 h-4" />
                    <span>{isBroadcasting ? 'Skickar...' : 'Publicera utskick'}</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* Notices Feed */}
        <div className="flex-1 overflow-y-auto space-y-3 min-h-[200px] max-h-[55vh] pr-1">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-10 text-slate-400 text-xs">
              <div className="w-7 h-7 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mb-2" />
              <span>Hämtar lärarnotiser...</span>
            </div>
          ) : notifications.length === 0 ? (
            <div className="bg-slate-950/70 border border-slate-850 rounded-xl p-8 text-center space-y-2">
              <div className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-850 text-slate-500 flex items-center justify-center mx-auto text-xl">
                🔔
              </div>
              <h4 className="text-sm font-bold text-slate-300">
                Inga meddelanden just nu
              </h4>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                När din lärare eller arbetsledare skickar ut en instruktion eller påminnelse syns den direkt här i appen.
              </p>
            </div>
          ) : (
            notifications.map((notif) => {
              const isRead =
                currentUser && notif.readBy && notif.readBy.includes(currentUser.id);
              const isUrgent = notif.priority === 'URGENT';

              return (
                <div
                  key={notif.id}
                  onClick={() => handleMarkAsRead(notif.id)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer ${
                    isUrgent
                      ? 'bg-[#181113] border-rose-800/80 hover:border-rose-600'
                      : !isRead
                      ? 'bg-[#121623] border-sky-700/80 hover:border-sky-500'
                      : 'bg-slate-950/80 border-slate-850 hover:border-slate-750'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        {isUrgent ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-950 text-rose-300 border border-rose-800 flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3 text-rose-400" />
                            VIKTIGT
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-950 text-sky-300 border border-sky-800">
                            INFORMATION
                          </span>
                        )}

                        <span className="text-[11px] text-slate-400 flex items-center gap-1">
                          <User className="w-3 h-3 text-slate-500" />
                          {notif.authorName}
                        </span>

                        <span className="text-[11px] text-slate-500 font-mono">
                          • {notif.createdAt}
                        </span>
                      </div>

                      <h4 className="text-sm font-bold text-white pt-0.5 leading-snug">
                        {notif.title}
                      </h4>

                      <p className="text-xs sm:text-sm text-slate-300 whitespace-pre-line leading-relaxed pt-1">
                        {notif.message}
                      </p>
                    </div>

                    {!isRead && (
                      <span className="w-2.5 h-2.5 rounded-full bg-sky-400 shrink-0 mt-1 shadow-sm ring-2 ring-sky-400/40" />
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-slate-800 pt-3 text-xs">
          <span className="text-slate-400">
            Inloggad som:{' '}
            <strong className="text-white">
              {currentUser?.displayName || 'Gäst'} ({currentUser?.role === 'TEACHER' ? 'Lärare' : currentUser?.role === 'ADMIN' ? 'Admin' : 'Elev'})
            </strong>
          </span>

          <button
            type="button"
            onClick={onClose}
            className="min-h-[38px] px-4 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 font-bold rounded-xl cursor-pointer"
          >
            Stäng
          </button>
        </div>
      </div>
    </div>
  );
};
