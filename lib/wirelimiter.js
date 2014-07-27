var core = require("./core.js");
var yx = require("yx");

yx.__extends(WireLimiter, core.Wire);

function WireLimiter (source,  sink, flow, wire) {
    WireLimiter.__super__.constructor.apply(this, arguments);
}

WireLimiter.prototype.transmit = function (data) {
    // throttle
    return WireLimiter.__super__.transmit.call(this, data);
}

exports.WireLimiter = WireLimiter;
