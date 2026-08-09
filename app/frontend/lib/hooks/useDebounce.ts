import { useState, useEffect } from "react";
import debounce from "lodash.debounce";

export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = debounce(() => setDebouncedValue(value), delay);
    timer();

    return () => {
      timer.cancel();
    };
  }, [value, delay]);

  return debouncedValue;
}
