from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    # Quest ViewSet (main CRUD)
    QuestViewSet,
    
    # Quest Categories
    QuestCategoryListCreateView,
    QuestCategoryDetailView,
    
    # Quest Search and Filters
    QuestSearchView,
    
    # Quest Participants
    QuestParticipantListView,
    QuestParticipantDetailView,
    KickParticipantView,
    
    # Quest Submissions
    QuestSubmissionListCreateView,
    QuestSubmissionDetailView,
    QuestSubmissionReviewViewSet,
    QuestSubmissionFileDownloadView,
    
    # Statistics and Dashboard
    QuestStatsView,
    
    # Admin Views
    AdminQuestListView,
    AdminQuestDetailView,
    get_submission_count,
)

app_name = 'quests'

# Router for ViewSets
router = DefaultRouter()
router.register('', QuestViewSet, basename='quest')

# Separate router for submission reviews
submission_router = DefaultRouter()
submission_router.register('submissions', QuestSubmissionReviewViewSet, basename='submission-review')

urlpatterns = [
    # ViewSet URLs (includes list, create, retrieve, update, delete)
    path('quests/', include(router.urls)),
    
    # Submission Review ViewSet URLs (approve, needs_revision actions)
    path('', include(submission_router.urls)),
    
    # Quest Categories
    path('categories/', QuestCategoryListCreateView.as_view(), name='category-list-create'),
    path('categories/<int:pk>/', QuestCategoryDetailView.as_view(), name='category-detail'),
    
    # Quest Search and Discovery
    path('search/', QuestSearchView.as_view(), name='quest-search'),
    
    # Quest Participants
    path('quests/<slug:quest_slug>/participants/', QuestParticipantListView.as_view(), name='quest-participants'),
    path('participants/<int:pk>/', QuestParticipantDetailView.as_view(), name='participant-detail'),
    path('participants/<int:pk>/kick/', KickParticipantView.as_view(), name='kick-participant'),
    
    # Quest Submissions
    path('quests/<slug:quest_slug>/submissions/', QuestSubmissionListCreateView.as_view(), name='quest-submissions'),
    path('quests/<slug:quest_slug>/submission_count/', get_submission_count, name='submission-count'),
    path('submissions/<int:pk>/', QuestSubmissionDetailView.as_view(), name='submission-detail'),
    path('submissions/<int:submission_id>/download/<int:file_index>/', QuestSubmissionFileDownloadView.as_view(), name='submission-file-download'),
    
    # Statistics and Dashboard
    path('stats/', QuestStatsView.as_view(), name='quest-stats'),
    
    # Admin Views
    path('admin/quests/', AdminQuestListView.as_view(), name='admin-quest-list'),
    path('admin/quests/<slug:slug>/', AdminQuestDetailView.as_view(), name='admin-quest-detail'),
]

"""
URL Patterns Summary:

Quest CRUD (ViewSet):
- GET /api/quests/quests/ - List all quests
- POST /api/quests/quests/ - Create new quest
- GET /api/quests/quests/{slug}/ - Get quest details
- PUT /api/quests/quests/{slug}/ - Update quest (full)
- PATCH /api/quests/quests/{slug}/ - Update quest (partial)
- DELETE /api/quests/quests/{slug}/ - Delete quest

Quest Actions:
- POST /api/quests/quests/{slug}/join_quest/ - Join a quest
- POST /api/quests/quests/{slug}/leave_quest/ - Leave a quest
- GET /api/quests/quests/my_quests/ - Get user's quests

Categories:
- GET /api/quests/categories/ - List categories
- POST /api/quests/categories/ - Create category
- GET /api/quests/categories/{id}/ - Get category details
- PUT/PATCH /api/quests/categories/{id}/ - Update category
- DELETE /api/quests/categories/{id}/ - Delete category

Search and Discovery:
- GET /api/quests/search/ - Advanced quest search

Participants:
- GET /api/quests/quests/{slug}/participants/ - List quest participants
- GET /api/quests/participants/{id}/ - Get participant details
- PUT/PATCH /api/quests/participants/{id}/ - Update participation
- DELETE /api/quests/participants/{id}/ - Remove participation

Submissions:
- GET /api/quests/quests/{slug}/submissions/ - List quest submissions
- POST /api/quests/quests/{slug}/submissions/ - Create submission
- GET /api/quests/submissions/{id}/ - Get submission details
- PUT/PATCH /api/quests/submissions/{id}/ - Update submission
- DELETE /api/quests/submissions/{id}/ - Delete submission
- PATCH /api/quests/submissions/{id}/review/ - Review submission (creators only)
- GET /api/quests/submissions/{submission_id}/download/{file_index}/ - Download submission file

Statistics:
- GET /api/quests/stats/ - Get user quest statistics

Admin:
- GET /api/quests/admin/quests/ - List all quests (admin)
- GET /api/quests/admin/quests/{slug}/ - Admin quest details

Query Parameters Examples:
- ?status=active - Filter by status
- ?difficulty=medium - Filter by difficulty
- ?category=1 - Filter by category
- ?creator=1 - Filter by creator
- ?search=python - Search in title/description
- ?available_only=true - Only quests with available spots
- ?type=created - Get only created quests (for my_quests)
- ?type=participating - Get only participating quests
"""
