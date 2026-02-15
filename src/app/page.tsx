'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Play, Pause, RotateCcw, Plus, Trash2, ExternalLink, Settings, ArrowDown, ArrowUp, Zap, Moon, Sun, Monitor, Square, SquareDashedBottom, SquareDashedBottomCode, Download, CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface LinkItem {
  id: string;
  url: string;
  title: string;
  windowRef: Window | null;
}

interface ScrollSettings {
  speed: number;
  direction: 'down' | 'up';
  smooth: boolean;
  autoStart: boolean;
}

export default function AutoScrollApp() {
  const [links, setLinks] = useState<LinkItem[]>([]);
  const [newLink, setNewLink] = useState('');
  const [isScrolling, setIsScrolling] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [isExtensionInstalled, setIsExtensionInstalled] = useState(false);
  const [showInstallGuide, setShowInstallGuide] = useState(false);
  const [settings, setSettings] = useState<ScrollSettings>({
    speed: 50,
    direction: 'down',
    smooth: true,
    autoStart: true
  });
  
  const scrollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const windowRefs = useRef<Record<string, Window | null>>({});
  
  // Load data from localStorage on mount
  useEffect(() => {
    const savedLinks = localStorage.getItem('autoscroll-links');
    const savedSettings = localStorage.getItem('autoscroll-settings');
    const savedDarkMode = localStorage.getItem('autoscroll-darkmode');
    
    if (savedLinks) {
      try {
        const parsedLinks = JSON.parse(savedLinks);
        setLinks(parsedLinks);
        // Restore window references
        parsedLinks.forEach((link: LinkItem) => {
          windowRefs.current[link.id] = link.windowRef;
        });
      } catch (e) {
        console.error('Failed to parse saved links:', e);
      }
    }
    
    if (savedSettings) {
      try {
        setSettings(JSON.parse(savedSettings));
      } catch (e) {
        console.error('Failed to parse saved settings:', e);
      }
    }
    
    if (savedDarkMode) {
      setDarkMode(JSON.parse(savedDarkMode));
    }
  }, []);
  
  // Apply dark mode class to document
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('autoscroll-darkmode', JSON.stringify(darkMode));
  }, [darkMode]);
  
  // Save data to localStorage when it changes
  useEffect(() => {
    // Save links without window references (they can't be serialized)
    const linksToSave = links.map(link => ({
      ...link,
      windowRef: null
    }));
    localStorage.setItem('autoscroll-links', JSON.stringify(linksToSave));
  }, [links]);
  
  useEffect(() => {
    localStorage.setItem('autoscroll-settings', JSON.stringify(settings));
  }, [settings]);
  
  const addLink = () => {
    if (!newLink.trim()) return;
    
    try {
      const url = new URL(newLink.startsWith('http') ? newLink : `https://${newLink}`);
      const newLinkItem: LinkItem = {
        id: Date.now().toString(),
        url: url.href,
        title: url.hostname,
        windowRef: null
      };
      
      setLinks(prev => [...prev, newLinkItem]);
      setNewLink('');
      toast.success('Link added successfully');
      
      // Auto-open and start scrolling for the new link
      if (settings.autoStart) {
        setTimeout(() => {
          openAndScrollLink(newLinkItem);
        }, 300);
      }
    } catch (e) {
      toast.error('Please enter a valid URL');
    }
  };
  
  const removeLink = (id: string) => {
    // Close window if it exists
    const windowRef = windowRefs.current[id];
    if (windowRef && !windowRef.closed) {
      windowRef.close();
    }
    
    setLinks(prev => prev.filter(link => link.id !== id));
    delete windowRefs.current[id];
    toast.success('Link removed');
  };
  
  const openAndScrollLink = (link: LinkItem) => {
    try {
      // Open URL in new window
      const newWindow = window.open(link.url, `_blank`, 'width=800,height=600,scrollbars=yes,resizable=yes');
      
      if (newWindow) {
        // Store window reference
        windowRefs.current[link.id] = newWindow;
        
        // Update link with window reference
        setLinks(prev => prev.map(l => 
          l.id === link.id ? { ...l, windowRef: newWindow } : l
        ));
        
        toast.success(`Opened ${link.title} in new window`);
      } else {
        toast.error('Failed to open window - please allow popups');
      }
    } catch (error) {
      toast.error('Failed to open window');
      console.error('Error opening window:', error);
    }
  };
  
  const closeWindow = (linkId: string) => {
    const windowRef = windowRefs.current[linkId];
    if (windowRef && !windowRef.closed) {
      windowRef.close();
      windowRefs.current[linkId] = null;
      
      setLinks(prev => prev.map(l => 
        l.id === linkId ? { ...l, windowRef: null } : l
      ));
      
      toast.success('Window closed');
    }
  };
  
  const closeAllWindows = () => {
    links.forEach(link => {
      if (link.windowRef && !link.windowRef.closed) {
        link.windowRef.close();
      }
    });
    
    // Clear all window references
    Object.keys(windowRefs.current).forEach(key => {
      windowRefs.current[key] = null;
    });
    
    // Clear window references from links
    setLinks(prev => prev.map(l => ({ ...l, windowRef: null })));
    
    toast.success('All windows closed');
  };
  
  const openAllWindows = () => {
    links.forEach(link => {
      if (!link.windowRef || link.windowRef.closed) {
        openAndScrollLink(link);
      }
    });
    
    toast.success('Opening all windows');
  };
  
  const startScrolling = () => {
    if (links.length === 0) {
      toast.error('No links to scroll');
      return;
    }
    
    setIsScrolling(true);
    
    const scrollAmount = settings.direction === 'down' ? settings.speed : -settings.speed;
    
    scrollIntervalRef.current = setInterval(() => {
      try {
        links.forEach(link => {
          if (link.windowRef && !link.windowRef.closed) {
            try {
              link.windowRef.scrollBy({
                top: scrollAmount,
                behavior: settings.smooth ? 'smooth' : 'auto'
              });
            } catch (e) {
              // Cross-origin error for this specific window
              console.warn(`Cannot scroll window ${link.title}:`, e);
            }
          }
        });
      } catch (e) {
        console.error('Scrolling error:', e);
        stopScrolling();
      }
    }, 100);
  };
  
  const stopScrolling = () => {
    setIsScrolling(false);
    if (scrollIntervalRef.current) {
      clearInterval(scrollIntervalRef.current);
      scrollIntervalRef.current = null;
    }
  };
  
  const resetScroll = () => {
    if (links.length === 0) return;
    
    links.forEach(link => {
      if (link.windowRef && !link.windowRef.closed) {
        try {
          link.windowRef.scrollTo({ top: 0, behavior: 'smooth' });
        } catch (e) {
          // Handle cross-origin restrictions
          console.warn(`Cannot reset scroll for ${link.title}:`, e);
        }
      }
    });
    
    toast.success('All windows scrolled to top');
  };
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      addLink();
    }
  };
  
  const updateSetting = <K extends keyof ScrollSettings>(key: K, value: ScrollSettings[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };
  
  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };
  
  // Check if extension is installed
  const checkExtensionInstallation = async () => {
    try {
      // Type-safe Chrome API access
      const chromeRuntime = (globalThis as any).chrome?.runtime;
      if (!chromeRuntime) return;
      
      // Try to send a message to the extension
      const response = await chromeRuntime.sendMessage('autoscroll-pro-extension', { action: 'ping' });
      if (response && response.success) {
        setIsExtensionInstalled(true);
        toast.success('Chrome Extension detected and connected!');
      }
    } catch (error) {
      // Extension not installed or not responding
      setIsExtensionInstalled(false);
    }
  };
  
  const installExtension = () => {
    setShowInstallGuide(true);
  };
  
  const closeInstallGuide = () => {
    setShowInstallGuide(false);
  };
  
  // Check extension status on mount
  useEffect(() => {
    // Only check if we're in a browser environment
    const chromeRuntime = (globalThis as any).chrome?.runtime;
    if (chromeRuntime) {
      checkExtensionInstallation();
      
      // Set up listener for extension installation
      const checkInterval = setInterval(checkExtensionInstallation, 3000);
      return () => clearInterval(checkInterval);
    }
  }, []);
  
  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      darkMode 
        ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900' 
        : 'bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50'
    } p-4 md:p-8`}>
      <div className="max-w-7xl mx-auto">
        <header className="text-center mb-8 relative">
          <div className="absolute top-0 right-0 flex items-center gap-2">
            {isExtensionInstalled ? (
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-xs font-medium">
                <CheckCircle className="w-4 h-4" />
                Extension Active
              </div>
            ) : (
              <Button
                onClick={installExtension}
                className="flex items-center gap-2 h-8 px-3 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white text-xs font-medium"
              >
                <Download className="w-4 h-4" />
                Install Extension
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleDarkMode}
              className="rounded-full"
            >
              {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </Button>
          </div>
          
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 mb-4">
            <Zap className="w-8 h-8 text-white" />
          </div>
          
          <h1 className={`text-5xl font-bold mb-3 bg-gradient-to-r ${
            darkMode 
              ? 'from-blue-400 to-purple-400' 
              : 'from-blue-600 to-purple-600'
          } bg-clip-text text-transparent`}>AutoScroll Pro</h1>
          
          <p className={`text-lg max-w-2xl mx-auto ${
            darkMode ? 'text-gray-300' : 'text-gray-600'
          }`}>
            Add websites and control automatic scrolling in separate windows with customizable speed and direction
          </p>
          
          <div className={`mt-4 p-3 rounded-lg inline-flex items-center gap-2 ${
            darkMode ? 'bg-gray-800/50' : 'bg-white/50'
          }`}>
            <div className={`w-2 h-2 rounded-full ${isScrolling ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
            <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              {isScrolling ? 'Scrolling active' : 'Scrolling paused'}
            </span>
          </div>
        </header>
        
        {/* Main Controls */}
        <div className={`mb-8 p-6 rounded-xl shadow-lg ${
          darkMode ? 'bg-gray-800/50 backdrop-blur-sm' : 'bg-white/80 backdrop-blur-sm'
        }`}>
          <div className="flex flex-wrap gap-4 justify-center">
            <Button
              onClick={isScrolling ? stopScrolling : startScrolling}
              className={`px-8 py-3 rounded-lg text-lg font-medium ${
                isScrolling 
                  ? 'bg-red-500 hover:bg-red-600' 
                  : 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700'
              }`}
            >
              {isScrolling ? (
                <>
                  <Pause className="w-6 h-6 mr-2" />
                  Pause All
                </>
              ) : (
                <>
                  <Play className="w-6 h-6 mr-2" />
                  Start All
                </>
              )}
            </Button>
            
            <Button
              onClick={resetScroll}
              variant="outline"
              className={`px-6 py-3 rounded-lg ${
                darkMode ? 'border-gray-600 hover:bg-gray-700' : ''
              }`}
            >
              <RotateCcw className="w-5 h-5 mr-2" />
              Reset All
            </Button>
            
            <Button
              onClick={openAllWindows}
              variant="outline"
              className={`px-6 py-3 rounded-lg ${
                darkMode ? 'border-gray-600 hover:bg-gray-700' : ''
              }`}
            >
              <SquareDashedBottom className="w-5 h-5 mr-2" />
              Open All Windows
            </Button>
            
            <Button
              onClick={closeAllWindows}
              variant="outline"
              className={`px-6 py-3 rounded-lg ${
                darkMode ? 'border-gray-600 hover:bg-gray-700' : ''
              }`}
            >
              <Square className="w-5 h-5 mr-2" />
              Close All Windows
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Links Panel */}
          <Card className={`lg:col-span-1 border-0 shadow-xl ${
            darkMode ? 'bg-gray-800/50 backdrop-blur-sm' : 'bg-white/80 backdrop-blur-sm'
          }`}>
            <CardHeader>
              <CardTitle className={`flex items-center gap-3 ${
                darkMode ? 'text-white' : 'text-gray-900'
              }`}>
                <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                  <ExternalLink className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                Websites ({links.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-3">
                <div className={`flex-1 relative rounded-lg overflow-hidden ${
                  darkMode ? 'bg-gray-700' : 'bg-gray-100'
                }`}>
                  <Input
                    placeholder="https://example.com"
                    value={newLink}
                    onChange={(e) => setNewLink(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className={`border-0 focus-visible:ring-0 focus-visible:ring-offset-0 h-12 px-4 ${
                      darkMode ? 'bg-gray-700 text-white placeholder-gray-400' : 'bg-gray-100'
                    }`}
                  />
                </div>
                <Button 
                  onClick={addLink} 
                  size="icon"
                  className="h-12 w-12 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                >
                  <Plus className="w-5 h-5" />
                </Button>
              </div>
              
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {links.map((link) => (
                  <div
                    key={link.id}
                    className={`flex items-center justify-between p-4 rounded-xl border transition-all duration-200 hover:shadow-md ${
                      link.windowRef && !link.windowRef.closed
                        ? 'border-green-500 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 shadow-lg'
                        : `${darkMode ? 'border-gray-700 bg-gray-800/50 hover:bg-gray-700/50' : 'border-gray-200 bg-white/50 hover:bg-gray-50'} border-0`
                    }`}
                  >
                    <div className="flex-1">
                      <div className={`font-semibold text-sm truncate ${
                        darkMode ? 'text-white' : 'text-gray-900'
                      }`}>
                        {link.title}
                      </div>
                      <div className={`text-xs truncate mt-1 ${
                        darkMode ? 'text-gray-400' : 'text-gray-500'
                      }`}>
                        {link.url}
                      </div>
                      <div className={`text-xs mt-1 ${
                        link.windowRef && !link.windowRef.closed
                          ? 'text-green-600 dark:text-green-400'
                          : darkMode ? 'text-gray-500' : 'text-gray-400'
                      }`}>
                        {link.windowRef && !link.windowRef.closed ? '✓ Window Open' : 'Window Closed'}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openAndScrollLink(link)}
                        disabled={!!(link.windowRef && !link.windowRef.closed)}
                        className={`rounded-full ${
                          link.windowRef && !link.windowRef.closed
                            ? 'text-gray-400 cursor-not-allowed'
                            : `${darkMode ? 'text-blue-400 hover:bg-blue-900/30' : 'text-blue-600 hover:bg-blue-100'} hover:text-blue-700`
                        }`}
                      >
                        <SquareDashedBottomCode className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => closeWindow(link.id)}
                        disabled={!link.windowRef || link.windowRef.closed}
                        className={`rounded-full ${
                          !link.windowRef || link.windowRef.closed
                            ? 'text-gray-400 cursor-not-allowed'
                            : `${darkMode ? 'text-red-400 hover:bg-red-900/30' : 'text-red-600 hover:bg-red-100'} hover:text-red-700`
                        }`}
                      >
                        <Square className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeLink(link.id)}
                        className={`rounded-full hover:bg-red-100 dark:hover:bg-red-900/30 ${
                          darkMode ? 'text-gray-400 hover:text-red-400' : 'text-gray-500 hover:text-red-500'
                        }`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                
                {links.length === 0 && (
                  <div className={`text-center py-12 rounded-xl ${
                    darkMode ? 'bg-gray-800/30' : 'bg-gray-100/50'
                  }`}>
                    <div className="p-4 inline-flex rounded-full bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 mb-4">
                      <ExternalLink className={`w-12 h-12 ${
                        darkMode ? 'text-blue-400' : 'text-blue-600'
                      }`} />
                    </div>
                    <p className={`text-lg font-medium mb-2 ${
                      darkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>No websites added yet</p>
                    <p className={`text-sm ${
                      darkMode ? 'text-gray-400' : 'text-gray-500'
                    }`}>
                      Add websites to open them in separate windows and control auto-scrolling
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
          
          {/* Status Panel */}
          <Card className={`lg:col-span-2 border-0 shadow-xl ${
            darkMode ? 'bg-gray-800/50 backdrop-blur-sm' : 'bg-white/80 backdrop-blur-sm'
          }`}>
            <CardHeader>
              <CardTitle className={`flex items-center gap-3 ${
                darkMode ? 'text-white' : 'text-gray-900'
              }`}>
                <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                  <Monitor className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                </div>
                Window Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              {links.length > 0 ? (
                <div className="space-y-6">
                  <div className={`p-4 rounded-xl ${
                    darkMode ? 'bg-gray-700/30' : 'bg-gray-100/50'
                  }`}>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                      <div>
                        <div className={`text-2xl font-bold ${
                          darkMode ? 'text-white' : 'text-gray-900'
                        }`}>
                          {links.length}
                        </div>
                        <div className={`text-sm ${
                          darkMode ? 'text-gray-400' : 'text-gray-500'
                        }`}>
                          Total Windows
                        </div>
                      </div>
                      <div>
                        <div className={`text-2xl font-bold ${
                          darkMode ? 'text-green-400' : 'text-green-600'
                        }`}>
                          {links.filter(l => l.windowRef && !l.windowRef.closed).length}
                        </div>
                        <div className={`text-sm ${
                          darkMode ? 'text-gray-400' : 'text-gray-500'
                        }`}>
                          Active Windows
                        </div>
                      </div>
                      <div>
                        <div className={`text-2xl font-bold ${
                          isScrolling ? (darkMode ? 'text-blue-400' : 'text-blue-600') : (darkMode ? 'text-gray-400' : 'text-gray-500')
                        }`}>
                          {isScrolling ? 'ON' : 'OFF'}
                        </div>
                        <div className={`text-sm ${
                          darkMode ? 'text-gray-400' : 'text-gray-500'
                        }`}>
                          Auto Scroll
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className={`rounded-xl overflow-hidden ${
                    darkMode ? 'bg-gray-800' : 'bg-gray-50'
                  }`}>
                    <div className={`p-4 ${
                      darkMode ? 'bg-gray-900' : 'bg-gray-100'
                    }`}>
                      <h3 className={`font-medium ${
                        darkMode ? 'text-white' : 'text-gray-900'
                      }`}>
                        Active Windows ({links.filter(l => l.windowRef && !l.windowRef.closed).length})
                      </h3>
                    </div>
                    <div className="p-4 max-h-80 overflow-y-auto">
                      {links.filter(l => l.windowRef && !l.windowRef.closed).length > 0 ? (
                        <div className="space-y-3">
                          {links
                            .filter(l => l.windowRef && !l.windowRef.closed)
                            .map(link => (
                              <div 
                                key={link.id}
                                className={`p-3 rounded-lg border ${
                                  darkMode 
                                    ? 'border-green-800 bg-green-900/10' 
                                    : 'border-green-200 bg-green-50'
                                }`}
                              >
                                <div className="flex items-center justify-between">
                                  <div>
                                    <div className={`font-medium ${
                                      darkMode ? 'text-green-300' : 'text-green-700'
                                    }`}>
                                      {link.title}
                                    </div>
                                    <div className={`text-sm truncate ${
                                      darkMode ? 'text-green-400' : 'text-green-600'
                                    }`}>
                                      {link.url}
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <div className={`w-2 h-2 rounded-full bg-green-500 animate-pulse`} />
                                    <span className={`text-xs ${
                                      darkMode ? 'text-green-400' : 'text-green-600'
                                    }`}>
                                      Active
                                    </span>
                                  </div>
                                </div>
                              </div>
                            ))
                          }
                        </div>
                      ) : (
                        <div className={`text-center py-8 ${
                          darkMode ? 'text-gray-400' : 'text-gray-500'
                        }`}>
                          <Monitor className="w-12 h-12 mx-auto mb-3 opacity-50" />
                          <p>No active windows</p>
                          <p className="text-sm mt-1">Open windows to see them here</p>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {isScrolling && (
                    <div className={`p-4 rounded-xl text-center ${
                      darkMode 
                        ? 'bg-blue-900/20 text-blue-400 border border-blue-800/30' 
                        : 'bg-blue-50 text-blue-700 border border-blue-200'
                    }`}>
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-blue-500 animate-pulse" />
                        <span className="font-medium">
                          Auto-scrolling all windows {settings.direction === 'down' ? 'down' : 'up'} at {settings.speed}% speed
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className={`flex flex-col items-center justify-center h-96 rounded-xl ${
                  darkMode ? 'bg-gray-800/30' : 'bg-gray-100/50'
                }`}>
                  <div className="p-6 rounded-full bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 mb-6">
                    <Settings className={`w-16 h-16 ${
                      darkMode ? 'text-purple-400' : 'text-purple-600'
                    }`} />
                  </div>
                  <p className={`text-xl font-semibold mb-3 ${
                    darkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    No websites added
                  </p>
                  <p className={`text-center max-w-md ${
                    darkMode ? 'text-gray-400' : 'text-gray-500'
                  }`}>
                    Add websites to open them in separate windows and control auto-scrolling
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        
        {/* Settings Panel */}
        <Card className={`mt-6 border-0 shadow-xl ${
          darkMode ? 'bg-gray-800/50 backdrop-blur-sm' : 'bg-white/80 backdrop-blur-sm'
        }`}>
          <CardHeader>
            <CardTitle className={`flex items-center gap-3 ${
              darkMode ? 'text-white' : 'text-gray-900'
            }`}>
              <div className="p-2 rounded-lg bg-indigo-100 dark:bg-indigo-900/30">
                <Settings className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              </div>
              Scroll Settings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className={`p-4 rounded-xl ${
                darkMode ? 'bg-gray-700/30' : 'bg-gray-100/50'
              }`}>
                <Label className={`font-medium ${
                  darkMode ? 'text-white' : 'text-gray-900'
                }`}>Scroll Speed</Label>
                <Slider
                  value={[settings.speed]}
                  onValueChange={([value]) => updateSetting('speed', value)}
                  max={100}
                  min={1}
                  step={1}
                  className="w-full mt-3 mb-2"
                />
                <div className={`text-sm ${
                  darkMode ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  {settings.speed}%
                </div>
              </div>
              
              <div className={`p-4 rounded-xl ${
                darkMode ? 'bg-gray-700/30' : 'bg-gray-100/50'
              }`}>
                <Label className={`font-medium ${
                  darkMode ? 'text-white' : 'text-gray-900'
                }`}>Direction</Label>
                <div className="flex gap-2 mt-3">
                  <Button
                    variant={settings.direction === 'down' ? 'default' : 'outline'}
                    onClick={() => updateSetting('direction', 'down')}
                    className={`flex-1 h-10 ${
                      settings.direction === 'down' 
                        ? 'bg-gradient-to-r from-blue-500 to-indigo-600' 
                        : darkMode ? 'border-gray-600 hover:bg-gray-700' : ''
                    }`}
                  >
                    <ArrowDown className="w-4 h-4 mr-2" />
                    Down
                  </Button>
                  <Button
                    variant={settings.direction === 'up' ? 'default' : 'outline'}
                    onClick={() => updateSetting('direction', 'up')}
                    className={`flex-1 h-10 ${
                      settings.direction === 'up' 
                        ? 'bg-gradient-to-r from-purple-500 to-pink-600' 
                        : darkMode ? 'border-gray-600 hover:bg-gray-700' : ''
                    }`}
                  >
                    <ArrowUp className="w-4 h-4 mr-2" />
                    Up
                  </Button>
                </div>
              </div>
              
              <div className={`p-4 rounded-xl ${
                darkMode ? 'bg-gray-700/30' : 'bg-gray-100/50'
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <Label className={`font-medium ${
                    darkMode ? 'text-white' : 'text-gray-900'
                  }`}>Smooth Scrolling</Label>
                  <Switch
                    checked={settings.smooth}
                    onCheckedChange={(checked) => updateSetting('smooth', checked)}
                  />
                </div>
                <p className={`text-xs ${
                  darkMode ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  Enable smooth animation for scrolling
                </p>
              </div>
              
              <div className={`p-4 rounded-xl ${
                darkMode ? 'bg-gray-700/30' : 'bg-gray-100/50'
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <Label className={`font-medium ${
                    darkMode ? 'text-white' : 'text-gray-900'
                  }`}>Auto Start</Label>
                  <Switch
                    checked={settings.autoStart}
                    onCheckedChange={(checked) => updateSetting('autoStart', checked)}
                  />
                </div>
                <p className={`text-xs ${
                  darkMode ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  Start scrolling automatically when opening windows
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Extension Installation Guide Modal */}
        {showInstallGuide && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className={`max-w-2xl w-full rounded-2xl shadow-2xl ${
              darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
            }`}>
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                      <Download className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        Install AutoScroll Pro Extension
                      </h2>
                      <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        Enhance your auto-scrolling experience across all websites
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={closeInstallGuide}
                    className={darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-900'}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </Button>
                </div>
              </div>
              
              <div className="p-6">
                <div className="space-y-6">
                  <div className={`p-4 rounded-xl ${darkMode ? 'bg-gray-700/50' : 'bg-blue-50'}`}>
                    <h3 className={`font-semibold flex items-center gap-2 ${darkMode ? 'text-blue-300' : 'text-blue-800'}`}>
                      <AlertCircle className="w-5 h-5" />
                      Why Install the Extension?
                    </h3>
                    <ul className={`mt-3 space-y-2 text-sm ${darkMode ? 'text-blue-200' : 'text-blue-700'}`}>
                      <li>• Auto-scroll any website without popup restrictions</li>
                      <li>• Control multiple tabs simultaneously from one interface</li>
                      <li>• Keyboard shortcuts for instant control (Ctrl+Shift+S)</li>
                      <li>• Works seamlessly with this web tool</li>
                    </ul>
                  </div>
                  
                  <div>
                    <h3 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      Installation Steps
                    </h3>
                    <div className="space-y-4">
                      <div className={`flex items-start gap-4 p-4 rounded-lg ${darkMode ? 'bg-gray-700/30' : 'bg-gray-50'}`}>
                        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${darkMode ? 'bg-gray-600 text-gray-300' : 'bg-gray-200 text-gray-700'} font-bold`}>
                          1
                        </div>
                        <div>
                          <h4 className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                            Open Chrome Extensions
                          </h4>
                          <p className={`text-sm mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            Navigate to chrome://extensions/ in your browser
                          </p>
                        </div>
                      </div>
                      
                      <div className={`flex items-start gap-4 p-4 rounded-lg ${darkMode ? 'bg-gray-700/30' : 'bg-gray-50'}`}>
                        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${darkMode ? 'bg-gray-600 text-gray-300' : 'bg-gray-200 text-gray-700'} font-bold`}>
                          2
                        </div>
                        <div>
                          <h4 className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                            Enable Developer Mode
                          </h4>
                          <p className={`text-sm mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            Toggle the &quot;Developer mode&quot; switch in the top-right corner
                          </p>
                        </div>
                      </div>
                      
                      <div className={`flex items-start gap-4 p-4 rounded-lg ${darkMode ? 'bg-gray-700/30' : 'bg-gray-50'}`}>
                        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${darkMode ? 'bg-gray-600 text-gray-300' : 'bg-gray-200 text-gray-700'} font-bold`}>
                          3
                        </div>
                        <div>
                          <h4 className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                            Load Extension
                          </h4>
                          <p className={`text-sm mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            Click &quot;Load unpacked&quot; and select the chrome-extension folder
                          </p>
                        </div>
                      </div>
                      
                      <div className={`flex items-start gap-4 p-4 rounded-lg ${darkMode ? 'bg-gray-700/30' : 'bg-gray-50'}`}>
                        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${darkMode ? 'bg-gray-600 text-gray-300' : 'bg-gray-200 text-gray-700'} font-bold`}>
                          4
                        </div>
                        <div>
                          <h4 className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                            Pin the Extension
                          </h4>
                          <p className={`text-sm mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            Click the puzzle icon and pin &quot;AutoScroll Pro&quot; for easy access
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className={`p-4 rounded-xl ${darkMode ? 'bg-green-900/20 border border-green-800/30' : 'bg-green-50 border border-green-200'}`}>
                    <h3 className={`font-semibold flex items-center gap-2 ${darkMode ? 'text-green-300' : 'text-green-800'}`}>
                      <CheckCircle className="w-5 h-5" />
                      Auto-Scroll Capabilities
                    </h3>
                    <p className={`mt-2 text-sm ${darkMode ? 'text-green-200' : 'text-green-700'}`}>
                      Once installed, the extension will automatically detect and control auto-scrolling on any website you open. You can control all opened windows simultaneously, use keyboard shortcuts, and manage settings from either the extension popup or this web tool.
                    </p>
                  </div>
                </div>
              </div>
              
              <div className={`p-4 border-t ${darkMode ? 'border-gray-700 bg-gray-800/50' : 'border-gray-200 bg-gray-50'}`}>
                <div className="flex justify-end gap-3">
                  <Button
                    variant="outline"
                    onClick={closeInstallGuide}
                    className={darkMode ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : ''}
                  >
                    Close
                  </Button>
                  <Button
                    onClick={() => {
                      window.open('chrome://extensions/', '_blank');
                      closeInstallGuide();
                    }}
                    className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Open Extensions Page
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}