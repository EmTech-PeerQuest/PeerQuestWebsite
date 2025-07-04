from django.shortcuts import render
from rest_framework import generics, permissions
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from .models import Message
from .serializers import MessageSerializer, ConversationSerializer
from django.contrib.auth import get_user_model
from django.db.models import Q

User = get_user_model()

# PeerQuestBackEnd/messaging/views.py
# This file contains views for handling messaging functionality, including listing conversations and messages.
class ConversationListView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        sent_to = Message.objects.filter(sender=user).values_list('recipient', flat=True)
        received_from = Message.objects.filter(recipient=user).values_list('sender', flat=True)
        participant_ids = set(list(sent_to) + list(received_from))
        participant_ids.discard(user.id)
        conversations = []
        for pid in participant_ids:
            last_msg = Message.objects.filter(
                Q(sender=user, recipient_id=pid) | Q(sender_id=pid, recipient=user)
            ).order_by('-timestamp').first()
            if last_msg:
                other_user = User.objects.get(id=pid)
                participants = [
                    {
                        'id': user.id,
                        'username': user.username,
                        'email': user.email,
                        'level': getattr(user, 'level', None)
                    },
                    {
                        'id': other_user.id,
                        'username': other_user.username,
                        'email': other_user.email,
                        'level': getattr(other_user, 'level', None)
                    }
                ]
                conversations.append({
                    'id': last_msg.id,  # Use message id as conversation id, or use a custom id if you have a Conversation model
                    'participants': participants,
                    'last_message': last_msg.content,
                    'last_message_date': last_msg.timestamp,
                    'unread_count': Message.objects.filter(sender=other_user, recipient=user, is_read=False).count(),
                })
        return Response(conversations)


class MessageListView(generics.ListAPIView):
    serializer_class = MessageSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        other_id = self.kwargs['conversation_id']
        return Message.objects.filter(
            Q(sender=user, recipient_id=other_id) | Q(sender_id=other_id, recipient=user)
        ).order_by('timestamp')

# ADD THIS VIEW FOR SENDING MESSAGES:
class SendMessageView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        try:
            receiver_id = request.data.get('receiver_id')
            content = request.data.get('content', '')
            
            if not receiver_id:
                return Response({'error': 'receiver_id is required'}, status=400)
            
            if not content.strip():
                return Response({'error': 'Message content cannot be empty'}, status=400)
            
            try:
                receiver = User.objects.get(id=receiver_id)
            except User.DoesNotExist:
                return Response({'error': 'Receiver not found'}, status=404)
            
            # Create the message
            message = Message.objects.create(
                sender=request.user,
                recipient=receiver,
                content=content,
                read=False
            )
            
            # Serialize the message for response
            message_data = {
                'id': message.id,
                'sender': {
                    'id': message.sender.id,
                    'username': message.sender.username,
                    'email': message.sender.email,
                },
                'receiver': {
                    'id': message.recipient.id,
                    'username': message.recipient.username,
                    'email': message.recipient.email,
                },
                'content': message.content,
                'created_at': message.timestamp.isoformat(),
                'read': message.read
            }
            
            return Response(message_data, status=201)
            
        except Exception as e:
            return Response({'error': str(e)}, status=500)
        
# ADD THIS VIEW FOR USER SEARCH:
class UserSearchView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        query = request.GET.get('q', '')
        if len(query) < 2:
            return Response([])
       
        users = User.objects.filter(
            Q(username__icontains=query) | Q(email__icontains=query)
        ).exclude(id=request.user.id)[:10]
       
        user_data = [{
            'id': user.id,
            'username': user.username,
            'email': user.email,
        } for user in users]
       
        print(f"User search query: {query}, found {len(user_data)} users")
        return Response(user_data)

# ADD THIS VIEW FOR STARTING CONVERSATIONS:
class StartConversationView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        participant_id = request.data.get('participant_id')
        
        if not participant_id:
            return Response({'error': 'participant_id is required'}, status=400)
        
        try:
            other_user = User.objects.get(id=participant_id)
        except User.DoesNotExist:
            return Response({'error': 'User not found'}, status=404)
        
        # Check if conversation already exists
        existing_messages = Message.objects.filter(
            Q(sender=request.user, recipient=other_user) | 
            Q(sender=other_user, recipient=request.user)
        ).first()
        
        participants = [
            {
                'id': str(request.user.id),
                'username': request.user.username,
                'email': request.user.email,
                'level': getattr(request.user, 'level', None)
            },
            {
                'id': str(other_user.id),
                'username': other_user.username,
                'email': other_user.email,
                'level': getattr(other_user, 'level', None)
            }
        ]
        
        if existing_messages:
            # Return existing conversation info
            last_message = Message.objects.filter(
                Q(sender=request.user, recipient=other_user) | 
                Q(sender=other_user, recipient=request.user)
            ).order_by('-timestamp').first()
            
            return Response({
                'id': str(other_user.id),  # Use other user's ID as conversation ID
                'participants': participants,
                'last_message': last_message.content if last_message else '',
                'last_message_date': last_message.timestamp if last_message else None,
                'unread_count': Message.objects.filter(sender=other_user, recipient=request.user, read=False).count(),
            })
        
        # Create new conversation by returning empty conversation info
        return Response({
            'id': str(other_user.id),  # Use other user's ID as conversation ID
            'participants': participants,
            'last_message': '',
            'last_message_date': None,
            'unread_count': 0,
        })