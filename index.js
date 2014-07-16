var Bus, Cell, Component, Connection, D, Data, Entity, Event, Flow, Glitch, NameSpace, S, Store, Symbol, System, T, Token, Wire, clone, uuid,
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
  function System(flow, conf) {
    this.flow = flow;
    this.conf = conf;
    this.inlets = new NameSpace("inlets");
    this.inlets.bind(new Symbol("sysin"), []);
    this.inlets.bind(new Symbol("feedback"), []);
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
    if (validated_data instanceof Glitch) {
      return this.error(validated_data);
    } else {
      return this.process(data, inlet_name);
    }
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

Bus = (function() {
  function Bus() {
    this.systems = new NameSpace("bus");
  }

  Bus.prototype.add = function(symbol, SystemClass, conf) {
    var sytem;
    sytem = new SystemClass(this, conf);
    return this.systems.bind(symbol, sytem);
  };

  Bus.prototype.remove = function(name) {
    return this.systems.unbind(name);
  };

  Bus.prototype.trigger = function(event) {
    var obj, _i, _len, _ref, _results;
    _ref = this.systems.objects();
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VzIjpbImluZGV4LmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxJQUFBLHdJQUFBO0VBQUE7Ozt1SkFBQTs7QUFBQSxJQUFBLEdBQU8sT0FBQSxDQUFRLFdBQVIsQ0FBUCxDQUFBOztBQUFBLEtBQ0EsR0FBUSxPQUFBLENBQVEsT0FBUixDQURSLENBQUE7O0FBQUE7QUFLaUIsRUFBQSxnQkFBRSxJQUFGLEVBQVMsTUFBVCxFQUFrQixFQUFsQixFQUFzQixLQUF0QixHQUFBO0FBQ1QsSUFEVSxJQUFDLENBQUEsT0FBQSxJQUNYLENBQUE7QUFBQSxJQURpQixJQUFDLENBQUEsU0FBQSxNQUNsQixDQUFBO0FBQUEsSUFEMEIsSUFBQyxDQUFBLEtBQUEsRUFDM0IsQ0FBQTtBQUFBLElBQUEsSUFBRyxhQUFIO0FBQ0ksTUFBQSxJQUFDLENBQUEsS0FBRCxDQUFPLEtBQVAsQ0FBQSxDQURKO0tBRFM7RUFBQSxDQUFiOztBQUFBLG1CQUlBLEtBQUEsR0FBTyxTQUFDLEVBQUQsR0FBQTtBQUNILFFBQUEsd0JBQUE7QUFBQTtTQUFBLGlEQUFBO2dCQUFBO0FBQ0ksb0JBQUEsSUFBRSxDQUFBLENBQUEsQ0FBRixHQUFPLEVBQVAsQ0FESjtBQUFBO29CQURHO0VBQUEsQ0FKUCxDQUFBOztBQUFBLG1CQVFBLFFBQUEsR0FBVSxTQUFBLEdBQUE7QUFDUCxJQUFBLElBQUcsZUFBSDtBQUNJLGFBQU8sSUFBQyxDQUFBLEVBQUUsQ0FBQyxJQUFKLEdBQVcsSUFBQyxDQUFBLEVBQUUsQ0FBQyxHQUFmLEdBQXFCLElBQUMsQ0FBQSxJQUE3QixDQURKO0tBQUEsTUFBQTtBQUdJLGFBQU8sSUFBQyxDQUFBLElBQVIsQ0FISjtLQURPO0VBQUEsQ0FSVixDQUFBOztnQkFBQTs7SUFMSixDQUFBOztBQUFBLENBbUJBLEdBQUksU0FBQyxJQUFELEVBQU8sTUFBUCxFQUFlLEVBQWYsRUFBbUIsS0FBbkIsR0FBQTtBQUNBLFNBQVcsSUFBQSxNQUFB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QUFSLEdBQWlCLE1BdFZqQixDQUFBOztBQUFBLE9BdVZPLENBQUMsSUFBUixHQUFlLElBdlZmLENBQUE7O0FBQUEsT0F3Vk8sQ0FBQyxNQUFSLEdBQWlCLE1BeFZqQixDQUFBOztBQUFBLE9BeVZPLENBQUMsSUFBUixHQUFlLElBelZmLENBQUE7O0FBQUEsT0EwVk8sQ0FBQyxVQUFSLEdBQXFCLFVBMVZyQixDQUFBOztBQUFBLE9BMlZPLENBQUMsS0FBUixHQUFnQixLQTNWaEIsQ0FBQTs7QUFBQSxPQTRWTyxDQUFDLEdBQVIsR0FBYyxHQTVWZCxDQUFBOztBQUFBLE9BNlZPLENBQUMsSUFBUixHQUFlLElBN1ZmLENBQUEiLCJzb3VyY2VzQ29udGVudCI6WyJ1dWlkID0gcmVxdWlyZSBcIm5vZGUtdXVpZFwiXG5jbG9uZSA9IHJlcXVpcmUgXCJjbG9uZVwiXG5cbmNsYXNzIFN5bWJvbFxuXG4gICAgY29uc3RydWN0b3I6IChAbmFtZSwgQG9iamVjdCwgQG5zLCBhdHRycykgLT5cbiAgICAgICAgaWYgYXR0cnM/XG4gICAgICAgICAgICBAYXR0cnMoYXR0cnMpXG5cbiAgICBhdHRyczogKGt2KSAtPlxuICAgICAgICBmb3IgaywgdiBpbiBrdlxuICAgICAgICAgICAgQFtrXSA9IHZcblxuICAgIHRvU3RyaW5nOiAtPlxuICAgICAgIGlmIEBucz9cbiAgICAgICAgICAgcmV0dXJuIEBucy5uYW1lICsgQG5zLnNlcCArIEBuYW1lXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgcmV0dXJuIEBuYW1lXG5cblMgPSAobmFtZSwgb2JqZWN0LCBucywgcHJvcHMpIC0+XG4gICAgcmV0dXJuIG5ldyBTeW1ib2wobmFtZSwgb2JqZWN0LCBucywgcHJvcHMpXG5cbmNsYXNzIE5hbWVTcGFjZVxuXG4gICAgY29uc3RydWN0b3I6IChAbmFtZSwgc2VwKSAtPlxuICAgICAgICBAZWxlbWVudHMgPSB7fVxuICAgICAgICBAc2VwID0gc2VwIHx8IFwiLlwiXG5cbiAgICBiaW5kOiAoc3ltYm9sLCBvYmplY3QpIC0+XG4gICAgICAgIG5hbWUgPSBzeW1ib2wubmFtZVxuICAgICAgICBzeW1ib2wub2JqZWN0ID0gb2JqZWN0XG4gICAgICAgIG9iamVjdC5zeW1ib2wgPSBzeW1ib2xcbiAgICAgICAgQGVsZW1lbnRzW25hbWVdID0gc3ltYm9sXG4gICAgICAgIHN5bWJvbC5ucyA9IHRoaXNcbiAgICAgICAgc3ltYm9sXG5cbiAgICB1bmJpbmQ6IChuYW1lKSAtPlxuICAgICAgICBzeW1ib2wgPSBAZWxlbWVudHNbbmFtZV1cbiAgICAgICAgZGVsZXRlIEBlbGVtZW50c1tuYW1lXVxuICAgICAgICBzeW1ib2wubnMgPSB1bmRlZmluZWRcbiAgICAgICAgc3ltYm9sXG5cbiAgICBzeW1ib2w6IChuYW1lKSAtPlxuICAgICAgICBAZWxlbWVudHNbbmFtZV1cblxuICAgIG9iamVjdDogKG5hbWUpIC0+XG4gICAgICAgIEBlbGVtZW50c1tuYW1lXS5vYmplY3RcblxuICAgIHN5bWJvbHM6ICgpIC0+XG4gICAgICAgc3ltYm9scyA9IFtdXG5cbiAgICAgICBmb3Igayx2IG9mIEBlbGVtZW50c1xuICAgICAgICAgICBzeW1ib2xzLnB1c2godilcblxuICAgICAgIHN5bWJvbHNcblxuICAgIG9iamVjdHM6ICgpIC0+XG4gICAgICAgb2JqZWN0cyA9IFtdXG5cbiAgICAgICBmb3Igayx2IG9mIEBlbGVtZW50c1xuICAgICAgICAgICBvYmplY3RzLnB1c2godi5vYmplY3QpXG5cbiAgICAgICBvYmplY3RzXG5cblxuY2xhc3MgRGF0YVxuXG4gICAgY29uc3RydWN0b3I6IChwcm9wcykgLT5cbiAgICAgICAgaWYgcHJvcHM/XG4gICAgICAgICAgICBAcHJvcHMocHJvcHMpXG5cbiAgICBwcm9wczogKGt2KSAtPlxuICAgICAgICBmb3IgaywgdiBvZiBrdlxuICAgICAgICAgICAgQFtrXSA9IHZcblxuRCA9IChwcm9wcykgLT5cbiAgICByZXR1cm4gbmV3IERhdGEoKVxuXG5jbGFzcyBFdmVudCBleHRlbmRzIERhdGFcblxuICAgIGNvbnN0cnVjdG9yOiAoQG5hbWUsIEBwYXlsb2FkLCBwcm9wcykgLT5cbiAgICAgICAgc3VwZXIocHJvcHMpXG5cbmNsYXNzIEdsaXRjaCBleHRlbmRzIERhdGFcblxuICAgIGNvbnN0cnVjdG9yOiAoQG5hbWUsIEBjb250ZXh0LCBwcm9wcykgLT5cbiAgICAgICAgc3VwZXIocHJvcHMpXG5cbmNsYXNzIFRva2VuIGV4dGVuZHMgRGF0YVxuXG4gICAgY29uc3RydWN0b3I6ICh2YWx1ZSwgcHJvcHMpICAtPlxuICAgICAgICBAdmFsdWUgPSB2YWx1ZVxuICAgICAgICBpZiB0eXBlb2YgQHZhbHVlIGlzIFwic3RyaW5nXCJcbiAgICAgICAgICAgIEBbQHZhbHVlXSA9IHRydWVcbiAgICAgICAgc3VwZXIocHJvcHMpXG5cblQgPSAodmFsdWUsIHByb3BzKSAtPlxuICAgIHJldHVybiBuZXcgVG9rZW4odmFsdWUsIHByb3BzKVxuXG5jbGFzcyBDb21wb25lbnQgZXh0ZW5kcyBEYXRhXG5cbiAgICBjb25zdHJ1Y3RvcjogKEBuYW1lLCBwcm9wcykgLT5cbiAgICAgICAgc3VwZXIobmFtZSlcblxuXG5jbGFzcyBFbnRpdHkgZXh0ZW5kcyBEYXRhXG5cbiAgICBjb25zdHJ1Y3RvcjogKEB0YWdzLCBwcm9wcykgLT5cbiAgICAgICAgQGlkID0gdXVpZC52NCgpXG4gICAgICAgIEBjb21wb25lbnRzID0gbmV3IE5hbWVTcGFjZShcImNvbXBvbmVudHNcIilcbiAgICAgICAgc3VwZXIocHJvcHMpXG5cbiAgICBhZGQ6IChzeW1ib2wsIGNvbXBvbmVudCkgLT5cbiAgICAgICAgQGNvbXBvbmVudHMuYmluZChzeW1ib2wsIGNvbXBvbmVudClcblxuICAgIHJlbW92ZTogKG5hbWUpIC0+XG4gICAgICAgIEBjb21wb25lbnRzLnVuYmluZChuYW1lKVxuXG4gICAgcGFydDogKG5hbWUpIC0+XG4gICAgICAgIEBjb21wb25lbnRzLnN5bWJvbChuYW1lKVxuXG5cbmNsYXNzIENlbGwgZXh0ZW5kcyBFbnRpdHlcblxuICAgIGNvbnN0cnVjdG9yOiAodGFncywgcHJvcHMpIC0+XG4gICAgICAgIHN1cGVyKHRhZ3MsIHByb3BzKVxuICAgICAgICBAb2JzZXJ2ZXJzPSBuZXcgTmFtZVNwYWNlKFwib2JzZXJ2ZXJzXCIpXG5cbiAgICBub3RpZnk6IChldmVudCkgLT5cbiAgICAgICBmb3Igb2IgaW4gQG9ic2VydmVycy5vYmplY3RzKClcbiAgICAgICAgICAgIG9iLnJhaXNlKGV2ZW50KVxuXG4gICAgYWRkOiAoY29tcG9uZW50KSAtPlxuICAgICAgICBzdXBlciBjb21wb25lbnRcbiAgICAgICAgZXZlbnQgPSBuZXcgRXZlbnQoXCJjb21wb25lbnQtYWRkZWRcIiwge2NvbXBvbmVudDogY29tcG9uZW50LCBjZWxsOiB0aGlzfSlcbiAgICAgICAgQG5vdGlmeShldmVudClcblxuICAgIHJlbW92ZTogKG5hbWUpIC0+XG4gICAgICAgIHN1cGVyIG5hbWVcbiAgICAgICAgZXZlbnQgPSBuZXcgRXZlbnQoXCJjb21wb25lbnQtcmVtb3ZlZFwiLCB7Y29tcG9uZW50OiBjb21wb25lbnQsIGNlbGw6IHRoaXN9KVxuICAgICAgICBAbm90aWZ5KGV2ZW50KVxuXG4gICAgb2JzZXJ2ZTogKHN5bWJvbCwgc3lzdGVtKSAtPlxuICAgICAgICBAb2JzZXJ2ZXJzLmJpbmQoc3ltYm9sLCBzeXN0ZW0pXG5cbiAgICBmb3JnZXQ6IChuYW1lKSAtPlxuICAgICAgICBAb2JzZXJ2ZXJzLnVuYmluZChuYW1lKVxuXG4gICAgc3RlcDogKGZuLCBhcmdzLi4uKSAtPlxuICAgICAgICByZXR1cm4gZm4uYXBwbHkodGhpcywgYXJncylcblxuICAgIGNsb25lOiAoKSAtPlxuICAgICAgICByZXR1cm4gY2xvbmUodGhpcylcblxuXG5jbGFzcyBTeXN0ZW1cblxuICAgIGNvbnN0cnVjdG9yOiAoQGZsb3csIEBjb25mKSAtPlxuICAgICAgICBAaW5sZXRzID0gbmV3IE5hbWVTcGFjZShcImlubGV0c1wiKVxuICAgICAgICBAaW5sZXRzLmJpbmQobmV3IFN5bWJvbChcInN5c2luXCIpLFtdKVxuICAgICAgICBAaW5sZXRzLmJpbmQobmV3IFN5bWJvbChcImZlZWRiYWNrXCIpLFtdKVxuICAgICAgICBAb3V0bGV0cyA9IG5ldyBOYW1lU3BhY2UoXCJvdXRsZXRzXCIpXG4gICAgICAgIEBvdXRsZXRzLmJpbmQobmV3IFN5bWJvbChcInN5c291dFwiKSxbXSlcbiAgICAgICAgQG91dGxldHMuYmluZChuZXcgU3ltYm9sKFwic3lzZXJyXCIpLFtdKVxuXG4gICAgaW5wdXRWYWxpZGF0b3I6IChkYXRhLCBpbmxldCkgLT5cbiAgICAgICAgY29uc29sZS5sb2coQHN5bWJvbC5uYW1lKVxuICAgICAgICBjb25zb2xlLmxvZyhkYXRhKVxuICAgICAgICBkYXRhXG5cbiAgICBvdXRwdXRWYWxpZGF0b3I6IChkYXRhLCBvdXRsZXQpIC0+XG4gICAgICAgIGNvbnNvbGUubG9nKEBzeW1ib2wubmFtZSlcbiAgICAgICAgY29uc29sZS5sb2coZGF0YSlcbiAgICAgICAgZGF0YVxuXG4gICAgcHVzaDogKGRhdGEsIGlubGV0X25hbWUpIC0+XG5cbiAgICAgICAgaW5sZXRfbmFtZSA9IGlubGV0X25hbWUgfHwgXCJzeXNpblwiXG5cbiAgICAgICAgdmFsaWRhdGVkX2RhdGEgPSBAaW5wdXRWYWxpZGF0b3IoZGF0YSwgXCJpbmxldFwiKVxuXG4gICAgICAgIGlmIHZhbGlkYXRlZF9kYXRhIGluc3RhbmNlb2YgR2xpdGNoXG4gICAgICAgICAgICBAZXJyb3IodmFsaWRhdGVkX2RhdGEpXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIEBwcm9jZXNzIGRhdGEsIGlubGV0X25hbWVcblxuICAgIHByb2Nlc3M6IChkYXRhLCBpbmxldF9uYW1lKSAtPlxuICAgICAgICBAZW1pdChkYXRhLCBcInN0ZG91dFwiKVxuXG4gICAgc2VuZDogKGRhdGEsIG91dGxldF9uYW1lKSAtPlxuICAgICAgICBmb3Igb3V0bGV0IGluIEBvdXRsZXRzLnN5bWJvbHMoKVxuICAgICAgICAgICAgaWYgb3V0bGV0Lm5hbWUgPT0gb3V0bGV0X25hbWVcbiAgICAgICAgICAgICAgICBmb3IgY29ubmVjdGlvbiBpbiBvdXRsZXQub2JqZWN0XG4gICAgICAgICAgICAgICAgICAgIGNvbm5lY3Rpb24ub2JqZWN0LnRyYW5zbWl0IGRhdGFcblxuICAgIGVtaXQ6IChkYXRhLCBvdXRsZXRfbmFtZSkgLT5cbiAgICAgICAgb3V0bGV0X25hbWUgPSBvdXRsZXRfbmFtZSB8fCBcInN5c291dFwiXG5cbiAgICAgICAgdmFsaWRhdGVkX2RhdGEgPSBAb3V0cHV0VmFsaWRhdG9yKGRhdGEsIG91dGxldF9uYW1lKVxuXG4gICAgICAgIGlmIHZhbGlkYXRlZF9kYXRhIGluc3RhbmNlb2YgR2xpdGNoXG4gICAgICAgICAgICBAZXJyb3IodmFsaWRhdGVkX2RhdGEpXG4gICAgICAgICAgICByZXR1cm5cblxuICAgICAgICBAc2VuZChkYXRhLCBvdXRsZXRfbmFtZSlcblxuXG4gICAgZXJyb3I6IChkYXRhKSAtPlxuICAgICAgICBAc2VuZChkYXRhLCBcInN5c2VyclwiKVxuXG4gICAgcmFpc2U6IChldmVudCkgLT5cblxuICAgIHNob3c6IChkYXRhKSAtPlxuXG5cbmNsYXNzIFdpcmVcblxuICAgIGNvbnN0cnVjdG9yOiAoQG91dGxldCwgQGlubGV0KSAtPlxuXG5cbmNsYXNzIENvbm5lY3Rpb25cblxuICAgIGNvbnN0cnVjdG9yOiAoc291cmNlLCAgc2luaywgQGZsb3csIHdpcmUpIC0+XG4gICAgICAgIEBzb3VyY2UgPSBAZmxvdy5zeXN0ZW1zLm9iamVjdChzb3VyY2UpXG4gICAgICAgIEBzaW5rID0gQGZsb3cuc3lzdGVtcy5vYmplY3Qoc2luaylcbiAgICAgICAgQHdpcmUgPSB3aXJlIHx8IG5ldyBXaXJlKFwic3lzb3V0XCIsIFwic3lzaW5cIilcblxuICAgIHRyYW5zbWl0OiAoZGF0YSkgLT5cbiAgICAgICAgQHNpbmsucHVzaChkYXRhLCBAd2lyZS5pbmxldClcblxuXG5jbGFzcyBTdG9yZVxuXG4gICAgY29uc3RydWN0b3I6IC0+XG4gICAgICAgIEBlbnRpdGllcyA9IG5ldyBOYW1lU3BhY2UoXCJlbnRpdGllc1wiKVxuXG4gICAgYWRkOiAoc3ltYm9sLCB0YWdzLCBwcm9wcykgLT5cbiAgICAgICAgdGFncyA9IHRhZ3MgfHwgW11cbiAgICAgICAgZW50aXR5ID0gbmV3IEVudGl0eSh0YWdzLCBwcm9wcylcbiAgICAgICAgQGVudGl0aWVzLmJpbmQoc3ltYm9sLCBlbnRpdHkpXG4gICAgICAgIHN5bWJvbFxuXG4gICAgZW50aXR5OiAobmFtZSkgLT5cbiAgICAgICAgQGVudGl0aWVzLm9iamVjdChuYW1lKVxuXG4gICAgcmVtb3ZlOiAobmFtZSkgLT5cbiAgICAgICAgQGVudGl0aWVzLnVuYmluZChuYW1lKVxuXG4gICAgaWQ6IChpZCkgLT5cbiAgICAgICAgZm9yIGVudGl0eSBpbiBAZW50aXRpZXMub2JqZWN0cygpXG4gICAgICAgICAgICBpZiBlbnRpdHkuaWQgaXMgaWRcbiAgICAgICAgICAgICAgICByZXR1cm4gZW50aXR5XG5cbiAgICAgICAgcmV0dXJuIG51bGxcblxuICAgIHJlbW92ZUlkOiAoaWQpIC0+XG4gICAgICAgIGZvciBlbnRpdHlfc3ltYm9sIGluIEBlbnRpdGllcy5zeW1ib2xzKClcbiAgICAgICAgICAgIGlmIGVudGl0eV9zeW1ib2wub2JqZWN0IGlzIGlkXG4gICAgICAgICAgICAgICAgQGVudGl0aWVzLnVuYmluZChlbnRpdHlfc3ltYm9sLm5hbWUpXG5cbiAgICAgICAgcmV0dXJuIG51bGxcblxuICAgIHRhZ3M6ICh0YWdzKSAtPlxuICAgICAgICBlbnRpdGllcyA9IFtdXG4gICAgICAgIGZvciBlbnRpdHkgaW4gQGVudGl0aWVzLm9iamVjdHMoKVxuICAgICAgICAgICAgZm9yIHRhZyBpbiB0YWdzXG4gICAgICAgICAgICAgICAgaWYgdGFnIGluIGVudGl0eS50YWdzXG4gICAgICAgICAgICAgICAgICAgIGVudGl0aWVzLnB1c2ggZW50aXR5XG5cbiAgICAgICAgcmV0dXJuIGVudGl0aWVzXG5cbmNsYXNzIEJ1c1xuXG4gICAgY29uc3RydWN0b3I6IC0+XG4gICAgICAgIEBzeXN0ZW1zID0gbmV3IE5hbWVTcGFjZShcImJ1c1wiKVxuXG4gICAgYWRkOiAoc3ltYm9sLCBTeXN0ZW1DbGFzcywgY29uZikgLT5cbiAgICAgICAgc3l0ZW0gPSBuZXcgU3lzdGVtQ2xhc3ModGhpcywgY29uZilcbiAgICAgICAgQHN5c3RlbXMuYmluZChzeW1ib2wsIHN5dGVtKVxuXG4gICAgcmVtb3ZlOiAobmFtZSkgLT5cbiAgICAgICAgQHN5c3RlbXMudW5iaW5kKG5hbWUpXG5cbiAgICB0cmlnZ2VyOiAoZXZlbnQpIC0+XG4gICAgICAgIGZvciBvYmogaW4gQHN5c3RlbXMub2JqZWN0cygpXG4gICAgICAgICAgICAgICAgb2JqLnJhaXNlKGV2ZW50KVxuXG5jbGFzcyBGbG93XG5cbiAgICBjb25zdHJ1Y3RvcjogKCkgLT5cbiAgICAgICAgQGJ1cyA9IG5ldyBCdXMoKVxuICAgICAgICBAc3RvcmUgPSBuZXcgU3RvcmUoKVxuICAgICAgICBAc3lzdGVtcyA9IG5ldyBOYW1lU3BhY2UoXCJzeXN0ZW1zXCIpXG4gICAgICAgIEBjb25uZWN0aW9ucyA9IG5ldyBOYW1lU3BhY2UoXCJzeXN0ZW1zLmNvbm5lY3Rpb25zXCIpXG5cbiAgICBjb25uZWN0OiAoc291cmNlLCBzaW5rLCB3aXJlKSAtPlxuXG4gICAgICAgIGNvbm5lY3Rpb24gPSBuZXcgQ29ubmVjdGlvbihzb3VyY2UsIHNpbmssIHRoaXMsIHdpcmUpXG4gICAgICAgIG5hbWUgPSBcIiN7c291cmNlfTo6I3tjb25uZWN0aW9uLndpcmUub3V0bGV0fS0je3Npbmt9Ojoje2Nvbm5lY3Rpb24ud2lyZS5pbmxldH1cIlxuICAgICAgICBzeW1ib2wgPSBuZXcgU3ltYm9sKG5hbWUpXG4gICAgICAgIEBjb25uZWN0aW9ucy5iaW5kKHN5bWJvbCwgY29ubmVjdGlvbilcblxuICAgICAgICBmb3Igb3V0bGV0IGluIGNvbm5lY3Rpb24uc291cmNlLm91dGxldHMuc3ltYm9scygpXG4gICAgICAgICAgICBpZiBvdXRsZXQubmFtZSBpcyBjb25uZWN0aW9uLndpcmUub3V0bGV0XG4gICAgICAgICAgICAgICAgb3V0bGV0Lm9iamVjdC5wdXNoKHN5bWJvbClcblxuICAgIGRpc2Nvbm5lY3Q6IChuYW1lKSAtPlxuICAgICAgICBjb25uZWN0aW9uID0gQGNvbm5lY3Rpb24obmFtZSlcbiAgICAgICAgQGNvbm5lY3Rpb25zLnVuYmluZChuYW1lKVxuXG4gICAgICAgIGZvciBvdXRsZXQgaW4gY29ubmVjdGlvbi5zb3VyY2Uub3V0bGV0cy5zeW1ib2xzKClcbiAgICAgICAgICAgIGlmIG91dGxldC5uYW1lIGlzIHdpcmUub3V0bGV0XG4gICAgICAgICAgICAgICAgY29ubmVjdGlvbnMgPSBbXVxuICAgICAgICAgICAgICAgIGZvciBjb25uIGluIG91dGxldC5vYmplY3RcbiAgICAgICAgICAgICAgICAgICAgaWYgY29ubi5uYW1lICE9IG5hbWVcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbm5lY3Rpb25zLnB1c2goY29ubilcbiAgICAgICAgICAgICAgICBvdXRsZXQub2JqZWN0ID0gY29ubmVjdGlvbnNcblxuXG4gICAgY29ubmVjdGlvbjogKG5hbWUpIC0+XG4gICAgICAgIEBjb25uZWN0aW9ucy5vYmplY3QobmFtZSlcblxuICAgIGFkZDogKHN5bWJvbCwgc3lzdGVtQ2xhc3MsIGNvbmYpIC0+XG4gICAgICAgIHN5c3RlbSA9IG5ldyBzeXN0ZW1DbGFzcyh0aGlzLCBjb25mKVxuICAgICAgICBAc3lzdGVtcy5iaW5kKHN5bWJvbCwgc3lzdGVtKVxuXG4gICAgc3lzdGVtOiAobmFtZSkgLT5cbiAgICAgICAgQHN5c3RlbXMub2JqZWN0KG5hbWUpXG5cbiAgICByZW1vdmU6IChuYW1lKSAtPlxuICAgICAgICBAc3lzdGVtcy51bmJpbmQoc3ltYm9sLCBzeXN0ZW0pXG5cbmV4cG9ydHMuU3ltYm9sID0gU3ltYm9sXG5leHBvcnRzLk5hbWVTcGFjZSA9IE5hbWVTcGFjZVxuZXhwb3J0cy5TID0gU1xuZXhwb3J0cy5EYXRhID0gRGF0YVxuZXhwb3J0cy5EID0gRFxuZXhwb3J0cy5FdmVudCA9IEV2ZW50XG5leHBvcnRzLkdsaXRjaCA9IEdsaXRjaFxuZXhwb3J0cy5Ub2tlbiA9IFRva2VuXG5leHBvcnRzLlQgPSBUXG5leHBvcnRzLkNvbXBvbmVudCA9IENvbXBvbmVudFxuZXhwb3J0cy5FbnRpdHkgPSBFbnRpdHlcbmV4cG9ydHMuQ2VsbCA9IENlbGxcbmV4cG9ydHMuU3lzdGVtID0gU3lzdGVtXG5leHBvcnRzLldpcmUgPSBXaXJlXG5leHBvcnRzLkNvbm5lY3Rpb24gPSBDb25uZWN0aW9uXG5leHBvcnRzLlN0b3JlID0gU3RvcmVcbmV4cG9ydHMuQnVzID0gQnVzXG5leHBvcnRzLkZsb3cgPSBGbG93XG5cbiJdLCJzb3VyY2VSb290IjoiL3NvdXJjZS8ifQ==