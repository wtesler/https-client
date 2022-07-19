module.exports = class HttpsClient {
  async call(type, host, path, body = {}, headers = {}) {
    const https = require("https");

    if (!headers["Content-Type"]) {
      headers["Content-Type"] = "application/json"; // Common situation handled here.
    }

    if (type === "GET") {
      // Turn body into query parameters.
      const keys = Object.keys(body);
      for (let i = 0; i < keys.length; i++) {
        const key = keys[i];

        if (i === 0) {
          path += "?";
        }

        path += `${key}=${body[key]}`;

        if (i < keys.length - 1) {
          path += "&";
        }
      }
    } else if (type === "POST" || type === "PUT" || type === "DELETE") {
      body = JSON.stringify(body);
      headers["Content-Length"] = body.length;
    } else {
      throw new Error(`Unrecognized type: ${type}`);
    }

    const options = {
      hostname: host,
      path: path,
      method: type,
      headers: headers
    };

    return new Promise((resolve, reject) => {
      const data = [];

      const req = https.request(options, res => {
        let isError = false;
        if (res.statusCode >= 400) {
          isError = true;
        }

        res.on("data", chunk => data.push(chunk));
        res.on("error", e => reject(e)); // Network Error
        res.on("end", () => {
          try {
            const resStr = Buffer.concat(data).toString();
            let response = resStr;
            try {
              response = JSON.parse(resStr);
            } catch (e) {
              // Everything is fine.
            }

            if (isError) {
              reject(new Error(response)); // Server Error
            } else {
              resolve(response);
            }
          } catch (e) {
            reject(e);
          }
        });
      });

      if (type === "POST" || type === "PUT" || type === "DELETE") {
        req.write(body);
      }

      req.end();
    });
  }
};
