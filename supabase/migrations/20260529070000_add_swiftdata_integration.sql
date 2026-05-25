-- Add SwiftData integration columns to products table
ALTER TABLE products
ADD COLUMN swift_package_id text;

-- Add SwiftData tracking columns to orders table
ALTER TABLE orders
ADD COLUMN swift_order_id uuid,
ADD COLUMN swift_status text CHECK (swift_status IN ('pending', 'paid', 'processing', 'fulfilled', 'fulfillment_failed'));

-- Create indexes for SwiftData order tracking
CREATE INDEX orders_swift_order_id_idx ON orders(swift_order_id);
CREATE INDEX orders_swift_status_idx ON orders(swift_status);
