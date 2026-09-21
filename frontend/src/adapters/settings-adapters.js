const call = async (fn) => {
  try {
    const data = await fn();
    return { data, error: null };
  } catch (error) {
    return { data: null, error };
  }
};

export const getSettings = async () => {
  return call(() => window.api.settings.get());
};

export const setSettings = async (updates) => {
  return call(() => window.api.settings.set(updates));
};
