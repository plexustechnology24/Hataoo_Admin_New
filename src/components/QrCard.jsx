import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faTrash, faInfoCircle, faLink,
    faQrcode, faCopy,
    faDownload,
    faArrowRotateLeft,
    faRotateLeft,
    faTriangleExclamation,
    faPrint,
    faCheckCircle,
} from "@fortawesome/free-solid-svg-icons"
import { useState } from 'react';

/* ─── Is "New" helper (created within last 2 hours) ─────────────── */
const isNewItem = (createdAt) => {
    if (!createdAt) return false;
    return (Date.now() - new Date(createdAt).getTime()) < 1 * 60 * 60 * 1000;
};

/* ─── Reset Confirmation Popup ───────────────────────────────────── */
const ResetConfirmPopup = ({ item, index, onConfirm, onCancel }) => (
    <div
        className="fixed inset-0 z-[99999] flex items-center justify-center px-4"
        style={{ backgroundColor: 'rgba(0,0,0,0.45)' }}
        onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}
    >
        <div
            className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full overflow-hidden"
            style={{ maxWidth: 380 }}
        >
            {/* Header */}
            <div className="flex items-center gap-3 px-6 pt-6 pb-4">
                <div className="w-11 h-11 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
                    <FontAwesomeIcon icon={faTriangleExclamation} className="text-orange-500 text-lg" />
                </div>
                <div>
                    <h3 className="text-base font-bold text-gray-900 dark:text-white leading-tight">
                        Reset QR Code?
                    </h3>
                    <p className="text-xs text-gray-400 mt-0.5">QR #{index}</p>
                </div>
            </div>

            {/* Body */}
            <div className="px-6 pb-2">
                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                    This will permanently clear all details linked to this QR code:
                </p>
                <ul className="mt-3 space-y-1.5">
                    {[
                        { label: 'Name', value: item.name },
                        { label: 'Car Plate', value: item.carNumberPlate },
                        { label: 'Contact', value: item.contactNumber },
                        { label: 'Language', value: item.language },
                    ].map(({ label, value }) => (
                        <li key={label} className="flex items-center gap-2 text-xs">
                            <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${value ? 'bg-orange-400' : 'bg-gray-200'}`} />
                            <span className="text-gray-500 w-16 flex-shrink-0">{label}</span>
                            <span className={`font-medium truncate ${value ? 'text-gray-800 dark:text-gray-200' : 'text-gray-300 italic'}`}>
                                {value || 'empty'}
                            </span>
                        </li>
                    ))}
                </ul>
                <p className="text-xs text-orange-600 bg-orange-50 rounded-lg px-3 py-2 mt-3 font-medium">
                    The QR will be set to <strong>Inactive</strong> and all linked data will be cleared.
                </p>
            </div>

            {/* Actions */}
            <div className="flex gap-2.5 px-6 py-5">
                <button
                    onClick={onCancel}
                    className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                    Cancel
                </button>
                <button
                    onClick={onConfirm}
                    className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white bg-orange-500 hover:bg-orange-600 transition-colors flex items-center justify-center gap-2"
                >
                    <FontAwesomeIcon icon={faRotateLeft} className="text-xs" />
                    Yes, Reset
                </button>
            </div>
        </div>
    </div>
);

/* ══════════════════════════════════════════════════════════════════
   QR CARD
══════════════════════════════════════════════════════════════════ */
const QrCard = ({
    item,
    index,
    onDelete,
    onInfo,
    isSelected,
    onSelect,
    onDownload,
    onReset,
    onMarkAsPrinted,
    isPrintLoading,
    type,
}) => {
    const [showResetPopup, setShowResetPopup] = useState(false);

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text).then(() => toast.success("Copied to clipboard!"));
    };

    const isNew = isNewItem(item.createdAt);

    return (
        <>
            <div className={`relative bg-white dark:bg-gray-600 rounded-xl border-2 transition-all duration-200 overflow-hidden group
                ${isSelected
                    ? 'border-gray-400'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 hover:shadow-md dark:hover:border-gray-700'}`}>

                {/* Checkbox */}
                <div className="absolute top-2 left-2 z-10">
                    <input type="checkbox"
                        className="w-4 h-4 border-gray-300 rounded focus:ring-yellow-0 cursor-pointer"
                        checked={isSelected}
                        onChange={() => onSelect(item._id)} />
                </div>

                {/* Top-right badges */}
                <div className="absolute top-2 right-2 z-10 flex flex-col items-end gap-1">
                    {isNew && (
                        <span className="flex items-center justify-center bg-green-50 text-green-600 text-[10px] border border-green-300 px-2 rounded-full h-5 leading-none tracking-wide shadow-sm">
                            New
                        </span>
                    )}
                    {/* Printed badge */}
                    {/* {item.isPrinted && (
                        <span className="flex items-center gap-1 bg-blue-50 text-blue-600 text-[10px] border border-blue-200 px-2 rounded-full h-5 leading-none tracking-wide shadow-sm">
                            <FontAwesomeIcon icon={faCheckCircle} className="text-[9px]" />
                            Printed
                        </span>
                    )} */}
                </div>

                {/* QR Image */}
                <div className="flex items-center justify-center bg-gray-50 dark:bg-gray-600/50 px-4 pt-8 pb-3 min-h-[150px]">
                    {item.qrImage ? (
                        <img src={item.qrImage} alt="QR Code"
                            className="w-28 h-28 object-contain transition-transform duration-200 group-hover:scale-105"
                            style={{ imageRendering: 'pixelated' }} />
                    ) : (
                        <div className="w-28 h-28 flex items-center justify-center">
                            <FontAwesomeIcon icon={faQrcode} className="text-5xl text-gray-300 dark:text-gray-600" />
                        </div>
                    )}
                </div>

                {/* Card Body */}
                <div className="">

                    {/* Status line */}
                    <div className="flex items-center justify-center bg-gray-50 dark:bg-gray-600/50 px-3 py-1">
                        {item.isActive !== undefined && (
                            <span className={`inline-flex items-center justify-center rounded-full px-2.5 py-0.5 text-xs font-semibold
                                ${item.isActive
                                    ? "bg-green-50 text-green-700 border border-green-300"
                                    : "bg-red-50 text-red-600 border border-red-300"
                                }`}>
                                {item.isActive ? "Active" : "Inactive"}
                            </span>
                        )}
                    </div>

                    {/* QR Link row */}
                    <div className="flex items-center gap-1.5 bg-gray-50 dark:bg-gray-600/50 px-2 py-1.5">
                        <FontAwesomeIcon icon={faLink} className="text-gray-400 text-[13px] flex-shrink-0" />
                        <a
                            href={item.qrLink || "#"}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[13px] font-mono text-blue-500 dark:text-gray-400 truncate flex-1"
                            title={item.qrLink}
                        >
                            {item.qrLink || '—'}
                        </a>
                        <button
                            onClick={() => copyToClipboard(item.qrLink)}
                            className="text-gray-400 hover:text-yellow-500 transition-colors flex-shrink-0"
                            title="Copy link"
                        >
                            <FontAwesomeIcon icon={faCopy} className="text-[13px]" />
                        </button>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-between py-2 border-t border-gray-100 dark:border-gray-700 px-2">

                        {/* Info */}
                        <button onClick={() => onInfo(item)}
                            className="flex items-center gap-1.5 text-sm text-blue-500 hover:text-blue-700 dark:hover:text-blue-300 transition-colors px-2 py-1 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20"
                            title="View Details">
                            <FontAwesomeIcon icon={faInfoCircle} />
                        </button>

                        {/* Download */}
                        <button onClick={() => onDownload(item.qrImage, index)}
                            className="flex items-center gap-1.5 text-sm text-green-500 hover:text-green-700 transition-colors px-2 py-1 rounded-lg hover:bg-green-50"
                            title={`Download qr-${index}.svg`}>
                            <FontAwesomeIcon icon={faDownload} />
                        </button>

                        {/* Mark as Printed — shown when onMarkAsPrinted prop is provided */}
                        {onMarkAsPrinted && (
                            <button
                                onClick={() => onMarkAsPrinted(item)}
                                disabled={isPrintLoading || item.isPrinted}
                                title={item.isPrinted ? "Already Printed" : "Mark as Printed"}
                                className={`flex items-center gap-1.5 text-sm transition-colors px-2 py-1 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed
      ${item.isPrinted
                                        ? 'text-gray-400'
                                        : 'text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20'
                                    }`}
                            >
                                {isPrintLoading ? (
                                    <div className="w-3.5 h-3.5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                                ) : (
                                    <FontAwesomeIcon icon={item.isPrinted ? faCheckCircle : faPrint} />
                                )}
                            </button>
                        )}

                        {/* Delete */}
                        {item.qrtype === "sample" && (
                            <button onClick={() => onDelete(item._id)}
                                className="flex items-center gap-1.5 text-sm text-red-500 hover:text-red-700 dark:hover:text-red-300 transition-colors px-2 py-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20"
                                title="Delete">
                                <FontAwesomeIcon icon={faTrash} />
                            </button>
                        )}

                        {/* Reset — only for active QRs */}
                        {item.isActive && item.qrtype === "sample" && (
                            <button
                                onClick={() => setShowResetPopup(true)}
                                title="Reset QR"
                                className="flex items-center gap-1.5 text-sm text-orange-500 hover:text-orange-700 transition-colors px-2 py-1 rounded-lg hover:bg-orange-50"
                            >
                                <FontAwesomeIcon icon={faArrowRotateLeft} />
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Reset Confirmation Popup */}
            {showResetPopup && (
                <ResetConfirmPopup
                    item={item}
                    index={index}
                    onConfirm={() => {
                        onReset(item);
                        setShowResetPopup(false);
                    }}
                    onCancel={() => setShowResetPopup(false)}
                />
            )}
        </>
    );
};

export default QrCard;