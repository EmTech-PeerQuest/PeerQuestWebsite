
import os
import subprocess
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

def test_groq_curl():
    groq_api_key = os.environ.get('GROQ_API_KEY')
    if not groq_api_key:
        print('GROQ_API_KEY not found in environment!')
        return
    curl_cmd = [
        'curl', 'https://api.groq.com/openai/v1/chat/completions', '-s',
        '-H', 'Content-Type: application/json',
        '-H', f'Authorization: Bearer {groq_api_key}',
        '-d', '{"model": "llama-3.3-70b-versatile", "messages": [{"role": "user", "content": "Explain the importance of fast language models"}]}'
    ]
    print('Running curl command to test Groq API key...')
    result = subprocess.run(curl_cmd, capture_output=True, text=True)
    print('Curl output:')
    print(result.stdout)
    if result.stderr:
        print('Curl error:')
        print(result.stderr)

if __name__ == '__main__':
    test_groq_curl()
