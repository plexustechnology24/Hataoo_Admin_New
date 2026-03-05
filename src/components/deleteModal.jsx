const DeleteModal = ({
  isOpen,
  isBulk = false,
  selectedCount = 0,
  value = "item",
  isDeleting = false,
  onClose,
  onConfirm,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[99999]">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-sm mx-4 shadow-lg">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-3">
          {isBulk ? "Delete Selected Items" : `Delete ${value}`}
        </h2>

        <p className="text-gray-700 dark:text-gray-300 mb-6">
          {isBulk
            ? `Are you sure you want to delete ${selectedCount} selected items?`
            : `Are you sure you want to delete this ${value}?`}
        </p>

        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={isDeleting}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 disabled:opacity-70"
          >
            Cancel
          </button>

          <button
            onClick={onConfirm}
            disabled={isDeleting}
            className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 disabled:opacity-70"
          >
            {isDeleting ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteModal;