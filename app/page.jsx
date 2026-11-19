import Link from "next/link";
import { redirect } from "next/navigation";
import Nedostupno from "../src/components/Nedostupno.jsx";
import StaraPoveznica from "../src/components/StaraPoveznica.jsx";
import { hr } from "../src/i18n/hr.js";
import { docHref } from "../src/lib/doc.js";
import { BASE_PATH } from "../src/lib/putanje.js";
import { dohvatiDokumente } from "../src/server/podaci.js";

export const dynamic = "force-dynamic";

export default async function Page() {
  const docs = await dohvatiDokumente();
  if (docs === "odjavljen") redirect("/prijava");
  if (docs === "nedostupan") return <Nedostupno povratak={`${BASE_PATH}/`} />;
  return (
    <>
      <StaraPoveznica />
      <h1>{hr.popis.naslov}</h1>
      {docs.length === 0 ? (
        <p>{hr.popis.prazno}</p>
      ) : (
        <ul id="doc-list">
          {docs.map((d) => (
            <li key={d.id}>
              <Link href={docHref(d.id)}>{d.title}</Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
