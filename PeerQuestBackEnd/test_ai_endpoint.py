import json
import requests
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Test the AI endpoint directly
def test_ai_endpoint():
    try:
        # Test the Django endpoint
        url = "http://localhost:8000/api/users/ai-chat/"
        data = {
            "messages": [
                {"role": "user", "content": "Hello, test message"}
            ],
            "user": {"username": "testuser", "id": 1}
        }
        
        print("Testing AI endpoint...")
        print(f"URL: {url}")
        print(f"Data: {json.dumps(data, indent=2)}")
        
        response = requests.post(url, json=data, headers={"Content-Type": "application/json"})
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text}")
        
    except Exception as e:
        print(f"Error: {e}")

# Test Groq API directly
def test_groq_direct():
    try:
        groq_api_key = os.environ.get("GROQ_API_KEY")
        print(f"GROQ_API_KEY present: {bool(groq_api_key)}")
        
        if not groq_api_key:
            print("GROQ_API_KEY not found!")
            return
        
        url = "https://api.groq.com/openai/v1/chat/completions"
        headers = {
            "Authorization": f"Bearer {groq_api_key}",
            "Content-Type": "application/json"
        }
        data = {
            "model": "llama-3.3-70b-versatile",
            "messages": [
                {"role": "user", "content": "Hello, this is a test"}
            ],
            "max_tokens": 100
        }
        
        print("\nTesting Groq API directly...")
        print(f"URL: {url}")
        
        response = requests.post(url, json=data, headers=headers)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text}")
        
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_groq_direct()
    print("\n" + "="*50 + "\n")
    test_ai_endpoint()
