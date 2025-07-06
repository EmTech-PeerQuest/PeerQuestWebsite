"""
Custom password validators for enhanced security.
"""

import re
from django.core.exceptions import ValidationError
from django.utils.translation import gettext as _
from django.contrib.auth.password_validation import CommonPasswordValidator
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import timedelta

User = get_user_model()


class PasswordStrengthChecker:
    """
    Real-time password strength checker with detailed feedback.
    """
    
    def __init__(self):
        self.min_length = 12
        self.max_sequential = 3
        self.history_count = 5
        
    def check_password_strength(self, password, user=None):
        """
        Check password strength and return user-friendly feedback.
        Returns a dictionary with strength score and helpful suggestions.
        """
        feedback = {
            'score': 0,
            'strength': 'very_weak',
            'message': '',
            'suggestions': [],
            'requirements': {
                'length': False,
                'uppercase': False,
                'lowercase': False,
                'numbers': False,
                'symbols': False,
                'no_common': False
            },
            'is_valid': False
        }
        
        if not password:
            feedback['message'] = _("Please enter a password")
            return feedback
        
        # Check length (more lenient)
        if len(password) >= 12:
            feedback['score'] += 30
            feedback['requirements']['length'] = True
        elif len(password) >= 8:
            feedback['score'] += 20
            feedback['suggestions'].append(_("Try using 12+ characters for better security"))
        else:
            feedback['suggestions'].append(_("Use at least 8 characters"))
        
        # Check uppercase
        if re.search(r'[A-Z]', password):
            feedback['score'] += 15
            feedback['requirements']['uppercase'] = True
        else:
            feedback['suggestions'].append(_("Add an uppercase letter (A-Z)"))
        
        # Check lowercase
        if re.search(r'[a-z]', password):
            feedback['score'] += 15
            feedback['requirements']['lowercase'] = True
        else:
            feedback['suggestions'].append(_("Add a lowercase letter (a-z)"))
        
        # Check numbers
        if re.search(r'[0-9]', password):
            feedback['score'] += 15
            feedback['requirements']['numbers'] = True
        else:
            feedback['suggestions'].append(_("Add a number (0-9)"))
        
        # Check symbols (optional but recommended)
        if re.search(r'[!@#$%^&*()_+\-=\[\]{};:,.<>?]', password):
            feedback['score'] += 20
            feedback['requirements']['symbols'] = True
        else:
            feedback['suggestions'].append(_("Add a special character (!@#$...)"))
        
        # Check for common passwords (only show if it's actually common)
        if not self._is_common_password(password):
            feedback['score'] += 5
            feedback['requirements']['no_common'] = True
        else:
            feedback['suggestions'].append(_("Avoid common passwords like 'password123'"))
        
        # Only warn about personal info if it's detected
        if user and self._contains_personal_info(password, user):
            feedback['suggestions'].append(_("Don't use your username or email in your password"))
        
        # Only warn about sequential characters if detected
        if self._has_sequential_characters(password):
            feedback['suggestions'].append(_("Avoid sequences like '123' or 'abc'"))
        
        # Determine strength and create friendly messages
        if feedback['score'] >= 85:
            feedback['strength'] = 'very_strong'
            feedback['message'] = _("Excellent! Your password is very strong 🔒")
        elif feedback['score'] >= 70:
            feedback['strength'] = 'strong'
            feedback['message'] = _("Great! Your password is strong 💪")
        elif feedback['score'] >= 50:
            feedback['strength'] = 'medium'
            feedback['message'] = _("Good! Your password is decent 👍")
        elif feedback['score'] >= 30:
            feedback['strength'] = 'weak'
            feedback['message'] = _("Getting there! A few more improvements needed 🔧")
        else:
            feedback['strength'] = 'very_weak'
            feedback['message'] = _("Let's make your password stronger! 🚀")
        
        # Password is valid if it meets basic requirements
        basic_requirements = (
            len(password) >= 8 and
            feedback['requirements']['uppercase'] and
            feedback['requirements']['lowercase'] and
            feedback['requirements']['numbers']
        )
        
        feedback['is_valid'] = basic_requirements
        
        return feedback
    
    def _has_sequential_characters(self, password):
        """Check if password contains sequential characters."""
        for i in range(len(password) - self.max_sequential + 1):
            sequence = password[i:i + self.max_sequential]
            
            # Check ascending sequences
            if self._is_sequential(sequence):
                return True
            
            # Check descending sequences
            if self._is_sequential(sequence[::-1]):
                return True
        
        return False
    
    def _is_sequential(self, sequence):
        """Check if characters are sequential."""
        if len(sequence) < 2:
            return False
        
        for i in range(len(sequence) - 1):
            if ord(sequence[i + 1]) - ord(sequence[i]) != 1:
                return False
        
        return True
    
    def _contains_personal_info(self, password, user):
        """Check if password contains personal information."""
        if not user:
            return False
        
        password_lower = password.lower()
        
        # Check against username
        if user.username and len(user.username) > 3:
            if user.username.lower() in password_lower:
                return True
        
        # Check against email
        if user.email:
            email_parts = user.email.split('@')
            if len(email_parts[0]) > 3 and email_parts[0].lower() in password_lower:
                return True
        
        # Check against display name
        if hasattr(user, 'display_name') and user.display_name and len(user.display_name) > 3:
            if user.display_name.lower() in password_lower:
                return True
        
        return False
    
    def _is_common_password(self, password):
        """Check if password is common."""
        password_lower = password.lower()
        
        # Common patterns
        common_patterns = [
            r'^password\d*$',  # password, password1, password123, etc.
            r'^admin\d*$',     # admin, admin1, admin123, etc.
            r'^qwerty\d*$',    # qwerty, qwerty1, qwerty123, etc.
            r'^\d{8,}$',       # All numbers (8 or more digits)
            r'^[a-zA-Z]{8,}$', # All letters (8 or more)
            r'^123456\d*$',    # 123456, 1234567, etc.
            r'^welcome\d*$',   # welcome, welcome1, etc.
            r'^letmein\d*$',   # letmein, letmein1, etc.
        ]
        
        for pattern in common_patterns:
            if re.match(pattern, password_lower):
                return True
        
        # Common passwords list
        common_passwords = [
            'password', '123456', '123456789', 'qwerty', 'abc123', 
            'password123', 'admin', 'welcome', 'letmein', 'monkey',
            'dragon', 'princess', 'sunshine', 'master', 'shadow',
            'football', 'baseball', 'superman', 'michael', 'jordan'
        ]
        
        return password_lower in common_passwords


