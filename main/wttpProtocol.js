// wttpProtocol.js - Web3 protocol handler
// Register the wttp protocol scheme with privileges IMMEDIATELY
// This must happen before app.ready and uses electron from main.js
// try {
//   // This will use the electron variable declared in main.js
//   electron.protocol.registerSchemesAsPrivileged([
//     {
//       scheme: 'wttp',
//       privileges: {
//         standard: true,
//         secure: true,
//         allowServiceWorkers: true,
//         supportFetchAPI: true,
//         corsEnabled: true,
//         stream: true
//       }
//     }
//   ])
// } catch (error) {
//   console.error('Failed to register wttp protocol scheme:', error)
// }

// Initialize WTTP handler
const { WTTPHandler } = require('@wttp/handler')
const wttp = new WTTPHandler()

function registerWttpProtocol (ses) {
  console.log('Registering wttp protocol handler for session:', ses.id || 'default')
  ses.protocol.handle('wttp', async (req) => {
    console.log('WTTP protocol handler called for URL:', req.url)
    try {
      const response = await wttp.fetch(req.url)
      console.log('WTTP handler success, response status:', response.status)
      
      // // For successful responses, handle the actual response format from @wttp/handler
      // if (response.status >= 200 && response.status < 300) {
      //   // @wttp/handler returns content as uint8 array or text, not standard Response object
      //   let body = response.body
      //   let contentType = 'text/html'
        
      //   // Check if response has headers to determine content type
      //   if (response.headers && response.headers['content-type']) {
      //     contentType = response.headers['content-type']
      //   }
        
      //   // If body is a Uint8Array, convert it to text or keep as buffer
      //   if (body instanceof Uint8Array) {
      //     if (contentType.includes('text/') || contentType.includes('html') || contentType.includes('json')) {
      //       // Convert to text for text-based content
      //       body = new TextDecoder('utf-8').decode(body)
      //     } else {
      //       // Keep as buffer for binary content
      //       body = Buffer.from(body)
      //     }
      //   }
        
      //   return new Response(body, {
      //     status: response.status,
      //     statusText: response.statusText || 'OK',
      //     headers: { 
      //       'content-type': contentType,
      //       ...(response.headers || {})
      //     }
      //   })
      // } else {
      //   // For error responses
      //   console.log('WTTP response error, status:', response.status)
      //   let errorBody = response.body || `HTTP Error ${response.status}`
        
      //   // Handle Uint8Array error responses
      //   if (errorBody instanceof Uint8Array) {
      //     errorBody = new TextDecoder('utf-8').decode(errorBody)
      //   }
        
      //   return new Response(errorBody, {
      //     status: response.status,
      //     statusText: response.statusText || 'Error',
      //     headers: { 'content-type': 'text/html' }
      //   })
      // }
    } catch (error) {
      console.error('WTTP handler error:', error)
      return new Response(`Error: ${error.message}`, {
        status: 500,
        headers: { 'content-type': 'text/plain' }
      })
    }
  })
}

// Function to initialize wttp protocol handlers after app/session are available
function initializeWttpProtocol() {
  console.log('Initializing WTTP protocol handlers')
  
  // Register wttp protocol for new sessions (not default)
  // Uses app and session variables from main.js
  app.on('session-created', (ses) => {
    if (ses !== session.defaultSession) {
      console.log('New session created, registering wttp protocol')
      registerWttpProtocol(ses)
    }
  })

  // Register wttp protocol for the default session when app is ready
  app.on('ready', function() {
    console.log('App ready, registering wttp protocol for default session')
    registerWttpProtocol(session.defaultSession)
  })
}
