const isNode = typeof window === 'undefined';
const fs = isNode ? require('fs') : null;
const ipc = isNode ? null : require('electron').ipcRenderer;

var settings = {
  filePath: isNode ? null : window.globalArgs['user-data-path'] + (process.platform === 'win32' ? '\\' : '/') + 'settings.json',
  list: {},
  onChangeCallbacks: [],
  runChangeCallbacks (key) {
    settings.onChangeCallbacks.forEach(function (listener) {
      if (!key || !listener.key || listener.key === key) {
        if (listener.key) {
          listener.cb(settings.list[listener.key])
        } else {
          listener.cb(key)
        }
      }
    })
  },
  get: function (key) {
    return settings.list[key]
  },
  listen: function (key, cb) {
    if (key && cb) {
      cb(settings.get(key))
      settings.onChangeCallbacks.push({ key, cb })
    } else if (key) {
      // global listener
      settings.onChangeCallbacks.push({ cb: key })
    }
  },
  set: function (key, value) {
    settings.list[key] = value
    if (!isNode) {
      ipc.send('settingChanged', key, value)
    }
    settings.runChangeCallbacks(key)
  },
  initialize: function () {
    if (isNode) {
      // In Node.js environment, we might want to load settings differently
      // For now, we'll just initialize an empty list
      settings.list = {};
    } else {
      var fileData
      try {
        fileData = fs.readFileSync(settings.filePath, 'utf-8')
      } catch (e) {
        if (e.code !== 'ENOENT') {
          console.warn(e)
        }
      }
      if (fileData) {
        settings.list = JSON.parse(fileData)
      }

      settings.runChangeCallbacks()

      ipc.on('settingChanged', function (e, key, value) {
        settings.list[key] = value
        settings.runChangeCallbacks(key)
      })
    }
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = settings;
} else if (typeof window !== 'undefined') {
  window.settings = settings;
}

if (!isNode) {
  settings.initialize();
}