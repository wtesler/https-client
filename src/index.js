const HttpsClient = require('./client/HttpsClient');

const theModule = {
  get: HttpsClient.get,
  post: HttpsClient.post,
  put: HttpsClient.put,
  delete: HttpsClient.delete
};

module.exports = theModule;
