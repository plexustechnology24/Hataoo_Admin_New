import React, { useCallback, useEffect, useRef, useState } from "react";
import axios from "axios";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "../../components/ui/table";
import { Button } from "react-bootstrap";
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faArrowUpFromBracket, faEdit, faEye,
    faFileImage, faPlus, faSearch, faTrash, faTimes, faStar,
    faToggleOn, faToggleOff, faChevronDown, faFilter,
} from "@fortawesome/free-solid-svg-icons";
import CustomPagination from "../../components/common/pagination";
import Loading from "../../components/loading";
import ImageGalleryModal from "../../components/product/ImageGalleryModal";
import DeleteModal from "../../components/deleteModal";
import { Editor } from 'react-draft-wysiwyg';
import { EditorState, ContentState, convertToRaw } from 'draft-js';
import draftToHtml from 'draftjs-to-html';
import htmlToDraft from 'html-to-draftjs';
import 'react-draft-wysiwyg/dist/react-draft-wysiwyg.css';
import ProductDetailModal from "../../components/product/ProductDetailModal";
import RenderStars from "../../components/product/RenderStars";

const MAX_FILES = 10;

/* ─── Star Rating Component ─────────────────────────────────────── */
const StarRating = ({ value, onChange, disabled }) => {
    const [hovered, setHovered] = useState(0);
    return (
        <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
                <button key={star} type="button" disabled={disabled}
                    onMouseEnter={() => setHovered(star)} onMouseLeave={() => setHovered(0)}
                    onClick={() => onChange(star)}
                    className="text-2xl focus:outline-none transition-transform hover:scale-110"
                    style={{ background: 'none', border: 'none', padding: '2px', cursor: disabled ? 'not-allowed' : 'pointer' }}>
                    <FontAwesomeIcon icon={faStar} style={{ color: star <= (hovered || value) ? '#7C7FFF' : '#d1d5db' }} />
                </button>
            ))}
            <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">
                {value > 0 ? `${value}/5` : 'No rating'}
            </span>
        </div>
    );
};

/* ─── Rich Text Editor Wrapper ──────────────────────────────────── */
const RichEditor = ({ editorState, onChange, placeholder, error, disabled }) => {
    const toolbarOptions = {
        options: ['inline', 'list', 'textAlign', 'history'],
        inline: { options: ['bold', 'italic', 'underline', 'strikethrough'] },
        list: { options: ['unordered', 'ordered'] },
        textAlign: { options: ['left', 'center', 'right'] },
    };
    return (
        <div className={`border rounded-lg overflow-hidden ${error ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}`}>
            <Editor
                editorState={editorState}
                wrapperClassName="rich-editor-wrapper"
                toolbarClassName="rich-editor-toolbar !border-b !border-gray-200 dark:!border-gray-600 !bg-gray-50 dark:!bg-gray-700 !mb-0 !rounded-none"
                editorClassName="rich-editor-content px-3 py-2 min-h-[120px] dark:text-gray-300 dark:bg-gray-800 text-sm"
                onEditorStateChange={onChange}
                toolbar={toolbarOptions}
                placeholder={placeholder}
                readOnly={disabled}
            />
        </div>
    );
};

/* ─── HTML ↔ EditorState helpers ────────────────────────────────── */
const htmlToEditorState = (html) => {
    if (!html) return EditorState.createEmpty();
    try {
        const contentBlock = htmlToDraft(html);
        if (contentBlock) {
            const contentState = ContentState.createFromBlockArray(contentBlock.contentBlocks);
            return EditorState.createWithContent(contentState);
        }
    } catch { }
    return EditorState.createEmpty();
};
const editorStateToHtml = (state) => draftToHtml(convertToRaw(state.getCurrentContent()));


