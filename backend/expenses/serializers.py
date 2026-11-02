from rest_framework import serializers
from django.db.models import Q
from .models import Category, Transaction, Budget


class CategorySerializer(serializers.ModelSerializer):
    is_custom = serializers.SerializerMethodField()

    class Meta:
        model = Category
        fields = ('category_id', 'category_name', 'type', 'icon', 'color', 'user', 'is_custom', 'created_at')
        read_only_fields = ('category_id', 'user', 'created_at', 'is_custom')

    def get_is_custom(self, obj):
        return obj.user_id is not None

    def validate(self, attrs):
        user = self.context['request'].user
        category_name = attrs.get('category_name', '').strip()
        cat_type = attrs.get('type') or (self.instance.type if self.instance else 'expense')

        if not category_name:
            raise serializers.ValidationError({'category_name': 'Category name cannot be empty.'})

        # Check duplicate category name for this user or default system categories
        qs = Category.objects.filter(
            Q(user=user) | Q(user__isnull=True),
            category_name__iexact=category_name,
            type=cat_type
        )
        if self.instance:
            qs = qs.exclude(category_id=self.instance.category_id)

        if qs.exists():
            raise serializers.ValidationError({'category_name': f'A {cat_type} category with this name already exists.'})

        attrs['category_name'] = category_name
        return attrs

    def create(self, validated_data):
        user = self.context['request'].user
        validated_data['user'] = user
        return super().create(validated_data)


class TransactionSerializer(serializers.ModelSerializer):
    category_details = CategorySerializer(source='category', read_only=True)

    class Meta:
        model = Transaction
        fields = (
            'transaction_id',
            'user',
            'category',
            'category_details',
            'title',
            'amount',
            'type',
            'date',
            'payment_method',
            'description',
            'created_at',
            'updated_at'
        )
        read_only_fields = ('transaction_id', 'user', 'created_at', 'updated_at')

    def validate_amount(self, value):
        if value <= 0:
            raise serializers.ValidationError('Amount must be greater than zero.')
        return value

    def validate(self, attrs):
        category = attrs.get('category')
        tx_type = attrs.get('type') or (self.instance.type if self.instance else None)

        if category and tx_type and category.type != tx_type:
            raise serializers.ValidationError({
                'category': f'Category "{category.category_name}" has type "{category.type}", which does not match transaction type "{tx_type}".'
            })
        return attrs

    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)


class BudgetSerializer(serializers.ModelSerializer):
    category_details = CategorySerializer(source='category', read_only=True)
    spent = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True, default=0)
    remaining = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True, default=0)
    percentage = serializers.FloatField(read_only=True, default=0.0)

    class Meta:
        model = Budget
        fields = (
            'budget_id',
            'user',
            'category',
            'category_details',
            'amount',
            'month',
            'year',
            'spent',
            'remaining',
            'percentage',
            'created_at',
            'updated_at'
        )
        read_only_fields = ('budget_id', 'user', 'created_at', 'updated_at', 'spent', 'remaining', 'percentage')

    def validate(self, attrs):
        category = attrs.get('category')
        if category and category.type != 'expense':
            raise serializers.ValidationError({'category': 'Budgets can only be set for expense categories.'})

        user = self.context['request'].user
        month = attrs.get('month', self.instance.month if self.instance else None)
        year = attrs.get('year', self.instance.year if self.instance else None)
        cat = category or (self.instance.category if self.instance else None)

        qs = Budget.objects.filter(user=user, category=cat, month=month, year=year)
        if self.instance:
            qs = qs.exclude(budget_id=self.instance.budget_id)
        if qs.exists():
            raise serializers.ValidationError('A budget for this category and month/year already exists.')

        return attrs

    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)
