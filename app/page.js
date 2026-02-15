"use client";

import dynamic from "next/dynamic";

const Roguelike = dynamic(() => import("../components/Roguelike"), {
  ssr: false,
});

export default function Home() {
  return <Roguelike />;
}
