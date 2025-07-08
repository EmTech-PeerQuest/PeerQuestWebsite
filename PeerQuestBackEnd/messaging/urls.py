# messaging/urls.py

from django.urls import path
from . import views

urlpatterns = [
    path('', views.ConversationListCreateView.as_view(), name='conversation-list-create'),  # now accessible at /api/conversations/
    path('<uuid:conversation_id>/messages/', views.MessageListView.as_view(), name='message-list'),
    path('start/', views.StartConversationView.as_view(), name='start-conversation'),
    path('send/', views.SendMessageView.as_view(), name='send-message'),
    path('presence/', views.UserPresenceView.as_view(), name='user-presence'),
    path('users/search/', views.UserSearchView.as_view(), name='user-search'),
]
