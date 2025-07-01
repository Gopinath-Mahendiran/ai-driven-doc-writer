from django.db import models
from django.contrib.auth.models import User


class project(models.Model):
    owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name='projects')
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
# Create your models here.
