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
      return new Response(response.body, {
        status: response.status,
        headers: response.headers
      })
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
