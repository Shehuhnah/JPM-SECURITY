import { Outlet } from "react-router-dom";
import Navbar from "../Home/components/Navbar.jsx";
import Footer from "../Home/components/Footer.jsx";

export default function HomeLayout() {
    
    return (
        <>
            <div className="">
                <nav>
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