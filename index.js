var Bus, Cell, Component, Connection, D, Data, Entity, Event, Flow, Glitch, NameSpace, S, Signal, Store, Symbol, System, T, Token, Wire, clone, uuid,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  __slice = [].slice,
  __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

uuid = require("node-uuid");

clone = require("clone");

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

  Symbol.prototype.toString = function() {
    if (this.ns != null) {
      return this.ns.name + this.ns.sep + this.name;
    } else {
      return this.name;
    }
  };

  return Symbol;

})();

S = function(name, object, ns, props) {
  return new Symbol(name, object, ns, props);
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

  function Signal(name, message, props) {
    this.name = name;
    this.message = message;
    Signal.__super__.constructor.call(this, props);
  }

  return Signal;

})(Data);

Event = (function(_super) {
  __extends(Event, _super);

  function Event(name, payload, props) {
    this.name = name;
    this.payload = payload;
    this.ts = new Date().getTime();
    Event.__super__.constructor.call(this, props);
  }

  return Event;

})(Data);

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

  function Token(value, props) {
    this.value = value;
    if (typeof this.value === "string") {
      this[this.value] = true;
    }
    Token.__super__.constructor.call(this, props);
  }

  return Token;

})(Data);

T = function(value, props) {
  return new Token(value, props);
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
  function System(flow) {
    this.flow = flow;
    this.inlets = new NameSpace("inlets");
    this.inlets.bind(new Symbol("sysin"), []);
    this.inlets.bind(new Symbol("feedback"), []);
    this.outlets = new NameSpace("outlets");
    this.outlets.bind(new Symbol("sysout"), []);
    this.outlets.bind(new Symbol("syserr"), []);
    this.state = [];
    this.registers = {};
  }

  System.prototype.start = function(conf) {
    this.conf = conf;
  };

  System.prototype.stop = function() {};

  System.prototype.inputValidator = function(data, inlet) {
    console.log(this.symbol.name);
    console.log(data);
    return data;
  };

  System.prototype.outputValidator = function(data, outlet) {
    console.log(this.symbol.name);
    console.log(data);
    return data;
  };

  System.prototype.push = function(data, inlet_name) {
    var validated_data;
    inlet_name = inlet_name || "sysin";
    validated_data = this.inputValidator(data, "inlet");
    if (validated_data instanceof Glitch) {
      return this.error(validated_data);
    } else {
      return this.process(data, inlet_name);
    }
  };

  System.prototype.goto = function(inlet_name, data) {
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
    var validated_data;
    outlet_name = outlet_name || "sysout";
    validated_data = this.outputValidator(data, outlet_name);
    if (validated_data instanceof Glitch) {
      this.error(validated_data);
      return;
    }
    return this.send(data, outlet_name);
  };

  System.prototype.error = function(data) {
    return this.send(data, "syserr");
  };

  System.prototype.raise = function(event) {};

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
    this.source = this.flow.systems.object(source);
    this.sink = this.flow.systems.object(sink);
    this.wire = wire || new Wire("sysout", "sysin");
  }

  Connection.prototype.transmit = function(data) {
    return this.sink.push(data, this.wire.inlet);
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

  Bus.prototype.trigger = function(event) {
    var obj, _i, _len, _ref, _results;
    _ref = this.objects();
    _results = [];
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      obj = _ref[_i];
      _results.push(obj.raise(event));
    }
    return _results;
  };

  return Bus;

})(NameSpace);

