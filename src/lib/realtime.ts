import { io, Socket } from 'socket.io-client';

type EventCallback = (data: any) => void;

class RealtimeService {
  private socket: Socket | null = null;
  private connected = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private eventListeners: Map<string, Set<EventCallback>> = new Map();

  connect(userId?: string) {
    if (this.socket?.connected) {
      console.log('[WebSocket] Already connected');
      return;
    }

    const url = import.meta.env.PROD 
      ? window.location.origin 
      : 'http://localhost:5173';

    this.socket = io(url, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: this.maxReconnectAttempts,
      query: userId ? { userId } : {},
    });

    this.socket.on('connect', () => {
      console.log('[WebSocket] Connected');
      this.connected = true;
      this.reconnectAttempts = 0;
      this.emitReconnectStatus(true);
    });

    this.socket.on('disconnect', (reason) => {
      console.log('[WebSocket] Disconnected:', reason);
      this.connected = false;
      this.emitReconnectStatus(false);
    });

    this.socket.on('connect_error', (error) => {
      console.error('[WebSocket] Connection error:', error);
      this.reconnectAttempts++;
      
      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.error('[WebSocket] Max reconnect attempts reached');
      }
    });

    this.socket.on('notification', (data) => {
      this.emit('notification', data);
    });

    this.socket.on('event:update', (data) => {
      this.emit('event:update', data);
    });

    this.socket.on('event:create', (data) => {
      this.emit('event:create', data);
    });

    this.socket.on('event:delete', (data) => {
      this.emit('event:delete', data);
    });

    this.socket.on('person:update', (data) => {
      this.emit('person:update', data);
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.connected = false;
    }
  }

  on(event: string, callback: EventCallback) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event)!.add(callback);
  }

  off(event: string, callback: EventCallback) {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.delete(callback);
    }
  }

  private emit(event: string, data: any) {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach((callback) => callback(data));
    }
  }

  private emitReconnectStatus(connected: boolean) {
    this.emit('connection:status', { connected });
  }

  subscribeToEvent(eventId: number) {
    this.socket?.emit('subscribe:event', { eventId });
  }

  unsubscribeFromEvent(eventId: number) {
    this.socket?.emit('unsubscribe:event', { eventId });
  }

  isConnected() {
    return this.connected;
  }
}

export const realtime = new RealtimeService();
export default realtime;
