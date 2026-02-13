const storage = {};
export default {
  getItem: (key) => Promise.resolve(storage[key] ?? null),
  setItem: (key, value) => { storage[key] = value; return Promise.resolve(); },
  removeItem: (key) => { delete storage[key]; return Promise.resolve(); },
  clear: () => { Object.keys(storage).forEach(k => delete storage[k]); return Promise.resolve(); },
  getAllKeys: () => Promise.resolve(Object.keys(storage)),
  multiGet: (keys) => Promise.resolve(keys.map(k => [k, storage[k] ?? null])),
  multiSet: (pairs) => { pairs.forEach(([k, v]) => { storage[k] = v; }); return Promise.resolve(); },
  multiRemove: (keys) => { keys.forEach(k => delete storage[k]); return Promise.resolve(); },
};
