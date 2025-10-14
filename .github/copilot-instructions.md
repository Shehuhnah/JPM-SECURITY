# JPM-SECURITY: AI Coding Agent Instructions

## Project Architecture
- **Monorepo structure**: `backend/` (Node.js/Express/MongoDB API) and `frontend/` (React + Vite SPA)
- **Backend**: REST API with Express, Mongoose models, JWT authentication, and role-based access (`admin`, `subadmin`, `guard`, `applicant`).
  - Entry: `backend/server.js`
  - Routes: `backend/routes/authRoutes.js` (auth, user management)
  - Models: `backend/models/User.model.js` (password hashing, roles)
  - Controllers: `backend/controller/authController.js`, `backend/controller/userController.js`
- **Frontend**: React app with Vite, Tailwind CSS, modular directory for roles (`Admin/`, `Guard/`, `SubAdmin/`, `Applicants/`).
  - Entry: `frontend/src/main.jsx`
  - Routing: `frontend/src/Routes/router.jsx`
  - Layouts: `frontend/src/Layouts/`

## Developer Workflows
- **Backend**: Start with `npm run dev` (uses nodemon, entry: `backend/server.js`).
- **Frontend**: Start with `npm run dev` in `frontend/` (Vite dev server).
- **Linting**: Run `npm run lint` in `frontend/`.
- **Environment**: Requires `.env` with `MONGO_URI` and `JWT_SECRET` for backend.

## Patterns & Conventions
- **Role-based access**: User roles are enforced in models and controllers. See `User.model.js` for allowed roles and password logic.
- **API endpoints**: All auth/user endpoints are under `/api/auth` (see `authRoutes.js`).
- **Password security**: Passwords are hashed before saving; use `matchPassword` for login.
- **Frontend modularity**: Role-specific UI logic is separated by directory (`Admin/`, `Guard/`, etc.).
- **React Router**: Centralized in `src/Routes/router.jsx`.
- **Tailwind CSS**: Used for styling; see `frontend/src/index.css`.

## Integration Points
- **MongoDB**: Used for persistent storage (see `MONGO_URI` in `.env`).
- **JWT**: Used for authentication (see `JWT_SECRET` in `.env`).
- **Express/Mongoose**: API logic and data models.
- **React/Vite**: SPA frontend, communicates with backend via REST API.

## Examples
- **Register/Login**: POST to `/api/auth/register` or `/api/auth/login` (see `authController.js`).
- **Get Users**: GET `/api/auth/users` (see `userController.js`).
- **Create/Delete User**: Use exported controller methods in `userController.js`.

## Key Files
- `backend/server.js`, `backend/routes/authRoutes.js`, `backend/models/User.model.js`, `frontend/src/Routes/router.jsx`, `frontend/src/Layouts/`

---
_If any section is unclear or missing, please provide feedback for further refinement._
