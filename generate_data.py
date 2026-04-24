import sqlite3
import random
from faker import Faker

#using indian locale
fake = Faker('en_IN')

#connection to sqlite
conn = sqlite3.connect('dark_store.db')
cursor = conn.cursor()

cursor.execute('''
    CREATE TABLE IF NOT EXISTS dark_stores (
               store_id INTEGER PRIMARY KEY AUTOINCREMENT,
               store_name TEXT,
               latitude REAL,
               longitude REAL
    )
''')

#clearing existing data 
cursor.execute('DELETE FROM dark_stores')

#LAT AND LON of DTU
MIN_LAT, MAX_LAT = 28.6900, 28.7500
MIN_LON, MAX_LON = 77.0800, 77.1500

# generating 15 dark warehouses around DTU
stores_data = []
for i in range(1, 16):
    store_name = f'Zepto_Rohini_sec_{random.randint(1,30)}'

    #generating random coordinates 
    lat = round(random.uniform(MIN_LAT, MAX_LAT), 6)
    lon = round(random.uniform(MIN_LON, MAX_LON), 6)

    stores_data.append((store_name, lat, lon))

#Insert data into db
cursor.executemany('''
    INSERT INTO dark_stores (store_name, latitude, longitude)
    VALUES(?, ?, ?)
''', stores_data)

conn.commit()
print(f"Successfully generated {len(stores_data)} Dark stores in the Rohini area!")

conn.close()