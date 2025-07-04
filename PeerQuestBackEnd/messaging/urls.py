from django.urls import path
from . import views

urlpatterns = [
    # Get all conversations for the authenticated user
    path('conversations/', views.ConversationListView.as_view(), name='conversation-list'),
    
    # Get messages for a specific conversation
    path('conversations/<uuid:conversation_id>/messages/', views.MessageListView.as_view(), name='message-list'),
    
    # Search for users to start new conversations
    path('users/search/', views.UserSearchView.as_view(), name='user-search'),
    
    # Send a message
    path('send/', views.SendMessageView.as_view(), name='send-message'),
]