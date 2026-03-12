import { useEffect } from "react";

const useModalBackButton = (isOpen, onClose) => {
    useEffect(() => {
        if (isOpen) {
            // Push a new history entry when modal opens
            window.history.pushState({ modal: true }, "");
        }

        const handlePopState = (e) => {
            if (isOpen) {
                e.preventDefault();
                onClose(); // Close modal instead of navigating back
            }
        };

        window.addEventListener("popstate", handlePopState);
        return () => window.removeEventListener("popstate", handlePopState);
    }, [isOpen, onClose]);
};

export default useModalBackButton;