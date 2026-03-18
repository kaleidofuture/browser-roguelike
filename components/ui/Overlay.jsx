export const Overlay=({children,onClose})=>(
  <div onClick={onClose} style={{position:"fixed",top:0,left:0,right:0,bottom:0,background:"rgba(0,0,0,0.92)",zIndex:100,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
    <div onClick={e=>e.stopPropagation()} style={{background:"linear-gradient(180deg,#1e293b,#0f172a)",borderRadius:16,padding:20,maxWidth:360,width:"100%",maxHeight:"80vh",overflowY:"auto",border:"2px solid rgba(251,191,36,0.15)",boxShadow:"0 20px 60px rgba(0,0,0,0.6),inset 0 1px 0 rgba(255,255,255,0.05)",imageRendering:"pixelated"}}>{children}</div>
  </div>);
