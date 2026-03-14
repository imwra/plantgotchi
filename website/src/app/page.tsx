/* ------------------------------------------------------------------ */
/*  Plantgotchi Marketing Landing Page                                */
/*  React Server Component  |  Tailwind CSS v4  |  No client JS       */
/* ------------------------------------------------------------------ */

/* ========================  PIXEL-ART HELPERS  ===================== */

function PixelPlantHero() {
  return (
    <div className="animate-bounce-plant relative" aria-hidden="true">
      {/* Pot */}
      <div className="mx-auto w-20 h-10 bg-brown relative">
        <div className="absolute -top-1 -left-1 w-22 h-3 bg-brown-light" style={{ width: "calc(100% + 8px)", left: "-4px" }} />
        <div className="absolute bottom-0 left-1 right-1 h-1 bg-brown-light opacity-40" />
      </div>
      {/* Soil */}
      <div className="mx-auto w-20 h-2 bg-brown-light opacity-60 -mt-px" />
      {/* Stem */}
      <div className="mx-auto w-2 h-14 bg-green-dark -mt-2 relative z-10" />
      {/* Leaves – pixel look via box-shadow */}
      <div className="absolute left-1/2 -translate-x-1/2 bottom-[56px]">
        {/* center leaf */}
        <div className="w-10 h-10 bg-green-plant rounded-sm pixel-border mx-auto -mb-2 relative">
          <div className="absolute inset-1 bg-green-light opacity-40 rounded-sm" />
        </div>
        {/* left leaf */}
        <div className="absolute -left-8 top-4 w-8 h-6 bg-green-plant rounded-sm rotate-[-20deg]">
          <div className="absolute inset-1 bg-green-light opacity-30 rounded-sm" />
        </div>
        {/* right leaf */}
        <div className="absolute -right-8 top-4 w-8 h-6 bg-green-plant rounded-sm rotate-[20deg]">
          <div className="absolute inset-1 bg-green-light opacity-30 rounded-sm" />
        </div>
      </div>
      {/* Face */}
      <div className="absolute left-1/2 -translate-x-1/2 bottom-[68px] flex gap-2">
        <div className="w-2 h-2 bg-pixel-black rounded-full" />
        <div className="w-2 h-2 bg-pixel-black rounded-full" />
      </div>
      <div className="absolute left-1/2 -translate-x-1/2 bottom-[62px] w-3 h-1.5 border-b-2 border-pixel-black rounded-b-full" />
    </div>
  );
}

function PixelSensor({ color = "bg-green-plant", label }: { color?: string; label: string }) {
  return (
    <div className="flex flex-col items-center gap-1" aria-label={label}>
      {/* Probe */}
      <div className="w-1.5 h-8 bg-pixel-gray" />
      {/* Body */}
      <div className={`w-8 h-10 ${color} pixel-border relative`}>
        <div className="absolute top-1 left-1 w-2 h-2 bg-green-light rounded-full animate-pulse-glow" />
        <div className="absolute bottom-1 left-1 right-1 h-1 bg-pixel-black opacity-20" />
      </div>
    </div>
  );
}

function PixelCamera() {
  return (
    <div className="flex flex-col items-center gap-1" aria-label="PlantCam sensor">
      <div className="w-12 h-14 bg-pixel-black pixel-border relative">
        {/* lens */}
        <div className="absolute top-2 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full border-2 border-pixel-gray bg-accent-blue opacity-80" />
        {/* indicator */}
        <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-2 h-2 bg-accent-red rounded-full animate-pulse-glow" />
      </div>
    </div>
  );
}

function PixelHub() {
  return (
    <div className="flex flex-col items-center gap-1" aria-label="CamHub Pro">
      <div className="w-16 h-12 bg-green-dark pixel-border relative">
        {/* screen */}
        <div className="absolute top-1.5 left-1.5 right-1.5 h-5 bg-pixel-black rounded-sm">
          <div className="absolute inset-0.5 bg-green-plant opacity-30" />
          <div className="absolute top-1 left-1 w-1 h-1 bg-green-light" />
          <div className="absolute top-1 left-3 w-3 h-0.5 bg-green-light" />
          <div className="absolute top-2.5 left-1 w-5 h-0.5 bg-green-light opacity-60" />
        </div>
        {/* lens */}
        <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full border-2 border-pixel-gray bg-accent-blue opacity-70" />
      </div>
      {/* base */}
      <div className="w-10 h-1.5 bg-green-dark" />
    </div>
  );
}

