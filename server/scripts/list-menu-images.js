require('dotenv').config();
const { pool } = require('../src/config/database');

(async () => {
  try {
    const result = await pool.query('SELECT menu_id, name, image_url FROM menus ORDER BY menu_id');
    console.log(result.rows);
  } catch (error) {
    console.error(error);
  } finally {
    await pool.end();
  }
})();
