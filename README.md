# https-client


[![npm version](https://img.shields.io/npm/v/https-client)](https://www.npmjs.com/package/https-client)

Simple RESTful client for `node.js` `https` module.

Use exported `get`, `post`, `put`, `delete` methods.

No dependencies other than `https` module.

### Example:

```
const { post } = require('https-client');
const body = {};
const headers = {};
const options = {};
const response = await post('/v1/endpoint', 'my-host.com', body, headers, options);
```

`get` also takes a `body` and converts it into query parameters for you.

Status code `>= 400` will cause a rejection of the call.

### Options:

    retry: number of retries, default 0
    response: response timeout in ms, default 10000
    deadline: deadline timeout in ms, default 60000
    verbose: should log warnings, default true

All options are optional.
