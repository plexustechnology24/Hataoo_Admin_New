import { useForm } from "react-hook-form"
import { Loader2 } from "lucide-react"
import { useEffect } from "react"

interface QrGenerateDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onGenerate: (count: number) => void
  loading: boolean
}

interface FormValues {
  count: number
}

export function QrGenerateDialog({
  open,
  onOpenChange,
  onGenerate,
  loading
}: QrGenerateDialogProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: { count: 1 },
  })

  // Handle browser back button to close dialog
  useEffect(() => {
    if (!open) return;

    window.history.pushState({ modalOpen: true }, "");

    const handlePopState = (event: PopStateEvent) => {
      onOpenChange(false);
    };

    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
      if (window.history.state && window.history.state.modalOpen) {
        window.history.back();
      }
    };
  }, [open, onOpenChange]);

  function onSubmit(data: FormValues) {
    onGenerate(Number(data.count))
    reset()
    onOpenChange(false)
  }

  return (
    <>
      {open && (
        <div className="fixed inset-0 z-99999 flex items-center justify-center bg-black/80">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-[425px] mx-4">

            {/* Header */}
            <h2 className="text-xl font-bold text-black mb-1">Generate QR Codes</h2>
            <p className="text-sm text-muted-foreground mb-5">
              Enter the number of QR codes you want to generate.
            </p>

            {/* Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="grid gap-5">
              <div className="grid gap-2">
                <label htmlFor="count" className="font-medium text-sm">
                  Number of QR Codes
                </label>

                <input
                  id="count"
                  type="number"
                  placeholder="Enter number"
                  disabled={loading}
                  className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none focus:border-yellow-500 transition-all duration-200 disabled:opacity-50"
                  {...register("count", {
                    required: "This field is required",
                    min: { value: 1, message: "Minimum value is 1" },
                    max: { value: 50, message: "Maximum value is 50" },
                  })}
                />

                {errors.count && (
                  <p className="text-sm text-red-500">{errors.count.message}</p>
                )}
              </div>

              {/* Footer Buttons */}
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => onOpenChange(false)}
                  disabled={loading}
                  className="px-4 py-2 rounded-xl border border-yellow-500 text-yellow-700 hover:bg-yellow-50 font-medium transition-all duration-200 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 rounded-xl bg-yellow-500 hover:bg-yellow-600 text-black font-semibold shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50 flex items-center justify-center min-w-[90px]"
                >
                  {loading ? (
                    <Loader2 className="h-5 w-5 animate-spin text-black" />
                  ) : (
                    "Generate"
                  )}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}
    </>
  )
}
