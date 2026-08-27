/* ============ LOCAL STORAGE MANAGER ============ */
var STORAGE_KEYS = {
  THEME: 'smart_ai_hub_theme',
  HISTORY: 'smart_ai_hub_history',
  DRAFTS: 'smart_ai_hub_drafts',
  PRO_USER: 'smart_ai_hub_pro_user',
  USAGE_PREFIX: 'smart_ai_hub_usage_',
  CUSTOM_API_KEY: 'smart_ai_hub_custom_api_key',
  CUSTOM_API_PROVIDER: 'smart_ai_hub_custom_api_provider'
};

var StorageManager = {
  applyTheme() {
    const theme = this.getTheme();
    document.body.setAttribute('data-theme', theme);
  },

  getTheme() {
    return localStorage.getItem(STORAGE_KEYS.THEME) || 'dark';
  },

  setTheme(theme) {
    localStorage.setItem(STORAGE_KEYS.THEME, theme);
    this.applyTheme();
  },

  isProUser() {
    return true; // 100% Free AI Hub — all features, templates, and HD exports unlocked
  },

  setProUser(isPro) {
    // 100% Free mode
  },

  getCustomApiKey() {
    return (localStorage.getItem(STORAGE_KEYS.CUSTOM_API_KEY) || '').trim();
  },

  setCustomApiKey(key) {
    if (!key || !key.trim()) {
      localStorage.removeItem(STORAGE_KEYS.CUSTOM_API_KEY);
    } else {
      localStorage.setItem(STORAGE_KEYS.CUSTOM_API_KEY, key.trim());
    }
  },

  getCustomApiProvider() {
    return localStorage.getItem(STORAGE_KEYS.CUSTOM_API_PROVIDER) || 'gemini';
  },

  setCustomApiProvider(provider) {
    localStorage.setItem(STORAGE_KEYS.CUSTOM_API_PROVIDER, provider || 'gemini');
  },

  getToolUsage(toolId) {
    const val = localStorage.getItem(STORAGE_KEYS.USAGE_PREFIX + toolId);
    return val ? parseInt(val, 10) : 0;
  },

  incrementToolUsage(toolId) {
    const current = this.getToolUsage(toolId);
    const updated = current + 1;
    localStorage.setItem(STORAGE_KEYS.USAGE_PREFIX + toolId, updated.toString());
    return updated;
  },

  resetToolUsage(toolId) {
    if (toolId) {
      localStorage.removeItem(STORAGE_KEYS.USAGE_PREFIX + toolId);
    } else {
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith(STORAGE_KEYS.USAGE_PREFIX)) {
          localStorage.removeItem(key);
        }
      });
    }
  },

  getHistory() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.HISTORY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  },

  saveHistoryItem(item) {
    const history = this.getHistory();
    const newItem = {
      id: 'hist_' + Date.now(),
      toolId: item.toolId,
      toolName: item.toolName,
      inputSummary: item.inputSummary,
      output: item.output,
      timestamp: new Date().toLocaleString()
    };
    
    // Keep max 30 items
    history.unshift(newItem);
    if (history.length > 30) history.pop();

    try {
      localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(history));
    } catch (e) {
      console.warn('LocalStorage full or unavailable', e);
    }
    return newItem;
  },

  clearHistory() {
    localStorage.removeItem(STORAGE_KEYS.HISTORY);
  }
};

window.StorageManager = StorageManager;
