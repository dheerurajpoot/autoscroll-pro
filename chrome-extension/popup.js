// Popup Script for AutoScroll Pro Extension
class AutoScrollPopup {
  constructor() {
    this.tabs = [];
    this.settings = {
      speed: 50,
      autoStart: false
    };
    
    this.init();
  }
  
  async init() {
    // Load settings
    await this.loadSettings();
    
    // Setup event listeners
    this.setupEventListeners();
    
    // Initial update
    await this.updateTabList();
    this.updateUI();
    
    // Set up periodic updates
    setInterval(() => {
      this.updateTabList();
    }, 2000);
  }
  
  setupEventListeners() {
    // Main control buttons
    document.getElementById('startAllBtn').addEventListener('click', () => {
      this.controlAllTabs('startScrolling');
    });
    
    document.getElementById('stopAllBtn').addEventListener('click', () => {
      this.controlAllTabs('stopScrolling');
    });
    
    document.getElementById('resetAllBtn').addEventListener('click', () => {
      this.controlAllTabs('resetScroll');
    });
    
    document.getElementById('refreshBtn').addEventListener('click', () => {
      this.updateTabList();
    });
    
    // Settings controls
    document.getElementById('speedSlider').addEventListener('input', (e) => {
      const speed = parseInt(e.target.value);
      document.getElementById('speedValue').textContent = `${speed}%`;
      this.updateSetting('speed', speed);
    });
    
    document.getElementById('autoStartToggle').addEventListener('change', (e) => {
      this.updateSetting('autoStart', e.target.checked);
    });
  }
  
  async loadSettings() {
    try {
      const result = await chrome.storage.sync.get(['autoscrollSettings']);
      if (result.autoscrollSettings) {
        this.settings = { ...this.settings, ...result.autoscrollSettings };
        this.updateSettingsUI();
      }
    } catch (error) {
      console.log('Could not load settings:', error);
    }
  }
  
  updateSettingsUI() {
    document.getElementById('speedSlider').value = this.settings.speed;
    document.getElementById('speedValue').textContent = `${this.settings.speed}%`;
    document.getElementById('autoStartToggle').checked = this.settings.autoStart;
  }
  
  async updateSetting(key, value) {
    this.settings[key] = value;
    try {
      await chrome.storage.sync.set({ autoscrollSettings: this.settings });
      
      // Update all tabs with new settings
      for (const tab of this.tabs) {
        try {
          await chrome.tabs.sendMessage(tab.tabId, {
            action: 'updateSettings',
            settings: { [key]: value }
          });
        } catch (error) {
          console.log(`Could not update settings for tab ${tab.tabId}:`, error);
        }
      }
    } catch (error) {
      console.log('Could not save settings:', error);
    }
  }
  
  async updateTabList() {
    try {
      // Get tabs with auto-scroll content scripts
      const tabs = await this.getAllAutoScrollTabs();
      this.tabs = tabs;
      this.renderTabList();
      this.updateStatus();
    } catch (error) {
      console.error('Error updating tab list:', error);
    }
  }
  
