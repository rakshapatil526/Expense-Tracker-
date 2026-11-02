from datetime import date, timedelta
from decimal import Decimal
import random

from django.core.management.base import BaseCommand
from users.models import User
from expenses.models import Category, Transaction, Budget
from expenses.seed_categories import ensure_default_categories


class Command(BaseCommand):
    help = 'Seeds initial sample data for demo user and categories'

    def handle(self, *args, **options):
        self.stdout.write("Seeding default categories...")
        ensure_default_categories()

        # Create demo user
        demo_email = "demo@example.com"
        demo_password = "password123"
        user, created = User.objects.get_or_create(
            email=demo_email,
            defaults={'name': 'Alex Mercer'}
        )
        if created:
            user.set_password(demo_password)
            user.save()
            self.stdout.write(self.style.SUCCESS(f"Created demo user: {demo_email} (password: {demo_password})"))
        else:
            self.stdout.write(f"Demo user already exists: {demo_email}")

        # Check if transactions already exist for this user
        if Transaction.objects.filter(user=user).exists():
            self.stdout.write(self.style.WARNING("Demo transactions already exist. Skipping transaction seeding."))
            return

        today = date.today()

        # Fetch categories
        salary_cat = Category.objects.filter(category_name='Salary', type='income').first()
        freelance_cat = Category.objects.filter(category_name='Freelance', type='income').first()
        investment_cat = Category.objects.filter(category_name='Investment', type='income').first()

        food_cat = Category.objects.filter(category_name='Food', type='expense').first()
        travel_cat = Category.objects.filter(category_name='Travel', type='expense').first()
        shopping_cat = Category.objects.filter(category_name='Shopping', type='expense').first()
        bills_cat = Category.objects.filter(category_name='Bills', type='expense').first()
        education_cat = Category.objects.filter(category_name='Education', type='expense').first()
        health_cat = Category.objects.filter(category_name='Health', type='expense').first()
        entertainment_cat = Category.objects.filter(category_name='Entertainment', type='expense').first()

        # Generate transactions for last 3 months
        transactions = []
        for month_offset in [2, 1, 0]:
            # Calculate a base date in that month
            # Approx 30 days per month
            m_date = today - timedelta(days=month_offset * 30)
            y, m = m_date.year, m_date.month

            # Income: Monthly salary on 1st of month
            transactions.append(Transaction(
                user=user,
                category=salary_cat,
                title="Monthly Tech Salary",
                amount=Decimal("4500.00"),
                type="income",
                date=date(y, m, 1),
                payment_method="net_banking",
                description="Direct monthly bank deposit"
            ))

            # Income: Freelance project mid-month
            transactions.append(Transaction(
                user=user,
                category=freelance_cat,
                title="UI/UX Client Project",
                amount=Decimal("1200.00"),
                type="income",
                date=date(y, m, 14),
                payment_method="upi",
                description="Frontend React consultation and redesign"
            ))

            # Income: Investment dividends
            if month_offset != 1:
                transactions.append(Transaction(
                    user=user,
                    category=investment_cat,
                    title="Stock Portfolio Dividends",
                    amount=Decimal("350.00"),
                    type="income",
                    date=date(y, m, 20),
                    payment_method="net_banking",
                    description="Quarterly index fund distribution"
                ))

            # Expenses
            transactions.extend([
                Transaction(
                    user=user,
                    category=bills_cat,
                    title="Electricity & Internet Bills",
                    amount=Decimal("165.50"),
                    type="expense",
                    date=date(y, m, 4),
                    payment_method="credit_card",
                    description="Fiber broadband + electric utility"
                ),
                Transaction(
                    user=user,
                    category=food_cat,
                    title="Weekly Supermarket Groceries",
                    amount=Decimal("185.20"),
                    type="expense",
                    date=date(y, m, 7),
                    payment_method="debit_card",
                    description="Fresh produce, dairy and pantry staples"
                ),
                Transaction(
                    user=user,
                    category=travel_cat,
                    title="Metro & Ride Share Passes",
                    amount=Decimal("78.00"),
                    type="expense",
                    date=date(y, m, 11),
                    payment_method="upi",
                    description="Daily city commute"
                ),
                Transaction(
                    user=user,
                    category=food_cat,
                    title="Weekend Dinner with Friends",
                    amount=Decimal("94.30"),
                    type="expense",
                    date=date(y, m, 13),
                    payment_method="credit_card",
                    description="Italian Bistro dining"
                ),
                Transaction(
                    user=user,
                    category=shopping_cat,
                    title="Ergonomic Desk Accessories",
                    amount=Decimal("145.00"),
                    type="expense",
                    date=date(y, m, 16),
                    payment_method="credit_card",
                    description="Monitor stand and vertical mouse"
                ),
                Transaction(
                    user=user,
                    category=education_cat,
                    title="Cloud & AI Course Subscription",
                    amount=Decimal("49.00"),
                    type="expense",
                    date=date(y, m, 18),
                    payment_method="credit_card",
                    description="Monthly professional development course"
                ),
                Transaction(
                    user=user,
                    category=health_cat,
                    title="Gym Membership & Supplements",
                    amount=Decimal("85.00"),
                    type="expense",
                    date=date(y, m, 22),
                    payment_method="debit_card",
                    description="Monthly wellness and fitness"
                ),
                Transaction(
                    user=user,
                    category=entertainment_cat,
                    title="Cinema & Streaming Subscriptions",
                    amount=Decimal("38.50"),
                    type="expense",
                    date=date(y, m, 25),
                    payment_method="credit_card",
                    description="Netflix and IMAX tickets"
                ),
            ])

        Transaction.objects.bulk_create(transactions)
        self.stdout.write(self.style.SUCCESS(f"Created {len(transactions)} sample transactions!"))

        # Create monthly budgets for current month
        budgets_data = [
            (food_cat, Decimal("500.00")),
            (bills_cat, Decimal("250.00")),
            (shopping_cat, Decimal("300.00")),
            (travel_cat, Decimal("150.00")),
            (health_cat, Decimal("120.00")),
            (education_cat, Decimal("100.00")),
            (entertainment_cat, Decimal("80.00")),
        ]

        for cat, amt in budgets_data:
            if cat:
                Budget.objects.get_or_create(
                    user=user,
                    category=cat,
                    month=today.month,
                    year=today.year,
                    defaults={'amount': amt}
                )

        self.stdout.write(self.style.SUCCESS("Sample budgets seeded successfully!"))
