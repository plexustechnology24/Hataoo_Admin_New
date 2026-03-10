import React, { useCallback, useEffect, useRef, useState } from "react";
import axios from "axios";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import { Button } from "react-bootstrap";
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faPlus, faSearch, faTrash, faTimes,
    faChevronDown, faFilter, faQrcode, faDownload, faPrint,
} from "@fortawesome/free-solid-svg-icons";
import CustomPagination from "../../components/common/pagination";
import Loading from "../../components/loading";
import QrInfoModal from "../../components/QrInfoModal";
import QrCard from "../../components/QrCard";
import DateRangeFilter, { DEFAULT_DATE_KEY, defaultDateRange } from "../../components/Daterangefilter";
import PinVerifyModal from "../../components/Pinmodal";

const ITEMS_PER_PAGE = 16;
const QUANTITY_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8];

const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

const groupIntoBatches = (items) => {
    const batches = [];
    for (let i = 0; i < items.length; i += 16) batches.push(items.slice(i, i + 16));
    return batches;
};

const downloadQr = (url, index) => {
    if (!url) { toast.error("No QR image available to download."); return; }
    const link = document.createElement("a");
    link.href = url; link.download = `${index}.svg`;
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
};

const downloadAllQrs = (items, globalIndexMap) => {
    if (!items.length) { toast.info("No items selected."); return; }
    items.forEach((item, i) => {
        if (!item.qrImage) return;
        setTimeout(() => {
            const link = document.createElement("a");
            link.href = item.qrImage; link.download = `qr-${globalIndexMap[item._id]}.svg`;
            document.body.appendChild(link); link.click(); document.body.removeChild(link);
        }, i * 300);
    });
    toast.success(`Downloading ${items.filter(i => i.qrImage).length} QR codes...`);
};

