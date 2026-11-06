import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  loading?: boolean;
  onConfirm: () => void | Promise<void>;
}

/** Shared styled "are you sure?" popup for admin pages (replaces window.confirm). */
const ConfirmDialog = ({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Delete",
  cancelLabel = "Cancel",
  destructive = true,
  loading = false,
  onConfirm,
}: ConfirmDialogProps) => (
  <AlertDialog open={open} onOpenChange={(o) => !loading && onOpenChange(o)}>
    <AlertDialogContent className="w-[calc(100vw-2rem)] max-w-md rounded-2xl">
      <AlertDialogHeader>
        <AlertDialogTitle>{title}</AlertDialogTitle>
        {description && <AlertDialogDescription>{description}</AlertDialogDescription>}
      </AlertDialogHeader>
      <AlertDialogFooter className="gap-2">
        <AlertDialogCancel disabled={loading} className="h-11 sm:h-10">
          {cancelLabel}
        </AlertDialogCancel>
        <AlertDialogAction
          disabled={loading}
          onClick={(e) => {
            e.preventDefault();
            void onConfirm();
          }}
          className={cn(
            "h-11 sm:h-10",
            destructive && "bg-destructive text-destructive-foreground hover:bg-destructive/90",
          )}
        >
          {loading ? "Working…" : confirmLabel}
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
);

export default ConfirmDialog;
