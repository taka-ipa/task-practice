"use client";

import { createContext, useCallback, useContext, useRef, useState } from "react";
import { Card } from "@/components/ui/Card";

type ConfirmOptions = {
  title?: string;
  confirmLabel?: string;
  cancelLabel?: string;
};

type ConfirmState = ConfirmOptions & {
  message: string;
};

type ConfirmContextValue = {
  confirm: (message: string, options?: ConfirmOptions) => Promise<boolean>;
};

const ConfirmContext = createContext<ConfirmContextValue | null>(null);

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<ConfirmState | null>(null);
  const resolver = useRef<((value: boolean) => void) | null>(null);

  const confirm = useCallback((message: string, options?: ConfirmOptions) => {
    setState({ message, ...options });
    return new Promise<boolean>((resolve) => {
      resolver.current = resolve;
    });
  }, []);

  const close = (result: boolean) => {
    resolver.current?.(result);
    resolver.current = null;
    setState(null);
  };

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}

      {state && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <Card className="w-full max-w-sm p-6">
            {state.title && <h2 className="text-base font-semibold">{state.title}</h2>}
            <p className={`text-sm text-muted-foreground ${state.title ? "mt-2" : ""}`}>
              {state.message}
            </p>

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => close(false)}
                className="inline-flex items-center justify-center rounded-full btn px-4 text-sm font-semibold transition hover:shadow-sm"
              >
                {state.cancelLabel ?? "キャンセル"}
              </button>
              <button
                type="button"
                onClick={() => close(true)}
                className="inline-flex items-center justify-center rounded-full btn btn-danger px-4 text-sm font-semibold transition hover:shadow-sm"
              >
                {state.confirmLabel ?? "削除する"}
              </button>
            </div>
          </Card>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error("useConfirm must be used within a ConfirmProvider");
  return ctx.confirm;
}
