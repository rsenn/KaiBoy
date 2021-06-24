if(window.MozActivity === undefined) {
  window.MozActivity = function MozActivity(opts) {
    const activity = (globalThis.activity = this);

    this.opts = opts;
    let overlay = (this.overlay = modal(`<div><h4>Picker</h4></div>`));
    let ws = (this.ws = new WebSocket(`ws://${document.location.host}`));
    let items = [],
      fileIndex = -1,
      activeElem,
      scroller;
    let box = document.createElement('div');
    let mainlist = document.createElement('ul');

    setStyles(box, {
      'max-height': '300px',
      overflow: 'auto',
      'font-size': '11px',
      'font-family': 'fixed',
      position: 'relative'
    });
    setStyles(mainlist, { 'padding-inline-start': '0px', 'margin-block-start': '0px' });

    box.appendChild(mainlist);
    overlay.firstElementChild.appendChild(box);

    ws.onopen = function() {
      console.log('WebSocket opened');
      ws.send('LIST \\.gbc$');
    };
    ws.onmessage = async function(event) {
      const { data } = event;
      if(typeof data.arrayBuffer == 'function') {
        activity.data = await data.arrayBuffer();
        console.log('Got data', activity.data);
        activity.overlay.close();
        activity.ws.close();
        activity.onsuccess(activity.data);
        return;
      }
      items = JSON.parse(data);
      if(typeof items == 'object' && items !== null && items.length) {
        activity.mainlist = items;
        AddFiles(activity.mainlist);
        activity.overlay.visible(true);
        scroller = globalThis.scroller = new Scroller(box, [...mainlist.children]);
        selectFile(0);

        window.addEventListener('keydown', handleKeys);
      } else console.log('onmessage items =', typeof items, items);
    };
    ws.onclosed = function(e) {
      console.log('WebSocket closed');
    };
    ws.onerror = function(e) {
      console.log('WebSocket error');
    };

    setStyles(overlay.firstElementChild, { 'min-width': '300px', 'min-height': '300px' });
    setStyles(overlay.firstElementChild.firstElementChild, {
      width: '100%',
      background: 'black',
      'margin-block-start': 0,
      color: 'white'
    });

    let files = [
      'http://archive.org/download/GameboyClassicRomCollectionByGhostware/Speedy%20Gonzales%20%28USA%2C%20Europe%29.zip/Speedy%20Gonzales%20%28USA%2C%20Europe%29.gb',
      'http://archive.org/download/GameboyColorRomCollectionByGhostware/Tiny%20Toon%20Adventures%20-%20Buster%20Saves%20the%20Day%20%28Europe%29%20%28En%2CFr%2CDe%2CEs%2CIt%29.zip/Tiny%20Toon%20Adventures%20-%20Buster%20Saves%20the%20Day%20%28Europe%29%20%28En%2CFr%2CDe%2CEs%2CIt%29.gbc',
      'http://archive.org/download/GameboyColorRomCollectionByGhostware/Tintin%20in%20Tibet%20%28Europe%29%20%28En%2CFr%2CDe%2CEs%2CIt%2CNl%2CSv%29.zip/Tintin%20in%20Tibet%20%28Europe%29%20%28En%2CFr%2CDe%2CEs%2CIt%2CNl%2CSv%29.gbc'
    ];

    function selectFile(index) {
      fileIndex = index;
      selectFileByIndex();
    }

    function selectFileByIndex() {
      [].forEach.call(activeElem ? [activeElem] : mainlist.children, function(el) {
        el.classList.remove('active');
      });
      console.log('selectFileByIndex', fileIndex);
      activeElem = mainlist.children[fileIndex];
      activeElem.classList.add('active');
      console.log('scroller.start', scroller.start);
      console.log('scroller.end', scroller.end);
      console.log('scroller.itemPos(fileIndex)', scroller.itemPos(fileIndex));
      let offset = scroller.itemOutside(fileIndex);
      scroller.scrollBy(offset);
      /*console.log('activeElem.offsetTop', activeElem.offsetTop);
      console.log('box.offsetHeight', box.offsetHeight);
      if(activeElem.offsetTop >= box.scrollTop + box.offsetHeight)
        box.scrollTop = activeElem.offsetTop - box.offsetHeight + activeElem.offsetHeight;
      else if(activeElem.offsetTop < box.scrollTop) box.scrollTop = activeElem.offsetTop;*/
    }
    function AddFiles(files) {
      let i = 0;
      for(let file of files) {
        let item = document.createElement('li');
        setAttributes(item, { class: 'picker-file', 'data-url': file, 'data-index': i + '' });
        setStyles(item, { padding: '0.7em 5px', cursor: 'pointer' });
        item.innerHTML = decodeURIComponent(file.replace(/.*\//g, ''));
        item.onmouseenter = function(event) {
          let index = event.currentTarget.getAttribute('data-index');
          if(!activity.url) selectFile(+index);
        };
        /*        item.onmouseleave = function() {
          if(!activity.url) item.classList.remove('active');
        };*/
        item.onclick = function(event) {
          if(!activity.url) {
            let url = event.currentTarget.getAttribute('data-url');
            console.log('selected', url);
            activity.url = url;
            ws.send(url);
            console.log(`Loading '${url}'...`);
          }
        };
        mainlist.appendChild(item);
        i++;
      }
    }
    function handleKeys(e) {
      switch (e.key) {
        case 'ArrowUp': //scroll up
        case 'ArrowLeft':
          selectFile(fileIndex > 0 ? fileIndex - 1 : mainlist.children.length - 1);
          break;
        case 'ArrowDown': //scroll down
        case 'ArrowRight':
          selectFile(fileIndex + 1 == mainlist.children.length ? 0 : fileIndex + 1);

          break;
        case 'SoftRight': //go back
          break;
        case 'Enter': //pick the file
          break;
        case 'Home':
          selectFile(0);
          break;
        case 'End':
          selectFile(mainlist.children.length - 1);
          break;
        default: console.log('handleKeys', e.key);
          break;
      }
    }
    return this;
  };
}

function Scroller(container, items) {
  this.pageHeight = container.offsetHeight;
  this.itemHeight = items[0].offsetHeight;
  this.itemsPerPage = Math.floor(this.pageHeight / this.itemHeight);
  Object.defineProperties(this, {
    start: {
      get() {
        return Math.floor(container.scrollTop / this.itemHeight);
      }
    },
    end: {
      get() {
        return this.start + this.itemsPerPage;
      }
    },
    scrollTo: {
      value(pos) {
        container.scrollTop = pos * this.itemHeight;
      }
    },
    scrollBy: {
      value(offset) {
        this.scrollTo(this.start + offset);
      }
    },
    itemPos: {
      value(index) {
        return index - this.start;
      }
    },
    itemOutside: {
      value(index) {
        if(index >= this.end) return index + 1 - this.end;
        if(index < this.start) return index - this.start;
        return 0;
      }
    },
    isVisible: {
      value(index) {
        return index >= this.start && index < this.end;
      }
    },
    moveItemTo: {
      value(index, pos) {
        pos = ((pos % this.itemsPerPage) + this.itemsPerPage) % this.itemsPerPage;
        let offset = this.itemPos(index) - pos;
        console.log('moveItemTo', { pos, offset });
        this.scrollBy(offset);
      }
    }
  });
  console.log('Scroller', this);

  return this;
}

/**
 * Create modal window
 *
 * @param {HTML} content - The HTML content of the modal window
 *
 * @return {function} - a function to close the modal window
 */
function modal(content) {
  'use strict';
  [document.children[0], document.body].forEach(function (e) {
    e.style.height = '100%';
    e.style.width = '100%';
    e.style.padding = '0';
    e.style.margin = '0';
  });
  var mod = document.createElement('div'),
    cell = document.createElement('div'),
    overlay = document.createElement('div');

  setStyles(mod, { display: 'inline-block', 'max-width': '50%', background: 'white' });
  setStyles(cell, { display: 'table-cell', 'vertical-align': 'middle', 'text-align': 'center' });
  setStyles(overlay, {
    position: 'fixed',
    top: 0,
    left: 0,
    display: 'table',
    width: '100%',
    height: '100%',
    background: 'rgba(0, 0, 0, 0.5)',
    'z-index': 10
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
  mod.visible = function(show) {
    setStyles(overlay, { display: show ? 'table' : 'none' });
  };
  mod.visible(false);
  return mod;
}

function setStyles(element, styles) {
  for(let property in styles) element.style.setProperty(property, styles[property] + '');
}
function setAttributes(element, attributes) {
  for(let property in attributes) element.setAttribute(property, attributes[property] + '');
}
