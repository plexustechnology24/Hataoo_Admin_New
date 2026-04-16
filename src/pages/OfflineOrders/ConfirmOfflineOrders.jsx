import { useState } from "react";
import OfflineOrdersBase from "../../components/OfflineOrders/OfflineOrdersBase";

const ConfirmOfflineOrders = () => {
    const [quantity, setQuantity] = useState("");
    const [price, setPrice] = useState("");
    const [confirmStats, setConfirmStats] = useState(null);   // ← NEW

    // ── Reset extra state when form is cleared ────────────────────────────────
    const resetExtra = () => {
        setQuantity("");
        setPrice("");
    };

    // ── Populate extra state when editing a record ────────────────────────────
    const onEditSetExtra = (item) => {
        setQuantity(item.quantity != null ? String(item.quantity) : "");
        setPrice(item.price != null ? String(item.price) : "");
    };

    // ── Merge extra fields into submit payload ────────────────────────────────
    const getExtraPayload = () => ({
        quantity: quantity !== "" ? Number(quantity) : null,
        price: price !== "" ? Number(price) : null,
    });

    // ── Page-specific validation ──────────────────────────────────────────────
    const validateExtra = () => {
        const errs = {};
        if (quantity !== "" && (isNaN(Number(quantity)) || Number(quantity) < 0))
            errs.quantity = "Quantity must be a non-negative number";
        if (price !== "" && (isNaN(Number(price)) || Number(price) < 0))
            errs.price = "Price must be a non-negative number";
        return errs;
    };

    // ── Extra form fields JSX (quantity first, then price) ────────────────────
    // renderExtraFields receives: (isSubmitting, formErrors, setFormErrors)
    const renderExtraFields = (isSubmitting, formErrors, setFormErrors) => (
        <div className="mb-4 p-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/40">
            <p className="text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-2.5">
                Order Details
            </p>
            <div className="flex gap-3">
                {/* Quantity */}
                <div className="flex-1">
                    <label className="block text-xs font-medium mb-1 text-gray-500 dark:text-gray-400">
                        Quantity
                    </label>
                    <input
                        type="number"
                        min="0"
                        value={quantity}
                        onChange={(e) => {
                            setQuantity(e.target.value);
                            if (formErrors?.quantity)
                                setFormErrors((p) => {
                                    const err = { ...p };
                                    delete err.quantity;
                                    return err;
                                });
                        }}
                        placeholder="Enter quantity"
                        className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400
                            dark:bg-gray-700 dark:text-white dark:border-gray-600
                            ${formErrors?.quantity ? "border-red-500" : "border-gray-300"}`}
                        disabled={isSubmitting}
                    />
                    {formErrors?.quantity && (
                        <p className="text-red-500 text-xs mt-1">{formErrors.quantity}</p>
                    )}
                </div>

                {/* Price */}
                <div className="flex-1">
                    <label className="block text-xs font-medium mb-1 text-gray-500 dark:text-gray-400">
                        Price
                    </label>
                    <input
                        type="number"
                        min="0"
                        value={price}
                        onChange={(e) => {
                            setPrice(e.target.value);
                            if (formErrors?.price)
                                setFormErrors((p) => {
                                    const err = { ...p };
                                    delete err.price;
                                    return err;
                                });
                        }}
                        placeholder="Enter price in ₹"
                        className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400
                            dark:bg-gray-700 dark:text-white dark:border-gray-600
                            ${formErrors?.price ? "border-red-500" : "border-gray-300"}`}
                        disabled={isSubmitting}
                    />
                    {formErrors?.price && (
                        <p className="text-red-500 text-xs mt-1">{formErrors.price}</p>
                    )}
                </div>
            </div>
        </div>
    );

    return (
        <OfflineOrdersBase
            orderType="confirm"
            pageTitle="Confirm Offline Orders"
            renderExtraFields={renderExtraFields}
            getExtraPayload={getExtraPayload}
            validateExtra={validateExtra}
            resetExtra={resetExtra}
            onEditSetExtra={onEditSetExtra}
            onStatsFetched={(s) => setConfirmStats(s.confirm)}   // ← NEW
            statsConfig={confirmStats ? [                         // ← NEW
                {
                    label: 'Total Quantity',
                    value: confirmStats.totalQuantity,
                    className: 'bg-teal-50 border-teal-200 dark:bg-teal-900/20 dark:border-teal-800',
                    labelClass: 'text-teal-600 dark:text-teal-400',
                    valueClass: 'text-teal-700 dark:text-teal-300',
                },
            ] : []}
            extraColumns={[
                {
                    header: "Quantity",
                    render: (item) => (
                        <span className="text-sm">
                            {item.quantity != null ? item.quantity : "—"}
                        </span>
                    ),
                },
                {
                    header: "Price ( ₹ )",
                    render: (item) => (
                        <span className="text-sm">
                            {item.price != null ? `₹ ${item.price}` : "—"}
                        </span>
                    ),
                },
            ]}
        />
    );
};

export default ConfirmOfflineOrders;