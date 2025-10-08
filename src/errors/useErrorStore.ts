import { useEffect, useState } from "react";
import { getErrors, clearErrors, subscribe } from "./errorStore";
import type { ErrorEntry } from "./errorTypes";

interface ErrorStoreState {
  errors: ErrorEntry[];
  clear: () => void;
}

export function useErrorStore(): ErrorStoreState {
  const [errors, setErrors] = useState<ErrorEntry[]>(getErrors());

  useEffect(() => {
    const unsubscribe = subscribe(setErrors);
    return unsubscribe;
  }, []);

  return { errors, clear: clearErrors };
}
