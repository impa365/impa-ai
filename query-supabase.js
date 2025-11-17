const { Client } = require('pg');

const client = new Client({
  host: '168.231.97.16',
  port: 5432,
  user: 'supabase_admin',
  password: 'a578d418b05e5681b47412d77a62bd6a',
  database: 'postgres'
});

async function getTables() {
  try {
    await client.connect();
    const res = await client.query(
      SELECT table_schema, table_name 
      FROM information_schema.tables 
      WHERE table_schema NOT IN ('pg_catalog', 'information_schema')
      ORDER BY table_schema, table_name;
    );
    console.log('Tabelas do Supabase:');
    console.log('====================');
    res.rows.forEach(row => {
      console.log(${row.table_schema}.);
    });
  } catch (err) {
    console.error('Erro:', err.message);
  } finally {
    await client.end();
  }
}

getTables();
