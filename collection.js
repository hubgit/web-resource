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
        var items = [];

        var fetch = function(url) {
            var resource = new Resource(url);

            resource.get(responseType, headers).then(function(response) {
                collection.itemsSelector(response, resource.request).forEach(function(item) {
                    items.push(item);
                });

                var next = collection.nextSelector(response, resource.request);
                // TODO: handle URL + params automatically?

                if (next) {
                    fetch(next);
                } else {
                    resolve(items);
                }
            }, reject);
        };

        fetch(collection.url);
    }, function(e) {
        console.error(e);
    });
};

Collection.prototype.itemsSelector = function(response, request) {
    switch (request.responseType) {
        case 'json':
        if (response._items) {
            return response._items;
        }

        return response;
    }
};

Collection.prototype.nextSelector = function(response, request) {
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