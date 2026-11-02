from datetime import date
from decimal import Decimal
from django.test import TestCase
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient
from users.models import User
from expenses.models import Category, Transaction, Budget
from expenses.seed_categories import ensure_default_categories


class FinanceAPITests(TestCase):
    def setUp(self):
        ensure_default_categories()
        self.user = User.objects.create_user(
            email='finance_test@example.com',
            name='Finance Tester',
            password='secretpassword'
        )
        self.client = APIClient()

        # Login to get JWT
        login_res = self.client.post(reverse('login'), {
            'email': 'finance_test@example.com',
            'password': 'secretpassword'
        })
        self.token = login_res.data['tokens']['access']
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.token}')

    def test_categories_endpoint(self):
        res = self.client.get(reverse('category-list'))
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertGreater(len(res.data), 5)

        # Create custom category
        create_res = self.client.post(reverse('category-list'), {
            'category_name': 'Freelance Writing',
            'type': 'income',
            'icon': 'feather',
            'color': '#10b981'
        })
        self.assertEqual(create_res.status_code, status.HTTP_201_CREATED)
        self.assertTrue(create_res.data['is_custom'])

    def test_transactions_and_dashboard_flow(self):
        cat = Category.objects.filter(type='expense').first()
        income_cat = Category.objects.filter(type='income').first()

        # Add Income
        inc_res = self.client.post(reverse('transaction-list'), {
            'title': 'Salary Payment',
            'amount': '3000.00',
            'type': 'income',
            'category': income_cat.category_id,
            'date': str(date.today()),
            'payment_method': 'net_banking',
            'description': 'Monthly base'
        })
        self.assertEqual(inc_res.status_code, status.HTTP_201_CREATED)

        # Add Expense
        exp_res = self.client.post(reverse('transaction-list'), {
            'title': 'Dinner',
            'amount': '150.00',
            'type': 'expense',
            'category': cat.category_id,
            'date': str(date.today()),
            'payment_method': 'credit_card',
            'description': 'Family meal'
        })
        self.assertEqual(exp_res.status_code, status.HTTP_201_CREATED)

        # Dashboard check
        dash_res = self.client.get(reverse('dashboard'))
        self.assertEqual(dash_res.status_code, status.HTTP_200_OK)
        self.assertEqual(dash_res.data['total_income'], 3000.0)
        self.assertEqual(dash_res.data['total_expenses'], 150.0)
        self.assertEqual(dash_res.data['total_balance'], 2850.0)

    def test_budget_and_analytics_flow(self):
        food_cat = Category.objects.filter(category_name='Food', type='expense').first()
        today = date.today()

        # Create Budget
        b_res = self.client.post(reverse('budget-list'), {
            'category': food_cat.category_id,
            'amount': '400.00',
            'month': today.month,
            'year': today.year
        })
        self.assertEqual(b_res.status_code, status.HTTP_201_CREATED)

        # Add expense under food
        self.client.post(reverse('transaction-list'), {
            'title': 'Groceries',
            'amount': '120.00',
            'type': 'expense',
            'category': food_cat.category_id,
            'date': str(today),
            'payment_method': 'cash'
        })

        # Check budgets list (annotated with spent, remaining, percentage)
        budgets_res = self.client.get(f"{reverse('budget-list')}?month={today.month}&year={today.year}")
        self.assertEqual(budgets_res.status_code, status.HTTP_200_OK)
        item = next(b for b in budgets_res.data if b['category'] == food_cat.category_id)
        self.assertEqual(float(item['spent']), 120.0)
        self.assertEqual(float(item['remaining']), 280.0)
        self.assertEqual(float(item['percentage']), 30.0)

        # Analytics check
        an_res = self.client.get(f"{reverse('analytics')}?year={today.year}")
        self.assertEqual(an_res.status_code, status.HTTP_200_OK)
        self.assertIn('monthly_trends', an_res.data)
        self.assertIn('category_expenses', an_res.data)
