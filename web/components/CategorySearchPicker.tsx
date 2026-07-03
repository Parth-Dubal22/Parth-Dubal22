"use client";
/** R5 — search-as-you-type category picker over the FULL taxonomy tree
 *  (SPEC_V2_CATEGORIES §3: pro onboarding + profile editing). Multi-select with
 *  a primary + secondaries distinction.
 *
 *  - Text input runs searchCategories() (lib/data/categories) per keystroke.
 *  - Result rows show the top-level name, an "in {topLevel}" line for
 *    subcategory hits, and the match reason (via). Selecting a subcategory hit
 *    selects its TOP-LEVEL (that's what the DB stores).
 *  - Selected slugs render as chips; the first selected is the PRIMARY (navy,
 *    "PRIMARY" tag), the rest secondary. Any chip can be promoted to primary.
 *  - Fully keyboard operable: ↑/↓ move the active row, Enter adds it, Escape
 *    closes the list; chips remove with their × button or Backspace on empty.
 *
 *  Controlled: parent owns `value` (ordered slugs, index 0 = primary) and gets
 *  onChange(categorySlugs, primarySlug). No filesystem access — client-safe. */
import { useId, useMemo, useRef, useState } from "react";
import {
  searchCategories,
  findCategory,
  type CategorySearchHit,
} from "@/lib/data/categories";

export interface CategorySearchPickerProps {
  /** Ordered selected top-level slugs; index 0 is the primary. */
  value: string[];
  onChange: (categorySlugs: string[], primarySlug: string | null) => void;
  /** Accessible label for the input. */
  label?: string;
  placeholder?: string;
  /** Cap on selections (default 8). */
  max?: number;
}

const nameOf = (slug: string) => findCategory(slug)?.name ?? slug;

const VIA_LABEL: Record<CategorySearchHit["via"], string> = {
  name: "",
  synonym: "also known as",
  subcategory: "includes",
};

export default function CategorySearchPicker({
  value,
  onChange,
  label = "Search trades & categories",
  placeholder = "Search e.g. tiling, bricklaying, air con…",
  max = 8,
}: CategorySearchPickerProps) {
  const [q, setQ] = useState("");
  const [active, setActive] = useState(0);
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const listId = useId();

  const selected = new Set(value);
  const selectedKey = value.join(",");
  const hits = useMemo(() => {
    if (!q.trim()) return [];
    const chosen = new Set(selectedKey ? selectedKey.split(",") : []);
    return searchCategories(q, 10).filter((h) => !chosen.has(h.topLevel.slug));
  }, [q, selectedKey]);

  function add(slug: string) {
    if (selected.has(slug) || value.length >= max) return;
    const next = [...value, slug];
    onChange(next, next[0] ?? null);
    setQ("");
    setActive(0);
    setOpen(false);
    inputRef.current?.focus();
  }

  function remove(slug: string) {
    const next = value.filter((s) => s !== slug);
    onChange(next, next[0] ?? null);
  }

  function makePrimary(slug: string) {
    const next = [slug, ...value.filter((s) => s !== slug)];
    onChange(next, next[0] ?? null);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setOpen(true);
      setActive((a) => Math.min(a + 1, hits.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === "Enter") {
      if (hits[active]) {
        e.preventDefault();
        add(hits[active].topLevel.slug);
      }
    } else if (e.key === "Escape") {
      setOpen(false);
    } else if (e.key === "Backspace" && q === "" && value.length > 0) {
      remove(value[value.length - 1]);
    }
  }

  return (
    <div className="cat-search">
      <label className="field-legend" htmlFor={`${listId}-input`}>
        {label}
      </label>
      <input
        id={`${listId}-input`}
        ref={inputRef}
        className="cat-input"
        type="text"
        role="combobox"
        aria-expanded={open && hits.length > 0}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={open && hits[active] ? `${listId}-opt-${active}` : undefined}
        value={q}
        placeholder={placeholder}
        onChange={(e) => {
          setQ(e.target.value);
          setActive(0);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={onKeyDown}
        autoComplete="off"
      />

      {open && hits.length > 0 ? (
        <ul className="cat-results" id={listId} role="listbox" aria-label="Category matches">
          {hits.map((h, i) => {
            const isSub = h.via === "subcategory";
            const viaText =
              h.via === "subcategory"
                ? `in ${h.topLevel.name} · includes ${h.category.name}`
                : h.via === "synonym"
                  ? `${h.topLevel.name} · ${VIA_LABEL.synonym} “${h.category.name}”`
                  : "";
            return (
              <li key={h.topLevel.slug} role="option" id={`${listId}-opt-${i}`} aria-selected={i === active}>
                <button
                  type="button"
                  className={"cat-result" + (i === active ? " active" : "")}
                  onMouseEnter={() => setActive(i)}
                  onClick={() => add(h.topLevel.slug)}
                >
                  <span>
                    <span className="r-name">{h.topLevel.name}</span>
                    {isSub || h.via === "synonym" ? <span className="r-via">{viaText}</span> : null}
                  </span>
                  <span className="r-add" aria-hidden="true">
                    + Add
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}

      {value.length > 0 ? (
        <div className="cat-chips" aria-label="Selected categories">
          {value.map((slug, i) => {
            const primary = i === 0;
            return (
              <span key={slug} className={"cat-chosen" + (primary ? " is-primary" : "")}>
                {primary ? <span className="p-tag">Primary</span> : null}
                {nameOf(slug)}
                {!primary ? (
                  <button
                    type="button"
                    className="mk-primary"
                    onClick={() => makePrimary(slug)}
                    aria-label={`Make ${nameOf(slug)} your primary category`}
                  >
                    Make primary
                  </button>
                ) : null}
                <button
                  type="button"
                  className="x"
                  onClick={() => remove(slug)}
                  aria-label={`Remove ${nameOf(slug)}`}
                >
                  <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true">
                    <path d="M18 6L6 18M6 6l12 12" />
                  </svg>
                </button>
              </span>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
