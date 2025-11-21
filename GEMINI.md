# GEMINI.md - Project Overview: JPM Security Management System

## Project Overview

This is a full-stack MERN-like web application for a security agency. It appears to be a management system for guards, schedules, clients, and internal operations.

*   **Frontend:** The frontend is a [React](https://reactjs.org/) application built with [Vite](https://vitejs.dev/). It uses [Tailwind CSS](https://tailwindcss.com/) for styling and [React Router](https://reactrouter.com/) for navigation. It also includes components for calendars (`@fullcalendar/react`), charts (`chart.js`), and real-time communication (`socket.io-client`).

*   **Backend:** The backend is a [Node.js](https://nodejs.org/) application using the [Express](https://expressjs.com/) framework. It connects to a [MongoDB](https://www.mongodb.com/) database via [Mongoose](https://mongoosejs.com/). It provides a RESTful API for managing various resources like guards, schedules, clients, and more. It also uses [Socket.IO](https://socket.io/) for real-time features like messaging.

*   **Authentication:** The system uses JSON Web Tokens (JWT) for authentication.

## Building and Running

### Prerequisites

*   Node.js and npm
*   A running MongoDB instance
*   A `.env` file in the root directory containing the `MONGO_URI` and other necessary environment variables.

### Installation

1.  **Install root dependencies (for the backend):**
    ```bash
    npm install
    ```

2.  **Install frontend dependencies:**
    ```bash
    cd frontend
    npm install
    ```

### Running the Application

1.  **Run the backend server:**
    From the root directory:
    ```bash
    npm run dev
    ```
    The backend server will start on `http://localhost:5000`.

2.  **Run the frontend development server:**
    From the `frontend` directory:
    ```bash
    npm run dev
    ```
    The frontend application will be available at `http://localhost:5173`.

### Building for Production

*   **Build the frontend:**
    From the `frontend` directory:
    ```bash
    npm run build
    ```

## Development Conventions

*   **Code Style:** The project uses ESLint for code linting. Run `npm run lint` in the `frontend` directory to check for issues.
*   **API:** The backend exposes a RESTful API under the `/api` prefix.
*   **Modularity:** The backend code is organized into `routes`, `controllers`, and `models` directories, which is a common and good practice for Express applications. The frontend code is organized by features (e.g., `Admin`, `Guard`, `Applicants`).
