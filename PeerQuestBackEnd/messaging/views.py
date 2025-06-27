from django.shortcuts import render
from rest_framework import generics, permissions
from rest_framework.views import APIView
from rest_framework.response import Response
from .models import Message
from .serializers import MessageSerializer, ConversationSerializer
from django.contrib.auth import get_user_model
from django.db.models import Q

User = get_user_model()

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
                conversations.append({
                    'id': pid,
                    'participants': [user.username, User.objects.get(id=pid).username],
                    'last_message': last_msg.content,
                    'last_timestamp': last_msg.timestamp,
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
