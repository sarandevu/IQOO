/**
 * iQOO Creator Studio - Office Kit Cross-Device Bridge
 * 
 * Synchronizes Creator Deck (Phone) and Laptop 4K Canvas over WebSockets & BroadcastChannel
 */

export class OfficeKitBridge {
  constructor(channelName = 'iqoo_office_kit') {
    this.channelName = channelName;
    this.ws = null;
    this.broadcastChannel = null;
    this.isConnected = false;
    this.latencyMs = 4;
    this.callbacks = [];

    this.initBroadcastChannel();
    this.initWebSocket();
  }

  initBroadcastChannel() {
    if (typeof BroadcastChannel !== 'undefined') {
      this.broadcastChannel = new BroadcastChannel(this.channelName);
      this.broadcastChannel.onmessage = (event) => {
        this.handleIncoming(event.data);
      };
      this.isConnected = true;
    }
  }

  initWebSocket() {
    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}`;
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        this.isConnected = true;
        this.notify('bridgeStatus', { connected: true, type: 'websocket', latency: this.latencyMs });
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.handleIncoming(data);
        } catch (e) {}
      };

      this.ws.onclose = () => {
        // Fallback to BroadcastChannel
      };
    } catch (e) {
      // WS unavailable, BroadcastChannel handles local tabs
    }
  }

  onCommand(callback) {
    this.callbacks.push(callback);
  }

  notify(event, payload) {
    this.callbacks.forEach(cb => cb(event, payload));
  }

  handleIncoming(msg) {
    if (!msg || !msg.action) return;
    this.notify('command', msg);
  }

  sendCommand(action, payload = {}) {
    const message = {
      action,
      payload,
      timestamp: performance.now(),
      sender: 'creator_studio_client'
    };

    // Send via BroadcastChannel (instant inter-tab sync)
    if (this.broadcastChannel) {
      try {
        this.broadcastChannel.postMessage(message);
      } catch (e) {}
    }

    // Send via WebSocket (inter-device over Wi-Fi/Office Kit)
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      try {
        this.ws.send(JSON.stringify(message));
      } catch (e) {}
    }
  }
}
