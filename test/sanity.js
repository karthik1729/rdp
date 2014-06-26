var rdp = require("../index.js"),
    yx = require("yx"),
    _  = require("lodash");

var Bang;
function Bang(_super) {

    yx.__extends(Bang, _super);

    function Bang(name,flow) {

        Bang.__super__.constructor(name, flow);

        this.bang = function () {
            this.__super__.emit("bang");
        }
    }

    return Bang;

})(rdp.System);

var ArrayGenerator;
ArrayGenerator = (function (_super) {
    yx.__extends(ArrayGenerator, _super);

    function ArrayGenerator(name,flow) {

        ArrayGenerator.__super__.constructor(name, flow);
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

    return ArrayGenerator;

})(rdp.System);

var RangeAverageFilter = (function (_super) {

    yx.__extends(RangeAverageFilter, _super);

    function RangeAverageFilter(name, flow) {

        RangeAverageFilter.__super__.constructor(name, flow);

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

    return RangeAverageFilter;

})(rdp.System);


var ConsoleDumper = (function (_super) {

    yx.__extends(ConsoleDumper, rdp.System);

   function ConsoleDumper(name, flow) {
        ConsoleDumper.__super__.constructor(name, flow);

        this.push = function (data) {
            console.log(data);
        }
    }

   return ConsoleDumper;
})(rdp.System);

var flow = new rdp.Flow();
flow.addSystem(new Bang("bang1", flow));
flow.addSystem(new ArrayGenerator("gen1", flow));
flow.addConnection(new rdp.Connection("bang1", flow, "bang1", "gen1"));
flow.addSystem(new RangeAverageFilter("range-avg1", flow));
flow.addConnection(new rdp.Connection("array-avg-filter", flow, "gen1", "range-avg1"));
flow.addSystem(new ConsoleDumper("condump", flow));
flow.addConnection(new rdp.Connection("dumper",  flow, "range-avg1", "condump"));
flow.start();

flow.systems["bang1"].bang();

