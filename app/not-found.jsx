import Link from "next/link";
import { hr } from "../src/i18n/hr.js";

export default function NotFound() {
  return (
    <>
      <p role="alert">{hr.dokument.nedostupan}</p>
      <Link href="/">{hr.dokument.natrag}</Link>
    </>
  );
}
