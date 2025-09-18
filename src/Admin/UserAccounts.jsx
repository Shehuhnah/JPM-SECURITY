import React, { useState, useEffect } from "react";
import Navbar from "../components/navbar";

export default function UserAccounts() {
  const [users, setUsers] = useState([]);
  const [showForm, setShowForm] = useState(false);

  const [form, setForm] = useState({
    name: "",
    guardId: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });

  // ✅ Fetch users from backend
  useEffect(() => {
    fetch("http://localhost:5000/api/users")
      .then((res) => res.json())
      .then((data) => setUsers(data))
      .catch((err) => console.error("Fetch users error:", err));
  }, []);

  // Handle input change
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // ✅ Add new user to backend
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
      const res = await fetch("http://localhost:5000/api/users", {
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

      const newUser = await res.json();
      setUsers([...users, newUser]);

      // Reset form
      setForm({
        name: "",
        guardId: "",
        email: "",
        phone: "",
        password: "",
        confirmPassword: "",
      });
      setShowForm(false);
    } catch (err) {
      console.error("Add user error:", err);
    }
  };

  // ✅ Delete user from backend
  const handleDelete = async (id) => {
    try {
      await fetch(`http://localhost:5000/api/users/${id}`, {
        method: "DELETE",
      });
      setUsers(users.filter((u) => u._id !== id));
    } catch (err) {
      console.error("Delete user error:", err);
    }
  };

  return (
    <div
      className="min-h-screen bg-center bg-repeat text-white flex itemsjustify-center "
      style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23333' fill-opacity='0.15'%3E%3Cpath d='M0 0h10v10H0zM10 10h10v10H10z'/%3E%3C/g%3E%3C/svg%3E")`,
        backgroundColor: "#111",
        backgroundSize: "40px 40px",
      }}
    >
      <Navbar />

      <main className="flex-1 p-6 bg-gray-100">
        <h2 className="text-2xl text-black font-bold ">Users</h2>

        {/* Add User Button */}
        <div className="flex justify-end mb-4">
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow"
          >
            {showForm ? "Close Form" : "Add new users"}
          </button>
        </div>

        {/* Add User Form */}
        {showForm && (
          <div className="p-4 border border-gray-300 rounded-lg mb-6 text-black bg-white shadow">
            <h3 className="text-lg font-semibold mb-3">Add New User</h3>
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
            <button
              onClick={handleAddUser}
              className="mt-4 bg-green-600 hover:bg-green-700 px-6 py-2 rounded-lg shadow"
            >
              Save User
            </button>
          </div>
        )}

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
                  <td
                    colSpan="5"
                    className="text-center text-gray-500 py-4 italic"
                  >
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
                      <button className="bg-teal-400 text-white px-3 py-1 rounded shadow">
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
