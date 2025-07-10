import { useCallback } from 'react';
import useWebSocket from './useWebSocket';

interface QuestUpdate {
  quest_id: string;
  status: string;
  timestamp: string;
}

interface ApplicationUpdate {
  application_id: string;
  quest_id: string;
  status: string;
  timestamp: string;
}

interface ApplicationCountUpdate {
  quest_id: string;
  application_count: number;
  timestamp: string;
}

interface SubmissionUpdate {
  quest_id: string;
  submission_id: string;
  status: string;
  timestamp: string;
}

interface QuestWebSocketHookOptions {
  onQuestStatusChanged?: (update: QuestUpdate) => void;
  onApplicationCountChanged?: (update: ApplicationCountUpdate) => void;
  onSubmissionUpdated?: (update: SubmissionUpdate) => void;
}

interface ApplicationWebSocketHookOptions {
  onApplicationStatusChanged?: (update: ApplicationUpdate) => void;
}

interface NotificationUpdate {
  notification_id: string;
  title: string;
  message: string;
  timestamp: string;
}

interface NotificationWebSocketHookOptions {
  onNotificationCreated?: (update: NotificationUpdate) => void;
}

export const useQuestWebSocket = (options: QuestWebSocketHookOptions = {}) => {
  const { onQuestStatusChanged, onApplicationCountChanged, onSubmissionUpdated } = options;

  const handleMessage = useCallback((message: any) => {
    switch (message.type) {
      case 'quest_status_changed':
        onQuestStatusChanged?.(message);
        break;
      case 'quest_application_count_changed':
        onApplicationCountChanged?.(message);
        break;
      case 'quest_submission_updated':
        onSubmissionUpdated?.(message);
        break;
      default:
        console.log('Unhandled quest WebSocket message:', message);
    }
  }, [onQuestStatusChanged, onApplicationCountChanged, onSubmissionUpdated]);

  return useWebSocket({
    endpoint: '/ws/quests/',
    onMessage: handleMessage,
    onConnect: () => console.log('Connected to quest updates'),
    onDisconnect: () => console.log('Disconnected from quest updates'),
  });
};

export const useApplicationWebSocket = (options: ApplicationWebSocketHookOptions = {}) => {
  const { onApplicationStatusChanged } = options;

  const handleMessage = useCallback((message: any) => {
    switch (message.type) {
      case 'application_status_changed':
        onApplicationStatusChanged?.(message);
        break;
      default:
        console.log('Unhandled application WebSocket message:', message);
    }
  }, [onApplicationStatusChanged]);

  return useWebSocket({
    endpoint: '/ws/applications/',
    onMessage: handleMessage,
    onConnect: () => console.log('Connected to application updates'),
    onDisconnect: () => console.log('Disconnected from application updates'),
  });
};

export const useNotificationWebSocket = (options: NotificationWebSocketHookOptions = {}) => {
  const { onNotificationCreated } = options;

  const handleMessage = useCallback((message: any) => {
    switch (message.type) {
      case 'notification_created':
        onNotificationCreated?.(message);
        break;
      default:
        console.log('Unhandled notification WebSocket message:', message);
    }
  }, [onNotificationCreated]);

  return useWebSocket({
    endpoint: '/ws/notifications/',
    onMessage: handleMessage,
    onConnect: () => console.log('Connected to notifications'),
    onDisconnect: () => console.log('Disconnected from notifications'),
  });
};

// Combined hook for all real-time updates
export const useRealTimeUpdates = (options: {
  quest?: QuestWebSocketHookOptions;
  application?: ApplicationWebSocketHookOptions;
  notification?: NotificationWebSocketHookOptions;
} = {}) => {
  const questSocket = useQuestWebSocket(options.quest);
  const applicationSocket = useApplicationWebSocket(options.application);
  const notificationSocket = useNotificationWebSocket(options.notification);

  return {
    quest: questSocket,
    application: applicationSocket,
    notification: notificationSocket,
    isAnyConnected: questSocket.isConnected || applicationSocket.isConnected || notificationSocket.isConnected,
    isAllConnected: questSocket.isConnected && applicationSocket.isConnected && notificationSocket.isConnected,
  };
};
