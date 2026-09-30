// Every adapter wraps a window.api (Electron IPC) call the same way: never
// throw, always resolve to { data, error } so screens can branch on it.
export const call = async (fn) => {
  try {
    const data = await fn();
    return { data, error: null };
  } catch (error) {
    return { data: null, error };
  }
};
