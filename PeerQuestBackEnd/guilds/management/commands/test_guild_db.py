from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.utils import timezone
from guilds.models import Guild, GuildMembership, GuildJoinRequest, GuildTag, GuildSocialLink
import random

User = get_user_model()


class Command(BaseCommand):
    help = 'Test guild database functionality with sample data'

    def add_arguments(self, parser):
        parser.add_argument(
            '--create-sample-data',
            action='store_true',
            help='Create sample guilds and users for testing',
        )
        parser.add_argument(
            '--run-database-tests',
            action='store_true',
            help='Run comprehensive database tests',
        )
        parser.add_argument(
            '--cleanup',
            action='store_true',
            help='Clean up test data',
        )
        parser.add_argument(
            '--performance-test',
            action='store_true',
            help='Run performance tests with larger datasets',
        )

    def handle(self, *args, **options):
        if options['cleanup']:
            self.cleanup_test_data()
        
        if options['create_sample_data']:
            self.create_sample_data()
        
        if options['run_database_tests']:
            self.run_database_tests()
        
        if options['performance_test']:
            self.run_performance_tests()

    def cleanup_test_data(self):
        """Clean up any existing test data"""
        self.stdout.write(self.style.WARNING('Cleaning up test data...'))
        
        # Delete test guilds (this will cascade to related objects)
        test_guilds = Guild.objects.filter(name__startswith='Test ')
        count = test_guilds.count()
        test_guilds.delete()
        
        # Delete test users
        test_users = User.objects.filter(user_name__startswith='test_')
        user_count = test_users.count()
        test_users.delete()
        
        self.stdout.write(
            self.style.SUCCESS(f'Cleaned up {count} guilds and {user_count} users')
        )

    def create_sample_data(self):
        """Create sample data for testing"""
        self.stdout.write(self.style.SUCCESS('Creating sample data...'))
        
        # Create test users
        users = []
        specializations = ['alchemy', 'art_design', 'writing', 'research', 'protection', 'development', 'music', 'marketing']
        
        for i in range(10):
            user = User.objects.create_user(
                email=f'test_user_{i}@example.com',
                user_name=f'test_user_{i}',
                first_name=f'TestUser{i}',
                password='testpass123'
            )
            users.append(user)
        
        # Create test guilds
        guilds = []
        for i, spec in enumerate(specializations):
            guild = Guild.objects.create(
                name=f'Test {spec.title()} Guild',
                description=f'A test guild focused on {spec.replace("_", " ")}',
                specialization=spec,
                privacy='public' if i % 2 == 0 else 'private',
                require_approval=i % 3 == 0,
                minimum_level=random.randint(1, 20),
                allow_discovery=True,
                show_on_home_page=i % 2 == 0,
                owner=users[i % len(users)]
            )
            guilds.append(guild)
            
            # Add tags
            tags = [f'{spec}', 'testing', f'level-{guild.minimum_level}']
            for tag in tags:
                GuildTag.objects.create(guild=guild, tag=tag)
            
            # Add social links
            if i % 2 == 0:
                GuildSocialLink.objects.create(
                    guild=guild,
                    platform_name='Discord',
                    url=f'https://discord.gg/test-{spec}'
                )
            
            # Add members
            for j in range(random.randint(2, 6)):
                user_index = (i + j + 1) % len(users)
                if users[user_index] != guild.owner:
                    membership = GuildMembership.objects.create(
                        guild=guild,
                        user=users[user_index],
                        role='admin' if j == 0 else 'member',
                        status='approved',
                        is_active=True
                    )
                    membership.approve(guild.owner)
        
        # Create some join requests
        for i in range(5):
            guild = random.choice(guilds)
            user = random.choice([u for u in users if not guild.is_member(u)])
            if user and not GuildJoinRequest.objects.filter(guild=guild, user=user).exists():
                GuildJoinRequest.objects.create(
                    guild=guild,
                    user=user,
                    message=f'Test join request from {user.user_name}'
                )
        
        self.stdout.write(
            self.style.SUCCESS(f'Created {len(users)} users and {len(guilds)} guilds with sample data')
        )

    def run_database_tests(self):
        """Run comprehensive database tests"""
        self.stdout.write(self.style.SUCCESS('Running database integrity tests...'))
        
        errors = []
        
        # Test 1: Check guild-membership consistency
        for guild in Guild.objects.all():
            actual_count = guild.memberships.filter(is_active=True).count()
            if guild.member_count != actual_count:
                errors.append(
                    f'Guild "{guild.name}" has member_count={guild.member_count} '
                    f'but actual active members={actual_count}'
                )
        
        # Test 2: Check owner is always a member
        for guild in Guild.objects.all():
            if not guild.is_member(guild.owner):
                errors.append(f'Guild "{guild.name}" owner is not listed as a member')
        
        # Test 3: Check unique constraints
        # Check for duplicate guild names
        names = Guild.objects.values_list('name', flat=True)
        duplicate_names = [name for name in set(names) if list(names).count(name) > 1]
        if duplicate_names:
            errors.append(f'Duplicate guild names found: {duplicate_names}')
        
        # Test 4: Check join request consistency
        for request in GuildJoinRequest.objects.filter(is_approved=True):
            if not request.guild.is_member(request.user):
                errors.append(
                    f'Approved join request for user {request.user.user_name} '
                    f'to guild "{request.guild.name}" but user is not a member'
                )
        
        # Test 5: Check admin permissions
        for membership in GuildMembership.objects.filter(role='admin', is_active=True):
            if not membership.guild.is_admin(membership.user):
                errors.append(
                    f'User {membership.user.user_name} has admin role in '
                    f'"{membership.guild.name}" but is_admin() returns False'
                )
        
        # Test 6: Check privacy settings consistency
        for guild in Guild.objects.filter(privacy='private', allow_discovery=True):
            errors.append(
                f'Private guild "{guild.name}" has allow_discovery=True '
                f'(should typically be False for private guilds)'
            )
        
        if errors:
            self.stdout.write(self.style.ERROR('Database integrity issues found:'))
            for error in errors:
                self.stdout.write(self.style.ERROR(f'  ❌ {error}'))
        else:
            self.stdout.write(self.style.SUCCESS('✅ All database integrity tests passed!'))
        
        # Display statistics
        self.display_statistics()

    def run_performance_tests(self):
        """Run performance tests"""
        self.stdout.write(self.style.SUCCESS('Running performance tests...'))
        
        import time
        
        # Test 1: Guild list query performance
        start_time = time.time()
        guilds = list(Guild.objects.filter(
            privacy='public',
            allow_discovery=True,
            show_on_home_page=True
        ).prefetch_related('tags', 'owner'))
        query_time = time.time() - start_time
        
        self.stdout.write(f'Guild list query: {len(guilds)} guilds in {query_time:.4f}s')
        
        # Test 2: Member list performance
        if guilds:
            guild = guilds[0]
            start_time = time.time()
            members = list(guild.memberships.filter(is_active=True).select_related('user'))
            query_time = time.time() - start_time
            
            self.stdout.write(f'Member list query: {len(members)} members in {query_time:.4f}s')
        
        # Test 3: Search performance
        start_time = time.time()
        search_results = list(Guild.objects.filter(
            name__icontains='test'
        ).prefetch_related('tags'))
        query_time = time.time() - start_time
        
        self.stdout.write(f'Search query: {len(search_results)} results in {query_time:.4f}s')

    def display_statistics(self):
        """Display database statistics"""
        self.stdout.write(self.style.SUCCESS('\n📊 Database Statistics:'))
        
        # Guild statistics
        total_guilds = Guild.objects.count()
        public_guilds = Guild.objects.filter(privacy='public').count()
        private_guilds = Guild.objects.filter(privacy='private').count()
        
        self.stdout.write(f'Total Guilds: {total_guilds}')
        self.stdout.write(f'  Public: {public_guilds}')
        self.stdout.write(f'  Private: {private_guilds}')
        
        # Membership statistics
        total_memberships = GuildMembership.objects.filter(is_active=True).count()
        total_admins = GuildMembership.objects.filter(role='admin', is_active=True).count()
        total_members = GuildMembership.objects.filter(role='member', is_active=True).count()
        
        self.stdout.write(f'Active Memberships: {total_memberships}')
        self.stdout.write(f'  Admins: {total_admins}')
        self.stdout.write(f'  Members: {total_members}')
        
        # Join request statistics
        pending_requests = GuildJoinRequest.objects.filter(is_approved=None).count()
        approved_requests = GuildJoinRequest.objects.filter(is_approved=True).count()
        rejected_requests = GuildJoinRequest.objects.filter(is_approved=False).count()
        
        self.stdout.write(f'Join Requests:')
        self.stdout.write(f'  Pending: {pending_requests}')
        self.stdout.write(f'  Approved: {approved_requests}')
        self.stdout.write(f'  Rejected: {rejected_requests}')
        
        # Specialization distribution
        from django.db.models import Count
        specializations = Guild.objects.values('specialization').annotate(
            count=Count('specialization')
        ).order_by('-count')
        
        self.stdout.write(f'Guild Specializations:')
        for spec in specializations:
            self.stdout.write(f'  {spec["specialization"]}: {spec["count"]}')
