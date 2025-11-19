-- Migration 002: Update Existing Tables for Multi-Tenancy
-- Adds company_id columns to existing tables and creates necessary relationships

-- Add company_id to user_profiles table
ALTER TABLE impaai.user_profiles
ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES impaai.companies(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS permissions JSONB DEFAULT '[]'::jsonb;

-- Add company_id to whatsapp_connections table
ALTER TABLE impaai.whatsapp_connections
ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES impaai.companies(id) ON DELETE CASCADE;

-- Add company_id to agents table (if it exists)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'impaai' AND table_name = 'agents'
    ) THEN
        ALTER TABLE impaai.agents
        ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES impaai.companies(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_company_id ON impaai.user_profiles(company_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_connections_company_id ON impaai.whatsapp_connections(company_id);

-- Update existing data: Create a default company for existing admins
DO $$
DECLARE
    v_company_id UUID;
    v_admin_id UUID;
BEGIN
    -- For each admin user, create a company
    FOR v_admin_id IN 
        SELECT id FROM impaai.user_profiles WHERE role = 'admin' AND company_id IS NULL
    LOOP
        -- Create company for this admin
        INSERT INTO impaai.companies (
            name,
            status,
            max_users,
            max_instances,
            max_connections,
            max_agents,
            created_at,
            updated_at
        ) VALUES (
            'Empresa Principal',
            'active',
            10,
            5,
            10,
            20,
            NOW(),
            NOW()
        ) RETURNING id INTO v_company_id;

        -- Update admin user with company_id
        UPDATE impaai.user_profiles
        SET company_id = v_company_id
        WHERE id = v_admin_id;

        -- Update all connections owned by this admin
        UPDATE impaai.whatsapp_connections
        SET company_id = v_company_id
        WHERE user_id = v_admin_id AND company_id IS NULL;

        -- Update all agents owned by this admin (if table exists)
        IF EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_schema = 'impaai' AND table_name = 'agents'
        ) THEN
            EXECUTE format('
                UPDATE impaai.agents
                SET company_id = %L
                WHERE user_id = %L AND company_id IS NULL
            ', v_company_id, v_admin_id);
        END IF;
    END LOOP;

    -- For non-admin users without company, assign them to their admin's company
    UPDATE impaai.user_profiles u
    SET company_id = (
        SELECT company_id 
        FROM impaai.user_profiles 
        WHERE role = 'admin' 
        AND id = u.id
        LIMIT 1
    )
    WHERE role = 'user' AND company_id IS NULL;
END $$;

-- Add NOT NULL constraints after data migration (except for super_admin)
-- Super admins não têm company_id
-- ALTER TABLE impaai.user_profiles
-- ALTER COLUMN company_id SET NOT NULL;

-- Create function to check company limits before inserting resources
CREATE OR REPLACE FUNCTION impaai.check_company_limits()
RETURNS TRIGGER AS $$
DECLARE
    v_company RECORD;
    v_current_count INTEGER;
BEGIN
    -- Get company information
    SELECT * INTO v_company FROM impaai.companies WHERE id = NEW.company_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Company not found';
    END IF;

    -- Check if company is active
    IF v_company.status != 'active' THEN
        RAISE EXCEPTION 'Company is not active';
    END IF;

    -- Check based on table name
    IF TG_TABLE_NAME = 'whatsapp_connections' THEN
        SELECT COUNT(*) INTO v_current_count
        FROM impaai.whatsapp_connections
        WHERE company_id = NEW.company_id;
        
        IF v_current_count >= v_company.max_connections THEN
            RAISE EXCEPTION 'Company has reached the maximum number of WhatsApp connections (%)
', v_company.max_connections;
        END IF;
    END IF;

    IF TG_TABLE_NAME = 'whatsapp_instances' THEN
        SELECT COUNT(*) INTO v_current_count
        FROM impaai.whatsapp_instances
        WHERE company_id = NEW.company_id;
        
        IF v_current_count >= v_company.max_instances THEN
            RAISE EXCEPTION 'Company has reached the maximum number of instances (%)', v_company.max_instances;
        END IF;
    END IF;

    IF TG_TABLE_NAME = 'agents' THEN
        SELECT COUNT(*) INTO v_current_count
        FROM impaai.agents
        WHERE company_id = NEW.company_id;
        
        IF v_current_count >= v_company.max_agents THEN
            RAISE EXCEPTION 'Company has reached the maximum number of agents (%)', v_company.max_agents;
        END IF;
    END IF;

    IF TG_TABLE_NAME = 'user_profiles' THEN
        SELECT COUNT(*) INTO v_current_count
        FROM impaai.user_profiles
        WHERE company_id = NEW.company_id;
        
        IF v_current_count >= v_company.max_users THEN
            RAISE EXCEPTION 'Company has reached the maximum number of users (%)', v_company.max_users;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for limit checking
DROP TRIGGER IF EXISTS check_connection_limits ON impaai.whatsapp_connections;
CREATE TRIGGER check_connection_limits
BEFORE INSERT ON impaai.whatsapp_connections
FOR EACH ROW
EXECUTE FUNCTION impaai.check_company_limits();

DROP TRIGGER IF EXISTS check_user_limits ON impaai.user_profiles;
CREATE TRIGGER check_user_limits
BEFORE INSERT ON impaai.user_profiles
FOR EACH ROW
WHEN (NEW.role != 'super_admin')
EXECUTE FUNCTION impaai.check_company_limits();

-- Create trigger for agents if table exists
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'impaai' AND table_name = 'agents'
    ) THEN
        EXECUTE 'DROP TRIGGER IF EXISTS check_agent_limits ON impaai.agents';
        EXECUTE 'CREATE TRIGGER check_agent_limits
                 BEFORE INSERT ON impaai.agents
                 FOR EACH ROW
                 EXECUTE FUNCTION impaai.check_company_limits()';
    END IF;
END $$;

-- Function to get company statistics
CREATE OR REPLACE FUNCTION impaai.get_company_stats(p_company_id UUID)
RETURNS TABLE (
    total_users BIGINT,
    total_connections BIGINT,
    total_instances BIGINT,
    total_agents BIGINT,
    active_connections BIGINT,
    active_agents BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        (SELECT COUNT(*) FROM impaai.user_profiles WHERE company_id = p_company_id),
        (SELECT COUNT(*) FROM impaai.whatsapp_connections WHERE company_id = p_company_id),
        (SELECT COUNT(*) FROM impaai.whatsapp_instances WHERE company_id = p_company_id),
        (SELECT COUNT(*) FROM impaai.agents WHERE company_id = p_company_id),
        (SELECT COUNT(*) FROM impaai.whatsapp_connections WHERE company_id = p_company_id AND status = 'connected'),
        (SELECT COUNT(*) FROM impaai.agents WHERE company_id = p_company_id AND status = 'active');
EXCEPTION
    WHEN OTHERS THEN
        -- If tables don't exist, return zeros
        RETURN QUERY SELECT 0::BIGINT, 0::BIGINT, 0::BIGINT, 0::BIGINT, 0::BIGINT, 0::BIGINT;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION impaai.get_company_stats IS 'Get statistics for a specific company';
