import os
import requests
import json

# Test the enhanced AI chatbot with greetings and general conversation
BASE_URL = "http://localhost:8000/api/users/ai-chat/"

def test_prompt(prompt, category):
    """Test a specific prompt and display the response"""
    print(f"\n{'='*50}")
    print(f"Testing {category}:")
    print(f"User: {prompt}")
    print(f"{'='*50}")
    
    data = {
        "messages": [
            {
                "role": "user",
                "content": prompt
            }
        ],
        "user": {
            "username": "testuser",
            "id": 1
        }
    }
    
    try:
        response = requests.post(BASE_URL, json=data, headers={'Content-Type': 'application/json'})
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            reply = result.get('reply', 'No reply found')
            # Truncate very long responses for readability
            if len(reply) > 800:
                reply = reply[:800] + "... [truncated for display]"
            print(f"AI Response: {reply}")
        else:
            print(f"Error Response: {response.text}")
            
    except Exception as e:
        print(f"Error: {e}")

# Test different types of enhanced prompts
test_prompts = [
    ("Hello!", "GREETING"),
    ("Hi there, what can you help me with?", "GENERAL HELP"),
    ("What is PeerQuest about?", "ABOUT PEERQUEST"),
    ("Thanks for your help, goodbye!", "FAREWELL"),
    ("How does this platform work?", "PLATFORM EXPLANATION"),
    ("What can you do?", "CAPABILITIES")
]

if __name__ == "__main__":
    print("Testing Enhanced PeerQuest Tavern AI with Conversational Features")
    
    for prompt, category in test_prompts:
        test_prompt(prompt, category)
        
    print(f"\n{'='*50}")
    print("Enhanced tavern AI testing complete!")
