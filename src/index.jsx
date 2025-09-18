import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import App from "./App.jsx";
import MainPage from "./MainPage.jsx";
import "./index.css";

// Admin pages
import AdminDeployment from "./Admin/AdminDeployment.jsx";
import AdminPosts from "./Admin/AdminPosts.jsx";
import AdminHiring from "./Admin/AdminHiring.jsx";
import UserAccounts from "./Admin/UserAccounts.jsx";
import CompanyDetails from "./Admin/CompanyDetails.jsx";
import Dashboard from "./components/Dashboard.jsx";

// Guard pages
import GuardSchedule from "./Admin/GuardSchedule.jsx";

// Applicant pages

// Sub-admin pages
//

// Components
import Navbar from "./components/navbar.jsx";
import ErrorPage from "./components/error/ErrorPage.jsx";

const root = createRoot(document.getElementById("root"));

root.render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<App />} />
        <Route path="/MainPage" element={<MainPage />} />

        {/* Admin routes */}
        <Route path="/admin/dashboard" element={<Dashboard />} />
        <Route path="/admin/deployment" element={<AdminDeployment />} />
        <Route path="/admin/posts" element={<AdminPosts />} />
        <Route path="/admin/hiring" element={<AdminHiring />} />
        <Route path="/admin/users" element={<UserAccounts />} />
        <Route path="/admin/company" element={<CompanyDetails />} />

        {/* Guard routes */}

        <Route path="/guard/:id/schedule" element={<GuardSchedule />} />

        {/* Applicant routes */}
        {/* <Route path="/applicant/dashboard" element={<ApplicantDashboard />} /> */}

        {/* Sub-admin routes */}
        {/* <Route path="/subadmin/dashboard" element={<SubAdminDashboard />} /> */}

        {/* Other components */}
        <Route path="/navbar" element={<Navbar />} />

        {/* Error handling */}
        <Route path="*" element={<ErrorPage />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