function StepIcon({ step }: { step: 1 | 2 | 3 }) {
  if (step === 1) {
    return (
      <div className="w-16 h-16 flex items-center justify-center relative">
        {/* soil */}
        <div className="absolute bottom-0 left-0 right-0 h-6 bg-brown rounded-b-lg" />
        {/* sensor going in */}
        <div className="w-2 h-10 bg-green-plant relative z-10 animate-bounce-plant" />
        <div className="absolute top-1 left-1/2 -translate-x-1/2 text-lg">
          <span className="pixel-font text-accent-orange text-[10px]">!</span>
        </div>
      </div>
    );
  }
  if (step === 2) {
    return (
      <div className="w-16 h-16 flex items-center justify-center relative">
        {/* wifi symbol made of bars */}
        <div className="flex flex-col items-center gap-1">
          <div className="w-10 h-1.5 bg-accent-blue rounded-full opacity-40" />
          <div className="w-7 h-1.5 bg-accent-blue rounded-full opacity-60" />
          <div className="w-4 h-1.5 bg-accent-blue rounded-full opacity-80" />
          <div className="w-2 h-2 bg-accent-blue rounded-full animate-pulse-glow" />
        </div>
      </div>
    );
  }
  return (
    <div className="w-16 h-16 flex items-center justify-center relative">
      {/* happy plant face */}
      <div className="w-12 h-12 bg-green-plant pixel-border flex flex-col items-center justify-center gap-1">
        <div className="flex gap-2">
          <div className="w-1.5 h-1.5 bg-pixel-black rounded-full" />
          <div className="w-1.5 h-1.5 bg-pixel-black rounded-full" />
        </div>
        <div className="w-4 h-1.5 border-b-2 border-pixel-black rounded-b-full" />
      </div>
      {/* sparkles */}
      <div className="absolute -top-1 -right-1 text-accent-orange pixel-font text-[8px] animate-pulse-glow">*</div>
      <div className="absolute -bottom-1 -left-1 text-accent-orange pixel-font text-[8px] animate-pulse-glow">*</div>
    </div>
  );
}

