/*globals Parsers:true */

'use strict';

// adapted from https://github.com/hubgit/jquery-microdata

Parsers.Microdata = function(root) {
  this.root = root || document;
};

// get all properties as a key/value(s) object
Parsers.Microdata.prototype.microdata = function(node) {
  // select items of a certain type
  if (typeof node === 'string') {
    return this.items(node).map(function(node) {
      return this.microdata(node);
    }.bind(this));
  }

  // map an array of nodes
  if (Array.isArray(node)) {
    return node.map(this.microdata.bind(this));
  }

  // the object always includes at least one itemtype
  var types = this.attrs(node, 'itemtype');

  var data = {
    type: types.length === 1 ? types[0] : types, // string, or array if multiple
  };

  this.propertyNodes(node).forEach(function(propertyNode) {
    var property = this.itemValue(propertyNode);

    this.attrs(propertyNode, 'itemprop').forEach(function(name) {
      if (typeof data[name] == 'undefined') {
        data[name] = property; // first item
      } else if (Array.isArray(data[name])) {
        data[name].push(property); // more items
      } else {
        data[name] = [data[name], property]; // second item
      }
    });
  }.bind(this));

  return data;
};

Parsers.Microdata.prototype.items = function(itemtype) {
  return this.select(this.root, '[itemscope]').filter(function(node) {
    // only find top-level items
    if (node.hasAttribute('itemprop')) {
      return false;
    }

    // only find items of a certain itemtype
    return this.attrs(node, 'itemtype').indexOf(itemtype) !== 1;
  }.bind(this));
};

// get a space-separated attribute as an array
Parsers.Microdata.prototype.attrs = function(node, attribute) {
  var text = node.getAttribute(attribute) || '';

  return text.split(/\s+/).filter(function(item) {
    return item;
  });
};

// element-scoped querySelectorAll with array return value
Parsers.Microdata.prototype.select = function(node, selector) {
  var nodes = node.querySelectorAll(':scope ' + selector);

  return Array.prototype.slice.call(nodes);
};

// all property nodes, including those in referenced nodes
Parsers.Microdata.prototype.propertyNodes = function(node) {
  var nodes = [node];

  this.attrs(node, 'itemref').forEach(function(id) {
    nodes.push(this.root.getElementById(id));
  }.bind(this));

  var output = [];

  nodes.forEach(function(node) {
    var scopedProperties = this.select(node, '[itemscope] [itemprop]');

    this.select(node, '[itemprop]').forEach(function(node) {
      if (scopedProperties.indexOf(node) === -1) {
        output.push(node);
      }
    });
  }.bind(this));

  return output;
};

// get the value of a node
Parsers.Microdata.prototype.itemValue = function(node) {
  if (node.hasAttribute('itemscope')) {
    return this.microdata(node);
  }

  switch (node.nodeName) {
    case 'META':
    return node.getAttribute('content').trim();

    case 'DATA':
    case 'METER':
    return node.getAttribute('value').trim();

    case 'TIME':
    if (node.hasAttribute('datetime')) {
      return node.getAttribute('datetime').trim();
    }

    return node.textContent.trim();

    case 'AUDIO':
    case 'EMBED':
    case 'IFRAME':
    case 'IMG':
    case 'SOURCE':
    case 'TRACK':
    return node.src;

    case 'A':
    case 'AREA':
    case 'LINK':
    return node.href;

    case 'OBJECT':
    return node.getAttribute('data');

    default:
    return node.textContent.trim();
  }
};

