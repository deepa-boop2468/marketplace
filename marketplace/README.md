# Marketplace — Full-Stack E-Commerce Web Application

A full-stack e-commerce marketplace with a relational (PostgreSQL) backend covering product listings, cart, and transactional order management.

> Status: In Progress

## Features
- JWT authentication with role-based access control (customer / seller / admin)
- Product CRUD for sellers, with full-text search, filters, and pagination
- Cart management
- Transactional order placement with row-level stock locking (prevents overselling)
- Admin order status workflow
- Rate limiting, centralized error handling
- Dockerized setup and GitHub Actions CI

## Tech Stack
| Layer | Technology |
|---|---|
| Frontend | React + Vite |
| Backend | Node.js, Express |
| Database | PostgreSQL |
| Auth | JWT, bcrypt |
| DevOps | Docker, docker-compose, GitHub Actions |
| Testing | Jest, Supertest |

## Getting Started
```bash
git clone https://github.com/deepa-boop2468/marketplace.git
cd marketplace
cp .env.example .env
docker-compose up --build
```
- Frontend: http://localhost:5173
- API: http://localhost:5000/api/health

### Run without Docker
```bash
cd backend && npm install && npm run dev
cd frontend && npm install && npm run dev
```
Requires a local PostgreSQL: run `database/schema.sql` first and set `DATABASE_URL` in `.env`. For local frontend dev, change the proxy target in `frontend/vite.config.js` to `http://localhost:5000`.

## API Endpoints
| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | /api/auth/register | Public | Register user |
| POST | /api/auth/login | Public | Login, returns JWT |
| GET | /api/products | Public | Search / filter / paginate |
| POST | /api/products | Seller, Admin | Create product |
| PUT/DELETE | /api/products/:id | Owner, Admin | Update / delete |
| GET/POST | /api/cart | Customer | View / add to cart |
| DELETE | /api/cart/:productId | Customer | Remove from cart |
| POST | /api/orders | Customer | Place order (transaction) |
| GET | /api/orders | Customer | Order history |
| PATCH | /api/orders/:id/status | Admin | Update order status |

## Database Schema
Tables: `users`, `categories`, `products`, `cart_items`, `orders`, `order_items`, `reviews` — see `database/schema.sql`.

## Roadmap
- [ ] Payment gateway integration (test mode) with webhook verification
- [ ] Redis caching for product listings
- [ ] Reviews endpoints (verified buyers only)
- [ ] Admin sales analytics dashboard
- [ ] Swagger/OpenAPI documentation
- [ ] Deployment (Render / Railway + Vercel)
