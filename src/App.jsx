/* eslint-disable react-hooks/exhaustive-deps */
import { useState, useRef, useCallback, useEffect } from "react";

const FONT   = "'Cormorant Garamond', 'Palatino Linotype', Palatino, 'Book Antiqua', Georgia, serif";
const PURPLE = "#9B7FC2";
const DARK   = "#2D2040";
const BG     = "#F7F4FB";
const CARD_BG= "#FDFBFF";

const PLACEHOLDER_COLORS = ["#E8D5C4","#C4D5E8","#D5E8C4","#E8C4D5","#D5C4E8","#E8E4C4"];

const CLASS_COLORS = [
  { bg:"#F3EEFB", accent:"#9B7FC2" },
  { bg:"#EEF2FF", accent:"#6B7FD4" },
  { bg:"#FDF2F8", accent:"#C26BA0" },
  { bg:"#FFF0FB", accent:"#B85CC4" },
  { bg:"#F0F4FF", accent:"#7B8FD4" },
  { bg:"#FFF7ED", accent:"#C2783C" },
];

const CLASS_EMOJIS = ["🧘","🌿","🌸","✨","🌊","🍃","☀️","🌙","🔥","💫"];
const GRID_EMOJIS  = ["🖼️","📸","🌺","🌻","🦋","🌈","🎨","💐","🍀","⭐"];

const DEFAULT_CLASSES = [
  { id:1, name:"Morning Flow",  emoji:"☀️", colorIdx:0, poses:[
    { name:"Mountain Pose", duration:30, imageId:null },
    { name:"Warrior I",     duration:45, imageId:null },
    { name:"Warrior II",    duration:45, imageId:null },
    { name:"Tree Pose",     duration:30, imageId:null },
  ]},
  { id:2, name:"Chair Yoga", emoji:"🪑", colorIdx:2, poses:[
    { name:"Seated Cat-Cow", duration:30, imageId:null },
    { name:"Seated Twist",   duration:30, imageId:null },
  ]},
  { id:3, name:"Kids Yoga",  emoji:"🌸", colorIdx:3, poses:[
    { name:"Happy Baby",     duration:20, imageId:null },
    { name:"Butterfly Pose", duration:20, imageId:null },
    { name:"Lion Pose",      duration:15, imageId:null },
  ]},
];

// ─── IndexedDB ────────────────────────────────────────────────────────────────
var DB_NAME="yogaImagesDB", DB_VERSION=1, STORE_NAME="images", idbInstance=null;

function openDB() {
  return new Promise(function(resolve,reject){
    if (idbInstance){ resolve(idbInstance); return; }
    var req=indexedDB.open(DB_NAME,DB_VERSION);
    req.onupgradeneeded=function(e){ e.target.result.createObjectStore(STORE_NAME); };
    req.onsuccess=function(e){ idbInstance=e.target.result; resolve(idbInstance); };
    req.onerror=function(e){ reject(e); };
  });
}
function saveImageToDB(id,url){
  return openDB().then(function(db){
    return new Promise(function(resolve,reject){
      var req=db.transaction(STORE_NAME,"readwrite").objectStore(STORE_NAME).put(url,id);
      req.onsuccess=function(){ resolve(); }; req.onerror=function(e){ reject(e); };
    });
  });
}
function loadImageFromDB(id){
  return openDB().then(function(db){
    return new Promise(function(resolve,reject){
      var req=db.transaction(STORE_NAME,"readonly").objectStore(STORE_NAME).get(id);
      req.onsuccess=function(e){ resolve(e.target.result||null); }; req.onerror=function(e){ reject(e); };
    });
  });
}
function deleteImageFromDB(id){
  return openDB().then(function(db){
    return new Promise(function(resolve,reject){
      var req=db.transaction(STORE_NAME,"readwrite").objectStore(STORE_NAME).delete(id);
      req.onsuccess=function(){ resolve(); }; req.onerror=function(e){ reject(e); };
    });
  });
}

// ─── localStorage ─────────────────────────────────────────────────────────────
var CLASSES_KEY="yogaClassBuilder_v2", GRIDS_KEY="yogaGrids_v1", NEXT_ID_KEY="yogaNextId";
function loadClasses(){ try{ var r=localStorage.getItem(CLASSES_KEY); if(r) return JSON.parse(r); }catch(e){} return DEFAULT_CLASSES; }
function saveClasses(c){ try{ localStorage.setItem(CLASSES_KEY,JSON.stringify(c)); }catch(e){} }
function loadGrids(){ try{ var r=localStorage.getItem(GRIDS_KEY); if(r) return JSON.parse(r); }catch(e){} return []; }
function saveGrids(g){ try{ localStorage.setItem(GRIDS_KEY,JSON.stringify(g)); }catch(e){} }
function loadNextId(){ try{ var r=localStorage.getItem(NEXT_ID_KEY); if(r) return parseInt(r,10); }catch(e){} return 100; }
function saveNextId(id){ try{ localStorage.setItem(NEXT_ID_KEY,String(id)); }catch(e){} }
function genId(){ return "img_"+Date.now()+"_"+Math.random().toString(36).slice(2,8); }
function formatTime(s){ var m=Math.floor(s/60),sec=s%60; if(m>0&&sec>0) return m+"m "+sec+"s"; if(m>0) return m+"m"; return sec+"s"; }

