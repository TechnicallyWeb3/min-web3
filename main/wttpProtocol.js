// wttpProtocol.js - Web3 protocol handler

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
      return response
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
  
  // Register protocol schemes for Web3 support - MUST be before app.ready
  // This is called from main.js before app.ready, so it's safe to do this here
  try {
    protocol.registerSchemesAsPrivileged([
      {
        scheme: 'wttp',
        privileges: {
          standard: true,
          secure: true,
          allowServiceWorkers: true,
          supportFetchAPI: true,
          corsEnabled: true,
          stream: true,
          bypassCSP: false
        }
      }
    ])
    console.log('WTTP protocol scheme registered with privileges')
  } catch (error) {
    console.error('Failed to register WTTP protocol scheme:', error)
  }
  
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
