window.addEventListener('DOMContentLoaded',
  function () {
    var mainlist = document.getElementById('filepicker');
    var items = [],
      fileIndex = 0;
    var activityHandler = null;

    function refreshFileList() {
      mainlist.innerHTML = '';
      for(let i = 0, l = items.length; i < l; i++) {
        let item = document.createElement('div');
        item.innerHTML = items[i].name.replace(/.*\//g, '');
        item.classList.add('picker-file');
        mainlist.appendChild(item);
      }
      mainlist.children[0].classList.add('active');
    }

    function rescanFiles() {
      items = [];
      let fileTest = /\.gbc?$/;
      let sdcards = navigator.getDeviceStorages('sdcard'),
        storageAmount = sdcards.length;
      for(let i = 0; i < storageAmount; i++) {
        let fileCursor = sdcards[i].enumerate();
        fileCursor.onsuccess = function() {
          if(fileCursor.result.name !== null) {
            let file = fileCursor.result;
            if(fileTest.test(file.name.toLowerCase())) {
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
        rescanFiles();
      }
    });

    function selectFileByIndex() {
      [].forEach.call(mainlist.children, function(el) {
        el.classList.remove('active');
      });
      let activeElem = mainlist.children[fileIndex];
      activeElem.classList.add('active');
      if(activeElem.offsetTop > mainlist.offsetHeight) mainlist.scrollTop = activeElem.offsetTop;
      else mainlist.scrollTop = 0;
    }

    window.addEventListener('keydown', function(e) {
      switch (e.key) {
        case 'ArrowUp': //scroll up
        case 'ArrowLeft':
          fileIndex--;
          if(fileIndex < 0) fileIndex = items.length - 1;
          selectFileByIndex();
          break;
        case 'ArrowDown': //scroll down
        case 'ArrowRight':
          fileIndex++;
          if(fileIndex > items.length - 1) fileIndex = 0;
          selectFileByIndex();
          break;
        case 'SoftRight': //go back
          activityHandler.postError('No file selected');
          break;
        case 'Enter': //pick the file
          var currentFile = items[fileIndex];
          if(currentFile) activityHandler.postResult({ file: items[fileIndex] });
          else activityHandler.postError('No file selected');
          break;
      }
    });
  },
  false
);
