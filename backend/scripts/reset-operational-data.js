const { sequelize } = require('../src/config/database');
require('../src/models');

const transactionalTables = [
  'logistics_processes',
  'receivables',
  'sale_items',
  'sales',
  'contracts',
  'projects',
  'leads'
];

async function tableExists(tableName) {
  const [rows] = await sequelize.query(
    'select to_regclass(:tableName) as table_name',
    { replacements: { tableName } }
  );

  return Boolean(rows[0].table_name);
}

async function countRows(tableName) {
  const [rows] = await sequelize.query(`select count(*)::int as count from ${tableName}`);
  return rows[0].count;
}

async function resetOperationalData() {
  const existingTables = [];
  for (const table of transactionalTables) {
    if (await tableExists(table)) existingTables.push(table);
  }

  const before = {};
  for (const table of existingTables) {
    before[table] = await countRows(table);
  }

  if (existingTables.length > 0) {
    await sequelize.query(`TRUNCATE TABLE ${existingTables.join(', ')} RESTART IDENTITY CASCADE`);
  }

  const after = {};
  for (const table of existingTables) {
    after[table] = await countRows(table);
  }

  console.log(JSON.stringify({ truncatedTables: existingTables, before, after }, null, 2));
}

resetOperationalData()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await sequelize.close();
  });
