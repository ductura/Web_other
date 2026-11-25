import { hr } from "../i18n/hr.js";

// Shown when Institution_server does not answer; no data is guessed.
export default function Nedostupno({ povratak }) {
  return (
    <>
      <p role="alert">{hr.greske.nedostupan}</p>
      <a href={povratak}>{hr.greske.pokusajPonovno}</a>
    </>
  );
}
