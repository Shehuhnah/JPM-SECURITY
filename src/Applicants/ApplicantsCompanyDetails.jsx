import logo from "../assets/jpmlogo.png";

export default function ApplicantsCompanyDetails() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#0f172a] p-6">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-lg p-6 text-center">
        {/* Logo */}
        <img
          src={logo}           // Use the imported variable, not a string path
          alt="Company Logo"
          className="w-32 h-32 rounded-lg mx-auto mb-4"
        />


        {/* Company Info */}
        <h1 className="text-2xl font-bold text-gray-800 mb-2">JPM Security Agency</h1>
        <p className="text-gray-600 mb-1">Checkpoint, Purok 4, Brgy. Mataas na Lupa, Indang, Cavite, Indang, Philippines</p>
        <p className="text-gray-600 mb-1">📞 0917 144 6563</p>
        <p className="text-gray-600 mb-1">✉️ jpmsecagency@gmail.com</p>

        {/* Optional Description */}
        <p className="mt-4 text-gray-700 font-bold">
          Welcome to JPM Security Agency!
        </p>
      </div>
    </div>
  );
}
