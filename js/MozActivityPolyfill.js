if(window.MozActivity === undefined) {
  window.MozActivity = function MozActivity(opts) {
    const activity = this;

    globalThis.activity = activity;

    this.opts = opts;
    this.overlay = modal(`<div><h4>Picker</h4></div>`);
    let ws = (this.ws = new WebSocket(`ws://${document.location.host}`));

    ws.onopen = function() {
      console.log("WebSocket opened");
    };
    ws.onmessage = async function(event) {
      const { data } = event;
      activity.data = await data.arrayBuffer();
      console.log("Got data", activity.data);

      activity.overlay.close();
      activity.onsuccess(activity.data);
    };
    ws.onclosed = function(e) {
      console.log("WebSocket closed");
    };
    ws.onerror = function(e) {
      console.log("WebSocket error");
    };

    setStyles(this.overlay.firstElementChild, { "min-width": "300px", "min-height": "300px" });
    setStyles(this.overlay.firstElementChild.firstElementChild, {
      width: "100%",
      background: "black",
      "margin-block-start": 0,
      color: "white"
    });

    let files = [
      "http://archive.org/download/GameboyClassicRomCollectionByGhostware/Speedy%20Gonzales%20%28USA%2C%20Europe%29.zip/Speedy%20Gonzales%20%28USA%2C%20Europe%29.gb",
      "http://archive.org/download/GameboyColorRomCollectionByGhostware/Tiny%20Toon%20Adventures%20-%20Buster%20Saves%20the%20Day%20%28Europe%29%20%28En%2CFr%2CDe%2CEs%2CIt%29.zip/Tiny%20Toon%20Adventures%20-%20Buster%20Saves%20the%20Day%20%28Europe%29%20%28En%2CFr%2CDe%2CEs%2CIt%29.gbc",
      "http://archive.org/download/GameboyColorRomCollectionByGhostware/Tintin%20in%20Tibet%20%28Europe%29%20%28En%2CFr%2CDe%2CEs%2CIt%2CNl%2CSv%29.zip/Tintin%20in%20Tibet%20%28Europe%29%20%28En%2CFr%2CDe%2CEs%2CIt%2CNl%2CSv%29.gbc"
    ];
    let list = document.createElement("ul");

    setStyles(list, { "padding-inline-start": "0px", "margin-block-start": "0px" });

    this.overlay.firstElementChild.appendChild(list);

    for(let file of files) {
      let item = document.createElement("li");

      setAttributes(item, { class: "picker-file", "data-url": file });
      setStyles(item, { padding: "0.7em 5px", cursor: "pointer" });

      item.innerHTML = decodeURIComponent(file.replace(/.*\//g, ""));

      item.onmouseenter = function() {
        if(!activity.url) item.classList.add("active");
      };
      item.onmouseleave = function() {
        if(!activity.url) item.classList.remove("active");
      };
      item.onclick = function(event) {
        if(!activity.url) {
          let url = event.currentTarget.getAttribute("data-url");

          console.log("selected", url);
          activity.url = url;
          ws.send(url);
          console.log(`Loading '${url}'...`);
        }
      };

      list.appendChild(item);
    }

    return this;
  };
}

/**
 * Create modal window
 *
 * @param {HTML} content - The HTML content of the modal window
 *
 * @return {function} - a function to close the modal window
 */
function modal(content) {
  "use strict";
  [document.children[0], document.body].forEach(function (e) {
    e.style.height = "100%";
    e.style.width = "100%";
    e.style.padding = "0";
    e.style.margin = "0";
  });
  var mod = document.createElement("div"),
    cell = document.createElement("div"),
    overlay = document.createElement("div");

  setStyles(mod, { display: "inline-block", "max-width": "50%", background: "white" });
  setStyles(cell, { display: "table-cell", "vertical-align": "middle", "text-align": "center" });
  setStyles(overlay, {
    position: "fixed",
    top: 0,
    left: 0,
    display: "table",
    width: "100%",
    height: "100%",
    background: "rgba(0, 0, 0, 0.5)",
    "z-index": 10
  });
  if(content instanceof Element) {
    mod.appendChild(content);
  } else {
    mod.innerHTML = content;
  }
  cell.appendChild(mod);
  overlay.appendChild(cell);
  document.body.appendChild(overlay);
  mod.close = function() {
    document.body.removeChild(overlay);
  };
  return mod;
}

function setStyles(element, styles) {
  for(let property in styles) element.style.setProperty(property, styles[property] + "");
}
function setAttributes(element, attributes) {
  for(let property in attributes) element.setAttribute(property, attributes[property] + "");
}
