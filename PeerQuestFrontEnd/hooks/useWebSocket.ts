import { useEffect, useRef, useState, useCallback } from 'react';

interface WebSocketMessage {
  type: string;
  [key: string]: any;
}

interface WebSocketHookOptions {
  endpoint: string;
  onMessage?: (message: WebSocketMessage) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: Event) => void;
  reconnectAttempts?: number;
  reconnectInterval?: number;
}

interface WebSocketHookReturn {
  socket: WebSocket | null;
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
  sendMessage: (message: WebSocketMessage) => void;
  disconnect: () => void;
  reconnect: () => void;
}

const useWebSocket = (options: WebSocketHookOptions): WebSocketHookReturn => {
  const {
    endpoint,
    onMessage,
    onConnect,
    onDisconnect,
    onError,
    reconnectAttempts = 5,
    reconnectInterval = 3000,
  } = options;

  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const socketRef = useRef<WebSocket | null>(null);

  const getToken = useCallback(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('access_token');
    }
    return null;
  }, []);

  const connect = useCallback(() => {
    const token = getToken();
    
    if (!token || isConnecting || (socket && socket.readyState === WebSocket.CONNECTING)) {
      return;
    }

    setIsConnecting(true);
    setError(null);

    try {
      // Construct WebSocket URL with token
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = process.env.NODE_ENV === 'production' 
        ? window.location.host 
        : 'localhost:8000';
      const wsUrl = `${protocol}//${host}${endpoint}?token=${token}`;

      console.log(`Connecting to WebSocket: ${wsUrl}`);
      
      const ws = new WebSocket(wsUrl);
      socketRef.current = ws;

      ws.onopen = () => {
        console.log(`WebSocket connected to ${endpoint}`);
        setSocket(ws);
        setIsConnected(true);
        setIsConnecting(false);
        setError(null);
        reconnectAttemptsRef.current = 0;
        onConnect?.();
      };

      ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          console.log(`WebSocket message received:`, message);
          onMessage?.(message);
        } catch (err) {
          console.error('Failed to parse WebSocket message:', err);
        }
      };

      ws.onclose = (event) => {
        console.log(`WebSocket disconnected from ${endpoint}:`, event.code, event.reason);
        setSocket(null);
        setIsConnected(false);
        setIsConnecting(false);
        socketRef.current = null;
        onDisconnect?.();

        // Attempt to reconnect if not a clean close and we have attempts left
        if (event.code !== 1000 && reconnectAttemptsRef.current < reconnectAttempts) {
          const delay = reconnectInterval * Math.pow(1.5, reconnectAttemptsRef.current);
          console.log(`Reconnecting in ${delay}ms... (attempt ${reconnectAttemptsRef.current + 1}/${reconnectAttempts})`);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectAttemptsRef.current++;
            connect();
          }, delay);
        }
      };

      ws.onerror = (event) => {
        console.error(`WebSocket error on ${endpoint}:`, event);
        setError('WebSocket connection error');
        setIsConnecting(false);
        onError?.(event);
      };

    } catch (err) {
      console.error('Failed to create WebSocket connection:', err);
      setError('Failed to create WebSocket connection');
      setIsConnecting(false);
    }
  }, [endpoint, onMessage, onConnect, onDisconnect, onError, reconnectAttempts, reconnectInterval, isConnecting, socket, getToken]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (socketRef.current) {
      socketRef.current.close(1000, 'Manual disconnect');
      socketRef.current = null;
    }

    setSocket(null);
    setIsConnected(false);
    setIsConnecting(false);
    reconnectAttemptsRef.current = 0;
  }, []);

  const sendMessage = useCallback((message: WebSocketMessage) => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      try {
        socket.send(JSON.stringify(message));
        console.log('WebSocket message sent:', message);
      } catch (err) {
        console.error('Failed to send WebSocket message:', err);
      }
    } else {
      console.warn('WebSocket not connected, cannot send message:', message);
    }
  }, [socket]);

  const reconnect = useCallback(() => {
    disconnect();
    setTimeout(() => {
      reconnectAttemptsRef.current = 0;
      connect();
    }, 1000);
  }, [disconnect, connect]);

  // Connect when component mounts and token is available
  useEffect(() => {
    const token = getToken();
    if (token) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, []); // Connect once on mount

  // Listen for storage events to reconnect when token changes
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'access_token') {
        if (e.newValue) {
          // Token added/changed, reconnect
          reconnect();
        } else {
          // Token removed, disconnect
          disconnect();
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [reconnect, disconnect]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, []);

  return {
    socket,
    isConnected,
    isConnecting,
    error,
    sendMessage,
    disconnect,
    reconnect,
  };
};

export default useWebSocket;
