import requests

API_URL = "http://127.0.0.1:8000/api/notifications/"
# Replace this with your actual JWT access token from localStorage
ACCESS_TOKEN = "PASTE_YOUR_ACCESS_TOKEN_HERE"

headers = {
    "Authorization": f"Bearer {ACCESS_TOKEN}",
    "Content-Type": "application/json",
}

response = requests.get(API_URL, headers=headers)
print(f"Status: {response.status_code}")
try:
    print("Response:", response.json())
except Exception:
    print("Raw response:", response.text)
