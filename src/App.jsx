/* eslint-disable react-hooks/exhaustive-deps */
import { useState, useRef, useCallback, useEffect } from "react";

const FONT = "SF Pro Rounded, -apple-system, sans-serif";
const GREEN = "#7B9E87";
const DARK = "#2D3748";
const BG = "#F5F7F4";
const CARD_BG = "#FAFAF7";

const PLACEHOLDER_COLORS = ["#E8D5C4","#C4D5E8","#D5E8C4","#E8C4D5","#D5C4E8","#E8E4C4"];

const CLASS_COLORS = [
  { bg: "#EFF6F1", accent: "#5A8A6A", label: "Sage" },
  { bg: "#EEF2FF", accent: "#5B6FA8", label: "Lavender" },
  { bg: "#FFF7ED", accent: "#C2783C", label: "Terracotta" },
  { bg: "#FDF2F8", accent: "#9F4D7A", label: "Plum" },
  { bg: "#F0FDFA", accent: "#2A8A7E", label: "Teal" },
  { bg: "#FFFBEB", accent: "#B08E2C", label: "Gold" },
];

const CLASS_EMOJIS = ["🧘","🌿","🌸","✨","🌊","🍃","☀️","🌙","🔥","💫"];

const DEFAULT_CLASSES = [
  { id: 1, name: "Morning Flow", emoji: "☀️", colorIdx: 0, poses: [
    { name: "Mountain Pose", duration: 30, imageUrl: null },
    { name: "Warrior I",     duration: 45, imageUrl: null },
    { name: "Warrior II",    duration: 45, imageUrl: null },
    { name: "Tree Pose",     duration: 30, imageUrl: null },
  ]},
  { id: 2, name: "Chair Yoga", emoji: "🪑", colorIdx: 2, poses: [
    { name: "Seated Cat-Cow", duration: 30, imageUrl: null },
    { name: "Seated Twist",   duration: 30, imageUrl: null },
  ]},
  { id: 3, name: "Kids Yoga", emoji: "🌸", colorIdx: 3, poses: [
    { name: "Happy Baby",     duration: 20, imageUrl: null },
    { name: "Butterfly Pose", duration: 20, imageUrl: null },
    { name: "Lion Pose",      duration: 15, imageUrl: null },
  ]},
];

const STORAGE_KEY = "yogaClassBuilder_v1";
const NEXT_ID_KEY = "yogaClassBuilder_nextId";

function loadClasses() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return DEFAULT_CLASSES;
}

function saveClasses(classes) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(classes));
  } catch (e) {
    console.warn("Storage full:", e);
  }
}

function loadNextId() {
  try {
    const raw = localStorage.getItem(NEXT_ID_KEY);
    if (raw) return parseInt(raw, 10);
  } catch (e) {}
  return 100;
}

function saveNextId(id) {
  try { localStorage.setItem(NEXT_ID_KEY, String(id)); } catch (e) {}
}

function formatTime(secs) {
  const m = Math.floor(secs / 60), s = secs % 60;
  if (m > 0 && s > 0) return m + "m " + s + "s";
  if (m > 0) return m + "m";
  return s + "s";
}

function StatusBar() {
  return (
    <div style={{ height:"44px",background:CARD_BG,display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0 20px",fontSize:"12px",color:"#4A5568",fontWeight:"600",borderBottom:"1px solid rgba(0,0,0,0.06)",position:"sticky",top:0,zIndex:10,fontFamily:FONT }}>
      <span>9:41</span>
      <div style={{ display:"flex",gap:"6px",alignItems:"center" }}><span>***</span><span>WiFi</span><span>Battery</span></div>
    </div>
  );
}

function Sheet({ children, onClose }) {
  return (
    <div
      style={{ position:"fixed",inset:0,background:"rgba(0,0,0,0.45)",display:"flex",alignItems:"flex-end",zIndex:100,backdropFilter:"blur(4px)" }}
      onClick={function(e){ if(e.target===e.currentTarget) onClose(); }}
    >
      <div style={{ background:CARD_BG,borderRadius:"24px 24px 0 0",padding:"28px 24px 40px",width:"100%",boxSizing:"border-box",maxWidth:"480px",margin:"0 auto" }}>
        <div style={{ width:"36px",height:"4px",background:"#D1D5DB",borderRadius:"2px",margin:"0 auto 24px" }} />
        {children}
      </div>
    </div>
  );
}

function Label({ children }) {
  return <div style={{ fontSize:"12px",fontWeight:"600",color:"#718096",marginBottom:"6px",textTransform:"uppercase",letterSpacing:"0.05em",fontFamily:FONT }}>{children}</div>;
}

function PrimaryBtn({ children, onClick, disabled }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      width:"100%",padding:"16px",borderRadius:"14px",border:"none",
      background: disabled ? "#D1D5DB" : GREEN,
      color:"#fff",fontSize:"17px",fontWeight:"700",
      cursor: disabled ? "not-allowed" : "pointer",fontFamily:FONT,transition:"background 0.2s",
    }}>{children}</button>
  );
}

