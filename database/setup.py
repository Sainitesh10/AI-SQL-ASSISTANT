import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(__file__), "ecommerce.db")

def setup_database():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    # Create Customers Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS customers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        country TEXT NOT NULL,
        signup_date DATE NOT NULL
    )
    """)

    # Create Products Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        category TEXT NOT NULL,
        price REAL NOT NULL
    )
    """)

    # Create Orders Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        customer_id INTEGER NOT NULL,
        product_id INTEGER NOT NULL,
        quantity INTEGER NOT NULL,
        order_date DATE NOT NULL,
        FOREIGN KEY (customer_id) REFERENCES customers (id),
        FOREIGN KEY (product_id) REFERENCES products (id)
    )
    """)

    # Insert Dummy Data
    customers = [
        ("Alice Smith", "alice@example.com", "USA", "2023-01-15"),
        ("Bob Johnson", "bob@example.com", "UK", "2023-02-20"),
        ("Charlie Brown", "charlie@example.com", "Canada", "2023-03-10"),
        ("Diana Prince", "diana@example.com", "USA", "2023-04-05"),
        ("Evan Wright", "evan@example.com", "Australia", "2023-05-12"),
    ]
    
    products = [
        ("Laptop Pro", "Electronics", 1200.00),
        ("Wireless Mouse", "Electronics", 25.50),
        ("Ergonomic Chair", "Furniture", 250.00),
        ("Standing Desk", "Furniture", 400.00),
        ("Coffee Maker", "Appliances", 80.00),
    ]

    orders = [
        (1, 1, 1, "2023-06-01"), # Alice bought 1 Laptop
        (1, 2, 2, "2023-06-01"), # Alice bought 2 Mice
        (2, 3, 1, "2023-06-05"), # Bob bought 1 Chair
        (3, 4, 1, "2023-06-10"), # Charlie bought 1 Desk
        (4, 5, 1, "2023-06-15"), # Diana bought 1 Coffee Maker
        (5, 1, 2, "2023-06-20"), # Evan bought 2 Laptops
        (1, 3, 1, "2023-07-01"), # Alice bought 1 Chair
    ]

    # Clear existing data to avoid duplicates if run multiple times
    cursor.execute("DELETE FROM orders")
    cursor.execute("DELETE FROM products")
    cursor.execute("DELETE FROM customers")

    cursor.executemany("INSERT INTO customers (name, email, country, signup_date) VALUES (?, ?, ?, ?)", customers)
    cursor.executemany("INSERT INTO products (name, category, price) VALUES (?, ?, ?)", products)
    cursor.executemany("INSERT INTO orders (customer_id, product_id, quantity, order_date) VALUES (?, ?, ?, ?)", orders)

    conn.commit()
    conn.close()
    print("Database 'ecommerce.db' created and populated successfully!")

if __name__ == "__main__":
    setup_database()
