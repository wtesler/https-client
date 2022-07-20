const HttpsClient = require('./client/HttpsClient');

const client = new HttpsClient();

const theModule = {
  get: client.get,
  post: client.post,
  put: client.put,
  delete: client.delete
}

module.exports = theModule;
