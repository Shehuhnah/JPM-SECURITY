import { useEffect } from "react";
import { ShieldCheck, Users, Award } from "lucide-react";
import logo from "../assets/jpmlogo.png";
import bg from "../Home/assets/about-bg.jpg";

export default function AboutUsPage() {

  useEffect(() => {
    document.title = "About Us | JPM Security Agency";
  }, []);

  return (
    <div className="bg-[#152430] text-gray-100">
      {/* Hero Section */}
      <section className="">
        <div className="relative max-w-6xl mx-auto px-6 py-24 text-center">
          <img src={logo} alt="JPM Logo" className="w-28 h-28 mx-auto mb-6 rounded-lg shadow-lg" />
          <h1 className="text-4xl font-extrabold text-white mb-3">JPM Security Agency</h1>
          <p className="text-gray-300 max-w-2xl mx-auto">
            "Prepared with Discipline. Professional with EveryDetail. Protected Without Compromise."
          </p>
        </div>
      </section>

      <div className="relative bg-cover bg-center bg-no-repeat text-white" style={{ backgroundImage: `url(${bg})` }}>
        {/* Dark Overlay */}
        <div className="absolute inset-0 bg-black/70 bg-opacity-70"></div>

        {/* Core Values Section */}
        <section className="py-16">
          <div className="max-w-6xl mx-auto px-6 text-center">
            <h2 className="text-3xl font-bold mb-10 text-white relative">
              Our Core Values
            </h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="bg-white/10 backdrop-blur-md p-6 rounded-xl shadow-lg border border-white/10 hover:shadow-blue-800/30 hover:scale-105 transition duration-300">
                <ShieldCheck className="w-10 h-10 mx-auto text-blue-400 mb-3" />
                <h3 className="text-xl font-semibold mb-2">Integrity</h3>
                <p className="text-gray-200 text-sm">
                  Upholding honesty and strong moral principles in every action and decision.
                </p>
              </div>

              <div className="bg-white/10 backdrop-blur-md p-6 rounded-xl shadow-lg border border-white/10 hover:shadow-blue-800/30 hover:scale-105 transition duration-300">
                <Users className="w-10 h-10 mx-auto text-blue-400 mb-3" />
                <h3 className="text-xl font-semibold mb-2">Professionalism</h3>
                <p className="text-gray-200 text-sm">
                 Delivering services with excellence, discipline, and respect in all situations.
                </p>
              </div>

              <div className="bg-white/10 backdrop-blur-md p-6 rounded-xl shadow-lg border border-white/10 hover:shadow-blue-800/30 hover:scale-105 transition duration-300">
                <Award className="w-10 h-10 mx-auto text-blue-400 mb-3" />
                <h3 className="text-xl font-semibold mb-2">Reliability</h3>
                <p className="text-gray-200 text-sm">
                  Being dependable and consistent in providing security and protection at all times.
                </p>
              </div>
              <div className="bg-white/10 backdrop-blur-md p-6 rounded-xl shadow-lg border border-white/10 hover:shadow-blue-800/30 hover:scale-105 transition duration-300">
                <Award className="w-10 h-10 mx-auto text-blue-400 mb-3" />
                <h3 className="text-xl font-semibold mb-2">Vigilance</h3>
                <p className="text-gray-200 text-sm">
                  Staying alert, attentive, and proactive in identifying and mitigating potential threats.
                </p>
              </div>
              <div className="bg-white/10 backdrop-blur-md p-6 rounded-xl shadow-lg border border-white/10 hover:shadow-blue-800/30 hover:scale-105 transition duration-300">
                <Award className="w-10 h-10 mx-auto text-blue-400 mb-3" />
                <h3 className="text-xl font-semibold mb-2">Teamwork</h3>
                <p className="text-gray-200 text-sm">
                  Fostering collaboration and communication to ensure cohesive and effective security operations
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
      
      {/* Content Wrapper */}
        <div className="relative z-10">
          {/* About Section */}
          <section className="max-w-6xl mx-auto px-6 py-16">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl font-bold mb-4 border-l-4 border-blue-500 pl-3">
                  Who We Are
                </h2>
                <p className="text-gray-200 leading-relaxed text-justify">
                  <span className=" text-white">
                    <strong>JPM SECURITY AGENCY CORP. (JPMSA) </strong> is duly established Security Management Operating by the virtue of Republic Act 11917, otherwise known as "The Private Security Services Industry Act. " , with SEC REG. NO. 2025020187022-03, with its office address; Checkpoint, Purok 4, Brgy. Mataas na Lupa, Indang, Cavite 4122. As mandated by laws, JPMSA has sufficient personnel, equipment and necessary assets to support its operation, consequent obligation and responsibility as Security Agency.
                    </span>
                </p>
                <div className="mt-6">
                  <p className="text-sm text-gray-300">
                    📍<strong>Main Office: </strong>Checkpoint, Purok 4, Brgy. Mataas na Lupa, Indang, Cavite 4122
                  </p>
                  <p className="text-sm text-gray-300">
                    📍<strong>Sattelite Office: </strong>RGDM Bldg., Brgy.Galicia2, Mendez-Nunez, Cavite 4121
                  </p>
                  <p className="text-sm text-gray-300">
                    📞 09368835488 / 09923728671 
                  </p>
                  <p className="text-sm text-gray-300">
                    📩 jpmsecagency@gmail.com
                  </p>
                </div>
              </div>

              <div className="bg-white/10 backdrop-blur-md p-8 rounded-2xl shadow-lg border border-white/10">
                <h3 className="text-2xl font-semibold mb-4 text-blue-400">
                  Our Mission
                </h3>
                <p className="text-gray-200 leading-relaxed text-justify mb-6">
                  Our mission is to protect our clients with a team of seasoned professionals by providing dependable protection with professionalism and ethics. It is to be the reliable option for people and companies in need of protection.

                </p>

                <h3 className="text-2xl font-semibold mb-4 text-blue-400">
                  Our Vision
                </h3>
                <p className="text-gray-200 leading-relaxed text-justify">
                  Our vision is to become the leading provider of precise security solutions, ensuring client safety. We aim to set industry standards through innovative methods and continuously pursue excellence and growth in all our services.

                </p>
              </div>
            </div>
          </section>

          
        </div>

      {/* Closing Section */}
      <section className="text-center py-12 bg-[#456882] border-t border-gray-700">
        <h3 className="text-lg font-semibold text-white italic">
          "PREPARED. PROFESSIONAL. PROTECTED"
        </h3>
        <p className="text-gray-400 text-sm mt-2">
          — The JPM Security Agency Team
        </p>
      </section>
    </div>
  );
}