const Qrcode = () => {
    const [visible, setVisible] = useState(false);
    const [meta, setMeta] = useState(null);
    const [loading, setLoading] = useState(true);
    const [filteredData, setFilteredData] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [deleteModal, setDeleteModal] = useState({ isOpen: false, id: null, isBulk: false, batchIndex: null });
    const [selectedItems, setSelectedItems] = useState([]);
    const [selectAll, setSelectAll] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const searchContainerRef = useRef(null);
    const [statusFilter, setStatusFilter] = useState('');
    const [filterDropdownOpen, setFilterDropdownOpen] = useState(false);
    const filterDropdownRef = useRef(null);

    // Date filter state
    const [dateKey, setDateKey] = useState(DEFAULT_DATE_KEY);
    const [dateRange, setDateRange] = useState(defaultDateRange());

    const [infoModal, setInfoModal] = useState({ open: false, qr: null });
    const [formQuantity, setFormQuantity] = useState(16);
    const [formErrors, setFormErrors] = useState({});

    // Mark as printed state
    const [isPrinting, setIsPrinting] = useState(false);
    const [printProgress, setPrintProgress] = useState({ done: 0, total: 0 });

    const currentItems = filteredData;
    const globalIndexMap = {};
    currentItems.forEach((item, i) => { globalIndexMap[item._id] = ((currentPage - 1) * ITEMS_PER_PAGE) + i + 1; });
    const batches = groupIntoBatches(currentItems);

    const requirePin = (action) => {
        setDeleteModal({ isOpen: true, pendingAction: action });
    };

    const handleSearch = (e) => {
        const value = e.target.value; setSearchTerm(value);
        if (value.trim() === '') { setCurrentPage(1); getData(1, '', statusFilter, dateRange); }
    };
    const handleSearchSubmit = (e) => { e.preventDefault(); setCurrentPage(1); getData(1, searchTerm.trim(), statusFilter, dateRange); };
    const handleClearSearch = () => { setSearchTerm(''); setCurrentPage(1); getData(1, '', statusFilter, dateRange); };

    const handleStatusFilter = (value) => {
        setStatusFilter(value); setFilterDropdownOpen(false); setCurrentPage(1);
        getData(1, searchTerm.trim(), value, dateRange);
    };
    useEffect(() => {
        const handler = (e) => { if (filterDropdownRef.current && !filterDropdownRef.current.contains(e.target)) setFilterDropdownOpen(false); };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const handleDateChange = ({ key, fromDate, toDate }) => {
        setDateKey(key); setDateRange({ fromDate, toDate });
        setCurrentPage(1); getData(1, searchTerm.trim(), statusFilter, { fromDate, toDate });
    };
    const handleDateClear = ({ key, fromDate, toDate }) => {
        setDateKey(key); setDateRange({ fromDate, toDate });
        setCurrentPage(1); getData(1, searchTerm.trim(), statusFilter, { fromDate, toDate });
    };

    const getData = useCallback((page = 1, search = '', status = '', dr = null) => {
        setLoading(true);
        const params = { page, limit: ITEMS_PER_PAGE, qrtype: 'live' };
        if (search?.trim()) params.search = search.trim();
        if (status !== '') params.isActive = status;
        if (dr?.fromDate) params.fromDate = dr.fromDate;
        if (dr?.toDate) params.toDate = dr.toDate;
        axios.get('https://api.hataoo.in/api/qr-code', { params })
            .then((res) => {
                setFilteredData(res.data.data || []); setMeta(res.data.meta);
                if (res.data.meta) setCurrentPage(res.data.meta.page || page);
                setSelectedItems([]); setSelectAll(false);
            })
            .catch(() => toast.error("No Data Found"))
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => { getData(1, '', '', dateRange); }, [getData]);

    const isBatchSelected = (batch) => batch.every(item => selectedItems.includes(item._id));
    const handleBatchSelectToggle = (batch) => {
        const batchIds = batch.map(item => item._id);
        const allSelected = batchIds.every(id => selectedItems.includes(id));
        if (allSelected) setSelectedItems(prev => prev.filter(id => !batchIds.includes(id)));
        else setSelectedItems(prev => { const next = [...prev]; batchIds.forEach(id => { if (!next.includes(id)) next.push(id); }); return next; });
    };
    const handleSelectItem = (itemId) => {
        if (selectedItems.includes(itemId)) { setSelectedItems(selectedItems.filter(i => i !== itemId)); if (selectAll) setSelectAll(false); }
        else { const next = [...selectedItems, itemId]; setSelectedItems(next); setSelectAll(currentItems.every(item => next.includes(item._id))); }
    };
    useEffect(() => {
        if (currentItems.length > 0 && selectedItems.length > 0) setSelectAll(currentItems.every(item => selectedItems.includes(item._id)));
        else setSelectAll(false);
    }, [currentItems, selectedItems]);

    const handleDownloadSelected = () => downloadAllQrs(currentItems.filter(item => selectedItems.includes(item._id)), globalIndexMap);

    const handleMarkAllAsPrinted = async () => {
        if (!currentItems.length) { toast.info("No QR codes to mark as printed."); return; }
        const unprintedItems = currentItems.filter(item => !item.isPrinted);
        if (!unprintedItems.length) { toast.info("All QR codes are already marked as printed."); return; }
        setIsPrinting(true); setPrintProgress({ done: 0, total: unprintedItems.length });
        let successCount = 0, failCount = 0;
        for (let i = 0; i < unprintedItems.length; i++) {
            try {
                await axios.put(`https://api.hataoo.in/api/qr-code/update/${unprintedItems[i].code}`, { isPrinted: true, isActive: false });
                successCount++;
                setPrintProgress({ done: i + 1, total: unprintedItems.length });
            } catch { failCount++; }
            if (i < unprintedItems.length - 1) await new Promise(r => setTimeout(r, 100));
        }
        setIsPrinting(false); setPrintProgress({ done: 0, total: 0 });
        if (failCount === 0) toast.success(`✅ ${successCount} QR codes marked as printed successfully.`);
        else toast.warning(`${successCount} marked as printed, ${failCount} failed.`);
        getData(currentPage, searchTerm, statusFilter, dateRange);
    };

    // ✅ openDeleteModal — now wrapped with requirePin
    const openDeleteModal = (deleteId = null, isBulk = false, batchIndex = null) => {
        // Validate first (before asking for PIN)
        if (batchIndex !== null) {
            const batch = batches[batchIndex]; if (!batch) return;
            if (batch.length < 16) { toast.error("Cannot delete less than 16 QR codes at a time."); return; }
            if (batch.some(item => item.isActive)) { toast.error("Cannot delete active QR codes. Please deactivate them first."); return; }
            setSelectedItems(batch.map(item => item._id));
            // ✅ Ask for PIN, then open delete confirm modal
            requirePin(() => setDeleteModal({ isOpen: true, id: null, isBulk: true, batchIndex }));
            return;
        }
        if (isBulk) {
            if (selectedItems.length === 0) { toast.info("No items selected."); return; }
            if (selectedItems.length % 16 !== 0) { toast.error(`Please select a multiple of 16. Currently: ${selectedItems.length}`); return; }
            if (currentItems.some(item => selectedItems.includes(item._id) && item.isActive)) { toast.error("Cannot delete active QR codes."); return; }
            requirePin(() => setDeleteModal({ isOpen: true, id: null, isBulk: true, batchIndex: null }));
            return;
        }
        if (currentItems.find(i => i._id === deleteId)?.isActive) { toast.error("Cannot delete an active QR code."); return; }
        // ✅ Single delete — ask PIN first
        requirePin(() => setDeleteModal({ isOpen: true, id: deleteId, isBulk: false, batchIndex: null }));
    };

    const closeDeleteModal = () => setDeleteModal({ isOpen: false, id: null, isBulk: false, batchIndex: null });

    const handleDeleteSelected = () => {
        // setIsDeleting(true);
        axios.post('https://api.hataoo.in/api/admin/deleteMultiple', { ids: selectedItems, TypeId: "3" })
            .then(() => {
                toast.success(`Successfully deleted ${selectedItems.length} QR codes.`);
                getData(currentItems.length - selectedItems.length <= 0 && currentPage > 1 ? currentPage - 1 : currentPage, searchTerm, statusFilter, dateRange);
            })
            .catch(() => toast.error("Failed to delete selected items."))
            .finally(() => {  closeDeleteModal(); });
    };

    const clearAllFilters = () => {
        const dr = defaultDateRange();
        setSearchTerm(''); setStatusFilter(''); setSelectedItems([]); setSelectAll(false); setCurrentPage(1);
        setDateKey(DEFAULT_DATE_KEY); setDateRange(dr);
        getData(1, '', '', dr); toast.info("All filters cleared");
    };

    const resetForm = () => { setFormQuantity(16); setFormErrors({}); };
    const toggleModal = (mode) => { if (!visible && mode === 'add') resetForm(); else if (visible) resetForm(); setVisible(!visible); };
    const validateForm = () => { const errs = {}; if (!formQuantity || formQuantity % 16 !== 0 || formQuantity < 16) errs.quantity = 'Please select a valid quantity (multiple of 16)'; return errs; };
    const handleSubmit = async (e) => {
        e.preventDefault(); const errs = validateForm();
        if (Object.keys(errs).length > 0) { setFormErrors(errs); return; }
        if (isSubmitting) return;
        try {
            setIsSubmitting(true);
            const res = await axios.post('https://api.hataoo.in/api/qr-code/generate', { quantity: Number(formQuantity), qrtype: "live" });
            toast.success(res.data.message || `${formQuantity} QR codes generated successfully`);
            resetForm(); setVisible(false); getData(1, searchTerm, statusFilter, dateRange);
        } catch (err) { toast.error(err.response?.data?.message || "An error occurred."); }
        finally { setIsSubmitting(false); }
    };

    const hasActiveFilters = searchTerm || statusFilter !== '' || selectedItems.length > 0;
    const STATUS_OPTIONS = [{ label: 'All Status', value: '' }, { label: 'Active', value: 'true' }, { label: 'Inactive', value: 'false' }];

    if (loading) return <Loading />;

    return (
        <div className="flex flex-col h-[calc(100vh-120px)]">
            <PageBreadcrumb pageTitle="QR Codes" />
            <div className="flex-1 overflow-y-auto overflow-x-hidden">
                <div className="rounded-2xl border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
                    <div className="px-6 pt-5">
                        <div className="flex justify-between items-center px-4 py-3 mt-4 gap-4 flex-wrap">
                            <div className="flex gap-3 items-center flex-wrap">
                                {/* Search */}
                                <div ref={searchContainerRef} className="relative">
                                    <form onSubmit={handleSearchSubmit}>
                                        <div className="relative flex align-middle justify-center">
                                            <span className="absolute -translate-y-1/2 pointer-events-none left-4 top-1/2">
                                                <svg className="fill-gray-500 dark:fill-gray-400" width="20" height="20" viewBox="0 0 20 20" fill="none">
                                                    <path fillRule="evenodd" clipRule="evenodd" d="M3.04175 9.37363C3.04175 5.87693 5.87711 3.04199 9.37508 3.04199C12.8731 3.04199 15.7084 5.87693 15.7084 9.37363C15.7084 12.8703 12.8731 15.7053 9.37508 15.7053C5.87711 15.7053 3.04175 12.8703 3.04175 9.37363ZM9.37508 1.54199C5.04902 1.54199 1.54175 5.04817 1.54175 9.37363C1.54175 13.6991 5.04902 17.2053 9.37508 17.2053C11.2674 17.2053 13.003 16.5344 14.357 15.4176L17.177 18.238C17.4699 18.5309 17.9448 18.5309 18.2377 18.238C18.5306 17.9451 18.5306 17.4703 18.2377 17.1774L15.418 14.3573C16.5365 13.0033 17.2084 11.2669 17.2084 9.37363C17.2084 5.04817 13.7011 1.54199 9.37508 1.54199Z" fill="" />
                                                </svg>
                                            </span>
                                            <input type="text" placeholder="Search by name, plate, contact..."
                                                value={searchTerm} onChange={handleSearch}
                                                className="dark:bg-dark-900 h-11 w-full rounded-lg border border-gray-200 bg-transparent py-2.5 pl-12 pr-14 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-none focus:ring focus:ring-brand-500/10 dark:border-gray-800 dark:bg-gray-900 dark:bg-white/[0.03] dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800 xl:w-[300px]" />
                                            <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
                                                {searchTerm && (
                                                    <button type="button" onClick={handleClearSearch} className="inline-flex items-center px-[7px] py-[4.5px] text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400">
                                                        <FontAwesomeIcon icon={faTimes} />
                                                    </button>
                                                )}
                                                <button type="submit" className="inline-flex items-center px-[7px] py-[4.5px] text-xs text-gray-500 hover:text-blue-600 dark:text-gray-400">
                                                    <FontAwesomeIcon icon={faSearch} />
                                                </button>
                                            </div>
                                        </div>
                                    </form>
                                </div>

                                {/* Status Filter */}
                                <div ref={filterDropdownRef} className="relative">
                                    <button type="button" onClick={() => setFilterDropdownOpen(!filterDropdownOpen)}
                                        className="h-11 flex items-center gap-2 px-4 rounded-lg border text-sm font-medium transition-colors border-gray-200 bg-white text-gray-600 hover:border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300">
                                        <FontAwesomeIcon icon={faFilter} className="text-xs" />
                                        <span>{statusFilter === '' ? 'Filter' : statusFilter === 'true' ? 'Active' : 'Inactive'}</span>
                                        <FontAwesomeIcon icon={faChevronDown} className={`text-xs transition-transform ${filterDropdownOpen ? 'rotate-180' : ''}`} />
                                    </button>
                                    {filterDropdownOpen && (
                                        <div className="absolute right-0 top-12 z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl min-w-[180px] overflow-hidden">
                                            <div className="p-2">
                                                <p className="text-[10px] text-gray-400 uppercase tracking-widest px-2 mb-1">Status</p>
                                                {STATUS_OPTIONS.map(opt => (
                                                    <button key={opt.value} type="button" onClick={() => handleStatusFilter(opt.value)}
                                                        className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm rounded-lg transition-colors text-left ${statusFilter === opt.value ? 'bg-gray-50 text-gray-700 font-medium dark:bg-gray-900/20 dark:text-gray-400' : 'text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700'}`}>
                                                        <span className="w-2 h-2 rounded-full flex-shrink-0" />{opt.label}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <DateRangeFilter selectedKey={dateKey} onChange={handleDateChange} onClear={handleDateClear} />
                            </div>

                            <Button onClick={() => toggleModal('add')} className="rounded-md border-0 shadow-md px-4 py-2 text-white h-11" style={{ background: "#7C7FFF" }}>
                                <FontAwesomeIcon icon={faPlus} className="pe-2" /> Generate QR
                            </Button>
                        </div>

                        {/* Bulk action bar */}
                        <div className="flex gap-4 items-center justify-between flex-wrap mt-3 ps-4">
                            <div className="flex gap-4 items-center flex-wrap">
                                {currentItems.length > 0 && (
                                    <Button onClick={handleMarkAllAsPrinted} disabled={isPrinting}
                                        className="d-flex align-items-center gap-2 py-1 ps-1"
                                        style={{ fontSize: "14px", color: isPrinting ? "#9ca3af" : "#2563eb", border: "none", background: "transparent" }}>
                                        {isPrinting ? (
                                            <><div className="w-3 h-3 border-2 border-blue-400 border-t-transparent rounded-full animate-spin me-2" style={{ display: 'inline-block' }} />
                                                <span>MARKING... ({printProgress.done}/{printProgress.total})</span></>
                                        ) : (
                                            <><FontAwesomeIcon icon={faPrint} className="pe-2" />
                                                <span>MARK ALL AS PRINTED ({currentItems.filter(i => !i.isPrinted).length})</span></>
                                        )}
                                    </Button>
                                )}
                                {selectedItems.length > 0 && (
                                    <Button onClick={handleDownloadSelected} className="d-flex align-items-center gap-2 py-1 ps-3"
                                        style={{ fontSize: "14px", color: "#16a34a", border: "none", background: "transparent" }}>
                                        <FontAwesomeIcon icon={faDownload} className="pe-2" />
                                        <span>DOWNLOAD SELECTED ({selectedItems.length})</span>
                                    </Button>
                                )}
                            </div>
                            {hasActiveFilters && (
                                <Button onClick={clearAllFilters} variant="outline-secondary" className="d-flex align-items-center gap-2 py-1 border-0 bg-transparent" style={{ fontSize: "14px", color: "#f13838" }}>
                                    CLEAR ALL
                                </Button>
                            )}
                        </div>
                    </div>

                    {/* QR Grid */}
                    <div className="p-6">
                        {batches.length > 0 ? (
                            <div className="space-y-6">
                                {batches.map((batch, batchIdx) => {
                                    const batchDate = batch[0]?.createdAt ? formatDate(batch[0].createdAt) : '';
                                    const batchSelected = isBatchSelected(batch);
                                    const batchHasActive = batch.some(item => item.isActive);
                                    const batchIsFull = batch.length === 16;
                                    const globalBatchNumber = ((currentPage - 1) * 1) + batchIdx + 1;
                                    const totalInBatch = batch.length;
                                    const printedCount = batch.filter(item => item.isPrinted).length;
                                    const allPrinted = printedCount === totalInBatch;
                                    const nonePrinted = printedCount === 0;
                                    const partiallyPrinted = !allPrinted && !nonePrinted;
                                    const batchBadge = allPrinted
                                        ? <span className="text-[13px] font-medium px-4 py-0.5 rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">✓ All Printed</span>
                                        : partiallyPrinted
                                            ? <span className="text-[13px] font-medium px-4 py-0.5 rounded-full bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400">⚡ {printedCount}/{totalInBatch} Printed</span>
                                            : <span className="text-[13px] font-medium px-4 py-0.5 rounded-full bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400">Not Printed</span>;
                                    const batchBgClass =
                                        allPrinted
                                            ? "bg-gray-50 dark:bg-gray-900/10"
                                            : partiallyPrinted
                                                ? "bg-yellow-50 dark:bg-yellow-900/10"
                                                : "bg-gray-50/10 dark:bg-gray-800/30";

                                    return (
                                        <div
                                            key={batchIdx}
                                            className={`relative rounded-xl p-3 ${batchBgClass}`}
                                        >                                            <div className="flex items-center justify-between mb-3 px-1">
                                                <div className="flex items-center gap-2">
                                                    <input type="checkbox" checked={batchSelected} onChange={() => handleBatchSelectToggle(batch)}
                                                        className="w-4 h-4 border-gray-300 rounded cursor-pointer" title="Select entire batch" />
                                                    <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                                                        Batch #{globalBatchNumber}
                                                        <span className="ml-1 text-gray-400 font-normal">({batch.length} QRs)</span>
                                                    </span>
                                                    {batchBadge}
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    {batchDate && (
                                                        <span className="text-sm text-gray-600 dark:text-gray-100 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full">
                                                            🗓 {batchDate}
                                                        </span>
                                                    )}
                                                    {batchIsFull && !searchTerm && statusFilter === '' && (
                                                        <button type="button"
                                                            onClick={() => openDeleteModal(null, false, batchIdx)}
                                                            disabled={batchHasActive}
                                                            title={batchHasActive ? "Deactivate all QRs first" : "Delete entire batch of 16"}
                                                            className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1 rounded-lg border transition-colors ${batchHasActive ? 'border-gray-200 text-gray-300 cursor-not-allowed dark:border-gray-700 dark:text-gray-600' : 'border-red-200 text-red-500 hover:bg-red-50 dark:border-red-900 dark:hover:bg-red-900/20'}`}>
                                                            <FontAwesomeIcon icon={faTrash} className="text-[10px]" /> Delete Batch
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4 gap-4">
                                                {batch.map((item, indexInBatch) => {
                                                    const globalIndex = ((currentPage - 1) * ITEMS_PER_PAGE) + (batchIdx * 16) + indexInBatch + 1;
                                                    return (
                                                        <QrCard key={item._id} item={item} index={globalIndex}
                                                            onDelete={(id) => openDeleteModal(id)} // ← PIN triggered here
                                                            onInfo={(qr) => setInfoModal({ open: true, qr })}
                                                            isSelected={selectedItems.includes(item._id)}
                                                            onSelect={handleSelectItem}
                                                            onDownload={(url, gi) => downloadQr(url, gi)} />
                                                    );
                                                })}
                                            </div>
                                            {batchIdx < batches.length - 1 && <div className="mt-6 border-b border-dashed border-gray-200 dark:border-gray-700" />}
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-24 text-gray-400 dark:text-gray-600">
                                <FontAwesomeIcon icon={faQrcode} className="text-6xl mb-4 opacity-30" />
                                <p className="text-lg font-medium">No QR Codes Found</p>
                                <p className="text-sm mt-1">
                                    {searchTerm ? `No results for "${searchTerm}"` : statusFilter !== '' ? `No ${statusFilter === 'true' ? 'active' : 'inactive'} QR codes` : 'Generate your first batch of QR codes'}
                                </p>
                                {!searchTerm && statusFilter === '' && (
                                    <button onClick={() => toggleModal('add')} className="mt-4 px-5 py-2 text-sm font-semibold text-black rounded-lg transition-colors">Generate QR Codes</button>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="w-full border-t dark:bg-gray-900 dark:border-gray-700 mt-0">
                <CustomPagination currentPage={currentPage} totalPages={meta ? meta.pages : 1}
                    onPageChange={(page) => { setCurrentPage(page); setSelectedItems([]); setSelectAll(false); getData(page, searchTerm, statusFilter, dateRange); }}
                    itemsPerPage={ITEMS_PER_PAGE} totalItems={meta ? meta.total : filteredData.length} />
            </div>

            {/* Generate QR Modal */}
            {visible && (
                <div className="fixed inset-0 z-[99999] flex items-center justify-center px-4" style={{ backgroundColor: 'rgba(0,0,0,0.55)' }}>
                    <div className="relative bg-white dark:bg-gray-900 rounded-2xl w-full shadow-2xl overflow-hidden" style={{ maxWidth: 480 }}>
                        <div className="bg-gray-50 px-6 py-4 flex items-center justify-between">
                            <h2 className="text-lg font-bold text-black">Generate QR Codes</h2>
                            <button type="button" onClick={() => !isSubmitting && toggleModal()} className="text-black/70 hover:text-black transition-colors p-1">
                                <FontAwesomeIcon icon={faTimes} className="text-xl" />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-5">
                            <div>
                                <label className="block text-sm font-semibold mb-2 dark:text-gray-300">
                                    Quantity <span className="text-red-500">*</span>
                                    <span className="text-xs font-normal text-gray-400 ml-2">(multiples of 16)</span>
                                </label>
                                <div className="grid grid-cols-4 gap-2">
                                    {QUANTITY_OPTIONS.map((multiplier) => {
                                        const qty = multiplier * 16;
                                        return (
                                            <button key={multiplier} type="button" disabled={isSubmitting}
                                                onClick={() => { setFormQuantity(qty); if (formErrors.quantity) setFormErrors(p => { const e = { ...p }; delete e.quantity; return e; }); }}
                                                className={`py-2 px-3 rounded-xl border-2 text-sm font-bold transition-all duration-150 flex flex-col items-center ${formQuantity === qty ? 'border-gray-400 bg-[#7C7FFF0D] text-black shadow-sm scale-105' : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300'}`}>
                                                <span className="text-xs font-normal opacity-70">16×{multiplier}</span>
                                                <span>{qty}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                                {formErrors.quantity && <p className="text-red-500 text-xs mt-1">{formErrors.quantity}</p>}
                            </div>
                            <div className="flex gap-3 pt-1">
                                <button type="button" onClick={() => toggleModal()} disabled={isSubmitting}
                                    className="flex-1 py-2.5 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-xl hover:bg-gray-200 transition-colors text-sm font-medium disabled:opacity-50">Cancel</button>
                                <button type="submit" disabled={isSubmitting}
                                    className="flex-1 py-2.5 text-white rounded-xl transition-colors text-sm font-bold disabled:opacity-50 flex items-center justify-center gap-2" style={{ backgroundColor: "#7C7FFF" }}>
                                    {isSubmitting ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /><span>Generating...</span></> : <span>Generate {formQuantity} QRs</span>}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ✅ Step 1: PIN Verify Modal — shown first on any delete action */}
            <PinVerifyModal
                isOpen={deleteModal.isOpen}
                onClose={closeDeleteModal}
                onVerified={handleDeleteSelected}
                correctPin="1234"
                title="Enter PIN to Access"
                subtitle="Please enter your secure 4-digit PIN to proceed."
            />



            {infoModal.open && <QrInfoModal qr={infoModal.qr} onClose={() => setInfoModal({ open: false, qr: null })} />}
            <ToastContainer position="top-center" className="!z-[99999]" />
        </div>
    );
};

export default Qrcode;