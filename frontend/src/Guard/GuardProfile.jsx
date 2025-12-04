import { useState, useEffect, Fragment } from "react";
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
import { Dialog, Transition } from "@headlessui/react";
import { useAuth } from "../hooks/useAuth";
import { useNavigate } from "react-router-dom";
const api = import.meta.env.VITE_API_URL;

export default function GuardProfile() {
  const { user: guardData, loading } = useAuth();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [changedFields, setChangedFields] = useState({});

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [confirmationPassword, setConfirmationPassword] = useState("");
  const [modalError, setModalError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Separate visibility states for each password field
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false); // For modal password

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
    SSSID: "",
    PhilHealthID: "",
    PagibigID: "",
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
          fullName: p.fullName || "",
          guardId: p.guardId || "",
          email: p.email || "",
          phoneNumber: p.phoneNumber || "",
          address: p.address || "",
          dutyStation: p.dutyStation || "",
          shift: p.shift || "",
          position: p.position || "",
          sssId: p.SSSID || "",
          philHealthId: p.PhilHealthID || "",
          pagibigId: p.PagibigID || "",
          confirmNewPassword: "",
        }));
        setChangedFields({});
      } catch (error) {
        console.error("Error fetching profile:", error);
      }
    };

    fetchProfile();
  }, [guardData, navigate, loading]);

  const handleInitiateSave = () => {
    const fieldsToUpdate = {};
    const hasPasswordChange = !!guard.newpassword;

    if (hasPasswordChange) {
      if (guard.newpassword !== guard.confirmNewPassword) {
        alert("⚠️ Passwords do not match!");
        return;
      }
      if (guard.newpassword.length < 8) {
        alert("⚠️ Passwords must be at least 8 Characters!");
        return;
      }
    }

    const hasProfileInfoChange = Object.keys(changedFields).some(
      (key) => !["currentPassword", "newpassword", "confirmNewPassword"].includes(key)
    );

    if (!hasPasswordChange && !hasProfileInfoChange) {
      alert("No changes to save.");
      setIsEditing(false);
      return;
    }

    setIsModalOpen(true);
    setModalError("");
  };

  const handleConfirmUpdate = async () => {
    if (!confirmationPassword) {
      setModalError("Password is required to confirm changes.");
      return;
    }

    setIsSubmitting(true);
    setModalError("");

    const fieldsToUpdate = {
      currentPassword: confirmationPassword,
    };

    if (guard.newpassword) {
      fieldsToUpdate.newPassword = guard.newpassword;
    }

    ["phoneNumber", "address", "sssId", "philHealthId", "pagibigId"].forEach(
      (field) => {
        if (changedFields.hasOwnProperty(field)) {
          if (field === "sssId") fieldsToUpdate.SSSID = changedFields[field];
          else if (field === "philHealthId")
            fieldsToUpdate.PhilHealthID = changedFields[field];
          else if (field === "pagibigId")
            fieldsToUpdate.PagibigID = changedFields[field];
          else fieldsToUpdate[field] = changedFields[field];
        }
      }
    );

    try {
      const res = await fetch(`${api}/api/guards/update-guard-profile`, {
        method: "PUT",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(fieldsToUpdate),
      });

      const result = await res.json();

      if (result.success) {
        alert("✅ Profile updated successfully!");
        setIsModalOpen(false);
        setConfirmationPassword("");
        setIsEditing(false);
        setChangedFields({});
        setGuard((prev) => ({
          ...prev,
          currentPassword: "",
          newpassword: "",
          confirmNewPassword: "",
        }));
      } else {
        setModalError(result.message || "Failed to update profile.");
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      setModalError("A server error occurred. Please try again later.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setGuard((prevGuard) => ({ ...prevGuard, [name]: value }));
    setChangedFields((prevChanged) => ({ ...prevChanged, [name]: value }));
  };
  
  const handleCancelEdit = () => {
    setIsEditing(false);
    // You may want to refetch the profile or reset the state to discard changes
    // For simplicity, we just toggle the editing state here
  };

  return (
    <section className="min-h-screen bg-[#0f172a] text-gray-100 px-4 py-10 flex justify-center">
      <div className="w-full max-w-3xl bg-[#1e293b]/90 border border-gray-700 rounded-2xl shadow-2xl p-6 sm:p-8 backdrop-blur-md space-y-6">
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
          <ProfileField
            icon={<BadgeCheck className="text-blue-400 w-5 h-5" />}
            label="SSS ID"
            name="sssId"
            value={guard.sssId}
            editable={isEditing}
            onChange={handleChange}
          />

          <ProfileField
            icon={<BadgeCheck className="text-blue-400 w-5 h-5" />}
            label="PhilHealth ID"
            name="philHealthId"
            value={guard.philHealthId}
            editable={isEditing}
            onChange={handleChange}
          />

          <ProfileField
            icon={<BadgeCheck className="text-blue-400 w-5 h-5" />}
            label="Pag-IBIG ID"
            name="pagibigId"
            value={guard.pagibigId}
            editable={isEditing}
            onChange={handleChange}
          />
        </div>

        {isEditing && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <PasswordField
              label="New Password (optional)"
              name="newpassword"
              value={guard.newpassword}
              onChange={handleChange}
              show={showNew}
              setShow={setShowNew}
            />
            <PasswordField
              label="Confirm New Password"
              name="confirmNewPassword"
              value={guard.confirmNewPassword}
              onChange={handleChange}
              show={showConfirm}
              setShow={setShowConfirm}
            />
          </div>
        )}

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
      
      {/* Confirmation Modal */}
      <Transition appear show={isModalOpen} as={Fragment}>
        <Dialog as="div" className="relative z-10" onClose={() => setIsModalOpen(false)}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black bg-opacity-50" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-[#1e293b] p-6 text-left align-middle shadow-xl transition-all border border-gray-700">
                  <Dialog.Title
                    as="h3"
                    className="text-lg font-medium leading-6 text-white"
                  >
                    Confirm Changes
                  </Dialog.Title>
                  <div className="mt-2">
                    <p className="text-sm text-gray-400">
                      To save your changes, please enter your current password.
                    </p>
                  </div>

                  <div className="mt-4 text-white">
                     <PasswordField

                        label="Current Password"
                        name="confirmationPassword"
                        value={confirmationPassword}
                        onChange={(e) => setConfirmationPassword(e.target.value)}
                        show={showConfirmation}
                        setShow={setShowConfirmation}
                      />
                  </div>

                  {modalError && (
                    <div className="mt-2 text-sm text-red-400 bg-red-900/50 p-2 rounded">
                      {modalError}
                    </div>
                  )}

                  <div className="mt-6 flex justify-end space-x-3">
                    <button
                      type="button"
                      className="inline-flex justify-center rounded-md border border-transparent bg-gray-600 px-4 py-2 text-sm font-medium text-white hover:bg-gray-500 focus:outline-none"
                      onClick={() => setIsModalOpen(false)}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="inline-flex justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 focus:outline-none disabled:bg-gray-500"
                      onClick={handleConfirmUpdate}
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? "Confirming..." : "Confirm"}
                    </button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </section>
  );
}

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