import { useEffect, useRef, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheckCircle } from "@fortawesome/free-solid-svg-icons";
import OfflineOrdersBase from "../../components/OfflineOrders/OfflineOrdersBase";

// ─────────────────────────────────────────────────────────────────────────────
// AddToConfirmModal
// ─────────────────────────────────────────────────────────────────────────────
const AddToConfirmModal = ({ item, onClose, onSuccess }) => {
    const liveVal = item.liveQrQuantity != null ? Number(item.liveQrQuantity) : null;
    const sampleVal = item.sampleQrQuantity != null ? Number(item.sampleQrQuantity) : null;

    // Which preset chips are toggled on
    const [liveSel, setLiveSel] = useState(false);
    const [sampleSel, setSampleSel] = useState(false);

    // Manual quantity typed in the input
    const [manualQty, setManualQty] = useState("");

    // Price (required)
    const [price, setPrice] = useState(
        item.price != null ? String(item.price) : ""
    );

    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    // ── Derived values ────────────────────────────────────────────────────────
    const anyChipSelected = liveSel || sampleSel;
    const selectedSum = (liveSel ? (liveVal ?? 0) : 0) + (sampleSel ? (sampleVal ?? 0) : 0);

    // Final quantity sent to API:
    //   • any chip active  → selectedSum
    //   • no chip, typed   → Number(manualQty)
    //   • nothing          → null
    const finalQty = anyChipSelected
        ? selectedSum
        : manualQty !== "" ? Number(manualQty) : null;

    // Sync input field whenever chip selection changes
    useEffect(() => {
        if (anyChipSelected) setManualQty(String(selectedSum));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [liveSel, sampleSel]);

    // ── Handlers ──────────────────────────────────────────────────────────────
    const toggleLive = () => {
        setLiveSel((v) => !v);
        setErrors((p) => { const e = { ...p }; delete e.quantity; return e; });
    };

    const toggleSample = () => {
        setSampleSel((v) => !v);
        setErrors((p) => { const e = { ...p }; delete e.quantity; return e; });
    };

    const handleManualChange = (e) => {
        // Deselect chips when user types manually
        setLiveSel(false);
        setSampleSel(false);
        setManualQty(e.target.value);
        setErrors((p) => { const e2 = { ...p }; delete e2.quantity; return e2; });
    };

    // ── Validation ────────────────────────────────────────────────────────────
    const validate = () => {
        const errs = {};
        if (finalQty === null || finalQty === undefined || isNaN(finalQty) || finalQty < 0)
            errs.quantity = "Quantity is required";
        if (price === "" || isNaN(Number(price)) || Number(price) < 0)
            errs.price = "Price is required";
        return errs;
    };

    // ── Submit ────────────────────────────────────────────────────────────────
    const handleSubmit = async (e) => {
        e.preventDefault();
        const errs = validate();
        if (Object.keys(errs).length > 0) { setErrors(errs); return; }
        if (isSubmitting) return;
        try {
            setIsSubmitting(true);
            await axios.patch(
                `http://localhost:3001/api/offline-order/update/${item._id}`,
                {
                    orderType: "confirm",
                    quantity: finalQty,
                    price: Number(price),
                }
            );
            toast.success("Order moved to Confirm successfully!");
            onSuccess();
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to confirm order. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const hasPresets = liveVal !== null || sampleVal !== null;

    return (
        <div className="fixed inset-0 z-[999999] flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black bg-opacity-50"
                onClick={() => !isSubmitting && onClose()}
            />

            {/* Panel */}
            <div className="relative bg-white rounded-xl w-full max-w-sm mx-4 shadow-2xl dark:bg-gray-800">

                {/* Header */}
                <div className="px-6 py-4 border-b dark:border-gray-700 flex items-center gap-3">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/40 flex-shrink-0">
                        <FontAwesomeIcon icon={faCheckCircle} className="text-green-600 dark:text-green-400 text-base" />
                    </div>
                    <div className="overflow-hidden">
                        <h3 className="text-base font-semibold dark:text-white leading-tight">
                            Add to Confirm
                        </h3>
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 truncate">
                            {item.societyName}
                        </p>
                    </div>
                </div>

                {/* Body */}
                <div className="px-6 py-5">
                    <form onSubmit={handleSubmit}>

                        {/* ── Quantity ── */}
                        <div className="mb-4">
                            <label className="block font-medium mb-2 text-sm dark:text-gray-300">
                                Quantity (select live or sample qr) <span className="text-red-500">*</span>
                            </label>

                            {/* Preset chips */}
                            {hasPresets && (
                                <div className="flex gap-2 mb-3">
                                    {liveVal !== null && (
                                        <button
                                            type="button"
                                            onClick={toggleLive}
                                            disabled={isSubmitting}
                                            className={`flex-1 flex flex-col items-center py-2.5 px-3 rounded-lg border-2 transition-all duration-150 disabled:opacity-50 ${liveSel
                                                    ? "border-green-500 bg-green-50 dark:bg-green-900/30 dark:border-green-500"
                                                    : "border-gray-200 bg-gray-50 hover:border-gray-300 dark:border-gray-600 dark:bg-gray-700/50"
                                                }`}
                                        >
                                            <span className={`text-base font-bold leading-tight ${liveSel ? "text-green-600 dark:text-green-400" : "text-gray-700 dark:text-gray-300"}`}>
                                                {liveVal}
                                            </span>
                                            <span className={`text-[10px] mt-0.5 uppercase tracking-wide font-semibold ${liveSel ? "text-green-600 dark:text-green-400" : "text-gray-400"}`}>
                                                Live QR
                                            </span>
                                        </button>
                                    )}

                                    {sampleVal !== null && (
                                        <button
                                            type="button"
                                            onClick={toggleSample}
                                            disabled={isSubmitting}
                                            className={`flex-1 flex flex-col items-center py-2.5 px-3 rounded-lg border-2 transition-all duration-150 disabled:opacity-50 ${sampleSel
                                                    ? "border-blue-500 bg-blue-50 dark:bg-blue-900/30 dark:border-blue-500"
                                                    : "border-gray-200 bg-gray-50 hover:border-gray-300 dark:border-gray-600 dark:bg-gray-700/50"
                                                }`}
                                        >
                                            <span className={`text-base font-bold leading-tight ${sampleSel ? "text-blue-600 dark:text-blue-400" : "text-gray-700 dark:text-gray-300"}`}>
                                                {sampleVal}
                                            </span>
                                            <span className={`text-[10px] mt-0.5 uppercase tracking-wide font-semibold ${sampleSel ? "text-blue-600 dark:text-blue-400" : "text-gray-400"}`}>
                                                Sample QR
                                            </span>
                                        </button>
                                    )}
                                </div>
                            )}


                            {/* "or type" divider */}
                            {hasPresets && (
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="flex-1 h-px bg-gray-200 dark:bg-gray-600" />
                                    <span className="text-[10px] text-gray-400 uppercase tracking-widest">or type</span>
                                    <div className="flex-1 h-px bg-gray-200 dark:bg-gray-600" />
                                </div>
                            )}

                            {/* Quantity input — auto-filled by chip, editable manually */}
                            <input
                                type="number"
                                min="0"
                                value={manualQty}
                                onChange={handleManualChange}
                                placeholder="Enter quantity"
                                autoFocus={!hasPresets}
                                className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2
                                    dark:bg-gray-700 dark:text-white dark:border-gray-600
                                    ${errors.quantity
                                        ? "border-red-500 focus:ring-red-300"
                                        : anyChipSelected
                                            ? "border-green-400 bg-green-50/40 focus:ring-green-300 dark:bg-green-900/10 dark:border-green-600"
                                            : "border-gray-300 focus:ring-green-400"
                                    }`}
                                disabled={isSubmitting}
                            />
                            {errors.quantity && (
                                <p className="text-red-500 text-xs mt-1">{errors.quantity}</p>
                            )}
                        </div>

                        {/* ── Price (required) ── */}
                        <div className="mb-6">
                            <label className="block font-medium mb-1 text-sm dark:text-gray-300">
                                Price (₹) <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="number"
                                min="0"
                                value={price}
                                onChange={(e) => {
                                    setPrice(e.target.value);
                                    if (errors.price)
                                        setErrors((p) => { const err = { ...p }; delete err.price; return err; });
                                }}
                                placeholder="Enter price"
                                className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2
                                    dark:bg-gray-700 dark:text-white dark:border-gray-600
                                    ${errors.price ? "border-red-500 focus:ring-red-300" : "border-gray-300 focus:ring-green-400"}`}
                                disabled={isSubmitting}
                            />
                            {errors.price && (
                                <p className="text-red-500 text-xs mt-1">{errors.price}</p>
                            )}
                        </div>

                        {/* ── Action buttons ── */}
                        <div className="flex gap-3">
                            <button
                                type="button"
                                onClick={onClose}
                                disabled={isSubmitting}
                                className="w-1/2 py-2 px-4 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium disabled:opacity-50 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-1/2 py-2 px-4 text-white rounded-lg transition-colors text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2"
                                style={{ backgroundColor: "#16a34a" }}
                            >
                                {isSubmitting ? (
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                ) : (
                                    <>
                                        <FontAwesomeIcon icon={faCheckCircle} />
                                        Confirm
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

// ─────────────────────────────────────────────────────────────────────────────
// PendingOfflineOrders
// ─────────────────────────────────────────────────────────────────────────────
const PendingOfflineOrders = () => {
    const [liveQrQuantity, setLiveQrQuantity] = useState("");
    const [sampleQrQuantity, setSampleQrQuantity] = useState("");
    const [price, setPrice] = useState("");
    const [pendingStats, setPendingStats] = useState(null);

    const [confirmModal, setConfirmModal] = useState({ isOpen: false, item: null });
    const baseApi = useRef(null);

    const resetExtra = () => {
        setLiveQrQuantity("");
        setSampleQrQuantity("");
        setPrice("");
    };

    const onEditSetExtra = (item) => {
        setLiveQrQuantity(item.liveQrQuantity != null ? String(item.liveQrQuantity) : "");
        setSampleQrQuantity(item.sampleQrQuantity != null ? String(item.sampleQrQuantity) : "");
        setPrice(item.price != null ? String(item.price) : "");
    };

    const getExtraPayload = () => ({
        liveQrQuantity: liveQrQuantity !== "" ? Number(liveQrQuantity) : null,
        sampleQrQuantity: sampleQrQuantity !== "" ? Number(sampleQrQuantity) : null,
        price: price !== "" ? Number(price) : null,
    });

    const validateExtra = () => {
        const errs = {};
        if (liveQrQuantity !== "" && (isNaN(Number(liveQrQuantity)) || Number(liveQrQuantity) < 0))
            errs.liveQrQuantity = "Live QR Quantity must be a non-negative number";
        if (sampleQrQuantity !== "" && (isNaN(Number(sampleQrQuantity)) || Number(sampleQrQuantity) < 0))
            errs.sampleQrQuantity = "Sample QR Quantity must be a non-negative number";
        if (price !== "" && (isNaN(Number(price)) || Number(price) < 0))
            errs.price = "Price must be a non-negative number";
        return errs;
    };

    const renderExtraFields = (isSubmitting, formErrors, setFormErrors) => (
        <>
            <div className="mb-4 p-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/40">
                <p className="text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-2.5">QR Details</p>
                <div className="flex gap-3">
                    <div className="flex-1">
                        <label className="block text-xs font-medium mb-1 text-gray-500 dark:text-gray-400">Live QR Quantity</label>
                        <input
                            type="number" min="0" value={liveQrQuantity}
                            onChange={(e) => {
                                setLiveQrQuantity(e.target.value);
                                if (formErrors?.liveQrQuantity)
                                    setFormErrors((p) => { const err = { ...p }; delete err.liveQrQuantity; return err; });
                            }}
                            placeholder="Enter live QR qty"
                            className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 dark:bg-gray-700 dark:text-white dark:border-gray-600 ${formErrors?.liveQrQuantity ? "border-red-500" : "border-gray-300"}`}
                            disabled={isSubmitting}
                        />
                        {formErrors?.liveQrQuantity && <p className="text-red-500 text-xs mt-1">{formErrors.liveQrQuantity}</p>}
                    </div>
                    <div className="flex-1">
                        <label className="block text-xs font-medium mb-1 text-gray-500 dark:text-gray-400">Sample QR Quantity</label>
                        <input
                            type="number" min="0" value={sampleQrQuantity}
                            onChange={(e) => {
                                setSampleQrQuantity(e.target.value);
                                if (formErrors?.sampleQrQuantity)
                                    setFormErrors((p) => { const err = { ...p }; delete err.sampleQrQuantity; return err; });
                            }}
                            placeholder="Enter sample QR qty"
                            className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 dark:bg-gray-700 dark:text-white dark:border-gray-600 ${formErrors?.sampleQrQuantity ? "border-red-500" : "border-gray-300"}`}
                            disabled={isSubmitting}
                        />
                        {formErrors?.sampleQrQuantity && <p className="text-red-500 text-xs mt-1">{formErrors.sampleQrQuantity}</p>}
                    </div>
                </div>
            </div>

            <div className="mb-4">
                <label className="block font-medium mb-1 text-sm dark:text-gray-300">Price</label>
                <input
                    type="number" min="0" value={price}
                    onChange={(e) => {
                        setPrice(e.target.value);
                        if (formErrors?.price)
                            setFormErrors((p) => { const err = { ...p }; delete err.price; return err; });
                    }}
                    placeholder="Enter price in ₹"
                    className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 dark:bg-gray-700 dark:text-white dark:border-gray-600 ${formErrors?.price ? "border-red-500" : "border-gray-300"}`}
                    disabled={isSubmitting}
                />
                {formErrors?.price && <p className="text-red-500 text-xs mt-1">{formErrors.price}</p>}
            </div>
        </>
    );

    const renderExtraActions = (item) => (
        <button
            onClick={() => setConfirmModal({ isOpen: true, item })}
            title="Add to Confirm"
            className="flex items-center gap-1 px-2 py-1 rounded-md text-xs font-semibold text-green-700 bg-green-50 hover:bg-green-100 border border-green-200 transition-colors dark:bg-green-900/20 dark:text-green-400 dark:border-green-800 dark:hover:bg-green-900/40 whitespace-nowrap"
        >
            <FontAwesomeIcon icon={faCheckCircle} className="text-xs" />
            Confirm
        </button>
    );

    return (
        <>
            <OfflineOrdersBase
                orderType="pending"
                pageTitle="Pending Offline Orders"
                renderExtraFields={renderExtraFields}
                getExtraPayload={getExtraPayload}
                validateExtra={validateExtra}
                resetExtra={resetExtra}
                onEditSetExtra={onEditSetExtra}
                renderExtraActions={renderExtraActions}
                onReady={(api) => { baseApi.current = api; }}
                onStatsFetched={(s) => setPendingStats(s.pending)}   // ← NEW
                statsConfig={pendingStats ? [                         // ← NEW
                    {
                        label: 'Total Live QR',
                        value: pendingStats.totalLiveQr,
                        className: 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800',
                        labelClass: 'text-blue-600 dark:text-blue-400',
                        valueClass: 'text-blue-700 dark:text-blue-300',
                    },
                    {
                        label: 'Total Sample QR',
                        value: pendingStats.totalSampleQr,
                        className: 'bg-purple-50 border-purple-200 dark:bg-purple-900/20 dark:border-purple-800',
                        labelClass: 'text-purple-600 dark:text-purple-400',
                        valueClass: 'text-purple-700 dark:text-purple-300',
                    },
                ] : []}
                extraColumns={[
                    {
                        header: "Live QR Qty",
                        render: (item) => <span className="text-sm">{item.liveQrQuantity != null ? item.liveQrQuantity : "—"}</span>,
                    },
                    {
                        header: "Sample QR Qty",
                        render: (item) => <span className="text-sm">{item.sampleQrQuantity != null ? item.sampleQrQuantity : "—"}</span>,
                    },
                    {
                        header: "Price ( ₹ )",
                        render: (item) => <span className="text-sm">{item.price != null ? `₹ ${item.price}` : "—"}</span>,
                    },
                ]}
            />

            {confirmModal.isOpen && confirmModal.item && (
                <AddToConfirmModal
                    item={confirmModal.item}
                    onClose={() => setConfirmModal({ isOpen: false, item: null })}
                    onSuccess={() => {
                        setConfirmModal({ isOpen: false, item: null });
                        baseApi.current?.refresh();
                    }}
                />
            )}
        </>
    );
};

export default PendingOfflineOrders;