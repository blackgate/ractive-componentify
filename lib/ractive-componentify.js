var through   = require('through');
var transform = require('./transform');
var build     = require('./build');

module.exports = function(file, options) {
  var ext = options && options.extension || 'ract';
  var extRe = new RegExp("\\." +  ext +  "$", 'i');
  var source = '';

  if (!extRe.test(file)) return through();

  var stream = through(
    function write(chunk) {
      source += chunk;
    },
    function end() {
      var trans = transform(file, source);
      build(source, trans).then(function(component) {
        stream.queue(component);
        stream.queue(null);
      }).catch(function(err){
        stream.emit("error", err);
        stream.queue(null);
      });
    }
  );

  return stream;
};

module.exports.compilers = build.compilers;
