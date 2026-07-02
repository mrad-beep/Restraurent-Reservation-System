# Restaurant Reservation Management System

A full-stack MERN application for managing restaurant table reservations, with
separate customer and admin experiences, JWT authentication, and
conflict/capacity-aware booking logic.

- **Frontend:** React (Vite)
- **Backend:** Node.js + Express
- **Database:** MongoDB (Mongoose)
- **Auth:** JWT

---

## 1. Folder Structure

```
restaurant-reservation-system/
├── backend/
│   ├── config/
│   │   └── db.js                  # MongoDB connection
│   ├── controllers/
│   │   ├── authController.js      # register / login / me
│   │   ├── reservationController.js  # core booking + availability logic
│   │   └── tableController.js     # admin table management
│   ├── middleware/
│   │   └── auth.js                # JWT verification + role authorization
│   ├── models/
│   │   ├── User.js
│   │   ├── Table.js
│   │   └── Reservation.js
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── reservationRoutes.js
│   │   └── tableRoutes.js
│   ├── utils/
│   │   └── errorHandler.js        # asyncHandler + centralized error middleware
│   ├── seed.js                    # seeds tables + one admin account
│   ├── server.js                  # app entry point
│   ├── .env.example
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   │   └── axios.js           # axios instance + JWT interceptor
│   │   ├── components/
│   │   │   ├── Navbar.jsx
│   │   │   └── PrivateRoute.jsx   # role-based route guard
│   │   ├── context/
│   │   │   └── AuthContext.jsx    # global auth state
│   │   ├── pages/
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   ├── CustomerDashboard.jsx
│   │   │   └── AdminDashboard.jsx
│   │   ├── App.jsx                # routes
│   │   ├── main.jsx                # entry point
│   │   └── styles.css
│   ├── index.html
│   ├── .env.example
│   ├── vite.config.js
│   └── package.json
│
└── README.md   (this file)
```

---

## 2. Prerequisites

Install these once on your machine before starting:

1. **Node.js** (v18 or later) — https://nodejs.org
2. **VS Code** — https://code.visualstudio.com
3. **MongoDB** — either:
   - **Local install:** https://www.mongodb.com/try/download/community, or
   - **MongoDB Atlas** (free cloud cluster, recommended for beginners): https://www.mongodb.com/cloud/atlas/register
4. Optional but helpful VS Code extensions: "ES7+ React/Redux snippets", "MongoDB for VS Code", "Thunder Client" (for testing APIs without Postman).

---

## 3. Step-by-Step: Running This in VS Code

### Step 1 — Unzip and open the project
1. Unzip the project folder anywhere on your computer.
2. Open **VS Code**.
3. `File → Open Folder...` → select the `restaurant-reservation-system` folder (the one containing both `backend` and `frontend`).
4. Open a terminal in VS Code: `Terminal → New Terminal`.

### Step 2 — Set up the backend
```bash
cd backend
npm install
```
Create your real environment file:
```bash
cp .env.example .env
```
Open `.env` in VS Code and fill in the values:
```
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/restaurant_reservation
JWT_SECRET=any_long_random_string_here
JWT_EXPIRES_IN=7d
CLIENT_ORIGIN=http://localhost:5173
```
- If you're using **MongoDB Atlas** instead of local MongoDB, replace `MONGO_URI` with the connection string Atlas gives you (Database → Connect → "Connect your application").

Seed the database with tables and a demo admin account:
```bash
npm run seed
```
This creates:
- 6 tables (capacities: 2, 2, 4, 4, 6, 8)
- One admin account: `admin@restaurant.com` / `admin123`

Start the backend server:
```bash
npm run dev
```
You should see `MongoDB connected...` and `Server running on port 5000`. Leave this terminal running.

### Step 3 — Set up the frontend
Open a **second terminal** in VS Code (click the `+` icon in the terminal panel), then:
```bash
cd frontend
npm install
cp .env.example .env
```
The default `.env` (`VITE_API_URL=http://localhost:5000/api`) works out of the box for local development — no changes needed unless your backend runs on a different port/URL.

Start the frontend:
```bash
npm run dev
```
Open the printed URL (usually `http://localhost:5173`) in your browser.

### Step 4 — Try it out
- Register a new account → you'll land on the **customer dashboard**.
- Book a table for a date/time/guest count → it auto-assigns an available table.
- Try booking the same date/time/guest count again with a different account → you'll see it gracefully route to another table, or reject the booking once all tables are full for that slot.
- Log out, then log in as `admin@restaurant.com` / `admin123` → you'll land on the **admin panel**, where you can see all reservations, filter by date, cancel any reservation, and manage tables.

---

## 4. Key Design Decisions & Assumptions

