from django.db import models
from django.conf import settings
from django.utils import timezone
from guilds.models import Guild

class GuildApplication(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
    ]
    guild = models.ForeignKey(Guild, on_delete=models.CASCADE, related_name='applications')
    applicant = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='guild_applications')
    skills = models.TextField()
    experience = models.TextField()
    portfolio_url = models.URLField()
    statement_of_intent = models.TextField()
    status = models.CharField(max_length=15, choices=STATUS_CHOICES, default='pending')
    applied_at = models.DateTimeField(auto_now_add=True)
    reviewed_at = models.DateTimeField(null=True, blank=True)
    reviewed_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='reviewed_guild_applications')

    class Meta:
        unique_together = ('guild', 'applicant', 'status')
        indexes = [
            models.Index(fields=['guild', 'status']),
            models.Index(fields=['applicant', 'status']),
        ]
        ordering = ['-applied_at']

    def __str__(self):
        return f"{self.applicant.username} -> {self.guild.name} ({self.get_status_display()})"

    def clean(self):
        if self.status == 'pending':
            existing = GuildApplication.objects.filter(
                guild=self.guild,
                applicant=self.applicant,
                status='pending'
            ).exclude(pk=self.pk)
            if existing.exists():
                from django.core.exceptions import ValidationError
                raise ValidationError('You already have a pending application for this guild.')


    def save(self, *args, **kwargs):
        self.clean()
        is_new = self.pk is None
        super().save(*args, **kwargs)
        # Notify guild master on new application
        if is_new and self.status == 'pending':
            from notifications.models import Notification
            Notification.objects.create(
                user=self.guild.owner,
                notif_type='guild_event',
                title='New Guild Application',
                message=f'{self.applicant.username} has applied to join your guild "{self.guild.name}".',
                guild_id=self.guild.guild_id,
                guild_name=self.guild.name,
                applicant=self.applicant.username,
                application_id=self.id
            )

    def approve(self, reviewer):
        self.status = 'approved'
        self.reviewed_by = reviewer
        self.reviewed_at = timezone.now()
        super().save()
        # Add applicant to guild members
        self.guild.members.add(self.applicant)
        # Notify applicant of acceptance
        from notifications.models import Notification
        Notification.objects.create(
            user=self.applicant,
            notif_type='guild_event',
            title='Guild Application Accepted',
            message=f'Your application to join guild "{self.guild.name}" has been accepted!',
            guild_id=self.guild.guild_id,
            guild_name=self.guild.name,
            application_id=self.id,
            status='approved'
        )

    def reject(self, reviewer):
        self.status = 'rejected'
        self.reviewed_by = reviewer
        self.reviewed_at = timezone.now()
        super().save()
        # Notify applicant of rejection
        from notifications.models import Notification
        Notification.objects.create(
            user=self.applicant,
            notif_type='guild_event',
            title='Guild Application Rejected',
            message=f'Your application to join guild "{self.guild.name}" was rejected.',
            guild_id=self.guild.guild_id,
            guild_name=self.guild.name,
            application_id=self.id,
            status='rejected'
        )
