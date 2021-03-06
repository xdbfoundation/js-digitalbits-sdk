const http = require("http");
const url = require("url");
const port = 3100;

describe("integration tests: streaming", function(done) {
  if (typeof window !== "undefined") {
    done();
    return;
  }

  it("handles onerror", function(done) {
    let server;
    let closeStream;

    const requestHandler = (request, response) => {
      // returning a 401 will call the onerror callback.
      response.statusCode = 401;
      response.end();
      server.close();
    };

    server = http.createServer(requestHandler);
    server.listen(port, (err) => {
      if (err) {
        done(err);
        return;
      }

      closeStream = new DigitalBitsSdk.Server(`http://localhost:${port}`, {
        allowHttp: true,
      })
        .operations()
        .stream({
          onerror: (err) => {
            server.close();
            closeStream();
            done();
          },
        });
    });
  });

  it("handles close message", function(done) {
    let server;
    let closeStream;

    const requestHandler = (request, response) => {
      request.on("close", (e) => {
        closeStream();
        server.close();
        done();
      });

      response.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
      });
      response.write("retry: 10\nevent: close\ndata: byebye\n\n");
    };

    server = http.createServer(requestHandler);
    server.listen(port, (err) => {
      if (err) {
        done(err);
        return;
      }

      closeStream = new DigitalBitsSdk.Server(`http://localhost:${port}`, {
        allowHttp: true,
      })
        .operations()
        .stream({
          onmessage: (m) => {
            done("unexpected message "+JSON.stringify(m));
          },
          onerror: (err) => {
            done(err);
          },
        });
    });
  });
});
