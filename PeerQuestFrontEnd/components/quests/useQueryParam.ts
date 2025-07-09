import { useEffect, useState } from "react";

export function useQueryParam(key: string): string | null {
  const [value, setValue] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    setValue(params.get(key));
    const handler = () => {
      const params = new URLSearchParams(window.location.search);
      setValue(params.get(key));
    };
    window.addEventListener("popstate", handler);
    return () => window.removeEventListener("popstate", handler);
  }, [key]);

  return value;
}
