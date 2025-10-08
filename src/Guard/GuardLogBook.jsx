import { useState, useEffect } from "react";

export default function GuardLogBook() {
  const [updates, setUpdates] = useState([]);
  const [newUpdate, setNewUpdate] = useState("");
  const [image, setImage] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editingText, setEditingText] = useState("");

  // 🧠 Load saved logs
  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem("guardLogBook")) || [];
    setUpdates(saved);
  }, []);

  // 💾 Save logs
  useEffect(() => {
    localStorage.setItem("guardLogBook", JSON.stringify(updates));
  }, [updates]);

  // 📸 Handle file or camera image
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => setImage(event.target.result);
    reader.readAsDataURL(file);
  };

  const handleAddUpdate = () => {
    if (!newUpdate.trim() && !image) return;

    const now = new Date();
    const time = now.toLocaleTimeString("en-US", { hour12: false });

    const newEntry = {
      id: Date.now(),
      time,
      text: newUpdate,
      image,
      editedAt: null,
    };

    setUpdates([newEntry, ...updates]);
    setNewUpdate("");
    setImage(null);
  };

  // 💾 Save edits
  const handleSaveEdit = (id) => {
    const now = new Date();
    const editedAt = now.toLocaleTimeString("en-US", { hour12: false });

    setUpdates(
      updates.map((u) =>
        u.id === id ? { ...u, text: editingText, editedAt } : u
      )
    );

    setEditingId(null);
    setEditingText("");
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingText("");
  };

  return (
    <div className="items-center p-7 min-h-screen bg-[#0f172a]">
      {/* Input Box */}
      <div className="bg-white rounded-xl shadow p-4 mb-6">
        <h2 className="text-lg font-bold text-gray-700 mb-3">Add Update</h2>

        <div className="flex flex-col sm:flex-row gap-2">
          <textarea
            value={newUpdate}
            onChange={(e) => setNewUpdate(e.target.value)}
            placeholder="Type here to add a new update..."
            className="flex-1 border rounded-lg p-3 focus:ring focus:ring-blue-300"
          />
          <button
            onClick={handleAddUpdate}
            className="bg-gray-900 text-white px-7 py-2 rounded-lg hover:bg-gray-700"
          >
            Add
          </button>
        </div>

        {/* Image / Camera Input */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 mt-3">
          <label className="text-sm font-medium text-gray-700">
            Attach Image:
          </label>
          <input
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleImageChange}
            className="text-sm text-gray-600"
          />
          {image && (
            <img
              src={image}
              alt="preview"
              className="w-24 h-24 object-cover rounded-lg border mt-2 sm:mt-0"
            />
          )}
        </div>
      </div>

      {/* Updates List */}
      <div className="space-y-4">
        {updates.length === 0 ? (
          <p className="text-gray-400 text-center">No updates yet.</p>
        ) : (
          updates.map((u) => (
            <div
              key={u.id}
              className="bg-white shadow rounded-xl p-4 flex flex-col gap-3"
            >
              <div className="flex items-center justify-between flex-wrap gap-1">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                  <span className="text-sm font-mono text-gray-600">
                    {u.time}
                  </span>
                  {u.editedAt && (
                    <span className="text-xs text-gray-500">
                      (edited at {u.editedAt})
                    </span>
                  )}
                </div>

                {/*Edit Button */}
                {editingId !== u.id && (
                  <button
                    onClick={() => {
                      setEditingId(u.id);
                      setEditingText(u.text);
                    }}
                    className="text-gray-500 hover:text-blue-600"
                  >
                    ✎
                  </button>
                )}
              </div>

              {/*Edit */}
              {editingId === u.id ? (
                <div className="flex flex-col sm:flex-row gap-2">
                  <textarea
                    value={editingText}
                    onChange={(e) => setEditingText(e.target.value)}
                    className="flex-1 border rounded-lg p-2 focus:ring focus:ring-blue-300"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleSaveEdit(u.id)}
                      className="bg-green-900 text-white px-3 py-1 rounded-lg hover:bg-green-700"
                    >
                      Save
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      className="bg-gray-400 text-white px-3 py-1 rounded-lg hover:bg-gray-500"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <p className="text-gray-700">{u.text}</p>
                  {u.image && (
                    <img
                      src={u.image}
                      alt="attached"
                      className="w-full sm:w-60 h-60 object-cover rounded-lg border"
                    />
                  )}
                </>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
