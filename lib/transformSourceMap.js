var vlq = require('vlq');

module.exports = function(originalSource, source, map) {

  var mappings = map.mappings.split(';').map(function(i) {
    return i.split(',')
      .filter(function(v) { return v.length > 0; })
      .map(function(v) { return vlq.decode(v); });
  });

  // find the first line
  for (var i = 0 ; i < mappings.length ; i++) {

    var lineMap = mappings[i];

    if (lineMap.length > 0) {

      var lineNum = lineMap[0][2];

      // change the starting line number
      lineMap[0][2] += source.start.line;

      // change starting column on the first line
      if (lineNum == 0) {
        lineMap[0][3] += source.start.column;

        // Search for next line and corrects the column
        for (var j = i + 1 ; j < mappings.length ; j++) {
          var nextLineMap = mappings[j];
          if (nextLineMap.length > 0) {
            nextLineMap[0][3] -= source.start.column;
            break;
          }
        }
      }
      break;
    }
  }

  return {
    version: 3,
    sources: [ source.file ],
    sourcesContent: [ originalSource ],
    names: map.names || [],
    file: source.file,  
    mappings: mappings.map(function(i) {
      return i.map(function(j) {
        return vlq.encode(j);
      }).join(',');
    }).join(';')
  };

}
