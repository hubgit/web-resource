/*global Queue:false */

'use strict';

var queues = {};

var Request = function(options) {
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
        this.resolve = resolve;
        this.reject = reject;
    }.bind(this.deferred));

    this.prepare(); // may alter the URL
};

Request.prototype.prepare = function() {
    // override this to alter the URL
};

Request.prototype.enqueue = function() {
    if (!this.queued) {
        var queueName = this.queueName();

        this.queue = queues[queueName];

        if (!this.queue) {
            this.queue = queues[queueName] = new Queue();
        }

        this.queue.add(this);

        this.queued = true;
    }

    return this.promise;
};

Request.prototype.run = function() {
    var xhr = this.xhr = new XMLHttpRequest();

    var onresponse = function() {
        console.log(xhr.status, this.url);

        switch (xhr.status) {
            case 200: // ok
            case 201: // ok
            case 204: // ok
                this.deferred.resolve(xhr.response);
                break;

            case 403: // rate-limited
                // TODO: detect rate-limit headers
                this.queue.stop(this.delay.rate);
                this.queue.items.unshift(this); // add this request back on to the start of the queue
                this.deferred.notify('rate-limit');
                break;

            case 500: // server error
            case 503: // unknown error
                this.queue.stop(this.delay.server);

                if (--this.tries) {
                    this.queue.items.unshift(this); // add this request back on to start of the queue
                }

                this.deferred.reject(new Error(xhr));
                break;

            default:
                this.deferred.reject(new Error(xhr));
                break;
        }
    }.bind(this);

    xhr.onload = xhr.onerror = onresponse;
    xhr.open(this.method, this.url);
    xhr.responseType = this.responseType;

    if (this.headers) {
        // TODO: compatibility
        Object.keys(this.headers).forEach(function(key) {
            xhr.setRequestHeader(key, this.headers[key]);
        }.bind(this));
    }

    xhr.send(this.data);

    return this.promise;
};

Request.prototype.queueName = function() {
    var a = document.createElement('a');
    a.href = this.url;

    return a.hostname;
};

