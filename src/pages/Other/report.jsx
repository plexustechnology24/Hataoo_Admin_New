import React, { useCallback, useEffect, useState } from "react";
import axios from "axios";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import { Button } from "react-bootstrap";
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faSearch, faTrash, faTimes, faLock, faUnlock,
    faQrcode, faEye,
} from "@fortawesome/free-solid-svg-icons";
import CustomPagination from "../../components/common/pagination";
import Loading from "../../components/loading";
import DeleteModal from "../../components/deleteModal";

// ─── Detail Modal ──────────────────────────────────────────────────────────────
const DetailModal = ({ item, onClose, onDelete, onToggleBlock, blockingId }) => {
    if (!item) return null;
    const isBlocked = item.isBlocked;
    const isProcessing = blockingId === item._id;
    const reqCount = item.requestCount ?? 0;

    return (
        <div
            className="fixed inset-0 bg-black/55 backdrop-blur-sm z-[1050] flex items-center justify-center p-4 animate-fade-in"
            onClick={onClose}
        >
            <div
                className="bg-white dark:bg-[#1a1a2e] dark:border dark:border-[#2a2a40] rounded-2xl shadow-2xl w-full max-w-[560px] max-h-[88vh] overflow-hidden flex flex-col"
                onClick={e => e.stopPropagation()}
            >
                {/* Head */}
                <div className="px-5 pt-[18px] pb-[14px] border-b border-gray-100 dark:border-[#2a2a40] flex items-start justify-between gap-3 flex-shrink-0">
                    <div>
                        <p className="text-[15px] font-bold text-slate-900 dark:text-slate-200 m-0 mb-0.5">
                            <FontAwesomeIcon icon={faQrcode} className="mr-2 text-blue-500" />
                            {item.code}
                        </p>
                        <p className="text-[12px] text-slate-400 m-0">
                            {reqCount} request{reqCount !== 1 ? 's' : ''} recorded
                        </p>
                    </div>
                    <button
                        className="w-[30px] h-[30px] rounded-lg border border-gray-200 dark:border-[#2a2a40] bg-transparent cursor-pointer text-gray-500 dark:text-slate-400 text-base flex items-center justify-center hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors"
                        onClick={onClose}
                    >
                        ✕
                    </button>
                </div>

                {/* Body */}
                <div className="px-5 py-4 overflow-y-auto flex-1">
                    {(!item.requests || item.requests.length === 0) ? (
                        <div className="text-center py-16 text-gray-400 text-sm">
                            <div className="text-4xl mb-3 opacity-40">
                                <FontAwesomeIcon icon={faQrcode} />
                            </div>
                            No requests recorded yet.
                        </div>
                    ) : (
                        item.requests.map((req) => (
                            <div
                                key={req._id}
                                className="bg-slate-50 dark:bg-[#12122a] border border-gray-100 dark:border-[#2a2a40] rounded-xl px-[14px] py-3 mb-2.5 hover:border-blue-100 dark:hover:border-[#3b4a6b] transition-colors"
                            >
                                <div className="flex items-center justify-between mb-1">
                                    <span className="text-[13px] font-semibold text-slate-800 dark:text-slate-200">
                                        {req.name || '—'}
                                    </span>
                                    <span className="text-[11px] text-slate-400">
                                        {req.createdAt ? new Date(req.createdAt).toLocaleString() : '—'}
                                    </span>
                                </div>
                                <div className="text-[12px] text-slate-500 dark:text-gray-500 mb-1">
                                    {req.phone || '—'}
                                </div>
                                <div className="text-[12px] text-gray-700 dark:text-gray-400 leading-[1.55]">
                                    {req.message || '—'}
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Footer */}
                <div className="px-5 py-3 border-t border-gray-100 dark:border-[#2a2a40] flex items-center justify-end gap-2 flex-shrink-0">
                    <button
                        className="h-[34px] px-4 rounded-lg text-[12px] font-semibold cursor-pointer inline-flex items-center gap-1.5 border border-gray-200 dark:border-[#2a2a40] bg-transparent text-gray-500 hover:bg-slate-100 transition-colors"
                        onClick={onClose}
                    >
                        Close
                    </button>
                    <button
                        className={`h-[34px] px-4 rounded-lg text-[12px] font-semibold cursor-pointer inline-flex items-center gap-1.5 text-white border-none transition-colors ${isBlocked ? 'bg-green-500 hover:bg-green-600' : 'bg-orange-500 hover:bg-orange-600'}`}
                        onClick={() => { onToggleBlock(item); onClose(); }}
                        disabled={isProcessing}
                    >
                        {isProcessing
                            ? <span className="animate-spin inline-block">⟳</span>
                            : <FontAwesomeIcon icon={isBlocked ? faUnlock : faLock} />
                        }
                        {isBlocked ? 'Unblock' : 'Block'}
                    </button>
                    <button
                        className="h-[34px] px-4 rounded-lg text-[12px] font-semibold cursor-pointer inline-flex items-center gap-1.5 text-white bg-red-500 hover:bg-red-600 border-none transition-colors"
                        onClick={() => { onClose(); onDelete(item._id); }}
                    >
                        <FontAwesomeIcon icon={faTrash} />
                        Delete
                    </button>
                </div>
            </div>
        </div>
    );
};

// ─── Single QR Card ────────────────────────────────────────────────────────────
const QrCard = ({
    item, isSelected, isProcessing,
    onSelect, onOpenDetail,
    onToggleBlock, onDelete,
    animDelay,
}) => {
    const hot = (item.requestCount ?? 0) >= 5;
    const isBlocked = item.isBlocked;
    const reqCount = item.requestCount ?? 0;

    return (
        <div
            className={[
                "bg-white dark:bg-[#1a1a2e] rounded-2xl border overflow-hidden flex flex-col",
                "transition-all duration-[180ms] ease-in-out",
                "opacity-0 animate-[cardin_0.22s_ease_forwards]",
                hot
                    ? "border-red-300"
                    : "border-gray-100 dark:border-[#2a2a40]",
                isSelected
                    ? "border-blue-400 shadow-[0_0_0_3px_rgba(96,165,250,0.18)]"
                    : "",
            ].join(' ')}
            style={{ animationDelay: `${animDelay}ms` }}
        >
            {/* Top image area */}
            <div className="relative bg-slate-50 dark:bg-[#12122a] flex items-center justify-center px-4 pt-[22px] pb-4 min-h-[136px]">
                {/* Checkbox */}
                <div className="absolute top-2.5 left-2.5 z-[2]">
                    <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => onSelect(item._id)}
                        className="w-[15px] h-[15px] accent-blue-500 cursor-pointer rounded"
                    />
                </div>

                {/* Blocked ribbon */}
                {isBlocked && (
                    <div className="absolute top-2.5 right-2.5 bg-red-100 dark:bg-red-900/25 text-red-700 dark:text-red-300 text-[9px] font-bold px-2 py-[3px] rounded-full flex items-center gap-1 uppercase tracking-wide">
                        <FontAwesomeIcon icon={faLock} className="text-[9px]" />
                        Blocked
                    </div>
                )}

                {/* QR Image */}
                {item.qrImage ? (
                    <img
                        src={item.qrImage}
                        alt={`QR-${item.code}`}
                        className="w-[88px] h-[88px] rounded-[10px] border bg-white border-gray-200 dark:border-[#3a3a5c] object-cover cursor-pointer transition-all duration-150 hover:opacity-85 hover:scale-[1.04]"
                        title="Click to preview QR"
                    />
                ) : (
                    <div className="w-[88px] h-[88px] rounded-[10px] border-2 border-dashed border-gray-300 dark:border-[#3a3a5c] flex items-center justify-center text-gray-400 text-[26px]">
                        <FontAwesomeIcon icon={faQrcode} />
                    </div>
                )}
            </div>

            {/* Body */}
            <div className="px-3.5 pt-3.5 pb-2.5 flex-1 flex flex-col items-center gap-2">
                <div className={`font-mono text-[13px] font-semibold tracking-wide text-center ${hot ? 'text-red-700 dark:text-red-300' : 'text-slate-800 dark:text-slate-200'}`}>
                    {item.code || '—'}
                </div>
                <button
                    className={`inline-flex items-center gap-1.5 px-4 py-1 rounded-full text-sm font-medium cursor-pointer border-none outline-none transition-all duration-150 hover:opacity-85 hover:scale-[0.97] ${hot
                        ? 'bg-gradient-to-br from-red-500 to-orange-500 text-white shadow-[0_2px_8px_rgba(239,68,68,0.25)]'
                        : 'bg-slate-100 dark:bg-[#1e2a45] text-slate-600 dark:text-slate-400'
                        }`}
                    onClick={() => onOpenDetail(item)}
                    title="View all requests"
                >
                    {reqCount} req{reqCount !== 1 ? 's' : ''}
                </button>
            </div>

            {/* Actions footer */}
            <div className="flex border-t border-gray-100 dark:border-[#2a2a40]">
                {/* View Details */}
                <button
                    className="flex-1 h-9 border-none bg-transparent text-[11px] font-semibold cursor-pointer flex items-center justify-center gap-1.5 text-blue-600 tracking-wide border-r border-gray-100 dark:border-[#2a2a40] hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-colors"
                    onClick={() => onOpenDetail(item)}
                    title="View details"
                >
                    <FontAwesomeIcon icon={faEye} className="text-[11px]" />
                    Details
                </button>

                {/* Block / Unblock */}
                <button
                    className={`flex-1 h-9 border-none bg-transparent text-[11px] font-semibold cursor-pointer flex items-center justify-center gap-1.5 tracking-wide border-r border-gray-100 dark:border-[#2a2a40] transition-colors ${isBlocked
                        ? 'text-green-600 hover:bg-green-50 dark:hover:bg-green-900/10'
                        : 'text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10'
                        }`}
                    onClick={() => onToggleBlock(item)}
                    disabled={isProcessing}
                    title={isBlocked ? 'Unblock' : 'Block'}
                >
                    {isProcessing
                        ? <span className="animate-spin text-[11px]">⟳</span>
                        : <FontAwesomeIcon icon={isBlocked ? faUnlock : faLock} className="text-[11px]" />
                    }
                    {isBlocked ? 'Unblock' : 'Block'}
                </button>

                {/* Delete */}
                <button
                    className="flex-1 h-9 border-none bg-transparent text-[11px] font-semibold cursor-pointer flex items-center justify-center gap-1.5 text-slate-500 tracking-wide hover:bg-red-50 dark:hover:bg-red-900/10 hover:text-red-600 dark:hover:text-red-300 transition-colors"
                    onClick={() => onDelete(item._id)}
                    title="Delete"
                >
                    <FontAwesomeIcon icon={faTrash} className="text-[11px]" />
                </button>
            </div>
        </div>
    );
};

// ─── Main Report Component ─────────────────────────────────────────────────────
const Report = () => {
    const [meta, setMeta] = useState(null);
    const [loading, setLoading] = useState(true);
    const [filteredData, setFilteredData] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(15);
    const [deleteModal, setDeleteModal] = useState({ isOpen: false, id: null, isBulk: false });
    const [blockingId, setBlockingId] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedItems, setSelectedItems] = useState([]);
    const [selectAll, setSelectAll] = useState(false);
    const [detailModal, setDetailModal] = useState({ isOpen: false, item: null });

    const currentItems = filteredData;

    // ─── Search ──────────────────────────────────────────────────────────────────
    const handleSearch = (e) => {
        const value = e.target.value;
        setSearchTerm(value);
        if (value.trim() === '') { setCurrentPage(1); getData(1, ''); }
    };
    const handleSearchSubmit = (e) => { e.preventDefault(); setCurrentPage(1); getData(1, searchTerm.trim()); };
    const handleClearSearch = () => { setSearchTerm(''); setCurrentPage(1); getData(1, ''); };

    // ─── Fetch data ───────────────────────────────────────────────────────────────
    const getData = useCallback((page = 1, search = '') => {
        setLoading(true);
        const params = { page, limit: itemsPerPage };
        if (search && search.trim() !== '') params.search = search.trim();

        axios.get('https://api.hataoo.in/api/contact/report/read', { params })
            .then((res) => {
                const responseData = res.data.data || [];
                const responsePagination = res.data.meta;
                setFilteredData(responseData);
                setMeta(responsePagination);
                if (responsePagination) setCurrentPage(responsePagination.currentPage || page);
                setSelectedItems([]);
                setSelectAll(false);
            })
            .catch((err) => { console.error(err); toast.error("No Data Found"); })
            .finally(() => setLoading(false));
    }, [itemsPerPage]);

    useEffect(() => { getData(1, ''); }, [getData]);

    // ─── Select all / individual ──────────────────────────────────────────────────
    const handleSelectAll = () => {
        if (!selectAll) setSelectedItems(currentItems.map(item => item._id));
        else setSelectedItems([]);
        setSelectAll(!selectAll);
    };

    const handleSelectItem = (itemId) => {
        if (selectedItems.includes(itemId)) {
            setSelectedItems(selectedItems.filter(i => i !== itemId));
            if (selectAll) setSelectAll(false);
        } else {
            const next = [...selectedItems, itemId];
            setSelectedItems(next);
            setSelectAll(currentItems.every(item => next.includes(item._id)));
        }
    };

    useEffect(() => {
        if (currentItems.length > 0 && selectedItems.length > 0)
            setSelectAll(currentItems.every(item => selectedItems.includes(item._id)));
        else setSelectAll(false);
    }, [currentItems, selectedItems]);

    // ─── Delete single ────────────────────────────────────────────────────────────
    const openDeleteModal = (deleteId = null, isBulk = false) => {
        if (isBulk && selectedItems.length === 0) { toast.info("No items selected."); return; }
        setDeleteModal({ isOpen: true, id: deleteId, isBulk });
    };
    const closeDeleteModal = () => setDeleteModal({ isOpen: false, id: null, isBulk: false });

    const handleDelete = () => {
        axios.delete(`https://api.hataoo.in/api/contact/report/delete/${deleteModal.id}`)
            .then((res) => {
                const newPage = currentItems.length === 1 && currentPage > 1 ? currentPage - 1 : currentPage;
                getData(newPage, searchTerm);
                closeDeleteModal();
                toast.success(res.data.message || 'Deleted successfully');
            })
            .catch(() => toast.error("An error occurred. Please try again."));
    };

    // ─── Bulk delete ──────────────────────────────────────────────────────────────
    const handleDeleteSelected = () => {
        setIsDeleting(true);
        axios.post('https://api.hataoo.in/api/admin/deleteMultiple', { ids: selectedItems, TypeId: "4" })
            .then(() => {
                toast.success(`Successfully deleted ${selectedItems.length} items.`);
                const remaining = currentItems.length - selectedItems.length;
                const newPage = remaining <= 0 && currentPage > 1 ? currentPage - 1 : currentPage;
                getData(newPage, searchTerm);
            })
            .catch(() => toast.error("Failed to delete selected items."))
            .finally(() => { setIsDeleting(false); closeDeleteModal(); });
    };

    // ─── Block / Unblock ──────────────────────────────────────────────────────────
    const handleToggleBlock = async (item) => {
        const isCurrentlyBlocked = item.isBlocked;
        const newValue = isCurrentlyBlocked;
        setBlockingId(item._id);
        try {
            await axios.put(`https://api.hataoo.in/api/qr-code/update2/${item.code}`, {
                isMaskedCall: newValue,
                isSmsSend: newValue,
                isEmergencyShow: newValue,
                isBlocked: !newValue,
            });
            toast.success(newValue ? `${item.code} blocked` : `${item.code} unblocked`);
            getData(currentPage, searchTerm);
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to update status.");
        } finally {
            setBlockingId(null);
        }
    };

    const clearAllFilters = () => {
        setSearchTerm(''); setSelectedItems([]); setSelectAll(false);
        setCurrentPage(1); getData(1, ''); toast.info("All filters cleared");
    };

    if (loading) return <Loading />;

    return (
        <>
            <style>{`
                @keyframes cardin {
                    from { opacity: 0; transform: translateY(10px); }
                    to   { opacity: 1; transform: translateY(0); }
                }
                .animate-\\[cardin_0\\.22s_ease_forwards\\] {
                    animation: cardin 0.22s ease forwards;
                }
            `}</style>

            <div className="flex flex-col h-[calc(100vh-120px)]">
                <PageBreadcrumb pageTitle="Contact Reports" />

                <div className="flex-1 overflow-y-auto overflow-x-hidden">
                    <div className="rounded-2xl border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
                        <div className="px-6 pt-5">

                            {/* ── Toolbar ── */}
                            <div className="flex items-center justify-between gap-3 pb-[18px] flex-wrap">

                                {/* Left: stats + bulk actions */}
                                <div className="flex items-center gap-2 flex-wrap">
                                    {/* <span className="px-3 py-1 rounded-full text-[11px] font-semibold tracking-wide bg-slate-100 dark:bg-[#1e2a45] text-slate-600 dark:text-slate-400">
                                        {meta ? meta.total : filteredData.length} codes
                                    </span>

                                    {highlightedCount > 0 && (
                                        <span className="px-3 py-1 rounded-full text-[11px] font-semibold tracking-wide bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-300">
                                            <FontAwesomeIcon icon={faFire} className="mr-1" />
                                            {highlightedCount} high req code
                                        </span>
                                    )} */}
                                    
                                    <label className="flex items-center gap-2 cursor-pointer select-none text-sm text-slate-500">
                                        <input
                                            type="checkbox"
                                            className="w-4 h-4 rounded accent-blue-500"
                                            checked={selectAll}
                                            onChange={handleSelectAll}
                                        />
                                        Select all
                                    </label>

                                    {selectedItems.length > 0 && (
                                        <div className="flex items-center gap-3">

                                            {/* Delete Button (mixed style) */}
                                            <Button
                                                onClick={() => openDeleteModal(null, true)}
                                                disabled={isDeleting}
                                                variant="link"
                                                className="d-flex align-items-center py-1 px-2"
                                                style={{
                                                    fontSize: "14px",
                                                    color: "#f13838",
                                                    textDecoration: "none"
                                                }}
                                            >
                                                {isDeleting ? (
                                                    <div className="w-3 h-3 border-2 border-red-500 border-t-transparent rounded-full" />
                                                ) : (
                                                    <>
                                                        <FontAwesomeIcon icon={faTrash} />
                                                        <span className="ps-2">DELETE SELECTED ({selectedItems.length})</span>
                                                    </>
                                                )}
                                            </Button>

                                        </div>
                                    )}

                                    {(selectedItems.length > 0 || searchTerm) && (
                                        <Button
                                            onClick={clearAllFilters}
                                            variant="link"
                                            className="d-flex align-items-center gap-2 py-1 border-0 bg-transparent"
                                            style={{ fontSize: "14px", color: "#f13838" }}
                                        >
                                            CLEAR ALL
                                        </Button>
                                    )}
                                </div>

                                {/* Right: select-all + search */}
                                <div className="flex items-center gap-4">

                                    {/* Search — same markup as HowToWork */}
                                    <div className="relative min-w-[200px] max-w-[360px] flex-1">
                                        <form onSubmit={handleSearchSubmit}>
                                            <div className="relative flex items-center justify-center">
                                                <span className="absolute -translate-y-1/2 pointer-events-none left-4 top-1/2">
                                                    <svg className="fill-gray-500 dark:fill-gray-400" width="18" height="18" viewBox="0 0 20 20" fill="none">
                                                        <path fillRule="evenodd" clipRule="evenodd" d="M3.04175 9.37363C3.04175 5.87693 5.87711 3.04199 9.37508 3.04199C12.8731 3.04199 15.7084 5.87693 15.7084 9.37363C15.7084 12.8703 12.8731 15.7053 9.37508 15.7053C5.87711 15.7053 3.04175 12.8703 3.04175 9.37363ZM9.37508 1.54199C5.04902 1.54199 1.54175 5.04817 1.54175 9.37363C1.54175 13.6991 5.04902 17.2053 9.37508 17.2053C11.2674 17.2053 13.003 16.5344 14.357 15.4176L17.177 18.238C17.4699 18.5309 17.9448 18.5309 18.2377 18.238C18.5306 17.9451 18.5306 17.4703 18.2377 17.1774L15.418 14.3573C16.5365 13.0033 17.2084 11.2669 17.2084 9.37363C17.2084 5.04817 13.7011 1.54199 9.37508 1.54199Z" fill="" />
                                                    </svg>
                                                </span>
                                                <input
                                                    type="text"
                                                    placeholder="Search code, name, phone..."
                                                    value={searchTerm}
                                                    onChange={handleSearch}
                                                    className="dark:bg-dark-900 h-10 w-full rounded-xl border border-gray-200 bg-transparent py-2.5 pl-11 pr-10 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-none focus:ring focus:ring-brand-500/10 dark:border-gray-800 dark:bg-gray-900 dark:bg-white/[0.03] dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800 xl:w-[300px]"
                                                />
                                                <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
                                                    {searchTerm && (
                                                        <button type="button" onClick={handleClearSearch} className="text-gray-400 hover:text-gray-600 px-1">
                                                            <FontAwesomeIcon icon={faTimes} className="text-[11px]" />
                                                        </button>
                                                    )}
                                                    <button type="submit" className="text-gray-400 hover:text-blue-500 px-1">
                                                        <FontAwesomeIcon icon={faSearch} className="text-[11px]" />
                                                    </button>
                                                </div>
                                            </div>
                                        </form>
                                    </div>
                                </div>
                            </div>

                            {/* ── Card Grid ── */}
                            {currentItems.length > 0 ? (
                                <div className="grid gap-[18px] pb-5"
                                    style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))' }}
                                >
                                    {currentItems.map((item, index) => (
                                        <QrCard
                                            key={item._id}
                                            item={item}
                                            index={index}
                                            isSelected={selectedItems.includes(item._id)}
                                            isProcessing={blockingId === item._id}
                                            animDelay={Math.min(index * 35, 300)}
                                            onSelect={handleSelectItem}
                                            onOpenDetail={(it) => setDetailModal({ isOpen: true, item: it })}
                                            onToggleBlock={handleToggleBlock}
                                            onDelete={(id) => openDeleteModal(id)}
                                        />
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-16 text-gray-400 text-sm">
                                    <div className="text-4xl mb-3 opacity-40">
                                        <FontAwesomeIcon icon={faQrcode} />
                                    </div>
                                    {searchTerm ? `No results found for "${searchTerm}"` : 'No Data Found'}
                                </div>
                            )}
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

                {/* ── Delete Confirm Modal ── */}
                <DeleteModal
                    isOpen={deleteModal.isOpen}
                    isBulk={deleteModal.isBulk}
                    selectedCount={selectedItems.length}
                    value={"report"}
                    isDeleting={isDeleting}
                    onClose={closeDeleteModal}
                    onConfirm={deleteModal.isBulk ? handleDeleteSelected : handleDelete}
                />

                {/* ── Detail Modal ── */}
                {detailModal.isOpen && (
                    <DetailModal
                        item={detailModal.item}
                        blockingId={blockingId}
                        onClose={() => setDetailModal({ isOpen: false, item: null })}
                        onDelete={(id) => { setDetailModal({ isOpen: false, item: null }); openDeleteModal(id); }}
                        onToggleBlock={handleToggleBlock}
                    />
                )}

                <ToastContainer position="top-center" className="!z-[99999]" />
            </div>
        </>
    );
};

export default Report;