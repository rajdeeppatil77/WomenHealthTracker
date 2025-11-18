"use client";
import React, { useEffect, useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Download, Upload, FileText, RefreshCw, HeartPulse, Activity, TrendingUp, Bot, Image as ImageIcon, ShieldAlert, Info } from "lucide-react";
import Papa from "papaparse";
import Tesseract from "tesseract.js";
import { format, addDays, parseISO, differenceInDays } from "date-fns";
import { LineChart, Line, BarChart, Bar, PieChart, Pie, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid } from "recharts";

const SAMPLE_ROWS = [
  { id: "TWB001", name: "Sita Kumari", age: 24, state: "Jharkhand", tribe: "Santhal", height_cm: 152, weight_kg: 46, hb_gdl: 10.2, bp_sys: 112, bp_dia: 74, pregnant: false, last_period_date: "2025-10-20", cycle_length_days: 28 },
  { id: "TWB002", name: "Asha Devi", age: 29, state: "Odisha", tribe: "Gond", height_cm: 158, weight_kg: 55, hb_gdl: 8.6, bp_sys: 138, bp_dia: 92, pregnant: true, last_period_date: "2025-10-10", cycle_length_days: 30 },
  { id: "TWB003", name: "Lakshmi Bai", age: 34, state: "Madhya Pradesh", tribe: "Bhil", height_cm: 149, weight_kg: 62, hb_gdl: 12.8, bp_sys: 124, bp_dia: 80, pregnant: false, last_period_date: "2025-10-28", cycle_length_days: 27 }
];
const SAMPLE_CSV = Papa.unparse(SAMPLE_ROWS);

const STATES_TRIBES: Record<string, string[]> = {
  Jharkhand: ["Santhal", "Munda", "Oraon", "Ho"],
  Odisha: ["Gond", "Munda", "Bonda", "Kutia Kondh"],
  "Madhya Pradesh": ["Bhil", "Barela", "Sahariya", "Gond"],
  Chhattisgarh: ["Baiga", "Kamar", "Halba", "Maria Gond"],
  Rajasthan: ["Sahariya", "Garasia", "Bhil", "Meena"],
  Gujarat: ["Bhil", "Dhodia", "Gamit", "Siddi"],
  Telangana: ["Koya", "Gond", "Chenchu"],
  "West Bengal": ["Santal", "Munda", "Bhumij"]
};
const NAME_FIRST = ["Sita","Asha","Lakshmi","Maya","Kamli","Rani","Ganga","Bimla","Tulsi","Rupa","Lata","Rekha","Sarita","Kavita","Nirmala","Sunita","Pooja","Geeta","Radha","Shanti"];
const NAME_LAST = ["Kumari","Devi","Bai","Oraon","Munda","Bhil","Koya","Santal","Gond","Sahariya"];
const rand = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
function choice<T>(arr: T[]): T { return arr[rand(0, arr.length - 1)]; }
const randDate2025 = () => {
  const start = new Date("2025-01-01");
  const d = new Date(start.getTime() + rand(0, 300) * 24 * 60 * 60 * 1000);
  return d.toISOString().slice(0, 10);
};
function makeDemoRows500(n = 500) {
  const rows: any[] = [];
  const states = Object.keys(STATES_TRIBES);
  for (let i = 0; i < n; i++) {
    const state = choice(states);
    const tribe = choice(STATES_TRIBES[state]);
    const name = `${choice(NAME_FIRST)} ${choice(NAME_LAST)}`;
    rows.push({
      id: `TWB${String(i + 1).padStart(4, "0")}`,
      name,
      age: rand(18, 45),
      state,
      tribe,
      height_cm: rand(145, 165),
      weight_kg: rand(40, 72),
      hb_gdl: +(7 + Math.random() * 6.5).toFixed(1),
      bp_sys: rand(100, 155),
      bp_dia: rand(60, 98),
      pregnant: Math.random() < 0.35,
      last_period_date: randDate2025(),
      cycle_length_days: rand(24, 32)
    });
  }
  return rows;
}

function toNumber(x: any) { const n = Number(x); return Number.isFinite(n) ? n : null; }
function bmi(h: number, w: number) { const H = toNumber(h), W = toNumber(w); if (!H || !W) return null; const m = H / 100; return +(W / (m * m)).toFixed(1); }
function bmiCategoryAsian(b: number | null) { if (b == null) return "Unknown"; if (b < 18.5) return "Underweight"; if (b < 23) return "Normal"; if (b < 27.5) return "Overweight"; return "Obese"; }
function anemiaCategory(hb: number | null, pregnant: boolean) { const h = toNumber(hb); if (h == null) return "Unknown"; if (pregnant) { if (h < 7) return "Severe"; if (h < 10) return "Moderate"; if (h < 11) return "Mild"; return "None"; } if (h < 8) return "Severe"; if (h < 11) return "Moderate"; if (h < 12) return "Mild"; return "None"; }
function hasHighBP(sys?: number | null, dia?: number | null) { const s = toNumber(sys), d = toNumber(dia); if (s == null || d == null) return false; return s >= 140 || d >= 90; }
function nextPeriodDate(lpd?: string, cycle?: number) { try { const base = parseISO(String(lpd)); const len = toNumber(cycle) || 28; return addDays(base, len); } catch { return null; } }
function fertileWindow(lpd?: string, cycle?: number) { try { const base = parseISO(String(lpd)); const len = toNumber(cycle) || 28; const ovu = addDays(base, Math.max(0, len - 14)); return { start: addDays(ovu, -2), end: addDays(ovu, 2) }; } catch { return { start: null as any, end: null as any }; } }
function download(filename: string, text: string) { const blob = new Blob([text], { type: "text/csv;charset=utf-8;" }); const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = filename; a.click(); URL.revokeObjectURL(url); }
const unique = (arr: any[]) => [...new Set(arr.filter(Boolean))];

