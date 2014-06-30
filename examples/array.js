var rdp = require("../index.js"),
    yx = require("yx"),
    _  = require("lodash");

_super = rdp.System;

function Bang(name, flow) {

    var self = this;
    yx.__extends(this, _super);

    this.__super__.constructor.apply(this, arguments);

    this.bang = function () {
        self.prototype.emit("bang");
    }

}

function ArrayGenerator(name,flow) {

    var self = this;
    yx.__extends(this, _super);

    this.__super__.constructor.apply(this, arguments);
    this.values = [];

    var i = 1;
    do {
       this.values.push(i++);
    } while(i < 100);

    this.prototype.push = function (data) {
        if (data == "bang") {
            _.map(self.values, function (e) {
                self.prototype.emit(e);
            });
        }
    }

}

function RangeAverageFilter (name, flow) {

   var self = this;
   yx.__extends(this, _super);

   this.__super__.constructor.apply(this, arguments);

    this.prototype.push = function (data) {
        var range = self.flow.bus.getEntity("range", true);

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

            self.prototype.emit(avg);
            range.value.pop();
        }
    }

}

function ConsoleDumper(name, flow) {

    var self = this;
    yx.__extends(this, _super);

    this.__super__.constructor.apply(this, arguments);

    this.prototype.push = function (data) {
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
flow.systems["bang1"].bang();

