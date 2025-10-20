export default function DeleteUserModal({ user, onConfirm, onCancel }) {
  if (!user) return null; // Don’t show if no user selected

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-[#1e293b] text-white rounded-xl shadow-xl w-80 p-6">
        <h2 className="text-lg font-semibold mb-3">Delete User</h2>
        <p className="text-sm text-gray-300 mb-5">
          Are you sure you want to delete{" "}
          <span className="font-medium text-red-400">{user.name}</span>?  
          This action cannot be undone.
        </p>

        <div className="flex justify-end space-x-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-lg bg-gray-600 hover:bg-gray-500 text-sm"
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(user._id)}
            className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-sm"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
