import React, { useEffect } from 'react';
import { useAuth } from '@/shared/hooks/useAuth';
import { supabase } from '@/shared/supabase/client';
import { useToast } from '@/shared/hooks/use-toast';

interface NotificationServiceProps {
  children: React.ReactNode;
}

export const NotificationService = ({ children }: NotificationServiceProps) => {
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (!user) return;

    // The service worker is now registered by vite-plugin-pwa, so we remove the manual registration.
    // registerServiceWorker();

    // Check and request notification permissions
    checkNotificationPermission();

    // Setup periodic reminder checks
    const cleanup = setupReminderChecks();
    
    return cleanup;
  }, [user]);

  /*
  const registerServiceWorker = async () => {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js');
        console.log('Service Worker registered:', registration);
        
        // Listen for messages from service worker
        navigator.serviceWorker.addEventListener('message', handleServiceWorkerMessage);
      } catch (error) {
        console.error('Service Worker registration failed:', error);
      }
    }
  };
  */

  const checkNotificationPermission = async () => {
    if ('Notification' in window) {
      const permission = Notification.permission;
      
      if (permission === 'default') {
        // Don't auto-request, let user do it from settings
        return;
      }
      
      if (permission === 'granted') {
        // Setup push notification subscription if needed
        setupPushSubscription();
      }
    }
  };

  const setupPushSubscription = async () => {
    try {
      const registration = await navigator.serviceWorker.ready;
      
      // Check if we already have a subscription
      const existingSubscription = await registration.pushManager.getSubscription();
      if (existingSubscription) {
        return;
      }

      // This would be implemented with your push service
      // For now, we'll use local notifications
      console.log('Push notifications ready to be implemented');
    } catch (error) {
      console.error('Error setting up push subscription:', error);
    }
  };

  const setupReminderChecks = () => {
    // Check for reminders every minute
    const interval = setInterval(async () => {
      await checkForDueReminders();
    }, 60000);

    // Initial check
    checkForDueReminders();

    return () => clearInterval(interval);
  };

  const checkForDueReminders = async () => {
    if (!user) return;

    try {
      const now = new Date();
      const currentTime = now.toTimeString().slice(0, 5); // HH:MM format
      const currentDay = now.getDay(); // 0 = Sunday, 1 = Monday, etc.

      // Get reminders due now (±2 minutes window)
      const { data: reminders, error } = await supabase
        .from('supplement_reminders')
        .select(`
          id,
          supplement_ean,
          reminder_time,
          products (
            product_name,
            brands_tags
          )
        `)
        .eq('user_id', user.id)
        .eq('is_active', true)
        .eq('notification_enabled', true)
        .contains('days_of_week', [currentDay]);

      if (error) throw error;

      for (const reminder of reminders || []) {
        const reminderTime = reminder.reminder_time;
        const timeDiff = getTimeDifference(currentTime, reminderTime);
        
        // Show notification if within 2 minutes of reminder time
        if (Math.abs(timeDiff) <= 2) {
          await showReminderNotification(reminder);
        }
      }
    } catch (error) {
      console.error('Error checking for reminders:', error);
    }
  };

  const getTimeDifference = (currentTime: string, reminderTime: string): number => {
    const [currentHour, currentMinute] = currentTime.split(':').map(Number);
    const [reminderHour, reminderMinute] = reminderTime.split(':').map(Number);
    
    const currentTotalMinutes = currentHour * 60 + currentMinute;
    const reminderTotalMinutes = reminderHour * 60 + reminderMinute;
    
    return currentTotalMinutes - reminderTotalMinutes;
  };

  const showReminderNotification = async (reminder: any) => {
    const supplementName = reminder.supplements?.name || 'Suplemento';
    
    // Check if we already showed this reminder today
    const today = new Date().toDateString();
    const reminderKey = `reminder_${reminder.id}_${today}`;
    
    if (localStorage.getItem(reminderKey)) {
      return; // Already shown today
    }

    // Show browser notification if permission granted
    if (Notification.permission === 'granted') {
      const notification = new Notification(`¡Hora de tu ${supplementName}!`, {
        body: `No olvides tomar tu ${supplementName}`,
        icon: '/logo.png',
        badge: '/logo.png',
        tag: `reminder-${reminder.id}`,
        requireInteraction: true,
        data: {
          supplementEan: reminder.supplement_ean,
          reminderId: reminder.id
        }
      });

      notification.onclick = () => {
        window.focus();
        notification.close();
        // Mark as taken when notification is clicked
        markSupplementAsTaken(reminder.supplement_ean);
      };

      // Mark as shown
      localStorage.setItem(reminderKey, 'shown');
    }

    // Also show in-app toast
    toast({
      title: `¡Hora de tu ${supplementName}!`,
      description: "No olvides tomar tu suplemento",
      duration: 10000,
    });
  };

  const handleServiceWorkerMessage = (event: MessageEvent) => {
    const { type, data } = event.data;
    
    switch (type) {
      case 'notification-click':
        if (data.action === 'mark-taken') {
          markSupplementAsTaken(data.supplementEan);
        } else if (data.action === 'snooze') {
          snoozeReminder(data.reminderId);
        }
        break;
    }
  };

  const markSupplementAsTaken = async (supplementEan: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('supplement_logs')
        .insert({
          user_id: user.id,
          supplement_ean: supplementEan,
          taken_at: new Date().toISOString(),
          notes: 'Tomado desde notificación'
        });

      if (error) throw error;

      toast({
        title: "¡Suplemento registrado!",
        description: "Marcado como tomado desde la notificación",
      });
    } catch (error) {
      console.error('Error marking supplement as taken:', error);
    }
  };

  const snoozeReminder = (reminderId: string) => {
    // Implement snooze logic - show reminder again in 10 minutes
    setTimeout(() => {
      toast({
        title: "Recordatorio repetido",
        description: "No olvides tomar tu suplemento",
      });
    }, 10 * 60 * 1000); // 10 minutes
  };

  return <>{children}</>;
};
