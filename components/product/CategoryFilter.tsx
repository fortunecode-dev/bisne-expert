"use client";

interface CategoryFilterProps {
  categories: string[];
  selected: string | null;
  onSelect: (cat: string | null) => void;
  showFeatured: boolean;
  onFeaturedToggle: () => void;
  lang: "es" | "en";
}

export function CategoryFilter({
  categories,
  selected,
  onSelect,
  showFeatured,
  onFeaturedToggle,
  lang,
}: CategoryFilterProps) {
  return (
    <div
      className="flex gap-2 flex-nowrap overflow-x-auto pb-0.5 scrollbar-none"
      style={{ scrollbarWidth: "none" }}
    >
      <FilterBtn
        active={!selected && !showFeatured}
        onClick={() => onSelect(null)}
        label={lang === "es" ? "Todo" : "All"}
      />
      <FilterBtn
        active={showFeatured}
        onClick={onFeaturedToggle}
        label={`★ ${lang === "es" ? "Destacados" : "Featured"}`}
        gold
      />
      {categories
        .filter((cat) => !!cat)
        .map((cat) => (
          <FilterBtn
            key={cat}
            active={selected === cat}
            onClick={() => onSelect(cat)}
            label={cat}
          />
        ))}
    </div>
  );
}

function FilterBtn({
  active,
  onClick,
  label,
  gold,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  gold?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className="flex-shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all active:scale-95 whitespace-nowrap"
      style={
        active
          ? gold
            ? { background: "var(--biz-price)", color: "#111" }
            : {
                background: "var(--biz-accent)",
                color: "var(--biz-accent-text)",
              }
          : {
              background: "var(--biz-surface2)",
              color: "var(--biz-text-muted)",
              border: "1px solid var(--biz-border)",
            }
      }
    >
      {label}
    </button>
  );
}
