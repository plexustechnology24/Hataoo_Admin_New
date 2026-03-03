import React from "react";
import { Button } from "../../components/ui/button";

interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export const Pagination: React.FC<PaginationProps> = ({ page, totalPages, onPageChange }) => {
  if (totalPages <= 1) return null;

  const handlePrev = () => {
    if (page > 1) onPageChange(page - 1);
  };

  const handleNext = () => {
    if (page < totalPages) onPageChange(page + 1);
  };

  const renderPageButtons = () => {
    const buttons = [];

    for (let i = 1; i <= totalPages; i++) {
      buttons.push(
        <Button
          key={i}
          size="sm"
          variant={i === page ? "default" : "outline"}
          className={`rounded-xl text-black font-semibold shadow-md hover:shadow-lg transition-all duration-200 ${i === page ? "bg-yellow-500 hover:bg-yellow-600" : "bg-white hover:bg-gray-100"}`}
          onClick={() => onPageChange(i)}
        >
          {i}
        </Button>
      );
    }

    return buttons;
  };

  return (
    <div className="flex items-center justify-center gap-2 pt-4">
      <Button size="sm" className="rounded-xl bg-yellow-500 hover:bg-yellow-600 text-black font-semibold shadow-md hover:shadow-lg transition-all duration-200" variant="outline" onClick={handlePrev} disabled={page === 1}>
        Prev
      </Button>
      {renderPageButtons()}
      <Button size="sm" className="rounded-xl bg-yellow-500 hover:bg-yellow-600 text-black font-semibold shadow-md hover:shadow-lg transition-all duration-200" variant="outline" onClick={handleNext} disabled={page === totalPages}>
        Next
      </Button>
    </div>
  );
};