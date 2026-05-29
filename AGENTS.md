# Repository Guidelines

## Project Structure & Module Organization

This is a full-stack JPM Security management system. The root `package.json` manages the Node/Express backend at `backend/server.js`. Backend code is organized by responsibility: `backend/routes/` defines API endpoints, `backend/controller/` contains request handlers, `backend/models/` contains Mongoose schemas, `backend/middleware/` handles auth and uploads, and `backend/utils/` contains helpers for mail, cron jobs, attendance, and PDFs. Static files live in `backend/assets/`; uploads live under `backend/uploads/`.

The React/Vite client lives in `frontend/src/`, with role-based folders such as `Admin/`, `Guard/`, `Applicants/`, and `Home/`. Shared UI, layout, hook, utility, and asset code belongs in `components/`, `Layouts/`, `hooks/`, `utils/`, and `assets/`.

## Build, Test, and Development Commands

Run backend commands from the repository root:

```bash
npm install
npm run dev
npm start
```

`npm run dev` starts Nodemon; `npm start` runs the backend with Node.

Run frontend commands from `frontend/`:

```bash
npm install
npm run dev
npm run build
npm run lint
npm run preview
```

`npm run dev` starts Vite, `npm run build` creates `frontend/dist`, `npm run lint` runs ESLint, and `npm run preview` serves the build.

## Coding Style & Naming Conventions

Use ES modules throughout the project. Frontend components use `.jsx` and PascalCase filenames, for example `AdminDashboard.jsx`. Hooks use camelCase names beginning with `use`, such as `useAuth.js`. Backend files should keep the existing descriptive camelCase or feature-based naming style.

Follow the existing two-space JSON indentation and keep JavaScript formatting consistent with nearby files. Frontend linting is configured in `frontend/eslint.config.js`.

## Testing Guidelines

No automated test suite is currently configured. Before opening a change, run `npm run lint` in `frontend/` and manually verify affected API flows, authentication, uploads, messaging, attendance, schedules, and PDF generation. If tests are added, place them beside the relevant module or in `__tests__/` and use names like `featureName.test.js`.

## Commit & Pull Request Guidelines

Recent commits use short, imperative summaries, sometimes with a `refactor:` prefix. Keep messages focused on the user-visible change, for example `fix applicant message filters`.

Pull requests should include a concise description, affected roles or modules, manual test notes, linked issues when available, and screenshots for UI changes. Call out any `.env`, database, upload, or deployment impact.

## Security & Configuration Tips

Keep secrets in `.env` files and do not commit credentials. Backend features depend on MongoDB, JWT settings, email keys, upload paths, and Cloudinary configuration. Treat files in `backend/uploads/` as user data and avoid deleting them unless required.
