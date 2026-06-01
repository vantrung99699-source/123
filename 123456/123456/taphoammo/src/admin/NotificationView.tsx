/**
 * NotificationView - Thông báo admin
 */
import React from 'react';

import { useState } from 'react';
import { motion } from 'motion/react';
import {
  Bell,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Info,
  Check,
  X,
  Trash2,
} from 'lucide-react';
import { ADMIN_NOTIFICATIONS } from './data';
import type { AdminNotification } from './types';

const typeConfig: Record<AdminNotification['type'], {
  icon: React.ElementType;
  bg: string;
  border: string;
  iconColor: string;
  label: string;
}> = {
  info: { icon: Info, bg: 'bg-blue-50', border: 'border-blue-100', iconColor: 'text-blue-600', label: 'Thông tin' },
  warning: { icon: AlertTriangle, bg: 'bg-amber-50', border: 'border-amber-100', iconColor: 'text-amber-600', label: 'Cảnh báo' },
  success: { icon: CheckCircle2, bg: 'bg-emerald-50', border: 'border-emerald-100', iconColor: 'text-emerald-600', label: 'Thành công' },
  error: { icon: XCircle, bg: 'bg-red-50', border: 'border-red-100', iconColor: 'text-red-600', label: 'Lỗi' },
};

export function NotificationView() {
  const [notifications, setNotifications] = useState(ADMIN_NOTIFICATIONS);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const unreadCount = notifications.filter((n) => !n.read).length;

  const filtered = notifications.filter((n) => {
    if (filter === 'unread') return !n.read;
    return true;
  });

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const markRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n));
  };

  const deleteNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="p-8 w-full h-full overflow-y-auto"
    >
      <header className="mb-8 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 mb-1">Thông báo</h2>
          <p className="text-slate-500 text-sm">
            {unreadCount > 0 ? `${unreadCount} thông báo chưa đọc` : 'Tất cả đã đọc'}
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllRead}
            className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 flex items-center gap-2"
          >
            <Check size={16} />
            Đánh dấu tất cả đã đọc
          </button>
        )}
      </header>

      <div className="mb-6 flex gap-2">
        {[
          { key: 'all', label: `Tất cả (${notifications.length})` },
          { key: 'unread', label: `Chưa đọc (${unreadCount})` },
        ].map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key as 'all' | 'unread')}
            className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${
              filter === f.key ? 'bg-blue-600 text-white shadow-sm' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {filtered.length > 0 ? (
          filtered.map((notification, idx) => {
            const config = typeConfig[notification.type];
            const Icon = config.icon;
            return (
              <motion.div
                key={notification.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className={`bg-white rounded-2xl border shadow-sm p-5 transition-all hover:shadow-md ${
                  notification.read ? 'border-slate-100 opacity-75' : `border ${config.border}`
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className={`w-10 h-10 rounded-xl ${config.bg} flex items-center justify-center shrink-0`}>
                    <Icon size={20} className={config.iconColor} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-slate-900">{notification.title}</h3>
                        {!notification.read && (
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${config.bg} ${config.iconColor}`}>
                            Mới
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400 shrink-0">{notification.time}</span>
                    </div>
                    <p className="text-xs text-slate-600">{notification.content}</p>
                    {!notification.read && (
                      <div className="flex items-center gap-2 mt-3">
                        <button
                          onClick={() => markRead(notification.id)}
                          className="px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-[11px] font-bold hover:bg-blue-100 transition-all flex items-center gap-1"
                        >
                          <Check size={12} /> Đánh dấu đã đọc
                        </button>
                        <button
                          onClick={() => deleteNotification(notification.id)}
                          className="px-3 py-1.5 bg-slate-50 text-slate-400 rounded-lg text-[11px] font-bold hover:bg-red-50 hover:text-red-500 transition-all flex items-center gap-1"
                        >
                          <Trash2 size={12} /> Xóa
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })
        ) : (
          <div className="text-center py-16 text-slate-400">
            <Bell size={48} className="mx-auto mb-3 opacity-30" />
            <p className="font-bold text-lg">Không có thông báo nào</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}
