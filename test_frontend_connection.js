// Test the frontend to backend connection
// Open browser console and run this

async function testBackendConnection() {
    try {
        console.log("Testing backend connection...");
        
        const response = await fetch("http://localhost:8000/api/users/ai-chat/", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                messages: [
                    { role: "user", content: "Hello test" }
                ],
                user: { username: "testuser", id: 1 }
            }),
        });
        
        console.log("Response status:", response.status);
        console.log("Response ok:", response.ok);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log("Response data:", data);
        
        return data;
    } catch (error) {
        console.error("Error:", error);
        throw error;
    }
}

// Run the test
testBackendConnection();
