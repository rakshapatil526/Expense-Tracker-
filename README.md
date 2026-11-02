# Fullstack Personal Expense & Finance Tracker

A fullstack personal finance web application engineered with **React.js**, **Python / Django REST Framework**, and **PostgreSQL**.

---

## 🚀 Technologies & Stack

| Layer | Technology |
| :--- | :--- |
| **Frontend** | React.js (Vite), JavaScript (ES6+), HTML5, Modern Responsive CSS |
| **Backend** | Python 3.13, Django 5.2, Django REST Framework (DRF), SimpleJWT |
| **Database** | PostgreSQL (with auto-fallback to SQLite for zero-config local testing) |
| **API Integration** | Axios (configured with JWT interceptors & token refresh) |
| **Charts & Data Viz** | Recharts (Responsive bar charts, area charts, donut / pie charts) |
| **Icons** | Lucide React |
| **Containerization** | Docker & Docker Compose (PostgreSQL, Django backend, React frontend) |

---

## 🗄️ Database Tables & Schema

The application implements four database tables with strict relational integrity and foreign keys:

### 1. `users` Table
| Field | Type | Attributes | Description |
| :--- | :--- | :--- | :--- |
| `user_id` | BigAutoField | Primary Key | Unique user identifier |
| `name` | CharField(255) | Not Null | User full name |
| `email` | EmailField | Unique, Indexed | Login email |
| `password` | CharField(128) | Not Null | PBKDF2 SHA-256 hashed password |
| `created_at` | DateTimeField | Auto | Account registration timestamp |

### 2. `categories` Table
| Field | Type | Attributes | Description |
| :--- | :--- | :--- | :--- |
| `category_id` | BigAutoField | Primary Key | Unique category identifier |
| `user_id` | ForeignKey(`users`) | Nullable, Indexed | `null` for system default categories, user ID for custom categories |
| `category_name`| CharField(100) | Not Null | Name (e.g. Food, Travel, Salary) |
| `type` | CharField(20) | Choices: `income` / `expense` | Classification |
| `icon` | CharField(50) | Default: `tag` | Icon identifier |
| `color` | CharField(30) | Default: `#6366f1` | Hex color code |

### 3. `transactions` Table
| Field | Type | Attributes | Description |
| :--- | :--- | :--- | :--- |
| `transaction_id`| BigAutoField | Primary Key | Unique transaction record ID |
| `user_id` | ForeignKey(`users`) | CASCADE, Indexed | Owner of the transaction |
| `category_id` | ForeignKey(`categories`)| SET_NULL, Nullable | Associated category |
| `title` | CharField(255) | Not Null | Description title |
| `amount` | DecimalField(12, 2)| Min 0.01 | Transaction value ($) |
| `type` | CharField(20) | Choices: `income` / `expense` | Flow direction |
| `date` | DateField | Indexed | Date of transaction |
| `payment_method`| CharField(50) | Choices | Cash, Credit Card, Debit Card, UPI, Net Banking, Other |
| `description` | TextField | Blank allowed | Optional notes and receipt details |

### 4. `budgets` Table
| Field | Type | Attributes | Description |
| :--- | :--- | :--- | :--- |
| `budget_id` | BigAutoField | Primary Key | Unique budget record ID |
| `user_id` | ForeignKey(`users`) | CASCADE | User who set the budget |
| `category_id` | ForeignKey(`categories`)| CASCADE | Expense category limited |
| `amount` | DecimalField(12, 2)| Min 0.01 | Budget limit cap ($) |
| `month` | SmallIntegerField | 1 to 12 | Month number |
| `year` | SmallIntegerField | 2000 to 2100 | Budget year |
| *Constraint* | Unique | `(user, category, month, year)` | One budget limit per category per month |

---

## 🖥️ UI Modules (8 Modules)

### Module 1: Register & Login
- **User Registration**: Sign up with Name, unique Email, and Password confirmation.
- **Authentication**: JWT token exchange (`access` and `refresh` tokens).
- **Security Features**: Password toggle (show/hide), auto-redirects for unauthenticated routes, and token refresh interceptors.
- **Demo User Shortcut**: One-click demo credential filling (`demo@example.com` / `password123`).

