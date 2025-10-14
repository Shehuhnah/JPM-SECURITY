import bg from "./assets/home-bg.jpg"; // or correct path
import AboutUs from "./aboutUsPage.jsx";
export default function HomePage() {
  return (
    <>
    <section
      className="relative min-h-screen flex items-center justify-center bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: `url(${bg})` }}
    >
      {/* ✅ Overlay - has z-index lower than content */}
      <div className="absolute inset-0 bg-black/60 z-0"></div>

      {/* ✅ Content - appears above overlay */}
      <div className="relative z-10 text-center text-white px-6">
        <h1 className="text-4xl md:text-6xl font-bold mb-4 drop-shadow-lg">
          Welcome to JPM Security Agency
        </h1>
        <p className="text-lg md:text-xl mb-8 text-gray-200 max-w-2xl mx-auto">
          Providing trusted, professional, and reliable security services for our clients.
        </p>
        <button className="bg-yellow-600 hover:bg-yellow-900 px-6 py-3 rounded-lg text-white font-semibold transition">
          Learn More
        </button>
      </div>
      
    </section>

    <AboutUs />
    </>
  );
}
