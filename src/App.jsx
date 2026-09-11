import { useState, useMemo, useEffect, useRef } from "react"

// ─── Utility ───────────────────────────────────────────────────────────────────
function cn(...classes) {
  return classes.filter(Boolean).join(" ")
}

// ─── Solar Sizing Engine ───────────────────────────────────────────────────────
function calculateSolarSystem({
  mode,
  rooms,
  geysers,
  pumps,
  acUnits,
  freezers,
  backupHours,
}) {
  const roomKw = mode === "Residential" ? 0.35 : 0.65
  const baseLoadKw = rooms * roomKw

  const geyserLoadKw = geysers * 2.0
  const pumpLoadKw = pumps * 1.5
  const acLoadKw = acUnits * 1.8
  const freezerLoadKw = freezers * 0.4
  const heavyLoadKw = geyserLoadKw + pumpLoadKw + acLoadKw + freezerLoadKw

  const totalPeakKw = baseLoadKw + heavyLoadKw

  // Inverter Sizing: accounts for 0.85 PF + 25% surge headroom
  const rawKva = (totalPeakKw / 0.85) * 1.25
  const inverterTiers = [3.5, 5.0, 8.0, 10.0, 12.0, 16.0, 20.0, 25.0, 30.0]
  const inverterKva = inverterTiers.find((t) => t >= rawKva) || Math.ceil(rawKva)

  // Battery Sizing: 60% continuous outage load factor, 85% usable DoD for LiFePO4
  const averageLoadKw = totalPeakKw * 0.6
  const rawBatteryKwh = (averageLoadKw * backupHours) / 0.85
  const batteryTiers = [5.12, 10.24, 15.36, 20.48, 25.6, 30.72, 40.96, 51.2]
  const batteryKwh =
    batteryTiers.find((t) => t >= rawBatteryKwh) || Math.ceil(rawBatteryKwh / 5) * 5.12

  // Solar PV Array: ~5.5 peak sun hours in Lusaka; 450W Tier-1 panels
  const dailyKwhNeeded = totalPeakKw * 5.0
  const calculatedPanels = Math.ceil(dailyKwhNeeded / (0.45 * 5.5))
  const panelsCount = Math.max(4, calculatedPanels % 2 === 0 ? calculatedPanels : calculatedPanels + 1)
  const totalPvKwp = (panelsCount * 0.45).toFixed(2)
  const dailyYieldKwh = (panelsCount * 0.45 * 5.5).toFixed(1)

  return {
    inverterKva: inverterKva.toFixed(1),
    batteryKwh: batteryKwh.toFixed(1),
    panelsCount,
    totalPvKwp,
    dailyYieldKwh,
    totalPeakKw: totalPeakKw.toFixed(2),
    baseLoadKw: baseLoadKw.toFixed(2),
    heavyLoadKw: heavyLoadKw.toFixed(2),
    totalHeavyCount: geysers + pumps + acUnits + freezers,
  }
}

// ─── WhatsApp Lead Generator ──────────────────────────────────────────────────
function generateWhatsAppLink({
  mode,
  rooms,
  geysers,
  pumps,
  acUnits,
  freezers,
  backupHours,
  system,
}) {
  const lines = [
    "🌞 *ZAMBEZI AMIGO SOLAR ENERGIES LTD (ZamSolar)*",
    "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
    "*Official Quotation & Sizing Slip*",
    "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
    `• *Client Profile:* ${mode}`,
    `• *${mode === "Residential" ? "Total Rooms" : "Office Sections"}:* ${rooms}`,
    `• *Desired Backup Duration:* ${backupHours} Hours`,
    "",
    "*Heavy Inductive Loads Connected:*",
    `  - Geysers: ${geysers}`,
    `  - Borehole Pumps: ${pumps}`,
    `  - Air Conditioners: ${acUnits}`,
    `  - Freezers: ${freezers}`,
    "",
    "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
    "*Calculated Hardware Configuration:*",
    `• *Inverter Capacity:* ${system.inverterKva} kVA Hybrid (Pure Sine Wave)`,
    `• *Battery Bank:* ${system.batteryKwh} kWh LiFePO4 (6,000+ Cycles)`,
    `• *Solar PV Array:* ${system.panelsCount} × 450W Tier-1 Mono (${system.totalPvKwp} kWp)`,
    `• *Continuous Peak Load:* ${system.totalPeakKw} kW`,
    `• *Est. Daily Generation:* ~${system.dailyYieldKwh} kWh/day`,
    "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
    "Attn: Samson M. (Sales & Engineering)",
    "ZamSolar Depot: No. 9, Chindo Road, Woodlands, Lusaka",
    "",
    "Please provide an official pro-forma invoice and advise on installation scheduling.",
  ]

  const encoded = encodeURIComponent(lines.join("\n"))
  return `https://wa.me/260977667075?text=${encoded}`
}

// ─── SVGs & Brand Marks ───────────────────────────────────────────────────────
function ZoahStyleZamSolarBrand() {
  return (
    <div className="flex items-center gap-2.5">
      <img
        src="/images/zamsolar_logo_64.png"
        alt="ZamSolar Logo"
        className="w-7 h-7 object-contain flex-shrink-0"
        width="28"
        height="28"
      />
      <div className="flex flex-col">
        <span className="text-[17px] font-bold tracking-tight text-[#000000] leading-none">
          ZamSolar
        </span>
        <span className="text-[10px] text-[rgba(0,0,0,0.5)] font-medium tracking-tight mt-0.5">
          Zambezi Amigo Solar Energies Ltd
        </span>
      </div>
    </div>
  )
}

function WhatsAppIcon({ className = "w-4 h-4" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  )
}

function FacebookIcon({ className = "w-4 h-4" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  )
}

