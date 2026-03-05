import React, { useCallback, useEffect, useRef, useState } from "react";
import axios from "axios";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "../../components/ui/table";
import { Button } from "react-bootstrap";
import ImagePreviewModal from "../../components/common/ImagePreview";
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faArrowUpFromBracket, faCopy, faEdit, faEye,
    faFileImage, faPlus, faSearch, faTrash, faTimes
} from "@fortawesome/free-solid-svg-icons";
import CustomPagination from "../../components/common/pagination";

const HowToWork = () => {
    const [visible, setVisible] = useState(false);
    const [pagination, setPagination] = useState(null);
    const [id, setId] = useState();
    const [loading, setLoading] = useState(true);
    const [imageFileLabel, setImageFileLabel] = useState('Image Upload');
    const [filteredData, setFilteredData] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(15);
    const [isDragging, setIsDragging] = useState(false);
    const [deleteModal, setDeleteModal] = useState({ isOpen: false, id: null, isBulk: false });
    const fileInputRef = useRef(null);
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [previewUrls, setPreviewUrls] = useState([]);
    const MAX_FILES = 1;

    const [previewIndex, setPreviewIndex] = useState(0);
    const [showPreview, setShowPreview] = useState(false);

    // Search — same pattern as AutoNotification
    const [searchTerm, setSearchTerm] = useState('');
    const searchContainerRef = useRef(null);

    // Form fields
    const [formTitle, setFormTitle] = useState('');
    const [formDescription, setFormDescription] = useState('');
    const [formLink, setFormLink] = useState('');
    const [formErrors, setFormErrors] = useState({});

    // Multi-select
    const [selectedItems, setSelectedItems] = useState([]);
    const [selectAll, setSelectAll] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredData;

    // ─── URL validation ───────────────────────────────────────────────────────
    const isValidUrl = (url) => {
        try {
            const u = new URL(url);
            return u.protocol === 'http:' || u.protocol === 'https:';
        } catch {
            return false;
        }
    };

    // ─── Search handlers (mirrors AutoNotification) ───────────────────────────
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

        axios.get('https://hataoo-backend.onrender.com/api/how-to-work/read', { params })
            .then((res) => {
                const responseData = res.data.data || [];
                const responsePagination = res.data.pagination || res.data.meta;
                setFilteredData(responseData);
                setPagination(responsePagination);
                if (responsePagination) setCurrentPage(responsePagination.currentPage || page);
                setSelectedItems([]);
                setSelectAll(false);
            })
            .catch((err) => {
                console.error(err);
                toast.error("No Data Found");
            })
            .finally(() => setLoading(false));
    }, [itemsPerPage]);

    useEffect(() => { getData(1, ''); }, [getData]);

    // ─── Select all / individual ──────────────────────────────────────────────
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

    // ─── Delete ───────────────────────────────────────────────────────────────
    const openDeleteModal = (deleteId = null, isBulk = false) => {
        if (isBulk && selectedItems.length === 0) { toast.info("No items selected."); return; }
        setDeleteModal({ isOpen: true, id: deleteId, isBulk });
    };
    const closeDeleteModal = () => setDeleteModal({ isOpen: false, id: null, isBulk: false });

    const handleDelete = () => {
        axios.delete(`https://hataoo-backend.onrender.com/api/how-to-work/delete/${deleteModal.id}`)
            .then((res) => {
                const newPage = currentItems.length === 1 && currentPage > 1 ? currentPage - 1 : currentPage;
                getData(newPage, searchTerm);
                closeDeleteModal();
                toast.success(res.data.message);
            })
            .catch(() => toast.error("An error occurred. Please try again."));
    };

    const handleDeleteSelected = () => {
        setIsDeleting(true);
        axios.post('https://hataoo-backend.onrender.com/api/admin/deleteMultiple', { ids: selectedItems, TypeId: "1" })
            .then(() => {
                toast.success(`Successfully deleted ${selectedItems.length} items.`);
                const remaining = currentItems.length - selectedItems.length;
                const newPage = remaining <= 0 && currentPage > 1 ? currentPage - 1 : currentPage;
                getData(newPage, searchTerm);
            })
            .catch(() => toast.error("Failed to delete selected items."))
            .finally(() => { setIsDeleting(false); closeDeleteModal(); });
    };

    const clearAllFilters = () => {
        setSearchTerm('');
        setSelectedItems([]);
        setSelectAll(false);
        setCurrentPage(1);
        getData(1, '');
        toast.info("All filters cleared");
    };

    // ─── Preview ──────────────────────────────────────────────────────────────
    const handleShowPreview = (idx) => { setPreviewIndex(idx); setShowPreview(true); };

    const handlePreviewNavigation = async (newIndex, direction) => {
        const totalPages = pagination ? pagination.totalPages : 1;
        if (direction === 'next' && newIndex >= currentItems.length) {
            if (currentPage < totalPages) { const next = currentPage + 1; setPreviewIndex(0); setCurrentPage(next); getData(next, searchTerm); }
        } else if (direction === 'prev' && newIndex < 0) {
            if (currentPage > 1) { const prev = currentPage - 1; setCurrentPage(prev); getData(prev, searchTerm); setPreviewIndex(itemsPerPage - 1); }
        } else { setPreviewIndex(newIndex); }
    };

    // ─── Form helpers ─────────────────────────────────────────────────────────
    const resetForm = () => {
        setFormTitle(''); setFormDescription(''); setFormLink('');
        setSelectedFiles([]); setPreviewUrls([]);
        setImageFileLabel('Image Upload'); setId(undefined); setFormErrors({});
    };

    const toggleModal = (mode) => {
        if (!visible && mode === 'add') resetForm();
        else if (visible) resetForm();
        setVisible(!visible);
    };

    const validateForm = () => {
        const errs = {};
        if (!formTitle.trim()) errs.title = 'Title is required';
        if (!formDescription.trim()) errs.description = 'Description is required';
        if (!formLink.trim()) errs.link = 'Link is required';
        else if (!isValidUrl(formLink.trim())) errs.link = 'Please enter a valid URL (must start with http:// or https://)';
        if (!id && selectedFiles.length === 0) errs.file = 'Please select an image';
        return errs;
    };

    // ─── Image compression ────────────────────────────────────────────────────
    const compressImage = useCallback((file) => {
        return new Promise((resolve, reject) => {

            if (file.type === "image/gif" || file.size < 2 * 1024 * 1024) {
                resolve(file);
                return;
            }

            const reader = new FileReader();

            reader.onload = (event) => {
                const img = new Image();

                img.onload = () => {
                    let { width, height } = img;
                    const MAX = 2000;

                    if (width > MAX || height > MAX) {
                        if (width > height) {
                            height = Math.round((height * MAX) / width);
                            width = MAX;
                        } else {
                            width = Math.round((width * MAX) / height);
                            height = MAX;
                        }
                    }

                    const canvas = document.createElement("canvas");
                    canvas.width = width;
                    canvas.height = height;

                    const ctx = canvas.getContext("2d");
                    ctx.imageSmoothingEnabled = true;
                    ctx.imageSmoothingQuality = "high";

                    ctx.drawImage(img, 0, 0, width, height);

                    const outputType =
                        file.type === "image/png" ? "image/png" : "image/jpeg";

                    canvas.toBlob(
                        (blob) => {
                            if (!blob) {
                                reject(new Error("Canvas to Blob failed"));
                                return;
                            }

                            resolve(
                                new File([blob], file.name, {
                                    type: outputType,
                                    lastModified: Date.now(),
                                })
                            );
                        },
                        outputType,
                        outputType === "image/png" ? 1 : 0.92
                    );
                };

                img.onerror = () =>
                    reject(new Error("Failed to load image"));

                img.src = event.target.result;
            };

            reader.onerror = () =>
                reject(new Error("Failed to read file"));

            reader.readAsDataURL(file);
        });
    }, []);

    const handleFileChange = useCallback(async (event) => {
        const files = Array.from(event.currentTarget.files);

        if (id) {
            if (files.length > 1) {
                toast.error('Only one image when editing');
                return;
            }
            setSelectedFiles([]);
            setPreviewUrls([]);
        } else if (selectedFiles.length + files.length > MAX_FILES) {
            toast.error(`Maximum ${MAX_FILES} image`);
            return;
        }

        const processed = [];
        const previews = [];

        for (const file of files) {
            try {
                const pf = await compressImage(file);

                if (pf.size > 5 * 1024 * 1024) {
                    toast.error(`${file.name} exceeds 5 MB`);
                    continue;
                }

                processed.push(pf);
                previews.push(URL.createObjectURL(pf));
            } catch {
                toast.error(`Error processing ${file.name}`);
            }
        }

        if (id) {
            setSelectedFiles(processed);
            setPreviewUrls(previews);
        } else {
            setSelectedFiles(prev => [...prev, ...processed]);
            setPreviewUrls(prev => [...prev, ...previews]);
        }

        if (formErrors.file) {
            setFormErrors(prev => {
                const e = { ...prev };
                delete e.file;
                return e;
            });
        }
    }, [
        id,
        selectedFiles.length,
        MAX_FILES,
        compressImage,
        formErrors.file
    ]);

    const removeFile = (index) => {
        URL.revokeObjectURL(previewUrls[index]);
        setSelectedFiles(selectedFiles.filter((_, i) => i !== index));
        setPreviewUrls(previewUrls.filter((_, i) => i !== index));
    };

    const onDrop = useCallback((e) => {
        e.preventDefault(); e.stopPropagation(); setIsDragging(false);
        if (isSubmitting) return;
        const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
        if (!files.length) { toast.error('Image files only'); return; }
        if (selectedFiles.length + files.length > MAX_FILES) { toast.error(`Maximum ${MAX_FILES} image`); return; }
        handleFileChange({ currentTarget: { files } });
    }, [isSubmitting, selectedFiles, handleFileChange]);

    const onDragOver = useCallback((e) => { e.preventDefault(); e.stopPropagation(); if (!isSubmitting) setIsDragging(true); }, [isSubmitting]);
    const onDragLeave = useCallback((e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); }, []);

    // ─── Submit ───────────────────────────────────────────────────────────────
    const handleSubmit = async (e) => {
        e.preventDefault();
        const errs = validateForm();
        if (Object.keys(errs).length > 0) { setFormErrors(errs); return; }
        if (isSubmitting) return;
        try {
            setIsSubmitting(true);
            const formData = new FormData();
            formData.append('title', formTitle.trim());
            formData.append('description', formDescription.trim());
            formData.append('link', formLink.trim());
            if (selectedFiles.length > 0) formData.append('file', selectedFiles[0]);

            if (id) {
                const res = await axios.patch(`https://hataoo-backend.onrender.com/api/how-to-work/update/${id}`, formData);
                toast.success(res.data.message || 'Successfully updated');
            } else {
                await axios.post('https://hataoo-backend.onrender.com/api/how-to-work/create', formData);
                toast.success('Successfully created');
            }
            resetForm(); setVisible(false); getData(currentPage, searchTerm);
        } catch (err) {
            toast.error(err.response?.data?.message || "An error occurred. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEdit = (file) => {
        setPreviewUrls([file.file]); setSelectedFiles([]);
        setId(file._id); setFormTitle(file.title || '');
        setFormDescription(file.description || ''); setFormLink(file.link || '');
        setFormErrors({});
        setImageFileLabel('Image Upload (Select new to replace, or keep existing)');
        setVisible(true);
    };

    const handleCopyToClipboard = (file) => {
        if (file?.file) {
            navigator.clipboard.writeText(file.file)
                .then(() => toast.success("Image URL copied!"))
                .catch(() => toast.error("Failed to copy URL"));
        } else toast.error("No URL to copy!");
    };

    // ─── Loading ──────────────────────────────────────────────────────────────
    if (loading) return (
        <div style={{ height: '80vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <div className="border p-4 flex items-center space-x-2 rounded-md">
                <div className="w-10 h-10 border-2 border-gray-300 rounded-full animate-spin" style={{ borderTop: "2px solid #eab308" }} />
            </div>
        </div>
    );

    // ─── Render ───────────────────────────────────────────────────────────────
    return (
        // Full viewport height, flex column — pagination always sticks to bottom
        <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
            <PageBreadcrumb pageTitle="How to work (Why us)" />

            {/* Scrollable middle area */}
            <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
                <div className="rounded-2xl border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">

                    {/* ── Header bar ── */}
                    <div className="px-6 pt-5">
                        <div className="flex justify-between items-center px-4 py-3 mt-4 gap-4 flex-wrap">

                            {/* Left: bulk delete + clear */}
                            <div className="flex gap-4 items-center">
                                {selectedItems.length > 0 && (
                                    <Button onClick={() => openDeleteModal(null, true)} disabled={isDeleting}
                                        variant="danger" className="d-flex align-items-center gap-2 py-1"
                                        style={{ fontSize: "14px", color: "#f13838", border: "none" }}>
                                        {isDeleting
                                            ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                            : <><FontAwesomeIcon icon={faTrash} className="pe-2" /><span>DELETE SELECTED ({selectedItems.length})</span></>}
                                    </Button>
                                )}
                                {(selectedItems.length > 0 || searchTerm) && (
                                    <Button onClick={clearAllFilters} variant="outline-secondary"
                                        className="d-flex align-items-center gap-2 py-1 border-0 bg-transparent"
                                        style={{ fontSize: "14px", color: "#f13838" }}>
                                        CLEAR ALL
                                    </Button>
                                )}
                            </div>

                            {/* Right: search + add — identical markup to AutoNotification */}
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
                                                placeholder="Search by title, description, link..."
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
                                    className="rounded-md border-0 shadow-md px-4 py-2 text-black"
                                    style={{ background: "#eab308" }}>
                                    <FontAwesomeIcon icon={faPlus} className="pe-2" /> Add Content
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
                                                <input type="checkbox" className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                                    checked={selectAll} onChange={handleSelectAll} />
                                            </div>
                                        </TableCell>
                                        <TableCell isHeader className="py-4 font-medium text-gray-500 px-2 border-r border-gray-200 dark:border-gray-700 w-12">#</TableCell>
                                        <TableCell isHeader className="py-4 font-medium text-gray-500 px-2 border-r border-gray-200 dark:border-gray-700 w-24">Image</TableCell>
                                        <TableCell isHeader className="py-4 font-medium text-gray-500 px-2 border-r border-gray-200 dark:border-gray-700">Title</TableCell>
                                        <TableCell isHeader className="py-4 font-medium text-gray-500 px-2 border-r border-gray-200 dark:border-gray-700">Description</TableCell>
                                        <TableCell isHeader className="py-4 font-medium text-gray-500 px-2 border-r border-gray-200 dark:border-gray-700">Link</TableCell>
                                        <TableCell isHeader className="py-4 font-medium text-gray-500 px-2 border-r border-gray-200 dark:border-gray-700 w-24">Actions</TableCell>
                                    </TableRow>
                                </TableHeader>

                                <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                                    {currentItems.length > 0 ? (
                                        currentItems.map((file, index) => (
                                            <TableRow key={file._id}>
                                                <TableCell className="py-3 px-2 border-r border-gray-200 dark:border-gray-700">
                                                    <div className="flex items-center justify-center">
                                                        <input type="checkbox" className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                                            checked={selectedItems.includes(file._id)}
                                                            onChange={() => handleSelectItem(file._id)} />
                                                    </div>
                                                </TableCell>

                                                <TableCell className="text-center px-2 border-r border-gray-200 dark:border-gray-700 dark:text-gray-400">
                                                    {indexOfFirstItem + index + 1}
                                                </TableCell>

                                                <TableCell className="py-3 px-2 border-r border-gray-200 dark:border-gray-700">
                                                    <div className="relative w-[60px] h-[60px] mx-auto group">
                                                        <div className="absolute inset-0 bg-gray-200 dark:bg-gray-700 animate-pulse flex items-center justify-center rounded">
                                                            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                            </svg>
                                                        </div>
                                                        <img src={file.file} alt="thumbnail"
                                                            className="w-full h-full object-cover cursor-pointer relative z-10 rounded"
                                                            onLoad={(e) => { e.target.style.opacity = 1; if (e.target.previousSibling) e.target.previousSibling.style.display = 'none'; }}
                                                            style={{ opacity: 0 }} />
                                                        <div className="absolute inset-0 bg-black bg-opacity-60 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-2 transition-opacity duration-200 z-20 rounded">
                                                            <button onClick={() => handleShowPreview(index)} className="text-white hover:text-blue-300" title="Preview">
                                                                <FontAwesomeIcon icon={faEye} />
                                                            </button>
                                                            <button onClick={() => handleCopyToClipboard(file)} className="text-white hover:text-blue-300" title="Copy URL">
                                                                <FontAwesomeIcon icon={faCopy} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                </TableCell>

                                                <TableCell className="py-3 px-3 border-r border-gray-200 dark:border-gray-700 dark:text-gray-300 text-center">
                                                    <div className="font-medium text-sm mx-auto" style={{ maxWidth: 200, overflow: 'hidden' }} title={file.title}>
                                                        {file.title || '—'}
                                                    </div>
                                                </TableCell>

                                                <TableCell className="py-3 px-3 border-r border-gray-200 dark:border-gray-700 dark:text-gray-400 text-center">
                                                    <div className="text-sm mx-auto" style={{ maxWidth: 220, overflow: 'hidden', display: '-webkit-box' }} title={file.description}>
                                                        {file.description || '—'}
                                                    </div>
                                                </TableCell>

                                                <TableCell className="py-3 px-3 border-r border-gray-200 dark:border-gray-700 text-center">
                                                    {file.link
                                                        ? <a href={file.link} target="_blank" rel="noopener noreferrer"
                                                            className="text-blue-500 hover:text-blue-700 text-sm"
                                                            style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}
                                                            title={file.link}>{file.link}</a>
                                                        : <span className="text-gray-400 text-sm">—</span>}
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
                                            <td colSpan={7} className="text-center pt-5 pb-4 dark:text-gray-400">
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

            {/* ── Pagination — flex-shrink-0 keeps it always at the bottom ── */}
            <div className="border-t bg-white dark:bg-gray-900 dark:border-gray-700 flex-shrink-0">
                <CustomPagination
                    currentPage={currentPage}
                    totalPages={pagination ? pagination.totalPages : 1}
                    onPageChange={(page) => {
                        setCurrentPage(page);
                        setSelectedItems([]);
                        setSelectAll(false);
                        getData(page, searchTerm);
                    }}
                    itemsPerPage={itemsPerPage}
                    totalItems={pagination ? pagination.total : filteredData.length}
                />
            </div>

            {/* ── Add / Edit Modal ── */}
            {visible && (
                <div className="fixed inset-0 z-[99999] flex items-center justify-center">
                    <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => !isSubmitting && toggleModal()} />
                    <div className="relative bg-white rounded-lg w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto dark:bg-gray-800">
                        <div className="px-6 py-4 border-b dark:border-gray-700">
                            <h3 className="text-xl font-semibold dark:text-white">{id ? "Edit Content" : "Add Content"}</h3>
                        </div>
                        <div className="px-6 py-4">
                            <form onSubmit={handleSubmit}>

                                {/* Title */}
                                <div className="mb-4">
                                    <label className="block font-medium mb-1 text-sm dark:text-gray-300">
                                        Title <span className="text-red-500">*</span>
                                    </label>
                                    <input type="text" value={formTitle}
                                        onChange={(e) => { setFormTitle(e.target.value); if (formErrors.title) setFormErrors(p => { const err = { ...p }; delete err.title; return err; }); }}
                                        placeholder="Enter title"
                                        className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 dark:bg-gray-700 dark:text-white dark:border-gray-600 ${formErrors.title ? 'border-red-500' : 'border-gray-300'}`}
                                        disabled={isSubmitting} />
                                    {formErrors.title && <p className="text-red-500 text-xs mt-1">{formErrors.title}</p>}
                                </div>

                                {/* Description */}
                                <div className="mb-4">
                                    <label className="block font-medium mb-1 text-sm dark:text-gray-300">
                                        Description <span className="text-red-500">*</span>
                                    </label>
                                    <textarea value={formDescription}
                                        onChange={(e) => { setFormDescription(e.target.value); if (formErrors.description) setFormErrors(p => { const err = { ...p }; delete err.description; return err; }); }}
                                        placeholder="Enter description" rows={3}
                                        className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 resize-none dark:bg-gray-700 dark:text-white dark:border-gray-600 ${formErrors.description ? 'border-red-500' : 'border-gray-300'}`}
                                        disabled={isSubmitting} />
                                    {formErrors.description && <p className="text-red-500 text-xs mt-1">{formErrors.description}</p>}
                                </div>

                                {/* Link */}
                                <div className="mb-4">
                                    <label className="block font-medium mb-1 text-sm dark:text-gray-300">
                                        Link <span className="text-red-500">*</span>
                                    </label>
                                    <input type="text" value={formLink}
                                        onChange={(e) => { setFormLink(e.target.value); if (formErrors.link) setFormErrors(p => { const err = { ...p }; delete err.link; return err; }); }}
                                        placeholder="https://example.com"
                                        className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 dark:bg-gray-700 dark:text-white dark:border-gray-600 ${formErrors.link ? 'border-red-500' : 'border-gray-300'}`}
                                        disabled={isSubmitting} />
                                    {formErrors.link && <p className="text-red-500 text-xs mt-1">{formErrors.link}</p>}
                                </div>

                                {/* Image Upload */}
                                <div className="mb-4">
                                    <label className="block font-medium mb-2 text-sm dark:text-gray-300">
                                        {imageFileLabel} <span className="text-xs text-gray-400">(max 5 MB)</span>
                                        {!id && <span className="text-red-500 pl-1">*</span>}
                                    </label>
                                    <input type="file" id="file" name="file" onChange={handleFileChange}
                                        disabled={isSubmitting || (!id && selectedFiles.length >= MAX_FILES)}
                                        className="hidden" accept="image/*,.png,.jpg,.jpeg,.gif,.webp"
                                        multiple={!id} ref={fileInputRef} />

                                    <div
                                        onClick={() => !isSubmitting && (!id ? selectedFiles.length < MAX_FILES : true) && fileInputRef.current?.click()}
                                        onDragOver={onDragOver} onDragLeave={onDragLeave} onDrop={onDrop}
                                        className={`flex flex-col items-center justify-center p-6 border-2 rounded-lg cursor-pointer transition-all duration-300
                                            ${isDragging ? 'border-purple-600 bg-purple-50' : `border-dashed ${formErrors.file ? 'border-red-500' : 'border-purple-500'}`}
                                            ${isSubmitting || selectedFiles.length >= MAX_FILES ? 'cursor-not-allowed opacity-70' : 'hover:bg-gray-50'}`}
                                        style={{ background: isDragging ? "#F5F3FF" : "#F9FAFB" }}>
                                        <FontAwesomeIcon icon={isDragging ? faFileImage : faArrowUpFromBracket}
                                            className={`text-2xl mb-2 ${isDragging ? 'text-purple-600' : 'text-gray-400'}`} />
                                        <div className="flex flex-col items-center gap-1 text-center">
                                            {isDragging
                                                ? <span className="text-purple-600 font-medium text-sm">Drop image here</span>
                                                : <>
                                                    <span className="text-gray-500 text-sm">Drag & drop or</span>
                                                    <span className="text-purple-600 font-medium text-sm">Browse files</span>
                                                    {!id && <span className="text-xs text-gray-400 mt-1">{selectedFiles.length}/{MAX_FILES} selected</span>}
                                                </>}
                                        </div>
                                    </div>
                                    {formErrors.file && <p className="text-red-500 text-xs mt-1">{formErrors.file}</p>}

                                    {previewUrls.length > 0 && (
                                        <div className="grid grid-cols-3 gap-3 mt-4">
                                            {previewUrls.map((url, index) => (
                                                <div key={index} className="relative group">
                                                    <div className="border overflow-hidden rounded-md bg-[#F9FAFB] flex justify-center h-28">
                                                        <img src={url} alt={`Preview ${index + 1}`} className="object-contain w-full h-full" />
                                                    </div>
                                                    {selectedFiles.length > 0 && (
                                                        <button type="button" onClick={() => removeFile(index)} disabled={isSubmitting}
                                                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600 text-sm">
                                                            ×
                                                        </button>
                                                    )}
                                                    <div className="text-xs text-center mt-1 text-gray-500 truncate">
                                                        {selectedFiles[index]?.name || 'Existing image'}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div className="flex gap-4 mt-6">
                                    <button type="button" onClick={() => toggleModal()} disabled={isSubmitting}
                                        className="w-1/2 py-2 px-4 bg-gray-100 text-black rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50">
                                        Cancel
                                    </button>
                                    <button type="submit" disabled={isSubmitting}
                                        className="w-1/2 py-2 px-4 text-black rounded-lg transition-colors disabled:opacity-50"
                                        style={{ backgroundColor: "#eab308" }}>
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
            {deleteModal.isOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[99999]">
                    <div className="bg-white rounded-lg p-6 w-full max-w-sm mx-4 shadow-lg dark:bg-gray-800">
                        <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-3">
                            {deleteModal.isBulk ? 'Delete Selected Items' : 'Delete Content'}
                        </h2>
                        <p className="text-gray-700 dark:text-gray-300 mb-6">
                            {deleteModal.isBulk
                                ? `Are you sure you want to delete ${selectedItems.length} selected items?`
                                : 'Are you sure you want to delete this content?'}
                        </p>
                        <div className="flex justify-end gap-3">
                            <button onClick={closeDeleteModal} disabled={isDeleting}
                                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 disabled:opacity-70">
                                Cancel
                            </button>
                            <button onClick={deleteModal.isBulk ? handleDeleteSelected : handleDelete} disabled={isDeleting}
                                className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 disabled:opacity-70">
                                {isDeleting ? "Deleting..." : "Delete"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <ToastContainer position="top-center" className="!z-[99999]" />

            <ImagePreviewModal
                show={showPreview}
                onHide={() => setShowPreview(false)}
                images={currentItems.map(item => item.file)}
                currentIndex={previewIndex % itemsPerPage}
                onNavigate={handlePreviewNavigation}
                totalImages={pagination ? pagination.total : filteredData.length}
                currentPage={currentPage}
                itemsPerPage={itemsPerPage}
            />
        </div>
    );
};

export default HowToWork;