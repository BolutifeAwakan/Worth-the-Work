import { useState, useRef, useCallback } from "react";

const AI_PROXY_URL = '/api/ai';

const _s = document.createElement("style");
_s.textContent = `
  @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500&display=swap');
  *{box-sizing:border-box;margin:0;padding:0;-webkit-tap-highlight-color:transparent}
  html,body{height:100%;overflow:hidden}
  input[type=range]{-webkit-appearance:none;appearance:none;height:2px;border-radius:1px;outline:none;cursor:pointer;width:100%}
  input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:22px;height:22px;border-radius:50%;cursor:pointer;transition:transform .15s}
  input[type=range]::-webkit-slider-thumb:hover{transform:scale(1.15)}
  input[type=range]::-moz-range-thumb{width:22px;height:22px;border-radius:50%;cursor:pointer}
  ::-webkit-scrollbar{width:3px}::-webkit-scrollbar-thumb{border-radius:2px}
  @media print{.noprint{display:none!important}}
`;
document.head.appendChild(_s);

const DARK = {
  bg:"#0D0D0B", bg2:"#161614", bg3:"#1F1F1C",
  line:"#2C2C28", line2:"#3C3C38", line3:"#4C4C48",
  text:"#EDEAE2", muted:"#888880", faint:"#3E3E3A",
  gold:"#C9A84C", gold2:"#DDB95E", gp:"rgba(201,168,76,.09)",
  passT:"#A8D890", warnT:"#E8C060", failT:"#E87070",
  slider:"#3C3C38", sliderThumb:"#0D0D0B",
};
const LIGHT = {
  bg:"#F5F3EE", bg2:"#EEEAE4", bg3:"#E6E2DA",
  line:"#D0CCC2", line2:"#C0BBB0", line3:"#A8A29A",
  text:"#111110", muted:"#666660", faint:"#C8C4BC",
  gold:"#8C6D22", gold2:"#A07D30", gp:"rgba(140,109,34,.09)",
  passT:"#2A5A15", warnT:"#6A4800", failT:"#7A1515",
  slider:"#C0BBB0", sliderThumb:"#F5F3EE",
};

const PROGRESS = [0,3,6,9,12,15,18,32,48,56,63,70,78,86,100];

const QS = [
  {k:"name",      label:"What should I call you?",     ph:"Your name",              type:"text"},
  {k:"business",  label:"And your business?",          ph:"Business or studio name",type:"text",opt:true},
  {k:"role",      label:"How do you work?",            type:"chips",opts:["Solo designer","Small studio","Agency","In-house"]},
  {k:"exp",       label:"Years in practice?",          type:"chips",opts:["1 to 3 years","4 to 7 years","8 or more years"]},
  {k:"discipline",label:"Your main discipline?",       type:"chips",opts:["Brand and identity","Product and UX","Campaign and print","Motion and digital","Multi-disciplinary"]},
  {k:"city",      label:"Where are you based?",        type:"chips",opts:["Lagos","Abuja","Accra","Nairobi","Johannesburg","Another city"]},
];

const DLV = {
  brand:   ["Brand strategy","Logo system","Colour and typography","Brand guidelines","Collateral templates"],
  product: ["UX audit","User flow redesign","UI design","Design system","Engineering handover"],
  campaign:["Creative strategy","Key visual development","Social media assets","OOH and print","Activation guide"],
  motion:  ["Motion style frames","Animation production","Title and transition design","Final export"],
  web:     ["Information architecture","Wireframes","Visual design","Component library","Developer handover"],
};
const DKW = {
  brand:   ["brand","logo","identity","rebrand","guidelines"],
  product: ["product","app","ux","ui","dashboard","saas","platform","flow"],
  campaign:["campaign","launch","ooh","social","advert","flyer","poster"],
  motion:  ["motion","animation","video","reel","explainer"],
  web:     ["website","web","landing","ecommerce","portfolio"],
};
function detectDlvr(brief) {
  const b = brief.toLowerCase();
  const found = [];
  for (const [k,kws] of Object.entries(DKW)) {
    if (kws.some(w => b.includes(w))) found.push(...DLV[k]);
  }
  return [...new Set(found)];
}

const DIMS = [
  ["Revenue impact",        "Will this directly affect their sales, fundraising, or ability to win customers?"],
  ["Risk of failure",       "What does poor execution cost their business — financially or reputationally?"],
  ["Strategic importance",  "Is this central to what they are building, or a peripheral nice-to-have?"],
  ["Client stage",          "Are they early-stage and budget-cautious, or funded and actively growing?"],
  ["Your unique fit",       "Do you have specific experience, results, or strong portfolio depth in this area?"],
];

const fmt = n => Math.round(n).toLocaleString("en-NG");
const pn  = s => parseFloat((""+s).replace(/[^0-9.]/g,"")) || 0;

const SunIco  = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="2" x2="12" y2="4"/><line x1="12" y1="20" x2="12" y2="22"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="2" y1="12" x2="4" y2="12"/><line x1="20" y1="12" x2="22" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>;
const MoonIco = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>;
const StarIco = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>;

// Number input: click selects all so you can type immediately
function Num({ value, onChange, placeholder, large, prefix, c }) {
  const [raw, setRaw]     = useState("");
  const [on,  setOn]      = useState(false);
  const ref = useRef();
  return (
    <div style={{ display:"flex", alignItems:"baseline", gap:4 }}>
      {prefix && <span style={{ fontFamily:"'Instrument Serif',serif", fontSize:large?20:14, color:c.muted, flexShrink:0 }}>{prefix}</span>}
      <input ref={ref} type="text" inputMode="numeric"
        value={on ? raw : (value > 0 ? fmt(value) : "")}
        placeholder={placeholder || "0"}
        onFocus={() => { setOn(true); setRaw(value > 0 ? String(value) : ""); setTimeout(() => ref.current?.select(), 0); }}
        onBlur={() => { setOn(false); onChange(pn(raw)); }}
        onChange={e => setRaw(e.target.value)}
        style={{ display:"block", width:"100%", background:"none", border:"none",
          borderBottom:`1px solid ${on ? c.gold : c.line2}`,
          padding:"8px 0 12px", outline:"none", transition:"border-color .2s",
          fontFamily: large ? "'Instrument Serif',serif" : "'DM Sans',sans-serif",
          fontSize: large ? 30 : 16, color:c.text }}
      />
    </div>
  );
}

