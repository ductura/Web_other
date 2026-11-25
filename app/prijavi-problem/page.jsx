import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import PrijavaProblema from "../../src/components/PrijavaProblema.jsx";
import { prijavaProblema as t } from "../../src/i18n/prijava-problema.js";
import { hr } from "../../src/i18n/hr.js";
import { KOLACIC, valjanKolacic } from "../../src/server/institution-server.js";

export const dynamic = "force-dynamic";
export const metadata = { title: `${t.naslov} · ${hr.app.name}` };

// Same shape the contract accepts for `route` (a page template such as /doc/[id]).
const PREDLOSKAK = /^\/(?:(?:[a-z]+(?:-[a-z]+)*|\[[A-Za-z]+\])(?:\/(?:[a-z]+(?:-[a-z]+)*|\[[A-Za-z]+\]))*)?$/;

export default async function Page({ searchParams }) {
  if (!valjanKolacic((await cookies()).get(KOLACIC)?.value)) redirect("/prijava?povratak=%2Fprijavi-problem");
  const { stranica } = await searchParams;
  const izvor = typeof stranica === "string" && stranica.length <= 128 && PREDLOSKAK.test(stranica) ? stranica : null;
  return (
    <>
      <h1>{t.naslov}</h1>
      <p>{t.uvod}</p>
      <PrijavaProblema izvor={izvor} />
    </>
  );
}
