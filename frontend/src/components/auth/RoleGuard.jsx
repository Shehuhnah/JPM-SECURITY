import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";

const normalizePath = (path) => {
  if (!path) return "/";
  return path.toLowerCase();
};

export default function RoleGuard({
  allowedRoles = [],
  loginRedirect,
  forbiddenRedirect,
  children,
}) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return null;

  if (!user) {
    return <Navigate to={loginRedirect} replace state={{ from: location }} />;
  }

  if (!allowedRoles.includes(user.role)) {
    const fallbackPath =
      forbiddenRedirect ||
      (normalizePath(location.pathname).startsWith("/guard") ? "/admin" : "/guard/announcements");

    return <Navigate to={fallbackPath} replace />;
  }

  return children || <Outlet />;
}
