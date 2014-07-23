var Bus, Cell, Component, Connection, D, Data, Entity, Event, Flow, Glitch, NameSpace, S, Signal, Store, Symbol, System, T, Token, Wire, clone, mixins, start, stop, uuid,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  __slice = [].slice,
  __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

uuid = require("node-uuid");

clone = require("clone");

mixins = require("./mixins.js");

Symbol = (function() {
  function Symbol(name, object, ns, attrs) {
    this.name = name;
    this.object = object;
    this.ns = ns;
    if (attrs != null) {
      this.attrs(attrs);
    }
  }

  Symbol.prototype.attrs = function(kv) {
    var k, v, _i, _len, _results;
    _results = [];
    for (v = _i = 0, _len = kv.length; _i < _len; v = ++_i) {
      k = kv[v];
      _results.push(this[k] = v);
    }
    return _results;
  };

  Symbol.prototype.is = function(symbol) {
    if (symbol.name === this.name) {
      if (symbol.object === this.object) {
        return true;
      }
      if ((symbol.object === null) && (this.object === null)) {
        return true;
      }
    } else {
      return false;
    }
  };

  Symbol.prototype.toString = function() {
    if (this.ns != null) {
      return this.ns.name + this.ns.sep + this.name;
    } else {
      return this.name;
    }
  };

  return Symbol;

})();

S = function(name, object, ns, attrs) {
  return new Symbol(name, object, ns, attrs);
};

NameSpace = (function() {
  function NameSpace(name, sep) {
    this.name = name;
    this.elements = {};
    this.sep = sep || ".";
  }

  NameSpace.prototype.bind = function(symbol, object) {
    var name;
    name = symbol.name;
    symbol.object = object;
    object.symbol = symbol;
    this.elements[name] = symbol;
    symbol.ns = this;
    return symbol;
  };

  NameSpace.prototype.unbind = function(name) {
    var symbol;
    symbol = this.elements[name];
    delete this.elements[name];
    symbol.ns = void 0;
    return symbol;
  };

  NameSpace.prototype.symbol = function(name) {
    return this.elements[name];
  };

  NameSpace.prototype.has = function(name) {
    if (this.elements[name] != null) {
      return true;
    } else {
      return false;
    }
  };

  NameSpace.prototype.object = function(name) {
    return this.elements[name].object;
  };

  NameSpace.prototype.symbols = function() {
    var k, symbols, v, _ref;
    symbols = [];
    _ref = this.elements;
    for (k in _ref) {
      v = _ref[k];
      symbols.push(v);
    }
    return symbols;
  };

  NameSpace.prototype.objects = function() {
    var k, objects, v, _ref;
    objects = [];
    _ref = this.elements;
    for (k in _ref) {
      v = _ref[k];
      objects.push(v.object);
    }
    return objects;
  };

  return NameSpace;

})();

Data = (function() {
  function Data(props) {
    if (props != null) {
      this.props(props);
    }
  }

  Data.prototype.props = function(kv) {
    var k, v;
    for (k in kv) {
      v = kv[k];
      this[k] = v;
    }
    return this.validator;
  };

  Data.prototype.validator = function() {
    return this;
  };

  return Data;

})();

D = function(props) {
  return new Data();
};

Signal = (function(_super) {
  __extends(Signal, _super);

  function Signal(name, payload, props) {
    this.name = name;
    this.payload = payload;
    Signal.__super__.constructor.call(this, props);
  }

  return Signal;

})(Data);

Event = (function(_super) {
  __extends(Event, _super);

  function Event(name, payload, props) {
    Event.__super__.constructor.call(this, name, message, props);
    this.ts = new Date().getTime();
  }

  return Event;

})(Signal);

Glitch = (function(_super) {
  __extends(Glitch, _super);

  function Glitch(name, context, props) {
    this.name = name;
    this.context = context;
    Glitch.__super__.constructor.call(this, props);
  }

  return Glitch;

})(Data);

Token = (function(_super) {
  __extends(Token, _super);

  function Token(value, sign, props) {
    Token.__super__.constructor.call(this, props);
    this.signs = [];
    this.stamp(sign, value);
  }

  Token.prototype.value = function() {
    return this.value;
  };

  Token.prototype.by = function(index) {
    if (index != null) {
      if (this.signs[index] != null) {
        return this.signs[index];
      } else {
        return S("Unknown");
      }
    }
    if (this.signs.length > 0) {
      return this.signs[this.signs.length - 1];
    } else {
      return S("Unknown");
    }
  };

  Token.prototype.stamp = function(sign, value) {
    if (value) {
      if (this[value]) {
        delete this[value];
      }
      this.value = value;
      if (typeof this.value === "string") {
        this[this.value] = true;
      }
    }
    if (sign != null) {
      return this.signs.push(sign);
    } else {
      return this.signs.push(S("Unknown"));
    }
  };

  return Token;

})(Data);

start = function(sign, props) {
  return new Token("start", sign, props);
};

stop = function(sign, props) {
  return new Token("stop", sign, props);
};

T = function(value, sign, props) {
  return new Token(value, sign, props);
};

Component = (function(_super) {
  __extends(Component, _super);

  function Component(name, props) {
    this.name = name;
    Component.__super__.constructor.call(this, name);
  }

  return Component;

})(Data);

Entity = (function(_super) {
  __extends(Entity, _super);

  function Entity(tags, props) {
    this.tags = tags;
    this.id = uuid.v4();
    this.components = new NameSpace("components");
    Entity.__super__.constructor.call(this, props);
  }

  Entity.prototype.add = function(symbol, component) {
    return this.components.bind(symbol, component);
  };

  Entity.prototype.remove = function(name) {
    return this.components.unbind(name);
  };

  Entity.prototype.has = function(name) {
    return this.components.has(name);
  };

  Entity.prototype.part = function(name) {
    return this.components.symbol(name);
  };

  return Entity;

})(Data);

