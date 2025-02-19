-- Add image_url column to product_settings
ALTER TABLE product_settings 
ADD COLUMN image_url text NOT NULL DEFAULT 'https://placehold.co/600x400';

-- Update the existing record with a default image
UPDATE product_settings 
SET image_url = 'https://placehold.co/600x400'
WHERE image_url = 'https://placehold.co/600x400'; 