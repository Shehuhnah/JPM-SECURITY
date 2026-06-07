import { useState, useEffect } from "react";
import {
  ShieldUser,
  Mail,
  Phone,
  MapPin,
  BadgeCheck,
  Pencil,
  Eye,
  EyeOff,
  Lock,
} from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { getPersonName } from "../utils/name";

const api = import.meta.env.VITE_API_URL;

const formatPHPhoneNumber = (value) => {
  if (!value) return "+63";

  let digits = value.replace(/\D/g, "");
  if (digits.startsWith("63")) digits = digits.slice(2);
  if (digits.startsWith("0")) digits = digits.slice(1);

  digits = digits.slice(0, 10);
  return digits ? `+63${digits}` : "+63";
};

export default function GuardProfile() {
  const { user: guardData, loading } = useAuth();
  const navigate = useNavigate();

  const [isEditing, setIsEditing] = useState(false);
  const [changedFields, setChangedFields] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [guard, setGuard] = useState({
    fullName: "",
    firstName: "",
    lastName: "",
    guardId: "",
    email: "",
    phoneNumber: "+63",
    address: "",
    position: "",
    newpassword: "",
    confirmNewPassword: "",
    sssId: "",
    philHealthId: "",
    pagibigId: "",
  });

  useEffect(() => {
    document.title = "Manage Profile | JPM Agency Security";

    if (!guardData && !loading) {
      navigate("/guard/login");
      return;
    }

    const fetchProfile = async () => {
      try {
        const res = await fetch(`${api}/api/guards/me`, {
          credentials: "include",
        });

        const result = await res.json();
        if (!result.success) return;

        const p = result.data;

        setGuard((prev) => ({
          ...prev,
          fullName: getPersonName(p, ""),
          firstName: p.firstName || "",
          lastName: p.lastName || "",
          guardId: p.guardId || "",
          email: p.email || "",
          phoneNumber: formatPHPhoneNumber(p.phoneNumber || ""),
          address: p.address || "",
          position: p.position || "",
          sssId: p.SSSID || "",
          philHealthId: p.PhilHealthID || "",
          pagibigId: p.PagibigID || "",
          newpassword: "",
          confirmNewPassword: "",
        }));

        setChangedFields({});
      } catch (error) {
        console.error("Error fetching profile:", error);
      }
    };

    fetchProfile();
  }, [guardData, navigate, loading]);

  const handleInitiateSave = async () => {
    const hasPasswordChange = Boolean(guard.newpassword);
    const hasProfileInfoChange = Object.keys(changedFields).some(
      (key) => !["newpassword", "confirmNewPassword"].includes(key)
    );

    if (hasPasswordChange) {
      if (guard.newpassword !== guard.confirmNewPassword) {
        toast.error("Passwords do not match.");
        return;
      }

      if (guard.newpassword.length < 8) {
        toast.error("Password must be at least 8 characters.");
        return;
      }
    }

    if (!hasPasswordChange && !hasProfileInfoChange) {
      toast.info("No changes to save.");
      setIsEditing(false);
      return;
    }

    setIsSubmitting(true);

    const fieldsToUpdate = {};
    if (hasPasswordChange) fieldsToUpdate.newPassword = guard.newpassword;

    ["email", "phoneNumber", "address"].forEach((field) => {
      if (Object.prototype.hasOwnProperty.call(changedFields, field)) {
        fieldsToUpdate[field] = field === "email" ? changedFields[field].toLowerCase() : changedFields[field];
      }
    });

    try {
      const res = await fetch(`${api}/api/guards/update-guard-profile`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(fieldsToUpdate),
      });

      const result = await res.json();

      if (result.success) {
        toast.success("Profile updated successfully!", {
          position: "top-right",
          autoClose: 3000,
          theme: "dark",
        });

        setIsEditing(false);
        setChangedFields({});
        setGuard((prev) => ({
          ...prev,
          newpassword: "",
          confirmNewPassword: "",
        }));
      } else {
        toast.error(result.message || "Failed to update profile.");
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("A server error occurred. Please try again later.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e) => {
    let { name, value } = e.target;

    if (["sssId", "philHealthId", "pagibigId", "guardId"].includes(name)) return;
    if (name === "phoneNumber") value = formatPHPhoneNumber(value);

    setGuard((prevGuard) => ({
      ...prevGuard,
      [name]: value,
    }));

    setChangedFields((prevChanged) => ({
      ...prevChanged,
      [name]: value,
    }));
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setChangedFields({});
    setGuard((prev) => ({
      ...prev,
      newpassword: "",
      confirmNewPassword: "",
    }));
  };

  return (
    <section className="min-h-screen bg-[#0f172a] text-gray-100 px-4 py-10 flex justify-center">
      <div className="w-full max-w-3xl bg-[#1e293b]/90 border border-gray-700 rounded-2xl shadow-2xl p-6 sm:p-8 backdrop-blur-md space-y-6">
        <div className="text-center border-b border-gray-700 pb-6">
          <div className="mx-auto mb-4 w-24 h-24 bg-[#0f172a] flex items-center justify-center rounded-full border border-gray-600">
            <ShieldUser size={50} className="text-blue-400" />
          </div>

          <h2 className="text-2xl font-bold text-white">{getPersonName(guard)}</h2>
          <p className="text-gray-400 text-sm">{guard.position}</p>
          <p className="text-blue-400 text-xs font-mono mt-1">ID: {guard.guardId}</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <ProfileField
            icon={<Mail className="text-blue-400 w-5 h-5" />}
            label="Email"
            name="email"
            value={guard.email}
            editable={isEditing}
            onChange={handleChange}
            type="email"
          />

          <ProfileField
            icon={<Phone className="text-blue-400 w-5 h-5" />}
            label="Phone Number"
            name="phoneNumber"
            value={guard.phoneNumber}
            editable={isEditing}
            onChange={handleChange}
            placeholder="+639123456789"
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
            label="SSS ID"
            name="sssId"
            value={guard.sssId}
            editable={false}
            onChange={handleChange}
          />

          <ProfileField
            icon={<BadgeCheck className="text-blue-400 w-5 h-5" />}
            label="PhilHealth ID"
            name="philHealthId"
            value={guard.philHealthId}
            editable={false}
            onChange={handleChange}
          />

          <ProfileField
            icon={<BadgeCheck className="text-blue-400 w-5 h-5" />}
            label="Pag-IBIG ID"
            name="pagibigId"
            value={guard.pagibigId}
            editable={false}
            onChange={handleChange}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <PasswordField
            label="New Password (optional)"
            name="newpassword"
            value={guard.newpassword}
            onChange={handleChange}
            show={showNew}
            setShow={setShowNew}
            disabled={!isEditing}
          />

          <PasswordField
            label="Confirm New Password"
            name="confirmNewPassword"
            value={guard.confirmNewPassword}
            onChange={handleChange}
            show={showConfirm}
            setShow={setShowConfirm}
            disabled={!isEditing}
          />
        </div>

        <div className="flex justify-end mt-8">
          {isEditing ? (
            <>
              <button
                onClick={handleCancelEdit}
                className="bg-gray-600 hover:bg-gray-500 text-white px-5 py-2 rounded-lg mr-3 transition"
              >
                Cancel
              </button>

              <button
                onClick={handleInitiateSave}
                disabled={isSubmitting}
                className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white px-6 py-2 rounded-lg shadow-md disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? "Saving..." : "Save Changes"}
              </button>
            </>
          ) : (
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-lg shadow-md transition"
            >
              <Pencil size={16} />
              Edit Profile
            </button>
          )}
        </div>
      </div>

      <ToastContainer />
    </section>
  );
}

function ProfileField({
  icon,
  label,
  name,
  value,
  editable,
  onChange,
  type = "text",
  placeholder = "",
}) {
  return (
    <div className="flex items-center gap-3 bg-[#0f172a]/50 rounded-lg p-3 border border-gray-700">
      {icon}

      <div className="flex-1">
        <p className="text-xs text-gray-400">{label}</p>

        {editable ? (
          <input
            type={type}
            name={name}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            inputMode={name === "phoneNumber" ? "tel" : undefined}
            className="w-full bg-transparent border-b border-gray-500 focus:outline-none focus:border-blue-400 text-sm"
          />
        ) : (
          <p className="text-gray-200 text-sm">{value || "-"}</p>
        )}
      </div>
    </div>
  );
}

function PasswordField({
  label,
  name,
  value,
  onChange,
  show,
  setShow,
  disabled = false,
}) {
  return (
    <div className={`relative bg-[#0f172a]/50 rounded-lg p-3 border border-gray-700 flex flex-col ${disabled ? "opacity-70" : ""}`}>
      <p className="text-xs text-gray-400 mb-1 flex items-center gap-2">
        <Lock className="text-blue-400 w-4 h-4" />
        {label}
      </p>

      <input
        type={show ? "text" : "password"}
        name={name}
        value={value}
        onChange={onChange}
        disabled={disabled}
        className="bg-transparent border-b border-gray-500 focus:outline-none focus:border-blue-400 text-sm pr-8 disabled:cursor-not-allowed"
        placeholder="********"
      />

      <button
        type="button"
        onClick={() => setShow(!show)}
        className="absolute right-4 bottom-5 text-gray-400 hover:text-white"
        aria-label={show ? "Hide password" : "Show password"}
      >
        {show ? <Eye size={16} /> : <EyeOff size={16} />}
      </button>
    </div>
  );
}
