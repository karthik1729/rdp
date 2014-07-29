var core = require("./core.js");
var yx = require("yx");

yx.__extends(WireTracer, core.Wire);

function WireTracer (b, source,  sink, outlet, inlet) {
    WireTracer.__super__.constructor.apply(this, arguments);
}

WireTracer.prototype.transmit = function (data) {
    console.log("from " + this.outlet.name + " of " + this.source.name);
    console.log(data);
    console.log("to " + this.inlet.name + " of " + this.sink.name);
    return WireTracer.__super__.transmit.call(this, data);
}

exports.WireTracer = WireTracer;
