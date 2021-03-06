(function() {
  'use strict';

  var CSV, confirm, format, get;

  confirm = {
    existance: function(possible) {
      return !!(possible && possible !== null);
    },
    number: function(possible) {
      return !isNaN(Number(possible));
    },
    method: function(possible) {
      return !!(possible && possible.constructor && possible.call && possible.apply);
    }
  };

  format = {
    decode: function(string) {
      if (string === "") {
        return string;
      } else if (confirm.number(string)) {
        return Number(string);
      } else if (string.toLowerCase() === "true") {
        return true;
      } else if (string.toLowerCase() === "false") {
        return false;
      } else {
        return string.replace(/\"/gi, '').trim();
      }
    },
    encode: function(array) {
      return array.map(function(element) {
        if (confirm.number(element)) {
          return element;
        } else {
          return '"' + element + '"';
        }
      }).join(",") + "\n";
    },
    split: function(text, delimiter) {
      return text.split(delimiter).map(function(item) {
        return format.decode(item);
      });
    }
  };

  get = {
    keys: function(object) {
      var results = [];
      for (var key in object) results.push(key);
      return results;
    },
    values: function(object) {
      var results = [];
      if (object instanceof Array) {
        results.concat(object);
      } else {
        for (var key in object) results.push(object[key]);
      }
      return results;
    }
  };

  CSV = function(options) {
    options = confirm.existance(options) ? options : {};

    this.options = {};
    this.options.line = confirm.existance(options.line) ? options.line : /(\n|\r)/;
    this.options.delimiter = confirm.existance(options.delimiter) ? options.delimiter : COMMA;
    this.options.header = confirm.existance(options.header) ? options.header : false;
    this.options.stream = confirm.existance(options.stream) ? options.stream : undefined;
    this.options.done = confirm.existance(options.done) ? options.done : undefined;
    this.options.detailed = confirm.existance(options.detailed) ? options.detailed : false;

    return this;
  };

  CSV.prototype.set = function(option, value) {
    switch (option) {
      case "stream":
        this.stream(value);
        break;
      case "done":
        this.done(value);
        break;
      default:
        this.options[option] = value;
    }
  };

  CSV.prototype.stream = function(method) {
    return confirm.method(method) ? this.options.stream = method : "No function provided.";
  };

  CSV.prototype.done = function(method) {
    return confirm.method(method) ? this.options.done = method : "No function provided.";
  };

  CSV.prototype.encode = function(array) {
    var stream, complete, header, supplied, detailed, response, data, getValues;
    stream = this.options.stream;
    complete = this.options.done;
    header = this.options.header;
    supplied = header instanceof Array ? header : false;
    detailed = this.options.detailed;
    data = array;
    response = {};

    if (this.options.header) {
      response.data = supplied ? header : format.encode(get.keys(data[0]));
    } else {
      response.data = "";
    }

    for (var _i = 0, _len = data.length; _i < _len; _i += 1) {
      var object, values;
      object = data[_i];
      values = format.encode(get.values(object));
      if (stream) {
        stream(values);
      } else {
        response.data += values;
      }
      if (complete) {
        complete(response);
      }
    }
    return detailed ? response : response.data;
  };

  CSV.prototype.parse = function(text) {
    var delimiter, stream, complete, header, detailed, data, rows, response;
    // Aliases
    delimiter = this.options.delimiter;
    stream = this.options.stream;
    complete = this.options.done;
    header = this.options.header;
    detailed = this.options.detailed;

    // Empty data array
    data = [];
    rows = text.split(this.options.line).filter(function(item) {
      return item.length > 1 && item[0] !== "";
    });

    if (header) {
      // Create a closure
      (function() {
        var supplied, fields;
        // Has the header been supplied?
        supplied = header instanceof Array;
        // Set the fields
        fields = supplied ? header : format.split(rows[0], delimiter);
        // Set the data rows
        rows = supplied ? rows : rows.slice(1);
        // Go through each row
        for (var _i = 0, _len = rows.length; _i < _len; _i += 1) {
          var row, object;
          // Set the row we're working on
          row = format.split(rows[_i], delimiter);
          // Empty object
          object = {};
          // Loop through the row's values, and apply those to the object
          for (var _n = 0, _len2 = row.length; _n < _len2; _n += 1) {
            object[fields[_n]] = row[_n];
          }
          if (stream) {
            stream(object);
          } else {
            data.push(object);
          }
        }
        // Return a JSON object containing the fields array and the data array
        response = { fields: fields, data: data };
      })();
    // If there isn't a header
    } else {
      // Create a closure
      (function() {
        // Go through each row
        for (var _i = 0, _len = rows.length; _i < _len; _i += 1) {
          var row, object;
          // Set the row we're working on
          row = format.split(rows[_i], delimiter);
          // Empty array
          object = [];
          // Loop through the row's values, and apply those to the object
          for (var _n = 0, _len2 = row.length; _n < _len2; _n += 1) {
            object.push(row[_n]);
          }
          if (stream) {
            stream(object);
          } else {
            data.push(object);
          }
        }
        // Return a JSON object containing the data array
        response = { data: data };
      })();
    }
    response = detailed ? response : response.data;
    if (complete) complete(reponse);
    return response;
  };

  if (typeof define === "function" && define.amd) {
    define(CSV);
  } else if (typeof module === "object" && module.exports) {
    module.exports = CSV;
  } else {
    window.CSV = CSV;
  }

})();