function PhoneMockup() {
  return (
    <div className="mx-auto w-56 sm:w-64 relative">
      {/* Phone frame */}
      <div className="border-4 border-pixel-black rounded-2xl bg-cream-dark p-3 relative overflow-hidden scanlines">
        {/* Notch */}
        <div className="mx-auto w-20 h-3 bg-pixel-black rounded-b-lg -mt-1 mb-3" />
        {/* Status bar */}
        <div className="flex justify-between items-center mb-3 px-1">
          <span className="pixel-font text-[6px] text-pixel-gray">9:41</span>
          <span className="pixel-font text-[6px] text-green-plant">Plantgotchi</span>
          <div className="flex gap-0.5">
            <div className="w-2 h-1 bg-green-plant" />
            <div className="w-2 h-1.5 bg-green-plant" />
            <div className="w-2 h-2 bg-green-plant" />
          </div>
        </div>
        {/* Plant avatar */}
        <div className="bg-cream rounded-lg p-3 mb-2 pixel-border">
          <div className="flex items-end justify-center gap-2 mb-2">
            <div className="w-6 h-4 bg-green-plant rounded-sm rotate-[-15deg]" />
            <div className="w-3 h-8 bg-green-dark" />
            <div className="w-6 h-4 bg-green-plant rounded-sm rotate-[15deg]" />
          </div>
          <div className="mx-auto w-8 h-5 bg-brown rounded-sm" />
          {/* Face */}
          <div className="flex justify-center gap-1.5 -mt-6 mb-3">
            <div className="w-1.5 h-1.5 bg-pixel-black rounded-full" />
            <div className="w-1.5 h-1.5 bg-pixel-black rounded-full" />
          </div>
          {/* Name */}
          <p className="pixel-font text-[7px] text-center text-green-dark mt-1">Fern-ando</p>
        </div>
        {/* HP Bar */}
        <div className="mb-2">
          <div className="flex justify-between items-center mb-0.5">
            <span className="pixel-font text-[6px] text-pixel-gray">HP</span>
            <span className="pixel-font text-[6px] text-green-plant">92%</span>
          </div>
          <div className="w-full h-2.5 bg-cream rounded-sm pixel-border">
            <div className="h-full bg-green-plant rounded-sm" style={{ width: "92%" }} />
          </div>
        </div>
        {/* Moisture bar */}
        <div className="mb-2">
          <div className="flex justify-between items-center mb-0.5">
            <span className="pixel-font text-[6px] text-pixel-gray">MOISTURE</span>
            <span className="pixel-font text-[6px] text-accent-blue">67%</span>
          </div>
          <div className="w-full h-2.5 bg-cream rounded-sm pixel-border">
            <div className="h-full bg-accent-blue rounded-sm" style={{ width: "67%" }} />
          </div>
        </div>
        {/* Mini chart */}
        <div className="bg-cream rounded-lg p-2 mb-2 pixel-border">
          <span className="pixel-font text-[5px] text-pixel-gray block mb-1">7-DAY MOISTURE</span>
          <div className="flex items-end gap-0.5 h-6">
            {[60, 55, 70, 65, 45, 80, 67].map((v, i) => (
              <div key={i} className="flex-1 bg-accent-blue rounded-t-sm opacity-70" style={{ height: `${v}%` }} />
            ))}
          </div>
        </div>
        {/* Action buttons */}
        <div className="flex gap-1.5">
          <div className="flex-1 bg-accent-blue text-cream text-center py-1 rounded-sm pixel-font text-[5px]">
            WATER
          </div>
          <div className="flex-1 bg-accent-orange text-cream text-center py-1 rounded-sm pixel-font text-[5px]">
            PHOTO
          </div>
          <div className="flex-1 bg-green-plant text-cream text-center py-1 rounded-sm pixel-font text-[5px]">
            HISTORY
          </div>
        </div>
      </div>
    </div>
  );
}

/* ========================  NAV LINKS  ============================= */

const NAV_LINKS = [
  { label: "How It Works", href: "#how-it-works" },
  { label: "Products", href: "#products" },
  { label: "Pricing", href: "#pricing" },
  { label: "App", href: "#app" },
] as const;

/* ========================  DATA  ================================== */

const PRODUCTS = [
  {
    name: "BLE Child Sensor",
    price: "$9 - $12",
    nickname: "The tiny one",
    specs: ["BLE only", "CR2032 battery", "2-year battery life"],
    color: "bg-green-light",
  },
  {
    name: "Solo Sensor",
    price: "$15 - $19",
    nickname: "The independent one",
    specs: ["WiFi + BLE", "USB-C rechargeable", "OLED screen option"],
    color: "bg-green-plant",
  },
  {
    name: "PlantCam",
    price: "$25 - $29",
    nickname: "The photographer",
    specs: ["5MP camera", "Auto time-lapse", "4-6 month battery"],
    color: "bg-accent-blue",
  },
  {
    name: "PlantCam Pro",
    price: "$69 - $79",
    nickname: "The brain",
    specs: ["AI plant disease detection", "Hub for all sensors", "Raspberry Pi powered"],
    color: "bg-accent-purple",
  },
] as const;

const SETUPS = [
  {
    title: "Hub + Children",
    desc: "Best for plant collectors (5+ plants)",
    detail: "CamHub Pro + BLE sensors",
    icon: "hub",
  },
  {
    title: "Standalone",
    desc: "Perfect for 1-3 plants",
    detail: "WiFi sensors work alone",
    icon: "solo",
  },
  {
    title: "Parent + Children",
    desc: "No hub needed",
    detail: "Parent sensor relays data for children",
    icon: "parent",
  },
] as const;

const BUNDLES = [
  { name: "Starter Kit", price: "$35", contents: "1 Solo Sensor + 1 PlantCam" },
  { name: "Home Garden Kit", price: "$99", contents: "5 BLE Sensors + 1 CamHub Pro" },
  { name: "Plant Parent Kit", price: "$45", contents: "5 BLE Sensors + 1 Solo (parent)" },
  { name: "Sensor 5-Pack", price: "$29", contents: "5 BLE Child Sensors" },
] as const;

