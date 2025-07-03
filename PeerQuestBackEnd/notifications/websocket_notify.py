from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer

def send_notification_ws(user_id, notification):
    channel_layer = get_channel_layer()
    async_to_sync(channel_layer.group_send)(
        f'notifications_{user_id}',
        {
            'type': 'send_notification',
            'notification': notification
        }
    )
