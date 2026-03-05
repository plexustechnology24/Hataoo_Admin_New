import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBoxOpen, faChevronLeft, faChevronRight, faEye, faLayerGroup, faTag, faTimes, faTruck } from "@fortawesome/free-solid-svg-icons";
import { useEffect, useState } from "react";
import RenderStars from "./RenderStars";
import ImageGalleryModal from "./ImageGalleryModal";

/* ─── HTML content renderer — black font forced ─────────────────── */
const HtmlContent = ({ html }) => (
    <div
        className="text-sm leading-relaxed
            [&_*]:text-black
            [&_strong]:font-bold [&_strong]:text-black
            [&_em]:italic [&_em]:text-black
            [&_b]:font-bold [&_b]:text-black
            [&_i]:italic [&_i]:text-black
            [&_u]:underline [&_u]:text-black
            [&_s]:line-through [&_s]:text-black
            [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:my-1
            [&_ul_li]:my-0.5 [&_ul_li]:text-black
            [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:my-1
            [&_ol_li]:my-0.5 [&_ol_li]:text-black
            [&_p]:my-1 [&_p]:text-black
            [&_h1]:text-xl [&_h1]:font-bold [&_h1]:text-black
            [&_h2]:text-lg [&_h2]:font-bold [&_h2]:text-black
            [&_h3]:text-base [&_h3]:font-semibold [&_h3]:text-black
            [&_a]:text-blue-600 [&_a]:underline"
        dangerouslySetInnerHTML={{ __html: html }}
    />
);


const ProductDetailModal = ({ product, onClose, onEdit }) => {
    const [imgIndex, setImgIndex] = useState(0);
    const [showGallery, setShowGallery] = useState(false);
    const images = Array.isArray(product?.files) ? product.files : (product?.file ? [product.file] : []);

    useEffect(() => {
        const handler = (e) => { if (e.key === 'Escape' && !showGallery) onClose(); };
        document.addEventListener('keydown', handler);
        return () => document.removeEventListener('keydown', handler);
    }, [onClose, showGallery]);

    if (!product) return null;

    return (
        <>
            <div className="fixed inset-0 z-[999998] flex items-center justify-center px-4"
                style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}>
                <div className="relative bg-white rounded-2xl w-full shadow-2xl flex flex-col"
                    style={{ maxWidth: 920, height: '88vh' }}>

                    {/* Header */}
                    <div className="flex-shrink-0 flex items-center justify-between px-6 py-4 border-b border-gray-100">
                        <div className="flex items-center gap-3 min-w-0">
                            <h2 className="text-lg font-bold text-black truncate">{product.title}</h2>
                            <span className={`flex-shrink-0 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${product.status ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                {product.status ? 'Active' : 'Inactive'}
                            </span>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                            {/* <button onClick={() => { onClose(); onEdit(product); }}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-blue-50 border border-blue-200 text-blue-600 hover:bg-blue-100 transition-colors">
                                <FontAwesomeIcon icon={faEdit} /> Edit
                            </button> */}
                            <button onClick={onClose}
                                className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
                                <FontAwesomeIcon icon={faTimes} />
                            </button>
                        </div>
                    </div>

                    {/* Body */}
                    <div className="flex-1 overflow-hidden flex flex-col lg:flex-row">

                        {/* ── LEFT: Images + Quick Stats ── */}
                        <div className="lg:w-[360px] flex-shrink-0 p-5 border-b lg:border-b-0 lg:border-r border-gray-100 overflow-y-auto">

                            {/* Main image */}
                            <div className="relative w-full rounded-xl overflow-hidden bg-gray-100 mb-3 cursor-pointer group"
                                style={{ height: 260 }}
                                onClick={() => images.length > 0 && setShowGallery(true)}>
                                {images.length > 0 ? (
                                    <>
                                        <img src={images[imgIndex]} alt={product.title}
                                            className="w-full h-full object-contain" />
                                        {/* hover overlay */}
                                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                                            <span className="opacity-0 group-hover:opacity-100 bg-black/60 text-white text-xs px-3 py-1.5 rounded-full transition-opacity flex items-center gap-1.5">
                                                <FontAwesomeIcon icon={faEye} /> View full
                                            </span>
                                        </div>
                                        {images.length > 1 && (
                                            <>
                                                <button onClick={(e) => { e.stopPropagation(); setImgIndex(i => (i - 1 + images.length) % images.length); }}
                                                    className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 flex items-center justify-center rounded-full bg-black/40 hover:bg-black/70 text-white text-xs transition-colors">
                                                    <FontAwesomeIcon icon={faChevronLeft} />
                                                </button>
                                                <button onClick={(e) => { e.stopPropagation(); setImgIndex(i => (i + 1) % images.length); }}
                                                    className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 flex items-center justify-center rounded-full bg-black/40 hover:bg-black/70 text-white text-xs transition-colors">
                                                    <FontAwesomeIcon icon={faChevronRight} />
                                                </button>
                                                <span className="absolute bottom-2 right-2 bg-black/50 text-white text-xs px-2 py-0.5 rounded-full">
                                                    {imgIndex + 1}/{images.length}
                                                </span>
                                            </>
                                        )}
                                    </>
                                ) : (
                                    <div className="w-full h-full flex flex-col items-center justify-center text-gray-300 gap-2">
                                        <FontAwesomeIcon icon={faBoxOpen} className="text-5xl" />
                                        <span className="text-xs">No images</span>
                                    </div>
                                )}
                            </div>

                            {/* Thumbnail strip */}
                            {images.length > 1 && (
                                <div className="flex gap-1.5 overflow-x-auto pb-1 mb-3">
                                    {images.map((url, i) => (
                                        <button key={i} onClick={() => setImgIndex(i)}
                                            className={`flex-shrink-0 w-12 h-12 rounded-lg overflow-hidden border-2 transition-all ${i === imgIndex ? 'border-yellow-400 shadow' : 'border-gray-200 hover:border-gray-400 opacity-70 hover:opacity-100'}`}>
                                            <img src={url} alt={`thumb ${i + 1}`} className="w-full h-full object-cover" />
                                        </button>
                                    ))}
                                </div>
                            )}

                            {/* Quick stats grid */}
                            <div className="grid grid-cols-2 gap-2 mb-2">
                                <div className="bg-gray-50 rounded-xl p-3 text-center">
                                    <p className="text-[11px] text-gray-400 mb-0.5 flex items-center justify-center gap-1">
                                        <FontAwesomeIcon icon={faTag} /> Price
                                    </p>
                                    <p className="text-xl font-bold text-black">
                                        {product.price != null ? `₹${Number(product.price).toLocaleString()}` : '—'}
                                    </p>
                                </div>
                                <div className="bg-gray-50 rounded-xl p-3 text-center">
                                    <p className="text-[11px] text-gray-400 mb-0.5 flex items-center justify-center gap-1">
                                        <FontAwesomeIcon icon={faLayerGroup} /> Stock
                                    </p>
                                    <p className={`text-xl font-bold ${product.stock === 0 ? 'text-red-500' : product.stock <= 10 ? 'text-yellow-500' : 'text-green-600'}`}>
                                        {product.stock ?? '—'}
                                    </p>
                                </div>
                            </div>

                            {/* Rating row */}
                            <div className="bg-gray-50 rounded-xl px-4 py-3 flex items-center gap-3">
                                <RenderStars rating={product.rating || 0} size={18} />
                                <span className="text-sm font-semibold text-black">
                                    {product.rating > 0 ? `${product.rating} / 5` : 'No rating'}
                                </span>
                            </div>
                        </div>

                        {/* ── RIGHT: Text Content ── */}
                        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">

                            {/* Description */}
                            <div>
                                <h4 className="text-[11px] font-bold uppercase tracking-widest text-black mb-2 pb-1.5 border-b border-gray-100">
                                    Description
                                </h4>
                                <p className="text-sm text-black leading-relaxed">
                                    {product.description || '—'}
                                </p>
                            </div>

                            {/* Delivery Details */}
                            {product.deliveryDetails && (
                                <div>
                                    <h4 className="text-[11px] font-bold uppercase tracking-widest text-black mb-2 pb-1.5 border-b border-gray-100 flex items-center gap-1.5">
                                        <FontAwesomeIcon icon={faTruck} className="text-blue-400" />
                                        Delivery Details
                                    </h4>
                                    <HtmlContent html={product.deliveryDetails} />
                                </div>
                            )}

                            {/* Product Details */}
                            {product.productDetails && (
                                <div>
                                    <h4 className="text-[11px] font-bold uppercase tracking-widest text-black mb-2 pb-1.5 border-b border-gray-100">
                                        Product Details
                                    </h4>
                                    <HtmlContent html={product.productDetails} />
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Full-screen gallery triggered from detail modal */}
            {showGallery && (
                <ImageGalleryModal
                    images={images}
                    startIndex={imgIndex}
                    productTitle={product.title}
                    onClose={() => setShowGallery(false)}
                />
            )}
        </>
    );
};

export default ProductDetailModal;