/* ══════════════════════════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════════════════════════ */
const Product = () => {
    const [visible, setVisible] = useState(false);
    const [meta, setMeta] = useState(null);
    const [id, setId] = useState();
    const [loading, setLoading] = useState(true);
    const [filteredData, setFilteredData] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(15);
    const [deleteModal, setDeleteModal] = useState({ isOpen: false, id: null, isBulk: false });
    const [selectedItems, setSelectedItems] = useState([]);
    const [selectAll, setSelectAll] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const searchContainerRef = useRef(null);
    const [statusFilter, setStatusFilter] = useState('');
    const [filterDropdownOpen, setFilterDropdownOpen] = useState(false);
    const filterDropdownRef = useRef(null);

    /* Gallery & Detail modals */
    const [galleryModal, setGalleryModal] = useState({ open: false, images: [], index: 0, title: '' });
    const [detailModal, setDetailModal] = useState({ open: false, product: null });

    /* Image state */
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef(null);
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [previewUrls, setPreviewUrls] = useState([]);
    const [existingImages, setExistingImages] = useState([]);

    /* Form fields */
    const [formTitle, setFormTitle] = useState('');
    const [formDescription, setFormDescription] = useState('');
    const [formPrice, setFormPrice] = useState('');
    const [formRating, setFormRating] = useState(0);
    const [formStock, setFormStock] = useState('');
    const [formStatus, setFormStatus] = useState(true);
    const [deliveryEditorState, setDeliveryEditorState] = useState(EditorState.createEmpty());
    const [detailsEditorState, setDetailsEditorState] = useState(EditorState.createEmpty());
    const [formErrors, setFormErrors] = useState({});

    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredData;

    /* Search */
    const handleSearch = (e) => {
        const value = e.target.value;
        setSearchTerm(value);
        if (value.trim() === '') { setCurrentPage(1); getData(1, '', statusFilter); }
    };
    const handleSearchSubmit = (e) => { e.preventDefault(); setCurrentPage(1); getData(1, searchTerm.trim(), statusFilter); };
    const handleClearSearch = () => { setSearchTerm(''); setCurrentPage(1); getData(1, '', statusFilter); };

    /* Status filter */
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
        const params = { page, limit: itemsPerPage };
        if (search && search.trim() !== '') params.search = search.trim();
        if (status !== '') params.status = status;
        axios.get('https://api.hataoo.in/api/product/read', { params })
            .then((res) => {
                const responseData = res.data.data || [];
                const responsePagination = res.data.meta;
                setFilteredData(responseData);
                setMeta(responsePagination);
                if (responsePagination) setCurrentPage(responsePagination.currentPage || page);
                setSelectedItems([]); setSelectAll(false);
            })
            .catch(() => toast.error("No Data Found"))
            .finally(() => setLoading(false));
    }, [itemsPerPage]);

    useEffect(() => { getData(1, ''); }, [getData]);

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

    /* Delete */
    const openDeleteModal = (deleteId = null, isBulk = false) => {
        if (isBulk && selectedItems.length === 0) { toast.info("No items selected."); return; }
        setDeleteModal({ isOpen: true, id: deleteId, isBulk });
    };
    const closeDeleteModal = () => setDeleteModal({ isOpen: false, id: null, isBulk: false });
    const handleDelete = () => {
        axios.delete(`https://api.hataoo.in/api/product/delete/${deleteModal.id}`)
            .then((res) => {
                const newPage = currentItems.length === 1 && currentPage > 1 ? currentPage - 1 : currentPage;
                getData(newPage, searchTerm, statusFilter); closeDeleteModal(); toast.success(res.data.message);
            })
            .catch(() => toast.error("An error occurred. Please try again."));
    };
    const handleDeleteSelected = () => {
        setIsDeleting(true);
        axios.post('https://api.hataoo.in/api/admin/deleteMultiple', { ids: selectedItems, TypeId: "2" })
            .then(() => {
                toast.success(`Successfully deleted ${selectedItems.length} items.`);
                const remaining = currentItems.length - selectedItems.length;
                const newPage = remaining <= 0 && currentPage > 1 ? currentPage - 1 : currentPage;
                getData(newPage, searchTerm, statusFilter);
            })
            .catch(() => toast.error("Failed to delete selected items."))
            .finally(() => { setIsDeleting(false); closeDeleteModal(); });
    };
    const clearAllFilters = () => {
        setSearchTerm(''); setStatusFilter(''); setSelectedItems([]); setSelectAll(false); setCurrentPage(1);
        getData(1, '', ''); toast.info("All filters cleared");
    };

    /* Open gallery (from table image cell) */
    const handleOpenGallery = (item, startIndex = 0) => {
        const images = Array.isArray(item.files) ? item.files : (item.file ? [item.file] : []);
        if (!images.length) { toast.info("No images available"); return; }
        setGalleryModal({ open: true, images, index: startIndex, title: item.title || '' });
    };

    /* Form helpers */
    const resetForm = () => {
        setFormTitle(''); setFormDescription(''); setFormPrice('');
        setFormRating(0); setFormStock(''); setFormStatus(true);
        setDeliveryEditorState(EditorState.createEmpty());
        setDetailsEditorState(EditorState.createEmpty());
        setSelectedFiles([]); setPreviewUrls([]); setExistingImages([]);
        setId(undefined); setFormErrors({});
    };
    const toggleModal = (mode) => {
        if (!visible && mode === 'add') resetForm();
        else if (visible) resetForm();
        setVisible(!visible);
    };

    /* Validation */
    const validateForm = () => {
        const errs = {};
        if (!formTitle.trim()) errs.title = 'Title is required';
        if (!formDescription.trim()) errs.description = 'Description is required';
        if (!formPrice || isNaN(formPrice) || Number(formPrice) < 0) errs.price = 'Valid price is required';
        if (!formStock || isNaN(formStock) || !Number.isInteger(Number(formStock)) || Number(formStock) < 0)
            errs.stock = 'Valid stock quantity is required';
        if (!deliveryEditorState.getCurrentContent().getPlainText().trim()) errs.delivery = 'Delivery details are required';
        if (!detailsEditorState.getCurrentContent().getPlainText().trim()) errs.productDetails = 'Product details are required';
        if (!id && selectedFiles.length === 0) errs.files = 'Please select at least one image';
        return errs;
    };

    /* Image compression */
    const compressImage = useCallback((file) => {
        return new Promise((resolve, reject) => {
            if (file.type === "image/gif" || file.size < 2 * 1024 * 1024) { resolve(file); return; }
            const reader = new FileReader();
            reader.onload = (event) => {
                const img = new Image();
                img.onload = () => {
                    let { width, height } = img;
                    const MAX = 2000;
                    if (width > MAX || height > MAX) {
                        if (width > height) { height = Math.round((height * MAX) / width); width = MAX; }
                        else { width = Math.round((width * MAX) / height); height = MAX; }
                    }
                    const canvas = document.createElement("canvas");
                    canvas.width = width; canvas.height = height;
                    const ctx = canvas.getContext("2d");
                    ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = "high";
                    ctx.drawImage(img, 0, 0, width, height);
                    const outputType = file.type === "image/png" ? "image/png" : "image/jpeg";
                    canvas.toBlob((blob) => {
                        if (!blob) { reject(new Error("Canvas to Blob failed")); return; }
                        resolve(new File([blob], file.name, { type: outputType, lastModified: Date.now() }));
                    }, outputType, outputType === "image/png" ? 1 : 0.92);
                };
                img.onerror = () => reject(new Error("Failed to load image"));
                img.src = event.target.result;
            };
            reader.onerror = () => reject(new Error("Failed to read file"));
            reader.readAsDataURL(file);
        });
    }, []);

    const handleFileChange = useCallback(async (event) => {
        const files = Array.from(event.currentTarget.files);
        const totalAllowed = MAX_FILES - existingImages.length - selectedFiles.length;
        if (files.length > totalAllowed) { toast.error(`You can add ${totalAllowed} more image(s)`); return; }
        const processed = []; const previews = [];
        for (const file of files) {
            try {
                const pf = await compressImage(file);
                if (pf.size > 5 * 1024 * 1024) { toast.error(`${file.name} exceeds 5 MB`); continue; }
                processed.push(pf); previews.push(URL.createObjectURL(pf));
            } catch { toast.error(`Error processing ${file.name}`); }
        }
        setSelectedFiles(prev => [...prev, ...processed]);
        setPreviewUrls(prev => [...prev, ...previews]);
        if (formErrors.files) setFormErrors(prev => { const e = { ...prev }; delete e.files; return e; });
    }, [existingImages.length, selectedFiles.length, compressImage, formErrors.files]);

    const removeNewFile = (index) => {
        URL.revokeObjectURL(previewUrls[index]);
        setSelectedFiles(selectedFiles.filter((_, i) => i !== index));
        setPreviewUrls(previewUrls.filter((_, i) => i !== index));
    };
    const removeExistingImage = (index) => setExistingImages(existingImages.filter((_, i) => i !== index));

    const onDrop = useCallback((e) => {
        e.preventDefault(); e.stopPropagation(); setIsDragging(false);
        if (isSubmitting) return;
        const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
        if (!files.length) { toast.error('Image files only'); return; }
        handleFileChange({ currentTarget: { files } });
    }, [isSubmitting, handleFileChange]);
    const onDragOver = useCallback((e) => { e.preventDefault(); e.stopPropagation(); if (!isSubmitting) setIsDragging(true); }, [isSubmitting]);
    const onDragLeave = useCallback((e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); }, []);

    /* Submit */
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
            formData.append('price', formPrice);
            formData.append('rating', formRating);
            formData.append('stock', formStock);
            formData.append('status', formStatus);
            formData.append('deliveryDetails', editorStateToHtml(deliveryEditorState));
            formData.append('productDetails', editorStateToHtml(detailsEditorState));
            if (id && existingImages.length > 0) formData.append('existingImages', JSON.stringify(existingImages));
            selectedFiles.forEach(file => formData.append('files', file));
            if (id) {
                const res = await axios.patch(`https://api.hataoo.in/api/product/update/${id}`, formData);
                toast.success(res.data.message || 'Successfully updated');
            } else {
                await axios.post('https://api.hataoo.in/api/product/create', formData);
                toast.success('Successfully created');
            }
            resetForm(); setVisible(false); getData(currentPage, searchTerm, statusFilter);
        } catch (err) {
            toast.error(err.response?.data?.message || "An error occurred. Please try again.");
        } finally { setIsSubmitting(false); }
    };

    const handleEdit = (item) => {
        setId(item._id); setFormTitle(item.title || ''); setFormDescription(item.description || '');
        setFormPrice(item.price != null ? String(item.price) : '');
        setFormRating(item.rating || 0); setFormStock(item.stock != null ? String(item.stock) : '');
        setFormStatus(item.status !== undefined ? item.status : true);
        setDeliveryEditorState(htmlToEditorState(item.deliveryDetails || ''));
        setDetailsEditorState(htmlToEditorState(item.productDetails || ''));
        const imgs = Array.isArray(item.files) ? item.files : (item.file ? [item.file] : []);
        setExistingImages(imgs); setSelectedFiles([]); setPreviewUrls([]);
        setFormErrors({}); setVisible(true);
    };

    if (loading) return <Loading />;
    const totalNewAndExisting = existingImages.length + selectedFiles.length;

    return (
        <div className="flex flex-col h-[calc(100vh-120px)]">
            <PageBreadcrumb pageTitle="Products" />

            <div className="flex-1 overflow-y-auto overflow-x-hidden">
                <div className="rounded-2xl border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">

                    {/* Header bar */}
                    <div className="px-6 pt-5">
                        <div className="flex justify-between items-center px-4 py-3 mt-4 gap-4 flex-wrap">
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
                                {(selectedItems.length > 0 || searchTerm || statusFilter !== '') && (
                                    <Button onClick={clearAllFilters} variant="outline-secondary"
                                        className="d-flex align-items-center gap-2 py-1 border-0 bg-transparent"
                                        style={{ fontSize: "14px", color: "#f13838" }}>
                                        CLEAR ALL
                                    </Button>
                                )}
                            </div>

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
                                            <input type="text" placeholder="Search by title, description..."
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

                                {/* Status Filter */}
                                <div ref={filterDropdownRef} className="relative">
                                    <button type="button" onClick={() => setFilterDropdownOpen(!filterDropdownOpen)}
                                        className={`h-11 flex items-center gap-2 px-4 rounded-lg border text-sm font-medium transition-colors
                                            ${statusFilter !== '' ? 'border-yellow-400 bg-yellow-50 text-yellow-700 dark:bg-yellow-900/20 dark:border-yellow-600 dark:text-yellow-400' : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300'}`}>
                                        <FontAwesomeIcon icon={faFilter} className="text-xs" />
                                        <span>{statusFilter === '' ? 'All Status' : statusFilter === 'true' ? 'Active' : 'Inactive'}</span>
                                        {statusFilter !== '' && <span className="w-2 h-2 rounded-full bg-yellow-500 ml-0.5" />}
                                        <FontAwesomeIcon icon={faChevronDown} className={`text-xs transition-transform ${filterDropdownOpen ? 'rotate-180' : ''}`} />
                                    </button>
                                    {filterDropdownOpen && (
                                        <div className="absolute right-0 top-12 z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl min-w-[160px] overflow-hidden">
                                            <div className="p-1">
                                                {[{ label: 'All Status', value: '', dot: null }, { label: 'Active', value: 'true', dot: 'bg-green-500' }, { label: 'Inactive', value: 'false', dot: 'bg-red-400' }].map(opt => (
                                                    <button key={opt.value} type="button" onClick={() => handleStatusFilter(opt.value)}
                                                        className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm rounded-lg transition-colors text-left ${statusFilter === opt.value ? 'bg-yellow-50 text-yellow-700 font-medium dark:bg-yellow-900/20 dark:text-yellow-400' : 'text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700'}`}>
                                                        {opt.dot ? <span className={`w-2 h-2 rounded-full flex-shrink-0 ${opt.dot}`} /> : <span className="w-2 h-2 rounded-full flex-shrink-0 border border-gray-300 dark:border-gray-500" />}
                                                        {opt.label}
                                                        {statusFilter === opt.value && <span className="ml-auto text-yellow-500">✓</span>}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <Button onClick={() => toggleModal('add')}
                                    className="rounded-md border-0 shadow-md px-4 py-2 text-white"
                                    style={{ background: "#7C7FFF" }}>
                                    <FontAwesomeIcon icon={faPlus} className="pe-2" /> Add Product
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="p-4 border-gray-100 dark:border-gray-800 sm:p-6 overflow-auto">
                        <div className="space-y-6 rounded-lg xl:border dark:border-gray-800">
                            <Table>
                                <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                                    <TableRow>
                                        <TableCell isHeader className="py-4 font-medium text-gray-500 px-2 border-r border-gray-200 dark:border-gray-700 w-10">
                                            <div className="flex items-center justify-center">
                                                <input type="checkbox" className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500" checked={selectAll} onChange={handleSelectAll} />
                                            </div>
                                        </TableCell>
                                        <TableCell isHeader className="py-4 font-medium text-gray-500 px-2 border-r border-gray-200 dark:border-gray-700 w-12">#</TableCell>
                                        <TableCell isHeader className="py-4 font-medium text-gray-500 px-2 border-r border-gray-200 dark:border-gray-700 w-24">Image</TableCell>
                                        <TableCell isHeader className="py-4 font-medium text-gray-500 px-2 border-r border-gray-200 dark:border-gray-700">Title</TableCell>
                                        <TableCell isHeader className="py-4 font-medium text-gray-500 px-2 border-r border-gray-200 dark:border-gray-700">Price</TableCell>
                                        <TableCell isHeader className="py-4 font-medium text-gray-500 px-2 border-r border-gray-200 dark:border-gray-700">Rating</TableCell>
                                        <TableCell isHeader className="py-4 font-medium text-gray-500 px-2 border-r border-gray-200 dark:border-gray-700">Stock</TableCell>
                                        <TableCell isHeader className="py-4 font-medium text-gray-500 px-2 border-r border-gray-200 dark:border-gray-700">Status</TableCell>
                                        <TableCell isHeader className="py-4 font-medium text-gray-500 px-2 border-r border-gray-200 dark:border-gray-700 w-28">Actions</TableCell>
                                    </TableRow>
                                </TableHeader>
                                <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                                    {currentItems.length > 0 ? (
                                        currentItems.map((item, index) => {
                                            const images = Array.isArray(item.files) ? item.files : (item.file ? [item.file] : []);
                                            const thumbUrl = images[0];
                                            return (
                                                <TableRow key={item._id}>
                                                    <TableCell className="py-3 px-2 border-r border-gray-200 dark:border-gray-700">
                                                        <div className="flex items-center justify-center">
                                                            <input type="checkbox" className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                                                checked={selectedItems.includes(item._id)} onChange={() => handleSelectItem(item._id)} />
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-center px-2 border-r border-gray-200 dark:border-gray-700 dark:text-gray-400">
                                                        {indexOfFirstItem + index + 1}
                                                    </TableCell>

                                                    {/* Image cell — click opens full gallery */}
                                                    <TableCell className="py-3 px-2 border-r border-gray-200 dark:border-gray-700">
                                                        <div className="relative w-[60px] h-[60px] mx-auto group cursor-pointer"
                                                            onClick={() => handleOpenGallery(item, 0)}>
                                                            <div className="absolute inset-0 bg-gray-200 dark:bg-gray-700 animate-pulse flex items-center justify-center rounded">
                                                                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                                </svg>
                                                            </div>
                                                            {thumbUrl && (
                                                                <img src={thumbUrl} alt="thumbnail"
                                                                    className="w-full h-full object-cover relative z-10 rounded"
                                                                    onLoad={(e) => { e.target.style.opacity = 1; if (e.target.previousSibling) e.target.previousSibling.style.display = 'none'; }}
                                                                    style={{ opacity: 0 }} />
                                                            )}
                                                            {/* Hover overlay */}
                                                            <div className="absolute inset-0 bg-black bg-opacity-60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center gap-0.5 transition-opacity duration-200 z-20 rounded">
                                                                <FontAwesomeIcon icon={faEye} className="text-white text-sm" />
                                                                {images.length > 1 && <span className="text-white text-[10px]">{images.length} imgs</span>}
                                                            </div>
                                                            {/* Count badge */}
                                                            {images.length > 1 && (
                                                                <span className="absolute -top-1.5 -right-1.5 bg-yellow-400 text-black text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center z-30 shadow">
                                                                    {images.length}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </TableCell>

                                                    <TableCell className="py-3 px-3 border-r border-gray-200 dark:border-gray-700 dark:text-gray-300 text-center">
                                                        <div className="font-medium text-sm mx-auto" style={{ maxWidth: 180 }} title={item.title}>
                                                            {item.title || '—'}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="py-3 px-3 border-r border-gray-200 dark:border-gray-700 dark:text-gray-300 text-center">
                                                        <span className="font-semibold text-sm">
                                                            {item.price != null ? `₹${Number(item.price).toLocaleString()}` : '—'}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell className="py-3 px-3 border-r border-gray-200 dark:border-gray-700 text-center">
                                                        <RenderStars rating={item.rating || 0} />
                                                    </TableCell>
                                                    <TableCell className="py-3 px-3 border-r border-gray-200 dark:border-gray-700 dark:text-gray-300 text-center">
                                                        <span className={`text-sm font-medium ${item.stock === 0 ? 'text-red-500' : item.stock <= 10 ? 'text-yellow-500' : 'text-green-600'}`}>
                                                            {item.stock != null ? item.stock : '—'}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell className="py-3 px-3 border-r border-gray-200 dark:border-gray-700 text-center">

                                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${item.status ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'}`}>
                                                            {item.status ? 'Active' : 'Inactive'}
                                                        </span>
                                                    </TableCell>

                                                    {/* Actions: View | Edit | Delete */}
                                                    <TableCell className="py-3 px-2 border-r border-gray-200 dark:border-gray-700">
                                                        <div className="flex items-center justify-center gap-3">
                                                            <button onClick={() => setDetailModal({ open: true, product: item })}
                                                                className="text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300 transition-colors"
                                                                title="View Details">
                                                                <FontAwesomeIcon icon={faEye} className="text-lg" />
                                                            </button>
                                                            <button style={{ color: "#0385C3" }} onClick={() => handleEdit(item)} title="Edit">
                                                                <FontAwesomeIcon icon={faEdit} className="text-lg" />
                                                            </button>
                                                            <button className="text-red-600 hover:text-red-800 transition-colors" onClick={() => openDeleteModal(item._id)} title="Delete">
                                                                <FontAwesomeIcon icon={faTrash} className="text-lg" />
                                                            </button>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })
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

            {/* Pagination */}
            <div className="w-full border-t dark:bg-gray-900 dark:border-gray-700 mt-0">
                <CustomPagination
                    currentPage={currentPage}
                    totalPages={meta ? meta.totalPages : 1}
                    onPageChange={(page) => { setCurrentPage(page); setSelectedItems([]); setSelectAll(false); getData(page, searchTerm, statusFilter); }}
                    itemsPerPage={itemsPerPage}
                    totalItems={meta ? meta.total : filteredData.length}
                />
            </div>

            {/* Add/Edit Modal */}
            {visible && (
                <div className="fixed inset-0 z-[99999] flex items-center justify-center px-4"
                    style={{ backgroundColor: 'rgba(0,0,0,0.55)' }}>
                    <div className="relative bg-gray-50 dark:bg-gray-900 rounded-xl w-full shadow-2xl flex flex-col"
                        style={{ maxWidth: 1100, height: '90vh', maxHeight: '90vh' }}>

                        {/* Header */}
                        <div className="flex-shrink-0 bg-white dark:bg-gray-800 border-b dark:border-gray-700 px-6 py-4 rounded-t-xl flex items-center justify-between">
                            <h2 className="text-xl font-bold dark:text-white">{id ? "Edit Product" : "Add Product"}</h2>
                            <div className="flex items-center gap-3">
                                <button type="button" onClick={() => setFormStatus(!formStatus)} disabled={isSubmitting}
                                    className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium border transition-colors ${formStatus ? 'bg-green-50 border-green-300 text-green-700 dark:bg-green-900/30 dark:border-green-700 dark:text-green-400' : 'bg-gray-100 border-gray-300 text-gray-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-400'}`}>
                                    <span className={`w-2.5 h-2.5 rounded-full ${formStatus ? 'bg-green-500' : 'bg-gray-400'}`}></span>
                                    {formStatus ? 'Active' : 'Draft'}
                                    <FontAwesomeIcon icon={formStatus ? faToggleOn : faToggleOff} className={`text-lg ml-1 ${formStatus ? 'text-green-500' : 'text-gray-400'}`} />
                                </button>
                                <button type="button" onClick={() => !isSubmitting && toggleModal()}
                                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1">
                                    <FontAwesomeIcon icon={faTimes} className="text-xl" />
                                </button>
                            </div>
                        </div>

                        {/* Body */}
                        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
                            <div className="flex-1 overflow-y-auto p-6">
                                <div className="flex flex-col xl:flex-row gap-6">

                                    {/* LEFT */}
                                    <div className="flex-1 flex flex-col gap-5">
                                        <div className="bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700 shadow-sm p-5">
                                            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4 uppercase tracking-wide">Basic Information</h3>
                                            <div className="mb-4">
                                                <label className="block text-sm font-medium mb-1 dark:text-gray-300">Title <span className="text-red-500">*</span></label>
                                                <input type="text" value={formTitle}
                                                    onChange={(e) => { setFormTitle(e.target.value); if (formErrors.title) setFormErrors(p => { const err = { ...p }; delete err.title; return err; }); }}
                                                    placeholder="Short sleeve t-shirt"
                                                    className={`w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 dark:bg-gray-700 dark:text-white dark:border-gray-600 ${formErrors.title ? 'border-red-500' : 'border-gray-300'}`}
                                                    disabled={isSubmitting} />
                                                {formErrors.title && <p className="text-red-500 text-xs mt-1">{formErrors.title}</p>}
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium mb-1 dark:text-gray-300">Description <span className="text-red-500">*</span></label>
                                                <textarea value={formDescription}
                                                    onChange={(e) => { setFormDescription(e.target.value); if (formErrors.description) setFormErrors(p => { const err = { ...p }; delete err.description; return err; }); }}
                                                    placeholder="Write a short product description..." rows={3}
                                                    className={`w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 resize-none dark:bg-gray-700 dark:text-white dark:border-gray-600 ${formErrors.description ? 'border-red-500' : 'border-gray-300'}`}
                                                    disabled={isSubmitting} />
                                                {formErrors.description && <p className="text-red-500 text-xs mt-1">{formErrors.description}</p>}
                                            </div>
                                        </div>

                                        <div className="bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700 shadow-sm p-5">
                                            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1 uppercase tracking-wide">Delivery Details <span className="text-red-500">*</span></h3>
                                            <p className="text-xs text-gray-400 mb-3">Use bold, italic, lists to format shipping info</p>
                                            <RichEditor editorState={deliveryEditorState}
                                                onChange={(state) => { setDeliveryEditorState(state); if (formErrors.delivery) setFormErrors(p => { const err = { ...p }; delete err.delivery; return err; }); }}
                                                placeholder="e.g. Free shipping on orders above ₹500..." error={!!formErrors.delivery} disabled={isSubmitting} />
                                            {formErrors.delivery && <p className="text-red-500 text-xs mt-1">{formErrors.delivery}</p>}
                                        </div>

                                        <div className="bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700 shadow-sm p-5">
                                            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1 uppercase tracking-wide">Product Details <span className="text-red-500">*</span></h3>
                                            <p className="text-xs text-gray-400 mb-3">Detailed specs, materials, features, etc.</p>
                                            <RichEditor editorState={detailsEditorState}
                                                onChange={(state) => { setDetailsEditorState(state); if (formErrors.productDetails) setFormErrors(p => { const err = { ...p }; delete err.productDetails; return err; }); }}
                                                placeholder="e.g. 100% cotton, machine washable..." error={!!formErrors.productDetails} disabled={isSubmitting} />
                                            {formErrors.productDetails && <p className="text-red-500 text-xs mt-1">{formErrors.productDetails}</p>}
                                        </div>
                                    </div>

                                    {/* RIGHT */}
                                    <div className="xl:w-[360px] flex flex-col gap-5">
                                        <div className="bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700 shadow-sm p-5">
                                            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 uppercase tracking-wide">Media</h3>
                                            <input type="file" onChange={handleFileChange} disabled={isSubmitting || totalNewAndExisting >= MAX_FILES}
                                                className="hidden" accept="image/*" multiple ref={fileInputRef} />
                                            <div onClick={() => !isSubmitting && totalNewAndExisting < MAX_FILES && fileInputRef.current?.click()}
                                                onDragOver={onDragOver} onDragLeave={onDragLeave} onDrop={onDrop}
                                                className={`flex flex-col items-center justify-center p-5 border-2 rounded-lg cursor-pointer transition-all duration-300
                                                    ${isDragging ? 'border-yellow-400 bg-yellow-50 dark:bg-yellow-900/20' : `border-dashed ${formErrors.files ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}`}
                                                    ${isSubmitting || totalNewAndExisting >= MAX_FILES ? 'cursor-not-allowed opacity-60' : 'hover:border-yellow-400 hover:bg-yellow-50 dark:hover:bg-yellow-900/10'}`}>
                                                <FontAwesomeIcon icon={isDragging ? faFileImage : faArrowUpFromBracket}
                                                    className={`text-2xl mb-2 ${isDragging ? 'text-yellow-500' : 'text-gray-400'}`} />
                                                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">{isDragging ? 'Drop here' : 'Add images'}</span>
                                                <span className="text-xs text-gray-400 mt-1">{totalNewAndExisting}/{MAX_FILES} • max 5 MB each</span>
                                            </div>
                                            {formErrors.files && <p className="text-red-500 text-xs mt-1">{formErrors.files}</p>}
                                            {existingImages.length > 0 && (
                                                <div className="mt-3">
                                                    <p className="text-xs text-gray-500 mb-2">Existing images</p>
                                                    <div className="grid grid-cols-3 gap-2">
                                                        {existingImages.map((url, index) => (
                                                            <div key={`e-${index}`} className="relative">
                                                                <div className="border dark:border-gray-700 overflow-hidden rounded-lg h-24">
                                                                    <img src={url} alt="" className="object-cover w-full h-full" />
                                                                </div>
                                                                <button type="button" onClick={() => removeExistingImage(index)} disabled={isSubmitting}
                                                                    className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center hover:bg-red-600 text-xs shadow">×</button>
                                                                {index === 0 && <span className="absolute bottom-1 left-1 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded">Cover</span>}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                            {previewUrls.length > 0 && (
                                                <div className="mt-3">
                                                    <p className="text-xs text-gray-500 mb-2">New uploads</p>
                                                    <div className="grid grid-cols-3 gap-2">
                                                        {previewUrls.map((url, index) => (
                                                            <div key={`n-${index}`} className="relative">
                                                                <div className="border dark:border-gray-700 overflow-hidden rounded-lg h-24">
                                                                    <img src={url} alt="" className="object-cover w-full h-full" />
                                                                </div>
                                                                <button type="button" onClick={() => removeNewFile(index)} disabled={isSubmitting}
                                                                    className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center hover:bg-red-600 text-xs shadow">×</button>
                                                                <div className="text-[10px] text-center mt-1 text-gray-500 truncate px-1">{selectedFiles[index]?.name}</div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        <div className="bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700 shadow-sm p-5">
                                            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4 uppercase tracking-wide">Pricing</h3>
                                            <label className="block text-sm font-medium mb-1 dark:text-gray-300">Price (₹) <span className="text-red-500">*</span></label>
                                            <div className="relative">
                                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium text-sm">₹</span>
                                                <input type="number" value={formPrice} min="0" step="0.01"
                                                    onChange={(e) => { setFormPrice(e.target.value); if (formErrors.price) setFormErrors(p => { const err = { ...p }; delete err.price; return err; }); }}
                                                    placeholder="0.00"
                                                    className={`w-full pl-7 pr-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 dark:bg-gray-700 dark:text-white dark:border-gray-600 ${formErrors.price ? 'border-red-500' : 'border-gray-300'}`}
                                                    disabled={isSubmitting} />
                                            </div>
                                            {formErrors.price && <p className="text-red-500 text-xs mt-1">{formErrors.price}</p>}
                                        </div>

                                        <div className="bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700 shadow-sm p-5">
                                            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4 uppercase tracking-wide">Inventory</h3>
                                            <label className="block text-sm font-medium mb-1 dark:text-gray-300">Stock Quantity <span className="text-red-500">*</span></label>
                                            <input type="number" value={formStock} min="0" step="1"
                                                onChange={(e) => { setFormStock(e.target.value); if (formErrors.stock) setFormErrors(p => { const err = { ...p }; delete err.stock; return err; }); }}
                                                placeholder="0"
                                                className={`w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 dark:bg-gray-700 dark:text-white dark:border-gray-600 ${formErrors.stock ? 'border-red-500' : 'border-gray-300'}`}
                                                disabled={isSubmitting} />
                                            {formErrors.stock && <p className="text-red-500 text-xs mt-1">{formErrors.stock}</p>}
                                        </div>

                                        <div className="bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700 shadow-sm p-5">
                                            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4 uppercase tracking-wide">Rating</h3>
                                            <StarRating value={formRating} onChange={setFormRating} disabled={isSubmitting} />
                                        </div>

                                        <div className="bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700 shadow-sm p-5">
                                            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 uppercase tracking-wide">Product Status</h3>
                                            <div className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${formStatus ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800' : 'bg-gray-50 border-gray-200 dark:bg-gray-700 dark:border-gray-600'}`}
                                                onClick={() => !isSubmitting && setFormStatus(!formStatus)}>
                                                <div>
                                                    <p className={`text-sm font-semibold ${formStatus ? 'text-green-700 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}`}>{formStatus ? 'Active' : 'Draft'}</p>
                                                    <p className="text-xs text-gray-400 mt-0.5">{formStatus ? 'Visible to customers' : 'Hidden from store'}</p>
                                                </div>
                                                <div className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors ${formStatus ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-500'}`}>
                                                    <span className={`absolute w-4 h-4 bg-white rounded-full shadow transition-transform ${formStatus ? 'translate-x-6' : 'translate-x-1'}`}></span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="flex-shrink-0 bg-white dark:bg-gray-800 border-t dark:border-gray-700 px-6 py-4 rounded-b-xl flex gap-3 justify-end">
                                <button type="button" onClick={() => toggleModal()} disabled={isSubmitting}
                                    className="px-6 py-2.5 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-sm font-medium disabled:opacity-50">
                                    Discard
                                </button>
                                <button type="submit" disabled={isSubmitting}
                                    className="px-8 py-2.5 text-white rounded-lg transition-colors text-sm font-semibold disabled:opacity-50 min-w-[120px] flex items-center justify-center"
                                    style={{ backgroundColor: "#7C7FFF" }}>
                                    {isSubmitting ? <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" /> : id ? 'Save Product' : 'Add Product'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Modal */}
            <DeleteModal isOpen={deleteModal.isOpen} isBulk={deleteModal.isBulk} selectedCount={selectedItems.length}
                isDeleting={isDeleting} onClose={closeDeleteModal} value={"product"}
                onConfirm={deleteModal.isBulk ? handleDeleteSelected : handleDelete} />

            {/* Image Gallery Modal (table image click) */}
            {galleryModal.open && (
                <ImageGalleryModal images={galleryModal.images} startIndex={galleryModal.index}
                    productTitle={galleryModal.title}
                    onClose={() => setGalleryModal({ open: false, images: [], index: 0, title: '' })} />
            )}

            {/* Product Detail Modal (eye icon in actions) */}
            {detailModal.open && (
                <ProductDetailModal product={detailModal.product}
                    onClose={() => setDetailModal({ open: false, product: null })}
                    onEdit={(item) => { setDetailModal({ open: false, product: null }); handleEdit(item); }} />
            )}

            <ToastContainer position="top-center" className="!z-[99999]" />
        </div>
    );
};

export default Product;