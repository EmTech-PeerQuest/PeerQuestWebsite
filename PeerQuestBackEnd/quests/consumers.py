"""
WebSocket consumers for real-time quest and application updates.
"""

import json
import logging
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth.models import AnonymousUser
from rest_framework_simplejwt.tokens import UntypedToken
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from django.contrib.auth import get_user_model
from asgiref.sync import sync_to_async

User = get_user_model()
logger = logging.getLogger(__name__)


class AuthenticatedWebSocketConsumer(AsyncWebsocketConsumer):
    """Base consumer with JWT authentication support."""
    
    async def connect(self):
        """Authenticate user and connect to WebSocket."""
        self.user = await self.get_user_from_token()
        
        if not self.user or self.user.is_anonymous:
            logger.warning("WebSocket connection refused: no authenticated user")
            await self.close()
            return
            
        logger.info(f"WebSocket connection established for user {self.user.username}")
        await self.accept()
    
    async def disconnect(self, close_code):
        """Handle WebSocket disconnection."""
        logger.info(f"WebSocket disconnected for user {getattr(self.user, 'username', 'unknown')} with code {close_code}")
    
    @database_sync_to_async
    def get_user_from_token(self):
        """Extract and validate JWT token from query string."""
        try:
            # Get token from query string
            query_string = self.scope.get('query_string', b'').decode('utf-8')
            token = None
            
            if query_string:
                for param in query_string.split('&'):
                    if param.startswith('token='):
                        token = param.split('=', 1)[1]
                        break
            
            if not token:
                logger.warning("No token provided in WebSocket connection")
                return AnonymousUser()
            
            # Validate token
            try:
                validated_token = UntypedToken(token)
                user_id = validated_token['user_id']
                user = User.objects.get(id=user_id)
                return user
            except (InvalidToken, TokenError, User.DoesNotExist) as e:
                logger.warning(f"Invalid token in WebSocket connection: {e}")
                return AnonymousUser()
                
        except Exception as e:
            logger.error(f"Error authenticating WebSocket user: {e}")
            return AnonymousUser()


class QuestConsumer(AuthenticatedWebSocketConsumer):
    """Consumer for quest-related real-time updates."""
    
    async def connect(self):
        """Connect to quest updates group."""
        await super().connect()
        
        if self.user and not self.user.is_anonymous:
            # Join quest updates group
            self.group_name = 'quest_updates'
            await self.channel_layer.group_add(
                self.group_name,
                self.channel_name
            )
            logger.info(f"User {self.user.username} joined quest updates group: {self.group_name}")
            logger.info(f"Channel name: {self.channel_name}")
        else:
            logger.warning("Anonymous user tried to connect to quest WebSocket")
    
    async def disconnect(self, close_code):
        """Disconnect from quest updates group."""
        if hasattr(self, 'group_name'):
            await self.channel_layer.group_discard(
                self.group_name,
                self.channel_name
            )
        await super().disconnect(close_code)
    
    async def receive(self, text_data):
        """Handle incoming WebSocket messages."""
        try:
            data = json.loads(text_data)
            message_type = data.get('type')
            
            logger.info(f"Quest WebSocket received: {message_type} from {self.user.username}")
            
            # Handle different message types
            if message_type == 'quest_status_update':
                await self.handle_quest_status_update(data)
            elif message_type == 'ping':
                await self.send(text_data=json.dumps({'type': 'pong'}))
                
        except json.JSONDecodeError:
            logger.error(f"Invalid JSON received in quest WebSocket")
        except Exception as e:
            logger.error(f"Error handling quest WebSocket message: {e}")
    
    async def handle_quest_status_update(self, data):
        """Handle quest status update requests."""
        # This could be used for admin users to update quest status
        pass
    
    # Handler for quest status updates sent from signals
    async def quest_status_changed(self, event):
        """Send quest status change to WebSocket."""
        logger.info(f"Quest status changed event received: {event}")
        await self.send(text_data=json.dumps({
            'type': 'quest_status_changed',
            'quest_id': event['quest_id'],
            'status': event['status'],
            'timestamp': event['timestamp']
        }))
    
    # Handler for quest application count updates
    async def quest_application_count_changed(self, event):
        """Send quest application count change to WebSocket."""
        await self.send(text_data=json.dumps({
            'type': 'quest_application_count_changed',
            'quest_id': event['quest_id'],
            'application_count': event['application_count'],
            'timestamp': event['timestamp']
        }))
    
    # Handler for quest submission updates
    async def quest_submission_updated(self, event):
        """Send quest submission update to WebSocket."""
        await self.send(text_data=json.dumps({
            'type': 'quest_submission_updated',
            'quest_id': event['quest_id'],
            'submission_id': event['submission_id'],
            'status': event['status'],
            'timestamp': event['timestamp']
        }))


