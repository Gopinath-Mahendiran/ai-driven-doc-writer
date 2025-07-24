from django.db import models
from django.contrib.auth.models import AbstractUser , Group ,Permission


class CustomUser(AbstractUser):
    username = models.CharField(max_length=150, unique=True, blank=True, null=True)
    email = models.EmailField(unique=True, blank=False, null=False)
    github_token = models.TextField(blank=True, null=True)
    github_username = models.CharField(max_length=255, blank=True, null=True)
    is_github_connected = models.BooleanField(default=False)
    updated_at = models.DateTimeField(auto_now=True)

    groups = models.ManyToManyField(
        Group,
        related_name='customuser_set',
        blank=True,
        help_text='The groups this user belongs to.',
        related_query_name='customuser'
    )

    user_permissions = models.ManyToManyField(
        Permission,
        related_name='customuser_set',
        blank=True,
        help_text='Specific permissions for this user.',
        related_query_name='customuser'
    )


class project(models.Model):
    owner = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='projects')
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    repository_url = models.URLField(max_length=255, blank=True, null=True)
    branch = models.CharField(max_length=100, blank=True, null=True,default="master")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name
    
    class Meta:
      ordering = ['-created_at']
      constraints = [
          models.UniqueConstraint(fields=['owner', 'repository_url', 'branch'], name='unique_owner_repo_branch')
      ]
