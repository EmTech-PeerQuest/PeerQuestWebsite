import asyncio
import websockets

async def test_ws():
    uri = "ws://localhost:8000/ws/notifications/testuser/"  # Change 'testuser' to a real user_id if needed
    try:
        async with websockets.connect(uri) as websocket:
            print("WebSocket connection successful!")
            await asyncio.sleep(2)  # Keep open briefly
    except Exception as e:
        print(f"WebSocket connection failed: {e}")

if __name__ == "__main__":
    asyncio.run(test_ws())
