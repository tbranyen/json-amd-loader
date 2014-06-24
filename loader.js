define(function(require, exports) {
  "use strict";

  // Cache used to map configuration options between load and write.
  var buildMap = {};

  exports.load = function(name, req, load, config) {
    // If we're in a build, bail out.
    if (config.isBuild) {
      return load();
    }

    var xhr = new XMLHttpRequest();

    xhr.onreadystatechange = function() {
      if (xhr.readyState === 4) {
        if (config.isBuild) {
          return load();
        }

        try {
          load(buildMap[name] = JSON.parse(xhr.responseText));
        }
        catch (ex) {
          load.error(ex);
        }
      }
    };

    // Pass errors through.
    xhr.onerror = load.error;

    xhr.open("GET", req.toUrl(name + ".json"), true);
    xhr.send(null);
  };

  exports.write = function(pluginName, moduleName, write) {
    var stringified = JSON.stringify(buildMap[moduleName]);
    write(["define('", pluginName, "!", moduleName, "', ", stringified, ")"]);
  };
});
