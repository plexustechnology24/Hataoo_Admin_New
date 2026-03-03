import React, { useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronLeft, faChevronRight, faTimes } from '@fortawesome/free-solid-svg-icons';

const ImagePreviewModal2 = ({ show, onHide, images, currentIndex, onNavigate, totalImages }) => {
    useEffect(() => {
        const handleKeyPress = (e) => {
            if (!show) return;

            if (e.key === 'ArrowLeft' && currentIndex > 0) {
                onNavigate(currentIndex - 1);
            } else if (e.key === 'ArrowRight' && currentIndex < totalImages - 1) {
                onNavigate(currentIndex + 1);
            } else if (e.key === 'Escape') {
                onHide();
            }
        };

        window.addEventListener('keydown', handleKeyPress);
        return () => window.removeEventListener('keydown', handleKeyPress);
    }, [show, currentIndex, onNavigate, onHide, totalImages]);

    if (!show) return null;

    return (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-90 z-[99999]">

            <div className="relative w-full h-full flex items-center justify-center p-8">
                {/* Close Button */}
                <button 
                    onClick={onHide} 
                    className="absolute top-4 right-4 bg-gray-800 text-white rounded-full focus:outline-none hover:bg-white hover:text-black h-10 w-10 flex items-center justify-center z-10"
                >
                    <FontAwesomeIcon icon={faTimes} className="w-5 h-5" />
                </button>

                 <div 
                    onClick={onHide} 
                    className="absolute top-4 right-50 bg-gray-800 text-white rounded-full focus:outline-none hover:bg-white hover:text-black text-2xl flex items-center justify-center z-10"
                >
                   {images.title}
                </div>

                
                {/* Images Container */}
                <div className="flex gap-6 items-center justify-center max-w-6xl">
                    {/* SubCategory Image */}
                    <div className="flex-1 flex flex-col items-center">
                        {/* <h3 className="text-white text-lg mb-3 font-semibold">SubCategory Image</h3> */}
                        <div className="bg-white p-2 rounded-lg max-h-[70vh]">
                            <img 
                                src={images.subCategory} 
                                alt="SubCategory Preview" 
                                className="max-w-full max-h-[65vh] object-contain"
                            />
                        </div>
                    </div>

                    {/* Hand Image */}
                    {images.cardImage && (
                        <div className="flex-1 flex flex-col items-center">
                            {/* <h3 className="text-white text-lg mb-3 font-semibold">Hand Image</h3> */}
                            <div className="bg-white p-2 rounded-lg max-h-[70vh]">
                                <img 
                                    src={images.cardImage} 
                                    alt="Hand Image Preview" 
                                    className="max-w-full max-h-[65vh] object-contain"
                                />
                            </div>
                        </div>
                    )}
                </div>
                
                {/* Left Navigation Button */}
                {currentIndex > 0 && (
                    <button
                        onClick={() => onNavigate(currentIndex - 1)}
                        className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white text-gray-700 rounded-full shadow-lg hover:bg-gray-200 h-12 w-12 flex items-center justify-center"
                    >
                        <FontAwesomeIcon icon={faChevronLeft} className="w-6 h-6" />
                    </button>
                )}

                {/* Right Navigation Button */}
                {currentIndex < totalImages - 1 && (
                    <button
                        onClick={() => onNavigate(currentIndex + 1)}
                        className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white text-gray-700 rounded-full shadow-lg hover:bg-gray-200 h-12 w-12 flex items-center justify-center"
                    >
                        <FontAwesomeIcon icon={faChevronRight} className="w-6 h-6" />
                    </button>
                )}

                {/* Image Counter */}
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-70 text-white px-4 py-2 rounded-full">
                    {currentIndex + 1} / {totalImages}
                </div>
            </div>
        </div>
    );
};

export default ImagePreviewModal2;