const punycode = require('punycode');
const path = require('path');
const searchEngine = require('util/searchEngine.js');
const hosts = require('./hosts.js');
const httpsTopSites = require('../../ext/httpsUpgrade/httpsTopSites.json');
const publicSuffixes = require('../../ext/publicSuffixes/public_suffix_list.json');
// const { fetchContractHTML } = require('./web3Helpers.js');
const { ipcRenderer } = require('electron');
const { getENSOwner } = require('./ensHelper.js');

const chain = {
  chainName: 'Polygon',
  chainSymbol: 'MATIC',
  chainId: 137,
  rpc: 'https://polygon-bor-rpc.publicnode.com',
  explorerPrefix: 'https://polygonscan.com/address/'
};

const showExplorer = false;

function removeWWW(domain) {
  return (domain.startsWith('www.') ? domain.slice(4) : domain);
}

function removeTrailingSlash(url) {
  return (url.endsWith('/') ? url.slice(0, -1) : url);
}

function renderHTML(ca, htmlData) {
  try {
    console.log('Data to be sent:', ca, htmlData); // Convert to string if necessary
    ipcRenderer.send('loadHTMLInView', {ca,htmlData});
  } catch (error) {
    console.error('Error sending data to IPC:', error);
  }
}


var urlParser = {
  validIP4Regex: /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/i,
  validDomainRegex: /^(?!-)(?:.*@)*?([a-z0-9-._]+[a-z0-9]|\[[:a-f0-9]+\])/i,
  validWeb3Regex: /^0x[a-fA-F0-9]{40}$/,
  validENSRegex: /^([a-z0-9-]+\.)*[a-z0-9-]+\.eth$/i,
  unicodeRegex: /[^\u0000-\u00ff]/,
  removeProtocolRegex: /^(https?|file|web3):\/\//i,
  protocolRegex: /^[a-z0-9]+:\/\//,
  isURL: function (url) {
    return urlParser.protocolRegex.test(url) || url.indexOf('about:') === 0 || url.indexOf('chrome:') === 0 || url.indexOf('data:') === 0;
  },
  isPossibleURL: function (url) {
    if (urlParser.isURL(url)) {
      return true;
    } else {
      if (url.indexOf(' ') >= 0) {
        return false;
      }
    }

    const domain = urlParser.getDomain(url);
    return hosts.includes(domain);
  },
  removeProtocol: function (url) {
    if (!urlParser.isURL(url)) {
      return url;
    }

    return url.replace(urlParser.removeProtocolRegex, '');
  },
  isURLMissingProtocol: function (url) {
    return !urlParser.protocolRegex.test(url);
  },
  parse:  function (url) {
    url = url.trim(); // remove whitespace common on copy-pasted url's

    if (!url) {
      return 'about:blank';
    }

    if (url.indexOf('view-source:') === 0) {
      var realURL = url.replace('view-source:', '');
      return 'view-source:' + urlParser.parse(realURL);
    }

    if (url.startsWith('min:') && !url.startsWith('min://app/')) {
      // convert shortened min:// urls to full ones
      const urlChunks = url.split('?')[0].replace(/min:(\/\/)?/g, '').split('/');
      const query = url.split('?')[1];
      return 'min://app/pages/' + urlChunks[0] + (urlChunks[1] ? urlChunks.slice(1).join('/') : '/index.html') + (query ? '?' + query : '');
    }

    const contractAddress = urlParser.removeProtocol(url);
    if (urlParser.validWeb3Regex.test(contractAddress)) {
      return `web://${contractAddress}`;
    }

    // Check for ENS domains
    if (urlParser.validENSRegex.test(url)) {
      console.log('ENS domain detected', url);
      getENSOwner(url).then((owner) => {
        console.log(owner);
        return `https://google.com`;
      });
      
    }

    if (url.startsWith('web3://')) {
      return 'web://' + url.slice(7)
    }

    if (urlParser.isURL(url)) {
      if (!urlParser.isInternalURL(url) && url.startsWith('http://')) {
        // prefer HTTPS over HTTP
        const noProtoURL = urlParser.removeProtocol(url);

        if (urlParser.isHTTPSUpgreadable(noProtoURL)) {
          return 'https://' + noProtoURL;
        }
      }
      return url;
    }

    if (urlParser.isURLMissingProtocol(url) && urlParser.validateDomain(urlParser.getDomain(url))) {
      if (urlParser.isHTTPSUpgreadable(url)) {
        return 'https://' + url;
      }
      return 'http://' + url;
    }

    return searchEngine.getCurrent().searchURL.replace('%s', encodeURIComponent(url));
  },
  basicURL: function (url) {
    return removeWWW(urlParser.removeProtocol(removeTrailingSlash(url)));
  },
  prettyURL: function (url) {
    try {
      var urlOBJ = new URL(url);
      return removeWWW(removeTrailingSlash(urlOBJ.hostname + urlOBJ.pathname));
    } catch (e) { // URL constructor will throw an error on malformed URLs
      return url;
    }
  },
  isInternalURL: function (url) {
    return url.startsWith('min://');
  },
  getSourceURL: function (url) {
    if (urlParser.isInternalURL(url)) {
      var representedURL;
      try {
        representedURL = new URLSearchParams(new URL(url).search).get('url');
      } catch (e) {}
      if (representedURL) {
        return representedURL;
      } else {
        try {
          var pageName = url.match(/\/pages\/([a-zA-Z]+)\//);
          var urlObj = new URL(url);
          if (pageName) {
            return 'min://' + pageName[1] + urlObj.search;
          }
        } catch (e) {}
      }
    }
    return url;
  },
  getFileURL: function (path) {
    if (window.platformType === 'windows') {
      path = path.replace(/\\/g, '/');

      if (path.startsWith('//')) {
        return encodeURI('file:' + path);
      } else {
        return encodeURI('file:///' + path);
      }
    } else {
      return encodeURI('file://' + path);
    }
  },
  getDomain: function (url) {
    url = urlParser.removeProtocol(url);
    return url.split(/[/:]/)[0].toLowerCase();
  },
  validateDomain: function (domain) {
    domain = urlParser.unicodeRegex.test(domain)
      ? punycode.toASCII(domain)
      : domain;

    if (!urlParser.validDomainRegex.test(domain)) {
      return false;
    }
    const cleanDomain = RegExp.$1;
    if (cleanDomain.length > 255) {
      return false;
    }

    if ((urlParser.validIP4Regex.test(cleanDomain) || (cleanDomain.startsWith('[') && cleanDomain.endsWith(']'))) ||
        hosts.includes(cleanDomain)) {
      return true;
    }
    return publicSuffixes.find(s => cleanDomain.endsWith(s)) !== undefined;
  },
  isHTTPSUpgreadable: function (url) {
    const domain = removeWWW(urlParser.getDomain(url));
    return httpsTopSites.includes(domain);
  }
};

module.exports = urlParser;