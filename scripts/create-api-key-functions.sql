CREATE SCHEMA IF NOT EXISTS impaai;

CREATE TABLE IF NOT EXISTS impaai.user_api_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    api_key TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION impaai.create_user_api_key(
    p_user_id UUID,
    p_name VARCHAR(255),  -- Mudou de p_key_name para p_name
    p_api_key TEXT,
    p_description TEXT DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
    INSERT INTO impaai.user_api_keys (user_id, name, api_key, description)
    VALUES (p_user_id, p_name, p_api_key, p_description);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION impaai.get_user_api_key_by_key(p_api_key TEXT)
RETURNS TABLE (
    id UUID,
    user_id UUID,
    name VARCHAR(255),
    api_key TEXT,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        u.id,
        u.user_id,
        u.name,
        u.api_key,
        u.description,
        u.created_at,
        u.updated_at
    FROM
        impaai.user_api_keys u
    WHERE
        u.api_key = p_api_key;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION impaai.get_user_api_keys_by_user_id(p_user_id UUID)
RETURNS TABLE (
    id UUID,
    user_id UUID,
    name VARCHAR(255),
    api_key TEXT,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        u.id,
        u.user_id,
        u.name,
        u.api_key,
        u.description,
        u.created_at,
        u.updated_at
    FROM
        impaai.user_api_keys u
    WHERE
        u.user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION impaai.delete_user_api_key(p_id UUID)
RETURNS VOID AS $$
BEGIN
    DELETE FROM impaai.user_api_keys
    WHERE id = p_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
