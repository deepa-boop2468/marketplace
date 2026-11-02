const router = require('express').Router();
const pool = require('../config/db');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);

// Place order: ACID transaction + row locks so two buyers cannot oversell stock
router.post('/', async (req, res, next) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const cart = await client.query(
      `SELECT c.product_id, c.quantity, p.price, p.stock
       FROM cart_items c JOIN products p ON p.id = c.product_id
       WHERE c.user_id = $1 FOR UPDATE OF p`,   // lock product rows
      [req.user.id]
    );
    if (!cart.rows.length) throw Object.assign(new Error('Cart is empty'), { status: 400 });

    let total = 0;
    for (const item of cart.rows) {
      if (item.stock < item.quantity)
        throw Object.assign(new Error(`Insufficient stock for product ${item.product_id}`), { status: 409 });
      total += item.price * item.quantity;
    }

    const order = await client.query(
      'INSERT INTO orders (user_id, total) VALUES ($1,$2) RETURNING *',
      [req.user.id, total]
    );

    for (const item of cart.rows) {
      await client.query(
        'INSERT INTO order_items (order_id, product_id, quantity, unit_price) VALUES ($1,$2,$3,$4)',
        [order.rows[0].id, item.product_id, item.quantity, item.price]
      );
      await client.query('UPDATE products SET stock = stock - $1 WHERE id = $2',
        [item.quantity, item.product_id]);
    }

    await client.query('DELETE FROM cart_items WHERE user_id = $1', [req.user.id]);
    await client.query('COMMIT');
    res.status(201).json(order.rows[0]);
  } catch (e) {
    await client.query('ROLLBACK');
    next(e);
  } finally {
    client.release();
  }
});

router.get('/', async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM orders WHERE user_id = $1 ORDER BY created_at DESC', [req.user.id]);
    res.json(rows);
  } catch (e) { next(e); }
});

// Admin: update order status workflow
router.patch('/:id/status', authorize('admin'), async (req, res, next) => {
  try {
    const { status } = req.body;
    const { rows } = await pool.query(
      'UPDATE orders SET status = $1 WHERE id = $2 RETURNING *', [status, req.params.id]);
    if (!rows[0]) return res.status(404).json({ error: 'Order not found' });
    res.json(rows[0]);
  } catch (e) { next(e); }
});

module.exports = router;
