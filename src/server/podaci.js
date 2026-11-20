// Data for server components. Every read carries the session cookie of the
// current request; a 401 from Institution_server means the session is gone.
import { cookies } from "next/headers";
import { KOLACIC, pozoviServer, procitajJson, valjanKolacic } from "./institution-server.js";

async function kolacic() {
  return valjanKolacic((await cookies()).get(KOLACIC)?.value);
}

// "odjavljen" | "nedostupan" | "nema" | the parsed body.
async function citaj(putanja) {
  const k = await kolacic();
  if (!k) return "odjavljen";
  const res = await pozoviServer(putanja, { kolacic: k });
  if (!res) return "nedostupan";
  if (res.status === 401) return "odjavljen";
  if (res.status === 404 || res.status === 403) return "nema";
  if (!res.ok) return "nedostupan";
  return (await procitajJson(res)) ?? "nedostupan";
}

const dokument = (d) => d && typeof d === "object" && typeof d.id === "string" && typeof d.title === "string";

/** @returns {Promise<Array<{id: string, title: string}> | "odjavljen" | "nedostupan">} */
export async function dohvatiDokumente() {
  const r = await citaj("/documents");
  if (r === "nema") return "nedostupan";
  if (typeof r === "string") return r;
  return Array.isArray(r) ? r.filter(dokument) : "nedostupan";
}

/** @returns {Promise<{id: string, title: string, content: string} | "odjavljen" | "nedostupan" | "nema">} */
export async function dohvatiDokument(id) {
  const r = await citaj(`/documents/${encodeURIComponent(id)}`);
  if (typeof r === "string") return r;
  if (!dokument(r)) return "nedostupan";
  return { id: r.id, title: r.title, content: typeof r.content === "string" ? r.content : "" };
}