Cell = (function(_super) {
  __extends(Cell, _super);

  function Cell(tags, props) {
    Cell.__super__.constructor.call(this, tags, props);
    this.observers = new NameSpace("observers");
  }

  Cell.prototype.notify = function(event) {
    var ob, _i, _len, _ref, _results;
    _ref = this.observers.objects();
    _results = [];
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      ob = _ref[_i];
      _results.push(ob.raise(event));
    }
    return _results;
  };

  Cell.prototype.add = function(component) {
    var event;
    Cell.__super__.add.call(this, component);
    event = new Event("component-added", {
      component: component,
      cell: this
    });
    return this.notify(event);
  };

  Cell.prototype.remove = function(name) {
    var event;
    Cell.__super__.remove.call(this, name);
    event = new Event("component-removed", {
      component: component,
      cell: this
    });
    return this.notify(event);
  };

  Cell.prototype.observe = function(symbol, system) {
    return this.observers.bind(symbol, system);
  };

  Cell.prototype.forget = function(name) {
    return this.observers.unbind(name);
  };

  Cell.prototype.step = function() {
    var args, fn;
    fn = arguments[0], args = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
    return fn.apply(this, args);
  };

  Cell.prototype.clone = function() {
    return clone(this);
  };

  return Cell;

})(Entity);

System = (function() {
  function System(flow, conf) {
    this.flow = flow;
    this.conf = conf;
    this.inlets = new NameSpace("inlets");
    this.inlets.bind(new Symbol("sysin"), []);
    this.inlets.bind(new Symbol("feedback"), []);
    this.outlets = new NameSpace("outlets");
    this.outlets.bind(new Symbol("sysout"), []);
    this.outlets.bind(new Symbol("syserr"), []);
    this.state = [];
    this.r = {};
  }

  System.prototype.top = function(index) {
    if (index != null) {
      if (this.state[index] != null) {
        return this.state[index];
      } else {
        return S("Unknown");
      }
    }
    if (this.state.length > 0) {
      return this.state[this.state.length - 1];
    } else {
      return S("Unknown");
    }
  };

  System.prototype.input = function(data, inlet) {
    return data;
  };

  System.prototype.output = function(data, outlet) {
    return data;
  };

  System.prototype.STOP = function(stop_token) {};

  System.prototype.push = function(data, inlet_name) {
    var input_data;
    inlet_name = inlet_name || "sysin";
    input_data = this.input(data, inlet_name);
    if (input_data instanceof Glitch) {
      return this.error(input_data);
    } else {
      return this.process(input_data, inlet_name);
    }
  };

  System.prototype.goto_with = function(inlet_name, data) {
    return this.push(data, inlet_name);
  };

  System.prototype.process = function(data, inlet_name) {
    return this.emit(data, "stdout");
  };

  System.prototype.send = function(data, outlet_name) {
    var connection, outlet, _i, _len, _ref, _results;
    _ref = this.outlets.symbols();
    _results = [];
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      outlet = _ref[_i];
      if (outlet.name === outlet_name) {
        _results.push((function() {
          var _j, _len1, _ref1, _results1;
          _ref1 = outlet.object;
          _results1 = [];
          for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
            connection = _ref1[_j];
            _results1.push(connection.object.transmit(data));
          }
          return _results1;
        })());
      } else {
        _results.push(void 0);
      }
    }
    return _results;
  };

  System.prototype.emit = function(data, outlet_name) {
    var output_data;
    outlet_name = outlet_name || "sysout";
    output_data = this.output(data, outlet_name);
    if (output_data instanceof Glitch) {
      this.error(output_data);
      return;
    }
    return this.send(output_data, outlet_name);
  };

  System.prototype.error = function(data) {
    return this.send(data, "syserr");
  };

  System.prototype.raise = function(signal) {
    return this.react(signal);
  };

  System.prototype.react = function(signal) {};

  System.prototype.show = function(data) {};

  return System;

})();

Wire = (function() {
  function Wire(outlet, inlet) {
    this.outlet = outlet;
    this.inlet = inlet;
  }

  return Wire;

})();

Connection = (function() {
  function Connection(source, sink, flow, wire) {
    this.flow = flow;
    this.source = this.flow.systems.symbol(source);
    this.sink = this.flow.systems.symbol(sink);
    this.wire = wire || new Wire(this.source.object.outlets.symbol("sysout"), this.sink.object.inlets.symbol("sysin"));
  }

  Connection.prototype.transmit = function(data) {
    return this.sink.object.push(data, this.wire.inlet.name);
  };

  return Connection;

})();

Store = (function() {
  function Store() {
    this.entities = new NameSpace("entities");
  }

  Store.prototype.add = function(symbol, tags, props) {
    var entity;
    tags = tags || [];
    entity = new Entity(tags, props);
    this.entities.bind(symbol, entity);
    return symbol;
  };

  Store.prototype.has = function(name) {
    return this.entities.has(name);
  };

  Store.prototype.entity = function(name) {
    return this.entities.object(name);
  };

  Store.prototype.remove = function(name) {
    return this.entities.unbind(name);
  };

  Store.prototype.id = function(id) {
    var entity, _i, _len, _ref;
    _ref = this.entities.objects();
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      entity = _ref[_i];
      if (entity.id === id) {
        return entity;
      }
    }
    return null;
  };

  Store.prototype.removeId = function(id) {
    var entity_symbol, _i, _len, _ref;
    _ref = this.entities.symbols();
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      entity_symbol = _ref[_i];
      if (entity_symbol.object === id) {
        this.entities.unbind(entity_symbol.name);
      }
    }
    return null;
  };

  Store.prototype.tags = function(tags) {
    var entities, entity, tag, _i, _j, _len, _len1, _ref;
    entities = [];
    _ref = this.entities.objects();
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      entity = _ref[_i];
      for (_j = 0, _len1 = tags.length; _j < _len1; _j++) {
        tag = tags[_j];
        if (__indexOf.call(entity.tags, tag) >= 0) {
          entities.push(entity);
        }
      }
    }
    return entities;
  };

  return Store;

})();

Bus = (function(_super) {
  __extends(Bus, _super);

  function Bus(name, sep) {
    this.name = name;
    Bus.__super__.constructor.call(this, this.name, sep);
  }

  Bus.prototype.trigger = function(signal) {
    var obj, _i, _len, _ref, _results;
    _ref = this.objects();
    _results = [];
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      obj = _ref[_i];
      _results.push(obj.raise(signal));
    }
    return _results;
  };

  return Bus;

})(NameSpace);

