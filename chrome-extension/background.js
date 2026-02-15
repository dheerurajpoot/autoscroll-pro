// Background Service Worker for AutoScroll Pro Extension
class AutoScrollBackground {
  constructor() {
    this.activeTabs = new Map(); // tabId -> { isScrolling, url, title }
    this.init();
  }
  
  init() {
    // Listen for messages from content scripts and popup
    chrome.runtime.onMessage.addListener(this.handleMessage.bind(this));
    
    // Listen for tab updates
    chrome.tabs.onUpdated.addListener(this.handleTabUpdate.bind(this));
    
    // Listen for tab removal
    chrome.tabs.onRemoved.addListener(this.handleTabRemoved.bind(this));
    
    // Listen for keyboard shortcuts (manifest v3 doesn't support this directly)
    // We'll handle this through content scripts
    
    console.log('AutoScroll Pro Extension background service worker initialized');
  }
  
  async handleMessage(request, sender, sendResponse) {
    switch (request.action) {
      case 'getCurrentTabId':
        try {
          const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
          sendResponse(tabs);
        } catch (error) {
          console.error('Error getting current tab:', error);
          sendResponse([]);
        }
        break;
        
      case 'scrollStatusChanged':
        this.updateTabStatus(request.tabId, {
          isScrolling: request.isScrolling,
          url: request.url
        });
        // Broadcast to popup
        this.broadcastToPopup({
          action: 'tabStatusUpdated',
          tabId: request.tabId,
          status: this.activeTabs.get(request.tabId)
        });
        sendResponse({ success: true });
        break;
        
      case 'getAllTabStatus':
        const status = this.getTabStatus();
        sendResponse({ success: true, tabs: status });
        break;
        
      case 'controlAllTabs':
        await this.controlAllTabs(request.command);
        sendResponse({ success: true });
        break;
        
      case 'getTabInfo':
        try {
          const tab = await chrome.tabs.get(request.tabId);
          sendResponse({ success: true, tab: tab });
        } catch (error) {
          sendResponse({ success: false, error: error.message });
        }
        break;
        
      case 'closeTab':
        try {
          await chrome.tabs.remove(request.tabId);
          sendResponse({ success: true });
        } catch (error) {
          sendResponse({ success: false, error: error.message });
        }
        break;
        
      default:
        sendResponse({ success: false, error: 'Unknown action' });
    }
    
    return true; // Keep message channel open for async response
  }
  
  handleTabUpdate(tabId, changeInfo, tab) {
    // Update tab information if it exists in our tracking
    if (this.activeTabs.has(tabId)) {
      const tabStatus = this.activeTabs.get(tabId);
      if (changeInfo.url) {
        tabStatus.url = changeInfo.url;
      }
      if (tab.title) {
        tabStatus.title = tab.title;
      }
      this.activeTabs.set(tabId, tabStatus);
    }
    
    // Remove tracking if tab is closed
    if (changeInfo.status === 'loading' && !tab.url) {
      this.activeTabs.delete(tabId);
    }
  }
  
  handleTabRemoved(tabId, removeInfo) {
    this.activeTabs.delete(tabId);
    // Broadcast update to popup
    this.broadcastToPopup({
      action: 'tabStatusUpdated',
      tabId: tabId,
      status: null
    });
  }
  
  updateTabStatus(tabId, status) {
    if (!this.activeTabs.has(tabId)) {
      this.activeTabs.set(tabId, {
        isScrolling: false,
        url: '',
        title: ''
      });
    }
    
    const tabStatus = this.activeTabs.get(tabId);
    Object.assign(tabStatus, status);
    this.activeTabs.set(tabId, tabStatus);
  }
  
  getTabStatus() {
    const result = [];
    for (const [tabId, status] of this.activeTabs) {
      result.push({
        tabId,
        ...status
      });
    }
    return result;
  }
  
  async controlAllTabs(command) {
    const tabs = Array.from(this.activeTabs.keys());
    
    for (const tabId of tabs) {
      try {
        await chrome.tabs.sendMessage(tabId, { action: command });
      } catch (error) {
        console.error(`Error sending message to tab ${tabId}:`, error);
        // Remove tab from tracking if it's no longer available
        this.activeTabs.delete(tabId);
      }
    }
  }
  
  async broadcastToPopup(message) {
    try {
      // Send to popup if it's open
      const response = await chrome.runtime.sendMessage(message);
    } catch (error) {
      // Popup might not be open, which is fine
      console.debug('Could not send message to popup:', error.message);
    }
  }
  
  // Get all tabs with auto-scroll content script
  async getAllAutoScrollTabs() {
    try {
      const tabs = await chrome.tabs.query({});
      const autoScrollTabs = [];
      
      for (const tab of tabs) {
        try {
          const response = await chrome.tabs.sendMessage(tab.id, { action: 'getScrollStatus' });
          if (response && response.tabId) {
            autoScrollTabs.push({
              tabId: tab.id,
              url: tab.url,
              title: tab.title,
              isScrolling: response.isScrolling,
              settings: response.settings
            });
          }
        } catch (error) {
          // Content script not available in this tab
          continue;
        }
      }
      
      return autoScrollTabs;
    } catch (error) {
      console.error('Error getting auto-scroll tabs:', error);
      return [];
    }
  }
}

// Initialize the background service
const autoScrollBackground = new AutoScrollBackground();

// Export for testing (if needed)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AutoScrollBackground;
}