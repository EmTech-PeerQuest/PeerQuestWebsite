import os
import sys
import django

# Ensure project directory is on PYTHONPATH
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'PeerQuestBackEnd.settings')
django.setup()

from applications.models import Application

# CHANGE THIS ID TO THE APPLICATION YOU WANT TO RESET
APP_ID = 3

app = Application.objects.get(pk=APP_ID)
app.status = 'pending'
app.reviewed_by = None
app.reviewed_at = None
app.save()
print(f"Application {APP_ID} status reset to pending.")
# Activation commands removed; run this script within the activated venv manually