Flow = (function() {
  function Flow(connectionClass, storeClass, busClass) {
    storeClass = storeClass || Store;
    busClass = busClass || Bus;
    this.connectionClass = connectionClass || Connection;
    this.store = new storeClass();
    this.bus = new busClass("systems");
    this.systems = this.bus;
    this.connections = new NameSpace("bus.connections");
  }

  Flow.prototype.connect = function(source, sink, wire, symbol) {
    var connection, name, outlet, _i, _len, _ref, _results;
    connection = new this.connectionClass(source, sink, this, wire);
    if (!symbol) {
      name = "" + source + "::" + connection.wire.outlet.name + "-" + sink + "::" + connection.wire.inlet.name;
      symbol = new Symbol(name);
    }
    this.connections.bind(symbol, connection);
    _ref = connection.source.object.outlets.symbols();
    _results = [];
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      outlet = _ref[_i];
      if (outlet.name === connection.wire.outlet.name) {
        _results.push(outlet.object.push(symbol));
      } else {
        _results.push(void 0);
      }
    }
    return _results;
  };

  Flow.prototype.pipe = function(source, wire, sink) {
    return this.connect(source, sink, wire);
  };

  Flow.prototype.disconnect = function(name) {
    var conn, connection, connections, outlet, _i, _j, _len, _len1, _ref, _ref1, _results;
    connection = this.connection(name);
    this.connections.unbind(name);
    _ref = connection.source.object.outlets.symbols();
    _results = [];
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      outlet = _ref[_i];
      if (outlet.name === connection.wire.outlet.name) {
        connections = [];
        _ref1 = outlet.object;
        for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
          conn = _ref1[_j];
          if (conn.name !== name) {
            connections.push(conn);
          }
        }
        _results.push(outlet.object = connections);
      } else {
        _results.push(void 0);
      }
    }
    return _results;
  };

  Flow.prototype.connection = function(name) {
    return this.connections.object(name);
  };

  Flow.prototype.hasConnection = function(name) {
    return this.connections.has(name);
  };

  Flow.prototype.add = function(symbol, systemClass, conf) {
    var system;
    system = new systemClass(this, conf);
    return this.bus.bind(symbol, system);
  };

  Flow.prototype.has = function(name) {
    return this.bus.has(name);
  };

  Flow.prototype.system = function(name) {
    return this.bus.object(name);
  };

  Flow.prototype.remove = function(name) {
    var system;
    system = this.bus.object(name);
    system.push(this.STOP);
    return this.bus.unbind(name);
  };

  return Flow;

})();

exports.Symbol = Symbol;

exports.NameSpace = NameSpace;

exports.S = S;

exports.Data = Data;

exports.D = D;

exports.Signal = Signal;

exports.Event = Event;

exports.Glitch = Glitch;

exports.Token = Token;

exports.start = start;

exports.stop = stop;

exports.T = T;

exports.Component = Component;

exports.Entity = Entity;

exports.Cell = Cell;

exports.System = System;

exports.Wire = Wire;

exports.Connection = Connection;

exports.Store = Store;

exports.Bus = Bus;

exports.Flow = Flow;

