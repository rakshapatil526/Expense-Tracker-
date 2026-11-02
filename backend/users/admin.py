from django.contrib import admin
from .models import User


@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ('user_id', 'email', 'name', 'is_staff', 'is_active', 'created_at')
    search_fields = ('email', 'name')
    ordering = ('user_id',)
