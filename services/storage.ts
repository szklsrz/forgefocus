
import { DailyStats, NotificationPreferences, SessionRecord, StorageData } from '../types';

const STORAGE_KEY = 'forgefocus_data';
const NOTIFICATION_PREFERENCES_KEY = 'forgefocus_notification_preferences';

const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  hasRequestedPermission: false,
  notifyOnFocusEnd: true,
  notifyOnRestEnd: true,
};

export const getStorageData = (): StorageData => {
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : {};
};

export const getNotificationPreferences = (): NotificationPreferences => {
  const data = localStorage.getItem(NOTIFICATION_PREFERENCES_KEY);

  if (!data) {
    return DEFAULT_NOTIFICATION_PREFERENCES;
  }

  return {
    ...DEFAULT_NOTIFICATION_PREFERENCES,
    ...JSON.parse(data),
  };
};

export const saveNotificationPreferences = (
  nextPreferences: Partial<NotificationPreferences>,
): NotificationPreferences => {
  const mergedPreferences = {
    ...getNotificationPreferences(),
    ...nextPreferences,
  };

  localStorage.setItem(NOTIFICATION_PREFERENCES_KEY, JSON.stringify(mergedPreferences));
  return mergedPreferences;
};

export const saveSession = (session: SessionRecord) => {
  const data = getStorageData();
  const dateKey = session.startTime.split('T')[0];

  if (!data[dateKey]) {
    data[dateKey] = {
      date: dateKey,
      totalPoints: 0,
      totalFocusMinutes: 0,
      sessions: [],
    };
  }

  const dayData = data[dateKey];
  dayData.sessions.push(session);
  
  if (session.type === 'focus') {
    dayData.totalPoints += session.points;
    dayData.totalFocusMinutes += session.focusMinutes;
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  return data[dateKey];
};

export const isTaskNameUniqueToday = (name: string): boolean => {
  const data = getStorageData();
  const todayKey = new Date().toISOString().split('T')[0];
  const todayData = data[todayKey];
  
  if (!todayData) return true;
  return !todayData.sessions.some(s => s.taskName.toLowerCase() === name.toLowerCase());
};

export const getAllDailyStats = (): DailyStats[] => {
  const data = getStorageData();
  return Object.values(data).sort((a, b) => b.date.localeCompare(a.date));
};
