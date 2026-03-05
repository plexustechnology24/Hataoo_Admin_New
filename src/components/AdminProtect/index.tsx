import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

interface AdminProtectProps {
  children: React.ReactNode;
}

const AdminProtect: React.FC<AdminProtectProps> = ({ children }) => {
  const navigate = useNavigate();
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const verifyAdminToken = async () => {
      const adminToken = localStorage.getItem("adminToken");

      if (!adminToken) {
        setIsAdminAuthenticated(false);
        setIsLoading(false);
        navigate("/login");
        return;
      }

      try {
        
        if (adminToken) {
          setIsAdminAuthenticated(true);
        } else {
          localStorage.removeItem("adminToken");
          setIsAdminAuthenticated(false);
          navigate("/login");
        }
      } catch (error) {
        console.error("Error verifying admin token:", error);
        setIsAdminAuthenticated(false);
        navigate("/login");
      } finally {
        setIsLoading(false);
      }
    };
        verifyAdminToken();
  }, [navigate]);

  if (isLoading) {
    return <div
      style={{
        height: '80vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        overflow: "hidden"
      }}
    >
      <div className="border p-4 flex items-center space-x-2 rounded-md">
        <div className="w-10 h-10 border-2 border-gray-300 rounded-full animate-spin dark:border-gray-800" style={{ borderTop: "2px solid #eab308" }}></div>
      </div>

    </div>;
  }

  return <>{isAdminAuthenticated && children}</>;
};

export default AdminProtect;