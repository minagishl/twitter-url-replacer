import browser from 'webextension-polyfill';

interface Settings {
  selectedDomain: string;
  customDomain: string;
  showNotifications: boolean;
  removeTrackingParams: boolean;
}

const CONFIG_MESSAGE = 'TWITTER_URL_REPLACER_CONFIG';
const REPLACED_EVENT = 'twitter-url-replacer:replaced';

class TwitterUrlReplacer {
  private settings: Settings = {
    selectedDomain: 'fixupx.com',
    customDomain: '',
    showNotifications: true,
    removeTrackingParams: false,
  };

  constructor() {
    this.init();
  }

  private async init() {
    await this.loadSettings();
    this.pushConfigToPage();
    this.interceptCopyEvents();
    this.listenForReplacements();
  }

  public async loadSettings() {
    try {
      const result = await browser.storage.sync.get([
        'selectedDomain',
        'customDomain',
        'showNotifications',
        'removeTrackingParams',
      ]);
      this.settings = {
        selectedDomain: result.selectedDomain || 'fixupx.com',
        customDomain: result.customDomain || '',
        showNotifications: result.showNotifications !== false, // Default to true
        removeTrackingParams: result.removeTrackingParams || false, // Default to false
      };
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  }

  private getReplacementDomain(): string {
    if (this.settings.selectedDomain === 'custom') {
      return this.settings.customDomain || 'fixupx.com';
    }
    return this.settings.selectedDomain;
  }

  public pushConfigToPage() {
    window.postMessage(
      {
        type: CONFIG_MESSAGE,
        config: {
          domain: this.getReplacementDomain(),
          removeTrackingParams: this.settings.removeTrackingParams,
        },
      },
      '*',
    );
  }

  private replaceTwitterUrl(url: string): string {
    try {
      const urlObj = new URL(url.trim());

      if (urlObj.hostname === 'x.com' || urlObj.hostname === 'twitter.com') {
        const replacementDomain = this.getReplacementDomain();

        let searchParams = urlObj.search;
        if (this.settings.removeTrackingParams) {
          searchParams = '';
        }

        const newUrl = `https://${replacementDomain}${urlObj.pathname}${searchParams}${urlObj.hash}`;

        console.log(`Twitter URL Replacer: Replaced ${url} with ${newUrl}`);
        return newUrl;
      }
    } catch (error) {
      console.error('Error parsing URL:', error);
    }

    return url;
  }

  private listenForReplacements() {
    window.addEventListener(REPLACED_EVENT, () => {
      this.showNotification('Link copied with replaced domain!');
    });
  }

  private interceptCopyEvents() {
    // Intercept selection-based copy (does not go through clipboard.writeText)
    document.addEventListener('copy', (event) => {
      const selection = window.getSelection();
      const selectedText = selection?.toString().trim();
      if (!selectedText) return;

      try {
        const urlObj = new URL(selectedText);

        if (urlObj.hostname === 'twitter.com' || urlObj.hostname === 'x.com') {
          const replacedUrl = this.replaceTwitterUrl(selectedText);

          if (replacedUrl !== selectedText) {
            event.preventDefault();
            event.clipboardData?.setData('text/plain', replacedUrl);
            this.showNotification('URL replaced in clipboard!');
          }
        }
      } catch {
        // Selected text is not a URL — leave the default copy behavior alone
      }
    });
  }

  private showNotification(message: string) {
    if (!this.settings.showNotifications) {
      return;
    }

    const notification = document.createElement('div');
    notification.textContent = message;
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #1d9bf0;
      color: white;
      padding: 12px 16px;
      border-radius: 8px;
      z-index: 10000;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 14px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      transition: opacity 0.3s ease;
    `;

    document.body.appendChild(notification);

    setTimeout(() => {
      notification.style.opacity = '0';
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 300);
    }, 3000);
  }
}

let urlReplacerInstance: TwitterUrlReplacer;

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    urlReplacerInstance = new TwitterUrlReplacer();
  });
} else {
  urlReplacerInstance = new TwitterUrlReplacer();
}

browser.storage.onChanged.addListener(async () => {
  if (!urlReplacerInstance) return;
  await urlReplacerInstance.loadSettings();
  urlReplacerInstance.pushConfigToPage();
});
