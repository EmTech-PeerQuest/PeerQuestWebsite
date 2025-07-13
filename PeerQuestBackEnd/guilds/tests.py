from django.test import TestCase
from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework.test import APITestCase
from rest_framework import status
from django.utils import timezone
from .models import Guild, GuildMembership, GuildJoinRequest, GuildTag, GuildSocialLink

User = get_user_model()


class GuildModelTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email='test@example.com',
            user_name='testuser',
            first_name='Test',
            password='testpass123'
        )
        self.guild = Guild.objects.create(
            name='Test Guild',
            description='A test guild',
            specialization='development',
            owner=self.user
        )
    
    def test_guild_creation(self):
        self.assertEqual(self.guild.name, 'Test Guild')
        self.assertEqual(self.guild.owner, self.user)
        self.assertEqual(self.guild.member_count, 1)
        self.assertTrue(str(self.guild.guild_id))  # Check UUID is generated
    
    def test_guild_str_method(self):
        self.assertEqual(str(self.guild), 'Test Guild')
    
    def test_is_member_method(self):
        # Create membership
        GuildMembership.objects.create(
            guild=self.guild,
            user=self.user,
            role='owner',
            status='approved',
            is_active=True
        )
        self.assertTrue(self.guild.is_member(self.user))
    
    def test_is_owner_method(self):
        self.assertTrue(self.guild.is_owner(self.user))
        
        # Create another user
        other_user = User.objects.create_user(
            email='other@example.com',
            user_name='otheruser',
            first_name='Other',
            password='testpass123'
        )
        self.assertFalse(self.guild.is_owner(other_user))


class GuildAPITest(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email='test@example.com',
            user_name='testuser',
            first_name='Test',
            password='testpass123'
        )
        self.other_user = User.objects.create_user(
            email='other@example.com',
            user_name='otheruser',
            first_name='Other',
            password='testpass123'
        )
        self.guild = Guild.objects.create(
            name='Test Guild',
            description='A test guild',
            specialization='development',
            owner=self.user
        )
    
    def test_guild_list_view(self):
        """Test that public guilds are listed in guild hall"""
        url = reverse('guilds:guild-list')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['name'], 'Test Guild')
    
    def test_guild_create_view(self):
        """Test creating a new guild"""
        self.client.force_authenticate(user=self.other_user)
        url = reverse('guilds:guild-create')
        data = {
            'name': 'New Guild',
            'description': 'A new test guild',
            'specialization': 'art_design',
            'tags': ['art', 'design', 'creative'],
            'social_links': [
                {'platform_name': 'Discord', 'url': 'https://discord.gg/example'}
            ]
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        # Check if guild was created
        guild = Guild.objects.get(name='New Guild')
        self.assertEqual(guild.owner, self.other_user)
        self.assertEqual(guild.tags.count(), 3)
        self.assertEqual(guild.social_links.count(), 1)
    
    def test_join_guild_without_approval(self):
        """Test joining a guild that doesn't require approval"""
        self.guild.require_approval = False
        self.guild.save()
        
        self.client.force_authenticate(user=self.other_user)
        url = reverse('guilds:join-guild', kwargs={'guild_id': self.guild.guild_id})
        response = self.client.post(url)
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(self.guild.is_member(self.other_user))
    
    def test_join_guild_with_approval(self):
        """Test joining a guild that requires approval"""
        self.guild.require_approval = True
        self.guild.save()
        
        self.client.force_authenticate(user=self.other_user)
        url = reverse('guilds:join-guild', kwargs={'guild_id': self.guild.guild_id})
        response = self.client.post(url, {'message': 'Please let me join!'})
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertFalse(self.guild.is_member(self.other_user))  # Not a member yet
        
        # Check if join request was created
        join_request = GuildJoinRequest.objects.get(guild=self.guild, user=self.other_user)
        self.assertEqual(join_request.message, 'Please let me join!')
    
    def test_guild_detail_view(self):
        """Test getting detailed guild information"""
        url = reverse('guilds:guild-detail', kwargs={'guild_id': self.guild.guild_id})
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['name'], 'Test Guild')
    
    def test_unauthorized_guild_update(self):
        """Test that only guild owner can update guild"""
        self.client.force_authenticate(user=self.other_user)
        url = reverse('guilds:guild-update', kwargs={'guild_id': self.guild.guild_id})
        data = {'name': 'Updated Guild Name'}
        response = self.client.patch(url, data)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)


