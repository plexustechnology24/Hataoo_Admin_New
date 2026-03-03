import { IconUser, IconQrcode, IconHeart, IconPhone } from "@tabler/icons-react"
import { BadgeInfo } from "lucide-react"

export function QrDetailsDialog({
  open,
  onOpenChange,
  data,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  data: any
}) {
  return (
    <>
    {open && (
  <div className="fixed inset-0 z-99999 flex items-center justify-center bg-black/80">
    <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-[600px] mx-4 max-h-[90vh] overflow-y-auto">

      {/* Header */}
      <h2 className="text-xl font-semibold mb-6">QR Code Details</h2>

      <div className="space-y-6 text-sm">

        {/* Basic Information */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 font-semibold text-base">
            <IconUser className="h-4 w-4" />
            Basic Information
          </div>
          <div className="grid grid-cols-2 gap-y-3 gap-x-6">
            <DetailItem label="Name" value={data?.name} />
            <DetailItem label="Language" value={data?.language} />
            <DetailItem label="Contact" value={data?.contactNumber} />
            <DetailItem label="Car Plate" value={data?.carNumberPlate} />
          </div>
        </div>

        <hr className="border-gray-200" />

        {/* QR Information */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 font-semibold text-base">
            <IconQrcode className="h-4 w-4" />
            QR Information
          </div>
          <div className="grid grid-cols-2 gap-y-3 gap-x-6">
            <DetailItem label="Code" value={data?.code} />

            <div>
              <p className="text-gray-400 text-xs mb-1">Status</p>
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                  data?.isActive
                    ? "bg-green-50 text-green-700 border-green-300"
                    : "bg-yellow-50 text-yellow-700 border-yellow-300"
                }`}
              >
                {data?.isActive ? "Active" : "Inactive"}
              </span>
            </div>

            <div>
              <p className="text-gray-400 text-xs mb-1">Verified</p>
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                  data?.contactVerified
                    ? "bg-blue-50 text-blue-700 border-blue-300"
                    : "bg-gray-50 text-gray-600 border-gray-300"
                }`}
              >
                {data?.contactVerified ? "Yes" : "No"}
              </span>
            </div>
          </div>
        </div>

        <hr className="border-gray-200" />

        {/* Emergency Details */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 font-semibold text-base">
            <BadgeInfo className="h-4 w-4" />
            Emergency Details
          </div>
          <div className="grid grid-cols-2 gap-y-3 gap-x-6">
            <DetailItem label="Blood Group" value={data?.emergencyDetails?.bloodGroup || "-"} />
            <DetailItem label="Insurance" value={data?.emergencyDetails?.healthInsuranceCompany || "-"} />
            <DetailItem label="Notes" value={data?.emergencyDetails?.notes || "-"} full />
          </div>
        </div>

        <hr className="border-gray-200" />

        {/* Emergency Contacts */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 font-semibold text-base">
            <IconPhone className="h-4 w-4" />
            Emergency Contacts
          </div>

          {data?.emergencyDetails?.emergencyContacts?.length ? (
            <div className="space-y-2">
              {data.emergencyDetails.emergencyContacts.map((contact: any, i: number) => (
                <div
                  key={i}
                  className="flex items-center justify-between rounded-xl border bg-gray-50/50 px-4 py-3"
                >
                  <span className="font-medium">{contact?.relation}</span>
                  <span className="text-sm text-gray-400">{contact?.phoneNumber}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 text-sm">No emergency contacts available</p>
          )}
        </div>

      </div>
    </div>
  </div>
)}
    </>
  )
}

/* ================= Reusable Component ================= */

function DetailItem({
  label,
  value,
  full,
}: {
  label: string
  value: any
  full?: boolean
}) {
  return (
    <div className={full ? "col-span-2" : ""}>
      <p className="text-muted-foreground text-xs mb-1">{label}</p>
      <p className="font-medium break-words">{value || "-"}</p>
    </div>
  )
}