A repo demonstrating live-reload

Basic ideas:

- the web server injects some javascript into every html page it serves; this JS listens for "filechange" [server-sent events](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events), and reloads the web page on getting them
- An [`fs.watch`](https://nodejs.org/docs/latest/api/fs.html#fswatchfilename-options-listener) call on the server-side lets the web-server know when files in a directory change

Gotchas:

- All the MDN docs have to say about server-sent-events is that they end in a double newline. However it seems that `event: filechange\n\n` is not a legal SSE (at least in chrome)
  - This works: `event: filechange\ndata: somedata\n\n`
- In the injected JS, apparently we cannot do `evtSource.addEventListener("filechange", window.location.reload);`; this results in an "illegal incovation" error
  - This works: `evtSource.addEventListener("filechange", () => window.location.reload());`