// ─── Shared UI atoms ──────────────────────────────────────────────────────────
function Sheet({ children, onClose }){
  return (
    <div style={{ position:"fixed",inset:0,background:"rgba(0,0,0,0.45)",display:"flex",alignItems:"flex-end",zIndex:100,backdropFilter:"blur(4px)" }}
      onClick={function(e){ if(e.target===e.currentTarget) onClose(); }}>
      <div style={{ background:CARD_BG,borderRadius:"24px 24px 0 0",padding:"28px 24px 40px",width:"100%",boxSizing:"border-box",maxWidth:"480px",margin:"0 auto",maxHeight:"85vh",overflowY:"auto" }}>
        <div style={{ width:"36px",height:"4px",background:"#D1D5DB",borderRadius:"2px",margin:"0 auto 24px" }} />
        {children}
      </div>
    </div>
  );
}
function Label({ children }){
  return <div style={{ fontSize:"11px",fontWeight:"700",color:"#718096",marginBottom:"6px",textTransform:"uppercase",letterSpacing:"0.06em",fontFamily:FONT }}>{children}</div>;
}
function PrimaryBtn({ children, onClick, disabled }){
  return (
    <button onClick={onClick} disabled={disabled} style={{ width:"100%",padding:"16px",borderRadius:"14px",border:"none",background:disabled?"#D1D5DB":PURPLE,color:"#fff",fontSize:"17px",fontWeight:"700",cursor:disabled?"not-allowed":"pointer",fontFamily:FONT,transition:"background 0.2s" }}>{children}</button>
  );
}
function NavBtn({ children, onClick, disabled }){
  return (
    <button onClick={onClick} disabled={disabled} style={{ width:"48px",height:"48px",borderRadius:"50%",background:"rgba(255,255,255,0.1)",border:"none",color:disabled?"rgba(255,255,255,0.2)":"#fff",fontSize:"20px",cursor:disabled?"not-allowed":"pointer",display:"flex",alignItems:"center",justifyContent:"center" }}>{children}</button>
  );
}
function FAB({ label, onClick }){
  return (
    <button onClick={onClick} style={{ position:"fixed",bottom:"32px",right:"50%",transform:"translateX(50%)",maxWidth:"calc(480px - 48px)",width:"calc(100% - 48px)",padding:"18px",borderRadius:"18px",border:"none",background:"linear-gradient(135deg, #9B7FC2, #6B4FA8)",color:"#fff",fontSize:"17px",fontWeight:"700",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:"8px",boxShadow:"0 6px 24px rgba(155,127,194,0.45)",fontFamily:FONT,zIndex:20 }}>
      <span style={{ fontSize:"22px",lineHeight:1 }}>+</span> {label}
    </button>
  );
}

// ─── NamedModal (shared for class + grid creation/edit) ───────────────────────
function NamedModal({ title, emojis, onClose, onSave, existing }){
  var isEdit=!!existing;
  const [name,setName]=useState(existing?existing.name:"");
  const [emoji,setEmoji]=useState(existing?existing.emoji:emojis[0]);
  const [colorIdx,setColorIdx]=useState(existing?existing.colorIdx:0);
  return (
    <Sheet onClose={onClose}>
      <h3 style={{ margin:"0 0 20px",fontSize:"20px",fontWeight:"700",color:DARK,fontFamily:FONT }}>{isEdit?"Edit":"New"} {title}</h3>
      <Label>Name</Label>
      <input autoFocus value={name} onChange={function(e){ setName(e.target.value); }} placeholder={"e.g. My "+title}
        style={{ width:"100%",padding:"13px 16px",borderRadius:"12px",border:"1.5px solid #E2E8F0",background:"#fff",fontSize:"16px",color:DARK,outline:"none",boxSizing:"border-box",fontFamily:FONT,marginBottom:"18px" }} />
      <Label>Icon</Label>
      <div style={{ display:"flex",flexWrap:"wrap",gap:"8px",marginBottom:"18px" }}>
        {emojis.map(function(e){
          return <button key={e} onClick={function(){ setEmoji(e); }} style={{ width:"40px",height:"40px",borderRadius:"10px",border:"2px solid",borderColor:emoji===e?PURPLE:"#E2E8F0",background:emoji===e?"#F3EEFB":"#fff",fontSize:"20px",cursor:"pointer" }}>{e}</button>;
        })}
      </div>
      <Label>Color</Label>
      <div style={{ display:"flex",gap:"8px",marginBottom:"24px" }}>
        {CLASS_COLORS.map(function(c,i){
          return <button key={i} onClick={function(){ setColorIdx(i); }} style={{ width:"32px",height:"32px",borderRadius:"50%",background:c.accent,border:"3px solid",borderColor:colorIdx===i?DARK:"transparent",cursor:"pointer" }} />;
        })}
      </div>
      <PrimaryBtn disabled={!name.trim()} onClick={function(){ if(!name.trim()) return; onSave({name:name.trim(),emoji:emoji,colorIdx:colorIdx}); onClose(); }}>
        {isEdit?"Save Changes":"Create "+title}
      </PrimaryBtn>
    </Sheet>
  );
}

// ─── DBImage: loads an image from IndexedDB by imageId ────────────────────────
function DBImage({ imageId, style, fallback }){
  const [src,setSrc]=useState(null);
  useEffect(function(){
    if(!imageId){ setSrc(null); return; }
    loadImageFromDB(imageId).then(function(d){ setSrc(d||null); }).catch(function(){ setSrc(null); });
  },[imageId]);
  if(!src) return fallback||null;
  return <img src={src} alt="" style={style} />;
}

