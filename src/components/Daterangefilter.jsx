import React, { useEffect, useRef, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCalendarAlt, faChevronDown } from "@fortawesome/free-solid-svg-icons";

/* ══════════════════════════════════════════════════════════════════
   DATE RANGE OPTIONS — dynamically labelled
══════════════════════════════════════════════════════════════════ */
const buildOptions = () => {
    const now = new Date();
    const thisMonthName = now.toLocaleString("en-US", { month: "long" });
    const thisYear = now.getFullYear();
    const lastMonthDate = new Date(thisYear, now.getMonth() - 1, 1);
    const lastMonthName = lastMonthDate.toLocaleString("en-US", { month: "long" });
    const lastMonthYear = lastMonthDate.getFullYear();

    return [
        { label: "Today", value: "today" },
        { label: "Yesterday", value: "yesterday" },
        { label: "This Week (Sunday to Saturday)", value: "thisWeek" },
        { label: "Last Week (Sunday to Saturday)", value: "lastWeek" },
        { label: `This Month (${thisMonthName} ${thisYear})`, value: "thisMonth" },
        { label: `Last Month (${lastMonthName} ${lastMonthYear})`, value: "lastMonth" },
        { label: `This Year (${thisYear})`, value: "thisYear" },
        { label: `Last Year (${thisYear - 1})`, value: "lastYear" },
        { label: "Lifetime", value: "lifetime" },
        { label: "Custom Range", value: "custom" },
    ];
};


export const computeDateRange = (key, customFrom = "", customTo = "") => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    switch (key) {
        case "today":
            return { fromDate: today.toISOString(), toDate: todayEnd.toISOString() };

        case "yesterday": {
            const y = new Date(today);
            y.setDate(y.getDate() - 1);
            const ye = new Date(y);
            ye.setHours(23, 59, 59, 999);
            return { fromDate: y.toISOString(), toDate: ye.toISOString() };
        }
        case "thisWeek": {
            const start = new Date(today);
            start.setDate(today.getDate() - today.getDay());
            return { fromDate: start.toISOString(), toDate: todayEnd.toISOString() };
        }
        case "lastWeek": {
            const start = new Date(today);
            start.setDate(today.getDate() - today.getDay() - 7);
            const end = new Date(start);
            end.setDate(start.getDate() + 6);
            end.setHours(23, 59, 59, 999);
            return { fromDate: start.toISOString(), toDate: end.toISOString() };
        }
        case "thisMonth": {
            const start = new Date(today.getFullYear(), today.getMonth(), 1);
            return { fromDate: start.toISOString(), toDate: todayEnd.toISOString() };
        }
        case "lastMonth": {
            const start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
            const end = new Date(today.getFullYear(), today.getMonth(), 0);
            end.setHours(23, 59, 59, 999);
            return { fromDate: start.toISOString(), toDate: end.toISOString() };
        }
        case "thisYear": {
            const start = new Date(today.getFullYear(), 0, 1);
            return { fromDate: start.toISOString(), toDate: todayEnd.toISOString() };
        }
        case "lastYear": {
            const start = new Date(today.getFullYear() - 1, 0, 1);
            const end = new Date(today.getFullYear() - 1, 11, 31);
            end.setHours(23, 59, 59, 999);
            return { fromDate: start.toISOString(), toDate: end.toISOString() };
        }
        case "lifetime":
            return { fromDate: null, toDate: null };

        case "custom":
            return {
                fromDate: customFrom ? new Date(customFrom).toISOString() : null,
                toDate: customTo ? new Date(customTo + "T23:59:59").toISOString() : null,
            };

        default:
            return { fromDate: null, toDate: null };
    }
};

export const DEFAULT_DATE_KEY = "thisMonth";
export const defaultDateRange = () => computeDateRange(DEFAULT_DATE_KEY);

