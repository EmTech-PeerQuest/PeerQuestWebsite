import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from rest_framework_simplejwt.tokens import UntypedToken
from rest_framework_simplejwt.exceptions import TokenError

# Paste your JWT token here
token = """
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoiYWNjZXNzIiwiZXhwIjoxNzUxMzYyMTY2LCJpYXQiOjE3NTEzNTg1NjYsImp0aSI6IjJiYTU2Y2E2MWQ4MzQzMGU5NGRhODUzNmQzYThhZTIyIiwidXNlcl9pZCI6IjE2ZGMyNzc2LWI1ZjUtNDYxYS04M2RmLWY3ZGM3NzY0N2MwMSJ9.1ZlhLBuVFDWzjwB9S8LDWJXnZDeswEDw_iiHdKZe92s
"""

try:
    UntypedToken(token)
    print("Token is valid!")
except TokenError as e:
    print("Token is invalid:", e)