- **Single restaurant, fixed tables:** Tables are seeded once via `seed.js`. Admins can add/deactivate tables afterward through the Admin Panel.
- **Fixed time slots:** Rather than free-form time input (which makes overlap detection ambiguous), the system uses five fixed slots per day (`12:00-13:30`, `13:30-15:00`, `18:00-19:30`, `19:30-21:00`, `21:00-22:30`). This keeps conflict detection exact and simple to reason about.
- **Date stored as a string (`YYYY-MM-DD`):** Avoids timezone-conversion bugs that are common with JS `Date` objects when only the calendar date matters.
- **Auto table assignment:** When a customer books without specifying a table, the backend picks the *smallest available table that still fits the party size* for that date/slot — this avoids wasting a table for 8 people on a party of 2.
- **Conflict prevention logic (in `reservationController.js`):**
  1. Only reservations with `status: "confirmed"` are considered "occupying" a table — cancelled ones free up the slot.
  2. Before creating/updating a reservation, the backend queries for any confirmed reservation on the same `table + date + timeSlot`. If one exists, the request is rejected with `409 Conflict`.
  3. Capacity is checked (`table.capacity >= numberOfGuests`) before confirming.
- **Soft-delete for tables:** Deactivating a table (`isActive: false`) instead of hard-deleting it preserves historical reservation records and referential integrity.
- **Role-based access control:**
  - JWT is issued at login/register and stored in `localStorage` on the frontend.
  - `middleware/auth.js`'s `protect` verifies the token and attaches the user to `req.user`.
  - `authorize("admin")` / `authorize("customer")` restrict specific routes by role at the backend — this is the actual security boundary.
  - The frontend's `PrivateRoute` component additionally hides customer/admin pages from the wrong role for a clean UX, but the backend authorization is what actually enforces access control (a customer cannot call admin endpoints even by hitting the API directly).
  - New public registrations always get `role: "customer"` — the only way to get an admin account in this project is via `seed.js`, preventing self-promotion to admin.

---

## 5. API Overview

| Method | Route                              | Access          | Description                          |
|--------|-------------------------------------|-----------------|---------------------------------------|
| POST   | `/api/auth/register`               | Public          | Create a customer account            |
| POST   | `/api/auth/login`                  | Public          | Login, returns JWT                   |
| GET    | `/api/auth/me`                     | Private         | Get current user info                |
| GET    | `/api/tables`                      | Private         | List active tables                   |
| POST   | `/api/tables`                      | Admin           | Create a table                       |
| PUT    | `/api/tables/:id`                  | Admin           | Update a table                       |
| DELETE | `/api/tables/:id`                  | Admin           | Deactivate a table                   |
| POST   | `/api/reservations`                | Customer        | Create a reservation                 |
| GET    | `/api/reservations/my`             | Customer        | View own reservations                |
| DELETE | `/api/reservations/:id`            | Customer        | Cancel own reservation               |
| GET    | `/api/reservations/available-slots`| Private         | Check available tables for a slot    |
| GET    | `/api/reservations`                | Admin           | View all reservations (supports `?date=YYYY-MM-DD`) |
| PUT    | `/api/reservations/:id`            | Admin           | Update any reservation               |
| DELETE | `/api/reservations/admin/:id`      | Admin           | Cancel any reservation               |

---

## 6. Known Limitations

- No payment integration, email/SMS notifications, or real-time updates — explicitly out of scope per the assignment.
- Time slots are fixed rather than fully custom/arbitrary time ranges.
- No password-reset flow (only register/login).
- No pagination on admin reservation lists — fine for a single restaurant's typical volume, but would need it at larger scale.
- UI is intentionally simple/functional rather than polished, per the assignment's focus on correctness over visual design.

## 7. Areas for Improvement (Given More Time)

- Add automated tests (Jest/Supertest for backend, React Testing Library for frontend).
- Add pagination and search/sort to the admin reservation table.
- Allow custom/arbitrary reservation durations instead of fixed slots.
- Add email confirmation/reminders.
- Add a visual table/floor-plan view for admins.
- Rate-limit auth endpoints and add refresh tokens for better session security.

---

## 8. Deployment Guide (Quick Reference)

**Backend (e.g., Render/Railway):**
1. Push this repo to GitHub.
2. Create a new Web Service, root directory `backend/`.
3. Build command: `npm install`; Start command: `npm start`.
4. Set environment variables (`MONGO_URI`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `CLIENT_ORIGIN` = your deployed frontend URL).
5. After first deploy, run the seed script once (via the platform's shell/console): `npm run seed`.

**Frontend (e.g., Vercel/Netlify):**
1. Import the repo, set root directory to `frontend/`.
2. Build command: `npm run build`; Output directory: `dist`.
3. Set environment variable `VITE_API_URL` to your deployed backend URL + `/api` (e.g., `https://your-backend.onrender.com/api`).
4. Deploy — your live app URL is what you submit.

**Database:** Use MongoDB Atlas (free tier) for the deployed `MONGO_URI` so both frontend and backend can reach it from the cloud.
