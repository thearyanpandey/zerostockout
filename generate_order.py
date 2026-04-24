import sqlite3
import random
from datetime import datetime, timedelta

# 1. Connect to the database
conn = sqlite3.connect('dark_store.db')
cursor = conn.cursor()

# 2. Create the Orders table
cursor.execute('''
CREATE TABLE IF NOT EXISTS orders (
    order_id INTEGER PRIMARY KEY AUTOINCREMENT,
    store_id INTEGER,
    item_category TEXT,
    item_name TEXT,
    quantity INTEGER,
    order_timestamp DATETIME,
    weather_condition TEXT,
    delivery_time_mins INTEGER,
    FOREIGN KEY(store_id) REFERENCES dark_stores(store_id)
)
''')

# Clear old data if you re-run the script
cursor.execute('DELETE FROM orders')

# Fetch the store IDs we generated in the last step
cursor.execute('SELECT store_id FROM dark_stores')
store_ids = [row[0] for row in cursor.fetchall()]

# 3. Define our inventory logic
categories = {
    "Perishables": ["Milk", "Bread", "Tomatoes", "Coriander"],
    "Weather_Dependent": ["Ice Cream", "Cold Drinks"],
    "Late_Night_Impulse": ["Maggi", "Chips", "Energy Drinks"]
}
weather_types = ["Clear", "Rain", "Heatwave"]

print("Generating synthetic orders... this might take a few seconds.")

# 4. Generate 100,000 orders
total_orders = 100000
batch_size = 10000
orders_data = []

# Set start date to 30 days ago
start_date = datetime.now() - timedelta(days=30)

for i in range(total_orders):
    store_id = random.choice(store_ids)
    
    # 70% chance of clear weather, 15% rain, 15% heatwave
    weather = random.choices(weather_types, weights=[0.7, 0.15, 0.15])[0]
    
    # Simulating Real-World Demand Spikes!
    if weather == "Rain":
        # Huge spike in Maggi and impulse buys during rain
        category = random.choices(list(categories.keys()), weights=[0.2, 0.1, 0.7])[0]
        item = "Maggi" if category == "Late_Night_Impulse" else random.choice(categories[category])
    elif weather == "Heatwave":
        # Huge spike in cold items during heatwaves
        category = random.choices(list(categories.keys()), weights=[0.2, 0.7, 0.1])[0]
        item = random.choice(categories["Weather_Dependent"])
    else:
        # Normal distribution for clear weather
        category = random.choice(list(categories.keys()))
        item = random.choice(categories[category])

    quantity = random.randint(1, 4)
    
    # Random timestamp within the last 30 days
    random_seconds = random.randint(0, 30 * 24 * 60 * 60)
    order_time = start_date + timedelta(seconds=random_seconds)
    
    # Delivery takes longer in the rain
    delivery_time = random.randint(15, 30) if weather == "Rain" else random.randint(7, 12)

    orders_data.append((store_id, category, item, quantity, order_time.strftime('%Y-%m-%d %H:%M:%S'), weather, delivery_time))

    # Insert into database in batches to keep things fast
    if len(orders_data) >= batch_size:
        cursor.executemany('''
            INSERT INTO orders (store_id, item_category, item_name, quantity, order_timestamp, weather_condition, delivery_time_mins)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ''', orders_data)
        conn.commit()
        orders_data = [] # Reset the batch

# Insert any leftover orders
if orders_data:
    cursor.executemany('''
        INSERT INTO orders (store_id, item_category, item_name, quantity, order_timestamp, weather_condition, delivery_time_mins)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    ''', orders_data)
    conn.commit()

print(f"Successfully generated {total_orders} orders!")
conn.close()