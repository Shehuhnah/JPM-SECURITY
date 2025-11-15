// Fetch currently logged-in guard
export const guardAuth = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/auth/me", {
        method: "GET",
        credentials: "include", // 🔥 send httpOnly cookie automatically
      });
  
      if (!res.ok) return { guard: null };
  
      const data = await res.json();
      return { guard: data };
    } catch (err) {
      console.error("Error fetching logged-in guard:", err);
      return { guard: null };
    }
  };
  