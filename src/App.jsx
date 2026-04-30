import { useState, useRef, useCallback, useEffect } from "react";

const D={bg:"#0D0D0B",bg2:"#161614",bg3:"#1F1F1C",line:"#2C2C28",line2:"#3C3C38",line3:"#4C4C48",text:"#EDEAE2",muted:"#888880",faint:"#3E3E3A",gold:"#C9A84C",gold2:"#DDB95E",gp:"rgba(201,168,76,.09)",pass:"#A8D890",warn:"#E8C060",fail:"#E87070"};
const L={bg:"#F5F3EE",bg2:"#EEEAE4",bg3:"#E6E2DA",line:"#D0CCC2",line2:"#C0BBB0",line3:"#A8A29A",text:"#111110",muted:"#666660",faint:"#C8C4BC",gold:"#8C6D22",gold2:"#A07D30",gp:"rgba(140,109,34,.09)",pass:"#2A5A15",warn:"#6A4800",fail:"#7A1515"};
const SR="'Instrument Serif',Georgia,serif";
const SN="'DM Sans',system-ui,sans-serif";
const pn=s=>parseFloat((""+s).replace(/[^0-9.]/g,""))||0;

// ─── Currencies ───────────────────────────────────────────────────────────────
const CURRENCIES=[
  {code:"NGN",symbol:"₦",name:"Nigerian Naira",country:"Nigeria",rate:1},
  {code:"GHS",symbol:"GH₵",name:"Ghanaian Cedi",country:"Ghana",rate:0.065},
  {code:"KES",symbol:"KSh",name:"Kenyan Shilling",country:"Kenya",rate:5.8},
  {code:"ZAR",symbol:"R",name:"South African Rand",country:"South Africa",rate:0.85},
  {code:"USD",symbol:"$",name:"US Dollar",country:"United States",rate:0.00067},
  {code:"GBP",symbol:"£",name:"British Pound",country:"United Kingdom",rate:0.00053},
  {code:"EUR",symbol:"€",name:"Euro",country:"Eurozone",rate:0.00062},
  {code:"CAD",symbol:"CA$",name:"Canadian Dollar",country:"Canada",rate:0.00091},
  {code:"AUD",symbol:"A$",name:"Australian Dollar",country:"Australia",rate:0.00104},
  {code:"EGP",symbol:"E£",name:"Egyptian Pound",country:"Egypt",rate:0.033},
  {code:"ETB",symbol:"Br",name:"Ethiopian Birr",country:"Ethiopia",rate:0.038},
  {code:"TZS",symbol:"TSh",name:"Tanzanian Shilling",country:"Tanzania",rate:1.74},
  {code:"UGX",symbol:"USh",name:"Ugandan Shilling",country:"Uganda",rate:2.52},
  {code:"RWF",symbol:"RF",name:"Rwandan Franc",country:"Rwanda",rate:0.86},
  {code:"SEN",symbol:"CFA",name:"West African CFA",country:"Senegal / Ivory Coast",rate:0.41},
  {code:"MAD",symbol:"د.م",name:"Moroccan Dirham",country:"Morocco",rate:0.0067},
  {code:"XOF",symbol:"CFA",name:"CFA Franc BCEAO",country:"West Africa",rate:0.41},
  {code:"INR",symbol:"₹",name:"Indian Rupee",country:"India",rate:0.056},
  {code:"BRL",symbol:"R$",name:"Brazilian Real",country:"Brazil",rate:0.0034},
  {code:"MXN",symbol:"MX$",name:"Mexican Peso",country:"Mexico",rate:0.012},
  {code:"AED",symbol:"د.إ",name:"UAE Dirham",country:"UAE",rate:0.0025},
  {code:"SGD",symbol:"S$",name:"Singapore Dollar",country:"Singapore",rate:0.00090},
  {code:"JPY",symbol:"¥",name:"Japanese Yen",country:"Japan",rate:0.10},
  {code:"PKR",symbol:"₨",name:"Pakistani Rupee",country:"Pakistan",rate:0.19},
  {code:"IDR",symbol:"Rp",name:"Indonesian Rupiah",country:"Indonesia",rate:10.7},
  {code:"PHP",symbol:"₱",name:"Philippine Peso",country:"Philippines",rate:0.038},
  {code:"BDT",symbol:"৳",name:"Bangladeshi Taka",country:"Bangladesh",rate:0.073},
  {code:"TRY",symbol:"₺",name:"Turkish Lira",country:"Turkey",rate:0.022},
];

// city -> currency suggestion
const CITY_CURRENCY={
  "Lagos":"NGN","Abuja":"NGN","Accra":"GHS","Nairobi":"KES",
  "Johannesburg":"ZAR","Cape Town":"ZAR","Cairo":"EGP","Addis Ababa":"ETB",
  "Dar es Salaam":"TZS","Kampala":"UGX","Kigali":"RWF","Dakar":"XOF",
  "London":"GBP","New York":"USD","Toronto":"CAD","Sydney":"AUD",
  "Dubai":"AED","Singapore":"SGD","Mumbai":"INR","Nairobi":"KES",
};

function getCurr(code){return CURRENCIES.find(c=>c.code===code)||CURRENCIES[0];}

function fmtMoney(amount,curr){
  // convert from NGN base to target currency
  const converted=amount*curr.rate;
  const n=Math.round(converted);
  if(n>=1000000) return curr.symbol+(n/1000000).toFixed(1)+"M";
  if(n>=1000) return curr.symbol+n.toLocaleString();
  return curr.symbol+n.toLocaleString();
}
function fmtFull(amount,curr){
  const converted=Math.round(amount*curr.rate);
  return curr.symbol+converted.toLocaleString();
}
// Convert user input back to NGN base for calculations
function toNGN(amount,curr){return amount/curr.rate;}
function fromNGN(amount,curr){return Math.round(amount*curr.rate);}

// ─── Progress ──────────────────────────────────────────────────────────────────
const PROG=[0,2,6,10,14,18,22,26,36,50,60,67,74,81,88,100];

// ─── Questions ────────────────────────────────────────────────────────────────
const QS=[
  {k:"name",t:"text",label:"What should I call you?",ph:"Your name"},
  {k:"business",t:"text",label:"And your business?",ph:"Business or studio name",opt:true},
  {k:"role",t:"chips",label:"How do you work?",opts:["Solo designer","Small studio","Agency","In-house"]},
  {k:"exp",t:"chips",label:"Years in practice?",opts:["1 to 3 years","4 to 7 years","8 or more years"]},
  {k:"discipline",t:"chips+",label:"Your main discipline?",opts:["Brand and identity","Product and UX","Campaign and print","Motion and digital","Multi-disciplinary"]},
  {k:"city",t:"city",label:"Where are you based?",opts:["Lagos","Abuja","Accra","Nairobi","Johannesburg","Another city"]},
];

const DLV={brand:["Brand strategy","Logo system","Colour and typography","Brand guidelines","Collateral templates"],product:["UX audit","User flow redesign","UI design","Design system","Engineering handover"],campaign:["Creative strategy","Key visual development","Social media assets","OOH and print","Activation guide"],motion:["Motion style frames","Animation production","Title and transition design","Final export"],web:["Information architecture","Wireframes","Visual design","Component library","Developer handover"]};
const DKW={brand:["brand","logo","identity","rebrand"],product:["product","app","ux","ui","dashboard","saas"],campaign:["campaign","launch","ooh","social","advert"],motion:["motion","animation","video","reel"],web:["website","web","landing","ecommerce"]};
function detectDlvr(b){const bl=b.toLowerCase();const f=[];for(const[k,kws]of Object.entries(DKW))if(kws.some(w=>bl.includes(w)))f.push(...DLV[k]);return[...new Set(f)];}

const DIMS=[["Revenue impact","Will this directly affect their sales, fundraising, or ability to win customers?"],["Risk of failure","What does poor execution cost their business financially or reputationally?"],["Strategic importance","Is this central to what they are building, or a peripheral nice-to-have?"],["Client stage","Are they early-stage and budget-cautious, or funded and actively growing?"],["Your unique fit","Do you have specific experience, results, or strong portfolio depth in this area?"]];

const INSIGHTS=[
  {id:"global",label:"Global rate comparison",q:"Compare my hourly rate to designers at my level and discipline in London, New York, and other major markets. Use the exchange rates provided. Tell me precisely where I sit and what the gap means practically."},
  {id:"price",label:"Does this price feel right?",q:"Based on my brief, deliverables, experience, and project type, does my final price feel right for this market? Tell me if it is low, in the right range, or if I should be pricing higher, with specific reasons."},
  {id:"client",label:"How to defend this price",q:"I need to talk to a client about this project price. Give me specific language to frame and defend this number, based on my actual positioning and this brief."},
  {id:"revenue",label:"Annual revenue implication",q:"Based on my rate, monthly billable hours, and income target, what does my current pricing mean annually? What concretely changes if I price 20% higher consistently?"},
];

function calcPIT(annual){
  const bands=[{l:300000,r:.07},{l:300000,r:.11},{l:500000,r:.15},{l:500000,r:.19},{l:1600000,r:.21},{l:Infinity,r:.24}];
  let tax=0,rem=annual;
  for(const b of bands){if(rem<=0)break;const t=Math.min(rem,b.l);tax+=t*b.r;rem-=t;}
  return tax;
}

