var $ = require("../index.js"),
    yx = require("yx"),
    _  = require("lodash");

var _super = $.System;

function ArrayGenerator(flow) {

    yx.__extends(this, _super);

    this.__super__.constructor.apply(this, arguments);
    this.values = [];

    var i = 1;
    do {
        this.values.push(i++);
    } while(i < 100);

}

ArrayGenerator.prototype.push = function (token) {
    if (token.start) {
        _.map(this.values, function (e) {
            this.__super__.emit.call(this, e);
        }.bind(this));
    }
}

function RangeAverageFilter (flow) {
    yx.__extends(this, _super);
    this.range = {};
    this.__super__.constructor.apply(this, arguments);
}

RangeAverageFilter.prototype.push = function (data) {
    var range = this.range;

    if (!range.value) {
        range.value = [data];
    } else {
        range.value.push(data);
    }

    if (range.value.length == 5) {
        var sum = 0;
        _.map(range.value, function (e) {
            sum += e;
        });

        var avg = sum / 5;

        this.__super__.emit.call(this, avg);
        range.value.pop();
    }
}

function ConsoleDumper(name, flow) {
    yx.__extends(this, _super);
    this.__super__.constructor.apply(this, arguments);
}

ConsoleDumper.prototype.push = function (data) {
    console.log(data);
}

var flow = new $.Flow( $.S("ex"));
flow.addSystem( $.S("gen1"), ArrayGenerator);
flow.addSystem( $.S("range-avg1"), RangeAverageFilter)
flow.connect( $.S("array-avg-filter"), "gen1", "range-avg1")
flow.addSystem( $.S("condump"), ConsoleDumper)
flow.connect( $.S("dumper"),"range-avg1", "condump")

flow.systems.get("gen1").push( $.T("start"));
// flow.serialize();