const APP_FEATURES = [
  { title: "Real-time monitoring", desc: "Live moisture, light, and temperature data" },
  { title: "Push notifications", desc: "Never forget to water again" },
  { title: "Photo timeline", desc: "Automatic growth time-lapses" },
  { title: "Care history", desc: "Track every action and trend" },
] as const;

/* ========================  PAGE  ================================== */

export default function Home() {
  return (
    <div className="min-h-screen bg-cream text-pixel-black">
      {/* ───────── STICKY NAV ───────── */}
      <nav className="sticky top-0 z-50 bg-cream/90 backdrop-blur-sm border-b-2 border-pixel-black">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <a href="#" className="pixel-font text-green-dark text-xs sm:text-sm tracking-tight">
            Plantgotchi
          </a>
          <div className="hidden sm:flex items-center gap-6">
            {NAV_LINKS.map((l) => (
              <a
                key={l.href}
                href={l.href}
                className="text-sm text-pixel-gray hover:text-green-dark transition-colors"
              >
                {l.label}
              </a>
            ))}
          </div>
          <a
            href="#pricing"
            className="pixel-font text-[8px] sm:text-[10px] bg-green-plant text-cream px-3 py-2 pixel-border hover:bg-green-dark transition-colors"
          >
            Pre-order
          </a>
        </div>
      </nav>

      {/* ───────── HERO ───────── */}
      <section className="relative overflow-hidden">
        <div className="max-w-5xl mx-auto px-4 pt-16 pb-20 sm:pt-24 sm:pb-28 flex flex-col items-center text-center gap-8">
          {/* Pixel plant */}
          <div className="relative h-40 w-40 flex items-end justify-center">
            <PixelPlantHero />
          </div>

          <h1 className="pixel-font text-lg sm:text-2xl md:text-3xl leading-relaxed text-green-dark max-w-3xl">
            Stick it in soil. Connect&nbsp;to&nbsp;WiFi.<br />
            Watch your plants thrive.
          </h1>

          <p className="text-pixel-gray text-base sm:text-lg max-w-xl">
            Smart plant sensors with a Tamagotchi-inspired app experience
          </p>

          <div className="flex flex-col sm:flex-row gap-4">
            <a
              href="#pricing"
              className="pixel-font text-xs bg-green-plant text-cream px-8 py-4 pixel-border hover:bg-green-dark transition-colors"
            >
              Pre-order Now
            </a>
            <a
              href="#how-it-works"
              className="pixel-font text-xs border-2 border-pixel-black text-pixel-black px-8 py-4 hover:bg-cream-dark transition-colors"
            >
              See How It Works
            </a>
          </div>
        </div>

        {/* decorative dots */}
        <div className="absolute top-8 left-8 w-2 h-2 bg-accent-orange rounded-full animate-pulse-glow" />
        <div className="absolute top-20 right-12 w-2 h-2 bg-accent-blue rounded-full animate-pulse-glow" />
        <div className="absolute bottom-12 left-16 w-1.5 h-1.5 bg-accent-purple rounded-full animate-pulse-glow" />
      </section>

      {/* ───────── HOW IT WORKS ───────── */}
      <section id="how-it-works" className="bg-cream-dark py-16 sm:py-24 relative scanlines">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="pixel-font text-sm sm:text-base text-center text-green-dark mb-14">
            How It Works
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-10 sm:gap-6">
            {(
              [
                { step: 1 as const, title: "Stick It In", desc: "Insert the sensor into your plant's soil." },
                { step: 2 as const, title: "Connect", desc: "Connect to WiFi via the Plantgotchi app." },
                { step: 3 as const, title: "Watch It Thrive", desc: "Monitor your plants with Tamagotchi-style animations." },
              ] as const
            ).map((s) => (
              <div key={s.step} className="flex flex-col items-center text-center gap-4">
                <div className="w-20 h-20 bg-cream rounded-lg pixel-border flex items-center justify-center">
                  <StepIcon step={s.step} />
                </div>
                <span className="pixel-font text-[10px] text-accent-orange">STEP {s.step}</span>
                <h3 className="pixel-font text-xs text-pixel-black">{s.title}</h3>
                <p className="text-pixel-gray text-sm max-w-xs">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───────── PRODUCT LINEUP ───────── */}
      <section id="products" className="py-16 sm:py-24">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="pixel-font text-sm sm:text-base text-center text-green-dark mb-4">
            Product Lineup
          </h2>
          <p className="text-center text-pixel-gray mb-14 max-w-lg mx-auto">
            From a tiny soil sensor to a full AI-powered plant hub&nbsp;&mdash; pick what fits your jungle.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {PRODUCTS.map((p, i) => (
              <div
                key={p.name}
                className="bg-cream-dark rounded-lg pixel-border p-6 flex flex-col items-center text-center gap-4 relative overflow-hidden scanlines"
              >
                {/* device art */}
                <div className="h-20 flex items-end justify-center">
                  {i === 0 && <PixelSensor color="bg-green-light" label={p.name} />}
                  {i === 1 && <PixelSensor color="bg-green-plant" label={p.name} />}
                  {i === 2 && <PixelCamera />}
                  {i === 3 && <PixelHub />}
                </div>

                <h3 className="pixel-font text-[10px] text-pixel-black">{p.name}</h3>
                <span className="italic text-pixel-gray text-sm">&ldquo;{p.nickname}&rdquo;</span>
                <span className="pixel-font text-xs text-green-dark">{p.price}</span>

                <ul className="text-sm text-pixel-gray space-y-1 mt-auto">
                  {p.specs.map((s) => (
                    <li key={s} className="flex items-center gap-1.5 justify-center">
                      <span className="w-1.5 h-1.5 bg-green-plant inline-block" />
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───────── ECOSYSTEM / SETUPS ───────── */}
      <section className="bg-cream-dark py-16 sm:py-24 relative scanlines">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="pixel-font text-sm sm:text-base text-center text-green-dark mb-4">
            Setup Configurations
          </h2>
          <p className="text-center text-pixel-gray mb-14 max-w-md mx-auto">
            Mix and match to fit your space.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {SETUPS.map((s) => (
              <div
                key={s.title}
                className="bg-cream rounded-lg pixel-border p-6 flex flex-col items-center text-center gap-4"
              >
                {/* icon cluster */}
                <div className="h-20 flex items-end justify-center gap-2">
                  {s.icon === "hub" && (
                    <>
                      <PixelHub />
                      <div className="flex flex-col gap-1">
                        <PixelSensor color="bg-green-light" label="child sensor" />
                      </div>
                    </>
                  )}
                  {s.icon === "solo" && <PixelSensor color="bg-green-plant" label="solo sensor" />}
                  {s.icon === "parent" && (
                    <>
                      <PixelSensor color="bg-green-plant" label="parent sensor" />
                      <div className="flex flex-col gap-1">
                        <PixelSensor color="bg-green-light" label="child sensor" />
                      </div>
                    </>
                  )}
                </div>

                <h3 className="pixel-font text-[10px] text-pixel-black">{s.title}</h3>
                <p className="text-sm text-pixel-gray">{s.desc}</p>
                <span className="pixel-font text-[8px] text-green-dark bg-cream-dark px-3 py-1 rounded-full">
                  {s.detail}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───────── APP PREVIEW ───────── */}
      <section id="app" className="py-16 sm:py-24">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="pixel-font text-sm sm:text-base text-center text-green-dark mb-4">
            The App
          </h2>
          <p className="text-center text-pixel-gray mb-14 max-w-md mx-auto">
            Your plants, reimagined as pixel pals.
          </p>

          <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
            <PhoneMockup />

            <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-6">
              {APP_FEATURES.map((f) => (
                <div key={f.title} className="bg-cream-dark rounded-lg pixel-border p-5">
                  <h3 className="pixel-font text-[9px] text-pixel-black mb-2">{f.title}</h3>
                  <p className="text-sm text-pixel-gray">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ───────── PRICING / BUNDLES ───────── */}
      <section id="pricing" className="bg-cream-dark py-16 sm:py-24 relative scanlines">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="pixel-font text-sm sm:text-base text-center text-green-dark mb-4">
            Bundles &amp; Pricing
          </h2>
          <p className="text-center text-pixel-gray mb-14 max-w-md mx-auto">
            Save more when you bundle.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {BUNDLES.map((b, i) => (
              <div
                key={b.name}
                className={`bg-cream rounded-lg pixel-border p-6 flex flex-col items-center text-center gap-3 ${
                  i === 1 ? "ring-2 ring-green-plant" : ""
                }`}
              >
                {i === 1 && (
                  <span className="pixel-font text-[7px] bg-green-plant text-cream px-2 py-0.5 -mt-3 mb-1">
                    BEST VALUE
                  </span>
                )}
                <h3 className="pixel-font text-[10px] text-pixel-black">{b.name}</h3>
                <span className="pixel-font text-xl text-green-dark">{b.price}</span>
                <p className="text-sm text-pixel-gray">{b.contents}</p>
                <a
                  href="#"
                  className="mt-auto pixel-font text-[8px] bg-green-plant text-cream px-5 py-2.5 pixel-border hover:bg-green-dark transition-colors"
                >
                  Pre-order
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───────── OPEN SOURCE ───────── */}
      <section className="py-12 sm:py-16">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <div className="bg-cream-dark rounded-lg pixel-border p-8 relative overflow-hidden scanlines">
            <h2 className="pixel-font text-[10px] sm:text-xs text-green-dark mb-4">
              Built on Open-Source Hardware
            </h2>
            <p className="text-sm text-pixel-gray mb-4 max-w-md mx-auto">
              Forked from{" "}
              <a
                href="https://github.com/rbaron/b-parasite"
                target="_blank"
                rel="noopener noreferrer"
                className="text-accent-blue underline hover:text-accent-blue/80"
              >
                b-parasite
              </a>{" "}
              by rbaron. Schematics, firmware, and enclosures are all open.
            </p>
            <div className="inline-flex items-center gap-2 bg-cream px-4 py-2 rounded-full pixel-border">
              <span className="pixel-font text-[7px] text-pixel-gray">LICENSE</span>
              <span className="pixel-font text-[8px] text-green-dark">CC BY-SA 4.0</span>
            </div>
          </div>
        </div>
      </section>

      {/* ───────── FOOTER ───────── */}
      <footer className="bg-pixel-black text-cream py-12">
        <div className="max-w-5xl mx-auto px-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-10">
            {/* Newsletter */}
            <div>
              <h3 className="pixel-font text-[10px] text-green-light mb-4">Stay in the loop</h3>
              <p className="text-sm text-cream/60 mb-4">
                Get updates on launch dates, new sensors, and plant care tips.
              </p>
              <form className="flex gap-2" onSubmit={undefined}>
                <input
                  type="email"
                  placeholder="you@email.com"
                  aria-label="Email address"
                  className="flex-1 bg-pixel-gray/30 text-cream text-sm px-3 py-2 rounded-sm border border-pixel-gray/40 placeholder:text-cream/30 focus:outline-none focus:border-green-plant"
                />
                <button
                  type="submit"
                  className="pixel-font text-[8px] bg-green-plant text-cream px-4 py-2 hover:bg-green-dark transition-colors"
                >
                  Join
                </button>
              </form>
            </div>

            {/* Links */}
            <div className="sm:text-center">
              <h3 className="pixel-font text-[10px] text-green-light mb-4">Links</h3>
              <ul className="space-y-2 text-sm text-cream/60">
                <li><a href="#how-it-works" className="hover:text-cream transition-colors">How It Works</a></li>
                <li><a href="#products" className="hover:text-cream transition-colors">Products</a></li>
                <li><a href="#pricing" className="hover:text-cream transition-colors">Pricing</a></li>
                <li><a href="#app" className="hover:text-cream transition-colors">App</a></li>
              </ul>
            </div>

            {/* Social */}
            <div className="sm:text-right">
              <h3 className="pixel-font text-[10px] text-green-light mb-4">Follow us</h3>
              <div className="flex sm:justify-end gap-4">
                {["GitHub", "Twitter", "Discord"].map((s) => (
                  <a
                    key={s}
                    href="#"
                    className="text-sm text-cream/60 hover:text-cream transition-colors"
                  >
                    {s}
                  </a>
                ))}
              </div>
            </div>
          </div>

          <div className="border-t border-pixel-gray/30 mt-10 pt-6 text-center">
            <p className="pixel-font text-[8px] text-cream/40">
              Made with love for plants &bull; Plantgotchi &copy; 2026
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