// ─── Icons ────────────────────────────────────────────────────────────────────
function ChevronDown({size=14,style={}}){return<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}><polyline points="6 9 12 15 18 9"/></svg>;}
function ChevronRight({size=14}){return<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>;}
function SunIcon(){return<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="2" x2="12" y2="4"/><line x1="12" y1="20" x2="12" y2="22"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="2" y1="12" x2="4" y2="12"/><line x1="20" y1="12" x2="22" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>;}
function MoonIcon(){return<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>;}
function StarIcon({color}){return<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>;}
function PrintIcon(){return<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>;}

// ─── NumInput (real-time) ─────────────────────────────────────────────────────
function NI({value,onChange,placeholder,large,prefix,c}){
  const[raw,setRaw]=useState("");const[on,setOn]=useState(false);const ref=useRef();
  const fmtV=v=>{if(!v||v<=0)return"";return Math.round(v).toLocaleString();}
  return(
    <div style={{display:"flex",alignItems:"baseline",gap:4}}>
      {prefix&&<span style={{fontFamily:SR,fontSize:large?20:14,color:c.muted,flexShrink:0}}>{prefix}</span>}
      <input ref={ref} type="text" inputMode="numeric"
        value={on?raw:fmtV(value)} placeholder={placeholder||"0"}
        onFocus={()=>{setOn(true);setRaw(value>0?String(value):"");setTimeout(()=>ref.current&&ref.current.select(),0);}}
        onBlur={()=>setOn(false)}
        onChange={e=>{const v=e.target.value;setRaw(v);onChange(pn(v));}}
        style={{display:"block",width:"100%",background:"none",border:"none",borderBottom:"2px solid "+(on?c.gold:c.line2),padding:"8px 0 10px",outline:"none",transition:"border-color .2s",fontFamily:large?SR:SN,fontSize:large?28:16,color:c.text}}/>
    </div>
  );
}

function InNum({value,onChange,width,suffix,c}){
  const[raw,setRaw]=useState("");const[on,setOn]=useState(false);const ref=useRef();
  return(
    <div style={{display:"flex",alignItems:"center",gap:4}}>
      <input ref={ref} type="text" inputMode="numeric"
        value={on?raw:(value>0?Math.round(value).toLocaleString():"")} placeholder="0"
        onFocus={()=>{setOn(true);setRaw(value>0?String(value):"");setTimeout(()=>ref.current&&ref.current.select(),0);}}
        onBlur={()=>{setOn(false);onChange(pn(raw));}} onChange={e=>setRaw(e.target.value)}
        style={{width:width||90,textAlign:"right",background:"none",border:"none",borderBottom:"1px solid "+(on?c.gold:c.line2),padding:"2px 0",outline:"none",fontFamily:SN,fontSize:14,color:on?c.gold:c.text,transition:"color .15s,border-color .15s"}}/>
      {suffix&&<span style={{fontSize:11,color:c.faint}}>{suffix}</span>}
    </div>
  );
}

function CostRow({name,onName,value,onChange,prefix,suffix,onDel,c}){
  return(
    <div style={{display:"grid",gridTemplateColumns:"1fr auto 28px",alignItems:"center",gap:10,padding:"11px 8px",borderBottom:"1px solid "+c.line,borderRadius:4,transition:"background .15s"}}
      onMouseEnter={e=>{e.currentTarget.style.background=c.gp;}} onMouseLeave={e=>{e.currentTarget.style.background="transparent";}}>
      <input value={name} onChange={e=>onName(e.target.value)} placeholder="Label"
        style={{background:"none",border:"none",outline:"none",fontFamily:SN,fontSize:14,color:c.text,borderBottom:"1px solid transparent",padding:"2px 0",transition:"border-color .2s"}}
        onFocus={e=>{e.target.style.borderBottomColor=c.gold;}} onBlur={e=>{e.target.style.borderBottomColor="transparent";}}/>
      <div style={{display:"flex",alignItems:"center",gap:3}}>
        {prefix&&<span style={{fontSize:12,color:c.muted}}>{prefix}</span>}
        <InNum value={value} onChange={onChange} suffix={suffix} c={c}/>
      </div>
      <button onClick={onDel} style={{background:"none",border:"none",cursor:"pointer",fontSize:16,color:c.faint,lineHeight:1,padding:4,transition:"color .15s"}}
        onMouseEnter={e=>{e.target.style.color="#E87070";}} onMouseLeave={e=>{e.target.style.color=c.faint;}}>x</button>
    </div>
  );
}

function AddRow({label,onClick,c}){
  const[h,setH]=useState(false);
  return(
    <button onClick={onClick} onMouseEnter={()=>setH(true)} onMouseLeave={()=>setH(false)}
      style={{display:"flex",alignItems:"center",gap:8,padding:"10px 8px",color:h?c.gold:c.muted,fontSize:13,fontFamily:SN,cursor:"pointer",border:"none",background:"none",width:"100%",textAlign:"left",transition:"color .15s"}}>
      <span style={{width:20,height:20,borderRadius:"50%",border:"1px solid "+(h?c.gold:c.muted),display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,lineHeight:1,flexShrink:0}}>+</span>
      {label}
    </button>
  );
}

function Btn({children,primary,ghost,small,onClick,disabled,c,full}){
  const[h,setH]=useState(false);
  return(
    <button onClick={onClick} disabled={disabled} onMouseEnter={()=>setH(true)} onMouseLeave={()=>setH(false)}
      style={{display:"inline-flex",alignItems:"center",justifyContent:full?"center":"flex-start",gap:6,
        padding:small?"7px 16px":"10px 24px",borderRadius:40,fontSize:small?12:14,fontFamily:SN,fontWeight:primary?500:400,
        cursor:disabled?"default":"pointer",opacity:disabled?.35:1,
        border:"1px solid "+(primary?(h?c.gold2:c.gold):ghost?"transparent":(h?c.text:c.line2)),
        background:primary?(h?c.gold2:c.gold):"none",
        color:primary?"#0D0D0B":ghost?(h?c.text:c.muted):c.text,
        transition:"all .2s",whiteSpace:"nowrap",width:full?"100%":"auto"}}>
      {children}
    </button>
  );
}

// Slider with NO extra border, description above, value on right, slider fills full width
function Slider({label,hint,value,set,min,max,step,displayVal,c}){
  return(
    <div style={{paddingTop:16,paddingBottom:20}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:hint?4:8}}>
        <span style={{fontSize:14,fontWeight:500}}>{label}</span>
        <span style={{fontFamily:SR,fontSize:18,color:c.gold}}>{displayVal!=null?displayVal:value+"%"}</span>
      </div>
      {hint&&<div style={{fontSize:12,color:c.muted,lineHeight:1.5,marginBottom:10}}>{hint}</div>}
      <input type="range" min={min||0} max={max||100} step={step||5} value={value}
        style={{background:c.line2,transition:"none"}} onChange={e=>set(+e.target.value)}/>
    </div>
  );
}

function HR({c}){return<div style={{height:1,background:c.line,margin:"18px 0"}}/>;}
function Kk({t,c}){return<div style={{fontSize:11,letterSpacing:".14em",textTransform:"uppercase",color:c.muted,marginBottom:8}}>{t}</div>;}
function Ttl({children}){return<div style={{fontFamily:SR,fontSize:30,lineHeight:1.2,marginBottom:8}}>{children}</div>;}
function Sub({children,c}){return<div style={{fontSize:13,color:c.muted,lineHeight:1.6,marginBottom:20,maxWidth:440}}>{children}</div>;}
function NavBar({children,c}){return<div style={{position:"sticky",bottom:0,padding:"16px 0 8px",background:"linear-gradient(transparent,"+c.bg+" 30%)",marginTop:28,display:"flex",gap:10,flexWrap:"wrap",zIndex:10}}>{children}</div>;}

