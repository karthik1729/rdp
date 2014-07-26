var core = require("./core.js");
var yx = require("yx");

yx.__extends(ConnectionThrottler, core.Connection);

function ConnectionThrottler (source,  sink, flow, wire) {
    ConnectionThrottler.__super__.constructor.apply(this, arguments);
}

ConnectionThrottler.prototype.transmit = function (data) {
    // throttle
    return ConnectionThrottler.__super__.transmit.call(this, data);
}

exports.ConnectionThrottler = ConnectionThrottler;