const DRUG_KB: Record<string, {name:string;use:string;precautions:string;pregnancy:string;avoid_if?:string[]}> = {
  ferrous: { name: "Iron (Ferrous)", use: "Treats/prevents iron-deficiency anemia.", precautions: "May constipate; take after meals; keep from children.", pregnancy: "Often prescribed in pregnancy.", avoid_if: [] },
  folic: { name: "Folic Acid", use: "Prevents neural tube defects; RBC support.", precautions: "Usually well tolerated.", pregnancy: "Recommended when prescribed.", avoid_if: [] },
  calcium: { name: "Calcium", use: "Bone health (often with D3).", precautions: "Separate from iron by 2+ hours.", pregnancy: "Generally safe when prescribed.", avoid_if: [] },
  "vitamin d": { name: "Vitamin D3", use: "Supports calcium absorption.", precautions: "Avoid overdose; follow dose.", pregnancy: "Generally safe when prescribed.", avoid_if: [] },
  paracetamol: { name: "Paracetamol", use: "Pain/fever relief.", precautions: "Max ~3–4 g/day adults.", pregnancy: "Usually acceptable at advised doses.", avoid_if: ["severe liver disease"] },
  ibuprofen: { name: "Ibuprofen", use: "Pain/inflammation.", precautions: "Gastric/kidney risk.", pregnancy: "Avoid esp. 3rd trimester unless prescribed.", avoid_if: ["ulcer","kidney disease","late pregnancy"] },
  azithromycin: { name: "Azithromycin", use: "Bacterial infections.", precautions: "Finish course; avoid self-use.", pregnancy: "Use if doctor advises.", avoid_if: ["allergy"] }
};
function analyzePrescription(text: string, ctx: {pregnant?: boolean}) { const t = (text || "").toLowerCase(); const out: any[] = []; Object.keys(DRUG_KB).forEach(k => { if (t.includes(k)) { const d = DRUG_KB[k]; out.push({ name: d.name, use: d.use, precautions: d.precautions, pregnancy: d.pregnancy, note: ctx?.pregnant ? d.pregnancy : "" }); } }); return out; }

function runSelfTests() {
  try {
    console.group("Women Health Tracker self-tests");
    console.assert(bmi(160, 64) === 25.0, "BMI calc failed");
    console.assert(bmiCategoryAsian(17) === "Underweight", "BMI category underweight");
    console.assert(bmiCategoryAsian(24) === "Overweight", "BMI category overweight");
    console.assert(anemiaCategory(10.5, false) === "Mild", "Anemia non-pregnant mild");
    console.assert(anemiaCategory(9.5, true) === "Moderate", "Anemia pregnant moderate");
    console.assert(hasHighBP(141, 80) === true && hasHighBP(120, 95) === true && hasHighBP(120, 80) === false, "BP screening");
    const np = nextPeriodDate("2025-01-01", 28); console.assert(np instanceof Date, "Next period date");
    const fw = fertileWindow("2025-01-01", 28); console.assert(fw.start instanceof Date && fw.end instanceof Date, "Fertile window");
    const drugs = analyzePrescription("Paracetamol and Ferrous tabs", { pregnant: true });
    console.assert(drugs.length >= 2 && drugs.some(d=>d.name.includes("Iron")), "Drug detection & pregnancy note");
    const demo = makeDemoRows500(10); console.assert(demo.length === 10 && demo[0].id.startsWith("TWB"), "Demo generator");
    console.assert(bmi(null as any, 50) === null && bmi(160, null as any) === null, "BMI handles null");
    const fw26 = fertileWindow("2025-02-01", 26); console.assert(fw26.start < fw26.end, "Fertile window ordering");
    console.assert(anemiaCategory(6.9, true) === "Severe", "Anemia severe in pregnancy");
    console.assert(bmiCategoryAsian(27.6) === "Obese", "BMI obese threshold");
    const rows100 = makeDemoRows500(5); console.assert(rows100.every(r=>r.id.startsWith("TWB")), "IDs padded");
    console.groupEnd();
  } catch (e) { console.error("Self-tests error:", e); }
}

