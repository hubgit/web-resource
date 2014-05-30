/* globals HTML:true, HTMLDocument:false */

'use strict';

window.HTML = {};

// get all properties as a key/value(s) object
HTML.microdata = function(node) {
  // select items of a certain type
  if (typeof node === 'string') {
    return HTML.microdata(HTML.items(null, node));
  }

  // map an array of nodes
  if (Array.isArray(node)) {
    return node.map(HTML.microdata);
  }

  // the object always includes at least one itemtype
  var types = HTML.attrs('itemtype', node);

  var data = {
    type: types.length === 1 ? types[0] : types, // string, or array if multiple
  };

  HTML.propertyNodes(null, node).forEach(function(propertyNode) {
    var property = HTML.itemValue(propertyNode);

    HTML.attrs('itemprop', propertyNode).forEach(function(name) {
      /*
      if (typeof data[name] == 'undefined') {
        data[name] = [];
      }

      data[name].push(property);
      */

      // TODO: custom object that always return an array if iterated?
      // TODO: use schema.org ontology to decide if it's a singular or multiple property?

      if (typeof data[name] == 'undefined') {
        data[name] = property; // first item
      } else if (Array.isArray(data[name])) {
        data[name].push(property); // more items
      } else {
        data[name] = [data[name], property]; // second item
      }

    });
  });

  return data;
};

HTML.items = function(itemtype, node) {
  return HTML.select('[itemscope]', node).filter(function(node) {
    if (!itemtype) {
      return true;
    }

    // only find items of a certain itemtype
    return HTML.attrs('itemtype', node).indexOf(itemtype) !== -1;
  });
};

// get a space-separated attribute as an array
HTML.attrs = function(attribute, node) {
  var text = node.getAttribute(attribute) || '';

  return text.split(/\s+/).filter(function(item) {
    return item;
  });
};

// element-scoped querySelectorAll with array return value
HTML.select = function(selector, node) {
  node = node || document;

  // avoid Polymer's querySelectorAll shim
  if (typeof window.unwrap === 'function') {
    node = window.unwrap(node);
  }

  // document queries shouldn't have scope
  if (!(node instanceof HTMLDocument)) {
    selector = ':scope ' + selector;
  }

  var nodes = node.querySelectorAll(selector);

  return Array.prototype.slice.call(nodes);
};

// all property nodes, including those in referenced nodes
HTML.propertyNodes = function(itemprop, node) {
  var nodes = [node];

  HTML.attrs('itemref', node).forEach(function(id) {
    nodes.push(node.ownerDocument.getElementById(id));
  });

  var output = [];

  nodes.forEach(function(node) {
    var scopedProperties = HTML.select('[itemscope] [itemprop]', node);

    HTML.select('[itemprop]', node).filter(function(node) {
      return scopedProperties.indexOf(node) === -1;
    }).filter(function(node) {
      return !itemprop || HTML.attrs('itemprop', node).indexOf(itemprop) !== -1;
    }).forEach(function(node) {
      output.push(node);
    });
  });

  return output;
};

// get the value of a node
HTML.itemValue = function(node) {
  if (node.hasAttribute('itemscope')) {
    return HTML.microdata(node);
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

// extract* functions derived from https://github.com/dnewcome/jath

HTML.extract = function(template, node) {
  node = node || document;

  if (Array.isArray(template)) {
    return HTML.extractArray(template, node);
  }

  if (typeof template === 'object') {
    return HTML.extractObject(template, node);
  }

  return HTML.extractItem(template, node);
};

HTML.extractArray = function(template, node) {
  if (template[0] === null) {
    return template.slice(1).map(function(template) {
      HTML.extract(template, node);
    });
  }

  return HTML.select(template[0], node).map(function(node) {
    return HTML.extract(template[1], node);
  });
};

HTML.extractObject = function(template, node) {
  var output = {};

  Object.keys(template).forEach(function(key) {
    output[key] = HTML.extract(template[key], node);
  });

  return output;
};

HTML.extractItem = function(template, node) {
  if (template.substring(0, 1) === ':') {
    return template.substring(1); // literal value, from template
  }

  var attributeName;
  var attributePosition = template.indexOf('@');

  if (attributePosition !== -1) {
    attributeName = template.substring(attributePosition + 1).trim();
    template = template.substring(0, attributePosition).trim();
  }

  var itemNode = template ? node.querySelector(template) : node;

  if (!itemNode) {
    return null;
  }

  if (attributeName) {
    // special attributes
    if (['href'].indexOf(attributeName) !== -1) {
      return itemNode[attributeName];
    }

    return itemNode.getAttribute(attributeName);
  }

  return itemNode.textContent.trim();
};