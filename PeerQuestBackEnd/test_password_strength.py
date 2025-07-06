#!/usr/bin/env python3
"""
Test script for the password strength checker.
Run this to verify the password validators are working correctly.
"""

import sys
import os

# Add the parent directory to the path to import Django modules
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
import django
django.setup()

from users.password_validators import PasswordStrengthChecker

def test_password_strength():
    """Test various password scenarios."""
    
    checker = PasswordStrengthChecker()
    
    # Test cases with expected results
    test_cases = [
        {
            'password': 'password123',
            'description': 'Common weak password',
            'expected_strength': 'weak'
        },
        {
            'password': 'P@ssw0rd!123',
            'description': 'Strong password with all requirements',
            'expected_strength': 'strong'
        },
        {
            'password': 'MySecureP@ssw0rd2024!',
            'description': 'Very strong password',
            'expected_strength': 'very_strong'
        },
        {
            'password': 'abc123',
            'description': 'Very weak password',
            'expected_strength': 'very_weak'
        },
        {
            'password': 'ABC123def',
            'description': 'Sequential characters',
            'expected_strength': 'weak'
        },
        {
            'password': 'MyLongPasswordWithoutSymbols123',
            'description': 'Long but missing symbols',
            'expected_strength': 'medium'
        }
    ]
    
    print("🔍 Testing Password Strength Checker")
    print("=" * 50)
    
    for i, test_case in enumerate(test_cases, 1):
        print(f"\nTest {i}: {test_case['description']}")
        print(f"Password: {test_case['password']}")
        
        result = checker.check_password_strength(test_case['password'])
        
        print(f"Strength: {result['strength']} (Score: {result['score']}/100)")
        
        # Show requirements
        requirements = result['requirements']
        print("Requirements:")
        for req, status in requirements.items():
            status_icon = "✓" if status else "✗"
            print(f"  {status_icon} {req.replace('_', ' ').title()}")
        
        # Show feedback
        if result['feedback']:
            print("Feedback:")
            for feedback in result['feedback']:
                print(f"  • {feedback}")
        
        # Show errors
        if result['errors']:
            print("Errors:")
            for error in result['errors']:
                print(f"  • {error}")
        
        print("-" * 30)
    
    print("\n✅ Password strength checker test completed!")

if __name__ == '__main__':
    test_password_strength()
