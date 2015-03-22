# ractive-componentify

A versatile browserify tranform for ractive components, folowing the [Ractive.js component specification](https://github.com/ractivejs/component-spec).

Inspired by ractiveify, it lets you compile the component contents of the script and style tags from a language of your choice.

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
b.transform(componentify);
b.bundle();
```

By default ractive-componentify uses the `ract` extension. If you want to use another extension (`html` for example), you can do it this way:

```javascript
var browserify   = require('browserify');
var componentify = require('ractive-componentify');

var b = browserify();
b.transform(componentify, { extension: 'html' });
b.bundle();
```

## Defining your own compilers

You define compilers by the type specified on the script and style tags, like this:

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

Currentlty Sourcemaps are only supported for js compilers.

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