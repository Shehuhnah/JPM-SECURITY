export function useAuth() {
  const storedAdmin = localStorage.getItem("adminData");
  const admin = storedAdmin ? JSON.parse(storedAdmin) : null;
  const token = localStorage.getItem("adminToken");
  return { admin, token };
}
