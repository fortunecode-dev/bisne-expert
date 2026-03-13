type Props = {
  accent: string;
  surface: string;
  surface2: string;
  border: string;
  text: string;
  textMuted: string;
  bg: string;
};

export default function BusinessPalettePreview({
  accent,
  surface,
  surface2,
  border,
  text,
  textMuted,
  bg,
}: Props) {
  return (
    <div
      className="max-w-xl mx-auto p-4 rounded-3xl border"
      style={{ background: bg, borderColor: border }}
    >
      {/* Header */}
      <div className="flex gap-4 items-end mb-4">
        {/* Logo */}
        <div
          className="w-20 h-20 rounded-2xl flex items-center justify-center border-4 text-3xl"
          style={{
            background: surface2,
            borderColor: bg,
          }}
        >
          🍔
        </div>

        {/* Business info */}
        <div className="flex-1">
          <h1 className="text-2xl font-black" style={{ color: text }}>
            Burger House
          </h1>

          <p className="text-xs font-semibold" style={{ color: accent }}>
            The best burgers in town
          </p>

          <p className="text-sm mt-1" style={{ color: textMuted }}>
            Smash burgers, fries and milkshakes.
          </p>

          <p className="text-xs mt-1 font-semibold" style={{ color: accent }}>
            🕐 Open until 11 PM
          </p>
        </div>
      </div>

      {/* Chips */}
      <div className="flex flex-wrap gap-2 text-xs mb-3">
        <span
          className="px-3 py-1.5 rounded-full border"
          style={{
            borderColor: border,
            background: surface,
            color: textMuted,
          }}
        >
          📍 Havana
        </span>

        <span
          className="px-3 py-1.5 rounded-full border"
          style={{
            borderColor: border,
            background: surface,
            color: textMuted,
          }}
        >
          🏠 5th Avenue
        </span>

        <span
          className="px-3 py-1.5 rounded-full border"
          style={{
            borderColor: border,
            background: surface,
            color: textMuted,
          }}
        >
          📞 +53 555 5555
        </span>
      </div>

      {/* Social */}
      <div className="flex gap-2 mb-4">
        <div
          className="px-3 py-1 rounded-full text-xs font-medium"
          style={{ background: accent, color: "#fff" }}
        >
          Instagram
        </div>

        <div
          className="px-3 py-1 rounded-full text-xs font-medium"
          style={{ background: accent, color: "#fff" }}
        >
          WhatsApp
        </div>
      </div>

      {/* Instructions */}
      <div
        className="p-3 rounded-xl border mb-3"
        style={{
          borderColor: border,
          background: surface,
        }}
      >
        <p className="text-xs font-bold mb-1" style={{ color: accent }}>
          📋 Instructions
        </p>

        <p className="text-sm" style={{ color: text }}>
          Order at the counter and wait for your number.
        </p>
      </div>

      {/* Payment methods */}
      <div>
        <p className="text-[10px] uppercase mb-2" style={{ color: textMuted }}>
          Payment methods
        </p>

        <div className="flex gap-2 flex-wrap">
          <div
            className="px-2 py-1 rounded-lg border text-xs"
            style={{
              borderColor: accent + "40",
              background: accent + "10",
              color: text,
            }}
          >
            Cash
          </div>

          <div
            className="px-2 py-1 rounded-lg border text-xs"
            style={{
              borderColor: accent + "40",
              background: accent + "10",
              color: text,
            }}
          >
            Transfer
          </div>
        </div>
      </div>
    </div>
  );
}
