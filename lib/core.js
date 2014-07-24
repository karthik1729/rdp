var Bus, C, Cell, Connection, D, Data, E, Entity, Event, G, Glitch, NameSpace, P, Part, Pipeline, S, Signal, Store, Symbol, System, T, Token, Wire, clone, dom, mixins, start, stop, uuid, xpath,
  __slice = [].slice,
  __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; },
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

uuid = require("node-uuid");

clone = require("clone");

mixins = require("./mixins.js");

xpath = require('xpath');

dom = require('xmldom').DOMParser;

Symbol = (function() {
  function Symbol(name, object, ns, attrs) {
    this.name = name;
    this.object = object;
    this.ns = ns;
    if (attrs != null) {
      this.attrs(attrs);
    }
  }

  Symbol.prototype.attr = function(k, v) {
    if (v) {
      return this[k] = v;
    } else {
      return this[k];
    }
  };

  Symbol.prototype.op = function() {
    var args, f;
    f = arguments[0], args = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
    return f.apply(this, args);
  };

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
    if (this.has(name)) {
      return this.elements[name];
    } else {
      return S("NotFound");
    }
  };

  NameSpace.prototype.has = function(name) {
    if (this.elements[name] != null) {
      return true;
    } else {
      return false;
    }
  };

  NameSpace.prototype.object = function(name) {
    if (this.has(name)) {
      return this.elements[name].object;
    } else {
      return G("NotFound");
    }
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
    this.__slots = [];
    if (props != null) {
      this.props(props);
    }
  }

  Data.prototype.is = function(data) {
    var all_slots, name, _i, _len, _ref;
    all_slots = this.slots();
    _ref = data.slots();
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      name = _ref[_i];
      if (data.slot(name) === !this.slot(name)) {
        return false;
      }
    }
    return true;
  };

  Data.prototype.props = function(kv) {
    var k, name, properties, v, _i, _len, _ref;
    if (kv) {
      for (k in kv) {
        v = kv[k];
        this[k] = v;
        if (__indexOf.call(this.slots(), k) < 0) {
          this.slots(k);
        }
      }
      return this.validate();
    } else {
      properties = [];
      _ref = this.slots();
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        name = _ref[_i];
        properties.push(this[name]);
      }
      return properties;
    }
  };

  Data.prototype.slots = function(name) {
    if (name) {
      return this.__slots.push(name);
    } else {
      return this.__slots;
    }
  };

  Data.prototype.slot = function(name, value) {
    if (value) {
      this[name] = value;
      if (__indexOf.call(this.slots(), name) < 0) {
        this.slots(name);
      }
      if (this.validate()) {
        return value;
      } else {
        return G("Invalid");
      }
    } else {
      if (this.has(name)) {
        return this[name];
      } else {
        return G("NotFound");
      }
    }
  };

  Data.prototype.has = function(name) {
    if (__indexOf.call(this.slots(), name) >= 0) {
      return true;
    } else {
      return false;
    }
  };

  Data.prototype.validate = function() {
    return true;
  };

  Data.prototype.serialize = function() {
    var e, name, scalar, type, xml, _i, _j, _len, _len1, _ref;
    xml = "";
    _ref = this.slots();
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      name = _ref[_i];
      xml += "<property slot='" + name + "'>";
      scalar = this.slot(name);
      if (Array.isArray(scalar)) {
        type = "array";
        xml += "<scalar type='" + type + "'>";
        xml += "<list>";
        for (_j = 0, _len1 = scalar.length; _j < _len1; _j++) {
          e = scalar[_j];
          type = typeof e;
          xml += "<scalar type='" + type + "'>" + e + "</scalar>";
        }
        xml += "</list>";
        xml += "</scalar>";
      } else {
        type = typeof scalar;
        xml += "<scalar type='" + type + "'>" + (scalar.toString()) + "</scalar>";
      }
      xml += '</property>';
    }
    return xml;
  };

  return Data;

})();

D = function(props) {
  return new Data(props);
};

Signal = (function(_super) {
  __extends(Signal, _super);

  function Signal(name, payload, props) {
    props = props || {};
    props.name = name;
    props.payload = payload;
    Signal.__super__.constructor.call(this, props);
  }

  return Signal;

})(Data);

Event = (function(_super) {
  __extends(Event, _super);

  function Event(name, payload, props) {
    props = props || {};
    pops.ts = new Date().getTime();
    Event.__super__.constructor.call(this, name, payload, props);
  }

  return Event;

})(Signal);

Glitch = (function(_super) {
  __extends(Glitch, _super);

  function Glitch(name, props) {
    props = props || {};
    props.name = name;
    Glitch.__super__.constructor.call(this, props);
  }

  return Glitch;

})(Data);

G = function(name, props) {
  return new Glitch(name, props);
};

