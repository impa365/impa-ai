-- Criar função RPC para atualizar sincronização
CREATE OR REPLACE FUNCTION update_connection_sync(connection_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result JSON;
    current_time TIMESTAMPTZ := NOW();
BEGIN
    -- Tentar atualizar com last_sync
    BEGIN
        UPDATE impaai.whatsapp_connections 
        SET 
            last_sync = current_time,
            updated_at = current_time
        WHERE id = connection_id;
        
        IF FOUND THEN
            result := json_build_object(
                'success', true,
                'updated', true,
                'timestamp', current_time,
                'method', 'with_last_sync'
            );
        ELSE
            result := json_build_object(
                'success', false,
                'error', 'Connection not found'
            );
        END IF;
        
    EXCEPTION WHEN OTHERS THEN
        -- Se der erro com last_sync, tentar sem ela
        UPDATE impaai.whatsapp_connections 
        SET updated_at = current_time
        WHERE id = connection_id;
        
        IF FOUND THEN
            result := json_build_object(
                'success', true,
                'updated', true,
                'timestamp', current_time,
                'method', 'without_last_sync',
                'note', 'Updated without last_sync column'
            );
        ELSE
            result := json_build_object(
                'success', false,
                'error', 'Connection not found'
            );
        END IF;
    END;
    
    RETURN result;
END;
$$;

-- Testar a função
SELECT update_connection_sync('0be79561-0da7-41dc-bd8b-b0bb388bb50c'::UUID);
