import sqlite3

#connect 
conn = sqlite3.connect('dark_store.db')
cursor = conn.cursor()

#analytical query
sql_query = """
WITH LatestTime AS (
    --Find the most recent order to simulate 'current time'
    SELECT MAX(order_timestamp) as current_time FROM orders
),
RecentSales AS (
    --Calculate demand in the last 24 hours
    SELECT 
        store_id,
        item_category,
        item_name,
        SUM(quantity) as items_sold_last_24h
    FROM orders
    CROSS JOIN LatestTime
    WHERE order_timestamp >= datetime(current_time, '-1 days')
    GROUP BY store_id, item_category, item_name
),
PreviousSales AS (
    --Calcuate baseline demand in the 24 hr prior
    SELECT
        store_id,
        item_category,
        item_name,
        SUM(quantity) as items_sold_prev_24h
    FROM orders
    CROSS JOIN LatestTime
    WHERE order_timestamp >= datetime(current_time, '-2 days')
    AND order_timestamp < datetime(current_time, '-1 days')
    GROUP BY store_id, item_category, item_name
)

SELECT 
    ds.store_name,
    r.item_name,
    r.items_sold_last_24h as velocity_now,
    COALESCE(p.items_sold_prev_24h, 1) as velocity_baseline,
    ROUND(CAST(r.items_sold_last_24h AS FLOAT) / COALESCE(p.items_sold_prev_24h, 1), 2) as spike_ratio,
    RANK() OVER(PARTITION BY r.item_category ORDER BY (CAST(r.items_sold_last_24h AS FLOAT) / COALESCE(p.items_sold_prev_24h, 1)) DESC) as risk_rank
FROM RecentSales r
LEFT JOIN PreviousSales p 
    ON r.store_id = p.store_id AND r.item_name = p.item_name
JOIN dark_stores ds ON r.store_id = ds.store_id
WHERE spike_ratio > 1.5 
ORDER BY spike_ratio DESC
LIMIT 15;
"""

cursor.execute(sql_query)
results = cursor.fetchall()

#print command cener 
print("\n🚨 CRITICAL STOCK-OUT RISKS DETECTED IN ROHINI 🚨")
print(f"{'Store Name':<25} | {'Item':<15} | {'24h Vol':<8} | {'Prev 24h':<8} | {'Spike':<6} | {'Risk Rank'}")
print("-" * 80)

for row in results:
    store, item, vol_now, vol_prev, spike, rank = row
    print(f"{store:<25} | {item:<15} | {vol_now:<8} | {vol_prev:<8} | {spike:<6}x | #{rank}")

print("-" * 80)
print("ACTION REQUIRED: These micro-warehouses require immediate stock transfers.")

conn.close()