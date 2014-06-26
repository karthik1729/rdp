var rdp = require("../index.js"),
    yx = require("yx"),
    _  = require("lodash");

_super = rdp.System;

function Bang(name, flow) {

    yx.__extends(this, _super);

    this.__super__.constructor.apply(this, arguments);

    this.push = function (data) {
        this.__super__.emit("bang");
    }

    this.bang = function (bang) {
        this.push("bang");
    }

}

function ArrayGenerator(name,flow) {

    yx.__extends(this, _super);


    this.__super__.constructor.apply(this, arguments);
    this.values = [];

    var i = 1;
    do {
        this.values.push(i++);
    } while(i < 100);

    this.push = function (data) {
        if (data == "bang") {
            _.map(this.values, function (e) {
                this.__super__.emit(e);
            });
        }
    }

}

function RangeAverageFilter (name, flow) {

    yx.__extends(this, _super);

   this.__super__.constructor.apply(this, arguments);

    this.push = function (data) {
        var range = RangeAverageFilter.__super__.flow.bus.getEntity("range", true);

        if (range.length == 5) {
            var sum = 0;
            _.map(range, function (e) {
                sum += e;
            });

            var avg = sum / 5;

            this.__super__.emit(avg);
        }
    }

}

function ConsoleDumper(name, flow) {

    yx.__extends(this, _super);

    this.__super__.constructor.apply(this, arguments);

    this.push = function (data) {
        console.log(data);
    }

}

var flow = new rdp.Flow();
flow.addSystem(new Bang("bang1", flow));
flow.addSystem(new ArrayGenerator("gen1", flow));
flow.addConnection(new rdp.Connection("bang-gen", flow, "bang1", "gen1"));
flow.addSystem(new RangeAverageFilter("range-avg1", flow));
flow.addConnection(new rdp.Connection("array-avg-filter", flow, "gen1", "range-avg1"));
flow.addSystem(new ConsoleDumper("condump", flow));
flow.addConnection(new rdp.Connection("dumper",  flow, "range-avg1", "condump"));
flow.start();

flow.systems["bang1"].push("bang");

