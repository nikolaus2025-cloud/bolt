-- Drop existing policies
DROP POLICY IF EXISTS "Allow authenticated users to view orders" ON "orders";

-- Create new policy for public order tracking
CREATE POLICY "Allow users to view their own orders"
ON "orders"
FOR SELECT
TO public
USING (
  email = current_user OR
  auth.role() = 'authenticated' OR
  (auth.role() = 'anon' AND email IS NOT NULL)
); 