# Redirect Blocker

A Chrome extension that helps you control website redirects by letting you block or allow them with a simple prompt.

## Features

- Prompts before allowing redirects to new domains
- Maintains block/allow lists for automatic handling
- Easy management of blocked and allowed domains
- Search functionality to find domains in your lists
- Toggle extension on/off with one click

## Installation

1. Download/clone this repository
2. Open Chrome and go to `chrome://extensions/`
3. Enable "Developer mode" in the top right
4. Click "Load unpacked" and select the extension directory

## Usage

- When visiting a site that redirects to a new domain, you'll see a prompt
- Choose to allow or block the redirect
- Check "Remember my choice" to automatically handle future redirects
- Click the extension icon to:
  - View/manage blocked and allowed domains
  - Search through your domain lists
  - Toggle the extension on/off

## Files
- `manifest.json`: Extension configuration
- `popup.html/js`: UI for managing domains
- `background.js`: Core blocking logic
- `content.js`: Handles redirect prompts
