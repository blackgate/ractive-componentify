var Ractive = require('ractive');

module.exports = function tranform (url, source) {
  var parsed = Ractive.parse(source, {
    noStringify: true,
    interpolate: { script: false, style: false },
    includeLinePositions: true
  });

  var links = [];
  var styles = [];
  var scriptItem;

  // Extract certain top-level nodes from the template. We work backwards
  // so that we can easily splice them out as we go
  var template = parsed.t;

  var i = template.length;

  while ( i-- ) {
    item = template[i];

    if ( item && item.t === 7 ) {
      if ( item.e === 'link' && ( item.a && item.a.rel === 'ractive' ) ) {
        links.push( template.splice( i, 1 )[0] );
      }

      if ( item.e === 'script' ) {
        if ( scriptItem ) {
          throw new Error( 'You can only have one <script> tag per component file' );
        }
        scriptItem = template.splice( i, 1 )[0];
      }

      if ( item.e === 'style' ) {
        styles.push( template.splice( i, 1 )[0] );
      }
    }
  }

  var result = {
    file: url,
    imports: links.map(function (i) {
      return {
        name: i.a.name || i.a.href.match(/([A-Za-z0-9][\w-]*)\.\w+$/)[1],
        href: i.a.href
      };
    }),
    template: parsed,
    styles: styles.map(extractFragment),
    script: scriptItem && extractJSFragment(url, source, scriptItem)
  };

  return result;
};

// get line and column from char position
function getPosition ( lines, char ) {
  var lineEnds, lineNum = 0, lineStart = 0, columnNum;

  lineEnds = lines.map( function ( line ) {
    var lineEnd = lineStart + line.length + 1; // +1 for the newline

    lineStart = lineEnd;
    return lineEnd;
  }, 0 );

  while ( char >= lineEnds[ lineNum ] ) {
    lineStart = lineEnds[ lineNum ];
    lineNum += 1;
  }

  columnNum = char - lineStart;
  return {
    line: lineNum,
    column: columnNum,
    char: char
  };
}

function getAttr ( name, node ) {
  if ( node.a && node.a[name] ) return node.a[name];
  else if ( node.m ) {
    var i = node.m.length;
    while ( i-- ) {
      const a = node.m[i];
      // plain attribute
      if ( a.t === 13 ) {
        if ( a.n === name ) return a.f;
      }
    }
  }
}

function extractFragment(item, value) {
  return {
    type: getAttr( 'type', item ), //item.a && item.a.type,
    value: value || item.f[0]
  };
}

function extractJSFragment (url, source, item) {
  var contentStart, contentEnd, lines, result, mappings;

  // The item.f[0] now trims the new lines at the begining, which makes
  // it unreliable for the sourcemap transformation

  contentStart = source.indexOf('>', (item.q || item.p)[2]) + 1;
  contentEnd = source.indexOf('</', contentStart + item.f[0].length);

  lines = source.split('\n');

  result = extractFragment(item, source.substring(contentStart, contentEnd));
  result.file = url;
  result.start = getPosition(lines, contentStart);
  result.end = getPosition(lines, contentEnd);

  return result;
}
