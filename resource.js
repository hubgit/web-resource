/*global HTTP:false */

'use strict';

var Resource = function(url, params) {
    this.url = url;

    if (params) {
        this.url += this.buildQueryString(params);
    }
};

Resource.prototype.get = function(responseType, headers) {
    headers = headers || {};

    switch (responseType) {
        case 'json':
            headers.accept = headers.accept || 'application/json';
            break;

        case 'html':
            headers.accept = headers.accept || 'text/html';
            responseType = 'document';
            break;

        case 'xml':
            headers.accept = headers.accept || 'application/xml';
            responseType = 'document';
            break;
    }

    var request = new HTTP.Request({
        url: this.url,
        headers: headers,
        responseType: responseType,
    });

    return request.promise;
};

Resource.prototype.buildQueryString = function(params) {
    var items = Object.keys(params).map(function(key) {
        return encodeURIComponent(key) + '=' + encodeURIComponent(params[key]);
    });

    return items.length ? '?' + items.join('&').replace(/%20/g, '+') : '';
};
