import React, { useCallback, useEffect, useRef, useState } from "react";
import axios from "axios";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import { Button } from "react-bootstrap";
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faPlus, faSearch, faTrash, faTimes,
    faChevronDown, faFilter,
    faQrcode,
    faDownload,
} from "@fortawesome/free-solid-svg-icons";
import CustomPagination from "../../components/common/pagination";
import Loading from "../../components/loading";
import DeleteModal from "../../components/deleteModal";
import QrInfoModal from "../../components/QrInfoModal";
import QrCard from "../../components/QrCard";

const ITEMS_PER_PAGE = 16;
const QUANTITY_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8];

/* ─── Download QR helper ─────────────────────────────────────────── */
const downloadQr = (url, index) => {
    if (!url) { toast.error("No QR image available to download."); return; }
    const link = document.createElement("a");
    link.href = url;
    link.download = `${index}.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

/* ─── Download all selected QRs one by one with delay ───────────── */
const downloadAllQrs = (items, globalIndexMap) => {
    if (!items.length) { toast.info("No items selected."); return; }
    items.forEach((item, i) => {
        if (!item.qrImage) return;
        setTimeout(() => {
            const link = document.createElement("a");
            link.href = item.qrImage;
            link.download = `qr-${globalIndexMap[item._id]}.svg`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }, i * 300); 
    });
    toast.success(`Downloading ${items.filter(i => i.qrImage).length} QR codes...`);
};


/* ══════════════════════════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════════════════════════ */
const SampleQrcode = () => {
    const [visible, setVisible] = useState(false);
    const [meta, setMeta] = useState(null);
    const [loading, setLoading] = useState(true);
    const [filteredData, setFilteredData] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [deleteModal, setDeleteModal] = useState({ isOpen: false, id: null, isBulk: false });
    const [selectedItems, setSelectedItems] = useState([]);
    const [selectAll, setSelectAll] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const searchContainerRef = useRef(null);
    const [statusFilter, setStatusFilter] = useState('');
    const [filterDropdownOpen, setFilterDropdownOpen] = useState(false);
    const filterDropdownRef = useRef(null);

    /* Info modal */
    const [infoModal, setInfoModal] = useState({ open: false, qr: null });

    /* Form fields */
    const [formQuantity, setFormQuantity] = useState(1);
    const [formErrors, setFormErrors] = useState({});

    const currentItems = filteredData;

    /* Build global index map: _id → global index number */
    const globalIndexMap = {};
    currentItems.forEach((item, i) => {
        globalIndexMap[item._id] = ((currentPage - 1) * ITEMS_PER_PAGE) + i + 1;
    });

    /* Search */
    const handleSearch = (e) => {
        const value = e.target.value;
        setSearchTerm(value);
        if (value.trim() === '') { setCurrentPage(1); getData(1, '', statusFilter); }
    };
    const handleSearchSubmit = (e) => { e.preventDefault(); setCurrentPage(1); getData(1, searchTerm.trim(), statusFilter); };
    const handleClearSearch = () => { setSearchTerm(''); setCurrentPage(1); getData(1, '', statusFilter); };

    /* Filter */
    const handleStatusFilter = (value) => {
        setStatusFilter(value); setFilterDropdownOpen(false); setCurrentPage(1);
        getData(1, searchTerm.trim(), value);
    };
    useEffect(() => {
        const handler = (e) => {
            if (filterDropdownRef.current && !filterDropdownRef.current.contains(e.target))
                setFilterDropdownOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    /* Data fetching */
    const getData = useCallback((page = 1, search = '', status = '') => {
        setLoading(true);
        const params = { page, limit: ITEMS_PER_PAGE, qrtype: 'sample' };
        if (search && search.trim() !== '') params.search = search.trim();
        if (status !== '') params.isActive = status;
        axios.get('https://api.hataoo.in/api/qr-code', { params })
            .then((res) => {
                const responseData = res.data.data || [];
                const responsePagination = res.data.meta;
                setFilteredData(responseData);
                setMeta(responsePagination);
                if (responsePagination) setCurrentPage(responsePagination.page || page);
                setSelectedItems([]); setSelectAll(false);
            })
            .catch(() => toast.error("No Data Found"))
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => { getData(1, ''); }, [getData]);

    const handleResetQr = async (item) => {
        try {
            await axios.put(`https://api.hataoo.in/api/qr-code/update/${item.code}`, {
                language: null,
                carNumberPlate: null,
                name: null,
                contactNumber: null,
                contactVerified: false,
                isActive: false,
                emergencyDetails: {
                    emergencyContacts: [],
                    bloodGroup: null,
                    healthInsuranceCompany: null,
                    notes: null
                }
            });
            toast.success("QR Code reset successfully.");
            getData(currentPage, searchTerm, statusFilter);
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to reset QR code.");
        }
    };

    /* Select all/individual */
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

    /* Download selected */
    const handleDownloadSelected = () => {
        const selectedQrItems = currentItems.filter(item => selectedItems.includes(item._id));
        downloadAllQrs(selectedQrItems, globalIndexMap);
    };

    /* Delete */
    const openDeleteModal = (deleteId = null, isBulk = false) => {
        if (isBulk) {
            if (selectedItems.length === 0) { toast.info("No items selected."); return; }
            const hasActive = currentItems.some(
                item => selectedItems.includes(item._id) && item.isActive
            );
            if (hasActive) {
                toast.error("Cannot delete active QR codes. Please deactivate them first.");
                return;
            }
        } else {
            const item = currentItems.find(i => i._id === deleteId);
            if (item?.isActive) {
                toast.error("Cannot delete an active QR code.");
                return;
            }
        }
        setDeleteModal({ isOpen: true, id: deleteId, isBulk });
    };
    const closeDeleteModal = () => setDeleteModal({ isOpen: false, id: null, isBulk: false });
    const handleDelete = () => {
        axios.delete(`https://api.hataoo.in/api/qr-code/${deleteModal.id}`)
            .then((res) => {
                const newPage = currentItems.length === 1 && currentPage > 1 ? currentPage - 1 : currentPage;
                getData(newPage, searchTerm, statusFilter); closeDeleteModal(); toast.success(res.data.message);
            })
            .catch(() => toast.error("An error occurred. Please try again."));
    };
    const handleDeleteSelected = () => {
        setIsDeleting(true);
        axios.post('https://api.hataoo.in/api/admin/deleteMultiple', { ids: selectedItems, TypeId: "3" })
            .then(() => {
                toast.success(`Successfully deleted ${selectedItems.length} QR codes.`);
                const remaining = currentItems.length - selectedItems.length;
                const newPage = remaining <= 0 && currentPage > 1 ? currentPage - 1 : currentPage;
                getData(newPage, searchTerm, statusFilter);
            })
            .catch(() => toast.error("Failed to delete selected items."))
            .finally(() => { setIsDeleting(false); closeDeleteModal(); });
    };

    const clearAllFilters = () => {
        setSearchTerm(''); setStatusFilter('');
        setSelectedItems([]); setSelectAll(false); setCurrentPage(1);
        getData(1, '', ''); toast.info("All filters cleared");
    };

    const resetForm = () => { setFormQuantity(1); setFormErrors({}); };
    const toggleModal = (mode) => {
        if (!visible && mode === 'add') resetForm();
        else if (visible) resetForm();
        setVisible(!visible);
    };

    const validateForm = () => {
        const errs = {};
        if (!formQuantity || formQuantity % 1 !== 0 || formQuantity < 1)
            errs.quantity = 'Please select a valid quantity (multiple of 1)';
        return errs;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const errs = validateForm();
        if (Object.keys(errs).length > 0) { setFormErrors(errs); return; }
        if (isSubmitting) return;

        // ── MAX 16 CHECK ──────────────────────────────────────────────
        const currentTotal = meta?.total ?? filteredData.length;
        if (currentTotal + Number(formQuantity) > 16) {
            const remaining = 16 - currentTotal;
            if (remaining <= 0) {
                toast.error("Maximum limit of 16 Sample QR codes reached. Please delete some before generating more.");
            } else {
                toast.error(`Only ${remaining} more QR code(s) can be generated. Maximum limit is 16.`);
            }
            return;
        }
        // ─────────────────────────────────────────────────────────────

        try {
            setIsSubmitting(true);
            const res = await axios.post('https://api.hataoo.in/api/qr-code/generate', {
                quantity: Number(formQuantity),
                qrtype: "sample",
            });
            toast.success(res.data.message || `${formQuantity} QR codes generated successfully`);
            resetForm(); setVisible(false); getData(1, searchTerm, statusFilter);
        } catch (err) {
            toast.error(err.response?.data?.message || "An error occurred. Please try again.");
        } finally { setIsSubmitting(false); }
    };

    const hasActiveFilters = searchTerm || statusFilter !== '' || selectedItems.length > 0;

    if (loading) return <Loading />;

    const STATUS_OPTIONS = [
        { label: 'All Status', value: '' },
        { label: 'Active', value: 'true' },
        { label: 'Inactive', value: 'false' },
    ];

    return (
        <div className="flex flex-col h-[calc(100vh-120px)]">
            <PageBreadcrumb pageTitle="Sample QR Codes" />

            <div className="flex-1 overflow-y-auto overflow-x-hidden">
                <div className="rounded-2xl border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">

                    {/* Header bar */}
                    <div className="px-6 pt-5">
                        <div className="flex justify-between items-center px-4 py-3 mt-4 gap-4 flex-wrap">

                            <div className="flex gap-3 items-center flex-wrap">
                                {/* Search */}
                                <div ref={searchContainerRef} className="relative">
                                    <form onSubmit={handleSearchSubmit}>
                                        <div className="relative flex align-middle justify-center">
                                            <span className="absolute -translate-y-1/2 pointer-events-none left-4 top-1/2">
                                                <svg className="fill-gray-500 dark:fill-gray-400" width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                    <path fillRule="evenodd" clipRule="evenodd" d="M3.04175 9.37363C3.04175 5.87693 5.87711 3.04199 9.37508 3.04199C12.8731 3.04199 15.7084 5.87693 15.7084 9.37363C15.7084 12.8703 12.8731 15.7053 9.37508 15.7053C5.87711 15.7053 3.04175 12.8703 3.04175 9.37363ZM9.37508 1.54199C5.04902 1.54199 1.54175 5.04817 1.54175 9.37363C1.54175 13.6991 5.04902 17.2053 9.37508 17.2053C11.2674 17.2053 13.003 16.5344 14.357 15.4176L17.177 18.238C17.4699 18.5309 17.9448 18.5309 18.2377 18.238C18.5306 17.9451 18.5306 17.4703 18.2377 17.1774L15.418 14.3573C16.5365 13.0033 17.2084 11.2669 17.2084 9.37363C17.2084 5.04817 13.7011 1.54199 9.37508 1.54199Z" fill="" />
                                                </svg>
                                            </span>
                                            <input type="text"
                                                placeholder="Search by name, plate, contact..."
                                                value={searchTerm} onChange={handleSearch}
                                                className="dark:bg-dark-900 h-11 w-full rounded-lg border border-gray-200 bg-transparent py-2.5 pl-12 pr-14 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-none focus:ring focus:ring-brand-500/10 dark:border-gray-800 dark:bg-gray-900 dark:bg-white/[0.03] dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800 xl:w-[300px]" />
                                            <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
                                                {searchTerm && (
                                                    <button type="button" onClick={handleClearSearch}
                                                        className="inline-flex items-center px-[7px] py-[4.5px] text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300">
                                                        <FontAwesomeIcon icon={faTimes} />
                                                    </button>
                                                )}
                                                <button type="submit"
                                                    className="inline-flex items-center px-[7px] py-[4.5px] text-xs text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400">
                                                    <FontAwesomeIcon icon={faSearch} />
                                                </button>
                                            </div>
                                        </div>
                                    </form>
                                </div>

                                {/* Status Filter Dropdown */}
                                <div ref={filterDropdownRef} className="relative">
                                    <button type="button" onClick={() => setFilterDropdownOpen(!filterDropdownOpen)}
                                        className={`h-11 flex items-center gap-2 px-4 rounded-lg border text-sm font-medium transition-colors
                                            ${statusFilter !== ''
                                                ? 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300'
                                                : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300'}`}>
                                        <FontAwesomeIcon icon={faFilter} className="text-xs" />
                                        <span>
                                            {statusFilter === '' ? 'Filter' : statusFilter === 'true' ? 'Active' : 'Inactive'}
                                        </span>
                                        <FontAwesomeIcon icon={faChevronDown}
                                            className={`text-xs transition-transform ${filterDropdownOpen ? 'rotate-180' : ''}`} />
                                    </button>

                                    {filterDropdownOpen && (
                                        <div className="absolute right-0 top-12 z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl min-w-[180px] overflow-hidden">
                                            <div className="p-2">
                                                <p className="text-[10px] text-gray-400 uppercase tracking-widest px-2 mb-1">Status</p>
                                                {STATUS_OPTIONS.map(opt => (
                                                    <button key={opt.value} type="button"
                                                        onClick={() => handleStatusFilter(opt.value)}
                                                        className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm rounded-lg transition-colors text-left
                                                            ${statusFilter === opt.value
                                                                ? 'bg-yellow-50 text-yellow-700 font-medium dark:bg-yellow-900/20 dark:text-yellow-400'
                                                                : 'text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700'}`}>
                                                        <span className={`w-2 h-2 rounded-full flex-shrink-0`} />
                                                        {opt.label}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Select All toggle */}
                                {currentItems.length > 0 && (
                                    <button onClick={handleSelectAll}
                                        className="h-11 flex items-center gap-2 px-4 rounded-lg border text-sm font-medium transition-colors border-gray-200 bg-white text-gray-600 hover:border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300">
                                        <input type="checkbox" readOnly checked={selectAll}
                                            className="w-4 h-4 text-yellow-400 border-gray-300 rounded pointer-events-none" />
                                        <span>Select All</span>
                                    </button>
                                )}
                            </div>


                            <Button onClick={() => toggleModal('add')}
                                className="rounded-md border-0 shadow-md px-4 py-2 text-black h-11"
                                style={{ background: "#eab308" }}>
                                <FontAwesomeIcon icon={faPlus} className="pe-2" /> Generate QR
                            </Button>
                        </div>


                        {/* Left: bulk actions */}
                        <div className="flex gap-4 items-center justify-between flex-wrap mt-3 ps-4">
                            {selectedItems.length > 0 && (
                                <div className="d-flex">
                                    <Button onClick={() => openDeleteModal(null, true)} disabled={isDeleting}
                                        variant="danger" className="d-flex align-items-center gap-2 py-1"
                                        style={{ fontSize: "14px", color: "#f13838", border: "none", background: "transparent" }}>
                                        {isDeleting
                                            ? <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                                            : <><FontAwesomeIcon icon={faTrash} className="pe-2" /><span>DELETE SELECTED ({selectedItems.length})</span></>}
                                    </Button>

                                    {/* Download selected button */}
                                    <Button onClick={handleDownloadSelected}
                                        className="d-flex align-items-center gap-2 py-1 ps-3"
                                        style={{ fontSize: "14px", color: "#16a34a", border: "none", background: "transparent" }}>
                                        <FontAwesomeIcon icon={faDownload} className="pe-2" />
                                        <span>DOWNLOAD SELECTED ({selectedItems.length})</span>
                                    </Button>
                                </div>
                            )}
                            {hasActiveFilters && (
                                <Button onClick={clearAllFilters} variant="outline-secondary"
                                    className="d-flex align-items-center gap-2 py-1 border-0 bg-transparent"
                                    style={{ fontSize: "14px", color: "#f13838" }}>
                                    CLEAR ALL
                                </Button>
                            )}
                        </div>
                    </div>

                    {/* QR Grid */}
                    <div className="p-6">
                        {currentItems.length > 0 ? (
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4 gap-4">
                                {currentItems.map((item, index) => {
                                    const globalIndex = ((currentPage - 1) * ITEMS_PER_PAGE) + index + 1;
                                    return (
                                        <QrCard
                                            key={item._id}
                                            item={item}
                                            index={globalIndex}
                                            onDelete={(id) => openDeleteModal(id)}
                                            onInfo={(qr) => setInfoModal({ open: true, qr })}
                                            isSelected={selectedItems.includes(item._id)}
                                            onSelect={handleSelectItem}
                                            onDownload={(url, globalIndex) => downloadQr(url, globalIndex)}
                                            onReset={handleResetQr}   
                                            type={"sample"}
                                        />
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-24 text-gray-400 dark:text-gray-600">
                                <FontAwesomeIcon icon={faQrcode} className="text-6xl mb-4 opacity-30" />
                                <p className="text-lg font-medium">No QR Codes Found</p>
                                <p className="text-sm mt-1">
                                    {searchTerm
                                        ? `No results for "${searchTerm}"`
                                        : statusFilter !== ''
                                            ? `No ${statusFilter === 'true' ? 'active' : 'inactive'} QR codes`
                                            : 'Generate your first batch of QR codes'}
                                </p>
                                {!searchTerm && statusFilter === '' && (
                                    <button onClick={() => toggleModal('add')}
                                        className="mt-4 px-5 py-2 text-sm font-semibold text-black rounded-lg transition-colors">
                                        Generate QR Codes
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Pagination */}
            <div className="w-full border-t dark:bg-gray-900 dark:border-gray-700 mt-0">
                <CustomPagination
                    currentPage={currentPage}
                    totalPages={meta ? meta.pages : 1}
                    onPageChange={(page) => {
                        setCurrentPage(page); setSelectedItems([]); setSelectAll(false);
                        getData(page, searchTerm, statusFilter);
                    }}
                    itemsPerPage={ITEMS_PER_PAGE}
                    totalItems={meta ? meta.total : filteredData.length}
                />
            </div>

            {/* Generate QR Modal */}
            {visible && (
                <div className="fixed inset-0 z-[99999] flex items-center justify-center px-4"
                    style={{ backgroundColor: 'rgba(0,0,0,0.55)' }}>
                    <div className="relative bg-white dark:bg-gray-900 rounded-2xl w-full shadow-2xl overflow-hidden"
                        style={{ maxWidth: 480 }}>
                        <div className="bg-gray-50 px-6 py-4 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <h2 className="text-lg font-bold text-black">Generate QR Codes</h2>
                            </div>
                            <button type="button" onClick={() => !isSubmitting && toggleModal()}
                                className="text-black/70 hover:text-black transition-colors p-1">
                                <FontAwesomeIcon icon={faTimes} className="text-xl" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-5">
                            <div>
                                <label className="block text-sm font-semibold mb-2 dark:text-gray-300">
                                    Quantity <span className="text-red-500">*</span>
                                </label>
                                <div className="grid grid-cols-4 gap-2">
                                    {QUANTITY_OPTIONS.map((multiplier) => {
                                        const qty = multiplier * 1;
                                        return (
                                            <button key={multiplier} type="button"
                                                disabled={isSubmitting}
                                                onClick={() => {
                                                    setFormQuantity(qty);
                                                    if (formErrors.quantity) setFormErrors(p => { const e = { ...p }; delete e.quantity; return e; });
                                                }}
                                                className={`py-2 px-3 rounded-xl border-2 text-sm font-bold transition-all duration-150 flex flex-col items-center
                                                    ${formQuantity === qty
                                                        ? 'border-gray-400 bg-yellow-400 text-black shadow-sm scale-105'
                                                        : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300 hover:bg-yellow-50/50'}`}>
                                                {/* <span className="text-xs font-normal opacity-70">16×{multiplier}</span> */}
                                                <span>{qty}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                                {formErrors.quantity && <p className="text-red-500 text-xs mt-1">{formErrors.quantity}</p>}
                            </div>

                            <div className="flex gap-3 pt-1">
                                <button type="button" onClick={() => toggleModal()} disabled={isSubmitting}
                                    className="flex-1 py-2.5 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-sm font-medium disabled:opacity-50">
                                    Cancel
                                </button>
                                <button type="submit" disabled={isSubmitting}
                                    className="flex-1 py-2.5 text-black rounded-xl transition-colors text-sm font-bold disabled:opacity-50 flex items-center justify-center gap-2"
                                    style={{ backgroundColor: "#eab308" }}>
                                    {isSubmitting
                                        ? <><div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" /><span>Generating...</span></>
                                        : <><span>Generate {formQuantity} QRs</span></>}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Modal */}
            <DeleteModal isOpen={deleteModal.isOpen} isBulk={deleteModal.isBulk} selectedCount={selectedItems.length}
                isDeleting={isDeleting} onClose={closeDeleteModal} value={"QR code"}
                onConfirm={deleteModal.isBulk ? handleDeleteSelected : handleDelete} />

            {/* QR Info Modal */}
            {infoModal.open && (
                <QrInfoModal
                    qr={infoModal.qr}
                    onClose={() => setInfoModal({ open: false, qr: null })}
                />
            )}

            <ToastContainer position="top-center" className="!z-[99999]" />
        </div>
    );
};

export default SampleQrcode;