import { client, server, fetch } from "net";
import { Console } from "console";
import { btoa } from "misc";

function CreateServer(port = 4000) {
  print(`Listening on http://127.0.0.1:${port}`);
  server({
    port,
    mounts: [
      ["/", ".", "index.html"],
      ["/archive", "http://archive.org/download/", "index.html"]
    ],
    onConnect: socket => {
      print("Client connected");
      print("Socket: " + socket);
      //    socket.send("Hello from server");
    },
    onMessage: (socket, msg) => {
      print("Received:", msg);

      const res = fetch(msg);

      const data = res.arrayBuffer();

      socket.send(data);

      console.log("data:", data.slice(0, 1024));
    },
    onClose: why => {
      print("Client disconnected. Reason: ", why);
    },
    onPong: (socket, data) => {
      print("Pong: ", data);
    }
  });
}

function getJSON() {
  console.log("getJSON");
  const res = fetch("https://api.github.com/repos/rsenn/plot-cv", {
    method: "head"
  });
  const { ok, status, type } = res;
  console.log("res:", { ok, status, type });

  const json = res.json();
  console.log("json:", json);

  const data = new Map(Object.entries(json));
  console.log("data:", data);
  return data;
}

function main(...args) {
  globalThis.console = new Console({
    inspectOptions: {
      colors: true,
      depth: 8,
      breakLength: 100,
      maxStringLength: Infinity,
      maxArrayLength: Infinity,
      compact: 0,
      showHidden: false
    }
  });
  CreateServer();
}

main(...scriptArgs.slice(1));
