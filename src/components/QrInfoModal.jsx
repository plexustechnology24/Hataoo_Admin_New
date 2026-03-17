import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faTimes, faQrcode, faCheckCircle, faTimesCircle,
    faExternalLinkAlt, faUser, faPhone, faHeartPulse,
    faChevronLeft, faChevronRight,
} from "@fortawesome/free-solid-svg-icons";
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useEffect } from "react";

const DetailRow = ({ label, value, full = false, children }) => (
    <div className={full ? "col-span-2" : ""}>
        <p className="text-[10px] uppercase tracking-widest text-gray-400 mb-0.5">{label}</p>
        {children || <p className="text-sm font-medium dark:text-white text-gray-800 break-all">{value || '\u2014'}</p>}
    </div>
);

const QrInfoModal = ({ qr, onClose, allQrs = [], currentIndex = 0, onNavigate, batchName = null }) => {
    const total = allQrs.length;
    const hasPrev = currentIndex > 0;
    const hasNext = currentIndex < total - 1;
    const displayNum = currentIndex + 1;

    useEffect(() => {
        if (!qr) return;
        const handleKey = (e) => {
            if (e.key === 'ArrowLeft' && hasPrev) onNavigate(currentIndex - 1);
            else if (e.key === 'ArrowRight' && hasNext) onNavigate(currentIndex + 1);
            else if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleKey);
        return () => window.removeEventListener('keydown', handleKey);
    }, [qr, currentIndex, hasPrev, hasNext, onNavigate, onClose]);

    if (!qr) return null;

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text).then(() => toast.success("Copied to clipboard!"));
    };

    return (
        <>
            {/* Layer 1: Dark backdrop only — click to close */}
            <div
                className="fixed inset-0 z-[99998]"
                style={{ backgroundColor: 'rgba(0,0,0,0.72)' }}
                onClick={onClose}
            />

            {/* Layer 2: Content row — backdrop NOT here, so buttons have no dark bg */}
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
                            {qr.qrImage ? (
                                <div className="w-40 h-40 border-4 border-gray-300 dark:border-gray-600 rounded-xl overflow-hidden shadow-lg bg-white flex items-center justify-center">
                                    <img src={qr.qrImage} alt="QR Code" className="w-full h-full object-contain p-2" />
                                </div>
                            ) : (
                                <div className="w-40 h-40 border-4 border-dashed border-gray-300 dark:border-gray-600 rounded-xl flex items-center justify-center">
                                    <FontAwesomeIcon icon={faQrcode} className="text-6xl text-gray-300 dark:text-gray-600" />
                                </div>
                            )}
                            <div className="flex items-center gap-2">
                                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${qr.isActive ? 'bg-green-50 text-green-700 border-green-300' : 'bg-red-50 text-red-600 border-red-300'}`}>
                                    <FontAwesomeIcon icon={qr.isActive ? faCheckCircle : faTimesCircle} className="text-[10px]" />
                                    {qr.isActive ? 'Active' : 'Inactive'}
                                </span>
                                {qr.contactVerified && (
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border bg-blue-50 text-blue-700 border-blue-300">
                                        <FontAwesomeIcon icon={faCheckCircle} className="text-[10px]" /> Verified
                                    </span>
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
                                    <DetailRow label="Name" value={qr.name} />
                                    <DetailRow label="Language" value={qr.language} />
                                    <DetailRow label="Contact Number" value={qr.contactNumber} />
                                    <DetailRow label="Car Number Plate" value={qr.carNumberPlate} />
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
                                            <p className="text-sm font-mono font-semibold dark:text-white">{qr.code || '\u2014'}</p>
                                        </div>
                                        <button
                                            onClick={() => copyToClipboard(qr.code)}
                                            className="text-gray-900 hover:text-indigo-600 transition-colors"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                                            </svg>
                                        </button>
                                    </div>
                                    <div>
                                        <p className="text-[10px] uppercase tracking-widest text-gray-400 mb-1">QR Link</p>
                                        <div className="flex items-center gap-2">
                                            <p className="text-xs font-mono text-gray-700 dark:text-gray-300 truncate flex-1 break-all">{qr.qrLink || '\u2014'}</p>
                                            <div className="flex items-center gap-1 flex-shrink-0">
                                                <button
                                                    onClick={() => copyToClipboard(qr.qrLink)}
                                                    className="text-gray-900 hover:text-indigo-600 transition-colors"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                        <rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                                                    </svg>
                                                </button>
                                                {qr.qrLink && (
                                                    <a href={qr.qrLink} target="_blank" rel="noreferrer" className="text-gray-400 hover:text-blue-500 transition-colors p-1">
                                                        <FontAwesomeIcon icon={faExternalLinkAlt} className="text-sm" />
                                                    </a>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-3 gap-2 pt-1">
                                        {[
                                            { label: 'Masked Call', val: qr.isMaskedCall },
                                            { label: 'SMS Send', val: qr.isSmsSend },
                                            { label: 'Emergency Show', val: qr.isEmergencyShow },
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
                                    <DetailRow label="Blood Group" value={qr.emergencyDetails?.bloodGroup} />
                                    <DetailRow label="Insurance Company" value={qr.emergencyDetails?.healthInsuranceCompany} />
                                    <DetailRow label="Notes" value={qr.emergencyDetails?.notes} full />
                                </div>
                            </div>

                            <div>
                                <div className="flex items-center gap-2 mb-3">
                                    <FontAwesomeIcon icon={faPhone} className="text-yellow-500 text-sm" />
                                    <span className="text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">Emergency Contacts</span>
                                </div>
                                {qr.emergencyDetails?.emergencyContacts?.length > 0 ? (
                                    <div className="space-y-2">
                                        {qr.emergencyDetails.emergencyContacts.map((contact, i) => (
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
        </>
    );
};

export default QrInfoModal;