class GuildMembershipTest(TestCase):
    def setUp(self):
        self.owner = User.objects.create_user(
            email='owner@example.com',
            user_name='owner',
            first_name='Owner',
            password='testpass123'
        )
        self.member = User.objects.create_user(
            email='member@example.com',
            user_name='member',
            first_name='Member',
            password='testpass123'
        )
        self.guild = Guild.objects.create(
            name='Test Guild',
            description='A test guild',
            specialization='development',
            owner=self.owner
        )
    
    def test_membership_approval(self):
        """Test approving a guild membership"""
        membership = GuildMembership.objects.create(
            guild=self.guild,
            user=self.member,
            role='member',
            status='pending',
            is_active=False
        )
        
        membership.approve(self.owner)
        
        self.assertEqual(membership.status, 'approved')
        self.assertTrue(membership.is_active)
        self.assertIsNotNone(membership.approved_at)
        self.assertEqual(membership.approved_by, self.owner)
    
    def test_membership_rejection(self):
        """Test rejecting a guild membership"""
        membership = GuildMembership.objects.create(
            guild=self.guild,
            user=self.member,
            role='member',
            status='pending',
            is_active=False
        )
        
        membership.reject(self.owner)
        
        self.assertEqual(membership.status, 'rejected')
        self.assertFalse(membership.is_active)
        self.assertEqual(membership.approved_by, self.owner)
    
    def test_leave_guild(self):
        """Test leaving a guild"""
        membership = GuildMembership.objects.create(
            guild=self.guild,
            user=self.member,
            role='member',
            status='approved',
            is_active=True
        )
        
        membership.leave()
        
        self.assertEqual(membership.status, 'left')
        self.assertFalse(membership.is_active)
        self.assertIsNotNone(membership.left_at)


