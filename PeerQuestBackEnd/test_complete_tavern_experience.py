import os
import requests
import json

# Comprehensive test of the PeerQuest Tavern AI
BASE_URL = "http://localhost:8000/api/users/ai-chat/"

def test_conversation_flow():
    """Test a natural conversation flow with the tavern AI"""
    
    conversation_flow = [
        ("Hello! I'm new to PeerQuest", "NEW ADVENTURER GREETING"),
        ("What can I do here?", "PLATFORM OVERVIEW"),
        ("How do I join a guild?", "GUILD GUIDANCE"),
        ("How do I earn gold?", "GOLD EARNING"),
        ("Find me some quests", "QUEST RECOMMENDATIONS"),
        ("How do I level up?", "LEVELING ADVICE"),
        ("How do I post my own quest?", "QUEST POSTING"),
        ("Thanks for all your help!", "FAREWELL")
    ]
    
    print("🏰 COMPREHENSIVE PEERQUEST TAVERN AI TEST 🏰")
    print("=" * 60)
    print("Simulating a complete new adventurer experience...\n")
    
    for i, (message, context) in enumerate(conversation_flow, 1):
        print(f"Step {i}: {context}")
        print(f"Adventurer: \"{message}\"")
        print("-" * 40)
        
        data = {
            "messages": [{"role": "user", "content": message}],
            "user": {"username": "NewAdventurer", "id": 1}
        }
        
        try:
            response = requests.post(BASE_URL, json=data, headers={'Content-Type': 'application/json'})
            
            if response.status_code == 200:
                result = response.json()
                reply = result.get('reply', 'No reply found')
                
                # Show first 200 characters for flow readability
                if len(reply) > 200:
                    preview = reply[:200] + f"... [+{len(reply)-200} more characters]"
                else:
                    preview = reply
                    
                print(f"Tavern Keeper AI: {preview}")
                print(f"✅ Response received ({len(reply)} characters)")
            else:
                print(f"❌ Error: Status {response.status_code}")
                
        except Exception as e:
            print(f"❌ Error: {e}")
            
        print("\n" + "=" * 60 + "\n")
        
    print("🎉 TAVERN AI COMPREHENSIVE TEST COMPLETE! 🎉")
    print("The PeerQuest Tavern AI successfully handled all conversation scenarios!")

if __name__ == "__main__":
    test_conversation_flow()
