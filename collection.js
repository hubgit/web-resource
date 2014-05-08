var Collection = function(url, params) {
    Resource.call(this, url, params);

    this.pagination = {
        items: function(response, request) {
            switch (request.responseType) {
                case 'json':
                //return response._items;
                return response;
            }
        },
        next: function(response, request) {
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
            }
        }
    };
};

Collection.prototype = Object.create(Resource.prototype);
//Collection.prototype.constructor = Collection;

Collection.prototype.get = function(responseType, headers) {
    var url = this.url;
    var pagination = this.pagination;

    return new Promise(function(resolve, reject) {
        var items = [];

        var fetch = function(url) {
            var resource = new Resource(url);

            resource.get(responseType, headers).then(function(response) {
                pagination.items(response, resource.request).forEach(function(item) {
                    items.push(item);
                });

                var next = pagination.next(response, resource.request);
                // TODO: handle URL + params?

                if (next) {
                    fetch(next);
                } else {
                    resolve(items);
                }
            }, reject);
        };

        fetch(url);
    });
};