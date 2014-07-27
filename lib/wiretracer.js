var core = require("./core.js");
var yx = require("yx");

yx.__extends(WireTracer, core.Wire);

function WireTracer (source,  sink, flow, wire) {
    WireTracer.__super__.constructor.apply(this, arguments);
}

WireTracer.prototype.transmit = function (data) {
    console.log("from " + this.wire.outlet.name + " of " + this.source.name);
    console.log(data);
    console.log("to " + this.wire.inlet.name + " of " + this.sink.name);
    return WireTracer.__super__.transmit.call(this, data);
}

exports.WireTracer = WireTracer;
