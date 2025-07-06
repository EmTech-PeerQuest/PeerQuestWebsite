#!/usr/bin/env python3
"""
Test script to verify enhanced username validation works correctly
"""
import os
import sys
import django

# Add the project directory to the Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from users.validators import validate_username_content, normalize_username

def test_username_validation():
    """Test various username scenarios"""
    test_cases = [
        # Valid usernames
        ("validuser", True, "Valid username should pass"),
        ("user123", True, "Valid username with numbers should pass"),
        ("user_name", True, "Valid username with underscore should pass"),
        ("TestUser", True, "Valid username with mixed case should pass"),
        
        # Invalid - too short
        ("ab", False, "Username too short should fail"),
        
        # Invalid - too long
        ("verylongusernamethatexceeds20chars", False, "Username too long should fail"),
        
        # Invalid - numbers only
        ("12345", False, "Numbers only should fail"),
        
        # Invalid - special characters
        ("user@name", False, "Username with @ should fail"),
        ("user-name", False, "Username with hyphen should fail"),
        ("user name", False, "Username with space should fail"),
        
        # Invalid - leet speak substitutions
        ("fucq", False, "Username with 'q' for 'g' should fail"),
        ("shituser", False, "Username with profanity should fail"),
        ("f4ck", False, "Username with '4' for 'a' should fail"),
        ("h3ll0", False, "Username with '3' for 'e' should fail"),
        ("adm1n", False, "Username with '1' for 'i' should fail"),
        ("b0t", False, "Username with '0' for 'o' should fail"),
        
        # Invalid - more complex leet speak
        ("fuqing", False, "Username with 'qu' for 'g' should fail"),
        ("shitqu", False, "Username with 'qu' substitution should fail"),
        ("damqit", False, "Username with 'q' substitution should fail"),
        
        # Invalid - reserved words
        ("admin", False, "Reserved word 'admin' should fail"),
        ("moderator", False, "Reserved word 'moderator' should fail"),
        ("bot", False, "Reserved word 'bot' should fail"),
        ("system", False, "Reserved word 'system' should fail"),
        
        # Invalid - excessive repeating
        ("userrrrr", False, "Username with excessive repeating should fail"),
        ("aaaa", False, "Username with 4+ repeating chars should fail"),
        
        # Edge cases
        ("", False, "Empty username should fail"),
        ("   ", False, "Whitespace-only username should fail"),
    ]
    
    print("Testing Enhanced Username Validation")
    print("=" * 50)
    
    passed = 0
    failed = 0
    
    for username, expected_valid, description in test_cases:
        is_valid, error_message = validate_username_content(username)
        
        if is_valid == expected_valid:
            print(f"✓ PASS: {description}")
            print(f"  Username: '{username}' -> Valid: {is_valid}")
            if not is_valid:
                print(f"  Error: {error_message}")
            passed += 1
        else:
            print(f"✗ FAIL: {description}")
            print(f"  Username: '{username}' -> Expected: {expected_valid}, Got: {is_valid}")
            print(f"  Error: {error_message}")
            failed += 1
        
        # Show normalization for debugging
        normalized = normalize_username(username)
        if normalized != username.lower():
            print(f"  Normalized: '{username}' -> '{normalized}'")
        
        print()
    
    print(f"Results: {passed} passed, {failed} failed")
    
    if failed == 0:
        print("🎉 All tests passed!")
        return True
    else:
        print("❌ Some tests failed!")
        return False

if __name__ == "__main__":
    success = test_username_validation()
    sys.exit(0 if success else 1)
