const { pathToFileURL } = require('url')
const { getENSOwner } = require(path.join(__dirname, '..','min-web3', 'main', 'ensHelper'));
const { resolveUnstoppableDomain } = require(path.join(__dirname, '..','min-web3', 'main', 'unstoppableHelper'));

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
      return /^([a-z0-9-]+\.)*[a-z0-9-]+\.eth$/i.test(domain);
    }

    function isValidUnstoppableDomain(domain) {

      const unstoppableTLDs = ['.crypto', '.zil', '.nft', '.blockchain', '.bitcoin', '.x', '.888', '.dao', '.wallet','unstoppable'];
      return unstoppableTLDs.some(tld => domain.endsWith(tld));
    }

    
    try {
      if (isValidENS(contractAddress)) {
        console.log('Debug: ENS domain detected, resolving...');
        const ensResult = await getENSOwner(contractAddress);
        console.log(ensResult);
        if(ensResult.status === 'resolved'){
          contractAddress = ensResult.address;
        }
        // if (ensResult.status === 'website' || ensResult.status === 'owner') {
        //   contractAddress = ensResult.address;
        //   console.log('Debug: Resolved ENS to address:', contractAddress);
        // } else {
        //   throw new Error('Unable to resolve ENS domain');
        // }
      } 

       else if (isValidUnstoppableDomain(contractAddress)) {
        console.log('Debug: Unstoppable domain detected, resolving...');
        const unstoppableResult = await resolveUnstoppableDomain(contractAddress);
        if (unstoppableResult.status === 'resolved') {
          console.log("WROKING");
          contractAddress = unstoppableResult.address;
          console.log('Debug: Resolved Unstoppable domain to address:', contractAddress);
        } else {
          throw new Error(`Unable to resolve Unstoppable domain: ${unstoppableResult.error || 'Unknown error'}`);
        }
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
