/*globals Resource:false */

'use strict';

var Collection = function(url, params) {
    Resource.call(this, url, params);
};

Collection.prototype = Object.create(Resource.prototype);
//Collection.prototype.constructor = Collection;

Collection.prototype.get = function(responseType, headers) {
    var collection = this;

    return new Promise(function(resolve, reject) {
        var result = [];

        var fetch = function(url) {
            var resource = new Resource(url);

            resource.get(responseType, headers).then(function(response) {
                var items = collection.items(response, resource.request);

                if (items) {
                    items.forEach(function(item) {
                        result.push(item);
                    });
                }

                var next = collection.next(response, resource.request);

                // array = url + params
                if (next instanceof Array) {
                    next = next[0] + collection.buildQueryString(next[1]);
                }

                if (next) {
                    fetch(next);
                } else {
                    resolve(result);
                }
            }, reject);
        };

        fetch(collection.url);
    }, function(e) {
        console.error(e);
    });
};

Collection.prototype.items = function(response, request) {
    switch (request.responseType) {
        case 'json':
            // TODO: object vs array
            if (response._items) {
                return response._items;
            }

            return response;
    }
};

Collection.prototype.next = function(response, request) {
    var linkHeader = request.xhr.getResponseHeader('Link');

    if (linkHeader) {
        var links = request.parseLinkHeader(linkHeader);

        if (links.next) {
            return links.next;
        }
    }

    switch (request.responseType) {
        case 'json':
            if (response._links && response._links.next) {
                return response._links.next.href;
            }

            return null;

        // TODO: rel="next" in HTML
    }
};