import { registerPlugin, Capacitor } from '@capacitor/core';

const WidgetSync = registerPlugin('WidgetSync');

export const updateWidgets = async () => {
  if (Capacitor.isNativePlatform()) {
    try {
      await WidgetSync.syncWidgets();
    } catch (e) {
      console.error('Failed to update widgets', e);
    }
  }
};
