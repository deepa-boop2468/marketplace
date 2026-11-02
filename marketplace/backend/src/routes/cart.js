const router = require('express').Router();
const pool = require('../config/db');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

router.get('/', async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT c.product_id, p.title, p.price, c.quantity, (p.price * c.quantity) AS line_total
       FROM cart_items c JOIN products p ON p.id = c.product_id WHERE c.user_id = $1`,
      [req.user.id]
    );
    res.json(rows);
  } catch (e) { next(e); }
});

router.post('/', async (req, res, next) => {
  try {
    const { product_id, quantity = 1 } = req.body;
    if (!product_id || quantity < 1) return res.status(400).json({ error: 'Invalid input' });
    await pool.query(
      `INSERT INTO cart_items (user_id, product_id, quantity) VALUES ($1,$2,$3)
       ON CONFLICT (user_id, product_id) DO UPDATE SET quantity = cart_items.quantity + EXCLUDED.quantity`,
      [req.user.id, product_id, quantity]
    );
    res.status(201).json({ message: 'Added to cart' });
  } catch (e) { next(e); }
});

router.delete('/:productId', async (req, res, next) => {
  try {
    await pool.query('DELETE FROM cart_items WHERE user_id = $1 AND product_id = $2',
      [req.user.id, req.params.productId]);
    res.status(204).end();
  } catch (e) { next(e); }
});

module.exports = router;
