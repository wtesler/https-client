## https-client

Simple async RESTful client for `node.js` `https` module. Useful functionality for `GET/POST/PUT/DELETE` calls.
No dependencies other than `https` module.

Example:

```
const { post } = require('https-client');
const body = {};
const headers = {};
const response = await post('/v1/endpoint', 'https://my-host.com', body, headers);
```

`get` also takes a `body` and converts it into query parameters for you.

Status code `>= 400` will cause a rejection of the call.
