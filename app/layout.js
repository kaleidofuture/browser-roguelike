export const metadata = {
  title: "不思議のダンジョン",
  description: "ブラウザで遊べるローグライクゲーム",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "ダンジョン",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#0f172a",
};

export default function RootLayout({ children }) {
  return (
    <html lang="ja" style={{ overflow: "hidden", height: "100dvh" }}>
      <head>
        <link rel="apple-touch-icon" href="/icon-192.png" />
      </head>
      <body style={{ margin: 0, padding: 0, backgroundColor: "#0f172a", paddingBottom: "env(safe-area-inset-bottom)", overflow: "hidden", height: "100dvh", position: "fixed", width: "100%", overscrollBehavior: "none" }}>
        <style dangerouslySetInnerHTML={{__html:`
          @keyframes fx-shake{0%,100%{transform:translate(0,0)}15%{transform:translate(-3px,-2px)}30%{transform:translate(3px,2px)}45%{transform:translate(-2px,1px)}60%{transform:translate(2px,-1px)}75%{transform:translate(-1px,2px)}}
          @keyframes fx-flash{0%{opacity:0.9;transform:scale(1.1)}100%{opacity:0;transform:scale(0.5)}}
          @keyframes fx-dmg{0%{opacity:1;transform:translateY(0) scale(1)}50%{opacity:1;transform:translateY(-18px) scale(1.1)}100%{opacity:0;transform:translateY(-30px) scale(0.7)}}
          @keyframes fx-kill{0%{opacity:1;transform:scale(1)}40%{opacity:0.8;transform:scale(1.4)}100%{opacity:0;transform:scale(0.1) rotate(180deg)}}
          @keyframes fx-particle{0%{opacity:1;transform:translate(0,0) scale(1)}100%{opacity:0;transform:translate(var(--px),var(--py)) scale(0)}}
          @keyframes fx-playerHit{0%{background:rgba(255,60,60,0.5)}100%{background:transparent}}
          @keyframes fx-skill{0%{opacity:0.8;transform:scale(0.5)}30%{opacity:0.6;transform:scale(1.05)}100%{opacity:0;transform:scale(1.2)}}
          @keyframes fx-heal{0%{opacity:0.7;box-shadow:0 0 8px #4ade80}100%{opacity:0;box-shadow:0 0 20px transparent}}
          @keyframes stairs-pulse{0%,100%{opacity:0.25;transform:scale(0.9)}50%{opacity:0.6;transform:scale(1.05)}}
          @keyframes stairs-arrow{0%,100%{transform:translateY(0);opacity:0.9}50%{transform:translateY(3px);opacity:0.5}}
          @keyframes entity-slide{from{translate:var(--sx) var(--sy)}to{translate:0 0}}
          @keyframes splash-blink{0%,100%{opacity:0.4}50%{opacity:1}}
          @keyframes splash-float{0%,100%{transform:translateY(0)}50%{transform:translateY(-4px)}}
          @keyframes title-float{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}
          @keyframes title-glow{0%,100%{text-shadow:0 0 12px rgba(251,191,36,0.3),0 2px 8px rgba(0,0,0,0.5)}50%{text-shadow:0 0 24px rgba(251,191,36,0.5),0 2px 8px rgba(0,0,0,0.5)}}
          @keyframes title-torch{0%,100%{opacity:0.6;transform:scaleY(1)}50%{opacity:1;transform:scaleY(1.1)}}
          @keyframes title-btn{0%,100%{box-shadow:0 6px 24px rgba(245,158,11,0.35)}50%{box-shadow:0 6px 32px rgba(245,158,11,0.55)}}
          @keyframes title-particle{0%{opacity:0;transform:translateY(0)}20%{opacity:0.6}100%{opacity:0;transform:translateY(-60px)}}
          @keyframes sparkle{0%{opacity:0;transform:scale(0) rotate(0deg)}25%{opacity:1;transform:scale(1) rotate(90deg)}50%{opacity:0.6;transform:scale(0.6) rotate(180deg)}75%{opacity:1;transform:scale(1) rotate(270deg)}100%{opacity:0;transform:scale(0) rotate(360deg)}}
          @keyframes sparkle-drift{0%{transform:translateY(0)}100%{transform:translateY(-20px)}}
          @keyframes shooting-star{0%{opacity:0;transform:translateX(0) translateY(0)}10%{opacity:1}70%{opacity:0.6}100%{opacity:0;transform:translateX(var(--ss-dx)) translateY(var(--ss-dy))}}
          @keyframes go-float{0%,100%{transform:translateY(0)}50%{transform:translateY(-4px)}}
          @keyframes go-glow{0%,100%{filter:drop-shadow(0 4px 12px rgba(251,191,36,0.3))}50%{filter:drop-shadow(0 4px 24px rgba(251,191,36,0.6))}}
          @keyframes go-fade{0%{opacity:0;transform:translateY(10px)}100%{opacity:1;transform:translateY(0)}}
          @keyframes kf-star-pop{0%{transform:scale(1)}30%{transform:scale(1.4)}60%{transform:scale(0.9)}100%{transform:scale(1)}}
        `}}/>
        {children}
        <script
          dangerouslySetInnerHTML={{
            __html: `if('serviceWorker' in navigator){navigator.serviceWorker.register('/sw.js')}`,
          }}
        />
      </body>
    </html>
  );
}
