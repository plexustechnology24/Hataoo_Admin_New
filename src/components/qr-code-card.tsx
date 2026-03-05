import { Card, CardContent, CardFooter, CardHeader } from "../components/ui/card"
import { Button } from "../components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "../components/ui/tooltip"
import { IconTrash, IconInfoCircle, IconLock } from "@tabler/icons-react"

interface QrCodeCardProps {
  index: number
  value: string
  image: string
  isActive?: boolean
  onDelete?: () => void
  onInfo?: () => void
}

export function QrCodeCard({
  index,
  value,
  image,
  isActive,
  onDelete,
  onInfo,
}: QrCodeCardProps) {
  const imageUrl = `${image}`

  return (
    <Card className="flex flex-col items-center relative bg-white">
      {/* Action Buttons */}
      <div className="absolute top-2 right-2 flex gap-1 z-10">
        {onInfo && (
          <Button
            variant="outline"
            size="icon"
            onClick={onInfo}
            className="h-7 w-7"
          >
            <IconInfoCircle className="h-4 w-4" />
          </Button>
        )}

        {/* If Active → Show Lock with Tooltip */}
        {isActive ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <span>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground cursor-not-allowed"
                >
                  <IconLock className="h-4 w-4" />
                </Button>
              </span>
            </TooltipTrigger>
            <TooltipContent className="bg-white">
              <p>This QR code is active and cannot be deleted</p>
            </TooltipContent>
          </Tooltip>
        ) : (
          onDelete && (
            <Button
              variant="outline"
              size="icon"
              onClick={onDelete}
              className="h-7 w-7 text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <IconTrash className="h-4 w-4" />
            </Button>
          )
        )}
      </div>

      <CardHeader className="flex pt-4 pb-0 items-start justify-start w-full">
        <h5 className="text-sm font-semibold">QR Code {index}</h5>
      </CardHeader>

      <CardContent className="flex items-center justify-center pb-2 pt-4">
        <img
          src={imageUrl}
          alt={`QR Code ${index}`}
          className="h-[140px] w-[140px] object-contain"
        />
      </CardContent>

      <CardFooter className="flex flex-col items-center gap-2 pb-4 w-full">
        {isActive !== undefined && (
          <span
            className={`inline-flex items-center justify-center rounded-full px-3 py-0.5 text-xs font-semibold 
              ${isActive
                ? "bg-green-50 text-green-700 border border-green-300"
                : "bg-yellow-50 text-yellow-700 border border-yellow-300"
              }`}
          >
            {isActive ? "Active" : "Inactive"}
          </span>
        )}

        <a
          href={value}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-blue-600 underline break-all text-center"
        >
          {value}
        </a>
      </CardFooter>
    </Card>
  )
}