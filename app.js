var express = require('express');
const axios = require('axios');

var app = express();

app.use(express.json());

app.use((_, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, DELETE, OPTIONS, POST, PUT, PATCH');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  next();
});

const ALLOWED_HOSTS = ['symphony-rpc.kleomedes.network', 'symphony-api.kleomedes.network', 'symphony-testnet-rpc.cogwheel.zone', 'symphony-testnet-api.cogwheel.zone']

// Middleware to validate and parse the target URL
app.use('/:target(*)', (req, res, next) => {
  const targetUrl = req.params.target;

  try {
    // Ensure the target URL is valid and append the protocol if missing
    const url = new URL(targetUrl.startsWith('http') ? targetUrl : `https://${targetUrl}`);

    if (ALLOWED_HOSTS.indexOf(url.hostname) === -1) res.status(400).json({ error: 'Invalid target URL ' + url.hostname });

    // Attach the parsed target to the request object for the proxy
    req.target = url.href;
    next();
  } catch (error) {
    res.status(400).json({ error: 'Invalid target URL' });
  }
});

// Proxy requests to the parsed target
app.use('/:target(*)', async (req, res) => {
  const target = req.target;
  const requestParams = {
      url: target,
      data: req.body,
      method: req.method,
      params: req.params,
      headers: {
        'Content-Type': 'application/json'
      }
    }
  try {
    const { status = 500, data } = await axios.request(requestParams)
    
    res.status(status).json(data)
  }
  catch(error) {
    console.log("🚀 ~ app.use ~ target:", target)
    console.log("🚀 ~ app.use ~ error:", error)
    const status = error.status || 500
    res.status(status).json(error?.response?.data || error);
  }
});

// Start the server
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Proxy server running at http://localhost:${PORT}`);
});


module.exports = app;
