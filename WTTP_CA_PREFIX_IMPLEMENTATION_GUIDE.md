# WTTP Protocol `ca/` Prefix Implementation Guide

## Complete Code Implementation for Another Branch

This guide provides all the necessary code to implement the `ca/` prefix handling for the `wttp` protocol in another branch.

## Files to Create/Modify

### 1. URL Parser Utilities (`js/util/urlParser.js`)

Add these functions to your URL parser utility:

```javascript
// Add these functions to your existing urlParser.js file

function toInternalWttpUrl(url) {
  if (url.startsWith('wttp://')) {
    console.log('[DEBUG][toInternalWttpUrl] Input:', url);
  }
  // If url is just an ETH address, make it a full WTTP URL
  if (/^0x[a-fA-F0-9]{40}(:[a-zA-Z0-9_-]+)?$/.test(url)) {
    url = `wttp://${url}/`;
  }
  const match = url.match(/^wttp:\/\/([0-9a-zA-Z.:_-]+)(\/.*)?$/);
  if (match) {
    const host = match[1];
    const path = match[2] || '/';
    if (/^0x[a-fA-F0-9]{40}(:[a-zA-Z0-9_-]+)?$/.test(host) || /^.+\.eth(:[a-zA-Z0-9_-]+)?$/.test(host)) {
      return `wttp://ca/${host}${path}`;
    }
  }
  return url;
}

function toPrettyWttpUrl(url) {
  const match = url.match(/^wttp:\/\/ca\/([0-9a-zA-Z.:_-]+)(\/.*)?$/);
  if (match) {
    const address = match[1];
    const path = match[2] || '/';
    return `wttp://${address}${path}`;
  }
  return url;
}

function toWttpUrl(input) {
  // If input starts with wttp://, use as-is
  if (input.startsWith('wttp://')) return input;
  // If input matches ETH or ENS (with optional :chain), convert to wttp://<input>/
  if (/^0x[a-fA-F0-9]{40}(:[a-zA-Z0-9_-]+)?$/.test(input) || /^.+\.eth(:[a-zA-Z0-9_-]+)?$/.test(input)) {
    return `wttp://${input}/`;
  }
  // Otherwise, return as-is
  return input;
}

// Export the functions
module.exports.toInternalWttpUrl = toInternalWttpUrl;
module.exports.toPrettyWttpUrl = toPrettyWttpUrl;
module.exports.toWttpUrl = toWttpUrl;
```

### 2. Browser UI Address Bar Handling (`js/browserUI.js`)

Add this code to handle address bar input and URL display:

```javascript
// Add these imports at the top of your browserUI.js file
const { toInternalWttpUrl, toPrettyWttpUrl } = require('util/urlParser.js');

// Add this event listener for address bar handling
document.addEventListener('DOMContentLoaded', function () {
  const addressBar = document.getElementById('address-bar');
  const navBack = document.getElementById('nav-back');
  const navForward = document.getElementById('nav-forward');
  const navReload = document.getElementById('nav-reload');
  const navHome = document.getElementById('nav-home');
  const bookmarkBtn = document.getElementById('bookmark-btn');
  const securityIcon = document.getElementById('security-icon');

  // Helper to update address bar with current tab's URL
  function updateAddressBar() {
    const tab = tabs.get(tabs.getSelected());
    if (!tab) return;
    // Prefer prettyUrl if available - this hides the ca/ prefix
    addressBar.value = tab.prettyUrl || tab.url || '';
    // Optionally update security icon (locked/unlocked)
    if (tab.secure === false) {
      securityIcon.className = 'i carbon:unlocked';
      securityIcon.title = 'Not Secure';
    } else {
      securityIcon.className = 'i carbon:locked';
      securityIcon.title = 'Secure';
    }
  }

  // Update address bar on tab switch and tab update
  tabBar.events.on('tab-selected', updateAddressBar);
  tasks.on('tab-updated', function (id, key) {
    if (id === tabs.getSelected() && (key === 'url' || key === 'secure')) {
      updateAddressBar();
    }
  });

  // On Enter in address bar, navigate current tab
  addressBar.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') {
      let prettyUrl = addressBar.value.trim();

      // If user entered just an ETH address or ENS name, rewrite to wttp://<address>/
      if (/^0x[a-fA-F0-9]{40}$/.test(prettyUrl) || /\.eth$/.test(prettyUrl)) {
        prettyUrl = `wttp://${prettyUrl}/`;
      }

      let internalUrl = toInternalWttpUrl(prettyUrl);
      webviews.update(tabs.getSelected(), internalUrl);
      // Store the pretty URL for this tab
      tabs.update(tabs.getSelected(), { prettyUrl: prettyUrl });
    }
  });

  // Navigation buttons
  navBack.addEventListener('click', function () {
    webviews.goBack(tabs.getSelected());
  });

  navForward.addEventListener('click', function () {
    webviews.goForward(tabs.getSelected());
  });

  navReload.addEventListener('click', function () {
    webviews.reload(tabs.getSelected());
  });

  navHome.addEventListener('click', function () {
    webviews.update(tabs.getSelected(), 'min://app/newtab/');
  });
});
```

### 3. Webview Navigation Handling (`js/webviews.js`)

Add this code to handle navigation events and URL conversion:

```javascript
// Add this import at the top of your webviews.js file
const { toInternalWttpUrl, toPrettyWttpUrl } = require('util/urlParser.js');

