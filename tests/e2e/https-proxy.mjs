// e2e only: TLS in front of `next start`, as the edge proxy has in production.
// WebKit sends the Secure __Host- session cookie only over https, so the
// browsers reach the app through this proxy. The self-signed certificate is
// made at start in a temporary directory and never stored in the repository.
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync } from "node:fs";
import { request } from "node:http";
import { createServer } from "node:https";
import { tmpdir } from "node:os";
import { join } from "node:path";

const PORT = Number(process.env.PROXY_PORT ?? 5178);
const CILJ = Number(process.env.APP_PORT ?? 5177);
const dir = mkdtempSync(join(tmpdir(), "web-other-e2e-"));
const [key, cert] = [join(dir, "key.pem"), join(dir, "cert.pem")];
execFileSync("openssl", [
  "req", "-x509", "-newkey", "ec", "-pkeyopt", "ec_paramgen_curve:prime256v1", "-nodes",
  "-keyout", key, "-out", cert, "-days", "1", "-subj", "/CN=localhost", "-addext", "subjectAltName=DNS:localhost",
], { stdio: "ignore" });

createServer({ key: readFileSync(key), cert: readFileSync(cert) }, (req, res) => {
  const dalje = request(
    { host: "127.0.0.1", port: CILJ, method: req.method, path: req.url, headers: { ...req.headers, "x-forwarded-proto": "https" } },
    (odgovor) => {
      res.writeHead(odgovor.statusCode ?? 502, odgovor.headers);
      odgovor.pipe(res);
    },
  );
  dalje.on("error", () => res.writeHead(502).end());
  req.pipe(dalje);
}).listen(PORT, "127.0.0.1", () => console.log(`e2e https://localhost:${PORT} -> http://127.0.0.1:${CILJ}`));
