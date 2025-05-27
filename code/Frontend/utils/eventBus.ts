type Callback = () => void;

class EventBus {
  private listeners: Record<string, Callback[]> = {};

  on(event: string, cb: Callback) {
    if (!this.listeners[event]) this.listeners[event] = [];
    this.listeners[event].push(cb);
  }

  off(event: string, cb: Callback) {
    if (!this.listeners[event]) return;
    this.listeners[event] = this.listeners[event].filter(fn => fn !== cb);
  }

  emit(event: string) {
    if (!this.listeners[event]) return;
    this.listeners[event].forEach(fn => fn());
  }
}

export const globalEvents = new EventBus();
