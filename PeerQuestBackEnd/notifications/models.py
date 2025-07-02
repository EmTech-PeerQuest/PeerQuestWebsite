from django.db import models

# Create your models here.

class Notification(models.Model):
    NOTIFICATION_TYPES = [
        ("info", "Info"),
        ("warning", "Warning"),
        ("success", "Success"),
        ("error", "Error"),
        ("accepted", "Accepted"),
        ("rejected", "Rejected"),
        ("hello, adventurer", "Hello, Adventurer"),
        ("goodbye, adventurer", "Goodbye, Adventurer"),
        ("permission denied", "Permission Denied"),
        ("permission granted", "Permission Granted"),
        ("quest updated successfully", "Quest Updated Successfully"),
        ("you have been logged out", "You have been logged out"),
        ("welcome to the peerquest tavern, your account has been created!", "Welcome to the PeerQuest Tavern, Your Account has been Created!"),    
        ("welcome back to the peerquest tavern", "Welcome Back to the PeerQuest Tavern"),    
    ]

    notification_id = models.AutoField(primary_key=True)
    user = models.ForeignKey('users.User', on_delete=models.CASCADE, related_name='notifications')
    type = models.CharField(max_length=50, choices=NOTIFICATION_TYPES)
    title = models.CharField(max_length=200)
    message = models.TextField()
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    read_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"{self.title} - {self.user}"
