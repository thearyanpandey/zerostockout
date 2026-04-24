const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');

const app = express();
const PORT = 5000;

app.use(cors());

const db = new sqlite3.Database('../dark_store.db', (err) => {
    if (err) {
        console.error("Database connection error:", err.message);
    } else {
        console.log("Connected to the Dark Store database.");
    }
});

app.get('/api/inventory-risks', (req, res) => {
    const sqlQuery = `
        WITH LatestTime AS (
            SELECT MAX(order_timestamp) as current_time FROM orders
        ),
        RecentSales AS (
            SELECT store_id, item_category, item_name, SUM(quantity) as items_sold_last_24h
            FROM orders CROSS JOIN LatestTime
            WHERE order_timestamp >= datetime(current_time, '-1 days')
            GROUP BY store_id, item_category, item_name
        ),
        PreviousSales AS (
            SELECT store_id, item_category, item_name, SUM(quantity) as items_sold_prev_24h
            FROM orders CROSS JOIN LatestTime
            WHERE order_timestamp >= datetime(current_time, '-2 days')
              AND order_timestamp < datetime(current_time, '-1 days')
            GROUP BY store_id, item_category, item_name
        )
        SELECT 
            ds.latitude,
            ds.longitude,
            ds.store_name,
            r.item_name,
            r.item_category,
            r.items_sold_last_24h as velocity_now,
            COALESCE(p.items_sold_prev_24h, 1) as velocity_baseline,
            ROUND(CAST(r.items_sold_last_24h AS FLOAT) / COALESCE(p.items_sold_prev_24h, 1), 2) as spike_ratio,
            RANK() OVER(PARTITION BY r.item_category ORDER BY (CAST(r.items_sold_last_24h AS FLOAT) / COALESCE(p.items_sold_prev_24h, 1)) DESC) as risk_rank
        FROM RecentSales r
        LEFT JOIN PreviousSales p ON r.store_id = p.store_id AND r.item_name = p.item_name
        JOIN dark_stores ds ON r.store_id = ds.store_id
        WHERE spike_ratio > 1.5
        ORDER BY spike_ratio DESC
        LIMIT 15;
    `;

    db.all(sqlQuery, [], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

app.listen(PORT, () => {
    console.log(`Command Center API is running on http://localhost:${PORT}`);
});