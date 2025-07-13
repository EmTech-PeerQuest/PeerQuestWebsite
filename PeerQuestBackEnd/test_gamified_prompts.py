import os
import requests
import json

# Test the AI chatbot with specific gamified prompts
BASE_URL = "http://localhost:8000/api/users/ai-chat/"

def test_prompt(prompt, category):
    """Test a specific prompt and display the response"""
    print(f"\n{'='*50}")
    print(f"Testing {category} prompt:")
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
            print(f"AI Response: {result.get('reply', 'No reply found')}")
        else:
            print(f"Error Response: {response.text}")
            
    except Exception as e:
        print(f"Error: {e}")

# Test different types of prompts
test_prompts = [
    ("How do I join a guild?", "GUILD"),
    ("How do I post a quest?", "QUEST POSTING"),
    ("How do I level up?", "LEVELING"),
    ("How do I earn gold?", "GOLD EARNING"),
    ("Find me some good quests", "QUEST RECOMMENDATION"),
    ("What are quests?", "GENERAL QUEST")
]

if __name__ == "__main__":
    print("Testing Enhanced AI Chatbot with Gamified Prompts")
    
    for prompt, category in test_prompts:
        test_prompt(prompt, category)
        
    print(f"\n{'='*50}")
    print("Testing complete!")
