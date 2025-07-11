from django.db import models
from django.conf import settings
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
        super().save(*args, **kwargs)

    def approve(self, reviewer):
        self.status = 'approved'
        self.reviewed_by = reviewer
        self.reviewed_at = timezone.now()
        self.save()
        # Add applicant to guild members
        self.guild.members.add(self.applicant)
        # Optionally notify applicant

    def reject(self, reviewer):
        self.status = 'rejected'
        self.reviewed_by = reviewer
        self.reviewed_at = timezone.now()
        self.save()
        # Optionally notify applicant
