import { useState, useEffect } from "react";
import {
  ShieldUser,
  Mail,
  Phone,
  MapPin,
  Clock,
  BadgeCheck,
  Pencil,
  Eye,
  EyeOff,
  Lock,
} from "lucide-react";
import { guardAuth } from "../hooks/guardAuth";

export default function GuardProfile() {
  const { guardData, token } = guardAuth();
  console.log(token)

  const [isEditing, setIsEditing] = useState(false);

  // Separate visibility states for each password field
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [guard, setGuard] = useState({
    fullName: "",
    guardId: "",
    email: "",
    phoneNumber: "",
    address: "",
    dutyStation: "",
    shift: "",
    position: "",
    currentPassword: "",
    newpassword: "",
    confirmNewPassword: "",
  });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch("http://localhost:5000/api/guards/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const result = await res.json();
        if (result.success) setGuard((prev) => ({ ...prev, ...result.data }));
      } catch (error) {
        console.error("Error fetching profile:", error);
      }
    };
    fetchProfile();
  }, [token]);

    console.log("guard", guard)


  const handleSave = async () => {

    if (guard.newpassword !== guard.confirmNewPassword) {
      alert("⚠️ Passwords do not match!");
      return;
    }

    if (guard.newpassword.length < 8){
      alert("⚠️ Passwords must be atleast 8 Characters!");
      return;
    }

    const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

    if (!strongPasswordRegex.test(guard.newpassword)) {
      alert("⚠️ Passwords must special characters, uppercase and lowercase, and number!");
      return;
    }


    try {
      const res = await fetch("http://localhost:5000/api/guards/update-guard-profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          fullName: guard.fullName,
          address: guard.address,
          phoneNumber: guard.phoneNumber,
          currentPassword: guard.currentPassword,
          newPassword: guard.newpassword || undefined,
        }),
      });

      const result = await res.json();
      if (result.success) {
        alert("✅ Profile updated successfully!");
        setIsEditing(false);
        setGuard((prev) => ({
          ...prev,
          currentPassword: "",
          newpassword: "",
          confirmNewPassword: "",
        }));
      } else {
        alert(result.message || "Failed to update profile.");
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      alert("❌ Server error updating profile.");
    }
  };

  // ✅ Handle Input Change
  const handleChange = (e) => {
    setGuard({ ...guard, [e.target.name]: e.target.value });
  };

  return (
    <section className="min-h-screen bg-[#0f172a] text-gray-100 px-4 py-10 flex justify-center">
      <div className="w-full max-w-3xl bg-[#1e293b]/90 border border-gray-700 rounded-2xl shadow-2xl p-6 sm:p-8 backdrop-blur-md space-y-6">
        {/* Header */}
        <div className="text-center border-b border-gray-700 pb-6">
          <div className="mx-auto mb-4 w-24 h-24 bg-[#0f172a] flex items-center justify-center rounded-full border border-gray-600">
            <ShieldUser size={50} className="text-blue-400" />
          </div>
          <h2 className="text-2xl font-bold text-white">{guard.fullName}</h2>
          <p className="text-gray-400 text-sm">{guard.position}</p>
          <p className="text-blue-400 text-xs font-mono mt-1">
            ID: {guard.guardId}
          </p>
        </div>

        {/* Editable Info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <ProfileField
            icon={<Mail className="text-blue-400 w-5 h-5" />}
            label="Email"
            name="email"
            value={guard.email}
            editable={false}
          />
          <ProfileField
            icon={<Phone className="text-blue-400 w-5 h-5" />}
            label="Phone Number"
            name="phoneNumber"
            value={guard.phoneNumber}
            editable={isEditing}
            onChange={handleChange}
          />
          <ProfileField
            icon={<MapPin className="text-blue-400 w-5 h-5" />}
            label="Address"
            name="address"
            value={guard.address}
            editable={isEditing}
            onChange={handleChange}
          />
          <ProfileField
            icon={<BadgeCheck className="text-blue-400 w-5 h-5" />}
            label="Duty Station"
            value={guard.dutyStation}
            editable={false}
          />
          <ProfileField
            icon={<Clock className="text-blue-400 w-5 h-5" />}
            label="Shift"
            value={guard.shift}
            editable={false}
          />
        </div>

        {/* Password Fields */}
        {isEditing && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <PasswordField
              label="Current Password"
              name="currentPassword"
              value={guard.currentPassword}
              onChange={handleChange}
              show={showCurrent}
              setShow={setShowCurrent}
            />
            <PasswordField
              label="New Password"
              name="newpassword"
              value={guard.newpassword}
              onChange={handleChange}
              show={showNew}
              setShow={setShowNew}
            />
            <PasswordField
              label="Confirm Password"
              name="confirmNewPassword"
              value={guard.confirmNewPassword}
              onChange={handleChange}
              show={showConfirm}
              setShow={setShowConfirm}
            />
          </div>
        )}

        {/* Buttons */}
        <div className="flex justify-end mt-8">
          {isEditing ? (
            <>
              <button
                onClick={() => setIsEditing(false)}
                className="bg-gray-600 hover:bg-gray-500 text-white px-5 py-2 rounded-lg mr-3 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white px-6 py-2 rounded-lg shadow-md"
              >
                Save Changes
              </button>
            </>
          ) : (
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-lg shadow-md transition"
            >
              <Pencil size={16} /> Edit Profile
            </button>
          )}
        </div>
      </div>
    </section>
  );
}

/* ---------- REUSABLE FIELD COMPONENT ---------- */
function ProfileField({ icon, label, name, value, editable, onChange }) {
  return (
    <div className="flex items-center gap-3 bg-[#0f172a]/50 rounded-lg p-3 border border-gray-700">
      {icon}
      <div className="flex-1">
        <p className="text-xs text-gray-400">{label}</p>
        {editable ? (
          <input
            type="text"
            name={name}
            value={value}
            onChange={onChange}
            className="w-full bg-transparent border-b border-gray-500 focus:outline-none focus:border-blue-400 text-sm"
          />
        ) : (
          <p className="text-gray-200 text-sm">{value || "—"}</p>
        )}
      </div>
    </div>
  );
}

/* ---------- PASSWORD FIELD COMPONENT ---------- */
function PasswordField({ label, name, value, onChange, show, setShow }) {
  return (
    <div className="relative bg-[#0f172a]/50 rounded-lg p-3 border border-gray-700 flex flex-col">
      <p className="text-xs text-gray-400 mb-1 flex items-center gap-2">
        <Lock className="text-blue-400 w-4 h-4" /> {label}
      </p>
      <input
        type={show ? "text" : "password"}
        name={name}
        value={value}
        onChange={onChange}
        className="bg-transparent border-b border-gray-500 focus:outline-none focus:border-blue-400 text-sm pr-8"
        placeholder="••••••••"
      />
      <button
        type="button"
        onClick={() => setShow(!show)}
        className="absolute right-4 bottom-5 text-gray-400 hover:text-white"
      >
        {show ? <EyeOff size={16} /> : <Eye size={16} />}
      </button>
    </div>
  );
}
