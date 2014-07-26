var core = require("./core.js");
var yx = require("yx");

yx.__extends(ConnectionTracer, core.Connection);

function ConnectionTracer (source,  sink, flow, wire) {
    ConnectionTracer.__super__.constructor.apply(this, arguments);
}

ConnectionTracer.prototype.transmit = function (data) {
    console.log("from " + this.wire.outlet.name + " of " + this.source.name);
    console.log(data);
    console.log("to " + this.wire.inlet.name + " of " + this.sink.name);
    return ConnectionTracer.__super__.transmit.call(this, data);
}

exports.ConnectionTracer = ConnectionTracer;
