import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'expense_tracker.settings')
django.setup()

from rest_framework.test import APIClient
from django.urls import reverse

client = APIClient()

print("1. Testing Registration...")
reg_res = client.post('/api/auth/register/', {
    'name': 'Integration Tester',
    'email': 'tester@example.com',
    'password': 'password123',
    'confirm_password': 'password123'
})
print("Register status:", reg_res.status_code)
assert reg_res.status_code == 201, reg_res.data
access_token = reg_res.data['tokens']['access']

client.credentials(HTTP_AUTHORIZATION=f'Bearer {access_token}')

print("2. Testing Categories list...")
cat_res = client.get('/api/finance/categories/')
print("Categories count:", len(cat_res.data))
assert len(cat_res.data) > 0

expense_cat = [c for c in cat_res.data if c['type'] == 'expense'][0]
income_cat = [c for c in cat_res.data if c['type'] == 'income'][0]

print("3. Testing Add Income...")
inc_res = client.post('/api/finance/transactions/', {
    'title': 'Salary E2E',
    'amount': '5000.00',
    'type': 'income',
    'category': income_cat['category_id'],
    'date': '2026-11-01',
    'payment_method': 'net_banking',
    'description': 'E2E salary test'
})
print("Income status:", inc_res.status_code)
assert inc_res.status_code == 201

print("4. Testing Add Expense...")
exp_res = client.post('/api/finance/transactions/', {
    'title': 'Groceries E2E',
    'amount': '250.00',
    'type': 'expense',
    'category': expense_cat['category_id'],
    'date': '2026-11-01',
    'payment_method': 'credit_card',
    'description': 'E2E grocery test'
})
print("Expense status:", exp_res.status_code)
assert exp_res.status_code == 201

print("5. Testing Dashboard...")
dash_res = client.get('/api/finance/dashboard/')
print("Dashboard status:", dash_res.status_code)
print("Balance:", dash_res.data['total_balance'], "Income:", dash_res.data['total_income'], "Expenses:", dash_res.data['total_expenses'])
assert dash_res.data['total_balance'] == 4750.0

print("6. Testing Budget Set & Check...")
b_res = client.post('/api/finance/budgets/', {
    'category': expense_cat['category_id'],
    'amount': '500.00',
    'month': 11,
    'year': 2026
})
print("Budget create status:", b_res.status_code)
assert b_res.status_code == 201

b_list_res = client.get('/api/finance/budgets/?month=11&year=2026')
print("Budgets list count:", len(b_list_res.data))
assert len(b_list_res.data) == 1
assert float(b_list_res.data[0]['spent']) == 250.0
assert float(b_list_res.data[0]['remaining']) == 250.0
assert float(b_list_res.data[0]['percentage']) == 50.0

print("7. Testing Analytics...")
an_res = client.get('/api/finance/analytics/?year=2026&month=11')
print("Analytics status:", an_res.status_code)
assert an_res.data['total_income'] == 5000.0
assert an_res.data['total_expense'] == 250.0

print("8. Testing CSV Export...")
csv_res = client.get('/api/finance/transactions/export_csv/')
print("CSV Export status:", csv_res.status_code, "Content length:", len(csv_res.content))
assert csv_res.status_code == 200
assert b'Salary E2E' in csv_res.content
assert b'Groceries E2E' in csv_res.content

print("\n=== ALL E2E VERIFICATIONS PASSED SUCCESSFULLY! ===")
