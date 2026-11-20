"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { hr } from "../i18n/hr.js";
import { debounce, saveStatusLabel, wordCount } from "../lib/doc.js";
import { api } from "../lib/putanje.js";

const t = hr.dokument;

async function spremi(doc) {
  const res = await fetch(api(`/dokumenti/${encodeURIComponent(doc.id)}`), {
    method: "PUT",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ title: doc.title, content: doc.content }),
  });
  if (res.status !== 204) throw new Error(String(res.status));
}

export default function Uredivac({ doc }) {
  const [title, setTitle] = useState(doc.title);
  const [content, setContent] = useState(doc.content);
  const [stanje, setStanje] = useState("idle");
  const zadnje = useRef(doc);
  const spremljeno = useRef(doc);
  const spremaSe = useRef(false);
  const ceka = useRef(false);

  const save = useMemo(
    () =>
      debounce(async () => {
        if (spremaSe.current) {
          ceka.current = true;
          return;
        }
        if (zadnje.current === spremljeno.current) return;
        spremaSe.current = true;
        try {
          do {
            ceka.current = false;
            const snimka = zadnje.current;
            setStanje("saving");
            try {
              await spremi(snimka);
              spremljeno.current = snimka;
              setStanje(zadnje.current === snimka ? "saved" : "dirty");
            } catch {
              setStanje("error");
            }
          } while (ceka.current && zadnje.current !== spremljeno.current);
        } finally {
          spremaSe.current = false;
        }
      }, 600),
    [],
  );

  useEffect(() => {
    if (stanje === "idle" || stanje === "saved") return;
    const prijeOdlaska = (event) => {
      event.preventDefault();
      event.returnValue = true;
    };
    window.addEventListener("beforeunload", prijeOdlaska);
    return () => window.removeEventListener("beforeunload", prijeOdlaska);
  }, [stanje]);

  const promjena = (polje, postavi) => (e) => {
    zadnje.current = { ...zadnje.current, [polje]: e.target.value };
    postavi(e.target.value);
    setStanje("dirty");
    save();
  };

  return (
    <>
      <input id="title" aria-label={t.naslov} value={title} onChange={promjena("title", setTitle)} />
      <textarea id="editor" aria-label={t.sadrzaj} value={content} onChange={promjena("content", setContent)} />
      <footer className="editor-bar">
        <span id="words">{t.rijeci(wordCount(content))}</span>
        <span id="status" role="status" data-state={stanje}>
          {saveStatusLabel(stanje)}
        </span>
        <button id="save" type="button" onClick={() => save.flush()}>
          {t.spremi}
        </button>
      </footer>
    </>
  );
}
