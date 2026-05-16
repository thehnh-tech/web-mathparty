import StickyBack from "@/components/ui/StickyBack";

function SkBlock({
  w = "100%",
  h,
  radius = 6,
  style,
}: {
  w?: string | number;
  h: number;
  radius?: number;
  style?: React.CSSProperties;
}) {
  return (
    <div
      className="sk"
      style={{ width: w, height: h, borderRadius: radius, flexShrink: 0, ...style }}
    />
  );
}

export default function ProfileLoading() {
  return (
    <>
      <StickyBack href="/lobby" label="lobby" />

      <div
        style={{
          padding: "20px 20px 48px",
          overflowX: "hidden",
          boxSizing: "border-box",
          width: "100%",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: "16px",
            marginBottom: "20px",
          }}
        >
          {/* Avatar */}
          <SkBlock w={72} h={72} radius={999} />

          <div style={{ flex: 1, paddingTop: 4 }}>
            <SkBlock w="55%" h={28} style={{ marginBottom: 8 }} />
            <SkBlock w="70%" h={14} style={{ marginBottom: 12 }} />
            <div style={{ display: "flex", gap: 8 }}>
              <SkBlock w={72} h={28} radius={999} />
              <SkBlock w={72} h={28} radius={999} />
            </div>
          </div>
        </div>

        {/* Stat cards */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "10px",
            marginBottom: "28px",
          }}
        >
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              style={{
                border: "2px solid var(--ink)",
                borderRadius: "12px",
                padding: "14px 8px",
                boxShadow: i === 2 ? "4px 4px 0 var(--ink)" : "2px 2px 0 var(--ink)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 8,
              }}
            >
              <SkBlock w="50%" h={28} />
              <SkBlock w="65%" h={12} />
            </div>
          ))}
        </div>

        {/* Par chapitre */}
        <section style={{ marginBottom: "28px" }}>
          <SkBlock w="40%" h={22} style={{ marginBottom: 14 }} />
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {[80, 60, 45, 70, 55].map((pct, i) => (
              <div key={i}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: 4,
                  }}
                >
                  <SkBlock w="40%" h={14} />
                  <SkBlock w="20%" h={14} />
                </div>
                <SkBlock w="100%" h={10} radius={999} />
              </div>
            ))}
          </div>
        </section>

        {/* Heatmap */}
        <section style={{ marginBottom: "28px" }}>
          <SkBlock w="55%" h={22} style={{ marginBottom: 14 }} />
          <div
            style={{
              border: "2px solid var(--ink)",
              borderRadius: "12px",
              padding: "12px",
              boxShadow: "3px 3px 0 var(--ink)",
            }}
          >
            <SkBlock w="100%" h={84} radius={8} />
          </div>
        </section>

        {/* Recent games */}
        <section>
          <SkBlock w="45%" h={22} style={{ marginBottom: 14 }} />
          <div style={{ display: "flex", flexDirection: "column" }}>
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "14px",
                  padding: "12px 0",
                  borderBottom: i < 3 ? "1px dashed var(--ink-muted)" : "none",
                }}
              >
                <SkBlock w={36} h={36} radius={8} style={{ flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <SkBlock w="55%" h={15} style={{ marginBottom: 6 }} />
                  <SkBlock w="40%" h={12} />
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}