  async getAllAutoScrollTabs() {
    try {
      const allTabs = await chrome.tabs.query({});
      const autoScrollTabs = [];
      
      for (const tab of allTabs) {
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
  
  renderTabList() {
    const tabsList = document.getElementById('tabsList');
    const tabsCount = document.getElementById('tabsCount');
    
    tabsCount.textContent = this.tabs.length;
    
    if (this.tabs.length === 0) {
      tabsList.innerHTML = `
        <div class="empty-state">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
          </svg>
          <div>No auto-scroll tabs found</div>
          <div class="keyboard-shortcuts">
            Press Ctrl+Shift+S to toggle scrolling on any page
          </div>
        </div>
      `;
      return;
    }
    
    tabsList.innerHTML = this.tabs.map(tab => `
      <div class="tab-item ${tab.isScrolling ? 'scrolling' : ''}" data-tab-id="${tab.tabId}">
        <div class="tab-header">
          <div class="tab-title" title="${tab.title}">${tab.title}</div>
          <div class="tab-actions">
            <button class="tab-btn ${tab.isScrolling ? 'pause' : 'play'}" 
                    onclick="autoScrollPopup.toggleTabScrolling(${tab.tabId})" 
                    title="${tab.isScrolling ? 'Pause' : 'Start'} scrolling">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                ${tab.isScrolling ? 
                  '<path d="M6 6h12v12H6z"/>' : 
                  '<path d="M8 5v14l11-7z"/>'
                }
              </svg>
            </button>
            <button class="tab-btn stop" 
                    onclick="autoScrollPopup.resetTabScroll(${tab.tabId})" 
                    title="Reset scroll position">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z"/>
              </svg>
            </button>
            <button class="tab-btn close" 
                    onclick="autoScrollPopup.closeTab(${tab.tabId})" 
                    title="Close tab">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
              </svg>
            </button>
          </div>
        </div>
        <div class="tab-url" title="${tab.url}">${this.formatUrl(tab.url)}</div>
      </div>
    `).join('');
  }
  
  formatUrl(url) {
    try {
      const urlObj = new URL(url);
      return `${urlObj.hostname}${urlObj.pathname}`;
    } catch (error) {
      return url;
    }
  }
  
  updateStatus() {
    const scrollingTabs = this.tabs.filter(tab => tab.isScrolling).length;
    const globalStatus = document.getElementById('globalStatus');
    const activeTabsCount = document.getElementById('activeTabsCount');
    const scrollingStatus = document.getElementById('scrollingStatus');
    
    globalStatus.className = `status-indicator ${scrollingTabs > 0 ? 'active' : ''}`;
    activeTabsCount.textContent = `${this.tabs.length} ${this.tabs.length === 1 ? 'tab' : 'tabs'}`;
    scrollingStatus.textContent = scrollingTabs > 0 ? `Scrolling (${scrollingTabs})` : 'Paused';
  }
  
  updateUI() {
    // Update main buttons based on current state
    const startAllBtn = document.getElementById('startAllBtn');
    const stopAllBtn = document.getElementById('stopAllBtn');
    
    const anyScrolling = this.tabs.some(tab => tab.isScrolling);
    const anyNotScrolling = this.tabs.some(tab => !tab.isScrolling);
    
    startAllBtn.disabled = !anyNotScrolling || this.tabs.length === 0;
    stopAllBtn.disabled = !anyScrolling || this.tabs.length === 0;
  }
  
  async toggleTabScrolling(tabId) {
    try {
      await chrome.tabs.sendMessage(tabId, { action: 'toggleScrolling' });
      await this.updateTabList();
    } catch (error) {
      console.error('Error toggling tab scrolling:', error);
    }
  }
  
  async resetTabScroll(tabId) {
    try {
      await chrome.tabs.sendMessage(tabId, { action: 'resetScroll' });
    } catch (error) {
      console.error('Error resetting tab scroll:', error);
    }
  }
  
  async closeTab(tabId) {
    try {
      await chrome.tabs.remove(tabId);
      await this.updateTabList();
    } catch (error) {
      console.error('Error closing tab:', error);
    }
  }
  
  async controlAllTabs(action) {
    try {
      // Send command to all tabs
      for (const tab of this.tabs) {
        try {
          await chrome.tabs.sendMessage(tab.tabId, { action: action });
        } catch (error) {
          console.log(`Could not send ${action} to tab ${tab.tabId}:`, error);
        }
      }
      
      // Update UI after a short delay
      setTimeout(() => {
        this.updateTabList();
      }, 500);
    } catch (error) {
      console.error('Error controlling all tabs:', error);
    }
  }
}

// Initialize the popup when DOM is loaded
let autoScrollPopup;
document.addEventListener('DOMContentLoaded', () => {
  autoScrollPopup = new AutoScrollPopup();
});

// Handle messages from background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'tabStatusUpdated' && autoScrollPopup) {
    autoScrollPopup.updateTabList();
  }
});