class GuildDatabaseIntegrationTest(TestCase):
    """
    Comprehensive database integration tests for Guild system
    """
    def setUp(self):
        # Create test users
        self.owner = User.objects.create_user(
            email='owner@example.com',
            user_name='guildowner',
            first_name='Guild',
            password='testpass123'
        )
        self.admin = User.objects.create_user(
            email='admin@example.com',
            user_name='guildadmin',
            first_name='Admin',
            password='testpass123'
        )
        self.member1 = User.objects.create_user(
            email='member1@example.com',
            user_name='member1',
            first_name='Member',
            password='testpass123'
        )
        self.member2 = User.objects.create_user(
            email='member2@example.com',
            user_name='member2',
            first_name='Member',
            password='testpass123'
        )
        self.applicant = User.objects.create_user(
            email='applicant@example.com',
            user_name='applicant',
            first_name='Applicant',
            password='testpass123'
        )
        
        # Create test guild
        self.guild = Guild.objects.create(
            name='Test Development Guild',
            description='A comprehensive test guild for development',
            specialization='development',
            privacy='public',
            require_approval=True,
            minimum_level=5,
            owner=self.owner,
            allow_discovery=True,
            show_on_home_page=True
        )
        
        # Create owner membership
        owner_membership = GuildMembership.objects.create(
            guild=self.guild,
            user=self.owner,
            role='owner',
            status='approved',
            is_active=True
        )
    
    def test_guild_creation_with_all_fields(self):
        """Test creating a guild with all possible fields"""
        guild = Guild.objects.create(
            name='Complete Test Guild',
            description='A guild with all fields populated',
            specialization='art_design',
            welcome_message='Welcome to our amazing guild!',
            privacy='private',
            require_approval=True,
            minimum_level=10,
            allow_discovery=False,
            show_on_home_page=False,
            who_can_post_quests='admins_only',
            who_can_invite_members='owner_only',
            owner=self.member1
        )
        
        self.assertEqual(guild.name, 'Complete Test Guild')
        self.assertEqual(guild.specialization, 'art_design')
        self.assertEqual(guild.privacy, 'private')
        self.assertEqual(guild.minimum_level, 10)
        self.assertFalse(guild.allow_discovery)
        self.assertEqual(guild.who_can_post_quests, 'admins_only')
        self.assertEqual(guild.member_count, 1)  # Owner is automatically a member
    
    def test_guild_tags_functionality(self):
        """Test adding and managing guild tags"""
        # Add tags to guild
        tag1 = GuildTag.objects.create(guild=self.guild, tag='python')
        tag2 = GuildTag.objects.create(guild=self.guild, tag='django')
        tag3 = GuildTag.objects.create(guild=self.guild, tag='web-development')
        
        self.assertEqual(self.guild.tags.count(), 3)
        self.assertIn(tag1, self.guild.tags.all())
        
        # Test unique constraint
        with self.assertRaises(Exception):
            GuildTag.objects.create(guild=self.guild, tag='python')  # Duplicate
    
    def test_guild_social_links(self):
        """Test guild social links functionality"""
        # Add social links
        discord_link = GuildSocialLink.objects.create(
            guild=self.guild,
            platform_name='Discord',
            url='https://discord.gg/testguild'
        )
        github_link = GuildSocialLink.objects.create(
            guild=self.guild,
            platform_name='GitHub',
            url='https://github.com/testguild'
        )
        
        self.assertEqual(self.guild.social_links.count(), 2)
        self.assertEqual(discord_link.platform_name, 'Discord')
        
        # Test unique constraint
        with self.assertRaises(Exception):
            GuildSocialLink.objects.create(
                guild=self.guild,
                platform_name='Discord',  # Duplicate platform
                url='https://discord.gg/another'
            )
    
    def test_complete_membership_workflow(self):
        """Test the complete workflow from application to membership"""
        # Step 1: User applies to join guild
        join_request = GuildJoinRequest.objects.create(
            guild=self.guild,
            user=self.applicant,
            message='I would love to join this development guild!'
        )
        
        self.assertIsNone(join_request.is_approved)
        self.assertFalse(self.guild.is_member(self.applicant))
        
        # Step 2: Owner approves the request
        join_request.is_approved = True
        join_request.processed_at = timezone.now()
        join_request.processed_by = self.owner
        join_request.save()
        
        # Step 3: Create membership
        membership = GuildMembership.objects.create(
            guild=self.guild,
            user=self.applicant,
            role='member',
            status='approved',
            is_active=True
        )
        membership.approve(self.owner)
        
        # Verify membership
        self.assertTrue(self.guild.is_member(self.applicant))
        self.assertEqual(membership.status, 'approved')
        self.assertTrue(membership.is_active)
        self.assertEqual(membership.approved_by, self.owner)
        
        # Verify guild member count updated
        self.assertEqual(self.guild.member_count, 2)  # Owner + new member
    
    def test_guild_admin_permissions(self):
        """Test guild admin role and permissions"""
        # Create admin membership
        admin_membership = GuildMembership.objects.create(
            guild=self.guild,
            user=self.admin,
            role='admin',
            status='approved',
            is_active=True
        )
        admin_membership.approve(self.owner)
        
        # Test admin permissions
        self.assertTrue(self.guild.is_admin(self.admin))
        self.assertTrue(self.guild.is_admin(self.owner))  # Owner is also admin
        self.assertFalse(self.guild.is_admin(self.member1))  # Regular member
    
    def test_member_leaving_guild(self):
        """Test member leaving guild"""
        # Create membership
        membership = GuildMembership.objects.create(
            guild=self.guild,
            user=self.member1,
            role='member',
            status='approved',
            is_active=True
        )
        membership.approve(self.owner)
        
        initial_count = self.guild.member_count
        
        # Member leaves
        membership.leave()
        
        # Verify leave status
        membership.refresh_from_db()
        self.assertEqual(membership.status, 'left')
        self.assertFalse(membership.is_active)
        self.assertIsNotNone(membership.left_at)
        
        # Verify member count decreased
        self.guild.refresh_from_db()
        self.assertEqual(self.guild.member_count, initial_count - 1)
    
    def test_member_kicking(self):
        """Test kicking a member from guild"""
        # Create membership
        membership = GuildMembership.objects.create(
            guild=self.guild,
            user=self.member1,
            role='member',
            status='approved',
            is_active=True
        )
        membership.approve(self.owner)
        
        initial_count = self.guild.member_count
        
        # Owner kicks member
        membership.kick(self.owner)
        
        # Verify kick status
        membership.refresh_from_db()
        self.assertEqual(membership.status, 'kicked')
        self.assertFalse(membership.is_active)
        self.assertIsNotNone(membership.left_at)
        self.assertEqual(membership.approved_by, self.owner)  # Who kicked them
        
        # Verify member count decreased
        self.guild.refresh_from_db()
        self.assertEqual(self.guild.member_count, initial_count - 1)
    
    def test_guild_privacy_and_discovery(self):
        """Test guild privacy settings and discovery"""
        # Public guild - should be discoverable
        public_guild = Guild.objects.create(
            name='Public Guild',
            description='A public guild',
            specialization='writing',
            privacy='public',
            allow_discovery=True,
            show_on_home_page=True,
            owner=self.member1
        )
        
        # Private guild - should not be discoverable
        private_guild = Guild.objects.create(
            name='Private Guild',
            description='A private guild',
            specialization='music',
            privacy='private',
            allow_discovery=False,
            show_on_home_page=False,
            owner=self.member2
        )
        
        # Test discovery filters
        discoverable_guilds = Guild.objects.filter(
            privacy='public',
            allow_discovery=True,
            show_on_home_page=True
        )
        
        self.assertIn(public_guild, discoverable_guilds)
        self.assertNotIn(private_guild, discoverable_guilds)
    
    def test_multiple_join_requests_prevention(self):
        """Test that users can't have multiple pending join requests"""
        # Create first join request
        join_request1 = GuildJoinRequest.objects.create(
            guild=self.guild,
            user=self.applicant,
            message='First request'
        )
        
        # Try to create second join request (should fail due to unique constraint)
        with self.assertRaises(Exception):
            GuildJoinRequest.objects.create(
                guild=self.guild,
                user=self.applicant,
                message='Second request'
            )
    
    def test_guild_member_count_accuracy(self):
        """Test that guild member count stays accurate through various operations"""
        initial_count = self.guild.member_count  # Should be 1 (owner)
        
        # Add 3 members
        for i, user in enumerate([self.member1, self.member2, self.admin], 1):
            membership = GuildMembership.objects.create(
                guild=self.guild,
                user=user,
                role='member',
                status='approved',
                is_active=True
            )
            membership.approve(self.owner)
            
            self.guild.refresh_from_db()
            self.assertEqual(self.guild.member_count, initial_count + i)
        
        # Remove 1 member (kick)
        membership = GuildMembership.objects.get(guild=self.guild, user=self.member1)
        membership.kick(self.owner)
        
        self.guild.refresh_from_db()
        self.assertEqual(self.guild.member_count, 3)  # 4 - 1 = 3
        
        # Remove 1 member (leave)
        membership = GuildMembership.objects.get(guild=self.guild, user=self.member2)
        membership.leave()
        
        self.guild.refresh_from_db()
        self.assertEqual(self.guild.member_count, 2)  # 3 - 1 = 2
    
    def test_guild_search_functionality(self):
        """Test searching guilds by various criteria"""
        # Create guilds with different attributes
        art_guild = Guild.objects.create(
            name='Artists United',
            description='A guild for digital artists',
            specialization='art_design',
            owner=self.member1,
            privacy='public',
            allow_discovery=True,
            show_on_home_page=True
        )
        
        # Add tags
        GuildTag.objects.create(guild=art_guild, tag='digital-art')
        GuildTag.objects.create(guild=art_guild, tag='design')
        
        # Search by name
        name_results = Guild.objects.filter(name__icontains='artists')
        self.assertIn(art_guild, name_results)
        
        # Search by description
        desc_results = Guild.objects.filter(description__icontains='digital')
        self.assertIn(art_guild, desc_results)
        
        # Search by specialization
        spec_results = Guild.objects.filter(specialization='art_design')
        self.assertIn(art_guild, spec_results)


