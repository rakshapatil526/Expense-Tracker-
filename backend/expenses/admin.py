from django.contrib import admin
from .models import Category, Transaction, Budget


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ('category_id', 'category_name', 'type', 'user', 'created_at')
    list_filter = ('type',)
    search_fields = ('category_name',)


@admin.register(Transaction)
class TransactionAdmin(admin.ModelAdmin):
    list_display = ('transaction_id', 'title', 'amount', 'type', 'category', 'date', 'user')
    list_filter = ('type', 'payment_method', 'date')
    search_fields = ('title', 'description')


@admin.register(Budget)
class BudgetAdmin(admin.ModelAdmin):
    list_display = ('budget_id', 'user', 'category', 'amount', 'month', 'year')
    list_filter = ('year', 'month')
