import { useEffect } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination, Autoplay } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";

// Assets
import Aboutbg from "../Home/assets/about-bg.jpg";
import Clientsbg from "../Home/assets/clients-bg.jpg";
import Contactbg from "../Home/assets/contact-bg.jpg";
import Homebg from "../Home/assets/home-bg.jpg";

export default function GalleryPage() {
  useEffect(() => {
    document.title = "Gallery | JPM Security Agency";
  }, []);

  const images = [
    Homebg, Aboutbg, Clientsbg, Contactbg, ,
    Homebg, Aboutbg, Homebg, Clientsbg, Contactbg,
    , Homebg, Aboutbg, Clientsbg, Contactbg, ,
  ];

  // Split images into collage groups
  const chunked = [];
  for (let i = 0; i < images.length; i += 6) {
    chunked.push(images.slice(i, i + 6));
  }

  return (
    <div className="bg-[#0f172a] text-gray-100 min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-[#10263a] py-20 text-center px-6 border-b border-blue-500/40 shadow-lg">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold text-white tracking-wide mb-4">
            Our Gallery
          </h1>
          <p className="text-gray-300 text-base md:text-lg leading-relaxed">
            A look into the discipline, professionalism, and operations of our dedicated personnel.
          </p>
          <div className="mt-6 flex justify-center">
            <div className="w-24 h-1 bg-blue-500 rounded-full"></div>
          </div>
        </div>
      </header>

      {/* Masonry Collage Carousel */}
      <section className="flex-grow py-16 bg-[#111827] relative">
        <div className="max-w-7xl mx-auto px-6">
          <Swiper
            modules={[Navigation, Pagination, Autoplay]}
            spaceBetween={0}
            slidesPerView={1}
            navigation
            pagination={{ clickable: true }}
            autoplay={{ delay: 4500, disableOnInteraction: false }}
            loop
            className="rounded-2xl overflow-hidden shadow-[0_0_40px_rgba(0,0,0,0.4)]"
          >
            {chunked.map((group, index) => (
              <SwiperSlide key={index}>
                {/* Grid with NO GAPS */}
                <div className="grid grid-cols-3 md:grid-cols-4 gap-0 h-[80vh] auto-rows-[minmax(100px,_1fr)]">
                  {group.map((img, i) => (
                    <div
                      key={i}
                      className={`relative overflow-hidden border-0 group
                        ${i % 6 === 0 ? "col-span-2 row-span-2" : ""}
                        ${i % 6 === 3 ? "col-span-1 row-span-2" : ""}
                      `}
                    >
                      <img
                        src={img}
                        alt={`Gallery ${i}`}
                        className="object-cover w-full h-full transform group-hover:scale-110 transition duration-700"
                      />
                      <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                        <p className="text-xs text-white bg-black/40 px-3 py-1 rounded-md">
                          JPM Security Agency
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#10263a] py-8 text-center border-t border-blue-900/40">
        <p className="text-gray-400 text-sm">
          © {new Date().getFullYear()} JPM Security Agency — Upholding Safety, Discipline, and Integrity.
        </p>
      </footer>
    </div>
  );
}
