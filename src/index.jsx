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
import GuardSchedule from "./Admin/GuardSchedule.jsx";

// Guard pages

import GuardLogin from "./Guard/GuardLogin.jsx";
import GuardAttendance from "./Guard/GuardAttendance.jsx";


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
        <Route path="/Admin/Dashboard" element={<Dashboard />} />
        <Route path="/Admin/AdminDeployment" element={<AdminDeployment />} />
        <Route path="/Admin/AdminPosts" element={<AdminPosts />} />
        <Route path="/Admin/AdminHiring" element={<AdminHiring />} />
        <Route path="/Admin/UserAccounts" element={<UserAccounts />} />
        <Route path="/Admin/CompanyDetails" element={<CompanyDetails />} />
        <Route path="/guard/:id/schedule" element={<GuardSchedule />} />

        {/* Guard routes */}
       
        
        <Route path="/Guard/GuardLogin" element={<GuardLogin />} />
        <Route path="/Guard/GuardAttendance" element={<GuardAttendance />} />
     
        
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

