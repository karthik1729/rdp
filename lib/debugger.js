module.exports = function (name) {

    this.__cb = [];

    this.step = function () {
        if (this.__cb.length > 0) {
            var cb = this.__cb.pop();
            cb.apply(this, []);
        }
    };

    this.push = function (data, inlet, conflict) {
        this.__cb.push(function () {
            data.prop("__step", false);
            if (conflict)
                return conflict.call(this, data, inlet);
            else
                this.__proto__.push.call(this, data, inlet);
        }.bind(this));
        data.prop("__step", true);
        this.debug(data);
    }

   this.emit = function (data, outlet, conflict) {
        this.__cb.push(function () {
            data.prop("__step", false);
            if (conflict)
                return conflict.call(this, data, outlet);
            else
                this.__proto__.emit.call(this, data, outlet);
        }.bind(this));
        data.prop("__step", true);
        this.debug(data);
    }

    this.interrupt = function (signal, conflict) {
        this.__cb.push(function () {
            data.prop("__step", false);
            if (conflict)
                return conflict.call(this, signal);
            else
                this.__proto__.raise.call(this,signal);
        }.bind(this));
        signal.prop("__step", true);
        this.debug(signal);
    }
}

