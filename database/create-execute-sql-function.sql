-- Criar função para executar SQL dinamicamente (apenas para admins)
CREATE OR REPLACE FUNCTION execute_sql(sql_query text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result json;
BEGIN
    -- Executar a query e retornar resultado como JSON
    EXECUTE sql_query;
    
    -- Para queries que retornam dados (SELECT)
    IF sql_query ILIKE 'SELECT%' THEN
        EXECUTE 'SELECT json_agg(row_to_json(t)) FROM (' || sql_query || ') t' INTO result;
        RETURN COALESCE(result, '[]'::json);
    END IF;
    
    -- Para queries que não retornam dados (INSERT, UPDATE, DELETE, ALTER, etc)
    RETURN '{"success": true, "message": "Comando executado com sucesso"}'::json;
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'error', SQLERRM,
            'sqlstate', SQLSTATE
        );
END;
$$;

-- Dar permissão apenas para o service role
GRANT EXECUTE ON FUNCTION execute_sql(text) TO service_role;
