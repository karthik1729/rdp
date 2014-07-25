var core = require("./core.js");
var yx = require("yx");

yx.__extends(Throttler, core.Connection);

function Throttler (source,  sink, flow, wire) {
    Throttler.__super__.constructor.apply(this, arguments);
}

Throttler.prototype.transmit = function (data) {
    // throttle
    return Throttler.__super__.transmit.call(this, data);
}

exports.Throttler = Throttler;
