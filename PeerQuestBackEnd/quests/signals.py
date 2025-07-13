from django.db.models.signals import post_save, pre_save, post_delete
from django.dispatch import receiver
from django.utils import timezone
from datetime import datetime
from .models import Quest, QuestParticipant, QuestSubmission
from applications.models import Application
from xp.utils import award_xp
from transactions.transaction_utils import award_gold
from transactions.models import TransactionType
import logging

# WebSocket imports
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync

logger = logging.getLogger(__name__)
channel_layer = get_channel_layer()


def send_to_group(group_name, message):
    """Helper function to send message to WebSocket group."""
    try:
        if channel_layer:
            logger.info(f"Attempting to send WebSocket message to group '{group_name}': {message}")
            async_to_sync(channel_layer.group_send)(group_name, message)
            logger.info(f"Successfully sent WebSocket message to group '{group_name}': {message['type']}")
        else:
            logger.warning("Channel layer not available for WebSocket message")
    except Exception as e:
        logger.error(f"Error sending WebSocket message to group '{group_name}': {e}")


@receiver(pre_save, sender=Quest)
def auto_set_xp_reward(sender, instance, **kwargs):
    """
    Automatically set XP reward based on difficulty when a quest is saved.
    """
    if instance.difficulty in instance.DIFFICULTY_XP_MAPPING:
        instance.xp_reward = instance.DIFFICULTY_XP_MAPPING[instance.difficulty]


@receiver(post_save, sender=QuestParticipant)
def award_xp_and_gold_on_quest_completion(sender, instance, created, **kwargs):
    """
    Award XP and gold to participants when they complete a quest.
    """
    # Only award XP and gold when status changes to 'completed'
    if instance.status == 'completed' and instance.completed_at:
        quest = instance.quest
        user = instance.user
        
        # Award XP based on quest difficulty
        xp_amount = quest.xp_reward
        xp_result = award_xp(
            user=user,
            xp_amount=xp_amount,
            reason=f"Completed quest: {quest.title}"
        )
        
        # Award gold based on quest gold_reward
        gold_amount = quest.gold_reward
        if gold_amount > 0:
            gold_result = award_gold(
                user=user,
                amount=gold_amount,
                description=f"Reward for completing quest: {quest.title}",
                quest=quest,
                transaction_type=TransactionType.QUEST_REWARD
            )
            print(f"User {user.username} received {gold_amount} gold for completing quest: {quest.title}")
            # Commission is handled through the reservation system - the total reserved amount
            # included both the reward and commission, and we only award the reward amount
            # to participants, effectively keeping the commission in the system
        # Handle level up notifications
        if xp_result.get("leveled_up"):
            print(f"User {user.username} leveled up to level {xp_result['new_level']}!")

        # Award 'First Quest' achievement if this is the user's first completed quest
        try:
            from quests.achievement_award import award_first_quest_achievement
            award_first_quest_achievement(user)
        except Exception as e:
            logger.error(f"Error awarding 'First Quest' achievement: {e}")


@receiver(post_save, sender=Quest)
def handle_quest_completion(sender, instance, created, **kwargs):
    """
    Handle quest completion logic when quest status changes to completed.
    """
    if not created and instance.status == 'completed' and instance.completed_at:
        # Mark all participants as completed if not already
        participants = QuestParticipant.objects.filter(
            quest=instance,
            status__in=['joined', 'in_progress']
        )
        
        for participant in participants:
            participant.status = 'completed'
            participant.completed_at = timezone.now()
            participant.save()  # This will trigger the XP award signal above


