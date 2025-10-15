import { useEffect } from "react";
import logo from "../assets/jpmlogo.png";
import bg from "../Home/assets/contact-bg.jpg"; // Replace with your actual background image

export default function ContactUsPage() {

    useEffect(() => {
        document.title = "Contact Us | JPM Security Agency";
    }, []);

  return (
    <div
      className="relative min-h-screen bg-[#0f172a] text-white flex flex-col items-center justify-center"
      style={{
        backgroundImage: `url(${bg})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm"></div>

      {/* Content Wrapper */}
      <div className="relative z-10 w-full max-w-6xl px-6 py-20">
        {/* Title */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-white">
            Get In Touch
          </h1>
          <p className="text-gray-300 max-w-2xl mx-auto">
            We value every inquiry and are ready to provide reliable assistance for your security needs. 
            Reach out today and we’ll respond promptly.
          </p>
        </div>

        {/* Contact Section */}
            <div className="grid lg:grid-cols-2 gap-10 items-stretch">
            {/* Contact Info Panel */}
            <div className="relative bg-gradient-to-b from-[#1e293b]/90 to-[#0f172a]/90 p-10 rounded-2xl shadow-2xl border border-gray-700 hover:scale-[1.01] transition-transform duration-300">
                <div className="flex flex-col items-center mb-10 text-center">
                <img
                    src={logo}
                    alt="JPM Security Agency Logo"
                    className="w-24 h-24 rounded-lg mb-4 shadow-md"
                />
                <h2 className="text-2xl font-bold text-white tracking-wide">
                    JPM Security Agency
                </h2>
                <p className="text-gray-400 text-sm italic mt-1">
                    “Your trusted partner in protection and peace of mind.”
                </p>
                </div>

                {/* Info List */}
                <div className="space-y-6 text-gray-300 text-sm">
                <div className="flex items-start gap-3">
                    <span className="text-blue-400 text-lg">📍</span>
                    <p>
                    <span className="block font-semibold text-white">Address</span>
                      <strong>Main Office: </strong>Checkpoint, Purok 4, Brgy. Mataas na Lupa, Indang, Cavite 4122<br/>
                      <strong>Sattelite Office: </strong>RGDM Bldg., Brgy.Galicia2, Mendez-Nunez, Cavite 4121
                    </p>
                </div>

                <div className="flex items-start gap-3">
                    <span className="text-blue-400 text-lg">📞</span>
                    <p>
                    <span className="block font-semibold text-white">Phone</span>
                    09368835488 / 09923728671 
                    </p>
                </div>

                <div className="flex items-start gap-3">
                    <span className="text-blue-400 text-lg">✉️</span>
                    <p>
                    <span className="block font-semibold text-white">Email</span>
                    jpmsecagency@gmail.com
                    </p>
                </div>

                <div className="flex items-start gap-3">
                    <span className="text-blue-400 text-lg">🕓</span>
                    <p>
                    <span className="block font-semibold text-white">Office Hours</span>
                    Monday – Saturday, 8:00 AM – 5:00 PM
                    </p>
                </div>
                </div>

                {/* Decorative Line */}
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-2/3 h-[2px] bg-gradient-to-r from-transparent via-blue-500 to-transparent mt-10"></div>
            </div>

            {/* Contact Form Panel */}
            <div className="bg-[#1e293b]/90 backdrop-blur-md p-10 rounded-2xl shadow-2xl border border-gray-700 hover:scale-[1.01] transition-transform duration-300">
                <h2 className="text-3xl font-bold text-white mb-6 text-center">Send Us a Message</h2>
                <form className="space-y-5">
                <div className="grid md:grid-cols-2 gap-4">
                    <input
                    type="text"
                    placeholder="Full Name"
                    className="w-full p-3 rounded-md bg-[#111827] border border-gray-700 text-gray-200 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    required
                    />
                    <input
                    type="email"
                    placeholder="Email Address"
                    className="w-full p-3 rounded-md bg-[#111827] border border-gray-700 text-gray-200 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    required
                    />
                </div>

                <input
                    type="text"
                    placeholder="Subject"
                    className="w-full p-3 rounded-md bg-[#111827] border border-gray-700 text-gray-200 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />

                <textarea
                    placeholder="Your Message"
                    rows="5"
                    className="w-full p-3 rounded-md bg-[#111827] border border-gray-700 text-gray-200 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    required
                ></textarea>

                <button
                    type="submit"
                    className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-md transition duration-200"
                >
                    Submit Message
                </button>
                </form>
            </div>
            </div>


        {/* Google Map */}
        <div className="mt-16 rounded-2xl overflow-hidden shadow-lg border border-gray-700">
          <iframe
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3867.1742614066684!2d120.87652947573699!3d14.243054685729085!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x65fbc0d56d1dbb83%3A0x95347c44e07e073e!2sJPM%20Security%20Agency%20Corp.!5e0!3m2!1sen!2sph!4v1760460952437!5m2!1sen!2sph"
            width="100%"
            height="400"
            style={{ border: 0 }}
            allowFullScreen=""
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          ></iframe>
        </div>
      </div>
    </div>
  );
}
