import { Outlet } from "react-router-dom";
import Navbar from "../Home/components/Navbar.jsx";
import Footer from "../Home/components/Footer.jsx";

export default function HomeLayout() {
    
    return (
        <>
            <div className="min-h-screen bg-[#0f172a]">
                <nav className="h-24">
                    <Navbar/>
                </nav>
                <main className="">
                    <Outlet/>
                </main>
                <footer>
                    <Footer/>
                </footer>
            </div>
        </>
    )
}
