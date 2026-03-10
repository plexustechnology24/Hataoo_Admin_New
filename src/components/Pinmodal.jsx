import React, { useEffect, useRef, useState } from "react";

/**
 * PinVerifyModal — Static 4-digit PIN verification modal
 *
 * Props:
 * @param {boolean}  isOpen      - Controls visibility
 * @param {function} onClose     - Called on cancel / X / Escape
 * @param {function} onVerified  - Called after correct PIN is entered
 * @param {string}   correctPin  - The PIN to verify against (default: "1234")
 * @param {string}   title       - Modal heading
 * @param {string}   subtitle    - Subtext below heading
 */

const CORRECT_PIN = "5454"; // ← change your static PIN here

const LockIllustration = () => (
  <svg viewBox="0 0 160 140" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: 160, height: 140 }}>
    {/* Background circle */}
    <circle cx="80" cy="68" r="52" fill="#EEF2FF" />

    {/* Decorative dots */}
    <circle cx="22" cy="32" r="5" fill="#A5B4FC" opacity="0.6" />
    <circle cx="138" cy="50" r="4" fill="#6366F1" opacity="0.4" />
    <circle cx="130" cy="20" r="3" fill="#818CF8" opacity="0.5" />
    <circle cx="28" cy="100" r="3" fill="#C7D2FE" opacity="0.7" />
    <circle cx="145" cy="100" r="5" fill="#6366F1" opacity="0.3" />

    {/* Shield (green) */}
    <path d="M30 72 L30 92 Q30 108 46 114 Q62 120 62 120 Q62 120 78 114 Q94 108 94 92 L94 72 L62 60 Z"
      fill="#22C55E" opacity="0.9" />
    <path d="M36 74 L36 92 Q36 105 50 110 Q62 115 62 115 Q62 115 74 110 Q88 105 88 92 L88 74 L62 65 Z"
      fill="#16A34A" />
    {/* Checkmark on shield */}
    <polyline points="48,92 57,101 76,80" stroke="white" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />

    {/* Lock body */}
    <rect x="68" y="68" width="52" height="44" rx="8" fill="#3B82F6" />
    <rect x="72" y="72" width="44" height="36" rx="6" fill="#60A5FA" />

    {/* Lock shackle */}
    <path d="M78 68 L78 52 Q78 40 94 40 Q110 40 110 52 L110 68"
      stroke="#1D4ED8" strokeWidth="9" strokeLinecap="round" fill="none" />
    <path d="M80 68 L80 53 Q80 44 94 44 Q108 44 108 53 L108 68"
      stroke="#3B82F6" strokeWidth="5" strokeLinecap="round" fill="none" />

    {/* Keyhole */}
    <circle cx="94" cy="86" r="6" fill="#1D4ED8" />
    <rect x="91" y="88" width="6" height="8" rx="1" fill="#1D4ED8" />

    {/* PIN card / label */}
    <rect x="56" y="102" width="72" height="26" rx="6" fill="#FBBF24" />
    <circle cx="68" cy="115" r="4" fill="white" opacity="0.8" />
    <circle cx="80" cy="115" r="4" fill="white" opacity="0.8" />
    <circle cx="92" cy="115" r="4" fill="white" opacity="0.8" />
    <circle cx="104" cy="115" r="4" fill="white" opacity="0.8" />

    {/* Small blue dot on card */}
    <circle cx="130" cy="108" r="6" fill="#6366F1" opacity="0.7" />
  </svg>
);

const EyeIcon = ({ open }) =>
  open ? (
    <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round"
        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round"
        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  ) : (
    <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round"
        d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
    </svg>
  );

