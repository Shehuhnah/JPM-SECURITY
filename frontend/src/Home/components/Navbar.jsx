import { Link, NavLink, useLocation } from "react-router-dom";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { ChevronDown, Shield, ShieldUser } from "lucide-react";
import logo from "../assets/jpmlogo.png";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [portalOpen, setPortalOpen] = useState(false);
  const portalRef = useRef(null);
  const location = useLocation();

  const navItems = [
    { name: "Home", path: "/" },
    { name: "About Us", path: "/about-us" },
    { name: "Clients", path: "/clients" },
    { name: "Our Services", path: "/services" },
    { name: "Gallery", path: "/gallery" },
    { name: "Contact Us", path: "/contact-us" },
    { name: "Apply Now", path: "/job-application-process/applicants" },
  ];
  const portalItems = [
    { name: "Staff Portal", path: "/admin/login", icon: <ShieldUser size={16} /> },
    { name: "Guard Portal", path: "/guard/login", icon: <Shield size={16} /> },
  ];

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (portalRef.current && !portalRef.current.contains(event.target)) {
        setPortalOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  useLayoutEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    setIsOpen(false);
    setPortalOpen(false);
  }, [location.pathname]);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 w-full border-b border-slate-800/80 bg-[#0f172a]/95 text-white shadow-md backdrop-blur">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Navbar Container */}
        <div className="flex justify-between items-center h-24">
          <div className="flex justify-center items-center space-x-2">
              <img src={logo} alt="" className="size-14"/>
              <Link to="/" className="text-2xl font-bold uppercase">
                JPM Security
              </Link>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-6">
            {navItems.map((item) => (
              <NavLink
                key={item.name}
                to={item.path}
                className={({ isActive }) =>
                  `hover:text-blue-400 ${
                    isActive ? "text-blue-400 font-semibold" : ""
                  }`
                }
              >
                <p className="font-semibold uppercase">{item.name}</p>
              </NavLink>
            ))}
            <div className="relative" ref={portalRef}>
              <button
                type="button"
                onClick={() => setPortalOpen((prev) => !prev)}
                className="flex items-center gap-2 font-semibold uppercase transition hover:text-blue-400"
              >
                <span>Portals</span>
                <ChevronDown
                  size={16}
                  className={`transition-transform ${portalOpen ? "rotate-180" : ""}`}
                />
              </button>

              {portalOpen && (
                <div className="absolute right-0 mt-4 w-48 overflow-hidden rounded-xl border border-slate-700 bg-slate-900 shadow-2xl">
                  {portalItems.map((item) => (
                    <Link
                      key={item.name}
                      to={item.path}
                      onClick={() => setPortalOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 text-sm font-semibold uppercase tracking-wide text-slate-100 transition hover:bg-slate-800 hover:text-blue-400"
                    >
                      {item.icon}
                      {item.name}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden focus:outline-none"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              {isOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Dropdown */}
      {isOpen && (
        <div className="md:hidden bg-[#1e293b] px-4 py-3 space-y-2">
          {navItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              onClick={() => setIsOpen(false)}
              className={({ isActive }) =>
                `block py-1 hover:text-blue-400 ${
                  isActive ? "text-blue-400 font-semibold" : ""
                }`
              }
            >
              {item.name}
            </NavLink>
          ))}
          <div className="pt-2 border-t border-slate-700 space-y-2">
            {portalItems.map((item) => (
              <Link
                key={item.name}
                to={item.path}
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 py-1 font-semibold uppercase hover:text-blue-400"
              >
                {item.icon}
                {item.name}
              </Link>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
}
