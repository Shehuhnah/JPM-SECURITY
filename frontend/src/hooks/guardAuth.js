export function guardAuth() {
    const storedGuard = localStorage.getItem("guardData");
    const guard = storedGuard ? JSON.parse(storedGuard) : null;
    const token = localStorage.getItem("guardToken");
    return {guard, token};
}