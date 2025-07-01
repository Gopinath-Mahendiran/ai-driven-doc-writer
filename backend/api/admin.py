from django.contrib import admin

# Register your models here.
from .models import project

@admin.register(project)
class projectAdmin(admin.ModelAdmin):
    list_display = ("id","owner",'name', 'repository_url', 'branch', 'created_at', 'updated_at')
    search_fields = ('name', 'repository_url')