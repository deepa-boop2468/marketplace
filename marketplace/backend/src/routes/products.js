const router = require('express').Router();
const pool = require('../config/db');
const { authenticate, authorize } = require('../middleware/auth');

// GET /api/products?q=phone&category=1&minPrice=100&maxPrice=5000&page=1&limit=10
router.get('/', async (req, res, next) => {
  try {
    const { q, category, minPrice, maxPrice } = req.query;
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(parseInt(req.query.limit) || 10, 50);

    const where = [];
    const params = [];
    if (q) {
      params.push(q);
      where.push(`to_tsvector('english', p.title || ' ' || COALESCE(p.description,'')) @@ plainto_tsquery('english', $${params.length})`);
    }
    if (category) { params.push(category); where.push(`p.category_id = $${params.length}`); }
    if (minPrice) { params.push(minPrice); where.push(`p.price >= $${params.length}`); }
    if (maxPrice) { params.push(maxPrice); where.push(`p.price <= $${params.length}`); }

    params.push(limit, (page - 1) * limit);
    const sql = `
      SELECT p.*, COALESCE(AVG(r.rating),0)::numeric(3,2) AS avg_rating
      FROM products p LEFT JOIN reviews r ON r.product_id = p.id
      ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
      GROUP BY p.id ORDER BY p.created_at DESC
      LIMIT $${params.length - 1} OFFSET $${params.length}`;
    const { rows } = await pool.query(sql, params);
    res.json({ page, limit, results: rows });
  } catch (e) { next(e); }
});

router.get('/:id', async (req, res, next) => {
  try {
    const { rows } = await pool.query('SELECT * FROM products WHERE id = $1', [req.params.id]);
    if (!rows[0]) return res.status(404).json({ error: 'Product not found' });
    res.json(rows[0]);
  } catch (e) { next(e); }
});

router.post('/', authenticate, authorize('seller', 'admin'), async (req, res, next) => {
  try {
    const { title, description, price, stock, category_id } = req.body;
    if (!title || price == null) return res.status(400).json({ error: 'title and price required' });
    const { rows } = await pool.query(
      `INSERT INTO products (seller_id, category_id, title, description, price, stock)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [req.user.id, category_id || null, title, description || null, price, stock || 0]
    );
    res.status(201).json(rows[0]);
  } catch (e) { next(e); }
});

router.put('/:id', authenticate, authorize('seller', 'admin'), async (req, res, next) => {
  try {
    const { title, description, price, stock } = req.body;
    const { rows } = await pool.query(
      `UPDATE products SET title = COALESCE($1,title), description = COALESCE($2,description),
         price = COALESCE($3,price), stock = COALESCE($4,stock)
       WHERE id = $5 AND (seller_id = $6 OR $7 = 'admin') RETURNING *`,
      [title, description, price, stock, req.params.id, req.user.id, req.user.role]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Not found or not your product' });
    res.json(rows[0]);
  } catch (e) { next(e); }
});

router.delete('/:id', authenticate, authorize('seller', 'admin'), async (req, res, next) => {
  try {
    const { rowCount } = await pool.query(
      'DELETE FROM products WHERE id = $1 AND (seller_id = $2 OR $3 = \'admin\')',
      [req.params.id, req.user.id, req.user.role]
    );
    if (!rowCount) return res.status(404).json({ error: 'Not found or not your product' });
    res.status(204).end();
  } catch (e) { next(e); }
});

module.exports = router;
