CREATE DATABASE teras_kopi54;

CREATE TABLE user_cashier (
    user_id SERIAL PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    contact VARCHAR(20) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE user_stock (
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
    product_name VARCHAR(255) NOT NULL,
    product_category VARCHAR(255),
    variant_type VARCHAR(50) NOT NULL CHECK (variant_type IN ('Hot', 'Iced')),
    size_name VARCHAR(50) CHECK (size_name IN ('Large', 'Small')),
    product_price INTEGER,
    image_url VARCHAR(255) NOT NULL
);

create table image(
    id SERIAL NOT NULL PRIMARY KEY,
    image_path VARCHAR NOT NULL
)
CREATE TABLE cafe_branch (
    id_branch SERIAL PRIMARY KEY,
    branch_name VARCHAR(250) NOT NULL,
    address_branch VARCHAR(255) NOT NULL,
    contact VARCHAR(20) NOT NULL
);

CREATE TABLE orders (
    order_id SERIAL PRIMARY KEY,
    customer_name VARCHAR(250) NOT NULL,
    order_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    payment_method VARCHAR(100) NOT NULL,
    product_id INTEGER NOT NULL,
    product_name VARCHAR(250) NOT NULL,
    quantity_order INTEGER NOT NULL,
    price_total INTEGER(10, 2) NOT NULL
);


