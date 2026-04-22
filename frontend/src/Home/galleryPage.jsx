import { useEffect, useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination, Autoplay } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";

const api = import.meta.env.VITE_API_URL;

export default function GalleryPage() {
  const [remoteImages, setRemoteImages] = useState([]);

  useEffect(() => {
    document.title = "Gallery | JPM Security Agency";

    const fetchGallery = async () => {
      try {
        const response = await fetch(`${api}/api/gallery`);
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || "Failed to load gallery.");
        setRemoteImages(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Gallery fetch error:", error);
        setRemoteImages([]);
      }
    };

    fetchGallery();
  }, []);

  const images = remoteImages.map((item) => item.imageUrl).filter(Boolean);
  const chunked = [];

  for (let i = 0; i < images.length; i += 6) {
    chunked.push(images.slice(i, i + 6));
  }

  return (
    <div className="bg-[#0f172a] text-gray-100 min-h-screen flex flex-col">
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

      <section className="flex-grow py-16 bg-[#111827] relative">
        <div className="max-w-7xl mx-auto px-6">
          {chunked.length === 0 ? (
            <div className="min-h-[50vh] rounded-2xl border border-dashed border-slate-700 bg-slate-900/50 flex flex-col items-center justify-center text-center px-6">
              <p className="text-xl font-semibold text-white">No gallery images yet</p>
              <p className="text-sm text-slate-400 mt-2">Uploaded images from the admin gallery manager will appear here.</p>
            </div>
          ) : (
            <Swiper
              modules={[Navigation, Pagination, Autoplay]}
              spaceBetween={0}
              slidesPerView={1}
              navigation
              pagination={{ clickable: true }}
              autoplay={{ delay: 4500, disableOnInteraction: false }}
              loop={chunked.length > 1}
              className="rounded-2xl overflow-hidden shadow-[0_0_40px_rgba(0,0,0,0.4)]"
            >
              {chunked.map((group, index) => (
                <SwiperSlide key={index}>
                  <div className="grid grid-cols-3 md:grid-cols-4 gap-0 h-[80vh] auto-rows-[minmax(100px,_1fr)]">
                    {group.map((img, i) => (
                      <div
                        key={`${index}-${i}`}
                        className={`relative overflow-hidden border-0 group
                          ${i % 6 === 0 ? "col-span-2 row-span-2" : ""}
                          ${i % 6 === 3 ? "col-span-1 row-span-2" : ""}
                        `}
                      >
                        <img
                          src={img}
                          alt={`Gallery ${index * 6 + i + 1}`}
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
          )}
        </div>
      </section>

      <footer className="bg-[#10263a] py-8 text-center border-t border-blue-900/40">
        <p className="text-gray-400 text-sm">
          Copyright {new Date().getFullYear()} JPM Security Agency - Upholding Safety, Discipline, and Integrity.
        </p>
      </footer>
    </div>
  );
}