class SuperAdminExemptPasswordValidator:
    """
    Base class for password validators that exempts superadmins.
    """
    
    def __init__(self, exempt_superadmin=True):
        self.exempt_superadmin = exempt_superadmin
    
    def validate(self, password, user=None):
        # Skip validation for superadmins if exempt_superadmin is True
        if self.exempt_superadmin and user and getattr(user, 'is_superuser', False):
            return
        
        # Call the actual validation method
        self._validate_password(password, user)
    
    def _validate_password(self, password, user=None):
        """Override this method in subclasses."""
        pass


class EnhancedMinimumLengthValidator(SuperAdminExemptPasswordValidator):
    """
    Validate that the password has a minimum length of 12 characters.
    """
    
    def __init__(self, min_length=12, exempt_superadmin=True):
        super().__init__(exempt_superadmin)
        self.min_length = min_length
    
    def _validate_password(self, password, user=None):
        if len(password) < self.min_length:
            raise ValidationError(
                _("This password is too short. It must contain at least %(min_length)d characters."),
                code='password_too_short',
                params={'min_length': self.min_length},
            )
    
    def get_help_text(self):
        return _(
            "Your password must contain at least %(min_length)d characters."
        ) % {'min_length': self.min_length}


class ComplexityValidator(SuperAdminExemptPasswordValidator):
    """
    Validate that the password contains a mix of character types.
    """
    
    def __init__(self, require_uppercase=True, require_lowercase=True, 
                 require_numbers=True, require_symbols=True, exempt_superadmin=True):
        super().__init__(exempt_superadmin)
        self.require_uppercase = require_uppercase
        self.require_lowercase = require_lowercase
        self.require_numbers = require_numbers
        self.require_symbols = require_symbols
    
    def _validate_password(self, password, user=None):
        errors = []
        
        if self.require_uppercase and not re.search(r'[A-Z]', password):
            errors.append(_("Password must contain at least one uppercase letter."))
        
        if self.require_lowercase and not re.search(r'[a-z]', password):
            errors.append(_("Password must contain at least one lowercase letter."))
        
        if self.require_numbers and not re.search(r'[0-9]', password):
            errors.append(_("Password must contain at least one number."))
        
        if self.require_symbols and not re.search(r'[!@#$%^&*()_+\-=\[\]{};:,.<>?]', password):
            errors.append(_("Password must contain at least one special character."))
        
        if errors:
            raise ValidationError(errors, code='password_complexity')
    
    def get_help_text(self):
        requirements = []
        if self.require_uppercase:
            requirements.append(_("at least one uppercase letter"))
        if self.require_lowercase:
            requirements.append(_("at least one lowercase letter"))
        if self.require_numbers:
            requirements.append(_("at least one number"))
        if self.require_symbols:
            requirements.append(_("at least one special character"))
        
        return _("Your password must contain ") + ", ".join(requirements) + "."