const PinVerifyModal = ({
  isOpen = false,
  onClose,
  onVerified,
  correctPin = CORRECT_PIN,
  title = "Enter PIN to Access",
  subtitle = "Please enter your secure 4-digit PIN to proceed.",
}) => {
  const [pin, setPin] = useState("");
  const [showPin, setShowPin] = useState(false);
  const [error, setError] = useState("");
  const [shake, setShake] = useState(false);
  const inputRef = useRef(null);

  // Reset state on open/close
  useEffect(() => {
    if (isOpen) {
      setPin("");
      setError("");
      setShake(false);
      setTimeout(() => inputRef.current?.focus(), 80);
    }
  }, [isOpen]);

  // Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e) => { if (e.key === "Escape") onClose?.(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [isOpen, onClose]);

  // Body scroll lock
  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  if (!isOpen) return null;

  const handlePinChange = (e) => {
    const val = e.target.value.replace(/\D/g, "").slice(0, 4);
    setPin(val);
    if (error) setError("");
  };

  const handleSubmit = () => {
    if (pin.length < 4) {
      setError("Please enter a 4-digit PIN.");
      triggerShake();
      return;
    }
    if (pin !== correctPin) {
      setError("Incorrect PIN. Please try again.");
      setPin("");
      triggerShake();
      inputRef.current?.focus();
      return;
    }
    // ✅ PIN correct → call onVerified
    setError("");
    onVerified?.();
    onClose?.();
  };

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 500);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleSubmit();
  };

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "fixed", inset: 0, zIndex: 99998,
          backgroundColor: "rgba(0,0,0,0.45)",
          backdropFilter: "blur(3px)",
        }}
      />

      {/* Modal */}
      <div
        style={{
          position: "fixed", inset: 0, zIndex: 99999,
          display: "flex", alignItems: "center", justifyContent: "center",
          padding: "16px",
          pointerEvents: "none",
        }}
      >
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            pointerEvents: "auto",
            background: "white",
            borderRadius: "20px",
            width: "100%",
            maxWidth: "400px",
            boxShadow: "0 25px 60px rgba(0,0,0,0.18)",
            overflow: "hidden",
            animation: "pinModalIn 0.22s cubic-bezier(.34,1.56,.64,1) both",
          }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="pin-modal-title"
        >
          {/* Illustration area */}
          <div style={{
            display: "flex", justifyContent: "center", alignItems: "center",
            paddingTop: 28, paddingBottom: 8,
            background: "linear-gradient(160deg, #f0f4ff 0%, #fafbff 100%)",
          }}>
            <LockIllustration />
          </div>

          {/* Content */}
          <div style={{ padding: "20px 28px 28px" }}>
            {/* Title */}
            <h2 id="pin-modal-title" style={{
              fontSize: 20, fontWeight: 800, color: "#111827",
              textAlign: "center", margin: "0 0 6px",
              fontFamily: "system-ui, -apple-system, sans-serif",
            }}>
              {title}
            </h2>

            {/* Subtitle */}
            <p style={{
              fontSize: 13, color: "#6B7280", textAlign: "center",
              margin: "0 0 22px", lineHeight: 1.5,
            }}>
              {subtitle}
            </p>

            {/* PIN Input */}
            <div style={{
              position: "relative",
              animation: shake ? "pinShake 0.45s ease" : "none",
              marginBottom: 8,
            }}>
              <input
                ref={inputRef}
                type={showPin ? "text" : "password"}
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={4}
                value={pin}
                onChange={handlePinChange}
                onKeyDown={handleKeyDown}
                placeholder="Enter PIN"
                style={{
                  width: "100%",
                  height: 52,
                  border: error ? "1.5px solid #EF4444" : "1.5px solid #E5E7EB",
                  borderRadius: 12,
                  padding: "0 48px 0 18px",
                  fontSize: 16,
                  color: "#111827",
                  outline: "none",
                  fontFamily: "monospace",
                  letterSpacing: pin && !showPin ? "0.4em" : "normal",
                  boxSizing: "border-box",
                  transition: "border-color 0.2s",
                  background: "#FAFAFA",
                }}
                onFocus={(e) => {
                  if (!error) e.target.style.borderColor = "#6366F1";
                }}
                onBlur={(e) => {
                  if (!error) e.target.style.borderColor = "#E5E7EB";
                }}
              />
              {/* Eye toggle */}
              <button
                type="button"
                onClick={() => setShowPin(!showPin)}
                style={{
                  position: "absolute", right: 14, top: "50%",
                  transform: "translateY(-50%)",
                  background: "none", border: "none", cursor: "pointer",
                  color: "#9CA3AF", padding: 4, display: "flex", alignItems: "center",
                }}
                aria-label={showPin ? "Hide PIN" : "Show PIN"}
                tabIndex={-1}
              >
                <EyeIcon open={showPin} />
              </button>
            </div>

            {/* Error */}
            <div style={{ minHeight: 20, marginBottom: 16 }}>
              {error && (
                <p style={{ fontSize: 12, color: "#EF4444", margin: 0, paddingLeft: 4 }}>
                  {error}
                </p>
              )}
            </div>

            {/* Buttons */}
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {/* Submit */}
              <button
                type="button"
                onClick={handleSubmit}
                style={{
                  width: "100%", height: 48,
                  background: "linear-gradient(135deg, #6366F1 0%, #818CF8 100%)",
                  border: "none", borderRadius: 12,
                  color: "white", fontSize: 15, fontWeight: 700,
                  cursor: "pointer", letterSpacing: 0.3,
                  boxShadow: "0 4px 16px rgba(99,102,241,0.35)",
                  transition: "opacity 0.15s, transform 0.1s",
                }}
                onMouseEnter={(e) => { e.target.style.opacity = "0.92"; e.target.style.transform = "translateY(-1px)"; }}
                onMouseLeave={(e) => { e.target.style.opacity = "1"; e.target.style.transform = "translateY(0)"; }}
                onMouseDown={(e) => { e.target.style.transform = "translateY(1px)"; }}
                onMouseUp={(e) => { e.target.style.transform = "translateY(-1px)"; }}
              >
                Submit
              </button>

              {/* Cancel */}
              <button
                type="button"
                onClick={onClose}
                style={{
                  width: "100%", height: 44,
                  background: "#F3F4F6", border: "none", borderRadius: 12,
                  color: "#6B7280", fontSize: 14, fontWeight: 600,
                  cursor: "pointer",
                  transition: "background 0.15s",
                }}
                onMouseEnter={(e) => { e.target.style.background = "#E5E7EB"; }}
                onMouseLeave={(e) => { e.target.style.background = "#F3F4F6"; }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes pinModalIn {
          from { opacity: 0; transform: scale(0.92) translateY(12px); }
          to   { opacity: 1; transform: scale(1)    translateY(0);    }
        }
        @keyframes pinShake {
          0%,100% { transform: translateX(0); }
          15%      { transform: translateX(-7px); }
          30%      { transform: translateX(7px); }
          45%      { transform: translateX(-5px); }
          60%      { transform: translateX(5px); }
          75%      { transform: translateX(-3px); }
          90%      { transform: translateX(3px); }
        }
      `}</style>
    </>
  );
};

export default PinVerifyModal;

