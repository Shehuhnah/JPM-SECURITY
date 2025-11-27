import { useEffect } from "react";
import { Shield, Search, Cog, Users, Dog, Truck } from "lucide-react";

//assets
import Aboutbg from "../Home/assets/about-bg.jpg";
import Clientsbg from "../Home/assets/clients-bg.jpg";
import Contactbg from "../Home/assets/contact-bg.jpg";
import Homebg from "../Home/assets/home-bg.jpg";
import Img1 from "../Home/assets/img1.png"

export default function ServicesPage() {
  useEffect(() => {
    document.title = "Our Services | JPM Security Agency";
  }, []);

  const services = [
    {
      icon: Shield,
      title: "Security & Protection Services",
      description:
        "We provide professional protection across diverse sectors — from residential communities to high-value commercial and government facilities. Our guards are trained, equipped, and disciplined to ensure safety, vigilance, and reliability at all times.",
      highlights: [
        "Commercial establishments and business buildings",
        "Residential subdivisions and private properties",
        "Banks, malls, hotels, and industrial complexes",
        "Construction sites, ports, and airports",
        "K9-assisted patrol and protection",
      ],
      bg: Aboutbg, // 🔹 replace this placeholder
    },
    {
      icon: Search,
      title: "Investigation Services",
      description:
        "Our investigative division provides confidential and results-driven intelligence for private, commercial, and institutional clients — ensuring factual and unbiased reports to support decision-making.",
      highlights: [
        "Personnel background verification",
        "Surveillance and administrative investigations",
        "Scene-of-crime assistance (free for clients)",
        "Fingerprinting, lie detector, paraffin, and ballistics support",
      ],
      bg: Clientsbg, // 🔹 replace this placeholder
    },
    {
      icon: Cog,
      title: "Security Equipment Provision",
      description:
        "We supply high-quality security equipment and tactical gear for all operations, ensuring that every post and personnel is fully equipped to perform efficiently and safely.",
      highlights: [
        "Firearms, radios, metal detectors, and flashlights",
        "Protective vests, nightsticks, and rain gear",
        "Time-synced watches and mobility vehicles",
        "Custom tactical gear based on client requirements",
      ],
      bg: Contactbg, // 🔹 replace this placeholder
    },
    {
      icon: Users,
      title: "In-House Training & Development",
      description:
        "We continuously invest in the professional growth of our personnel. Regular seminars and on-ground training ensure our guards uphold the agency’s standards of excellence and discipline.",
      highlights: [
        "Firearms proficiency and first aid training",
        "Fire prevention and emergency response drills",
        "Incident documentation and communication protocols",
        "Personality and leadership development",
      ],
      bg: Homebg, // 🔹 replace this placeholder
    },
    {
      icon: Dog,
      title: "K9 Tactical Security",
      description:
        "Through partnerships with certified K9 training centers, we provide highly trained dogs and handlers specialized in detection, patrol, and asset protection.",
      highlights: [
        "Explosive and narcotics detection units",
        "Patrol and protective operations",
        "Handler certification and field deployment",
      ],
      bg: Clientsbg, // 🔹 replace this placeholder
    },
    {
      icon: Truck,
      title: "Vehicle & Emergency Response",
      description:
        "JPM Security Agency is equipped with mobile patrol units and emergency response teams to ensure immediate action in critical situations.",
      highlights: [
        "Quick response patrol units and vehicles",
        "Emergency medical support and coordination",
        "Liaison with law enforcement and disaster response teams",
      ],
      bg: Aboutbg, // 🔹 replace this placeholder
    },
  ];

  return (
    <div className="text-gray-100">
      {/* Solid Header Section */}
      <header className="bg-[#0b0f1a] py-20 text-center px-6 border-b border-blue-500/30 shadow-lg">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold text-white mb-3">
            Our Professional Services
          </h1>
          <p className="text-gray-400">
            Comprehensive, dependable, and client-centered — our services are built 
            on discipline, vigilance, and excellence.
          </p>
        </div>
      </header>

      {/* Service Sections */}
      {services.map((service, index) => {
        const Icon = service.icon;
        const isEven = index % 2 === 0;

        return (
          <section
            key={index}
            className="relative min-h-[70vh] flex flex-col md:flex-row items-center justify-center px-6 py-20"
            style={{
              backgroundImage: `url(${service.bg})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          >
            {/* Overlay */}
            <div className="absolute inset-0 bg-black/70"></div>

            {/* Content */}
            <div
              className={`relative z-10 max-w-6xl w-full flex flex-col md:flex-row items-center justify-between gap-10 ${
                isEven ? "" : "md:flex-row-reverse"
              }`}
            >
              {/* Icon & Description */}
              <div className="md:w-1/2 text-center md:text-left">
                <div className="inline-block bg-blue-500/20 p-5 rounded-full border border-blue-400 mb-6">
                  <Icon className="w-10 h-10 text-blue-400" />
                </div>
                <h2 className="text-3xl font-semibold text-white mb-4">
                  {service.title}
                </h2>
                <p className="text-gray-300 leading-relaxed text-sm md:text-base">
                  {service.description}
                </p>
              </div>

              {/* Highlights */}
              <div className="md:w-1/2 bg-[#1e293b]/70 backdrop-blur-md border border-gray-700 rounded-2xl shadow-lg p-8">
                <h3 className="text-lg font-semibold text-blue-400 mb-4">
                  Key Highlights
                </h3>
                <ul className="space-y-2 text-gray-300 text-sm list-disc list-inside">
                  {service.highlights.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>
          </section>
        );
      })}

      {/* Closing Section */}
      <div className="bg-[#0f172a] py-16 text-center px-6 border-t border-gray-800">
        <p className="text-gray-400 max-w-3xl mx-auto text-sm font-semibold">
          <span className="text-blue-400 font-semibold">JPM Security Agency</span> — 
          delivering trusted security, discipline, and professionalism to every client we serve.
        </p>
      </div>
    </div>
  );
}
