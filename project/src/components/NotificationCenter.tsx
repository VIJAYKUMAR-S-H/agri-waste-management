import React, { useState } from 'react';
import { Bell, X, Check, CheckCheck, AlertTriangle, DollarSign, Info, Gift } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNotifications } from '../hooks/useNotifications';
import { formatDistanceToNow } from 'date-fns';

const NotificationCenter: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { notifications, unreadCount, loading, markAsRead, markAllAsRead } = useNotifications();

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'expiry_warning':
        return <AlertTriangle className="h-5 w-5 text-orange-600" />;
      case 'price_alert':
        return <DollarSign className="h-5 w-5 text-green-600" />;
      case 'promotion':
        return <Gift className="h-5 w-5 text-purple-600" />;
      default:
        return <Info className="h-5 w-5 text-blue-600" />;
    }
  };

  const getNotificationBgColor = (type: string, isRead: boolean) => {
    const opacity = isRead ? 'bg-opacity-30' : 'bg-opacity-50';
    switch (type) {
      case 'expiry_warning':
        return `bg-orange-50 border-orange-200 ${opacity}`;
      case 'price_alert':
        return `bg-green-50 border-green-200 ${opacity}`;
      case 'promotion':
        return `bg-purple-50 border-purple-200 ${opacity}`;
      default:
        return `bg-blue-50 border-blue-200 ${opacity}`;
    }
  };

  return (
    <div className="relative">
      {/* Notification Bell */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-slate-600 hover:text-sage-600 hover:bg-sage-50 rounded-lg transition-colors duration-200"
      >
        <Bell className="h-6 w-6" />
        {unreadCount > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium"
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </motion.span>
        )}
      </button>

      {/* Notification Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />
            
            {/* Dropdown Panel */}
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="absolute right-0 mt-2 w-96 bg-cream-white rounded-2xl shadow-2xl border border-cream-200 z-50 max-h-96 overflow-hidden"
            >
              {/* Header */}
              <div className="p-4 border-b border-cream-200 bg-gradient-to-r from-sage-50 to-cream-50">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-slate-800">
                    Notifications
                  </h3>
                  <div className="flex items-center space-x-2">
                    {unreadCount > 0 && (
                      <button
                        onClick={markAllAsRead}
                        className="text-xs text-sage-600 hover:text-sage-700 font-medium flex items-center space-x-1"
                      >
                        <CheckCheck className="h-3 w-3" />
                        <span>Mark all read</span>
                      </button>
                    )}
                    <button
                      onClick={() => setIsOpen(false)}
                      className="text-slate-400 hover:text-slate-600 p-1"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                {unreadCount > 0 && (
                  <p className="text-sm text-slate-600 mt-1">
                    {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
                  </p>
                )}
              </div>

              {/* Notifications List */}
              <div className="max-h-80 overflow-y-auto">
                {loading ? (
                  <div className="p-8 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sage-600 mx-auto mb-4"></div>
                    <p className="text-slate-600">Loading notifications...</p>
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="p-8 text-center">
                    <Bell className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-600 font-medium">No notifications yet</p>
                    <p className="text-slate-500 text-sm mt-1">
                      You'll receive alerts about expiring items and price updates here
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-cream-100">
                    {notifications.map((notification, index) => (
                      <motion.div
                        key={notification.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                        className={`p-4 hover:bg-cream-50 transition-colors cursor-pointer ${
                          !notification.is_read ? 'bg-cream-25' : ''
                        }`}
                        onClick={() => !notification.is_read && markAsRead(notification.id)}
                      >
                        <div className="flex items-start space-x-3">
                          <div className={`p-2 rounded-lg ${getNotificationBgColor(notification.type, notification.is_read)}`}>
                            {getNotificationIcon(notification.type)}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between">
                              <h4 className={`text-sm font-medium ${
                                notification.is_read ? 'text-slate-600' : 'text-slate-800'
                              }`}>
                                {notification.title}
                              </h4>
                              {!notification.is_read && (
                                <div className="w-2 h-2 bg-sage-500 rounded-full flex-shrink-0 mt-2"></div>
                              )}
                            </div>
                            
                            <p className={`text-sm mt-1 ${
                              notification.is_read ? 'text-slate-500' : 'text-slate-600'
                            }`}>
                              {notification.message}
                            </p>
                            
                            <div className="flex items-center justify-between mt-2">
                              <p className="text-xs text-slate-400">
                                {formatDistanceToNow(new Date(notification.sent_at), { addSuffix: true })}
                              </p>
                              
                              {!notification.is_read && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    markAsRead(notification.id);
                                  }}
                                  className="text-xs text-sage-600 hover:text-sage-700 font-medium flex items-center space-x-1"
                                >
                                  <Check className="h-3 w-3" />
                                  <span>Mark read</span>
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>

              {/* Footer */}
              {notifications.length > 0 && (
                <div className="p-3 border-t border-cream-200 bg-cream-25">
                  <button
                    onClick={() => {
                      setIsOpen(false);
                      // Navigate to full notifications page
                    }}
                    className="w-full text-center text-sm text-sage-600 hover:text-sage-700 font-medium"
                  >
                    View all notifications
                  </button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotificationCenter;