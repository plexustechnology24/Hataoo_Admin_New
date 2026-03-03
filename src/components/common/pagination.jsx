import React from 'react';

const CustomPagination = ({
  currentPage,
  totalPages,
  onPageChange,
  itemsPerPage,
  totalItems,
  unshow = false
}) => {
  const renderPaginationItems = () => {
    const items = [];

    // console.log(totalPages);


    // Logic to determine which page numbers to show
    let startPage = Math.max(1, currentPage - 1);
    let endPage = Math.min(startPage + 3, totalPages);

    // Adjust startPage if we're near the end
    if (endPage - startPage < 3 && startPage > 1) {
      startPage = Math.max(1, endPage - 3);
    }

    // Add ellipsis at the beginning if needed
    if (startPage > 1) {
      items.push(
        <button
          key="start-ellipsis"
          onClick={() => onPageChange(1)}
          className="mx-1 px-3 py-1 rounded bg-white text-[#ababac] border border-[#ababac] hover:bg-gray-100"
        >
          1
        </button>
      );

      if (startPage > 2) {
        items.push(
          <span key="ellipsis-1" className="mx-1 px-2">...</span>
        );
      }
    }

    // Add the page numbers
    for (let i = startPage; i <= endPage; i++) {
      items.push(
        <button
          key={i}
          onClick={() => onPageChange(i)}
          className={`
            mx-1 px-3 py-1 rounded
            transition-colors duration-200
            ${currentPage === i
              ? 'bg-[#eab308] text-white border border-[#ababac]'
              : 'bg-white text-[#ababac] border border-[#ababac] hover:bg-gray-100'
            }
          `}
        >
          {i}
        </button>
      );
    }

    // Add ellipsis at the end if needed
    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        items.push(
          <span key="ellipsis-2" className="mx-1 px-2">...</span>
        );
      }

      items.push(
        <button
          key="end-page"
          onClick={() => onPageChange(totalPages)}
          className="mx-1 px-3 py-1 rounded bg-white text-[#ababac] border border-[#ababac] hover:bg-gray-100"
        >
          {totalPages}
        </button>
      );
    }

    return items;
  };

  return (
    <div className="flex justify-between px-4 items-center mt-5 dark:border-gray-800">
      {!unshow && (
        <p className="m-0 text-md text-gray-400">
          Showing {((currentPage - 1) * itemsPerPage) + 1} to{" "}
          {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems} entries
        </p>
      )}

      <div className="flex items-center space-x-1">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className={`
            mx-1 px-3 py-1 rounded
            transition-colors duration-200
            ${currentPage === 1
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed border border-[#ababac]'
              : 'bg-white text-[#ababac] border border-[#ababac] hover:bg-gray-100'
            }
          `}
        >
          Previous
        </button>

        {renderPaginationItems()}

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className={`
            mx-1 px-3 py-1 rounded
            transition-colors duration-200
            ${currentPage === totalPages
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed border border-[#ababac] dark:border-gray-800'
              : 'bg-white text-[#ababac] border border-[#ababac] hover:bg-gray-100 dark:border-gray-800'
            }
          `}
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default CustomPagination;