# Twitter URL Replacer

A Chrome extension that automatically replaces Twitter/X URLs with alternative domains when sharing links, helping you bypass potential limitations and improve link accessibility.

## Features

* **Automatic URL Replacement**: Seamlessly replaces `https://x.com` and `https://twitter.com` URLs with your preferred alternative domain
* **Multiple Domain Options**: Choose from popular alternatives:
  - **FixupX** (`https://fixupx.com`) - Default option
  - **FXTwitter** (`https://fxtwitter.com`) - Popular alternative
  - **Custom Domain** - Use your own preferred domain
* **Smart Detection**: Automatically detects when you click share buttons or copy Twitter URLs
* **Real-time Settings**: Change domains instantly through the extension popup
* **Visual Feedback**: Get notifications when URLs are replaced
* **Privacy-Focused**: All settings stored locally, no data sent to external servers

## Technology Stack

- React 19
- TypeScript
- Vite

## Chrome Web Store

You can install this extension from the [Chrome Web Store](https://chromewebstore.google.com/detail/effnfjbmpbdmfggddpglhljnjjecoekk).

## Manual Installation

1. Run `pnpm build` to create the production build
2. Open `chrome://extensions` in Chrome browser
3. Enable "Developer mode" in the top right
4. Click "Load unpacked" and select the `dist` folder

## Usage

### Basic Usage

1. **Install and Activate**: Once installed, the extension works automatically on Twitter/X
2. **Configure Domains**: Click the extension icon to open the popup and select your preferred domain
3. **Share Links**: When you click share buttons or copy URLs on Twitter/X, they'll be automatically replaced

### Changing Domains

1. Click the Twitter URL Replacer icon in your browser toolbar
2. Select your preferred option:
   - **FixupX**: Uses `https://fixupx.com`
   - **FXTwitter**: Uses `https://fxtwitter.com`
   - **Custom Domain**: Enter your own domain (without `https://`)
3. Settings are saved automatically and applied immediately

### How It Works

The extension works in several ways:

1. **Share Button Detection**: Monitors Twitter/X share buttons and replaces URLs when the "Copy link" option is used
2. **Text Selection**: When you select and copy Twitter/X URLs, they're automatically replaced in your clipboard
3. **Smart Replacement**: Only replaces `twitter.com` and `x.com` URLs while preserving the full path and parameters

## Development

### Prerequisites

* Node.js 20 or higher
* pnpm package manager

### Development Setup

1. Clone the repository and install dependencies:
    ```bash
    git clone https://github.com/minagishl/twitter-url-replacer.git
    cd twitter-url-replacer
    pnpm install
    ```

2. Start development mode:
    ```bash
    pnpm dev
    ```

3. Build for production:
    ```bash
    pnpm build
    ```

## Browser Compatibility

While this extension is primarily tested on Chrome, it uses [webextension-polyfill](https://github.com/mozilla/webextension-polyfill) which should make it compatible with other modern browsers that support Web Extensions (though this hasn't been extensively tested).

## Supported Domains

### Default Options

* **FixupX** (`fixupx.com`) - Provides enhanced Twitter link previews
* **FXTwitter** (`fxtwitter.com`) - Popular alternative with better embedding

### Custom Domains

You can use any domain that mirrors Twitter content. Popular alternatives include:
* `nitter.net` (and other Nitter instances)
* `tweetdeck.com`
* Any other Twitter proxy service

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
