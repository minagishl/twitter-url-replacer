import browser from 'webextension-polyfill';

interface Settings {
  selectedDomain: string;
  customDomain: string;
  showNotifications: boolean;
  removeTrackingParams: boolean;
}

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
    this.observeShareButtons();
    this.interceptCopyEvents();
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

  private replaceTwitterUrl(url: string): string {
    try {
      const urlObj = new URL(url);

      if (urlObj.hostname === 'x.com' || urlObj.hostname === 'twitter.com') {
        const replacementDomain = this.getReplacementDomain();

        // Determine search params based on settings
        let searchParams = urlObj.search;
        if (this.settings.removeTrackingParams) {
          searchParams = ''; // Remove all query parameters
        }

        // Ensure the replacement domain has proper protocol
        const newUrl = `https://${replacementDomain}${urlObj.pathname}${searchParams}${urlObj.hash}`;

        console.log(`Twitter URL Replacer: Replaced ${url} with ${newUrl}`);
        return newUrl;
      }
    } catch (error) {
      console.error('Error parsing URL:', error);
    }

    return url;
  }

  private observeShareButtons() {
    // Observer for dynamic content changes
    const observer = new MutationObserver((mutations) => {
      for (const _mutation of mutations) {
        this.attachShareButtonListeners();
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    // Initial attachment
    this.attachShareButtonListeners();
  }

  private attachShareButtonListeners() {
    // Look for share buttons (these selectors might need adjustment based on Twitter's current DOM structure)
    const shareSelectors = [
      '[data-testid="share"]',
      '[aria-label*="Share"]',
      '[aria-label*="share"]',
      'button[role="button"]:has(svg)',
      '.r-1777fci', // Common Twitter button class (may change)
    ];

    for (const selector of shareSelectors) {
      const buttons = document.querySelectorAll(selector);
      for (const button of buttons) {
        if (!button.hasAttribute('data-url-replacer-attached')) {
          button.setAttribute('data-url-replacer-attached', 'true');
          button.addEventListener(
            'click',
            this.handleShareButtonClick.bind(this),
          );
        }
      }
    }
  }

  private async handleShareButtonClick() {
    // Wait a bit for any share menu to appear
    setTimeout(() => {
      this.processShareMenu();
    }, 500);
  }

  private processShareMenu() {
    // Look for copy link buttons in share menus
    const copyLinkSelectors = [
      '[data-testid="copyLinkButton"]',
      'button[role="menuitem"]',
      '.r-1loqt21', // Another potential Twitter class
      'button', // Generic button selector to check text content
    ];

    for (const selector of copyLinkSelectors) {
      const buttons = document.querySelectorAll(selector);
      for (const button of buttons) {
        if (!button.hasAttribute('data-url-replacer-copy-attached')) {
          // Check if the button text contains "Copy link" or similar variations
          const buttonText = button.textContent?.toLowerCase() || '';
          const issCopyLinkButton =
            buttonText.includes('copy link') ||
            buttonText.includes('copy') ||
            button.getAttribute('data-testid') === 'copyLinkButton';

          if (issCopyLinkButton) {
            button.setAttribute('data-url-replacer-copy-attached', 'true');
            button.addEventListener(
              'click',
              this.handleCopyLinkClick.bind(this),
            );
          }
        }
      }
    }
  }

  private async handleCopyLinkClick(event: Event) {
    // Prevent the default copy action temporarily
    event.preventDefault();
    event.stopPropagation();

    try {
      // Get the current page URL
      const currentUrl = window.location.href;
      const replacedUrl = this.replaceTwitterUrl(currentUrl);

      // Copy the replaced URL to clipboard
      await navigator.clipboard.writeText(replacedUrl);

      // Show a brief notification
      this.showNotification('Link copied with replaced domain!');
    } catch (error) {
      console.error('Error copying replaced URL:', error);
      // If our replacement fails, allow the original action to proceed
      setTimeout(() => {
        (event.target as HTMLElement).click();
      }, 0);
    }
  }

  private interceptCopyEvents() {
    // Intercept clipboard operations
    document.addEventListener('copy', (event) => {
      const selection = window.getSelection();
      if (selection?.toString()) {
        const selectedText = selection.toString();

        // Check if the selected text is a Twitter/X URL
        if (
          selectedText.includes('twitter.com') ||
          selectedText.includes('x.com')
        ) {
          const replacedUrl = this.replaceTwitterUrl(selectedText);

          if (replacedUrl !== selectedText) {
            event.preventDefault();
            event.clipboardData?.setData('text/plain', replacedUrl);
            this.showNotification('URL replaced in clipboard!');
          }
        }
      }
    });
  }

  private showNotification(message: string) {
    // Only show notification if enabled in settings
    if (!this.settings.showNotifications) {
      return;
    }

    // Create a simple notification
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

    // Remove notification after 3 seconds
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

// Initialize the URL replacer when the page loads
let urlReplacerInstance: TwitterUrlReplacer;

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    urlReplacerInstance = new TwitterUrlReplacer();
  });
} else {
  urlReplacerInstance = new TwitterUrlReplacer();
}

// Listen for settings changes
browser.storage.onChanged.addListener(async (changes) => {
  if (
    changes.selectedDomain ||
    changes.customDomain ||
    changes.removeTrackingParams
  ) {
    // Reload the page to apply new settings
    window.location.reload();
  } else if (changes.showNotifications && urlReplacerInstance) {
    // Just reload settings for notification changes (no need to reload page)
    await urlReplacerInstance.loadSettings();
  }
});
