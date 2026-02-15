// Content Script for AutoScroll Pro Extension
class AutoScrollManager {
  constructor() {
    this.isScrolling = false;
    this.scrollInterval = null;
    this.settings = {
      speed: 50,
      direction: 'down',
      smooth: true,
      autoStart: false
    };
    this.tabId = null;
    
    this.init();
  }
  
  async init() {
    // Get current tab ID
    const tabs = await chrome.runtime.sendMessage({ action: 'getCurrentTabId' });
    if (tabs && tabs[0]) {
      this.tabId = tabs[0].id;
    }
    
    // Load settings from storage
    this.loadSettings();
    
    // Listen for messages from popup and background
    chrome.runtime.onMessage.addListener(this.handleMessage.bind(this));
    
    // Auto-start if enabled
    if (this.settings.autoStart) {
      setTimeout(() => {
        this.startScrolling();
      }, 1000);
    }
  }
  
  async loadSettings() {
    try {
      const result = await chrome.storage.sync.get(['autoscrollSettings']);
      if (result.autoscrollSettings) {
        this.settings = { ...this.settings, ...result.autoscrollSettings };
      }
    } catch (error) {
      console.log('Could not load settings:', error);
    }
  }
  
  async saveSettings() {
    try {
      await chrome.storage.sync.set({ autoscrollSettings: this.settings });
    } catch (error) {
      console.log('Could not save settings:', error);
    }
  }
  
  handleMessage(request, sender, sendResponse) {
    switch (request.action) {
      case 'startScrolling':
        this.startScrolling();
        sendResponse({ success: true, isScrolling: this.isScrolling });
        break;
        
      case 'stopScrolling':
        this.stopScrolling();
        sendResponse({ success: true, isScrolling: this.isScrolling });
        break;
        
      case 'toggleScrolling':
        this.toggleScrolling();
        sendResponse({ success: true, isScrolling: this.isScrolling });
        break;
        
      case 'updateSettings':
        this.settings = { ...this.settings, ...request.settings };
        this.saveSettings();
        if (this.isScrolling) {
          this.restartScrolling();
        }
        sendResponse({ success: true, settings: this.settings });
        break;
        
      case 'getScrollStatus':
        sendResponse({ 
          isScrolling: this.isScrolling, 
          settings: this.settings,
          tabId: this.tabId
        });
        break;
        
      case 'resetScroll':
        this.resetScroll();
        sendResponse({ success: true });
        break;
        
      default:
        sendResponse({ success: false, error: 'Unknown action' });
    }
    
    return true; // Keep message channel open for async response
  }
  
  startScrolling() {
    if (this.isScrolling) return;
    
    this.isScrolling = true;
    const scrollAmount = this.settings.direction === 'down' ? this.settings.speed : -this.settings.speed;
    
    this.scrollInterval = setInterval(() => {
      try {
        window.scrollBy({
          top: scrollAmount,
          behavior: this.settings.smooth ? 'smooth' : 'auto'
        });
      } catch (error) {
        console.error('Scroll error:', error);
        this.stopScrolling();
      }
    }, 100);
    
    // Notify background script
    if (this.tabId) {
      chrome.runtime.sendMessage({
        action: 'scrollStatusChanged',
        tabId: this.tabId,
        isScrolling: true,
        url: window.location.href
      });
    }
  }
  
  stopScrolling() {
    if (!this.isScrolling) return;
    
    this.isScrolling = false;
    if (this.scrollInterval) {
      clearInterval(this.scrollInterval);
      this.scrollInterval = null;
    }
    
    // Notify background script
    if (this.tabId) {
      chrome.runtime.sendMessage({
        action: 'scrollStatusChanged',
        tabId: this.tabId,
        isScrolling: false,
        url: window.location.href
      });
    }
  }
  
  toggleScrolling() {
    if (this.isScrolling) {
      this.stopScrolling();
    } else {
      this.startScrolling();
    }
  }
  
  restartScrolling() {
    if (this.isScrolling) {
      this.stopScrolling();
      this.startScrolling();
    }
  }
  
  resetScroll() {
    try {
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    } catch (error) {
      console.error('Reset scroll error:', error);
    }
  }
  
  // Cleanup when tab is closed
  destroy() {
    this.stopScrolling();
  }
}

// Initialize the auto-scroll manager
const autoScrollManager = new AutoScrollManager();

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
  autoScrollManager.destroy();
});

// Listen for keyboard shortcuts
document.addEventListener('keydown', (event) => {
  // Ctrl+Shift+S to toggle scrolling
  if (event.ctrlKey && event.shiftKey && event.key === 'S') {
    event.preventDefault();
    autoScrollManager.toggleScrolling();
  }
  
  // Ctrl+Shift+R to reset scroll
  if (event.ctrlKey && event.shiftKey && event.key === 'R') {
    event.preventDefault();
    autoScrollManager.resetScroll();
  }
});