function printQuote({prof,clientName,brief,dlvr,timeRows,hardRows,fin,vatRate,whtRate,includeTax,rate,weeks,margin,curr}){
  const vat=includeTax?fin*(vatRate/100):0;const wht=includeTax?fin*(whtRate/100):0;const net=fin+vat-wht;
  const today=new Date().toLocaleDateString("en",{day:"numeric",month:"long",year:"numeric"});
  const validUntil=new Date(Date.now()+30*24*60*60*1000).toLocaleDateString("en",{day:"numeric",month:"long",year:"numeric"});
  const totalHrs=timeRows.reduce((s,t)=>s+(+t.h||0),0);
  const f=v=>fmtFull(v,curr);
  const html=`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Project Quote</title>
<style>*{box-sizing:border-box}body{font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;color:#111;padding:52px;max-width:720px;margin:0 auto;font-size:14px;line-height:1.5}.header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:44px;padding-bottom:20px;border-bottom:2px solid #111}.logo{font-size:20px;font-weight:300;letter-spacing:.04em}.parties{display:flex;justify-content:space-between;margin-bottom:36px}.party{font-size:13px}.lbl{font-size:10px;letter-spacing:.1em;text-transform:uppercase;color:#888;margin-bottom:4px}.sec{font-size:10px;letter-spacing:.12em;text-transform:uppercase;color:#888;margin-bottom:10px;margin-top:28px}.row{display:flex;justify-content:space-between;padding:7px 0;border-bottom:1px solid #eee;font-size:13px}.row.major{font-weight:600;border-bottom:2px solid #111}.row.total{font-size:16px;font-weight:700;border-bottom:none;padding-top:14px}.terms{margin-top:36px;padding-top:18px;border-top:1px solid #eee;font-size:12px;color:#888;line-height:1.7}@media print{body{padding:24px}}</style>
</head><body>
<div class="header"><div><div class="logo">Project Quote</div><div style="font-size:12px;color:#888;margin-top:3px">${today}</div></div><div style="text-align:right;font-size:13px;color:#888"><div style="font-size:22px;font-weight:700;color:#111;margin-bottom:2px">${f(net)}</div><div>Prepared for ${clientName||"Client"}</div></div></div>
<div class="parties"><div class="party"><div class="lbl">From</div><div style="font-weight:600">${prof.name||"Designer"}</div>${prof.business?`<div>${prof.business}</div>`:""}</div><div class="party" style="text-align:right"><div class="lbl">Project</div><div style="max-width:260px;margin-left:auto">${brief||"Design project"}</div></div></div>
${dlvr.length>0?`<div class="sec">Scope of work</div>${dlvr.map(d=>`<div class="row"><span>${d}</span><span></span></div>`).join("")}`:""}
<div class="sec">Time breakdown</div>
${timeRows.filter(t=>t.h>0).map(t=>`<div class="row"><span>${t.n}</span><span>${t.h} hrs x ${f(rate)} = ${f(t.h*rate)}</span></div>`).join("")}
${hardRows.filter(h=>h.a>0).map(h=>`<div class="row"><span>${h.n}</span><span>${f(h.a)}</span></div>`).join("")}
<div class="sec">Pricing</div>
<div class="row major"><span>Design fee (${totalHrs} hrs, ${weeks} weeks)</span><span>${f(fin)}</span></div>
${includeTax&&vat>0?`<div class="row"><span>VAT ${vatRate}%</span><span>${f(vat)}</span></div>`:""}
${includeTax&&wht>0?`<div class="row"><span>Withholding Tax ${whtRate}% (deducted by client)</span><span>-${f(wht)}</span></div>`:""}
<div class="row total"><span>${includeTax?"Amount receivable":"Total"}</span><span>${f(net)}</span></div>
<div class="terms"><div>Valid until ${validUntil}.</div><div style="margin-top:6px">50% deposit required before work commences. Balance due on delivery.</div><div style="margin-top:4px">All prices in ${curr.name} (${curr.code}). This quote does not constitute a contract.</div></div>
<script>window.onload=function(){window.print();}</script></body></html>`;
  const w=window.open("","_blank");if(w){w.document.write(html);w.document.close();}
}

