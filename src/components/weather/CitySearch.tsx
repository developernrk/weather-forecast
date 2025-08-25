"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader2, Search, X } from "lucide-react";

export type CityOption = { name: string; country?: string; lat?: number; lon?: number };

export default function CitySearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<CityOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [highlighted, setHighlighted] = useState<number>(-1);
  const listboxId = "city-search-listbox";
  const router = useRouter();
  const abortRef = useRef<AbortController | null>(null);

  async function addCity(name: string, country?: string) {
    const cleaned = name.trim();
    if (!cleaned) return;
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/cities`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: cleaned, country }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to add city");
      setQuery("");
      setResults([]);
      setHighlighted(-1);
      router.refresh();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const c = setTimeout(async () => {
      if (!query.trim()) {
        setResults([]);
        setHighlighted(-1);
        return;
      }
      try {
        setLoading(true);
        setError(null);
        // Cancel any in-flight request
        abortRef.current?.abort();
        const controller = new AbortController();
        abortRef.current = controller;

        const res = await fetch(`/api/weather?search=${encodeURIComponent(query)}` , { signal: controller.signal });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || "Search failed");
        setResults(data.results ?? []);
        setHighlighted((prev) => (data.results?.length ? Math.min(prev, data.results.length - 1) : -1));
      } catch (e: any) {
        if (e?.name === "AbortError") return;
        setError(e.message || "Search error");
      } finally {
        setLoading(false);
      }
    }, 350); // debounce
    return () => {
      clearTimeout(c);
      abortRef.current?.abort();
    };
  }, [query]);

  const showList = useMemo(() => query.trim().length > 0 && (results.length > 0 || (!loading && !error)), [results, query, loading, error]);

  const onEnter = () => {
    if (results.length > 0 && highlighted >= 0) {
      const r = results[highlighted];
      addCity(r.name, r.country).catch((e) => setError(e.message));
      return;
    }
    const [name, country] = query.split(",").map((s) => s.trim());
    addCity(name, country || undefined).catch((e) => setError(e.message));
  };

  return (
    <div className="w-full  relative">
      <label htmlFor="city-search" className="sr-only">Search city</label>
      <div className="flex gap-2 items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" aria-hidden />
          <Input
            id="city-search"
            role="combobox"
            aria-expanded={showList}
            aria-controls={showList ? listboxId : undefined}
            aria-autocomplete="list"
            placeholder="Search for a city (e.g., London or London, GB)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setHighlighted((i) => (results.length ? (i + 1) % results.length : -1));
              } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setHighlighted((i) => (results.length ? (i - 1 + results.length) % results.length : -1));
              } else if (e.key === "Enter") {
                e.preventDefault();
                onEnter();
              } else if (e.key === "Escape") {
                setResults([]);
                setHighlighted(-1);
              }
            }}
            className="pl-9 pr-9"
          />
          {query && !loading && (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setResults([]);
                setHighlighted(-1);
              }}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          )}
          {loading && (
            <span className="absolute right-2 top-1/2 -translate-y-1/2" aria-live="polite" aria-busy="true">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </span>
          )}
        </div>
        {/*<Button*/}
        {/*  type="button"*/}
        {/*  onClick={onEnter}*/}
        {/*  disabled={loading || !query.trim()}*/}
        {/*>*/}
        {/*  Add*/}
        {/*</Button>*/}
      </div>
      <p className="text-xs text-muted-foreground mt-1">Press Enter to add the city. Use ↑/↓ to navigate suggestions.</p>
      {error && <p className="text-sm text-red-500 mt-2" role="alert">{error}</p>}

      {showList && (
        <Card className="absolute z-10 mt-2 w-full p-2 space-y-1 border shadow-md max-h-64 overflow-auto" role="listbox" id={listboxId}>
          {results.length > 0 ? (
            results.map((r, idx) => {
              const selected = idx === highlighted;
              return (
                <button
                  key={`${r.name}-${r.country}-${idx}`}
                  role="option"
                  aria-selected={selected}
                  className={`w-full text-left px-2 py-1 rounded hover:bg-accent focus:bg-accent outline-none ${selected ? "bg-accent" : ""}`}
                  onMouseEnter={() => setHighlighted(idx)}
                  onFocus={() => setHighlighted(idx)}
                  onClick={() => addCity(r.name, r.country).catch((e) => setError(e.message))}
                >
                  {r.name}
                  {r.country ? `, ${r.country}` : ""}
                </button>
              );
            })
          ) : (
            <div className="px-2 py-1 text-sm text-muted-foreground">No matches found</div>
          )}
        </Card>
      )}
    </div>
  );
}
