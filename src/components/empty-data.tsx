import { Loader2, AlertCircle, WifiOff } from "lucide-react";

interface EmptyStateProps {
  type: "loading" | "empty" | "error" | "offline";
  message?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ type, message }) => {
  const getContent = () => {
    switch (type) {
      case "loading":
        return (
          <div className="flex flex-col items-center gap-3 py-20">
            <Loader2 className="h-8 w-8 animate-spin text-yellow-500" />
            <p className="text-sm text-muted-foreground">{message || "Loading..."}</p>
          </div>
        );
      case "empty":
        return (
          <div className="flex flex-col items-center gap-4 py-16 rounded-lg">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
              <AlertCircle className="h-7 w-7 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium">{message || "Nothing to show"}</h3>
          </div>
        );
      case "error":
        return (
          <div className="flex flex-col items-center gap-4 py-16 rounded-lg">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-100">
              <AlertCircle className="h-7 w-7 text-red-500" />
            </div>
            <h3 className="text-lg font-medium">{message || "Something went wrong"}</h3>
          </div>
        );
      case "offline":
        return (
          <div className="flex flex-col items-center gap-4 py-16 rounded-lg">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-orange-100">
              <WifiOff className="h-7 w-7 text-orange-500" />
            </div>
            <h3 className="text-lg font-medium">{message || "No internet connection"}</h3>
          </div>
        );
    }
  };

  return <>{getContent()}</>;
};