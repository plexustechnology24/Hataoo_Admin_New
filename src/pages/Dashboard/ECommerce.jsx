import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faQrcode } from "@fortawesome/free-solid-svg-icons";

const SHEETS_QR = 16; // QRs per sheet

// ── Skeleton pulse ─────────────────────────────────────────────────────────────
const Pulse = ({ w = "w-12", h = "h-6" }) => (
    <div className={`${w} ${h} rounded-md bg-gray-100 dark:bg-gray-800 animate-pulse`} />
);

// ── Single stat card ───────────────────────────────────────────────────────────
const QrStatCard = ({ label, data, loading, palette, navigateTo }) => {
    const navigate = useNavigate();
    const sheets = data ? Math.ceil(data.total / SHEETS_QR) : 0;

    return (
        <div
            onClick={() => navigate(navigateTo)}
            className={`relative overflow-hidden rounded-2xl border bg-white dark:bg-gray-900 shadow-sm cursor-pointer
                transition-all duration-200 hover:shadow-md hover:-translate-y-0.5
                ${palette.border} dark:border-gray-800`}
        >

            {/* Decorative circle */}
            <div className={`absolute -top-6 -right-6 w-28 h-28 rounded-full opacity-10 ${palette.circle}`} />

            {/* Header row */}
            <div className="flex items-center gap-3 px-5 pt-5 pb-3">
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${palette.iconBg}`}>
                    <FontAwesomeIcon icon={faQrcode} className={`text-xl ${palette.iconColor}`} />
                </div>
                <div>
                    <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-0.5">
                        {label}
                    </p>
                    {loading
                        ? <Pulse w="w-16" h="h-8" />
                        : <p className={`text-3xl font-bold leading-none ${palette.totalColor}`}>{data?.total ?? 0}</p>
                    }
                </div>
            </div>

            {/* Divider */}
            <div className="mx-5 border-t border-gray-100 dark:border-gray-800" />

            {/* Active / Inactive / Sheets row */}
            <div className="grid grid-cols-3 divide-x divide-gray-100 dark:divide-gray-800 px-0 pb-4 pt-3">

                {/* Active */}
                <div className="flex flex-col items-center gap-1 px-3">
                    <span className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">
                        Active
                    </span>
                    {loading
                        ? <Pulse w="w-10" h="h-5" />
                        : (
                            <div className="flex items-center gap-1">
                                <span className="text-[23px] font-bold text-green-600 dark:text-green-400">
                                    {data?.active ?? 0}
                                </span>
                            </div>
                        )
                    }
                </div>

                {/* Inactive */}
                <div className="flex flex-col items-center gap-1 px-3">
                    <span className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">
                        Inactive
                    </span>
                    {loading
                        ? <Pulse w="w-10" h="h-5" />
                        : (
                            <div className="flex items-center gap-1">
                                <span className="text-[23px] font-bold text-red-500 dark:text-red-400">
                                    {data?.inactive ?? 0}
                                </span>
                            </div>
                        )
                    }
                </div>

                {/* Sheets */}
                <div className="flex flex-col items-center gap-1 px-3">
                    <span className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">
                        Sheets
                    </span>
                    {loading
                        ? <Pulse w="w-10" h="h-5" />
                        : (
                            <div className="flex items-center gap-1">
                                <span className={`text-[23px] font-bold ${palette.sheetColor}`}>
                                    {sheets}
                                </span>
                            </div>
                        )
                    }
                    {!loading && (
                        <span className="text-[9px] text-gray-600 dark:text-gray-600 leading-none">
                            {SHEETS_QR} per sheet
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
};

// ── Page ───────────────────────────────────────────────────────────────────────
const MoreDashboard = () => {
    const [counts, setCounts] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        axios.get("https://api.hataoo.in/api/admin/dashboard")
            .then(res => setCounts(res.data.data || null))
            .catch(() => setCounts(null))
            .finally(() => setLoading(false));
    }, []);

    return (
        <div>
            <PageBreadcrumb pageTitle="Dashboard" />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 px-1 mt-2">
                <QrStatCard
                    label="Sample QR Codes"
                    data={counts?.sample}
                    loading={loading}
                    navigateTo="/offline/sample-qr-codes"
                    palette={{
                        border:      "border-violet-100",
                        circle:      "bg-violet-200",
                        iconBg:      "bg-violet-50 dark:bg-violet-900/20",
                        iconColor:   "text-violet-500",
                        totalColor:  "text-violet-600 dark:text-violet-400",
                        sheetDot:    "bg-violet-400",
                        sheetColor:  "text-violet-600 dark:text-violet-400",
                    }}
                />
                <QrStatCard
                    label="Live QR Codes"
                    data={counts?.live}
                    loading={loading}
                    navigateTo="/offline/qr-codes"
                    palette={{
                        border:      "border-emerald-100",
                        circle:      "bg-emerald-200",
                        iconBg:      "bg-emerald-50 dark:bg-emerald-900/20",
                        iconColor:   "text-emerald-500",
                        totalColor:  "text-emerald-600 dark:text-emerald-400",
                        sheetDot:    "bg-emerald-400",
                        sheetColor:  "text-emerald-600 dark:text-emerald-400",
                    }}
                />
            </div>
        </div>
    );
};

export default MoreDashboard;