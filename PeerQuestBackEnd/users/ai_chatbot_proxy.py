
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
        print("DEBUG: AI Chatbot endpoint called!")
        print(f"DEBUG: Request body: {request.body.decode()}")
        try:
            data = json.loads(request.body.decode())
            messages = data.get("messages", [])
            user = data.get("user", {})  # Frontend sends "user" not "currentUser"
            # Check if user is asking about quests
            user_message = next((m.get("content", "") for m in messages if m.get("role") == "user"), "")
            print(f"DEBUG: User message: '{user_message}'")
            
            # Only inject quest data if user is asking about quests
            quest_keywords = ['quest', 'adventure', 'mission', 'task', 'good', 'find', 'available', 'recommend', 'suggest']
            is_quest_related = any(keyword in user_message.lower() for keyword in quest_keywords)
            print(f"DEBUG: Is quest-related: {is_quest_related}")
            
            # Debug: Always check database first
            try:
                total_quests = Quest.objects.count()
                active_quests_count = Quest.active_quests.count()
                print(f"DEBUG: Total quests in DB: {total_quests}")
                print(f"DEBUG: Active quests in DB: {active_quests_count}")
            except Exception as e:
                print(f"DEBUG: Database error: {e}")

            # Base system prompt
            system_prompt = "You are the Tavern Keeper's AI assistant for PeerQuest. You help adventurers with questions about quests, guilds, leveling, and the game mechanics."

            # Only fetch and inject quest data if user is asking about quests
            if is_quest_related:
                print("DEBUG: Fetching quests from database...")
                try:
                    # Get only top 3 open quests to keep payload small
                    all_quests = list(Quest.objects.filter(status='open')[:3].values('id', 'title', 'gold_reward', 'difficulty'))
                    print(f"DEBUG: Fetched {len(all_quests)} open quests from database")
                    
                    if all_quests:
                        quest_data = []
                        for q in all_quests:
                            quest_data.append(f"Quest {q['id']}: {q['title']} | {q['gold_reward']} gold | {q['difficulty']}")
                        
                        quest_list = "\n".join(quest_data)
                        system_prompt = f"""You are the Tavern Keeper's AI assistant for PeerQuest. The user is asking about quests.

REAL QUESTS AVAILABLE:
{quest_list}

Only recommend these exact quests if the user asks for quest recommendations. Never create fictional quests. Answer their specific question about quests."""
                        print("DEBUG: Injected real quest data into system prompt")
                    else:
                        system_prompt = "You are the Tavern Keeper's AI assistant for PeerQuest. No quests are currently available in the tavern."
                        print("DEBUG: No quests found in database")
                        
                except Exception as e:
                    print(f"DEBUG: Error fetching quests: {e}")
                    system_prompt = "You are the Tavern Keeper's AI assistant for PeerQuest. Database error occurred when fetching quests."
            else:
                print("DEBUG: Not quest-related, using basic system prompt")

            # Limit messages to avoid payload too large error
            # Keep only the last 3 messages to reduce payload size
            recent_messages = messages[-3:] if len(messages) > 3 else messages
            print(f"DEBUG: Truncated messages from {len(messages)} to {len(recent_messages)}")
            
            groq_messages = [
                {"role": "system", "content": system_prompt},
            ]
            
            # Add recent messages only
            for m in recent_messages:
                groq_messages.append({"role": m.get("role", "user"), "content": m.get("content", "")})
            
            payload = {
                "model": "llama-3.3-70b-versatile",
                "messages": groq_messages,
                "max_tokens": 300,  # Reduced to help with payload size
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