// Add this navigation event handler
webviews.bindEvent('did-navigate', function (tabId, url, httpResponseCode, httpStatusText) {
  // If this is an internal WTTP URL, rewrite to pretty for display
  let prettyUrl = typeof toPrettyWttpUrl === 'function' ? toPrettyWttpUrl(url) : url;
  tabs.update(tabId, { url: prettyUrl });
  onPageURLChange(tabId, prettyUrl);
});

// Modify your webview update function to use internal URLs
webviews.update = function (tabId, url) {
  let internalUrl = toInternalWttpUrl(url);
  console.log('[DEBUG] About to load URL in view (update):', internalUrl);
  ipc.send('loadURLInView', { id: tabId, url: urlParser.parse(internalUrl) });
};

// Modify your webview add function to use internal URLs
webviews.add = function (tabId, tabData) {
  // ... existing code ...
  
  if (!existingViewId) {
    if (tabData.url) {
      let url = toInternalWttpUrl(tabData.url);
      console.log('[DEBUG] About to load URL in view (add):', url);
      ipc.send('loadURLInView', { id: tabData.id, url: urlParser.parse(url) });
    } else if (tabData.private) {
      // ... existing private tab code ...
    }
  }
  
  // ... rest of existing code ...
};
```

### 4. Protocol Registration (`main/minInternalProtocol.js`)

Add this protocol registration code:

```javascript
// Add this protocol registration at the top of your main process file
protocol.registerSchemesAsPrivileged([
  {
    scheme: 'wttp',
    privileges: {
      standard: true,
      secure: true,
      supportFetchAPI: true,
      corsEnabled: true,
      stream: true
    }
  }
]);

// Add these helper functions
function isValidEthAddress(addr) {
  return /^0x[a-fA-F0-9]{40}(:[a-zA-Z0-9_-]+)?$/.test(addr);
}

function isValidEnsName(addr) {
  return /^.+\.eth(:[a-zA-Z0-9_-]+)?$/.test(addr);
}

function getSessionId(ses) {
  return ses && ses.id ? ses.id : 'default';
}

function getSiteAddressFromUrl(urlObj) {
  return urlObj.hostname;
}

function getFilePathFromUrl(urlObj) {
  let filePath = urlObj.pathname || '';
  if (filePath.startsWith('/')) filePath = filePath.slice(1);
  return filePath;
}

function getErrorPage(siteAddress) {
  return `<html><body><h1>404 Not Found</h1><p>Site: ${siteAddress}</p></body></html>`;
}

