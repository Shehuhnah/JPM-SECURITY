# GEMINI.md - Project Overview: JPM Security Management System

## Project Overview

This is a full-stack web application designed for a security agency (JPM Security). It functions as a comprehensive management system for guards, schedules, clients, applicants, and internal operations.

### Tech Stack

*   **Frontend:**
    *   **Framework:** [React](https://react.dev/) (v19) built with [Vite](https://vitejs.dev/) (v7).
    *   **Styling:** [Tailwind CSS](https://tailwindcss.com/) (v4) with [Framer Motion](https://www.framer.com/motion/) for animations.
    *   **Routing:** [React Router](https://reactrouter.com/) (v7).
    *   **Key Libraries:**
        *   `@fullcalendar/*`: For scheduling and calendar views.
        *   `chart.js` & `react-chartjs-2`: For data visualization/dashboards.
        *   `socket.io-client`: For real-time messaging and updates.
        *   `react-toastify`: For notifications.
        *   `jspdf`: For generating PDF documents on the client side.

*   **Backend:**
    *   **Runtime:** [Node.js](https://nodejs.org/) (ES Modules).
    *   **Framework:** [Express.js](https://expressjs.com/).
    *   **Database:** [MongoDB](https://www.mongodb.com/) using [Mongoose](https://mongoosejs.com/) ORM.
    *   **Real-time:** [Socket.IO](https://socket.io/) for chat and live updates.
    *   **Authentication:** JWT (JSON Web Tokens) with `bcryptjs` for password hashing.
    *   **Key Utilities:**
        *   `node-cron`: For scheduled tasks (cleanup, etc.).
        *   `nodemailer` / `resend`: For email services.
        *   `multer`: For file uploads (images, documents).

## Project Structure

The project is structured as a monorepo-style codebase:

*   **Root:** Contains backend configuration, server entry point scripts, and backend dependencies.
*   **`backend/`:** Contains the core server logic.
    *   `server.js`: Main entry point (also referenced by root scripts).
    *   `config/`: Database connection (`db.js`).
    *   `controller/`: Request handlers for various features (Auth, Guards, Attendance, etc.).
    *   `models/`: Mongoose schemas (User, Guard, Schedule, Message, etc.).
    *   `routes/`: API route definitions.
    *   `middleware/`: Auth verification, file upload handling.
    *   `utils/`: Helper functions (PDF generation, mailer, cron jobs).
    *   `uploads/` & `assets/`: Static file storage.
*   **`frontend/`:** Contains the React client application.
    *   `src/`: Source code.
        *   `Admin/`: Components and pages for Admin users.
        *   `Applicants/`: Components for job applicants.
        *   `Guard/`: Components for Guard users.
        *   `components/`: Reusable UI components.
        *   `hooks/`, `utils/`, `assets/`: Helper logic and static assets.

## Building and Running

### Prerequisites

*   Node.js (v18+ recommended)
*   MongoDB instance (local or Atlas)
*   Environment variables set up in `.env` (Root) and potentially `frontend/.env`.

### Installation

1.  **Backend Dependencies (Root):**
    ```bash
    npm install
    ```

2.  **Frontend Dependencies:**
    ```bash
    cd frontend
    npm install
    ```

### Development

1.  **Start Backend Server:**
    From the root directory:
    ```bash
    npm run dev
    ```
    *   Runs `nodemon backend/server.js`.
    *   Server listens on port specified in `.env` (usually `5000`).

2.  **Start Frontend Server:**
    From the `frontend/` directory:
    ```bash
    npm run dev
    ```
    *   Runs `vite`.
    *   Accessible at `http://localhost:5173`.

### Production Build

*   **Build Frontend:**
    From the `frontend/` directory:
    ```bash
    npm run build
    ```
    *   Outputs static files to `frontend/dist`.

## Development Conventions

*   **Linting:** Frontend uses ESLint (`npm run lint` in `frontend/`).
*   **API Design:** RESTful API endpoints prefixed with `/api` (e.g., `/api/auth`, `/api/guards`).
*   **Real-time:** Socket.IO events are used for features like "mark seen" in messages and online user tracking.
*   **File Uploads:** Handled via `multer` in the backend, stored locally in `uploads/` or `assets/` and served statically.
