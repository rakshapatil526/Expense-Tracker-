import csv
from datetime import datetime, date
from decimal import Decimal

from django.db.models import Sum, Q, Count
from django.db.models.functions import TruncMonth
from django.http import HttpResponse
from rest_framework import viewsets, permissions, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from django_filters.rest_framework import DjangoFilterBackend

from .models import Category, Transaction, Budget
from .serializers import CategorySerializer, TransactionSerializer, BudgetSerializer
from .seed_categories import ensure_default_categories


class CategoryViewSet(viewsets.ModelViewSet):
    serializer_class = CategorySerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        ensure_default_categories()
        queryset = Category.objects.filter(Q(user=user) | Q(user__isnull=True))
        cat_type = self.request.query_params.get('type')
        if cat_type in ('income', 'expense'):
            queryset = queryset.filter(type=cat_type)
        return queryset.order_by('type', 'category_name')

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    def destroy(self, request, *args, **kwargs):
        category = self.get_object()
        if category.user is None:
            return Response(
                {'error': 'Default system categories cannot be deleted.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        if category.transactions.filter(user=request.user).exists():
            return Response(
                {'error': 'Cannot delete this category because transactions are linked to it. Please reassign them first.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        return super().destroy(request, *args, **kwargs)

    def update(self, request, *args, **kwargs):
        category = self.get_object()
        if category.user is None:
            return Response(
                {'error': 'Default system categories cannot be modified.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        return super().update(request, *args, **kwargs)


class TransactionViewSet(viewsets.ModelViewSet):
    serializer_class = TransactionSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['type', 'category', 'payment_method']
    search_fields = ['title', 'description', 'category__category_name']
    ordering_fields = ['date', 'amount', 'created_at', 'title']
    ordering = ['-date', '-created_at']

    def get_queryset(self):
        user = self.request.user
        queryset = Transaction.objects.filter(user=user).select_related('category')

        # Date range filtering
        start_date = self.request.query_params.get('start_date')
        end_date = self.request.query_params.get('end_date')

        if start_date:
            try:
                queryset = queryset.filter(date__gte=start_date)
            except Exception:
                pass
        if end_date:
            try:
                queryset = queryset.filter(date__lte=end_date)
            except Exception:
                pass

        return queryset

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=False, methods=['get'])
    def export_csv(self, request):
        """Export user's filtered or all transactions as a CSV file."""
        queryset = self.filter_queryset(self.get_queryset())
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="transactions_export.csv"'

        writer = csv.writer(response)
        writer.writerow(['ID', 'Title', 'Type', 'Amount', 'Category', 'Date', 'Payment Method', 'Description'])

        for tx in queryset:
            category_name = tx.category.category_name if tx.category else 'Uncategorized'
            writer.writerow([
                tx.transaction_id,
                tx.title,
                tx.type.capitalize(),
                f"{tx.amount:.2f}",
                category_name,
                tx.date.strftime('%Y-%m-%d'),
                tx.get_payment_method_display(),
                tx.description
            ])

        return response


class BudgetViewSet(viewsets.ModelViewSet):
    serializer_class = BudgetSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        queryset = Budget.objects.filter(user=user).select_related('category')

        month = self.request.query_params.get('month')
        year = self.request.query_params.get('year')

        now = datetime.now()
        target_month = int(month) if month and month.isdigit() else now.month
        target_year = int(year) if year and year.isdigit() else now.year

        queryset = queryset.filter(month=target_month, year=target_year)

        # Annotate with spent amount for each category in target month/year
        budgets_list = []
        for budget in queryset:
            spent_aggregate = Transaction.objects.filter(
                user=user,
                type='expense',
                category=budget.category,
                date__year=target_year,
                date__month=target_month
            ).aggregate(total=Sum('amount'))['total'] or Decimal('0.00')

            budget.spent = spent_aggregate
            budget.remaining = budget.amount - spent_aggregate
            if budget.amount > 0:
                budget.percentage = round(float((spent_aggregate / budget.amount) * 100), 1)
            else:
                budget.percentage = 0.0
            budgets_list.append(budget)

        return budgets_list

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class DashboardView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        today = date.today()

        # All-time totals
        totals = Transaction.objects.filter(user=user).values('type').annotate(total=Sum('amount'))
        total_income = Decimal('0.00')
        total_expenses = Decimal('0.00')

        for item in totals:
            if item['type'] == 'income':
                total_income = item['total'] or Decimal('0.00')
            elif item['type'] == 'expense':
                total_expenses = item['total'] or Decimal('0.00')

        total_balance = total_income - total_expenses

        # Current Month totals
        month_transactions = Transaction.objects.filter(
            user=user,
            date__year=today.year,
            date__month=today.month
        )
        month_totals = month_transactions.values('type').annotate(total=Sum('amount'))
        month_income = Decimal('0.00')
        month_expenses = Decimal('0.00')

        for item in month_totals:
            if item['type'] == 'income':
                month_income = item['total'] or Decimal('0.00')
            elif item['type'] == 'expense':
                month_expenses = item['total'] or Decimal('0.00')

        monthly_savings = month_income - month_expenses

        # Budget summary for current month
        budgets = Budget.objects.filter(user=user, month=today.month, year=today.year)
        total_budget = budgets.aggregate(total=Sum('amount'))['total'] or Decimal('0.00')

        # Recent transactions (last 6)
        recent_qs = Transaction.objects.filter(user=user).select_related('category').order_by('-date', '-created_at')[:6]
        recent_serializer = TransactionSerializer(recent_qs, many=True)

        return Response({
            'total_balance': float(total_balance),
            'total_income': float(total_income),
            'total_expenses': float(total_expenses),
            'monthly_savings': float(monthly_savings),
            'monthly_income': float(month_income),
            'monthly_expenses': float(month_expenses),
            'total_budget': float(total_budget),
            'budget_used_percentage': round(float((month_expenses / total_budget) * 100), 1) if total_budget > 0 else 0,
            'recent_transactions': recent_serializer.data,
            'current_month_name': today.strftime('%B %Y'),
        }, status=status.HTTP_200_OK)


class AnalyticsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        today = date.today()

        year_param = request.query_params.get('year')
        month_param = request.query_params.get('month')

        year = int(year_param) if year_param and year_param.isdigit() else today.year
        month = int(month_param) if month_param and month_param.isdigit() else None

        # 1. Monthly Trends (12 months of the given year)
        months_short = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
        year_txs = Transaction.objects.filter(user=user, date__year=year)

        monthly_trends = []
        for m in range(1, 13):
            m_txs = year_txs.filter(date__month=m)
            inc = m_txs.filter(type='income').aggregate(s=Sum('amount'))['s'] or Decimal('0.00')
            exp = m_txs.filter(type='expense').aggregate(s=Sum('amount'))['s'] or Decimal('0.00')
            monthly_trends.append({
                'month_num': m,
                'name': months_short[m - 1],
                'income': float(inc),
                'expense': float(exp),
                'savings': float(inc - exp),
            })

        # 2. Category-wise Spending Breakdown
        target_txs = Transaction.objects.filter(user=user, date__year=year)
        if month:
            target_txs = target_txs.filter(date__month=month)

        expense_txs = target_txs.filter(type='expense')
        total_period_expense = expense_txs.aggregate(s=Sum('amount'))['s'] or Decimal('0.00')

        cat_breakdown = (
            expense_txs
            .values('category__category_id', 'category__category_name', 'category__color')
            .annotate(total=Sum('amount'))
            .order_by('-total')
        )

        category_expenses = []
        palette = ['#ef4444', '#3b82f6', '#ec4899', '#8b5cf6', '#f59e0b', '#10b981', '#06b6d4', '#64748b']
        for idx, item in enumerate(cat_breakdown):
            val = float(item['total'] or 0)
            pct = round((val / float(total_period_expense) * 100), 1) if total_period_expense > 0 else 0
            category_expenses.append({
                'id': item['category__category_id'],
                'name': item['category__category_name'] or 'Uncategorized',
                'color': item['category__color'] or palette[idx % len(palette)],
                'amount': val,
                'percentage': pct,
            })

        # 3. Income Sources Breakdown
        income_txs = target_txs.filter(type='income')
        total_period_income = income_txs.aggregate(s=Sum('amount'))['s'] or Decimal('0.00')

        inc_breakdown = (
            income_txs
            .values('category__category_id', 'category__category_name', 'category__color')
            .annotate(total=Sum('amount'))
            .order_by('-total')
        )

        category_incomes = []
        for idx, item in enumerate(inc_breakdown):
            val = float(item['total'] or 0)
            pct = round((val / float(total_period_income) * 100), 1) if total_period_income > 0 else 0
            category_incomes.append({
                'id': item['category__category_id'],
                'name': item['category__category_name'] or 'Other Income',
                'color': item['category__color'] or palette[idx % len(palette)],
                'amount': val,
                'percentage': pct,
            })

        # 4. Payment Methods Breakdown
        payment_breakdown = (
            expense_txs
            .values('payment_method')
            .annotate(total=Sum('amount'), count=Count('transaction_id'))
            .order_by('-total')
        )
        payment_methods = [
            {
                'method': item['payment_method'],
                'label': dict(Transaction.PAYMENT_METHOD_CHOICES).get(item['payment_method'], item['payment_method'].title()),
                'amount': float(item['total'] or 0),
                'count': item['count']
            }
            for item in payment_breakdown
        ]

        return Response({
            'year': year,
            'month': month,
            'monthly_trends': monthly_trends,
            'category_expenses': category_expenses,
            'category_incomes': category_incomes,
            'payment_methods': payment_methods,
            'total_income': float(total_period_income),
            'total_expense': float(total_period_expense),
            'net_savings': float(total_period_income - total_period_expense),
        }, status=status.HTTP_200_OK)