Flow = (function() {
  function Flow() {
    this.store = new Store();
    this.systems = new Bus("systems");
    this.connections = new NameSpace("systems.connections");
  }

  Flow.prototype.connect = function(source, sink, wire, symbol) {
    var connection, name, outlet, _i, _len, _ref, _results;
    connection = new Connection(source, sink, this, wire);
    if (!symbol) {
      name = "" + source + "::" + connection.wire.outlet + "-" + sink + "::" + connection.wire.inlet;
      symbol = new Symbol(name);
    }
    this.connections.bind(symbol, connection);
    _ref = connection.source.outlets.symbols();
    _results = [];
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      outlet = _ref[_i];
      if (outlet.name === connection.wire.outlet) {
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
    _ref = connection.source.outlets.symbols();
    _results = [];
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      outlet = _ref[_i];
      if (outlet.name === wire.outlet) {
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

  Flow.prototype.add = function(symbol, systemClass) {
    var system;
    system = new systemClass(this);
    return this.systems.bind(symbol, system);
  };

  Flow.prototype.system = function(name) {
    return this.systems.object(name);
  };

  Flow.prototype.remove = function(name) {
    var system;
    system = this.systems.object(name);
    system.stop();
    return this.systems.unbind(name);
  };

  return Flow;

})();

exports.Symbol = Symbol;

exports.NameSpace = NameSpace;

exports.S = S;

exports.Data = Data;

exports.D = D;

exports.Event = Event;

exports.Glitch = Glitch;

exports.Token = Token;

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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VzIjpbImluZGV4LmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxJQUFBLGdKQUFBO0VBQUE7Ozt1SkFBQTs7QUFBQSxJQUFBLEdBQU8sT0FBQSxDQUFRLFdBQVIsQ0FBUCxDQUFBOztBQUFBLEtBQ0EsR0FBUSxPQUFBLENBQVEsT0FBUixDQURSLENBQUE7O0FBQUE7QUFLaUIsRUFBQSxnQkFBRSxJQUFGLEVBQVMsTUFBVCxFQUFrQixFQUFsQixFQUFzQixLQUF0QixHQUFBO0FBQ1QsSUFEVSxJQUFDLENBQUEsT0FBQSxJQUNYLENBQUE7QUFBQSxJQURpQixJQUFDLENBQUEsU0FBQSxNQUNsQixDQUFBO0FBQUEsSUFEMEIsSUFBQyxDQUFBLEtBQUEsRUFDM0IsQ0FBQTtBQUFBLElBQUEsSUFBRyxhQUFIO0FBQ0ksTUFBQSxJQUFDLENBQUEsS0FBRCxDQUFPLEtBQVAsQ0FBQSxDQURKO0tBRFM7RUFBQSxDQUFiOztBQUFBLG1CQUlBLEtBQUEsR0FBTyxTQUFDLEVBQUQsR0FBQTtBQUNILFFBQUEsd0JBQUE7QUFBQTtTQUFBLGlEQUFBO2dCQUFBO0FBQ0ksb0JBQUEsSUFBRSxDQUFBLENBQUEsQ0FBRixHQUFPLEVBQVAsQ0FESjtBQUFBO29CQURHO0VBQUEsQ0FKUCxDQUFBOztBQUFBLG1CQVFBLFFBQUEsR0FBVSxTQUFBLEdBQUE7QUFDUCxJQUFBLElBQUcsZUFBSDtBQUNJLGFBQU8sSUFBQyxDQUFBLEVBQUUsQ0FBQyxJQUFKLEdBQVcsSUFBQyxDQUFBLEVBQUUsQ0FBQyxHQUFmLEdBQXFCLElBQUMsQ0FBQSxJQUE3QixDQURKO0tBQUEsTUFBQTtBQUdJLGFBQU8sSUFBQyxDQUFBLElBQVIsQ0FISjtLQURPO0VBQUEsQ0FSVixDQUFBOztnQkFBQTs7SUFMSixDQUFBOztBQUFBLENBbUJBLEdBQUksU0FBQyxJQUFELEVBQU8sTUFBUCxFQUFlLEVBQWYsRUFBbUIsS0FBbkIsR0FBQTtBQUNBLFNBQVcsSUFBQSxNQUFB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QUFBOztBQUFBLE9Bc1hPLENBQUMsS0FBUixHQUFnQixLQXRYaEIsQ0FBQTs7QUFBQSxPQXVYTyxDQUFDLEdBQVIsR0FBYyxHQXZYZCxDQUFBOztBQUFBLE9Bd1hPLENBQUMsSUFBUixHQUFlLElBeFhmLENBQUEiLCJzb3VyY2VzQ29udGVudCI6WyJ1dWlkID0gcmVxdWlyZSBcIm5vZGUtdXVpZFwiXG5jbG9uZSA9IHJlcXVpcmUgXCJjbG9uZVwiXG5cbmNsYXNzIFN5bWJvbFxuXG4gICAgY29uc3RydWN0b3I6IChAbmFtZSwgQG9iamVjdCwgQG5zLCBhdHRycykgLT5cbiAgICAgICAgaWYgYXR0cnM/XG4gICAgICAgICAgICBAYXR0cnMoYXR0cnMpXG5cbiAgICBhdHRyczogKGt2KSAtPlxuICAgICAgICBmb3IgaywgdiBpbiBrdlxuICAgICAgICAgICAgQFtrXSA9IHZcblxuICAgIHRvU3RyaW5nOiAtPlxuICAgICAgIGlmIEBucz9cbiAgICAgICAgICAgcmV0dXJuIEBucy5uYW1lICsgQG5zLnNlcCArIEBuYW1lXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgcmV0dXJuIEBuYW1lXG5cblMgPSAobmFtZSwgb2JqZWN0LCBucywgcHJvcHMpIC0+XG4gICAgcmV0dXJuIG5ldyBTeW1ib2wobmFtZSwgb2JqZWN0LCBucywgcHJvcHMpXG5cbiMgc2hvdWxkIGJlIGEgc2V0XG5cbmNsYXNzIE5hbWVTcGFjZVxuXG4gICAgY29uc3RydWN0b3I6IChAbmFtZSwgc2VwKSAtPlxuICAgICAgICBAZWxlbWVudHMgPSB7fVxuICAgICAgICBAc2VwID0gc2VwIHx8IFwiLlwiXG5cbiAgICBiaW5kOiAoc3ltYm9sLCBvYmplY3QpIC0+XG4gICAgICAgIG5hbWUgPSBzeW1ib2wubmFtZVxuICAgICAgICBzeW1ib2wub2JqZWN0ID0gb2JqZWN0XG4gICAgICAgIG9iamVjdC5zeW1ib2wgPSBzeW1ib2xcbiAgICAgICAgQGVsZW1lbnRzW25hbWVdID0gc3ltYm9sXG4gICAgICAgIHN5bWJvbC5ucyA9IHRoaXNcbiAgICAgICAgc3ltYm9sXG5cbiAgICB1bmJpbmQ6IChuYW1lKSAtPlxuICAgICAgICBzeW1ib2wgPSBAZWxlbWVudHNbbmFtZV1cbiAgICAgICAgZGVsZXRlIEBlbGVtZW50c1tuYW1lXVxuICAgICAgICBzeW1ib2wubnMgPSB1bmRlZmluZWRcbiAgICAgICAgc3ltYm9sXG5cbiAgICBzeW1ib2w6IChuYW1lKSAtPlxuICAgICAgICBAZWxlbWVudHNbbmFtZV1cblxuICAgIGhhczogKG5hbWUpIC0+XG4gICAgICAgIGlmIEBlbGVtZW50c1tuYW1lXT9cbiAgICAgICAgICAgIHJldHVybiB0cnVlXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIHJldHVybiBmYWxzZVxuXG4gICAgb2JqZWN0OiAobmFtZSkgLT5cbiAgICAgICAgQGVsZW1lbnRzW25hbWVdLm9iamVjdFxuXG4gICAgc3ltYm9sczogKCkgLT5cbiAgICAgICBzeW1ib2xzID0gW11cblxuICAgICAgIGZvciBrLHYgb2YgQGVsZW1lbnRzXG4gICAgICAgICAgIHN5bWJvbHMucHVzaCh2KVxuXG4gICAgICAgc3ltYm9sc1xuXG4gICAgb2JqZWN0czogKCkgLT5cbiAgICAgICBvYmplY3RzID0gW11cblxuICAgICAgIGZvciBrLHYgb2YgQGVsZW1lbnRzXG4gICAgICAgICAgIG9iamVjdHMucHVzaCh2Lm9iamVjdClcblxuICAgICAgIG9iamVjdHNcblxuXG5jbGFzcyBEYXRhXG5cbiAgICBjb25zdHJ1Y3RvcjogKHByb3BzKSAtPlxuICAgICAgICBpZiBwcm9wcz9cbiAgICAgICAgICAgIEBwcm9wcyhwcm9wcylcblxuICAgIHByb3BzOiAoa3YpIC0+XG4gICAgICAgIGZvciBrLCB2IG9mIGt2XG4gICAgICAgICAgICBAW2tdID0gdlxuICAgICAgICBAdmFsaWRhdG9yXG5cbiAgICB2YWxpZGF0b3I6IC0+XG4gICAgICAgIHRoaXNcblxuRCA9IChwcm9wcykgLT5cbiAgICByZXR1cm4gbmV3IERhdGEoKVxuXG5jbGFzcyBTaWduYWwgZXh0ZW5kcyBEYXRhXG5cbiAgICBjb25zdHJ1Y3RvcjogKEBuYW1lLCBAbWVzc2FnZSwgcHJvcHMpIC0+XG4gICAgICAgIHN1cGVyKHByb3BzKVxuXG5jbGFzcyBFdmVudCBleHRlbmRzIERhdGFcblxuICAgIGNvbnN0cnVjdG9yOiAoQG5hbWUsIEBwYXlsb2FkLCBwcm9wcykgLT5cbiAgICAgICAgQHRzID0gbmV3IERhdGUoKS5nZXRUaW1lKCk7XG4gICAgICAgIHN1cGVyKHByb3BzKVxuXG5jbGFzcyBHbGl0Y2ggZXh0ZW5kcyBEYXRhXG5cbiAgICBjb25zdHJ1Y3RvcjogKEBuYW1lLCBAY29udGV4dCwgcHJvcHMpIC0+XG4gICAgICAgIHN1cGVyKHByb3BzKVxuXG5jbGFzcyBUb2tlbiBleHRlbmRzIERhdGFcblxuICAgIGNvbnN0cnVjdG9yOiAodmFsdWUsIHByb3BzKSAgLT5cbiAgICAgICAgQHZhbHVlID0gdmFsdWVcbiAgICAgICAgaWYgdHlwZW9mIEB2YWx1ZSBpcyBcInN0cmluZ1wiXG4gICAgICAgICAgICBAW0B2YWx1ZV0gPSB0cnVlXG4gICAgICAgIHN1cGVyKHByb3BzKVxuXG5UID0gKHZhbHVlLCBwcm9wcykgLT5cbiAgICByZXR1cm4gbmV3IFRva2VuKHZhbHVlLCBwcm9wcylcblxuY2xhc3MgQ29tcG9uZW50IGV4dGVuZHMgRGF0YVxuXG4gICAgY29uc3RydWN0b3I6IChAbmFtZSwgcHJvcHMpIC0+XG4gICAgICAgIHN1cGVyKG5hbWUpXG5cblxuY2xhc3MgRW50aXR5IGV4dGVuZHMgRGF0YVxuXG4gICAgY29uc3RydWN0b3I6IChAdGFncywgcHJvcHMpIC0+XG4gICAgICAgIEBpZCA9IHV1aWQudjQoKVxuICAgICAgICBAY29tcG9uZW50cyA9IG5ldyBOYW1lU3BhY2UoXCJjb21wb25lbnRzXCIpXG4gICAgICAgIHN1cGVyKHByb3BzKVxuXG4gICAgYWRkOiAoc3ltYm9sLCBjb21wb25lbnQpIC0+XG4gICAgICAgIEBjb21wb25lbnRzLmJpbmQoc3ltYm9sLCBjb21wb25lbnQpXG5cbiAgICByZW1vdmU6IChuYW1lKSAtPlxuICAgICAgICBAY29tcG9uZW50cy51bmJpbmQobmFtZSlcblxuICAgIHBhcnQ6IChuYW1lKSAtPlxuICAgICAgICBAY29tcG9uZW50cy5zeW1ib2wobmFtZSlcblxuXG5jbGFzcyBDZWxsIGV4dGVuZHMgRW50aXR5XG5cbiAgICBjb25zdHJ1Y3RvcjogKHRhZ3MsIHByb3BzKSAtPlxuICAgICAgICBzdXBlcih0YWdzLCBwcm9wcylcbiAgICAgICAgQG9ic2VydmVycz0gbmV3IE5hbWVTcGFjZShcIm9ic2VydmVyc1wiKVxuXG4gICAgbm90aWZ5OiAoZXZlbnQpIC0+XG4gICAgICAgZm9yIG9iIGluIEBvYnNlcnZlcnMub2JqZWN0cygpXG4gICAgICAgICAgICBvYi5yYWlzZShldmVudClcblxuICAgIGFkZDogKGNvbXBvbmVudCkgLT5cbiAgICAgICAgc3VwZXIgY29tcG9uZW50XG4gICAgICAgIGV2ZW50ID0gbmV3IEV2ZW50KFwiY29tcG9uZW50LWFkZGVkXCIsIHtjb21wb25lbnQ6IGNvbXBvbmVudCwgY2VsbDogdGhpc30pXG4gICAgICAgIEBub3RpZnkoZXZlbnQpXG5cbiAgICByZW1vdmU6IChuYW1lKSAtPlxuICAgICAgICBzdXBlciBuYW1lXG4gICAgICAgIGV2ZW50ID0gbmV3IEV2ZW50KFwiY29tcG9uZW50LXJlbW92ZWRcIiwge2NvbXBvbmVudDogY29tcG9uZW50LCBjZWxsOiB0aGlzfSlcbiAgICAgICAgQG5vdGlmeShldmVudClcblxuICAgIG9ic2VydmU6IChzeW1ib2wsIHN5c3RlbSkgLT5cbiAgICAgICAgQG9ic2VydmVycy5iaW5kKHN5bWJvbCwgc3lzdGVtKVxuXG4gICAgZm9yZ2V0OiAobmFtZSkgLT5cbiAgICAgICAgQG9ic2VydmVycy51bmJpbmQobmFtZSlcblxuICAgIHN0ZXA6IChmbiwgYXJncy4uLikgLT5cbiAgICAgICAgcmV0dXJuIGZuLmFwcGx5KHRoaXMsIGFyZ3MpXG5cbiAgICBjbG9uZTogKCkgLT5cbiAgICAgICAgcmV0dXJuIGNsb25lKHRoaXMpXG5cblxuY2xhc3MgU3lzdGVtXG5cbiAgICBjb25zdHJ1Y3RvcjogKEBmbG93KSAtPlxuICAgICAgICBAaW5sZXRzID0gbmV3IE5hbWVTcGFjZShcImlubGV0c1wiKVxuICAgICAgICBAaW5sZXRzLmJpbmQobmV3IFN5bWJvbChcInN5c2luXCIpLFtdKVxuICAgICAgICBAaW5sZXRzLmJpbmQobmV3IFN5bWJvbChcImZlZWRiYWNrXCIpLFtdKVxuICAgICAgICBAb3V0bGV0cyA9IG5ldyBOYW1lU3BhY2UoXCJvdXRsZXRzXCIpXG4gICAgICAgIEBvdXRsZXRzLmJpbmQobmV3IFN5bWJvbChcInN5c291dFwiKSxbXSlcbiAgICAgICAgQG91dGxldHMuYmluZChuZXcgU3ltYm9sKFwic3lzZXJyXCIpLFtdKVxuXG4gICAgICAgIEBzdGF0ZSA9IFtdXG4gICAgICAgIEByZWdpc3RlcnMgPSB7fVxuXG4gICAgc3RhcnQ6IChAY29uZikgLT5cblxuICAgIHN0b3A6ICgpIC0+XG5cbiAgICBpbnB1dFZhbGlkYXRvcjogKGRhdGEsIGlubGV0KSAtPlxuICAgICAgICBjb25zb2xlLmxvZyhAc3ltYm9sLm5hbWUpXG4gICAgICAgIGNvbnNvbGUubG9nKGRhdGEpXG4gICAgICAgIGRhdGFcblxuICAgIG91dHB1dFZhbGlkYXRvcjogKGRhdGEsIG91dGxldCkgLT5cbiAgICAgICAgY29uc29sZS5sb2coQHN5bWJvbC5uYW1lKVxuICAgICAgICBjb25zb2xlLmxvZyhkYXRhKVxuICAgICAgICBkYXRhXG5cbiAgICBwdXNoOiAoZGF0YSwgaW5sZXRfbmFtZSkgLT5cblxuICAgICAgICBpbmxldF9uYW1lID0gaW5sZXRfbmFtZSB8fCBcInN5c2luXCJcblxuICAgICAgICB2YWxpZGF0ZWRfZGF0YSA9IEBpbnB1dFZhbGlkYXRvcihkYXRhLCBcImlubGV0XCIpXG5cbiAgICAgICAgaWYgdmFsaWRhdGVkX2RhdGEgaW5zdGFuY2VvZiBHbGl0Y2hcbiAgICAgICAgICAgIEBlcnJvcih2YWxpZGF0ZWRfZGF0YSlcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgQHByb2Nlc3MgZGF0YSwgaW5sZXRfbmFtZVxuXG4gICAgZ290bzogKGlubGV0X25hbWUsIGRhdGEpIC0+XG4gICAgICAgIEBwdXNoKGRhdGEsIGlubGV0X25hbWUpXG5cblxuICAgIHByb2Nlc3M6IChkYXRhLCBpbmxldF9uYW1lKSAtPlxuICAgICAgICBAZW1pdChkYXRhLCBcInN0ZG91dFwiKVxuXG4gICAgc2VuZDogKGRhdGEsIG91dGxldF9uYW1lKSAtPlxuICAgICAgICBmb3Igb3V0bGV0IGluIEBvdXRsZXRzLnN5bWJvbHMoKVxuICAgICAgICAgICAgaWYgb3V0bGV0Lm5hbWUgPT0gb3V0bGV0X25hbWVcbiAgICAgICAgICAgICAgICBmb3IgY29ubmVjdGlvbiBpbiBvdXRsZXQub2JqZWN0XG4gICAgICAgICAgICAgICAgICAgIGNvbm5lY3Rpb24ub2JqZWN0LnRyYW5zbWl0IGRhdGFcblxuICAgIGVtaXQ6IChkYXRhLCBvdXRsZXRfbmFtZSkgLT5cbiAgICAgICAgb3V0bGV0X25hbWUgPSBvdXRsZXRfbmFtZSB8fCBcInN5c291dFwiXG5cbiAgICAgICAgdmFsaWRhdGVkX2RhdGEgPSBAb3V0cHV0VmFsaWRhdG9yKGRhdGEsIG91dGxldF9uYW1lKVxuXG4gICAgICAgIGlmIHZhbGlkYXRlZF9kYXRhIGluc3RhbmNlb2YgR2xpdGNoXG4gICAgICAgICAgICBAZXJyb3IodmFsaWRhdGVkX2RhdGEpXG4gICAgICAgICAgICByZXR1cm5cblxuICAgICAgICBAc2VuZChkYXRhLCBvdXRsZXRfbmFtZSlcblxuXG4gICAgZXJyb3I6IChkYXRhKSAtPlxuICAgICAgICBAc2VuZChkYXRhLCBcInN5c2VyclwiKVxuXG4gICAgcmFpc2U6IChldmVudCkgLT5cblxuICAgIHNob3c6IChkYXRhKSAtPlxuXG5cbmNsYXNzIFdpcmVcblxuICAgIGNvbnN0cnVjdG9yOiAoQG91dGxldCwgQGlubGV0KSAtPlxuXG5cbmNsYXNzIENvbm5lY3Rpb25cblxuICAgIGNvbnN0cnVjdG9yOiAoc291cmNlLCAgc2luaywgQGZsb3csIHdpcmUpIC0+XG4gICAgICAgIEBzb3VyY2UgPSBAZmxvdy5zeXN0ZW1zLm9iamVjdChzb3VyY2UpXG4gICAgICAgIEBzaW5rID0gQGZsb3cuc3lzdGVtcy5vYmplY3Qoc2luaylcbiAgICAgICAgQHdpcmUgPSB3aXJlIHx8IG5ldyBXaXJlKFwic3lzb3V0XCIsIFwic3lzaW5cIilcblxuICAgIHRyYW5zbWl0OiAoZGF0YSkgLT5cbiAgICAgICAgQHNpbmsucHVzaChkYXRhLCBAd2lyZS5pbmxldClcblxuXG5jbGFzcyBTdG9yZVxuXG4gICAgY29uc3RydWN0b3I6IC0+XG4gICAgICAgIEBlbnRpdGllcyA9IG5ldyBOYW1lU3BhY2UoXCJlbnRpdGllc1wiKVxuXG4gICAgYWRkOiAoc3ltYm9sLCB0YWdzLCBwcm9wcykgLT5cbiAgICAgICAgdGFncyA9IHRhZ3MgfHwgW11cbiAgICAgICAgZW50aXR5ID0gbmV3IEVudGl0eSh0YWdzLCBwcm9wcylcbiAgICAgICAgQGVudGl0aWVzLmJpbmQoc3ltYm9sLCBlbnRpdHkpXG4gICAgICAgIHN5bWJvbFxuXG4gICAgZW50aXR5OiAobmFtZSkgLT5cbiAgICAgICAgQGVudGl0aWVzLm9iamVjdChuYW1lKVxuXG4gICAgcmVtb3ZlOiAobmFtZSkgLT5cbiAgICAgICAgQGVudGl0aWVzLnVuYmluZChuYW1lKVxuXG4gICAgaWQ6IChpZCkgLT5cbiAgICAgICAgZm9yIGVudGl0eSBpbiBAZW50aXRpZXMub2JqZWN0cygpXG4gICAgICAgICAgICBpZiBlbnRpdHkuaWQgaXMgaWRcbiAgICAgICAgICAgICAgICByZXR1cm4gZW50aXR5XG5cbiAgICAgICAgcmV0dXJuIG51bGxcblxuICAgIHJlbW92ZUlkOiAoaWQpIC0+XG4gICAgICAgIGZvciBlbnRpdHlfc3ltYm9sIGluIEBlbnRpdGllcy5zeW1ib2xzKClcbiAgICAgICAgICAgIGlmIGVudGl0eV9zeW1ib2wub2JqZWN0IGlzIGlkXG4gICAgICAgICAgICAgICAgQGVudGl0aWVzLnVuYmluZChlbnRpdHlfc3ltYm9sLm5hbWUpXG5cbiAgICAgICAgcmV0dXJuIG51bGxcblxuICAgIHRhZ3M6ICh0YWdzKSAtPlxuICAgICAgICBlbnRpdGllcyA9IFtdXG4gICAgICAgIGZvciBlbnRpdHkgaW4gQGVudGl0aWVzLm9iamVjdHMoKVxuICAgICAgICAgICAgZm9yIHRhZyBpbiB0YWdzXG4gICAgICAgICAgICAgICAgaWYgdGFnIGluIGVudGl0eS50YWdzXG4gICAgICAgICAgICAgICAgICAgIGVudGl0aWVzLnB1c2ggZW50aXR5XG5cbiAgICAgICAgcmV0dXJuIGVudGl0aWVzXG5cbmNsYXNzIEJ1cyBleHRlbmRzIE5hbWVTcGFjZVxuXG4gICAgY29uc3RydWN0b3I6IChAbmFtZSwgc2VwKSAtPlxuICAgICAgICBzdXBlcihAbmFtZSwgc2VwKVxuXG4gICAgdHJpZ2dlcjogKGV2ZW50KSAtPlxuICAgICAgICBmb3Igb2JqIGluIEBvYmplY3RzKClcbiAgICAgICAgICAgICAgb2JqLnJhaXNlKGV2ZW50KVxuXG5jbGFzcyBGbG93XG5cbiAgICBjb25zdHJ1Y3RvcjogKCkgLT5cbiAgICAgICAgQHN0b3JlID0gbmV3IFN0b3JlKClcbiAgICAgICAgQHN5c3RlbXMgPSBuZXcgQnVzKFwic3lzdGVtc1wiKVxuICAgICAgICBAY29ubmVjdGlvbnMgPSBuZXcgTmFtZVNwYWNlKFwic3lzdGVtcy5jb25uZWN0aW9uc1wiKVxuXG4gICAgY29ubmVjdDogKHNvdXJjZSwgc2luaywgd2lyZSwgc3ltYm9sKSAtPlxuXG4gICAgICAgIGNvbm5lY3Rpb24gPSBuZXcgQ29ubmVjdGlvbihzb3VyY2UsIHNpbmssIHRoaXMsIHdpcmUpXG4gICAgICAgIGlmICFzeW1ib2xcbiAgICAgICAgICAgIG5hbWUgPSBcIiN7c291cmNlfTo6I3tjb25uZWN0aW9uLndpcmUub3V0bGV0fS0je3Npbmt9Ojoje2Nvbm5lY3Rpb24ud2lyZS5pbmxldH1cIlxuICAgICAgICAgICAgc3ltYm9sID0gbmV3IFN5bWJvbChuYW1lKVxuICAgICAgICBAY29ubmVjdGlvbnMuYmluZChzeW1ib2wsIGNvbm5lY3Rpb24pXG5cbiAgICAgICAgZm9yIG91dGxldCBpbiBjb25uZWN0aW9uLnNvdXJjZS5vdXRsZXRzLnN5bWJvbHMoKVxuICAgICAgICAgICAgaWYgb3V0bGV0Lm5hbWUgaXMgY29ubmVjdGlvbi53aXJlLm91dGxldFxuICAgICAgICAgICAgICAgIG91dGxldC5vYmplY3QucHVzaChzeW1ib2wpXG5cbiAgICBwaXBlOiAoc291cmNlLCB3aXJlLCBzaW5rKSAtPlxuICAgICAgICBAY29ubmVjdChzb3VyY2UsIHNpbmssIHdpcmUpXG5cbiAgICBkaXNjb25uZWN0OiAobmFtZSkgLT5cbiAgICAgICAgY29ubmVjdGlvbiA9IEBjb25uZWN0aW9uKG5hbWUpXG4gICAgICAgIEBjb25uZWN0aW9ucy51bmJpbmQobmFtZSlcblxuICAgICAgICBmb3Igb3V0bGV0IGluIGNvbm5lY3Rpb24uc291cmNlLm91dGxldHMuc3ltYm9scygpXG4gICAgICAgICAgICBpZiBvdXRsZXQubmFtZSBpcyB3aXJlLm91dGxldFxuICAgICAgICAgICAgICAgIGNvbm5lY3Rpb25zID0gW11cbiAgICAgICAgICAgICAgICBmb3IgY29ubiBpbiBvdXRsZXQub2JqZWN0XG4gICAgICAgICAgICAgICAgICAgIGlmIGNvbm4ubmFtZSAhPSBuYW1lXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25uZWN0aW9ucy5wdXNoKGNvbm4pXG4gICAgICAgICAgICAgICAgb3V0bGV0Lm9iamVjdCA9IGNvbm5lY3Rpb25zXG5cblxuICAgIGNvbm5lY3Rpb246IChuYW1lKSAtPlxuICAgICAgICBAY29ubmVjdGlvbnMub2JqZWN0KG5hbWUpXG5cbiAgICBhZGQ6IChzeW1ib2wsIHN5c3RlbUNsYXNzKSAtPlxuICAgICAgICBzeXN0ZW0gPSBuZXcgc3lzdGVtQ2xhc3ModGhpcylcbiAgICAgICAgQHN5c3RlbXMuYmluZChzeW1ib2wsIHN5c3RlbSlcblxuICAgIHN5c3RlbTogKG5hbWUpIC0+XG4gICAgICAgIEBzeXN0ZW1zLm9iamVjdChuYW1lKVxuXG4gICAgcmVtb3ZlOiAobmFtZSkgLT5cbiAgICAgICAgc3lzdGVtID0gQHN5c3RlbXMub2JqZWN0KG5hbWUpXG4gICAgICAgIHN5c3RlbS5zdG9wKClcbiAgICAgICAgQHN5c3RlbXMudW5iaW5kKG5hbWUpXG5cbmV4cG9ydHMuU3ltYm9sID0gU3ltYm9sXG5leHBvcnRzLk5hbWVTcGFjZSA9IE5hbWVTcGFjZVxuZXhwb3J0cy5TID0gU1xuZXhwb3J0cy5EYXRhID0gRGF0YVxuZXhwb3J0cy5EID0gRFxuZXhwb3J0cy5FdmVudCA9IEV2ZW50XG5leHBvcnRzLkdsaXRjaCA9IEdsaXRjaFxuZXhwb3J0cy5Ub2tlbiA9IFRva2VuXG5leHBvcnRzLlQgPSBUXG5leHBvcnRzLkNvbXBvbmVudCA9IENvbXBvbmVudFxuZXhwb3J0cy5FbnRpdHkgPSBFbnRpdHlcbmV4cG9ydHMuQ2VsbCA9IENlbGxcbmV4cG9ydHMuU3lzdGVtID0gU3lzdGVtXG5leHBvcnRzLldpcmUgPSBXaXJlXG5leHBvcnRzLkNvbm5lY3Rpb24gPSBDb25uZWN0aW9uXG5leHBvcnRzLlN0b3JlID0gU3RvcmVcbmV4cG9ydHMuQnVzID0gQnVzXG5leHBvcnRzLkZsb3cgPSBGbG93XG5cbiJdLCJzb3VyY2VSb290IjoiL3NvdXJjZS8ifQ==