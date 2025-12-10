
export const getStorageKey = (headers: string[]) => {
  const headerString = headers.slice().sort().join('|');
  let hash = 0;
  for (let i = 0; i < headerString.length; i++) {
    const char = headerString.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return `csv2ynab_config_${hash}`;
};

export const saveConfigToStorage = (headers: string[], config: any) => {
  try {
    const key = getStorageKey(headers);
    localStorage.setItem(key, JSON.stringify(config));
  } catch (e) {
    console.warn('Failed to save config to storage', e);
  }
};

export const loadConfigFromStorage = (headers: string[]) => {
  try {
    const key = getStorageKey(headers);
    const saved = localStorage.getItem(key);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.warn('Failed to load config from storage', e);
  }
  return null;
};
