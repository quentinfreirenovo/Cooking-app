type Listener = (...args: any[]) => void;

const listeners = new Map<string, Set<Listener>>();

export function on(event: string, listener: Listener) {
  const set = listeners.get(event) ?? new Set<Listener>();
  set.add(listener);
  listeners.set(event, set);
  return () => off(event, listener);
}

export function off(event: string, listener: Listener) {
  const set = listeners.get(event);
  if (!set) return;
  set.delete(listener);
  if (set.size === 0) listeners.delete(event);
}

export function emit(event: string, ...args: any[]) {
  const set = listeners.get(event);
  if (!set) return;
  for (const listener of Array.from(set)) listener(...args);
}
