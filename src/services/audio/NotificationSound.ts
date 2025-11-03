import notificationSoundUrl from '../../assets/sounds/notification.mp3';

class NotificationSound {
  private static instance: NotificationSound | null = null;
  private audio: HTMLAudioElement | null = null;
  private initialized = false;

  private constructor() {}

  static getInstance(): NotificationSound {
    if (!this.instance) {
      this.instance = new NotificationSound();
    }
    return this.instance;
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      this.audio = new Audio(notificationSoundUrl);
      this.audio.volume = 0.5;
      this.initialized = true;

      // Pre-load the audio
      await this.audio.load();
    } catch (error) {
      console.warn('Failed to initialize notification sound:', error);
      this.initialized = true; // Mark as initialized to prevent further attempts
    }
  }

  async play(): Promise<void> {
    try {
      if (!this.initialized) {
        await this.initialize();
      }

      if (this.audio) {
        this.audio.currentTime = 0;
        await this.audio.play();
      }
    } catch (error) {
      // Log but don't throw - notification sounds are non-critical
      console.warn('Could not play notification sound:', error);
    }
  }

  setVolume(volume: number): void {
    if (this.audio) {
      this.audio.volume = Math.max(0, Math.min(1, volume));
    }
  }
}

// Export singleton instance
export const notificationSound = NotificationSound.getInstance();