export function guardAuth() {
    const storedGuard = localStorage.getItem("guardData");
    const token = localStorage.getItem("guardToken");
    
    let guard = null;
    if (storedGuard) {
        try {
            guard = JSON.parse(storedGuard);
        } catch (error) {
            console.error("Error parsing guard data from localStorage:", error);
            // Clear invalid data
            localStorage.removeItem("guardData");
        }
    }
    
    return { guard, token };
}