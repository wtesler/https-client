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

    return HttpsClient._call('POST', path, host, body, headers, options);
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
   * @param options Optional properties POJO (i.e. {}):
   * `response`: Number of ms to wait for the initial response. Defaults to 10000.
   * `deadline`: Number of ms to wait for the entire request. Defaults to 60000.
   * `retry`: Number of times to retry the request. Defaults to 0.
   * `verbose`: Whether to print the rejections as warnings. Defaults to true.
   * @return {Promise<Object>} The resolved or rejected response.
   * Is often times a POJO. When it's a POJO, it has a statusCode property.
   * Can also just be arbitrary data.
   */
  static async _call(type, path, host, body = {}, headers = {}, options = {}) {
    const https = require('https');

    if (host && host.startsWith('https://')) {
      host = host.replace('https://', '');
    }

    if (!options) {
      options = {};
    }

    const defaultOptions = {
      response: 10000,
      deadline: 60000,
      retry: 0,
      verbose: true,
    }

    // Project options onto default options.
    options = Object.assign(defaultOptions, options);

    const responseTimeMs = options.response;
    const deadlineTimeMs = options.deadline;
    const retry = options.retry;
    const verbose = options.verbose;

    if (!headers['Content-Type']) {
      headers['Content-Type'] = 'application/json'; // Common situation handled here.
    }

    const httpsOptions = {
      hostname: host,
      path: path,
      method: type,
      headers: headers
    };


    const logWarning = (str) => {
      if (verbose) {
        console.warn(str);
      }
    };

    let receivedAck = false;
    let didTimeout = false;

    let responseTimeout;
    let deadlineTimeout;

    const TIMEOUT = 'Https Client Timeout';

    /**
     * Resolves if timeout occurs while waiting for initial acknowledgement.
     */
    const responseTimeoutPromise = new Promise((resolve, reject) => {
      responseTimeout = setTimeout(() => {
        if (receivedAck) {
          reject(new Error('Timeout expired'));
        } else {
          didTimeout = true;
          resolve(`${TIMEOUT} -> Response passed ${responseTimeMs} ms`);
        }
      }, responseTimeMs);
    });

    const cancelResponseTimeout = () => {
      receivedAck = true;
      if (responseTimeout) {
        clearTimeout(responseTimeout);
      }
      responseTimeout = null;
    };

    /**
     * Resolves if timeout occurs while waiting for response completion.
     */
    const deadlineTimeoutPromise = new Promise(resolve => {
      deadlineTimeout = setTimeout(() => {
        didTimeout = true;
        resolve(`${TIMEOUT} -> Deadline passed ${deadlineTimeMs} ms`);
      }, deadlineTimeMs);
    });

    let hasTried = false;
    let shouldTry = true;

    let numRetries = 0;

    while (shouldTry && (!hasTried || numRetries < retry)) {
      hasTried = true;

      const buffer = Buffer;

      const responsePromise = new Promise(resolve => {
        const data = [];

        const req = https.request(httpsOptions, res => {
          const statusCode = res.statusCode;

          res.on('error', e => {
            cancelResponseTimeout();
            e.statusCode = statusCode;
            logWarning(e);
            resolve(e); // Network Error
          });
          res.on('data', chunk => {
            cancelResponseTimeout();
            data.push(chunk);
          });
          res.on('end', () => {
            if (didTimeout) {
              resolve();
              return;
            }

            cancelResponseTimeout();
            clearTimeout(deadlineTimeout);

            const responseStr = buffer.concat(data).toString();
            let response;
            try {
              response = JSON.parse(responseStr);
              if (!response.statusCode) {
                response.statusCode = statusCode;
              }
            } catch (e) {
              response = responseStr;
            }

            if (statusCode >= 400) {
              logWarning(response);
              let responseStr = response;
              const serverError = new Error();
              serverError.statusCode = statusCode;
              if (typeof response === 'string') {
                serverError.message = `Received ${statusCode} code. Response treated as rejection. Full response: ${responseStr}`;
              } else {
                Object.assign(serverError, response);
              }
              resolve(serverError);
            } else {
              // Success
              shouldTry = false;
              resolve(response);
            }
          });
        });

        if (type === 'POST' || type === 'PUT' || type === 'DELETE') {
          req.write(body);
        }

        req.end();
      });

      const overallResponse = await Promise.any([responsePromise, Promise.any([responseTimeoutPromise, deadlineTimeoutPromise])]);

      if (typeof overallResponse === 'string' && overallResponse.includes(TIMEOUT)) {
        shouldTry = false;
        const timeoutError = new Error(overallResponse);
        timeoutError.statusCode = 408;
        throw timeoutError;
      } else if (overallResponse instanceof Error) {
        if (numRetries === retry) {
          throw overallResponse;
        }
      } else {
        return overallResponse;
      }

      numRetries++;
    }
  }
};
