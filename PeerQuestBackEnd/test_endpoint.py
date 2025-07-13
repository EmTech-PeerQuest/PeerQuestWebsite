import requests
import json

# Test the reset-warnings endpoint
url = "http://127.0.0.1:8000/api/guilds/e2403198-0979-4c09-bffb-8b54e710bbda/reset-warnings/"
headers = {
    "Content-Type": "application/json",
    "Authorization": "Bearer test-token"
}

try:
    response = requests.post(url, headers=headers)
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.text}")
except Exception as e:
    print(f"Error: {e}")
