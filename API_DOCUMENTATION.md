# API Documentation (Summary)

All endpoints are prefixed with `/api`.

## Auth
- `POST /api/signup` – Register a new user (name, email, password, role=student|staff).
- `POST /api/login` – Authenticate (email, password) → returns `{ token, user }`.

## Equipment
- `GET /api/equipment` – List all equipment.
- `POST /api/equipment` – (Admin) Create equipment. Body: `{ name, category, cond, total_quantity }`.
- `PUT /api/equipment/:id` – (Admin) Update fields. Body: any of `{ name, category, cond, total_quantity }`.
- `DELETE /api/equipment/:id` – (Admin) Delete equipment.

## Requests
- `POST /api/requests` – (Student/Staff) Create borrow request. Body: `{ item_id }`.
- `GET /api/requests` – (Admin) all requests; (User) own requests.
- `POST /api/requests/:id/approve` – (Admin) Approve a pending request.
- `POST /api/requests/:id/reject` – (Admin) Reject a pending request.
- `POST /api/requests/:id/return` – (Admin) Mark approved as returned.

## Analytics
- `GET /api/analytics` – (Admin) Summary stats:
  - `total_equipment`, `total_users`, `total_requests`, `active_loans`, `pending_requests`, `most_requested_item`.

### Auth Header
Protected endpoints expect: `Authorization: Bearer <token>`
