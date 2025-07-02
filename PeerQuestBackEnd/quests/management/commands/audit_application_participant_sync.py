"""
Django management command to audit data synchronization between Applications and QuestParticipants.

This command performs a comprehensive audit to identify:
1. Approved applications without corresponding participant records
2. Participant records without approved applications
3. Quest status inconsistencies
4. Assignment inconsistencies
5. Data integrity issues

Usage:
    python manage.py audit_application_participant_sync
    python manage.py audit_application_participant_sync --fix-issues
    python manage.py audit_application_participant_sync --user admin
    python manage.py audit_application_participant_sync --detailed
"""

from django.core.management.base import BaseCommand, CommandError
from django.contrib.auth import get_user_model
from django.db import transaction
from django.db import models
from django.utils import timezone
from applications.models import Application
from quests.models import Quest, QuestParticipant
import sys
from collections import defaultdict

User = get_user_model()


class Command(BaseCommand):
    help = 'Audit data synchronization between Applications and QuestParticipants'
    
    def add_arguments(self, parser):
        parser.add_argument(
            '--fix-issues',
            action='store_true',
            help='Automatically fix discovered issues',
        )
        parser.add_argument(
            '--user',
            type=str,
            help='Audit specific user only',
        )
        parser.add_argument(
            '--detailed',
            action='store_true',
            help='Show detailed information for each issue',
        )
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show what would be fixed without making changes',
        )

    def handle(self, *args, **options):
        self.fix_issues = options['fix_issues']
        self.target_user = options['user']
        self.detailed = options['detailed']
        self.dry_run = options['dry_run']
        
        if self.dry_run and not self.fix_issues:
            self.stdout.write(
                self.style.WARNING('--dry-run flag is only meaningful with --fix-issues')
            )
        
        self.stdout.write(
            self.style.SUCCESS(
                '=' * 80 + '\n'
                'APPLICATION-PARTICIPANT SYNCHRONIZATION AUDIT\n'
                '=' * 80
            )
        )
        
        # Initialize counters
        self.reset_counters()
        
        # Run audit phases
        try:
            self.audit_approved_applications_without_participants()
            self.audit_participants_without_approved_applications()
            self.audit_quest_status_inconsistencies()
            self.audit_assignment_inconsistencies()
            self.audit_duplicate_participants()
            
            # Summary report
            self.print_summary()
            
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'Audit failed with error: {str(e)}')
            )
            raise CommandError(f'Audit failed: {str(e)}')

    def reset_counters(self):
        """Initialize all counters for tracking issues"""
        self.stats = {
            'total_users_checked': 0,
            'total_applications': 0,
            'total_participants': 0,
            'approved_without_participants': 0,
            'participants_without_applications': 0,
            'status_inconsistencies': 0,
            'assignment_inconsistencies': 0,
            'duplicate_participants': 0,
            'issues_fixed': 0,
            'issues_found': 0,
        }
        self.issues = []

    def get_users_to_audit(self):
        """Get list of users to audit"""
        if self.target_user:
            try:
                user = User.objects.get(username=self.target_user)
                return [user]
            except User.DoesNotExist:
                raise CommandError(f'User "{self.target_user}" not found')
        else:
            # Get all users who have either applications or participants
            users_with_apps = User.objects.filter(quest_applications__isnull=False).distinct()
            users_with_participants = User.objects.filter(questparticipant__isnull=False).distinct()
            return User.objects.filter(
                models.Q(id__in=users_with_apps) | models.Q(id__in=users_with_participants)
            ).distinct().order_by('username')

    def audit_approved_applications_without_participants(self):
        """Find approved applications that don't have corresponding participant records"""
        self.stdout.write('\n' + '=' * 60)
        self.stdout.write('PHASE 1: Approved Applications Without Participants')
        self.stdout.write('=' * 60)
        
        users = self.get_users_to_audit()
        self.stats['total_users_checked'] = users.count()
        
        for user in users:
            approved_apps = Application.objects.filter(
                applicant=user, 
                status='approved'
            ).select_related('quest')
            
            self.stats['total_applications'] += approved_apps.count()
            
            for app in approved_apps:
                # Check if participant record exists
                participant = QuestParticipant.objects.filter(
                    quest=app.quest,
                    user=user
                ).first()
                
                if not participant:
                    issue = {
                        'type': 'approved_without_participant',
                        'user': user,
                        'quest': app.quest,
                        'application': app,
                        'participant': None,
                        'description': f'User {user.username} has approved application for quest "{app.quest.title}" but no participant record exists'
                    }
                    self.issues.append(issue)
                    self.stats['approved_without_participants'] += 1
                    self.stats['issues_found'] += 1
                    
                    if self.detailed:
                        self.stdout.write(
                            self.style.WARNING(
                                f'  ❌ {user.username} -> Quest "{app.quest.title}" (ID: {app.quest.id})\n'
                                f'     Application: approved at {app.reviewed_at}\n'
                                f'     Participant: MISSING'
                            )
                        )
                    
                    if self.fix_issues:
                        self.fix_missing_participant(issue)

    def audit_participants_without_approved_applications(self):
        """Find participant records that don't have corresponding approved applications"""
        self.stdout.write('\n' + '=' * 60)
        self.stdout.write('PHASE 2: Participants Without Approved Applications')
        self.stdout.write('=' * 60)
        
        participants = QuestParticipant.objects.select_related('quest', 'user')
        if self.target_user:
            participants = participants.filter(user__username=self.target_user)
        
        self.stats['total_participants'] = participants.count()
        
        for participant in participants:
            # Check if approved application exists
            approved_app = Application.objects.filter(
                quest=participant.quest,
                applicant=participant.user,
                status='approved'
            ).first()
            
            if not approved_app:
                issue = {
                    'type': 'participant_without_application',
                    'user': participant.user,
                    'quest': participant.quest,
                    'application': None,
                    'participant': participant,
                    'description': f'User {participant.user.username} has participant record for quest "{participant.quest.title}" but no approved application exists'
                }
                self.issues.append(issue)
                self.stats['participants_without_applications'] += 1
                self.stats['issues_found'] += 1
                
                if self.detailed:
                    self.stdout.write(
                        self.style.WARNING(
                            f'  ❌ {participant.user.username} -> Quest "{participant.quest.title}" (ID: {participant.quest.id})\n'
                            f'     Participant: {participant.status} since {participant.joined_at}\n'
                            f'     Application: MISSING or not approved'
                        )
                    )

    def audit_quest_status_inconsistencies(self):
        """Find quests with status inconsistencies"""
        self.stdout.write('\n' + '=' * 60)
        self.stdout.write('PHASE 3: Quest Status Inconsistencies')
        self.stdout.write('=' * 60)
        
        # Find quests that should be in-progress but aren't
        quests_with_participants = Quest.objects.filter(
            questparticipant__isnull=False
        ).distinct()
        
        if self.target_user:
            quests_with_participants = quests_with_participants.filter(
                questparticipant__user__username=self.target_user
            )
        
        for quest in quests_with_participants:
            participant_count = quest.questparticipant_set.exclude(status='dropped').count()
            
            if participant_count > 0 and quest.status == 'open':
                issue = {
                    'type': 'status_inconsistency',
                    'quest': quest,
                    'expected_status': 'in-progress',
                    'actual_status': quest.status,
                    'participant_count': participant_count,
                    'description': f'Quest "{quest.title}" has {participant_count} participants but status is still "open"'
                }
                self.issues.append(issue)
                self.stats['status_inconsistencies'] += 1
                self.stats['issues_found'] += 1
                
                if self.detailed:
                    self.stdout.write(
                        self.style.WARNING(
                            f'  ❌ Quest "{quest.title}" (ID: {quest.id})\n'
                            f'     Status: {quest.status} (should be in-progress)\n'
                            f'     Participants: {participant_count}'
                        )
                    )
                
                if self.fix_issues:
                    self.fix_quest_status(issue)

    def audit_assignment_inconsistencies(self):
        """Find assignment inconsistencies"""
        self.stdout.write('\n' + '=' * 60)
        self.stdout.write('PHASE 4: Assignment Inconsistencies')
        self.stdout.write('=' * 60)
        
        # Find quests with participants but no assignment
        quests_with_participants = Quest.objects.filter(
            questparticipant__isnull=False,
            assigned_to__isnull=True
        ).distinct()
        
        if self.target_user:
            quests_with_participants = quests_with_participants.filter(
                questparticipant__user__username=self.target_user
            )
        
        for quest in quests_with_participants:
            participants = quest.questparticipant_set.exclude(status='dropped')
            if participants.exists():
                # Get the first (earliest) participant
                first_participant = participants.order_by('joined_at').first()
                
                issue = {
                    'type': 'assignment_inconsistency',
                    'quest': quest,
                    'suggested_assignee': first_participant.user,
                    'description': f'Quest "{quest.title}" has participants but is not assigned to anyone'
                }
                self.issues.append(issue)
                self.stats['assignment_inconsistencies'] += 1
                self.stats['issues_found'] += 1
                
                if self.detailed:
                    self.stdout.write(
                        self.style.WARNING(
                            f'  ❌ Quest "{quest.title}" (ID: {quest.id})\n'
                            f'     Assigned to: None (should be {first_participant.user.username})\n'
                            f'     Participants: {participants.count()}'
                        )
                    )
                
                if self.fix_issues:
                    self.fix_assignment(issue)

    def audit_duplicate_participants(self):
        """Find duplicate participant records"""
        self.stdout.write('\n' + '=' * 60)
        self.stdout.write('PHASE 5: Duplicate Participants')
        self.stdout.write('=' * 60)
        
        # Group participants by quest and user
        participants = QuestParticipant.objects.select_related('quest', 'user')
        if self.target_user:
            participants = participants.filter(user__username=self.target_user)
        
        participant_groups = defaultdict(list)
        for participant in participants:
            key = (participant.quest.id, participant.user.id)
            participant_groups[key].append(participant)
        
        for (quest_id, user_id), group in participant_groups.items():
            if len(group) > 1:
                quest = group[0].quest
                user = group[0].user
                
                issue = {
                    'type': 'duplicate_participants',
                    'quest': quest,
                    'user': user,
                    'participants': group,
                    'description': f'User {user.username} has {len(group)} participant records for quest "{quest.title}"'
                }
                self.issues.append(issue)
                self.stats['duplicate_participants'] += 1
                self.stats['issues_found'] += 1
                
                if self.detailed:
                    self.stdout.write(
                        self.style.WARNING(
                            f'  ❌ {user.username} -> Quest "{quest.title}" (ID: {quest.id})\n'
                            f'     Duplicate participants: {len(group)}'
                        )
                    )

    def fix_missing_participant(self, issue):
        """Fix missing participant record"""
        if self.dry_run:
            self.stdout.write(
                self.style.WARNING(
                    f'  🔧 [DRY RUN] Would create participant for {issue["user"].username} in quest "{issue["quest"].title}"'
                )
            )
            return
        
        try:
            with transaction.atomic():
                result = issue['quest'].assign_to_user(issue['user'])
                if result:
                    self.stats['issues_fixed'] += 1
                    self.stdout.write(
                        self.style.SUCCESS(
                            f'  ✅ Created participant for {issue["user"].username} in quest "{issue["quest"].title}"'
                        )
                    )
                else:
                    self.stdout.write(
                        self.style.ERROR(
                            f'  ❌ Failed to create participant for {issue["user"].username} in quest "{issue["quest"].title}"'
                        )
                    )
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(
                    f'  ❌ Error fixing missing participant: {str(e)}'
                )
            )

    def fix_quest_status(self, issue):
        """Fix quest status inconsistency"""
        if self.dry_run:
            self.stdout.write(
                self.style.WARNING(
                    f'  🔧 [DRY RUN] Would update quest "{issue["quest"].title}" status from {issue["actual_status"]} to {issue["expected_status"]}'
                )
            )
            return
        
        try:
            with transaction.atomic():
                issue['quest'].status = issue['expected_status']
                issue['quest'].save()
                self.stats['issues_fixed'] += 1
                self.stdout.write(
                    self.style.SUCCESS(
                        f'  ✅ Updated quest "{issue["quest"].title}" status to {issue["expected_status"]}'
                    )
                )
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(
                    f'  ❌ Error fixing quest status: {str(e)}'
                )
            )

    def fix_assignment(self, issue):
        """Fix assignment inconsistency"""
        if self.dry_run:
            self.stdout.write(
                self.style.WARNING(
                    f'  🔧 [DRY RUN] Would assign quest "{issue["quest"].title}" to {issue["suggested_assignee"].username}'
                )
            )
            return
        
        try:
            with transaction.atomic():
                issue['quest'].assigned_to = issue['suggested_assignee']
                issue['quest'].save()
                self.stats['issues_fixed'] += 1
                self.stdout.write(
                    self.style.SUCCESS(
                        f'  ✅ Assigned quest "{issue["quest"].title}" to {issue["suggested_assignee"].username}'
                    )
                )
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(
                    f'  ❌ Error fixing assignment: {str(e)}'
                )
            )

    def print_summary(self):
        """Print comprehensive audit summary"""
        self.stdout.write('\n' + '=' * 80)
        self.stdout.write('AUDIT SUMMARY')
        self.stdout.write('=' * 80)
        
        # Overall statistics
        self.stdout.write(f'Users audited: {self.stats["total_users_checked"]}')
        self.stdout.write(f'Total applications: {self.stats["total_applications"]}')
        self.stdout.write(f'Total participants: {self.stats["total_participants"]}')
        
        self.stdout.write('\nISSUES FOUND:')
        self.stdout.write(f'  Approved applications without participants: {self.stats["approved_without_participants"]}')
        self.stdout.write(f'  Participants without approved applications: {self.stats["participants_without_applications"]}')
        self.stdout.write(f'  Quest status inconsistencies: {self.stats["status_inconsistencies"]}')
        self.stdout.write(f'  Assignment inconsistencies: {self.stats["assignment_inconsistencies"]}')
        self.stdout.write(f'  Duplicate participants: {self.stats["duplicate_participants"]}')
        self.stdout.write(f'  TOTAL ISSUES: {self.stats["issues_found"]}')
        
        if self.fix_issues:
            self.stdout.write(f'\nISSUES FIXED: {self.stats["issues_fixed"]}')
            remaining_issues = self.stats["issues_found"] - self.stats["issues_fixed"]
            self.stdout.write(f'REMAINING ISSUES: {remaining_issues}')
        
        # Recommendations
        self.stdout.write('\nRECOMMENDations:')
        if self.stats["issues_found"] == 0:
            self.stdout.write(
                self.style.SUCCESS('✅ No data synchronization issues found. System is healthy!')
            )
        else:
            if not self.fix_issues:
                self.stdout.write('  - Run with --fix-issues to automatically resolve issues')
                self.stdout.write('  - Run with --dry-run --fix-issues to preview fixes')
            self.stdout.write('  - Review approval workflow error handling')
            self.stdout.write('  - Add logging to track when assign_to_user fails')
            self.stdout.write('  - Consider adding database constraints')
            self.stdout.write('  - Schedule regular audits with this command')
        
        # Exit status
        if self.stats["issues_found"] > 0:
            if self.fix_issues and self.stats["issues_fixed"] == self.stats["issues_found"]:
                self.stdout.write(
                    self.style.SUCCESS('\n✅ All issues have been resolved!')
                )
            else:
                self.stdout.write(
                    self.style.WARNING(f'\n⚠️  {self.stats["issues_found"]} issues require attention.')
                )
                sys.exit(1)
        
        self.stdout.write('\n' + '=' * 80)
