var $ = require("../index.js"),
    yx = require("yx"),
    _  = require("lodash");

var _super = $.System;

function Bang(flow) {
    yx.__extends(this, _super);
    this.__super__.constructor.apply(this, arguments);
}

Bang.prototype.raise = function (message) {
    console.log("bang: " + message )
}

var bang = $.S("bang");
bang.events = ["foo"]

var flow = new $.Flow( $.S("ex"));
flow.bus.addDiscreteSystem(bang, Bang)
flow.bus.trigger(new $.Event("foo"))

// flow.serialize();


