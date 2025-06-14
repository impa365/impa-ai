-- Debug das conexões WhatsApp
SELECT 'Verificando conexões WhatsApp...' as debug_step;

-- 1. Verificar se a tabela existe
SELECT 
  schemaname, 
  tablename, 
  tableowner 
FROM pg_tables 
WHERE schemaname = 'impaai' 
  AND tablename = 'whatsapp_connections';

-- 2. Verificar estrutura da tabela
SELECT 
  column_name, 
  data_type, 
  is_nullable 
FROM information_schema.columns 
WHERE table_schema = 'impaai' 
  AND table_name = 'whatsapp_connections'
ORDER BY ordinal_position;

-- 3. Contar registros
SELECT 
  COUNT(*) as total_connections,
  COUNT(CASE WHEN status = 'connected' THEN 1 END) as connected,
  COUNT(CASE WHEN status = 'disconnected' THEN 1 END) as disconnected
FROM impaai.whatsapp_connections;

-- 4. Mostrar todas as conexões
SELECT 
  id,
  user_id,
  connection_name,
  instance_name,
  status,
  created_at
FROM impaai.whatsapp_connections
ORDER BY created_at DESC;

-- 5. Verificar se existe a tabela user_profiles
SELECT 
  schemaname, 
  tablename 
FROM pg_tables 
WHERE schemaname = 'impaai' 
  AND tablename = 'user_profiles';

-- 6. Verificar foreign key
SELECT
  tc.constraint_name,
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema = 'impaai'
  AND tc.table_name = 'whatsapp_connections';