class GuildPerformanceTest(TestCase):
    """
    Test database performance with larger datasets
    """
    def setUp(self):
        self.owner = User.objects.create_user(
            email='perf@example.com',
            user_name='perfuser',
            first_name='Performance',
            password='testpass123'
        )
    
    def test_large_guild_creation(self):
        """Test creating multiple guilds doesn't cause performance issues"""
        guilds = []
        for i in range(50):  # Create 50 guilds
            guild = Guild.objects.create(
                name=f'Guild {i}',
                description=f'Description for guild {i}',
                specialization='development',
                owner=self.owner
            )
            guilds.append(guild)
        
        self.assertEqual(Guild.objects.count(), 50)
        
        # Test querying performance
        public_guilds = Guild.objects.filter(privacy='public').count()
        self.assertEqual(public_guilds, 50)  # All default to public
    
    def test_bulk_membership_operations(self):
        """Test bulk membership operations"""
        guild = Guild.objects.create(
            name='Large Guild',
            description='A guild with many members',
            specialization='development',
            owner=self.owner
        )
        
        # Create multiple users and memberships
        users = []
        for i in range(20):
            user = User.objects.create_user(
                email=f'user{i}@example.com',
                user_name=f'user{i}',
                first_name=f'User{i}',
                password='testpass123'
            )
            users.append(user)
        
        # Bulk create memberships
        memberships = []
        for user in users:
            membership = GuildMembership(
                guild=guild,
                user=user,
                role='member',
                status='approved',
                is_active=True
            )
            memberships.append(membership)
        
        GuildMembership.objects.bulk_create(memberships)
        
        # Update guild member count
        guild.member_count = guild.memberships.filter(is_active=True).count()
        guild.save()
        
        self.assertEqual(guild.member_count, 21)  # 20 members + 1 owner
