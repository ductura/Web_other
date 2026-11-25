"use client";
import { useEffect, useState } from "react";
import { prijavaProblema as t } from "../i18n/prijava-problema.js";
import { BASE_PATH, api } from "../lib/putanje.js";

const MAX = 1000;
const KLJUC = "ductura:prijava-problema";
const duljina = (s) => [...s].length;

/** Closed set the contract knows; major is null when the version cannot be read. */
export function prepoznajPreglednik(ua) {
  const major = (re) => {
    const n = Number(re.exec(ua)?.[1]);
    return Number.isInteger(n) && n >= 0 && n <= 999 ? n : null;
  };
  if (/Firefox\/\d/.test(ua)) return { family: "firefox", major: major(/Firefox\/(\d+)/) };
  if (/Edg\/\d/.test(ua)) return { family: "chromium", major: major(/Edg\/(\d+)/) };
  if (/OPR\/\d/.test(ua)) return { family: "chromium", major: major(/OPR\/(\d+)/) };
  if (/Chrome\/\d/.test(ua)) return { family: "chromium", major: major(/Chrome\/(\d+)/) };
  if (/Version\/\d.*Safari\//.test(ua)) return { family: "safari", major: major(/Version\/(\d+)/) };
  return { family: "other", major: null };
}

const ucitajNacrt = () => {
  try {
    const n = JSON.parse(sessionStorage.getItem(KLJUC) ?? "null");
    return n && typeof n.opis === "string" && n.vrsta in t.vrste ? n : null;
  } catch {
    return null;
  }
};
const spremiNacrt = (n) => {
  try {
    sessionStorage.setItem(KLJUC, JSON.stringify(n));
  } catch {}
};
const obrisiNacrt = () => {
  try {
    sessionStorage.removeItem(KLJUC);
  } catch {}
};

export default function PrijavaProblema({ izvor = null }) {
  const [vrsta, setVrsta] = useState("technical");
  const [opis, setOpis] = useState("");
  const [stanje, setStanje] = useState("idle"); // idle | slanje | poslano | greska
  const [greska, setGreska] = useState("");
  const [referenca, setReferenca] = useState("");

  // Back from login: the text typed before the session ended is still here.
  useEffect(() => {
    const n = ucitajNacrt();
    if (!n) return;
    // Nacrt se čita iz sessionStorage tek nakon hidracije (SSR nema pristup), pa se ne može staviti u početno stanje.
    /* eslint-disable react-hooks/set-state-in-effect */
    setVrsta(n.vrsta);
    setOpis(n.opis);
    /* eslint-enable react-hooks/set-state-in-effect */
    obrisiNacrt();
  }, []);

  async function posalji(e) {
    e.preventDefault();
    if (stanje === "slanje") return;
    setStanje("slanje");
    setGreska("");
    let res;
    try {
      res = await fetch(api("/prijavi-problem"), {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ category: vrsta, description: opis, route: izvor, browser: prepoznajPreglednik(navigator.userAgent) }),
      });
    } catch {
      setGreska(t.greske.nedostupno);
      setStanje("greska");
      return;
    }
    if (res.status === 401) {
      spremiNacrt({ vrsta, opis });
      // Puna navigacija: /prijava je route handler (preusmjeravanje na AAI@EduHr), ne stranica Next.js.
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination
      window.location.assign(`${BASE_PATH}/prijava?povratak=${encodeURIComponent("/prijavi-problem")}`);
      return;
    }
    if (res.status === 201) {
      const j = await res.json().catch(() => null);
      if (typeof j?.reference === "string") {
        setReferenca(j.reference);
        setOpis("");
        setStanje("poslano");
        return;
      }
    }
    setGreska(res.status === 422 ? t.greske.neispravanUnos : res.status === 429 ? t.greske.previseOpisa : res.status === 403 ? t.greske.zabranjeno : t.greske.nedostupno);
    setStanje("greska");
  }

  if (stanje === "poslano") {
    return (
      <>
        <p role="status" id="potvrda">
          {t.potvrda(referenca)}
        </p>
        <button type="button" onClick={() => setStanje("idle")}>
          {t.nova}
        </button>
      </>
    );
  }

  const n = duljina(opis);
  return (
    <form onSubmit={posalji} noValidate>
      <p>
        <label htmlFor="vrsta">{t.vrsta}</label>
        <br />
        <select id="vrsta" value={vrsta} onChange={(e) => setVrsta(e.target.value)}>
          {Object.entries(t.vrste).map(([k, naziv]) => (
            <option key={k} value={k}>
              {naziv}
            </option>
          ))}
        </select>
      </p>
      <p>
        <label htmlFor="opis">{t.opis}</label>
        <br />
        <textarea id="opis" rows={8} style={{ width: "100%" }} value={opis} onChange={(e) => setOpis(e.target.value)} aria-describedby="brojac" />
        <span id="brojac">{t.brojac(n, MAX)}</span>
      </p>
      {greska ? <p role="alert">{greska}</p> : null}
      <button type="submit" disabled={stanje === "slanje" || n === 0 || n > MAX}>
        {stanje === "slanje" ? t.slanje : t.posalji}
      </button>
    </form>
  );
}
