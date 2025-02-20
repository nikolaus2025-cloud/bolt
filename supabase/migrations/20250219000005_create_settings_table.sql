-- Create settings table
CREATE TABLE settings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  discount DECIMAL(10,2) DEFAULT 0,
  image_url TEXT,
  additional_images TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Allow public to view settings" 
  ON settings FOR SELECT 
  TO public 
  USING (true);

CREATE POLICY "Allow authenticated users to update settings" 
  ON settings FOR UPDATE 
  TO authenticated 
  USING (true);

-- Insert initial settings
INSERT INTO settings (
  title, 
  description, 
  price, 
  discount, 
  image_url
) VALUES (
  'Your Product Name',
  'Product description goes here...',
  99.99,
  0,
  'https://example.com/image.jpg'
); 