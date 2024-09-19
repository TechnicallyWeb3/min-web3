const { pathToFileURL } = require('url')
const { getENSOwner } = require(path.join(__dirname, '..','min-web3', 'main', 'ensHelper'));

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
    console.log('Received web3 request:', req.url);
    const url = new URL(req.url);
    let contractAddress = url.hostname;
    const path = url.pathname || '/';
    
    console.log('Debug: Initial contract address or ENS:', contractAddress);

    function isValidENS(domain) {
      // This is a basic check. You might want to make it more robust.
      return domain.endsWith('.eth') || domain.includes('.'); // Checks for .eth or any subdomain
    }

    
    try {
      // Check if the hostname is an ENS domain
      if (isValidENS(contractAddress)) {
        console.log('Debug: ENS domain detected, resolving...');
        const ensResult = await getENSOwner(contractAddress);
        if(ensResult){
          contractAddress = ensResult;
        }
        // if (ensResult.status === 'website' || ensResult.status === 'owner') {
        //   contractAddress = ensResult.address;
        //   console.log('Debug: Resolved ENS to address:', contractAddress);
        // } else {
        //   throw new Error('Unable to resolve ENS domain');
        // }
      }
      
      console.log('Debug: Final contract address:', contractAddress);
      console.log('Debug: Path:', path);
      
      const resource = await fetchContractResource(contractAddress, path);
      console.log('Debug: Resource:', resource.content);
      console.log('Debug: Resource type:', resource.contentType);
      
      if (resource) {
        return new Response(resource.content, {
          status: 200,
          headers: { 'content-type': resource.contentType }
        });
      } else {
        return new Response('Resource not found', {
          status: 404,
          headers: { 'content-type': 'text/plain' }
        });
      }
    } catch (error) {
      console.error('Error processing request:', error);
      return new Response(`Error: ${error.message}`, {
        status: 500,
        headers: { 'content-type': 'text/plain' }
      });
    }
  })
}

app.on('session-created', (ses) => {
  if (ses !== session.defaultSession) {
    registerBundleProtocol(ses)
  }
})