function NavBtn({ children, onClick, disabled }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      width:"48px",height:"48px",borderRadius:"50%",background:"rgba(255,255,255,0.1)",
      border:"none",color:disabled?"rgba(255,255,255,0.2)":"#fff",
      fontSize:"20px",cursor:disabled?"not-allowed":"pointer",
      display:"flex",alignItems:"center",justifyContent:"center",
    }}>{children}</button>
  );
}

function PoseCard({ pose, index, onDelete, onDragStart, boardMode }) {
  const [pressing, setPressing] = useState(false);
  const pressTimer = useRef(null);

  return (
    <div
      style={{
        display:"flex",flexDirection:"column",alignItems:"center",gap:"6px",
        cursor:boardMode?"grab":"default",
        transform:pressing?"scale(1.04)":"scale(1)",
        transition:"transform 0.15s ease",
        userSelect:"none",WebkitUserSelect:"none",
      }}
      onTouchStart={function(e){
        if (!boardMode) return;
        setPressing(true);
        pressTimer.current = setTimeout(function(){ onDragStart(e, index, "touch"); }, 300);
      }}
      onTouchEnd={function(){ clearTimeout(pressTimer.current); setPressing(false); }}
      onMouseDown={function(e){ if (boardMode) onDragStart(e, index, "mouse"); }}
    >
      <div style={{
        width:"90px",height:"110px",borderRadius:"16px",overflow:"hidden",
        boxShadow:"0 2px 12px rgba(0,0,0,0.12)",
        background:pose.imageUrl?"transparent":PLACEHOLDER_COLORS[index % PLACEHOLDER_COLORS.length],
        position:"relative",flexShrink:0,
      }}>
        {pose.imageUrl
          ? <img src={pose.imageUrl} alt={pose.name} style={{ width:"100%",height:"100%",objectFit:"cover" }} draggable={false} />
          : <div style={{ width:"100%",height:"100%",display:"flex",alignItems:"center",justifyContent:"center" }}>
              <span style={{ fontSize:"32px" }}>🧘</span>
            </div>
        }
        {boardMode && (
          <button
            onClick={function(e){ e.stopPropagation(); onDelete(index); }}
            style={{
              position:"absolute",top:"5px",right:"5px",width:"22px",height:"22px",
              borderRadius:"50%",background:"rgba(0,0,0,0.55)",border:"none",color:"#fff",
              fontSize:"13px",display:"flex",alignItems:"center",justifyContent:"center",
              cursor:"pointer",padding:0,zIndex:2,
            }}
          >x</button>
        )}
        <div style={{
          position:"absolute",bottom:"5px",left:"5px",
          background:"rgba(0,0,0,0.45)",color:"#fff",
          borderRadius:"8px",fontSize:"11px",fontWeight:"600",
          padding:"2px 7px",fontFamily:FONT,
        }}>{index + 1}</div>
      </div>
      <div style={{ fontSize:"11px",fontWeight:"500",color:"#4A5568",textAlign:"center",maxWidth:"90px",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",fontFamily:FONT }}>{pose.name}</div>
      <div style={{ fontSize:"10px",color:GREEN,fontWeight:"600",fontFamily:FONT }}>{pose.duration}s</div>
    </div>
  );
}

function AddPoseModal({ onClose, onAdd }) {
  const [name, setName] = useState("");
  const [duration, setDuration] = useState("30");
  const [imageUrl, setImageUrl] = useState(null);
  const fileRef = useRef();

  const handleFile = function(e) {
    var file = e.target.files[0];
    if (!file) return;
    var r = new FileReader();
    r.onload = function(ev){ setImageUrl(ev.target.result); };
    r.readAsDataURL(file);
  };

  return (
    <Sheet onClose={onClose}>
      <h3 style={{ margin:"0 0 20px",fontSize:"20px",fontWeight:"700",color:DARK,fontFamily:FONT }}>Add Pose</h3>
      <div onClick={function(){ fileRef.current.click(); }} style={{
        height:"160px",background:imageUrl?"transparent":"#EFF3EE",
        borderRadius:"16px",display:"flex",alignItems:"center",justifyContent:"center",
        cursor:"pointer",marginBottom:"16px",overflow:"hidden",
        border:imageUrl?"none":"2px dashed #A8C4AE",position:"relative",
      }}>
        {imageUrl ? (
          <>
            <img src={imageUrl} alt="" style={{ width:"100%",height:"100%",objectFit:"cover" }} />
            <div style={{ position:"absolute",inset:0,background:"rgba(0,0,0,0.25)",display:"flex",alignItems:"center",justifyContent:"center" }}>
              <span style={{ color:"#fff",fontSize:"13px",fontWeight:"600" }}>Tap to change</span>
            </div>
          </>
        ) : (
          <div style={{ textAlign:"center" }}>
            <div style={{ fontSize:"36px",marginBottom:"8px" }}>📷</div>
            <div style={{ fontSize:"14px",color:GREEN,fontWeight:"600" }}>Upload pose photo</div>
            <div style={{ fontSize:"12px",color:"#A0AEC0",marginTop:"4px" }}>or skip to use emoji</div>
          </div>
        )}
      </div>
      <input ref={fileRef} type="file" accept="image/*" style={{ display:"none" }} onChange={handleFile} />
      <Label>Pose Name</Label>
      <input
        value={name}
        onChange={function(e){ setName(e.target.value); }}
        placeholder="e.g. Warrior I"
        style={{ width:"100%",padding:"13px 16px",borderRadius:"12px",border:"1.5px solid #E2E8F0",background:"#fff",fontSize:"16px",color:DARK,outline:"none",boxSizing:"border-box",fontFamily:FONT,marginBottom:"14px" }}
      />
      <Label>Hold Duration (seconds)</Label>
      <div style={{ display:"flex",gap:"8px",marginBottom:"24px" }}>
        {[15,30,45,60].map(function(s){
          return (
            <button key={s} onClick={function(){ setDuration(String(s)); }} style={{
              flex:1,padding:"10px",borderRadius:"10px",border:"1.5px solid",
              borderColor:duration===String(s)?GREEN:"#E2E8F0",
              background:duration===String(s)?GREEN:"#fff",
              color:duration===String(s)?"#fff":"#4A5568",
              fontSize:"14px",fontWeight:"600",cursor:"pointer",fontFamily:FONT,
            }}>{s}s</button>
          );
        })}
      </div>
      <PrimaryBtn
        disabled={!name.trim()}
        onClick={function(){
          if (!name.trim()) return;
          onAdd({ name: name.trim(), duration: parseInt(duration)||30, imageUrl: imageUrl });
          onClose();
        }}
      >Add to Class</PrimaryBtn>
    </Sheet>
  );
}

function SwapModal({ poses, targetIndex, onSwap, onClose }) {
  return (
    <Sheet onClose={onClose}>
      <h3 style={{ margin:"0 0 6px",fontSize:"20px",fontWeight:"700",color:DARK,fontFamily:FONT }}>Swap Pose</h3>
      <p style={{ margin:"0 0 20px",fontSize:"14px",color:"#718096",fontFamily:FONT }}>
        Swapping "{poses[targetIndex] ? poses[targetIndex].name : ""}" - tap a pose to swap with
      </p>
      <div style={{ display:"flex",flexWrap:"wrap",gap:"12px",maxHeight:"260px",overflowY:"auto",paddingBottom:"4px" }}>
        {poses.map(function(pose, i){
          if (i === targetIndex) return null;
          return (
            <div key={i} onClick={function(){ onSwap(targetIndex, i); onClose(); }} style={{ cursor:"pointer" }}>
              <PoseCard pose={pose} index={i} onDelete={function(){}} onDragStart={function(){}} boardMode={false} />
            </div>
          );
        })}
      </div>
      <button onClick={onClose} style={{
        width:"100%",marginTop:"20px",padding:"14px",borderRadius:"14px",border:"none",
        background:"#EDF2F7",color:"#4A5568",fontSize:"16px",fontWeight:"600",cursor:"pointer",fontFamily:FONT,
      }}>Cancel</button>
    </Sheet>
  );
}

function PlayerView({ poses, onClose }) {
  const [current, setCurrent] = useState(0);
  const [timeLeft, setTimeLeft] = useState(poses[0] ? poses[0].duration : 30);
  const [paused, setPaused] = useState(false);

  useEffect(function(){
    if (paused) return;
    if (timeLeft <= 0) {
      if (current < poses.length - 1) {
        var n = current + 1;
        setCurrent(n);
        setTimeLeft(poses[n].duration);
      }
      return;
    }
    var t = setTimeout(function(){ setTimeLeft(function(prev){ return prev - 1; }); }, 1000);
    return function(){ clearTimeout(t); };
  }, [timeLeft, paused, current, poses]);

  var pose = poses[current];
  var progress = pose ? (pose.duration - timeLeft) / pose.duration : 0;

  return (
    <div style={{
      position:"fixed",inset:0,background:"#1A2420",
      display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",
      zIndex:200,fontFamily:FONT,
    }}>
      <button onClick={onClose} style={{
        position:"absolute",top:"20px",right:"20px",background:"rgba(255,255,255,0.1)",
        border:"none",color:"#fff",borderRadius:"50%",width:"36px",height:"36px",
        fontSize:"18px",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",
      }}>x</button>
      <div style={{ color:GREEN,fontSize:"13px",fontWeight:"600",marginBottom:"12px",letterSpacing:"0.1em" }}>
        POSE {current+1} OF {poses.length}
      </div>
      <div style={{
        width:"240px",height:"280px",borderRadius:"24px",overflow:"hidden",
        background:pose && pose.imageUrl?"transparent":PLACEHOLDER_COLORS[current % PLACEHOLDER_COLORS.length],
        marginBottom:"32px",boxShadow:"0 8px 40px rgba(0,0,0,0.5)",
        display:"flex",alignItems:"center",justifyContent:"center",
      }}>
        {pose && pose.imageUrl
          ? <img src={pose.imageUrl} alt={pose.name} style={{ width:"100%",height:"100%",objectFit:"cover" }} />
          : <span style={{ fontSize:"80px" }}>🧘</span>
        }
      </div>
      <h2 style={{ color:"#fff",fontSize:"28px",fontWeight:"700",margin:"0 0 8px" }}>{pose ? pose.name : ""}</h2>
      <div style={{ fontSize:"64px",fontWeight:"300",color:"#fff",margin:"8px 0",letterSpacing:"-2px" }}>
        {timeLeft}<span style={{ fontSize:"22px",color:GREEN,marginLeft:"4px" }}>s</span>
      </div>
      <div style={{ width:"200px",height:"4px",background:"rgba(255,255,255,0.1)",borderRadius:"2px",margin:"0 0 32px",overflow:"hidden" }}>
        <div style={{ height:"100%",width:(progress*100)+"%",background:GREEN,borderRadius:"2px",transition:"width 0.5s linear" }} />
      </div>
      <div style={{ display:"flex",gap:"16px",alignItems:"center" }}>
        <NavBtn disabled={current===0} onClick={function(){
          if (current>0){ var n=current-1; setCurrent(n); setTimeLeft(poses[n].duration); }
        }}>&#8249;</NavBtn>
        <button onClick={function(){ setPaused(function(p){ return !p; }); }} style={{
          width:"64px",height:"64px",borderRadius:"50%",background:GREEN,border:"none",color:"#fff",
          fontSize:"26px",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",
          boxShadow:"0 4px 20px rgba(123,158,135,0.5)",
        }}>{paused ? ">" : "||"}</button>
        <NavBtn disabled={current===poses.length-1} onClick={function(){
          if (current<poses.length-1){ var n=current+1; setCurrent(n); setTimeLeft(poses[n].duration); }
        }}>&#8250;</NavBtn>
      </div>
      {current < poses.length-1 && (
        <div style={{ position:"absolute",bottom:"40px",display:"flex",alignItems:"center",gap:"10px",color:"rgba(255,255,255,0.45)",fontSize:"13px" }}>
          <span>Next:</span>
          <span style={{ color:"rgba(255,255,255,0.7)",fontWeight:"600" }}>{poses[current+1].name}</span>
        </div>
      )}
    </div>
  );
}

function NewClassModal({ onClose, onSave, existing }) {
  var isEdit = !!existing;
  const [name, setName] = useState(existing ? existing.name : "");
  const [emoji, setEmoji] = useState(existing ? existing.emoji : "🧘");
  const [colorIdx, setColorIdx] = useState(existing ? existing.colorIdx : 0);

  return (
    <Sheet onClose={onClose}>
      <h3 style={{ margin:"0 0 20px",fontSize:"20px",fontWeight:"700",color:DARK,fontFamily:FONT }}>
        {isEdit ? "Edit Class" : "New Class"}
      </h3>
      <Label>Class Name</Label>
      <input
        autoFocus
        value={name}
        onChange={function(e){ setName(e.target.value); }}
        placeholder="e.g. Chair Yoga"
        style={{ width:"100%",padding:"13px 16px",borderRadius:"12px",border:"1.5px solid #E2E8F0",background:"#fff",fontSize:"16px",color:DARK,outline:"none",boxSizing:"border-box",fontFamily:FONT,marginBottom:"18px" }}
      />
      <Label>Icon</Label>
      <div style={{ display:"flex",flexWrap:"wrap",gap:"8px",marginBottom:"18px" }}>
        {CLASS_EMOJIS.map(function(e){
          return (
            <button key={e} onClick={function(){ setEmoji(e); }} style={{
              width:"40px",height:"40px",borderRadius:"10px",border:"2px solid",
              borderColor:emoji===e?GREEN:"#E2E8F0",
              background:emoji===e?"#EFF6F1":"#fff",
              fontSize:"20px",cursor:"pointer",
            }}>{e}</button>
          );
        })}
      </div>
      <Label>Color</Label>
      <div style={{ display:"flex",gap:"8px",marginBottom:"24px" }}>
        {CLASS_COLORS.map(function(c,i){
          return (
            <button key={i} onClick={function(){ setColorIdx(i); }} style={{
              width:"32px",height:"32px",borderRadius:"50%",
              background:c.accent,border:"3px solid",
              borderColor:colorIdx===i?DARK:"transparent",
              cursor:"pointer",
            }} />
          );
        })}
      </div>
      <PrimaryBtn disabled={!name.trim()} onClick={function(){
        if (!name.trim()) return;
        onSave({ name: name.trim(), emoji: emoji, colorIdx: colorIdx });
        onClose();
      }}>
        {isEdit ? "Save Changes" : "Create Class"}
      </PrimaryBtn>
    </Sheet>
  );
}

function ClassesHome({ classes, onOpen, onCreate, onDelete, onEdit }) {
  const [menuId, setMenuId] = useState(null);

  return (
    <div style={{ minHeight:"100vh",background:BG,fontFamily:FONT,maxWidth:"480px",margin:"0 auto" }}>
      <StatusBar />
      <div style={{ background:CARD_BG,padding:"20px 24px 24px",borderBottom:"1px solid rgba(0,0,0,0.06)" }}>
        <div style={{ fontSize:"12px",color:GREEN,fontWeight:"700",letterSpacing:"0.08em",marginBottom:"4px" }}>YOGA CLASS BUILDER</div>
        <h1 style={{ margin:"0 0 4px",fontSize:"28px",fontWeight:"800",color:DARK }}>My Classes</h1>
        <p style={{ margin:0,fontSize:"14px",color:"#718096" }}>{classes.length} class{classes.length!==1?"es":""} saved</p>
      </div>
      <div style={{ padding:"20px 20px 120px" }}>
        {classes.length === 0 && (
          <div style={{ textAlign:"center",padding:"60px 20px",color:"#A0AEC0" }}>
            <div style={{ fontSize:"56px",marginBottom:"16px" }}>🌿</div>
            <div style={{ fontSize:"18px",fontWeight:"700",color:"#4A5568",marginBottom:"8px" }}>No classes yet</div>
            <div style={{ fontSize:"14px" }}>Tap + to create your first class</div>
          </div>
        )}
        {classes.map(function(cls){
          var color = CLASS_COLORS[cls.colorIdx || 0];
          var total = cls.poses.reduce(function(s,p){ return s+p.duration; }, 0);
          return (
            <div key={cls.id} style={{ position:"relative",marginBottom:"12px" }}>
              <div
                onClick={function(){ setMenuId(null); onOpen(cls.id); }}
                style={{
                  background:CARD_BG,borderRadius:"18px",padding:"18px 20px",
                  display:"flex",alignItems:"center",gap:"16px",
                  boxShadow:"0 2px 12px rgba(0,0,0,0.07)",cursor:"pointer",
                  border:"1.5px solid "+color.bg,
                }}
              >
                <div style={{
                  width:"54px",height:"54px",borderRadius:"16px",
                  background:color.bg,display:"flex",alignItems:"center",
                  justifyContent:"center",fontSize:"28px",flexShrink:0,
                }}>{cls.emoji}</div>
                <div style={{ flex:1,minWidth:0 }}>
                  <div style={{ fontSize:"17px",fontWeight:"700",color:DARK,marginBottom:"3px",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{cls.name}</div>
                  <div style={{ display:"flex",gap:"12px" }}>
                    <span style={{ fontSize:"12px",color:"#718096",fontWeight:"600" }}>{cls.poses.length} pose{cls.poses.length!==1?"s":""}</span>
                    {total > 0 && <span style={{ fontSize:"12px",color:"#718096" }}>- {formatTime(total)}</span>}
                  </div>
                  {cls.poses.length > 0 && (
                    <div style={{ display:"flex",gap:"4px",marginTop:"8px",flexWrap:"wrap" }}>
                      {cls.poses.slice(0,5).map(function(p,i){
                        return (
                          <div key={i} style={{
                            width:"28px",height:"28px",borderRadius:"8px",overflow:"hidden",
                            background:p.imageUrl?"transparent":PLACEHOLDER_COLORS[i%PLACEHOLDER_COLORS.length],
                            display:"flex",alignItems:"center",justifyContent:"center",fontSize:"13px",
                            flexShrink:0,
                          }}>
                            {p.imageUrl ? <img src={p.imageUrl} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}} /> : "🧘"}
                          </div>
                        );
                      })}
                      {cls.poses.length > 5 && (
                        <div style={{ width:"28px",height:"28px",borderRadius:"8px",background:"#E2E8F0",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"10px",fontWeight:"700",color:"#718096" }}>
                          +{cls.poses.length-5}
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <div style={{ display:"flex",flexDirection:"column",alignItems:"center",gap:"8px" }}>
                  <button
                    onClick={function(e){ e.stopPropagation(); setMenuId(menuId===cls.id?null:cls.id); }}
                    style={{ background:"none",border:"none",color:"#CBD5E0",fontSize:"20px",cursor:"pointer",padding:"4px",lineHeight:1 }}
                  >...</button>
                  <span style={{ color:"#CBD5E0",fontSize:"18px" }}>›</span>
                </div>
              </div>
              {menuId === cls.id && (
                <div style={{
                  position:"absolute",right:"16px",top:"72px",
                  background:"#fff",borderRadius:"14px",
                  boxShadow:"0 8px 32px rgba(0,0,0,0.16)",
                  overflow:"hidden",zIndex:10,minWidth:"160px",
                }}>
                  <button onClick={function(){ onEdit(cls.id); setMenuId(null); }} style={{
                    display:"block",width:"100%",padding:"14px 18px",border:"none",
                    background:"none",textAlign:"left",fontSize:"15px",fontWeight:"600",
                    color:DARK,cursor:"pointer",fontFamily:FONT,
                    borderBottom:"1px solid #F0F0EE",
                  }}>Rename</button>
                  <button onClick={function(){ onDelete(cls.id); setMenuId(null); }} style={{
                    display:"block",width:"100%",padding:"14px 18px",border:"none",
                    background:"none",textAlign:"left",fontSize:"15px",fontWeight:"600",
                    color:"#E53E3E",cursor:"pointer",fontFamily:FONT,
                  }}>Delete</button>
                </div>
              )}
            </div>
          );
        })}
      </div>
      <button onClick={onCreate} style={{
        position:"fixed",bottom:"32px",right:"50%",transform:"translateX(50%)",
        maxWidth:"calc(480px - 48px)",width:"calc(100% - 48px)",
        padding:"18px",borderRadius:"18px",border:"none",
        background:"linear-gradient(135deg, "+GREEN+", #5A8A6A)",
        color:"#fff",fontSize:"17px",fontWeight:"700",cursor:"pointer",
        display:"flex",alignItems:"center",justifyContent:"center",gap:"8px",
        boxShadow:"0 6px 24px rgba(123,158,135,0.45)",fontFamily:FONT,
      }}>
        <span style={{ fontSize:"22px",lineHeight:1 }}>+</span> New Class
      </button>
      {menuId !== null && (
        <div style={{ position:"fixed",inset:0,zIndex:9 }} onClick={function(){ setMenuId(null); }} />
      )}
    </div>
  );
}

function ClassEditor({ cls, onBack, onUpdate }) {
  const [poses, setPoses] = useState(cls.poses);
  const [showAddModal, setShowAddModal] = useState(false);
  const [swapTarget, setSwapTarget] = useState(null);
  const [showPlayer, setShowPlayer] = useState(false);
  const [dragIndex, setDragIndex] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);

  var dragData = useRef({});
  var color = CLASS_COLORS[cls.colorIdx || 0];

  useEffect(function(){
    onUpdate(cls.id, { poses: poses });
  }, [poses]);

  var handleDragStart = useCallback(function(e, index) {
    setDragIndex(index);
    dragData.current = { startIndex: index };
    var onMove = function(ev) {
      var el = document.elementFromPoint(ev.clientX, ev.clientY);
      var card = el ? el.closest("[data-pose-index]") : null;
      if (card) setDragOverIndex(parseInt(card.getAttribute("data-pose-index")));
    };
    var onUp = function() {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
      setDragIndex(null);
      setDragOverIndex(function(over){
        if (over !== null && dragData.current.startIndex !== null && over !== dragData.current.startIndex) {
          setPoses(function(prev){
            var arr = prev.slice();
            var moved = arr.splice(dragData.current.startIndex, 1)[0];
            arr.splice(over, 0, moved);
            return arr;
          });
        }
        return null;
      });
    };
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  }, []);

  var totalDuration = poses.reduce(function(s,p){ return s+p.duration; }, 0);

  return (
    <div style={{ minHeight:"100vh",background:BG,fontFamily:FONT,maxWidth:"480px",margin:"0 auto" }}>
      <StatusBar />
      <div style={{ background:CARD_BG,padding:"16px 24px 0",borderBottom:"1px solid rgba(0,0,0,0.06)" }}>
        <button onClick={onBack} style={{
          background:"none",border:"none",color:GREEN,fontSize:"15px",fontWeight:"700",
          cursor:"pointer",padding:"0 0 12px",display:"flex",alignItems:"center",gap:"4px",fontFamily:FONT,
        }}>&#8249; All Classes</button>
        <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:"16px" }}>
          <div style={{ display:"flex",alignItems:"center",gap:"12px" }}>
            <div style={{ width:"44px",height:"44px",borderRadius:"12px",background:color.bg,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"24px" }}>
              {cls.emoji}
            </div>
            <div>
              <div style={{ fontSize:"12px",color:GREEN,fontWeight:"700",letterSpacing:"0.08em" }}>CLASS</div>
              <h1 style={{ margin:0,fontSize:"22px",fontWeight:"800",color:DARK }}>{cls.name}</h1>
            </div>
          </div>
          {poses.length > 0 && (
            <button onClick={function(){ setShowPlayer(true); }} style={{
              padding:"10px 18px",borderRadius:"14px",border:"none",background:DARK,
              color:"#fff",fontSize:"14px",fontWeight:"700",cursor:"pointer",
              display:"flex",alignItems:"center",gap:"6px",fontFamily:FONT,
            }}>&#9654; Start</button>
          )}
        </div>
        <div style={{ display:"flex",gap:"20px",paddingBottom:"14px" }}>
          <div>
            <div style={{ fontSize:"20px",fontWeight:"800",color:DARK }}>{poses.length}</div>
            <div style={{ fontSize:"11px",color:"#718096",fontWeight:"600" }}>poses</div>
          </div>
          <div style={{ width:"1px",height:"30px",background:"#E2E8F0" }} />
          <div>
            <div style={{ fontSize:"20px",fontWeight:"800",color:DARK }}>{formatTime(totalDuration)}</div>
            <div style={{ fontSize:"11px",color:"#718096",fontWeight:"600" }}>total</div>
          </div>
          <div style={{ width:"1px",height:"30px",background:"#E2E8F0" }} />
          <div>
            <div style={{ fontSize:"20px",fontWeight:"800",color:DARK }}>{poses.length > 0 ? Math.round(totalDuration/poses.length)+"s" : "0s"}</div>
            <div style={{ fontSize:"11px",color:"#718096",fontWeight:"600" }}>avg hold</div>
          </div>
        </div>
      </div>

      <div style={{ padding:"20px 20px 120px" }}>
        {poses.length === 0 ? (
          <div style={{ textAlign:"center",padding:"60px 20px",color:"#A0AEC0" }}>
            <div style={{ fontSize:"56px",marginBottom:"16px" }}>{cls.emoji}</div>
            <div style={{ fontSize:"18px",fontWeight:"700",color:"#4A5568",marginBottom:"8px" }}>Build your flow</div>
            <div style={{ fontSize:"14px" }}>Tap + to add your first pose</div>
          </div>
        ) : (
          <div style={{ display:"flex",flexWrap:"wrap",gap:"18px" }}>
            {poses.map(function(pose, i){
              return (
                <div key={i} data-pose-index={i}
                  style={{ opacity:dragIndex===i?0.4:1, transform:dragOverIndex===i&&dragIndex!==i?"scale(1.06)":"scale(1)", transition:"opacity 0.2s,transform 0.2s" }}>
                  <PoseCard pose={pose} index={i} boardMode
                    onDelete={function(idx){ setPoses(function(prev){ return prev.filter(function(_,j){ return j!==idx; }); }); }}
                    onDragStart={handleDragStart}
                  />
                  <button onClick={function(){ setSwapTarget(i); }} style={{
                    display:"block",margin:"4px auto 0",padding:"3px 10px",
                    borderRadius:"8px",border:"1px solid #D1D5DB",background:"#fff",
                    color:"#718096",fontSize:"10px",fontWeight:"600",cursor:"pointer",fontFamily:FONT,
                  }}>Swap</button>
                </div>
              );
            })}
          </div>
        )}

        {poses.length > 1 && (
          <div style={{ marginTop:"28px" }}>
            <div style={{ fontSize:"12px",color:"#718096",fontWeight:"700",marginBottom:"12px",letterSpacing:"0.06em" }}>SEQUENCE ORDER</div>
            <div style={{ background:"#fff",borderRadius:"16px",overflow:"hidden",boxShadow:"0 2px 8px rgba(0,0,0,0.06)" }}>
              {poses.map(function(pose, i){
                return (
                  <div key={i} style={{ display:"flex",alignItems:"center",padding:"12px 16px",borderBottom:i<poses.length-1?"1px solid #F0F0EE":"none",gap:"12px" }}>
                    <div style={{ width:"28px",height:"28px",borderRadius:"50%",background:"#EFF3EE",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"13px",fontWeight:"700",color:GREEN,flexShrink:0 }}>{i+1}</div>
                    <div style={{ width:"36px",height:"36px",borderRadius:"8px",overflow:"hidden",background:pose.imageUrl?"transparent":PLACEHOLDER_COLORS[i%PLACEHOLDER_COLORS.length],display:"flex",alignItems:"center",justifyContent:"center",fontSize:"18px",flexShrink:0 }}>
                      {pose.imageUrl ? <img src={pose.imageUrl} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}} /> : "🧘"}
                    </div>
                    <div style={{ flex:1,minWidth:0 }}>
                      <div style={{ fontSize:"15px",fontWeight:"600",color:DARK }}>{pose.name}</div>
                      <div style={{ fontSize:"12px",color:"#A0AEC0" }}>Hold for {pose.duration}s</div>
                    </div>
                    <button onClick={function(){ setPoses(function(prev){ return prev.filter(function(_,j){ return j!==i; }); }); }} style={{ padding:"6px",border:"none",background:"none",color:"#CBD5E0",fontSize:"16px",cursor:"pointer" }}>x</button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <button onClick={function(){ setShowAddModal(true); }} style={{
        position:"fixed",bottom:"32px",right:"50%",transform:"translateX(50%)",
        maxWidth:"calc(480px - 48px)",width:"calc(100% - 48px)",
        padding:"18px",borderRadius:"18px",border:"none",
        background:"linear-gradient(135deg, "+GREEN+", #5A8A6A)",
        color:"#fff",fontSize:"17px",fontWeight:"700",cursor:"pointer",
        display:"flex",alignItems:"center",justifyContent:"center",gap:"8px",
        boxShadow:"0 6px 24px rgba(123,158,135,0.45)",fontFamily:FONT,
      }}>
        <span style={{ fontSize:"22px",lineHeight:1 }}>+</span> Add Pose
      </button>

      {showAddModal && <AddPoseModal onClose={function(){ setShowAddModal(false); }} onAdd={function(p){ setPoses(function(prev){ return prev.concat([p]); }); }} />}
      {swapTarget !== null && <SwapModal poses={poses} targetIndex={swapTarget} onSwap={function(a,b){ setPoses(function(prev){ var arr=prev.slice(); var tmp=arr[a]; arr[a]=arr[b]; arr[b]=tmp; return arr; }); }} onClose={function(){ setSwapTarget(null); }} />}
      {showPlayer && <PlayerView poses={poses} onClose={function(){ setShowPlayer(false); }} />}
    </div>
  );
}

export default function App() {
  const [classes, setClasses] = useState(function(){ return loadClasses(); });
  const [activeId, setActiveId] = useState(null);
  const [newClassModal, setNewClassModal] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [savedToast, setSavedToast] = useState(false);

  var nextId = useRef(loadNextId());

  useEffect(function(){
    saveClasses(classes);
    saveNextId(nextId.current);
    setSavedToast(true);
    var t = setTimeout(function(){ setSavedToast(false); }, 1500);
    return function(){ clearTimeout(t); };
  }, [classes]);

  var handleCreate = function(data) {
    var id = nextId.current++;
    setClasses(function(prev){ return prev.concat([Object.assign({ id: id, poses: [] }, data)]); });
  };

  var handleEdit = function(id, data) {
    setClasses(function(prev){ return prev.map(function(c){ return c.id===id ? Object.assign({}, c, data) : c; }); });
  };

  var handleDelete = function(id) {
    setClasses(function(prev){ return prev.filter(function(c){ return c.id!==id; }); });
    if (activeId===id) setActiveId(null);
  };

  var handleUpdateClass = function(id, changes) {
    setClasses(function(prev){ return prev.map(function(c){ return c.id===id ? Object.assign({}, c, changes) : c; }); });
  };

  var activeClass = classes.find(function(c){ return c.id===activeId; });

  return (
    <>
      {activeClass ? (
        <ClassEditor cls={activeClass} onBack={function(){ setActiveId(null); }} onUpdate={handleUpdateClass} />
      ) : (
        <ClassesHome
          classes={classes}
          onOpen={function(id){ setActiveId(id); }}
          onCreate={function(){ setNewClassModal(true); }}
          onDelete={handleDelete}
          onEdit={function(id){ setEditTarget(id); }}
        />
      )}
      {newClassModal && (
        <NewClassModal onClose={function(){ setNewClassModal(false); }} onSave={handleCreate} />
      )}
      {editTarget !== null && (
        <NewClassModal
          existing={classes.find(function(c){ return c.id===editTarget; })}
          onClose={function(){ setEditTarget(null); }}
          onSave={function(data){ handleEdit(editTarget, data); }}
        />
      )}
      <div style={{
        position:"fixed",bottom:"100px",left:"50%",
        transform:"translateX(-50%) translateY("+(savedToast?"0":"12px")+")",
        background:"rgba(30,40,35,0.82)",color:"#fff",borderRadius:"20px",
        padding:"8px 18px",fontSize:"13px",fontWeight:"600",
        fontFamily:FONT,pointerEvents:"none",
        opacity:savedToast?1:0,
        transition:"opacity 0.25s ease, transform 0.25s ease",
        zIndex:300,display:"flex",alignItems:"center",gap:"6px",
        backdropFilter:"blur(8px)",
      }}>
        Saved
      </div>
    </>
  );
}
