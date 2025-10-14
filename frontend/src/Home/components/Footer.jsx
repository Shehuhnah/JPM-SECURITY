import { Link, useLocation } from "react-router-dom";
import { Mail, Phone, MapPin } from "lucide-react";

const navItems = [
  { name: "Home", path: "/" },
  { name: "About Us", path: "/about-us" },
  { name: "Clients", path: "/clients" },
  { name: "Services", path: "/services" },
  { name: "Gallery", path: "/gallery" },
  { name: "Contact Us", path: "/contact-us" },
];

export default function Footer() {
  const location = useLocation();

  return (
    <footer className="bg-[#03060c] text-gray-300 py-12 border-t border-gray-700">
      <div className="max-w-7xl mx-auto px-6">
        {/* Top Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-8">
          {/* Company Info */}
          <div>
            <h2 className="text-2xl font-bold text-white mb-3">
              JPM Security Agency
            </h2>
            <p className="text-sm text-gray-400 leading-relaxed">
              Providing trusted and professional security services across
              Cavite and beyond. Your safety is our top priority.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">
              Quick Links
            </h3>
            <ul className="space-y-2">
              {navItems.map((item) => (
                <li key={item.name}>
                  <Link
                    to={item.path}
                    className={`text-sm hover:text-white transition-colors ${
                      location.pathname === item.path
                        ? "text-white underline"
                        : "text-gray-400"
                    }`}
                  >
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">
              Contact Us
            </h3>
            <ul className="space-y-3 text-sm text-gray-400">
              <li className="flex items-start gap-2">
                <MapPin size={16} className="text-gray-400 mt-[2px]" />
                <span>123 Security St., Dasmariñas, Cavite, Philippines</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone size={16} className="text-gray-400" />
                <span>+63 912 345 6789</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail size={16} className="text-gray-400" />
                <span>info@jpmsecurity.com</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-700 my-6"></div>

        {/* Bottom Section */}
        <div className="flex flex-col sm:flex-row justify-between items-center text-sm text-gray-500">
          <p>
            © {new Date().getFullYear()} JPM Security Agency. All rights
            reserved.
          </p>
          <p className="mt-2 sm:mt-0">
            Designed & Developed by{" "}
            <span className="text-white font-medium hover:text-blue-400 transition">
              JPM Dev Team
            </span>
          </p>
        </div>
      </div>
    </footer>
  );
}
