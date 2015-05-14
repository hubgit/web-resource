# web-resource

A JavaScript interface for fetching HTTP resources.

Provided as a Polymer web component, but the JS classes can be used independently.

## Features

* Handles rate-limiting, using HTTP response headers.
* Makes 1 request at a time, per domain (configurable).
* Pause/resume for queues.

## Demonstration

[A very simple demo](http://git.macropus.org/web-resource/demo.html)

## Usage

To use the Resource and Collection objects in JavaScript, import the `web-resource-scripts.html` file.

To add the UI element and parsers (HTML, JSON-LD), import the `web-resource.html` file instead.

## Examples

### Fetch a resource as JSON

```javascript
var resource = new Resource('https://api.spotify.com/v1/artists/5Al98vDcGka3JcJ1WlZYoN');

resource.get('json').then(function(data) {
    // do something with the data
});
```

### Fetch a resource as JSON (shorthand version)
```javascript
var url = 'https://api.spotify.com/v1/artists/5Al98vDcGka3JcJ1WlZYoN';

Resource(url).get('json').then(function(data) {
    // do something with the data
});
```

### Fetch a paginated collection, with query parameters
```javascript
var collection = new Collection('https://api.spotify.com/v1/search', {
  type: 'artist',
  q: 'artist:"Cows"'
});

collection.get('json', {
    // select the array of items
    items: function(data) {
      return data.artists.items;
    },
    // select the URL of the next chunk
    next: function(data) {
      return data.artists.next;
    }
}).then(function(items) {
  // do something with the items
});
```

## CORS

Override `Request.prototype.prepare` to manipulate the URL and pass the request through a local proxy (e.g. for local caching, or to add CORS headers).
