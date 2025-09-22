// router.jsx
import { useRoutes } from "react-router-dom";

// Layouts
import RootLayout from "../Layouts/RootLayout.jsx";
import AdminLayout from "../Layouts/AdminLayout.jsx";
import GuardsLayout from "../Layouts/GuardsLayout.jsx";

// Components
import MainPage from "../components/MainPage.jsx";
import ErrorPage from "../components/error/ErrorPage.jsx";
import Dashboard from "../components/Dashboard.jsx";
import Navbar from "../components/navbar.jsx";

// Admin pages
import AdminDeployment from "../Admin/AdminDeployment.jsx";
import AdminPosts from "../Admin/AdminPosts.jsx";
import AdminHiring from "../Admin/AdminHiring.jsx";
import UserAccounts from "../Admin/UserAccounts.jsx";
import CompanyDetails from "../Admin/CompanyDetails.jsx";
import AdminGuardsProfile from "../Admin/AdminGuardsProfile.jsx";
import AdminCOE from "../Admin/AdminCOE.jsx";
import AdminAttendance from "../Admin/AdminAttendance.jsx";

// Guard pages
import GuardLogin from "../Guard/GuardLogin.jsx";
import GuardDetachment from "../Guard/GuardDetachment.jsx";
import GuardAnnouncement from "../Guard/GuardAnnouncement.jsx";
import GuardLogBook from "../Guard/GuardLogBook.jsx";
import GuardReqCOE from "../Guard/GuardReqCOE.jsx";
import GuardAttendanceTimeIn from "../Guard/GuardAttendanceTimeIn.jsx";
import GuardAttendanceTimeOut from "../Guard/GuardAttendanceTimeOut.jsx";


const Router = () => {
  const routes = useRoutes([
    {
      path: "/",
      element: <RootLayout />,
      children: [
        { index: true, element: <MainPage /> },
        {
          path: "admin",
          element: <AdminLayout />,
          children: [
            { path: "Dashboard", element: <Dashboard /> },
            { path: "AdminDeployment", element: <AdminDeployment /> },
            { path: "AdminPosts", element: <AdminPosts /> },
            { path: "AdminHiring", element: <AdminHiring /> },
            { path: "UserAccounts", element: <UserAccounts /> },
            { path: "CompanyDetails", element: <CompanyDetails /> },
            { path: "AdminGuardsProfile", element: <AdminGuardsProfile />},
            { path: "AdminCOE", element: <AdminCOE /> },
            { path: "AdminAttendance", element: <AdminAttendance /> }
          ],
        },
        {
          path: "guard",
          element: <GuardsLayout />,
          children: [
            { path: "GuardAttendanceTimeIn", element: <GuardAttendanceTimeIn /> },
            { path: "GuardAttendanceTimeOut", element: <GuardAttendanceTimeOut /> },
            { path: "GuardLogin", element: <GuardLogin /> },
            { path: "GuardDetachment", element: <GuardDetachment /> },
            { path: "GuardAnnouncement", element: <GuardAnnouncement /> },
            { path: "GuardLogBook", element: <GuardLogBook /> },
            { path: "GuardReqCOE", element: <GuardReqCOE /> },
          ],
        },
        { path: "navbar", element: <Navbar /> },
        { path: "*", element: <ErrorPage /> },
      ],
    },
  ]);

  return routes;
};

export default Router;
