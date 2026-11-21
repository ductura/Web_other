import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Nedostupno from "../../src/components/Nedostupno.jsx";
import { hr } from "../../src/i18n/hr.js";
import { BASE_PATH } from "../../src/lib/putanje.js";
import { KOLACIC, valjanKolacic } from "../../src/server/institution-server.js";
import { dohvatiZadatke } from "../../src/server/zadaci.js";

export const dynamic = "force-dynamic";
export const metadata = { title: `${hr.zadaci.naslov} · ${hr.app.name}` };

const rok = (iso) =>
  new Intl.DateTimeFormat("hr-HR", { dateStyle: "long", timeStyle: "short", timeZone: "Europe/Zagreb" }).format(new Date(iso));

export default async function Page() {
  const k = valjanKolacic((await cookies()).get(KOLACIC)?.value);
  const r = await dohvatiZadatke(k);
  if (r.vrsta === "odjavljen") redirect("/prijava?povratak=%2Fzadaci");
  if (r.vrsta === "nedostupan") return <Nedostupno povratak={`${BASE_PATH}/zadaci`} />;
  if (r.vrsta === "zabranjeno") return <p role="alert">{hr.zadaci.nemaPristupa}</p>;
  return (
    <>
      <h1>{hr.zadaci.naslov}</h1>
      {r.kolegiji.length === 0 ? (
        <p>{hr.zadaci.prazno}</p>
      ) : (
        r.kolegiji.map((kolegij) => (
          <section key={kolegij.id} aria-labelledby={`k-${kolegij.id}`}>
            <h2 id={`k-${kolegij.id}`}>{kolegij.name}</h2>
            {kolegij.assignments.length === 0 ? (
              <p>{hr.zadaci.kolegijBezZadatka}</p>
            ) : (
              <ul className="zadaci">
                {kolegij.assignments.map((z) => (
                  <li key={z.id}>
                    {/* /rad/<id> belongs to the editor behind the same origin, outside this app's basePath. */}
                    <a href={`/rad/${encodeURIComponent(z.id)}`}>{z.title}</a>
                    <div>
                      {hr.zadaci.rok}: <time dateTime={z.dueAt}>{rok(z.dueAt)}</time>
                    </div>
                    {z.stanje ? <div>{hr.zadaci.stanje[z.stanje]}</div> : null}
                    {z.noticeFirst ? <div>{hr.zadaci.obavijestPrvo}</div> : null}
                  </li>
                ))}
              </ul>
            )}
          </section>
        ))
      )}
    </>
  );
}
