CREATE DATABASE teras_kopi54;

CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    contact VARCHAR(20) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE inventory (
    item_id SERIAL PRIMARY KEY,
    item_name VARCHAR(225) NOT NULL,
    quantity INTEGER NOT NULL,
    price_per_pcs INTEGER NOT NULL
);

CREATE TABLE product (
    product_id SERIAL PRIMARY KEY,
    product_name VARCHAR(250) NOT NULL,
    quantity INTEGER NOT NULL,
    product_price INTEGER NOT NULL
);

CREATE TABLE cafe_branch (
    id_branch SERIAL PRIMARY KEY,
    branch_name VARCHAR(250) NOT NULL,
    address VARCHAR(255) NOT NULL,
    contact VARCHAR(20) NOT NULL
);

CREATE TABLE orders (
    order_id SERIAL PRIMARY KEY,
    customer_name VARCHAR(250) NOT NULL,
    order_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE order_detail (
    order_detail_id SERIAL PRIMARY KEY,
    order_id INTEGER NOT NULL REFERENCES orders(order_id),
    payment_method VARCHAR(100) NOT NULL,
    product_id INTEGER NOT NULL REFERENCES product(product_id),
    quantity_order INTEGER NOT NULL,
    price_total INTEGER NOT NULL
);
