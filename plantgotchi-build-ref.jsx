import { useState, useEffect } from "react";

const P = `"Press Start 2P", monospace`;
const C = {
  bg: "#f0ead6", card: "#fffdf5", border: "#e0d5b8", borderDark: "#c8b88a",
  text: "#3d3425", mid: "#7a6e5a", light: "#a89e8a",
  green: "#4a9e3f", greenPale: "#e4f5de", greenDark: "#357a2c",
  red: "#d95b5b", redPale: "#fce0e0",
  yellow: "#e8b835", yellowPale: "#fef5d4",
  blue: "#5ba3d9", bluePale: "#ddeefb",
  purple: "#9b6bb5", purplePale: "#f0e4f7",
  orange: "#e8883b", orangePale: "#fde8d4",
  white: "#fff",
  // OLED colors
  oledBg: "#080e08",
  oledGreen: "#33ff33",
  oledDim: "#1a801a",
  oledFaint: "#0d400d",
  oledYellow: "#ccff00",
  oledRed: "#ff3333",
  oledBlue: "#33ccff",
  oledOrange: "#ffaa22",
  oledPurple: "#cc66ff",
};

// Pixel art sprites as arrays of strings, each char = 1 pixel
// . = off, # = bright, o = dim, : = faint
const SPRITES = {
  happy: [
    "...##...",
    "..####..",
    ".##..##.",
    ".#.##.#.",
    ".######.",
    "..####..",
    "...##...",
    "..#..#..",
  ],
  bounce_up: [
    "........",
    "...##...",
    "..####..",
    ".##..##.",
    ".#.##.#.",
    ".######.",
    "..####..",
    "...##...",
  ],
  wilting: [
    "..##....",
    ".####...",
    "####.#..",
    "###.##..",
    ".#####..",
    "..###...",
    "...##...",
    "..#..#..",
  ],
  dead: [
    "........",
    "..##.#..",
    ".###.#..",
    "####.##.",
    ".######.",
    "..####..",
    "...##...",
    "..####..",
  ],
  sprout: [
    "...##...",
    "..####..",
    "...##...",
    "...##...",
    "...##...",
    "...##...",
    "..#..#..",
    ".######.",
  ],
  wifi: [
    "..####..",
    ".#....#.",
    "#..##..#",
    "..#..#..",
    "...##...",
    "........",
    "...##...",
    "...##...",
  ],
  plug: [
    "..#..#..",
    "..#..#..",
    ".######.",
    ".######.",
    "..####..",
    "..####..",
    "...##...",
    "...##...",
  ],
  battery: [
    "..####..",
    ".######.",
    ".#....#.",
    ".#.##.#.",
    ".#.##.#.",
    ".#....#.",
    ".######.",
    "........",
  ],
  battery_low: [
    "..####..",
    ".######.",
    ".#....#.",
    ".#....#.",
    ".#....#.",
    ".#.##.#.",
    ".######.",
    "........",
  ],
  gear: [
    "..#.#...",
    ".#####..",
    "#.###.#.",
    "###.###.",
    "#.###.#.",
    ".#####..",
    "..#.#...",
    "........",
  ],
  cloud_x: [
    "..###...",
    ".#####..",
    "########",
    "########",
    "..#.#...",
    "...#....",
    "..#.#...",
    "........",
  ],
  alert: [
    "...##...",
    "..####..",
    "..#..#..",
    "..####..",
    "..####..",
    "........",
    "...##...",
    "...##...",
  ],
  check: [
    "........",
    "......#.",
    ".....##.",
    "#...##..",
    "##.##...",
    ".###....",
    "..#.....",
    "........",
  ],
  logo: [
    ".##..##.",
    "###.###.",
    "##.#.##.",
    "##...##.",
    ".#...#..",
    "..#.#...",
    "...#....",
    "..###...",
  ],
};

function PixelSprite({ sprite, x, y, scale = 1, color = C.oledGreen, animate = false, frame = 0 }) {
  const rows = SPRITES[sprite] || SPRITES.happy;
  const offsetY = animate ? Math.sin(frame * 0.3) * 1.5 : 0;
  return (
    <g transform={`translate(${x}, ${y + offsetY})`}>
      {rows.map((row, ry) =>
        [...row].map((ch, rx) => {
          if (ch === ".") return null;
          const opacity = ch === "#" ? 1 : ch === "o" ? 0.5 : 0.25;
          return (
            <rect key={`${ry}-${rx}`} x={rx * scale} y={ry * scale}
              width={scale * 0.9} height={scale * 0.9}
              fill={color} opacity={opacity} />
          );
        })
      )}
    </g>
  );
}

