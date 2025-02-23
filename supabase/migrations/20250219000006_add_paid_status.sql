-- Update the valid_status constraint
ALTER TABLE orders DROP CONSTRAINT valid_status;
ALTER TABLE orders ADD CONSTRAINT valid_status 
  CHECK (status IN ('pending', 'paid', 'shipped', 'delivered', 'cancelled')); 