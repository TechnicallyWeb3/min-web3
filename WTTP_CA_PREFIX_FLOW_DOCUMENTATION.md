# WTTP Protocol `ca/` Prefix Flow Documentation

## Overview

The `ca/` prefix in the `wttp` protocol is an internal mechanism used to handle Ethereum contract addresses and ENS names in a standardized way. This prefix is added internally but hidden from the user interface to provide a clean browsing experience.

## Complete Flow Architecture

### 1. URL Input Processing

When a user enters a URL in the address bar, the system processes it through several stages:

#### Input Examples:
- `0x1234...abcd` (Ethereum address)
- `example.eth` (ENS name)
- `wttp://0x1234...abcd/` (Direct WTTP URL)

#### Processing Location: `js/browserUI.js` (lines 314-329)

```javascript
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
```

### 2. URL Conversion Functions

#### A. Converting Pretty URLs to Internal Format

**Location**: `js/util/urlParser.js` (lines 226-243) and `js/browserUI.js` (lines 379-389)

```javascript
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
```

**Purpose**: Converts user-friendly URLs like `wttp://0x1234...abcd/` to internal format `wttp://ca/0x1234...abcd/`

#### B. Converting Internal URLs to Pretty Format

**Location**: `js/util/urlParser.js` (lines 245-253) and `js/browserUI.js` (lines 392-400)

```javascript
function toPrettyWttpUrl(url) {
  const match = url.match(/^wttp:\/\/ca\/([0-9a-zA-Z.:_-]+)(\/.*)?$/);
  if (match) {
    const address = match[1];
    const path = match[2] || '/';
    return `wttp://${address}${path}`;
  }
  return url;
}
```

**Purpose**: Converts internal URLs like `wttp://ca/0x1234...abcd/` back to user-friendly format `wttp://0x1234...abcd/`

### 3. Protocol Registration

**Location**: `main/minInternalProtocol.js` (lines 38-67)

```javascript
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
])
```

### 4. WTTP Protocol Handler

**Location**: `main/minInternalProtocol.js` (lines 104-224)

The main protocol handler processes `wttp://` URLs and specifically handles the `ca/` prefix:

```javascript
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

    // Process the request...
    if (isValidEthAddress(siteAddress) || isValidEnsName(siteAddress)) {
      if (!filePath || filePath === '') filePath = 'index.html';

      const wttpUrl = `wttp://${siteAddress}/${filePath}`;
      const wttpResult = await (new WTTPHandler()).fetch(wttpUrl);
      
      // Return response...
    }
  } catch (err) {
    console.error('[WTTP PROTOCOL ERROR]', err);
    return new Response('Internal WTTP Protocol Error', {
      status: 500,
      headers: { 'content-type': 'text/plain' }
    });
  }
});
```

### 5. URL Display in UI

#### Address Bar Display

**Location**: `js/browserUI.js` (lines 291-304)

```javascript
function updateAddressBar() {
  const tab = tabs.get(tabs.getSelected());
  if (!tab) return;
  // Prefer prettyUrl if available - this hides the ca/ prefix
  addressBar.value = tab.prettyUrl || tab.url || '';
  // Update security icon...
}
```

#### Navigation Event Handling

**Location**: `js/webviews.js` (lines 434-439)

```javascript
webviews.bindEvent('did-navigate', function (tabId, url, httpResponseCode, httpStatusText) {
  // If this is an internal WTTP URL, rewrite to pretty for display
  let prettyUrl = typeof toPrettyWttpUrl === 'function' ? toPrettyWttpUrl(url) : url;
  tabs.update(tabId, { url: prettyUrl });
  onPageURLChange(tabId, prettyUrl);
})
```

## URL Transformation Examples

### Example 1: Ethereum Address Input

1. **User Input**: `0x1234567890abcdef1234567890abcdef12345678`
2. **After Address Bar Processing**: `wttp://0x1234567890abcdef1234567890abcdef12345678/`
3. **Internal Conversion**: `wttp://ca/0x1234567890abcdef1234567890abcdef12345678/`
4. **Protocol Handler**: Extracts `0x1234567890abcdef1234567890abcdef12345678` as siteAddress
5. **UI Display**: `wttp://0x1234567890abcdef1234567890abcdef12345678/` (ca/ hidden)

### Example 2: ENS Name Input

1. **User Input**: `example.eth`
2. **After Address Bar Processing**: `wttp://example.eth/`
3. **Internal Conversion**: `wttp://ca/example.eth/`
4. **Protocol Handler**: Extracts `example.eth` as siteAddress
5. **UI Display**: `wttp://example.eth/` (ca/ hidden)

### Example 3: Direct WTTP URL with Path

1. **User Input**: `wttp://0x1234...abcd/page.html`
2. **Internal Conversion**: `wttp://ca/0x1234...abcd/page.html`
3. **Protocol Handler**: 
   - siteAddress: `0x1234...abcd`
   - filePath: `page.html`
4. **UI Display**: `wttp://0x1234...abcd/page.html` (ca/ hidden)

## Key Files and Their Roles

| File | Role | Key Functions |
|------|------|---------------|
| `js/browserUI.js` | Address bar handling, URL conversion | `toInternalWttpUrl()`, `toPrettyWttpUrl()`, `updateAddressBar()` |
| `js/util/urlParser.js` | URL parsing utilities | `toInternalWttpUrl()`, `toPrettyWttpUrl()`, `parse()` |
| `js/webviews.js` | Webview management, navigation events | Navigation event binding, URL updates |
| `main/minInternalProtocol.js` | Protocol registration and handling | `registerSchemesAsPrivileged()`, WTTP protocol handler |
| `main/wttpHandler.js` | WTTP request processing | `handleWttpRequest()`, `handleWttpFetch()` |

## Flow Summary

1. **Input**: User enters URL in address bar
2. **Conversion**: Pretty URL → Internal URL (adds `ca/` prefix)
3. **Navigation**: Internal URL sent to webview
4. **Protocol Handling**: `ca/` prefix extracted and processed
5. **Content Fetching**: WTTP handler fetches content using extracted address
6. **Display**: Internal URL converted back to pretty format for UI
7. **User Experience**: User sees clean URL without `ca/` prefix

## Benefits of This Architecture

1. **Clean UI**: Users never see the technical `ca/` prefix
2. **Standardized Handling**: All Ethereum addresses and ENS names processed uniformly
3. **Internal Flexibility**: Protocol handler can distinguish between different address types
4. **Backward Compatibility**: Existing WTTP URLs continue to work
5. **Debugging Support**: Internal URLs can be logged for debugging while keeping UI clean

## Debugging

To debug the `ca/` prefix handling:

1. Check browser console for `[DEBUG][toInternalWttpUrl]` logs
2. Monitor `[WTTP PROTOCOL ERROR]` logs in main process
3. Verify URL transformations in `js/webviews.js` navigation events
4. Check protocol handler logs in `main/minInternalProtocol.js`

This architecture ensures that the `ca/` prefix is handled transparently while maintaining a clean user experience.
