"use client";
import { useState } from "react";
import { hr } from "../i18n/hr.js";
import { wordCount } from "../lib/doc.js";

const t = hr.dokument;

// Saving through this app's route to Institution_server follows in the next step.
export default function Uredivac({ doc }) {
  const [title, setTitle] = useState(doc.title);
  const [content, setContent] = useState(doc.content);

  return (
    <>
      <input id="title" aria-label={t.naslov} value={title} onChange={(e) => setTitle(e.target.value)} />
      <textarea id="editor" aria-label={t.sadrzaj} value={content} onChange={(e) => setContent(e.target.value)} />
      <footer className="editor-bar">
        <span id="words">{t.rijeci(wordCount(content))}</span>
      </footer>
    </>
  );
}
