
import os
from django.views.generic import View
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
import requests
import json
from quests.models import Quest

GROQ_API_KEY = os.environ.get("GROQ_API_KEY")
print("GROQ_API_KEY loaded in proxy:", GROQ_API_KEY)
GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"

@method_decorator(csrf_exempt, name='dispatch')
class AIChatbotProxyView(View):
    def post(self, request):
        try:
            data = json.loads(request.body.decode())
            messages = data.get("messages", [])
            user = data.get("user", {})
            # Check if user is asking for good quests
            user_message = next((m.get("content", "") for m in messages if m.get("role") == "user"), "")
            system_prompt = f"You are a helpful support assistant for PeerQuest. User info: {user}"

            # If user asks for good quests, fetch and inject recommendations
            if "good quest" in user_message.lower() or "recommend" in user_message.lower():
                good_quests = list(Quest.active_quests.all()[:3].values('title', 'description'))
                if good_quests:
                    quest_list = "\n".join([f"- {q['title']}: {q['description'][:100]}" for q in good_quests])
                    system_prompt += f"\nHere are some good quests for the user to try next:\n{quest_list}"

            groq_messages = [
                {"role": "system", "content": system_prompt},
            ]
            for m in messages:
                groq_messages.append({"role": m.get("role", "user"), "content": m.get("content", "")})
            payload = {
                "model": "llama-3.3-70b-versatile",
                "messages": groq_messages,
                "max_tokens": 500,
            }
            headers = {
                "Authorization": f"Bearer {GROQ_API_KEY}",
                "Content-Type": "application/json",
            }
            r = requests.post(GROQ_API_URL, json=payload, headers=headers, timeout=30)
            r.raise_for_status()
            data = r.json()
            reply = data["choices"][0]["message"]["content"]
            return JsonResponse({"reply": reply})
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)
