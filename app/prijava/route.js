// GET /o/prijava?povratak=/doc/x -> 303 to Institution_server login (AAI@EduHr,
// D-09), which brings the browser back to the same page in this app. A route
// handler, because redirect() in a page would put /o in front of /api/v1.
import { povratakUnutarAplikacije, prijavaUrl } from "../../src/server/institution-server.js";

export const dynamic = "force-dynamic";

export function GET(request) {
  const cilj = povratakUnutarAplikacije(new URL(request.url).searchParams.get("povratak"));
  return new Response(null, { status: 303, headers: { location: prijavaUrl(cilj), "cache-control": "no-store" } });
}
