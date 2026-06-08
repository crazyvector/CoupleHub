import { registerPlugin, Capacitor } from '@capacitor/core';

const WidgetUpdater = registerPlugin('WidgetUpdater');

export const updateWidgets = async () => {
  if (Capacitor.isNativePlatform()) {
    try {
      await WidgetUpdater.update({ widgetType: 'all' });
    } catch (e) {
      console.error('Failed to update widgets', e);
    }
  }
};
