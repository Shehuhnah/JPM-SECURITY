// router.jsx
import { useRoutes } from "react-router-dom";

// Layouts
import RootLayout from "../Layouts/RootLayout.jsx";
import AdminLayout from "../Layouts/AdminLayout.jsx";
import GuardsLayout from "../Layouts/GuardsLayout.jsx";
import ApplicantsLayout from "../Layouts/ApplicantsLayout.jsx";
import SubAdminLayout from "../Layouts/SubAdminLayout.jsx";
import HomeLayout from "../Layouts/HomeLayout.jsx";

// Components
import ErrorPage from "../components/error/ErrorPage.jsx";
import Navbar from "../components/navbar.jsx";
import Login from "../Admin/Login.jsx";

// Admin pages
import AdminDeployment from "../Admin/AdminDeployment.jsx";
import AdminPosts from "../Admin/AdminPosts.jsx";
import AdminHiring from "../Admin/AdminHiring.jsx";
import UserAccounts from "../Admin/UserAccounts.jsx";
import CompanyDetails from "../Admin/CompanyDetails.jsx";
import AdminGuardsProfile from "../Admin/AdminGuardsProfile.jsx";
import AdminCOE from "../Admin/AdminCOE.jsx";
import AdminAttendance from "../Admin/AdminAttendance.jsx";
import AdminGuardUpdates from "../Admin/AdminGuardUpdates.jsx";
import AdminGuardUpdates2 from "../Admin/AdminGuardUpdates2.jsx";
import AdminMessage from "../Admin/AdminMessage.jsx";
import ApplicantList from "../Admin/ApplicantList.jsx";
import AdminRequestID from "../Admin/AdminRequestID.jsx";
import AdminAddSchedule from "../Admin/AdminAddSchedule.jsx";

// Guard pages
import GuardLogin from "../Guard/GuardLogin.jsx";
import GuardDetachment from "../Guard/GuardDetachment.jsx";
import GuardAnnouncement from "../Guard/GuardAnnouncement.jsx";
import GuardLogBook from "../Guard/GuardLogBook.jsx";
import GuardReqCOE from "../Guard/GuardReqCOE.jsx";
import GuardAttendanceTimeIn from "../Guard/GuardAttendanceTimeIn.jsx";
import GuardAttendanceTimeOut from "../Guard/GuardAttendanceTimeOut.jsx";
import GuardProfile from "../Guard/GuardProfile.jsx";
import GuardReqID from "../Guard/GuardReqID.jsx";
import AdminSchedApproval from "../Admin/AdminSchedApproval.jsx";

// Applicants pages
import ApplicantsHiringDetails from "../Applicants/ApplicantsHiringDetails.jsx";
import ApplicantsMessages from "../Applicants/ApplicantsMessages.jsx";

// SubAdmin pages
import SubAnnouncement from "../SubAdmin/SubAnnouncement.jsx";
import SubApplicantResume from "../SubAdmin/SubApplicantResume.jsx";
import SubCompanyDetails from "../SubAdmin/SubCompanyDetails.jsx";
import SubGuardAttendance from "../SubAdmin/SubGuardAttendance.jsx";
import SubGuardMessages from "../SubAdmin/SubGuardMessages.jsx";
import SubGuardSchedule from "../SubAdmin/SubGuardSchedule.jsx";
import SubGuardUpdates from "../SubAdmin/SubGuardUpdates.jsx";
import SubHiring from "../SubAdmin/SubHiring.jsx";
import SubLogin from "../SubAdmin/SubLogin.jsx";

// Public pages
import HomePage from "../Home/homePage.jsx";
import AboutUs from "../Home/aboutUsPage.jsx";
import ContactUs from "../Home/contactUsPage.jsx";
import ClientPage from "../Home/clientPage.jsx";
import ServicesPage from "../Home/servicesPage.jsx";
import Gallery from "../Home/galleryPage.jsx";
import AdminDashboard from "../Admin/AdminDashboard.jsx";

const Router = () => {
  const routes = useRoutes([
    {
      path: "/",
      element: <RootLayout />,
      children: [
        {
          path: "/",
          element: <HomeLayout />,
          children: [
            { index: true, element: <HomePage /> },
            { path: "home", element: <HomePage /> },
            { path: "about-us", element: <AboutUs /> },
            { path: "contact-us", element: <ContactUs /> },
            { path: "clients", element: <ClientPage /> },
            { path: "services", element: <ServicesPage /> },
            { path: "gallery", element: <Gallery /> },
          ],
        },
        {
          path: "admin",
          children: [
            { path: "Login", element: <Login /> },
            {
              element: <AdminLayout />,
              children: [
                { index: true, element: <AdminDashboard /> },
                { path: "deployment", element: <AdminDeployment /> },
                { path: "AdminPosts", element: <AdminPosts /> },
                { path: "AdminHiring", element: <AdminHiring /> },
                { path: "UserAccounts", element: <UserAccounts /> },
                { path: "CompanyDetails", element: <CompanyDetails /> },
                { path: "AdminGuardsProfile", element: <AdminGuardsProfile /> },
                { path: "AdminCOE", element: <AdminCOE /> },
                { path: "AdminAttendance", element: <AdminAttendance /> },
                { path: "AdminGuardUpdates", element: <AdminGuardUpdates /> },
                { path: "AdminGuardUpdates2/:id", element: <AdminGuardUpdates2 /> },
                { path: "AdminMessages", element: <AdminMessage /> },
                { path: "ApplicantList", element: <ApplicantList />},
                { path: "Request-ID", element: <AdminRequestID/>},
                { path: "request-coe", element: <GuardReqCOE /> },
                { path: "schedule-approval", element: <AdminSchedApproval /> },
                { path: "deployment/add-schedule", element: <AdminAddSchedule /> },
              ],
            },
          ],
        },
        {
          path: "guard",
          children: [
            { path: "login", element: <GuardLogin /> },
            {
              element: <GuardsLayout />,
              children: [
                { path: "guard-attendance/time-in", element: <GuardAttendanceTimeIn /> },
                { path: "guard-attendance/time-out", element: <GuardAttendanceTimeOut /> },
                { path: "detachment", element: <GuardDetachment /> },
                { path: "announcements", element: <GuardAnnouncement /> },
                { path: "logbook", element: <GuardLogBook /> },
                { path: "request-coe", element: <GuardReqCOE /> },
                { path: "manage-profile", element: <GuardProfile/>},
                { path: "request-id", element: <GuardReqID/>}
              ],
            },
          ],
        },

        // ✅ Applicants Section
        {
          path: "job-application-process/applicants",
          element: <ApplicantsLayout />,
          children: [
            { index: true, element: <ApplicantsHiringDetails /> },
            { path: "/job-application-process/applicants", element: <ApplicantsHiringDetails /> },
            { path: "messages", element: <ApplicantsMessages /> },
          ],
        },

        // ✅ SubAdmin Section
        {
          path: "subadmin",
          children: [
            { path: "login", element: <SubLogin /> },
            {
              element: <SubAdminLayout />,
              children: [
                
              ],
            },
          ],
        },

        // Misc
        { path: "navbar", element: <Navbar /> },
        { path: "*", element: <ErrorPage /> },
      ],
    },
  ]);

  return routes;
};

export default Router;
