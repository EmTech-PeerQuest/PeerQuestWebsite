# Admin customization settings
from django.contrib import admin
from django.contrib.admin import AdminSite
from django.utils.html import format_html

class PeerQuestAdminSite(AdminSite):
    site_header = "PeerQuest Administration"
    site_title = "PeerQuest Admin Portal"
    index_title = "Welcome to PeerQuest Administration"
    
    def index(self, request, extra_context=None):
        """
        Display the main admin index page with enhanced statistics
        """
        extra_context = extra_context or {}
        
        # Add custom statistics to the admin index
        try:
            from applications.models import Application
            from quests.models import Quest, QuestCategory, QuestParticipant
            from users.models import User
            
            stats = {
                'total_users': User.objects.count(),
                'active_users': User.objects.filter(is_active=True).count(),
                'staff_users': User.objects.filter(is_staff=True).count(),
                'total_quests': Quest.objects.count(),
                'open_quests': Quest.objects.filter(status='open').count(),
                'completed_quests': Quest.objects.filter(status='completed').count(),
                'total_applications': Application.objects.count(),
                'pending_applications': Application.objects.filter(status='pending').count(),
                'total_participants': QuestParticipant.objects.count(),
                'active_participants': QuestParticipant.objects.filter(status='active').count(),
                'total_categories': QuestCategory.objects.count(),
            }
            
            extra_context['custom_stats'] = stats
        except Exception as e:
            # In case of any import errors, just continue without stats
            pass
            
        return super().index(request, extra_context)

# Create an instance of our custom admin site
admin_site = PeerQuestAdminSite(name='peerquest_admin')

# Admin utility functions for consistent formatting
def format_datetime(dt):
    """Format datetime for consistent display across admin"""
    if dt:
        return dt.strftime('%Y-%m-%d %H:%M:%S')
    return 'Never'

def format_boolean(value):
    """Format boolean values with colored icons"""
    if value:
        return format_html('<span style="color: green;">✓ Yes</span>')
    else:
        return format_html('<span style="color: red;">✗ No</span>')

def truncate_text(text, length=50):
    """Truncate text for list display"""
    if text and len(text) > length:
        return text[:length] + '...'
    return text or 'No content'

# Common admin mixins for enhanced functionality
class EnhancedModelAdmin(admin.ModelAdmin):
    """
    Base admin class with common enhancements
    """
    list_per_page = 50
    save_on_top = True
    actions_on_top = True
    actions_on_bottom = True
    
    def get_list_display(self, request):
        """
        Add ID field to list display if not already present
        """
        list_display = list(self.list_display)
        if 'id' not in list_display:
            list_display.insert(0, 'id')
        return list_display
