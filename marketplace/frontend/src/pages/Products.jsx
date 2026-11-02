import { useEffect, useState } from 'react';
import { api } from '../api/client';

export default function Products() {
  const [products, setProducts] = useState([]);
  const [q, setQ] = useState('');

  const load = () =>
    api(`/products?q=${encodeURIComponent(q)}`).then((d) => setProducts(d.results));

  useEffect(() => { load(); }, []);

  const addToCart = (id) =>
    api('/cart', { method: 'POST', body: { product_id: id, quantity: 1 } })
      .then(() => alert('Added to cart'))
      .catch((e) => alert(e.message));

  return (
    <div>
      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search products" />
      <button onClick={load}>Search</button>
      <ul>
        {products.map((p) => (
          <li key={p.id}>
            {p.title} — ₹{p.price} (stock: {p.stock})
            <button onClick={() => addToCart(p.id)}>Add to cart</button>
          </li>
        ))}
      </ul>
    </div>
  );
}
