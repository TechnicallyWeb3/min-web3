const isNode = typeof window === 'undefined';
let settings;

if (isNode) {
  const path = require('path');
  const settingsPath = path.join(__dirname, '..', 'util', 'settings', 'settings.js');
  settings = require(settingsPath);
} else {
  settings = window.settings;
}

const isElectron = typeof process !== 'undefined' && process.versions && process.versions.electron;

var currentSearchEngine = {
  name: '',
  searchURL: '%s'
}

var defaultSearchEngine = 'DuckDuckGo'

var searchEngines = {
  DuckDuckGo: {
    name: 'DuckDuckGo',
    searchURL: 'https://duckduckgo.com/?q=%s&t=min',
    suggestionsURL: 'https://ac.duckduckgo.com/ac/?q=%s&type=list&t=min',
    queryParam: 'q'
  },
  Google: {
    name: 'Google',
    searchURL: 'https://www.google.com/search?q=%s',
    queryParam: 'q'
  },
  Bing: {
    name: 'Bing',
    searchURL: 'https://www.bing.com/search?q=%s',
    suggestionsURL: 'https://www.bing.com/osjson.aspx?query=%s',
    queryParam: 'q'
  },
  Yahoo: {
    name: 'Yahoo',
    searchURL: 'https://search.yahoo.com/yhs/search?p=%s',
    suggestionsURL: 'https://search.yahoo.com/sugg/os?command=%s&output=fxjson',
    queryParam: 'p'
  },
  Baidu: {
    name: 'Baidu',
    searchURL: 'https://www.baidu.com/s?wd=%s',
    suggestionsURL: 'https://www.baidu.com/su?wd=%s&action=opensearch',
    queryParam: 'wd'
  },
  StartPage: {
    name: 'StartPage',
    searchURL: 'https://www.startpage.com/do/search?q=%s',
    suggestionsURL: 'https://www.startpage.com/cgi-bin/csuggest?query=%s&format=json',
    queryParam: 'q'
  },
  Ecosia: {
    name: 'Ecosia',
    searchURL: 'https://www.ecosia.org/search?q=%s',
    suggestionsURL: 'https://ac.ecosia.org/autocomplete?q=%s&type=list',
    queryParam: 'q'
  },
  Qwant: {
    name: 'Qwant',
    searchURL: 'https://www.qwant.com/?q=%s',
    suggestionsURL: 'https://api.qwant.com/api/suggest/?q=%s&client=opensearch',
    queryParam: 'q'
  },
  Wikipedia: {
    name: 'Wikipedia',
    searchURL: 'https://wikipedia.org/w/index.php?search=%s',
    suggestionsURL: 'https://wikipedia.org/w/api.php?action=opensearch&search=%s',
    queryParam: 'search'
  },
  Yandex: {
    name: 'Yandex',
    searchURL: 'https://yandex.com/search/?text=%s',
    suggestionsURL: 'https://suggest.yandex.com/suggest-ff.cgi?part=%s',
    queryParam: 'text'
  },
  none: {
    name: 'none',
    searchURL: 'http://%s'
  }
}

for (const e in searchEngines) {
  try {
    searchEngines[e].urlObj = new URL(searchEngines[e].searchURL)
  } catch (e) {}
}

if (!isElectron) {
  settings.listen('searchEngine', function (value) {
    if (value && value.name) {
      currentSearchEngine = searchEngines[value.name] || searchEngines[defaultSearchEngine]
    } else if (value && value.url) {
      var searchDomain
      try {
        searchDomain = new URL(value.url).hostname.replace('www.', '')
      } catch (e) {}
      currentSearchEngine = {
        name: searchDomain || 'custom',
        searchURL: value.url,
        custom: true
      }
    } else {
      currentSearchEngine = searchEngines[defaultSearchEngine]
    }
  })
}

var searchEngine = {
  getCurrent: function () {
    return currentSearchEngine
  },
  getSearch: function (url) {
    var urlObj
    try {
      urlObj = new URL(url)
    } catch (e) {
      return null
    }
    for (var e in searchEngines) {
      if (!searchEngines[e].urlObj) {
        continue
      }
      if (searchEngines[e].urlObj.hostname === urlObj.hostname && searchEngines[e].urlObj.pathname === urlObj.pathname) {
        if (urlObj.searchParams.get(searchEngines[e].queryParam)) {
          return {
            engine: searchEngines[e].name,
            search: urlObj.searchParams.get(searchEngines[e].queryParam)
          }
        }
      }
    }
    return null
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = searchEngine;
} else if (typeof window !== 'undefined') {
  window.searchEngine = searchEngine;
}