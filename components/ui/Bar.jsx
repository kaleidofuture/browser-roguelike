export const Bar=({value,max,color,label,h=10})=>(
  <div style={{position:"relative",height:h,background:"rgba(255,255,255,0.08)",borderRadius:2,overflow:"hidden",border:"1px solid rgba(255,255,255,0.06)"}}>
    <div style={{height:"100%",width:`${Math.max(0,(value/max)*100)}%`,background:color,borderRadius:1,transition:"width 0.2s"}}/>
    {label&&<span style={{position:"absolute",top:0,left:0,right:0,textAlign:"center",fontSize:h>8?9:7,lineHeight:`${h}px`,fontWeight:700,color:"#fff",textShadow:"0 1px 2px rgba(0,0,0,0.8)",letterSpacing:"0.02em"}}>{label}</span>}
  </div>);
