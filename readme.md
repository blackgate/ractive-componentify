# ractive-componentify

A versatile browserify transform for ractive components, folowing the [Ractive.js component specification](https://github.com/ractivejs/component-spec).

Inspired by ractiveify, it lets you compile the component contents of the script and style tags using a language of your choice.

It also generates sourcemaps that map directly to the component original source.

## Install

```
npm install ractive-componentify --save
```

## Configuring the browserify transform


```javascript
var browserify   = require('browserify');
var componentify = require('ractive-componentify');

var b = browserify();
b.transform(componentify, {

  // extension to parse
  // default: 'ract'
  extension: 'ract',

  // require a ractive instance when requiring components
  // dafault: true
  requireRactive: true

});
b.bundle();
```

## Defining your own compilers

Compilers are defined using the same value of the type attribute of the script and style tags, like this:

```javascript
var componentify = require('ractive-componentify');

componentify.compilers["text/es6"] = function (source, file) {
  // Your compile code goes here
  return {
    source: /* compiled source */,
    map: /* resulting sourcemap */
  };
}
```

You can also return a promise

```javascript
var componentify = require('ractive-componentify');

componentify.compilers["text/es6"] = function (source, file) {
  // Your compile code goes here
  return compiler.then(function(output) {
    return {
      source: /* compiled source */,
      map: /* resulting sourcemap */
    };
  });
}
```

Currently Sourcemaps are only supported in js compilers.

You can also override the default `text/javascript` and `text/css` compilers.

## Requiring components

```javascript
var Main = require('./components/main.ract');

var app = new Main({
  el: '#main',
  data: {
    title: 'My App'
  }
});
```
