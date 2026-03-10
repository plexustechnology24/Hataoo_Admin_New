import React from "react";
import { useNavigate } from "react-router";
import { Button } from "react-bootstrap";

export default function UserDropdown() {

  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    sessionStorage.removeItem('authPin');
    sessionStorage.removeItem('ImageAuthPin');
    sessionStorage.removeItem('VideoAuthPin');
    sessionStorage.removeItem('AudioAuthPin');
    sessionStorage.removeItem('CoverAuthPin');
    navigate('/login');
  };

  return (
    <div className="relative">
      
        <Button className="p-3 rounded-lg text-white py-2 d-flex gap-3 align-items-center bg-[#7C7FFF]" onClick={handleLogout}>
          <div className='logout-icon ps-1'></div>
          Logout
        </Button>
    </div>
  );
}