function ArrowRightIcon({ className = "w-3.5 h-3.5" }) {
  return (
    <svg className={className} viewBox="0 0 14 14" fill="none">
      <path
        d="M2.5 7H11.5M11.5 7L7.5 3M11.5 7L7.5 11"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

// ─── Zoah Collaborative Cursor Tag Component with Parallax ────────────────────
function ZoahCursor({ color, label, className = "", parallaxFactor = 0.05, scrollY = 0 }) {
  const yOffset = scrollY * parallaxFactor

  return (
    <div
      className={cn("zoah-cursor hidden md:flex items-start", className)}
      style={{
        transform: `translate3d(0, ${yOffset.toFixed(1)}px, 0)`,
      }}
    >
      <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 28 29" fill="none">
        <path
          d="M11.89 23.71L7.33 7.72C7.10 6.89 7.96 6.18 8.74 6.55L23.84 13.78C24.64 14.16 24.58 15.32 23.74 15.61L17.53 17.81C17.31 17.89 17.12 18.05 17.00 18.26L13.73 23.94C13.29 24.70 12.13 24.56 11.89 23.71Z"
          fill={color}
          stroke={color}
          strokeWidth="1"
        />
      </svg>
      <span className="zoah-cursor-label" style={{ backgroundColor: color }}>
        {label}
      </span>
    </div>
  )
}

// ─── Stepper Counter Component ─────────────────────────────────────────────────
function ZoahCounter({ label, value, onChange, min = 0, max = 40, note = null }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <label className="text-[12px] font-medium text-[rgba(0,0,0,0.65)] tracking-tight uppercase">
          {label}
        </label>
        {note && <span className="text-[11px] text-[rgba(0,0,0,0.4)]">{note}</span>}
      </div>
      <div className="flex items-center gap-2.5 border border-[rgba(0,0,0,0.12)] rounded-xl p-1.5 bg-[#ffffff] shadow-xs">
        <button
          type="button"
          className="zoah-counter-btn"
          onClick={() => onChange(Math.max(min, value - 1))}
          disabled={value <= min}
          aria-label={`Decrease ${label}`}
        >
          –
        </button>
        <span className="flex-1 text-center text-[15px] font-semibold text-[#000000] tabular-nums">
          {value}
        </span>
        <button
          type="button"
          className="zoah-counter-btn"
          onClick={() => onChange(Math.min(max, value + 1))}
          disabled={value >= max}
          aria-label={`Increase ${label}`}
        >
          +
        </button>
      </div>
    </div>
  )
}

// ─── Zoah Scroll Cue Indicator ─────────────────────────────────────────────────
function ScrollCue({ visible }) {
  return (
    <aside
      className="scroll-cue"
      data-scroll-cue
      data-visible={visible ? "true" : "false"}
      aria-hidden="true"
    >
      <svg viewBox="0 0 56 92" fill="none" focusable="false" overflow="visible">
        <rect
          x="8"
          y="6"
          width="40"
          height="60"
          rx="20"
          stroke="currentColor"
          strokeWidth="3.5"
          fill="none"
        />
        <line
          className="scroll-cue__wheel"
          x1="28"
          y1="17"
          x2="28"
          y2="28"
          stroke="currentColor"
          strokeWidth="3.5"
          strokeLinecap="round"
        />
        <path
          className="scroll-cue__chevron"
          d="M19 78 L28 85 L37 78"
          stroke="currentColor"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </svg>
    </aside>
  )
}

// ─── Header & Top Announcement Bar ────────────────────────────────────────────
function SiteHeader({ scrollDirection }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <>
      {/* Required Demo Banner: "This demo was created by Mapalo from Anomaly Digital" */}
      <div className="zoah-demo-banner">
        <span className="w-2 h-2 rounded-full bg-[#00c295] animate-pulse flex-shrink-0" />
        <span>This demo was created by Mapalo from Anomaly Digital</span>
      </div>

      {/* Main Header Bar with directional scroll behavior */}
      <header
        className={cn(
          "sticky top-0 z-40 bg-[#f6f6f5]/90 backdrop-blur-md border-b border-[rgba(0,0,0,0.06)] zoah-header",
          scrollDirection === "down" ? "scrolling-down" : "scrolling-up"
        )}
      >
        <div className="zoah-wrap h-16 flex items-center justify-between">
          <a href="#" className="hover:opacity-85 transition-opacity">
            <ZoahStyleZamSolarBrand />
          </a>

          {/* Center Navigation (Desktop & Tablet) */}
          <nav className="hidden md:flex items-center gap-7">
            <a href="#estimator" className="text-[14px] font-medium text-[rgba(0,0,0,0.65)] hover:text-[#000000] transition-colors">
              Solar Engine
            </a>
            <a href="#inventory" className="text-[14px] font-medium text-[rgba(0,0,0,0.65)] hover:text-[#000000] transition-colors">
              Verified Stock
            </a>
            <a href="#specifications" className="text-[14px] font-medium text-[rgba(0,0,0,0.65)] hover:text-[#000000] transition-colors">
              Technical Matrix
            </a>
            <a href="#about" className="text-[14px] font-medium text-[rgba(0,0,0,0.65)] hover:text-[#000000] transition-colors">
              Leadership & HQ
            </a>
          </nav>

          {/* Desktop Right CTA Pill */}
          <div className="hidden md:flex items-center gap-3">
            <a
              href="https://wa.me/260977667075"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[13px] font-medium text-[rgba(0,0,0,0.7)] hover:text-[#000000] transition-colors flex items-center gap-1.5"
            >
              <WhatsAppIcon className="w-4 h-4 text-[#25D366]" />
              <span>Samson M.</span>
            </a>
            <a href="#estimator" className="zoah-btn-pill">
              Calculate Sizing
            </a>
          </div>

          {/* Mobile Hamburger Toggle */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-[#000000] hover:bg-[rgba(0,0,0,0.04)] rounded-lg transition-colors"
            aria-label="Toggle Navigation Menu"
          >
            <div className="w-5 h-4 flex flex-col justify-between">
              <span className={cn("h-0.5 w-full bg-[#000000] transition-transform duration-200", mobileMenuOpen && "rotate-45 translate-y-1.5")} />
              <span className={cn("h-0.5 w-full bg-[#000000] transition-opacity duration-200", mobileMenuOpen && "opacity-0")} />
              <span className={cn("h-0.5 w-full bg-[#000000] transition-transform duration-200", mobileMenuOpen && "-rotate-45 -translate-y-2")} />
            </div>
          </button>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-[#f6f6f5] border-b border-[rgba(0,0,0,0.08)] px-5 py-6 space-y-4 shadow-lg">
            <div className="flex flex-col space-y-3">
              <a
                href="#estimator"
                onClick={() => setMobileMenuOpen(false)}
                className="text-[15px] font-semibold text-[#000000] py-1 border-b border-[rgba(0,0,0,0.05)]"
              >
                Solar Sizing Engine
              </a>
              <a
                href="#inventory"
                onClick={() => setMobileMenuOpen(false)}
                className="text-[15px] font-semibold text-[#000000] py-1 border-b border-[rgba(0,0,0,0.05)]"
              >
                Verified Stock Inventory
              </a>
              <a
                href="#specifications"
                onClick={() => setMobileMenuOpen(false)}
                className="text-[15px] font-semibold text-[#000000] py-1 border-b border-[rgba(0,0,0,0.05)]"
              >
                Technical Specifications
              </a>
              <a
                href="#about"
                onClick={() => setMobileMenuOpen(false)}
                className="text-[15px] font-semibold text-[#000000] py-1"
              >
                About ZamSolar (Director Manish Sharma)
              </a>
            </div>

            <div className="pt-2 flex flex-col gap-2.5">
              <a
                href="https://wa.me/260977667075"
                target="_blank"
                rel="noopener noreferrer"
                className="zoah-btn-secondary w-full"
              >
                <WhatsAppIcon className="w-4 h-4 text-[#25D366]" />
                <span>Samson M. (+260 977 667 075)</span>
              </a>
              <a
                href="#estimator"
                onClick={() => setMobileMenuOpen(false)}
                className="zoah-btn-pill w-full"
              >
                Start Sizing Now
              </a>
            </div>
          </div>
        )}
      </header>
    </>
  )
}

// ─── Hero Section with Parallax Cursors ───────────────────────────────────────
function HeroSection({ scrollY }) {
  return (
    <section className="relative overflow-hidden pt-12 md:pt-20 lg:pt-28 pb-16 md:pb-24 border-b border-[rgba(0,0,0,0.08)]">
      {/* Zoah Electric Blue / Violet Mesh Aura with subtle scale on scroll */}
      <div
        className="zoah-aura"
        style={{
          transform: `scale(${Math.max(0.85, 1 - scrollY * 0.0003)}) translate3d(0, ${(scrollY * 0.1).toFixed(1)}px, 0)`,
          opacity: Math.max(0.3, 1 - scrollY * 0.0015),
        }}
      />

      {/* Floating Collaborative Cursors with dynamic parallax responding to scroll */}
      <ZoahCursor
        color="#3b76ff"
        label="Samson M. (Lead Engineer)"
        className="top-24 right-[12%] lg:right-[18%]"
        parallaxFactor={-0.12}
        scrollY={scrollY}
      />
      <ZoahCursor
        color="#7d20ff"
        label="Manish Sharma (Director)"
        className="top-48 left-[4%] lg:left-[8%]"
        parallaxFactor={0.16}
        scrollY={scrollY}
      />
      <ZoahCursor
        color="#00c295"
        label="Woodlands, Lusaka Depot"
        className="bottom-16 right-[8%] lg:right-[14%]"
        parallaxFactor={-0.08}
        scrollY={scrollY}
      />

      <div className="zoah-wrap relative z-10 text-center max-w-4xl mx-auto zoah-reveal is-revealed">
        {/* Display Headline */}
        <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-semibold tracking-[-0.035em] text-[#000000] leading-[1.06] mb-6">
          Intelligent Solar Sizing.<br className="hidden sm:inline" />
          <span className="text-[rgba(0,0,0,0.75)]">Built for Zambia.</span>
        </h1>

        <p className="text-[16px] sm:text-[18px] md:text-[20px] text-[rgba(0,0,0,0.65)] font-normal leading-relaxed mb-10 max-w-2xl mx-auto">
          Calculate your exact inverter, battery, and panel requirements. Eliminate load shedding across homes and commercial enterprises with deterministic engineering.
        </p>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5">
          <a href="#estimator" className="zoah-btn-pill text-[15px] px-7 py-3.5 w-full sm:w-auto">
            <span>Start Sizing Engine</span>
            <ArrowRightIcon className="w-4 h-4" />
          </a>
          <a
            href="https://wa.me/260977667075"
            target="_blank"
            rel="noopener noreferrer"
            className="zoah-btn-secondary text-[15px] px-7 py-3.5 w-full sm:w-auto"
          >
            <WhatsAppIcon className="w-4 h-4 text-[#25D366]" />
            <span>WhatsApp Samson M.</span>
          </a>
        </div>

        {/* Connected Metric Strip */}
        <div className="mt-14 md:mt-20 zoah-card p-0 overflow-hidden divide-y md:divide-y-0 md:divide-x divide-[rgba(0,0,0,0.08)] grid grid-cols-2 md:grid-cols-4 text-left zoah-reveal delay-100 is-revealed">
          <div className="p-5 md:p-6 hover:bg-[rgba(0,0,0,0.015)] transition-colors">
            <div className="text-2xl sm:text-3xl font-semibold tracking-tight text-[#000000]">250+</div>
            <div className="text-[12px] text-[rgba(0,0,0,0.6)] mt-1 font-medium">Installations in Zambia</div>
          </div>
          <div className="p-5 md:p-6 hover:bg-[rgba(0,0,0,0.015)] transition-colors">
            <div className="text-2xl sm:text-3xl font-semibold tracking-tight text-[#000000]">3–5 yrs</div>
            <div className="text-[12px] text-[rgba(0,0,0,0.6)] mt-1 font-medium">Average ROI Payback</div>
          </div>
          <div className="p-5 md:p-6 hover:bg-[rgba(0,0,0,0.015)] transition-colors">
            <div className="text-2xl sm:text-3xl font-semibold tracking-tight text-[#000000]">25 yrs</div>
            <div className="text-[12px] text-[rgba(0,0,0,0.6)] mt-1 font-medium">Tier-1 Panel Warranty</div>
          </div>
          <div className="p-5 md:p-6 hover:bg-[rgba(0,0,0,0.015)] transition-colors">
            <div className="text-2xl sm:text-3xl font-semibold tracking-tight text-[#000000]">&lt; 2 hrs</div>
            <div className="text-[12px] text-[rgba(0,0,0,0.6)] mt-1 font-medium">Engineering Response</div>
          </div>
        </div>
      </div>
    </section>
  )
}

// ─── The Estimator (Zoah Interactive Component Canvas) ────────────────────────
function EstimatorSection() {
  const [mode, setMode] = useState("Residential")
  const [rooms, setRooms] = useState(4)
  const [geysers, setGeysers] = useState(1)
  const [pumps, setPumps] = useState(1)
  const [acUnits, setAcUnits] = useState(0)
  const [freezers, setFreezers] = useState(1)
  const [backupHours, setBackupHours] = useState(8)
  const [detailedView, setDetailedView] = useState(false)

  const totalHeavy = geysers + pumps + acUnits + freezers

  const system = useMemo(
    () =>
      calculateSolarSystem({
        mode,
        rooms,
        geysers,
        pumps,
        acUnits,
        freezers,
        backupHours,
      }),
    [mode, rooms, geysers, pumps, acUnits, freezers, backupHours]
  )

  const handleWhatsAppQuote = () => {
    const url = generateWhatsAppLink({
      mode,
      rooms,
      geysers,
      pumps,
      acUnits,
      freezers,
      backupHours,
      system,
    })
    window.open(url, "_blank", "noopener,noreferrer")
  }

  return (
    <section id="estimator" className="py-16 md:py-24 border-b border-[rgba(0,0,0,0.08)] bg-[#efefec]/40">
      <div className="zoah-wrap">
        <div className="mb-10 md:mb-12 zoah-reveal">
          <p className="text-[12px] font-semibold text-[rgba(0,0,0,0.5)] tracking-widest uppercase mb-2">
            Deterministic Sizing
          </p>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-semibold tracking-[-0.03em] text-[#000000]">
            The Solar Architecture Engine.
          </h2>
          <p className="text-[14px] sm:text-[15px] text-[rgba(0,0,0,0.6)] mt-2 max-w-xl">
            Compose your system directly on the canvas. Real-time inverter, battery storage, and photovoltaic sizing.
          </p>
        </div>

        {/* Viewport responsive grid: 12 cols desktop, 1 col mobile/tablet */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
          {/* ─── Left Canvas: Inputs (7 Cols on Desktop) ─── */}
          <div className="lg:col-span-7 zoah-card p-6 md:p-8 space-y-6 zoah-reveal delay-100">
            {/* Mode Toggle with Zoah Segmented Pills */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-[rgba(0,0,0,0.08)]">
              <div>
                <h3 className="text-[15px] font-semibold text-[#000000]">Load Sizing Tokens</h3>
                <p className="text-[12px] text-[rgba(0,0,0,0.5)]">Select category and base capacity</p>
              </div>

              <div className="zoah-segmented">
                <button
                  type="button"
                  className={mode === "Residential" ? "active" : ""}
                  onClick={() => {
                    setMode("Residential")
                    if (rooms > 12) setRooms(4)
                  }}
                >
                  Residential
                </button>
                <button
                  type="button"
                  className={mode === "Commercial" ? "active" : ""}
                  onClick={() => {
                    setMode("Commercial")
                    if (rooms < 6) setRooms(8)
                  }}
                >
                  Commercial
                </button>
              </div>
            </div>

            {/* Room / Unit Count */}
            <div>
              <ZoahCounter
                label={mode === "Residential" ? "Total Rooms / Living Spaces" : "Office Workstations / Sections"}
                value={rooms}
                onChange={setRooms}
                min={1}
                max={40}
                note={mode === "Residential" ? "~350W base per room" : "~650W base per section"}
              />

              {/* Quick Presets */}
              <div className="flex items-center gap-1.5 mt-2.5">
                <span className="text-[11px] text-[rgba(0,0,0,0.4)] mr-1">Presets:</span>
                {(mode === "Residential" ? [2, 4, 6, 8, 12] : [4, 8, 12, 16, 24]).map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setRooms(val)}
                    className={cn(
                      "text-[11px] font-medium px-2.5 py-0.5 rounded-full border transition-all",
                      rooms === val
                        ? "bg-[#000000] text-[#ffffff] border-[#000000]"
                        : "bg-[#ffffff] text-[rgba(0,0,0,0.65)] border-[rgba(0,0,0,0.12)] hover:border-[#000000]"
                    )}
                  >
                    {val}
                  </button>
                ))}
              </div>
            </div>

            {/* Heavy Appliances */}
            <div className="pt-2 border-t border-[rgba(0,0,0,0.06)]">
              <div className="flex items-center justify-between mb-2">
                <label className="text-[12px] font-medium text-[rgba(0,0,0,0.65)] tracking-tight uppercase">
                  Heavy Inductive Loads
                </label>
                <button
                  type="button"
                  onClick={() => setDetailedView(!detailedView)}
                  className="text-[11px] font-semibold text-[#3b76ff] hover:underline"
                >
                  {detailedView ? "Simple View" : "Detailed Breakdown"}
                </button>
              </div>

              {!detailedView ? (
                <div className="flex items-center gap-2.5 border border-[rgba(0,0,0,0.12)] rounded-xl p-2 bg-[#ffffff] shadow-xs">
                  <button
                    type="button"
                    className="zoah-counter-btn"
                    onClick={() => {
                      if (totalHeavy > 0) {
                        if (freezers > 0) setFreezers(freezers - 1)
                        else if (acUnits > 0) setAcUnits(acUnits - 1)
                        else if (pumps > 0) setPumps(pumps - 1)
                        else if (geysers > 0) setGeysers(geysers - 1)
                      }
                    }}
                    disabled={totalHeavy <= 0}
                  >
                    –
                  </button>
                  <div className="flex-1 text-center">
                    <span className="text-[15px] font-semibold text-[#000000] tabular-nums">
                      {totalHeavy} Connected Appliances
                    </span>
                    <p className="text-[11px] text-[rgba(0,0,0,0.5)]">
                      {geysers} Geyser, {pumps} Pump, {acUnits} AC, {freezers} Fridge
                    </p>
                  </div>
                  <button
                    type="button"
                    className="zoah-counter-btn"
                    onClick={() => setGeysers(geysers + 1)}
                  >
                    +
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-[rgba(0,0,0,0.02)] p-4 rounded-xl border border-[rgba(0,0,0,0.08)]">
                  <ZoahCounter
                    label="Water Geysers"
                    value={geysers}
                    onChange={setGeysers}
                    min={0}
                    max={6}
                    note="2.0 kW each"
                  />
                  <ZoahCounter
                    label="Borehole Pumps"
                    value={pumps}
                    onChange={setPumps}
                    min={0}
                    max={5}
                    note="1.5 kW each"
                  />
                  <ZoahCounter
                    label="Air Conditioners"
                    value={acUnits}
                    onChange={setAcUnits}
                    min={0}
                    max={8}
                    note="1.8 kW each"
                  />
                  <ZoahCounter
                    label="Deep Freezers"
                    value={freezers}
                    onChange={setFreezers}
                    min={0}
                    max={6}
                    note="0.4 kW each"
                  />
                </div>
              )}
            </div>

            {/* Desired Backup Duration */}
            <div className="pt-2 border-t border-[rgba(0,0,0,0.06)]">
              <div className="flex items-center justify-between mb-2">
                <label className="text-[12px] font-medium text-[rgba(0,0,0,0.65)] tracking-tight uppercase">
                  Outage Duration Buffer
                </label>
                <span className="text-[12px] font-semibold text-[#000000]">
                  {backupHours} Hours Backup
                </span>
              </div>

              <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
                {[4, 6, 8, 12, 16, 24].map((hours) => (
                  <button
                    key={hours}
                    type="button"
                    onClick={() => setBackupHours(hours)}
                    className={cn(
                      "py-2 px-2 text-center text-[12px] font-medium rounded-lg border transition-all",
                      backupHours === hours
                        ? "bg-[#000000] text-[#ffffff] border-[#000000] shadow-xs"
                        : "bg-[#ffffff] text-[rgba(0,0,0,0.65)] border-[rgba(0,0,0,0.12)] hover:border-[#000000]"
                    )}
                  >
                    {hours}h
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-3 border-t border-[rgba(0,0,0,0.08)]">
              <p className="text-[11px] text-[rgba(0,0,0,0.45)] leading-relaxed">
                Calibration profile: Lusaka Global Horizontal Irradiance (~5.5 PSH) with 230V/400V 50Hz single & three-phase safety margins.
              </p>
            </div>
          </div>

          {/* ─── Right Canvas: Live Sizing Output (5 Cols on Desktop) ─── */}
          <div className="lg:col-span-5 zoah-card p-6 md:p-8 flex flex-col justify-between lg:sticky lg:top-24 border-2 border-[rgba(0,0,0,0.12)] bg-[#ffffff] zoah-reveal delay-200">
            <div>
              <div className="flex items-center justify-between pb-4 mb-5 border-b border-[rgba(0,0,0,0.08)]">
                <div>
                  <h3 className="text-[15px] font-semibold text-[#000000]">Live Hardware Output</h3>
                  <p className="text-[12px] text-[rgba(0,0,0,0.5)]">Tier-1 Engineered Package</p>
                </div>
                <div className="flex items-center gap-1.5 bg-[#00c295]/10 border border-[#00c295]/20 text-[#00c295] px-2.5 py-1 rounded-full text-[11px] font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#00c295]" />
                  <span>Compiled</span>
                </div>
              </div>

              {/* Zoah 4-Tile Stat Matrix */}
              <div className="grid grid-cols-2 gap-3 mb-5">
                <div className="p-4 rounded-xl bg-[#f6f6f5] border border-[rgba(0,0,0,0.06)] hover:border-[rgba(0,0,0,0.15)] transition-colors">
                  <div className="text-[11px] font-medium text-[rgba(0,0,0,0.5)] uppercase tracking-wide mb-1">
                    Inverter Capacity
                  </div>
                  <div className="text-2xl font-semibold text-[#000000] tracking-tight tabular-nums">
                    {system.inverterKva} <span className="text-xs font-normal text-[rgba(0,0,0,0.5)]">kVA</span>
                  </div>
                  <div className="text-[10px] text-[#3b76ff] font-medium mt-0.5">Pure Sine Wave Hybrid</div>
                </div>

                <div className="p-4 rounded-xl bg-[#f6f6f5] border border-[rgba(0,0,0,0.06)] hover:border-[rgba(0,0,0,0.15)] transition-colors">
                  <div className="text-[11px] font-medium text-[rgba(0,0,0,0.5)] uppercase tracking-wide mb-1">
                    Battery Storage
                  </div>
                  <div className="text-2xl font-semibold text-[#000000] tracking-tight tabular-nums">
                    {system.batteryKwh} <span className="text-xs font-normal text-[rgba(0,0,0,0.5)]">kWh</span>
                  </div>
                  <div className="text-[10px] text-[#7d20ff] font-medium mt-0.5">LiFePO4 85% DoD</div>
                </div>

                <div className="p-4 rounded-xl bg-[#f6f6f5] border border-[rgba(0,0,0,0.06)] hover:border-[rgba(0,0,0,0.15)] transition-colors">
                  <div className="text-[11px] font-medium text-[rgba(0,0,0,0.5)] uppercase tracking-wide mb-1">
                    Solar PV Array
                  </div>
                  <div className="text-2xl font-semibold text-[#000000] tracking-tight tabular-nums">
                    {system.panelsCount} <span className="text-xs font-normal text-[rgba(0,0,0,0.5)]">Panels</span>
                  </div>
                  <div className="text-[10px] text-[rgba(0,0,0,0.5)] font-medium mt-0.5">{system.totalPvKwp} kWp Tier-1</div>
                </div>

                <div className="p-4 rounded-xl bg-[#f6f6f5] border border-[rgba(0,0,0,0.06)] hover:border-[rgba(0,0,0,0.15)] transition-colors">
                  <div className="text-[11px] font-medium text-[rgba(0,0,0,0.5)] uppercase tracking-wide mb-1">
                    Daily Generation
                  </div>
                  <div className="text-2xl font-semibold text-[#000000] tracking-tight tabular-nums">
                    ~{system.dailyYieldKwh} <span className="text-xs font-normal text-[rgba(0,0,0,0.5)]">kWh</span>
                  </div>
                  <div className="text-[10px] text-[rgba(0,0,0,0.5)] font-medium mt-0.5">Peak Load: {system.totalPeakKw} kW</div>
                </div>
              </div>

              {/* Zoah Line-Item Specification Ledger */}
              <div className="bg-[#f6f6f5] rounded-xl p-4 border border-[rgba(0,0,0,0.06)] mb-6 text-[12px] space-y-2.5">
                <div className="text-[11px] font-semibold text-[#000000] uppercase tracking-wider mb-1">
                  Bill of Materials (BOM):
                </div>
                <div className="flex items-center justify-between text-[rgba(0,0,0,0.65)] border-b border-[rgba(0,0,0,0.06)] pb-1.5">
                  <span>Hybrid Inverter</span>
                  <span className="font-semibold text-[#000000]">{system.inverterKva} kVA MPPT Dual-Source</span>
                </div>
                <div className="flex items-center justify-between text-[rgba(0,0,0,0.65)] border-b border-[rgba(0,0,0,0.06)] pb-1.5">
                  <span>Lithium Storage</span>
                  <span className="font-semibold text-[#000000]">{system.batteryKwh} kWh LiFePO4 Smart BMS</span>
                </div>
                <div className="flex items-center justify-between text-[rgba(0,0,0,0.65)] border-b border-[rgba(0,0,0,0.06)] pb-1.5">
                  <span>Solar PV Modules</span>
                  <span className="font-semibold text-[#000000]">{system.panelsCount} × 450W Monocrystalline</span>
                </div>
                <div className="flex items-center justify-between text-[rgba(0,0,0,0.65)]">
                  <span>Balance of System</span>
                  <span className="font-semibold text-[#000000]">ZEMA & ERB Certified Isolators</span>
                </div>
              </div>
            </div>

            {/* Zoah Black Pill CTA Button */}
            <div className="space-y-2">
              <button
                type="button"
                onClick={handleWhatsAppQuote}
                className="zoah-btn-pill w-full py-4 text-[14px]"
              >
                <WhatsAppIcon className="w-4 h-4 text-[#25D366]" />
                <span>Request Official Quote</span>
              </button>
              <p className="text-[11px] text-center text-[rgba(0,0,0,0.45)]">
                Sends formatted bill of materials to <strong className="text-[#000000]">Samson M.</strong> via WhatsApp
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

// ─── Verified Manufacturer Marquee (Zoah Social Proof Rail) ───────────────────
function ManufacturerMarquee() {
  const brands = [
    "Deye Inverters",
    "Growatt Solar",
    "Jinko Solar Tier-1",
    "Victron Energy",
    "Pylontech Lithium",
    "Canadian Solar",
    "Huawei FusionSolar",
    "JA Solar",
  ]

  return (
    <div className="py-8 border-b border-[rgba(0,0,0,0.08)] bg-[#ffffff] overflow-hidden">
      <div className="zoah-wrap text-center mb-4">
        <p className="text-[12px] font-semibold text-[rgba(0,0,0,0.45)] uppercase tracking-widest">
          Verified Tier-1 Hardware Brands Deployed By ZamSolar
        </p>
      </div>

      <div className="marquee-rail flex items-center gap-10">
        {[...brands, ...brands].map((brand, i) => (
          <div
            key={i}
            className="flex items-center gap-2.5 px-4 py-2 rounded-full border border-[rgba(0,0,0,0.08)] bg-[#f6f6f5] flex-shrink-0"
          >
            <span className="w-2 h-2 rounded-full bg-[#3b76ff]" />
            <span className="text-[13px] font-semibold text-[#000000] tracking-tight whitespace-nowrap">
              {brand}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Verified Real Stock Inventory (Authentic Facebook Media) ────────────────
const REAL_INVENTORY = [
  {
    category: "Tier-1 Monocrystalline Panels",
    title: "450W–550W Half-Cut High-Efficiency Modules",
    spec: "450W – 550W",
    warranty: "25-Year Linear Performance Warranty",
    desc: "Anti-PID and multi-busbar technology built to withstand intense Zambian solar irradiance and ambient temperatures with minimal degradation.",
    img: "/images/zamsolar_panel_facebook.jpg",
    alt: "Authentic Zambezi Amigo Solar Energies Tier-1 monocrystalline solar PV modules from Facebook",
  },
  {
    category: "Pure Sine Wave Inverters",
    title: "3 kVA – 30 kVA Hybrid Multi-Source Inverter Systems",
    spec: "3 – 30 kVA",
    warranty: "5-Year Full Replacement Warranty",
    desc: "Integrated dual MPPT solar charge controllers with instantaneous grid-to-battery transfer (<10ms). Compatible with lithium and AGM battery chemistry.",
    img: "/images/zamsolar_inverter_facebook.jpg",
    alt: "Authentic ZamSolar Luxpower 5kW pure sine wave hybrid inverter in stock from Facebook",
  },
  {
    category: "Lithium Energy Storage",
    title: "5.12 kWh – 51.2 kWh LiFePO4 Server Rack & Wall-Mount Banks",
    spec: "5.12 – 51.2 kWh",
    warranty: "6,000+ Cycles at 80% DoD",
    desc: "Lithium Iron Phosphate chemistry with integrated intelligent Battery Management System (BMS). Stackable, zero-maintenance design with CAN/RS485 inverter telemetry.",
    img: "/images/zamsolar_battery_facebook.jpg",
    alt: "Authentic ZamSolar Dyness LiFePO4 lithium energy storage battery bank from Facebook",
  },
  {
    category: "Agricultural & Borehole Pumping",
    title: "Solar-Powered Submersible Water Pumping Systems",
    spec: "0.75 – 7.5 kW",
    warranty: "3-Year Commercial Warranty",
    desc: "Direct solar DC and AC pump controllers for deep borehole water abstraction, livestock watering, and commercial center-pivot or drip irrigation across Zambia.",
    img: "/images/zamsolar_pump_facebook.jpg",
    alt: "Authentic ZamSolar solar-powered submersible borehole pumping systems from Facebook",
  },
]

function InventorySection() {
  return (
    <section id="inventory" className="py-16 md:py-24 border-b border-[rgba(0,0,0,0.08)] bg-[#ffffff]">
      <div className="zoah-wrap">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-12 zoah-reveal">
          <div>
            <p className="text-[12px] font-semibold text-[rgba(0,0,0,0.5)] tracking-widest uppercase mb-2">
              Verified Stock
            </p>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-semibold tracking-[-0.03em] text-[#000000]">
              Hardware in Stock.
            </h2>
          </div>
          <p className="text-[14px] text-[rgba(0,0,0,0.6)] max-w-sm leading-relaxed">
            All equipment imported directly from verified Tier-1 manufacturers. In stock at our Woodlands, Lusaka depot.
          </p>
        </div>

        {/* 2-column wide layout on desktop, 1-column on mobile */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
          {REAL_INVENTORY.map((item, index) => (
            <div
              key={item.title}
              className={cn(
                "zoah-card group flex flex-col justify-between overflow-hidden zoah-reveal",
                index % 2 === 1 ? "delay-200" : "delay-100"
              )}
            >
              <div>
                <div className="aspect-[16/10] overflow-hidden bg-[#f6f6f5] relative">
                  <img
                    src={item.img}
                    alt={item.alt}
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-104 transition-transform duration-500"
                  />
                  <span className="absolute top-3 left-3 bg-[#ffffff]/90 backdrop-blur-md text-[#000000] text-[11px] font-semibold px-2.5 py-1 rounded-full border border-[rgba(0,0,0,0.08)]">
                    {item.spec}
                  </span>
                </div>

                <div className="p-6 md:p-7">
                  <div className="text-[11px] font-semibold text-[#3b76ff] uppercase tracking-wider mb-1.5">
                    {item.category}
                  </div>
                  <h3 className="text-[17px] font-semibold text-[#000000] tracking-tight mb-2.5">
                    {item.title}
                  </h3>
                  <p className="text-[13.5px] text-[rgba(0,0,0,0.6)] leading-relaxed mb-4">
                    {item.desc}
                  </p>
                </div>
              </div>

              <div className="px-6 md:px-7 pb-6 pt-0 flex items-center justify-between border-t border-[rgba(0,0,0,0.05)]">
                <span className="text-[12px] text-[#00c295] font-semibold flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#00c295]" />
                  {item.warranty}
                </span>
                <a
                  href="#estimator"
                  className="text-[13px] font-semibold text-[#000000] hover:text-[#3b76ff] transition-colors inline-flex items-center gap-1"
                >
                  Size This <ArrowRightIcon className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── Technical Specifications Table ───────────────────────────────────────────
function SpecificationsSection() {
  const specs = [
    {
      feature: "Solar Inverter Topologies",
      residential: "Hybrid 3.5kVA – 8kVA Pure Sine Wave",
      commercial: "Three-Phase 10kVA – 30kVA Industrial SCADA",
    },
    {
      feature: "Battery Life & Chemistry",
      residential: "Lithium Iron Phosphate (LiFePO4) 6,000 Cycles",
      commercial: "High-Voltage Stackable LiFePO4 Rack Units",
    },
    {
      feature: "Grid Switchover Time",
      residential: "< 10 milliseconds (Zero computer reboots)",
      commercial: "< 8 milliseconds (Industrial UPS standard)",
    },
    {
      feature: "Solar PV Photovoltaic Efficiency",
      residential: "21.3% Monocrystalline Half-Cut Cells",
      commercial: "22.5% Dual-Glass Bifacial High Irradiance",
    },
    {
      feature: "Monitoring & Telemetry",
      residential: "Wi-Fi Mobile App (Live Solar & Battery Status)",
      commercial: "Cloud SCADA / RS485 Real-Time Fleet Telemetry",
    },
    {
      feature: "Zambian Standards & Safety",
      residential: "ZEMA Compliant · DC Surge Suppression",
      commercial: "ERB Certified Industrial Interconnection",
    },
  ]

  return (
    <section id="specifications" className="py-16 md:py-24 border-b border-[rgba(0,0,0,0.08)] bg-[#f6f6f5]">
      <div className="zoah-wrap">
        <div className="mb-10 zoah-reveal">
          <p className="text-[12px] font-semibold text-[rgba(0,0,0,0.5)] tracking-widest uppercase mb-2">
            Engineering Rigor
          </p>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-semibold tracking-[-0.03em] text-[#000000]">
            Technical Comparison.
          </h2>
        </div>

        <div className="zoah-card overflow-hidden zoah-reveal delay-100">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[13.5px] border-collapse">
              <thead>
                <tr className="border-b border-[rgba(0,0,0,0.08)] bg-[#efefec]/60">
                  <th className="py-4 px-6 font-semibold text-[#000000] text-[12px] uppercase tracking-wider">
                    Specification
                  </th>
                  <th className="py-4 px-6 font-semibold text-[#000000] text-[12px] uppercase tracking-wider">
                    Residential Package
                  </th>
                  <th className="py-4 px-6 font-semibold text-[#000000] text-[12px] uppercase tracking-wider">
                    Commercial / Industrial
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[rgba(0,0,0,0.06)]">
                {specs.map((row) => (
                  <tr key={row.feature} className="hover:bg-[rgba(0,0,0,0.02)] transition-colors">
                    <td className="py-4 px-6 font-medium text-[#000000] whitespace-nowrap">
                      {row.feature}
                    </td>
                    <td className="py-4 px-6 text-[rgba(0,0,0,0.65)]">
                      {row.residential}
                    </td>
                    <td className="py-4 px-6 text-[rgba(0,0,0,0.65)]">
                      {row.commercial}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  )
}

// ─── Authority & Woodlands Lusaka HQ (Manish Sharma) ──────────────────────────
function AuthoritySection() {
  return (
    <section id="about" className="py-16 md:py-24 border-b border-[rgba(0,0,0,0.08)] bg-[#ffffff]">
      <div className="zoah-wrap">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-center">
          <div className="lg:col-span-7 space-y-6 zoah-reveal">
            <div>
              <p className="text-[12px] font-semibold text-[rgba(0,0,0,0.5)] tracking-widest uppercase mb-2">
                Executive Leadership
              </p>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-semibold tracking-[-0.03em] text-[#000000]">
                Engineered for reliability.<br />
                Rooted in Woodlands, Lusaka.
              </h2>
            </div>

            <p className="text-[15px] text-[rgba(0,0,0,0.65)] leading-relaxed">
              <strong>Zambezi Amigo Solar Energies Ltd (ZamSolar)</strong> operates under the direct leadership of Director <strong className="text-[#000000]">Manish Sharma</strong>. Combining heavy electrical systems engineering with tailored photovoltaic design, ZamSolar solves the distinct challenges of load shedding and severe grid voltage sags across Zambia.
            </p>

            <p className="text-[15px] text-[rgba(0,0,0,0.65)] leading-relaxed">
              Field operations and client engineering are managed by <strong className="text-[#000000]">Samson M.</strong>, guaranteeing that all equipment is installed to strict ZEMA safety criteria with integrated lightning arrestors, automated changeover switches, and 24/7 WhatsApp technical support.
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              <div className="border border-[rgba(0,0,0,0.08)] rounded-xl p-3.5 bg-[#f6f6f5] hover:bg-[#efefec] transition-colors">
                <div className="text-[11px] text-[rgba(0,0,0,0.5)] uppercase tracking-wide">Director</div>
                <div className="text-[13px] font-semibold text-[#000000] mt-0.5">Manish Sharma</div>
              </div>
              <div className="border border-[rgba(0,0,0,0.08)] rounded-xl p-3.5 bg-[#f6f6f5] hover:bg-[#efefec] transition-colors">
                <div className="text-[11px] text-[rgba(0,0,0,0.5)] uppercase tracking-wide">Lead Engineer</div>
                <div className="text-[13px] font-semibold text-[#000000] mt-0.5">Samson M.</div>
              </div>
              <div className="border border-[rgba(0,0,0,0.08)] rounded-xl p-3.5 bg-[#f6f6f5] hover:bg-[#efefec] transition-colors">
                <div className="text-[11px] text-[rgba(0,0,0,0.5)] uppercase tracking-wide">Headquarters</div>
                <div className="text-[13px] font-semibold text-[#000000] mt-0.5">Woodlands, Lusaka</div>
              </div>
              <div className="border border-[rgba(0,0,0,0.08)] rounded-xl p-3.5 bg-[#f6f6f5] hover:bg-[#efefec] transition-colors">
                <div className="text-[11px] text-[rgba(0,0,0,0.5)] uppercase tracking-wide">Standards</div>
                <div className="text-[13px] font-semibold text-[#000000] mt-0.5">ZEMA & ERB</div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 relative zoah-reveal delay-200">
            <div className="zoah-card overflow-hidden shadow-sm">
              <img
                src="/images/zamsolar_installation_facebook.jpg"
                alt="Authentic rooftop solar installation in Zambia by ZamSolar from Facebook"
                loading="lazy"
                className="w-full h-80 md:h-96 object-cover"
              />
            </div>
            <div className="mt-3 zoah-card p-4 flex items-center justify-between">
              <div>
                <div className="text-[11px] text-[rgba(0,0,0,0.5)]">Physical Engineering Depot</div>
                <div className="text-[13px] font-semibold text-[#000000]">No. 9, Chindo Road, Woodlands, Lusaka</div>
              </div>
              <a
                href="https://wa.me/260977667075"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[12px] font-semibold text-[#3b76ff] hover:underline"
              >
                Directions
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

// ─── Outro CTA Section (Zoah Style Banner) ────────────────────────────────────
function OutroSection() {
  return (
    <section className="py-16 md:py-24 bg-[#080606] text-white relative overflow-hidden">
      {/* Subtle radial glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(59,118,255,0.2),transparent_70%)] pointer-events-none" />

      <div className="zoah-wrap relative z-10 text-center max-w-3xl mx-auto zoah-reveal">
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-semibold tracking-[-0.03em] mb-4">
          Eliminate load shedding forever.
        </h2>
        <p className="text-[16px] sm:text-[17px] text-[rgba(255,255,255,0.65)] mb-8 leading-relaxed">
          Skip lengthy power cuts and unstable utility voltage. Speak directly with Director Manish Sharma and Samson M. for a verified site audit in Lusaka.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5">
          <a
            href="#estimator"
            className="w-full sm:w-auto bg-white text-[#000000] font-semibold text-[14px] px-8 py-3.5 rounded-full hover:bg-[rgba(255,255,255,0.9)] transition-colors"
          >
            Calculate Sizing
          </a>
          <a
            href="https://wa.me/260977667075?text=Hi%20Samson%2C%20I%20would%20like%20to%20request%20an%20official%20solar%20quote%20from%20ZamSolar."
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto border border-white/20 text-white font-medium text-[14px] px-8 py-3.5 rounded-full hover:bg-white/10 transition-colors flex items-center justify-center gap-2"
          >
            <WhatsAppIcon className="w-4 h-4 text-[#25D366]" />
            <span>WhatsApp Samson M.</span>
          </a>
        </div>
      </div>
    </section>
  )
}

// ─── Footer with Zoah Oversized Brand Lockup ──────────────────────────────────
function Footer() {
  return (
    <footer id="contact" className="bg-[#ffffff] border-t border-[rgba(0,0,0,0.08)] pt-16 pb-10 text-[#000000]">
      <div className="zoah-wrap">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12 pb-14 border-b border-[rgba(0,0,0,0.08)]">
          {/* Column 1: Brand & Facebook */}
          <div className="space-y-4">
            <ZoahStyleZamSolarBrand />
            <p className="text-[13px] text-[rgba(0,0,0,0.6)] leading-relaxed">
              Zambezi Amigo Solar Energies Ltd.<br />
              Tier-1 Solar PV, Inverter, and LiFePO4 Energy Storage Systems.
            </p>
            <div>
              <a
                href="https://www.facebook.com/zamsolarzmltd"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-[13px] font-medium text-[rgba(0,0,0,0.65)] hover:text-[#000000] transition-colors"
              >
                <FacebookIcon className="w-4 h-4 text-[#1877F2]" />
                <span>@zamsolarzmltd</span>
              </a>
            </div>
          </div>

          {/* Column 2: Direct Contact */}
          <div>
            <h4 className="text-[12px] font-semibold text-[#000000] uppercase tracking-wider mb-3">
              Sales Engineering
            </h4>
            <div className="space-y-2 text-[13px]">
              <div>
                <div className="text-[11px] text-[rgba(0,0,0,0.45)]">WhatsApp Lead (Samson M.)</div>
                <a
                  href="https://wa.me/260977667075"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-[#000000] hover:text-[#3b76ff]"
                >
                  +260 977 667 075
                </a>
              </div>
              <div>
                <div className="text-[11px] text-[rgba(0,0,0,0.45)]">Director</div>
                <div className="font-semibold text-[#000000]">Manish Sharma</div>
              </div>
              <div>
                <div className="text-[11px] text-[rgba(0,0,0,0.45)]">Service Hours</div>
                <div className="text-[rgba(0,0,0,0.6)]">Monday – Saturday: 08:00 – 17:30</div>
              </div>
            </div>
          </div>

          {/* Column 3: Headquarters */}
          <div>
            <h4 className="text-[12px] font-semibold text-[#000000] uppercase tracking-wider mb-3">
              Lusaka Depot
            </h4>
            <address className="not-italic text-[13px] text-[rgba(0,0,0,0.6)] leading-relaxed space-y-1">
              <p className="font-semibold text-[#000000]">Zambezi Amigo Solar Energies Ltd</p>
              <p>No. 9, Chindo Road</p>
              <p>Woodlands, Lusaka</p>
              <p>Zambia</p>
            </address>
          </div>

          {/* Column 4: System Solutions */}
          <div>
            <h4 className="text-[12px] font-semibold text-[#000000] uppercase tracking-wider mb-3">
              Engineering Solutions
            </h4>
            <ul className="space-y-2 text-[13px] text-[rgba(0,0,0,0.6)]">
              <li><a href="#estimator" className="hover:text-[#000000] transition-colors">Residential Hybrid Inverters</a></li>
              <li><a href="#estimator" className="hover:text-[#000000] transition-colors">Commercial Three-Phase Power</a></li>
              <li><a href="#inventory" className="hover:text-[#000000] transition-colors">Solar Borehole Water Pumping</a></li>
              <li><a href="#inventory" className="hover:text-[#000000] transition-colors">LiFePO4 Storage Retrofits</a></li>
              <li><a href="#specifications" className="hover:text-[#000000] transition-colors">Site Feasibility & Load Profiling</a></li>
            </ul>
          </div>
        </div>

        {/* Legal Strip */}
        <div className="pt-6 pb-12 flex flex-col sm:flex-row items-center justify-between gap-3 text-[12px] text-[rgba(0,0,0,0.45)]">
          <p>© {new Date().getFullYear()} Zambezi Amigo Solar Energies Ltd. All rights reserved.</p>
          <p>Woodlands, Lusaka · Director: Manish Sharma · Sales WhatsApp: +260 977 667 075</p>
        </div>

        {/* Oversized Zoah-Style Bottom Brand Lockup */}
        <div className="pt-4 border-t border-[rgba(0,0,0,0.06)] flex justify-center items-center opacity-85 select-none zoah-reveal" aria-hidden="true">
          <div className="text-center">
            <span className="text-[clamp(3rem,11vw,9.5rem)] font-extrabold tracking-tighter leading-none text-[#000000] block">
              ZAMSOLAR
            </span>
          </div>
        </div>
      </div>
    </footer>
  )
}

// ─── Main Application Container with Zoah Scroll Engine ───────────────────────
export default function App() {
  const [scrollY, setScrollY] = useState(0)
  const [scrollDirection, setScrollDirection] = useState("up")
  const [cueVisible, setCueVisible] = useState(false)
  const lastScrollY = useRef(0)
  const idleTimer = useRef(null)

  // Zoah Scroll Engine Hook (Direction, Parallax, Reveal Observer, Scroll Cue)
  useEffect(() => {
    // 1. IntersectionObserver for Zoah reveal animations
    const revealElements = document.querySelectorAll(".zoah-reveal")
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-revealed")
          }
        })
      },
      {
        threshold: 0.12,
        rootMargin: "0px 0px -40px 0px",
      }
    )

    revealElements.forEach((el) => observer.observe(el))

    // 2. Scroll listener for direction, parallax, and idle cue
    const handleScroll = () => {
      const currentScrollY = window.scrollY
      const direction = currentScrollY > lastScrollY.current ? "down" : "up"

      setScrollY(currentScrollY)
      setScrollDirection(direction)
      lastScrollY.current = currentScrollY

      // Reset scroll cue idle timer (hides on active scroll, shows after 1.8s idle)
      setCueVisible(false)
      if (idleTimer.current) clearTimeout(idleTimer.current)

      const isBottom =
        window.innerHeight + currentScrollY >= document.documentElement.scrollHeight - 80

      if (!isBottom && currentScrollY < 1200) {
        idleTimer.current = setTimeout(() => {
          setCueVisible(true)
        }, 1800)
      }
    }

    window.addEventListener("scroll", handleScroll, { passive: true })

    // Arm initial scroll cue after 2s
    idleTimer.current = setTimeout(() => {
      if (window.scrollY < 200) setCueVisible(true)
    }, 2000)

    return () => {
      observer.disconnect()
      window.removeEventListener("scroll", handleScroll)
      if (idleTimer.current) clearTimeout(idleTimer.current)
    }
  }, [])

  return (
    <div className="min-h-screen flex flex-col bg-[#f6f6f5]">
      <SiteHeader scrollDirection={scrollDirection} />
      <main className="flex-1">
        <HeroSection scrollY={scrollY} />
        <EstimatorSection />
        <ManufacturerMarquee />
        <InventorySection />
        <SpecificationsSection />
        <AuthoritySection />
        <OutroSection />
      </main>
      <Footer />
      <ScrollCue visible={cueVisible} />
    </div>
  )
}
