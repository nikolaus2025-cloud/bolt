-- Add additional product management columns
ALTER TABLE product_settings 
ADD COLUMN stock integer NOT NULL DEFAULT 0,
ADD COLUMN sku text,
ADD COLUMN status text NOT NULL DEFAULT 'active',
ADD COLUMN metadata jsonb;

-- Add constraint for status
ALTER TABLE product_settings
ADD CONSTRAINT valid_status CHECK (status IN ('active', 'inactive', 'draft')); 