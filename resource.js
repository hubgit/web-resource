/*global HTTP:false */

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

    if (this.pagination) {
        return this.getPages(options, this.pagination);
    }

    var request = new HTTP.Request(options);

    return request.promise;
};

//pagination: { items: function(page) { … }, next: function(page) { … } }

Resource.prototype.getPages = function(options, pagination) {
    return new Promise(function(resolve, reject) {
        var items = [];

        var fetch = function() {
            var request = new HTTP.Request(options);

            request.promise.then(function(page) {
                pagination.items(page).forEach(function(item) {
                    console.log(item);
                    items.push(item);
                });

                options.url = pagination.next(page);

                if (options.url) {
                    fetch();
                } else {
                    resolve(items);
                }
            }, reject);
        };

        fetch();
    });
};

