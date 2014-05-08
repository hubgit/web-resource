/*global Request:false */

'use strict';

var Resource = function(url, params) {
    this.url = url;

    if (params) {
        this.url += this.buildQueryString(params);
    }
};

Resource.prototype.buildQueryString = function(params) {
    var items = Object.keys(params).map(function(key) {
        return encodeURIComponent(key) + '=' + encodeURIComponent(params[key]);
    });

    return items.length ? '?' + items.join('&').replace(/%20/g, '+') : '';
};

Resource.prototype.prepareHeaders = function(headers, responseType) {
    headers = headers || {};

    switch (responseType) {
        case 'json':
            headers.accept = headers.accept || 'application/json';
            break;

        case 'html':
            headers.accept = headers.accept || 'text/html';
            break;

        case 'xml':
            headers.accept = headers.accept || 'application/xml';
            break;
    }

    return headers;
};

Resource.prototype.prepareResponseType = function(responseType) {
    switch (responseType) {
        case 'html':
        case 'xml':
            responseType = 'document';
            break;
    }

    return responseType;
};

Resource.prototype.get = function(responseType, headers) {
    var options = {
        url: this.url,
        headers: this.prepareHeaders(headers, responseType),
        responseType: this.prepareResponseType(responseType),
    };

    console.log('request', options);

    // TODO: needs a promise for each request?
    if (!this.promise) {
        this.request = new Request(options);
        this.promise = this.request.enqueue();
    }

    return this.promise;
};

