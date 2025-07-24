from django.contrib import admin

# Register your models here.
from .models import project, CustomUser


@admin.register(project)
class projectAdmin(admin.ModelAdmin):
    list_display = ("id","owner",'name', 'repository_url', 'branch', 'created_at', 'updated_at')
    search_fields = ('name', 'repository_url')

@admin.register(CustomUser)
class CustomUserAdmin(admin.ModelAdmin):
    list_display = ("id", "username", "email", "github_username", "is_github_connected",  "github_token" , )
    search_fields = ("email",)  