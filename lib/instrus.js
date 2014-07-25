function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min)) + min;
}

function randomElement(array) {
  var min = min;
  max = array.length;
  return array[randomInt(min, max)]
}

exports.randomInt = randomInt;
exports.randomElement = randomElement;
exports.tracer = require("./tracer.js");
exports.debugger = require("./debugger.js");
exports.profiler = require("./profiler.js");
exports.Throttler = require("./throttler.js").Throttler;



