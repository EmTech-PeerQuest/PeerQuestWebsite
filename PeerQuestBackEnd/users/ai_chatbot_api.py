import os
import requests
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticatedOrReadOnly
from rest_framework import status

# Debug: Print the loaded API key (will show in backend logs)
print('GROQ_API_KEY loaded:', os.environ.get('GROQ_API_KEY'))

GROQ_API_KEY = os.environ.get("GROQ_API_KEY")
GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"

class AIChatbotAPIView(APIView):
    permission_classes = [IsAuthenticatedOrReadOnly]

    def post(self, request):
        messages = request.data.get("messages", [])
        user = request.data.get("user", {})
        # Compose system prompt with user context
        system_prompt = f"You are a helpful support assistant for PeerQuest. User info: {user}"
        groq_messages = [
            {"role": "system", "content": system_prompt},
        ]
        for m in messages:
            groq_messages.append({"role": m.get("role", "user"), "content": m.get("content", "")})
        payload = {
            "model": "llama-3.3-70b-versatile",  # Change to working model
            "messages": groq_messages,
            "max_tokens": 500,
        }
        headers = {
            "Authorization": f"Bearer {GROQ_API_KEY}",
            "Content-Type": "application/json",
        }
        # Extra debug logging for 401 errors
        print('Groq API call debug:')
        print('GROQ_API_KEY:', GROQ_API_KEY)
        print('Authorization header:', headers["Authorization"])
        print('Payload:', payload)
        # Check if API key is None or empty
        if not GROQ_API_KEY:
            print('ERROR: GROQ_API_KEY is None or empty!')
            return Response({"error": "API key not configured"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        try:
            r = requests.post(GROQ_API_URL, json=payload, headers=headers, timeout=30)
            r.raise_for_status()
            data = r.json()
            reply = data["choices"][0]["message"]["content"]
            return Response({"reply": reply})
        except Exception as e:
            # Debug: Print the error to backend logs
            print('Groq API error:', str(e))
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
