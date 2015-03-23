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
        name: i.a.name || i.a.href.match(/([\w-]+)\.\w+$/)[1],
        href: i.a.href
      };
    }),
    template: parsed,
    styles: styles.map(extractFragment),
    script: scriptItem && extractJSFragment(url, source, scriptItem)
  };

  return result;
};

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

function extractFragment(item) {
  return {
    type: item.a && item.a.type,
    value: item.f[0]
  };
}

function extractJSFragment (url, source, item) {
  var contentStart, contentEnd, lines, result, mappings;

  result = extractFragment(item);

  result.file = url;

  contentStart = source.indexOf( '>', item.p[2] ) + 1;
  contentEnd = contentStart + item.f[0].length;

  lines = source.split( '\n' );

  result.start = getPosition( lines, contentStart );
  result.end = getPosition( lines, contentEnd );

  return result;
}