function PixelBar({ x, y, value, max = 8, color = C.oledGreen, width = 3, height = 4, gap = 1 }) {
  return (
    <g>
      {Array.from({ length: max }).map((_, i) => (
        <rect key={i} x={x + i * (width + gap)} y={y}
          width={width} height={height}
          fill={i < value ? color : C.oledFaint}
          opacity={i < value ? 0.9 : 0.3} />
      ))}
    </g>
  );
}

function PixelText({ x, y, text, size = 3, color = C.oledGreen, anchor = "start" }) {
  return (
    <text x={x} y={y} fill={color} fontFamily={P} fontSize={size}
      textAnchor={anchor} dominantBaseline="hanging">{text}</text>
  );
}

// Each screen state renders into a 128x64-ish SVG viewport
function OLEDScreen({ stateId, frame = 0, width = 256, height = 128 }) {
  const sc = width / 128; // scale factor
  const blink = Math.floor(frame / 3) % 2 === 0;
  const slowBlink = Math.floor(frame / 5) % 2 === 0;
  const breathe = 0.4 + 0.6 * Math.abs(Math.sin(frame * 0.15));

  const screens = {
    first_boot: () => (
      <g>
        <PixelSprite sprite="logo" x={48 * sc} y={8 * sc} scale={2.5 * sc} color={C.oledGreen} animate frame={frame} />
        <PixelText x={64 * sc} y={34 * sc} text="PLANTGOTCHI" size={4.5 * sc} anchor="middle" color={C.oledGreen} />
        <rect x={20 * sc} y={42 * sc} width={88 * sc} height={0.5 * sc} fill={C.oledDim} />
        <PixelText x={64 * sc} y={47 * sc} text="OPEN APP" size={3.5 * sc} anchor="middle"
          color={blink ? C.oledGreen : C.oledFaint} />
        <PixelText x={64 * sc} y={54 * sc} text="TO SETUP" size={3.5 * sc} anchor="middle"
          color={blink ? C.oledGreen : C.oledFaint} />
      </g>
    ),
    ap_mode: () => (
      <g>
        <PixelSprite sprite="wifi" x={48 * sc} y={4 * sc} scale={2.5 * sc}
          color={C.oledBlue} animate frame={frame} />
        <PixelText x={64 * sc} y={28 * sc} text="PAIRING..." size={4 * sc} anchor="middle" color={C.oledBlue} />
        <rect x={20 * sc} y={36 * sc} width={88 * sc} height={0.5 * sc} fill={C.oledFaint} />
        <PixelText x={64 * sc} y={40 * sc} text="CONNECT TO" size={3 * sc} anchor="middle" color={C.oledDim} />
        <PixelText x={64 * sc} y={47 * sc} text="PG-A3F2" size={4 * sc} anchor="middle"
          color={blink ? C.oledBlue : C.oledFaint} />
        <PixelText x={64 * sc} y={56 * sc} text="IN YOUR APP" size={3 * sc} anchor="middle" color={C.oledDim} />
      </g>
    ),
    connecting: () => {
      const dots = ".".repeat((frame % 4));
      return (
        <g>
          <PixelSprite sprite="wifi" x={48 * sc} y={8 * sc} scale={2.5 * sc}
            color={C.oledBlue} />
          <PixelText x={64 * sc} y={32 * sc} text="CONNECTING" size={4 * sc} anchor="middle" color={C.oledBlue} />
          <PixelText x={64 * sc} y={40 * sc} text={dots} size={5 * sc} anchor="middle" color={C.oledBlue} />
          {/* Loading bar */}
          <rect x={24 * sc} y={50 * sc} width={80 * sc} height={4 * sc} fill={C.oledFaint} rx={sc} />
          <rect x={24 * sc} y={50 * sc} width={(frame % 20) * 4 * sc} height={4 * sc} fill={C.oledBlue} rx={sc} opacity={0.8} />
        </g>
      );
    },
    first_sync: () => (
      <g>
        <PixelSprite sprite="check" x={48 * sc} y={6 * sc} scale={2.5 * sc} color={C.oledGreen} />
        <PixelText x={64 * sc} y={30 * sc} text="CONNECTED!" size={4.5 * sc} anchor="middle" color={C.oledGreen} />
        <rect x={20 * sc} y={38 * sc} width={88 * sc} height={0.5 * sc} fill={C.oledDim} />
        <PixelText x={64 * sc} y={43 * sc} text="SENDING FIRST" size={3 * sc} anchor="middle" color={C.oledDim} />
        <PixelText x={64 * sc} y={50 * sc} text="READING..." size={3 * sc} anchor="middle" color={C.oledDim} />
        <PixelBar x={32 * sc} y={57 * sc} value={Math.min(8, frame % 12)} color={C.oledGreen} width={5 * sc} height={3 * sc} gap={2 * sc} />
      </g>
    ),
    happy: () => (
      <g>
        {/* Top bar: wifi + battery */}
        <PixelText x={2 * sc} y={2 * sc} text="WiFi" size={2.5 * sc} color={C.oledDim} />
        <PixelText x={100 * sc} y={2 * sc} text="87%" size={2.5 * sc} color={C.oledDim} />
        <rect x={112 * sc} y={2 * sc} width={12 * sc} height={5 * sc} rx={sc * 0.5}
          fill="none" stroke={C.oledDim} strokeWidth={0.5 * sc} />
        <rect x={113 * sc} y={3 * sc} width={9 * sc} height={3 * sc} rx={sc * 0.3} fill={C.oledGreen} opacity={0.7} />
        {/* Plant sprite */}
        <PixelSprite sprite={frame % 10 < 5 ? "happy" : "bounce_up"} x={48 * sc} y={10 * sc}
          scale={2.8 * sc} color={C.oledGreen} />
        <PixelText x={64 * sc} y={36 * sc} text="HAPPY!" size={4 * sc} anchor="middle" color={C.oledGreen} />
        {/* Stats */}
        <rect x={4 * sc} y={43 * sc} width={120 * sc} height={0.5 * sc} fill={C.oledFaint} />
        <PixelText x={4 * sc} y={47 * sc} text="H2O" size={2.5 * sc} color={C.oledDim} />
        <PixelBar x={20 * sc} y={47 * sc} value={6} color={C.oledGreen}
          width={4 * sc} height={3.5 * sc} gap={1.5 * sc} />
        <PixelText x={66 * sc} y={47 * sc} text="68%" size={2.5 * sc} color={C.oledGreen} />
        <PixelText x={4 * sc} y={53 * sc} text="TMP" size={2.5 * sc} color={C.oledDim} />
        <PixelText x={20 * sc} y={53 * sc} text="24.5C" size={2.5 * sc} color={C.oledGreen} />
        <PixelText x={55 * sc} y={53 * sc} text="EC" size={2.5 * sc} color={C.oledDim} />
        <PixelText x={66 * sc} y={53 * sc} text="GOOD" size={2.5 * sc} color={C.oledGreen} />
        <PixelText x={90 * sc} y={53 * sc} text="LUX" size={2.5 * sc} color={C.oledDim} />
        <PixelText x={104 * sc} y={53 * sc} text="850" size={2.5 * sc} color={C.oledGreen} />
        {/* Mini chart */}
        <PixelText x={4 * sc} y={59 * sc} text="7D" size={2 * sc} color={C.oledFaint} />
        {[3, 4, 5, 5, 6, 6, 6].map((v, i) => (
          <rect key={i} x={(14 + i * 5) * sc} y={(62 - v) * sc}
            width={3 * sc} height={v * sc} fill={C.oledGreen} opacity={0.5 + i * 0.07} />
        ))}
      </g>
    ),
    needs_water: () => (
      <g>
        <PixelText x={2 * sc} y={2 * sc} text="WiFi" size={2.5 * sc} color={C.oledDim} />
        <PixelText x={112 * sc} y={2 * sc} text="72%" size={2.5 * sc} color={C.oledDim} />
        <PixelSprite sprite="wilting" x={48 * sc} y={10 * sc} scale={2.8 * sc}
          color={C.oledYellow} animate frame={frame} />
        <PixelText x={64 * sc} y={36 * sc} text="WATER ME!" size={4 * sc} anchor="middle"
          color={blink ? C.oledYellow : C.oledFaint} />
        <rect x={4 * sc} y={43 * sc} width={120 * sc} height={0.5 * sc} fill={C.oledFaint} />
        <PixelText x={4 * sc} y={47 * sc} text="H2O" size={2.5 * sc} color={C.oledYellow} />
        <PixelBar x={20 * sc} y={47 * sc} value={2} color={C.oledYellow}
          width={4 * sc} height={3.5 * sc} gap={1.5 * sc} />
        <PixelText x={66 * sc} y={47 * sc} text="28%" size={2.5 * sc} color={C.oledYellow} />
        <PixelText x={4 * sc} y={53 * sc} text="TMP" size={2.5 * sc} color={C.oledDim} />
        <PixelText x={20 * sc} y={53 * sc} text="26.1C" size={2.5 * sc} color={C.oledGreen} />
        <PixelText x={55 * sc} y={53 * sc} text="EC" size={2.5 * sc} color={C.oledDim} />
        <PixelText x={66 * sc} y={53 * sc} text="LOW" size={2.5 * sc} color={C.oledYellow} />
      </g>
    ),
    critical_dry: () => (
      <g>
        <PixelSprite sprite="dead" x={48 * sc} y={6 * sc} scale={2.8 * sc}
          color={blink ? C.oledRed : C.oledFaint} />
        <PixelText x={64 * sc} y={32 * sc} text="!! SOS !!" size={5 * sc} anchor="middle"
          color={blink ? C.oledRed : C.oledFaint} />
        <PixelText x={64 * sc} y={42 * sc} text="CRITICALLY DRY" size={3 * sc} anchor="middle" color={C.oledRed} />
        <rect x={4 * sc} y={48 * sc} width={120 * sc} height={0.5 * sc} fill={C.oledFaint} />
        <PixelText x={4 * sc} y={52 * sc} text="H2O" size={2.5 * sc} color={C.oledRed} />
        <PixelBar x={20 * sc} y={52 * sc} value={1} color={C.oledRed}
          width={4 * sc} height={3.5 * sc} gap={1.5 * sc} />
        <PixelText x={66 * sc} y={52 * sc} text="8%" size={2.5 * sc} color={C.oledRed} />
        <PixelText x={64 * sc} y={59 * sc} text="WATER NOW!" size={3 * sc} anchor="middle"
          color={slowBlink ? C.oledRed : C.oledFaint} />
      </g>
    ),
    low_battery: () => (
      <g>
        {/* Normal happy screen but battery icon blinks */}
        <PixelText x={2 * sc} y={2 * sc} text="WiFi" size={2.5 * sc} color={C.oledDim} />
        <rect x={100 * sc} y={1 * sc} width={24 * sc} height={7 * sc} rx={sc}
          fill={blink ? C.oledYellow + "33" : "none"} stroke={C.oledYellow} strokeWidth={0.5 * sc} />
        <PixelText x={103 * sc} y={2.5 * sc} text="18%" size={2.5 * sc} color={blink ? C.oledYellow : C.oledFaint} />
        <PixelSprite sprite="happy" x={48 * sc} y={12 * sc} scale={2.5 * sc} color={C.oledGreen} />
        <PixelText x={64 * sc} y={36 * sc} text="HAPPY" size={3.5 * sc} anchor="middle" color={C.oledGreen} />
        <rect x={4 * sc} y={43 * sc} width={120 * sc} height={0.5 * sc} fill={C.oledFaint} />
        <PixelText x={4 * sc} y={47 * sc} text="H2O" size={2.5 * sc} color={C.oledDim} />
        <PixelBar x={20 * sc} y={47 * sc} value={5} color={C.oledGreen} width={4 * sc} height={3.5 * sc} gap={1.5 * sc} />
        <PixelText x={64 * sc} y={56 * sc} text="CHARGE SOON" size={2.5 * sc} anchor="middle"
          color={slowBlink ? C.oledYellow : C.oledFaint} />
      </g>
    ),
    critical_battery: () => (
      <g>
        <PixelSprite sprite="battery_low" x={44 * sc} y={6 * sc} scale={3 * sc}
          color={blink ? C.oledRed : C.oledFaint} />
        <PixelText x={64 * sc} y={34 * sc} text="3%" size={6 * sc} anchor="middle" color={C.oledRed} />
        <PixelText x={64 * sc} y={44 * sc} text="CHARGE ME!" size={4 * sc} anchor="middle"
          color={blink ? C.oledRed : C.oledFaint} />
        <rect x={20 * sc} y={52 * sc} width={88 * sc} height={5 * sc} fill={C.oledFaint} rx={sc} />
        <rect x={20 * sc} y={52 * sc} width={3 * sc} height={5 * sc} fill={C.oledRed} rx={sc} />
        <PixelText x={64 * sc} y={60 * sc} text="SHUTTING DOWN..." size={2.5 * sc} anchor="middle" color={C.oledDim} />
      </g>
    ),
    charging: () => {
      const fillWidth = (frame % 20) * 4;
      const pct = Math.min(99, Math.floor((frame % 20) * 5));
      return (
        <g>
          <PixelSprite sprite="plug" x={48 * sc} y={4 * sc} scale={2.5 * sc} color={C.oledOrange} />
          <PixelText x={64 * sc} y={28 * sc} text="CHARGING" size={4 * sc} anchor="middle" color={C.oledOrange} />
          {/* Big percentage */}
          <PixelText x={64 * sc} y={38 * sc} text={`${42 + pct % 58}%`} size={6 * sc} anchor="middle" color={C.oledOrange} />
          {/* Charge bar */}
          <rect x={16 * sc} y={48 * sc} width={96 * sc} height={6 * sc} fill={C.oledFaint} rx={sc} />
          <rect x={16 * sc} y={48 * sc} width={Math.min(96, fillWidth) * sc} height={6 * sc}
            fill={C.oledOrange} rx={sc} opacity={0.8} />
          {/* Lightning bolt text */}
          <PixelText x={64 * sc} y={58 * sc} text="USB-C CONNECTED" size={2.5 * sc} anchor="middle" color={C.oledDim} />
        </g>
      );
    },
    full: () => (
      <g>
        <PixelSprite sprite="battery" x={44 * sc} y={4 * sc} scale={3 * sc} color={C.oledGreen} />
        <PixelText x={64 * sc} y={32 * sc} text="100%" size={6 * sc} anchor="middle" color={C.oledGreen} />
        <PixelText x={64 * sc} y={42 * sc} text="FULL!" size={4.5 * sc} anchor="middle" color={C.oledGreen} />
        <rect x={16 * sc} y={50 * sc} width={96 * sc} height={5 * sc} fill={C.oledGreen} rx={sc} opacity={0.7} />
        <PixelText x={64 * sc} y={59 * sc} text="UNPLUG & PLANT" size={2.5 * sc} anchor="middle" color={C.oledDim} />
      </g>
    ),
    wifi_lost: () => (
      <g>
        <PixelSprite sprite="wifi" x={40 * sc} y={4 * sc} scale={2.5 * sc}
          color={C.oledRed} />
        {/* X over wifi */}
        <line x1={52 * sc} y1={8 * sc} x2={68 * sc} y2={22 * sc} stroke={C.oledRed} strokeWidth={2 * sc} />
        <line x1={68 * sc} y1={8 * sc} x2={52 * sc} y2={22 * sc} stroke={C.oledRed} strokeWidth={2 * sc} />
        <PixelText x={64 * sc} y={30 * sc} text="NO WIFI" size={4.5 * sc} anchor="middle"
          color={blink ? C.oledRed : C.oledFaint} />
        <rect x={4 * sc} y={38 * sc} width={120 * sc} height={0.5 * sc} fill={C.oledFaint} />
        <PixelText x={64 * sc} y={43 * sc} text="LAST READING:" size={2.5 * sc} anchor="middle" color={C.oledDim} />
        <PixelText x={64 * sc} y={50 * sc} text="H2O 52%  24C" size={3 * sc} anchor="middle" color={C.oledDim} />
        <PixelText x={64 * sc} y={58 * sc} text="2H AGO" size={2.5 * sc} anchor="middle" color={C.oledFaint} />
      </g>
    ),
    server_down: () => (
      <g>
        <PixelSprite sprite="cloud_x" x={48 * sc} y={4 * sc} scale={2.5 * sc} color={C.oledYellow} />
        <PixelText x={64 * sc} y={28 * sc} text="OFFLINE" size={4.5 * sc} anchor="middle"
          color={C.oledYellow} />
        <PixelText x={64 * sc} y={36 * sc} text="WIFI OK / NO SERVER" size={2.5 * sc} anchor="middle" color={C.oledDim} />
        <rect x={4 * sc} y={40 * sc} width={120 * sc} height={0.5 * sc} fill={C.oledFaint} />
        <PixelText x={4 * sc} y={44 * sc} text="H2O" size={2.5 * sc} color={C.oledDim} />
        <PixelBar x={20 * sc} y={44 * sc} value={5} color={C.oledDim} width={4 * sc} height={3.5 * sc} gap={1.5 * sc} />
        <PixelText x={66 * sc} y={44 * sc} text="55%" size={2.5 * sc} color={C.oledDim} />
        <PixelText x={4 * sc} y={50 * sc} text="TMP" size={2.5 * sc} color={C.oledDim} />
        <PixelText x={20 * sc} y={50 * sc} text="23.8C" size={2.5 * sc} color={C.oledDim} />
        <PixelText x={64 * sc} y={58 * sc} text="DATA SAVED LOCALLY" size={2.5 * sc} anchor="middle" color={C.oledYellow} />
      </g>
    ),
    fw_update: () => {
      const pct = (frame * 3) % 100;
      return (
        <g>
          <PixelSprite sprite="gear" x={48 * sc} y={4 * sc} scale={2.5 * sc}
            color={C.oledPurple} animate frame={frame} />
          <PixelText x={64 * sc} y={28 * sc} text="UPDATING" size={4 * sc} anchor="middle" color={C.oledPurple} />
          <PixelText x={64 * sc} y={36 * sc} text="DO NOT UNPLUG" size={2.5 * sc} anchor="middle"
            color={blink ? C.oledRed : C.oledFaint} />
          <rect x={16 * sc} y={44 * sc} width={96 * sc} height={6 * sc} fill={C.oledFaint} rx={sc} />
          <rect x={16 * sc} y={44 * sc} width={pct * 0.96 * sc} height={6 * sc} fill={C.oledPurple} rx={sc} opacity={0.8} />
          <PixelText x={64 * sc} y={54 * sc} text={`v0.1.0 > v0.2.0`} size={2.5 * sc} anchor="middle" color={C.oledDim} />
          <PixelText x={64 * sc} y={60 * sc} text={`${pct}%`} size={3 * sc} anchor="middle" color={C.oledPurple} />
        </g>
      );
    },
    fw_done: () => (
      <g>
        <PixelSprite sprite="check" x={48 * sc} y={6 * sc} scale={3 * sc} color={C.oledGreen} />
        <PixelText x={64 * sc} y={32 * sc} text="UPDATED!" size={4.5 * sc} anchor="middle" color={C.oledGreen} />
        <PixelText x={64 * sc} y={42 * sc} text="v0.2.0" size={3.5 * sc} anchor="middle" color={C.oledDim} />
        <PixelText x={64 * sc} y={54 * sc} text="REBOOTING..." size={3 * sc} anchor="middle"
          color={slowBlink ? C.oledGreen : C.oledFaint} />
      </g>
    ),
    error: () => (
      <g>
        <PixelSprite sprite="alert" x={48 * sc} y={4 * sc} scale={2.8 * sc}
          color={blink ? C.oledRed : C.oledFaint} />
        <PixelText x={64 * sc} y={30 * sc} text="ERROR" size={5 * sc} anchor="middle"
          color={blink ? C.oledRed : C.oledFaint} />
        <rect x={4 * sc} y={38 * sc} width={120 * sc} height={0.5 * sc} fill={C.oledFaint} />
        <PixelText x={64 * sc} y={43 * sc} text="SENSOR FAULT" size={3 * sc} anchor="middle" color={C.oledRed} />
        <PixelText x={64 * sc} y={50 * sc} text="CHECK APP FOR" size={2.5 * sc} anchor="middle" color={C.oledDim} />
        <PixelText x={64 * sc} y={56 * sc} text="DETAILS" size={2.5 * sc} anchor="middle" color={C.oledDim} />
        <PixelText x={64 * sc} y={62 * sc} text="ERR:0x4F" size={2 * sc} anchor="middle" color={C.oledFaint} />
      </g>
    ),
  };

  return screens[stateId] ? screens[stateId]() : screens.happy();
}

