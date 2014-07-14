var Bus, Cell, Component, Connection, D, Data, DiscreteSystem, Entity, Error, Event, Flow, GO, NameSpace, S, Store, Symbol, System, T, Token, Wire, uuid,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

uuid = require("node-uuid");

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
    var k, v, _results;
    _results = [];
    for (k in kv) {
      v = kv[k];
      _results.push(this[k] = v);
    }
    return _results;
  };

  return Data;

})();

D = function(props) {
  return new Data();
};

Event = (function(_super) {
  __extends(Event, _super);

  function Event(name, payload, props) {
    this.name = name;
    this.payload = payload;
    Event.__super__.constructor.call(this, props);
  }

  return Event;

})(Data);

Error = (function(_super) {
  __extends(Error, _super);

  function Error(name, context, props) {
    this.name = name;
    this.context = context;
    Error.__super__.constructor.call(this, props);
  }

  return Error;

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
      component: component
    });
    return this.notify(event);
  };

  Cell.prototype.remove = function(name) {
    var event;
    Cell.__super__.remove.call(this, name);
    event = new Event("component-removed", {
      component: component
    });
    return this.notify(event);
  };

  Cell.prototype.observe = function(symbol, discreteSystem) {
    return this.observers.bind(symbol, discreteSystem);
  };

  Cell.prototype.forget = function(name) {
    return this.observers.unbind(name);
  };

  return Cell;

})(Entity);

