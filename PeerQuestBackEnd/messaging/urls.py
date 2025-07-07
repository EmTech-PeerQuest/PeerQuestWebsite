from django.urls import path
from . import views # Make sure .views is correct for other views in this file

urlpatterns = [
    # Get all conversations for the authenticated user
    path('conversations/', views.ConversationListCreateView.as_view(), name='conversation-list-create'),
    
    # Get messages for a specific conversation
    path('conversations/<uuid:conversation_id>/messages/', views.MessageListView.as_view(), name='message-list'),
    
    # Send a message
    path('send/', views.SendMessageView.as_view(), name='send-message'),
    
    # User presence
    path('presence/', views.UserPresenceView.as_view(), name='user-presence'),
]