// Inline number for rows
function InNum({ value, onChange, width=90, suffix, c }) {
  const [raw, setRaw] = useState("");
  const [on,  setOn]  = useState(false);
  const ref = useRef();
  return (
    <div style={{ display:"flex", alignItems:"center", gap:4 }}>
      <input ref={ref} type="text" inputMode="numeric"
        value={on ? raw : (value > 0 ? fmt(value) : "")}
        placeholder="0"
        onFocus={() => { setOn(true); setRaw(value > 0 ? String(value) : ""); setTimeout(() => ref.current?.select(), 0); }}
        onBlur={() => { setOn(false); onChange(pn(raw)); }}
        onChange={e => setRaw(e.target.value)}
        style={{ width, textAlign:"right", background:"none", border:"none",
          borderBottom:`1px solid ${on ? c.gold : c.line2}`,
          padding:"2px 0", outline:"none", fontFamily:"'DM Sans',sans-serif",
          fontSize:14, color: on ? c.gold : c.text, transition:"color .15s, border-color .15s" }}
      />
      {suffix && <span style={{ fontSize:12, color:c.faint }}>{suffix}</span>}
    </div>
  );
}

function Row({ name, onName, value, onChange, prefix, suffix, onDel, c }) {
  return (
    <div style={{ display:"grid", gridTemplateColumns:"1fr auto 28px", alignItems:"center",
      gap:12, padding:"12px 8px", borderBottom:`1px solid ${c.line}`, borderRadius:4,
      cursor:"default" }}>
      <input value={name} onChange={e => onName(e.target.value)} placeholder="Label"
        style={{ background:"none", border:"none", outline:"none",
          fontFamily:"'DM Sans',sans-serif", fontSize:14, color:c.text,
          borderBottom:"1px solid transparent", padding:"2px 0", transition:"border-color .2s" }}
        onFocus={e => e.target.style.borderBottomColor = c.gold}
        onBlur={e => e.target.style.borderBottomColor = "transparent"}
      />
      <div style={{ display:"flex", alignItems:"center", gap:4 }}>
        {prefix && <span style={{ fontSize:12, color:c.muted }}>{prefix}</span>}
        <InNum value={value} onChange={onChange} suffix={suffix} c={c} />
      </div>
      <button onClick={onDel}
        style={{ background:"none", border:"none", cursor:"pointer",
          fontSize:16, color:c.faint, lineHeight:1, padding:4, transition:"color .15s" }}
        onMouseEnter={e => e.target.style.color = "#E87070"}
        onMouseLeave={e => e.target.style.color = c.faint}
      >×</button>
    </div>
  );
}

function Add({ label, onClick, c }) {
  const [hov, setHov] = useState(false);
  return (
    <button onClick={onClick} onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
      style={{ display:"flex", alignItems:"center", gap:8, padding:"11px 8px",
        color: hov ? c.gold : c.muted, fontSize:13, fontFamily:"'DM Sans',sans-serif",
        cursor:"pointer", border:"none", background:"none", width:"100%",
        textAlign:"left", transition:"color .15s" }}>
      <span style={{ width:20, height:20, borderRadius:"50%",
        border:`1px solid ${hov ? c.gold : c.muted}`,
        display:"flex", alignItems:"center", justifyContent:"center",
        fontSize:14, lineHeight:1, flexShrink:0, transition:"border-color .15s" }}>+</span>
      {label}
    </button>
  );
}

function Btn({ children, primary, ghost, onClick, disabled, c }) {
  const [hov, setHov] = useState(false);
  return (
    <button onClick={onClick} disabled={disabled}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ display:"inline-flex", alignItems:"center", gap:8, padding:"11px 26px",
        borderRadius:40, fontSize:14, fontFamily:"'DM Sans',sans-serif",
        fontWeight: primary ? 500 : 400,
        cursor: disabled ? "default" : "pointer", opacity: disabled ? .5 : 1,
        border:`1px solid ${primary ? (hov ? c.gold2 : c.gold) : ghost ? "transparent" : (hov ? c.text : c.line2)}`,
        background: primary ? (hov ? c.gold2 : c.gold) : "none",
        color: primary ? "#0D0D0B" : ghost ? (hov ? c.text : c.muted) : c.text,
        transition:"all .2s", whiteSpace:"nowrap" }}>
      {children}
    </button>
  );
}

const HR    = ({c}) => <div style={{ height:1, background:c.line, margin:"24px 0" }}/>;
const Kick  = ({t,c}) => <div style={{ fontSize:11, letterSpacing:".14em", textTransform:"uppercase", color:c.muted, marginBottom:10 }}>{t}</div>;
const Title = ({children, size=34}) => <div style={{ fontFamily:"'Instrument Serif',serif", fontSize:size, lineHeight:1.2, marginBottom:8 }}>{children}</div>;
const Sub   = ({children, c}) => <div style={{ fontSize:14, color:c.muted, lineHeight:1.75, marginBottom:32, maxWidth:480 }}>{children}</div>;
const BRow  = ({children}) => <div style={{ display:"flex", gap:12, marginTop:36, flexWrap:"wrap" }}>{children}</div>;

