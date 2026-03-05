import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimes, faChevronLeft, faChevronRight} from "@fortawesome/free-solid-svg-icons";
import { useEffect, useState } from "react";

const ImageGalleryModal = ({ images = [], startIndex = 0, productTitle = '', onClose }) => {
    const [current, setCurrent] = useState(startIndex);

    useEffect(() => { setCurrent(startIndex); }, [startIndex]);

    useEffect(() => {
        const handler = (e) => {
            if (e.key === 'Escape') onClose();
            if (e.key === 'ArrowRight') setCurrent(c => (c + 1) % images.length);
            if (e.key === 'ArrowLeft') setCurrent(c => (c - 1 + images.length) % images.length);
        };
        document.addEventListener('keydown', handler);
        return () => document.removeEventListener('keydown', handler);
    }, [images.length, onClose]);

    if (!images.length) return null;

    return (
        <div className="fixed inset-0 z-[999999] flex items-center justify-center"
            style={{ backgroundColor: 'rgba(0,0,0,0.90)' }}
            onClick={onClose}>
            <div className="relative flex flex-col items-center w-full max-w-4xl mx-4"
                onClick={e => e.stopPropagation()}>

                {/* Top bar */}
                <div className="w-full flex items-center justify-between mb-3 px-1">
                    <span className="text-white/80 text-sm font-medium truncate max-w-xs">{productTitle}</span>
                    <div className="flex items-center gap-3">
                        <span className="bg-white/20 text-white text-xs px-3 py-1 rounded-full">
                            {current + 1} / {images.length}
                        </span>
                        <button onClick={onClose}
                            className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/30 text-white transition-colors">
                            <FontAwesomeIcon icon={faTimes} />
                        </button>
                    </div>
                </div>

                {/* Main image */}
                <div className="relative w-full flex items-center justify-center rounded-xl overflow-hidden"
                    style={{ height: '65vh', background: 'rgba(255,255,255,0.04)' }}>
                    {images.length > 1 && (
                        <button onClick={() => setCurrent(c => (c - 1 + images.length) % images.length)}
                            className="absolute left-3 z-10 w-10 h-10 flex items-center justify-center rounded-full bg-black/50 hover:bg-black/80 text-white transition-colors">
                            <FontAwesomeIcon icon={faChevronLeft} />
                        </button>
                    )}
                    <img src={images[current]} alt={`${productTitle} ${current + 1}`}
                        className="max-h-full max-w-full object-contain select-none"
                        draggable={false} />
                    {images.length > 1 && (
                        <button onClick={() => setCurrent(c => (c + 1) % images.length)}
                            className="absolute right-3 z-10 w-10 h-10 flex items-center justify-center rounded-full bg-black/50 hover:bg-black/80 text-white transition-colors">
                            <FontAwesomeIcon icon={faChevronRight} />
                        </button>
                    )}
                </div>

                {/* Thumbnail strip */}
                {images.length > 1 && (
                    <div className="flex gap-2 mt-4 overflow-x-auto pb-1 max-w-full px-2">
                        {images.map((url, i) => (
                            <button key={i} onClick={() => setCurrent(i)}
                                className={`flex-shrink-0 w-14 h-14 rounded-lg overflow-hidden border-2 transition-all ${i === current ? 'border-yellow-400 scale-110 shadow-lg shadow-yellow-400/30' : 'border-white/20 hover:border-white/50 opacity-70 hover:opacity-100'}`}>
                                <img src={url} alt={`thumb ${i + 1}`} className="w-full h-full object-cover" />
                            </button>
                        ))}
                    </div>
                )}

                {/* Keyboard hint */}
                {images.length > 1 && (
                    <p className="text-white/30 text-xs mt-3">← → arrow keys to navigate • Esc to close</p>
                )}
            </div>
        </div>
    );
};

export default ImageGalleryModal;