/*global Queue:false */

'use strict';

var HTTP = {
    queues: {}
};

HTTP.Request = function(options) {
    this.url = options.url; // URL
    this.method = options.method || 'GET'; // HTTP method
    this.responseType = options.responseType || ''; // response type (e.g. 'json', 'document', 'text', 'xml')
    this.headers = options.headers || {}; // e.g. { Accept: 'application/json' }
    this.data = options.data || null; // POST data

    this.priority = options.priority || false;
    this.tries = options.tries || 1;
    this.rateLimit = options.rateLimit || 0;

    this.delay = {
        rate: options.delayRate || 10000,
        server: options.delayServer || 1
    };

    this.deferred = {};

    this.promise = new Promise(function(resolve, reject) {
        this.deferred.resolve = resolve;
        this.deferred.reject = reject;
    }.bind(this));

    this.prepare(); // may alter the URL
    this.enqueue();
};

HTTP.Request.prototype.prepare = function() {
    // override this to alter the URL
};

HTTP.Request.prototype.enqueue = function() {
    var queueName = this.queueName();

    this.queue = HTTP.queues[queueName];

    if (!this.queue) {
        this.queue = HTTP.queues[queueName] = new Queue();
    }

    this.queue.add(this);
};

HTTP.Request.prototype.run = function() {
    var request = this;

    return new Promise(function(resolve, reject) {
        var xhr = new XMLHttpRequest();

        var onresponse = function() {
            var headers = xhr.getAllResponseHeaders();

            console.log(request.url, xhr.status);

            switch (xhr.status) {
                case 200: // ok
                case 201: // ok
                case 204: // ok
                    request.deferred.resolve(xhr.response, xhr.status, headers);
                    resolve(xhr.response, xhr.status, headers);
                    break;

                case 403: // rate-limited
                    // TODO: detect rate-limit headers
                    request.queue.stop(request.delay.rate);
                    request.queue.items.unshift(request); // add this request back on to the start of the queue
                    request.deferred.notify('rate-limit', headers);
                    break;

                case 500: // server error
                case 503: // unknown error
                    request.queue.stop(request.delay.server);

                    if (--request.tries) {
                        request.queue.items.unshift(request); // add this request back on to start of the queue
                        request.deferred.notify('retry', headers);
                    } else {
                        request.deferred.reject(xhr.status, headers);
                    }

                    reject(xhr.status, headers);
                    break;

                default:
                    request.deferred.reject(xhr.status, headers);
                    reject(xhr.status, headers);
                    break;
            }
        };

        xhr.onload = xhr.onerror = onresponse;
        xhr.open(request.method, request.url);
        xhr.responseType = request.responseType;

        if (request.headers) {
            // TODO: compatibility
            Object.keys(request.headers).forEach(function(key) {
                xhr.setRequestHeader(key, request.headers[key]);
            });
        }

        xhr.send(request.data);
    });
};

HTTP.Request.prototype.queueName = function() {
    var a = document.createElement('a');
    a.href = this.url;

    return a.hostname;
};

