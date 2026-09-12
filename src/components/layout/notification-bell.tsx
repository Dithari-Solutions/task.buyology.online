'use client';

import { Bell, CheckCheck } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotifications,
  useUnreadCount,
} from '@/lib/queries';
import { cn, fromNow } from '@/lib/utils';

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { data: unread = 0 } = useUnreadCount();
  const { data: notifications = [] } = useNotifications();
  const markRead = useMarkNotificationRead();
  const markAll = useMarkAllNotificationsRead();

  useEffect(() => {
    function onClick(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((value) => !value)}
        className="relative flex h-9 w-9 items-center justify-center rounded-lg text-ink-500 transition-colors hover:bg-ink-100 hover:text-ink-900"
        aria-label="Notifications"
      >
        <Bell className="h-[18px] w-[18px]" strokeWidth={1.8} />
        {unread > 0 && (
          <span className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[9px] font-bold text-white ring-2 ring-white">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-40 mt-2 w-[360px] animate-slide-up overflow-hidden rounded-xl border border-ink-200 bg-white shadow-pop">
          <div className="flex items-center justify-between border-b border-ink-100 px-4 py-3">
            <p className="text-[13px] font-semibold text-ink-900">Notifications</p>
            {unread > 0 && (
              <button
                onClick={() => markAll.mutate()}
                className="flex items-center gap-1 text-[12px] font-medium text-brand-600 hover:text-brand-700"
              >
                <CheckCheck className="h-3.5 w-3.5" />
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-[420px] overflow-y-auto">
            {notifications.length === 0 && (
              <p className="px-4 py-10 text-center text-[13px] text-ink-400">You are all caught up.</p>
            )}
            {notifications.map((notification) => {
              const content = (
                <div
                  className={cn(
                    'flex gap-3 border-b border-ink-50 px-4 py-3 transition-colors hover:bg-ink-50/70',
                    !notification.read && 'bg-brand-50/40',
                  )}
                >
                  <span
                    className={cn(
                      'mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full',
                      notification.read ? 'bg-ink-200' : 'bg-brand-500',
                    )}
                  />
                  <div className="min-w-0">
                    <p className="text-[13px] font-medium leading-snug text-ink-900">{notification.title}</p>
                    {notification.message && (
                      <p className="mt-0.5 line-clamp-2 text-[12.5px] leading-snug text-ink-500">
                        {notification.message}
                      </p>
                    )}
                    <p className="mt-1 text-[11px] text-ink-400">{fromNow(notification.createdAt)}</p>
                  </div>
                </div>
              );

              return notification.link ? (
                <Link
                  key={notification.id}
                  href={notification.link}
                  onClick={() => {
                    if (!notification.read) markRead.mutate(notification.id);
                    setOpen(false);
                  }}
                  className="block"
                >
                  {content}
                </Link>
              ) : (
                <button
                  key={notification.id}
                  onClick={() => !notification.read && markRead.mutate(notification.id)}
                  className="block w-full text-left"
                >
                  {content}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
