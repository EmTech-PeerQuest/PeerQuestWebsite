# Guild Database Testing Guide

## Overview
This guide provides comprehensive instructions for testing your guild database functionality in PeerQuest. The guild system includes complex relationships between users, guilds, memberships, and join requests that need thorough testing.

## Quick Start

### 1. Run All Tests
```bash
# Run all guild tests
python manage.py test guilds.tests -v 2

# Run specific test categories
python manage.py test guilds.tests.GuildModelTest -v 2
python manage.py test guilds.tests.GuildAPITest -v 2
python manage.py test guilds.tests.GuildDatabaseIntegrationTest -v 2
```

### 2. Use the Testing Script
```bash
# Run comprehensive testing script
python test_guild_database.py --all

# Run specific test types
python test_guild_database.py --models
python test_guild_database.py --api
python test_guild_database.py --integration
python test_guild_database.py --performance
```

### 3. Use Management Commands
```bash
# Create sample test data
python manage.py test_guild_db --create-sample-data

# Run database integrity checks
python manage.py test_guild_db --run-database-tests

# Performance testing
python manage.py test_guild_db --performance-test

# Cleanup test data
python manage.py test_guild_db --cleanup
```

## Test Categories

### 1. Model Tests (`GuildModelTest`)
Tests the core database model functionality:
- Guild creation and validation
- User relationship methods (`is_member`, `is_owner`, `is_admin`)
- String representations
- Basic model constraints

**Key Areas Tested:**
- Guild model field validation
- User-guild relationship methods
- Model string representations
- Basic data integrity

### 2. API Tests (`GuildAPITest`)
Tests the REST API endpoints:
- Guild CRUD operations
- Authentication and permissions
- Join/leave functionality
- Search and filtering

**Key Areas Tested:**
- Guild list and detail views
- Guild creation and updates
- Join requests and approvals
- Member management
- Permission checks

### 3. Integration Tests (`GuildDatabaseIntegrationTest`)
Comprehensive tests for complex workflows:
- Complete membership workflows
- Admin permission systems
- Guild privacy and discovery
- Member count accuracy
- Search functionality

**Key Areas Tested:**
- End-to-end user workflows
- Complex business logic
- Data consistency across operations
- Privacy and permission systems

### 4. Performance Tests (`GuildPerformanceTest`)
Tests database performance with larger datasets:
- Bulk operations
- Query optimization
- Large dataset handling

**Key Areas Tested:**
- Query performance with multiple guilds
- Bulk membership operations
- Database efficiency

## Database Schema Testing

### Core Tables
The guild system includes these main tables:
- `guilds_guild` - Main guild information
- `guilds_guildmembership` - User-guild relationships
- `guilds_guildjoinrequest` - Pending join requests
- `guilds_guildtag` - Guild tags
- `guilds_guildsociallink` - Social media links

### Key Relationships
1. **Guild → Owner (User)**: One-to-one relationship
2. **Guild → Memberships**: One-to-many relationship
3. **User → Memberships**: One-to-many relationship
4. **Guild → Join Requests**: One-to-many relationship
5. **Guild → Tags**: One-to-many relationship

## Manual Testing Workflows

### 1. Guild Creation Workflow
```python
# Create a test guild
from guilds.models import Guild, GuildMembership
from django.contrib.auth import get_user_model

User = get_user_model()

# Create user
user = User.objects.create_user(
    email='test@example.com',
    user_name='testuser',
    first_name='Test',
    password='testpass123'
)

# Create guild
guild = Guild.objects.create(
    name='Test Guild',
    description='A test guild',
    specialization='development',
    owner=user
)

# Create owner membership
membership = GuildMembership.objects.create(
    guild=guild,
    user=user,
    role='owner',
    status='approved',
    is_active=True
)

# Verify
assert guild.is_member(user)
assert guild.is_owner(user)
assert guild.member_count == 1
```

### 2. Join Request Workflow
```python
from guilds.models import GuildJoinRequest

# Create applicant
applicant = User.objects.create_user(
    email='applicant@example.com',
    user_name='applicant',
    first_name='Applicant',
    password='testpass123'
)

# Create join request
join_request = GuildJoinRequest.objects.create(
    guild=guild,
    user=applicant,
    message='Please let me join!'
)

# Process request (approve)
join_request.is_approved = True
join_request.processed_by = user
join_request.save()

# Create membership
new_membership = GuildMembership.objects.create(
    guild=guild,
    user=applicant,
    role='member',
    status='approved',
    is_active=True
)
new_membership.approve(user)

# Verify
assert guild.is_member(applicant)
assert guild.member_count == 2
```

## API Testing with cURL

### 1. List Guilds
```bash
curl -X GET http://localhost:8000/api/guilds/
```

### 2. Create Guild (Authenticated)
```bash
curl -X POST http://localhost:8000/api/guilds/create/ \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "New Guild",
    "description": "A new test guild",
    "specialization": "development",
    "tags": ["python", "django"],
    "social_links": [
      {"platform_name": "Discord", "url": "https://discord.gg/example"}
    ]
  }'
```

### 3. Join Guild
```bash
curl -X POST http://localhost:8000/api/guilds/{guild_id}/join/ \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"message": "Please let me join!"}'
```

