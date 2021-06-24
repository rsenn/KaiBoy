window.addEventListener('DOMContentLoaded',
  function () {
    var mainlist = document.getElementById('filepicker');
    var items = (window.roms = []),
      fileIndex = 0;
    var activityHandler = null;
    var activeElem = null;
    var scroller;

    function findItem(name) {
      return items.findIndex(it => name == it.name);
    }
function basename(path) {
  return path.replace(/.*\//g, '');
}

    function refreshFileList() {
      mainlist.innerHTML = '';

      items.sort(function (a, b) {
        return a.base.localeCompare(b.base);
      });
      activeElem = null;
      fileIndex = 0;

      for(let i = 0, l = items.length; i < l; i++) {
        let item = document.createElement('div');
        item.innerHTML = items[i].name.replace(/.*\//g, '');
        item.classList.add('picker-file');
        mainlist.appendChild(item);
      }

      if(!scroller) scroller = new Scroller(mainlist, [...mainlist.children]);

      let rom;
      if((rom = localStorage.getItem('lastROM'))) {
        fileIndex = findItem(rom);
      }

      if((activeElem = mainlist.children[fileIndex])) {
        let mid = Math.floor(scroller.itemsPerPage / 2);
        if(fileIndex >= mid) scroller.scrollTo(fileIndex - mid);

        activeElem.classList.add('active');
      }
    }

    function rescanFiles() {
      items = [];
      let fileTest = /\.gbc?$/i;
      let sdcards = navigator.getDeviceStorages('sdcard'),
        storageAmount = sdcards.length;
      for(let i = 0; i < storageAmount; i++) {
        let fileCursor = sdcards[i].enumerate();
        fileCursor.onsuccess = function() {
          if(fileCursor.result.name !== null) {
            let file = fileCursor.result;
            if(fileTest.test(file.name.toLowerCase()) && findItem(file.name) == -1) {
              file.storage = sdcards[i].storageName;
              file.base = basename(file.name);
              items.push(file);
              refreshFileList();
            }
            fileCursor.continue();
          }
        };
      }
    }

    navigator.mozSetMessageHandler('activity', function(activityRequest) {
      option = activityRequest.source;

      if(option.name === 'xyz.831337.kaiboy.pickFile') {
        activityHandler = activityRequest;

        let roms;

        /* if((roms = localStorage.getItem('roms'))) {
          items = JSON.parse(roms);
          refreshFileList();
          document.getElementById('refresh').innerHTML = 'Refresh';
        } else */ {
          rescanFiles();
        }
      }
    });

    function selectFileByIndex() {
      [].forEach.call(activeElem ? [activeElem] : mainlist.children, function(el) {
        el.classList.remove('active');
      });
      activeElem = mainlist.children[fileIndex];
      activeElem.classList.add('active');

      let offset = scroller.itemOutside(fileIndex);
      scroller.scrollBy(offset);
    }

    window.addEventListener('keydown', function(e) {
      switch (e.key) {
        case 'ArrowLeft':
          if(fileIndex >= scroller.itemsPerPage) fileIndex -= scroller.itemsPerPage;
          else fileIndex = 0;
          selectFileByIndex();
          break;
        case 'ArrowRight':
          if(fileIndex + scroller.itemsPerPage < items.length) fileIndex += scroller.itemsPerPage;
          else fileIndex = items.length - 1;
          selectFileByIndex();
          break;
        case 'ArrowUp': //scroll up
          fileIndex--;
          if(fileIndex < 0) fileIndex = items.length - 1;
          selectFileByIndex();
          break;
        case 'ArrowDown': //scroll down
          fileIndex++;
          if(fileIndex > items.length - 1) fileIndex = 0;
          selectFileByIndex();
          break;
        case 'SoftLeft': // reload
          break;
        case 'SoftRight': //go back
          activityHandler.postError('No file selected');
          break;
        case 'Enter': //pick the file
          var currentFile = items[fileIndex];
          if(currentFile) {
            activityHandler.postResult({ file: items[fileIndex] });
            localStorage.setItem('lastROM', items[fileIndex].name);
            localStorage.setItem('roms', JSON.stringify(items));
          } else activityHandler.postError('No file selected');
          break;
      }
    });
  },
  false
);

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
        this.scrollBy(offset);
      }
    }
  });

  return this;
}
