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
            Your trusted partner in protection, vigilance, and peace of mind.
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
                  We uphold the highest standards of honesty, discipline, and ethical conduct in every aspect of our service.
                </p>
              </div>

              <div className="bg-white/10 backdrop-blur-md p-6 rounded-xl shadow-lg border border-white/10 hover:shadow-blue-800/30 hover:scale-105 transition duration-300">
                <Users className="w-10 h-10 mx-auto text-blue-400 mb-3" />
                <h3 className="text-xl font-semibold mb-2">Commitment</h3>
                <p className="text-gray-200 text-sm">
                  We go beyond expectations, ensuring every client receives unparalleled dedication and security support.
                </p>
              </div>

              <div className="bg-white/10 backdrop-blur-md p-6 rounded-xl shadow-lg border border-white/10 hover:shadow-blue-800/30 hover:scale-105 transition duration-300">
                <Award className="w-10 h-10 mx-auto text-blue-400 mb-3" />
                <h3 className="text-xl font-semibold mb-2">Excellence</h3>
                <p className="text-gray-200 text-sm">
                  We strive for continuous improvement, adopting advanced techniques and technologies to enhance service quality.
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
                  <span className="font-semibold text-blue-400">JPM Security Agency</span> is a professional security provider based in Cavite, Philippines.
                  With years of experience in safeguarding people, property, and businesses, we have built a reputation for reliability, discipline,
                  and integrity. Our highly trained security personnel are committed to ensuring every client experiences safety and peace of mind.
                </p>

                <div className="mt-6">
                  <p className="text-sm text-gray-400">
                    📍 Checkpoint, Purok 4, Brgy. Mataas na Lupa, Indang, Cavite
                  </p>
                  <p className="text-sm text-gray-400">
                    📞 0917 144 6563 | ✉️ jpmsecagency@gmail.com
                  </p>
                </div>
              </div>

              <div className="bg-white/10 backdrop-blur-md p-8 rounded-2xl shadow-lg border border-white/10">
                <h3 className="text-2xl font-semibold mb-4 text-blue-400">
                  Our Mission
                </h3>
                <p className="text-gray-200 leading-relaxed text-justify mb-6">
                  To deliver dependable, client-focused, and innovative security solutions that ensure safety and peace of mind — protecting people, assets,
                  and communities with professionalism and care.
                </p>

                <h3 className="text-2xl font-semibold mb-4 text-blue-400">
                  Our Vision
                </h3>
                <p className="text-gray-200 leading-relaxed text-justify">
                  To be recognized as the most trusted and respected security agency in the Philippines — a symbol of integrity, excellence, and commitment.
                </p>
              </div>
            </div>
          </section>

          
        </div>

      {/* Closing Section */}
      <section className="text-center py-12 bg-[#456882] border-t border-gray-700">
        <h3 className="text-lg font-semibold text-white italic">
          “Your safety is our priority.”
        </h3>
        <p className="text-gray-400 text-sm mt-2">
          — The JPM Security Agency Team
        </p>
      </section>
    </div>
  );
}
