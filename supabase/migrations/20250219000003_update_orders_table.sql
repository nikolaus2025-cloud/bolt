ALTER TABLE orders
ADD COLUMN status text NOT NULL DEFAULT 'pending',
ADD COLUMN tracking_number text,
ADD COLUMN shipping_notes text,
ADD CONSTRAINT valid_status CHECK (status IN ('pending', 'shipped', 'delivered', 'cancelled'));

-- Add index for faster order queries
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at); 