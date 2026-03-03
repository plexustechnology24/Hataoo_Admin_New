import React, { useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronLeft, faChevronRight, faTimes } from '@fortawesome/free-solid-svg-icons';

const ImagePreviewModal = ({ show, onHide, images, currentIndex, onNavigate, totalImages, currentPage, itemsPerPage }) => {
    useEffect(() => {
        const handleKeyPress = (e) => {
            if (!show) return;

            if (e.key === 'ArrowLeft') {
                onNavigate(currentIndex - 1, 'prev');
            } else if (e.key === 'ArrowRight') {
                onNavigate(currentIndex + 1, 'next');
            } else if (e.key === 'Escape') {
                onHide();
            }
        };

        window.addEventListener('keydown', handleKeyPress);
        return () => window.removeEventListener('keydown', handleKeyPress);
    }, [show, currentIndex, onNavigate, onHide]);

    if (!show || !images.length) return null;

    // Calculate the actual position in the full dataset
    const actualIndex = (currentPage - 1) * itemsPerPage + currentIndex + 1;

    return (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-75 z-99999">
            <div className="relative w-50 h-full flex items-center justify-center">
                {/* Close Button */}
                <button 
                    onClick={onHide} 
                    className="absolute top-4 right-4 bg-gray-800 text-white pt-1 rounded-full focus:outline-none hover:bg-white hover:text-black h-10 w-10"
                >
                    <FontAwesomeIcon icon={faTimes} className="w-5 h-5" />
                </button>
                
                {/* Image Counter */}
                <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white px-4 py-2 rounded-full shadow-lg">
                    <span className="font-medium">
                         {actualIndex} of {totalImages}
                    </span>
                </div>

                {/* Page {currentPage}: */}
                
                {/* Image */}
                <img 
                    src={images[currentIndex]} 
                    alt="Preview" 
                    className="max-w-full max-h-full object-contain"
                />
                
                {/* Left Navigation Button */}
                {(currentIndex > 0 || currentPage > 1) && (
                    <button
                        onClick={() => onNavigate(currentIndex - 1, 'prev')}
                        className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white text-gray-700 pt-1 rounded-full shadow-lg hover:bg-gray-200 h-10 w-10 text-center"
                    >
                        <FontAwesomeIcon icon={faChevronLeft} className="w-5 h-5" />
                    </button>
                )}

                {/* Right Navigation Button */}
                {actualIndex < totalImages && (
                    <button
                        onClick={() => onNavigate(currentIndex + 1, 'next')}
                        className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white text-gray-700 pt-1 rounded-full shadow-lg hover:bg-gray-200 h-10 w-10 text-center"
                    >
                        <FontAwesomeIcon icon={faChevronRight} className="w-5 h-5" />
                    </button>
                )}
            </div>
        </div>
    );
};

export default ImagePreviewModal;