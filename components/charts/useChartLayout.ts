"use client";

import { useEffect, useState } from "react";

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia(query);
    const update = () => setMatches(mediaQuery.matches);

    update();
    mediaQuery.addEventListener("change", update);
    return () => mediaQuery.removeEventListener("change", update);
  }, [query]);

  return matches;
}

export function useChartLayout(variant: "default" | "compact" = "default") {
  const isLgUp = useMediaQuery("(min-width: 1024px)");

  const yAxisWidth =
    variant === "compact"
      ? isLgUp
        ? 40
        : 36
      : isLgUp
        ? 52
        : 42;

  return {
    margin: isLgUp
      ? { top: 8, right: 8, left: -16, bottom: 0 }
      : { top: 8, right: 4, left: 2, bottom: 0 },
    yAxisWidth,
    tick: { fill: "#A3A3A3", fontSize: isLgUp ? 12 : 10 },
    xAxisInterval: isLgUp ? ("preserveEnd" as const) : ("preserveStartEnd" as const),
  };
}
