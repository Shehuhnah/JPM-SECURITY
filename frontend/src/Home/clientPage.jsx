import { useEffect } from "react";
import { Building2, ShieldCheck, UtensilsCrossed, Briefcase, GraduationCap, Home,  } from "lucide-react";
import bg from "../Home/assets/clients-bg.jpg";

export default function ClientPage() {
  useEffect(() => {
    document.title = "Clients | JPM Security Agency";
  }, []);

  const clientCategories = [
    { title: "Retail, Food & Hospitality", icon: UtensilsCrossed },
    { title: "Institutions & Essential Services", icon: GraduationCap },
    { title: "Corporate & Commercial Offices", icon: Briefcase },
    { title: "Industrial, Logistics & Manufacturing", icon: Building2 },
    { title: " Residential & Property Sites", icon: Home },
  ];

  return (
    <div
      className="relative min-h-screen flex items-center justify-center bg-fixed bg-center bg-cover px-6 py-20"
      style={{ backgroundImage: `url(${bg})` }}
    >
      {/* Overlay for opacity */}
      <div className="absolute inset-0 bg-black/70 bg-opacity-70"></div>

      {/* Main Content */}
      <div className="relative max-w-6xl mx-auto text-center text-gray-100">
        {/* Header */}
        <div className="mb-16">
          <ShieldCheck className="w-14 h-14 text-blue-400 mx-auto mb-4" />
          <h1 className="text-4xl font-bold text-white mb-3">
            Our Valued Clients
          </h1>
          <p className="text-gray-400 max-w-2xl mx-auto text-sm">
            We take pride in providing trusted protection and professional security 
            services across diverse sectors — from government institutions to 
            residential communities.
          </p>
        </div>

        {/* Category Grid */}
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-8 justify-center">
          {clientCategories.map((category, index) => {
            const Icon = category.icon;
            return (
              <div
                key={index}
                className="bg-[#1e293b]/80 backdrop-blur-lg p-8 rounded-2xl shadow-lg border border-gray-700 
                           hover:shadow-blue-800/30 hover:scale-105 transition transform hover:bg-yellow-500"
              >
                <Icon className="w-10 h-10 text-blue-400 mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-white">
                  {category.title}
                </h2>
              </div>
            );
          })}
        </div>

        {/* Footer Message */}
        <div className="mt-20 text-gray-400 text-sm">
          <p>
            Partner with{" "}
            <span className="text-blue-400 font-semibold">
              JPM Security Agency
            </span>{" "}
            — your trusted ally in safety and protection.
          </p>
        </div>
      </div>
    </div>
  );
}
