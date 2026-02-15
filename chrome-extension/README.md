# AutoScroll Pro - Chrome Extension

A professional auto-scroll Chrome extension that works seamlessly with the AutoScroll Pro web tool.

## 🚀 Features

### Extension Features:
- **Universal Auto-Scroll**: Works on any website (no iframe restrictions)
- **Cross-Tab Control**: Control auto-scrolling across multiple tabs simultaneously
- **Professional UI**: Beautiful popup interface with real-time status monitoring
- **Keyboard Shortcuts**: Quick toggle with Ctrl+Shift+S, reset with Ctrl+Shift+R
- **Persistent Settings**: Settings saved across browser sessions
- **Real-time Updates**: Live status monitoring of all auto-scroll tabs

### Web Tool Integration:
- **Tab Management**: Web tool can open/manage tabs that the extension controls
- **Synchronized Settings**: Settings shared between web tool and extension
- **Status Monitoring**: Real-time view of which tabs are scrolling
- **Centralized Control**: Control all auto-scrolling from either interface

## 📦 Installation

### Chrome Extension Installation:
1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top-right corner)
3. Click "Load unpacked" button
4. Select the `chrome-extension` folder from this project
5. The extension icon should appear in your toolbar

### Web Tool Setup:
1. Make sure the web tool is running (`npm run dev`)
2. Open http://localhost:3000
3. Both tools will automatically sync settings

## 🎯 Usage

### Using the Extension Popup:
1. Click the AutoScroll Pro extension icon in your browser toolbar
2. View all tabs with auto-scroll enabled
3. Control individual tabs or all tabs at once:
   - **Start All**: Begin scrolling on all tabs
   - **Stop All**: Pause scrolling on all tabs
   - **Reset All**: Scroll all tabs back to top
   - **Refresh**: Update the tab list

### Using Keyboard Shortcuts:
- **Ctrl+Shift+S**: Toggle auto-scroll on current page
- **Ctrl+Shift+R**: Reset scroll position to top

### Using the Web Tool:
1. Add website URLs in the web tool
2. Click "Open All Windows" to open URLs in new tabs
3. The extension will automatically detect and control these tabs
4. Use the web tool's interface to manage all tabs simultaneously

## ⚙️ Settings

### Extension Settings:
- **Scroll Speed**: 1-100% control of scrolling speed
- **Auto Start**: Automatically start scrolling when page loads
- **Smooth Scrolling**: Enable/disable smooth scroll animation
- **Scroll Direction**: Up or down scrolling

### Quick Settings (Popup):
- Adjust speed and auto-start directly from the popup
- Settings apply to all tabs in real-time

## 🛠 Technical Architecture

### Components:
- **Content Script** (`content.js`): Runs on web pages, handles actual scrolling
- **Background Service Worker** (`background.js`): Manages cross-tab communication
- **Popup UI** (`popup.html/popup.js`): User interface for controlling tabs
- **Web Tool Integration**: Synchronizes settings via Chrome storage

### Communication Flow:
```
Popup ↔ Background Script ↔ Content Scripts ↔ Web Pages
           ↑
    Chrome Storage (settings sync)
           ↑
      Web Tool
```

## 🔧 Development

### Project Structure:
```
chrome-extension/
├── manifest.json      # Extension configuration
├── content.js         # Content script for auto-scroll
├── background.js      # Background service worker
├── popup.html         # Popup UI
├── popup.js           # Popup logic
├── icons/             # Extension icons
└── README.md          # This file
```

### Building Icons:
Replace the placeholder PNG files in the `icons/` folder with actual 16x16, 32x32, 48x48, and 128x128 PNG icons generated from `icons/icon.svg`.

### Testing:
1. Load the extension in Chrome (developer mode)
2. Open multiple tabs with different websites
3. Test popup controls and keyboard shortcuts
4. Verify settings persistence
5. Test integration with web tool

## 🎨 Professional Features

### User Experience:
- **Smooth Animations**: Modern CSS transitions and hover effects
- **Responsive Design**: Adapts to different popup sizes
- **Visual Feedback**: Clear indicators for scrolling status
- **Intuitive Controls**: Easy-to-understand buttons and controls
- **Real-time Updates**: Instant status changes reflected in UI

### Technical Excellence:
- **Error Handling**: Graceful handling of edge cases
- **Performance**: Efficient messaging and minimal resource usage
- **Security**: Proper permissions and secure messaging
- **Compatibility**: Works with modern Chrome browsers
- **Extensibility**: Modular design for future enhancements

## 🤝 Integration with Web Tool

The extension automatically integrates with the AutoScroll Pro web tool:
- Shared settings via Chrome storage
- Real-time tab status synchronization
- Cross-interface control capabilities
- Unified user experience across both tools

## 📱 Support

For issues, suggestions, or feature requests:
- Check the console for error messages
- Verify Chrome extension permissions
- Ensure websites allow programmatic scrolling
- Test with simple websites first

## 📄 License

AutoScroll Pro Extension - Professional Auto-Scroll Solution
Version 1.0.0