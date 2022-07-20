const HttpsClient = require('./client/HttpsClient');

const client = new HttpsClient();

const theModule = {
  get: client.get.bind(client),
  post: client.post.bind(client),
  put: client.put.bind(client),
  delete: client.delete.bind(client)
}

module.exports = theModule;
