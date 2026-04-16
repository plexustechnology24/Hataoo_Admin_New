import { useRef } from "react";

/**
 * ContactNumberInput
 * Defined outside any parent component so it has a stable identity
 * and doesn't remount on every parent render (which would kill focus).
 */
const ContactNumberInput = ({
    value,
    onChange,
    error,
    disabled,
    placeholder = "10-digit number",
}) => {
    const inputRef = useRef(null);

    const handleChange = (e) => {
        const raw = e.target.value;
        const cursorPos = e.target.selectionStart;
        const digitsBeforeCursor = raw.slice(0, cursorPos).replace(/\D/g, "").length;
        const cleaned = raw.replace(/\D/g, "").slice(0, 10);
        onChange(cleaned);
        // Restore caret after controlled-input re-render
        requestAnimationFrame(() => {
            if (inputRef.current) {
                const newPos = Math.min(digitsBeforeCursor, cleaned.length);
                inputRef.current.setSelectionRange(newPos, newPos);
            }
        });
    };

    return (
        <div className="flex-1">
            <label className="block text-xs font-medium mb-1 text-gray-500 dark:text-gray-400">
                Number
            </label>
            <input
                ref={inputRef}
                type="text"
                inputMode="numeric"
                maxLength={10}
                value={value}
                onChange={handleChange}
                placeholder={placeholder}
                disabled={disabled}
                className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400
                    dark:bg-gray-700 dark:text-white dark:border-gray-600
                    ${error ? "border-red-500" : "border-gray-300"}`}
            />
            {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
        </div>
    );
};

export default ContactNumberInput;