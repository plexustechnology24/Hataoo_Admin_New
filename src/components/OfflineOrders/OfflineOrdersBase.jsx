import { useCallback, useEffect, useRef, useState } from "react";
import axios from "axios";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "../../components/ui/table";
import { Button } from "react-bootstrap";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEdit, faPlus, faSearch, faTrash, faTimes } from "@fortawesome/free-solid-svg-icons";
import CustomPagination from "../../components/common/pagination";
import Loading from "../../components/loading";
import DeleteModal from "../../components/deleteModal";
import ContactNumberInput from "./ContactNumberInput";

/**
 * OfflineOrdersBase
 *
 * Shared base for ConfirmOfflineOrders and PendingOfflineOrders.
 *
 * Props
 * ─────
 * @param {string}   orderType            - 'confirm' | 'pending'  (sent in every API payload)
 * @param {string}   pageTitle            - Breadcrumb / page heading
 * @param {Function} renderExtraFields    - (isSubmitting, formErrors, setFormErrors) => JSX – rendered before Remarks
 * @param {Function} getExtraPayload      - () => object             – extra fields merged into POST/PATCH body
 * @param {Function} validateExtra        - () => object             – extra validation errors (field → message)
 * @param {Function} resetExtra           - () => void               – reset page-specific form state
 * @param {Function} onEditSetExtra       - (item) => void           – populate page-specific state from a record
 * @param {Array}    extraColumns         - [{ header, render }]     – extra table columns before Actions
 * @param {Function} renderExtraActions   - (item, refreshData) => JSX – extra action buttons rendered after Edit/Delete
 * @param {Function} onReady              - ({ refresh }) => void     – called on mount; exposes refresh() to the parent
 */