class ApplicationConsumer(AuthenticatedWebSocketConsumer):
    """Consumer for application-related real-time updates."""
    
    async def connect(self):
        """Connect to application updates group."""
        await super().connect()
        
        if self.user and not self.user.is_anonymous:
            # Join user-specific application updates group
            self.group_name = f'user_applications_{self.user.id}'
            await self.channel_layer.group_add(
                self.group_name,
                self.channel_name
            )
            logger.info(f"User {self.user.username} joined application updates group")
    
    async def disconnect(self, close_code):
        """Disconnect from application updates group."""
        if hasattr(self, 'group_name'):
            await self.channel_layer.group_discard(
                self.group_name,
                self.channel_name
            )
        await super().disconnect(close_code)
    
    async def receive(self, text_data):
        """Handle incoming WebSocket messages."""
        try:
            data = json.loads(text_data)
            message_type = data.get('type')
            
            logger.info(f"Application WebSocket received: {message_type} from {self.user.username}")
            
            if message_type == 'ping':
                await self.send(text_data=json.dumps({'type': 'pong'}))
                
        except json.JSONDecodeError:
            logger.error(f"Invalid JSON received in application WebSocket")
        except Exception as e:
            logger.error(f"Error handling application WebSocket message: {e}")
    
    # Handler for application status updates
    async def application_status_changed(self, event):
        """Send application status change to WebSocket."""
        await self.send(text_data=json.dumps({
            'type': 'application_status_changed',
            'application_id': event['application_id'],
            'quest_id': event['quest_id'],
            'status': event['status'],
            'timestamp': event['timestamp']
        }))


class NotificationConsumer(AuthenticatedWebSocketConsumer):
    """Consumer for general notification updates."""
    
    async def connect(self):
        """Connect to notification updates group."""
        await super().connect()
        
        if self.user and not self.user.is_anonymous:
            # Join user-specific notification group
            self.group_name = f'user_notifications_{self.user.id}'
            await self.channel_layer.group_add(
                self.group_name,
                self.channel_name
            )
            logger.info(f"User {self.user.username} joined notification updates group")
    
    async def disconnect(self, close_code):
        """Disconnect from notification updates group."""
        if hasattr(self, 'group_name'):
            await self.channel_layer.group_discard(
                self.group_name,
                self.channel_name
            )
        await super().disconnect(close_code)
    
    async def receive(self, text_data):
        """Handle incoming WebSocket messages."""
        try:
            data = json.loads(text_data)
            message_type = data.get('type')
            
            logger.info(f"Notification WebSocket received: {message_type} from {self.user.username}")
            
            if message_type == 'ping':
                await self.send(text_data=json.dumps({'type': 'pong'}))
                
        except json.JSONDecodeError:
            logger.error(f"Invalid JSON received in notification WebSocket")
        except Exception as e:
            logger.error(f"Error handling notification WebSocket message: {e}")
    
    # Handler for general notifications
    async def notification_created(self, event):
        """Send new notification to WebSocket."""
        await self.send(text_data=json.dumps({
            'type': 'notification_created',
            'notification_id': event['notification_id'],
            'title': event['title'],
            'message': event['message'],
            'timestamp': event['timestamp']
        }))
