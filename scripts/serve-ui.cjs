const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..", "ui");
const port = Number(process.env.PORT || 3000);
http.createServer((req, res) => {
  const pathname = decodeURIComponent((req.url || "/").split("?")[0]);
  const requested = path.resolve(root, `.${pathname === "/" ? "/index.html" : pathname}`);
  if (!requested.startsWith(root + path.sep) && requested !== path.join(root, "index.html")) {
    res.writeHead(403).end("Forbidden"); return;
  }
  fs.readFile(requested, (error, content) => {
    if (error) { res.writeHead(404).end("Not found"); return; }
    const type = requested.endsWith(".css") ? "text/css" : requested.endsWith(".js") ? "text/javascript" : "text/html";
    res.writeHead(200, { "Content-Type": `${type}; charset=utf-8` }); res.end(content);
  });
}).listen(port, "127.0.0.1", () => console.log(`DropForge UI preview: http://localhost:${port}`));