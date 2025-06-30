# WTTP Gateway Server – LLM Context File

## Overview

This server acts as a gateway for the WTTP protocol, allowing users to access decentralized sites (by Ethereum address or ENS name) via HTTP. It fetches content from the WTTP network and serves it to browsers, handling both static files and root requests, with robust error handling and content-type management.

## Key Features

- **Express.js server** with compression and cookie support.
- **Routes:**
  - `/` – Healthcheck endpoint.
  - `/:siteAddress/*` – Fetches specific files from a WTTP site.
  - `/:siteAddress` – Handles root or relative path requests.
- **WTTPHandler**: Used to fetch content from the WTTP network.
- **Content-Type Handling**: Determines and sets the correct MIME type for responses.
- **Cookie**: Remembers the last accessed site for relative path resolution.
- **Error Handling**: Custom error pages and status codes for invalid addresses or fetch failures.

## Route Logic

### 1. Healthcheck

- `GET /`
- Returns a simple status message.

### 2. File Fetch

- `GET /:siteAddress/*`
- `siteAddress` can be an Ethereum address (`0x...`) or ENS name (`*.eth`).
- `filePath` is everything after the first `/`.
- Validates `siteAddress`.
- Constructs a WTTP URL: `wttp://{siteAddress}/{filePath}`.
- Fetches content via `WTTPHandler`.
- Sets appropriate content-type and cache headers.
- Handles errors and invalid addresses.

### 3. Root/Relative Fetch

- `GET /:siteAddress`
- If `siteAddress` is not a valid address/ENS, treats it as a relative path:
  - Uses a cookie (`originalSite`) or a default ENS name.
  - Fetches `wttp://{originalSite}/{filePath}`.
- If valid, fetches `index.html` from the site.
- Sets a cookie to remember the site for future relative requests.

## WTTP Fetch Logic

- Uses `WTTPHandler.fetch(wttpUrl)`.
- Determines content type from response headers or file extension.
- Reads body as text or binary depending on content type.
- Sets HTTP headers for content type and cache control.
- Sends the content as the HTTP response.

## Error Handling

- Invalid site addresses return 404.
- WTTP fetch errors return 500 or a custom error page.
- Handles both text and binary content gracefully.

## Dependencies

- `express`
- `@wttp/handler`
- `compression`
- `mime-types`
- `cookie-parser`
- `dotenv`

## Example WTTP URL

- `wttp://0x1234...abcd/index.html`
- `wttp://mydomain.eth/assets/logo.png`

## Pseudocode Summary

```pseudo
on GET /:
    return "WTTP Gateway Running"

on GET /:siteAddress/*:
    if siteAddress is not valid:
        return 404
    wttpUrl = "wttp://{siteAddress}/{filePath}"
    fetch and serve content

on GET /:siteAddress:
    if siteAddress is not valid:
        use cookie or default ENS as site
        wttpUrl = "wttp://{originalSite}/{siteAddress}"
    else:
        wttpUrl = "wttp://{siteAddress}/index.html"
        set cookie for siteAddress
    fetch and serve content

function fetch and serve content:
    fetch wttpUrl via WTTPHandler
    determine content-type
    read body as text or binary
    set headers
    send response
    handle errors
```

## Porting Notes

- The core logic is protocol-agnostic: you can re-implement in any language/framework that supports HTTP servers and async fetch.
- The WTTPHandler must be replaced with an equivalent in the target environment.
- Cookie and content-type logic should be preserved for browser compatibility.
- Error handling and logging are important for debugging decentralized content.

## WTTP Response Handling

When a request is made to the gateway, the server:

1. **Fetches the resource** from the WTTP network using `WTTPHandler.fetch(wttpUrl)`, which returns a response object similar to the Fetch API.
2. **Determines the content type** by checking the response headers (`content-type` or `Content-Type`). If not present, it guesses based on the file extension using the `mime-types` library.
3. **Reads the response body**:
   - If the content type starts with `text/` (e.g., `text/html`, `text/css`, `text/plain`), it uses `response.text()` to get a string.
   - For all other types (e.g., images, application files), it uses `response.arrayBuffer()` and converts it to a Node.js `Buffer` for binary data.
4. **Sets HTTP headers** for the outgoing response:
   - `Content-Type`: Set to the determined content type (with proper charset if available).
   - `Cache-Control`, `Pragma`, `Expires`: Set to prevent caching by default.
5. **Sends the response** to the client:
   - For text content, sends the string directly.
   - For binary content, sends the Buffer.

### Example Logic

```js
// Pseudocode for response handling
const response = await wttp.fetch(wttpUrl);
let contentType = response.headers.get('content-type') || mime.lookup(filePath);
let body;
if (contentType.startsWith('text/')) {
  body = await response.text();
} else {
  body = Buffer.from(await response.arrayBuffer());
}
res.setHeader('Content-Type', contentType);
res.send(body);
```

### Notes for Porting
- Always check and set the correct content type for browser compatibility.
- Use string for text responses, Buffer (or equivalent) for binary.
- Set cache headers as needed for your use case.
- Handle errors gracefully and log for debugging.

---

**This context file should be sufficient for an LLM or developer to re-implement the WTTP Gateway logic in another project or browser environment.** 