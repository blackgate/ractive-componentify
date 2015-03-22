var transformSourceMap = require('./transformSourceMap');

require('es6-promise').polyfill();

var compilers = {
  'text/javascript': function(source) {
    return {
      source: source,
      map: {
        mappings: source.split('\n').map(function() {
          return 'AACA'; //[0,0,1,0]
        }).join(';')
      }
    };
  }
};

module.exports = function build (source, result) {

  var compiledStyles, compiledJS = null;

  if (result.script) {
    var compiledJS = compileToJS(result.file, result.script, source);
  }

  compiledStyles = Promise.all(result.styles.map(function(style) {
    return compileToCSS(result.file, style, source);
  })).then(function (styles) {
    return styles.join(' ');
  });

  // Wait for js and css to be compiled, then build the component
  return Promise.all([compiledJS, compiledStyles]).then(function (res) {

    var sourceMap, js = res[0], css = res[1], script = [
      "var Ractive = require('ractive');",
      "var component = { exports: {} };"
    ];

    if (js) {
      if (js.map) {
        // Add three more lines at the begining of the sourceMap
        js.map.mappings = ";;;" + js.map.mappings;
        sourceMap = js.map;
      }
      script.push("(function (component) {");
      script.push(js.source);
      script.push("})(component);");
    }

    if (css && css.length > 0) {
      script.push("component.exports.css = " + JSON.stringify(css) + ";");
    }

    script.push("component.exports.template = " + JSON.stringify(result.template) + ";");

    var components = result.imports.map(function(i) {
      return '  "' + i.name + '": require("' + i.href + '")';
    });

    if (components.length > 0) {
      script.push("component.exports.components = component.exports.components || {};");
      script.push("var components = {\n" + components.join(',\n') + "\n};");
      script.push(
        "for (var k in components) {\n  " +
          "if (components.hasOwnProperty(k))\n    " +
            "component.exports.components[k] = components[k];\n" +
        "}"
      );
    }

    script.push("module.exports = Ractive.extend(component.exports);");

    if (sourceMap) {
      script.push("//# sourceMappingURL=data:application/json;base64," +
        new Buffer(JSON.stringify(sourceMap)).toString('base64'));
    }

    return script.join('\n');

  });
}

function compileToCSS(file, source, originalSource) {
  var compiler = compilers[source.type || 'text/css'];
  var compiled = compiler ? compiler(source.value, file) : { source: source.value };
  return Promise.resolve(compiled).then(function(compiled) {
    return compiled.source;
  });
}

function compileToJS(file, source, originalSource) {
  var compiler = compilers[source.type || 'text/javascript'];
  var compiled = compiler ? compiler(source.value, file) : { source: source.value };

  return Promise.resolve(compiled).then(function(compiled) {
    if (compiled.map) {
      compiled.map = transformSourceMap(originalSource, source, compiled.map);
    }

    return compiled;
  });
}

module.exports.compilers = compilers;
