import { useState } from "react";

const P = `"Press Start 2P", monospace`;
const C = {
  bg: "#f0ead6", card: "#fffdf5", border: "#e0d5b8",
  text: "#3d3425", mid: "#7a6e5a", light: "#a89e8a",
  green: "#4a9e3f", greenPale: "#e4f5de", greenDark: "#357a2c",
  yellow: "#e8b835", yellowPale: "#fef5d4",
  blue: "#5ba3d9",
  orange: "#e8883b",
  white: "#fff",
};

const volumes = [5, 10, 50, 100, 250, 500, 1000, 5000];

function calcCosts(qty) {
  // FIXED per-order (amortized across units)
  const pcbSetup = 25;
  const stencil = 1.50;
  const handSolderLabor = 3.50;
  const conformalCoatSetup = 10;
  const extendedPartsFee = 9; // 3 extended parts × $3
  const fixedTotal = pcbSetup + stencil + handSolderLabor + conformalCoatSetup + extendedPartsFee;

  // Injection mold tooling — ONE-TIME, shown separately, NOT in per-unit
  const usesInjectionMold = qty >= 250;
  const moldTooling = usesInjectionMold ? 3000 : 0;

  const pcbPerBoard =
    qty <= 5 ? 1.00 : qty <= 10 ? 0.80 : qty <= 50 ? 0.50 :
    qty <= 100 ? 0.35 : qty <= 250 ? 0.28 : qty <= 500 ? 0.22 :
    qty <= 1000 ? 0.18 : 0.12;

  const esp32 =
    qty <= 10 ? 1.80 : qty <= 100 ? 1.43 : qty <= 500 ? 1.18 :
    qty <= 1000 ? 1.10 : 0.95;
  const shtc3 =
    qty <= 10 ? 0.80 : qty <= 100 ? 0.65 : qty <= 500 ? 0.55 :
    qty <= 1000 ? 0.48 : 0.38;
  const ws2812b = qty >= 1000 ? 0.05 : 0.08;
  const tp4056 =
    qty <= 10 ? 0.35 : qty <= 100 ? 0.25 : qty <= 1000 ? 0.18 : 0.12;
  const usbC =
    qty <= 10 ? 0.20 : qty <= 100 ? 0.12 : qty <= 1000 ? 0.08 : 0.05;
  const ldo = qty >= 1000 ? 0.06 : 0.10;
  const photo = qty >= 1000 ? 0.05 : 0.10;
  const jst = qty >= 1000 ? 0.04 : 0.08;
  const passives =
    qty <= 10 ? 0.50 : qty <= 100 ? 0.35 : qty <= 500 ? 0.25 :
    qty <= 1000 ? 0.18 : 0.12;
  const componentsPerBoard = esp32 + shtc3 + ws2812b + tp4056 + usbC + ldo + photo + jst + passives;

  const smtRate = qty >= 1000 ? 0.0012 : 0.0017;
  const assemblyPerBoard = (75 * smtRate) + (2 * 0.0173);

  const conformalPerBoard =
    qty <= 10 ? 2.00 : qty <= 50 ? 1.20 : qty <= 100 ? 0.80 :
    qty <= 250 ? 0.50 : qty <= 500 ? 0.35 : qty <= 1000 ? 0.25 : 0.15;

  const fixedPerUnit = fixedTotal / qty;

  const jlcpcbPerUnit = pcbPerBoard + componentsPerBoard + assemblyPerBoard + conformalPerBoard + fixedPerUnit;

  // Case — 3D print vs injection mold (mold tooling is separate)
  let casePerUnit, caseMethod;
  if (!usesInjectionMold) {
    casePerUnit =
      qty <= 5 ? 4.00 : qty <= 10 ? 3.50 : qty <= 50 ? 2.50 :
      qty <= 100 ? 1.80 : 1.20;
    caseMethod = "3D PRINT";
  } else {
    casePerUnit = qty <= 500 ? 0.45 : qty <= 1000 ? 0.35 : 0.25;
    caseMethod = "INJECTION MOLD";
  }

  const batteryPerUnit =
    qty <= 10 ? 1.80 : qty <= 50 ? 1.40 : qty <= 100 ? 1.20 :
    qty <= 250 ? 1.00 : qty <= 500 ? 0.80 : qty <= 1000 ? 0.65 : 0.45;

  const plugPerUnit = qty >= 1000 ? 0.08 : 0.20;

  const packagingPerUnit =
    qty < 50 ? 0 : qty <= 100 ? 0.30 : qty <= 500 ? 0.50 :
    qty <= 1000 ? 0.45 : 0.35;

  const shippingTotal =
    qty <= 5 ? 20 : qty <= 10 ? 22 : qty <= 50 ? 35 : qty <= 100 ? 50 :
    qty <= 250 ? 80 : qty <= 500 ? 120 : qty <= 1000 ? 180 : 400;
  const shippingPerUnit = shippingTotal / qty;

  const testingPerUnit = qty >= 500 ? 0.20 : 0;

  const totalPerUnit = jlcpcbPerUnit + casePerUnit + batteryPerUnit + plugPerUnit + shippingPerUnit + packagingPerUnit + testingPerUnit;
  const orderTotal = totalPerUnit * qty;

  // Revenue model at $29
  const retailPrice = 29;
  const grossProfit = retailPrice - totalPerUnit;
  const grossMarginPct = ((grossProfit / retailPrice) * 100).toFixed(0);

  return {
    qty,
    fixedPerUnit: fixedPerUnit.toFixed(2),
    pcbPerBoard: pcbPerBoard.toFixed(2),
    componentsPerBoard: componentsPerBoard.toFixed(2),
    assemblyPerBoard: assemblyPerBoard.toFixed(2),
    conformalPerBoard: conformalPerBoard.toFixed(2),
    jlcpcbPerUnit: jlcpcbPerUnit.toFixed(2),
    casePerUnit: casePerUnit.toFixed(2),
    caseMethod,
    moldTooling,
    batteryPerUnit: batteryPerUnit.toFixed(2),
    plugPerUnit: plugPerUnit.toFixed(2),
    packagingPerUnit: packagingPerUnit.toFixed(2),
    testingPerUnit: testingPerUnit.toFixed(2),
    shippingPerUnit: shippingPerUnit.toFixed(2),
    totalPerUnit: totalPerUnit.toFixed(2),
    orderTotal: orderTotal.toFixed(0),
    grossProfit: grossProfit.toFixed(2),
    grossMarginPct,
  };
}

