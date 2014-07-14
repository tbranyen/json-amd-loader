define(function(require, exports) {
  "use strict";

  // Cache used to map configuration options between load and write.
  var buildMap = {};

	// Alias the correct `nodeRequire` method.
	var nodeRequire = typeof requirejs === "function" && requirejs.nodeRequire;

	function configure(config) {
    // Default settings point to the project root and using html files.
    var settings = {};

    // Set the custom passed in template settings.
    _.extend(_.templateSettings, settings.templateSettings);

    return settings;
  }

  exports.load = function(name, req, load, config) {
		var url = require.toUrl(name + ".json");

    // Builds with r.js require Node.js to be installed.
    if (config.isBuild) {
      // If in Node, get access to the filesystem.
      var fs = nodeRequire("fs");

      try {
        // First try reading the filepath as-is.
        contents = String(fs.readFileSync(url));
      } catch(ex) {
        // If it failed, it's most likely because of a leading `/` and not an
        // absolute path.  Remove the leading slash and try again.
        if (url[0] === "/") {
          url = url.slice(1);
        }

        // Try reading again with the leading `/`.
        contents = String(fs.readFileSync(url));
      }

			console.log(url, contents);

      // Read in the file synchronously, as RequireJS expects, and return the
      // contents.  Process as a Lo-Dash template.
      buildMap[name] = contents;

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

		write(["define('", pluginName, "!", moduleName, "', ", stringified, ")"].join(""));
  };
});
