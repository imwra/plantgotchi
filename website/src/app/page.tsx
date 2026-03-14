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

/* ========================  iOS SCREEN MOCKUP  ===================== */

function IOSScreenMockup({ screen, children }: { screen: string; children: React.ReactNode }) {
  return (
    <div className="w-full max-w-[200px] mx-auto">
      <div className="border-[3px] border-pixel-black rounded-[20px] bg-cream-dark p-2.5 relative overflow-hidden">
        {/* Dynamic Island */}
        <div className="mx-auto w-16 h-2.5 bg-pixel-black rounded-full mb-2" />
        {/* Content */}
        <div className="bg-cream rounded-lg overflow-hidden">
          {children}
        </div>
        {/* Home indicator */}
        <div className="mx-auto w-12 h-1 bg-pixel-black/30 rounded-full mt-2" />
      </div>
      <p className="pixel-font text-[7px] text-center text-green-dark mt-2">{screen}</p>
    </div>
  );
}

/* ========================  NAV LINKS  ============================= */

const NAV_LINKS = [
  { label: "How It Works", href: "#how-it-works" },
  { label: "Products", href: "#products" },
  { label: "Garden", href: "#garden" },
  { label: "Pricing", href: "#pricing" },
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

const GARDEN_PLANTS = [
  { name: "Fern-ando", type: "Boston Fern", moisture: 72, light: 45, temp: 22, hp: 92, status: "happy", battery: 85 },
  { name: "Aloe There", type: "Aloe Vera", moisture: 31, light: 78, temp: 24, hp: 68, status: "thirsty", battery: 62 },
  { name: "Leaf Erikson", type: "Monstera", moisture: 58, light: 32, temp: 21, hp: 87, status: "happy", battery: 94 },
  { name: "Cact-Jack", type: "Barrel Cactus", moisture: 15, light: 92, temp: 26, hp: 95, status: "happy", battery: 78 },
  { name: "Herb Alpert", type: "Basil", moisture: 44, light: 55, temp: 23, hp: 73, status: "needs-light", battery: 41 },
  { name: "Ivy League", type: "Pothos", moisture: 63, light: 28, temp: 20, hp: 81, status: "happy", battery: 99 },
] as const;

const IOS_SCREENS = [
  { title: "Garden Overview", desc: "See all your plants at a glance with live status indicators" },
  { title: "Plant Detail", desc: "Deep dive into sensor data, charts, and care history" },
  { title: "Photo Timeline", desc: "Watch your plant grow with automatic time-lapse photos" },
  { title: "Notifications", desc: "Smart alerts when your plants need attention" },
  { title: "Sensor Pairing", desc: "Simple one-tap setup to connect new sensors" },
  { title: "Settings", desc: "Customize thresholds, schedules, and notifications" },
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

      {/* ───────── DIGITAL GARDEN ───────── */}
      <section id="garden" className="bg-cream-dark py-16 sm:py-24 relative scanlines">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="pixel-font text-sm sm:text-base text-center text-green-dark mb-4">
            Your Digital Garden
          </h2>
          <p className="text-center text-pixel-gray mb-14 max-w-lg mx-auto">
            Every plant in your home, monitored in one beautiful dashboard. See who&rsquo;s thriving and who needs a drink.
          </p>

          {/* Desktop screenshot */}
          <div className="mb-10">
            <div className="pixel-font text-[8px] text-center text-pixel-gray mb-3">DESKTOP VIEW</div>
            <div className="rounded-xl overflow-hidden pixel-border shadow-lg">
              <img
                src="/garden-desktop.png"
                alt="Plantgotchi Garden Dashboard - Desktop view showing 6 plants with live sensor data, HP bars, moisture levels, and detail panel"
                className="w-full h-auto block"
              />
            </div>
          </div>

          {/* Mobile + description side by side */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-8 sm:gap-14">
            {/* Mobile screenshot in phone frame */}
            <div className="w-56 sm:w-64 shrink-0">
              <div className="pixel-font text-[8px] text-center text-pixel-gray mb-3">MOBILE VIEW</div>
              <div className="border-4 border-pixel-black rounded-[24px] bg-pixel-black p-1.5 shadow-lg">
                <div className="mx-auto w-20 h-3 bg-pixel-black rounded-b-lg relative z-10" />
                <div className="rounded-[18px] overflow-hidden -mt-1.5">
                  <img
                    src="/garden-mobile.png"
                    alt="Plantgotchi Garden Dashboard - Mobile view with plant cards, HP bars, and moisture indicators"
                    className="w-full h-auto block"
                  />
                </div>
                <div className="mx-auto w-12 h-1 bg-pixel-gray/40 rounded-full mt-1.5" />
              </div>
            </div>

            {/* Description */}
            <div className="max-w-sm text-center sm:text-left">
              <h3 className="pixel-font text-xs text-green-dark mb-3">All your plants, one view</h3>
              <p className="text-sm text-pixel-gray mb-4">
                The garden dashboard shows every plant in your home with live sensor data.
                Tap any plant to see detailed charts, care history, and time-lapse photos.
              </p>
              <div className="space-y-2">
                {[
                  "Segmented HP &amp; moisture bars",
                  "Mini 7-day trend charts per plant",
                  "Live sensor indicators with animations",
                  "Tap-to-expand detail panel with full stats",
                  "Mobile bottom-sheet for plant details",
                ].map((item) => (
                  <div key={item} className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-green-plant shrink-0" />
                    <span className="text-sm text-pixel-gray" dangerouslySetInnerHTML={{ __html: item }} />
                  </div>
                ))}
              </div>

              <a
                href="/garden"
                className="inline-block mt-6 pixel-font text-[8px] bg-green-plant text-cream px-5 py-2.5 pixel-border hover:bg-green-dark transition-colors"
              >
                Try the Live Demo
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ───────── iOS APP SCREENS ───────── */}
      <section id="screens" className="py-16 sm:py-24">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="pixel-font text-sm sm:text-base text-center text-green-dark mb-4">
            Designed for iOS
          </h2>
          <p className="text-center text-pixel-gray mb-14 max-w-lg mx-auto">
            A native app experience crafted for plant lovers. Every screen designed to make plant care feel like play.
          </p>

          {/* Screen showcase - 6 phones in a row */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 sm:gap-6">

            {/* 1: Garden Overview */}
            <IOSScreenMockup screen="Garden">
              <div className="p-2">
                <div className="pixel-font text-[5px] text-green-dark mb-1">My Garden</div>
                <div className="grid grid-cols-2 gap-1">
                  {GARDEN_PLANTS.slice(0, 4).map((p) => (
                    <div key={p.name} className="bg-cream-dark rounded p-1 text-center">
                      <div className="flex items-end justify-center gap-0.5 h-4">
                        <div className="w-1.5 h-1 bg-green-plant rounded-sm rotate-[-15deg]" />
                        <div className="w-0.5 h-3 bg-green-dark" />
                        <div className="w-1.5 h-1 bg-green-plant rounded-sm rotate-[15deg]" />
                      </div>
                      <div className="mx-auto w-2 h-1 bg-brown rounded-sm" />
                      <p className="pixel-font text-[3px] text-green-dark mt-0.5 truncate">{p.name}</p>
                      <div className="w-full h-0.5 bg-cream rounded-sm mt-0.5">
                        <div className="h-full bg-accent-blue rounded-sm" style={{ width: `${p.moisture}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-1 text-center">
                  <span className="pixel-font text-[3px] text-pixel-gray">+2 more plants</span>
                </div>
                {/* Bottom tabs */}
                <div className="flex justify-around mt-2 pt-1 border-t border-pixel-gray/20">
                  {["Garden", "Camera", "Alerts", "More"].map((t, i) => (
                    <span key={t} className={`pixel-font text-[3px] ${i === 0 ? "text-green-dark" : "text-pixel-gray"}`}>{t}</span>
                  ))}
                </div>
              </div>
            </IOSScreenMockup>

            {/* 2: Plant Detail */}
            <IOSScreenMockup screen="Plant Detail">
              <div className="p-2">
                <div className="pixel-font text-[4px] text-accent-blue mb-1">← Back</div>
                <div className="flex items-end justify-center gap-1 h-8 mb-1">
                  <div className="w-3 h-2 bg-green-plant rounded-sm rotate-[-15deg]" />
                  <div className="w-1.5 h-6 bg-green-dark" />
                  <div className="w-3 h-2 bg-green-plant rounded-sm rotate-[15deg]" />
                </div>
                <div className="mx-auto w-4 h-2 bg-brown rounded-sm -mt-0.5" />
                <p className="pixel-font text-[5px] text-center text-green-dark mt-1">Fern-ando</p>
                <p className="text-[4px] text-center text-pixel-gray">Boston Fern</p>
                {/* Stats */}
                <div className="space-y-1 mt-2">
                  {[
                    { label: "MOISTURE", value: "72%", color: "bg-accent-blue", pct: 72 },
                    { label: "LIGHT", value: "45%", color: "bg-accent-orange", pct: 45 },
                    { label: "TEMP", value: "22°C", color: "bg-accent-red", pct: 55 },
                    { label: "HP", value: "92%", color: "bg-green-plant", pct: 92 },
                  ].map((s) => (
                    <div key={s.label}>
                      <div className="flex justify-between">
                        <span className="pixel-font text-[3px] text-pixel-gray">{s.label}</span>
                        <span className="pixel-font text-[3px]">{s.value}</span>
                      </div>
                      <div className="w-full h-1 bg-cream-dark rounded-sm">
                        <div className={`h-full ${s.color} rounded-sm`} style={{ width: `${s.pct}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
                {/* Mini chart */}
                <div className="bg-cream-dark rounded p-1 mt-2">
                  <span className="pixel-font text-[3px] text-pixel-gray">7-DAY MOISTURE</span>
                  <div className="flex items-end gap-px h-4 mt-0.5">
                    {[60, 55, 70, 65, 45, 80, 72].map((v, i) => (
                      <div key={i} className="flex-1 bg-accent-blue rounded-t-sm opacity-70" style={{ height: `${v}%` }} />
                    ))}
                  </div>
                </div>
              </div>
            </IOSScreenMockup>

            {/* 3: Photo Timeline */}
            <IOSScreenMockup screen="Photos">
              <div className="p-2">
                <div className="pixel-font text-[4px] text-accent-blue mb-1">← Back</div>
                <div className="pixel-font text-[5px] text-green-dark mb-1">Photo Timeline</div>
                {/* Photo grid */}
                <div className="space-y-1">
                  {["Today", "3 days ago", "1 week ago", "2 weeks ago"].map((date, i) => (
                    <div key={date}>
                      <span className="pixel-font text-[3px] text-pixel-gray">{date}</span>
                      <div className={`w-full h-8 rounded mt-0.5 ${
                        i === 0 ? "bg-green-plant/30" : i === 1 ? "bg-green-plant/25" : i === 2 ? "bg-green-plant/20" : "bg-green-plant/15"
                      } flex items-center justify-center`}>
                        <div className="flex items-end justify-center gap-0.5">
                          <div className={`w-2 rounded-sm rotate-[-15deg] bg-green-plant`} style={{ height: `${6 + i * 1.5}px` }} />
                          <div className={`w-1 bg-green-dark`} style={{ height: `${12 + i * 2}px` }} />
                          <div className={`w-2 rounded-sm rotate-[15deg] bg-green-plant`} style={{ height: `${6 + i * 1.5}px` }} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-1">
                  <span className="pixel-font text-[3px] text-accent-blue text-center block">▶ Play Time-lapse</span>
                </div>
              </div>
            </IOSScreenMockup>

            {/* 4: Notifications */}
            <IOSScreenMockup screen="Notifications">
              <div className="p-2">
                <div className="pixel-font text-[5px] text-green-dark mb-2">Alerts</div>
                <div className="space-y-1.5">
                  {[
                    { icon: "bg-accent-orange", title: "Aloe There is thirsty!", time: "2m ago", desc: "Moisture at 31%" },
                    { icon: "bg-accent-blue", title: "Herb needs more light", time: "1h ago", desc: "Light level low" },
                    { icon: "bg-green-plant", title: "Fern-ando is thriving!", time: "3h ago", desc: "HP reached 92%" },
                    { icon: "bg-accent-red", title: "Low battery: Herb", time: "5h ago", desc: "Sensor at 41%" },
                    { icon: "bg-accent-blue", title: "New photo captured", time: "1d ago", desc: "PlantCam auto-shot" },
                  ].map((n, i) => (
                    <div key={i} className="flex gap-1.5 items-start bg-cream-dark rounded p-1">
                      <div className={`w-1.5 h-1.5 rounded-full ${n.icon} shrink-0 mt-0.5`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between">
                          <span className="pixel-font text-[3px] text-pixel-black truncate">{n.title}</span>
                          <span className="pixel-font text-[2.5px] text-pixel-gray shrink-0 ml-1">{n.time}</span>
                        </div>
                        <span className="text-[3px] text-pixel-gray">{n.desc}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </IOSScreenMockup>

            {/* 5: Sensor Pairing */}
            <IOSScreenMockup screen="Pair Sensor">
              <div className="p-2">
                <div className="pixel-font text-[5px] text-green-dark mb-2 text-center">Add Sensor</div>
                {/* Scanning animation */}
                <div className="flex justify-center mb-2">
                  <div className="w-12 h-12 rounded-full border-2 border-green-plant/30 flex items-center justify-center relative">
                    <div className="w-8 h-8 rounded-full border-2 border-green-plant/50 flex items-center justify-center">
                      <div className="w-4 h-4 rounded-full bg-green-plant/20 flex items-center justify-center">
                        <div className="w-2 h-2 bg-green-plant rounded-full animate-pulse-glow" />
                      </div>
                    </div>
                  </div>
                </div>
                <p className="pixel-font text-[4px] text-center text-pixel-gray mb-2">Scanning for sensors...</p>
                {/* Found sensors */}
                <div className="space-y-1">
                  {["Plantgotchi-A3F2", "Plantgotchi-B7E1"].map((s, i) => (
                    <div key={s} className="flex items-center gap-1.5 bg-cream-dark rounded p-1.5">
                      <div className={`w-2 h-2 rounded-full ${i === 0 ? "bg-green-plant animate-pulse-glow" : "bg-pixel-gray/30"}`} />
                      <span className="pixel-font text-[3.5px] text-pixel-black flex-1">{s}</span>
                      <span className="pixel-font text-[3px] text-cream bg-green-plant px-1.5 py-0.5 rounded">Pair</span>
                    </div>
                  ))}
                </div>
                <p className="text-[3px] text-pixel-gray text-center mt-2">Place sensor in pairing mode (hold button 3s)</p>
              </div>
            </IOSScreenMockup>

            {/* 6: Settings */}
            <IOSScreenMockup screen="Settings">
              <div className="p-2">
                <div className="pixel-font text-[5px] text-green-dark mb-2">Settings</div>
                <div className="space-y-1">
                  {[
                    { section: "NOTIFICATIONS", items: ["Water reminders", "Low battery alerts", "Daily summary"] },
                    { section: "SENSORS", items: ["Sync interval: 15 min", "LED brightness", "Sleep schedule"] },
                    { section: "ACCOUNT", items: ["Profile", "Export data"] },
                  ].map((group) => (
                    <div key={group.section}>
                      <span className="pixel-font text-[3px] text-pixel-gray">{group.section}</span>
                      <div className="bg-cream-dark rounded mt-0.5">
                        {group.items.map((item, i) => (
                          <div key={item} className={`flex items-center justify-between px-1.5 py-1 ${i < group.items.length - 1 ? "border-b border-cream" : ""}`}>
                            <span className="text-[3.5px] text-pixel-black">{item}</span>
                            <div className="w-4 h-2 bg-green-plant rounded-full relative">
                              <div className="absolute right-0.5 top-0.5 w-1 h-1 bg-white rounded-full" />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </IOSScreenMockup>
          </div>

          {/* Coming to App Store badge */}
          <div className="flex flex-col items-center mt-12 gap-3">
            <div className="bg-pixel-black text-cream rounded-xl px-6 py-3 flex items-center gap-3">
              <div className="flex flex-col items-center">
                <svg className="w-6 h-6 text-cream" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
                </svg>
              </div>
              <div>
                <span className="pixel-font text-[6px] text-cream/60 block">Coming 2026</span>
                <span className="pixel-font text-[9px] text-cream">Download on the App Store</span>
              </div>
            </div>
            <p className="text-xs text-pixel-gray">Native iOS app. Built with SwiftUI.</p>
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
