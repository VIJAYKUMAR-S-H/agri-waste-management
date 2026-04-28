import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

export interface NotificationData {
  user_id: string;
  type: 'expiry_warning' | 'price_alert' | 'system' | 'promotion';
  title: string;
  message: string;
  expires_at?: string;
}

export interface PushNotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  data?: any;
}

class NotificationService {
  private static instance: NotificationService;
  private pushSubscription: PushSubscription | null = null;

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  /**
   * Initialize push notifications
   */
  async initializePushNotifications(): Promise<boolean> {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      console.warn('Push notifications not supported');
      return false;
    }

    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(
          process.env.REACT_APP_VAPID_PUBLIC_KEY || ''
        )
      });

      this.pushSubscription = subscription;
      await this.savePushSubscription(subscription);
      return true;
    } catch (error) {
      console.error('Failed to initialize push notifications:', error);
      return false;
    }
  }

  /**
   * Send notification to user
   */
  async sendNotification(notification: NotificationData): Promise<void> {
    try {
      // Store in database
      const { error } = await supabase
        .from('notifications')
        .insert({
          ...notification,
          is_read: false,
          sent_at: new Date().toISOString(),
          created_at: new Date().toISOString()
        });

      if (error) throw error;

      // Show toast notification if user is online
      this.showToastNotification(notification);

      // Send push notification if available
      if (this.pushSubscription) {
        await this.sendPushNotification({
          title: notification.title,
          body: notification.message,
          icon: '/icon-192x192.png',
          data: { type: notification.type }
        });
      }
    } catch (error) {
      console.error('Failed to send notification:', error);
    }
  }

  /**
   * Send bulk notifications
   */
  async sendBulkNotifications(notifications: NotificationData[]): Promise<void> {
    try {
      const { error } = await supabase
        .from('notifications')
        .insert(
          notifications.map(notification => ({
            ...notification,
            is_read: false,
            sent_at: new Date().toISOString(),
            created_at: new Date().toISOString()
          }))
        );

      if (error) throw error;

      // Show summary toast
      toast.success(`${notifications.length} notifications sent successfully`);
    } catch (error) {
      console.error('Failed to send bulk notifications:', error);
      toast.error('Failed to send notifications');
    }
  }

  /**
   * Get user notifications
   */
  async getUserNotifications(userId: string, limit: number = 20): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('sent_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Failed to get notifications:', error);
      return [];
    }
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId);

      if (error) throw error;
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  }

  /**
   * Mark all notifications as read for user
   */
  async markAllAsRead(userId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', userId)
        .eq('is_read', false);

      if (error) throw error;
      toast.success('All notifications marked as read');
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
      toast.error('Failed to update notifications');
    }
  }

  /**
   * Schedule expiry warnings
   */
  async scheduleExpiryWarnings(): Promise<void> {
    try {
      // Get listings expiring in next 3 days
      const threeDaysFromNow = new Date();
      threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);

      const { data: listings, error } = await supabase
        .from('seller_listings')
        .select(`
          *,
          users!seller_id(id, name, email)
        `)
        .eq('status', 'active')
        .lte('exp_date', threeDaysFromNow.toISOString());

      if (error) throw error;

      const notifications: NotificationData[] = [];

      for (const listing of listings || []) {
        const expDate = new Date(listing.exp_date);
        const now = new Date();
        const daysUntilExpiry = Math.ceil((expDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

        let urgencyLevel = '';
        let recommendedAction = '';

        if (daysUntilExpiry <= 1) {
          urgencyLevel = '🚨 URGENT';
          recommendedAction = 'Consider 30-50% discount or immediate donation';
        } else if (daysUntilExpiry <= 2) {
          urgencyLevel = '⚠️ WARNING';
          recommendedAction = 'Start promoting with 15-25% discount';
        } else {
          urgencyLevel = '📅 REMINDER';
          recommendedAction = 'Monitor closely and prepare promotion strategy';
        }

        notifications.push({
          user_id: listing.seller_id,
          type: 'expiry_warning',
          title: `${urgencyLevel}: ${listing.title} expires ${daysUntilExpiry === 1 ? 'tomorrow' : `in ${daysUntilExpiry} days`}`,
          message: `Your listing "${listing.title}" is approaching expiry. ${recommendedAction}. Current price: $${listing.price}`,
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // Expire in 7 days
        });
      }

      if (notifications.length > 0) {
        await this.sendBulkNotifications(notifications);
        console.log(`Sent ${notifications.length} expiry warnings`);
      }
    } catch (error) {
      console.error('Failed to schedule expiry warnings:', error);
    }
  }

  /**
   * Send price alerts to buyers
   */
  async sendPriceAlerts(category: string, maxPrice: number): Promise<void> {
    try {
      // Get buyers interested in this category (simplified - in real app, track user preferences)
      const { data: buyers, error } = await supabase
        .from('users')
        .select('id, name, email')
        .eq('role', 'buyer');

      if (error) throw error;

      // Get matching listings
      const { data: listings } = await supabase
        .from('seller_listings')
        .select('*')
        .eq('category', category)
        .lte('price', maxPrice)
        .eq('status', 'active')
        .limit(5);

      if (!listings || listings.length === 0) return;

      const notifications: NotificationData[] = [];

      for (const buyer of buyers || []) {
        notifications.push({
          user_id: buyer.id,
          type: 'price_alert',
          title: `💰 Price Alert: ${category.charAt(0).toUpperCase() + category.slice(1)} under $${maxPrice}`,
          message: `Found ${listings.length} ${category} items under $${maxPrice}. Check them out before they're gone!`,
          expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // Expire in 24 hours
        });
      }

      await this.sendBulkNotifications(notifications);
    } catch (error) {
      console.error('Failed to send price alerts:', error);
    }
  }

  /**
   * Show toast notification
   */
  private showToastNotification(notification: NotificationData): void {
    const toastOptions = {
      duration: 5000,
      position: 'top-right' as const,
    };

    switch (notification.type) {
      case 'expiry_warning':
        toast.error(notification.message, toastOptions);
        break;
      case 'price_alert':
        toast.success(notification.message, toastOptions);
        break;
      case 'system':
        toast(notification.message, toastOptions);
        break;
      case 'promotion':
        toast.success(notification.message, toastOptions);
        break;
      default:
        toast(notification.message, toastOptions);
    }
  }

  /**
   * Send push notification
   */
  private async sendPushNotification(payload: PushNotificationPayload): Promise<void> {
    if (!this.pushSubscription) return;

    try {
      // In a real app, this would send to your backend which then sends to the push service
      console.log('Would send push notification:', payload);
      
      // For demo, show browser notification if permission granted
      if (Notification.permission === 'granted') {
        new Notification(payload.title, {
          body: payload.body,
          icon: payload.icon,
          badge: payload.badge,
          data: payload.data
        });
      }
    } catch (error) {
      console.error('Failed to send push notification:', error);
    }
  }

  /**
   * Save push subscription to database
   */
  private async savePushSubscription(subscription: PushSubscription): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // In a real app, save subscription to user profile
      console.log('Would save push subscription for user:', user.id);
    } catch (error) {
      console.error('Failed to save push subscription:', error);
    }
  }

  /**
   * Convert VAPID key
   */
  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  /**
   * Request notification permission
   */
  async requestNotificationPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      console.warn('Notifications not supported');
      return false;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    if (Notification.permission === 'denied') {
      toast.error('Notifications are blocked. Please enable them in your browser settings.');
      return false;
    }

    const permission = await Notification.requestPermission();
    
    if (permission === 'granted') {
      toast.success('Notifications enabled! You\'ll receive alerts about expiring items.');
      return true;
    } else {
      toast.error('Notifications denied. You won\'t receive expiry alerts.');
      return false;
    }
  }
}

export const notificationService = NotificationService.getInstance();