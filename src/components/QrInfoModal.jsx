import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faTimes, faQrcode, faCheckCircle, faTimesCircle,
    faExternalLinkAlt, faUser, faPhone, faHeartPulse,
    faChevronLeft, faChevronRight,
    faArrowRotateLeft,
    faTriangleExclamation,
    faRotateLeft,
} from "@fortawesome/free-solid-svg-icons";
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useEffect, useState } from "react";

export const ResetConfirmPopup = ({ item, index, onConfirm, onCancel }) => (
    <div
        className="fixed inset-0 z-[999999] flex items-center justify-center px-4"
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

const DetailRow = ({ label, value, full = false, children }) => (
    <div className={full ? "col-span-2" : ""}>
        <p className="text-[10px] uppercase tracking-widest text-gray-400 mb-0.5">{label}</p>
        {children || <p className="text-sm font-medium dark:text-white text-gray-800 break-all">{value || '\u2014'}</p>}
    </div>
);

const QrInfoModal = ({ qr, onClose, allQrs = [], currentIndex = 0, onNavigate, batchName = null, onReset }) => {
    const total = allQrs.length;
    const hasPrev = currentIndex > 0;
    const hasNext = currentIndex < total - 1;
    const displayNum = currentIndex + 1;
    const [showResetPopup, setShowResetPopup] = useState(false);

    // Local QR state — allows updating display after reset without closing modal
    const [localQr, setLocalQr] = useState(qr);

    // Sync localQr when parent navigates to a different QR
    useEffect(() => {
        setLocalQr(qr);
    }, [qr]);

    useEffect(() => {
        if (!localQr) return;
        const handleKey = (e) => {
            if (showResetPopup) return; // block navigation while confirm popup is open
            if (e.key === 'ArrowLeft' && hasPrev) onNavigate(currentIndex - 1);
            else if (e.key === 'ArrowRight' && hasNext) onNavigate(currentIndex + 1);
            else if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleKey);
        return () => window.removeEventListener('keydown', handleKey);
    }, [localQr, currentIndex, hasPrev, hasNext, onNavigate, onClose, showResetPopup]);

    if (!localQr) return null;

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text).then(() => toast.success("Copied to clipboard!"));
    };

    const handleResetConfirm = async () => {
        setShowResetPopup(false);
        await onReset(localQr);
        // Immediately reflect reset in the modal — no close, no flicker
        setLocalQr(prev => ({
            ...prev,
            isActive: false,
            name: null,
            carNumberPlate: null,
            contactNumber: null,
            language: null,
            contactVerified: false,
            emergencyDetails: {
                emergencyContacts: [],
                bloodGroup: null,
                healthInsuranceCompany: null,
                notes: null,
            },
        }));
    };

    return (
        <>
            {/* Layer 1: Dark backdrop — click to close */}
            <div
                className="fixed inset-0 z-[99998]"
                style={{ backgroundColor: 'rgba(0,0,0,0.72)' }}
                onClick={onClose}
            />

            {/* Layer 2: Content row */}
            <div className="fixed inset-0 z-[99999] flex items-center justify-center pointer-events-none">

                {/* Prev Button */}
                {total > 1 && (
                    <button
                        onClick={() => hasPrev && onNavigate(currentIndex - 1)}
                        disabled={!hasPrev}
                        title="Previous QR"
                        style={{ pointerEvents: 'auto' }}
                        className={`flex-shrink-0 flex items-center justify-center w-11 h-11 mx-5 rounded-full transition-all select-none
                            ${hasPrev
                                ? 'bg-[#7d7fff] text-white hover:bg-[#6a6aee] shadow-lg hover:scale-110'
                                : 'text-white/20 cursor-not-allowed'}`}
                    >
                        <FontAwesomeIcon icon={faChevronLeft} />
                    </button>
                )}

                {/* Modal */}
                <div
                    style={{ pointerEvents: 'auto' }}
                    className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden max-h-[90vh] flex flex-col"
                >
                    {/* Header */}
                    <div className="bg-gray-50 dark:bg-gray-800 px-6 py-4 flex items-center justify-between flex-shrink-0">
                        <div className="flex items-center gap-2 flex-wrap">
                            <h2 className="text-base font-bold text-black dark:text-white">QR Details</h2>
                            {batchName && (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-lg text-md font-semibold bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700">
                                    {batchName}
                                </span>
                            )}
                            {total > 1 && (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-md bg-[#7d7fff] text-white dark:bg-gray-200 dark:text-gray-900">
                                    {displayNum} / {total}
                                </span>
                            )}
                        </div>
                        <button onClick={onClose} className="text-black/60 hover:text-black dark:text-white/60 dark:hover:text-white transition-colors p-1">
                            <FontAwesomeIcon icon={faTimes} className="text-xl" />
                        </button>
                    </div>

                    {/* Scrollable Body */}
                    <div className="overflow-y-auto flex-1">
                        <div className="flex flex-col items-center pt-6 pb-4 px-6 gap-3">
                            {localQr.qrImage ? (
                                <div className="w-40 h-40 border-4 border-gray-300 dark:border-gray-600 rounded-xl overflow-hidden shadow-lg bg-white flex items-center justify-center">
                                    <img src={localQr.qrImage} alt="QR Code" className="w-full h-full object-contain p-2" />
                                </div>
                            ) : (
                                <div className="w-40 h-40 border-4 border-dashed border-gray-300 dark:border-gray-600 rounded-xl flex items-center justify-center">
                                    <FontAwesomeIcon icon={faQrcode} className="text-6xl text-gray-300 dark:text-gray-600" />
                                </div>
                            )}
                            <div className="flex items-center gap-2">
                                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${localQr.isActive ? 'bg-green-50 text-green-700 border-green-300' : 'bg-red-50 text-red-600 border-red-300'}`}>
                                    <FontAwesomeIcon icon={localQr.isActive ? faCheckCircle : faTimesCircle} className="text-[10px]" />
                                    {localQr.isActive ? 'Active' : 'Inactive'}
                                </span>
                                {localQr.contactVerified && (
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border bg-blue-50 text-blue-700 border-blue-300">
                                        <FontAwesomeIcon icon={faCheckCircle} className="text-[10px]" /> Verified
                                    </span>
                                )}
                                {/* Reset button only shows when active */}
                                {localQr.isActive && localQr.qrtype === "sample" && (
                                    <button
                                        onClick={() => setShowResetPopup(true)}
                                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-orange-50 text-orange-500 border border-orange-200 hover:bg-orange-100 transition-colors justify-center">
                                        <FontAwesomeIcon icon={faArrowRotateLeft} className="text-xs" />
                                        Reset QR
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className="px-6 pb-6 space-y-5">
                            <div>
                                <div className="flex items-center gap-2 mb-3">
                                    <FontAwesomeIcon icon={faUser} className="text-yellow-500 text-sm" />
                                    <span className="text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">Basic Information</span>
                                </div>
                                <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 grid grid-cols-2 gap-4">
                                    <DetailRow label="Name" value={localQr.name} />
                                    <DetailRow label="Alert Message Language" value={localQr.language} />
                                    <DetailRow label="Contact Number" value={localQr.contactNumber} />
                                    <DetailRow label="Car Number Plate" value={localQr.carNumberPlate} />
                                </div>
                            </div>

                            <div>
                                <div className="flex items-center gap-2 mb-3">
                                    <FontAwesomeIcon icon={faQrcode} className="text-yellow-500 text-sm" />
                                    <span className="text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">QR Information</span>
                                </div>
                                <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 space-y-3">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-[10px] uppercase tracking-widest text-gray-400 mb-0.5">Code</p>
                                            <p className="text-sm font-mono font-semibold dark:text-white">{localQr.code || '\u2014'}</p>
                                        </div>
                                        <button onClick={() => copyToClipboard(localQr.code)} className="text-gray-900 hover:text-indigo-600 transition-colors">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                                            </svg>
                                        </button>
                                    </div>
                                    <div>
                                        <p className="text-[10px] uppercase tracking-widest text-gray-400 mb-1">QR Link</p>
                                        <div className="flex items-center gap-2">
                                            <p className="text-xs font-mono text-gray-700 dark:text-gray-300 truncate flex-1 break-all">{localQr.qrLink || '\u2014'}</p>
                                            <div className="flex items-center gap-1 flex-shrink-0">
                                                <button onClick={() => copyToClipboard(localQr.qrLink)} className="text-gray-900 hover:text-indigo-600 transition-colors">
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                        <rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                                                    </svg>
                                                </button>
                                                {localQr.qrLink && (
                                                    <a href={localQr.qrLink} target="_blank" rel="noreferrer" className="text-gray-400 hover:text-blue-500 transition-colors p-1">
                                                        <FontAwesomeIcon icon={faExternalLinkAlt} className="text-sm" />
                                                    </a>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-3 gap-2 pt-1">
                                        {[
                                            { label: 'Masked Call', val: localQr.isMaskedCall },
                                            { label: 'SMS Send', val: localQr.isSmsSend },
                                            { label: 'Emergency Show', val: localQr.isEmergencyShow },
                                        ].map(({ label, val }) => (
                                            <div key={label} className="text-center">
                                                <p className="text-[9px] uppercase tracking-widest text-gray-400 mb-1">{label}</p>
                                                <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${val ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                                                    {val ? '\u2713 Yes' : '\u2717 No'}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div>
                                <div className="flex items-center gap-2 mb-3">
                                    <FontAwesomeIcon icon={faHeartPulse} className="text-yellow-500 text-sm" />
                                    <span className="text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">Emergency Details</span>
                                </div>
                                <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 grid grid-cols-2 gap-4">
                                    <DetailRow label="Blood Group" value={localQr.emergencyDetails?.bloodGroup} />
                                    <DetailRow label="Insurance Company" value={localQr.emergencyDetails?.healthInsuranceCompany} />
                                    <DetailRow label="Notes" value={localQr.emergencyDetails?.notes} full />
                                </div>
                            </div>

                            <div>
                                <div className="flex items-center gap-2 mb-3">
                                    <FontAwesomeIcon icon={faPhone} className="text-yellow-500 text-sm" />
                                    <span className="text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">Emergency Contacts</span>
                                </div>
                                {localQr.emergencyDetails?.emergencyContacts?.length > 0 ? (
                                    <div className="space-y-2">
                                        {localQr.emergencyDetails.emergencyContacts.map((contact, i) => (
                                            <div key={i} className="flex items-center justify-between bg-gray-50 dark:bg-gray-800 rounded-xl px-4 py-3 border border-gray-100 dark:border-gray-700">
                                                <span className="text-sm font-semibold dark:text-white">{contact.relation || '\u2014'}</span>
                                                <span className="text-sm text-gray-500 dark:text-gray-400 font-mono">{contact.phoneNumber || '\u2014'}</span>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="bg-gray-50 dark:bg-gray-800 rounded-xl px-4 py-3 text-sm text-gray-400 text-center">
                                        No emergency contacts available
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="px-6 py-4 border-t dark:border-gray-700 flex-shrink-0">
                        <button onClick={onClose} className="w-full px-4 py-2.5 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-sm font-medium">
                            Close
                        </button>
                    </div>
                </div>

                {/* Next Button */}
                {total > 1 && (
                    <button
                        onClick={() => hasNext && onNavigate(currentIndex + 1)}
                        disabled={!hasNext}
                        title="Next QR"
                        style={{ pointerEvents: 'auto' }}
                        className={`flex-shrink-0 flex items-center justify-center w-11 h-11 mx-5 rounded-full transition-all select-none
                            ${hasNext
                                ? 'bg-[#7d7fff] text-white hover:bg-[#6a6aee] shadow-lg hover:scale-110'
                                : 'text-white/20 cursor-not-allowed'}`}
                    >
                        <FontAwesomeIcon icon={faChevronRight} />
                    </button>
                )}
            </div>

            {/* ResetConfirmPopup — outside pointer-events-none container */}
            {showResetPopup && (
                <ResetConfirmPopup
                    item={localQr}
                    index={displayNum}
                    onConfirm={handleResetConfirm}
                    onCancel={() => setShowResetPopup(false)}
                />
            )}
        </>
    );
};

export default QrInfoModal;