import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimes,
    faQrcode, faCheckCircle, faTimesCircle,
    faExternalLinkAlt, faCopy, faUser, faPhone, faHeartPulse,
} from "@fortawesome/free-solid-svg-icons";
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const DetailRow = ({ label, value, full = false, children }) => (
    <div className={full ? "col-span-2" : ""}>
        <p className="text-[10px] uppercase tracking-widest text-gray-400 mb-0.5">{label}</p>
        {children || <p className="text-sm font-medium dark:text-white text-gray-800 break-all">{value || '—'}</p>}
    </div>
);


const QrInfoModal = ({ qr, onClose }) => {
    if (!qr) return null;

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text).then(() => toast.success("Copied to clipboard!"));
    };

    return (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center px-4"
            style={{ backgroundColor: 'rgba(0,0,0,0.65)' }}>
            <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden max-h-[90vh] flex flex-col">

                {/* Header */}
                <div className="bg-gray-50 px-6 py-4 flex items-center justify-between flex-shrink-0">
                    <div className="flex items-center gap-2">
                        <h2 className="text-lg font-bold text-black">QR Code Details</h2>
                    </div>
                    <button onClick={onClose} className="text-black/70 hover:text-black transition-colors p-1">
                        <FontAwesomeIcon icon={faTimes} className="text-xl" />
                    </button>
                </div>

                <div className="overflow-y-auto flex-1">
                    {/* QR Image + Code */}
                    <div className="flex flex-col items-center pt-6 pb-4 px-6 gap-3">
                        {qr.qrImage ? (
                            <div className="w-40 h-40 border-4 border-gray-400 rounded-xl overflow-hidden shadow-lg bg-white flex items-center justify-center">
                                <img src={qr.qrImage} alt="QR Code" className="w-full h-full object-contain p-2" />
                            </div>
                        ) : (
                            <div className="w-40 h-40 border-4 border-dashed border-gray-300 dark:border-gray-600 rounded-xl flex items-center justify-center">
                                <FontAwesomeIcon icon={faQrcode} className="text-6xl text-gray-300 dark:text-gray-600" />
                            </div>
                        )}
                        {/* Status badges */}
                        <div className="flex items-center gap-2">
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border
                                ${qr.isActive ? 'bg-green-50 text-green-700 border-green-300' : 'bg-red-50 text-red-600 border-red-300'}`}>
                                <FontAwesomeIcon icon={qr.isActive ? faCheckCircle : faTimesCircle} className="text-[10px]" />
                                {qr.isActive ? 'Active' : 'Inactive'}
                            </span>
                            {qr.contactVerified && (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border bg-blue-50 text-blue-700 border-blue-300">
                                    <FontAwesomeIcon icon={faCheckCircle} className="text-[10px]" />
                                    Verified
                                </span>
                            )}
                        </div>
                    </div>

                    <div className="px-6 pb-6 space-y-5">

                        {/* Section: Basic Info */}
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

                        {/* Section: QR Info */}
                        <div>
                            <div className="flex items-center gap-2 mb-3">
                                <FontAwesomeIcon icon={faQrcode} className="text-yellow-500 text-sm" />
                                <span className="text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">QR Information</span>
                            </div>
                            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 space-y-3">
                                {/* Code row */}
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-[10px] uppercase tracking-widest text-gray-400 mb-0.5">Code</p>
                                        <p className="text-sm font-mono font-semibold dark:text-white">{qr.code || '—'}</p>
                                    </div>
                                    <button onClick={() => copyToClipboard(qr.code)}
                                        className="text-gray-400 hover:text-yellow-500 transition-colors p-1" title="Copy code">
                                        <FontAwesomeIcon icon={faCopy} />
                                    </button>
                                </div>
                                {/* QR Link */}
                                <div>
                                    <p className="text-[10px] uppercase tracking-widest text-gray-400 mb-1">QR Link</p>
                                    <div className="flex items-center gap-2">
                                        <p className="text-xs font-mono text-gray-700 dark:text-gray-300 truncate flex-1 break-all">{qr.qrLink || '—'}</p>
                                        <div className="flex items-center gap-1 flex-shrink-0">
                                            <button onClick={() => copyToClipboard(qr.qrLink)}
                                                className="text-gray-400 hover:text-yellow-500 transition-colors p-1" title="Copy link">
                                                <FontAwesomeIcon icon={faCopy} className="text-sm" />
                                            </button>
                                            {qr.qrLink && (
                                                <a href={qr.qrLink} target="_blank" rel="noreferrer"
                                                    className="text-gray-400 hover:text-blue-500 transition-colors p-1" title="Open link">
                                                    <FontAwesomeIcon icon={faExternalLinkAlt} className="text-sm" />
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                {/* Toggles */}
                                <div className="grid grid-cols-3 gap-2 pt-1">
                                    {[
                                        { label: 'Masked Call', val: qr.isMaskedCall },
                                        { label: 'SMS Send', val: qr.isSmsSend },
                                        { label: 'Emergency Show', val: qr.isEmergencyShow },
                                    ].map(({ label, val }) => (
                                        <div key={label} className="text-center">
                                            <p className="text-[9px] uppercase tracking-widest text-gray-400 mb-1">{label}</p>
                                            <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full
                                                ${val ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                                                {val ? '✓ Yes' : '✗ No'}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Section: Emergency Details */}
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

                        {/* Section: Emergency Contacts */}
                        <div>
                            <div className="flex items-center gap-2 mb-3">
                                <FontAwesomeIcon icon={faPhone} className="text-yellow-500 text-sm" />
                                <span className="text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">Emergency Contacts</span>
                            </div>
                            {qr.emergencyDetails?.emergencyContacts?.length > 0 ? (
                                <div className="space-y-2">
                                    {qr.emergencyDetails.emergencyContacts.map((contact, i) => (
                                        <div key={i}
                                            className="flex items-center justify-between bg-gray-50 dark:bg-gray-800 rounded-xl px-4 py-3 border border-gray-100 dark:border-gray-700">
                                            <span className="text-sm font-semibold dark:text-white">{contact.relation || '—'}</span>
                                            <span className="text-sm text-gray-500 dark:text-gray-400 font-mono">{contact.phoneNumber || '—'}</span>
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
                    <button onClick={onClose}
                        className="w-full px-6 py-2.5 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-sm font-medium">
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default QrInfoModal;
