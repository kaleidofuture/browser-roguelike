export const metadata = {
  title: "不思議のダンジョン",
  description: "ブラウザで遊べるローグライクゲーム",
};

export default function RootLayout({ children }) {
  return (
    <html lang="ja">
      <body style={{ margin: 0, padding: 0, backgroundColor: "#0f172a" }}>
        {children}
      </body>
    </html>
  );
}
