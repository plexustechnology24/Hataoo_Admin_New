// src/hooks/useNewMessageNotifier.ts
import { useEffect, useRef } from "react";
import axios from "axios";
import { toast } from "react-toastify";

const BASE          = "http://localhost:3001/api/contact/message/read";
const POLL_INTERVAL = 60_000; // 30 seconds
const STORAGE_KEY   = "contact_last_total";

// Fetch total message count for one tab type
const fetchCount = async (type: "product" | "influencer"): Promise<number> => {
  const res = await axios.get(BASE, { params: { page: 1, limit: 1, type } });
  return res.data?.meta?.total ?? 0;
};

const useNewMessageNotifier = () => {
  // Use a ref so the interval callback always reads the latest value
  const lastTotalRef = useRef<number>(
    parseInt(localStorage.getItem(STORAGE_KEY) ?? "0", 10)
  );

  useEffect(() => {
    let cancelled = false;

    const check = async () => {
      try {
        // Fetch both tabs in parallel
        const [productCount, influencerCount] = await Promise.all([
          fetchCount("product"),
          fetchCount("influencer"),
        ]);

        if (cancelled) return;

        const currentTotal = productCount + influencerCount;
        const lastTotal    = lastTotalRef.current;

        if (currentTotal > lastTotal) {
          const newCount = currentTotal - lastTotal;

          toast.info(
            `📩 ${newCount} new contact message${newCount > 1 ? "s" : ""} received!`,
            {
              toastId:         "new-contact-msg",   // prevents duplicate toasts
              autoClose:       6000,
              closeOnClick:    true,
              pauseOnHover:    true,
            }
          );

          // Persist so next poll compares from here
          lastTotalRef.current = currentTotal;
          localStorage.setItem(STORAGE_KEY, String(currentTotal));
        }
      } catch {
        // Silently ignore network errors — don't spam the user
      }
    };

    // Run once immediately, then on interval
    check();
    const timer = setInterval(check, POLL_INTERVAL);

    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, []); // runs once for the lifetime of the app
};

export default useNewMessageNotifier;