class PasswordHistoryValidator(SuperAdminExemptPasswordValidator):
    """
    Validate that the password hasn't been used recently.
    """
    
    def __init__(self, history_count=5, exempt_superadmin=True):
        super().__init__(exempt_superadmin)
        self.history_count = history_count
    
    def _validate_password(self, password, user=None):
        if not user or not user.pk:
            return
        
        # Check password history
        from .models import PasswordHistory
        
        recent_passwords = PasswordHistory.objects.filter(
            user=user
        ).order_by('-created_at')[:self.history_count]
        
        for password_entry in recent_passwords:
            if password_entry.check_password(password):
                raise ValidationError(
                    _("You cannot reuse any of your last %(count)d passwords."),
                    code='password_reused',
                    params={'count': self.history_count},
                )
    
    def get_help_text(self):
        return _(
            "Your password cannot be the same as any of your last %(count)d passwords."
        ) % {'count': self.history_count}


class PasswordAgeValidator(SuperAdminExemptPasswordValidator):
    """
    Validate that the password is not too old (for password change frequency).
    """
    
    def __init__(self, max_age_days=90, exempt_superadmin=True):
        super().__init__(exempt_superadmin)
        self.max_age_days = max_age_days
    
    def _validate_password(self, password, user=None):
        if not user or not user.pk:
            return
        
        # Check if password is too old
        if user.last_password_change:
            age = timezone.now() - user.last_password_change
            if age > timedelta(days=self.max_age_days):
                # This is more of a warning than a validation error
                # We'll handle this in the view logic
                pass
    
    def get_help_text(self):
        return _(
            "Consider changing your password every %(days)d days for better security."
        ) % {'days': self.max_age_days}


class PersonalInfoValidator(SuperAdminExemptPasswordValidator):
    """
    Validate that the password doesn't contain personal information.
    """
    
    def __init__(self, exempt_superadmin=True):
        super().__init__(exempt_superadmin)
    
    def _validate_password(self, password, user=None):
        if not user:
            return
        
        password_lower = password.lower()
        
        # Check against username
        if user.username and len(user.username) > 3:
            if user.username.lower() in password_lower:
                raise ValidationError(
                    _("The password cannot contain your username."),
                    code='password_contains_username',
                )
        
        # Check against email
        if user.email:
            email_parts = user.email.split('@')
            if len(email_parts[0]) > 3 and email_parts[0].lower() in password_lower:
                raise ValidationError(
                    _("The password cannot contain your email address."),
                    code='password_contains_email',
                )
        
        # Check against display name
        if user.display_name and len(user.display_name) > 3:
            if user.display_name.lower() in password_lower:
                raise ValidationError(
                    _("The password cannot contain your display name."),
                    code='password_contains_display_name',
                )
    
    def get_help_text(self):
        return _("Your password cannot contain your personal information.")


class SequentialCharacterValidator(SuperAdminExemptPasswordValidator):
    """
    Validate that the password doesn't contain sequential characters.
    """
    
    def __init__(self, max_sequential=3, exempt_superadmin=True):
        super().__init__(exempt_superadmin)
        self.max_sequential = max_sequential
    
    def _validate_password(self, password, user=None):
        # Check for sequential characters
        for i in range(len(password) - self.max_sequential + 1):
            sequence = password[i:i + self.max_sequential]
            
            # Check ascending sequences
            if self._is_sequential(sequence):
                raise ValidationError(
                    _("The password cannot contain sequential characters like '123' or 'abc'."),
                    code='password_sequential_characters',
                )
            
            # Check descending sequences
            if self._is_sequential(sequence[::-1]):
                raise ValidationError(
                    _("The password cannot contain sequential characters like '321' or 'cba'."),
                    code='password_sequential_characters',
                )
    
    def _is_sequential(self, sequence):
        """Check if characters are sequential."""
        if len(sequence) < 2:
            return False
        
        for i in range(len(sequence) - 1):
            if ord(sequence[i + 1]) - ord(sequence[i]) != 1:
                return False
        
        return True
    
    def get_help_text(self):
        return _(
            "Your password cannot contain sequential characters like '123' or 'abc'."
        )


class CommonPasswordValidatorEnhanced(SuperAdminExemptPasswordValidator):
    """
    Enhanced common password validator with additional checks.
    """
    
    def __init__(self, password_list_path=None, exempt_superadmin=True):
        super().__init__(exempt_superadmin)
        self.common_validator = CommonPasswordValidator(password_list_path)
    
    def _validate_password(self, password, user=None):
        # Use Django's built-in common password validator
        self.common_validator.validate(password, user)
        
        # Additional common patterns
        common_patterns = [
            r'^password\d*$',  # password, password1, password123, etc.
            r'^admin\d*$',     # admin, admin1, admin123, etc.
            r'^qwerty\d*$',    # qwerty, qwerty1, qwerty123, etc.
            r'^\d{8,}$',       # All numbers (8 or more digits)
            r'^[a-zA-Z]{8,}$', # All letters (8 or more)
        ]
        
        password_lower = password.lower()
        
        for pattern in common_patterns:
            if re.match(pattern, password_lower):
                raise ValidationError(
                    _("This password is too common. Please choose a more unique password."),
                    code='password_too_common',
                )
    
    def get_help_text(self):
        return _("Your password cannot be a commonly used password.")
