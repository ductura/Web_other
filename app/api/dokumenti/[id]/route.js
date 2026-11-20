// PUT /o/api/dokumenti/{id} -> Institution_server PUT /api/v1/documents/{id}.
// Only title and content go through; the answer says only whether it was saved.
import { izvuciKolacic, pozoviServer } from "../../../../src/server/institution-server.js";
import { nedozvoljeno, odgovor, procitajMutaciju } from "../../../../src/server/bff.js";

const ID = /^[\w-]{1,128}$/;

export async function PUT(request, { params }) {
  const { id } = await params;
  if (!ID.test(id)) return odgovor({ greska: "nema" }, 404);
  // Without a session the body is never read.
  const kolacic = izvuciKolacic(request.headers.get("cookie"));
  if (!kolacic) return odgovor({ greska: "nije_prijavljen" }, 401);
  const m = await procitajMutaciju(request);
  if (m.odbijeno) return m.odbijeno;

  const t = m.tijelo && typeof m.tijelo === "object" ? m.tijelo : {};
  if (typeof t.title !== "string" || typeof t.content !== "string") return odgovor({ greska: "neispravan_unos" }, 400);

  const res = await pozoviServer(`/documents/${id}`, {
    method: "PUT",
    tijelo: { id, title: t.title, content: t.content },
    kolacic,
  });
  if (!res) return odgovor({ greska: "nedostupan" }, 502);
  if (res.status === 200 || res.status === 204) return odgovor(null, 204);
  if (res.status === 401) return odgovor({ greska: "nije_prijavljen" }, 401);
  if (res.status === 403 || res.status === 404) return odgovor({ greska: "nema" }, 404);
  return odgovor({ greska: "nedostupan" }, 502);
}

export const GET = nedozvoljeno("PUT");
export { GET as POST, GET as PATCH, GET as DELETE };