System = (function() {
  function System(flow, conf) {
    this.flow = flow;
    this.conf = conf;
    this.inlets = new NameSpace("inlets");
    this.inlets.bind(new Symbol("sysin"), []);
    this.outlets = new NameSpace("outlets");
    this.outlets.bind(new Symbol("sysout"), []);
    this.outlets.bind(new Symbol("syserr"), []);
  }

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
    if (validated_data instanceof Error) {
      return this.error(validated_data);
    } else {
      return this.process(data, inlet_name);
    }
  };

  System.prototype.process = function(data, inlet_name) {};

  System.prototype.emit = function(data, outlet_name) {
    var connection, outlet, validated_data, _i, _len, _ref, _results;
    outlet_name = outlet || "sysout";
    validated_data = this.outputValidator(data, outlet);
    if (validated_data instanceof Error) {
      this.error(validated_data);
      return;
    }
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

  System.prototype.error = function(error) {
    var connection, outlet, _i, _len, _ref, _results;
    _ref = this.outlets.symbols();
    _results = [];
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      outlet = _ref[_i];
      if (outlet.name === "syserr") {
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

  return System;

})();

DiscreteSystem = (function() {
  function DiscreteSystem(flow, conf) {
    this.flow = flow;
    this.conf = conf;
  }

  DiscreteSystem.prototype.raise = function(event) {};

  return DiscreteSystem;

})();

GO = (function(_super) {
  __extends(GO, _super);

  function GO(flow, conf) {
    this.flow = flow;
    this.conf = conf;
  }

  GO.prototype.show = function(data) {};

  return GO;

})(DiscreteSystem);

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

Bus = (function() {
  function Bus() {
    this.discreteSystems = new NameSpace("discreteSystems");
  }

  Bus.prototype.add = function(symbol, discreteSystemClass, conf) {
    var discrete_sytem;
    discrete_sytem = new discreteSystemClass(this, conf);
    return this.discreteSystems.bind(symbol, discrete_sytem);
  };

  Bus.prototype.remove = function(name) {
    return this.discreteSystems.unbind(name);
  };

  Bus.prototype.trigger = function(event) {
    var obj, _i, _len, _ref, _results;
    _ref = this.discreteSystems.objects();
    _results = [];
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      obj = _ref[_i];
      _results.push(obj.raise(event));
    }
    return _results;
  };

  return Bus;

})();

Flow = (function() {
  function Flow() {
    this.bus = new Bus();
    this.store = new Store();
    this.systems = new NameSpace("systems");
    this.connections = new NameSpace("systems.connections");
  }

  Flow.prototype.connect = function(source, sink, wire) {
    var connection, name, outlet, symbol, _i, _len, _ref, _results;
    connection = new Connection(source, sink, this, wire);
    name = "" + source + "::" + connection.wire.outlet + "-" + sink + "::" + connection.wire.inlet;
    symbol = new Symbol(name);
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

  Flow.prototype.add = function(symbol, systemClass, conf) {
    var system;
    system = new systemClass(this, conf);
    return this.systems.bind(symbol, system);
  };

  Flow.prototype.system = function(name) {
    return this.systems.object(name);
  };

  Flow.prototype.remove = function(name) {
    return this.systems.unbind(symbol, system);
  };

  return Flow;

})();

exports.Symbol = Symbol;

exports.S = S;

exports.Token = Token;

exports.T = T;

exports.NameSpace = NameSpace;

exports.System = System;

exports.DiscreteSystem = DiscreteSystem;

exports.Wire = Wire;

exports.Connection = Connection;

exports.Event = Event;

exports.Entity = Entity;

exports.Error = Error;

exports.Bus = Bus;

exports.Flow = Flow;

exports.GO = GO;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VzIjpbImluZGV4LmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxJQUFBLG9KQUFBO0VBQUE7O3VKQUFBOztBQUFBLElBQUEsR0FBTyxPQUFBLENBQVEsV0FBUixDQUFQLENBQUE7O0FBQUE7QUFJaUIsRUFBQSxnQkFBRSxJQUFGLEVBQVMsTUFBVCxFQUFrQixFQUFsQixFQUFzQixLQUF0QixHQUFBO0FBQ1QsSUFEVSxJQUFDLENBQUEsT0FBQSxJQUNYLENBQUE7QUFBQSxJQURpQixJQUFDLENBQUEsU0FBQSxNQUNsQixDQUFBO0FBQUEsSUFEMEIsSUFBQyxDQUFBLEtBQUEsRUFDM0IsQ0FBQTtBQUFBLElBQUEsSUFBRyxhQUFIO0FBQ0ksTUFBQSxJQUFDLENBQUEsS0FBRCxDQUFPLEtBQVAsQ0FBQSxDQURKO0tBRFM7RUFBQSxDQUFiOztBQUFBLG1CQUlBLEtBQUEsR0FBTyxTQUFDLEVBQUQsR0FBQTtBQUNILFFBQUEsd0JBQUE7QUFBQTtTQUFBLGlEQUFBO2dCQUFBO0FBQ0ksb0JBQUEsSUFBRSxDQUFBLENBQUEsQ0FBRixHQUFPLEVBQVAsQ0FESjtBQUFBO29CQURHO0VBQUEsQ0FKUCxDQUFBOztBQUFBLG1CQVFBLFFBQUEsR0FBVSxTQUFBLEdBQUE7QUFDUCxJQUFBLElBQUcsZUFBSDtBQUNJLGFBQU8sSUFBQyxDQUFBLEVBQUUsQ0FBQyxJQUFKLEdBQVcsSUFBQyxDQUFBLEVBQUUsQ0FBQyxHQUFmLEdBQXFCLElBQUMsQ0FBQSxJQUE3QixDQURKO0tBQUEsTUFBQTtBQUdJLGFBQU8sSUFBQyxDQUFBLElBQVIsQ0FISjtLQURPO0VBQUEsQ0FSVixDQUFBOztnQkFBQTs7SUFKSixDQUFBOztBQUFBLENBa0JBLEdBQUksU0FBQyxJQUFELEVBQU8sTUFBUCxFQUFlLEVBQWYsRUFBbUIsS0FBbkIsR0FBQTtBQUNBLFNBQVcsSUFBQSxNQUFBLENBQU8sSUFBUCxFQUFhLE1BQWIsRUFBcUIsRUFBckIsRUFBeUIsS0FB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QUFBQSxPQXlWTyxDQUFDLElBQVIsR0FBZSxJQXpWZixDQUFBOztBQUFBLE9BMFZPLENBQUMsRUFBUixHQUFhLEVBMVZiLENBQUEiLCJzb3VyY2VzQ29udGVudCI6WyJ1dWlkID0gcmVxdWlyZSBcIm5vZGUtdXVpZFwiXG5cbmNsYXNzIFN5bWJvbFxuXG4gICAgY29uc3RydWN0b3I6IChAbmFtZSwgQG9iamVjdCwgQG5zLCBhdHRycykgLT5cbiAgICAgICAgaWYgYXR0cnM/XG4gICAgICAgICAgICBAYXR0cnMoYXR0cnMpXG5cbiAgICBhdHRyczogKGt2KSAtPlxuICAgICAgICBmb3IgaywgdiBpbiBrdlxuICAgICAgICAgICAgQFtrXSA9IHZcblxuICAgIHRvU3RyaW5nOiAtPlxuICAgICAgIGlmIEBucz9cbiAgICAgICAgICAgcmV0dXJuIEBucy5uYW1lICsgQG5zLnNlcCArIEBuYW1lXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgcmV0dXJuIEBuYW1lXG5cblMgPSAobmFtZSwgb2JqZWN0LCBucywgcHJvcHMpIC0+XG4gICAgcmV0dXJuIG5ldyBTeW1ib2wobmFtZSwgb2JqZWN0LCBucywgcHJvcHMpXG5cbmNsYXNzIE5hbWVTcGFjZVxuXG4gICAgY29uc3RydWN0b3I6IChAbmFtZSwgc2VwKSAtPlxuICAgICAgICBAZWxlbWVudHMgPSB7fVxuICAgICAgICBAc2VwID0gc2VwIHx8IFwiLlwiXG5cbiAgICBiaW5kOiAoc3ltYm9sLCBvYmplY3QpIC0+XG4gICAgICAgIG5hbWUgPSBzeW1ib2wubmFtZVxuICAgICAgICBzeW1ib2wub2JqZWN0ID0gb2JqZWN0XG4gICAgICAgIG9iamVjdC5zeW1ib2wgPSBzeW1ib2xcbiAgICAgICAgQGVsZW1lbnRzW25hbWVdID0gc3ltYm9sXG4gICAgICAgIHN5bWJvbC5ucyA9IHRoaXNcbiAgICAgICAgc3ltYm9sXG5cbiAgICB1bmJpbmQ6IChuYW1lKSAtPlxuICAgICAgICBzeW1ib2wgPSBAZWxlbWVudHNbbmFtZV1cbiAgICAgICAgZGVsZXRlIEBlbGVtZW50c1tuYW1lXVxuICAgICAgICBzeW1ib2wubnMgPSB1bmRlZmluZWRcbiAgICAgICAgc3ltYm9sXG5cbiAgICBzeW1ib2w6IChuYW1lKSAtPlxuICAgICAgICBAZWxlbWVudHNbbmFtZV1cblxuICAgIG9iamVjdDogKG5hbWUpIC0+XG4gICAgICAgIEBlbGVtZW50c1tuYW1lXS5vYmplY3RcblxuICAgIHN5bWJvbHM6ICgpIC0+XG4gICAgICAgc3ltYm9scyA9IFtdXG5cbiAgICAgICBmb3Igayx2IG9mIEBlbGVtZW50c1xuICAgICAgICAgICBzeW1ib2xzLnB1c2godilcblxuICAgICAgIHN5bWJvbHNcblxuICAgIG9iamVjdHM6ICgpIC0+XG4gICAgICAgb2JqZWN0cyA9IFtdXG5cbiAgICAgICBmb3Igayx2IG9mIEBlbGVtZW50c1xuICAgICAgICAgICBvYmplY3RzLnB1c2godi5vYmplY3QpXG5cbiAgICAgICBvYmplY3RzXG5cblxuY2xhc3MgRGF0YVxuXG4gICAgY29uc3RydWN0b3I6IChwcm9wcykgLT5cbiAgICAgICAgaWYgcHJvcHM/XG4gICAgICAgICAgICBAcHJvcHMocHJvcHMpXG5cbiAgICBwcm9wczogKGt2KSAtPlxuICAgICAgICBmb3IgaywgdiBvZiBrdlxuICAgICAgICAgICAgQFtrXSA9IHZcblxuRCA9IChwcm9wcykgLT5cbiAgICByZXR1cm4gbmV3IERhdGEoKVxuXG5cbmNsYXNzIEV2ZW50IGV4dGVuZHMgRGF0YVxuXG4gICAgY29uc3RydWN0b3I6IChAbmFtZSwgQHBheWxvYWQsIHByb3BzKSAtPlxuICAgICAgICBzdXBlcihwcm9wcylcblxuY2xhc3MgRXJyb3IgZXh0ZW5kcyBEYXRhXG5cbiAgICBjb25zdHJ1Y3RvcjogKEBuYW1lLCBAY29udGV4dCwgcHJvcHMpIC0+XG4gICAgICAgIHN1cGVyKHByb3BzKVxuXG5jbGFzcyBUb2tlbiBleHRlbmRzIERhdGFcblxuICAgIGNvbnN0cnVjdG9yOiAodmFsdWUsIHByb3BzKSAgLT5cbiAgICAgICAgQHZhbHVlID0gdmFsdWVcbiAgICAgICAgaWYgdHlwZW9mIEB2YWx1ZSBpcyBcInN0cmluZ1wiXG4gICAgICAgICAgICBAW0B2YWx1ZV0gPSB0cnVlXG4gICAgICAgIHN1cGVyKHByb3BzKVxuXG5UID0gKHZhbHVlLCBwcm9wcykgLT5cbiAgICByZXR1cm4gbmV3IFRva2VuKHZhbHVlLCBwcm9wcylcblxuY2xhc3MgQ29tcG9uZW50IGV4dGVuZHMgRGF0YVxuXG4gICAgY29uc3RydWN0b3I6IChAbmFtZSwgcHJvcHMpIC0+XG4gICAgICAgIHN1cGVyKG5hbWUpXG5cblxuY2xhc3MgRW50aXR5IGV4dGVuZHMgRGF0YVxuXG4gICAgY29uc3RydWN0b3I6IChAdGFncywgcHJvcHMpIC0+XG4gICAgICAgIEBpZCA9IHV1aWQudjQoKVxuICAgICAgICBAY29tcG9uZW50cyA9IG5ldyBOYW1lU3BhY2UoXCJjb21wb25lbnRzXCIpXG4gICAgICAgIHN1cGVyKHByb3BzKVxuXG4gICAgYWRkOiAoc3ltYm9sLCBjb21wb25lbnQpIC0+XG4gICAgICAgIEBjb21wb25lbnRzLmJpbmQoc3ltYm9sLCBjb21wb25lbnQpXG5cbiAgICByZW1vdmU6IChuYW1lKSAtPlxuICAgICAgICBAY29tcG9uZW50cy51bmJpbmQobmFtZSlcblxuICAgIHBhcnQ6IChuYW1lKSAtPlxuICAgICAgICBAY29tcG9uZW50cy5zeW1ib2wobmFtZSlcblxuXG5jbGFzcyBDZWxsIGV4dGVuZHMgRW50aXR5XG5cbiAgICBjb25zdHJ1Y3RvcjogKHRhZ3MsIHByb3BzKSAtPlxuICAgICAgICBzdXBlcih0YWdzLCBwcm9wcylcbiAgICAgICAgQG9ic2VydmVycz0gbmV3IE5hbWVTcGFjZShcIm9ic2VydmVyc1wiKVxuXG4gICAgbm90aWZ5OiAoZXZlbnQpIC0+XG4gICAgICAgZm9yIG9iIGluIEBvYnNlcnZlcnMub2JqZWN0cygpXG4gICAgICAgICAgICBvYi5yYWlzZShldmVudClcblxuICAgIGFkZDogKGNvbXBvbmVudCkgLT5cbiAgICAgICAgc3VwZXIgY29tcG9uZW50XG4gICAgICAgIGV2ZW50ID0gbmV3IEV2ZW50KFwiY29tcG9uZW50LWFkZGVkXCIsIHtjb21wb25lbnQ6IGNvbXBvbmVudH0pXG4gICAgICAgIEBub3RpZnkoZXZlbnQpXG5cbiAgICByZW1vdmU6IChuYW1lKSAtPlxuICAgICAgICBzdXBlciBuYW1lXG4gICAgICAgIGV2ZW50ID0gbmV3IEV2ZW50KFwiY29tcG9uZW50LXJlbW92ZWRcIiwge2NvbXBvbmVudDogY29tcG9uZW50fSlcbiAgICAgICAgQG5vdGlmeShldmVudClcblxuICAgIG9ic2VydmU6IChzeW1ib2wsIGRpc2NyZXRlU3lzdGVtKSAtPlxuICAgICAgICBAb2JzZXJ2ZXJzLmJpbmQoc3ltYm9sLCBkaXNjcmV0ZVN5c3RlbSlcblxuICAgIGZvcmdldDogKG5hbWUpIC0+XG4gICAgICAgIEBvYnNlcnZlcnMudW5iaW5kKG5hbWUpXG5cblxuY2xhc3MgU3lzdGVtXG5cbiAgICBjb25zdHJ1Y3RvcjogKEBmbG93LCBAY29uZikgLT5cbiAgICAgICAgQGlubGV0cyA9IG5ldyBOYW1lU3BhY2UoXCJpbmxldHNcIilcbiAgICAgICAgQGlubGV0cy5iaW5kKG5ldyBTeW1ib2woXCJzeXNpblwiKSxbXSlcbiAgICAgICAgQG91dGxldHMgPSBuZXcgTmFtZVNwYWNlKFwib3V0bGV0c1wiKVxuICAgICAgICBAb3V0bGV0cy5iaW5kKG5ldyBTeW1ib2woXCJzeXNvdXRcIiksW10pXG4gICAgICAgIEBvdXRsZXRzLmJpbmQobmV3IFN5bWJvbChcInN5c2VyclwiKSxbXSlcblxuICAgIGlucHV0VmFsaWRhdG9yOiAoZGF0YSwgaW5sZXQpIC0+XG4gICAgICAgIGNvbnNvbGUubG9nKEBzeW1ib2wubmFtZSlcbiAgICAgICAgY29uc29sZS5sb2coZGF0YSlcbiAgICAgICAgZGF0YVxuXG4gICAgb3V0cHV0VmFsaWRhdG9yOiAoZGF0YSwgb3V0bGV0KSAtPlxuICAgICAgICBjb25zb2xlLmxvZyhAc3ltYm9sLm5hbWUpXG4gICAgICAgIGNvbnNvbGUubG9nKGRhdGEpXG4gICAgICAgIGRhdGFcblxuICAgIHB1c2g6IChkYXRhLCBpbmxldF9uYW1lKSAtPlxuXG4gICAgICAgIGlubGV0X25hbWUgPSBpbmxldF9uYW1lIHx8IFwic3lzaW5cIlxuXG4gICAgICAgIHZhbGlkYXRlZF9kYXRhID0gQGlucHV0VmFsaWRhdG9yKGRhdGEsIFwiaW5sZXRcIilcblxuICAgICAgICBpZiB2YWxpZGF0ZWRfZGF0YSBpbnN0YW5jZW9mIEVycm9yXG4gICAgICAgICAgICBAZXJyb3IodmFsaWRhdGVkX2RhdGEpXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIEBwcm9jZXNzIGRhdGEsIGlubGV0X25hbWVcblxuICAgIHByb2Nlc3M6IChkYXRhLCBpbmxldF9uYW1lKSAtPlxuXG4gICAgZW1pdDogKGRhdGEsIG91dGxldF9uYW1lKSAtPlxuICAgICAgICBvdXRsZXRfbmFtZSA9IG91dGxldCB8fCBcInN5c291dFwiXG5cbiAgICAgICAgdmFsaWRhdGVkX2RhdGEgPSBAb3V0cHV0VmFsaWRhdG9yKGRhdGEsIG91dGxldClcblxuICAgICAgICBpZiB2YWxpZGF0ZWRfZGF0YSBpbnN0YW5jZW9mIEVycm9yXG4gICAgICAgICAgICBAZXJyb3IodmFsaWRhdGVkX2RhdGEpXG4gICAgICAgICAgICByZXR1cm5cblxuICAgICAgICBmb3Igb3V0bGV0IGluIEBvdXRsZXRzLnN5bWJvbHMoKVxuICAgICAgICAgICAgaWYgb3V0bGV0Lm5hbWUgPT0gb3V0bGV0X25hbWVcbiAgICAgICAgICAgICAgICBmb3IgY29ubmVjdGlvbiBpbiBvdXRsZXQub2JqZWN0XG4gICAgICAgICAgICAgICAgICAgIGNvbm5lY3Rpb24ub2JqZWN0LnRyYW5zbWl0IGRhdGFcblxuICAgIGVycm9yOiAoZXJyb3IpIC0+XG4gICAgICAgIGZvciBvdXRsZXQgaW4gQG91dGxldHMuc3ltYm9scygpXG4gICAgICAgICAgICBpZiBvdXRsZXQubmFtZSA9PSBcInN5c2VyclwiXG4gICAgICAgICAgICAgICAgZm9yIGNvbm5lY3Rpb24gaW4gb3V0bGV0Lm9iamVjdFxuICAgICAgICAgICAgICAgICAgICBjb25uZWN0aW9uLm9iamVjdC50cmFuc21pdCAoZGF0YSlcblxuXG5jbGFzcyBEaXNjcmV0ZVN5c3RlbVxuXG4gICAgY29uc3RydWN0b3I6IChAZmxvdywgQGNvbmYpIC0+XG5cbiAgICByYWlzZTogKGV2ZW50KSAtPlxuXG5cbmNsYXNzIEdPIGV4dGVuZHMgRGlzY3JldGVTeXN0ZW1cblxuICAgIGNvbnN0cnVjdG9yOiAoQGZsb3csIEBjb25mKSAtPlxuICAgIHNob3c6IChkYXRhKSAtPlxuXG5cbmNsYXNzIFdpcmVcblxuICAgIGNvbnN0cnVjdG9yOiAoQG91dGxldCwgQGlubGV0KSAtPlxuXG5cbmNsYXNzIENvbm5lY3Rpb25cblxuICAgIGNvbnN0cnVjdG9yOiAoc291cmNlLCAgc2luaywgQGZsb3csIHdpcmUpIC0+XG4gICAgICAgIEBzb3VyY2UgPSBAZmxvdy5zeXN0ZW1zLm9iamVjdChzb3VyY2UpXG4gICAgICAgIEBzaW5rID0gQGZsb3cuc3lzdGVtcy5vYmplY3Qoc2luaylcbiAgICAgICAgQHdpcmUgPSB3aXJlIHx8IG5ldyBXaXJlKFwic3lzb3V0XCIsIFwic3lzaW5cIilcblxuICAgIHRyYW5zbWl0OiAoZGF0YSkgLT5cbiAgICAgICAgQHNpbmsucHVzaChkYXRhLCBAd2lyZS5pbmxldClcblxuXG5jbGFzcyBTdG9yZVxuXG4gICAgY29uc3RydWN0b3I6IC0+XG4gICAgICAgIEBlbnRpdGllcyA9IG5ldyBOYW1lU3BhY2UoXCJlbnRpdGllc1wiKVxuXG4gICAgYWRkOiAoc3ltYm9sLCB0YWdzLCBwcm9wcykgLT5cbiAgICAgICAgdGFncyA9IHRhZ3MgfHwgW11cbiAgICAgICAgZW50aXR5ID0gbmV3IEVudGl0eSh0YWdzLCBwcm9wcylcbiAgICAgICAgQGVudGl0aWVzLmJpbmQoc3ltYm9sLCBlbnRpdHkpXG4gICAgICAgIHN5bWJvbFxuXG4gICAgZW50aXR5OiAobmFtZSkgLT5cbiAgICAgICAgQGVudGl0aWVzLm9iamVjdChuYW1lKVxuXG4gICAgcmVtb3ZlOiAobmFtZSkgLT5cbiAgICAgICAgQGVudGl0aWVzLnVuYmluZChuYW1lKVxuXG4gICAgaWQ6IChpZCkgLT5cbiAgICAgICAgZm9yIGVudGl0eSBpbiBAZW50aXRpZXMub2JqZWN0cygpXG4gICAgICAgICAgICBpZiBlbnRpdHkuaWQgaXMgaWRcbiAgICAgICAgICAgICAgICByZXR1cm4gZW50aXR5XG5cbiAgICAgICAgcmV0dXJuIG51bGxcblxuICAgIHJlbW92ZUlkOiAoaWQpIC0+XG4gICAgICAgIGZvciBlbnRpdHlfc3ltYm9sIGluIEBlbnRpdGllcy5zeW1ib2xzKClcbiAgICAgICAgICAgIGlmIGVudGl0eV9zeW1ib2wub2JqZWN0IGlzIGlkXG4gICAgICAgICAgICAgICAgQGVudGl0aWVzLnVuYmluZChlbnRpdHlfc3ltYm9sLm5hbWUpXG5cbiAgICAgICAgcmV0dXJuIG51bGxcblxuICAgIHRhZ3M6ICh0YWdzKSAtPlxuICAgICAgICBlbnRpdGllcyA9IFtdXG4gICAgICAgIGZvciBlbnRpdHkgaW4gQGVudGl0aWVzLm9iamVjdHMoKVxuICAgICAgICAgICAgZm9yIHRhZyBpbiB0YWdzXG4gICAgICAgICAgICAgICAgaWYgdGFnIGluIGVudGl0eS50YWdzXG4gICAgICAgICAgICAgICAgICAgIGVudGl0aWVzLnB1c2ggZW50aXR5XG5cbiAgICAgICAgcmV0dXJuIGVudGl0aWVzXG5cbmNsYXNzIEJ1c1xuXG4gICAgY29uc3RydWN0b3I6IC0+XG4gICAgICAgIEBkaXNjcmV0ZVN5c3RlbXMgPSBuZXcgTmFtZVNwYWNlKFwiZGlzY3JldGVTeXN0ZW1zXCIpXG5cbiAgICBhZGQ6IChzeW1ib2wsIGRpc2NyZXRlU3lzdGVtQ2xhc3MsIGNvbmYpIC0+XG4gICAgICAgIGRpc2NyZXRlX3N5dGVtID0gbmV3IGRpc2NyZXRlU3lzdGVtQ2xhc3ModGhpcywgY29uZilcbiAgICAgICAgQGRpc2NyZXRlU3lzdGVtcy5iaW5kKHN5bWJvbCwgZGlzY3JldGVfc3l0ZW0pXG5cbiAgICByZW1vdmU6IChuYW1lKSAtPlxuICAgICAgICBAZGlzY3JldGVTeXN0ZW1zLnVuYmluZChuYW1lKVxuXG4gICAgdHJpZ2dlcjogKGV2ZW50KSAtPlxuICAgICAgICBmb3Igb2JqIGluIEBkaXNjcmV0ZVN5c3RlbXMub2JqZWN0cygpXG4gICAgICAgICAgICAgICAgb2JqLnJhaXNlKGV2ZW50KVxuXG5jbGFzcyBGbG93XG5cbiAgICBjb25zdHJ1Y3RvcjogKCkgLT5cbiAgICAgICAgQGJ1cyA9IG5ldyBCdXMoKVxuICAgICAgICBAc3RvcmUgPSBuZXcgU3RvcmUoKVxuICAgICAgICBAc3lzdGVtcyA9IG5ldyBOYW1lU3BhY2UoXCJzeXN0ZW1zXCIpXG4gICAgICAgIEBjb25uZWN0aW9ucyA9IG5ldyBOYW1lU3BhY2UoXCJzeXN0ZW1zLmNvbm5lY3Rpb25zXCIpXG5cbiAgICBjb25uZWN0OiAoc291cmNlLCBzaW5rLCB3aXJlKSAtPlxuXG4gICAgICAgIGNvbm5lY3Rpb24gPSBuZXcgQ29ubmVjdGlvbihzb3VyY2UsIHNpbmssIHRoaXMsIHdpcmUpXG4gICAgICAgIG5hbWUgPSBcIiN7c291cmNlfTo6I3tjb25uZWN0aW9uLndpcmUub3V0bGV0fS0je3Npbmt9Ojoje2Nvbm5lY3Rpb24ud2lyZS5pbmxldH1cIlxuICAgICAgICBzeW1ib2wgPSBuZXcgU3ltYm9sKG5hbWUpXG4gICAgICAgIEBjb25uZWN0aW9ucy5iaW5kKHN5bWJvbCwgY29ubmVjdGlvbilcblxuICAgICAgICBmb3Igb3V0bGV0IGluIGNvbm5lY3Rpb24uc291cmNlLm91dGxldHMuc3ltYm9scygpXG4gICAgICAgICAgICBpZiBvdXRsZXQubmFtZSBpcyBjb25uZWN0aW9uLndpcmUub3V0bGV0XG4gICAgICAgICAgICAgICAgb3V0bGV0Lm9iamVjdC5wdXNoKHN5bWJvbClcblxuICAgIGRpc2Nvbm5lY3Q6IChuYW1lKSAtPlxuICAgICAgICBjb25uZWN0aW9uID0gQGNvbm5lY3Rpb24obmFtZSlcbiAgICAgICAgQGNvbm5lY3Rpb25zLnVuYmluZChuYW1lKVxuXG4gICAgICAgIGZvciBvdXRsZXQgaW4gY29ubmVjdGlvbi5zb3VyY2Uub3V0bGV0cy5zeW1ib2xzKClcbiAgICAgICAgICAgIGlmIG91dGxldC5uYW1lIGlzIHdpcmUub3V0bGV0XG4gICAgICAgICAgICAgICAgY29ubmVjdGlvbnMgPSBbXVxuICAgICAgICAgICAgICAgIGZvciBjb25uIGluIG91dGxldC5vYmplY3RcbiAgICAgICAgICAgICAgICAgICAgaWYgY29ubi5uYW1lICE9IG5hbWVcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbm5lY3Rpb25zLnB1c2goY29ubilcbiAgICAgICAgICAgICAgICBvdXRsZXQub2JqZWN0ID0gY29ubmVjdGlvbnNcblxuXG4gICAgY29ubmVjdGlvbjogKG5hbWUpIC0+XG4gICAgICAgIEBjb25uZWN0aW9ucy5vYmplY3QobmFtZSlcblxuICAgIGFkZDogKHN5bWJvbCwgc3lzdGVtQ2xhc3MsIGNvbmYpIC0+XG4gICAgICAgIHN5c3RlbSA9IG5ldyBzeXN0ZW1DbGFzcyh0aGlzLCBjb25mKVxuICAgICAgICBAc3lzdGVtcy5iaW5kKHN5bWJvbCwgc3lzdGVtKVxuXG4gICAgc3lzdGVtOiAobmFtZSkgLT5cbiAgICAgICAgQHN5c3RlbXMub2JqZWN0KG5hbWUpXG5cbiAgICByZW1vdmU6IChuYW1lKSAtPlxuICAgICAgICBAc3lzdGVtcy51bmJpbmQoc3ltYm9sLCBzeXN0ZW0pXG5cbmV4cG9ydHMuU3ltYm9sID0gU3ltYm9sXG5leHBvcnRzLlMgPSBTXG5leHBvcnRzLlRva2VuID0gVG9rZW5cbmV4cG9ydHMuVCA9IFRcbmV4cG9ydHMuTmFtZVNwYWNlID0gTmFtZVNwYWNlXG5leHBvcnRzLlN5c3RlbSA9IFN5c3RlbVxuZXhwb3J0cy5EaXNjcmV0ZVN5c3RlbSA9IERpc2NyZXRlU3lzdGVtXG5leHBvcnRzLldpcmUgPSBXaXJlXG5leHBvcnRzLkNvbm5lY3Rpb24gPSBDb25uZWN0aW9uXG5leHBvcnRzLkV2ZW50ID0gRXZlbnRcbmV4cG9ydHMuRW50aXR5ID0gRW50aXR5XG5leHBvcnRzLkVycm9yID0gRXJyb3JcbmV4cG9ydHMuQnVzID0gQnVzXG5leHBvcnRzLkZsb3cgPSBGbG93XG5leHBvcnRzLkdPID0gR09cblxuIl0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9