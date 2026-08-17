/**
 * Runs in the page MAIN world so we can intercept Twitter/X clipboard writes
 * without blocking their click handlers (footer "Link copied" toast, etc.).
 */
(() => {
  type Config = {
    domain: string;
    removeTrackingParams: boolean;
  };

  let config: Config = {
    domain: 'fixupx.com',
    removeTrackingParams: false,
  };

  const CONFIG_MESSAGE = 'TWITTER_URL_REPLACER_CONFIG';
  const REPLACED_EVENT = 'twitter-url-replacer:replaced';

  window.addEventListener('message', (event: MessageEvent) => {
    if (event.source !== window) return;
    if (event.data?.type !== CONFIG_MESSAGE) return;
    if (!event.data.config || typeof event.data.config !== 'object') return;

    const next = event.data.config as Partial<Config>;
    config = {
      domain:
        typeof next.domain === 'string' && next.domain
          ? next.domain
          : config.domain,
      removeTrackingParams: Boolean(next.removeTrackingParams),
    };
  });

  const replaceTwitterUrl = (text: string): string => {
    try {
      const urlObj = new URL(text.trim());

      if (urlObj.hostname !== 'x.com' && urlObj.hostname !== 'twitter.com') {
        return text;
      }

      const searchParams = config.removeTrackingParams ? '' : urlObj.search;
      return `https://${config.domain}${urlObj.pathname}${searchParams}${urlObj.hash}`;
    } catch {
      return text;
    }
  };

  const originalWriteText = navigator.clipboard.writeText.bind(
    navigator.clipboard,
  );

  navigator.clipboard.writeText = async (text: string) => {
    const replaced = replaceTwitterUrl(text);

    if (replaced !== text) {
      window.dispatchEvent(
        new CustomEvent(REPLACED_EVENT, {
          detail: { from: text, to: replaced },
        }),
      );
    }

    return originalWriteText(replaced);
  };
})();
