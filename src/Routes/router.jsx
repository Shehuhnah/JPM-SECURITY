// router.jsx
import { useRoutes } from "react-router-dom";

// Layouts
import RootLayout from "../Layouts/RootLayout.jsx";
import AdminLayout from "../Layouts/AdminLayout.jsx";
import GuardsLayout from "../Layouts/GuardsLayout.jsx";
import ApplicantsLayout from "../Layouts/ApplicantsLayout.jsx";
import SubAdminLayout from "../Layouts/SubAdminLayout.jsx";

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
import GuardUpdates from "../Admin/AdminGuardUpdates.jsx";
import GuardUpdates2 from "../Admin/AdminGuardUpdates2.jsx";

// Guard pages
import GuardLogin from "../Guard/GuardLogin.jsx";
import GuardDetachment from "../Guard/GuardDetachment.jsx";
import GuardAnnouncement from "../Guard/GuardAnnouncement.jsx";
import GuardLogBook from "../Guard/GuardLogBook.jsx";
import GuardReqCOE from "../Guard/GuardReqCOE.jsx";
import GuardAttendanceTimeIn from "../Guard/GuardAttendanceTimeIn.jsx";
import GuardAttendanceTimeOut from "../Guard/GuardAttendanceTimeOut.jsx";

// Applicants pages
import ApplicantsCompanyDetails from "../Applicants/ApplicantsCompanyDetails.jsx";
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
            { path: "AdminAttendance", element: <AdminAttendance /> },
            { path: "guard-updates", element: <GuardUpdates /> },
            { path: "guard-updates2/:id", element: <GuardUpdates2 /> },

          ],
        },
        {
          path: "guard",
          children: [
            { path: "GuardLogin", element: <GuardLogin /> }, // ⬅️ not wrapped in GuardsLayout
            {
              element: <GuardsLayout />,
              children: [
                { path: "GuardAttendanceTimeIn", element: <GuardAttendanceTimeIn /> },
                { path: "GuardAttendanceTimeOut", element: <GuardAttendanceTimeOut /> },
                { path: "GuardDetachment", element: <GuardDetachment /> },
                { path: "GuardAnnouncement", element: <GuardAnnouncement /> },
                { path: "GuardLogBook", element: <GuardLogBook /> },
                { path: "GuardReqCOE", element: <GuardReqCOE /> },
              ],
            },
          ],
        },
        {
          path: "Applicants",
          element: <ApplicantsLayout />,
          children: [
            { path: "ApplicantsCompanyDetails", element: <ApplicantsCompanyDetails /> },
            { path: "ApplicantsHiringDetails", element: <ApplicantsHiringDetails /> },
            { path: "ApplicantsMessages", element: <ApplicantsMessages /> }
          ],
        },
        {
          path: "SubAdmin",
          children:[
            { path: "SubLogin", element: <SubLogin /> },
            {
              element: <SubAdminLayout />,
              children: [
                { path: "SubAnnouncement", element: <SubAnnouncement /> },
                { path: "SubApplicantResume", element : <SubApplicantResume /> },
                { path: "SubCompanyDetails", element: <SubCompanyDetails /> },
                { path: "SubGuardAttendance", element: <SubGuardAttendance /> },
                { path: "SubGuardMessages", element: <SubGuardMessages /> },
                { path: "SubGuardSchedule", element: <SubGuardSchedule /> },
                { path: "SubGuardUpdates", element: <SubGuardUpdates /> },
                { path: "SubHiring", element: <SubHiring /> },
              ],
            },
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