export default function App() {
  const [theme, setTheme] = useState("dark");
  const c = theme === "dark" ? DARK : LIGHT;

  const [si,   setSi]   = useState(0);
  const [prev, setPrev] = useState(-1);
  const [dir,  setDir]  = useState(1);
  function go(n) {
    if (n === si) return;
    setDir(n > si ? 1 : -1);
    setPrev(si);
    setSi(n);
  }

  const [prof,  setProf]  = useState({name:"",business:"",role:"",exp:"",discipline:"",city:""});
  const [income,  setIncome]  = useState(0);
  const [billHrs, setBillHrs] = useState(0);
  const [chosen,  setChosen]  = useState(0);

  const idc = useRef(30);
  const [costs, setCosts] = useState([
    {id:1, name:"Power (electricity + generator)", amount:65000},
    {id:2, name:"Internet and data",               amount:50000},
    {id:3, name:"Software and tools",              amount:180000},
    {id:4, name:"Transport and client meetings",   amount:80000},
    {id:5, name:"Professional development",        amount:25000},
    {id:6, name:"Business administration",         amount:20000},
  ]);

  const [brief,    setBrief]  = useState("");
  const [dlvr,     setDlvr]   = useState([]);
  const [timeRows, setTime]   = useState([
    {id:1, name:"Design and delivery",    hours:50},
    {id:2, name:"Strategy and discovery", hours:12},
    {id:3, name:"Client management",      hours:10},
    {id:4, name:"Proposal and scoping",   hours:8},
  ]);
  const [hardRows, setHard]   = useState([{id:1, name:"Hard costs (stock, fonts, tools, proofs)", amount:50000}]);
  const [weeks,    setWeeks]  = useState(6);
  const [scores,   setScores] = useState([3,3,3,3,3]);
  const [fx,       setFx]     = useState(0);
  const [urgency,  setUrg]    = useState(0);
  const [discount, setDisc]   = useState(0);

  const [tier,  setTier]  = useState("growth");
  const [bkdn,  setBkdn]  = useState(false);

  const [aiUn,    setAiUn]    = useState(false);
  const [aiOpen,  setAiOpen]  = useState(false);
  const [aiKey,   setAiKey]   = useState(() => { try { return localStorage.getItem("wtw_k")||""; } catch { return ""; } });
  const [aiMsgs,  setAiMsgs]  = useState([]);
  const [aiLoad,  setAiLoad]  = useState(false);
  const aiKRef = useRef();
  const aiTRef = useRef();

  const ops  = costs.reduce((s,c2) => s + (+c2.amount||0), 0);
  const sug  = income && billHrs ? Math.ceil(((income/billHrs)+(ops/billHrs))/500)*500 : 0;
  const rate = chosen || sug || 22000;

  const R = useCallback(() => {
    const hrs   = timeRows.reduce((s,t)  => s + (+t.hours||0), 0);
    const hard  = hardRows.reduce((s,h)  => s + (+h.amount||0), 0);
    const infra = ops * (weeks/4.33);
    const cor   = hrs*rate + hard + infra;
    const cont  = income > 0 ? income/3 : 800000;
    const floor = cor + cont;
    const minP  = floor / 0.5;
    const sc    = scores.reduce((s,v) => s+v, 0);
    const mult  = sc<=10 ? 1.0 : sc<=18 ? 1.1+(sc-11)*(0.2/7) : 1.4+(sc-19)*(0.6/6);
    const pre   = minP * mult;
    const ctx   = (1+fx/100)*(1+urgency/100)*(1-discount/100);
    const fin   = pre * ctx;
    const marg  = (fin-floor)/fin;
    return {hrs, hard, infra, cor, cont, floor, minP, sc, mult, pre, fin, marg};
  }, [timeRows, hardRows, ops, weeks, rate, income, scores, fx, urgency, discount]);

  const r  = R();
  const ps = r.marg >= 0.48 ? "pass" : r.marg >= 0.40 ? "warn" : "fail";
  const pt = ps==="pass" ? "Passes the Good Revenue Test" : ps==="warn" ? "Close to your floor" : "Fails the Good Revenue Test";
  const pc = ps==="pass" ? c.passT : ps==="warn" ? c.warnT : c.failT;

  function buildSys() {
    return `You are the intelligence layer inside Worth the Work, a pricing tool for African designers created by Bolutife Awakan.
User: ${prof.name||"Unknown"}, ${prof.business||""}, ${prof.role}, ${prof.exp}, ${prof.discipline}, ${prof.city}
Income target: ₦${fmt(income)}/month, ${billHrs} billable hrs/month, rate: ₦${fmt(rate)}/hr
Monthly ops: ₦${fmt(ops)} — ${costs.map(x=>x.name+": ₦"+fmt(x.amount)).join(", ")}
Project: ${brief||"Not described"} | Deliverables: ${dlvr.join(", ")||"none"}
Time: ${timeRows.map(t=>t.name+" "+t.hours+"hrs").join(", ")}
Value score: ${r.sc}/25, mult ${r.mult.toFixed(2)}x | Floor: ₦${fmt(r.floor)} | Final: ₦${fmt(r.fin)} | Margin: ${Math.round(r.marg*100)}%
GRT: ${ps.toUpperCase()} | ~₦1,500=$1 USD, ~₦1,900=£1
Be direct, warm, specific to these real numbers. Never generic. Under 180 words. Sound like Bolutife, not a corporate AI.`;
  }

  async function ask(q) {
    if (!q.trim()) return;
    const msgs = [...aiMsgs, {role:"user", content:q}];
    setAiMsgs(msgs); setAiLoad(true);
    try {
      let reply = "";
      if (AI_PROXY_URL) {
        const res = await fetch(AI_PROXY_URL, { method:"POST",
          headers:{"Content-Type":"application/json"},
          body:JSON.stringify({messages:msgs.map(m=>({role:m.role,content:m.content})), systemPrompt:buildSys()}) });
        reply = (await res.json()).reply || "Something went wrong.";
      } else {
        const res = await fetch("https://api.anthropic.com/v1/messages", { method:"POST",
          headers:{"Content-Type":"application/json","x-api-key":aiKey,"anthropic-version":"2023-06-01"},
          body:JSON.stringify({model:"claude-sonnet-4-6",max_tokens:400,system:buildSys(),messages:msgs.map(m=>({role:m.role,content:m.content}))}) });
        reply = (await res.json()).content?.[0]?.text || "Something went wrong.";
      }
      setAiMsgs(m => [...m, {role:"assistant", content:reply}]);
    } catch { setAiMsgs(m => [...m, {role:"assistant", content:"Could not reach the AI. Check your connection."}]); }
    setAiLoad(false);
  }

  const ss = idx => ({
    position:"absolute", inset:0, overflowY:"auto", overflowX:"hidden",
    WebkitOverflowScrolling:"touch", padding:"52px 24px 80px",
    transform: idx===si ? "translateX(0)" : idx===prev ? `translateX(${-dir*22}%)` : `translateX(${dir>0?100:-100}%)`,
    opacity: idx===si ? 1 : 0,
    transition:"transform .42s cubic-bezier(.4,0,.2,1), opacity .42s",
    pointerEvents: idx===si ? "auto" : "none", willChange:"transform,opacity",
    background:c.bg, color:c.text,
  });

  const inn = {maxWidth:560, margin:"0 auto"};
  const dlvS = detectDlvr(brief);

  const tiers = [
    {k:"foundation", label:"Foundation", price:r.fin*0.72,  sub:"Tighter scope"},
    {k:"growth",     label:"Growth",     price:r.fin,        sub:"Recommended"},
    {k:"partnership",label:"Partnership",price:r.fin*1.55,   sub:"Extended scope"},
  ];

  // Slider style injected per render since it depends on theme
  const sliderStyle = {
    background: c.slider,
    accentColor: c.gold,
  };

  return (
    <div style={{ fontFamily:"'DM Sans',sans-serif", height:"100vh", display:"flex",
      flexDirection:"column", overflow:"hidden", position:"relative",
      background:c.bg, color:c.text, transition:"background .3s, color .3s" }}>

      {/* HEADER */}
      <div className="noprint" style={{ position:"relative", zIndex:100, display:"flex",
        alignItems:"center", justifyContent:"space-between", padding:"0 24px",
        height:52, borderBottom:`1px solid ${c.line}`, background:c.bg, flexShrink:0 }}>
        <div style={{ fontFamily:"'Instrument Serif',serif", fontSize:15, letterSpacing:".04em", opacity:.7 }}>Worth the Work</div>
        <div style={{ display:"flex", gap:8 }}>
          <button onClick={() => setTheme(t => t==="dark"?"light":"dark")}
            style={{ width:34, height:34, borderRadius:"50%", background:"none",
              border:`1px solid ${c.line2}`, display:"flex", alignItems:"center",
              justifyContent:"center", cursor:"pointer", color:c.muted, transition:"all .2s" }}
            onMouseEnter={e => { e.currentTarget.style.borderColor=c.gold; e.currentTarget.style.color=c.gold; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor=c.line2; e.currentTarget.style.color=c.muted; }}>
            {theme==="dark" ? <SunIco/> : <MoonIco/>}
          </button>
          {aiUn && (
            <button onClick={() => setAiOpen(o=>!o)}
              style={{ height:34, padding:"0 12px", borderRadius:20,
                background: aiOpen ? c.gp : "none",
                border:`1px solid ${aiOpen ? c.gold : c.line2}`,
                display:"flex", alignItems:"center", gap:6, cursor:"pointer",
                color: aiOpen ? c.gold : c.muted, fontSize:12,
                fontFamily:"'DM Sans',sans-serif", transition:"all .2s" }}
              onMouseEnter={e => { e.currentTarget.style.borderColor=c.gold; e.currentTarget.style.color=c.gold; }}
              onMouseLeave={e => { if(!aiOpen){ e.currentTarget.style.borderColor=c.line2; e.currentTarget.style.color=c.muted; } }}>
              <StarIco/><span>Intelligence</span>
              <span style={{ width:5, height:5, borderRadius:"50%", background:c.gold }}/>
            </button>
          )}
        </div>
      </div>

      {/* PROGRESS */}
      <div style={{ height:2, background:c.line, flexShrink:0, zIndex:99, position:"relative" }}>
        <div style={{ height:"100%", background:c.gold, width:PROGRESS[Math.min(si,PROGRESS.length-1)]+"%", transition:"width .5s cubic-bezier(.4,0,.2,1)" }}/>
      </div>

      {/* STAGE */}
      <div style={{ flex:1, position:"relative", overflow:"hidden" }}>

        {/* 0 WELCOME */}
        <div style={ss(0)}>
          <div style={{ ...inn, minHeight:"calc(100vh - 160px)", display:"flex", flexDirection:"column", justifyContent:"center" }}>
            <div style={{ fontSize:11, letterSpacing:".16em", textTransform:"uppercase", color:c.muted, marginBottom:18 }}>A pricing tool for designers in Africa</div>
            <div style={{ fontFamily:"'Instrument Serif',serif", fontSize:56, lineHeight:1.08, marginBottom:20 }}>Worth<br/>the Work</div>
            <div style={{ fontSize:15, color:c.muted, lineHeight:1.8, maxWidth:400, marginBottom:52 }}>Built on the framework from the guide. Get to a price grounded in your real costs, not what everyone else is charging.</div>
            <div><Btn primary c={c} onClick={() => go(1)}>Get started</Btn></div>
          </div>
        </div>

        {/* 1-6 ONBOARDING */}
        {QS.map((q,qi) => (
          <div key={q.k} style={ss(qi+1)}>
            <div style={inn}>
              <div style={{ display:"flex", gap:6, marginBottom:48 }}>
                {QS.map((_,i) => <div key={i} style={{ width:6, height:6, borderRadius:"50%",
                  background: i<qi ? c.line3 : i===qi ? c.gold : c.faint, transition:"background .3s" }}/>)}
              </div>
              <div style={{ fontFamily:"'Instrument Serif',serif", fontSize:42, lineHeight:1.15, marginBottom:32 }}>{q.label}</div>
              {q.type==="text" ? (
                <div>
                  <input key={qi} autoFocus defaultValue={prof[q.k]||""} placeholder={q.ph}
                    onChange={e => setProf(p=>({...p,[q.k]:e.target.value}))}
                    onKeyDown={e => { if(e.key==="Enter"){ const v=e.target.value.trim(); if(!v&&!q.opt) return; setProf(p=>({...p,[q.k]:v})); go(qi+2); }}}
                    style={{ display:"block", width:"100%", background:"none", border:"none",
                      borderBottom:`1px solid ${c.line2}`, padding:"8px 0 12px",
                      fontFamily:"'Instrument Serif',serif", fontSize:30, color:c.text,
                      outline:"none", transition:"border-color .2s" }}
                    onFocus={e => e.target.style.borderBottomColor=c.gold}
                    onBlur={e => e.target.style.borderBottomColor=c.line2}/>
                  {q.opt && <div style={{ fontSize:12, color:c.faint, marginTop:8 }}>Optional — press Enter to skip.</div>}
                </div>
              ) : (
                <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
                  {q.opts.map(o => (
                    <button key={o} onClick={() => { setProf(p=>({...p,[q.k]:o})); setTimeout(()=>go(qi+2),240); }}
                      style={{ padding:"10px 20px", borderRadius:40, fontSize:14, fontFamily:"'DM Sans',sans-serif",
                        border:`1px solid ${prof[q.k]===o ? c.gold : c.line2}`,
                        background: prof[q.k]===o ? c.gp : "none",
                        color: prof[q.k]===o ? c.gold : c.muted, cursor:"pointer", transition:"all .18s" }}>
                      {o}
                    </button>
                  ))}
                </div>
              )}
              <BRow>
                {qi>0 && <Btn ghost c={c} onClick={() => go(qi)}>Back</Btn>}
                <Btn primary c={c} onClick={() => { if(!prof[q.k]&&!q.opt) return; go(qi+2); }}>Continue</Btn>
              </BRow>
            </div>
          </div>
        ))}

        {/* 7 RATE */}
        <div style={ss(7)}>
          <div style={inn}>
            <Kick t="Step 1 of 3" c={c}/>
            <Title>Your hourly rate{prof.name?`, ${prof.name}`:""}</Title>
            <Sub c={c}>Your rate should come from what you need to earn, not what you saw someone else charge.</Sub>
            <div style={{ marginBottom:6, fontSize:15, fontWeight:500 }}>What do you want to earn each month?</div>
            <div style={{ fontSize:13, color:c.muted, marginBottom:12, lineHeight:1.5 }}>Your personal take-home target. Include rent, savings, food — what you genuinely want to earn, not what feels safe to say.</div>
            <Num value={income} onChange={setIncome} placeholder="e.g. 2,500,000" large prefix="₦" c={c}/>
            <div style={{ marginBottom:6, marginTop:28, fontSize:15, fontWeight:500 }}>How many hours of client work do you do each month?</div>
            <div style={{ fontSize:13, color:c.muted, marginBottom:12, lineHeight:1.5 }}>Count only hours on actual client deliverables — not email, not proposals, not admin. Most full-time designers deliver 80 to 120 billable hours per month.</div>
            <Num value={billHrs} onChange={setBillHrs} placeholder="e.g. 100" large c={c}/>
            {sug > 0 && (
              <div style={{ borderTop:`1px solid ${c.line}`, paddingTop:28, marginTop:28 }}>
                <div style={{ fontSize:11, letterSpacing:".12em", textTransform:"uppercase", color:c.muted, marginBottom:8 }}>Your calculated hourly rate</div>
                <div style={{ display:"flex", alignItems:"flex-start", marginBottom:10 }}>
                  <span style={{ fontFamily:"'Instrument Serif',serif", fontSize:22, color:c.muted, marginTop:6, marginRight:3 }}>₦</span>
                  <span style={{ fontFamily:"'Instrument Serif',serif", fontSize:52, lineHeight:1 }}>{fmt(chosen||sug)}</span>
                </div>
                <div style={{ fontSize:13, color:c.muted, lineHeight:1.65, maxWidth:460, marginBottom:20 }}>
                  Based on ₦{fmt(income)}/month across {billHrs} billable hours plus your operating costs. This is the minimum you need per hour to hit your goals.
                </div>
                <div style={{ display:"flex", justifyContent:"space-between", fontSize:12, color:c.muted, marginBottom:8 }}>
                  <span>Slide to override</span>
                  <span style={{ fontFamily:"'Instrument Serif',serif", fontSize:16, color:c.gold }}>₦{fmt(chosen||sug)}</span>
                </div>
                <input type="range" style={{ ...sliderStyle }}
                  min={Math.max(1000,Math.floor(sug*.4/500)*500)}
                  max={Math.ceil(sug*3.5/1000)*1000}
                  step={500} value={chosen||sug}
                  onChange={e => setChosen(+e.target.value)}/>
              </div>
            )}
            <BRow>
              <Btn ghost c={c} onClick={() => go(6)}>Back</Btn>
              <Btn primary c={c} onClick={() => go(8)} disabled={!income||!billHrs}>Continue</Btn>
            </BRow>
          </div>
        </div>

        {/* 8 COSTS */}
        <div style={ss(8)}>
          <div style={inn}>
            <Kick t="Step 2 of 3" c={c}/>
            <Title>Your monthly running costs</Title>
            <Sub c={c}>Pre-filled as a starting point. Click any number to edit it. Remove what does not apply, add anything missing.</Sub>
            <div style={{ borderTop:`1px solid ${c.line}` }}>
              {costs.map((item,i) => (
                <Row key={item.id} name={item.name} value={item.amount} prefix="₦" c={c}
                  onName={v => setCosts(cs=>cs.map((x,j)=>j===i?{...x,name:v}:x))}
                  onChange={v => setCosts(cs=>cs.map((x,j)=>j===i?{...x,amount:v}:x))}
                  onDel={() => setCosts(cs=>cs.filter(x=>x.id!==item.id))}/>
              ))}
            </div>
            <Add c={c} label="Add another cost" onClick={() => { idc.current++; setCosts(cs=>[...cs,{id:idc.current,name:"New cost",amount:0}]); }}/>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"baseline",
              padding:"18px 0 0", borderTop:`1px solid ${c.line}`, marginTop:4 }}>
              <span style={{ fontSize:11, letterSpacing:".1em", textTransform:"uppercase", color:c.muted }}>Monthly total</span>
              <span style={{ fontFamily:"'Instrument Serif',serif", fontSize:26 }}>₦{fmt(ops)}</span>
            </div>
            <div style={{ border:`1px solid ${c.gold}44`, borderRadius:6, padding:"14px 16px",
              marginTop:24, background:c.gp, fontSize:13, color:c.muted, lineHeight:1.6 }}>
              <strong style={{ color:c.gold, fontWeight:500 }}>Almost there.</strong> Once you continue the intelligence layer unlocks — the AI will know your real cost picture and can interpret your pricing, compare your rate globally, and help you prepare for client conversations.
            </div>
            <BRow>
              <Btn ghost c={c} onClick={() => go(7)}>Back</Btn>
              <Btn primary c={c} onClick={() => { setAiUn(true); go(9); }}>Continue to pricing</Btn>
            </BRow>
          </div>
        </div>

        {/* 9 BRIEF */}
        <div style={ss(9)}>
          <div style={inn}>
            <Kick t="Step 3 of 3 — Brief" c={c}/>
            <Title>Describe the project</Title>
            <Sub c={c}>A short description helps suggest the right deliverables and gives the intelligence layer context to interpret your price.</Sub>
            <div style={{ fontSize:11, letterSpacing:".12em", textTransform:"uppercase", color:c.muted, marginBottom:12 }}>The brief</div>
            <textarea value={brief} onChange={e => setBrief(e.target.value)} rows={3}
              placeholder="e.g. Full brand identity and website for a fintech startup closing Series A in Lagos..."
              style={{ display:"block", width:"100%", background:"none", border:"none",
                borderBottom:`1px solid ${c.line2}`, padding:"6px 0 10px",
                fontFamily:"'DM Sans',sans-serif", fontSize:15, color:c.text,
                outline:"none", resize:"none", lineHeight:1.65, transition:"border-color .2s" }}
              onFocus={e => e.target.style.borderBottomColor=c.gold}
              onBlur={e => e.target.style.borderBottomColor=c.line2}/>
            {dlvS.length > 0 && (
              <div style={{ marginTop:16 }}>
                <div style={{ fontSize:12, color:c.muted, marginBottom:10, lineHeight:1.5 }}>Suggested deliverables — select all that apply:</div>
                <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
                  {dlvS.map(d => (
                    <button key={d} onClick={() => setDlvr(ds=>ds.includes(d)?ds.filter(x=>x!==d):[...ds,d])}
                      style={{ padding:"8px 16px", borderRadius:20, fontSize:13, fontFamily:"'DM Sans',sans-serif",
                        border:`1px solid ${dlvr.includes(d) ? c.gold : c.line}`,
                        background: dlvr.includes(d) ? c.gp : "none",
                        color: dlvr.includes(d) ? c.gold : c.muted,
                        cursor:"pointer", transition:"all .15s" }}>{d}</button>
                  ))}
                </div>
              </div>
            )}
            <BRow>
              <Btn ghost c={c} onClick={() => go(8)}>Back</Btn>
              <Btn primary c={c} onClick={() => go(10)}>Next — Time</Btn>
            </BRow>
          </div>
        </div>

        {/* 10 TIME */}
        <div style={ss(10)}>
          <div style={inn}>
            <Kick t="Step 3 of 3 — Time" c={c}/>
            <Title>How many hours will this take?</Title>
            <Sub c={c}>Include every type of hour this project consumes — not just design time. Proposals, calls, and revisions are all real costs. Click any number to edit it.</Sub>
            <div style={{ borderTop:`1px solid ${c.line}` }}>
              {timeRows.map((item,i) => (
                <Row key={item.id} name={item.name} value={item.hours} suffix="hrs" c={c}
                  onName={v => setTime(ts=>ts.map((t,j)=>j===i?{...t,name:v}:t))}
                  onChange={v => setTime(ts=>ts.map((t,j)=>j===i?{...t,hours:v}:t))}
                  onDel={() => setTime(ts=>ts.filter(t=>t.id!==item.id))}/>
              ))}
            </div>
            <Add c={c} label="Add a time category" onClick={() => { idc.current++; setTime(ts=>[...ts,{id:idc.current,name:"Additional time",hours:0}]); }}/>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"baseline",
              padding:"16px 0 0", borderTop:`1px solid ${c.line}`, marginTop:4 }}>
              <span style={{ fontSize:12, color:c.muted }}>Total time cost at ₦{fmt(rate)}/hr</span>
              <span style={{ fontFamily:"'Instrument Serif',serif", fontSize:20 }}>₦{fmt(timeRows.reduce((s,t)=>s+(+t.hours||0),0)*rate)}</span>
            </div>
            <BRow>
              <Btn ghost c={c} onClick={() => go(9)}>Back</Btn>
              <Btn primary c={c} onClick={() => go(11)}>Next — Hard costs</Btn>
            </BRow>
          </div>
        </div>

        {/* 11 HARD + DURATION */}
        <div style={ss(11)}>
          <div style={inn}>
            <Kick t="Step 3 of 3 — Costs" c={c}/>
            <Title>Project costs and duration</Title>
            <Sub c={c}>Hard costs are project-specific expenses — font licences for the client, stock images, print proofs. Click any number to edit it.</Sub>
            <div style={{ borderTop:`1px solid ${c.line}` }}>
              {hardRows.map((item,i) => (
                <Row key={item.id} name={item.name} value={item.amount} prefix="₦" c={c}
                  onName={v => setHard(hs=>hs.map((h,j)=>j===i?{...h,name:v}:h))}
                  onChange={v => setHard(hs=>hs.map((h,j)=>j===i?{...h,amount:v}:h))}
                  onDel={() => setHard(hs=>hs.filter(h=>h.id!==item.id))}/>
              ))}
            </div>
            <Add c={c} label="Add a hard cost" onClick={() => { idc.current++; setHard(hs=>[...hs,{id:idc.current,name:"Additional cost",amount:0}]); }}/>
            <HR c={c}/>
            <div style={{ fontSize:15, fontWeight:500, marginBottom:6 }}>How many weeks will this project run?</div>
            <div style={{ fontSize:13, color:c.muted, marginBottom:16, lineHeight:1.5 }}>Used to calculate your infrastructure allocation — how much of your monthly power, internet, and software costs this project consumes.</div>
            <div style={{ display:"flex", alignItems:"center", gap:10 }}>
              <InNum value={weeks} onChange={setWeeks} width={60} c={c}/>
              <span style={{ fontSize:14, color:c.muted }}>weeks</span>
              <span style={{ fontSize:12, color:c.faint }}>= ₦{fmt(ops*(weeks/4.33))} infrastructure</span>
            </div>
            <HR c={c}/>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"baseline" }}>
              <span style={{ fontSize:11, letterSpacing:".1em", textTransform:"uppercase", color:c.muted }}>Total Cost of Revenue</span>
              <span style={{ fontFamily:"'Instrument Serif',serif", fontSize:24, color:c.gold }}>₦{fmt(r.cor)}</span>
            </div>
            <BRow>
              <Btn ghost c={c} onClick={() => go(10)}>Back</Btn>
              <Btn primary c={c} onClick={() => go(12)}>Next — Value</Btn>
            </BRow>
          </div>
        </div>

        {/* 12 VALUE */}
        <div style={ss(12)}>
          <div style={inn}>
            <Kick t="Step 3 of 3 — Value" c={c}/>
            <Title>How much does this project matter?</Title>
            <Sub c={c}>Your cost floor is the minimum. This determines how far above it the project's actual impact justifies going. Score honestly — 3 is average, not modest.</Sub>
            {DIMS.map(([dim,hint],i) => (
              <div key={i} style={{ marginBottom:24 }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:10, gap:12 }}>
                  <div>
                    <div style={{ fontSize:14, fontWeight:500, marginBottom:2 }}>{dim}</div>
                    <div style={{ fontSize:12, color:c.muted, lineHeight:1.45 }}>{hint}</div>
                  </div>
                  <span style={{ fontFamily:"'Instrument Serif',serif", fontSize:26, color:c.gold, flexShrink:0 }}>{scores[i]}</span>
                </div>
                <input type="range" min={1} max={5} step={1} value={scores[i]}
                  style={{ background:c.slider }}
                  onChange={e => setScores(ss2=>ss2.map((v,j)=>j===i?+e.target.value:v))}/>
              </div>
            ))}
            <div style={{ background:c.bg3, borderRadius:10, padding:18, marginTop:4 }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"baseline", marginBottom:8 }}>
                <span style={{ fontSize:11, letterSpacing:".1em", textTransform:"uppercase", color:c.muted }}>Value score</span>
                <span style={{ fontFamily:"'Instrument Serif',serif", fontSize:26 }}>{r.sc}<span style={{ fontSize:14, color:c.muted }}>/25</span></span>
              </div>
              <div style={{ height:3, background:c.line, borderRadius:2, overflow:"hidden", marginBottom:8 }}>
                <div style={{ height:"100%", background:c.gold, width:(r.sc/25*100)+"%", transition:"width .4s", borderRadius:2 }}/>
              </div>
              <div style={{ fontSize:12, color:c.muted, lineHeight:1.5 }}>
                {r.sc<=10?"Low stakes. Your cost floor is the right number.":r.sc<=18?"Real business impact. Price confidently above your floor.":"High stakes — this changes something significant for them. Price well above your floor."}
              </div>
            </div>
            <BRow>
              <Btn ghost c={c} onClick={() => go(11)}>Back</Btn>
              <Btn primary c={c} onClick={() => go(13)}>Next — Context</Btn>
            </BRow>
          </div>
        </div>

        {/* 13 CONTEXT */}
        <div style={ss(13)}>
          <div style={inn}>
            <Kick t="Step 3 of 3 — Context" c={c}/>
            <Title>Any situational factors?</Title>
            <Sub c={c}>All optional. Apply only what genuinely describes this project and this client. Leave everything at zero if none of them apply.</Sub>
            {[
              {key:"fx",   val:fx,       set:setFx,   max:35, label:"FX buffer",
               hint:"Use when the client earns or is funded in dollars, or when the project runs long enough that naira depreciation is a real risk. 15 to 25% is typical."},
              {key:"urg",  val:urgency,  set:setUrg,  max:60, label:"Urgency premium",
               hint:"Apply only when the timeline is genuinely compressed and you are blocking other work to deliver. 30 to 50% upward is accurate for real rush work."},
              {key:"disc", val:discount, set:setDisc, max:30, label:"Strategic discount",
               hint:"Use only when you have a specific, named reason — a new sector you need portfolio work in, a relationship worth the long-term bet. If you are discounting because you are afraid of losing the project, leave this at zero."},
            ].map(({key,val,set,max,label,hint}) => (
              <div key={key} style={{ marginBottom:28, paddingBottom:28, borderBottom:`1px solid ${c.line}` }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:6 }}>
                  <span style={{ fontSize:15, fontWeight:500 }}>{label}</span>
                  <span style={{ fontFamily:"'Instrument Serif',serif", fontSize:20, color:c.gold }}>{val}%</span>
                </div>
                <div style={{ fontSize:13, color:c.muted, lineHeight:1.6, marginBottom:12 }}>{hint}</div>
                <input type="range" min={0} max={max} step={5} value={val}
                  style={{ background:c.slider }}
                  onChange={e => set(+e.target.value)}/>
              </div>
            ))}
            <BRow>
              <Btn ghost c={c} onClick={() => go(12)}>Back</Btn>
              <Btn primary c={c} onClick={() => go(14)}>See my price</Btn>
            </BRow>
          </div>
        </div>

        {/* 14 RESULT */}
        <div style={ss(14)}>
          <div style={inn}>
            <div style={{ fontSize:11, letterSpacing:".14em", textTransform:"uppercase", color:c.muted, marginBottom:6 }}>Your result</div>
            <div style={{ fontFamily:"'Instrument Serif',serif", fontSize:18, color:c.muted, fontStyle:"italic", marginBottom:6 }}>
              {prof.name ? `${prof.name}, here is your price` : "Here is your price"}
            </div>
            <div style={{ display:"flex", alignItems:"flex-start", marginBottom:6 }}>
              <span style={{ fontFamily:"'Instrument Serif',serif", fontSize:26, color:c.muted, marginTop:8, marginRight:2 }}>₦</span>
              <span style={{ fontFamily:"'Instrument Serif',serif", fontSize:62, lineHeight:1, letterSpacing:"-.02em" }}>{fmt(r.fin)}</span>
            </div>
            <div style={{ fontSize:12, color:c.muted, marginBottom:28 }}>
              Margin {Math.round(r.marg*100)}% · Score {r.sc}/25 · Multiplier {r.mult.toFixed(2)}x
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:8, marginBottom:20 }}>
              {tiers.map(t => (
                <div key={t.k} onClick={() => setTier(t.k)}
                  style={{ border:`1px solid ${t.k==="growth"||tier===t.k ? c.gold : c.line2}`,
                    borderRadius:6, padding:"14px 10px", textAlign:"center", cursor:"pointer",
                    background: tier===t.k ? c.gp : "none", transition:"all .2s" }}>
                  <div style={{ fontSize:10, letterSpacing:".12em", textTransform:"uppercase", color:c.muted, marginBottom:6 }}>{t.label}</div>
                  <div style={{ fontFamily:"'Instrument Serif',serif", fontSize:14, wordBreak:"break-all" }}>₦{fmt(t.price)}</div>
                  <div style={{ fontSize:10, color:t.k==="growth"?c.gold:c.muted, marginTop:3 }}>{t.sub}</div>
                </div>
              ))}
            </div>
            <div style={{ display:"flex", alignItems:"center", gap:8, padding:"12px 0",
              borderTop:`1px solid ${c.line}`, borderBottom:`1px solid ${c.line}`, marginBottom:20 }}>
              <div style={{ width:7, height:7, borderRadius:"50%", background:pc, flexShrink:0 }}/>
              <span style={{ fontSize:13, color:pc }}>{pt}</span>
              <span style={{ color:c.muted, fontSize:12, marginLeft:"auto" }}>{Math.round(r.marg*100)}% margin</span>
            </div>
            <button onClick={() => setBkdn(o=>!o)}
              style={{ display:"flex", justifyContent:"space-between", alignItems:"center", width:"100%",
                padding:"11px 0", fontSize:13, color:c.muted, background:"none", border:"none",
                borderBottom:`1px solid ${c.line}`, cursor:"pointer", fontFamily:"'DM Sans',sans-serif",
                transition:"color .15s" }}
              onMouseEnter={e => e.currentTarget.style.color=c.text}
              onMouseLeave={e => e.currentTarget.style.color=c.muted}>
              Full breakdown
              <span style={{ fontSize:10, display:"inline-block", transition:"transform .25s", transform:bkdn?"rotate(180deg)":"none" }}>▾</span>
            </button>
            <div style={{ maxHeight:bkdn?600:0, overflow:"hidden", transition:"max-height .35s cubic-bezier(.4,0,.2,1)" }}>
              {[
                ["Time cost ("+timeRows.reduce((s,t)=>s+(+t.hours||0),0)+" hrs × ₦"+fmt(rate)+")", timeRows.reduce((s,t)=>s+(+t.hours||0),0)*rate, false],
                ["Hard costs",      r.hard,  false],
                ["Infrastructure",  r.infra, false],
                ["Total COR",       r.cor,   true],
                ["Income contribution",r.cont,false],
                ["Cost Floor",      r.floor, true],
                ["Min price (50% margin)", r.minP, false],
                ["After value premium ("+r.mult.toFixed(2)+"x)", r.pre, false],
                ["Final price",     r.fin,   true],
              ].map(([k,v,major]) => (
                <div key={k} style={{ display:"flex", justifyContent:"space-between", padding:"7px 0",
                  borderBottom:`1px solid ${c.line}`, fontSize:13 }}>
                  <span style={{ color: major ? c.text : c.muted }}>{k}</span>
                  <span style={{ fontWeight:500, color: major ? c.gold : c.text }}>₦{fmt(v)}</span>
                </div>
              ))}
            </div>
            {aiUn && (
              <div onClick={() => setAiOpen(true)}
                style={{ border:`1px solid ${c.gold}44`, borderRadius:6, padding:"14px 16px",
                  marginTop:20, cursor:"pointer", background:c.gp, transition:"border-color .2s" }}
                onMouseEnter={e => e.currentTarget.style.borderColor=c.gold}
                onMouseLeave={e => e.currentTarget.style.borderColor=c.gold+"44"}>
                <div style={{ fontSize:13, color:c.gold, fontWeight:500, marginBottom:4, display:"flex", alignItems:"center", gap:6 }}><StarIco/> Ask the intelligence</div>
                <div style={{ fontSize:12, color:c.muted, lineHeight:1.6 }}>The AI knows your full cost picture, your rate, and this project. Ask how your price compares globally, what to say to the client, or anything else.</div>
              </div>
            )}
            <BRow>
              <Btn ghost c={c} onClick={() => go(13)}>Adjust</Btn>
              <Btn ghost c={c} onClick={() => { setBrief(""); setDlvr([]); setTime([{id:1,name:"Design and delivery",hours:50},{id:2,name:"Strategy and discovery",hours:12},{id:3,name:"Client management",hours:10},{id:4,name:"Proposal and scoping",hours:8}]); setHard([{id:1,name:"Hard costs (stock, fonts, tools, proofs)",amount:50000}]); setScores([3,3,3,3,3]); setFx(0); setUrg(0); setDisc(0); setWeeks(6); setTier("growth"); go(9); }}>New project</Btn>
              <Btn primary c={c} onClick={() => window.print()}>Save as PDF</Btn>
            </BRow>
          </div>
        </div>

      </div>

      {/* AI OVERLAY */}
      {aiOpen && <div onClick={() => setAiOpen(false)} className="noprint"
        style={{ position:"absolute", inset:0, background:"rgba(0,0,0,.5)", zIndex:290,
          backdropFilter:"blur(3px)", WebkitBackdropFilter:"blur(3px)" }}/>}

      {/* AI DRAWER */}
      <div className="noprint" style={{ position:"absolute", right:0, top:0, bottom:0,
        width: Math.min(380, typeof window!=="undefined" ? window.innerWidth : 380),
        background:c.bg2, borderLeft:`1px solid ${c.line}`, zIndex:291,
        display:"flex", flexDirection:"column",
        transform: aiOpen ? "translateX(0)" : "translateX(100%)",
        transition:"transform .35s cubic-bezier(.4,0,.2,1)" }}>
        <div style={{ padding:"16px 20px", borderBottom:`1px solid ${c.line}`,
          display:"flex", alignItems:"center", justifyContent:"space-between", flexShrink:0 }}>
          <div style={{ display:"flex", alignItems:"center", gap:8 }}><StarIco/>
            <span style={{ fontFamily:"'Instrument Serif',serif", fontSize:18 }}>Intelligence</span>
          </div>
          <button onClick={() => setAiOpen(false)}
            style={{ background:"none", border:"none", cursor:"pointer", fontSize:20, color:c.muted, lineHeight:1, padding:4 }}>×</button>
        </div>
        <div style={{ flex:1, overflow:"hidden", display:"flex", flexDirection:"column" }}>
          {!aiKey && !AI_PROXY_URL ? (
            <div style={{ padding:20 }}>
              <div style={{ fontSize:13, color:c.muted, lineHeight:1.75, marginBottom:16 }}>The intelligence layer is an AI conversation that knows your full cost picture, your rate, and your project.</div>
              <div style={{ border:`1px solid ${c.line2}`, borderRadius:6, padding:14, fontSize:12, color:c.muted, lineHeight:1.6, marginBottom:16 }}>
                <strong style={{ color:c.text, fontWeight:500 }}>API key required.</strong> Enter your Anthropic API key below. Stored on this device only, never shared.
              </div>
              <input ref={aiKRef} type="password" placeholder="sk-ant-..."
                style={{ width:"100%", background:c.bg3, border:`1px solid ${c.line}`, borderRadius:6,
                  padding:"10px 14px", fontFamily:"'DM Sans',sans-serif", fontSize:13, color:c.text, outline:"none", marginBottom:10 }}
                onFocus={e => e.target.style.borderColor=c.gold}
                onBlur={e => e.target.style.borderColor=c.line}/>
              <button onClick={() => { const k=aiKRef.current?.value?.trim(); if(!k) return; setAiKey(k); try{localStorage.setItem("wtw_k",k)}catch(e){} }}
                style={{ width:"100%", padding:11, background:c.gold, border:"none", borderRadius:6,
                  color:"#0D0D0B", fontFamily:"'DM Sans',sans-serif", fontSize:14, fontWeight:500, cursor:"pointer" }}>
                Activate
              </button>
            </div>
          ) : (
            <>
              {aiMsgs.length===0 && (
                <div style={{ padding:"12px 20px 4px", flexShrink:0 }}>
                  {["How does my rate compare to designers at my level in London or New York?","Does this project price feel right for the brief I described?","What should I say if the client asks why I am charging this much?"].map(q => (
                    <button key={q} onClick={() => ask(q)}
                      style={{ display:"block", width:"100%", background:"none", border:`1px solid ${c.line}`,
                        borderRadius:20, padding:"7px 14px", fontSize:12, fontFamily:"'DM Sans',sans-serif",
                        color:c.muted, cursor:"pointer", textAlign:"left", marginBottom:6, transition:"all .15s" }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor=c.gold; e.currentTarget.style.color=c.gold; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor=c.line; e.currentTarget.style.color=c.muted; }}>
                      {q}
                    </button>
                  ))}
                </div>
              )}
              <div style={{ flex:1, overflowY:"auto", padding:"12px 20px", display:"flex", flexDirection:"column", gap:12 }}>
                {aiMsgs.map((m,i) => (
                  <div key={i} style={{ fontSize:13, lineHeight:1.75, maxWidth:"88%",
                    alignSelf: m.role==="user"?"flex-end":"flex-start",
                    color: m.role==="user" ? c.muted : c.text,
                    fontStyle: m.role==="user" ? "italic" : "normal" }}>
                    {m.content}
                  </div>
                ))}
                {aiLoad && <div style={{ fontSize:13, color:c.faint, fontStyle:"italic" }}>...</div>}
              </div>
              <div style={{ padding:"12px 16px", borderTop:`1px solid ${c.line}`, display:"flex", gap:8, alignItems:"flex-end", flexShrink:0 }}>
                <textarea ref={aiTRef} rows={1} placeholder="Ask anything about your pricing..."
                  style={{ flex:1, background:"none", border:"none", borderBottom:`1px solid ${c.line2}`,
                    padding:"6px 0", fontFamily:"'DM Sans',sans-serif", fontSize:13, color:c.text,
                    outline:"none", resize:"none", lineHeight:1.5, transition:"border-color .2s" }}
                  onFocus={e => e.target.style.borderBottomColor=c.gold}
                  onBlur={e => e.target.style.borderBottomColor=c.line2}
                  onKeyDown={e => { if(e.key==="Enter"&&!e.shiftKey){ e.preventDefault(); ask(aiTRef.current.value); aiTRef.current.value=""; }}}/>
                <button onClick={() => { ask(aiTRef.current.value); aiTRef.current.value=""; }}
                  style={{ background:"none", border:"none", fontSize:20, cursor:"pointer", color:c.gold, padding:4, lineHeight:1 }}>↑</button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* FOOTER */}
      <div className="noprint" style={{ flexShrink:0, height:34, display:"flex", alignItems:"center",
        justifyContent:"center", borderTop:`1px solid ${c.line}`, background:c.bg,
        fontSize:11, color:c.faint, letterSpacing:".05em", zIndex:100 }}>
        Worth the Work · Created by Bolutife Awakan · © 2026
      </div>

    </div>
  );
}
