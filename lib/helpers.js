var yx = require("yx");
var core = require("core");

yx.__extends(FlowTracer, core.Connection);

function FlowTracer (source,  sink, flow, wire) {
    FlowTracer.__super__.constructor.apply(this, arguments);
}

FlowTracer.prototype.transmit = function (data) {
    console.log("from the outlet " + this.wire.outlet.name +  " of " + this.source.name);
    console.log(data);
    console.log("to the inlet" + this.wire.inlet.name +  " of " + this.sink.name);
    return FlowTracer.__super__.transmit.call(this, data);
}

exports.FlowTracer = FlowTracer;
