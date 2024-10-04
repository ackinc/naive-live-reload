const http = require("http");
const fs = require("fs");
const path = require("path");

const port = 3000;
const rootDir = path.join(__dirname, "public");

const fileChangeSubscribers = [];
fs.watch(rootDir, { recursive: true }, onFileChange);

const server = http.createServer(async (req, res) => {
  if (req.url === "/__events") {
    eventsHandler(req, res);
  } else {
    await serveStaticFile(req, res);
  }
});
server.listen(port, () => {
  console.log(`Server running at https://localhost:${port}/`);
});

async function serveStaticFile(req, res) {
  let filePath = path.join(rootDir, req.url === "/" ? "index.html" : req.url);
  const extname = String(path.extname(filePath)).toLowerCase();
  const mimeTypes = {
    ".html": "text/html",
    ".js": "text/javascript",
    ".css": "text/css",
    ".json": "application/json",
    ".png": "image/png",
    ".jpg": "image/jpg",
    ".gif": "image/gif",
    ".wav": "audio/wav",
    ".mp4": "video/mp4",
    ".woff": "application/font-woff",
    ".ttf": "application/font-ttf",
    ".eot": "application/vnd.ms-fontobject",
    ".otf": "application/font-otf",
    ".svg": "application/image/svg+xml",
  };

  const contentType = mimeTypes[extname] || "application/octet-stream";

  try {
    let content = await fs.promises.readFile(filePath);

    if (extname === ".html") {
      content = content
        .toString()
        .replace("</body>", `<script>${liveReloadScript}</script></body>`);
    }

    res.writeHead(200, { "Content-Type": contentType });
    res.end(content, "utf-8");
  } catch (error) {
    if (error.code === "ENOENT") {
      res.writeHead(404, { "Content-Type": "text/plain" });
      res.end("File not found", "utf-8");
    } else {
      res.writeHead(500, { "Content-Type": "text/plain" });
      res.end(`Sorry, check with the site admin for error: ${error.code}`);
    }
  }
}

function eventsHandler(req, res) {
  res.writeHead(200, {
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
    "Content-Type": "text/event-stream",
  });

  const id = fileChangeSubscribers.length;
  const cb = (data) =>
    res.write(`event: filechange\ndata: ${JSON.stringify(data)}\n\n`);
  fileChangeSubscribers.push({ id, cb });

  req.on("close", () => fileChangeSubscribers.splice(id, 1));
}

function onFileChange(eventType, filename) {
  fileChangeSubscribers.forEach((subscriber) =>
    subscriber.cb({ eventType, filename })
  );
}

const liveReloadScript = `
const evtSource = new EventSource("/__events");
evtSource.addEventListener("filechange", () => window.location.reload());
`;
