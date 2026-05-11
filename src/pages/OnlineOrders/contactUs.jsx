import React, { useCallback, useEffect, useRef, useState } from "react";
import axios from "axios";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "../../components/ui/table";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye, faSearch, faTrash, faTimes } from "@fortawesome/free-solid-svg-icons";
import CustomPagination from "../../components/common/pagination";
import Loading from "../../components/loading";
import DeleteModal from "../../components/deleteModal";

// ─── API Base ─────────────────────────────────────────────────────────────────
const BASE           = "https://api.hataoo.in/api/contact/message";
const BULK_DELETE    = "https://api.hataoo.in/api/admin/deleteMultiple";
const ITEMS_PER_PAGE = 15;

// TypeId per tab: product → 1, influencer → 2
const TAB_TYPE_ID = { product: "1", influencer: "2" };

// ─── View Modal ───────────────────────────────────────────────────────────────
const ViewModal = ({ isOpen, data, onClose, isInfluencer }) => {
    if (!isOpen || !data) return null;

  const fields = [
    { key: "fname",       label: "First Name"   },
    { key: "lname",       label: "Last Name"    },
    { key: "email",       label: "Email"        },
    { key: "contactNo",   label: "Contact No"   },
    ...(isInfluencer ? [
      { key: "platform",    label: "Platform"   },
      { key: "username",    label: "Username"   },
      { key: "userAddress", label: "Address"    },
    ] : []),
    { key: "message",     label: "Message"      },
  ];

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center">
      <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose} />
      <div className="relative bg-white rounded-lg w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto dark:bg-gray-800">

        {/* Header */}
        <div className="px-6 py-4 border-b dark:border-gray-700 flex items-center justify-between">
          <h3 className="text-xl font-semibold dark:text-white">Contact Details</h3>
          <button
            onClick={onClose}
            className="inline-flex items-center justify-center w-7 h-7 rounded-md bg-gray-100 text-gray-500 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-400"
          >
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-4 flex flex-col gap-3">
          {fields.map(f => (
            <div
              key={f.key}
              className="grid gap-2 px-4 py-3 bg-gray-50 rounded-lg dark:bg-gray-700/40"
              style={{ gridTemplateColumns: "120px 1fr" }}
            >
              <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide pt-0.5">
                {f.label}
              </span>
              <span className="text-sm text-gray-800 dark:text-gray-200 break-words leading-snug">
                {data[f.key] || "—"}
              </span>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-6 pb-5 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Main ContactUs Component ─────────────────────────────────────────────────
const ContactUs = () => {
  // ── Tab ────────────────────────────────────────────────────────────────────
  const [contactTab, setContactTab] = useState("product");

  // ── Data ───────────────────────────────────────────────────────────────────
  const [filteredData,  setFilteredData]  = useState([]);
  const [meta,          setMeta]          = useState(null);
  const [loading,       setLoading]       = useState(true);
  const [currentPage,   setCurrentPage]   = useState(1);
  const [itemsPerPage]                    = useState(ITEMS_PER_PAGE);
  const [searchTerm,    setSearchTerm]    = useState("");
  const [selectedItems, setSelectedItems] = useState([]);
  const [deleteModal,   setDeleteModal]   = useState({ isOpen: false, id: null, isBulk: false });
  const [viewModal,     setViewModal]     = useState({ isOpen: false, data: null });

  const searchContainerRef = useRef(null);
  const indexOfFirstItem   = (currentPage - 1) * itemsPerPage;
  const currentItems       = filteredData;

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const getData = useCallback((page = 1, search = "") => {
    setLoading(true);
    const params = { page, limit: itemsPerPage, type: contactTab };
    if (search && search.trim() !== "") params.search = search.trim();

    axios.get(`${BASE}/read`, { params })
      .then(res => {
        setFilteredData(res.data.data || []);
        setMeta(res.data.meta || null);
        if (res.data.meta) setCurrentPage(res.data.meta.currentPage || page);
        setSelectedItems([]);
      })
      .catch(() => toast.error("Failed to load data"))
      .finally(() => setLoading(false));
  }, [contactTab, itemsPerPage]);

  // reset on tab change
  useEffect(() => {
    setCurrentPage(1);
    setSearchTerm("");
    setSelectedItems([]);
    getData(1, "");
  }, [getData]);

  // ── Search ─────────────────────────────────────────────────────────────────
  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    if (e.target.value.trim() === "") { setCurrentPage(1); getData(1, ""); }
  };
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    getData(1, searchTerm.trim());
  };
  const handleClearSearch = () => {
    setSearchTerm("");
    setCurrentPage(1);
    getData(1, "");
  };

  // ── Selection ──────────────────────────────────────────────────────────────
  const allSelected = currentItems.length > 0 && selectedItems.length === currentItems.length;
  const toggleAll   = () => setSelectedItems(allSelected ? [] : currentItems.map(d => d._id));
  const toggleOne   = (id) =>
    setSelectedItems(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );

  // ── Delete ─────────────────────────────────────────────────────────────────
  const openDeleteModal = (id = null, isBulk = false) => {
    if (isBulk && selectedItems.length === 0) { toast.info("No items selected."); return; }
    setDeleteModal({ isOpen: true, id, isBulk });
  };
  const closeDeleteModal = () => setDeleteModal({ isOpen: false, id: null, isBulk: false });

  const handleDelete = () => {
    if (deleteModal.isBulk) {
      // ── Bulk delete — uses shared deleteMultiple API with TypeId ──
      axios
        .post(BULK_DELETE, {
          ids:    selectedItems,
          TypeId: TAB_TYPE_ID[contactTab],   // "1" for product, "2" for influencer
        })
        .then(() => {
          toast.success(`Successfully deleted ${selectedItems.length} item(s).`);
          const remaining = currentItems.length - selectedItems.length;
          const newPage   = remaining <= 0 && currentPage > 1 ? currentPage - 1 : currentPage;
          getData(newPage, searchTerm);
        })
        .catch(() => toast.error("Failed to delete selected items."))
        .finally(() => closeDeleteModal());
    } else {
      // ── Single delete ──
      axios
        .delete(`${BASE}/delete/${deleteModal.id}`, { params: { type: contactTab } })
        .then(res => {
          toast.success(res.data.message || "Deleted successfully");
          const newPage = currentItems.length <= 1 && currentPage > 1 ? currentPage - 1 : currentPage;
          getData(newPage, searchTerm);
        })
        .catch(() => toast.error("Failed to delete."))
        .finally(() => closeDeleteModal());
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-[calc(100vh-120px)]">
      <PageBreadcrumb pageTitle="Contact Us" />
          {/* ── Tab bar ── */}
          <div className="px-6 py-5">
            <div
              className="grid grid-cols-2 p-1 rounded-xl"
              style={{ background: "#e8edf8" }}
            >
              {[
                { key: "product",    label: "Product"    },
                { key: "influencer", label: "Influencer" },
              ].map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setContactTab(tab.key)}
                  className="py-[11px] px-5 rounded-lg text-sm transition-all duration-150"
                  style={{
                    fontWeight:    contactTab === tab.key ? 600 : 400,
                    background:    contactTab === tab.key ? "#fff" : "transparent",
                    color:         contactTab === tab.key ? "#7C7FFF" : "#6b7280",
                    boxShadow:     contactTab === tab.key ? "0 1px 4px rgba(0,0,0,0.10)" : "none",
                    border:        "none",
                    cursor:        "pointer",
                    letterSpacing: "0.01em",
                    fontFamily:    "inherit",
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>


      {/* ── Scrollable body ── */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden">
        <div className="rounded-2xl border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">

          {/* ── Header bar ── */}
          <div className="px-6 pt-4">
            <div className="flex justify-between items-center px-4 py-3 gap-4 flex-wrap">

              {/* Bulk delete */}
              <div className="min-w-[130px]">
                {selectedItems.length > 0 ? (
                  <button
                    onClick={() => openDeleteModal(null, true)}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-red-50 text-red-500 border border-red-200 rounded-lg text-sm font-medium hover:bg-red-100 transition-colors"
                  >
                    <FontAwesomeIcon icon={faTrash} />
                    Delete ({selectedItems.length})
                  </button>
                ) : (
                  <div className="h-9" />
                )}
              </div>

              {/* Search */}
              <div ref={searchContainerRef} className="relative">
                <form onSubmit={handleSearchSubmit}>
                  <div className="relative flex items-center">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
                      <svg className="fill-gray-500 dark:fill-gray-400" width="20" height="20" viewBox="0 0 20 20" fill="none">
                        <path fillRule="evenodd" clipRule="evenodd"
                          d="M3.04175 9.37363C3.04175 5.87693 5.87711 3.04199 9.37508 3.04199C12.8731 3.04199 15.7084 5.87693 15.7084 9.37363C15.7084 12.8703 12.8731 15.7053 9.37508 15.7053C5.87711 15.7053 3.04175 12.8703 3.04175 9.37363ZM9.37508 1.54199C5.04902 1.54199 1.54175 5.04817 1.54175 9.37363C1.54175 13.6991 5.04902 17.2053 9.37508 17.2053C11.2674 17.2053 13.003 16.5344 14.357 15.4176L17.177 18.238C17.4699 18.5309 17.9448 18.5309 18.2377 18.238C18.5306 17.9451 18.5306 17.4703 18.2377 17.1774L15.418 14.3573C16.5365 13.0033 17.2084 11.2669 17.2084 9.37363C17.2084 5.04817 13.7011 1.54199 9.37508 1.54199Z"
                          fill="" />
                      </svg>
                    </span>
                    <input
                      type="text"
                      placeholder="Search by name, email…"
                      value={searchTerm}
                      onChange={handleSearch}
                      className="dark:bg-dark-900 h-11 w-full rounded-lg border border-gray-200 bg-transparent py-2.5 pl-12 pr-14 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-none focus:ring focus:ring-brand-500/10 dark:border-gray-800 dark:bg-gray-900 dark:bg-white/[0.03] dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800 xl:w-[350px]"
                    />
                    <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
                      {searchTerm && (
                        <button
                          type="button"
                          onClick={handleClearSearch}
                          className="inline-flex items-center px-[7px] py-[4.5px] text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                          title="Clear search"
                        >
                          <FontAwesomeIcon icon={faTimes} />
                        </button>
                      )}
                      <button
                        type="submit"
                        className="inline-flex items-center px-[7px] py-[4.5px] text-xs text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400"
                        title="Search"
                      >
                        <FontAwesomeIcon icon={faSearch} />
                      </button>
                    </div>
                  </div>
                </form>
              </div>

            </div>
          </div>

          {/* ── Table ── */}
          <div className="p-4 border-gray-100 dark:border-gray-800 sm:p-6 overflow-auto">
            {loading ? (
              <Loading />
            ) : (
              <div className="space-y-6 rounded-lg xl:border dark:border-gray-800">
                <Table>
                  <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                    <TableRow>
  <TableCell isHeader className="py-4 font-medium text-gray-500 px-2 border-r border-gray-200 dark:border-gray-700 w-12 text-center">
    <input
      type="checkbox"
      checked={allSelected}
      onChange={toggleAll}
      className="w-[15px] h-[15px] accent-[#7C7FFF] cursor-pointer"
    />
  </TableCell>
  <TableCell isHeader className="py-4 font-medium text-gray-500 px-2 border-r border-gray-200 dark:border-gray-700 w-12">#</TableCell>
  <TableCell isHeader className="py-4 font-medium text-gray-500 px-2 border-r border-gray-200 dark:border-gray-700">First Name</TableCell>
  <TableCell isHeader className="py-4 font-medium text-gray-500 px-2 border-r border-gray-200 dark:border-gray-700">Last Name</TableCell>
  <TableCell isHeader className="py-4 font-medium text-gray-500 px-2 border-r border-gray-200 dark:border-gray-700">Email</TableCell>
  <TableCell isHeader className="py-4 font-medium text-gray-500 px-2 border-r border-gray-200 dark:border-gray-700">Contact No</TableCell>

  {/* ── Influencer-only columns ── */}
  {contactTab === "influencer" && <>
    <TableCell isHeader className="py-4 font-medium text-gray-500 px-2 border-r border-gray-200 dark:border-gray-700">Platform</TableCell>
    <TableCell isHeader className="py-4 font-medium text-gray-500 px-2 border-r border-gray-200 dark:border-gray-700">Username</TableCell>
    <TableCell isHeader className="py-4 font-medium text-gray-500 px-2 border-r border-gray-200 dark:border-gray-700">Address</TableCell>
  </>}

  <TableCell isHeader className="py-4 font-medium text-gray-500 px-2 border-r border-gray-200 dark:border-gray-700">Message</TableCell>
  <TableCell isHeader className="py-4 font-medium text-gray-500 px-2 w-24 text-center">Actions</TableCell>
</TableRow>
                  </TableHeader>

                  <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                    {currentItems.length > 0 ? (
                      currentItems.map((row, i) => {
                        const isSelected = selectedItems.includes(row._id);
                        return (
                          <TableRow
                            key={row._id}
                            className={isSelected ? "bg-indigo-50/60 dark:bg-indigo-900/10" : ""}
                          >
                            {/* Checkbox */}
                            <TableCell className="py-3 px-2 border-r border-gray-200 dark:border-gray-700 text-center">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => toggleOne(row._id)}
                                className="w-[15px] h-[15px] accent-[#7C7FFF] cursor-pointer"
                              />
                            </TableCell>

                            {/* # */}
                            <TableCell className="text-center px-2 border-r border-gray-200 dark:border-gray-700 text-gray-400 dark:text-gray-500 font-medium">
                              {indexOfFirstItem + i + 1}
                            </TableCell>

                            {/* First Name */}
                            <TableCell className="py-3 px-3 border-r border-gray-200 dark:border-gray-700 dark:text-gray-300">
                              {row.fname || "—"}
                            </TableCell>

                            {/* Last Name */}
                            <TableCell className="py-3 px-3 border-r border-gray-200 dark:border-gray-700 dark:text-gray-300">
                              {row.lname || "—"}
                            </TableCell>

                            {/* Email */}
                            <TableCell className="py-3 px-3 border-r border-gray-200 dark:border-gray-700">
                              <a
                                href={`mailto:${row.email}`}
                                className="text-[#7C7FFF] hover:underline"
                              >
                                {row.email || "—"}
                              </a>
                            </TableCell>

                            {/* Contact No */}
                            <TableCell className="py-3 px-3 border-r border-gray-200 dark:border-gray-700 dark:text-gray-300">
                              {row.contactNo || "—"}
                            </TableCell>

                            {/* ── Influencer-only cells ── */}
{contactTab === "influencer" && <>
  <TableCell className="py-3 px-3 border-r border-gray-200 dark:border-gray-700 dark:text-gray-300">
    {row.platform || "—"}
  </TableCell>
  <TableCell className="py-3 px-3 border-r border-gray-200 dark:border-gray-700 dark:text-gray-300">
    {row.username || "—"}
  </TableCell>
  <TableCell className="py-3 px-3 border-r border-gray-200 dark:border-gray-700 dark:text-gray-300">
    {row.userAddress || "—"}
  </TableCell>
</>}

                            {/* Message */}
                            <TableCell className="py-3 px-3 border-r border-gray-200 dark:border-gray-700 max-w-[200px]">
                              <span
                                className="block overflow-hidden text-ellipsis whitespace-nowrap text-gray-500 dark:text-gray-400 text-sm"
                                title={row.message}
                              >
                                {row.message || "—"}
                              </span>
                            </TableCell>

                            {/* Actions */}
                            <TableCell className="py-3 px-2">
                              <div className="flex items-center justify-center gap-4">
                                <button
                                  style={{ color: "#0385C3" }}
                                  onClick={() => setViewModal({ isOpen: true, data: row, isInfluencer: contactTab === "influencer" })}
                                  title="View"
                                >
                                  <FontAwesomeIcon icon={faEye} className="text-lg" />
                                </button>
                                <button
                                  className="text-red-600"
                                  onClick={() => openDeleteModal(row._id)}
                                  title="Delete"
                                >
                                  <FontAwesomeIcon icon={faTrash} className="text-lg" />
                                </button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={contactTab === "influencer" ? 11 : 8} className="text-center pt-10 pb-8 dark:text-gray-400">
                          <div className="text-4xl mb-3">📭</div>
                          <div className="text-sm font-medium text-gray-400">
                            {searchTerm
                              ? `No results found for "${searchTerm}"`
                              : "No Data Found"}
                          </div>
                        </td>
                      </tr>
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* ── Sticky bottom pagination — same as TestingNo ── */}
      <div className="w-full border-t dark:bg-gray-900 dark:border-gray-700 mt-0">
        <CustomPagination
          currentPage={currentPage}
          totalPages={meta ? meta.totalPages : 1}
          onPageChange={(page) => {
            setCurrentPage(page);
            setSelectedItems([]);
            getData(page, searchTerm);
          }}
          itemsPerPage={itemsPerPage}
          totalItems={meta ? meta.total : filteredData.length}
        />
      </div>

      {/* ── Modals ── */}
      <DeleteModal
        isOpen={deleteModal.isOpen}
        isBulk={deleteModal.isBulk}
        selectedCount={selectedItems.length}
        value={"contact"}
        onClose={closeDeleteModal}
        onConfirm={handleDelete}
      />
      <ViewModal
  isOpen={viewModal.isOpen}
  data={viewModal.data}
  isInfluencer={viewModal.isInfluencer}   // ← add this
  onClose={() => setViewModal({ isOpen: false, data: null })}
/>

      <ToastContainer position="top-center" className="!z-[99999]" />
    </div>
  );
};

export default ContactUs;