module.exports = class HttpsClient {

  /**
   * @see _call
   */
  static async get(path, host, body, headers, options) {
    const keys = Object.keys(body);
    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];
      const value = body[key];

      if (i === 0) {
        path += '?';
      }

      path += `${key}=${value}`;

      if (i < keys.length - 1) {
        path += '&';
      }
    }

    return HttpsClient._call('GET', path, host, body, headers, options);
  }

  /**
   * @see _call
   */
  static async post(path, host, body, headers, options) {
    body = JSON.stringify(body);
    headers['Content-Length'] = body.length;

    return this._call('POST', path, host, body, headers, options);
  }

  /**
   * @see _call
   */
  static async put(path, host, body, headers, options) {
    body = JSON.stringify(body);
    headers['Content-Length'] = body.length;

    return HttpsClient._call('PUT', path, host, body, headers, options);
  }

  /**
   * @see _call
   */
  static async delete(path, host, body, headers, options) {
    body = JSON.stringify(body);
    headers['Content-Length'] = body.length;

    return HttpsClient._call('DELETE', path, host, body, headers, options);
  }

  /**
   * Make a network call to the given host.
   * @param type REST method to use. For example 'GET', 'POST', 'PUT', 'DELETE'.
   * @param path Endpoint path. For example '/api/v1/users'.
   * @param host Host to call. Example: api.example.com
   * @param body Optional POJO (i.e. {}) to send. Works for all methods including `get`.
   * @param headers Optional POJO (i.e. {}) to send. May contain things like API Key, etc.
   * @param options Optional properties: `response`, `deadline`, `retry`. Defaults to `{10000, 60000, 0}`.
   * @return {Promise<Object>} The resolved or rejected response.
   * Is often times a POJO. When it's a POJO, it has a statusCode property.
   * Can also just be arbitrary data.
   * @private
   */
  async _call(type, path, host, body = {}, headers = {}, options = {}) {
    const https = require('https');

    if (host && host.startsWith('https://')) {
      host = host.replace('https://', '');
    }

    if (!options) {
      options = {};
    }

    if (!options.response) {
      options.response = 10000;
    }

    if (!options.deadline) {
      options.deadline = 60000;
    }

    if (!options.retry) {
      options.retry = 0;
    }

    if (!headers['Content-Type']) {
      headers['Content-Type'] = 'application/json'; // Common situation handled here.
    }

    const httpsOptions = {
      hostname: host,
      path: path,
      method: type,
      headers: headers
    };

    return new Promise((resolve, reject) => {
      const data = [];

      const req = https.request(httpsOptions, res => {
        res.on('error', e => reject(e)); // Network Error
        res.on('data', chunk => data.push(chunk));
        res.on('end', () => {
          const statusCode = res.statusCode;
          const responseStr = Buffer.concat(data).toString();
          let response = responseStr;
          try {
            response = JSON.parse(responseStr);
            if (!response.statusCode) {
              response.statusCode = statusCode;
            }
          } catch (e) {
            // Everything is fine. Not dealing with JSON response.
          }

          if (statusCode >= 400) {
            reject(response); // Server Error
          } else {
            resolve(response);
          }
        });
      });

      if (type === 'POST' || type === 'PUT' || type === 'DELETE') {
        req.write(body);
      }

      req.end();
    });
  }
};