const LED_STATES = [
  { id: "first_boot", name: "First Boot", color: C.purple, pattern: "slow_pulse", desc: "Open app to set me up", cat: "setup" },
  { id: "ap_mode", name: "AP Mode (Pairing)", color: C.blue, pattern: "fast_blink", desc: "Broadcasting — connect in app", cat: "setup" },
  { id: "connecting", name: "Connecting WiFi", color: C.blue, pattern: "breathing", desc: "Joining your network...", cat: "setup" },
  { id: "first_sync", name: "First Sync OK", color: C.green, pattern: "solid", desc: "Connected! First reading", cat: "setup" },
  { id: "happy", name: "Plant Happy", color: C.green, pattern: "flash", desc: "All readings normal", cat: "normal" },
  { id: "needs_water", name: "Needs Water", color: C.yellow, pattern: "double", desc: "Moisture below threshold", cat: "alert" },
  { id: "critical_dry", name: "Critically Dry", color: C.red, pattern: "triple", desc: "Moisture critical — SOS!", cat: "alert" },
  { id: "low_battery", name: "Low Battery", color: C.yellow, pattern: "slow", desc: "Charge soon (<20%)", cat: "power" },
  { id: "critical_battery", name: "Critical Battery", color: C.red, pattern: "blink", desc: "Charge NOW (<5%)", cat: "power" },
  { id: "charging", name: "Charging", color: C.orange, pattern: "steady", desc: "USB-C plugged in", cat: "power" },
  { id: "full", name: "Fully Charged", color: C.green, pattern: "steady", desc: "Full — unplug me", cat: "power" },
  { id: "wifi_lost", name: "WiFi Lost", color: C.red, pattern: "alt", altColor: C.blue, desc: "Can't reach WiFi", cat: "error" },
  { id: "server_down", name: "Server Down", color: C.yellow, pattern: "alt", altColor: C.blue, desc: "WiFi OK, no server", cat: "error" },
  { id: "fw_update", name: "FW Updating", color: C.purple, pattern: "breathing", desc: "Don't unplug!", cat: "system" },
  { id: "fw_done", name: "FW Updated", color: C.green, pattern: "long", desc: "Rebooting...", cat: "system" },
  { id: "error", name: "HW Error", color: C.red, pattern: "rapid", desc: "Sensor fault — check app", cat: "error" },
];

