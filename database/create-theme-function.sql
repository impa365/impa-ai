-- Função para obter o tema ativo do schema impaai
CREATE OR REPLACE FUNCTION public.get_active_theme()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  theme_data jsonb;
BEGIN
  -- Tentar obter o tema ativo
  SELECT 
    jsonb_build_object(
      'display_name', display_name,
      'description', description,
      'colors', colors,
      'preview_image_url', preview_image_url
    ) INTO theme_data
  FROM impaai.system_themes
  WHERE is_active = true
  LIMIT 1;
  
  -- Se não encontrar, tentar o tema padrão
  IF theme_data IS NULL THEN
    SELECT 
      jsonb_build_object(
        'display_name', display_name,
        'description', description,
        'colors', colors,
        'preview_image_url', preview_image_url
      ) INTO theme_data
    FROM impaai.system_themes
    WHERE is_default = true
    LIMIT 1;
  END IF;
  
  -- Se ainda não encontrar, retornar objeto vazio
  IF theme_data IS NULL THEN
    theme_data := '{}'::jsonb;
  END IF;
  
  RETURN theme_data;
END;
$$;
