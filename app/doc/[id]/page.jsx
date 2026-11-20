import Link from "next/link";
import { redirect } from "next/navigation";
import Nedostupno from "../../../src/components/Nedostupno.jsx";
import Uredivac from "../../../src/components/Uredivac.jsx";
import { hr } from "../../../src/i18n/hr.js";
import { docHref } from "../../../src/lib/doc.js";
import { BASE_PATH } from "../../../src/lib/putanje.js";
import { dohvatiDokument } from "../../../src/server/podaci.js";

export const dynamic = "force-dynamic";

export default async function DocPage({ params }) {
  const { id } = await params;
  const doc = await dohvatiDokument(id);
  if (doc === "odjavljen") redirect(`/prijava?povratak=${encodeURIComponent(docHref(id))}`);
  if (doc === "nedostupan") return <Nedostupno povratak={`${BASE_PATH}${docHref(id)}`} />;
  if (doc === "nema") {
    return (
      <>
        <p role="alert">{hr.dokument.nedostupan}</p>
        <Link href="/">{hr.dokument.natrag}</Link>
      </>
    );
  }
  return <Uredivac key={doc.id} doc={doc} />;
}
