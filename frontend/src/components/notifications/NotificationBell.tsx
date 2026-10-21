import React, { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, Link } from "react-router-dom";
import { useWebSocket } from "../../hooks/useWebSocket";

interface NotificationBellProps {
  token: string | null;
}

const NotificationBell: React.FC<NotificationBellProps> = ({ token }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const {
    notifications,
    connected,
    markNotificationRead,
    deleteNotification,
    clearNotifications,
  } = useWebSocket(token);
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => n.status === "UNREAD").length;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getIcon = (type?: string) => {
    switch (type) {
      case "NEW_MESSAGE":
      case "NEW_CONVERSATION":
        return "💬";
      case "PRICE_DROP":
        return "📉";
      case "VISIT_REMINDER":
      case "VISIT_SCHEDULED":
      case "VISIT_CONFIRMED":
      case "VISIT_CANCELLED":
        return "📅";
      case "SUBSCRIPTION_EXPIRING":
      case "ADVERTISEMENT_EXPIRING_SOON":
      case "ADVERTISEMENT_EXPIRED":
        return "⏰";
      case "PROPERTY_APPROVED":
      case "ADVERTISEMENT_APPROVED":
      case "REVIEW_APPROVED":
        return "✅";
      case "PROPERTY_REJECTED":
      case "ADVERTISEMENT_REJECTED":
      case "REVIEW_REJECTED":
      case "RESERVATION_REFUSED":
      case "PURCHASE_FAILED":
      case "PAYMENT_FAILED":
        return "❌";
      case "FRAUD_FLAG":
      case "SUSPICIOUS_LOGIN":
        return "🚨";
      case "AI_RECOMMENDATION":
        return "🤖";
      case "PAYMENT_CMI_SUCCESS":
      case "PAYMENT_STRIPE_SUCCESS":
      case "PURCHASE_PAID":
        return "💳";
      case "RESERVATION_CREATED":
      case "PURCHASE_CREATED":
        return "🏠";
      default:
        return "🔔";
    }
  };

  const handleItemClick = (notif: typeof notifications[0]) => {
    if (notif.status === "UNREAD") {
      markNotificationRead(notif.id);
    }
    if (notif.actionUrl) {
      if (notif.actionUrl.startsWith('/') && !notif.actionUrl.startsWith('//')) {
        navigate(notif.actionUrl);
      } else {
        window.location.href = notif.actionUrl;
      }
    }
    setOpen(false);
  };

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-full hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
        aria-label={t('notifications.title')}
      >
        <svg
          className="w-6 h-6 text-gray-700"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-white transform translate-x-1/4 -translate-y-1/4 bg-red-600 rounded-full">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
        {!connected && (
          <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-yellow-400 border-2 border-white rounded-full" title={t('notifications.disconnected')} />
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-[32rem] flex flex-col">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <h3 className="font-semibold text-gray-800">{t('notifications.title')}</h3>
            <div className="flex gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={clearNotifications}
                  className="text-xs text-blue-600 hover:underline"
                >
                  {t('notifications.markAllRead')}
                </button>
              )}
              <Link
                to="/notifications"
                onClick={() => setOpen(false)}
                className="text-xs text-gray-500 hover:text-gray-700"
              >
                {t('notifications.seeAll')}
              </Link>
            </div>
          </div>

          <div className="overflow-y-auto flex-1">
            {notifications.length === 0 ? (
              <div className="px-4 py-8 text-center text-gray-500 text-sm">
                {t('notifications.empty')}
              </div>
            ) : (
              notifications.slice(0, 20).map((notif) => (
                <div
                  key={notif.id}
                  className={`group flex items-start gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0 ${
                    notif.status === "UNREAD" ? "bg-blue-50/50" : ""
                  }`}
                >
                  <span
                    className="text-lg shrink-0"
                    onClick={() => handleItemClick(notif)}
                  >
                    {getIcon(notif.type)}
                  </span>
                  <div
                    className="flex-1 min-w-0"
                    onClick={() => handleItemClick(notif)}
                  >
                    <p className="text-sm font-medium text-gray-900 truncate">{notif.title}</p>
                    <p className="text-xs text-gray-600 line-clamp-2">{notif.message}</p>
                    <p className="text-[10px] text-gray-400 mt-1">
                      {new Date(notif.createdAt).toLocaleString("fr-FR", {
                        hour: "2-digit",
                        minute: "2-digit",
                        day: "numeric",
                        month: "short",
                      })}
                    </p>
                  </div>
                  <div className="flex flex-col items-center gap-2 shrink-0">
                    {notif.status === "UNREAD" && (
                      <span className="w-2 h-2 rounded-full bg-blue-600" />
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteNotification(notif.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 text-xs text-red-500 hover:text-red-700"
                      title={t('notifications.delete')}
                    >
                      ×
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export { NotificationBell };
