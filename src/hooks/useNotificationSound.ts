import { useCallback, useEffect } from 'react';
import { notificationSound } from '../services/audio/NotificationSound';

export const useNotificationSound = () => {
  useEffect(() => {
    // Initialize audio on mount
    notificationSound.initialize().catch(() => {
      // Initialization failure is handled internally
    });
  }, []);

  const playNotificationSound = useCallback(async () => {
    try {
      await notificationSound.play();
    } catch (error) {
      // Errors are handled internally by the NotificationSound class
    }
  }, []);

  const setVolume = useCallback((volume: number) => {
    notificationSound.setVolume(volume);
  }, []);

  return {
    playNotificationSound,
    setVolume
  };
};