// ─── PoseCard ─────────────────────────────────────────────────────────────────
function PoseCard({ pose, index, onDelete, onDragStart, boardMode }){
  const [pressing,setPressing]=useState(false);
  const timer=useRef(null);
  return (
    <div style={{ display:"flex",flexDirection:"column",alignItems:"center",gap:"6px",cursor:boardMode?"grab":"default",transform:pressing?"scale(1.04)":"scale(1)",transition:"transform 0.15s",userSelect:"none",WebkitUserSelect:"none" }}
      onTouchStart={function(e){ if(!boardMode) return; setPressing(true); timer.current=setTimeout(function(){ onDragStart(e,index,"touch"); },300); }}
      onTouchEnd={function(){ clearTimeout(timer.current); setPressing(false); }}
      onMouseDown={function(e){ if(boardMode) onDragStart(e,index,"mouse"); }}>
      <div style={{ width:"90px",height:"110px",borderRadius:"16px",overflow:"hidden",boxShadow:"0 2px 12px rgba(0,0,0,0.12)",background:PLACEHOLDER_COLORS[index%PLACEHOLDER_COLORS.length],position:"relative",flexShrink:0 }}>
        <DBImage imageId={pose.imageId} style={{ width:"100%",height:"100%",objectFit:"cover" }} fallback={<div style={{ width:"100%",height:"100%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"32px" }}>🧘</div>} />
        {boardMode && <button onClick={function(e){ e.stopPropagation(); onDelete(index); }} style={{ position:"absolute",top:"5px",right:"5px",width:"22px",height:"22px",borderRadius:"50%",background:"rgba(0,0,0,0.55)",border:"none",color:"#fff",fontSize:"13px",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",padding:0,zIndex:2 }}>x</button>}
        <div style={{ position:"absolute",bottom:"5px",left:"5px",background:"rgba(0,0,0,0.45)",color:"#fff",borderRadius:"8px",fontSize:"11px",fontWeight:"600",padding:"2px 7px",fontFamily:FONT }}>{index+1}</div>
      </div>
      <div style={{ fontSize:"11px",fontWeight:"500",color:"#4A5568",textAlign:"center",maxWidth:"90px",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",fontFamily:FONT }}>{pose.name}</div>
      <div style={{ fontSize:"10px",color:PURPLE,fontWeight:"600",fontFamily:FONT }}>{pose.duration}s</div>
    </div>
  );
}

// ─── AddPoseModal ─────────────────────────────────────────────────────────────
function AddPoseModal({ onClose, onAdd }){
  const [name,setName]=useState("");
  const [duration,setDuration]=useState("30");
  const [preview,setPreview]=useState(null);
  const [imgData,setImgData]=useState(null);
  const fileRef=useRef();
  var handleFile=function(e){
    var f=e.target.files[0]; if(!f) return;
    var r=new FileReader(); r.onload=function(ev){ setPreview(ev.target.result); setImgData(ev.target.result); }; r.readAsDataURL(f);
  };
  var handleAdd=function(){
    if(!name.trim()) return;
    var imageId=imgData?genId():null;
    var p=(imageId?saveImageToDB(imageId,imgData):Promise.resolve());
    p.then(function(){ onAdd({name:name.trim(),duration:parseInt(duration)||30,imageId:imageId}); onClose(); }).catch(function(){ onAdd({name:name.trim(),duration:parseInt(duration)||30,imageId:null}); onClose(); });
  };
  return (
    <Sheet onClose={onClose}>
      <h3 style={{ margin:"0 0 20px",fontSize:"20px",fontWeight:"700",color:DARK,fontFamily:FONT }}>Add Pose</h3>
      <div onClick={function(){ fileRef.current.click(); }} style={{ height:"160px",background:preview?"transparent":"#F3EEFB",borderRadius:"16px",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",marginBottom:"16px",overflow:"hidden",border:preview?"none":"2px dashed #C4A8E0",position:"relative" }}>
        {preview?(<><img src={preview} alt="" style={{ width:"100%",height:"100%",objectFit:"cover" }} /><div style={{ position:"absolute",inset:0,background:"rgba(0,0,0,0.25)",display:"flex",alignItems:"center",justifyContent:"center" }}><span style={{ color:"#fff",fontSize:"13px",fontWeight:"600" }}>Tap to change</span></div></>)
        :(<div style={{ textAlign:"center" }}><div style={{ fontSize:"36px",marginBottom:"8px" }}>📷</div><div style={{ fontSize:"14px",color:PURPLE,fontWeight:"600" }}>Upload pose photo</div><div style={{ fontSize:"12px",color:"#A0AEC0",marginTop:"4px" }}>or skip to use emoji</div></div>)}
      </div>
      <input ref={fileRef} type="file" accept="image/*" style={{ display:"none" }} onChange={handleFile} />
      <Label>Pose Name</Label>
      <input value={name} onChange={function(e){ setName(e.target.value); }} placeholder="e.g. Warrior I"
        style={{ width:"100%",padding:"13px 16px",borderRadius:"12px",border:"1.5px solid #E2E8F0",background:"#fff",fontSize:"16px",color:DARK,outline:"none",boxSizing:"border-box",fontFamily:FONT,marginBottom:"14px" }} />
      <Label>Hold Duration (seconds)</Label>
      <div style={{ display:"flex",gap:"8px",marginBottom:"24px" }}>
        {[15,30,45,60].map(function(s){ return (
          <button key={s} onClick={function(){ setDuration(String(s)); }} style={{ flex:1,padding:"10px",borderRadius:"10px",border:"1.5px solid",borderColor:duration===String(s)?PURPLE:"#E2E8F0",background:duration===String(s)?PURPLE:"#fff",color:duration===String(s)?"#fff":"#4A5568",fontSize:"14px",fontWeight:"600",cursor:"pointer",fontFamily:FONT }}>{s}s</button>
        ); })}
      </div>
      <PrimaryBtn disabled={!name.trim()} onClick={handleAdd}>Add to Class</PrimaryBtn>
    </Sheet>
  );
}

// ─── SwapModal ────────────────────────────────────────────────────────────────
function SwapModal({ poses, targetIndex, onSwap, onClose }){
  return (
    <Sheet onClose={onClose}>
      <h3 style={{ margin:"0 0 6px",fontSize:"20px",fontWeight:"700",color:DARK,fontFamily:FONT }}>Swap Pose</h3>
      <p style={{ margin:"0 0 20px",fontSize:"14px",color:"#718096",fontFamily:FONT }}>Swapping "{poses[targetIndex]?poses[targetIndex].name:""}" — tap a pose to swap</p>
      <div style={{ display:"flex",flexWrap:"wrap",gap:"12px",maxHeight:"260px",overflowY:"auto" }}>
        {poses.map(function(pose,i){ if(i===targetIndex) return null; return (
          <div key={i} onClick={function(){ onSwap(targetIndex,i); onClose(); }} style={{ cursor:"pointer" }}>
            <PoseCard pose={pose} index={i} onDelete={function(){}} onDragStart={function(){}} boardMode={false} />
          </div>
        ); })}
      </div>
      <button onClick={onClose} style={{ width:"100%",marginTop:"20px",padding:"14px",borderRadius:"14px",border:"none",background:"#EDF2F7",color:"#4A5568",fontSize:"16px",fontWeight:"600",cursor:"pointer",fontFamily:FONT }}>Cancel</button>
    </Sheet>
  );
}

// ─── PlayerView ───────────────────────────────────────────────────────────────
function PlayerView({ poses, onClose }){
  const [current,setCurrent]=useState(0);
  const [timeLeft,setTimeLeft]=useState(poses[0]?poses[0].duration:30);
  const [paused,setPaused]=useState(false);
  useEffect(function(){
    if(paused) return;
    if(timeLeft<=0){ if(current<poses.length-1){ var n=current+1; setCurrent(n); setTimeLeft(poses[n].duration); } return; }
    var t=setTimeout(function(){ setTimeLeft(function(p){ return p-1; }); },1000);
    return function(){ clearTimeout(t); };
  },[timeLeft,paused,current,poses]);
  var pose=poses[current];
  var progress=pose?(pose.duration-timeLeft)/pose.duration:0;
  return (
    <div style={{ position:"fixed",inset:0,background:"#1A1028",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",zIndex:200,fontFamily:FONT }}>
      <button onClick={onClose} style={{ position:"absolute",top:"20px",right:"20px",background:"rgba(255,255,255,0.1)",border:"none",color:"#fff",borderRadius:"50%",width:"36px",height:"36px",fontSize:"18px",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center" }}>x</button>
      <div style={{ color:PURPLE,fontSize:"13px",fontWeight:"600",marginBottom:"12px",letterSpacing:"0.1em" }}>POSE {current+1} OF {poses.length}</div>
      <div style={{ width:"240px",height:"280px",borderRadius:"24px",overflow:"hidden",background:PLACEHOLDER_COLORS[current%PLACEHOLDER_COLORS.length],marginBottom:"32px",boxShadow:"0 8px 40px rgba(0,0,0,0.5)",display:"flex",alignItems:"center",justifyContent:"center" }}>
        {pose && <DBImage imageId={pose.imageId} style={{ width:"100%",height:"100%",objectFit:"cover" }} fallback={<span style={{ fontSize:"80px" }}>🧘</span>} />}
      </div>
      <h2 style={{ color:"#fff",fontSize:"28px",fontWeight:"700",margin:"0 0 8px" }}>{pose?pose.name:""}</h2>
      <div style={{ fontSize:"64px",fontWeight:"300",color:"#fff",margin:"8px 0",letterSpacing:"-2px" }}>{timeLeft}<span style={{ fontSize:"22px",color:PURPLE,marginLeft:"4px" }}>s</span></div>
      <div style={{ width:"200px",height:"4px",background:"rgba(255,255,255,0.1)",borderRadius:"2px",margin:"0 0 32px",overflow:"hidden" }}>
        <div style={{ height:"100%",width:(progress*100)+"%",background:PURPLE,borderRadius:"2px",transition:"width 0.5s linear" }} />
      </div>
      <div style={{ display:"flex",gap:"16px",alignItems:"center" }}>
        <NavBtn disabled={current===0} onClick={function(){ if(current>0){ var n=current-1; setCurrent(n); setTimeLeft(poses[n].duration); } }}>&#8249;</NavBtn>
        <button onClick={function(){ setPaused(function(p){ return !p; }); }} style={{ width:"64px",height:"64px",borderRadius:"50%",background:PURPLE,border:"none",color:"#fff",fontSize:"26px",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 4px 20px rgba(155,127,194,0.5)" }}>{paused?">":"||"}</button>
        <NavBtn disabled={current===poses.length-1} onClick={function(){ if(current<poses.length-1){ var n=current+1; setCurrent(n); setTimeLeft(poses[n].duration); } }}>&#8250;</NavBtn>
      </div>
      {current<poses.length-1 && <div style={{ position:"absolute",bottom:"40px",color:"rgba(255,255,255,0.5)",fontSize:"13px" }}>Next: <span style={{ color:"rgba(255,255,255,0.8)",fontWeight:"600" }}>{poses[current+1].name}</span></div>}
    </div>
  );
}

// ─── ClassEditor ──────────────────────────────────────────────────────────────
function ClassEditor({ cls, onBack, onUpdate }){
  const [poses,setPoses]=useState(cls.poses);
  const [showAdd,setShowAdd]=useState(false);
  const [swapTarget,setSwapTarget]=useState(null);
  const [showPlayer,setShowPlayer]=useState(false);
  const [dragIndex,setDragIndex]=useState(null);
  const [dragOver,setDragOver]=useState(null);
  var dragData=useRef({});
  var color=CLASS_COLORS[cls.colorIdx||0];

  useEffect(function(){ onUpdate(cls.id,{poses:poses}); },[poses]);

  var handleDragStart=useCallback(function(e,index){
    setDragIndex(index); dragData.current={startIndex:index};
    var onMove=function(ev){ var el=document.elementFromPoint(ev.clientX,ev.clientY); var card=el?el.closest("[data-pose-index]"):null; if(card) setDragOver(parseInt(card.getAttribute("data-pose-index"))); };
    var onUp=function(){ document.removeEventListener("mousemove",onMove); document.removeEventListener("mouseup",onUp); setDragIndex(null); setDragOver(function(over){ if(over!==null&&dragData.current.startIndex!==null&&over!==dragData.current.startIndex){ setPoses(function(prev){ var arr=prev.slice(); var moved=arr.splice(dragData.current.startIndex,1)[0]; arr.splice(over,0,moved); return arr; }); } return null; }); };
    document.addEventListener("mousemove",onMove); document.addEventListener("mouseup",onUp);
  },[]);

  var handleDelete=function(idx){ var p=poses[idx]; if(p&&p.imageId) deleteImageFromDB(p.imageId).catch(function(){}); setPoses(function(prev){ return prev.filter(function(_,j){ return j!==idx; }); }); };
  var total=poses.reduce(function(s,p){ return s+p.duration; },0);

  return (
    <div style={{ minHeight:"100vh",background:BG,fontFamily:FONT,maxWidth:"480px",margin:"0 auto" }}>
      <div style={{ background:CARD_BG,padding:"16px 24px 0",borderBottom:"1px solid rgba(0,0,0,0.06)",position:"sticky",top:0,zIndex:10 }}>
        <button onClick={onBack} style={{ background:"none",border:"none",color:PURPLE,fontSize:"15px",fontWeight:"700",cursor:"pointer",padding:"0 0 12px",display:"flex",alignItems:"center",gap:"4px",fontFamily:FONT }}>&#8249; Ruthie's Classes</button>
        <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"16px" }}>
          <div style={{ display:"flex",alignItems:"center",gap:"12px" }}>
            <div style={{ width:"44px",height:"44px",borderRadius:"12px",background:color.bg,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"24px" }}>{cls.emoji}</div>
            <div><div style={{ fontSize:"11px",color:PURPLE,fontWeight:"700",letterSpacing:"0.08em" }}>CLASS</div><h1 style={{ margin:0,fontSize:"22px",fontWeight:"800",color:DARK }}>{cls.name}</h1></div>
          </div>
          {poses.length>0 && <button onClick={function(){ setShowPlayer(true); }} style={{ padding:"10px 18px",borderRadius:"14px",border:"none",background:DARK,color:"#fff",fontSize:"14px",fontWeight:"700",cursor:"pointer",fontFamily:FONT }}>&#9654; Start</button>}
        </div>
        <div style={{ display:"flex",gap:"20px",paddingBottom:"14px" }}>
          <div><div style={{ fontSize:"20px",fontWeight:"800",color:DARK }}>{poses.length}</div><div style={{ fontSize:"11px",color:"#718096" }}>poses</div></div>
          <div style={{ width:"1px",background:"#E2E8F0" }} />
          <div><div style={{ fontSize:"20px",fontWeight:"800",color:DARK }}>{formatTime(total)}</div><div style={{ fontSize:"11px",color:"#718096" }}>total</div></div>
          <div style={{ width:"1px",background:"#E2E8F0" }} />
          <div><div style={{ fontSize:"20px",fontWeight:"800",color:DARK }}>{poses.length>0?Math.round(total/poses.length)+"s":"0s"}</div><div style={{ fontSize:"11px",color:"#718096" }}>avg hold</div></div>
        </div>
      </div>
      <div style={{ padding:"20px 20px 120px" }}>
        {poses.length===0?(
          <div style={{ textAlign:"center",padding:"60px 20px",color:"#A0AEC0" }}><div style={{ fontSize:"56px",marginBottom:"16px" }}>{cls.emoji}</div><div style={{ fontSize:"18px",fontWeight:"700",color:"#4A5568",marginBottom:"8px" }}>Build your flow</div><div style={{ fontSize:"14px" }}>Tap + to add your first pose</div></div>
        ):(
          <div style={{ display:"flex",flexWrap:"wrap",gap:"18px" }}>
            {poses.map(function(pose,i){ return (
              <div key={i} data-pose-index={i} style={{ opacity:dragIndex===i?0.4:1,transform:dragOver===i&&dragIndex!==i?"scale(1.06)":"scale(1)",transition:"opacity 0.2s,transform 0.2s" }}>
                <PoseCard pose={pose} index={i} boardMode onDelete={handleDelete} onDragStart={handleDragStart} />
                <button onClick={function(){ setSwapTarget(i); }} style={{ display:"block",margin:"4px auto 0",padding:"3px 10px",borderRadius:"8px",border:"1px solid #D1D5DB",background:"#fff",color:"#718096",fontSize:"10px",fontWeight:"600",cursor:"pointer",fontFamily:FONT }}>Swap</button>
              </div>
            ); })}
          </div>
        )}
        {poses.length>1 && (
          <div style={{ marginTop:"28px" }}>
            <div style={{ fontSize:"12px",color:"#718096",fontWeight:"700",marginBottom:"12px",letterSpacing:"0.06em" }}>SEQUENCE ORDER</div>
            <div style={{ background:"#fff",borderRadius:"16px",overflow:"hidden",boxShadow:"0 2px 8px rgba(0,0,0,0.06)" }}>
              {poses.map(function(pose,i){ return (
                <div key={i} style={{ display:"flex",alignItems:"center",padding:"12px 16px",borderBottom:i<poses.length-1?"1px solid #F0F0EE":"none",gap:"12px" }}>
                  <div style={{ width:"28px",height:"28px",borderRadius:"50%",background:"#F3EEFB",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"13px",fontWeight:"700",color:PURPLE,flexShrink:0 }}>{i+1}</div>
                  <div style={{ width:"36px",height:"36px",borderRadius:"8px",overflow:"hidden",background:PLACEHOLDER_COLORS[i%PLACEHOLDER_COLORS.length],display:"flex",alignItems:"center",justifyContent:"center",fontSize:"18px",flexShrink:0 }}>
                    <DBImage imageId={pose.imageId} style={{ width:"100%",height:"100%",objectFit:"cover" }} fallback={<span>🧘</span>} />
                  </div>
                  <div style={{ flex:1,minWidth:0 }}><div style={{ fontSize:"15px",fontWeight:"600",color:DARK }}>{pose.name}</div><div style={{ fontSize:"12px",color:"#A0AEC0" }}>Hold for {pose.duration}s</div></div>
                  <button onClick={function(){ handleDelete(i); }} style={{ padding:"6px",border:"none",background:"none",color:"#CBD5E0",fontSize:"16px",cursor:"pointer" }}>x</button>
                </div>
              ); })}
            </div>
          </div>
        )}
      </div>
      <FAB label="Add Pose" onClick={function(){ setShowAdd(true); }} />
      {showAdd && <AddPoseModal onClose={function(){ setShowAdd(false); }} onAdd={function(p){ setPoses(function(prev){ return prev.concat([p]); }); }} />}
      {swapTarget!==null && <SwapModal poses={poses} targetIndex={swapTarget} onSwap={function(a,b){ setPoses(function(prev){ var arr=prev.slice(); var tmp=arr[a]; arr[a]=arr[b]; arr[b]=tmp; return arr; }); }} onClose={function(){ setSwapTarget(null); }} />}
      {showPlayer && <PlayerView poses={poses} onClose={function(){ setShowPlayer(false); }} />}
    </div>
  );
}

// ─── GridPhotoTile ────────────────────────────────────────────────────────────
function GridPhotoTile({ photo, index, onDelete, onDragStart, isDragging, isDragOver }){
  const [pressing,setPressing]=useState(false);
  const timer=useRef(null);
  return (
    <div
      data-grid-index={index}
      style={{ position:"relative",paddingBottom:"100%",borderRadius:"12px",overflow:"hidden",background:PLACEHOLDER_COLORS[index%PLACEHOLDER_COLORS.length],boxShadow:isDragOver?"0 0 0 3px "+PURPLE+", 0 4px 16px rgba(0,0,0,0.18)":"0 2px 8px rgba(0,0,0,0.12)",opacity:isDragging?0.4:1,transform:isDragOver&&!isDragging?"scale(1.05)":"scale(1)",transition:"opacity 0.2s,transform 0.2s,box-shadow 0.2s",cursor:"grab",userSelect:"none",WebkitUserSelect:"none" }}
      onTouchStart={function(e){ setPressing(true); timer.current=setTimeout(function(){ onDragStart(e,index,"touch"); },300); }}
      onTouchEnd={function(){ clearTimeout(timer.current); setPressing(false); }}
      onMouseDown={function(e){ onDragStart(e,index,"mouse"); }}
    >
      <div style={{ position:"absolute",inset:0 }}>
        <DBImage imageId={photo.imageId} style={{ width:"100%",height:"100%",objectFit:"cover" }} fallback={<div style={{ width:"100%",height:"100%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"28px" }}>📷</div>} />
        <button onClick={function(e){ e.stopPropagation(); onDelete(index); }} style={{ position:"absolute",top:"5px",right:"5px",width:"22px",height:"22px",borderRadius:"50%",background:"rgba(0,0,0,0.6)",border:"none",color:"#fff",fontSize:"13px",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",padding:0,zIndex:2 }}>x</button>
      </div>
    </div>
  );
}

// ─── AddPhotosModal ───────────────────────────────────────────────────────────
function AddPhotosModal({ onClose, onAdd }){
  const [previews,setPreviews]=useState([]);
  const [imgDatas,setImgDatas]=useState([]);
  const fileRef=useRef();

  var handleFiles=function(e){
    var files=Array.from(e.target.files);
    files.forEach(function(file){
      var r=new FileReader();
      r.onload=function(ev){
        setPreviews(function(prev){ return prev.concat([ev.target.result]); });
        setImgDatas(function(prev){ return prev.concat([ev.target.result]); });
      };
      r.readAsDataURL(file);
    });
  };

  var handleAdd=function(){
    var promises=imgDatas.map(function(data){
      var imageId=genId();
      return saveImageToDB(imageId,data).then(function(){ return {imageId:imageId}; }).catch(function(){ return {imageId:null}; });
    });
    Promise.all(promises).then(function(photos){
      onAdd(photos);
      onClose();
    });
  };

  return (
    <Sheet onClose={onClose}>
      <h3 style={{ margin:"0 0 20px",fontSize:"20px",fontWeight:"700",color:DARK,fontFamily:FONT }}>Add Photos</h3>
      <div onClick={function(){ fileRef.current.click(); }} style={{ minHeight:"120px",background:"#F3EEFB",borderRadius:"16px",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",marginBottom:"16px",border:"2px dashed #C4A8E0",padding:"16px",boxSizing:"border-box" }}>
        {previews.length===0?(
          <div style={{ textAlign:"center" }}><div style={{ fontSize:"36px",marginBottom:"8px" }}>📷</div><div style={{ fontSize:"14px",color:PURPLE,fontWeight:"600" }}>Tap to choose photos</div><div style={{ fontSize:"12px",color:"#A0AEC0",marginTop:"4px" }}>You can select multiple at once</div></div>
        ):(
          <div style={{ display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:"6px",width:"100%" }}>
            {previews.map(function(src,i){ return <div key={i} style={{ paddingBottom:"100%",position:"relative",borderRadius:"8px",overflow:"hidden" }}><img src={src} alt="" style={{ position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"cover" }} /></div>; })}
            <div onClick={function(e){ e.stopPropagation(); fileRef.current.click(); }} style={{ paddingBottom:"100%",position:"relative",borderRadius:"8px",background:"#E9E0F5",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer" }}>
              <div style={{ position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"24px",color:PURPLE }}>+</div>
            </div>
          </div>
        )}
      </div>
      <input ref={fileRef} type="file" accept="image/*" multiple style={{ display:"none" }} onChange={handleFiles} />
      <PrimaryBtn disabled={previews.length===0} onClick={handleAdd}>Add {previews.length>0?previews.length+" ":""} Photo{previews.length!==1?"s":""} to Grid</PrimaryBtn>
    </Sheet>
  );
}

// ─── GridEditor ───────────────────────────────────────────────────────────────
function GridEditor({ grid, onBack, onUpdate }){
  const [photos,setPhotos]=useState(grid.photos||[]);
  const [showAdd,setShowAdd]=useState(false);
  const [dragIndex,setDragIndex]=useState(null);
  const [dragOver,setDragOver]=useState(null);
  var dragData=useRef({});
  var color=CLASS_COLORS[grid.colorIdx||0];

  useEffect(function(){ onUpdate(grid.id,{photos:photos}); },[photos]);

  var handleDragStart=useCallback(function(e,index){
    setDragIndex(index); dragData.current={startIndex:index};
    var onMove=function(ev){ var el=document.elementFromPoint(ev.clientX,ev.clientY); var tile=el?el.closest("[data-grid-index]"):null; if(tile) setDragOver(parseInt(tile.getAttribute("data-grid-index"))); };
    var onUp=function(){ document.removeEventListener("mousemove",onMove); document.removeEventListener("mouseup",onUp); setDragIndex(null); setDragOver(function(over){ if(over!==null&&dragData.current.startIndex!==null&&over!==dragData.current.startIndex){ setPhotos(function(prev){ var arr=prev.slice(); var moved=arr.splice(dragData.current.startIndex,1)[0]; arr.splice(over,0,moved); return arr; }); } return null; }); };
    document.addEventListener("mousemove",onMove); document.addEventListener("mouseup",onUp);
  },[]);

  var handleDelete=function(idx){ var p=photos[idx]; if(p&&p.imageId) deleteImageFromDB(p.imageId).catch(function(){}); setPhotos(function(prev){ return prev.filter(function(_,j){ return j!==idx; }); }); };

  return (
    <div style={{ minHeight:"100vh",background:BG,fontFamily:FONT,maxWidth:"480px",margin:"0 auto" }}>
      <div style={{ background:CARD_BG,padding:"16px 24px 16px",borderBottom:"1px solid rgba(0,0,0,0.06)",position:"sticky",top:0,zIndex:10 }}>
        <button onClick={onBack} style={{ background:"none",border:"none",color:PURPLE,fontSize:"15px",fontWeight:"700",cursor:"pointer",padding:"0 0 12px",display:"flex",alignItems:"center",gap:"4px",fontFamily:FONT }}>&#8249; Ruthie's Classes</button>
        <div style={{ display:"flex",alignItems:"center",gap:"12px" }}>
          <div style={{ width:"44px",height:"44px",borderRadius:"12px",background:color.bg,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"24px" }}>{grid.emoji}</div>
          <div><div style={{ fontSize:"11px",color:PURPLE,fontWeight:"700",letterSpacing:"0.08em" }}>PHOTO GRID</div><h1 style={{ margin:0,fontSize:"22px",fontWeight:"800",color:DARK }}>{grid.name}</h1></div>
          <div style={{ marginLeft:"auto",fontSize:"13px",color:"#718096" }}>{photos.length} photo{photos.length!==1?"s":""}</div>
        </div>
      </div>

      <div style={{ padding:"20px 20px 120px" }}>
        {photos.length===0?(
          <div style={{ textAlign:"center",padding:"60px 20px",color:"#A0AEC0" }}>
            <div style={{ fontSize:"56px",marginBottom:"16px" }}>{grid.emoji}</div>
            <div style={{ fontSize:"18px",fontWeight:"700",color:"#4A5568",marginBottom:"8px" }}>No photos yet</div>
            <div style={{ fontSize:"14px" }}>Tap + to add your first photos</div>
          </div>
        ):(
          <div style={{ display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:"8px" }}>
            {photos.map(function(photo,i){ return (
              <GridPhotoTile key={i} photo={photo} index={i} onDelete={handleDelete} onDragStart={handleDragStart} isDragging={dragIndex===i} isDragOver={dragOver===i&&dragIndex!==i} />
            ); })}
          </div>
        )}
      </div>

      <FAB label="Add Photos" onClick={function(){ setShowAdd(true); }} />
      {showAdd && <AddPhotosModal onClose={function(){ setShowAdd(false); }} onAdd={function(newPhotos){ setPhotos(function(prev){ return prev.concat(newPhotos); }); }} />}
    </div>
  );
}

// ─── SectionCard (reusable class/grid list item) ──────────────────────────────
function SectionCard({ item, type, onOpen, onEdit, onDelete }){
  const [menuOpen,setMenuOpen]=useState(false);
  var color=CLASS_COLORS[item.colorIdx||0];
  var count=type==="class"?(item.poses||[]).length:(item.photos||[]).length;
  var countLabel=type==="class"?(count+" pose"+(count!==1?"s":"")):(count+" photo"+(count!==1?"s":""));
  return (
    <div style={{ position:"relative",marginBottom:"10px" }}>
      <div onClick={function(){ setMenuOpen(false); onOpen(item.id); }} style={{ background:CARD_BG,borderRadius:"18px",padding:"16px 18px",display:"flex",alignItems:"center",gap:"14px",boxShadow:"0 2px 12px rgba(0,0,0,0.06)",cursor:"pointer",border:"1.5px solid "+color.bg }}>
        <div style={{ width:"50px",height:"50px",borderRadius:"14px",background:color.bg,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"26px",flexShrink:0 }}>{item.emoji}</div>
        <div style={{ flex:1,minWidth:0 }}>
          <div style={{ fontSize:"16px",fontWeight:"700",color:DARK,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{item.name}</div>
          <div style={{ fontSize:"12px",color:"#718096",marginTop:"2px" }}>{countLabel}</div>
          {type==="grid" && count>0 && (
            <div style={{ display:"flex",gap:"3px",marginTop:"6px" }}>
              {(item.photos||[]).slice(0,8).map(function(p,i){ return (
                <div key={i} style={{ width:"22px",height:"22px",borderRadius:"5px",overflow:"hidden",background:PLACEHOLDER_COLORS[i%PLACEHOLDER_COLORS.length],flexShrink:0 }}>
                  <DBImage imageId={p.imageId} style={{ width:"100%",height:"100%",objectFit:"cover" }} />
                </div>
              ); })}
              {count>8&&<div style={{ width:"22px",height:"22px",borderRadius:"5px",background:"#E2E8F0",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"9px",fontWeight:"700",color:"#718096" }}>+{count-8}</div>}
            </div>
          )}
        </div>
        <div style={{ display:"flex",flexDirection:"column",alignItems:"center",gap:"6px" }}>
          <button onClick={function(e){ e.stopPropagation(); setMenuOpen(function(o){ return !o; }); }} style={{ background:"none",border:"none",color:"#CBD5E0",fontSize:"20px",cursor:"pointer",padding:"4px",lineHeight:1 }}>...</button>
          <span style={{ color:"#CBD5E0",fontSize:"18px" }}>›</span>
        </div>
      </div>
      {menuOpen&&(
        <div style={{ position:"absolute",right:"14px",top:"68px",background:"#fff",borderRadius:"14px",boxShadow:"0 8px 32px rgba(0,0,0,0.14)",overflow:"hidden",zIndex:10,minWidth:"150px" }}>
          <button onClick={function(){ onEdit(item.id); setMenuOpen(false); }} style={{ display:"block",width:"100%",padding:"13px 16px",border:"none",background:"none",textAlign:"left",fontSize:"15px",fontWeight:"600",color:DARK,cursor:"pointer",fontFamily:FONT,borderBottom:"1px solid #F0F0EE" }}>Rename</button>
          <button onClick={function(){ onDelete(item.id); setMenuOpen(false); }} style={{ display:"block",width:"100%",padding:"13px 16px",border:"none",background:"none",textAlign:"left",fontSize:"15px",fontWeight:"600",color:"#E53E3E",cursor:"pointer",fontFamily:FONT }}>Delete</button>
        </div>
      )}
      {menuOpen&&<div style={{ position:"fixed",inset:0,zIndex:9 }} onClick={function(){ setMenuOpen(false); }} />}
    </div>
  );
}

// ─── Home ─────────────────────────────────────────────────────────────────────
function Home({ classes, grids, onOpenClass, onOpenGrid, onCreateClass, onCreateGrid, onEditClass, onEditGrid, onDeleteClass, onDeleteGrid }){
  const [tab,setTab]=useState("classes"); // "classes" | "grids"
  return (
    <div style={{ minHeight:"100vh",background:BG,fontFamily:FONT,maxWidth:"480px",margin:"0 auto" }}>
      {/* Hero header */}
      <div style={{ background:"linear-gradient(160deg, #6B4FA8 0%, #9B7FC2 60%, #C4A8E0 100%)",padding:"48px 24px 24px",position:"relative",overflow:"hidden" }}>
        <div style={{ position:"absolute",top:"-30px",right:"-30px",width:"160px",height:"160px",borderRadius:"50%",background:"rgba(255,255,255,0.07)" }} />
        <div style={{ position:"absolute",bottom:"-20px",left:"-20px",width:"100px",height:"100px",borderRadius:"50%",background:"rgba(255,255,255,0.05)" }} />
        <div style={{ fontSize:"32px",marginBottom:"8px" }}>🧘</div>
        <h1 style={{ margin:"0 0 4px",fontSize:"30px",fontWeight:"800",color:"#fff",letterSpacing:"-0.5px" }}>Ruthie's Classes</h1>
        <p style={{ margin:0,fontSize:"14px",color:"rgba(255,255,255,0.75)" }}>{classes.length} class{classes.length!==1?"es":""} · {grids.length} grid{grids.length!==1?"s":""}</p>
      </div>

      {/* Tab bar */}
      <div style={{ display:"flex",background:CARD_BG,borderBottom:"1px solid rgba(0,0,0,0.06)",position:"sticky",top:0,zIndex:10 }}>
        {[["classes","My Classes"],["grids","My Grids"]].map(function(pair){ return (
          <button key={pair[0]} onClick={function(){ setTab(pair[0]); }} style={{ flex:1,padding:"14px",border:"none",background:"none",fontSize:"15px",fontWeight:tab===pair[0]?"700":"500",color:tab===pair[0]?PURPLE:"#718096",cursor:"pointer",fontFamily:FONT,borderBottom:tab===pair[0]?"3px solid "+PURPLE:"3px solid transparent",transition:"color 0.2s" }}>{pair[1]}</button>
        ); })}
      </div>

      {/* Content */}
      <div style={{ padding:"16px 16px 120px" }}>
        {tab==="classes"&&(
          <>
            {classes.length===0&&<div style={{ textAlign:"center",padding:"60px 20px",color:"#A0AEC0" }}><div style={{ fontSize:"48px",marginBottom:"12px" }}>🌿</div><div style={{ fontSize:"16px",fontWeight:"700",color:"#4A5568",marginBottom:"6px" }}>No classes yet</div><div style={{ fontSize:"13px" }}>Tap + to create your first class</div></div>}
            {classes.map(function(cls){ return <SectionCard key={cls.id} item={cls} type="class" onOpen={onOpenClass} onEdit={onEditClass} onDelete={onDeleteClass} />; })}
          </>
        )}
        {tab==="grids"&&(
          <>
            {grids.length===0&&<div style={{ textAlign:"center",padding:"60px 20px",color:"#A0AEC0" }}><div style={{ fontSize:"48px",marginBottom:"12px" }}>🖼️</div><div style={{ fontSize:"16px",fontWeight:"700",color:"#4A5568",marginBottom:"6px" }}>No grids yet</div><div style={{ fontSize:"13px" }}>Tap + to create your first photo grid</div></div>}
            {grids.map(function(grid){ return <SectionCard key={grid.id} item={grid} type="grid" onOpen={onOpenGrid} onEdit={onEditGrid} onDelete={onDeleteGrid} />; })}
          </>
        )}
      </div>

      <FAB label={tab==="classes"?"New Class":"New Grid"} onClick={tab==="classes"?onCreateClass:onCreateGrid} />
    </div>
  );
}

// ─── Root App ─────────────────────────────────────────────────────────────────
export default function App(){
  const [classes,setClasses]=useState(function(){ return loadClasses(); });
  const [grids,setGrids]=useState(function(){ return loadGrids(); });
  const [view,setView]=useState({screen:"home",id:null});
  const [classModal,setClassModal]=useState(false);
  const [gridModal,setGridModal]=useState(false);
  const [editClassId,setEditClassId]=useState(null);
  const [editGridId,setEditGridId]=useState(null);
  const [savedToast,setSavedToast]=useState(false);
  var nextId=useRef(loadNextId());

  useEffect(function(){ saveClasses(classes); saveNextId(nextId.current); setSavedToast(true); var t=setTimeout(function(){ setSavedToast(false); },1500); return function(){ clearTimeout(t); }; },[classes]);
  useEffect(function(){ saveGrids(grids); saveNextId(nextId.current); },[grids]);

  var createClass=function(data){ var id=nextId.current++; setClasses(function(prev){ return prev.concat([Object.assign({id:id,poses:[]},data)]); }); };
  var editClass=function(id,data){ setClasses(function(prev){ return prev.map(function(c){ return c.id===id?Object.assign({},c,data):c; }); }); };
  var deleteClass=function(id){ var cls=classes.find(function(c){ return c.id===id; }); if(cls){ (cls.poses||[]).forEach(function(p){ if(p.imageId) deleteImageFromDB(p.imageId).catch(function(){}); }); } setClasses(function(prev){ return prev.filter(function(c){ return c.id!==id; }); }); if(view.id===id) setView({screen:"home",id:null}); };
  var updateClass=function(id,changes){ setClasses(function(prev){ return prev.map(function(c){ return c.id===id?Object.assign({},c,changes):c; }); }); };

  var createGrid=function(data){ var id=nextId.current++; setGrids(function(prev){ return prev.concat([Object.assign({id:id,photos:[]},data)]); }); };
  var editGrid=function(id,data){ setGrids(function(prev){ return prev.map(function(g){ return g.id===id?Object.assign({},g,data):g; }); }); };
  var deleteGrid=function(id){ var grid=grids.find(function(g){ return g.id===id; }); if(grid){ (grid.photos||[]).forEach(function(p){ if(p.imageId) deleteImageFromDB(p.imageId).catch(function(){}); }); } setGrids(function(prev){ return prev.filter(function(g){ return g.id!==id; }); }); if(view.id===id) setView({screen:"home",id:null}); };
  var updateGrid=function(id,changes){ setGrids(function(prev){ return prev.map(function(g){ return g.id===id?Object.assign({},g,changes):g; }); }); };

  var activeClass=classes.find(function(c){ return c.id===view.id; });
  var activeGrid=grids.find(function(g){ return g.id===view.id; });

  return (
    <>
      {view.screen==="class"&&activeClass&&<ClassEditor cls={activeClass} onBack={function(){ setView({screen:"home",id:null}); }} onUpdate={updateClass} />}
      {view.screen==="grid"&&activeGrid&&<GridEditor grid={activeGrid} onBack={function(){ setView({screen:"home",id:null}); }} onUpdate={updateGrid} />}
      {view.screen==="home"&&(
        <Home classes={classes} grids={grids}
          onOpenClass={function(id){ setView({screen:"class",id:id}); }}
          onOpenGrid={function(id){ setView({screen:"grid",id:id}); }}
          onCreateClass={function(){ setClassModal(true); }}
          onCreateGrid={function(){ setGridModal(true); }}
          onEditClass={function(id){ setEditClassId(id); }}
          onEditGrid={function(id){ setEditGridId(id); }}
          onDeleteClass={deleteClass} onDeleteGrid={deleteGrid}
        />
      )}
      {classModal&&<NamedModal title="Class" emojis={CLASS_EMOJIS} onClose={function(){ setClassModal(false); }} onSave={createClass} />}
      {gridModal&&<NamedModal title="Grid" emojis={GRID_EMOJIS} onClose={function(){ setGridModal(false); }} onSave={createGrid} />}
      {editClassId!==null&&<NamedModal title="Class" emojis={CLASS_EMOJIS} existing={classes.find(function(c){ return c.id===editClassId; })} onClose={function(){ setEditClassId(null); }} onSave={function(data){ editClass(editClassId,data); }} />}
      {editGridId!==null&&<NamedModal title="Grid" emojis={GRID_EMOJIS} existing={grids.find(function(g){ return g.id===editGridId; })} onClose={function(){ setEditGridId(null); }} onSave={function(data){ editGrid(editGridId,data); }} />}
      <div style={{ position:"fixed",bottom:"100px",left:"50%",transform:"translateX(-50%) translateY("+(savedToast?"0":"12px")+")",background:"rgba(45,32,64,0.85)",color:"#fff",borderRadius:"20px",padding:"8px 18px",fontSize:"13px",fontWeight:"600",fontFamily:FONT,pointerEvents:"none",opacity:savedToast?1:0,transition:"opacity 0.25s ease,transform 0.25s ease",zIndex:300,backdropFilter:"blur(8px)" }}>
        Saved
      </div>
    </>
  );
}