// ─── App ──────────────────────────────────────────────────────────────────────
export default function App(){
  const[theme,setTheme]=useState("dark");const c=theme==="dark"?D:L;

  useEffect(()=>{
    const lnk=document.createElement("link");lnk.rel="stylesheet";lnk.href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=DM+Sans:wght@300;400;500&display=swap";document.head.appendChild(lnk);
    const sty=document.createElement("style");
    sty.textContent="*{box-sizing:border-box;margin:0;padding:0}"+
      "input[type=range]{-webkit-appearance:none;appearance:none;height:2px;border-radius:1px;outline:none;cursor:pointer;width:100%}"+
      "input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:20px;height:20px;border-radius:50%;background:#C9A84C;border:2px solid #0D0D0B;box-shadow:0 0 0 1px #C9A84C;cursor:pointer;transition:transform .15s}"+
      "input[type=range]::-webkit-slider-thumb:active{transform:scale(1.2)}"+
      "input[type=range]::-moz-range-thumb{width:20px;height:20px;border-radius:50%;background:#C9A84C;border:2px solid #0D0D0B;cursor:pointer}";
    document.head.appendChild(sty);
  },[]);

  const[si,setSi]=useState(0);const[prev,setPrev]=useState(-1);const[dir,setDir]=useState(1);
  function go(n){if(n===si)return;setDir(n>si?1:-1);setPrev(si);setSi(n);}

  const[saved,setSaved]=useState(null);const[saveMsg,setSaveMsg]=useState("");
  useEffect(()=>{try{const s=localStorage.getItem("wtw_v7");if(s)setSaved(JSON.parse(s));}catch(e){};},[]);
  function saveProfile(data){try{localStorage.setItem("wtw_v7",JSON.stringify(data));setSaveMsg("Saved");setTimeout(()=>setSaveMsg(""),2000);}catch(e){setSaveMsg("Could not save");}}

  const[prof,setProf]=useState({name:"",business:"",role:"",exp:"",discipline:"",city:""});
  const[customDisc,setCustomDisc]=useState("");const[showCustom,setShowCustom]=useState(false);
  const[currCode,setCurrCode]=useState("NGN");
  const curr=getCurr(currCode);

  // All monetary state stored in NGN base
  const[incomeNGN,setIncomeNGN]=useState(0);
  const[billHrs,setBH]=useState(0);const[chosen,setChosen]=useState(0);const[margin,setMargin]=useState(50);
  const[clientName,setClientName]=useState("");

  // Local display values in selected currency
  const incomeDisplay=incomeNGN>0?fromNGN(incomeNGN,curr):0;
  function setIncomeFromDisplay(v){setIncomeNGN(toNGN(v,curr));setChosen(0);}

  const idc=useRef(30);
  // Costs stored in NGN base
  const[costsNGN,setCostsNGN]=useState([
    {id:1,n:"Power (electricity and generator)",a:65000},{id:2,n:"Internet and data",a:50000},
    {id:3,n:"Software and tools",a:180000},{id:4,n:"Transport and client meetings",a:80000},
    {id:5,n:"Professional development",a:25000},{id:6,n:"Business administration",a:20000},
  ]);

  const[brief,setBrief]=useState("");const[dlvr,setDlvr]=useState([]);
  const[timeRows,setTime]=useState([{id:1,n:"Design and delivery",h:50},{id:2,n:"Strategy and discovery",h:12},{id:3,n:"Client management",h:10},{id:4,n:"Proposal and scoping",h:8}]);
  // Hard costs in NGN
  const[hardNGN,setHardNGN]=useState([{id:1,n:"Hard costs (stock, fonts, proofs)",a:50000}]);
  const[weeks,setWeeks]=useState(6);const[scores,setScores]=useState([3,3,3,3,3]);
  const[fx,setFx]=useState(0);const[urg,setUrg]=useState(0);const[disc,setDisc]=useState(0);
  const[tier,setTier]=useState("growth");const[bkdn,setBkdn]=useState(false);
  const[includeTax,setIncludeTax]=useState(false);const[vatRate,setVatRate]=useState(7.5);const[whtRate,setWhtRate]=useState(10);
  const[insData,setInsData]=useState({});const[insLoad,setInsLoad]=useState({});const[aiOpen,setAiOpen]=useState(false);

  const opsNGN=costsNGN.reduce((s,x)=>s+(+x.a||0),0);
  const sugNGN=incomeNGN&&billHrs?Math.ceil((incomeNGN+opsNGN)/billHrs/500)*500:0;
  const rateNGN=chosen||sugNGN||22000;

  const calc=useCallback(()=>{
    const h=timeRows.reduce((s,t)=>s+(+t.h||0),0);
    const hard=hardNGN.reduce((s,h)=>s+(+h.a||0),0);
    const infra=opsNGN*(weeks/4.33);const cor=h*rateNGN+hard+infra;
    const cont=incomeNGN>0?incomeNGN/3:800000;const floor=cor+cont;
    const minP=floor/(1-margin/100);const sc=scores.reduce((s,v)=>s+v,0);
    const mult=sc<=10?1.0:sc<=18?1.1+(sc-11)*(0.2/7):1.4+(sc-19)*(0.6/6);
    const pre=minP*mult;const ctx=(1+fx/100)*(1+urg/100)*(1-disc/100);
    const fin=pre*ctx;const marg=(fin-floor)/fin;
    return{h,hard,infra,cor,cont,floor,minP,sc,mult,pre,fin,marg};
  },[timeRows,hardNGN,opsNGN,weeks,rateNGN,incomeNGN,scores,fx,urg,disc,margin]);

  const r=calc();
  const ps=r.marg>=0.48?"pass":r.marg>=0.40?"warn":"fail";
  const pc=c[ps];
  const pt=ps==="pass"?"Passes the Good Revenue Test":ps==="warn"?"Close to your floor":"Fails the Good Revenue Test";
  const pitMonthly=calcPIT(incomeNGN*12)/12;
  const vatAmt=r.fin*(vatRate/100);const whtAmt=r.fin*(whtRate/100);
  const netRec=r.fin+(includeTax?vatAmt:0)-(includeTax?whtAmt:0);

  // Display helpers using selected currency
  const fm=v=>fmtFull(v,curr);
  const sym=curr.symbol;

  function buildCtx(){
    return["Intelligence layer inside Worth the Work by Bolutife Awakan.",
      "Designer: "+(prof.name||"Unknown")+", "+(prof.business||"")+", "+(prof.discipline||"not given")+", "+(prof.city||"not given")+".",
      "Currency: "+curr.name+" ("+curr.code+"). Exchange rate: 1 NGN = "+curr.rate+" "+curr.code+".",
      "Monthly income target: "+fm(incomeNGN)+" (~"+fmtFull(incomeNGN,getCurr("USD"))+" USD). Billable hours: "+billHrs+"/month. Hourly rate: "+fm(rateNGN)+". Target margin: "+margin+"%.",
      "Monthly costs: "+fm(opsNGN)+" ("+costsNGN.map(x=>x.n+": "+fm(x.a)).join(", ")+").",
      "Brief: "+(brief||"not described")+". Client: "+(clientName||"not named")+". Deliverables: "+(dlvr.join(", ")||"none")+".",
      "Time: "+timeRows.map(t=>t.n+" "+t.h+"hrs").join(", ")+". Duration: "+weeks+" weeks.",
      "Value score: "+r.sc+"/25. Multiplier: "+r.mult.toFixed(2)+"x. Cost floor: "+fm(r.floor)+". Final price: "+fm(r.fin)+". Achieved margin: "+Math.round(r.marg*100)+"%. GRT: "+ps.toUpperCase()+".",
      "For comparisons: ~1,500 NGN = 1 USD, ~1,900 NGN = 1 GBP.",
      "Be direct, warm, specific to these real numbers. Under 180 words. Sound like Bolutife Awakan, not corporate AI.",
    ].join("\n");
  }

  async function getInsight(id){
    if(insData[id])return;const ins=INSIGHTS.find(x=>x.id===id);if(!ins)return;
    setInsLoad(l=>({...l,[id]:true}));
    try{
      // Artifact environment handles auth, no API key header needed
      const res=await fetch("https://api.anthropic.com/v1/messages",{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:350,system:buildCtx(),messages:[{role:"user",content:ins.q}]}),
      });
      const d=await res.json();
      const reply=d.content&&d.content[0]&&d.content[0].text||"Could not load this insight.";
      setInsData(p=>({...p,[id]:reply}));
    }catch(e){
      setInsData(p=>({...p,[id]:"Could not load this insight right now."}));
    }
    setInsLoad(l=>({...l,[id]:false}));
  }

  function ss(idx){
    let tf=idx===si?"translateX(0)":idx===prev?"translateX("+((-dir)*22)+"%)":"translateX("+(dir>0?100:-100)+"%)";
    return{position:"absolute",inset:0,overflowY:"auto",overflowX:"hidden",WebkitOverflowScrolling:"touch",padding:"44px 20px 24px",transform:tf,opacity:idx===si?1:0,transition:"transform .42s cubic-bezier(.4,0,.2,1),opacity .42s",pointerEvents:idx===si?"auto":"none",background:c.bg,color:c.text};
  }
  const inn={maxWidth:540,margin:"0 auto"};
  const dlvS=detectDlvr(brief);
  const tiers=[{k:"foundation",label:"Foundation",price:r.fin*0.72,sub:"Tighter scope"},{k:"growth",label:"Growth",price:r.fin,sub:"Recommended"},{k:"partnership",label:"Partnership",price:r.fin*1.55,sub:"Extended scope"}];

  return(
    <div style={{fontFamily:SN,height:"100vh",display:"flex",flexDirection:"column",overflow:"hidden",position:"relative",background:c.bg,color:c.text,transition:"background .3s,color .3s"}}>

      {/* HEADER */}
      <div style={{position:"relative",zIndex:100,display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0 20px",height:50,borderBottom:"1px solid "+c.line,background:c.bg,flexShrink:0}}>
        <button onClick={()=>go(0)} style={{fontFamily:SR,fontSize:15,letterSpacing:".04em",opacity:.7,background:"none",border:"none",cursor:"pointer",color:c.text,padding:0,transition:"opacity .2s"}} onMouseEnter={e=>{e.currentTarget.style.opacity=1;}} onMouseLeave={e=>{e.currentTarget.style.opacity=.7;}}>Worth the Work</button>
        <div style={{display:"flex",gap:8,alignItems:"center"}}>
          {si===15&&(
            <button onClick={()=>setAiOpen(o=>!o)}
              style={{height:32,padding:"0 12px",borderRadius:20,background:aiOpen?c.gp:"none",border:"1px solid "+(aiOpen?c.gold:c.line2),display:"flex",alignItems:"center",gap:6,cursor:"pointer",color:aiOpen?c.gold:c.muted,fontSize:12,fontFamily:SN,transition:"all .2s"}}
              onMouseEnter={e=>{e.currentTarget.style.borderColor=c.gold;e.currentTarget.style.color=c.gold;}} onMouseLeave={e=>{if(!aiOpen){e.currentTarget.style.borderColor=c.line2;e.currentTarget.style.color=c.muted;}}}>
              <StarIcon color={c.gold}/><span>Intelligence</span>
            </button>
          )}
          <button onClick={()=>setTheme(t=>t==="dark"?"light":"dark")}
            style={{width:32,height:32,borderRadius:"50%",background:"none",border:"1px solid "+c.line2,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",color:c.muted,transition:"all .2s"}}
            onMouseEnter={e=>{e.currentTarget.style.borderColor=c.gold;e.currentTarget.style.color=c.gold;}} onMouseLeave={e=>{e.currentTarget.style.borderColor=c.line2;e.currentTarget.style.color=c.muted;}}>
            {theme==="dark"?<SunIcon/>:<MoonIcon/>}
          </button>
        </div>
      </div>

      {/* PROGRESS */}
      <div style={{height:2,background:c.line,flexShrink:0,zIndex:99}}>
        <div style={{height:"100%",background:c.gold,width:PROG[Math.min(si,PROG.length-1)]+"%",transition:"width .5s cubic-bezier(.4,0,.2,1)"}}/>
      </div>

      {/* STAGE */}
      <div style={{flex:1,position:"relative",overflow:"hidden"}}>

        {/* 0 WELCOME */}
        <div style={ss(0)}>
          <div style={{...inn,minHeight:"calc(100vh - 180px)",display:"flex",flexDirection:"column",justifyContent:"center"}}>
            <div style={{fontSize:11,letterSpacing:".16em",textTransform:"uppercase",color:c.muted,marginBottom:16}}>A pricing tool for designers in Africa</div>
            <div style={{fontFamily:SR,fontSize:46,lineHeight:1.05,marginBottom:16,whiteSpace:"nowrap"}}>Worth the Work</div>
            <div style={{fontSize:14,color:c.muted,lineHeight:1.75,maxWidth:380,marginBottom:saved&&saved.prof?20:40}}>Built on the framework from the guide. Get to a price grounded in your real costs.</div>
            {saved&&saved.prof&&(
              <div style={{border:"1px solid "+c.gold+"44",borderRadius:8,padding:"14px 16px",marginBottom:20,background:c.gp}}>
                <div style={{fontSize:13,color:c.gold,fontWeight:500,marginBottom:4}}>{"Welcome back"+(saved.prof.name?", "+saved.prof.name:"")}</div>
                <div style={{fontSize:12,color:c.muted,marginBottom:10}}>Your profile and costs are saved.</div>
                <div style={{display:"flex",gap:8}}>
                  <Btn primary c={c} small onClick={()=>{setProf(saved.prof||prof);setIncomeNGN(saved.income||0);setBH(saved.billHrs||0);if(saved.costs)setCostsNGN(saved.costs);if(saved.currCode)setCurrCode(saved.currCode);go(7);}}>Load saved</Btn>
                  <Btn ghost c={c} small onClick={()=>{setSaved(null);try{localStorage.removeItem("wtw_v7");}catch(e){}}}>Start fresh</Btn>
                </div>
              </div>
            )}
            <div><Btn primary c={c} onClick={()=>go(1)}>Get started</Btn></div>
          </div>
        </div>

        {/* 1-6 ONBOARDING */}
        {QS.map((q,qi)=>(
          <div key={q.k} style={ss(qi+1)}>
            <div style={inn}>
              <div style={{display:"flex",gap:6,marginBottom:40}}>
                {QS.map((_,i)=><div key={i} style={{width:6,height:6,borderRadius:"50%",background:i<qi?c.line3:i===qi?c.gold:c.faint,transition:"background .3s"}}/>)}
              </div>
              <div style={{fontFamily:SR,fontSize:34,lineHeight:1.15,marginBottom:24}}>{q.label}</div>

              {/* TEXT input */}
              {q.t==="text"&&(
                <div>
                  <input key={"i"+qi} defaultValue={prof[q.k]||""} placeholder={q.ph||""}
                    onChange={e=>setProf(p=>({...p,[q.k]:e.target.value}))}
                    onKeyDown={e=>{if(e.key==="Enter"){const v=e.target.value.trim();if(!v&&!q.opt)return;setProf(p=>({...p,[q.k]:v}));go(qi+2);}}}
                    style={{display:"block",width:"100%",background:"none",border:"none",borderBottom:"2px solid "+c.line2,padding:"8px 0 12px",fontFamily:SR,fontSize:26,color:c.text,outline:"none",transition:"border-color .2s"}}
                    onFocus={e=>{e.target.style.borderBottomColor=c.gold;}} onBlur={e=>{e.target.style.borderBottomColor=c.line2;}}/>
                  {q.opt&&<div style={{fontSize:12,color:c.faint,marginTop:8}}>Optional. Press Enter to skip.</div>}
                </div>
              )}

              {/* CHIPS */}
              {q.t==="chips"&&(
                <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
                  {q.opts.map(o=><button key={o} onClick={()=>{setProf(p=>({...p,[q.k]:o}));setTimeout(()=>go(qi+2),240);}}
                    style={{padding:"10px 18px",borderRadius:40,fontSize:14,fontFamily:SN,border:"1px solid "+(prof[q.k]===o?c.gold:c.line2),background:prof[q.k]===o?c.gp:"none",color:prof[q.k]===o?c.gold:c.muted,cursor:"pointer",transition:"all .18s"}}>{o}</button>)}
                </div>
              )}

              {/* CHIPS + CUSTOM */}
              {q.t==="chips+"&&(
                <div>
                  <div style={{display:"flex",flexWrap:"wrap",gap:8,marginBottom:showCustom?12:0}}>
                    {q.opts.map(o=><button key={o} onClick={()=>{setProf(p=>({...p,[q.k]:o}));setShowCustom(false);setTimeout(()=>go(qi+2),240);}}
                      style={{padding:"10px 18px",borderRadius:40,fontSize:14,fontFamily:SN,border:"1px solid "+(prof[q.k]===o?c.gold:c.line2),background:prof[q.k]===o?c.gp:"none",color:prof[q.k]===o?c.gold:c.muted,cursor:"pointer",transition:"all .18s"}}>{o}</button>)}
                    <button onClick={()=>{setShowCustom(true);setProf(p=>({...p,[q.k]:"custom"}));}}
                      style={{padding:"10px 18px",borderRadius:40,fontSize:14,fontFamily:SN,border:"1px solid "+(prof[q.k]==="custom"?c.gold:c.line2),background:prof[q.k]==="custom"?c.gp:"none",color:prof[q.k]==="custom"?c.gold:c.muted,cursor:"pointer",transition:"all .18s"}}>Add your own</button>
                  </div>
                  {showCustom&&<input value={customDisc} placeholder="Describe your discipline..." onChange={e=>setCustomDisc(e.target.value)}
                    onKeyDown={e=>{if(e.key==="Enter"&&customDisc.trim())go(qi+2);}}
                    style={{display:"block",width:"100%",background:"none",border:"none",borderBottom:"2px solid "+c.gold,padding:"6px 0 10px",fontFamily:SN,fontSize:16,color:c.text,outline:"none"}}/>}
                </div>
              )}

              {/* CITY + CURRENCY */}
              {q.t==="city"&&(
                <div>
                  <div style={{display:"flex",flexWrap:"wrap",gap:8,marginBottom:20}}>
                    {q.opts.map(o=><button key={o} onClick={()=>{setProf(p=>({...p,[q.k]:o}));const sug=CITY_CURRENCY[o];if(sug)setCurrCode(sug);}}
                      style={{padding:"10px 18px",borderRadius:40,fontSize:14,fontFamily:SN,border:"1px solid "+(prof[q.k]===o?c.gold:c.line2),background:prof[q.k]===o?c.gp:"none",color:prof[q.k]===o?c.gold:c.muted,cursor:"pointer",transition:"all .18s"}}>{o}</button>)}
                  </div>
                  <div style={{borderTop:"1px solid "+c.line,paddingTop:18}}>
                    <div style={{fontSize:13,fontWeight:500,marginBottom:4,color:c.text}}>Your working currency</div>
                    <div style={{fontSize:12,color:c.muted,marginBottom:10}}>Auto-selected based on city. Change if needed.</div>
                    <div style={{position:"relative"}}>
                      <select value={currCode} onChange={e=>setCurrCode(e.target.value)}
                        style={{width:"100%",appearance:"none",WebkitAppearance:"none",background:c.bg3,border:"1px solid "+c.line2,borderRadius:8,padding:"10px 36px 10px 14px",fontFamily:SN,fontSize:14,color:c.text,outline:"none",cursor:"pointer",transition:"border-color .2s"}}
                        onFocus={e=>{e.target.style.borderColor=c.gold;}} onBlur={e=>{e.target.style.borderColor=c.line2;}}>
                        {CURRENCIES.map(cur=><option key={cur.code} value={cur.code}>{cur.symbol} {cur.code}: {cur.name} ({cur.country})</option>)}
                      </select>
                      <div style={{position:"absolute",right:12,top:"50%",transform:"translateY(-50%)",pointerEvents:"none",color:c.muted}}>
                        <ChevronDown size={16}/>
                      </div>
                    </div>
                    {currCode!=="NGN"&&(
                      <div style={{fontSize:12,color:c.muted,marginTop:8}}>{"All amounts will display in "+curr.name+". Calculations remain in NGN base."}</div>
                    )}
                  </div>
                </div>
              )}

              {qi===5&&(
                <div style={{marginTop:16,fontSize:12,color:c.muted,paddingTop:12,borderTop:"1px solid "+c.line}}>
                  Save your profile?
                  <button onClick={()=>saveProfile({prof,currCode})} style={{marginLeft:8,fontSize:12,color:c.gold,background:"none",border:"none",cursor:"pointer",fontFamily:SN,textDecoration:"underline"}}>Save</button>
                  {saveMsg&&<span style={{marginLeft:8,color:c.pass,fontSize:12}}>{saveMsg}</span>}
                </div>
              )}

              <NavBar c={c}>
                {qi>0&&<Btn ghost c={c} onClick={()=>go(qi)}>Back</Btn>}
                <Btn primary c={c} onClick={()=>{if(!prof[q.k]&&!q.opt)return;if(q.t==="chips+"&&prof[q.k]==="custom"&&!customDisc.trim())return;go(qi+2);}}>Continue</Btn>
              </NavBar>
            </div>
          </div>
        ))}

        {/* 7 INCOME + HOURS */}
        <div style={ss(7)}>
          <div style={inn}>
            <Kk t="Step 1 of 8" c={c}/>
            <Ttl>{"Your income and time"+(prof.name?", "+prof.name:"")}</Ttl>
            <Sub c={c}>These two numbers form the base of your rate. We calculate the actual rate on the next screen.</Sub>
            <div style={{fontSize:14,fontWeight:500,marginBottom:4}}>What do you want to take home each month?</div>
            <div style={{fontSize:13,color:c.muted,marginBottom:12,lineHeight:1.5}}>Your personal income after all business expenses are paid.</div>
            <div style={{marginBottom:24}}>
              <NI value={incomeDisplay} onChange={v=>setIncomeFromDisplay(v)} placeholder={curr.code==="NGN"?"2,500,000":"2,000"} large prefix={sym} c={c}/>
            </div>
            <div style={{fontSize:14,fontWeight:500,marginBottom:4}}>Hours of client work per month?</div>
            <div style={{fontSize:13,color:c.muted,marginBottom:12,lineHeight:1.5}}>Actual deliverable hours only, not admin or meeting time.</div>
            <NI value={billHrs} onChange={v=>{setBH(v);setChosen(0);}} placeholder="100" large c={c}/>
            <NavBar c={c}>
              <Btn ghost c={c} onClick={()=>go(6)}>Back</Btn>
              <Btn primary c={c} onClick={()=>go(8)} disabled={!incomeNGN||!billHrs}>Continue to costs</Btn>
            </NavBar>
          </div>
        </div>

        {/* 8 COSTS */}
        <div style={ss(8)}>
          <div style={inn}>
            <Kk t="Step 2 of 8" c={c}/>
            <Ttl>Your monthly running costs</Ttl>
            <Sub c={c}>Click any number to edit. Remove what does not apply. Your rate cannot be right without these.</Sub>
            <div style={{fontSize:12,color:c.muted,marginBottom:4,textAlign:"right"}}>Amounts in {curr.code}</div>
            <div style={{borderTop:"1px solid "+c.line}}>
              {costsNGN.map((item,i)=>(
                <CostRow key={item.id} name={item.n} value={fromNGN(item.a,curr)} prefix={sym} c={c}
                  onName={v=>setCostsNGN(cs=>cs.map((x,j)=>j===i?{...x,n:v}:x))}
                  onChange={v=>setCostsNGN(cs=>cs.map((x,j)=>j===i?{...x,a:toNGN(v,curr)}:x))}
                  onDel={()=>setCostsNGN(cs=>cs.filter(x=>x.id!==item.id))}/>
              ))}
            </div>
            <AddRow c={c} label="Add another cost" onClick={()=>{idc.current++;setCostsNGN(cs=>[...cs,{id:idc.current,n:"",a:0}]);}}/>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",padding:"16px 0 0",borderTop:"1px solid "+c.line,marginTop:4}}>
              <span style={{fontSize:11,letterSpacing:".1em",textTransform:"uppercase",color:c.muted}}>Monthly total</span>
              <span style={{fontFamily:SR,fontSize:26}}>{fm(opsNGN)}</span>
            </div>
            <NavBar c={c}>
              <Btn ghost c={c} onClick={()=>go(7)}>Back</Btn>
              <Btn primary c={c} onClick={()=>go(9)}>See my rate</Btn>
            </NavBar>
          </div>
        </div>

        {/* 9 RATE REVEAL */}
        <div style={ss(9)}>
          <div style={inn}>
            <Kk t="Step 3 of 8" c={c}/>
            <Ttl>Your hourly rate</Ttl>
            <Sub c={c}>Calculated from your monthly target, costs, and hours. This is your minimum per hour.</Sub>
            <div style={{fontSize:11,letterSpacing:".12em",textTransform:"uppercase",color:c.muted,marginBottom:6}}>Your calculated rate</div>
            <div style={{display:"flex",alignItems:"flex-start",marginBottom:8}}>
              <span style={{fontFamily:SR,fontSize:20,color:c.muted,marginTop:5,marginRight:2}}>{sym}</span>
              <span style={{fontFamily:SR,fontSize:52,lineHeight:1}}>{Math.round(fromNGN(chosen||sugNGN||0,curr)).toLocaleString()}</span>
            </div>
            {sugNGN>0&&(
              <div style={{fontSize:13,color:c.muted,lineHeight:1.6,marginBottom:16}}>
                {fm(incomeNGN)+" monthly target + "+fm(opsNGN)+" costs = "+fm(incomeNGN+opsNGN)+" needed, across "+billHrs+" billable hours."}
              </div>
            )}
            {sugNGN>0&&(
              <div>
                <div style={{display:"flex",justifyContent:"space-between",fontSize:12,color:c.muted,marginBottom:6}}>
                  <span>Adjust if needed</span>
                  <span style={{fontFamily:SR,fontSize:15,color:c.gold}}>{fm(chosen||sugNGN)}</span>
                </div>
                <input type="range" style={{background:c.line2}}
                  min={Math.max(1000,Math.floor(sugNGN*0.4/500)*500)} max={Math.ceil(sugNGN*3.5/1000)*1000}
                  step={500} value={chosen||sugNGN} onChange={e=>setChosen(+e.target.value)}/>
              </div>
            )}
            <div style={{marginTop:18,padding:"14px 16px",borderRadius:8,background:c.bg3,fontSize:13,color:c.muted,lineHeight:1.6}}>
              This rate is your floor. Every project price starts here.
            </div>
            <NavBar c={c}>
              <Btn ghost c={c} onClick={()=>go(8)}>Back</Btn>
              <Btn primary c={c} onClick={()=>{saveProfile({prof,income:incomeNGN,billHrs,costs:costsNGN,currCode});go(10);}}>
                Save and continue
              </Btn>
            </NavBar>
            {saveMsg&&<div style={{fontSize:12,color:c.pass,marginTop:8}}>{saveMsg}</div>}
          </div>
        </div>

        {/* 10 BRIEF */}
        <div style={ss(10)}>
          <div style={inn}>
            <Kk t="Step 4 of 8" c={c}/>
            <Ttl>What is this project?</Ttl>
            <Sub c={c}>Who is the client, what does the work involve.</Sub>
            <div style={{fontSize:13,fontWeight:500,marginBottom:6}}>Client name</div>
            <input value={clientName} onChange={e=>setClientName(e.target.value)} placeholder="Client or company name"
              style={{display:"block",width:"100%",background:"none",border:"none",borderBottom:"2px solid "+c.line2,padding:"6px 0 10px",fontFamily:SN,fontSize:15,color:c.text,outline:"none",transition:"border-color .2s",marginBottom:20}}
              onFocus={e=>{e.target.style.borderBottomColor=c.gold;}} onBlur={e=>{e.target.style.borderBottomColor=c.line2;}}/>
            <div style={{fontSize:13,fontWeight:500,marginBottom:8}}>Project brief</div>
            <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:10}}>
              {["Brand identity for a funded Lagos startup","Website redesign for a retail brand","Campaign for a product launch","UX redesign for a fintech app"].map(p=>(
                <button key={p} onClick={()=>setBrief(p)}
                  style={{fontSize:11,padding:"4px 10px",borderRadius:16,border:"1px solid "+c.line,color:c.muted,cursor:"pointer",background:"none",fontFamily:SN,transition:"all .15s"}}
                  onMouseEnter={e=>{e.currentTarget.style.borderColor=c.gold;e.currentTarget.style.color=c.gold;}} onMouseLeave={e=>{e.currentTarget.style.borderColor=c.line;e.currentTarget.style.color=c.muted;}}>{p}</button>
              ))}
            </div>
            <textarea value={brief} onChange={e=>setBrief(e.target.value)} rows={2}
              placeholder="Full rebrand for a Series A fintech building for SMEs across West Africa..."
              style={{display:"block",width:"100%",background:"none",border:"none",borderBottom:"2px solid "+c.line2,padding:"6px 0 10px",fontFamily:SN,fontSize:15,color:c.text,outline:"none",resize:"none",lineHeight:1.65,transition:"border-color .2s"}}
              onFocus={e=>{e.target.style.borderBottomColor=c.gold;}} onBlur={e=>{e.target.style.borderBottomColor=c.line2;}}/>
            {dlvS.length>0&&(
              <div style={{marginTop:14}}>
                <div style={{fontSize:12,color:c.muted,marginBottom:8}}>Suggested deliverables. Select all that apply:</div>
                <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                  {dlvS.map(d=>(
                    <button key={d} onClick={()=>setDlvr(ds=>ds.includes(d)?ds.filter(x=>x!==d):[...ds,d])}
                      style={{padding:"6px 12px",borderRadius:20,fontSize:12,fontFamily:SN,border:"1px solid "+(dlvr.includes(d)?c.gold:c.line),background:dlvr.includes(d)?c.gp:"none",color:dlvr.includes(d)?c.gold:c.muted,cursor:"pointer",transition:"all .15s"}}>
                      {d}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <NavBar c={c}>
              <Btn ghost c={c} onClick={()=>go(9)}>Back</Btn>
              <Btn primary c={c} onClick={()=>go(11)}>Next</Btn>
            </NavBar>
          </div>
        </div>

        {/* 11 TIME */}
        <div style={ss(11)}>
          <div style={inn}>
            <Kk t="Step 5 of 8" c={c}/>
            <Ttl>Time allocation</Ttl>
            <Sub c={c}>Every type of hour this project will consume. Click any number to edit.</Sub>
            <div style={{fontSize:12,color:c.muted,display:"flex",justifyContent:"space-between",marginBottom:4}}>
              <span>Activity</span><span>{"hours at "+fm(rateNGN)+"/hr"}</span>
            </div>
            <div style={{borderTop:"1px solid "+c.line}}>
              {timeRows.map((item,i)=>(
                <CostRow key={item.id} name={item.n} value={item.h} suffix="hrs" c={c}
                  onName={v=>setTime(ts=>ts.map((t,j)=>j===i?{...t,n:v}:t))}
                  onChange={v=>setTime(ts=>ts.map((t,j)=>j===i?{...t,h:v}:t))}
                  onDel={()=>setTime(ts=>ts.filter(t=>t.id!==item.id))}/>
              ))}
            </div>
            <AddRow c={c} label="Add a time category" onClick={()=>{idc.current++;setTime(ts=>[...ts,{id:idc.current,n:"",h:0}]);}}/>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",padding:"14px 0 0",borderTop:"1px solid "+c.line,marginTop:4}}>
              <span style={{fontSize:12,color:c.muted}}>Total time cost</span>
              <span style={{fontFamily:SR,fontSize:20}}>{fm(timeRows.reduce((s,t)=>s+(+t.h||0),0)*rateNGN)}</span>
            </div>
            <NavBar c={c}>
              <Btn ghost c={c} onClick={()=>go(10)}>Back</Btn>
              <Btn primary c={c} onClick={()=>go(12)}>Next</Btn>
            </NavBar>
          </div>
        </div>

        {/* 12 HARD COSTS */}
        <div style={ss(12)}>
          <div style={inn}>
            <Kk t="Step 6 of 8" c={c}/>
            <Ttl>Project costs and duration</Ttl>
            <Sub c={c}>Project-specific expenses: font licences, stock images, print proofs.</Sub>
            <div style={{borderTop:"1px solid "+c.line}}>
              {hardNGN.map((item,i)=>(
                <CostRow key={item.id} name={item.n} value={fromNGN(item.a,curr)} prefix={sym} c={c}
                  onName={v=>setHardNGN(hs=>hs.map((h,j)=>j===i?{...h,n:v}:h))}
                  onChange={v=>setHardNGN(hs=>hs.map((h,j)=>j===i?{...h,a:toNGN(v,curr)}:h))}
                  onDel={()=>setHardNGN(hs=>hs.filter(h=>h.id!==item.id))}/>
              ))}
            </div>
            <AddRow c={c} label="Add a hard cost" onClick={()=>{idc.current++;setHardNGN(hs=>[...hs,{id:idc.current,n:"",a:0}]);}}/>
            <HR c={c}/>
            <div style={{fontSize:14,fontWeight:500,marginBottom:4}}>How many weeks will this project run?</div>
            <div style={{fontSize:13,color:c.muted,marginBottom:12,lineHeight:1.5}}>Used to calculate your infrastructure allocation.</div>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:18}}>
              <InNum value={weeks} onChange={setWeeks} width={60} c={c}/>
              <span style={{fontSize:14,color:c.muted}}>weeks</span>
              <span style={{fontSize:12,color:c.faint}}>{fm(opsNGN*(weeks/4.33))+" infra"}</span>
            </div>
            <HR c={c}/>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline"}}>
              <span style={{fontSize:11,letterSpacing:".1em",textTransform:"uppercase",color:c.muted}}>Total Cost of Revenue</span>
              <span style={{fontFamily:SR,fontSize:24,color:c.gold}}>{fm(r.cor)}</span>
            </div>
            <NavBar c={c}>
              <Btn ghost c={c} onClick={()=>go(11)}>Back</Btn>
              <Btn primary c={c} onClick={()=>go(13)}>Next</Btn>
            </NavBar>
          </div>
        </div>

        {/* 13 VALUE */}
        <div style={ss(13)}>
          <div style={inn}>
            <Kk t="Step 7 of 8" c={c}/>
            <Ttl>How much does this project matter?</Ttl>
            <Sub c={c}>3 is average, not modest. Score honestly.</Sub>
            {DIMS.map(([dim,hint],i)=>(
              <div key={i} style={{marginBottom:18}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:6,gap:12}}>
                  <div>
                    <div style={{fontSize:14,fontWeight:500,marginBottom:2}}>{dim}</div>
                    <div style={{fontSize:12,color:c.muted,lineHeight:1.4}}>{hint}</div>
                  </div>
                  <span style={{fontFamily:SR,fontSize:22,color:c.gold,flexShrink:0}}>{scores[i]}</span>
                </div>
                <input type="range" min={1} max={5} step={1} value={scores[i]} style={{background:c.line2}} onChange={e=>setScores(sc=>sc.map((v,j)=>j===i?+e.target.value:v))}/>
              </div>
            ))}
            <div style={{background:c.bg3,borderRadius:10,padding:16,marginTop:8}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",marginBottom:8}}>
                <span style={{fontSize:11,letterSpacing:".1em",textTransform:"uppercase",color:c.muted}}>Value score</span>
                <span style={{fontFamily:SR,fontSize:24}}>{r.sc}<span style={{fontSize:14,color:c.muted}}>/25</span></span>
              </div>
              <div style={{height:3,background:c.line,borderRadius:2,overflow:"hidden",marginBottom:8}}>
                <div style={{height:"100%",background:c.gold,width:(r.sc/25*100)+"%",transition:"width .4s",borderRadius:2}}/>
              </div>
              <div style={{fontSize:12,color:c.muted,lineHeight:1.5}}>
                {r.sc<=10?"Low stakes. Your cost floor is the right number.":r.sc<=18?"Real business impact. Price confidently above your floor.":"High stakes. Price well above your floor."}
              </div>
            </div>
            <NavBar c={c}>
              <Btn ghost c={c} onClick={()=>go(12)}>Back</Btn>
              <Btn primary c={c} onClick={()=>go(14)}>Next</Btn>
            </NavBar>
          </div>
        </div>

        {/* 14 CONTEXT */}
        <div style={ss(14)}>
          <div style={inn}>
            <Kk t="Step 8 of 8" c={c}/>
            <Ttl>Any situational factors?</Ttl>
            <Sub c={c}>All optional. Leave at zero if none apply.</Sub>
            <div style={{borderTop:"1px solid "+c.line}}>
              <Slider label="FX buffer" value={fx} set={setFx} min={0} max={35} step={5}
                hint="Client earns in a stronger currency or the project runs long enough that depreciation is a real risk." c={c}/>
              <div style={{borderTop:"1px solid "+c.line}}/>
              <Slider label="Urgency premium" value={urg} set={setUrg} min={0} max={60} step={5}
                hint="Apply only when the timeline is genuinely compressed and you are blocking other work." c={c}/>
              <div style={{borderTop:"1px solid "+c.line}}/>
              <Slider label="Strategic discount" value={disc} set={setDisc} min={0} max={30} step={5}
                hint="Use only when you have a specific named reason. Discounting from fear: leave this at zero." c={c}/>
            </div>
            <NavBar c={c}>
              <Btn ghost c={c} onClick={()=>go(13)}>Back</Btn>
              <Btn primary c={c} onClick={()=>go(15)}>See my price</Btn>
            </NavBar>
          </div>
        </div>

        {/* 15 RESULT */}
        <div style={ss(15)}>
          <div style={inn}>
            <div style={{fontSize:11,letterSpacing:".14em",textTransform:"uppercase",color:c.muted,marginBottom:6}}>Your result</div>
            <div style={{fontFamily:SR,fontSize:16,color:c.muted,fontStyle:"italic",marginBottom:6}}>
              {prof.name?prof.name+", here is your price":"Here is your price"}
            </div>
            <div style={{display:"flex",alignItems:"flex-start",marginBottom:4}}>
              <span style={{fontFamily:SR,fontSize:20,color:c.muted,marginTop:7,marginRight:2}}>{sym}</span>
              <span style={{fontFamily:SR,fontSize:52,lineHeight:1,letterSpacing:"-.02em"}}>{Math.round(fromNGN(r.fin,curr)).toLocaleString()}</span>
            </div>
            <div style={{fontSize:12,color:c.muted,marginBottom:20}}>{"Score "+r.sc+"/25 · Multiplier "+r.mult.toFixed(2)+"x · "+curr.code}</div>

            {/* Tiers */}
            <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8,marginBottom:16}}>
              {tiers.map(t=>(
                <div key={t.k} onClick={()=>setTier(t.k)}
                  style={{border:"1px solid "+(t.k==="growth"||tier===t.k?c.gold:c.line2),borderRadius:8,padding:"12px 8px",textAlign:"center",cursor:"pointer",background:tier===t.k?c.gp:"none",transition:"all .2s"}}>
                  <div style={{fontSize:10,letterSpacing:".1em",textTransform:"uppercase",color:c.muted,marginBottom:5}}>{t.label}</div>
                  <div style={{fontFamily:SR,fontSize:13}}>{fmtFull(t.price,curr)}</div>
                  <div style={{fontSize:10,color:t.k==="growth"?c.gold:c.muted,marginTop:2}}>{t.sub}</div>
                </div>
              ))}
            </div>

            {/* GRT */}
            <div style={{display:"flex",alignItems:"center",gap:8,padding:"10px 0",borderTop:"1px solid "+c.line,borderBottom:"1px solid "+c.line,marginBottom:14}}>
              <div style={{width:7,height:7,borderRadius:"50%",background:pc,flexShrink:0}}/>
              <span style={{fontSize:13,color:pc}}>{pt}</span>
              <span style={{color:c.muted,fontSize:12,marginLeft:"auto"}}>{Math.round(r.marg*100)+"% achieved"}</span>
            </div>

            {/* Margin, editable at result */}
            <div style={{paddingTop:14,paddingBottom:4}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
                <div>
                  <span style={{fontSize:13,fontWeight:500}}>Target margin</span>
                  <span style={{fontSize:11,color:c.muted,marginLeft:8}}>{"achieved: "+Math.round(r.marg*100)+"%"}</span>
                </div>
                <span style={{fontFamily:SR,fontSize:16,color:c.gold}}>{margin+"%"}</span>
              </div>
              <input type="range" style={{background:c.line2}} min={30} max={70} step={5} value={margin} onChange={e=>setMargin(+e.target.value)}/>
            </div>

            <HR c={c}/>

            {/* Breakdown */}
            <button onClick={()=>setBkdn(o=>!o)}
              style={{display:"flex",justifyContent:"space-between",alignItems:"center",width:"100%",padding:"10px 0",fontSize:13,color:c.muted,background:"none",border:"none",borderBottom:"1px solid "+c.line,cursor:"pointer",fontFamily:SN,transition:"color .15s"}}
              onMouseEnter={e=>{e.currentTarget.style.color=c.text;}} onMouseLeave={e=>{e.currentTarget.style.color=c.muted;}}>
              Full breakdown
              <ChevronDown size={14} style={{transition:"transform .25s",transform:bkdn?"rotate(180deg)":"none",color:c.muted}}/>
            </button>
            <div style={{maxHeight:bkdn?600:0,overflow:"hidden",transition:"max-height .35s cubic-bezier(.4,0,.2,1)"}}>
              {[
                ["Time ("+r.h+" hrs x "+fm(rateNGN)+")",r.h*rateNGN,false],
                ["Hard costs",r.hard,false],["Infrastructure",r.infra,false],
                ["Cost of Revenue",r.cor,true],["Income contribution",r.cont,false],
                ["Cost Floor",r.floor,true],["Min price ("+margin+"% target)",r.minP,false],
                ["After value premium ("+r.mult.toFixed(2)+"x)",r.pre,false],
                ["Final price",r.fin,true],
              ].map(([k,v,major])=>(
                <div key={k} style={{display:"flex",justifyContent:"space-between",padding:"6px 0",borderBottom:"1px solid "+c.line,fontSize:13}}>
                  <span style={{color:major?c.text:c.muted}}>{k}</span>
                  <span style={{fontWeight:500,color:major?c.gold:c.text}}>{fm(v)}</span>
                </div>
              ))}
            </div>

            {/* TAX */}
            <div style={{marginTop:16,border:"1px solid "+c.line,borderRadius:8,overflow:"hidden"}}>
              <button onClick={()=>setIncludeTax(o=>!o)}
                style={{width:"100%",display:"flex",justifyContent:"space-between",alignItems:"center",padding:"13px 14px",background:"none",border:"none",cursor:"pointer",fontFamily:SN,color:c.text}}>
                <span style={{fontSize:13,fontWeight:500}}>Tax considerations</span>
                <ChevronDown size={14} style={{transition:"transform .25s",transform:includeTax?"rotate(180deg)":"none",color:c.muted}}/>
              </button>
              {includeTax&&(
                <div style={{borderTop:"1px solid "+c.line,padding:"14px 14px 4px"}}>
                  <Slider label={"VAT "+vatRate+"%"} value={vatRate} set={setVatRate} min={0} max={10} step={0.5}
                    hint="Add to client invoice if VAT-registered." displayVal={"+"+fm(vatAmt)} c={c}/>
                  <div style={{borderTop:"1px solid "+c.line}}/>
                  <Slider label={"Withholding Tax "+whtRate+"%"} value={whtRate} set={setWhtRate} min={0} max={15} step={0.5}
                    hint="Deducted by client. Offset against annual tax liability." displayVal={"-"+fm(whtAmt)} c={c}/>
                  <div style={{borderTop:"1px solid "+c.line,paddingTop:12,paddingBottom:14}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
                      <span style={{fontSize:13}}>{"Personal Income Tax (monthly est.)"}</span>
                      <span style={{fontSize:13,fontWeight:500,color:c.warn}}>{fm(pitMonthly)}</span>
                    </div>
                    <div style={{fontSize:11,color:c.muted}}>Your own liability, not charged to client.</div>
                  </div>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",padding:"12px 0",borderTop:"1px solid "+c.line}}>
                    <span style={{fontSize:13,fontWeight:600}}>Net receivable</span>
                    <span style={{fontFamily:SR,fontSize:20,color:c.pass}}>{fm(netRec)}</span>
                  </div>
                </div>
              )}
            </div>

            {/* QUOTE EXPORT */}
            <div style={{marginTop:12,padding:"14px 16px",borderRadius:8,border:"1px solid "+c.line}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
                <span style={{fontSize:13,fontWeight:500}}>Export quote</span>
                <button onClick={()=>printQuote({prof,clientName,brief,dlvr,timeRows,hardRows:hardNGN,fin:r.fin,vatRate,whtRate,includeTax,rate:rateNGN,weeks,margin,curr})}
                  style={{display:"inline-flex",alignItems:"center",gap:6,padding:"7px 14px",borderRadius:40,border:"1px solid "+c.line2,background:"none",color:c.text,fontSize:12,fontFamily:SN,cursor:"pointer",transition:"all .2s"}}
                  onMouseEnter={e=>{e.currentTarget.style.borderColor=c.gold;e.currentTarget.style.color=c.gold;}} onMouseLeave={e=>{e.currentTarget.style.borderColor=c.line2;e.currentTarget.style.color=c.text;}}>
                  <PrintIcon/> Print quote
                </button>
              </div>
              <div style={{fontSize:12,color:c.muted}}>Opens a print-ready quote with all deliverables and pricing.</div>
            </div>

            {/* Guide links */}
            <div style={{marginTop:16,padding:"14px 0",borderTop:"1px solid "+c.line}}>
              <div style={{fontSize:11,letterSpacing:".1em",textTransform:"uppercase",color:c.muted,marginBottom:10}}>Get the full guide</div>
              <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
                <a href="https://selar.com/worththeworkforseniors" target="_blank" rel="noreferrer"
                  style={{fontSize:13,color:c.gold,textDecoration:"none",border:"1px solid "+c.gold+"44",borderRadius:20,padding:"7px 16px",background:c.gp,transition:"all .15s"}}
                  onMouseEnter={e=>{e.currentTarget.style.borderColor=c.gold;}} onMouseLeave={e=>{e.currentTarget.style.borderColor=c.gold+"44";}}>Senior Edition</a>
                <a href="https://selar.com/worththeworkforjuniors" target="_blank" rel="noreferrer"
                  style={{fontSize:13,color:c.gold,textDecoration:"none",border:"1px solid "+c.gold+"44",borderRadius:20,padding:"7px 16px",background:c.gp,transition:"all .15s"}}
                  onMouseEnter={e=>{e.currentTarget.style.borderColor=c.gold;}} onMouseLeave={e=>{e.currentTarget.style.borderColor=c.gold+"44";}}>Junior Edition</a>
              </div>
            </div>

            <NavBar c={c}>
              <Btn ghost c={c} onClick={()=>go(14)}>Adjust</Btn>
              <Btn ghost c={c} onClick={()=>{
                setBrief("");setClientName("");setDlvr([]);setInsData({});setAiOpen(false);
                setTime([{id:1,n:"Design and delivery",h:50},{id:2,n:"Strategy and discovery",h:12},{id:3,n:"Client management",h:10},{id:4,n:"Proposal and scoping",h:8}]);
                setHardNGN([{id:1,n:"Hard costs (stock, fonts, proofs)",a:50000}]);
                setScores([3,3,3,3,3]);setFx(0);setUrg(0);setDisc(0);setWeeks(6);setTier("growth");setBkdn(false);setIncludeTax(false);
                go(10);
              }}>New project</Btn>
            </NavBar>
            <div style={{fontSize:11,color:c.faint,textAlign:"center",marginTop:16,marginBottom:8,letterSpacing:".05em"}}>Worth the Work · Created by Bolutife Awakan · 2026</div>
          </div>
        </div>

      </div>

      {/* INTELLIGENCE OVERLAY */}
      {aiOpen&&<div onClick={()=>setAiOpen(false)} style={{position:"absolute",inset:0,background:"rgba(0,0,0,.45)",zIndex:290,backdropFilter:"blur(2px)",WebkitBackdropFilter:"blur(2px)"}}/>}

      {/* INTELLIGENCE DRAWER */}
      <div style={{position:"absolute",right:0,top:0,bottom:0,width:Math.min(380,window.innerWidth),background:c.bg2,borderLeft:"1px solid "+c.line,zIndex:291,display:"flex",flexDirection:"column",transform:aiOpen?"translateX(0)":"translateX(100%)",transition:"transform .35s cubic-bezier(.4,0,.2,1)"}}>
        <div style={{padding:"16px 18px",borderBottom:"1px solid "+c.line,display:"flex",alignItems:"center",justifyContent:"space-between",flexShrink:0}}>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <StarIcon color={c.gold}/>
            <span style={{fontFamily:SR,fontSize:18}}>Intelligence</span>
            <span style={{width:5,height:5,borderRadius:"50%",background:c.gold}}/>
          </div>
          <button onClick={()=>setAiOpen(false)} style={{background:"none",border:"none",cursor:"pointer",color:c.muted,lineHeight:1,padding:4,transition:"color .15s",display:"flex",alignItems:"center"}}
            onMouseEnter={e=>{e.currentTarget.style.color=c.text;}} onMouseLeave={e=>{e.currentTarget.style.color=c.muted;}}>
            <ChevronRight size={18}/>
          </button>
        </div>
        <div style={{flex:1,overflowY:"auto",padding:"0 18px 24px"}}>
          <div style={{fontSize:13,color:c.muted,padding:"14px 0 4px",lineHeight:1.65,borderBottom:"1px solid "+c.line,marginBottom:4}}>
            Tap any insight to generate. Your full pricing picture is used automatically.
          </div>
          {INSIGHTS.map((ins,idx)=>(
            <div key={ins.id}
              onClick={()=>!insData[ins.id]&&!insLoad[ins.id]&&getInsight(ins.id)}
              style={{padding:"16px 0",borderBottom:"1px solid "+c.line,cursor:insData[ins.id]?"default":"pointer",transition:"opacity .15s"}}
              onMouseEnter={e=>{if(!insData[ins.id])e.currentTarget.style.opacity=.8;}} onMouseLeave={e=>{e.currentTarget.style.opacity=1;}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:insData[ins.id]||insLoad[ins.id]?10:0}}>
                <div style={{display:"flex",alignItems:"center",gap:10}}>
                  <span style={{fontSize:10,letterSpacing:".1em",color:c.gold,fontWeight:500,minWidth:20}}>{"0"+(idx+1)}</span>
                  <span style={{fontSize:13,fontWeight:500,color:insData[ins.id]?c.text:c.muted,transition:"color .2s"}}>{ins.label}</span>
                </div>
                {!insData[ins.id]&&!insLoad[ins.id]&&<ChevronRight size={14}/>}
              </div>
              {insLoad[ins.id]&&(
                <div style={{paddingLeft:30,display:"flex",gap:5,alignItems:"center"}}>
                  {[0,1,2].map(i=><span key={i} style={{width:5,height:5,borderRadius:"50%",background:c.gold,display:"inline-block",opacity:.5}}/>)}
                </div>
              )}
              {insData[ins.id]&&(
                <div style={{fontSize:13,color:c.text,lineHeight:1.8,paddingLeft:30,borderLeft:"2px solid "+c.gold,marginLeft:0}}>
                  {insData[ins.id]}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
