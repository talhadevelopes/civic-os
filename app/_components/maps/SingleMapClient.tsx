"use client";
import dynamic from "next/dynamic";

const SingleMap = dynamic(() => import("./SingleMap"), { 
  ssr: false, 
  loading: () => <div className="h-full bg-slate-100 flex items-center justify-center font-bold text-xs text-slate-400">Loading Map...</div> 
});

export default function SingleMapClient({ lat, lng, category }: { lat: number; lng: number, category?: string }) {
  return <SingleMap lat={lat} lng={lng} category={category} />;
}
