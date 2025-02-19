/*
  # Initial Schema Setup

  1. New Tables
    - `product_settings`
      - `id` (uuid, primary key)
      - `title` (text)
      - `description` (text)
      - `price` (numeric)
      - `discount` (numeric)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `orders`
      - `id` (uuid, primary key)
      - `first_name` (text)
      - `last_name` (text)
      - `email` (text)
      - `phone` (text)
      - `country` (text)
      - `address` (text)
      - `zip_code` (text)
      - `paypal_order_id` (text)
      - `status` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated admin access
*/

-- Product Settings Table
CREATE TABLE product_settings (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    title text NOT NULL DEFAULT 'Product Title',
    description text NOT NULL DEFAULT 'Product Description',
    price numeric(10,2) NOT NULL DEFAULT 0.00,
    discount numeric(10,2) NOT NULL DEFAULT 0.00,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- Orders Table
CREATE TABLE orders (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    first_name text NOT NULL,
    last_name text NOT NULL,
    email text NOT NULL,
    phone text NOT NULL,
    country text NOT NULL,
    address text NOT NULL,
    zip_code text NOT NULL,
    paypal_order_id text,
    status text NOT NULL DEFAULT 'pending',
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE product_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Policies for product_settings
CREATE POLICY "Allow public read access to product settings"
    ON product_settings
    FOR SELECT
    TO public
    USING (true);

CREATE POLICY "Allow authenticated users to update product settings"
    ON product_settings
    FOR UPDATE
    TO authenticated
    USING (true);

-- Policies for orders
CREATE POLICY "Allow public to create orders"
    ON orders
    FOR INSERT
    TO public
    WITH CHECK (true);

CREATE POLICY "Allow authenticated users to view all orders"
    ON orders
    FOR SELECT
    TO authenticated
    USING (true);

-- Insert initial product settings
INSERT INTO product_settings (title, description, price, discount)
VALUES ('Amazing Product', 'This is an incredible product that will change your life!', 99.99, 0.00);