-- Drop existing table if it exists
DROP TABLE IF EXISTS orders;

-- Create orders table with correct structure
CREATE TABLE orders (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  country TEXT NOT NULL,
  address TEXT NOT NULL,
  zip_code TEXT NOT NULL,
  paypal_order_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  tracking_number TEXT,
  shipping_notes TEXT,
  CONSTRAINT valid_status CHECK (status IN ('pending', 'shipped', 'delivered', 'cancelled'))
);

-- Add RLS policies
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public to create orders"
  ON orders FOR INSERT TO public
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to view orders"
  ON orders FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to update orders"
  ON orders FOR UPDATE TO authenticated
  USING (true); 