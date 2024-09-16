const { pathToFileURL } = require('url')

protocol.registerSchemesAsPrivileged([
  {
    scheme: 'min',
    privileges: {
      standard: true,
      secure: true,
      supportFetchAPI: true,
    }
  },
  {
    scheme: 'web3',
    privileges: {
      standard: true,
      secure: true,
      supportFetchAPI: true,
      corsEnabled: true,
      stream: true
    }
  }
])

function registerBundleProtocol (ses) {
  ses.protocol.handle('min', (req) => {

    console.log('Debug: Received min request:', req.url);
    let { host, pathname } = new URL(req.url)

    if (pathname.charAt(0) === '/') {
      pathname = pathname.substring(1)
    }

    if (host !== 'app') {
      return new Response('bad', {
        status: 400,
        headers: { 'content-type': 'text/html' }
      })
    }

    // NB, this checks for paths that escape the bundle, e.g.
    // app://bundle/../../secret_file.txt
    const pathToServe = path.resolve(__dirname, pathname)
    const relativePath = path.relative(__dirname, pathToServe)
    const isSafe = relativePath && !relativePath.startsWith('..') && !path.isAbsolute(relativePath)

    if (!isSafe) {
      return new Response('bad', {
        status: 400,
        headers: { 'content-type': 'text/html' }
      })
    }

    return net.fetch(pathToFileURL(pathToServe).toString())
  })

  ses.protocol.handle('web', async (req) => {
    console.log('Debug: Received web3 request:', req.url)
    const url = new URL(req.url)
    const contractAddress = url.hostname
    const path = url.pathname || '/'
    console.log('Debug: Contract address:', contractAddress)
    console.log('Debug: Path:', path)
    try {
      const resource = await fetchContractResource(contractAddress, path)
      console.log('Debug: Resource:', resource.content)
      console.log('Debug: Resource:', resource.contentType)
      if (resource) {
        return new Response(resource.content, {
          status: 200,
          headers: { 'content-type': resource.contentType }
        })
      } else {
        return new Response('Resource not found', {
          status: 404,
          headers: { 'content-type': 'text/plain' }
        })
      }
    } catch (error) {
      console.error('Error fetching resource:', error)
      return new Response('Error fetching resource', {
        status: 500,
        headers: { 'content-type': 'text/plain' }
      })
    }
  })
}

app.on('session-created', (ses) => {
  if (ses !== session.defaultSession) {
    registerBundleProtocol(ses)
  }
})