function formatVol(v) {
  return v >= 1000 ? `${(v / 1000).toLocaleString()}K` : v.toLocaleString();
}

export default function UnitEconomics() {
  const [selected, setSelected] = useState(100);
  const current = calcCosts(selected);

  return (
    <div style={{
      minHeight: "100vh",
      background: `linear-gradient(170deg, ${C.bg} 0%, #e8e2ce 100%)`,
      fontFamily: P, padding: 16,
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');
        * { box-sizing: border-box; } body { margin: 0; }
      `}</style>

      <div style={{ maxWidth: 640, margin: "0 auto" }}>
        <div style={{ fontSize: 12, color: C.greenDark, marginBottom: 3, display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 18 }}>🌱</span> PLANTGOTCHI
        </div>
        <div style={{ fontSize: 7, color: C.light, marginBottom: 16 }}>UNIT ECONOMICS — ALL PRICES USD</div>

        {/* Volume selector */}
        <div style={{ display: "flex", gap: 4, marginBottom: 16, flexWrap: "wrap" }}>
          {volumes.map(v => (
            <button key={v} onClick={() => setSelected(v)} style={{
              fontFamily: P, fontSize: 6, padding: "7px 10px", borderRadius: 6, cursor: "pointer",
              background: selected === v ? C.green : C.white,
              color: selected === v ? "#fff" : C.light,
              border: `1.5px solid ${selected === v ? C.green : C.border}`,
            }}>
              {formatVol(v)} UNITS
            </button>
          ))}
        </div>

        {/* Hero */}
        <div style={{
          background: C.greenPale, border: `2px solid ${C.green}44`, borderRadius: 12,
          padding: 16, marginBottom: 14,
          display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12,
        }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 5, color: C.mid, marginBottom: 4 }}>COST PER UNIT</div>
            <div style={{ fontSize: 22, color: C.greenDark }}>${current.totalPerUnit}</div>
            <div style={{ fontSize: 5, color: C.mid, marginTop: 4 }}>
              ORDER TOTAL: ${Number(current.orderTotal).toLocaleString()}
              {current.moldTooling > 0 && (
                <span style={{ color: C.orange }}> + ${current.moldTooling.toLocaleString()} mold</span>
              )}
            </div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 5, color: C.mid, marginBottom: 4 }}>PROFIT AT $29 RETAIL</div>
            <div style={{ fontSize: 22, color: C.greenDark }}>${current.grossProfit}</div>
            <div style={{ fontSize: 5, color: C.mid, marginTop: 4 }}>
              {current.grossMarginPct}% GROSS MARGIN
            </div>
          </div>
        </div>

        {/* Mold tooling callout if applicable */}
        {current.moldTooling > 0 && (
          <div style={{
            background: C.yellowPale, border: `1.5px solid ${C.yellow}44`, borderRadius: 8,
            padding: 10, marginBottom: 14, fontSize: 6, color: C.mid, lineHeight: 1.8,
          }}>
            <span style={{ color: C.orange }}>NOTE:</span> At {formatVol(selected)} units, you switch from
            3D printing to injection molding. The mold tooling is a <strong style={{ color: C.text }}>one-time
            investment of ~$3,000</strong> (2 molds for front + back shell). This is NOT included in the per-unit cost above —
            it's a separate upfront expense that pays for itself within this batch and every future batch.
            The mold lasts 50,000+ shots.
          </div>
        )}

        {/* Retail price options */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 14 }}>
          {[29, 35, 39].map(price => {
            const profit = (price - parseFloat(current.totalPerUnit)).toFixed(2);
            const margin = ((profit / price) * 100).toFixed(0);
            const mult = (price / parseFloat(current.totalPerUnit)).toFixed(1);
            const totalProfit = (profit * selected).toFixed(0);
            return (
              <div key={price} style={{
                background: C.card, border: `1.5px solid ${price === 29 ? C.green : C.border}`, borderRadius: 8,
                padding: 10, textAlign: "center",
              }}>
                <div style={{ fontSize: 6, color: C.mid, marginBottom: 3 }}>SELL AT ${price}</div>
                <div style={{ fontSize: 11, color: C.greenDark }}>${profit}</div>
                <div style={{ fontSize: 5, color: C.mid }}>profit/unit</div>
                <div style={{ fontSize: 5, color: C.light, marginTop: 3 }}>{margin}% margin • {mult}x</div>
                <div style={{ fontSize: 5, color: C.green, marginTop: 3 }}>
                  ${Number(totalProfit).toLocaleString()} total profit
                </div>
              </div>
            );
          })}
        </div>

        {/* Detailed breakdown */}
        <div style={{
          background: C.card, border: `1.5px solid ${C.border}`, borderRadius: 10,
          padding: 14, marginBottom: 12,
        }}>
          <div style={{ fontSize: 7, color: C.text, marginBottom: 10 }}>
            COST BREAKDOWN — {formatVol(selected)} UNITS
          </div>

          {[
            { cat: "JLCPCB (assembled board)", items: [
              ["PCB fabrication", current.pcbPerBoard],
              ["Components (ESP32, sensors, LED, etc)", current.componentsPerBoard],
              ["SMT + hand solder assembly", current.assemblyPerBoard],
              ["Conformal coating (probe)", current.conformalPerBoard],
              ["Setup + extended fees (amortized)", current.fixedPerUnit],
            ], subtotal: current.jlcpcbPerUnit, color: C.green },
            { cat: `ENCLOSURE (${current.caseMethod})`, items: [
              [`Case — 2 pieces (${current.caseMethod.toLowerCase()})`, current.casePerUnit],
            ], subtotal: current.casePerUnit, color: C.blue },
            { cat: "OTHER COMPONENTS", items: [
              ["LiPo battery", current.batteryPerUnit],
              ["USB-C silicone plug", current.plugPerUnit],
              ...(parseFloat(current.packagingPerUnit) > 0 ? [["Retail packaging", current.packagingPerUnit]] : []),
              ...(parseFloat(current.testingPerUnit) > 0 ? [["Functional testing", current.testingPerUnit]] : []),
            ], subtotal: (parseFloat(current.batteryPerUnit) + parseFloat(current.plugPerUnit) + parseFloat(current.packagingPerUnit) + parseFloat(current.testingPerUnit)).toFixed(2), color: C.yellow },
            { cat: "SHIPPING", items: [
              [`${selected >= 1000 ? "Sea freight" : "DHL Express"} (amortized)`, current.shippingPerUnit],
            ], subtotal: current.shippingPerUnit, color: C.mid },
          ].map(section => (
            <div key={section.cat} style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 6, color: section.color, marginBottom: 4 }}>{section.cat}</div>
              {section.items.map(([name, cost]) => (
                <div key={name} style={{
                  display: "flex", justifyContent: "space-between", padding: "2px 0", fontSize: 5.5,
                }}>
                  <span style={{ color: C.mid }}>{name}</span>
                  <span style={{ color: C.text }}>${cost}</span>
                </div>
              ))}
              <div style={{
                display: "flex", justifyContent: "space-between", padding: "3px 0",
                borderTop: `1px solid ${C.border}`, fontSize: 6, marginTop: 2,
              }}>
                <span style={{ color: section.color }}>Subtotal</span>
                <span style={{ color: section.color }}>${section.subtotal}</span>
              </div>
            </div>
          ))}
          <div style={{
            display: "flex", justifyContent: "space-between", padding: "8px 0",
            borderTop: `2px solid ${C.greenDark}`, fontSize: 8,
          }}>
            <span style={{ color: C.greenDark }}>TOTAL PER UNIT</span>
            <span style={{ color: C.greenDark }}>${current.totalPerUnit}</span>
          </div>
        </div>

        {/* Full comparison */}
        <div style={{
          background: C.card, border: `1.5px solid ${C.border}`, borderRadius: 10,
          padding: 14, marginBottom: 12, overflowX: "auto",
        }}>
          <div style={{ fontSize: 7, color: C.text, marginBottom: 10 }}>ALL VOLUMES</div>
          <div style={{
            display: "grid",
            gridTemplateColumns: `80px repeat(${volumes.length}, 1fr)`,
            gap: "3px 4px", fontSize: 5, minWidth: 600,
          }}>
            <div style={{ color: C.light }}>UNITS</div>
            {volumes.map(v => (
              <div key={v} style={{
                color: selected === v ? C.greenDark : C.mid, textAlign: "center",
                background: selected === v ? C.greenPale : "transparent", borderRadius: 3, padding: "2px 0",
              }}>{formatVol(v)}</div>
            ))}

            {[
              ["Cost/unit", v => "$" + calcCosts(v).totalPerUnit],
              ["Order total", v => "$" + Number(calcCosts(v).orderTotal).toLocaleString()],
              ["Board (JLCPCB)", v => "$" + calcCosts(v).jlcpcbPerUnit],
              ["Case", v => "$" + calcCosts(v).casePerUnit],
              ["Case type", v => calcCosts(v).caseMethod],
              ["Mold tooling", v => calcCosts(v).moldTooling > 0 ? "$3,000*" : "—"],
              ["Battery", v => "$" + calcCosts(v).batteryPerUnit],
              ["Ship/unit", v => "$" + calcCosts(v).shippingPerUnit],
              ["Profit @$29", v => "$" + (29 - parseFloat(calcCosts(v).totalPerUnit)).toFixed(2)],
              ["Margin @$29", v => ((29 - parseFloat(calcCosts(v).totalPerUnit)) / 29 * 100).toFixed(0) + "%"],
              ["Total profit", v => "$" + ((29 - parseFloat(calcCosts(v).totalPerUnit)) * v).toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ",")],
            ].map(([label, fn]) => (
              <>
                <div key={label} style={{ color: C.mid, paddingTop: 3, borderTop: `0.5px solid ${C.border}` }}>
                  {label}
                </div>
                {volumes.map(v => (
                  <div key={`${label}-${v}`} style={{
                    textAlign: "center", paddingTop: 3, borderTop: `0.5px solid ${C.border}`,
                    color: selected === v ? C.greenDark : C.text,
                    background: selected === v ? C.greenPale : "transparent", borderRadius: 3,
                    fontSize: label === "Case type" || label === "Mold tooling" ? 4.5 : 5,
                  }}>
                    {fn(v)}
                  </div>
                ))}
              </>
            ))}
          </div>
          <div style={{ fontSize: 4.5, color: C.light, marginTop: 6 }}>
            * MOLD TOOLING IS A ONE-TIME INVESTMENT, NOT INCLUDED IN PER-UNIT COST
          </div>
        </div>

        {/* Milestones */}
        <div style={{
          background: C.card, border: `1.5px solid ${C.border}`, borderRadius: 10, padding: 14,
        }}>
          <div style={{ fontSize: 7, color: C.text, marginBottom: 10 }}>SCALE MILESTONES</div>
          {[
            { vol: "5", label: "PROTOTYPE", note: "Validate hardware. Give to friends. Iterate.", cost: "~$19/unit", invest: "$95", color: C.mid },
            { vol: "50", label: "FIRST BATCH", note: "Sell on Shopify / Product Hunt. Prove demand.", cost: "~$8/unit", invest: "$430", color: C.blue },
            { vol: "100", label: "PRODUCTION", note: "Real margins. Add retail packaging. $29 = 76% margin.", cost: "~$7/unit", invest: "$680", color: C.green },
            { vol: "250", label: "INJECTION MOLD", note: "One-time $3K mold investment. Case drops to $0.45/unit.", cost: "~$5.50/unit", invest: "$1.4K + $3K mold", color: C.green },
            { vol: "1K", label: "REAL BUSINESS", note: "Sea freight. Bulk pricing. $29 = 87% margin. $25K profit.", cost: "~$3.80/unit", invest: "$3.8K", color: C.greenDark },
            { vol: "5K", label: "SCALE", note: "Direct factory sourcing. $29 retail → $130K profit on $15K invest.", cost: "~$3.00/unit", invest: "$15K", color: C.greenDark },
          ].map(m => (
            <div key={m.vol} style={{
              display: "flex", gap: 10, padding: "8px 0", borderTop: `0.5px solid ${C.border}`,
            }}>
              <div style={{
                minWidth: 36, height: 36, borderRadius: 8,
                background: m.color + "22", color: m.color,
                display: "flex", alignItems: "center", justifyContent: "center", fontSize: 7,
              }}>{m.vol}</div>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2, flexWrap: "wrap", gap: 4 }}>
                  <span style={{ fontSize: 6, color: m.color }}>{m.label}</span>
                  <div style={{ display: "flex", gap: 8 }}>
                    <span style={{ fontSize: 6, color: C.greenDark }}>{m.cost}</span>
                    <span style={{ fontSize: 5, color: C.light }}>invest: {m.invest}</span>
                  </div>
                </div>
                <div style={{ fontSize: 5.5, color: C.mid, lineHeight: 1.6 }}>{m.note}</div>
              </div>
            </div>
          ))}
        </div>

        <div style={{ textAlign: "center", fontSize: 5, color: C.light, marginTop: 16 }}>
          PLANTGOTCHI UNIT ECONOMICS v0.3 — ALL PRICES USD — MARCH 2026
        </div>
      </div>
    </div>
  );
}
