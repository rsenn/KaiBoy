(function() {

  var mapping = {
    'ArrowUp': 'up',
    'ArrowDown': 'down',
    'ArrowLeft': 'left',
    'ArrowRight': 'right',
    'SoftRight': 'start',
    'SoftLeft': 'select',
    '9': 'a',
    '8': 'b'
  }, mappingForQwerty = {
    'a': 'left',
    'd': 'right',
    's': 'down',
    'w': 'up',
    'Enter': 'start',
    'q': 'select',
    'l': 'a',
    'k': 'b'
  };
  var config = {}
  var parts = location.search.substr(1).split('&');
  for(var i = 0; i < parts.length; i++) {
    var value = decodeURIComponent(parts[i].split('=')[1]);
    if(!isNaN(parseInt(value))) {
      value = parseInt(value);
    }
    config[parts[i].split('=')[0]] = value;
  }
  var saveSlotPrefix = 'kaiboy-saves'
  
  function updateTitle(gameTitle) {
    document.getElementById('title').querySelector('h1').textContent = 'KaiBoy: ' + gameTitle
  }
  
  function reportStorageError(e) {
    window.alert('Storage error: ' + e.name)
    run()
  }
  
  function saveToSlot(slotNum) {
    if(GameBoyEmulatorInitialized()) {
     pause()
     if(window.confirm('Save to slot '+slotNum+'?')) {
       let gameName = gameboy.name
       let slotName = 'KaiBoySaveSlot' + slotNum + '_' + gameName
       let slotObject = gameboy.saveState()
       let sdcard = navigator.getDeviceStorage('sdcard')
       let slotPath = saveSlotPrefix + '/' + slotName
       let slotBlob = new Blob([JSON.stringify(slotObject)], {type: 'application/json'})
       let fetchRequest = sdcard.get(slotPath)
       fetchRequest.onsuccess = function() {
         let deleteRequest = sdcard.delete(this.result.name)
         deleteRequest.onsuccess = function() {
           let addRequest = sdcard.addNamed(slotBlob, slotPath)
           addRequest.onsuccess = function() {
             run()
           }
         addRequest.onerror = reportStorageError
         }
         deleteRequest.onerror = reportStorageError
       }
       fetchRequest.onerror = function() {
         let addRequest = sdcard.addNamed(slotBlob, slotPath)
         addRequest.onsuccess = function() {
           run()
         }
         addRequest.onerror = reportStorageError
       }
     }
     else run()
    }
  }
  
  function loadFromSlot(slotNum, canvas) {
    if(GameBoyEmulatorInitialized()) {
     pause()
     if(window.confirm('Load from slot '+slotNum+'?')) {
       let gameName = gameboy.name
       let slotName = 'KaiBoySaveSlot' + slotNum + '_' + gameName
       let sdcard = navigator.getDeviceStorage('sdcard')
       let slotPath = saveSlotPrefix + '/' + slotName
       let readRequest = sdcard.get(slotPath)
       readRequest.onsuccess = function() {
         let reader = new FileReader()
         reader.onload = function(e) {
            let slotObject = null
            try {
              slotObject = JSON.parse(reader.result)
            } catch(e) {
              window.alert('Corrupt save data!')
            }
           if(slotObject) {
             gameboy = new GameBoyCore(canvas, "")
             gameboy.savedStateFileName = slotName
             gameboy.returnFromState(slotObject)
             run()
           }
           else run()
         }
         reader.readAsBinaryString(this.result)
       }
       readRequest.onerror = function() {
         window.alert('Empty slot or storage error')
         run()
       }
     }
     else run()
    }
  }

  function runGB(romBuffer) {
    var mainCanvas = document.getElementById('mainCanvas'),
        KaiBoyMachinePaused = true

    document.body.classList.add('ingame')
    
    document.getElementById('choice').innerHTML = 'Select'
    document.getElementById('back').innerHTML = 'Start'
    document.getElementById('ok').innerHTML = '&nbsp;'
    
    function inGameMode(remapUp) {
      window.onkeydown = function(e) {
        if(e.key in mapping) {
          GameBoyKeyDown(mapping[e.key])
        }
        else if(remapUp && e.key === 'Enter') {
          GameBoyKeyDown(mapping['ArrowUp'])
        }
        else if(e.key === 'Call') {
          if(!KaiBoyMachinePaused) {
           KaiBoyMachinePaused = true
           pause()
          }
          else {
            KaiBoyMachinePaused = false
            run()
          }
        }
        else if(e.key === '1') saveToSlot(1)
        else if(e.key === '4') loadFromSlot(1, mainCanvas)
        else if(e.key === '2') saveToSlot(2)
        else if(e.key === '5') loadFromSlot(2, mainCanvas)
        else if(e.key === '3') saveToSlot(3)
        else if(e.key === '6') loadFromSlot(3, mainCanvas)
        else if(e.key === 'Backspace') {
          e.preventDefault()
          KaiBoyMachinePaused = true
          pause()
          if(window.confirm('Exit KaiBoy?'))
            window.close()
          else {
            KaiBoyMachinePaused = false
            run()
          }
        }
      }
      window.onkeyup = function(e) {
        if(e.key in mapping) {
          GameBoyKeyUp(mapping[e.key])
        }
        else if(remapUp && e.key === 'Enter') {
          GameBoyKeyUp(mapping['ArrowUp'])
        }
      }
      let soundOn = window.confirm('Run with sound?')
      start(mainCanvas, romBuffer, soundOn)
      KaiBoyMachinePaused = false
      console.log('ROM loaded:', gameboy.name)
      updateTitle(gameboy.name)
    }
    if(window.screen.orientation.type !== 'landscape-primary') {
      inGameMode(true)
    } else { //running on a QWERTY phone
      mapping = mappingForQwerty
      inGameMode()
    }
  }

  var screenElement = document.getElementById('screen')
  window.addEventListener('DOMContentLoaded', function() {
    if(config.src) {
      screenElement.innerHTML = 'Loading&hellip;'
      var request = new XMLHttpRequest;
      request.onload = function() {
        let responseView = new Uint8ClampedArray(request.response), l = responseView.length, s = '';
        for(let i=0;i<l;i++)
          s += String.fromCharCode(responseView[i])
        runGB(s);
      };
      request.open('GET', config.src);
      request.responseType = 'arraybuffer'
      request.send();
    } else {
      var pickKeyHandler = function(e) {
        if(e.key === 'Enter' || e.key === 'Call') {
          console.log('Calling picker')
          var picker = new MozActivity({
            name: "xyz.831337.kaiboy.pickFile",
            data: {}
          })
          picker.onsuccess = function(arg) {
            if(typeof arg == 'object' && arg !== null && arg instanceof ArrayBuffer) {
              startROM(arg);
              return;
            }
            screenElement.innerHTML = 'Loading&hellip;'
            let reader = new FileReader()

            reader.onload = function(e) {
              window.removeEventListener('keydown', pickKeyHandler)
              startROM(reader.result);
            }
            function startROM(rom) {
              let responseView = new Uint8ClampedArray(rom), l = responseView.length, s = '';
              for(let i=0;i<l;i++)
                s += String.fromCharCode(responseView[i])
              runGB(s);
            }
            reader.readAsArrayBuffer(picker.result.file)
          }
        }
      }
      window.addEventListener('keydown', pickKeyHandler)
      setTimeout(() => pickKeyHandler({key: 'Enter' }), 1000);
    }
  })
})()
