"use client";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { docHref, parseRoute } from "../lib/doc.js";

// Earlier links had the form /#/doc/<id>; they open the same document.
export default function StaraPoveznica() {
  const router = useRouter();
  useEffect(() => {
    const r = parseRoute(window.location.hash);
    if (r.view === "doc") router.replace(docHref(r.id));
  }, [router]);
  return null;
}
