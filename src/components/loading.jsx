import React from "react";

const Loading = () => {
   
    return (
        <div style={{ height: '80vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <div className="border p-4 flex items-center space-x-2 rounded-md">
                <div className="w-10 h-10 border-2 border-gray-300 rounded-full animate-spin" style={{ borderTop: "2px solid #7C7FFF" }} />
            </div>
        </div>
    );
};

export default Loading;