const OfflineOrdersBase = ({
    orderType,
    pageTitle,
    renderExtraFields,
    getExtraPayload,
    validateExtra,
    resetExtra,
    onEditSetExtra,
    extraColumns = [],
    renderExtraActions,
    onReady,
    statsConfig = [],
    onStatsFetched,
}) => {
    // ── Data / pagination ────────────────────────────────────────────────────
    const [loading, setLoading] = useState(true);
    const [filteredData, setFilteredData] = useState([]);
    const [meta, setMeta] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(15);

    // ── Search ───────────────────────────────────────────────────────────────
    const [searchTerm, setSearchTerm] = useState("");
    const searchContainerRef = useRef(null);

    // ── Selection / delete ───────────────────────────────────────────────────
    const [selectedItems, setSelectedItems] = useState([]);
    const [selectAll, setSelectAll] = useState(false);
    const [deleteModal, setDeleteModal] = useState({ isOpen: false, id: null, isBulk: false });
    const [isDeleting, setIsDeleting] = useState(false);

    // ── Modal / form ─────────────────────────────────────────────────────────
    const [visible, setVisible] = useState(false);
    const [id, setId] = useState(undefined);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Common form fields
    const [formDesignation, setFormDesignation] = useState("");
    const [formSocietyName, setFormSocietyName] = useState("");
    const [formContact1Name, setFormContact1Name] = useState("");
    const [formContact1, setFormContact1] = useState("");
    const [formRemarks, setFormRemarks] = useState("");
    const [formErrors, setFormErrors] = useState({});

    const indexOfFirstItem = (currentPage - 1) * itemsPerPage;
    const currentItems = filteredData;
    // ── Stats state ───────────────────────────────────────────────────────────
    const [stats, setStats] = useState(null);

    const getStats = useCallback(() => {
        axios
            .get('https://api.hataoo.in/api/offline-order/stats')
            .then((res) => setStats(res.data.data))
            .catch((err) => console.error('Stats fetch failed', err));
    }, []);

    useEffect(() => { getStats(); }, [getStats]);

    // ── Data fetching ────────────────────────────────────────────────────────
    const getData = useCallback(
        (page = 1, search = "") => {
            setLoading(true);
            const params = { page, limit: itemsPerPage, orderType };
            if (search.trim()) params.search = search.trim();

            axios
                .get("https://api.hataoo.in/api/offline-order/read", { params })
                .then((res) => {
                    setFilteredData(res.data.data || []);
                    setMeta(res.data.meta);
                    if (res.data.meta) setCurrentPage(res.data.meta.currentPage || page);
                    setSelectedItems([]);
                    setSelectAll(false);
                    getStats(); // ← NEW: Fetch stats after data is loaded
                })
                .catch((err) => {
                    console.error(err);
                    toast.error("No Data Found");
                })
                .finally(() => setLoading(false));
        },
        [itemsPerPage, orderType]
    );

    useEffect(() => {
        getData(1, "");
    }, [getData]);

    // Expose refresh() to parent via onReady callback
    useEffect(() => {
        if (onReady) onReady({ refresh: () => getData(currentPage, searchTerm) });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [onReady]);

    // ── Search handlers ──────────────────────────────────────────────────────
    const handleSearch = (e) => {
        const value = e.target.value;
        setSearchTerm(value);
        if (value.trim() === "") {
            setCurrentPage(1);
            getData(1, "");
        }
    };

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        setCurrentPage(1);
        getData(1, searchTerm.trim());
    };

    const handleClearSearch = () => {
        setSearchTerm("");
        setCurrentPage(1);
        getData(1, "");
    };

    // ── Select all / individual ──────────────────────────────────────────────
    const handleSelectAll = () => {
        if (!selectAll) setSelectedItems(currentItems.map((item) => item._id));
        else setSelectedItems([]);
        setSelectAll(!selectAll);
    };

    const handleSelectItem = (itemId) => {
        if (selectedItems.includes(itemId)) {
            setSelectedItems(selectedItems.filter((i) => i !== itemId));
            if (selectAll) setSelectAll(false);
        } else {
            const next = [...selectedItems, itemId];
            setSelectedItems(next);
            setSelectAll(currentItems.every((item) => next.includes(item._id)));
        }
    };

    useEffect(() => {
        if (currentItems.length > 0 && selectedItems.length > 0)
            setSelectAll(currentItems.every((item) => selectedItems.includes(item._id)));
        else setSelectAll(false);
    }, [currentItems, selectedItems]);

    // ── Delete ───────────────────────────────────────────────────────────────
    const openDeleteModal = (deleteId = null, isBulk = false) => {
        if (isBulk && selectedItems.length === 0) {
            toast.info("No items selected.");
            return;
        }
        setDeleteModal({ isOpen: true, id: deleteId, isBulk });
    };

    const closeDeleteModal = () => setDeleteModal({ isOpen: false, id: null, isBulk: false });

    const handleDelete = () => {
        axios
            .delete(`https://api.hataoo.in/api/offline-order/delete/${deleteModal.id}`)
            .then((res) => {
                const newPage =
                    currentItems.length === 1 && currentPage > 1 ? currentPage - 1 : currentPage;
                getData(newPage, searchTerm);
                closeDeleteModal();
                toast.success(res.data.message);
            })
            .catch(() => toast.error("An error occurred. Please try again."));
    };

    const handleDeleteSelected = () => {
        setIsDeleting(true);
        axios
            .post("https://api.hataoo.in/api/admin/deleteMultiple", {
                ids: selectedItems,
                TypeId: "5",
            })
            .then(() => {
                toast.success(`Successfully deleted ${selectedItems.length} items.`);
                const remaining = currentItems.length - selectedItems.length;
                const newPage = remaining <= 0 && currentPage > 1 ? currentPage - 1 : currentPage;
                getData(newPage, searchTerm);
            })
            .catch(() => toast.error("Failed to delete selected items."))
            .finally(() => {
                setIsDeleting(false);
                closeDeleteModal();
            });
    };

    // ── Form helpers ─────────────────────────────────────────────────────────
    const resetCommonForm = () => {
        setFormDesignation("");
        setFormSocietyName("");
        setFormContact1Name("");
        setFormContact1("");
        setFormRemarks("");
        setFormErrors({});
        setId(undefined);
    };

    const resetForm = () => {
        resetCommonForm();
        resetExtra?.();
    };

    const toggleModal = (mode) => {
        if (visible) {
            resetForm();
            setVisible(false);
        } else {
            if (mode === "add") resetForm();
            setVisible(true);
        }
    };

    const validateCommonForm = () => {
        const errs = {};
        if (!formSocietyName.trim()) errs.societyName = "Society Name is required";
        const phoneRegex = /^[0-9]{10}$/;
        if (formContact1.trim() && !phoneRegex.test(formContact1.trim()))
            errs.contact1 = "Contact must be exactly 10 digits";
        return errs;
    };

    // ── Submit ───────────────────────────────────────────────────────────────
    const handleSubmit = async (e) => {
        e.preventDefault();
        const commonErrs = validateCommonForm();
        const extraErrs = validateExtra?.() ?? {};
        const errs = { ...commonErrs, ...extraErrs };
        if (Object.keys(errs).length > 0) {
            setFormErrors(errs);
            return;
        }
        if (isSubmitting) return;
        try {
            setIsSubmitting(true);
            const payload = {
                orderType,
                designation: formDesignation.trim(),
                societyName: formSocietyName.trim(),
                contact1Name: formContact1Name.trim(),
                contact1: formContact1.trim(),
                remarks: formRemarks.trim(),
                ...(getExtraPayload?.() ?? {}),
            };
            if (id) {
                const res = await axios.patch(
                    `https://api.hataoo.in/api/offline-order/update/${id}`,
                    payload
                );
                toast.success(res.data.message || "Successfully updated");
            } else {
                await axios.post("https://api.hataoo.in/api/offline-order/create", payload);
                toast.success("Successfully created");
            }
            resetForm();
            setVisible(false);
            getData(currentPage, searchTerm);
        } catch (err) {
            toast.error(err.response?.data?.message || "An error occurred. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEdit = (item) => {
        setId(item._id);
        setFormDesignation(item.designation || "");
        setFormSocietyName(item.societyName || "");
        setFormContact1Name(item.contact1Name || "");
        setFormContact1(item.contact1 || "");
        setFormRemarks(item.remarks || "");
        setFormErrors({});
        onEditSetExtra?.(item);
        setVisible(true);
    };

    const handleCopy = (text, label) => {
        navigator.clipboard
            .writeText(text)
            .then(() => toast.success(`${label} copied!`))
            .catch(() => toast.error("Failed to copy"));
    };

    const clearAllFilters = () => {
        setSearchTerm("");
        setSelectedItems([]);
        setSelectAll(false);
        setCurrentPage(1);
        getData(1, "");
        toast.info("All filters cleared");
    };

    const hasActiveFilters = searchTerm || selectedItems.length > 0;

    // refresh helper passed to renderExtraActions so child popups can reload the list
    const refreshData = () => getData(currentPage, searchTerm);

    if (loading) return <Loading />;

    return (
        <div className="flex flex-col h-[calc(100vh-120px)]">
            <PageBreadcrumb pageTitle={pageTitle} />

            {/* ── Stats bar ── */}
            {stats && (
                <div className="flex flex-wrap gap-3 px-6 py-4">
                    <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-indigo-50 border border-indigo-200 dark:bg-indigo-900/20 dark:border-indigo-800">
                        <div className="w-2 h-2 rounded-full bg-indigo-400 flex-shrink-0" />
                        <span className="text-xs font-bold uppercase tracking-wide text-indigo-600 dark:text-indigo-400">
                            Total Qty
                        </span>
                        <span className="text-base font-extrabold text-indigo-700 dark:text-indigo-300">
                            {stats.totalCombinedQty}
                        </span>
                    </div>

                    <p className="h-full flex items-center">=</p>

                    {/* Pill 2 — Confirm */}
                    <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-green-50 border border-green-200 dark:bg-green-900/20 dark:border-green-800">
                        <div className="w-2 h-2 rounded-full bg-green-400 flex-shrink-0" />
                        <span className="text-xs font-bold uppercase tracking-wide text-green-600 dark:text-green-400">
                            Total Confirm Qty
                        </span>
                        <span className="text-base font-extrabold text-green-700 dark:text-green-300">
                            {stats.totalConfirmQty}
                        </span>
                    </div>

                    <p className="h-full flex items-center">+</p>


                    {/* Pill 1 — Pending */}
                    <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-yellow-50 border border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800">
                        <div className="w-2 h-2 rounded-full bg-yellow-400 flex-shrink-0" />
                        <span className="text-xs font-bold uppercase tracking-wide text-yellow-600 dark:text-yellow-400">
                            Total Pending Qty
                        </span>
                        <span className="text-base font-extrabold text-yellow-700 dark:text-yellow-300">
                            {stats.totalPendingQty}
                        </span>
                    </div>


                </div>
            )}
            <div className="flex-1 overflow-y-auto overflow-x-hidden">
                <div className="rounded-2xl border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">

                    {/* ── Header bar ── */}
                    <div className="px-6 pt-5">
                        <div className="flex justify-between items-center px-4 py-3 mt-4 gap-4 flex-wrap">

                            {/* Left: bulk delete + clear */}
                            <div className="flex gap-4 items-center">
                                {selectedItems.length > 0 && (
                                    <Button
                                        onClick={() => openDeleteModal(null, true)}
                                        disabled={isDeleting}
                                        variant="danger"
                                        className="d-flex align-items-center gap-2 py-1"
                                        style={{ fontSize: "14px", color: "#f13838", border: "none" }}
                                    >
                                        {isDeleting ? (
                                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                        ) : (
                                            <>
                                                <FontAwesomeIcon icon={faTrash} className="pe-2" />
                                                <span>DELETE SELECTED ({selectedItems.length})</span>
                                            </>
                                        )}
                                    </Button>
                                )}
                                {hasActiveFilters && (
                                    <Button
                                        onClick={clearAllFilters}
                                        variant="outline-secondary"
                                        className="d-flex align-items-center gap-2 py-1 border-0 bg-transparent"
                                        style={{ fontSize: "14px", color: "#f13838" }}
                                    >
                                        CLEAR ALL
                                    </Button>
                                )}
                            </div>

                            {/* Right: search + add */}
                            <div className="flex gap-3 items-center flex-wrap">
                                <div ref={searchContainerRef} className="relative">
                                    <form onSubmit={handleSearchSubmit}>
                                        <div className="relative flex align-middle justify-center">
                                            <span className="absolute -translate-y-1/2 pointer-events-none left-4 top-1/2">
                                                <svg
                                                    className="fill-gray-500 dark:fill-gray-400"
                                                    width="20" height="20" viewBox="0 0 20 20"
                                                    fill="none" xmlns="http://www.w3.org/2000/svg"
                                                >
                                                    <path
                                                        fillRule="evenodd" clipRule="evenodd"
                                                        d="M3.04175 9.37363C3.04175 5.87693 5.87711 3.04199 9.37508 3.04199C12.8731 3.04199 15.7084 5.87693 15.7084 9.37363C15.7084 12.8703 12.8731 15.7053 9.37508 15.7053C5.87711 15.7053 3.04175 12.8703 3.04175 9.37363ZM9.37508 1.54199C5.04902 1.54199 1.54175 5.04817 1.54175 9.37363C1.54175 13.6991 5.04902 17.2053 9.37508 17.2053C11.2674 17.2053 13.003 16.5344 14.357 15.4176L17.177 18.238C17.4699 18.5309 17.9448 18.5309 18.2377 18.238C18.5306 17.9451 18.5306 17.4703 18.2377 17.1774L15.418 14.3573C16.5365 13.0033 17.2084 11.2669 17.2084 9.37363C17.2084 5.04817 13.7011 1.54199 9.37508 1.54199Z"
                                                        fill=""
                                                    />
                                                </svg>
                                            </span>
                                            <input
                                                type="text"
                                                placeholder="Search name, society, contact..."
                                                aria-label="Search"
                                                value={searchTerm}
                                                onChange={handleSearch}
                                                className="dark:bg-dark-900 h-11 w-full rounded-lg border border-gray-200 bg-transparent py-2.5 pl-12 pr-14 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-none focus:ring focus:ring-brand-500/10 dark:border-gray-800 dark:bg-gray-900 dark:bg-white/[0.03] dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800 xl:w-[300px]"
                                            />
                                            <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
                                                {searchTerm && (
                                                    <button
                                                        type="button"
                                                        className="inline-flex items-center px-[7px] py-[4.5px] text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400"
                                                        onClick={handleClearSearch}
                                                    >
                                                        <FontAwesomeIcon icon={faTimes} />
                                                    </button>
                                                )}
                                                <button
                                                    type="submit"
                                                    className="inline-flex items-center px-[7px] py-[4.5px] text-xs text-gray-500 hover:text-blue-600"
                                                >
                                                    <FontAwesomeIcon icon={faSearch} />
                                                </button>
                                            </div>
                                        </div>
                                    </form>
                                </div>

                                <Button
                                    onClick={() => toggleModal("add")}
                                    className="rounded-md border-0 shadow-md px-4 py-2 text-white"
                                    style={{ background: "#7C7FFF" }}
                                >
                                    <FontAwesomeIcon icon={faPlus} className="pe-2" /> Add Order
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* ── Table ── */}
                    <div className="p-4 border-gray-100 dark:border-gray-800 sm:p-6 overflow-auto">
                        <div className="space-y-6 rounded-lg xl:border dark:border-gray-800">
                            <Table>
                                <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                                    <TableRow>
                                        <TableCell isHeader className="py-4 font-medium text-gray-500 px-2 border-r border-gray-200 dark:border-gray-700 w-10">
                                            <div className="flex items-center justify-center">
                                                <input
                                                    type="checkbox"
                                                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                                    checked={selectAll}
                                                    onChange={handleSelectAll}
                                                />
                                            </div>
                                        </TableCell>
                                        <TableCell isHeader className="py-4 font-medium text-gray-500 px-2 border-r border-gray-200 dark:border-gray-700 w-12">#</TableCell>
                                        <TableCell isHeader className="py-4 font-medium text-gray-500 px-2 border-r border-gray-200 dark:border-gray-700">Society Name</TableCell>
                                        <TableCell isHeader className="py-4 font-medium text-gray-500 px-2 border-r border-gray-200 dark:border-gray-700">Designation</TableCell>
                                        <TableCell isHeader className="py-4 font-medium text-gray-500 px-2 border-r border-gray-200 dark:border-gray-700">Contact</TableCell>
                                        <TableCell isHeader className="py-4 font-medium text-gray-500 px-2 border-r border-gray-200 dark:border-gray-700">Remarks</TableCell>
                                        {extraColumns.map((col) => (
                                            <TableCell key={col.header} isHeader className="py-4 font-medium text-gray-500 px-2 border-r border-gray-200 dark:border-gray-700">
                                                {col.header}
                                            </TableCell>
                                        ))}
                                        <TableCell isHeader className="py-4 font-medium text-gray-500 px-2 border-r border-gray-200 dark:border-gray-700 w-24">Actions</TableCell>
                                    </TableRow>
                                </TableHeader>

                                <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                                    {currentItems.length > 0 ? (
                                        currentItems.map((item, index) => (
                                            <TableRow key={item._id}>
                                                <TableCell className="py-3 px-2 border-r border-gray-200 dark:border-gray-700">
                                                    <div className="flex items-center justify-center">
                                                        <input
                                                            type="checkbox"
                                                            className="w-4 h-4 text-blue-600 border-gray-300 rounded"
                                                            checked={selectedItems.includes(item._id)}
                                                            onChange={() => handleSelectItem(item._id)}
                                                        />
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-center px-2 border-r border-gray-200 dark:border-gray-700 dark:text-gray-400">
                                                    {indexOfFirstItem + index + 1}
                                                </TableCell>
                                                <TableCell className="py-3 px-3 border-r border-gray-200 dark:border-gray-700 text-center">
                                                    <span className="text-sm font-medium text-indigo-600 dark:text-indigo-400">
                                                        {item.societyName || "—"}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="py-3 px-3 border-r border-gray-200 dark:border-gray-700 dark:text-gray-400 text-center">
                                                    <span className="text-sm">{item.designation || "—"}</span>
                                                </TableCell>

                                                {/* Contact */}
                                                <TableCell className="py-3 px-3 border-r border-gray-200 dark:border-gray-700 text-center">
                                                    {item.contact1Name && (
                                                        <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-0.5 leading-none">
                                                            {item.contact1Name}
                                                        </p>
                                                    )}
                                                    <div className="flex items-center gap-1.5 justify-center">
                                                        <span className="text-sm dark:text-gray-300">
                                                            {item.contact1 || "—"}
                                                        </span>
                                                        {item.contact1 && (
                                                            <button
                                                                onClick={() => handleCopy(item.contact1, "Contact")}
                                                                title="Copy"
                                                                className="text-gray-400 hover:text-indigo-600 transition-colors flex-shrink-0"
                                                            >
                                                                <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                                    <rect x="9" y="9" width="13" height="13" rx="2" />
                                                                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                                                                </svg>
                                                            </button>
                                                        )}
                                                    </div>
                                                </TableCell>

                                                <TableCell className="py-3 px-3 border-r border-gray-200 dark:border-gray-700 dark:text-gray-400 text-center">
                                                    <div className="text-sm max-w-[180px] truncate" title={item.remarks}>
                                                        {item.remarks || "—"}
                                                    </div>
                                                </TableCell>

                                                {/* ── Page-specific extra columns ── */}
                                                {extraColumns.map((col) => (
                                                    <TableCell key={col.header} className="py-3 px-3 border-r border-gray-200 dark:border-gray-700 text-center dark:text-gray-400">
                                                        {col.render(item)}
                                                    </TableCell>
                                                ))}

                                                {/* ── Actions ── */}
                                                <TableCell className="py-3 px-2 border-r border-gray-200 dark:border-gray-700">
                                                    <div className="flex items-center justify-center gap-3 flex-wrap">
                                                        <button
                                                            style={{ color: "#0385C3" }}
                                                            onClick={() => handleEdit(item)}
                                                            title="Edit"
                                                        >
                                                            <FontAwesomeIcon icon={faEdit} className="text-lg" />
                                                        </button>
                                                        <button
                                                            className="text-red-600"
                                                            onClick={() => openDeleteModal(item._id)}
                                                            title="Delete"
                                                        >
                                                            <FontAwesomeIcon icon={faTrash} className="text-lg" />
                                                        </button>
                                                        {/* ── Page-specific extra actions (e.g. "Add to Confirm") ── */}
                                                        {renderExtraActions?.(item, refreshData)}
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={7 + extraColumns.length} className="text-center pt-5 pb-4 dark:text-gray-400">
                                                {searchTerm
                                                    ? `No results found for "${searchTerm}"`
                                                    : "No Data Found"}
                                            </td>
                                        </tr>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Pagination ── */}
            <div className="w-full border-t dark:bg-gray-900 dark:border-gray-700 mt-0">
                <CustomPagination
                    currentPage={currentPage}
                    totalPages={meta ? meta.totalPages : 1}
                    onPageChange={(page) => {
                        setCurrentPage(page);
                        setSelectedItems([]);
                        setSelectAll(false);
                        getData(page, searchTerm);
                    }}
                    itemsPerPage={itemsPerPage}
                    totalItems={meta ? meta.total : filteredData.length}
                />
            </div>

            {/* ── Add / Edit Modal ── */}
            {visible && (
                <div className="fixed inset-0 z-[99999] flex items-center justify-center">
                    <div
                        className="fixed inset-0 bg-black bg-opacity-50"
                        onClick={() => !isSubmitting && toggleModal()}
                    />
                    <div className="relative bg-white rounded-lg w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto dark:bg-gray-800">
                        <div className="px-6 py-4 border-b dark:border-gray-700">
                            <h3 className="text-xl font-semibold dark:text-white">
                                {id ? "Edit Order" : "Add Order"}
                            </h3>
                        </div>
                        <div className="px-6 py-4">
                            <form onSubmit={handleSubmit}>

                                {/* Society Name */}
                                <div className="mb-4">
                                    <label className="block font-medium mb-1 text-sm dark:text-gray-300">
                                        Society Name <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={formSocietyName}
                                        onChange={(e) => {
                                            setFormSocietyName(e.target.value);
                                            if (formErrors.societyName)
                                                setFormErrors((p) => { const err = { ...p }; delete err.societyName; return err; });
                                        }}
                                        placeholder="Enter society name"
                                        className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 dark:bg-gray-700 dark:text-white dark:border-gray-600 ${formErrors.societyName ? "border-red-500" : "border-gray-300"}`}
                                        disabled={isSubmitting}
                                    />
                                    {formErrors.societyName && (
                                        <p className="text-red-500 text-xs mt-1">{formErrors.societyName}</p>
                                    )}
                                </div>

                                {/* Designation */}
                                <div className="mb-4">
                                    <label className="block font-medium mb-1 text-sm dark:text-gray-300">Designation</label>
                                    <input
                                        type="text"
                                        value={formDesignation}
                                        onChange={(e) => setFormDesignation(e.target.value)}
                                        placeholder="Enter designation"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 dark:bg-gray-700 dark:text-white dark:border-gray-600"
                                        disabled={isSubmitting}
                                    />
                                </div>

                                {/* Contact */}
                                <div className="mb-4 p-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/40">
                                    <p className="text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-2.5">Contact</p>
                                    <div className="flex gap-3">
                                        <div className="flex-1">
                                            <label className="block text-xs font-medium mb-1 text-gray-500 dark:text-gray-400">Name</label>
                                            <input
                                                type="text"
                                                value={formContact1Name}
                                                onChange={(e) => setFormContact1Name(e.target.value)}
                                                placeholder="e.g. John Doe"
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 dark:bg-gray-700 dark:text-white dark:border-gray-600"
                                                disabled={isSubmitting}
                                            />
                                        </div>
                                        <ContactNumberInput
                                            value={formContact1}
                                            onChange={(val) => {
                                                setFormContact1(val);
                                                if (formErrors.contact1)
                                                    setFormErrors((p) => { const e = { ...p }; delete e.contact1; return e; });
                                            }}
                                            error={formErrors.contact1}
                                            disabled={isSubmitting}
                                        />
                                    </div>
                                </div>

                                {/* ── Page-specific extra fields rendered before Remarks ── */}
                                {renderExtraFields?.(isSubmitting, formErrors, setFormErrors)}

                                {/* Remarks — always last */}
                                <div className="mb-4">
                                    <label className="block font-medium mb-1 text-sm dark:text-gray-300">Remarks</label>
                                    <textarea
                                        value={formRemarks}
                                        onChange={(e) => setFormRemarks(e.target.value)}
                                        placeholder="Enter any remarks..."
                                        rows={3}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 resize-none dark:bg-gray-700 dark:text-white dark:border-gray-600"
                                        disabled={isSubmitting}
                                    />
                                </div>

                                <div className="flex gap-4 mt-6">
                                    <button
                                        type="button"
                                        onClick={() => toggleModal()}
                                        disabled={isSubmitting}
                                        className="w-1/2 py-2 px-4 bg-gray-100 text-black rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="w-1/2 py-2 px-4 text-white rounded-lg transition-colors disabled:opacity-50"
                                        style={{ backgroundColor: "#7C7FFF" }}
                                    >
                                        {isSubmitting ? (
                                            <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin mx-auto" />
                                        ) : id ? "Update" : "Submit"}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            <DeleteModal
                isOpen={deleteModal.isOpen}
                isBulk={deleteModal.isBulk}
                selectedCount={selectedItems.length}
                value={"order"}
                isDeleting={isDeleting}
                onClose={closeDeleteModal}
                onConfirm={deleteModal.isBulk ? handleDeleteSelected : handleDelete}
            />

            <ToastContainer position="top-center" className="!z-[99999]" />
        </div>
    );
};

export default OfflineOrdersBase;