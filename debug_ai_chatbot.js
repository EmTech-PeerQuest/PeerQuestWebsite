// Simple test function to debug the AI chatbot
async function testAIChatbot() {
    console.log("Testing AI chatbot...");
    
    const testMessage = {
        messages: [
            { role: "user", content: "Hello, find me good quests" }
        ],
        user: { username: "testuser", id: 1 }
    };
    
    try {
        console.log("Sending request to:", "http://localhost:8000/api/users/ai-chat/");
        console.log("Request body:", JSON.stringify(testMessage));
        
        const response = await fetch("http://localhost:8000/api/users/ai-chat/", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(testMessage),
        });
        
        console.log("Response status:", response.status);
        console.log("Response headers:", response.headers);
        console.log("Response ok:", response.ok);
        
        const responseText = await response.text();
        console.log("Response text:", responseText);
        
        if (!response.ok) {
            console.error("HTTP Error:", response.status, responseText);
            return;
        }
        
        const data = JSON.parse(responseText);
        console.log("Parsed response:", data);
        
        console.log("AI Reply:", data.reply);
        
    } catch (error) {
        console.error("Error occurred:", error);
        console.error("Error type:", typeof error);
        console.error("Error message:", error.message);
        console.error("Error stack:", error.stack);
    }
}

// Run the test
testAIChatbot();
