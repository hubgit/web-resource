# web-resource

A JavaScript interface for fetching HTTP resources from the web.

## Requirements

* Per-domain queues, with configurable concurrency (default sequential fetching) and pause/resume.
* Handle rate-limiting, using HTTP response headers.
* Set request headers according to response type.
* Define resource/collection in JSON.
* Parse responses and select/extract data.
* Detect rel=next from response headers.
* Replace variables in URL templates and remove from query parameters.

## Usage

```bash
npm install hubgit/web-resource
```

```javascript
var Resource = require('web-resource/resource.js')
```

or 

```bash
bower install hubgit/web-resource --save
```

```html
<link rel="import" href="bower_components/web-resource/import.html">
```

or

```html
<script src="bower_components/web-resource/queue.js"></script>
<script src="bower_components/web-resource/request.js"></script>
<script src="bower_components/web-resource/resource.js"></script>
<script src="bower_components/web-resource/collection.js"></script>
```

## Resource description

```json
{
  "url": "https://api.spotify.com/v1/artists/5Al98vDcGka3JcJ1WlZYoN",
  "format": "json",
}
```

## Collection description

```json
{
  "url": "https://api.spotify.com/v1/search",
  "query": {
    "type": "artist",
    "q": "cows"
  },
  "format": "json",
  "select": "artists.items",
  "next": "artists.next"
}
```

### HTML

```json
{
    "select": ".item",
    "extract": {
        "title": ".title",
        "published": ".date-published",
    },
    "next": "a[rel=next] @href"
}
```

### Microdata

```json
{
    "itemtype": "http://schema.org/Article"
}
```

## Interface

```javascript
/*
var collection = new Collection('https://api.spotify.com/v1/search', {
    type: 'artist',
    q: 'cows'
})

collection.get('json').then(function(doc) {
    var items = doc.artists.items
    
    items.forEach(function(item) {
        item.title = item.title.replace(/^Title: /, '')
    })
    
    return items
}).then(function(items) {
    // do something with the items
})
*/

/*
Collection({
  url: 'https://api.spotify.com/v1/search', 
  query: {
    type: 'artist',
    q: 'cows'
  },
  format: 'json',
  select: 'artists.items',
  next: 'artists.next',
}).get().then(function(items) {
  // do something with the items
});
*/

Collection('https://api.spotify.com/v1/search', {
    type: 'artist',
    q: 'cows'
}).get('json', {
    select: 'artists.items',
    next: 'artists.next',
    emit: function(item) {
        item.title = item.title.replace(/^Title: /, '')
        // do something with each item
    }
})
```

```javascript
/*
var collection = new Collection('https://peerj.com/articles/index.html')

collection.get('html').then(function(doc) {
    var nodes = doc.querySelectorAll('ul.items > li');
    
    return [].prototype.map.call(nodes, function(node) {
        return {
            url: node.querySelector('a.title').href,
            name: node.querySelector('.title').textContent,
            published: node.querySelector('time.published').getAttribute('datetime'),
        }
    ).filter(function(node) {
        return node.nextSibling.nextSibling.nodeName === 'H2'
    }).map(function(node) {
      item.title = item.title.replace(/^Title: /, '')
      
      return item;
    })
})
*/

Collection('https://peerj.com/articles/index.html').get('html', {
    select: 'ul.items > li',
    /*filter: function(node) {
      return node.nextSibling.nextSibling.nodeName === 'H2'
    },*/
    extract: {
        url: 'a.title @href',
        name: '.title',
        published: 'time.published @datetime'
    },
    emit: function(item) {
        // do something with each item
    }
}).then(function() {
  // finished
})
```

## Cross-domain

Override `Request.prototype.prepare` to manipulate the URL and pass the request through a local proxy (e.g. for local caching, or to add CORS headers).
