var through   = require('through');
var transform = require('./transform');
var build     = require('./build');

module.exports = function(file, options) {
  var ext = options && options.extension || 'ract';
  var extRe = new RegExp("\\." +  ext +  "$", 'i');
  var source = '';

  if (!extRe.test(file)) return through();

  var buildOpts = {
    requireRactive: options && options.requireRactive || true
  };

  var stream = through(
    function write(chunk) {
      source += chunk;
    },
    function end() {
      try {
        var trans = transform(file, source);
        if (/(^|\/)_[\w-]+.\w+$/.test(file)) {
          stream.queue("module.exports = " + JSON.stringify(trans.template));
          stream.queue(null);
        } else {
          build(source, trans, buildOpts).then(function(component) {
            stream.queue(component);
            stream.queue(null);
          }).catch(function(err){
            stream.emit("error", err);
            stream.queue(null);
          });
        }
      } catch (e) {
        stream.emit("error", e);
        stream.queue(null);
      }
    }
  );

  return stream;
};

module.exports.compilers = build.compilers;
