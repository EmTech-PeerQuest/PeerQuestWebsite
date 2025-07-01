from django.db.models.signals import post_save, pre_save, post_delete
from django.dispatch import receiver
from django.utils import timezone
from .models import Quest, QuestParticipant
from xp.utils import award_xp


@receiver(pre_save, sender=Quest)
def auto_set_xp_reward(sender, instance, **kwargs):
    """
    Automatically set XP reward based on difficulty when a quest is saved.
    """
    if instance.difficulty in instance.DIFFICULTY_XP_MAPPING:
        instance.xp_reward = instance.DIFFICULTY_XP_MAPPING[instance.difficulty]


@receiver(post_save, sender=QuestParticipant)
def award_xp_on_quest_completion(sender, instance, created, **kwargs):
    """
    Award XP to participants when they complete a quest.
    """
    # Only award XP when status changes to 'completed'
    if instance.status == 'completed' and instance.completed_at:
        quest = instance.quest
        user = instance.user
        
        # Award XP based on quest difficulty
        xp_amount = quest.xp_reward
        result = award_xp(
            user=user,
            xp_amount=xp_amount,
            reason=f"Completed quest: {quest.title}"
        )
        
        # You could add notification logic here if you have a notification system
        if result.get("leveled_up"):
            # Handle level up notifications
            print(f"User {user.username} leveled up to level {result['new_level']}!")


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
    """
    quest = instance.quest
    
    # If the assigned user was deleted, clear the assignment
    if quest.assigned_to == instance.user:
        quest.assigned_to = None
        quest.save()
        print(f"Cleared assignment for quest {quest.title} - participant {instance.user.username} was removed")
