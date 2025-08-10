CREATE TABLE IF NOT EXISTS orders (
    order_id SERIAL PRIMARY KEY,
    product_id INT NOT NULL,
    quantity INT NOT NULL,
    unit_price NUMERIC(10,2) NOT NULL,
    order_date DATE NOT NULL DEFAULT CURRENT_DATE
);

INSERT INTO orders (product_id, quantity, unit_price, order_date)
SELECT 1, 10, 9.99, CURRENT_DATE WHERE NOT EXISTS (SELECT 1 FROM orders);
