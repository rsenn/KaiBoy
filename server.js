import { client, server, fetch } from 'net';
import { Console } from 'console';
import { btoa } from 'misc';
import * as os from 'os';
import * as fs from 'fs';

let ROMsDir = '/home/roman/Downloads/GAMEBOY COLOR COMPLETE (U) [!] ROMSET';

function CreateServer(port = 4000) {
  print(`Listening on http://127.0.0.1:${port}`);
  server({
    port,
    mounts: [
      ['/', '.', 'index.html'],
      ['/archive', 'http://archive.org/download/', 'index.html']
    ],
    onConnect: socket => {
      console.log('Client connected', socket);
    },
    onMessage: (socket, msg) => {
      print('Received:', msg);
      const filename = decodeURIComponent(msg);

      if(msg.indexOf('://') != -1) {
        const res = fetch(msg);
        const data = res.arrayBuffer();
        socket.send(data);
        console.log('data:', data.slice(0, 1024));
        return;
      } else if(fs.existsSync(ROMsDir + '/' + filename)) {
        const data = fs.readFileSync(ROMsDir + '/' + filename, null);
        socket.send(data);
        console.log('data:', data.slice(0, 1024));
        return;
      }

      let [entries, err] = os.readdir(ROMsDir);

      let idx = msg.indexOf(' ');
      let pattern = idx != -1 ? msg.slice(idx + 1) : '\\.gbc?$';
      let expr = new RegExp(pattern ?? '\\.gbc?$', 'i');
      entries = entries.filter(entry => expr.test(entry));
      entries.sort();

      console.log('Sending ' + entries.length + ' entries');

      socket.send(JSON.stringify(entries.map(encodeURIComponent)));
    },
    onClose: why => {
      print('Client disconnected.' + (why ? ' Reason: ' + why : ''));
    },
    onPong: (socket, data) => {
      console.log('PONG', data);
    }
  });
}

function main(...args) {
  globalThis.console = new Console({
    inspectOptions: {
      colors: true,
      depth: 8,
      breakLength: 100,
      maxStringLength: Infinity,
      maxArrayLength: 30,
      compact: 0,
      showHidden: false
    }
  });
  let port = 4000;
  for(let arg of args) {
    if(!isNaN(+arg)) arg = +arg;

    if(typeof arg == 'number' && arg >= 1024 && arg <= 65535) port = arg;
    else if(fs.existsSync(arg)) ROMsDir = arg;
  }

  CreateServer(port);
}

main(...scriptArgs.slice(1));
