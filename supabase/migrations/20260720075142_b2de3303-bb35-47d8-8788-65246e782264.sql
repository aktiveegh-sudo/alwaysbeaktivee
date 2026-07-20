-- Add missing 'sale_profit' value to tx_type enum so credit_agent_profit can insert transactions
ALTER TYPE public.tx_type ADD VALUE IF NOT EXISTS 'sale_profit';