export default function WomenHealthTrackerApp() {
  const [rawRows, setRawRows] = useState<any[]>([]);
  const [stateFilter, setStateFilter] = useState<string>("all");
  const [tribeFilter, setTribeFilter] = useState<string>("all");
  const [ageMin, setAgeMin] = useState<number>(15);
  const [ageMax, setAgeMax] = useState<number>(49);
  const [onlyHighRisk, setOnlyHighRisk] = useState<boolean>(false);
  const [search, setSearch] = useState<string>("");
  useEffect(() => { setRawRows(makeDemoRows500(500)); runSelfTests(); }, []);
  const rows = useMemo(() => rawRows.map(r => { const _bmi = bmi(r.height_cm, r.weight_kg); const _bmiCat = bmiCategoryAsian(_bmi as any); const _anemia = anemiaCategory(r.hb_gdl, r.pregnant); const _highBP = hasHighBP(r.bp_sys, r.bp_dia); const _np = nextPeriodDate(r.last_period_date, r.cycle_length_days); const _fw = fertileWindow(r.last_period_date, r.cycle_length_days); return { ...r, bmi: _bmi, bmi_cat: _bmiCat, anemia: _anemia, high_bp: _highBP, next_period: _np, fertile_start: _fw.start, fertile_end: _fw.end }; }), [rawRows]);
  const states = useMemo(() => unique(rows.map(r => r.state)), [rows]);
  const tribes = useMemo(() => unique(rows.map(r => r.tribe)), [rows]);
  const filtered = useMemo(() => rows.filter(r => { const ageOk = toNumber(r.age) >= ageMin && toNumber(r.age) <= ageMax; const stateOk = stateFilter === 'all' || r.state === stateFilter; const tribeOk = tribeFilter === 'all' || r.tribe === tribeFilter; const riskOk = !onlyHighRisk || r.anemia !== 'None' || r.high_bp || (r.bmi_cat === 'Underweight' || r.bmi_cat === 'Obese'); const q = search.trim().toLowerCase(); const searchOk = !q || `${r.id} ${r.name} ${r.state} ${r.tribe}`.toLowerCase().includes(q); return ageOk && stateOk && tribeOk && riskOk && searchOk; }), [rows, ageMin, ageMax, stateFilter, tribeFilter, onlyHighRisk, search]);
  const kpis = useMemo(() => { const n = filtered.length || 1; const anemiaCount = filtered.filter(r => r.anemia !== 'None' && r.anemia !== 'Unknown').length; const highBPCount = filtered.filter(r => r.high_bp).length; const avgBMI = +(filtered.reduce((a, r) => a + (r.bmi || 0), 0) / n).toFixed(1); return { total: filtered.length, anemiaPrev: Math.round(anemiaCount / n * 100), highBPPrev: Math.round(highBPCount / n * 100), avgBMI, underw: filtered.filter(r => r.bmi_cat === 'Underweight').length, obese: filtered.filter(r => r.bmi_cat === 'Obese').length }; }, [filtered]);
  const anemiaByState = useMemo(() => { const by: Record<string, any> = {}; filtered.forEach(r => { if (!by[r.state]) by[r.state] = { state: r.state, None: 0, Mild: 0, Moderate: 0, Severe: 0 }; by[r.state][r.anemia] = (by[r.state][r.anemia] || 0) + 1; }); return Object.values(by); }, [filtered]);
  const bmiDist = useMemo(() => { const bins: Record<string, number> = { Underweight: 0, Normal: 0, Overweight: 0, Obese: 0 }; filtered.forEach(r => { bins[r.bmi_cat] = (bins[r.bmi_cat] || 0) + 1; }); return Object.entries(bins).map(([cat, count]) => ({ cat, count })); }, [filtered]);
  const bpDist = useMemo(() => { const ok = filtered.filter(r => r.bp_sys != null && r.bp_dia != null); const hi = ok.filter(r => r.high_bp).length; return [{ name: 'High BP', value: hi }, { name: 'Normal', value: Math.max(0, ok.length - hi) }]; }, [filtered]);
  function onUpload(e: React.ChangeEvent<HTMLInputElement>) { const file = e.target.files?.[0]; if (!file) return; Papa.parse(file, { header: true, skipEmptyLines: true, complete: (res: any) => { const rows = res.data.map((r: any, i: number) => ({ id: r.id || `REC_${i + 1}`, name: r.name || 'Unnamed', age: toNumber(r.age), state: r.state, tribe: r.tribe, height_cm: toNumber(r.height_cm), weight_kg: toNumber(r.weight_kg), hb_gdl: toNumber(r.hb_gdl), bp_sys: toNumber(r.bp_sys), bp_dia: toNumber(r.bp_dia), pregnant: String(r.pregnant).toLowerCase() === 'true' || r.pregnant === 1 || r.pregnant === '1', last_period_date: r.last_period_date, cycle_length_days: toNumber(r.cycle_length_days) })); setRawRows(rows); }, error: (err: any) => alert('CSV parse error: ' + err?.message) }); }
  function exportFiltered() { const csv = Papa.unparse(filtered.map(({ next_period, fertile_start, fertile_end, bmi, bmi_cat, anemia, high_bp, ...rest }) => ({...rest, bmi, bmi_cat, anemia, high_bp, next_period: next_period ? format(next_period, 'yyyy-MM-dd') : '', fertile_start: fertile_start ? format(fertile_start, 'yyyy-MM-dd') : '', fertile_end: fertile_end ? format(fertile_end, 'yyyy-MM-dd') : ''}))); download('women_health_filtered.csv', csv); }
  function downloadTemplate() { download('tribal_women_template.csv', SAMPLE_CSV); }
  function resetFilters() { setStateFilter('all'); setTribeFilter('all'); setAgeMin(15); setAgeMax(49); setOnlyHighRisk(false); setSearch(''); }
  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-rose-50 via-white to-rose-50 p-4 md:p-8">
      <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Women Health Tracker</h1>
          <p className="text-sm text-muted-foreground">Built for Indian women, with support for tribal datasets. Privacy-first. Not medical advice.</p>
        </div>
        <div className="flex gap-2 items-center">
          <Button variant="secondary" onClick={downloadTemplate} className="gap-2"><Download className="h-4 w-4"/>Template CSV</Button>
          <Button variant="outline" onClick={() => setRawRows(makeDemoRows500(500))} className="gap-2"><RefreshCw className="h-4 w-4"/>Load 500 Demo</Button>
          <Button onClick={exportFiltered} className="gap-2"><FileText className="h-4 w-4"/>Export Filtered</Button>
        </div>
      </header>
      <Card className="mb-6 shadow-sm">
        <CardContent className="p-4 md:p-6">
          <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-4">
            <div className="flex items-center gap-2">
              <Upload className="h-5 w-5"/>
              <Input type="file" accept=".csv" onChange={onUpload} className="w-64" aria-label="Upload CSV" />
            </div>
            <div className="flex-1"/>
            <div className="grid grid-cols-1 md:grid-cols-6 gap-3 w-full">
              <div>
                <Label className="text-xs">State</Label>
                <Select value={stateFilter} onValueChange={setStateFilter}>
                  <SelectTrigger><SelectValue placeholder="All"/></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    {states.map((s) => (<SelectItem key={s} value={s}>{s}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Tribe</Label>
                <Select value={tribeFilter} onValueChange={setTribeFilter}>
                  <SelectTrigger><SelectValue placeholder="All"/></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    {tribes.map((t) => (<SelectItem key={t} value={t}>{t}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Age (min)</Label>
                <Input type="number" value={ageMin} onChange={(e) => setAgeMin(Number(e.target.value))}/>
              </div>
              <div>
                <Label className="text-xs">Age (max)</Label>
                <Input type="number" value={ageMax} onChange={(e) => setAgeMax(Number(e.target.value))}/>
              </div>
              <div className="flex items-end gap-2">
                <Switch checked={onlyHighRisk} onCheckedChange={setOnlyHighRisk} id="risk"/>
                <Label htmlFor="risk" className="text-xs">Only high‑risk</Label>
              </div>
              <div>
                <Label className="text-xs">Search</Label>
                <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Name / ID / State / Tribe"/>
              </div>
            </div>
            <Button variant="outline" onClick={resetFilters} className="gap-2 md:self-end"><RefreshCw className="h-4 w-4"/>Reset</Button>
          </div>
        </CardContent>
      </Card>
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <StatCard icon={<HeartPulse className="h-5 w-5"/>} label="Participants" value={kpis.total}/>
        <StatCard icon={<Activity className="h-5 w-5"/>} label="Avg BMI" value={kpis.avgBMI}/>
        <StatCard icon={<TrendingUp className="h-5 w-5"/>} label="Anemia %" value={`${kpis.anemiaPrev}%`}/>
        <StatCard icon={<TrendingUp className="h-5 w-5"/>} label="High BP %" value={`${kpis.highBPPrev}%`}/>
        <StatCard icon={<Activity className="h-5 w-5"/>} label="Underw / Obese" value={`${kpis.underw} / ${kpis.obese}`}/>
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 mb-6">
        <Card className="shadow-sm"><CardContent className="p-4 h-[320px]">
          <h3 className="font-semibold mb-2">Anemia by State</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={anemiaByState}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="state" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Legend />
              <Bar dataKey="Mild" stackId="a" />
              <Bar dataKey="Moderate" stackId="a" />
              <Bar dataKey="Severe" stackId="a" />
              <Bar dataKey="None" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent></Card>
        <Card className="shadow-sm"><CardContent className="p-4 h-[320px]">
          <h3 className="font-semibold mb-2">BMI Distribution (Asian cut‑offs)</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={bmiDist}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="cat" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="count" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent></Card>
        <Card className="shadow-sm"><CardContent className="p-4 h-[320px]">
          <h3 className="font-semibold mb-2">BP Screening</h3>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={bpDist} dataKey="value" nameKey="name" outerRadius={100} label />
            </PieChart>
          </ResponsiveContainer>
        </CardContent></Card>
      </div>
      <Tabs defaultValue="table" className="mb-24">
        <TabsList>
          <TabsTrigger value="table">Records</TabsTrigger>
          <TabsTrigger value="cycle">Cycle & Fertility</TabsTrigger>
          <TabsTrigger value="ai">AI Doctor</TabsTrigger>
          <TabsTrigger value="assess">Assessment Tools</TabsTrigger>
          <TabsTrigger value="advanced">Advanced Tools</TabsTrigger>
        </TabsList>
        <TabsContent value="table">
          <Card className="shadow-sm">
            <CardContent className="p-0 overflow-auto">
              <table className="min-w-full text-sm">
                <thead className="sticky top-0 bg-white/80 backdrop-blur border-b">
                  <tr>
                    {"ID,Name,Age,State,Tribe,Height(cm),Weight(kg),BMI,BMI Cat,HB(g/dL),Anemia,BP(Sys/Dia),High BP,Next Period,Fertile Window".split(",").map((h) => (
                      <th key={h} className="text-left p-3 font-medium">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((r) => (
                    <tr key={r.id} className="border-b hover:bg-rose-50/50">
                      <td className="p-3 font-mono text-xs">{r.id}</td>
                      <td className="p-3">{r.name}</td>
                      <td className="p-3">{r.age}</td>
                      <td className="p-3">{r.state}</td>
                      <td className="p-3">{r.tribe}</td>
                      <td className="p-3">{r.height_cm}</td>
                      <td className="p-3">{r.weight_kg}</td>
                      <td className="p-3">{r.bmi ?? ""}</td>
                      <td className="p-3">{r.bmi_cat}</td>
                      <td className="p-3">{r.hb_gdl}</td>
                      <td className="p-3">{r.anemia}</td>
                      <td className="p-3">{r.bp_sys}/{r.bp_dia}</td>
                      <td className="p-3">{r.high_bp ? "Yes" : "No"}</td>
                      <td className="p-3">{r.next_period ? format(r.next_period, "dd MMM yyyy") : ""}</td>
                      <td className="p-3">
                        {r.fertile_start && r.fertile_end ? (
                          <span>
                            {format(r.fertile_start, "dd MMM")} – {format(r.fertile_end, "dd MMM")}
                          </span>
                        ) : (
                          ""
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="cycle">
          <Card className="shadow-sm">
            <CardContent className="p-4">
              <CycleHelper rows={filtered} />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="ai">
          <Card className="shadow-sm">
            <CardContent className="p-4">
              <AIDoctor rows={filtered} />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="assess">
          <Card className="shadow-sm">
            <CardContent className="p-4">
              <Assessments rows={filtered} />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="advanced">
          <Card className="shadow-sm">
            <CardContent className="p-4">
              <AdvancedTools />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      <footer className="text-xs text-center text-muted-foreground py-8">
        © {new Date().getFullYear()} Women Health Tracker. For education & public health planning — not a substitute for professional care.
      </footer>
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) {
  return (
    <Card className="shadow-sm">
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-rose-100">{icon}</div>
          <div>
            <div className="text-xs text-muted-foreground uppercase tracking-wide">{label}</div>
            <div className="text-xl font-semibold">{value}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function CycleHelper({ rows }: { rows: any[] }) {
  const [idx, setIdx] = useState(0);
  const r = rows[idx];
  useEffect(() => { if (idx >= rows.length) setIdx(0); }, [rows, idx]);
  if (!rows.length) return <div className="text-sm text-muted-foreground">No matching records.</div>;
  const nextP = r.next_period ? format(r.next_period, "dd MMM yyyy") : "N/A";
  const fw = r.fertile_start && r.fertile_end ? `${format(r.fertile_start, "dd MMM")} – ${format(r.fertile_end, "dd MMM yyyy")}` : "N/A";
  const daysToNext = r.next_period ? differenceInDays(r.next_period, new Date()) : null;
  return (
    <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-start">
      <div className="md:col-span-2 space-y-3">
        <div className="flex items-end gap-2">
          <div className="flex-1">
            <Label className="text-xs">Select participant</Label>
            <Select value={String(idx)} onValueChange={(v) => setIdx(Number(v))}>
              <SelectTrigger><SelectValue/></SelectTrigger>
              <SelectContent className="max-h-64">
                {rows.map((x, i) => (
                  <SelectItem key={x.id} value={String(i)}>{x.name} — {x.id}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <Card className="shadow-sm"><CardContent className="p-4 space-y-1">
          <div className="text-sm font-semibold">{r.name} <span className="text-xs font-normal text-muted-foreground">({r.age} yrs • {r.state} • {r.tribe})</span></div>
          <div className="text-sm">BMI {r.bmi ?? "N/A"} — <span className="font-medium">{r.bmi_cat}</span></div>
          <div className="text-sm">Hemoglobin {r.hb_gdl ?? "N/A"} g/dL — <span className="font-medium">{r.anemia}</span></div>
          <div className="text-sm">BP {r.bp_sys ?? "–"}/{r.bp_dia ?? "–"} — {r.high_bp ? <span className="font-medium">High</span> : "OK"}</div>
        </CardContent></Card>
        <Card className="shadow-sm"><CardContent className="p-4 space-y-1">
          <div className="text-sm">Cycle length: <span className="font-medium">{r.cycle_length_days || 28} days</span></div>
          <div className="text-sm">Last period: <span className="font-medium">{r.last_period_date || "N/A"}</span></div>
          <div className="text-sm">Next period: <span className="font-medium">{nextP}</span>{daysToNext != null && <span className="text-xs text-muted-foreground"> ({daysToNext >= 0 ? `${daysToNext} days left` : `${Math.abs(daysToNext)} days ago`})</span>}</div>
          <div className="text-sm">Fertile window: <span className="font-medium">{fw}</span></div>
        </CardContent></Card>
        <p className="text-xs text-muted-foreground">Cycle predictions are estimates and can vary.</p>
      </div>
      <div className="md:col-span-3">
        <Card className="shadow-sm h-full"><CardContent className="p-4 h-full">
          <h3 className="font-semibold mb-2">Cycle timeline (months)</h3>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={buildCycleSeries(r)}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="label" />
              <YAxis hide />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="Period" />
              <Line type="monotone" dataKey="Fertile" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent></Card>
      </div>
    </div>
  );
}

function buildCycleSeries(r: any) {
  const out: any[] = [];
  const base = r.last_period_date ? parseISO(r.last_period_date) : new Date();
  const len = toNumber(r.cycle_length_days) || 28;
  for (let i = 0; i < 6; i++) {
    const start = addDays(base, i * len);
    const next = addDays(start, len);
    const fw = fertileWindow(start.toISOString().slice(0,10), len);
    out.push({ label: format(start, "dd MMM"), Period: 1, Fertile: 0 });
    out.push({ label: `${format(fw.start, "dd MMM")}`, Period: 0, Fertile: 1 });
    out.push({ label: `${format(fw.end, "dd MMM")}`, Period: 0, Fertile: 1 });
    out.push({ label: format(next, "dd MMM"), Period: 1, Fertile: 0 });
  }
  return out;
}

function AIDoctor({ rows }: { rows: any[] }) {
  const [idx, setIdx] = useState(0);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [extracting, setExtracting] = useState(false);
  const [ocrText, setOcrText] = useState("");
  const [analysis, setAnalysis] = useState<any[]>([]);
  const [messages, setMessages] = useState<Array<{role:'bot'|'user'; text:string}>>([
    { role: "bot", text: "Hi! I'm your health guide. Upload a prescription photo or paste the text, then click Analyze. I will explain medicines, general precautions, and home-care tips. I'm not a doctor — for concerns, please consult a clinician." }
  ]);
  const current = rows[idx];
  useEffect(() => { if (idx >= rows.length) setIdx(0); }, [rows, idx]);
  async function runOCR() { if (!imageFile) return; setExtracting(true); try { const res = await Tesseract.recognize(imageFile, 'eng'); const text = (res as any)?.data?.text || ""; setOcrText(text.trim()); setMessages((m) => [...m, { role: "bot", text: "I extracted the text. Review it below and press Analyze when ready." }]); } catch (e: any) { alert("OCR failed: " + (e?.message || e)); } finally { setExtracting(false); } }
  function doAnalyze() { const ctx = { pregnant: Boolean(current?.pregnant), age: current?.age }; const result = analyzePrescription(ocrText, ctx); setAnalysis(result); const summary = result.length ? `I found ${result.length} medicine${result.length>1?"s":""}: ` + result.map((x:any)=>x.name).join(", ") : "I couldn't confidently detect known medicines. You can edit the text and retry, or ask a specific question."; setMessages((m) => [...m, { role: "bot", text: summary }]); }
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <div className="lg:col-span-2 space-y-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Bot className="h-4 w-4"/> <span>AI Doctor (info-only)</span>
        </div>
        <Card className="shadow-sm"><CardContent className="p-4">
          <div className="h-56 overflow-auto space-y-2">
            {messages.map((m, i) => (
              <div key={i} className={m.role === 'bot' ? 'text-sm' : 'text-sm text-right'}>
                <span className={m.role === 'bot' ? 'px-3 py-2 bg-rose-50 rounded-xl inline-block' : 'px-3 py-2 bg-slate-100 rounded-xl inline-block'}>{m.text}</span>
              </div>
            ))}
            {analysis.length > 0 && (
              <div className="space-y-3 mt-2">
                {analysis.map((a, i) => (
                  <Card key={i} className="border">
                    <CardContent className="p-3 space-y-1">
                      <div className="font-medium">{a.name}</div>
                      <div className="text-sm"><span className="font-medium">Use:</span> {a.use}</div>
                      <div className="text-sm"><span className="font-medium">Precautions:</span> {a.precautions}</div>
                      <div className="text-sm"><span className="font-medium">Pregnancy:</span> {a.pregnancy}</div>
                      {a.note && <div className="text-xs text-muted-foreground">{a.note}</div>}
                    </CardContent>
                  </Card>
                ))}
                <div className="text-xs text-muted-foreground flex items-start gap-2"><ShieldAlert className="h-4 w-4"/>This information is educational and not a medical diagnosis. Always follow the prescribing clinician and local guidelines.</div>
              </div>
            )}
          </div>
        </CardContent></Card>
      </div>
      <div className="space-y-3">
        <div>
          <Label className="text-xs">Select participant (for context)</Label>
          <Select value={String(idx)} onValueChange={(v) => setIdx(Number(v))}>
            <SelectTrigger><SelectValue/></SelectTrigger>
            <SelectContent className="max-h-64">
              {rows.map((x, i) => (
                <SelectItem key={x.id} value={String(i)}>{x.name} — {x.id}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="text-xs text-muted-foreground mt-1">Pregnant: <span className="font-medium">{current?.pregnant ? 'Yes' : 'No'}</span>; Age: <span className="font-medium">{current?.age ?? '—'}</span></div>
        </div>
        <div className="space-y-2">
          <Label className="text-xs">Prescription photo</Label>
          <Input type="file" accept="image/*" onChange={(e)=> setImageFile(e.target.files?.[0] || null)} />
          <div className="flex gap-2">
            <Button onClick={runOCR} disabled={!imageFile || extracting} className="gap-2"><ImageIcon className="h-4 w-4"/>{extracting? 'Extracting…':'Run OCR'}</Button>
            <Button variant="outline" onClick={()=>{setOcrText(ocrText.trim());}}><RefreshCw className="h-4 w-4"/>Clean Text</Button>
          </div>
        </div>
        <div className="space-y-2">
          <Label className="text-xs">Extracted / pasted text</Label>
          <Textarea rows={8} value={ocrText} onChange={(e)=> setOcrText(e.target.value)} placeholder="Paste prescription text here if OCR is unclear…"/>
          <div className="flex gap-2">
            <Button onClick={doAnalyze} className="gap-2"><Bot className="h-4 w-4"/>Analyze</Button>
          </div>
        </div>
        <div className="text-xs text-muted-foreground flex items-start gap-2">
          <Info className="h-4 w-4"/> Tips: Ensure the photo is well-lit, flat, and readable. You can manually correct medicine names before analyzing.
        </div>
      </div>
    </div>
  );
}

function Assessments({ rows }: { rows: any[] }) {
  const [lmp, setLmp] = useState("");
  const [cycleLen, setCycleLen] = useState<number>(28);
  const [pregLmp, setPregLmp] = useState("");
  const [pcos, setPcos] = useState({ irregular: false, hair: false, acne: false, weight: false, family: false });
  const [h, setH] = useState<number | "">("");
  const [w, setW] = useState<number | "">("");
  const [hormLmp, setHormLmp] = useState("");
  const [hormCycle, setHormCycle] = useState<number>(28);
  const [breastNote, setBreastNote] = useState("");
  const [phq2, setPhq2] = useState({ interest: 0, down: 0 });
  const [diet, setDiet] = useState({ greenLeafy: false, pulses: false, vitaminC: false, meatFish: false, teaWithMeals: true });
  const [idx, setIdx] = useState(0);
  const current = rows[idx];
  const mNext = lmp ? addDays(parseISO(lmp), cycleLen) : null;
  const mFert = lmp ? fertileWindow(lmp, cycleLen) : { start: null as any, end: null as any };
  const dueDate = pregLmp ? addDays(parseISO(pregLmp), 280) : null;
  const bmiVal = h && w ? bmi(Number(h), Number(w)) : null;
  const bmiCat = bmiCategoryAsian(bmiVal as any);
  const today = new Date();
  const hormDay = hormLmp ? Math.max(1, differenceInDays(today, parseISO(hormLmp)) + 1) : null;
  const ovulationDay = Math.max(14, hormCycle - 14);
  const hormonePhase = hormDay == null ? "—" : hormDay < ovulationDay ? "Follicular (estrogen‑dom.)" : hormDay === ovulationDay ? "Ovulation (LH surge)" : "Luteal (progesterone‑dom.)";
  const pcosScore = [pcos.irregular, pcos.hair, pcos.acne, pcos.weight, pcos.family].filter(Boolean).length;
  const pcosRisk = pcosScore >= 4 ? "High" : pcosScore >= 2 ? "Moderate" : "Low";
  const phq2Total = phq2.interest + phq2.down;
  const phq2Flag = phq2Total >= 3 ? "Positive screen — consider PHQ‑9/pro help" : "Negative screen";
  const dietScore = (diet.greenLeafy?1:0)+(diet.pulses?1:0)+(diet.vitaminC?1:0)+(diet.meatFish?1:0)-(diet.teaWithMeals?1:0);
  const dietNote = dietScore >= 3 ? "Iron‑supportive" : dietScore >= 1 ? "OK" : "Needs improvement (iron absorption)";
  const chronicFlags = current ? { highBP: current.high_bp, anemia: current.anemia !== 'None' && current.anemia !== 'Unknown', bmiRisk: current.bmi_cat === 'Underweight' || current.bmi_cat === 'Obese' } : { highBP: false, anemia: false, bmiRisk: false };
  const chronicScore = (chronicFlags.highBP?2:0) + (chronicFlags.anemia?1:0) + (chronicFlags.bmiRisk?1:0);
  const chronicRisk = chronicScore >= 3 ? "High" : chronicScore === 2 ? "Moderate" : "Low";
  return (
    <div className="space-y-6">
      <Section title="Menstrual Tracker">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <div>
            <Label className="text-xs">Last period date</Label>
            <Input type="date" value={lmp} onChange={(e)=>setLmp(e.target.value)} />
          </div>
          <div>
            <Label className="text-xs">Average cycle length</Label>
            <Input type="number" value={cycleLen} onChange={(e)=>setCycleLen(Number(e.target.value||28))} />
          </div>
          <div className="md:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-3">
            <Readout label="Next period" value={mNext? format(mNext,'dd MMM yyyy'):'—'} />
            <Readout label="Fertile start" value={mFert.start? format(mFert.start,'dd MMM'): '—'} />
            <Readout label="Fertile end" value={mFert.end? format(mFert.end,'dd MMM'): '—'} />
          </div>
        </div>
      </Section>
      <Section title="Pregnancy Tracker (EDD)">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div>
            <Label className="text-xs">LMP (first day of last period)</Label>
            <Input type="date" value={pregLmp} onChange={(e)=>setPregLmp(e.target.value)} />
          </div>
          <Readout label="Estimated Due Date" value={dueDate? format(dueDate,'dd MMM yyyy'):'—'} />
          <Readout label="Gestation (approx)" value={pregLmp? `${Math.floor(differenceInDays(new Date(), parseISO(pregLmp))/7)} w`:'—'} />
        </div>
      </Section>
      <Section title="PCOS Assessment (informational)">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 items-end">
          {[
            {k:'irregular', label:'Irregular or absent periods'},
            {k:'hair', label:'Increased facial/body hair'},
            {k:'acne', label:'Persistent acne/oily skin'},
            {k:'weight', label:'Weight gain / difficulty losing'},
            {k:'family', label:'Family history of PCOS'}
          ].map((it)=> (
            <label key={it.k} className="flex items-center gap-2 text-sm"><input type="checkbox" checked={(pcos as any)[it.k]} onChange={(e)=>setPcos({...pcos, [it.k]: e.target.checked})}/> {it.label}</label>
          ))}
        </div>
        <div className="mt-2 text-sm">Score: {pcosScore} — <span className="font-medium">{pcosRisk} risk indicator</span></div>
      </Section>
      <Section title="BMI Calculator (Asian cut‑offs)">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
          <div>
            <Label className="text-xs">Height (cm)</Label>
            <Input type="number" value={h as any} onChange={(e)=>setH(e.target.value? Number(e.target.value):"")} />
          </div>
          <div>
            <Label className="text-xs">Weight (kg)</Label>
            <Input type="number" value={w as any} onChange={(e)=>setW(e.target.value? Number(e.target.value):"")} />
          </div>
          <Readout label="BMI" value={bmiVal ?? '—'} />
          <Readout label="Category" value={bmiCat} />
        </div>
      </Section>
      <Section title="Hormone Phase Estimator (cycle phase)">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
          <div>
            <Label className="text-xs">LMP</Label>
            <Input type="date" value={hormLmp} onChange={(e)=>setHormLmp(e.target.value)} />
          </div>
          <div>
            <Label className="text-xs">Cycle length</Label>
            <Input type="number" value={hormCycle} onChange={(e)=>setHormCycle(Number(e.target.value||28))} />
          </div>
          <Readout label="Cycle day" value={hormDay ?? '—'} />
          <Readout label="Likely phase" value={hormonePhase} />
        </div>
      </Section>
      <Section title="Breast Health Notes">
        <Textarea rows={3} value={breastNote} onChange={(e)=>setBreastNote(e.target.value)} placeholder="Add reminders/questions" />
      </Section>
      <Section title="Mental Wellness — PHQ‑2">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <PHQ2Question label="Little interest or pleasure in doing things" value={phq2.interest} onChange={(v)=>setPhq2({...phq2, interest:v})} />
          <PHQ2Question label="Feeling down, depressed, or hopeless" value={phq2.down} onChange={(v)=>setPhq2({...phq2, down:v})} />
        </div>
        <div className="mt-2 text-sm">Total: {phq2Total} — <span className="font-medium">{phq2Flag}</span></div>
      </Section>
      <Section title="Nutrition Wellness (iron support)">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 items-end">
          {[
            {k:'greenLeafy', label:'Green leafy veg (≥4x/week)'},
            {k:'pulses', label:'Pulses/lentils (≥4x/week)'},
            {k:'vitaminC', label:'Vitamin C with iron meals'},
            {k:'meatFish', label:'Meat/fish/eggs (any)'},
            {k:'teaWithMeals', label:'Tea/coffee with meals (reduces absorption)'}
          ].map((it)=> (
            <label key={it.k} className="flex items-center gap-2 text-sm"><input type="checkbox" checked={(diet as any)[it.k]} onChange={(e)=>setDiet({...diet, [it.k]: e.target.checked})}/> {it.label}</label>
          ))}
        </div>
        <div className="mt-2 text-sm">Summary: <span className="font-medium">{dietNote}</span></div>
      </Section>
      <Section title="Chronic Condition Risk (from records)">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
          <div>
            <Label className="text-xs">Select participant</Label>
            <Select value={String(idx)} onValueChange={(v)=>setIdx(Number(v))}>
              <SelectTrigger><SelectValue/></SelectTrigger>
              <SelectContent className="max-h-64">
                {rows.map((x,i)=>(<SelectItem key={x.id} value={String(i)}>{x.name} — {x.id}</SelectItem>))}
              </SelectContent>
            </Select>
          </div>
          <Readout label="High BP" value={chronicFlags.highBP? 'Yes':'No'} />
          <Readout label="Anemia" value={chronicFlags.anemia? 'Yes':'No'} />
          <Readout label="BMI risk" value={chronicFlags.bmiRisk? 'Yes':'No'} />
        </div>
        <div className="mt-2 text-sm">Overall risk: <span className="font-medium">{chronicRisk}</span></div>
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2 border rounded-lg p-3 bg-white">
      <h4 className="font-semibold">{title}</h4>
      {children}
    </div>
  );
}
function Readout({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="p-2 bg-rose-50 rounded border text-sm">
      <div className="text-[11px] uppercase text-muted-foreground">{label}</div>
      <div className="font-medium">{String(value)}</div>
    </div>
  );
}
function PHQ2Question({ label, value, onChange }:{ label:string; value:number; onChange:(v:number)=>void}){
  const name = React.useId();
  return (
    <div className="space-y-1">
      <div className="text-sm">{label}</div>
      <div className="flex gap-2 text-sm">
        {[0,1,2,3].map((v)=>(
          <label key={v} className="flex items-center gap-1 border rounded px-2 py-1">
            <input type="radio" name={name} checked={value===v} onChange={()=>onChange(v)} /> {['Not at all','Several days','> half the days','Nearly every day'][v]}
          </label>
        ))}
      </div>
    </div>
  );
}

function AdvancedTools(){
  const [tsh,setTSH]=React.useState<string>("");
  const [t3,setT3]=React.useState<string>("");
  const [t4,setT4]=React.useState<string>("");
  const tshN = Number(tsh), t3N = Number(t3), t4N = Number(t4);
  let thyroid = "—";
  if(Number.isFinite(tshN)||Number.isFinite(t3N)||Number.isFinite(t4N)){
    if(Number.isFinite(tshN)&&tshN>4.5 && Number.isFinite(t4N)&&t4N<4.5){ thyroid = "Hypothyroid (possible)"; }
    else if(Number.isFinite(tshN)&&tshN<0.4 && Number.isFinite(t4N)&&t4N>12){ thyroid = "Hyperthyroid (possible)"; }
    else if(Number.isFinite(tshN)&& (tshN>4.5 || tshN<0.4)) { thyroid = "Subclinical pattern (see doctor)"; }
    else { thyroid = "Normal (labs dependent)"; }
  }
  const [sun,setSun]=React.useState<number|"">("");
  const [calciumServ,setCalciumServ]=React.useState<number|"">("");
  const [boneFlags,setBoneFlags]=React.useState({bonePain:false, fractures:false});
  const boneScore = (Number(calciumServ)>=2?1:0) + (Number(sun)>=20?1:0) - (boneFlags.bonePain?1:0) - (boneFlags.fractures?1:0);
  const boneStatus = boneScore>=2?"Good": boneScore>=1?"OK": "Needs attention";
  const [age,setAge]=React.useState<number|"">("");
  const [waist,setWaist]=React.useState<number|"">("");
  const [fhx,setFhx]=React.useState<boolean>(false);
  const [randGlu,setRandGlu]=React.useState<number|"">("");
  const diabPts = (Number(age)>=35?10:0) + (Number(waist)>=80?10:0) + (fhx?10:0) + (Number(randGlu)>=200?20: Number(randGlu)>=140?10:0);
  const diabRisk = diabPts>=35?"High": diabPts>=20?"Moderate":"Low";
  const gluFlag = Number(randGlu)>=200?"Diabetes range (random) — confirm": Number(randGlu)>=140?"Impaired": Number(randGlu)>0?"Normal":"—";
  const [sleepH,setSleepH]=React.useState<number|"">("");
  const [sleepQ,setSleepQ]=React.useState<number>(3);
  const [screenH,setScreenH]=React.useState<number|"">("");
  const sleepNote = (Number(sleepH)>=7 && Number(sleepH)<=9 && sleepQ>=3 && Number(screenH)<=2)?"Healthy": "Improve sleep routine";
  const [gad, setGad] = React.useState({a:0,b:0});
  const gadTotal = gad.a + gad.b; const gadFlag = gadTotal>=3?"Positive screen":"Negative screen";
  const [bAge,setBAge]=React.useState<number|"">("");
  const [famBC,setFamBC]=React.useState<boolean>(false);
  const [lump,setLump]=React.useState<"no"|"yes"|"unsure">("no");
  const bcAdvice = (Number(bAge)>=40?"Consider mammography per local guideline. ":"") + (famBC?"Family history noted. ":"") + (lump!=='no'?"See clinician for evaluation.":"Self-exam monthly.");
  const [weightKg,setWeightKg]=React.useState<number|"">("");
  const waterLiters = Number(weightKg)? (Number(weightKg)*0.033).toFixed(2):"—";
  const [steps,setSteps]=React.useState<number>(8000);
  const [dietRem,setDietRem]=React.useState<string>("");
  const [medName,setMedName]=React.useState("");
  const [medTime,setMedTime]=React.useState("");
  function requestNotif(){ if('Notification' in window){ Notification.requestPermission(); } }
  function scheduleMed(){ if(!('Notification' in window)) { alert('Notifications not supported in this browser.'); return; } const now = new Date(); const [hh,mm] = medTime.split(":").map(Number); if(Number.isNaN(hh)||Number.isNaN(mm)) { alert('Pick a valid time'); return; } const target = new Date(); target.setHours(hh,mm,0,0); let ms = target.getTime()-now.getTime(); if(ms<0) ms += 24*60*60*1000; setTimeout(()=>{ if(Notification.permission==='granted'){ new Notification('Medication', { body: `Time for ${medName}` }); } }, ms); alert(`Reminder set for ${medName} at ${medTime}`); }
  const [exerciseMin,setExerciseMin]=React.useState<number|"">("");
  const [cycleReg,setCycleReg]=React.useState<"regular"|"irregular"|"na">("na");
  const lifestyle = (Number(sleepH)>=7 && Number(sleepH)<=9 ? 20:10) + (steps>=8000?20:10) + (gadTotal<=2?20:10) + (Number(exerciseMin)>=150?20:10) + (cycleReg==='regular'?20:10);
  const lifestyleNote = lifestyle>=80?"Great": lifestyle>=60?"Good":"Needs work";
  const [imm,setImm]=React.useState({hpv:false, ttdap:false, rubella:false});
  return (
    <div className="space-y-6">
      <Section title="Thyroid Assessment (TSH/T3/T4)">
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3 items-end">
          <div><Label className="text-xs">TSH (µIU/mL)</Label><Input value={tsh} onChange={(e)=>setTSH(e.target.value)} placeholder="e.g., 2.5"/></div>
          <div><Label className="text-xs">Free T3 (pg/mL)</Label><Input value={t3} onChange={(e)=>setT3(e.target.value)} placeholder="e.g., 3.2"/></div>
          <div><Label className="text-xs">Free T4 (µg/dL)</Label><Input value={t4} onChange={(e)=>setT4(e.target.value)} placeholder="e.g., 8.5"/></div>
          <Readout label="Assessment" value={thyroid} />
        </div>
      </Section>
      <Section title="Bone Health (Vitamin D & Calcium)">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 items-end">
          <div><Label className="text-xs">Sun exposure (min/day)</Label><Input type="number" value={sun as any} onChange={(e)=>setSun(Number(e.target.value||0))}/></div>
          <div><Label className="text-xs">Calcium servings/day</Label><Input type="number" value={calciumServ as any} onChange={(e)=>setCalciumServ(Number(e.target.value||0))}/></div>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={boneFlags.bonePain} onChange={(e)=>setBoneFlags({...boneFlags,bonePain:e.target.checked})}/> Bone pain</label>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={boneFlags.fractures} onChange={(e)=>setBoneFlags({...boneFlags,fractures:e.target.checked})}/> Prior fractures</label>
          <Readout label="Status" value={boneStatus} />
        </div>
      </Section>
      <Section title="Diabetes Risk (India‑oriented quick check)">
        <div className="grid grid-cols-1 md:grid-cols-6 gap-3 items-end">
          <div><Label className="text-xs">Age (years)</Label><Input type="number" value={age as any} onChange={(e)=>setAge(Number(e.target.value||0))}/></div>
          <div><Label className="text-xs">Waist (cm)</Label><Input type="number" value={waist as any} onChange={(e)=>setWaist(Number(e.target.value||0))}/></div>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={fhx} onChange={(e)=>setFhx(e.target.checked)}/> Family history</label>
          <div><Label className="text-xs">Random glucose (mg/dL)</Label><Input type="number" value={randGlu as any} onChange={(e)=>setRandGlu(Number(e.target.value||0))}/></div>
          <Readout label="Risk" value={diabRisk} />
          <Readout label="Glucose" value={gluFlag} />
        </div>
      </Section>
      <Section title="Sleep Wellness">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 items-end">
          <div><Label className="text-xs">Sleep hours</Label><Input type="number" value={sleepH as any} onChange={(e)=>setSleepH(Number(e.target.value||0))}/></div>
          <div><Label className="text-xs">Sleep quality (1–5)</Label><Input type="number" value={sleepQ as any} onChange={(e)=>setSleepQ(Math.min(5,Math.max(1,Number(e.target.value||3))))}/></div>
          <div><Label className="text-xs">Screen time before bed (h)</Label><Input type="number" value={screenH as any} onChange={(e)=>setScreenH(Number(e.target.value||0))}/></div>
          <Readout label="Status" value={sleepNote} />
        </div>
      </Section>
      <Section title="Stress & Anxiety (GAD‑2)">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <PHQ2Question label="Feeling nervous, anxious, or on edge" value={gad.a} onChange={(v)=>setGad({...gad,a:v})} />
          <PHQ2Question label="Not being able to stop or control worrying" value={gad.b} onChange={(v)=>setGad({...gad,b:v})} />
        </div>
        <div className="mt-2 text-sm">Total: {gadTotal} — <span className="font-medium">{gadFlag}</span></div>
      </Section>
      <Section title="Breast Cancer Screening Inputs">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 items-end">
          <div><Label className="text-xs">Age</Label><Input type="number" value={bAge as any} onChange={(e)=>setBAge(Number(e.target.value||0))}/></div>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={famBC} onChange={(e)=>setFamBC(e.target.checked)}/> Family history</label>
          <div>
            <Label className="text-xs">Self‑exam</Label>
            <Select value={lump} onValueChange={(v:any)=>setLump(v)}>
              <SelectTrigger><SelectValue placeholder="Result"/></SelectTrigger>
              <SelectContent>
                <SelectItem value="no">No lump felt</SelectItem>
                <SelectItem value="unsure">Unsure</SelectItem>
                <SelectItem value="yes">Lump/changes</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Readout label="Advice" value={bcAdvice} />
        </div>
      </Section>
      <Section title="Health Planner">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 items-end">
          <div><Label className="text-xs">Weight (kg)</Label><Input type="number" value={weightKg as any} onChange={(e)=>setWeightKg(Number(e.target.value||0))}/></div>
          <Readout label="Water/day" value={`${waterLiters} L`} />
          <div><Label className="text-xs">Step goal</Label><Input type="number" value={steps as any} onChange={(e)=>setSteps(Number(e.target.value||8000))}/></div>
          <div className="md:col-span-2"><Label className="text-xs">Diet notes/reminders</Label><Textarea rows={2} value={dietRem} onChange={(e)=>setDietRem(e.target.value)} placeholder="e.g., add 1 fruit, 2L water, iron-rich lunch"/></div>
        </div>
      </Section>
      <Section title="Medication Reminder (local notification)">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 items-end">
          <div><Label className="text-xs">Medicine</Label><Input value={medName} onChange={(e)=>setMedName(e.target.value)} placeholder="e.g., Ferrous 60mg"/></div>
          <div><Label className="text-xs">Time (24h)</Label><Input type="time" value={medTime} onChange={(e)=>setMedTime(e.target.value)} /></div>
          <Button variant="outline" onClick={requestNotif}>Allow notifications</Button>
          <Button onClick={scheduleMed}>Set reminder</Button>
        </div>
      </Section>
      <Section title="Lifestyle Health Score">
        <div className="grid grid-cols-1 md:grid-cols-6 gap-3 items-end">
          <div><Label className="text-xs">Exercise / week (min)</Label><Input type="number" value={exerciseMin as any} onChange={(e)=>setExerciseMin(Number(e.target.value||0))}/></div>
          <div>
            <Label className="text-xs">Cycle regularity</Label>
            <Select value={cycleReg} onValueChange={(v:any)=>setCycleReg(v)}>
              <SelectTrigger><SelectValue/></SelectTrigger>
              <SelectContent>
                <SelectItem value="na">N/A</SelectItem>
                <SelectItem value="regular">Regular</SelectItem>
                <SelectItem value="irregular">Irregular</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Readout label="Score /100" value={lifestyle} />
          <Readout label="Summary" value={lifestyleNote} />
        </div>
      </Section>
      <Section title="Immunization / Vaccination Tracker">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 items-end">
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={imm.hpv} onChange={(e)=>setImm({...imm,hpv:e.target.checked})}/> HPV</label>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={imm.ttdap} onChange={(e)=>setImm({...imm,ttdap:e.target.checked})}/> TT/Tdap</label>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={imm.rubella} onChange={(e)=>setImm({...imm,rubella:e.target.checked})}/> Rubella</label>
          <Readout label="Status" value={`${imm.hpv?'HPV ✓':'HPV ×'}, ${imm.ttdap?'TT/Tdap ✓':'TT/Tdap ×'}, ${imm.rubella?'Rubella ✓':'Rubella ×'}`} />
        </div>
      </Section>
    </div>
  );
}