Token = (function(_super) {
  __extends(Token, _super);

  function Token(value, sign, props) {
    Token.__super__.constructor.call(this, props);
    this.signs = [];
    this.stamp(sign, value);
  }

  Token.prototype.is = function(t) {
    return false;
  };

  Token.prototype.value = function() {
    return this.value;
  };

  Token.prototype.stamp_by = function(index) {
    if (index != null) {
      if (this.signs[index] != null) {
        return this.signs[index];
      } else {
        return S("NotFound");
      }
    }
    if (this.signs.length > 0) {
      return this.signs[this.signs.length - 1];
    } else {
      return S("NotFound");
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

Part = (function(_super) {
  __extends(Part, _super);

  function Part(name, props) {
    this.name = name;
    Part.__super__.constructor.call(this, props);
  }

  Part.prototype.serialize = function() {
    xml += "<part name='" + this.name + "'>";
    xml += Part.__super__.serialize.call(this);
    return xml += '</part>';
  };

  return Part;

})(Data);

P = function(name, props) {
  return new Part(name, props);
};

Entity = (function(_super) {
  __extends(Entity, _super);

  function Entity(tags, props) {
    this.parts = new NameSpace("parts");
    props = props || {};
    props.id = props.id || uuid.v4();
    tags = tags || props.tags || [];
    props.tags = tags;
    Entity.__super__.constructor.call(this, props);
  }

  Entity.prototype.add = function(symbol, part) {
    return this.parts.bind(symbol, part);
  };

  Entity.prototype.remove = function(name) {
    return this.parts.unbind(name);
  };

  Entity.prototype.hasPart = function(name) {
    return this.parts.has(name);
  };

  Entity.prototype.part = function(name) {
    return this.parts.symbol(name);
  };

  Entity.prototype.serialize = function() {
    var part, xml;
    xml = "<entity>";
    xml += '<parts>';
    for (part in this.parts.objects()) {
      xml += part.serialize();
    }
    xml += '</parts>';
    xml += Entity.__super__.serialize.call(this);
    return xml += '</entity>';
  };

  return Entity;

})(Data);

E = function(tags, props) {
  return new Entity(tags, props);
};

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

  Cell.prototype.add = function(part) {
    var event;
    Cell.__super__.add.call(this, part);
    event = new Event("part-added", {
      part: part,
      cell: this
    });
    return this.notify(event);
  };

  Cell.prototype.remove = function(name) {
    var event;
    Cell.__super__.remove.call(this, name);
    event = new Event("part-removed", {
      part: part,
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

C = function(tags, props) {
  return new Cell(tags, props);
};

System = (function() {
  function System(pl, conf) {
    this.pl = pl;
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
        return S("NotFound");
      }
    }
    if (this.state.length > 0) {
      return this.state[this.state.length - 1];
    } else {
      return S("NotFound");
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
  function Connection(source, sink, pl, wire) {
    this.source = source;
    this.sink = sink;
    this.pl = pl;
    this.wire = wire;
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

  Store.prototype.add = function(entity) {
    var symbol;
    symbol = S(entity.id);
    this.entities.bind(symbol, entity);
    return symbol;
  };

  Store.prototype.snapshot = function() {
    var entity, xml, _i, _len, _ref;
    xml = '<?xml version = "1.0" standalone="yes"?>';
    xml += "<snapshot>";
    _ref = this.entities.objects();
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      entity = _ref[_i];
      xml += entity.serialize();
    }
    xml += "</snapshot>";
    return xml;
  };

  Store.prototype.op = function() {
    var args, f;
    f = arguments[0], args = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
    return f.apply(this, args);
  };

  Store.prototype.__process_scalar = function(scalar) {
    var el, el_text, el_type, el_value, list_scalars, text, type, value, _i, _len;
    type = scalar.getAttribute("type");
    text = scalar.textContent;
    if (type === "number") {
      value = Number(text);
    } else if (type === "string") {
      value = String(text);
    } else if (type === "boolean") {
      value = Boolean(text);
    } else if (type === "array") {
      list_scalars = xpath.select("list/scalar", scalar);
      value = [];
      for (_i = 0, _len = list_scalars.length; _i < _len; _i++) {
        el = list_scalars[_i];
        el_type = el.getAttribute("type");
        el_text = el.textContent;
        if (el_type === "number") {
          el_value = Number(el_text);
        } else if (el_type === "string") {
          el_value = String(el_text);
        } else if (el_type === "boolean") {
          el_value = Boolean(el_text);
        }
        value.push(el_value);
      }
    }
    return value;
  };

  Store.prototype.__process_prop = function(prop) {
    var entity_prop, scalar, slot, value;
    entity_prop = {};
    slot = prop.getAttribute("slot");
    scalar = xpath.select("scalar", prop);
    value = this.__process_scalar(scalar[0]);
    entity_prop.slot = slot;
    entity_prop.value = value;
    return entity_prop;
  };

  Store.prototype.recover = function(xml) {
    var doc, entities, entities_list, entity, entity_part, entity_prop, entity_props, name, new_entity, part, part_prop, part_props, parts, prop, props, _i, _j, _k, _l, _len, _len1, _len2, _len3, _len4, _m, _results;
    doc = new dom().parseFromString(xml);
    entities = xpath.select("//entity", doc);
    entities_list = [];
    for (_i = 0, _len = entities.length; _i < _len; _i++) {
      entity = entities[_i];
      entity_props = {};
      props = xpath.select("property", entity);
      for (_j = 0, _len1 = props.length; _j < _len1; _j++) {
        prop = props[_j];
        entity_prop = this.__process_prop(prop);
        entity_props[entity_prop.slot] = entity_prop.value;
      }
      new_entity = new Entity(null, entity_props);
      parts = xpath.select("part", entity);
      for (_k = 0, _len2 = parts.length; _k < _len2; _k++) {
        part = parts[_k];
        name = part.getAttribute("name");
        part_props = {};
        props = xpath.select("property", part);
        for (_l = 0, _len3 = props.length; _l < _len3; _l++) {
          prop = props[_l];
          part_prop = this.__process_prop(prop);
          part_props[part_prop.slot] = part_prop.value;
        }
        entity_part = new Part(name, part_props);
        new_entity.add(entity_part);
      }
      entities_list.push(new_entity);
    }
    _results = [];
    for (_m = 0, _len4 = entities_list.length; _m < _len4; _m++) {
      entity = entities_list[_m];
      console.log(entity);
      _results.push(this.add(entity));
    }
    return _results;
  };

  Store.prototype.has = function(id) {
    return this.entities.has(id);
  };

  Store.prototype.entity = function(id) {
    return this.entities.object(id);
  };

  Store.prototype.remove = function(id) {
    return this.entities.unbind(id);
  };

  Store.prototype.by_prop = function(prop) {
    var entities, entity, _i, _len, _ref;
    entities = [];
    _ref = this.entities.objects();
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      entity = _ref[_i];
      if (entity.has(prop.slot)) {
        if (entity.slot(prop.slot) === prop.value) {
          entities.push(entity);
        }
      }
    }
    if (entities.length > 0) {
      return entities;
    } else {
      return G("NotFound");
    }
  };

  Store.prototype.first_by_prop = function(prop) {
    var entities;
    entities = this.by_prop(prop);
    if (entities instanceof Glitch) {
      return entities;
    } else {
      return entities[0];
    }
  };

  Store.prototype.by_tags = function(tags) {
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
    if (entities.length > 0) {
      return entities;
    } else {
      return G("NotFound");
    }
  };

  Store.prototype.first_by_tags = function(tags) {
    var entities;
    entities = this.by_tags(tags);
    if (entities instanceof Glitch) {
      return entities;
    } else {
      return entities[0];
    }
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
      if (obj instanceof System) {
        _results.push(obj.raise(signal));
      } else {
        _results.push(void 0);
      }
    }
    return _results;
  };

  return Bus;

})(NameSpace);

Pipeline = (function() {
  function Pipeline(name, connectionClass, storeClass, busClass) {
    storeClass = storeClass || Store;
    busClass = busClass || Bus;
    this.connectionClass = connectionClass || Connection;
    this.store = new storeClass();
    this.connections = new NameSpace("bus.connections");
    this.bus = new busClass("systems");
    this.systems = this.bus;
    this.bus.bind(S("connections"), this.connections);
    this.bus.bind(S("store"), this.store);
  }

  Pipeline.prototype.connect = function(source, sink, wire, symbol) {
    var connection, name, outlet, _i, _len, _ref, _results;
    source = this.systems.symbol(source);
    sink = this.systems.symbol(sink);
    wire = wire || new Wire(source.object.outlets.symbol("sysout"), sink.object.inlets.symbol("sysin"));
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

  Pipeline.prototype.pipe = function(source, wire, sink) {
    return this.connect(source, sink, wire);
  };

  Pipeline.prototype.disconnect = function(name) {
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

  Pipeline.prototype.connection = function(name) {
    return this.connections.object(name);
  };

  Pipeline.prototype.hasConnection = function(name) {
    return this.connections.has(name);
  };

  Pipeline.prototype.add = function(symbol, systemClass, conf) {
    var system;
    system = new systemClass(this, conf);
    return this.bus.bind(symbol, system);
  };

  Pipeline.prototype.has = function(name) {
    return this.bus.has(name);
  };

  Pipeline.prototype.system = function(name) {
    return this.bus.object(name);
  };

  Pipeline.prototype.remove = function(name) {
    var system;
    system = this.bus.object(name);
    system.push(this.STOP);
    return this.bus.unbind(name);
  };

  return Pipeline;

})();

exports.Symbol = Symbol;

exports.NameSpace = NameSpace;

exports.S = S;

exports.Data = Data;

exports.D = D;

exports.Signal = Signal;

exports.Event = Event;

exports.Glitch = Glitch;

exports.G = G;

exports.Token = Token;

exports.start = start;

exports.stop = stop;

exports.T = T;

exports.Part = Part;

exports.P = P;

exports.Entity = Entity;

exports.E = E;

exports.Cell = Cell;

exports.C = C;

exports.System = System;

exports.Wire = Wire;

exports.Connection = Connection;

exports.Store = Store;

exports.Bus = Bus;

exports.Pipeline = Pipeline;

exports.mixins = mixins;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29yZS5qcyIsInNvdXJjZXMiOlsiY29yZS5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsSUFBQSw0TEFBQTtFQUFBOzs7aVNBQUE7O0FBQUEsSUFBQSxHQUFPLE9BQUEsQ0FBUSxXQUFSLENBQVAsQ0FBQTs7QUFBQSxLQUNBLEdBQVEsT0FBQSxDQUFRLE9BQVIsQ0FEUixDQUFBOztBQUFBLE1BR0EsR0FBUyxPQUFBLENBQVEsYUFBUixDQUhULENBQUE7O0FBQUEsS0FLQSxHQUFRLE9BQUEsQ0FBUSxPQUFSLENBTFIsQ0FBQTs7QUFBQSxHQU1BLEdBQU0sT0FBQSxDQUFRLFFBQVIsQ0FBaUIsQ0FBQyxTQU54QixDQUFBOztBQUFBO0FBVWlCLEVBQUEsZ0JBQUUsSUFBRixFQUFTLE1BQVQsRUFBa0IsRUFBbEIsRUFBc0IsS0FBdEIsR0FBQTtBQUNULElBRFUsSUFBQyxDQUFBLE9BQUEsSUFDWCxDQUFBO0FBQUEsSUFEaUIsSUFBQyxDQUFBLFNBQUEsTUFDbEIsQ0FBQTtBQUFBLElBRDBCLElBQUMsQ0FBQSxLQUFBLEVBQzNCLENBQUE7QUFBQSxJQUFBLElBQUcsYUFBSDtBQUNJLE1BQUEsSUFBQyxDQUFBLEtBQUQsQ0FBTyxLQUFQLENBQUEsQ0FESjtLQURTO0VBQUEsQ0FBYjs7QUFBQSxtQkFJQSxJQUFBLEdBQU0sU0FBQyxDQUFELEVBQUksQ0FBSixHQUFBO0FBQ0YsSUFBQSxJQUFHLENBQUg7YUFDSSxJQUFFLENBQUEsQ0FBQSxDQUFGLEdBQU8sRUFEWDtLQUFBLE1BQUE7YUFHSSxJQUFFLENBQUEsQ0FBQSxFQUhOO0tBREU7RUFBQSxDQUpOLENBQUE7O0FBQUEsbUJBVUEsRUFBQSxHQUFJLFNBQUEsR0FBQTtBQUNBLFFBQUEsT0FBQTtBQUFBLElBREMsa0JBQUcsOERBQ0osQ0FBQTtBQUFBLFdBQU8sQ0FBQyxDQUFDLEtBQUYsQ0FBUSxJQUFSLEVBQWMsSUFBZCxDQUFQLENBREE7RUFBQSxDQVZKLENBQUE7O0FBQUEsbUJBYUEsS0FBQSxH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QUFSLEdBQWdCLEtBcm9CaEIsQ0FBQTs7QUFBQSxPQXNvQk8sQ0FBQyxNQUFSLEdBQWlCLE1BdG9CakIsQ0FBQTs7QUFBQSxPQXVvQk8sQ0FBQyxDQUFSLEdBQVksQ0F2b0JaLENBQUE7O0FBQUEsT0F3b0JPLENBQUMsS0FBUixHQUFnQixLQXhvQmhCLENBQUE7O0FBQUEsT0F5b0JPLENBQUMsS0FBUixHQUFnQixLQXpvQmhCLENBQUE7O0FBQUEsT0Ewb0JPLENBQUMsSUFBUixHQUFlLElBMW9CZixDQUFBOztBQUFBLE9BMm9CTyxDQUFDLENBQVIsR0FBWSxDQTNvQlosQ0FBQTs7QUFBQSxPQTRvQk8sQ0FBQyxJQUFSLEdBQWUsSUE1b0JmLENBQUE7O0FBQUEsT0E2b0JPLENBQUMsQ0FBUixHQUFZLENBN29CWixDQUFBOztBQUFBLE9BOG9CTyxDQUFDLE1BQVIsR0FBaUIsTUE5b0JqQixDQUFBOztBQUFBLE9BK29CTyxDQUFDLENBQVIsR0FBWSxDQS9vQlosQ0FBQTs7QUFBQSxPQWdwQk8sQ0FBQyxJQUFSLEdBQWUsSUFocEJmLENBQUE7O0FBQUEsT0FpcEJPLENBQUMsQ0FBUixHQUFZLENBanBCWixDQUFBOztBQUFBLE9Ba3BCTyxDQUFDLE1BQVIsR0FBaUIsTUFscEJqQixDQUFBOztBQUFBLE9BbXBCTyxDQUFDLElBQVIsR0FBZSxJQW5wQmYsQ0FBQTs7QUFBQSxPQW9wQk8sQ0FBQyxVQUFSLEdBQXFCLFVBcHBCckIsQ0FBQTs7QUFBQSxPQXFwQk8sQ0FBQyxLQUFSLEdBQWdCLEtBcnBCaEIsQ0FBQTs7QUFBQSxPQXNwQk8sQ0FBQyxHQUFSLEdBQWMsR0F0cEJkLENBQUE7O0FBQUEsT0F1cEJPLENBQUMsUUFBUixHQUFtQixRQXZwQm5CLENBQUE7O0FBQUEsT0F3cEJPLENBQUMsTUFBUixHQUFpQixNQXhwQmpCLENBQUEiLCJzb3VyY2VzQ29udGVudCI6WyJ1dWlkID0gcmVxdWlyZSBcIm5vZGUtdXVpZFwiXG5jbG9uZSA9IHJlcXVpcmUgXCJjbG9uZVwiXG5cbm1peGlucyA9IHJlcXVpcmUgXCIuL21peGlucy5qc1wiXG5cbnhwYXRoID0gcmVxdWlyZSgneHBhdGgnKVxuZG9tID0gcmVxdWlyZSgneG1sZG9tJykuRE9NUGFyc2VyXG5cbmNsYXNzIFN5bWJvbFxuXG4gICAgY29uc3RydWN0b3I6IChAbmFtZSwgQG9iamVjdCwgQG5zLCBhdHRycykgLT5cbiAgICAgICAgaWYgYXR0cnM/XG4gICAgICAgICAgICBAYXR0cnMoYXR0cnMpXG5cbiAgICBhdHRyOiAoaywgdikgLT5cbiAgICAgICAgaWYgdlxuICAgICAgICAgICAgQFtrXSA9IHZcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgQFtrXVxuXG4gICAgb3A6IChmLCBhcmdzLi4uKSAtPlxuICAgICAgICByZXR1cm4gZi5hcHBseSh0aGlzLCBhcmdzKVxuXG4gICAgYXR0cnM6IChrdikgLT5cbiAgICAgICAgZm9yIGssIHYgaW4ga3ZcbiAgICAgICAgICAgIEBba10gPSB2XG5cbiAgICBpczogKHN5bWJvbCkgLT5cbiAgICAgICAgaWYgc3ltYm9sLm5hbWUgaXMgQG5hbWVcbiAgICAgICAgICAgIGlmIHN5bWJvbC5vYmplY3QgaXMgQG9iamVjdFxuICAgICAgICAgICAgICAgIHJldHVybiB0cnVlXG4gICAgICAgICAgICBpZiAoc3ltYm9sLm9iamVjdCBpcyBudWxsKSBhbmQgKEBvYmplY3QgaXMgbnVsbClcbiAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZVxuICAgICAgICBlbHNlXG4gICAgICAgICAgICByZXR1cm4gZmFsc2VcblxuICAgIHRvU3RyaW5nOiAtPlxuICAgICAgIGlmIEBucz9cbiAgICAgICAgICAgcmV0dXJuIEBucy5uYW1lICsgQG5zLnNlcCArIEBuYW1lXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgcmV0dXJuIEBuYW1lXG5cblMgPSAobmFtZSwgb2JqZWN0LCBucywgYXR0cnMpIC0+XG4gICAgcmV0dXJuIG5ldyBTeW1ib2wobmFtZSwgb2JqZWN0LCBucywgYXR0cnMpXG5cbiMgc2hvdWxkIGJlIGEgc2V0XG5cbmNsYXNzIE5hbWVTcGFjZVxuXG4gICAgY29uc3RydWN0b3I6IChAbmFtZSwgc2VwKSAtPlxuICAgICAgICBAZWxlbWVudHMgPSB7fVxuICAgICAgICBAc2VwID0gc2VwIHx8IFwiLlwiXG5cbiAgICBiaW5kOiAoc3ltYm9sLCBvYmplY3QpIC0+XG4gICAgICAgIG5hbWUgPSBzeW1ib2wubmFtZVxuICAgICAgICBzeW1ib2wub2JqZWN0ID0gb2JqZWN0XG4gICAgICAgIG9iamVjdC5zeW1ib2wgPSBzeW1ib2xcbiAgICAgICAgQGVsZW1lbnRzW25hbWVdID0gc3ltYm9sXG4gICAgICAgIHN5bWJvbC5ucyA9IHRoaXNcbiAgICAgICAgc3ltYm9sXG5cbiAgICB1bmJpbmQ6IChuYW1lKSAtPlxuICAgICAgICBzeW1ib2wgPSBAZWxlbWVudHNbbmFtZV1cbiAgICAgICAgZGVsZXRlIEBlbGVtZW50c1tuYW1lXVxuICAgICAgICBzeW1ib2wubnMgPSB1bmRlZmluZWRcbiAgICAgICAgc3ltYm9sXG5cbiAgICBzeW1ib2w6IChuYW1lKSAtPlxuICAgICAgICBpZiBAaGFzKG5hbWUpXG4gICAgICAgICAgICBAZWxlbWVudHNbbmFtZV1cbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgUyhcIk5vdEZvdW5kXCIpXG5cbiAgICBoYXM6IChuYW1lKSAtPlxuICAgICAgICBpZiBAZWxlbWVudHNbbmFtZV0/XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZVxuICAgICAgICBlbHNlXG4gICAgICAgICAgICByZXR1cm4gZmFsc2VcblxuICAgIG9iamVjdDogKG5hbWUpIC0+XG4gICAgICAgIGlmIEBoYXMobmFtZSlcbiAgICAgICAgICAgIEBlbGVtZW50c1tuYW1lXS5vYmplY3RcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgRyhcIk5vdEZvdW5kXCIpXG5cbiAgICBzeW1ib2xzOiAoKSAtPlxuICAgICAgIHN5bWJvbHMgPSBbXVxuXG4gICAgICAgZm9yIGssdiBvZiBAZWxlbWVudHNcbiAgICAgICAgICAgc3ltYm9scy5wdXNoKHYpXG5cbiAgICAgICBzeW1ib2xzXG5cbiAgICBvYmplY3RzOiAoKSAtPlxuICAgICAgIG9iamVjdHMgPSBbXVxuXG4gICAgICAgZm9yIGssdiBvZiBAZWxlbWVudHNcbiAgICAgICAgICAgb2JqZWN0cy5wdXNoKHYub2JqZWN0KVxuXG4gICAgICAgb2JqZWN0c1xuXG5cbmNsYXNzIERhdGFcblxuICAgIGNvbnN0cnVjdG9yOiAocHJvcHMpIC0+XG4gICAgICAgIEBfX3Nsb3RzID0gW11cbiAgICAgICAgaWYgcHJvcHM/XG4gICAgICAgICAgICBAcHJvcHMocHJvcHMpXG5cbiAgICBpczogKGRhdGEpIC0+XG4gICAgICAgIGFsbF9zbG90cyA9IEBzbG90cygpXG4gICAgICAgIGZvciBuYW1lIGluIGRhdGEuc2xvdHMoKVxuICAgICAgICAgICAgaWYgZGF0YS5zbG90KG5hbWUpIGlzIG5vdCBAc2xvdChuYW1lKVxuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZVxuXG4gICAgICAgIHJldHVybiB0cnVlXG5cbiAgICBwcm9wczogKGt2KSAtPlxuICAgICAgICBpZiBrdlxuICAgICAgICAgICAgZm9yIGssIHYgb2Yga3ZcbiAgICAgICAgICAgICAgICBAW2tdID0gdlxuICAgICAgICAgICAgICAgIGlmIGsgbm90IGluIEBzbG90cygpXG4gICAgICAgICAgICAgICAgICAgIEBzbG90cyhrKVxuICAgICAgICAgICAgcmV0dXJuIEB2YWxpZGF0ZSgpXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIHByb3BlcnRpZXMgPSBbXVxuICAgICAgICAgICAgZm9yIG5hbWUgaW4gQHNsb3RzKClcbiAgICAgICAgICAgICAgICBwcm9wZXJ0aWVzLnB1c2goQFtuYW1lXSlcbiAgICAgICAgICAgIHJldHVybiBwcm9wZXJ0aWVzXG5cbiAgICBzbG90czogKG5hbWUpIC0+XG4gICAgICAgIGlmIG5hbWVcbiAgICAgICAgICAgIEBfX3Nsb3RzLnB1c2gobmFtZSlcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgQF9fc2xvdHNcblxuICAgIHNsb3Q6IChuYW1lLCB2YWx1ZSkgLT5cbiAgICAgICAgaWYgdmFsdWVcbiAgICAgICAgICAgIEBbbmFtZV0gPSB2YWx1ZVxuICAgICAgICAgICAgaWYgbmFtZSBub3QgaW4gQHNsb3RzKClcbiAgICAgICAgICAgICAgICBAc2xvdHMobmFtZSlcbiAgICAgICAgICAgIGlmIEB2YWxpZGF0ZSgpXG4gICAgICAgICAgICAgICAgcmV0dXJuIHZhbHVlXG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgRyhcIkludmFsaWRcIilcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgaWYgQGhhcyhuYW1lKVxuICAgICAgICAgICAgICAgIEBbbmFtZV1cbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICBHKFwiTm90Rm91bmRcIilcblxuICAgIGhhczogKG5hbWUpIC0+XG4gICAgICAgIGlmIG5hbWUgaW4gQHNsb3RzKClcbiAgICAgICAgICAgIHJldHVybiB0cnVlXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIHJldHVybiBmYWxzZVxuXG4gICAgdmFsaWRhdGU6IC0+XG4gICAgICAgIHRydWVcblxuXG4gICAgc2VyaWFsaXplOiAtPlxuICAgICAgICB4bWwgPSBcIlwiXG4gICAgICAgIGZvciBuYW1lIGluIEBzbG90cygpXG4gICAgICAgICAgICB4bWwgKz0gXCI8cHJvcGVydHkgc2xvdD0nI3tuYW1lfSc+XCJcbiAgICAgICAgICAgIHNjYWxhciAgPSBAc2xvdChuYW1lKVxuICAgICAgICAgICAgaWYgQXJyYXkuaXNBcnJheShzY2FsYXIpXG4gICAgICAgICAgICAgICAgdHlwZSA9IFwiYXJyYXlcIlxuICAgICAgICAgICAgICAgIHhtbCArPSBcIjxzY2FsYXIgdHlwZT0nI3t0eXBlfSc+XCJcbiAgICAgICAgICAgICAgICB4bWwgKz0gXCI8bGlzdD5cIlxuICAgICAgICAgICAgICAgIGZvciBlIGluIHNjYWxhclxuICAgICAgICAgICAgICAgICAgICB0eXBlID0gdHlwZW9mIGVcbiAgICAgICAgICAgICAgICAgICAgeG1sICs9IFwiPHNjYWxhciB0eXBlPScje3R5cGV9Jz4je2V9PC9zY2FsYXI+XCJcbiAgICAgICAgICAgICAgICB4bWwgKz0gXCI8L2xpc3Q+XCJcbiAgICAgICAgICAgICAgICB4bWwgKz0gXCI8L3NjYWxhcj5cIlxuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIHR5cGUgPSB0eXBlb2Ygc2NhbGFyXG4gICAgICAgICAgICAgICAgeG1sICs9IFwiPHNjYWxhciB0eXBlPScje3R5cGV9Jz4je3NjYWxhci50b1N0cmluZygpfTwvc2NhbGFyPlwiXG4gICAgICAgICAgICB4bWwgKz0gJzwvcHJvcGVydHk+J1xuICAgICAgICB4bWxcblxuRCA9IChwcm9wcykgLT5cbiAgICByZXR1cm4gbmV3IERhdGEocHJvcHMpXG5cbmNsYXNzIFNpZ25hbCBleHRlbmRzIERhdGFcblxuICAgIGNvbnN0cnVjdG9yOiAobmFtZSwgcGF5bG9hZCwgcHJvcHMpIC0+XG4gICAgICAgIHByb3BzID0gcHJvcHMgfHwge31cbiAgICAgICAgcHJvcHMubmFtZSA9IG5hbWVcbiAgICAgICAgcHJvcHMucGF5bG9hZCA9IHBheWxvYWRcbiAgICAgICAgc3VwZXIocHJvcHMpXG5cbmNsYXNzIEV2ZW50IGV4dGVuZHMgU2lnbmFsXG5cbiAgICBjb25zdHJ1Y3RvcjogKG5hbWUsIHBheWxvYWQsIHByb3BzKSAtPlxuICAgICAgICBwcm9wcyA9IHByb3BzIHx8IHt9XG4gICAgICAgIHBvcHMudHMgPSBuZXcgRGF0ZSgpLmdldFRpbWUoKVxuICAgICAgICBzdXBlcihuYW1lLCBwYXlsb2FkLCBwcm9wcylcblxuY2xhc3MgR2xpdGNoIGV4dGVuZHMgRGF0YVxuXG4gICAgY29uc3RydWN0b3I6IChuYW1lLCBwcm9wcykgLT5cbiAgICAgICAgcHJvcHMgPSBwcm9wcyB8fCB7fVxuICAgICAgICBwcm9wcy5uYW1lID0gbmFtZVxuICAgICAgICBzdXBlcihwcm9wcylcblxuRyA9IChuYW1lLCBwcm9wcykgLT5cbiAgICByZXR1cm4gbmV3IEdsaXRjaChuYW1lLCBwcm9wcylcblxuY2xhc3MgVG9rZW4gZXh0ZW5kcyBEYXRhXG5cbiAgICBjb25zdHJ1Y3RvcjogKHZhbHVlLCBzaWduLCBwcm9wcykgIC0+XG4gICAgICAgIHN1cGVyKHByb3BzKVxuICAgICAgICBAc2lnbnMgPSBbXVxuICAgICAgICBAc3RhbXAoc2lnbiwgdmFsdWUpXG5cbiAgICBpczogKHQpIC0+XG4gICAgICAgIGZhbHNlXG5cbiAgICB2YWx1ZTogLT5cbiAgICAgICAgQHZhbHVlXG5cbiAgICBzdGFtcF9ieTogKGluZGV4KSAtPlxuICAgICAgICBpZiBpbmRleD9cbiAgICAgICAgICAgaWYgQHNpZ25zW2luZGV4XT9cbiAgICAgICAgICAgICAgIHJldHVybiBAc2lnbnNbaW5kZXhdXG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICByZXR1cm4gUyhcIk5vdEZvdW5kXCIpXG5cbiAgICAgICAgaWYgQHNpZ25zLmxlbmd0aCA+IDBcbiAgICAgICAgICAgcmV0dXJuIEBzaWduc1tAc2lnbnMubGVuZ3RoIC0gMV1cbiAgICAgICAgZWxzZVxuICAgICAgICAgICByZXR1cm4gUyhcIk5vdEZvdW5kXCIpXG5cbiAgICBzdGFtcDogKHNpZ24sIHZhbHVlKSAtPlxuICAgICAgICBpZiB2YWx1ZVxuICAgICAgICAgICAgaWYgQFt2YWx1ZV1cbiAgICAgICAgICAgICAgICBkZWxldGUgQFt2YWx1ZV1cbiAgICAgICAgICAgIEB2YWx1ZSA9IHZhbHVlXG4gICAgICAgICAgICBpZiB0eXBlb2YgQHZhbHVlIGlzIFwic3RyaW5nXCJcbiAgICAgICAgICAgICAgICBAW0B2YWx1ZV0gPSB0cnVlXG4gICAgICAgIGlmIHNpZ24/XG4gICAgICAgICAgICBAc2lnbnMucHVzaChzaWduKVxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBAc2lnbnMucHVzaChTKFwiVW5rbm93blwiKSlcblxuXG5zdGFydCA9IChzaWduLCBwcm9wcykgLT5cbiAgICByZXR1cm4gbmV3IFRva2VuKFwic3RhcnRcIiwgc2lnbiwgcHJvcHMpXG5cbnN0b3AgPSAoc2lnbiwgcHJvcHMpIC0+XG4gICAgcmV0dXJuIG5ldyBUb2tlbihcInN0b3BcIiwgc2lnbiwgcHJvcHMpXG5cblQgPSAodmFsdWUsIHNpZ24sIHByb3BzKSAtPlxuICAgIHJldHVybiBuZXcgVG9rZW4odmFsdWUsIHNpZ24sIHByb3BzKVxuXG5jbGFzcyBQYXJ0IGV4dGVuZHMgRGF0YVxuXG4gICAgY29uc3RydWN0b3I6IChAbmFtZSwgcHJvcHMpIC0+XG4gICAgICAgIHN1cGVyKHByb3BzKVxuXG4gICAgc2VyaWFsaXplOiAtPlxuICAgICAgICB4bWwgKz0gXCI8cGFydCBuYW1lPScje0BuYW1lfSc+XCJcbiAgICAgICAgeG1sICs9IHN1cGVyKClcbiAgICAgICAgeG1sICs9ICc8L3BhcnQ+J1xuXG5QID0gKG5hbWUsIHByb3BzKSAtPlxuICAgIHJldHVybiBuZXcgUGFydChuYW1lLCBwcm9wcylcblxuY2xhc3MgRW50aXR5IGV4dGVuZHMgRGF0YVxuXG4gICAgY29uc3RydWN0b3I6ICh0YWdzLCBwcm9wcykgLT5cbiAgICAgICAgQHBhcnRzID0gbmV3IE5hbWVTcGFjZShcInBhcnRzXCIpXG4gICAgICAgIHByb3BzID0gcHJvcHMgfHwge31cbiAgICAgICAgcHJvcHMuaWQgPSBwcm9wcy5pZCB8fCB1dWlkLnY0KClcbiAgICAgICAgdGFncyA9IHRhZ3MgfHwgcHJvcHMudGFncyB8fCBbXVxuICAgICAgICBwcm9wcy50YWdzID0gdGFnc1xuICAgICAgICBzdXBlcihwcm9wcylcblxuICAgIGFkZDogKHN5bWJvbCwgcGFydCkgLT5cbiAgICAgICAgQHBhcnRzLmJpbmQoc3ltYm9sLCBwYXJ0KVxuXG4gICAgcmVtb3ZlOiAobmFtZSkgLT5cbiAgICAgICAgQHBhcnRzLnVuYmluZChuYW1lKVxuXG4gICAgaGFzUGFydDogKG5hbWUpIC0+XG4gICAgICAgIEBwYXJ0cy5oYXMobmFtZSlcblxuICAgIHBhcnQ6IChuYW1lKSAtPlxuICAgICAgICBAcGFydHMuc3ltYm9sKG5hbWUpXG5cbiAgICBzZXJpYWxpemU6IC0+XG4gICAgICAgIHhtbCA9IFwiPGVudGl0eT5cIlxuICAgICAgICB4bWwgKz0gJzxwYXJ0cz4nXG4gICAgICAgIGZvciBwYXJ0IG9mIEBwYXJ0cy5vYmplY3RzKClcbiAgICAgICAgICAgIHhtbCArPSBwYXJ0LnNlcmlhbGl6ZSgpXG4gICAgICAgIHhtbCArPSAnPC9wYXJ0cz4nXG4gICAgICAgIHhtbCArPSBzdXBlcigpXG4gICAgICAgIHhtbCArPSAnPC9lbnRpdHk+J1xuXG5FID0gKHRhZ3MsIHByb3BzKSAtPlxuICAgIHJldHVybiBuZXcgRW50aXR5KHRhZ3MsIHByb3BzKVxuXG5jbGFzcyBDZWxsIGV4dGVuZHMgRW50aXR5XG5cbiAgICBjb25zdHJ1Y3RvcjogKHRhZ3MsIHByb3BzKSAtPlxuICAgICAgICBzdXBlcih0YWdzLCBwcm9wcylcbiAgICAgICAgQG9ic2VydmVycz0gbmV3IE5hbWVTcGFjZShcIm9ic2VydmVyc1wiKVxuXG4gICAgbm90aWZ5OiAoZXZlbnQpIC0+XG4gICAgICAgZm9yIG9iIGluIEBvYnNlcnZlcnMub2JqZWN0cygpXG4gICAgICAgICAgICBvYi5yYWlzZShldmVudClcblxuICAgIGFkZDogKHBhcnQpIC0+XG4gICAgICAgIHN1cGVyIHBhcnRcbiAgICAgICAgZXZlbnQgPSBuZXcgRXZlbnQoXCJwYXJ0LWFkZGVkXCIsIHtwYXJ0OiBwYXJ0LCBjZWxsOiB0aGlzfSlcbiAgICAgICAgQG5vdGlmeShldmVudClcblxuICAgIHJlbW92ZTogKG5hbWUpIC0+XG4gICAgICAgIHN1cGVyIG5hbWVcbiAgICAgICAgZXZlbnQgPSBuZXcgRXZlbnQoXCJwYXJ0LXJlbW92ZWRcIiwge3BhcnQ6IHBhcnQsIGNlbGw6IHRoaXN9KVxuICAgICAgICBAbm90aWZ5KGV2ZW50KVxuXG4gICAgb2JzZXJ2ZTogKHN5bWJvbCwgc3lzdGVtKSAtPlxuICAgICAgICBAb2JzZXJ2ZXJzLmJpbmQoc3ltYm9sLCBzeXN0ZW0pXG5cbiAgICBmb3JnZXQ6IChuYW1lKSAtPlxuICAgICAgICBAb2JzZXJ2ZXJzLnVuYmluZChuYW1lKVxuXG4gICAgc3RlcDogKGZuLCBhcmdzLi4uKSAtPlxuICAgICAgICByZXR1cm4gZm4uYXBwbHkodGhpcywgYXJncylcblxuICAgIGNsb25lOiAoKSAtPlxuICAgICAgICByZXR1cm4gY2xvbmUodGhpcylcblxuQyA9ICh0YWdzLCBwcm9wcykgLT5cbiAgICByZXR1cm4gbmV3IENlbGwodGFncywgcHJvcHMpXG5cbmNsYXNzIFN5c3RlbVxuXG4gICAgY29uc3RydWN0b3I6IChAcGwsIEBjb25mKSAtPlxuICAgICAgICBAaW5sZXRzID0gbmV3IE5hbWVTcGFjZShcImlubGV0c1wiKVxuICAgICAgICBAaW5sZXRzLmJpbmQobmV3IFN5bWJvbChcInN5c2luXCIpLFtdKVxuICAgICAgICBAaW5sZXRzLmJpbmQobmV3IFN5bWJvbChcImZlZWRiYWNrXCIpLFtdKVxuICAgICAgICBAb3V0bGV0cyA9IG5ldyBOYW1lU3BhY2UoXCJvdXRsZXRzXCIpXG4gICAgICAgIEBvdXRsZXRzLmJpbmQobmV3IFN5bWJvbChcInN5c291dFwiKSxbXSlcbiAgICAgICAgQG91dGxldHMuYmluZChuZXcgU3ltYm9sKFwic3lzZXJyXCIpLFtdKVxuXG4gICAgICAgIEBzdGF0ZSA9IFtdXG4gICAgICAgIEByID0ge31cblxuICAgIHRvcDogKGluZGV4KSAtPlxuICAgICAgICBpZiBpbmRleD9cbiAgICAgICAgICAgIGlmIEBzdGF0ZVtpbmRleF0/XG4gICAgICAgICAgICAgICAgcmV0dXJuIEBzdGF0ZVtpbmRleF1cbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICByZXR1cm4gUyhcIk5vdEZvdW5kXCIpXG5cbiAgICAgICAgaWYgQHN0YXRlLmxlbmd0aCA+IDBcbiAgICAgICAgICAgIHJldHVybiBAc3RhdGVbQHN0YXRlLmxlbmd0aCAtIDFdXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIHJldHVybiBTKFwiTm90Rm91bmRcIilcblxuICAgIGlucHV0OiAoZGF0YSwgaW5sZXQpIC0+XG4gICAgICAgIGRhdGFcblxuICAgIG91dHB1dDogKGRhdGEsIG91dGxldCkgLT5cbiAgICAgICAgZGF0YVxuXG4gICAgU1RPUDogKHN0b3BfdG9rZW4pIC0+XG5cbiAgICBwdXNoOiAoZGF0YSwgaW5sZXRfbmFtZSkgLT5cblxuICAgICAgICBpbmxldF9uYW1lID0gaW5sZXRfbmFtZSB8fCBcInN5c2luXCJcblxuICAgICAgICBpbnB1dF9kYXRhID0gQGlucHV0KGRhdGEsIGlubGV0X25hbWUpXG5cbiAgICAgICAgaWYgaW5wdXRfZGF0YSBpbnN0YW5jZW9mIEdsaXRjaFxuICAgICAgICAgICAgQGVycm9yKGlucHV0X2RhdGEpXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIEBwcm9jZXNzIGlucHV0X2RhdGEsIGlubGV0X25hbWVcblxuICAgIGdvdG9fd2l0aDogKGlubGV0X25hbWUsIGRhdGEpIC0+XG4gICAgICAgIEBwdXNoKGRhdGEsIGlubGV0X25hbWUpXG5cbiAgICBwcm9jZXNzOiAoZGF0YSwgaW5sZXRfbmFtZSkgLT5cbiAgICAgICAgQGVtaXQoZGF0YSwgXCJzdGRvdXRcIilcblxuICAgIHNlbmQ6IChkYXRhLCBvdXRsZXRfbmFtZSkgLT5cbiAgICAgICAgZm9yIG91dGxldCBpbiBAb3V0bGV0cy5zeW1ib2xzKClcbiAgICAgICAgICAgIGlmIG91dGxldC5uYW1lID09IG91dGxldF9uYW1lXG4gICAgICAgICAgICAgICAgZm9yIGNvbm5lY3Rpb24gaW4gb3V0bGV0Lm9iamVjdFxuICAgICAgICAgICAgICAgICAgICBjb25uZWN0aW9uLm9iamVjdC50cmFuc21pdCBkYXRhXG5cbiAgICBlbWl0OiAoZGF0YSwgb3V0bGV0X25hbWUpIC0+XG4gICAgICAgIG91dGxldF9uYW1lID0gb3V0bGV0X25hbWUgfHwgXCJzeXNvdXRcIlxuXG4gICAgICAgIG91dHB1dF9kYXRhID0gQG91dHB1dChkYXRhLCBvdXRsZXRfbmFtZSlcblxuICAgICAgICBpZiBvdXRwdXRfZGF0YSBpbnN0YW5jZW9mIEdsaXRjaFxuICAgICAgICAgICAgQGVycm9yKG91dHB1dF9kYXRhKVxuICAgICAgICAgICAgcmV0dXJuXG5cbiAgICAgICAgQHNlbmQob3V0cHV0X2RhdGEsIG91dGxldF9uYW1lKVxuXG5cbiAgICBlcnJvcjogKGRhdGEpIC0+XG4gICAgICAgIEBzZW5kKGRhdGEsIFwic3lzZXJyXCIpXG5cbiAgICByYWlzZTogKHNpZ25hbCkgLT5cbiAgICAgICAgQHJlYWN0KHNpZ25hbClcblxuICAgIHJlYWN0OiAoc2lnbmFsKSAtPlxuXG4gICAgc2hvdzogKGRhdGEpIC0+XG5cblxuY2xhc3MgV2lyZVxuXG4gICAgY29uc3RydWN0b3I6IChAb3V0bGV0LCBAaW5sZXQpIC0+XG5cblxuY2xhc3MgQ29ubmVjdGlvblxuXG4gICAgY29uc3RydWN0b3I6IChAc291cmNlLCBAc2luaywgQHBsLCBAd2lyZSkgLT5cblxuXG4gICAgdHJhbnNtaXQ6IChkYXRhKSAtPlxuICAgICAgICBAc2luay5vYmplY3QucHVzaChkYXRhLCBAd2lyZS5pbmxldC5uYW1lKVxuXG5cbmNsYXNzIFN0b3JlXG5cbiAgICBjb25zdHJ1Y3RvcjogLT5cbiAgICAgICAgQGVudGl0aWVzID0gbmV3IE5hbWVTcGFjZShcImVudGl0aWVzXCIpXG5cbiAgICBhZGQ6IChlbnRpdHkpIC0+XG4gICAgICAgIHN5bWJvbCA9IFMoZW50aXR5LmlkKVxuICAgICAgICBAZW50aXRpZXMuYmluZChzeW1ib2wsIGVudGl0eSlcbiAgICAgICAgc3ltYm9sXG5cbiAgICBzbmFwc2hvdDogKCkgLT5cbiAgICAgICAgeG1sID0gJzw/eG1sIHZlcnNpb24gPSBcIjEuMFwiIHN0YW5kYWxvbmU9XCJ5ZXNcIj8+J1xuICAgICAgICB4bWwgKz0gXCI8c25hcHNob3Q+XCJcbiAgICAgICAgZm9yIGVudGl0eSBpbiBAZW50aXRpZXMub2JqZWN0cygpXG4gICAgICAgICAgICB4bWwgKz0gZW50aXR5LnNlcmlhbGl6ZSgpXG4gICAgICAgIHhtbCArPSBcIjwvc25hcHNob3Q+XCJcbiAgICAgICAgcmV0dXJuIHhtbFxuXG4gICAgb3A6IChmLCBhcmdzLi4uKSAtPlxuICAgICAgICByZXR1cm4gZi5hcHBseSh0aGlzLCBhcmdzKVxuXG4gICAgX19wcm9jZXNzX3NjYWxhcjogKHNjYWxhcikgLT5cbiAgICAgICAgdHlwZSA9IHNjYWxhci5nZXRBdHRyaWJ1dGUoXCJ0eXBlXCIpXG4gICAgICAgIHRleHQgPSBzY2FsYXIudGV4dENvbnRlbnRcbiAgICAgICAgaWYgdHlwZSBpcyBcIm51bWJlclwiXG4gICAgICAgICAgICB2YWx1ZSA9IE51bWJlcih0ZXh0KVxuICAgICAgICBlbHNlIGlmIHR5cGUgaXMgXCJzdHJpbmdcIlxuICAgICAgICAgICAgdmFsdWUgPSBTdHJpbmcodGV4dClcbiAgICAgICAgZWxzZSBpZiB0eXBlIGlzIFwiYm9vbGVhblwiXG4gICAgICAgICAgICB2YWx1ZSA9IEJvb2xlYW4odGV4dClcbiAgICAgICAgZWxzZSBpZiB0eXBlIGlzIFwiYXJyYXlcIlxuICAgICAgICAgICAgbGlzdF9zY2FsYXJzID0geHBhdGguc2VsZWN0KFwibGlzdC9zY2FsYXJcIiwgc2NhbGFyKVxuICAgICAgICAgICAgdmFsdWUgPSBbXVxuICAgICAgICAgICAgZm9yIGVsIGluIGxpc3Rfc2NhbGFyc1xuICAgICAgICAgICAgICAgIGVsX3R5cGUgPSBlbC5nZXRBdHRyaWJ1dGUoXCJ0eXBlXCIpXG4gICAgICAgICAgICAgICAgZWxfdGV4dCA9IGVsLnRleHRDb250ZW50XG4gICAgICAgICAgICAgICAgaWYgZWxfdHlwZSBpcyBcIm51bWJlclwiXG4gICAgICAgICAgICAgICAgICAgIGVsX3ZhbHVlID0gTnVtYmVyKGVsX3RleHQpXG4gICAgICAgICAgICAgICAgZWxzZSBpZiBlbF90eXBlIGlzIFwic3RyaW5nXCJcbiAgICAgICAgICAgICAgICAgICAgZWxfdmFsdWUgPSBTdHJpbmcoZWxfdGV4dClcbiAgICAgICAgICAgICAgICBlbHNlIGlmIGVsX3R5cGUgaXMgXCJib29sZWFuXCJcbiAgICAgICAgICAgICAgICAgICAgZWxfdmFsdWUgPSBCb29sZWFuKGVsX3RleHQpXG4gICAgICAgICAgICAgICAgdmFsdWUucHVzaChlbF92YWx1ZSlcblxuICAgICAgICByZXR1cm4gdmFsdWVcblxuICAgIF9fcHJvY2Vzc19wcm9wOiAocHJvcCkgLT5cbiAgICAgICAgZW50aXR5X3Byb3AgPSB7fVxuICAgICAgICBzbG90ID0gcHJvcC5nZXRBdHRyaWJ1dGUoXCJzbG90XCIpXG4gICAgICAgIHNjYWxhciA9IHhwYXRoLnNlbGVjdChcInNjYWxhclwiLCBwcm9wIClcbiAgICAgICAgdmFsdWUgPSBAX19wcm9jZXNzX3NjYWxhcihzY2FsYXJbMF0pXG4gICAgICAgIGVudGl0eV9wcm9wLnNsb3QgPSBzbG90XG4gICAgICAgIGVudGl0eV9wcm9wLnZhbHVlID0gdmFsdWVcbiAgICAgICAgZW50aXR5X3Byb3BcblxuICAgIHJlY292ZXI6ICh4bWwpIC0+XG4gICAgICAgIGRvYyA9IG5ldyBkb20oKS5wYXJzZUZyb21TdHJpbmcoeG1sKVxuICAgICAgICBlbnRpdGllcyA9IHhwYXRoLnNlbGVjdChcIi8vZW50aXR5XCIsIGRvYylcbiAgICAgICAgZW50aXRpZXNfbGlzdCA9IFtdXG4gICAgICAgIGZvciBlbnRpdHkgaW4gZW50aXRpZXNcbiAgICAgICAgICAgIGVudGl0eV9wcm9wcyA9IHt9XG4gICAgICAgICAgICBwcm9wcyA9IHhwYXRoLnNlbGVjdChcInByb3BlcnR5XCIsIGVudGl0eSlcbiAgICAgICAgICAgIGZvciBwcm9wIGluIHByb3BzXG4gICAgICAgICAgICAgICAgZW50aXR5X3Byb3AgPSBAX19wcm9jZXNzX3Byb3AocHJvcClcbiAgICAgICAgICAgICAgICBlbnRpdHlfcHJvcHNbZW50aXR5X3Byb3Auc2xvdF0gPSBlbnRpdHlfcHJvcC52YWx1ZVxuXG4gICAgICAgICAgICBuZXdfZW50aXR5ID0gbmV3IEVudGl0eShudWxsLCBlbnRpdHlfcHJvcHMpXG5cbiAgICAgICAgICAgIHBhcnRzID0geHBhdGguc2VsZWN0KFwicGFydFwiLCBlbnRpdHkpXG4gICAgICAgICAgICBmb3IgcGFydCBpbiBwYXJ0c1xuICAgICAgICAgICAgICAgIG5hbWUgPSBwYXJ0LmdldEF0dHJpYnV0ZShcIm5hbWVcIilcbiAgICAgICAgICAgICAgICBwYXJ0X3Byb3BzID0ge31cbiAgICAgICAgICAgICAgICBwcm9wcyA9IHhwYXRoLnNlbGVjdChcInByb3BlcnR5XCIsIHBhcnQpXG4gICAgICAgICAgICAgICAgZm9yIHByb3AgaW4gcHJvcHNcbiAgICAgICAgICAgICAgICAgICAgcGFydF9wcm9wID0gQF9fcHJvY2Vzc19wcm9wKHByb3ApXG4gICAgICAgICAgICAgICAgICAgIHBhcnRfcHJvcHNbcGFydF9wcm9wLnNsb3RdID0gcGFydF9wcm9wLnZhbHVlXG4gICAgICAgICAgICAgICAgZW50aXR5X3BhcnQgPSBuZXcgUGFydChuYW1lLCBwYXJ0X3Byb3BzKVxuICAgICAgICAgICAgICAgIG5ld19lbnRpdHkuYWRkKGVudGl0eV9wYXJ0KVxuXG4gICAgICAgICAgICBlbnRpdGllc19saXN0LnB1c2gobmV3X2VudGl0eSlcblxuICAgICAgICBmb3IgZW50aXR5IGluIGVudGl0aWVzX2xpc3RcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGVudGl0eSlcbiAgICAgICAgICAgIEBhZGQoZW50aXR5KVxuXG4gICAgaGFzOiAoaWQpIC0+XG4gICAgICAgIEBlbnRpdGllcy5oYXMoaWQpXG5cbiAgICBlbnRpdHk6IChpZCkgLT5cbiAgICAgICAgQGVudGl0aWVzLm9iamVjdChpZClcblxuICAgIHJlbW92ZTogKGlkKSAtPlxuICAgICAgICBAZW50aXRpZXMudW5iaW5kKGlkKVxuXG4gICAgYnlfcHJvcDogKHByb3ApIC0+XG4gICAgICAgIGVudGl0aWVzID0gW11cbiAgICAgICAgZm9yIGVudGl0eSBpbiBAZW50aXRpZXMub2JqZWN0cygpXG4gICAgICAgICAgICBpZiBlbnRpdHkuaGFzKHByb3Auc2xvdClcbiAgICAgICAgICAgICAgICBpZiBlbnRpdHkuc2xvdChwcm9wLnNsb3QpIGlzIHByb3AudmFsdWVcbiAgICAgICAgICAgICAgICAgICAgZW50aXRpZXMucHVzaChlbnRpdHkpXG5cbiAgICAgICAgaWYgZW50aXRpZXMubGVuZ3RoID4gMFxuICAgICAgICAgICAgcmV0dXJuIGVudGl0aWVzXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIEcoXCJOb3RGb3VuZFwiKVxuXG4gICAgZmlyc3RfYnlfcHJvcDogKHByb3ApIC0+XG4gICAgICAgIGVudGl0aWVzID0gQGJ5X3Byb3AocHJvcClcbiAgICAgICAgaWYgZW50aXRpZXMgaW5zdGFuY2VvZiBHbGl0Y2hcbiAgICAgICAgICAgIHJldHVybiBlbnRpdGllc1xuICAgICAgICBlbHNlXG4gICAgICAgICAgICBlbnRpdGllc1swXVxuXG4gICAgYnlfdGFnczogKHRhZ3MpIC0+XG4gICAgICAgIGVudGl0aWVzID0gW11cbiAgICAgICAgZm9yIGVudGl0eSBpbiBAZW50aXRpZXMub2JqZWN0cygpXG4gICAgICAgICAgICBmb3IgdGFnIGluIHRhZ3NcbiAgICAgICAgICAgICAgICBpZiB0YWcgaW4gZW50aXR5LnRhZ3NcbiAgICAgICAgICAgICAgICAgICAgZW50aXRpZXMucHVzaCBlbnRpdHlcblxuICAgICAgICBpZiBlbnRpdGllcy5sZW5ndGggPiAwXG4gICAgICAgICAgICByZXR1cm4gZW50aXRpZXNcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgRyhcIk5vdEZvdW5kXCIpXG5cbiAgICBmaXJzdF9ieV90YWdzOiAodGFncykgLT5cbiAgICAgICAgZW50aXRpZXMgPSBAYnlfdGFncyh0YWdzKVxuICAgICAgICBpZiBlbnRpdGllcyBpbnN0YW5jZW9mIEdsaXRjaFxuICAgICAgICAgICAgcmV0dXJuIGVudGl0aWVzXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIGVudGl0aWVzWzBdXG5cbmNsYXNzIEJ1cyBleHRlbmRzIE5hbWVTcGFjZVxuXG4gICAgY29uc3RydWN0b3I6IChAbmFtZSwgc2VwKSAtPlxuICAgICAgICBzdXBlcihAbmFtZSwgc2VwKVxuXG4gICAgdHJpZ2dlcjogKHNpZ25hbCkgLT5cbiAgICAgICAgZm9yIG9iaiBpbiBAb2JqZWN0cygpXG4gICAgICAgICAgICBpZiBvYmogaW5zdGFuY2VvZiBTeXN0ZW1cbiAgICAgICAgICAgICAgICBvYmoucmFpc2Uoc2lnbmFsKVxuXG5jbGFzcyBQaXBlbGluZVxuXG4gICAgY29uc3RydWN0b3I6IChuYW1lLCBjb25uZWN0aW9uQ2xhc3MsIHN0b3JlQ2xhc3MsIGJ1c0NsYXNzKSAtPlxuICAgICAgICBzdG9yZUNsYXNzID0gc3RvcmVDbGFzcyB8fCBTdG9yZVxuICAgICAgICBidXNDbGFzcyA9IGJ1c0NsYXNzIHx8IEJ1c1xuXG4gICAgICAgIEBjb25uZWN0aW9uQ2xhc3MgPSBjb25uZWN0aW9uQ2xhc3MgfHwgQ29ubmVjdGlvblxuICAgICAgICBAc3RvcmUgPSBuZXcgc3RvcmVDbGFzcygpXG4gICAgICAgIEBjb25uZWN0aW9ucyA9IG5ldyBOYW1lU3BhY2UoXCJidXMuY29ubmVjdGlvbnNcIilcblxuICAgICAgICBAYnVzID0gbmV3IGJ1c0NsYXNzKFwic3lzdGVtc1wiKVxuICAgICAgICBAc3lzdGVtcyA9IEBidXNcbiAgICAgICAgQGJ1cy5iaW5kKFMoXCJjb25uZWN0aW9uc1wiKSwgIEBjb25uZWN0aW9ucylcbiAgICAgICAgQGJ1cy5iaW5kKFMoXCJzdG9yZVwiKSwgQHN0b3JlKVxuXG4gICAgY29ubmVjdDogKHNvdXJjZSwgc2luaywgd2lyZSwgc3ltYm9sKSAtPlxuICAgICAgICBzb3VyY2UgPSBAc3lzdGVtcy5zeW1ib2woc291cmNlKVxuICAgICAgICBzaW5rID0gQHN5c3RlbXMuc3ltYm9sKHNpbmspXG4gICAgICAgIHdpcmUgPSB3aXJlIHx8IG5ldyBXaXJlKHNvdXJjZS5vYmplY3Qub3V0bGV0cy5zeW1ib2woXCJzeXNvdXRcIiksIHNpbmsub2JqZWN0LmlubGV0cy5zeW1ib2woXCJzeXNpblwiKSlcbiAgICAgICAgY29ubmVjdGlvbiA9IG5ldyBAY29ubmVjdGlvbkNsYXNzKHNvdXJjZSwgc2luaywgdGhpcywgd2lyZSlcbiAgICAgICAgaWYgIXN5bWJvbFxuICAgICAgICAgICAgbmFtZSA9IFwiI3tzb3VyY2V9Ojoje2Nvbm5lY3Rpb24ud2lyZS5vdXRsZXQubmFtZX0tI3tzaW5rfTo6I3tjb25uZWN0aW9uLndpcmUuaW5sZXQubmFtZX1cIlxuICAgICAgICAgICAgc3ltYm9sID0gbmV3IFN5bWJvbChuYW1lKVxuICAgICAgICBAY29ubmVjdGlvbnMuYmluZChzeW1ib2wsIGNvbm5lY3Rpb24pXG5cbiAgICAgICAgZm9yIG91dGxldCBpbiBjb25uZWN0aW9uLnNvdXJjZS5vYmplY3Qub3V0bGV0cy5zeW1ib2xzKClcbiAgICAgICAgICAgIGlmIG91dGxldC5uYW1lIGlzIGNvbm5lY3Rpb24ud2lyZS5vdXRsZXQubmFtZVxuICAgICAgICAgICAgICAgIG91dGxldC5vYmplY3QucHVzaChzeW1ib2wpXG5cbiAgICBwaXBlOiAoc291cmNlLCB3aXJlLCBzaW5rKSAtPlxuICAgICAgICBAY29ubmVjdChzb3VyY2UsIHNpbmssIHdpcmUpXG5cbiAgICBkaXNjb25uZWN0OiAobmFtZSkgLT5cbiAgICAgICAgY29ubmVjdGlvbiA9IEBjb25uZWN0aW9uKG5hbWUpXG4gICAgICAgIEBjb25uZWN0aW9ucy51bmJpbmQobmFtZSlcblxuICAgICAgICBmb3Igb3V0bGV0IGluIGNvbm5lY3Rpb24uc291cmNlLm9iamVjdC5vdXRsZXRzLnN5bWJvbHMoKVxuICAgICAgICAgICAgaWYgb3V0bGV0Lm5hbWUgaXMgY29ubmVjdGlvbi53aXJlLm91dGxldC5uYW1lXG4gICAgICAgICAgICAgICAgY29ubmVjdGlvbnMgPSBbXVxuICAgICAgICAgICAgICAgIGZvciBjb25uIGluIG91dGxldC5vYmplY3RcbiAgICAgICAgICAgICAgICAgICAgaWYgY29ubi5uYW1lICE9IG5hbWVcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbm5lY3Rpb25zLnB1c2goY29ubilcbiAgICAgICAgICAgICAgICBvdXRsZXQub2JqZWN0ID0gY29ubmVjdGlvbnNcblxuXG4gICAgY29ubmVjdGlvbjogKG5hbWUpIC0+XG4gICAgICAgIEBjb25uZWN0aW9ucy5vYmplY3QobmFtZSlcblxuICAgIGhhc0Nvbm5lY3Rpb246IChuYW1lKSAtPlxuICAgICAgICBAY29ubmVjdGlvbnMuaGFzKG5hbWUpXG5cbiAgICBhZGQ6IChzeW1ib2wsIHN5c3RlbUNsYXNzLCBjb25mKSAtPlxuICAgICAgICBzeXN0ZW0gPSBuZXcgc3lzdGVtQ2xhc3ModGhpcywgY29uZilcbiAgICAgICAgQGJ1cy5iaW5kKHN5bWJvbCwgc3lzdGVtKVxuXG4gICAgaGFzOiAobmFtZSkgLT5cbiAgICAgICAgQGJ1cy5oYXMobmFtZSlcblxuICAgIHN5c3RlbTogKG5hbWUpIC0+XG4gICAgICAgIEBidXMub2JqZWN0KG5hbWUpXG5cbiAgICByZW1vdmU6IChuYW1lKSAtPlxuICAgICAgICBzeXN0ZW0gPSBAYnVzLm9iamVjdChuYW1lKVxuICAgICAgICBzeXN0ZW0ucHVzaChAU1RPUClcbiAgICAgICAgQGJ1cy51bmJpbmQobmFtZSlcblxuZXhwb3J0cy5TeW1ib2wgPSBTeW1ib2xcbmV4cG9ydHMuTmFtZVNwYWNlID0gTmFtZVNwYWNlXG5leHBvcnRzLlMgPSBTXG5leHBvcnRzLkRhdGEgPSBEYXRhXG5leHBvcnRzLkQgPSBEXG5leHBvcnRzLlNpZ25hbCA9IFNpZ25hbFxuZXhwb3J0cy5FdmVudCA9IEV2ZW50XG5leHBvcnRzLkdsaXRjaCA9IEdsaXRjaFxuZXhwb3J0cy5HID0gR1xuZXhwb3J0cy5Ub2tlbiA9IFRva2VuXG5leHBvcnRzLnN0YXJ0ID0gc3RhcnRcbmV4cG9ydHMuc3RvcCA9IHN0b3BcbmV4cG9ydHMuVCA9IFRcbmV4cG9ydHMuUGFydCA9IFBhcnRcbmV4cG9ydHMuUCA9IFBcbmV4cG9ydHMuRW50aXR5ID0gRW50aXR5XG5leHBvcnRzLkUgPSBFXG5leHBvcnRzLkNlbGwgPSBDZWxsXG5leHBvcnRzLkMgPSBDXG5leHBvcnRzLlN5c3RlbSA9IFN5c3RlbVxuZXhwb3J0cy5XaXJlID0gV2lyZVxuZXhwb3J0cy5Db25uZWN0aW9uID0gQ29ubmVjdGlvblxuZXhwb3J0cy5TdG9yZSA9IFN0b3JlXG5leHBvcnRzLkJ1cyA9IEJ1c1xuZXhwb3J0cy5QaXBlbGluZSA9IFBpcGVsaW5lXG5leHBvcnRzLm1peGlucyA9IG1peGluc1xuXG4iXSwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=