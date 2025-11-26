import browser from 'webextension-polyfill';

// Initialize default settings when extension is installed
browser.runtime.onInstalled.addListener(async (details) => {
  if (details.reason === 'install') {
    await browser.storage.sync.set({
      selectedDomain: 'fixupx.com',
      customDomain: '',
      showNotifications: true,
      removeTrackingParams: false,
    });

    console.log(
      'Twitter URL Replacer: Extension installed with default settings',
    );
  }
});

// Handle messages from content scripts (if needed for future features)
browser.runtime.onMessage.addListener(
  async (message, _sender, _sendResponse) => {
    console.log('Background received message:', message);

    switch (message.action) {
      case 'getSettings':
        try {
          const settings = await browser.storage.sync.get([
            'selectedDomain',
            'customDomain',
            'showNotifications',
            'removeTrackingParams',
          ]);
          return settings;
        } catch (error) {
          console.error('Error getting settings:', error);
          return {
            selectedDomain: 'fixupx.com',
            customDomain: '',
            showNotifications: true,
            removeTrackingParams: false,
          };
        }

      case 'updateSettings':
        try {
          await browser.storage.sync.set(message.settings);
          return { success: true };
        } catch (error) {
          console.error('Error updating settings:', error);
          return { success: false, error: String(error) };
        }

      default:
        console.log('Unknown action:', message.action);
        return { error: 'Unknown action' };
    }
  },
);

// Log when storage changes occur
browser.storage.onChanged.addListener((changes, areaName) => {
  console.log('Storage changed:', changes, 'in area:', areaName);
});