// Add this WTTP protocol handler
function registerBundleProtocol(ses) {
  ses.protocol.handle('wttp', async (req) => {
    try {
      const urlObj = new URL(req.url);
      const sessionId = getSessionId(ses);

      let siteAddress;
      let filePath = getFilePathFromUrl(urlObj);

      // KEY: Handle ca/ prefix extraction
      if (urlObj.hostname === 'ca') {
        // Extract address from the first segment of the path
        const pathParts = (urlObj.pathname || '').split('/').filter(Boolean);
        siteAddress = pathParts[0];
        // Remove the address from the filePath
        filePath = pathParts.slice(1).join('/') || '';
      } else {
        siteAddress = getSiteAddressFromUrl(urlObj);
      }

      // REDIRECT: If root directory request without trailing slash, redirect to slash version
      if (
        (isValidEthAddress(siteAddress) || isValidEnsName(siteAddress)) &&
        (!filePath || filePath === '' || filePath === 'index.html') &&
        !req.url.endsWith('/')
      ) {
        let redirectUrl = req.url + '/';
        redirectUrl = redirectUrl.replace(/([^:])\/\//g, '$1/');
        return new Response('', {
          status: 301,
          headers: { 'Location': redirectUrl }
        });
      }

      // If the hostname is a valid ETH/ENS, treat as root or file request
      if (isValidEthAddress(siteAddress) || isValidEnsName(siteAddress)) {
        // If no file path, default to index.html
        if (!filePath || filePath === '') filePath = 'index.html';

        const wttpUrl = `wttp://${siteAddress}/${filePath}`;
        const wttpResult = await (new WTTPHandler()).fetch(wttpUrl);
        console.log('[DEBUG] WTTP fetch response:', wttpResult, 'Type:', typeof wttpResult);

        if (!wttpResult || typeof wttpResult !== 'object') {
          console.error('[WTTP PROTOCOL ERROR] Invalid response object from WTTPHandler');
          return new Response('Internal WTTP Protocol Error (invalid response)', {
            status: 500,
            headers: { 'content-type': 'text/plain' }
          });
        }

        const headers = new Headers(wttpResult.headers);
        const response = new Response(wttpResult.body, {
          status: wttpResult.status,
          headers
        });

        if (response.status !== 200) {
          // Show a custom error page for contract/internal errors
          let status = 404;
          let contentType = 'text/html';
          let errorHtml = getErrorPage(siteAddress);
          if (response.status >= 500) {
            status = 500;
            errorHtml = `<html><body><h1>WTTP Error</h1><pre>${response.statusText || 'Unknown error'}</pre></body></html>`;
          }
          return new Response(errorHtml, {
            status,
            headers: { 'content-type': contentType }
          });
        }

        // Return the response directly for successful fetches
        return response;
      }

      // If not a valid site address, treat as a relative path
      const originalSite = sessionCurrentSite.get(sessionId) || 'wordl3.eth';
      let fullPath = urlObj.pathname;
      if (fullPath.startsWith('/')) fullPath = fullPath.slice(1);
      const wttpUrl = `wttp://${originalSite}/${fullPath}`;
      const wttpResult = await (new WTTPHandler()).fetch(wttpUrl);
      console.log('[DEBUG] WTTP fetch response:', wttpResult, 'Type:', typeof wttpResult);

      if (!wttpResult || typeof wttpResult !== 'object') {
        console.error('[WTTP PROTOCOL ERROR] Invalid response object from WTTPHandler');
        return new Response('Internal WTTP Protocol Error (invalid response)', {
          status: 500,
          headers: { 'content-type': 'text/plain' }
        });
      }

      const headers = new Headers(wttpResult.headers);
      const response = new Response(wttpResult.body, {
        status: wttpResult.status,
        headers
      });

      if (response.status !== 200) {
        // Show a custom error page for contract/internal errors
        let status = 404;
        let contentType = 'text/html';
        let errorHtml = getErrorPage(originalSite);
        if (response.status >= 500) {
          status = 500;
          errorHtml = `<html><body><h1>WTTP Error</h1><pre>${response.statusText || 'Unknown error'}</pre></body></html>`;
        }
        return new Response(errorHtml, {
          status,
          headers: { 'content-type': contentType }
        });
      }

      // Return the response directly for successful fetches
      return response;
    } catch (err) {
      console.error('[WTTP PROTOCOL ERROR]', err);
      return new Response('Internal WTTP Protocol Error', {
        status: 500,
        headers: { 'content-type': 'text/plain' }
      });
    }
  });
}

// Register the protocol handler
app.on('session-created', (ses) => {
  if (ses !== session.defaultSession) {
    registerBundleProtocol(ses);
  }
});
```

### 5. WTTP Handler (`main/wttpHandler.js`)

Create this file for handling WTTP requests:

```javascript
const { WTTPHandler } = require('@wttp/handler');
const mime = require('mime-types');

// Helper: Return a simple HTML error page
function getErrorPage(siteAddress) {
    return `<html><body><h1>404 Not Found</h1><p>Site: ${siteAddress}</p></body></html>`;
}

// Helper: Validate Ethereum address
function isValidEthAddress(addr) {
    return /^0x[a-fA-F0-9]{40}$/.test(addr);
}

// Helper: Validate ENS name
function isValidEnsName(addr) {
    return /\.eth$/.test(addr);
}

// Helper: Get session ID
function getSessionId(ses) {
    return ses && ses.id ? ses.id : 'default';
}

// Helper: Get site address from URL object
function getSiteAddressFromUrl(urlObj) {
    return urlObj.hostname;
}

// Helper: Get file path from URL object
function getFilePathFromUrl(urlObj) {
    let filePath = urlObj.pathname || '';
    if (filePath.startsWith('/')) filePath = filePath.slice(1);
    return filePath;
}

// Main WTTP request handler
async function handleWttpRequest(req, ses) {
    try {
        const urlObj = new URL(req.url);
        const sessionId = getSessionId(ses);

        // Extract contract address and file path correctly for internal WTTP URLs
        let siteAddress;
        let filePath = getFilePathFromUrl(urlObj);

        if (urlObj.hostname === 'ca') {
            // Extract address from the first segment of the path
            const pathParts = (urlObj.pathname || '').split('/').filter(Boolean);
            siteAddress = pathParts[0];
            // Remove the address from the filePath
            filePath = pathParts.slice(1).join('/') || '';
        } else {
            siteAddress = getSiteAddressFromUrl(urlObj);
        }

        // REDIRECT: If root directory request without trailing slash, redirect to slash version
        if (
            (isValidEthAddress(siteAddress) || isValidEnsName(siteAddress)) &&
            (!filePath || filePath === '' || filePath === 'index.html') &&
            !req.url.endsWith('/')
        ) {
            let redirectUrl = req.url + '/';
            redirectUrl = redirectUrl.replace(/([^:])\/\//g, '$1/');
            return new Response('', {
                status: 301,
                headers: { 'Location': redirectUrl }
            });
        }

        // If the hostname is a valid ETH/ENS, treat as root or file request
        if (isValidEthAddress(siteAddress) || isValidEnsName(siteAddress)) {
            // If no file path, default to index.html
            if (!filePath || filePath === '') filePath = 'index.html';

            const wttpUrl = `wttp://${siteAddress}/${filePath}`;
            const result = await handleWttpFetch(wttpUrl, filePath);

            if (result.status !== 200) {
                // Show a custom error page for contract/internal errors
                let status = 404;
                let contentType = 'text/html';
                let errorHtml = getErrorPage(siteAddress);
                if (result.errorType === 'revert' || result.errorType === 'internal') {
                    status = 500;
                    errorHtml = `<html><body><h1>WTTP Error</h1><pre>${result.errorMessage || 'Unknown error'}</pre></body></html>`;
                }
                return new Response(errorHtml, {
                    status,
                    headers: { 'content-type': contentType }
                });
            }

            let responseBody = result.buffer;
            if (result.contentType && result.contentType.startsWith('text/') && Buffer.isBuffer(responseBody)) {
                responseBody = responseBody.toString('utf8');
            }
            return new Response(responseBody, {
                status: 200,
                headers: {
                    'content-type': result.contentType,
                    'Cache-Control': 'no-cache, no-store, must-revalidate',
                    'Pragma': 'no-cache',
                    'Expires': '0'
                }
            });
        }

        // If not a valid site address, treat as a relative path
        return new Response(getErrorPage(siteAddress), {
            status: 404,
            headers: { 'content-type': 'text/html' }
        });
    } catch (err) {
        console.error('[WTTP PROTOCOL ERROR]', err);
        return new Response('Internal WTTP Protocol Error', {
            status: 500,
            headers: { 'content-type': 'text/plain' }
        });
    }
}

// Helper: Fetch WTTP content
async function handleWttpFetch(wttpUrl, filePath) {
    const wttp = new WTTPHandler();
    try {
        const response = await wttp.fetch(wttpUrl);

        if (response.status !== 200) {
            // Try to distinguish not found vs. other errors
            let errorType = 'notfound';
            let errorMessage = response.statusText || 'Not found';
            if (response.status >= 500) {
                errorType = 'internal';
                errorMessage = response.statusText || 'Internal error';
            }
            return {
                status: response.status,
                errorType,
                errorMessage,
                contentType: 'text/plain',
                buffer: Buffer.from(`WTTP Error: ${errorMessage}`)
            };
        }

        // Robust Content-Type detection
        let contentType = null;
        if (response.headers && response.headers.get) {
            contentType = response.headers.get('content-type') || response.headers.get('Content-Type');
        } else if (response.headers && response.headers['content-type']) {
            contentType = response.headers['content-type'] || response.headers['Content-Type'];
        }
        if (!contentType && response.headers && response.headers[Symbol.for('headers map')]) {
            const headersMap = response.headers[Symbol.for('headers map')];
            const contentTypeHeader = headersMap.get('content-type');
            if (contentTypeHeader && contentTypeHeader.value) {
                contentType = contentTypeHeader.value;
            }
        }
        if (!contentType) {
            const extension = filePath ? filePath.split('.').pop()?.toLowerCase() : '';
            contentType = mime.lookup(extension) || 'application/octet-stream';
        }
        if (contentType && contentType.includes('charset=')) {
            const parts = contentType.split(';');
            const mainType = parts[0].trim();
            const charsetPart = parts.find(part => part.trim().startsWith('charset='));
            const charsetValue = charsetPart ? charsetPart.split('=')[1]?.trim() : '';
            if (charsetValue) {
                contentType = `${mainType}; charset=${charsetValue}`;
            } else {
                contentType = mainType.startsWith('text/') ? `${mainType}; charset=utf-8` : mainType;
            }
        } else if (contentType && contentType.startsWith('text/') && !contentType.includes('charset=')) {
            contentType = `${contentType}; charset=utf-8`;
        }
        if (!contentType) {
            contentType = 'text/html; charset=utf-8';
        }
        let buffer;
        if (response.body && typeof response.body[Symbol.asyncIterator] === 'function') {
            const chunks = [];
            for await (const chunk of response.body) {
                chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
            }
            buffer = Buffer.concat(chunks);
            if (contentType && contentType.startsWith('text/')) {
                const text = buffer.toString('utf8');
                buffer = text;
            }
        } else {
            if (contentType && contentType.startsWith('text/')) {
                if (typeof response.body === 'string') {
                    buffer = response.body;
                } else if (Buffer.isBuffer(response.body)) {
                    buffer = response.body.toString('utf8');
                } else if (Array.isArray(response.body)) {
                    buffer = Buffer.from(response.body).toString('utf8');
                } else if (response.body instanceof Uint8Array) {
                    buffer = Buffer.from(response.body).toString('utf8');
                } else {
                    buffer = '';
                }
            } else {
                if (Buffer.isBuffer(response.body)) {
                    buffer = response.body;
                } else if (Array.isArray(response.body)) {
                    buffer = Buffer.from(response.body);
                } else if (typeof response.body === 'string') {
                    buffer = Buffer.from(response.body, 'utf8');
                } else if (response.body instanceof Uint8Array) {
                    buffer = Buffer.from(response.body);
                } else {
                    buffer = Buffer.from([]);
                }
            }
        }
        return {
            status: response.status,
            contentType,
            buffer: buffer
        };
    } catch (err) {
        // Classify error
        let errorType = 'internal';
        let errorMessage = err.shortMessage || err.message || String(err);
        if (err.code === 'CALL_EXCEPTION' || errorMessage.includes('execution reverted')) {
            errorType = 'revert';
        }
        console.error('[WTTP FETCH ERROR]', err);
        return {
            status: 500,
            errorType,
            errorMessage,
            contentType: 'text/html',
            buffer: Buffer.from(`<html><body><h1>WTTP Error</h1><pre>${errorMessage}</pre></body></html>`, 'utf8')
        };
    }
}

module.exports = {
    handleWttpRequest
};
```

### 6. URL Parser Integration (`js/util/urlParser.js`)

Add this to your existing URL parser:

```javascript
// Add this to your existing urlParser.parse function
parse: function (url) {
  console.log('[DEBUG][urlParser] Received URL for parsing:', url);
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
    return `wttp://${contractAddress}`;
  }

  // Check for ENS domains
  if (urlParser.validENSRegex.test(url)) {
    console.log('ENS domain detected', url);
    return `wttp://${url}`;
  }

  if(urlParser.validUnstoppableRegex.test(url)){
    console.log('Unstoppable domain detected', url);
    return `wttp://${url}`;
  }

  if (url.startsWith('wttp://')) {
    console.log('[DEBUG][urlParser] Detected wttp URL:', url);
    return 'wttp://' + url.slice(7)
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
}
```

## Dependencies Required

Make sure you have these dependencies in your `package.json`:

```json
{
  "dependencies": {
    "@wttp/handler": "^1.0.0",
    "mime-types": "^2.1.35"
  }
}
```

## Implementation Steps

1. **Create/Modify Files**: Add the code above to the respective files
2. **Install Dependencies**: Run `npm install @wttp/handler mime-types`
3. **Test the Implementation**: 
   - Try entering an Ethereum address in the address bar
   - Try entering an ENS name
   - Verify that `ca/` prefix is hidden from UI
   - Check browser console for debug logs

## Testing Examples

- **Input**: `0x1234567890abcdef1234567890abcdef12345678`
- **Expected Internal**: `wttp://ca/0x1234567890abcdef1234567890abcdef12345678/`
- **Expected Display**: `wttp://0x1234567890abcdef1234567890abcdef12345678/`

- **Input**: `example.eth`
- **Expected Internal**: `wttp://ca/example.eth/`
- **Expected Display**: `wttp://example.eth/`

This implementation provides complete `ca/` prefix handling while maintaining a clean user interface.