const CATS = [
  { id: "all", label: "ALL" }, { id: "setup", label: "SETUP" }, { id: "normal", label: "NORMAL" },
  { id: "alert", label: "ALERTS" }, { id: "power", label: "POWER" }, { id: "error", label: "ERRORS" },
  { id: "system", label: "SYSTEM" },
];

export default function App() {
  const [active, setActive] = useState("happy");
  const [cat, setCat] = useState("all");
  const [frame, setFrame] = useState(0);

  useEffect(() => {
    const iv = setInterval(() => setFrame(f => f + 1), 250);
    return () => clearInterval(iv);
  }, []);

  const state = LED_STATES.find(s => s.id === active);
  const filtered = cat === "all" ? LED_STATES : LED_STATES.filter(s => s.cat === cat);

  return (
    <div style={{
      minHeight: "100vh", background: `linear-gradient(170deg, ${C.bg} 0%, #e8e2ce 100%)`,
      fontFamily: P, padding: 16,
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');
        * { box-sizing: border-box; } body { margin: 0; }
        .screen-wrap { display: flex; gap: 12px; flex-wrap: wrap; justify-content: center; }
        @media (min-width: 500px) { .screen-wrap { flex-wrap: nowrap; } }
      `}</style>

      <div style={{ maxWidth: 620, margin: "0 auto" }}>
        <div style={{ fontSize: 12, color: C.greenDark, marginBottom: 3, display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 18 }}>🌱</span> PLANTGOTCHI
        </div>
        <div style={{ fontSize: 6, color: C.light, marginBottom: 14 }}>SENSOR SCREEN & LED STATE REFERENCE</div>

        {/* Live OLED preview */}
        <div style={{
          background: "#111", borderRadius: 12, padding: 16, marginBottom: 14,
          border: "2px solid #222",
        }}>
          <div className="screen-wrap">
            {/* OLED Screen */}
            <div>
              <div style={{ fontSize: 5, color: "#555", marginBottom: 6, textAlign: "center" }}>PRO — OLED SCREEN</div>
              <div style={{
                background: C.oledBg, borderRadius: 8, padding: 4,
                border: "2px solid #1a3a1a",
                boxShadow: `0 0 20px ${C.oledGreen}15, inset 0 0 30px ${C.oledGreen}08`,
                width: 264, height: 136,
              }}>
                {/* Scanlines */}
                <div style={{
                  position: "relative", width: 256, height: 128, overflow: "hidden",
                }}>
                  <svg viewBox="0 0 256 128" width="256" height="128">
                    <OLEDScreen stateId={active} frame={frame} width={256} height={128} />
                  </svg>
                  {/* Scanline overlay */}
                  <div style={{
                    position: "absolute", inset: 0, pointerEvents: "none",
                    background: "repeating-linear-gradient(0deg, transparent 0px, transparent 1px, rgba(0,0,0,0.15) 1px, rgba(0,0,0,0.15) 2px)",
                  }} />
                </div>
              </div>
            </div>

            {/* LED indicator */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8 }}>
              <div style={{ fontSize: 5, color: "#555" }}>LITE — LED</div>
              <div style={{
                width: 48, height: 48, borderRadius: "50%",
                background: state?.color,
                opacity: (() => {
                  const t = frame % 12;
                  switch (state?.pattern) {
                    case "slow_pulse": return 0.3 + 0.7 * Math.abs(Math.sin(frame * 0.15));
                    case "fast_blink": return frame % 2 === 0 ? 1 : 0.08;
                    case "breathing": return 0.2 + 0.8 * Math.abs(Math.sin(frame * 0.12));
                    case "solid": return 0.9;
                    case "flash": return t < 1 ? 1 : 0.05;
                    case "double": return (t < 1 || (t > 2 && t < 3)) ? 1 : 0.05;
                    case "triple": return (t < 1 || (t > 2 && t < 3) || (t > 4 && t < 5)) ? 1 : 0.05;
                    case "slow": return t < 2 ? 0.8 : 0.05;
                    case "blink": return t < 2 ? 1 : 0.05;
                    case "steady": return 0.85;
                    case "alt": return 0.85;
                    case "rapid": return frame % 2 === 0 ? 1 : 0.05;
                    case "long": return t < 4 ? 1 : 0.1;
                    default: return 0.5;
                  }
                })(),
                boxShadow: `0 0 24px ${state?.color}, 0 0 48px ${state?.color}66`,
                transition: state?.pattern === "breathing" || state?.pattern === "slow_pulse" ? "opacity 0.2s" : "none",
                border: `2px solid ${state?.color}88`,
              }} />
              <div style={{ fontSize: 5, color: state?.color, textAlign: "center" }}>
                {state?.name.toUpperCase()}
              </div>
            </div>
          </div>
        </div>

        {/* Category filter */}
        <div style={{ display: "flex", gap: 4, marginBottom: 10, flexWrap: "wrap" }}>
          {CATS.map(c => (
            <button key={c.id} onClick={() => setCat(c.id)} style={{
              fontFamily: P, fontSize: 6, padding: "4px 8px", borderRadius: 4, cursor: "pointer",
              background: cat === c.id ? C.green : "transparent",
              color: cat === c.id ? "#fff" : C.light,
              border: `1px solid ${cat === c.id ? C.green : C.border}`,
            }}>{c.label}</button>
          ))}
        </div>

        {/* State grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
          {filtered.map(s => (
            <div key={s.id} onClick={() => setActive(s.id)} style={{
              background: active === s.id ? s.color + "11" : C.card,
              border: `1.5px solid ${active === s.id ? s.color : C.border}`,
              borderRadius: 8, padding: 8, cursor: "pointer",
              transition: "all 0.15s",
              display: "flex", gap: 8, alignItems: "center",
            }}>
              {/* Mini screen thumbnail */}
              <div style={{
                width: 52, height: 26, borderRadius: 3, overflow: "hidden", flexShrink: 0,
                background: C.oledBg, border: `1px solid #1a3a1a`,
              }}>
                <svg viewBox="0 0 256 128" width="52" height="26">
                  <OLEDScreen stateId={s.id} frame={active === s.id ? frame : 5} width={256} height={128} />
                </svg>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 6, color: C.text, marginBottom: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {s.name.toUpperCase()}
                </div>
                <div style={{ fontSize: 5, color: C.mid, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {s.desc}
                </div>
              </div>
              <div style={{
                width: 10, height: 10, borderRadius: "50%", flexShrink: 0,
                background: s.color, opacity: active === s.id ? 0.9 : 0.3,
                boxShadow: active === s.id ? `0 0 8px ${s.color}` : "none",
              }} />
            </div>
          ))}
        </div>

        <div style={{ textAlign: "center", fontSize: 5, color: C.light, marginTop: 16 }}>
          PLANTGOTCHI v0.2 — TAP ANY STATE TO PREVIEW
        </div>
      </div>
    </div>
  );
}