exports.mixins = mixins;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29yZS5qcyIsInNvdXJjZXMiOlsiY29yZS5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsSUFBQSxxS0FBQTtFQUFBOzs7dUpBQUE7O0FBQUEsSUFBQSxHQUFPLE9BQUEsQ0FBUSxXQUFSLENBQVAsQ0FBQTs7QUFBQSxLQUNBLEdBQVEsT0FBQSxDQUFRLE9BQVIsQ0FEUixDQUFBOztBQUFBLE1BRUEsR0FBUyxPQUFBLENBQVEsYUFBUixDQUZULENBQUE7O0FBQUE7QUFNaUIsRUFBQSxnQkFBRSxJQUFGLEVBQVMsTUFBVCxFQUFrQixFQUFsQixFQUFzQixLQUF0QixHQUFBO0FBQ1QsSUFEVSxJQUFDLENBQUEsT0FBQSxJQUNYLENBQUE7QUFBQSxJQURpQixJQUFDLENBQUEsU0FBQSxNQUNsQixDQUFBO0FBQUEsSUFEMEIsSUFBQyxDQUFBLEtBQUEsRUFDM0IsQ0FBQTtBQUFBLElBQUEsSUFBRyxhQUFIO0FBQ0ksTUFBQSxJQUFDLENBQUEsS0FBRCxDQUFPLEtBQVAsQ0FBQSxDQURKO0tBRFM7RUFBQSxDQUFiOztBQUFBLG1CQUlBLEtBQUEsR0FBTyxTQUFDLEVBQUQsR0FBQTtBQUNILFFBQUEsd0JBQUE7QUFBQTtTQUFBLGlEQUFBO2dCQUFBO0FBQ0ksb0JBQUEsSUFBRSxDQUFBLENBQUEsQ0FBRixHQUFPLEVBQVAsQ0FESjtBQUFBO29CQURHO0VBQUEsQ0FKUCxDQUFBOztBQUFBLG1CQVFBLEVBQUEsR0FBSSxTQUFDLE1BQUQsR0FBQTtBQUNBLElBQUEsSUFBRyxNQUFNLENBQUMsSUFBUCxLQUFlLElBQUMsQ0FBQSxJQUFuQjtBQUNJLE1BQUEsSUFBRyxNQUFNLENBQUMsTUFBUCxLQUFpQixJQUFDLENBQUEsTUFBckI7QUFDSSxlQUFPLElBQVAsQ0FESjtPQUFBO0FBRUEsTUFBQSxJQUFHLENBQUMsTUFBTSxDQUFDLE1BQVAsS0FBaUIsSUFBbEIsQ0FBQSxJQUE0QixDQUFDLElBQUMsQ0FBQSxNQUFELEtBQVcsSUFBWixDQUEvQjtBQUNJLGVB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LENBQUE7O0FBQUEsT0ErYk8sQ0FBQyxNQUFSLEdBQWlCLE1BL2JqQixDQUFBIiwic291cmNlc0NvbnRlbnQiOlsidXVpZCA9IHJlcXVpcmUgXCJub2RlLXV1aWRcIlxuY2xvbmUgPSByZXF1aXJlIFwiY2xvbmVcIlxubWl4aW5zID0gcmVxdWlyZSBcIi4vbWl4aW5zLmpzXCJcblxuY2xhc3MgU3ltYm9sXG5cbiAgICBjb25zdHJ1Y3RvcjogKEBuYW1lLCBAb2JqZWN0LCBAbnMsIGF0dHJzKSAtPlxuICAgICAgICBpZiBhdHRycz9cbiAgICAgICAgICAgIEBhdHRycyhhdHRycylcblxuICAgIGF0dHJzOiAoa3YpIC0+XG4gICAgICAgIGZvciBrLCB2IGluIGt2XG4gICAgICAgICAgICBAW2tdID0gdlxuXG4gICAgaXM6IChzeW1ib2wpIC0+XG4gICAgICAgIGlmIHN5bWJvbC5uYW1lIGlzIEBuYW1lXG4gICAgICAgICAgICBpZiBzeW1ib2wub2JqZWN0IGlzIEBvYmplY3RcbiAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZVxuICAgICAgICAgICAgaWYgKHN5bWJvbC5vYmplY3QgaXMgbnVsbCkgYW5kIChAb2JqZWN0IGlzIG51bGwpXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRydWVcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlXG5cbiAgICB0b1N0cmluZzogLT5cbiAgICAgICBpZiBAbnM/XG4gICAgICAgICAgIHJldHVybiBAbnMubmFtZSArIEBucy5zZXAgKyBAbmFtZVxuICAgICAgICBlbHNlXG4gICAgICAgICAgIHJldHVybiBAbmFtZVxuXG5TID0gKG5hbWUsIG9iamVjdCwgbnMsIGF0dHJzKSAtPlxuICAgIHJldHVybiBuZXcgU3ltYm9sKG5hbWUsIG9iamVjdCwgbnMsIGF0dHJzKVxuXG4jIHNob3VsZCBiZSBhIHNldFxuXG5jbGFzcyBOYW1lU3BhY2VcblxuICAgIGNvbnN0cnVjdG9yOiAoQG5hbWUsIHNlcCkgLT5cbiAgICAgICAgQGVsZW1lbnRzID0ge31cbiAgICAgICAgQHNlcCA9IHNlcCB8fCBcIi5cIlxuXG4gICAgYmluZDogKHN5bWJvbCwgb2JqZWN0KSAtPlxuICAgICAgICBuYW1lID0gc3ltYm9sLm5hbWVcbiAgICAgICAgc3ltYm9sLm9iamVjdCA9IG9iamVjdFxuICAgICAgICBvYmplY3Quc3ltYm9sID0gc3ltYm9sXG4gICAgICAgIEBlbGVtZW50c1tuYW1lXSA9IHN5bWJvbFxuICAgICAgICBzeW1ib2wubnMgPSB0aGlzXG4gICAgICAgIHN5bWJvbFxuXG4gICAgdW5iaW5kOiAobmFtZSkgLT5cbiAgICAgICAgc3ltYm9sID0gQGVsZW1lbnRzW25hbWVdXG4gICAgICAgIGRlbGV0ZSBAZWxlbWVudHNbbmFtZV1cbiAgICAgICAgc3ltYm9sLm5zID0gdW5kZWZpbmVkXG4gICAgICAgIHN5bWJvbFxuXG4gICAgc3ltYm9sOiAobmFtZSkgLT5cbiAgICAgICAgQGVsZW1lbnRzW25hbWVdXG5cbiAgICBoYXM6IChuYW1lKSAtPlxuICAgICAgICBpZiBAZWxlbWVudHNbbmFtZV0/XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZVxuICAgICAgICBlbHNlXG4gICAgICAgICAgICByZXR1cm4gZmFsc2VcblxuICAgIG9iamVjdDogKG5hbWUpIC0+XG4gICAgICAgIEBlbGVtZW50c1tuYW1lXS5vYmplY3RcblxuICAgIHN5bWJvbHM6ICgpIC0+XG4gICAgICAgc3ltYm9scyA9IFtdXG5cbiAgICAgICBmb3Igayx2IG9mIEBlbGVtZW50c1xuICAgICAgICAgICBzeW1ib2xzLnB1c2godilcblxuICAgICAgIHN5bWJvbHNcblxuICAgIG9iamVjdHM6ICgpIC0+XG4gICAgICAgb2JqZWN0cyA9IFtdXG5cbiAgICAgICBmb3Igayx2IG9mIEBlbGVtZW50c1xuICAgICAgICAgICBvYmplY3RzLnB1c2godi5vYmplY3QpXG5cbiAgICAgICBvYmplY3RzXG5cblxuY2xhc3MgRGF0YVxuXG4gICAgY29uc3RydWN0b3I6IChwcm9wcykgLT5cbiAgICAgICAgaWYgcHJvcHM/XG4gICAgICAgICAgICBAcHJvcHMocHJvcHMpXG5cbiAgICBwcm9wczogKGt2KSAtPlxuICAgICAgICBmb3IgaywgdiBvZiBrdlxuICAgICAgICAgICAgQFtrXSA9IHZcbiAgICAgICAgQHZhbGlkYXRvclxuXG4gICAgdmFsaWRhdG9yOiAtPlxuICAgICAgICB0aGlzXG5cbkQgPSAocHJvcHMpIC0+XG4gICAgcmV0dXJuIG5ldyBEYXRhKClcblxuY2xhc3MgU2lnbmFsIGV4dGVuZHMgRGF0YVxuXG4gICAgY29uc3RydWN0b3I6IChAbmFtZSwgQHBheWxvYWQsIHByb3BzKSAtPlxuICAgICAgICBzdXBlcihwcm9wcylcblxuY2xhc3MgRXZlbnQgZXh0ZW5kcyBTaWduYWxcblxuICAgIGNvbnN0cnVjdG9yOiAobmFtZSwgcGF5bG9hZCwgcHJvcHMpIC0+XG4gICAgICAgIHN1cGVyKG5hbWUsIG1lc3NhZ2UsIHByb3BzKVxuICAgICAgICBAdHMgPSBuZXcgRGF0ZSgpLmdldFRpbWUoKVxuXG5jbGFzcyBHbGl0Y2ggZXh0ZW5kcyBEYXRhXG5cbiAgICBjb25zdHJ1Y3RvcjogKEBuYW1lLCBAY29udGV4dCwgcHJvcHMpIC0+XG4gICAgICAgIHN1cGVyKHByb3BzKVxuXG5jbGFzcyBUb2tlbiBleHRlbmRzIERhdGFcblxuICAgIGNvbnN0cnVjdG9yOiAodmFsdWUsIHNpZ24sIHByb3BzKSAgLT5cbiAgICAgICAgc3VwZXIocHJvcHMpXG4gICAgICAgIEBzaWducyA9IFtdXG4gICAgICAgIEBzdGFtcChzaWduLCB2YWx1ZSlcblxuICAgIHZhbHVlOiAtPlxuICAgICAgICBAdmFsdWVcblxuICAgIGJ5OiAoaW5kZXgpIC0+XG4gICAgICAgIGlmIGluZGV4P1xuICAgICAgICAgICBpZiBAc2lnbnNbaW5kZXhdP1xuICAgICAgICAgICAgICAgcmV0dXJuIEBzaWduc1tpbmRleF1cbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgIHJldHVybiBTKFwiVW5rbm93blwiKVxuXG4gICAgICAgIGlmIEBzaWducy5sZW5ndGggPiAwXG4gICAgICAgICAgIEBzaWduc1tAc2lnbnMubGVuZ3RoIC0gMV1cbiAgICAgICAgZWxzZVxuICAgICAgICAgICBTKFwiVW5rbm93blwiKVxuXG4gICAgc3RhbXA6IChzaWduLCB2YWx1ZSkgLT5cbiAgICAgICAgaWYgdmFsdWVcbiAgICAgICAgICAgIGlmIEBbdmFsdWVdXG4gICAgICAgICAgICAgICAgZGVsZXRlIEBbdmFsdWVdXG4gICAgICAgICAgICBAdmFsdWUgPSB2YWx1ZVxuICAgICAgICAgICAgaWYgdHlwZW9mIEB2YWx1ZSBpcyBcInN0cmluZ1wiXG4gICAgICAgICAgICAgICAgQFtAdmFsdWVdID0gdHJ1ZVxuICAgICAgICBpZiBzaWduP1xuICAgICAgICAgICAgQHNpZ25zLnB1c2goc2lnbilcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgQHNpZ25zLnB1c2goUyhcIlVua25vd25cIikpXG5cblxuc3RhcnQgPSAoc2lnbiwgcHJvcHMpIC0+XG4gICAgcmV0dXJuIG5ldyBUb2tlbihcInN0YXJ0XCIsIHNpZ24sIHByb3BzKVxuXG5zdG9wID0gKHNpZ24sIHByb3BzKSAtPlxuICAgIHJldHVybiBuZXcgVG9rZW4oXCJzdG9wXCIsIHNpZ24sIHByb3BzKVxuXG5UID0gKHZhbHVlLCBzaWduLCBwcm9wcykgLT5cbiAgICByZXR1cm4gbmV3IFRva2VuKHZhbHVlLCBzaWduLCBwcm9wcylcblxuY2xhc3MgQ29tcG9uZW50IGV4dGVuZHMgRGF0YVxuXG4gICAgY29uc3RydWN0b3I6IChAbmFtZSwgcHJvcHMpIC0+XG4gICAgICAgIHN1cGVyKG5hbWUpXG5cblxuY2xhc3MgRW50aXR5IGV4dGVuZHMgRGF0YVxuXG4gICAgY29uc3RydWN0b3I6IChAdGFncywgcHJvcHMpIC0+XG4gICAgICAgIEBpZCA9IHV1aWQudjQoKVxuICAgICAgICBAY29tcG9uZW50cyA9IG5ldyBOYW1lU3BhY2UoXCJjb21wb25lbnRzXCIpXG4gICAgICAgIHN1cGVyKHByb3BzKVxuXG4gICAgYWRkOiAoc3ltYm9sLCBjb21wb25lbnQpIC0+XG4gICAgICAgIEBjb21wb25lbnRzLmJpbmQoc3ltYm9sLCBjb21wb25lbnQpXG5cbiAgICByZW1vdmU6IChuYW1lKSAtPlxuICAgICAgICBAY29tcG9uZW50cy51bmJpbmQobmFtZSlcblxuICAgIGhhczogKG5hbWUpIC0+XG4gICAgICAgIEBjb21wb25lbnRzLmhhcyhuYW1lKVxuXG4gICAgcGFydDogKG5hbWUpIC0+XG4gICAgICAgIEBjb21wb25lbnRzLnN5bWJvbChuYW1lKVxuXG5cbmNsYXNzIENlbGwgZXh0ZW5kcyBFbnRpdHlcblxuICAgIGNvbnN0cnVjdG9yOiAodGFncywgcHJvcHMpIC0+XG4gICAgICAgIHN1cGVyKHRhZ3MsIHByb3BzKVxuICAgICAgICBAb2JzZXJ2ZXJzPSBuZXcgTmFtZVNwYWNlKFwib2JzZXJ2ZXJzXCIpXG5cbiAgICBub3RpZnk6IChldmVudCkgLT5cbiAgICAgICBmb3Igb2IgaW4gQG9ic2VydmVycy5vYmplY3RzKClcbiAgICAgICAgICAgIG9iLnJhaXNlKGV2ZW50KVxuXG4gICAgYWRkOiAoY29tcG9uZW50KSAtPlxuICAgICAgICBzdXBlciBjb21wb25lbnRcbiAgICAgICAgZXZlbnQgPSBuZXcgRXZlbnQoXCJjb21wb25lbnQtYWRkZWRcIiwge2NvbXBvbmVudDogY29tcG9uZW50LCBjZWxsOiB0aGlzfSlcbiAgICAgICAgQG5vdGlmeShldmVudClcblxuICAgIHJlbW92ZTogKG5hbWUpIC0+XG4gICAgICAgIHN1cGVyIG5hbWVcbiAgICAgICAgZXZlbnQgPSBuZXcgRXZlbnQoXCJjb21wb25lbnQtcmVtb3ZlZFwiLCB7Y29tcG9uZW50OiBjb21wb25lbnQsIGNlbGw6IHRoaXN9KVxuICAgICAgICBAbm90aWZ5KGV2ZW50KVxuXG4gICAgb2JzZXJ2ZTogKHN5bWJvbCwgc3lzdGVtKSAtPlxuICAgICAgICBAb2JzZXJ2ZXJzLmJpbmQoc3ltYm9sLCBzeXN0ZW0pXG5cbiAgICBmb3JnZXQ6IChuYW1lKSAtPlxuICAgICAgICBAb2JzZXJ2ZXJzLnVuYmluZChuYW1lKVxuXG4gICAgc3RlcDogKGZuLCBhcmdzLi4uKSAtPlxuICAgICAgICByZXR1cm4gZm4uYXBwbHkodGhpcywgYXJncylcblxuICAgIGNsb25lOiAoKSAtPlxuICAgICAgICByZXR1cm4gY2xvbmUodGhpcylcblxuXG5jbGFzcyBTeXN0ZW1cblxuICAgIGNvbnN0cnVjdG9yOiAoQGZsb3csIEBjb25mKSAtPlxuICAgICAgICBAaW5sZXRzID0gbmV3IE5hbWVTcGFjZShcImlubGV0c1wiKVxuICAgICAgICBAaW5sZXRzLmJpbmQobmV3IFN5bWJvbChcInN5c2luXCIpLFtdKVxuICAgICAgICBAaW5sZXRzLmJpbmQobmV3IFN5bWJvbChcImZlZWRiYWNrXCIpLFtdKVxuICAgICAgICBAb3V0bGV0cyA9IG5ldyBOYW1lU3BhY2UoXCJvdXRsZXRzXCIpXG4gICAgICAgIEBvdXRsZXRzLmJpbmQobmV3IFN5bWJvbChcInN5c291dFwiKSxbXSlcbiAgICAgICAgQG91dGxldHMuYmluZChuZXcgU3ltYm9sKFwic3lzZXJyXCIpLFtdKVxuXG4gICAgICAgIEBzdGF0ZSA9IFtdXG4gICAgICAgIEByID0ge31cblxuICAgIHRvcDogKGluZGV4KSAtPlxuICAgICAgICBpZiBpbmRleD9cbiAgICAgICAgICAgIGlmIEBzdGF0ZVtpbmRleF0/XG4gICAgICAgICAgICAgICAgcmV0dXJuIEBzdGF0ZVtpbmRleF1cbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICByZXR1cm4gUyhcIlVua25vd25cIilcblxuICAgICAgICBpZiBAc3RhdGUubGVuZ3RoID4gMFxuICAgICAgICAgICAgcmV0dXJuIEBzdGF0ZVtAc3RhdGUubGVuZ3RoIC0gMV1cbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgcmV0dXJuIFMoXCJVbmtub3duXCIpXG5cbiAgICBpbnB1dDogKGRhdGEsIGlubGV0KSAtPlxuICAgICAgICBkYXRhXG5cbiAgICBvdXRwdXQ6IChkYXRhLCBvdXRsZXQpIC0+XG4gICAgICAgIGRhdGFcblxuICAgIFNUT1A6IChzdG9wX3Rva2VuKSAtPlxuXG4gICAgcHVzaDogKGRhdGEsIGlubGV0X25hbWUpIC0+XG5cbiAgICAgICAgaW5sZXRfbmFtZSA9IGlubGV0X25hbWUgfHwgXCJzeXNpblwiXG5cbiAgICAgICAgaW5wdXRfZGF0YSA9IEBpbnB1dChkYXRhLCBpbmxldF9uYW1lKVxuXG4gICAgICAgIGlmIGlucHV0X2RhdGEgaW5zdGFuY2VvZiBHbGl0Y2hcbiAgICAgICAgICAgIEBlcnJvcihpbnB1dF9kYXRhKVxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBAcHJvY2VzcyBpbnB1dF9kYXRhLCBpbmxldF9uYW1lXG5cbiAgICBnb3RvX3dpdGg6IChpbmxldF9uYW1lLCBkYXRhKSAtPlxuICAgICAgICBAcHVzaChkYXRhLCBpbmxldF9uYW1lKVxuXG4gICAgcHJvY2VzczogKGRhdGEsIGlubGV0X25hbWUpIC0+XG4gICAgICAgIEBlbWl0KGRhdGEsIFwic3Rkb3V0XCIpXG5cbiAgICBzZW5kOiAoZGF0YSwgb3V0bGV0X25hbWUpIC0+XG4gICAgICAgIGZvciBvdXRsZXQgaW4gQG91dGxldHMuc3ltYm9scygpXG4gICAgICAgICAgICBpZiBvdXRsZXQubmFtZSA9PSBvdXRsZXRfbmFtZVxuICAgICAgICAgICAgICAgIGZvciBjb25uZWN0aW9uIGluIG91dGxldC5vYmplY3RcbiAgICAgICAgICAgICAgICAgICAgY29ubmVjdGlvbi5vYmplY3QudHJhbnNtaXQgZGF0YVxuXG4gICAgZW1pdDogKGRhdGEsIG91dGxldF9uYW1lKSAtPlxuICAgICAgICBvdXRsZXRfbmFtZSA9IG91dGxldF9uYW1lIHx8IFwic3lzb3V0XCJcblxuICAgICAgICBvdXRwdXRfZGF0YSA9IEBvdXRwdXQoZGF0YSwgb3V0bGV0X25hbWUpXG5cbiAgICAgICAgaWYgb3V0cHV0X2RhdGEgaW5zdGFuY2VvZiBHbGl0Y2hcbiAgICAgICAgICAgIEBlcnJvcihvdXRwdXRfZGF0YSlcbiAgICAgICAgICAgIHJldHVyblxuXG4gICAgICAgIEBzZW5kKG91dHB1dF9kYXRhLCBvdXRsZXRfbmFtZSlcblxuXG4gICAgZXJyb3I6IChkYXRhKSAtPlxuICAgICAgICBAc2VuZChkYXRhLCBcInN5c2VyclwiKVxuXG4gICAgcmFpc2U6IChzaWduYWwpIC0+XG4gICAgICAgIEByZWFjdChzaWduYWwpXG5cbiAgICByZWFjdDogKHNpZ25hbCkgLT5cblxuICAgIHNob3c6IChkYXRhKSAtPlxuXG5cbmNsYXNzIFdpcmVcblxuICAgIGNvbnN0cnVjdG9yOiAoQG91dGxldCwgQGlubGV0KSAtPlxuXG5cbmNsYXNzIENvbm5lY3Rpb25cblxuICAgIGNvbnN0cnVjdG9yOiAoc291cmNlLCAgc2luaywgQGZsb3csIHdpcmUpIC0+XG4gICAgICAgIEBzb3VyY2UgPSBAZmxvdy5zeXN0ZW1zLnN5bWJvbChzb3VyY2UpXG4gICAgICAgIEBzaW5rID0gQGZsb3cuc3lzdGVtcy5zeW1ib2woc2luaylcbiAgICAgICAgQHdpcmUgPSB3aXJlIHx8IG5ldyBXaXJlKEBzb3VyY2Uub2JqZWN0Lm91dGxldHMuc3ltYm9sKFwic3lzb3V0XCIpLCBAc2luay5vYmplY3QuaW5sZXRzLnN5bWJvbChcInN5c2luXCIpKVxuXG4gICAgdHJhbnNtaXQ6IChkYXRhKSAtPlxuICAgICAgICBAc2luay5vYmplY3QucHVzaChkYXRhLCBAd2lyZS5pbmxldC5uYW1lKVxuXG5cbmNsYXNzIFN0b3JlXG5cbiAgICBjb25zdHJ1Y3RvcjogLT5cbiAgICAgICAgQGVudGl0aWVzID0gbmV3IE5hbWVTcGFjZShcImVudGl0aWVzXCIpXG5cbiAgICBhZGQ6IChzeW1ib2wsIHRhZ3MsIHByb3BzKSAtPlxuICAgICAgICB0YWdzID0gdGFncyB8fCBbXVxuICAgICAgICBlbnRpdHkgPSBuZXcgRW50aXR5KHRhZ3MsIHByb3BzKVxuICAgICAgICBAZW50aXRpZXMuYmluZChzeW1ib2wsIGVudGl0eSlcbiAgICAgICAgc3ltYm9sXG5cbiAgICBoYXM6IChuYW1lKSAtPlxuICAgICAgICBAZW50aXRpZXMuaGFzKG5hbWUpXG5cbiAgICBlbnRpdHk6IChuYW1lKSAtPlxuICAgICAgICBAZW50aXRpZXMub2JqZWN0KG5hbWUpXG5cbiAgICByZW1vdmU6IChuYW1lKSAtPlxuICAgICAgICBAZW50aXRpZXMudW5iaW5kKG5hbWUpXG5cbiAgICBpZDogKGlkKSAtPlxuICAgICAgICBmb3IgZW50aXR5IGluIEBlbnRpdGllcy5vYmplY3RzKClcbiAgICAgICAgICAgIGlmIGVudGl0eS5pZCBpcyBpZFxuICAgICAgICAgICAgICAgIHJldHVybiBlbnRpdHlcblxuICAgICAgICByZXR1cm4gbnVsbFxuXG4gICAgcmVtb3ZlSWQ6IChpZCkgLT5cbiAgICAgICAgZm9yIGVudGl0eV9zeW1ib2wgaW4gQGVudGl0aWVzLnN5bWJvbHMoKVxuICAgICAgICAgICAgaWYgZW50aXR5X3N5bWJvbC5vYmplY3QgaXMgaWRcbiAgICAgICAgICAgICAgICBAZW50aXRpZXMudW5iaW5kKGVudGl0eV9zeW1ib2wubmFtZSlcblxuICAgICAgICByZXR1cm4gbnVsbFxuXG4gICAgdGFnczogKHRhZ3MpIC0+XG4gICAgICAgIGVudGl0aWVzID0gW11cbiAgICAgICAgZm9yIGVudGl0eSBpbiBAZW50aXRpZXMub2JqZWN0cygpXG4gICAgICAgICAgICBmb3IgdGFnIGluIHRhZ3NcbiAgICAgICAgICAgICAgICBpZiB0YWcgaW4gZW50aXR5LnRhZ3NcbiAgICAgICAgICAgICAgICAgICAgZW50aXRpZXMucHVzaCBlbnRpdHlcblxuICAgICAgICByZXR1cm4gZW50aXRpZXNcblxuY2xhc3MgQnVzIGV4dGVuZHMgTmFtZVNwYWNlXG5cbiAgICBjb25zdHJ1Y3RvcjogKEBuYW1lLCBzZXApIC0+XG4gICAgICAgIHN1cGVyKEBuYW1lLCBzZXApXG5cbiAgICB0cmlnZ2VyOiAoc2lnbmFsKSAtPlxuICAgICAgICBmb3Igb2JqIGluIEBvYmplY3RzKClcbiAgICAgICAgICAgICAgb2JqLnJhaXNlKHNpZ25hbClcblxuY2xhc3MgRmxvd1xuXG4gICAgY29uc3RydWN0b3I6IChjb25uZWN0aW9uQ2xhc3MsIHN0b3JlQ2xhc3MsIGJ1c0NsYXNzKSAtPlxuICAgICAgICBzdG9yZUNsYXNzID0gc3RvcmVDbGFzcyB8fCBTdG9yZVxuICAgICAgICBidXNDbGFzcyA9IGJ1c0NsYXNzIHx8IEJ1c1xuICAgICAgICBAY29ubmVjdGlvbkNsYXNzID0gY29ubmVjdGlvbkNsYXNzIHx8IENvbm5lY3Rpb25cbiAgICAgICAgQHN0b3JlID0gbmV3IHN0b3JlQ2xhc3MoKVxuICAgICAgICBAYnVzID0gbmV3IGJ1c0NsYXNzKFwic3lzdGVtc1wiKVxuICAgICAgICBAc3lzdGVtcyA9IEBidXNcbiAgICAgICAgQGNvbm5lY3Rpb25zID0gbmV3IE5hbWVTcGFjZShcImJ1cy5jb25uZWN0aW9uc1wiKVxuXG4gICAgY29ubmVjdDogKHNvdXJjZSwgc2luaywgd2lyZSwgc3ltYm9sKSAtPlxuXG4gICAgICAgIGNvbm5lY3Rpb24gPSBuZXcgQGNvbm5lY3Rpb25DbGFzcyhzb3VyY2UsIHNpbmssIHRoaXMsIHdpcmUpXG4gICAgICAgIGlmICFzeW1ib2xcbiAgICAgICAgICAgIG5hbWUgPSBcIiN7c291cmNlfTo6I3tjb25uZWN0aW9uLndpcmUub3V0bGV0Lm5hbWV9LSN7c2lua306OiN7Y29ubmVjdGlvbi53aXJlLmlubGV0Lm5hbWV9XCJcbiAgICAgICAgICAgIHN5bWJvbCA9IG5ldyBTeW1ib2wobmFtZSlcbiAgICAgICAgQGNvbm5lY3Rpb25zLmJpbmQoc3ltYm9sLCBjb25uZWN0aW9uKVxuXG4gICAgICAgIGZvciBvdXRsZXQgaW4gY29ubmVjdGlvbi5zb3VyY2Uub2JqZWN0Lm91dGxldHMuc3ltYm9scygpXG4gICAgICAgICAgICBpZiBvdXRsZXQubmFtZSBpcyBjb25uZWN0aW9uLndpcmUub3V0bGV0Lm5hbWVcbiAgICAgICAgICAgICAgICBvdXRsZXQub2JqZWN0LnB1c2goc3ltYm9sKVxuXG4gICAgcGlwZTogKHNvdXJjZSwgd2lyZSwgc2luaykgLT5cbiAgICAgICAgQGNvbm5lY3Qoc291cmNlLCBzaW5rLCB3aXJlKVxuXG4gICAgZGlzY29ubmVjdDogKG5hbWUpIC0+XG4gICAgICAgIGNvbm5lY3Rpb24gPSBAY29ubmVjdGlvbihuYW1lKVxuICAgICAgICBAY29ubmVjdGlvbnMudW5iaW5kKG5hbWUpXG5cbiAgICAgICAgZm9yIG91dGxldCBpbiBjb25uZWN0aW9uLnNvdXJjZS5vYmplY3Qub3V0bGV0cy5zeW1ib2xzKClcbiAgICAgICAgICAgIGlmIG91dGxldC5uYW1lIGlzIGNvbm5lY3Rpb24ud2lyZS5vdXRsZXQubmFtZVxuICAgICAgICAgICAgICAgIGNvbm5lY3Rpb25zID0gW11cbiAgICAgICAgICAgICAgICBmb3IgY29ubiBpbiBvdXRsZXQub2JqZWN0XG4gICAgICAgICAgICAgICAgICAgIGlmIGNvbm4ubmFtZSAhPSBuYW1lXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25uZWN0aW9ucy5wdXNoKGNvbm4pXG4gICAgICAgICAgICAgICAgb3V0bGV0Lm9iamVjdCA9IGNvbm5lY3Rpb25zXG5cblxuICAgIGNvbm5lY3Rpb246IChuYW1lKSAtPlxuICAgICAgICBAY29ubmVjdGlvbnMub2JqZWN0KG5hbWUpXG5cbiAgICBoYXNDb25uZWN0aW9uOiAobmFtZSkgLT5cbiAgICAgICAgQGNvbm5lY3Rpb25zLmhhcyhuYW1lKVxuXG4gICAgYWRkOiAoc3ltYm9sLCBzeXN0ZW1DbGFzcywgY29uZikgLT5cbiAgICAgICAgc3lzdGVtID0gbmV3IHN5c3RlbUNsYXNzKHRoaXMsIGNvbmYpXG4gICAgICAgIEBidXMuYmluZChzeW1ib2wsIHN5c3RlbSlcblxuICAgIGhhczogKG5hbWUpIC0+XG4gICAgICAgIEBidXMuaGFzKG5hbWUpXG5cbiAgICBzeXN0ZW06IChuYW1lKSAtPlxuICAgICAgICBAYnVzLm9iamVjdChuYW1lKVxuXG4gICAgcmVtb3ZlOiAobmFtZSkgLT5cbiAgICAgICAgc3lzdGVtID0gQGJ1cy5vYmplY3QobmFtZSlcbiAgICAgICAgc3lzdGVtLnB1c2goQFNUT1ApXG4gICAgICAgIEBidXMudW5iaW5kKG5hbWUpXG5cbmV4cG9ydHMuU3ltYm9sID0gU3ltYm9sXG5leHBvcnRzLk5hbWVTcGFjZSA9IE5hbWVTcGFjZVxuZXhwb3J0cy5TID0gU1xuZXhwb3J0cy5EYXRhID0gRGF0YVxuZXhwb3J0cy5EID0gRFxuZXhwb3J0cy5TaWduYWwgPSBTaWduYWxcbmV4cG9ydHMuRXZlbnQgPSBFdmVudFxuZXhwb3J0cy5HbGl0Y2ggPSBHbGl0Y2hcbmV4cG9ydHMuVG9rZW4gPSBUb2tlblxuZXhwb3J0cy5zdGFydCA9IHN0YXJ0XG5leHBvcnRzLnN0b3AgPSBzdG9wXG5leHBvcnRzLlQgPSBUXG5leHBvcnRzLkNvbXBvbmVudCA9IENvbXBvbmVudFxuZXhwb3J0cy5FbnRpdHkgPSBFbnRpdHlcbmV4cG9ydHMuQ2VsbCA9IENlbGxcbmV4cG9ydHMuU3lzdGVtID0gU3lzdGVtXG5leHBvcnRzLldpcmUgPSBXaXJlXG5leHBvcnRzLkNvbm5lY3Rpb24gPSBDb25uZWN0aW9uXG5leHBvcnRzLlN0b3JlID0gU3RvcmVcbmV4cG9ydHMuQnVzID0gQnVzXG5leHBvcnRzLkZsb3cgPSBGbG93XG5leHBvcnRzLm1peGlucyA9IG1peGluc1xuXG4iXSwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=