### Module 2: Dashboard
- **Total Balance**: Dynamically calculated as $\text{Total Income} - \text{Total Expenses}$.
- **Total Income & Total Expenses**: Metric cards with monthly activity trends.
- **Monthly Savings**: Current month surplus / deficit.
- **Budget Progress Snapshot**: Quick bar showing month-to-date budget consumption.
- **Recent Transactions**: Real-time table displaying recent transactions with category badges and payment methods.
- **Quick Action Triggers**: Quick "Add Income" and "Add Expense" buttons opening interactive modals.

### Module 3: Add Income
- Fields: Income title, Amount, Category / Income Source (Salary, Freelance, Business, Investment, Gifts, Other), Date, Deposit method, and Description.
- Validates inputs and stores as `income` type in the database.

### Module 4: Add Expenses
- Fields: Expense title, Amount, Category (Food, Travel, Shopping, Education, Bills, Health, Entertainment, Groceries), Date, Payment Method (Cash, Credit Card, Debit Card, UPI, Net Banking, Other), Description.
- Validates inputs and stores as `expense` type in the database.

### Module 5: Category Management
- Includes default categories: **Food, Travel, Shopping, Education, Bills, Health, Salary, Freelance, Investment, Other**.
- Add custom categories with custom color palettes and icon representations.
- Edit and delete user-defined custom categories with foreign-key transaction protection.

### Module 6: Monthly Budget Management
- Set monthly spending caps per expense category.
- Month and Year selector to view past, present, or upcoming budgets.
- Real-time comparison: **Budget Limit vs Actual Amount Spent vs Remaining Amount**.
- Color-coded progress bar:
  - 🟢 **Green** (< 75% utilized)
  - 🟡 **Yellow / Warning** (75% - 99% utilized)
  - 🔴 **Red / Alert** ($\ge 100\%$ Over-budget indicator)

### Module 7: Spending Analytics & Charts (Recharts)
- **Monthly Income vs Expense Chart**: Grouped BarChart comparing cash inflow vs outflow across 12 months.
- **Monthly Savings Trend**: AreaChart showing net accumulated monthly savings.
- **Category-wise Spending Donut Chart**: Interactive Recharts PieChart with custom slice colors and hover tooltips showing amounts and percentage shares.
- **Payment Methods Breakdown**: Volume breakdown by payment method.

### Module 8: Transaction History
- Full transaction data table with search by title or description.
- Filter by type: *All*, *Income*, or *Expense*.
- Filter by category and date ranges.
- In-place Edit and Delete with confirmation.
- **Export to CSV**: Instant download of filtered transactions.

---

## ⚙️ Quick Start Guide

### Option 1: Running Locally (Fastest)

#### 1. Backend Setup:
```bash
cd backend

# Create & activate virtualenv (if not already active)
python -m venv venv
.\venv\Scripts\activate       # On Windows
# source venv/bin/activate    # On Linux/macOS

# Install dependencies
pip install -r requirements.txt

# Run migrations
python manage.py migrate

# Seed sample data (Demo user, categories, sample transactions & budgets)
python manage.py seed_data

# Start backend server (runs at http://127.0.0.1:8000)
python manage.py runserver
```

#### 2. Frontend Setup:
```bash
cd frontend

# Install dependencies
npm install

# Start Vite development server
npm run dev
```
Open **`http://localhost:5173`** in your browser.

**Demo Login Credentials:**
- Email: `demo@example.com`
- Password: `password123`
*(Or create your own new account on the Register page)*

---

### Option 2: Running with Docker & PostgreSQL

Run the full stack (PostgreSQL 16, Django Backend, React Frontend) in one command:
```bash
docker-compose up --build
```
- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:8000`
- PostgreSQL: `localhost:5432` (`db_name: expensetracker_db`, `user: postgres`, `password: postgrespassword`)

---

## 🧪 Testing

To execute the backend automated test suite:
```bash
cd backend
python manage.py test
```
All unit tests and end-to-end integration tests run and pass cleanly.