## Database Integrity Checks

### 1. Member Count Accuracy
```python
# Check if guild.member_count matches actual active members
for guild in Guild.objects.all():
    actual_count = guild.memberships.filter(is_active=True).count()
    if guild.member_count != actual_count:
        print(f"Guild {guild.name}: Expected {actual_count}, got {guild.member_count}")
```

### 2. Orphaned Records
```python
# Check for orphaned memberships
orphaned = GuildMembership.objects.filter(guild__isnull=True)
print(f"Orphaned memberships: {orphaned.count()}")

# Check for orphaned join requests
orphaned_requests = GuildJoinRequest.objects.filter(guild__isnull=True)
print(f"Orphaned join requests: {orphaned_requests.count()}")
```

### 3. Owner Memberships
```python
# Check if all guild owners have corresponding memberships
for guild in Guild.objects.all():
    if not guild.is_member(guild.owner):
        print(f"Guild {guild.name} owner {guild.owner.user_name} is not a member")
```

## Performance Testing

### 1. Query Performance
```python
import time
from django.db import connection

# Test guild list query performance
start_time = time.time()
guilds = list(Guild.objects.filter(
    privacy='public',
    allow_discovery=True
).prefetch_related('tags', 'owner'))
query_time = time.time() - start_time

print(f"Retrieved {len(guilds)} guilds in {query_time:.4f}s")
print(f"Number of queries: {len(connection.queries)}")
```

### 2. Bulk Operations
```python
# Test bulk membership creation
users = [User.objects.create_user(
    email=f'user{i}@example.com',
    user_name=f'user{i}',
    first_name=f'User{i}',
    password='testpass123'
) for i in range(100)]

start_time = time.time()
memberships = [GuildMembership(
    guild=guild,
    user=user,
    role='member',
    status='approved',
    is_active=True
) for user in users]

GuildMembership.objects.bulk_create(memberships)
bulk_time = time.time() - start_time

print(f"Bulk created {len(memberships)} memberships in {bulk_time:.4f}s")
```

## Troubleshooting

### Common Issues

1. **Migration Issues**
   ```bash
   # If database is out of sync
   python manage.py migrate guilds --fake-initial
   python manage.py migrate guilds
   ```

2. **Test Data Conflicts**
   ```bash
   # Clean up test data
   python manage.py test_guild_db --cleanup
   ```

3. **Permission Errors**
   - Check that user has proper authentication
   - Verify guild ownership and admin permissions
   - Ensure user is a member before testing member-only features

4. **Serializer Errors**
   - Ensure UserSerializer uses correct field names (`user_name` not `username`)
   - Check that all required fields are provided

### Performance Issues

1. **Slow Queries**
   - Use `prefetch_related()` for related objects
   - Use `select_related()` for foreign keys
   - Add database indexes for frequently queried fields

2. **Memory Usage**
   - Use `iterator()` for large querysets
   - Implement pagination for large result sets
   - Use `only()` and `defer()` to limit fields

### Database Schema Issues

If you encounter errors like "no such column: guilds_guild.custom_emblem", this indicates a database schema mismatch between your models and the actual database tables.

**Quick Fix:**
```bash
# Use the schema migration script
python migrate_guild_schema.py

# Or use the database reset script
python reset_guild_db.py
```

**Manual Fix:**
```bash
# Reset guild migrations
python manage.py migrate guilds zero --fake

# Drop and recreate tables (if no important data)
python manage.py shell -c "
from django.db import connection
cursor = connection.cursor()
cursor.execute('DROP TABLE IF EXISTS guilds_guild')
cursor.execute('DROP TABLE IF EXISTS guilds_guildmembership')
cursor.execute('DROP TABLE IF EXISTS guilds_guildjoinrequest')
cursor.execute('DROP TABLE IF EXISTS guilds_guildtag')
cursor.execute('DROP TABLE IF EXISTS guilds_guildsociallink')
"

# Apply migrations
python manage.py migrate guilds
```

**Verify Fix:**
```bash
# Quick verification
python quick_guild_test.py

# Should show: "🎉 All tests passed! Your guild database is working perfectly!"
```

## Continuous Testing

### 1. Set up pre-commit hooks
```bash
# Add to .git/hooks/pre-commit
#!/bin/sh
python manage.py test guilds.tests --failfast
```

### 2. CI/CD Integration
```yaml
# Example GitHub Actions workflow
name: Test Guild Database
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Set up Python
        uses: actions/setup-python@v2
        with:
          python-version: 3.12
      - name: Install dependencies
        run: pip install -r requirements.txt
      - name: Run guild tests
        run: python manage.py test guilds.tests
```

### 3. Regular Database Health Checks
```bash
# Create a cron job to run integrity checks
0 2 * * * cd /path/to/project && python manage.py test_guild_db --run-database-tests
```

## Summary

This comprehensive testing approach ensures:
- ✅ Model integrity and validation
- ✅ API functionality and security
- ✅ Complex workflow correctness
- ✅ Database performance
- ✅ Data consistency
- ✅ User experience quality

Use the provided tools and scripts to maintain high quality and reliability in your guild system.
