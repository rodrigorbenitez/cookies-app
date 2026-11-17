import { useSyncExternalStore } from 'react';

/** Whether the falling-snow decoration is on (default: on). Stored per device. */
const KEY = 'snow';
const EVENT = 'snow-change';

function read() {
  try {
    return localStorage.getItem(KEY) !== 'off';
  } catch {
    return true;
  }
}

export function setSnowEnabled(on: boolean) {
  try {
    localStorage.setItem(KEY, on ? 'on' : 'off');
  } catch {
    /* ignore */
  }
  window.dispatchEvent(new Event(EVENT));
}

function subscribe(cb: () => void) {
  window.addEventListener(EVENT, cb);
  window.addEventListener('storage', cb);
  return () => {
    window.removeEventListener(EVENT, cb);
    window.removeEventListener('storage', cb);
  };
}

export function useSnowEnabled() {
  return useSyncExternalStore(subscribe, read, () => true);
}
