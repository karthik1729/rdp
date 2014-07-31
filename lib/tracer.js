module.exports = function (name) {

    this.push = function (data, inlet, conflict) {
        if (this.symbol) {
            var symbol = this.symbol.name;
        } else {
            var symbol = "Unknown";
        }

        console.log("tracing push of " + symbol);
        console.log(data);
        console.log("tracing end");

        if (conflict)
            return conflict.call(this, data, inlet);
        else
            return this.__proto__.push.call(this, data, inlet);
    }

   this.emit = function (data, outlet, conflict) {
        if (this.symbol) {
            var symbol = this.symbol.name;
        } else {
            var symbol = "Unknown";
        }

        console.log("tracing push of " + symbol);
        console.log(data);
        console.log("tracing end");

        if (conflict)
            return conflict.call(this, data, inlet);
        else
            return this.__proto__.emit.call(this, data, inlet);
    }

    this.raise = function (signal, conflict) {
        console.log("tracing event " + signal.name);
        console.log(signal.payload);
        console.log("tracing end");
        if (conflict)
            return conflict.call(this, signal);
        else
            return this.__proto__.raise.call(this, signal);

    }
}