const DateRangeFilter = ({ selectedKey = DEFAULT_DATE_KEY, onChange, onClear }) => {
    const DATE_OPTIONS = buildOptions();

    const [open, setOpen] = useState(false);
    const [pendingKey, setPendingKey] = useState(selectedKey);
    const [customFrom, setCustomFrom] = useState("");
    const [customTo, setCustomTo] = useState("");
    const dropdownRef = useRef(null);

    /* Sync pending when external selectedKey changes */
    useEffect(() => {
        setPendingKey(selectedKey);
    }, [selectedKey]);

    /* Close on outside click */
    useEffect(() => {
        const handler = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target))
                setOpen(false);
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    /* Button label */
    const getLabel = () => {
        if (selectedKey === "custom" && customFrom && customTo)
            return `${customFrom} – ${customTo}`;
        const opt = DATE_OPTIONS.find((o) => o.value === selectedKey);
        const shortLabel = opt ? opt.label.split("(")[0].trim() : "Date Filter";
        return `Date Filter: ${shortLabel}`;
    };

    const handleApply = () => {
        let resolvedFrom = customFrom;
        let resolvedTo = customTo;

        // If only start date is provided, auto-set end date to the same date
        if (pendingKey === "custom" && resolvedFrom && !resolvedTo) {
            resolvedTo = resolvedFrom;
            setCustomTo(resolvedFrom);
        }

        const range = computeDateRange(pendingKey, resolvedFrom, resolvedTo);
        setOpen(false);
        onChange?.({ key: pendingKey, ...range });
    };

    const handleClear = () => {
        setPendingKey(DEFAULT_DATE_KEY);
        setCustomFrom("");
        setCustomTo("");
        setOpen(false);
        const range = computeDateRange(DEFAULT_DATE_KEY);
        onClear?.({ key: DEFAULT_DATE_KEY, ...range });
    };

    return (
        <div ref={dropdownRef} className="relative">
            {/* Trigger button */}
            <button
                type="button"
                onClick={() => { setOpen(!open); setPendingKey(selectedKey); }}
                className="h-11 flex items-center gap-2 px-4 rounded-lg border text-sm font-medium transition-colors border-gray-200 bg-white text-gray-600 hover:border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
            >
                <FontAwesomeIcon icon={faCalendarAlt} className="text-xs" />
                <span>{getLabel()}</span>
                <FontAwesomeIcon
                    icon={faChevronDown}
                    className={`text-xs transition-transform ${open ? "rotate-180" : ""}`}
                />
            </button>

            {/* Dropdown panel */}
            {open && (
                <div className="absolute left-0 top-12 z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-2xl w-[500px] overflow-hidden">
                    {/* Header */}
                    <div className="px-4 pt-4 pb-2">
                        <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                            Select Range
                        </p>
                    </div>

                    {/* Radio options */}
                    <div className="px-2 pb-2 max-h-72 overflow-y-auto grid grid-cols-2 gap-2">
                        {DATE_OPTIONS.map((opt) => (
                            <label
                                key={opt.value}
                                className={`flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-colors
        ${pendingKey === opt.value
                                        ? "bg-[#dbeafe] dark:bg-red-900/20"
                                        : "hover:bg-gray-50 dark:hover:bg-gray-700"
                                    }`}
                            >
                                <input
                                    type="radio"
                                    name="dateRange"
                                    value={opt.value}
                                    checked={pendingKey === opt.value}
                                    onChange={() => setPendingKey(opt.value)}
                                    className="w-4 h-4 cursor-pointer"
                                />
                                <span
                                    className={`text-sm text-gray-700 dark:text-gray-300" }`}
                                >
                                    {opt.label}
                                </span>
                            </label>
                        ))}
                    </div>

                    {/* Custom Range inputs */}
                    {pendingKey === "custom" && (
                        <div className="px-4 pb-3 flex gap-2">
                            <div className="flex-1">
                                <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">
                                    From
                                </label>
                                <input
                                    type="date"
                                    value={customFrom}
                                    onChange={(e) => setCustomFrom(e.target.value)}
                                    className="w-full h-9 px-3 rounded-lg border border-gray-200 dark:border-gray-600 text-sm text-gray-700 dark:text-gray-300 dark:bg-gray-700 focus:outline-none focus:border-red-400"
                                />
                            </div>
                            <div className="flex-1">
                                <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">
                                    To
                                </label>
                                <input
                                    type="date"
                                    value={customTo}
                                    onChange={(e) => setCustomTo(e.target.value)}
                                    className="w-full h-9 px-3 rounded-lg border border-gray-200 dark:border-gray-600 text-sm text-gray-700 dark:text-gray-300 dark:bg-gray-700 focus:outline-none focus:border-red-400"
                                />
                            </div>
                        </div>
                    )}

                    {/* Footer: Clear + Apply */}
                    <div className="border-t border-gray-100 dark:border-gray-700 flex gap-3 p-3">
                        <button
                            type="button"
                            onClick={handleClear}
                            className="flex-1 py-2 text-md border border-gray-100 bg-gray-100 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors rounded-2xl"
                        >
                            Clear
                        </button>
                        <button
                            type="button"
                            onClick={handleApply}
                            className="flex-1 py-2 text-md text-white bg-[#7C7FFF] transition-colors rounded-2xl"
                        >
                            Apply
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DateRangeFilter;