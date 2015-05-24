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

```bash
bower install hubgit/web-resource --save
```

```html
<link rel="import" href="../bower_components/web-resource/import.html">
```

## Examples

### Fetch a resource as JSON

```javascript
Resource('https://api.spotify.com/v1/artists/5Al98vDcGka3JcJ1WlZYoN').get('json').then(function(data) {
    // do something with the data
});
```

### Fetch a paginated collection, with query parameters

```javascript
Collection('https://api.spotify.com/v1/search', {
  type: 'artist',
  q: 'artist:"Cows"'
}).get('json', {
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
