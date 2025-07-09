from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
import logging

def send_notification_ws(user_id, notification):
    logger = logging.getLogger(__name__)
    logger.info(f"Attempting to send WebSocket notification to user {user_id}: {notification}")
    try:
        channel_layer = get_channel_layer()
        async_to_sync(channel_layer.group_send)(
            f'notifications_{user_id}',
            {
                'type': 'send_notification',
                'notification': notification
            }
        )
        logger.info(f"WebSocket notification sent to user {user_id}")
    except Exception as e:
        logger.error(f"Failed to send WebSocket notification to user {user_id}: {e}")
