import { Component, type ErrorInfo, type ReactNode } from "react";
import { RefreshCw, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

// Transient DOM conflicts (a node React expects to remove was moved or dropped
// by something outside React) only need one fresh render to clear. Reload once
// per session, then fall back to the recovery card so we can never loop.
const RELOAD_FLAG = "bellyfull_dom_recovery";

const isDomConflict = (error: Error) =>
  error instanceof DOMException && error.name === "NotFoundError";

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Belly Full caught a render error:", error, info.componentStack);
    if (!isDomConflict(error)) return;
    try {
      if (!sessionStorage.getItem(RELOAD_FLAG)) {
        sessionStorage.setItem(RELOAD_FLAG, "1");
        window.location.reload();
      }
    } catch {
      /* storage unavailable — the recovery card handles it */
    }
  }

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4 py-10">
        <div className="w-full max-w-md text-center bg-card border border-border rounded-2xl p-6 sm:p-8 shadow-elegant">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-secondary/20 flex items-center justify-center mb-5">
            <RefreshCw className="h-7 w-7 text-secondary" aria-hidden="true" />
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-foreground mb-3">
            Let&#39;s get you back to the menu
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground mb-6">
            The page hit a snag while it was updating. Nothing you entered was lost —
            your cart is still saved. Reload to continue.
          </p>
          <div className="flex flex-col sm:flex-row items-stretch justify-center gap-3">
            <Button
              size="lg"
              className="rounded-full"
              onClick={() => window.location.reload()}
            >
              <RefreshCw className="h-4 w-4 mr-2" aria-hidden="true" />
              Reload page
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="rounded-full"
              onClick={() => window.location.assign("/")}
            >
              <Home className="h-4 w-4 mr-2" aria-hidden="true" />
              Go to homepage
            </Button>
          </div>
        </div>
      </div>
    );
  }
}

export default ErrorBoundary;
