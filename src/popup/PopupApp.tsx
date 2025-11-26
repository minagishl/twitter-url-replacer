import type React from 'react';
import { useEffect, useState } from 'react';
import browser from 'webextension-polyfill';

interface Settings {
  selectedDomain: string;
  customDomain: string;
  showNotifications: boolean;
  removeTrackingParams: boolean;
}

const PREDEFINED_DOMAINS = [
  { value: 'fixupx.com', label: 'FixupX' },
  { value: 'fxtwitter.com', label: 'FXTwitter' },
  { value: 'custom', label: 'Custom Domain' },
];

export const PopupApp: React.FC = () => {
  const [settings, setSettings] = useState<Settings>({
    selectedDomain: 'fixupx.com',
    customDomain: '',
    showNotifications: true,
    removeTrackingParams: false,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const result = await browser.storage.sync.get([
        'selectedDomain',
        'customDomain',
        'showNotifications',
        'removeTrackingParams',
      ]);
      setSettings({
        selectedDomain: result.selectedDomain || 'fixupx.com',
        customDomain: result.customDomain || '',
        showNotifications: result.showNotifications !== false, // Default to true
        removeTrackingParams: result.removeTrackingParams || false, // Default to false
      });
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveSettings = async (newSettings: Settings) => {
    setIsSaving(true);
    try {
      await browser.storage.sync.set(newSettings);
      setSettings(newSettings);
    } catch (error) {
      console.error('Error saving settings:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDomainChange = (domain: string) => {
    const newSettings = { ...settings, selectedDomain: domain };
    saveSettings(newSettings);
  };

  const handleCustomDomainChange = (customDomain: string) => {
    const newSettings = { ...settings, customDomain };
    saveSettings(newSettings);
  };

  const handleNotificationToggle = (showNotifications: boolean) => {
    const newSettings = { ...settings, showNotifications };
    saveSettings(newSettings);
  };

  const handleRemoveTrackingParamsToggle = (removeTrackingParams: boolean) => {
    const newSettings = { ...settings, removeTrackingParams };
    saveSettings(newSettings);
  };

  const getCurrentDomain = () => {
    if (settings.selectedDomain === 'custom') {
      return settings.customDomain || 'Enter custom domain';
    }
    return `https://${settings.selectedDomain}`;
  };

  if (isLoading) {
    return (
      <div className="popup-container">
        <div className="loading">Loading...</div>
      </div>
    );
  }

  return (
    <div className="popup-container">
      <div className="header">
        <h1>Twitter URL Replacer</h1>
        <p>Choose your preferred domain for Twitter/X links</p>
      </div>

      <div className="content">
        <div className="current-setting">
          <strong>Current: </strong>
          <span className="domain-display">{getCurrentDomain()}</span>
        </div>

        <div className="domain-options">
          {PREDEFINED_DOMAINS.map((domain) => (
            <label key={domain.value} className="radio-option">
              <input
                type="radio"
                name="domain"
                value={domain.value}
                checked={settings.selectedDomain === domain.value}
                onChange={(e) => handleDomainChange(e.target.value)}
                disabled={isSaving}
              />
              <span className="radio-label">{domain.label}</span>
              {domain.value !== 'custom' && (
                <span className="domain-url">https://{domain.value}</span>
              )}
            </label>
          ))}
        </div>

        {settings.selectedDomain === 'custom' && (
          <div className="custom-domain-input">
            <label htmlFor="customDomain">Custom Domain:</label>
            <input
              id="customDomain"
              type="text"
              placeholder="e.g., yourdomain.com"
              value={settings.customDomain}
              onChange={(e) => handleCustomDomainChange(e.target.value)}
              disabled={isSaving}
            />
            <small>Enter domain without https://</small>
          </div>
        )}

        <div className="notification-settings">
          <label className="checkbox-option">
            <input
              type="checkbox"
              checked={settings.showNotifications}
              onChange={(e) => handleNotificationToggle(e.target.checked)}
              disabled={isSaving}
            />
            <span className="checkbox-label">
              Show notifications when URL is replaced
            </span>
          </label>
        </div>

        <div className="tracking-settings">
          <label className="checkbox-option">
            <input
              type="checkbox"
              checked={settings.removeTrackingParams}
              onChange={(e) =>
                handleRemoveTrackingParamsToggle(e.target.checked)
              }
              disabled={isSaving}
            />
            <span className="checkbox-label">
              Remove all query parameters (tracking, etc.)
            </span>
          </label>
        </div>

        <div className="footer">
          <p>
            URLs will be replaced when you use the share button on Twitter/X
          </p>
        </div>
      </div>
    </div>
  );
};
