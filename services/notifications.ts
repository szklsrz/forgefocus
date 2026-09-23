import { TimerNotificationPayload } from '../types';

export type BrowserNotificationStatus = NotificationPermission | 'unsupported';

export const getBrowserNotificationStatus = (): BrowserNotificationStatus => {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported';
  }

  return Notification.permission;
};

export const requestBrowserNotificationPermission = async (): Promise<BrowserNotificationStatus> => {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported';
  }

  return Notification.requestPermission();
};

const getNotificationCopy = ({ mode, taskName, focusMinutes, restMinutes }: TimerNotificationPayload) => {
  if (mode === 'focus') {
    return {
      title: 'Focus complete',
      body: `${taskName || 'Your session'} ended. Time for a ${restMinutes}-minute break.`,
    };
  }

  return {
    title: 'Break complete',
    body: `Rest is over. Ready for the next ${focusMinutes}-minute focus session?`,
  };
};

export const sendTimerNotification = (payload: TimerNotificationPayload): boolean => {
  if (getBrowserNotificationStatus() !== 'granted') {
    return false;
  }

  const { title, body } = getNotificationCopy(payload);
  const notification = new Notification(title, {
    body,
    tag: `forgefocus-${payload.mode}`,
  });

  notification.onclick = () => {
    window.focus();
    notification.close();
  };

  return true;
};