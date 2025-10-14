import React, { useState, useEffect } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { Fragment } from "react";
import Navbar from "../components/navbar";

export default function UserAccounts() {
  const [users, setUsers] = useState([]);
  const [isOpen, setIsOpen] = useState(false);

  const [form, setForm] = useState({
    name: "",
    guardId: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });

  // ✅ Fetch users
  useEffect(() => {
    fetch("http://localhost:5000/api/auth/users")
      .then((res) => res.json())
      .then((data) => setUsers(data))
      .catch((err) => console.error("Fetch users error:", err));
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // ✅ Add new user
  const handleAddUser = async () => {
    if (
      !form.name ||
      !form.guardId ||
      !form.email ||
      !form.phone ||
      !form.password ||
      !form.confirmPassword
    ) {
      alert("Please fill in all fields.");
      return;
    }

    if (form.password !== form.confirmPassword) {
      alert("Passwords do not match!");
      return;
    }

    try {
      const res = await fetch("http://localhost:5000/api/auth/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          guardId: form.guardId,
          email: form.email,
          phone: form.phone,
          password: form.password,
        }),
      });

      if (!res.ok) throw new Error("Failed to save user");

      const newUser = await res.json();
      setUsers([...users, newUser]);

      // Reset form + close modal
      setForm({
        name: "",
        guardId: "",
        email: "",
        phone: "",
        password: "",
        confirmPassword: "",
      });
      setIsOpen(false);

      alert("✅ User saved successfully!");
    } catch (err) {
      console.error("Add user error:", err);
      alert("❌ Failed to save user. Check backend connection.");
    }
  };

  // ✅ Delete user
  const handleDelete = async (id) => {
    try {
      const res = await fetch(`http://localhost:5000/api/auth/users/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to delete user");

      setUsers(users.filter((u) => u._id !== id));
    } catch (err) {
      console.error("Delete user error:", err);
      alert("❌ Failed to delete user.");
    }
  };

  return (
    <div className="flex min-h-screen bg-[#0f172a]">
      <main className="flex-1 p-6">
        <h2 className="text-2xl font-bold text-white mb-4">Users</h2>

        {/* Add User Button */}
        <div className="flex justify-end mb-4 gap-x-2">
          <div className="flex flex-col sm:flex-row gap-2">
            <select className="border px-3 py-2 rounded-md shadow-sm bg-gray-900 text-white hover:bg-gray-900 transition">
              <option value="All">All</option>
              <option value="Guard">Guard</option>
              <option value="Sub-admin">Sub-admin</option>
              <option value="Applicant">Applicant</option>
            </select>
            <input
              type="text"
              placeholder="Search..."
              className="border px-3 py-2 rounded-md bg-gray-900 text-white focus:outline-none focus:ring focus:ring-blue-300 w-full sm:w-64"
            />
          </div>
          <button
            onClick={() => setIsOpen(true)}
            className="bg-[#456882] hover:bg-[#234C6A] text-white px-4 py-2 rounded-lg shadow"
          >
            Add new user
          </button>
        </div>

        {/*Modal*/}
        <Transition appear show={isOpen} as={Fragment}>
          <Dialog as="div" className="relative z-50" onClose={() => setIsOpen(false)}>
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0"
              enterTo="opacity-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <div className="fixed inset-0 bg-black/50" />
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
                  <Dialog.Panel className="w-full max-w-lg transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                    <Dialog.Title className="text-lg font-semibold text-gray-900 mb-4">
                      Add New User
                    </Dialog.Title>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <input
                        type="text"
                        name="name"
                        placeholder="Full Name"
                        value={form.name}
                        onChange={handleChange}
                        className="border rounded px-3 py-2"
                      />
                      <input
                        type="text"
                        name="guardId"
                        placeholder="Guard ID"
                        value={form.guardId}
                        onChange={handleChange}
                        className="border rounded px-3 py-2"
                      />
                      <input
                        type="email"
                        name="email"
                        placeholder="Email Address"
                        value={form.email}
                        onChange={handleChange}
                        className="border rounded px-3 py-2"
                      />
                      <input
                        type="text"
                        name="phone"
                        placeholder="Phone Number"
                        value={form.phone}
                        onChange={handleChange}
                        className="border rounded px-3 py-2"
                      />
                      <input
                        type="password"
                        name="password"
                        placeholder="Password"
                        value={form.password}
                        onChange={handleChange}
                        className="border rounded px-3 py-2"
                      />
                      <input
                        type="password"
                        name="confirmPassword"
                        placeholder="Confirm Password"
                        value={form.confirmPassword}
                        onChange={handleChange}
                        className="border rounded px-3 py-2"
                      />
                    </div>

                    <div className="mt-6 flex justify-end gap-3">
                      <button
                        onClick={() => setIsOpen(false)}
                        className="bg-gray-300 hover:bg-gray-400 px-4 py-2 rounded-lg"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleAddUser}
                        className="bg-[#234C6A] hover:bg-[#456882] px-6 py-2 rounded-lg shadow text-white"
                      >
                        Save User
                      </button>
                    </div>
                  </Dialog.Panel>
                </Transition.Child>
              </div>
            </div>
          </Dialog>
        </Transition>

        {/* Users Table */}
        <div className="overflow-x-auto bg-white text-black shadow rounded-lg">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-200">
              <tr>
                <th className="px-4 py-2">Full Name</th>
                <th className="px-4 py-2">Guard ID</th>
                <th className="px-4 py-2">Phone Number</th>
                <th className="px-4 py-2">Email Address</th>
                <th className="px-4 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center text-gray-500 py-4 italic">
                    No users added yet.
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u._id} className="border-t">
                    <td className="px-4 py-2">{u.name}</td>
                    <td className="px-4 py-2">{u.guardId}</td>
                    <td className="px-4 py-2">{u.phone}</td>
                    <td className="px-4 py-2">{u.email}</td>
                    <td className="px-4 py-2 space-x-2">
                      <button className="bg-blue-600 text-white px-3 py-1 rounded shadow">
                        Update
                      </button>
                      <button
                        onClick={() => handleDelete(u._id)}
                        className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded shadow"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
