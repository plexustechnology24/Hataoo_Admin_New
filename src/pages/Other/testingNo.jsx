import React, { useCallback, useEffect, useRef, useState } from "react";
import axios from "axios";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "../../components/ui/table";
import { Button } from "react-bootstrap";
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEdit, faPlus, faSearch, faTrash, faTimes } from "@fortawesome/free-solid-svg-icons";
import CustomPagination from "../../components/common/pagination";
import Loading from "../../components/loading";
import DeleteModal from "../../components/deleteModal";

const TestingNo = () => {
    const [visible, setVisible] = useState(false);
    const [meta, setMeta] = useState(null);
    const [id, setId] = useState();
    const [loading, setLoading] = useState(true);
    const [filteredData, setFilteredData] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(15);
    const [deleteModal, setDeleteModal] = useState({ isOpen: false, id: null, isBulk: false });

    const [searchTerm, setSearchTerm] = useState('');
    const searchContainerRef = useRef(null);

    // Form fields
    const [formNumber, setFormNumber] = useState('');
    const [formOtp, setFormOtp] = useState('');
    const [formErrors, setFormErrors] = useState({});

    // Multi-select
    const [selectedItems, setSelectedItems] = useState([]);

    // const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = ((currentPage - 1) * itemsPerPage);
    const currentItems = filteredData;

    // ─── Search handlers ──────────────────────────────────────────────────────
    const handleSearch = (e) => {
        const value = e.target.value;
        setSearchTerm(value);
        if (value.trim() === '') {
            setCurrentPage(1);
            getData(1, '');
        }
    };

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        setCurrentPage(1);
        getData(1, searchTerm.trim());
    };

    const handleClearSearch = () => {
        setSearchTerm('');
        setCurrentPage(1);
        getData(1, '');
    };

    // ─── Data fetching ────────────────────────────────────────────────────────
    const getData = useCallback((page = 1, search = '') => {
        setLoading(true);
        const params = { page, limit: itemsPerPage };
        if (search && search.trim() !== '') params.search = search.trim();

        axios.get('https://api.hataoo.in/api/testing-number/read', { params })
            .then((res) => {
                const responseData = res.data.data || [];
                const responsePagination = res.data.meta;
                setFilteredData(responseData);
                setMeta(responsePagination);
                if (responsePagination) setCurrentPage(responsePagination.currentPage || page);
                setSelectedItems([]);
            })
            .catch((err) => {
                console.error(err);
                toast.error("No Data Found");
            })
            .finally(() => setLoading(false));
    }, [itemsPerPage]);

    useEffect(() => { getData(1, ''); }, [getData]);

    // ─── Delete ───────────────────────────────────────────────────────────────
    const openDeleteModal = (deleteId = null, isBulk = false) => {
        if (isBulk && selectedItems.length === 0) { toast.info("No items selected."); return; }
        setDeleteModal({ isOpen: true, id: deleteId, isBulk });
    };
    const closeDeleteModal = () => setDeleteModal({ isOpen: false, id: null, isBulk: false });

    const handleDelete = () => {
        axios.delete(`https://api.hataoo.in/api/testing-number/delete/${deleteModal.id}`)
            .then((res) => {
                const newPage = currentItems.length === 1 && currentPage > 1 ? currentPage - 1 : currentPage;
                getData(newPage, searchTerm);
                closeDeleteModal();
                toast.success(res.data.message);
            })
            .catch(() => toast.error("An error occurred. Please try again."));
    };

    // ─── Form helpers ─────────────────────────────────────────────────────────
    const resetForm = () => {
        setFormNumber('');
        setFormOtp('');
        setFormErrors({});
        setId(undefined); // ← ADD THIS
    };

    const toggleModal = (mode) => {
        if (visible) {
            resetForm();       // clears id too now
            setVisible(false);
        } else {
            if (mode === 'add') resetForm();
            setVisible(true);
        }
    };

    const validateForm = () => {
        const errs = {};
        if (!formNumber.trim()) errs.number = 'Number is required';
        if (!formOtp.trim()) errs.otp = 'OTP is required';
        else if (!/^\d{4}$/.test(formOtp.trim())) errs.otp = 'OTP must be exactly 4 digits';
        return errs;
    };


    // ─── OTP input: allow only digits, max 4 ─────────────────────────────────
    const handleOtpChange = (e) => {
        const val = e.target.value.replace(/\D/g, '').slice(0, 4);
        setFormOtp(val);
        if (formErrors.otp) setFormErrors(p => { const err = { ...p }; delete err.otp; return err; });
    };

    // ─── Submit ───────────────────────────────────────────────────────────────
    const handleSubmit = async (e) => {
        e.preventDefault();
        const errs = validateForm();
        if (Object.keys(errs).length > 0) { setFormErrors(errs); return; }
        if (isSubmitting) return;
        try {
            setIsSubmitting(true);
            const formData = new FormData();
            formData.append('number', formNumber.trim());
            formData.append('otp', formOtp.trim());
            if (id) {
                const res = await axios.patch(`https://api.hataoo.in/api/testing-number/update/${id}`, formData);
                toast.success(res.data.message || 'Successfully updated');
            } else {
                await axios.post('https://api.hataoo.in/api/testing-number/create', formData);
                toast.success('Successfully created');
            }
            resetForm(); setVisible(false); getData(currentPage, searchTerm);
        } catch (err) {
            // Show backend duplicate OTP error or generic error
            toast.error(err.response?.data?.message || "An error occurred. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEdit = (file) => {
        setId(file._id);
        setFormNumber(file.number || '');
        setFormOtp(file.otp || '');
        setFormErrors({}); // ← already present, keep it
        setVisible(true);
    };

    const handleCopy = (text, label) => {
        navigator.clipboard.writeText(text).then(() => {
            toast.success(`${label} copied!`);
        }).catch(() => {
            toast.error("Failed to copy");
        });
    };

    // ─── Loading ──────────────────────────────────────────────────────────────
    if (loading) return <Loading />;

    // ─── Render ───────────────────────────────────────────────────────────────
    return (
        <div className="flex flex-col h-[calc(100vh-120px)]">
            <PageBreadcrumb pageTitle="Testing Phone Numbers" />

            <div className="flex-1 overflow-y-auto overflow-x-hidden">
                <div className="rounded-2xl border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">

                    {/* ── Header bar ── */}
                    <div className="px-6 pt-5">
                        <div className="flex justify-end items-center px-4 py-3 mt-4 gap-4 flex-wrap">

                            {/* Right: search + add */}
                            <div className="flex gap-3 items-center flex-wrap">
                                <div ref={searchContainerRef} className="relative">
                                    <form onSubmit={handleSearchSubmit}>
                                        <div className="relative flex align-middle justify-center">
                                            <span className="absolute -translate-y-1/2 pointer-events-none left-4 top-1/2">
                                                <svg className="fill-gray-500 dark:fill-gray-400" width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                    <path fillRule="evenodd" clipRule="evenodd" d="M3.04175 9.37363C3.04175 5.87693 5.87711 3.04199 9.37508 3.04199C12.8731 3.04199 15.7084 5.87693 15.7084 9.37363C15.7084 12.8703 12.8731 15.7053 9.37508 15.7053C5.87711 15.7053 3.04175 12.8703 3.04175 9.37363ZM9.37508 1.54199C5.04902 1.54199 1.54175 5.04817 1.54175 9.37363C1.54175 13.6991 5.04902 17.2053 9.37508 17.2053C11.2674 17.2053 13.003 16.5344 14.357 15.4176L17.177 18.238C17.4699 18.5309 17.9448 18.5309 18.2377 18.238C18.5306 17.9451 18.5306 17.4703 18.2377 17.1774L15.418 14.3573C16.5365 13.0033 17.2084 11.2669 17.2084 9.37363C17.2084 5.04817 13.7011 1.54199 9.37508 1.54199Z" fill="" />
                                                </svg>
                                            </span>
                                            <input
                                                type="text"
                                                placeholder="Search by number"
                                                aria-label="Search"
                                                value={searchTerm}
                                                onChange={handleSearch}
                                                className="dark:bg-dark-900 h-11 w-full rounded-lg border border-gray-200 bg-transparent py-2.5 pl-12 pr-14 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-none focus:ring focus:ring-brand-500/10 dark:border-gray-800 dark:bg-gray-900 dark:bg-white/[0.03] dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800 xl:w-[350px]"
                                            />
                                            <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
                                                {searchTerm && (
                                                    <button type="button"
                                                        className="inline-flex items-center px-[7px] py-[4.5px] text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                                                        onClick={handleClearSearch} title="Clear search">
                                                        <FontAwesomeIcon icon={faTimes} />
                                                    </button>
                                                )}
                                                <button type="submit"
                                                    className="inline-flex items-center px-[7px] py-[4.5px] text-xs text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400"
                                                    title="Search">
                                                    <FontAwesomeIcon icon={faSearch} />
                                                </button>
                                            </div>
                                        </div>
                                    </form>
                                </div>

                                <Button onClick={() => toggleModal('add')}
                                    className="rounded-md border-0 shadow-md px-4 py-2 text-white"
                                    style={{ background: "#7C7FFF" }}>
                                    <FontAwesomeIcon icon={faPlus} className="pe-2" /> Add phone number
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
                                        <TableCell isHeader className="py-4 font-medium text-gray-500 px-2 border-r border-gray-200 dark:border-gray-700 w-12">#</TableCell>
                                        {/* NEW COLUMNS */}
                                        <TableCell isHeader className="py-4 font-medium text-gray-500 px-2 border-r border-gray-200 dark:border-gray-700 w-32">Number</TableCell>
                                        <TableCell isHeader className="py-4 font-medium text-gray-500 px-2 border-r border-gray-200 dark:border-gray-700 w-24">OTP</TableCell>
                                        <TableCell isHeader className="py-4 font-medium text-gray-500 px-2 border-r border-gray-200 dark:border-gray-700 w-24">Actions</TableCell>
                                    </TableRow>
                                </TableHeader>

                                <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                                    {currentItems.length > 0 ? (
                                        currentItems.map((file, index) => (
                                            <TableRow key={file._id}>

                                                <TableCell className="text-center px-2 border-r border-gray-200 dark:border-gray-700 dark:text-gray-400">
                                                    {indexOfFirstItem + index + 1}
                                                </TableCell>

                                                {/* Number column */}
                                                <TableCell className="py-3 px-3 border-r border-gray-200 dark:border-gray-700 dark:text-gray-300 text-center">
                                                    <div className="flex items-center justify-center gap-2">
                                                        <span className="text-sm" title={file.number}>
                                                            {file.number || '—'}
                                                        </span>
                                                        {file.number && (
                                                            <button
                                                                onClick={() => handleCopy(file.number, 'Number')}
                                                                title="Copy number"
                                                                className="text-gray-400 hover:text-indigo-600 transition-colors"
                                                            >
                                                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                                    <rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                                                                </svg>
                                                            </button>
                                                        )}
                                                    </div>
                                                </TableCell>

                                                {/* OTP column */}
                                                <TableCell className="py-3 px-3 border-r border-gray-200 dark:border-gray-700 dark:text-gray-300 text-center">
                                                    <div className="flex items-center justify-center gap-2">
                                                        <span className="inline-flex items-center justify-center px-2 py-1 rounded-md bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 font-mono font-semibold text-sm tracking-widest">
                                                            {file.otp || '—'}
                                                        </span>
                                                        {file.otp && (
                                                            <button
                                                                onClick={() => handleCopy(file.otp, 'OTP')}
                                                                title="Copy OTP"
                                                                className="text-gray-400 hover:text-indigo-600 transition-colors"
                                                            >
                                                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                                    <rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                                                                </svg>
                                                            </button>
                                                        )}
                                                    </div>
                                                </TableCell>

                                                <TableCell className="py-3 px-2 border-r border-gray-200 dark:border-gray-700">
                                                    <div className="flex items-center justify-center gap-4">
                                                        <button style={{ color: "#0385C3" }} onClick={() => handleEdit(file)} title="Edit">
                                                            <FontAwesomeIcon icon={faEdit} className="text-lg" />
                                                        </button>
                                                        <button className="text-red-600" onClick={() => openDeleteModal(file._id)} title="Delete">
                                                            <FontAwesomeIcon icon={faTrash} className="text-lg" />
                                                        </button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={9} className="text-center pt-5 pb-4 dark:text-gray-400">
                                                {searchTerm ? `No results found for "${searchTerm}"` : 'No Data Found'}
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
                        getData(page, searchTerm);
                    }}
                    itemsPerPage={itemsPerPage}
                    totalItems={meta ? meta.total : filteredData.length}
                />
            </div>

            {/* ── Add / Edit Modal ── */}
            {visible && (
                <div className="fixed inset-0 z-[99999] flex items-center justify-center">
                    <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => !isSubmitting && toggleModal()} />
                    <div className="relative bg-white rounded-lg w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto dark:bg-gray-800">
                        <div className="px-6 py-4 border-b dark:border-gray-700">
                            <h3 className="text-xl font-semibold dark:text-white">{id ? "Edit phone number" : "Add phone number"}</h3>
                        </div>
                        <div className="px-6 py-4">
                            <form onSubmit={handleSubmit}>

                                {/* Number + OTP — side by side */}
                                <div className="mb-4 flex gap-3">
                                    {/* Number */}
                                    <div className="flex-1">
                                        <label className="block font-medium mb-1 text-sm dark:text-gray-300">
                                            Number <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={formNumber}
                                            onChange={(e) => {
                                                setFormNumber(e.target.value);
                                                if (formErrors.number) setFormErrors(p => { const err = { ...p }; delete err.number; return err; });
                                            }}
                                            placeholder="Enter number"
                                            className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 dark:bg-gray-700 dark:text-white dark:border-gray-600 ${formErrors.number ? 'border-red-500' : 'border-gray-300'}`}
                                            disabled={isSubmitting}
                                        />
                                        {formErrors.number && <p className="text-red-500 text-xs mt-1">{formErrors.number}</p>}
                                    </div>

                                    {/* OTP */}
                                    <div className="w-36">
                                        <label className="block font-medium mb-1 text-sm dark:text-gray-300">
                                            OTP <span className="text-red-500">*</span>
                                            <span className="text-xs text-gray-400 font-normal ml-1">(4 digits)</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={formOtp}
                                            onChange={handleOtpChange}
                                            placeholder="0000"
                                            maxLength={4}
                                            inputMode="numeric"
                                            className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 font-mono tracking-widest text-center dark:bg-gray-700 dark:text-white dark:border-gray-600 ${formErrors.otp ? 'border-red-500' : 'border-gray-300'}`}
                                            disabled={isSubmitting}
                                        />
                                        {formErrors.otp && <p className="text-red-500 text-xs mt-1">{formErrors.otp}</p>}
                                    </div>
                                </div>

                                <div className="flex gap-4 mt-6">
                                    <button type="button" onClick={() => toggleModal()} disabled={isSubmitting}
                                        className="w-1/2 py-2 px-4 bg-gray-100 text-black rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50">
                                        Cancel
                                    </button>
                                    <button type="submit" disabled={isSubmitting}
                                        className="w-1/2 py-2 px-4 text-white rounded-lg transition-colors disabled:opacity-50"
                                        style={{ backgroundColor: "#7C7FFF" }}>
                                        {isSubmitting
                                            ? <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin mx-auto" />
                                            : id ? 'Update' : 'Submit'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Delete Confirm Modal ── */}
            <DeleteModal
                isOpen={deleteModal.isOpen}
                isBulk={deleteModal.isBulk}
                selectedCount={selectedItems.length}
                value={"number"}
                onClose={closeDeleteModal}
                onConfirm={handleDelete}
            />

            <ToastContainer position="top-center" className="!z-[99999]" />
        </div>
    );
};

export default TestingNo;