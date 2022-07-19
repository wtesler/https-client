## https-client

Simple async RESTful client for `node.js` `https` module. Useful functionality for `GET/POST/PUT/DELETE` calls.
No dependencies other than `https` module.

Clients extend default export `HttpsClient` which allows them to inherit the `call` method.

Use `call` method like:

```
const body = {};
const headers = {};
return await this.call('POST', 'https://my-host.com', '/v1/endpoint', body, headers);
```

`GET` requests also take a `body` and convert it into query parameters for you.

Status code `>= 400` will cause a rejection of the call.