@receiver(post_save, sender=QuestParticipant)
def handle_assignment_on_participant_change(sender, instance, created, **kwargs):
    """
    Handle quest assignment when participant status changes.
    """
    quest = instance.quest
    
    # If participant dropped out, check if quest should be unassigned
    if instance.status == 'dropped':
        # If the assigned user dropped out, clear the assignment
        if quest.assigned_to == instance.user:
            quest.assigned_to = None
            quest.save()
            print(f"Cleared assignment for quest {quest.title} - participant {instance.user.username} dropped out")
    
    # If this is the only active participant, they should be assigned
    elif instance.status in ['joined', 'in_progress']:
        active_participants = QuestParticipant.objects.filter(
            quest=quest,
            status__in=['joined', 'in_progress']
        )
        
        # If there's only one active participant and no one is assigned, assign to them
        if active_participants.count() == 1 and not quest.assigned_to:
            quest.assigned_to = instance.user
            quest.save()
            print(f"Assigned quest {quest.title} to {instance.user.username}")


@receiver(post_delete, sender=QuestParticipant)
def handle_assignment_on_participant_delete(sender, instance, **kwargs):
    """
    Handle quest assignment when participant is deleted.
    Also, if no participants remain, set quest status to 'open'.
    """
    quest = instance.quest
    # If the assigned user was deleted, clear the assignment
    if quest.assigned_to == instance.user:
        quest.assigned_to = None
        quest.save()
        print(f"Cleared assignment for quest {quest.title} - participant {instance.user.username} was removed")

    # Check if there are any active participants left
    from .models import QuestParticipant  # avoid circular import
    active_participants = QuestParticipant.objects.filter(
        quest=quest,
        status__in=['joined', 'in_progress']
    )
    if active_participants.count() == 0:
        quest.status = 'open'
        quest.save()
        print(f"Quest '{quest.title}' set to 'open' as no participants remain.")

# WebSocket Signal Handlers for Real-time Updates

@receiver(post_save, sender=Quest)
def quest_status_websocket_update(sender, instance, created, **kwargs):
    """Send WebSocket update when quest status changes."""
    if not created:  # Only for updates, not creation
        message = {
            'type': 'quest_status_changed',
            'quest_id': instance.id,
            'status': instance.status,
            'timestamp': datetime.now().isoformat()
        }
        send_to_group('quest_updates', message)


@receiver(post_save, sender=Application)
def application_status_websocket_update(sender, instance, created, **kwargs):
    """Send WebSocket updates when application status changes."""
    # Send to user-specific group for application status
    user_group = f'user_applications_{instance.applicant.id}'
    message = {
        'type': 'application_status_changed',
        'application_id': instance.id,
        'quest_id': instance.quest.id,
        'status': instance.status,
        'timestamp': datetime.now().isoformat()
    }
    send_to_group(user_group, message)
    
    # Also update quest application count
    application_count = Application.objects.filter(quest=instance.quest).count()
    quest_message = {
        'type': 'quest_application_count_changed',
        'quest_id': instance.quest.id,
        'application_count': application_count,
        'timestamp': datetime.now().isoformat()
    }
    send_to_group('quest_updates', quest_message)


@receiver(post_delete, sender=Application)
def application_deleted_websocket_update(sender, instance, **kwargs):
    """Send WebSocket update when application is deleted."""
    # Update quest application count
    application_count = Application.objects.filter(quest=instance.quest).count()
    message = {
        'type': 'quest_application_count_changed',
        'quest_id': instance.quest.id,
        'application_count': application_count,
        'timestamp': datetime.now().isoformat()
    }
    send_to_group('quest_updates', message)


@receiver(post_save, sender=QuestSubmission)
def quest_submission_websocket_update(sender, instance, created, **kwargs):
    """Send WebSocket update when quest submission is created or updated."""
    message = {
        'type': 'quest_submission_updated',
        'quest_id': instance.quest_participant.quest.id,
        'submission_id': instance.id,
        'status': instance.status,
        'timestamp': datetime.now().isoformat()
    }
    send_to_group('quest_updates', message)
    
    # Also send to quest creator
    creator_group = f'user_notifications_{instance.quest_participant.quest.creator.id}'
    notification_message = {
        'type': 'notification_created',
        'notification_id': f'submission_{instance.id}',
        'title': 'New Quest Submission',
        'message': f'New submission received for quest: {instance.quest_participant.quest.title}',
        'timestamp': datetime.now().isoformat()
    }
    send_to_group(creator_group, notification_message)
