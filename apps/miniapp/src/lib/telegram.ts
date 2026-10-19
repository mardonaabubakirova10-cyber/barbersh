import { useEffect, useState } from 'react';
import { TelegramUser, TelegramThemeParams, TelegramWebApp } from '../types/telegram';

export function getTelegramWebApp(): TelegramWebApp | null {
  if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
    return window.Telegram.WebApp;
  }
  return null;
}

export function isTelegramEnvironment(): boolean {
  const tg = getTelegramWebApp();
  return Boolean(tg && tg.initData && tg.initData.length > 0);
}

export interface TelegramState {
  isAvailable: boolean;
  user: TelegramUser | null;
  initData: string;
  colorScheme: 'light' | 'dark';
  themeParams: TelegramThemeParams;
  ready: () => void;
  expand: () => void;
  close: () => void;
  haptic: {
    light: () => void;
    medium: () => void;
    heavy: () => void;
    success: () => void;
    error: () => void;
    warning: () => void;
    selection: () => void;
  };
  showAlert: (message: string) => Promise<void>;
  showConfirm: (message: string) => Promise<boolean>;
}

// Fallback Mock User for local browser testing outside Telegram
const MOCK_USER: TelegramUser = {
  id: 99887766,
  first_name: 'Александр',
  last_name: 'Смирнов',
  username: 'alex_blade',
  language_code: 'ru',
};

export function useTelegram(): TelegramState {
  const tg = getTelegramWebApp();

  const [state, setState] = useState<TelegramState>(() => {
    const isAvail = Boolean(tg);
    const user = tg?.initDataUnsafe?.user || MOCK_USER;
    const colorScheme = tg?.colorScheme || 'dark';
    const themeParams = tg?.themeParams || {};

    return {
      isAvailable: isAvail,
      user,
      initData: tg?.initData || 'query_id=mock_query&user=%7B%22id%22%3A99887766%2C%22first_name%22%3A%22%D0%90%D0%BB%D0%B5%D0%BA%D1%81%D0%B0%D0%BD%D0%B4%D1%80%22%2C%22username%22%3A%22alex_blade%22%7D',
      colorScheme,
      themeParams,
      ready: () => {
        try { tg?.ready?.(); } catch (e) {}
      },
      expand: () => {
        try { tg?.expand?.(); } catch (e) {}
      },
      close: () => {
        try { tg?.close?.(); } catch (e) {}
      },
      haptic: {
        light: () => {
          try { tg?.HapticFeedback?.impactOccurred('light'); } catch (e) {}
        },
        medium: () => {
          try { tg?.HapticFeedback?.impactOccurred('medium'); } catch (e) {}
        },
        heavy: () => {
          try { tg?.HapticFeedback?.impactOccurred('heavy'); } catch (e) {}
        },
        success: () => {
          try { tg?.HapticFeedback?.notificationOccurred('success'); } catch (e) {}
        },
        error: () => {
          try { tg?.HapticFeedback?.notificationOccurred('error'); } catch (e) {}
        },
        warning: () => {
          try { tg?.HapticFeedback?.notificationOccurred('warning'); } catch (e) {}
        },
        selection: () => {
          try { tg?.HapticFeedback?.selectionChanged(); } catch (e) {}
        },
      },
      showAlert: (msg: string) =>
        new Promise((resolve) => {
          try {
            if (tg?.showAlert) {
              tg.showAlert(msg, () => resolve());
            } else {
              alert(msg);
              resolve();
            }
          } catch (e) {
            alert(msg);
            resolve();
          }
        }),
      showConfirm: (msg: string) =>
        new Promise((resolve) => {
          try {
            if (tg?.showConfirm) {
              tg.showConfirm(msg, (confirmed) => resolve(confirmed));
            } else {
              resolve(confirm(msg));
            }
          } catch (e) {
            resolve(confirm(msg));
          }
        }),
    };
  });

  useEffect(() => {
    if (tg) {
      try { tg.ready(); } catch (e) {}
      try { tg.expand(); } catch (e) {}
      try {
        const tgAny = tg as any;
        if (typeof tgAny.isVersionAtLeast === 'function' && tgAny.isVersionAtLeast('6.9')) {
          tg.requestWriteAccess?.();
        }
      } catch (e) {}

      // Keep dark luxury barber palette intact, only sync accent colors if needed
      try {
        const root = document.documentElement;
        if (tg.themeParams && tg.colorScheme === 'dark') {
          if (tg.themeParams.bg_color) root.style.setProperty('--tg-theme-bg-color', tg.themeParams.bg_color);
          if (tg.themeParams.secondary_bg_color) root.style.setProperty('--tg-theme-secondary-bg-color', tg.themeParams.secondary_bg_color);
        }
      } catch (e) {}
    }
  }, [tg]);

  return state;
}
