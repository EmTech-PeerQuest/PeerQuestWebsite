const axios = require('axios');

const API_BASE_URL = 'http://localhost:8000';

async function testAPI() {
  try {
    // First, let's get a token by login (you'll need to replace with actual credentials)
    // For now, let's just test the payload structure
    
    const payload = {
      display_name: "Test User",
      username: "testuser",
      email: "test@example.com",
      bio: "Test bio",
      birthday: "1990-01-01",
      gender: "male",
      location: "United States",
      social_links: {
        facebook: "https://facebook.com/testuser",
        twitter: "https://twitter.com/testuser",
        linkedin: "https://linkedin.com/in/testuser",
        youtube: "https://youtube.com/testuser",
        website: "https://testuser.com"
      },
      settings: {
        language: "English",
      },
      preferred_language: "en",
      timezone: "UTC",
      notification_preferences: {},
      privacy_settings: {},
      avatar_url: "https://example.com/avatar.jpg",
    };
    
    console.log('Test payload:', JSON.stringify(payload, null, 2));
    
    // For now, just validate the structure
    console.log('Payload fields:', Object.keys(payload));
    
    // Expected backend fields from serializer:
    const expectedFields = [
      "display_name", "username", "email", "bio", "birthday", "gender", "location",
      "social_links", "settings", "avatar_url", "preferred_language", "timezone",
      "notification_preferences", "privacy_settings"
    ];
    
    console.log('Expected fields:', expectedFields);
    
    const payloadFields = Object.keys(payload);
    const missingFields = expectedFields.filter(field => !payloadFields.includes(field));
    const extraFields = payloadFields.filter(field => !expectedFields.includes(field));
    
    console.log('Missing fields:', missingFields);
    console.log('Extra fields:', extraFields);
    
  } catch (error) {
    console.error('Error:', error);
  }
}

testAPI();
