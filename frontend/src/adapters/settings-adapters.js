import { call } from './call.js';

export const getSettings = async () => {
  return call(() => window.api.settings.get());
};

export const setSettings = async (updates) => {
  return call(() => window.api.settings.set(updates));
};
