from .models import Category

DEFAULT_EXPENSE_CATEGORIES = [
    {'name': 'Food', 'icon': 'utensils', 'color': '#ef4444'},
    {'name': 'Travel', 'icon': 'plane', 'color': '#3b82f6'},
    {'name': 'Shopping', 'icon': 'shopping-bag', 'color': '#ec4899'},
    {'name': 'Education', 'icon': 'book-open', 'color': '#8b5cf6'},
    {'name': 'Bills', 'icon': 'receipt', 'color': '#f59e0b'},
    {'name': 'Health', 'icon': 'heart-pulse', 'color': '#10b981'},
    {'name': 'Entertainment', 'icon': 'film', 'color': '#06b6d4'},
    {'name': 'Groceries', 'icon': 'shopping-cart', 'color': '#84cc16'},
]

DEFAULT_INCOME_CATEGORIES = [
    {'name': 'Salary', 'icon': 'briefcase', 'color': '#10b981'},
    {'name': 'Freelance', 'icon': 'laptop', 'color': '#6366f1'},
    {'name': 'Business', 'icon': 'trending-up', 'color': '#3b82f6'},
    {'name': 'Investment', 'icon': 'coins', 'color': '#f59e0b'},
    {'name': 'Gifts', 'icon': 'gift', 'color': '#ec4899'},
    {'name': 'Other', 'icon': 'wallet', 'color': '#64748b'},
]


def ensure_default_categories(user=None):
    """
    Creates system-wide default categories (user=None) if they do not exist yet.
    """
    for item in DEFAULT_EXPENSE_CATEGORIES:
        Category.objects.get_or_create(
            category_name=item['name'],
            type='expense',
            user=None,
            defaults={'icon': item['icon'], 'color': item['color']}
        )

    for item in DEFAULT_INCOME_CATEGORIES:
        Category.objects.get_or_create(
            category_name=item['name'],
            type='income',
            user=None,
            defaults={'icon': item['icon'], 'color': item['color']}
        )
