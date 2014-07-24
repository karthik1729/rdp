var Board, Bus, C, Cell, Connection, D, Data, E, Entity, Event, G, Glitch, NameSpace, P, Part, S, Signal, Store, Symbol, System, T, Token, Wire, clone, dom, mixins, start, stop, uuid, xpath,
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
  function System(b, conf) {
    this.b = b;
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
  function Connection(source, sink, b, wire) {
    this.source = source;
    this.sink = sink;
    this.b = b;
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

Board = (function() {
  function Board(name, connectionClass, storeClass, busClass) {
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

  Board.prototype.connect = function(source, sink, wire, symbol) {
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

  Board.prototype.pipe = function(source, wire, sink) {
    return this.connect(source, sink, wire);
  };

  Board.prototype.disconnect = function(name) {
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

  Board.prototype.connection = function(name) {
    return this.connections.object(name);
  };

  Board.prototype.hasConnection = function(name) {
    return this.connections.has(name);
  };

  Board.prototype.add = function(symbol, systemClass, conf) {
    var system;
    system = new systemClass(this, conf);
    return this.bus.bind(symbol, system);
  };

  Board.prototype.has = function(name) {
    return this.bus.has(name);
  };

  Board.prototype.system = function(name) {
    return this.bus.object(name);
  };

  Board.prototype.remove = function(name) {
    var system;
    system = this.bus.object(name);
    system.push(this.STOP);
    return this.bus.unbind(name);
  };

  return Board;

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

exports.Board = Board;

exports.mixins = mixins;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29yZS5qcyIsInNvdXJjZXMiOlsiY29yZS5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsSUFBQSx5TEFBQTtFQUFBOzs7aVNBQUE7O0FBQUEsSUFBQSxHQUFPLE9BQUEsQ0FBUSxXQUFSLENBQVAsQ0FBQTs7QUFBQSxLQUNBLEdBQVEsT0FBQSxDQUFRLE9BQVIsQ0FEUixDQUFBOztBQUFBLE1BR0EsR0FBUyxPQUFBLENBQVEsYUFBUixDQUhULENBQUE7O0FBQUEsS0FLQSxHQUFRLE9BQUEsQ0FBUSxPQUFSLENBTFIsQ0FBQTs7QUFBQSxHQU1BLEdBQU0sT0FBQSxDQUFRLFFBQVIsQ0FBaUIsQ0FBQyxTQU54QixDQUFBOztBQUFBO0FBVWlCLEVBQUEsZ0JBQUUsSUFBRixFQUFTLE1BQVQsRUFBa0IsRUFBbEIsRUFBc0IsS0FBdEIsR0FBQTtBQUNULElBRFUsSUFBQyxDQUFBLE9BQUEsSUFDWCxDQUFBO0FBQUEsSUFEaUIsSUFBQyxDQUFBLFNBQUEsTUFDbEIsQ0FBQTtBQUFBLElBRDBCLElBQUMsQ0FBQSxLQUFBLEVBQzNCLENBQUE7QUFBQSxJQUFBLElBQUcsYUFBSDtBQUNJLE1BQUEsSUFBQyxDQUFBLEtBQUQsQ0FBTyxLQUFQLENBQUEsQ0FESjtLQURTO0VBQUEsQ0FBYjs7QUFBQSxtQkFJQSxJQUFBLEdBQU0sU0FBQyxDQUFELEVBQUksQ0FBSixHQUFBO0FBQ0YsSUFBQSxJQUFHLENBQUg7YUFDSSxJQUFFLENBQUEsQ0FBQSxDQUFGLEdBQU8sRUFEWDtLQUFBLE1BQUE7YUFHSSxJQUFFLENBQUEsQ0FBQSxFQUhOO0tBREU7RUFBQSxDQUpOLENBQUE7O0FBQUEsbUJBVUEsRUFBQSxHQUFJLFNBQUEsR0FBQTtBQUNBLFFBQUEsT0FBQTtBQUFBLElBREMsa0JBQUcsOERBQ0osQ0FBQTtBQUFBLFdBQU8sQ0FBQyxDQUFDLEtBQUYsQ0FBUSxJQUFSLEVBQWMsSUFBZCxDQUFQLENBREE7RUFBQSxDQVZKLENBQUE7O0FBQUEsbUJBYUEsS0FBQSxH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LEdBQWdCLEtBcm9CaEIsQ0FBQTs7QUFBQSxPQXNvQk8sQ0FBQyxNQUFSLEdBQWlCLE1BdG9CakIsQ0FBQTs7QUFBQSxPQXVvQk8sQ0FBQyxDQUFSLEdBQVksQ0F2b0JaLENBQUE7O0FBQUEsT0F3b0JPLENBQUMsS0FBUixHQUFnQixLQXhvQmhCLENBQUE7O0FBQUEsT0F5b0JPLENBQUMsS0FBUixHQUFnQixLQXpvQmhCLENBQUE7O0FBQUEsT0Ewb0JPLENBQUMsSUFBUixHQUFlLElBMW9CZixDQUFBOztBQUFBLE9BMm9CTyxDQUFDLENBQVIsR0FBWSxDQTNvQlosQ0FBQTs7QUFBQSxPQTRvQk8sQ0FBQyxJQUFSLEdBQWUsSUE1b0JmLENBQUE7O0FBQUEsT0E2b0JPLENBQUMsQ0FBUixHQUFZLENBN29CWixDQUFBOztBQUFBLE9BOG9CTyxDQUFDLE1BQVIsR0FBaUIsTUE5b0JqQixDQUFBOztBQUFBLE9BK29CTyxDQUFDLENBQVIsR0FBWSxDQS9vQlosQ0FBQTs7QUFBQSxPQWdwQk8sQ0FBQyxJQUFSLEdBQWUsSUFocEJmLENBQUE7O0FBQUEsT0FpcEJPLENBQUMsQ0FBUixHQUFZLENBanBCWixDQUFBOztBQUFBLE9Ba3BCTyxDQUFDLE1BQVIsR0FBaUIsTUFscEJqQixDQUFBOztBQUFBLE9BbXBCTyxDQUFDLElBQVIsR0FBZSxJQW5wQmYsQ0FBQTs7QUFBQSxPQW9wQk8sQ0FBQyxVQUFSLEdBQXFCLFVBcHBCckIsQ0FBQTs7QUFBQSxPQXFwQk8sQ0FBQyxLQUFSLEdBQWdCLEtBcnBCaEIsQ0FBQTs7QUFBQSxPQXNwQk8sQ0FBQyxHQUFSLEdBQWMsR0F0cEJkLENBQUE7O0FBQUEsT0F1cEJPLENBQUMsS0FBUixHQUFnQixLQXZwQmhCLENBQUE7O0FBQUEsT0F3cEJPLENBQUMsTUFBUixHQUFpQixNQXhwQmpCLENBQUEiLCJzb3VyY2VzQ29udGVudCI6WyJ1dWlkID0gcmVxdWlyZSBcIm5vZGUtdXVpZFwiXG5jbG9uZSA9IHJlcXVpcmUgXCJjbG9uZVwiXG5cbm1peGlucyA9IHJlcXVpcmUgXCIuL21peGlucy5qc1wiXG5cbnhwYXRoID0gcmVxdWlyZSgneHBhdGgnKVxuZG9tID0gcmVxdWlyZSgneG1sZG9tJykuRE9NUGFyc2VyXG5cbmNsYXNzIFN5bWJvbFxuXG4gICAgY29uc3RydWN0b3I6IChAbmFtZSwgQG9iamVjdCwgQG5zLCBhdHRycykgLT5cbiAgICAgICAgaWYgYXR0cnM/XG4gICAgICAgICAgICBAYXR0cnMoYXR0cnMpXG5cbiAgICBhdHRyOiAoaywgdikgLT5cbiAgICAgICAgaWYgdlxuICAgICAgICAgICAgQFtrXSA9IHZcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgQFtrXVxuXG4gICAgb3A6IChmLCBhcmdzLi4uKSAtPlxuICAgICAgICByZXR1cm4gZi5hcHBseSh0aGlzLCBhcmdzKVxuXG4gICAgYXR0cnM6IChrdikgLT5cbiAgICAgICAgZm9yIGssIHYgaW4ga3ZcbiAgICAgICAgICAgIEBba10gPSB2XG5cbiAgICBpczogKHN5bWJvbCkgLT5cbiAgICAgICAgaWYgc3ltYm9sLm5hbWUgaXMgQG5hbWVcbiAgICAgICAgICAgIGlmIHN5bWJvbC5vYmplY3QgaXMgQG9iamVjdFxuICAgICAgICAgICAgICAgIHJldHVybiB0cnVlXG4gICAgICAgICAgICBpZiAoc3ltYm9sLm9iamVjdCBpcyBudWxsKSBhbmQgKEBvYmplY3QgaXMgbnVsbClcbiAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZVxuICAgICAgICBlbHNlXG4gICAgICAgICAgICByZXR1cm4gZmFsc2VcblxuICAgIHRvU3RyaW5nOiAtPlxuICAgICAgIGlmIEBucz9cbiAgICAgICAgICAgcmV0dXJuIEBucy5uYW1lICsgQG5zLnNlcCArIEBuYW1lXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgcmV0dXJuIEBuYW1lXG5cblMgPSAobmFtZSwgb2JqZWN0LCBucywgYXR0cnMpIC0+XG4gICAgcmV0dXJuIG5ldyBTeW1ib2wobmFtZSwgb2JqZWN0LCBucywgYXR0cnMpXG5cbiMgc2hvdWxkIGJlIGEgc2V0XG5cbmNsYXNzIE5hbWVTcGFjZVxuXG4gICAgY29uc3RydWN0b3I6IChAbmFtZSwgc2VwKSAtPlxuICAgICAgICBAZWxlbWVudHMgPSB7fVxuICAgICAgICBAc2VwID0gc2VwIHx8IFwiLlwiXG5cbiAgICBiaW5kOiAoc3ltYm9sLCBvYmplY3QpIC0+XG4gICAgICAgIG5hbWUgPSBzeW1ib2wubmFtZVxuICAgICAgICBzeW1ib2wub2JqZWN0ID0gb2JqZWN0XG4gICAgICAgIG9iamVjdC5zeW1ib2wgPSBzeW1ib2xcbiAgICAgICAgQGVsZW1lbnRzW25hbWVdID0gc3ltYm9sXG4gICAgICAgIHN5bWJvbC5ucyA9IHRoaXNcbiAgICAgICAgc3ltYm9sXG5cbiAgICB1bmJpbmQ6IChuYW1lKSAtPlxuICAgICAgICBzeW1ib2wgPSBAZWxlbWVudHNbbmFtZV1cbiAgICAgICAgZGVsZXRlIEBlbGVtZW50c1tuYW1lXVxuICAgICAgICBzeW1ib2wubnMgPSB1bmRlZmluZWRcbiAgICAgICAgc3ltYm9sXG5cbiAgICBzeW1ib2w6IChuYW1lKSAtPlxuICAgICAgICBpZiBAaGFzKG5hbWUpXG4gICAgICAgICAgICBAZWxlbWVudHNbbmFtZV1cbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgUyhcIk5vdEZvdW5kXCIpXG5cbiAgICBoYXM6IChuYW1lKSAtPlxuICAgICAgICBpZiBAZWxlbWVudHNbbmFtZV0/XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZVxuICAgICAgICBlbHNlXG4gICAgICAgICAgICByZXR1cm4gZmFsc2VcblxuICAgIG9iamVjdDogKG5hbWUpIC0+XG4gICAgICAgIGlmIEBoYXMobmFtZSlcbiAgICAgICAgICAgIEBlbGVtZW50c1tuYW1lXS5vYmplY3RcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgRyhcIk5vdEZvdW5kXCIpXG5cbiAgICBzeW1ib2xzOiAoKSAtPlxuICAgICAgIHN5bWJvbHMgPSBbXVxuXG4gICAgICAgZm9yIGssdiBvZiBAZWxlbWVudHNcbiAgICAgICAgICAgc3ltYm9scy5wdXNoKHYpXG5cbiAgICAgICBzeW1ib2xzXG5cbiAgICBvYmplY3RzOiAoKSAtPlxuICAgICAgIG9iamVjdHMgPSBbXVxuXG4gICAgICAgZm9yIGssdiBvZiBAZWxlbWVudHNcbiAgICAgICAgICAgb2JqZWN0cy5wdXNoKHYub2JqZWN0KVxuXG4gICAgICAgb2JqZWN0c1xuXG5cbmNsYXNzIERhdGFcblxuICAgIGNvbnN0cnVjdG9yOiAocHJvcHMpIC0+XG4gICAgICAgIEBfX3Nsb3RzID0gW11cbiAgICAgICAgaWYgcHJvcHM/XG4gICAgICAgICAgICBAcHJvcHMocHJvcHMpXG5cbiAgICBpczogKGRhdGEpIC0+XG4gICAgICAgIGFsbF9zbG90cyA9IEBzbG90cygpXG4gICAgICAgIGZvciBuYW1lIGluIGRhdGEuc2xvdHMoKVxuICAgICAgICAgICAgaWYgZGF0YS5zbG90KG5hbWUpIGlzIG5vdCBAc2xvdChuYW1lKVxuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZVxuXG4gICAgICAgIHJldHVybiB0cnVlXG5cbiAgICBwcm9wczogKGt2KSAtPlxuICAgICAgICBpZiBrdlxuICAgICAgICAgICAgZm9yIGssIHYgb2Yga3ZcbiAgICAgICAgICAgICAgICBAW2tdID0gdlxuICAgICAgICAgICAgICAgIGlmIGsgbm90IGluIEBzbG90cygpXG4gICAgICAgICAgICAgICAgICAgIEBzbG90cyhrKVxuICAgICAgICAgICAgcmV0dXJuIEB2YWxpZGF0ZSgpXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIHByb3BlcnRpZXMgPSBbXVxuICAgICAgICAgICAgZm9yIG5hbWUgaW4gQHNsb3RzKClcbiAgICAgICAgICAgICAgICBwcm9wZXJ0aWVzLnB1c2goQFtuYW1lXSlcbiAgICAgICAgICAgIHJldHVybiBwcm9wZXJ0aWVzXG5cbiAgICBzbG90czogKG5hbWUpIC0+XG4gICAgICAgIGlmIG5hbWVcbiAgICAgICAgICAgIEBfX3Nsb3RzLnB1c2gobmFtZSlcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgQF9fc2xvdHNcblxuICAgIHNsb3Q6IChuYW1lLCB2YWx1ZSkgLT5cbiAgICAgICAgaWYgdmFsdWVcbiAgICAgICAgICAgIEBbbmFtZV0gPSB2YWx1ZVxuICAgICAgICAgICAgaWYgbmFtZSBub3QgaW4gQHNsb3RzKClcbiAgICAgICAgICAgICAgICBAc2xvdHMobmFtZSlcbiAgICAgICAgICAgIGlmIEB2YWxpZGF0ZSgpXG4gICAgICAgICAgICAgICAgcmV0dXJuIHZhbHVlXG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgRyhcIkludmFsaWRcIilcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgaWYgQGhhcyhuYW1lKVxuICAgICAgICAgICAgICAgIEBbbmFtZV1cbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICBHKFwiTm90Rm91bmRcIilcblxuICAgIGhhczogKG5hbWUpIC0+XG4gICAgICAgIGlmIG5hbWUgaW4gQHNsb3RzKClcbiAgICAgICAgICAgIHJldHVybiB0cnVlXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIHJldHVybiBmYWxzZVxuXG4gICAgdmFsaWRhdGU6IC0+XG4gICAgICAgIHRydWVcblxuXG4gICAgc2VyaWFsaXplOiAtPlxuICAgICAgICB4bWwgPSBcIlwiXG4gICAgICAgIGZvciBuYW1lIGluIEBzbG90cygpXG4gICAgICAgICAgICB4bWwgKz0gXCI8cHJvcGVydHkgc2xvdD0nI3tuYW1lfSc+XCJcbiAgICAgICAgICAgIHNjYWxhciAgPSBAc2xvdChuYW1lKVxuICAgICAgICAgICAgaWYgQXJyYXkuaXNBcnJheShzY2FsYXIpXG4gICAgICAgICAgICAgICAgdHlwZSA9IFwiYXJyYXlcIlxuICAgICAgICAgICAgICAgIHhtbCArPSBcIjxzY2FsYXIgdHlwZT0nI3t0eXBlfSc+XCJcbiAgICAgICAgICAgICAgICB4bWwgKz0gXCI8bGlzdD5cIlxuICAgICAgICAgICAgICAgIGZvciBlIGluIHNjYWxhclxuICAgICAgICAgICAgICAgICAgICB0eXBlID0gdHlwZW9mIGVcbiAgICAgICAgICAgICAgICAgICAgeG1sICs9IFwiPHNjYWxhciB0eXBlPScje3R5cGV9Jz4je2V9PC9zY2FsYXI+XCJcbiAgICAgICAgICAgICAgICB4bWwgKz0gXCI8L2xpc3Q+XCJcbiAgICAgICAgICAgICAgICB4bWwgKz0gXCI8L3NjYWxhcj5cIlxuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIHR5cGUgPSB0eXBlb2Ygc2NhbGFyXG4gICAgICAgICAgICAgICAgeG1sICs9IFwiPHNjYWxhciB0eXBlPScje3R5cGV9Jz4je3NjYWxhci50b1N0cmluZygpfTwvc2NhbGFyPlwiXG4gICAgICAgICAgICB4bWwgKz0gJzwvcHJvcGVydHk+J1xuICAgICAgICB4bWxcblxuRCA9IChwcm9wcykgLT5cbiAgICByZXR1cm4gbmV3IERhdGEocHJvcHMpXG5cbmNsYXNzIFNpZ25hbCBleHRlbmRzIERhdGFcblxuICAgIGNvbnN0cnVjdG9yOiAobmFtZSwgcGF5bG9hZCwgcHJvcHMpIC0+XG4gICAgICAgIHByb3BzID0gcHJvcHMgfHwge31cbiAgICAgICAgcHJvcHMubmFtZSA9IG5hbWVcbiAgICAgICAgcHJvcHMucGF5bG9hZCA9IHBheWxvYWRcbiAgICAgICAgc3VwZXIocHJvcHMpXG5cbmNsYXNzIEV2ZW50IGV4dGVuZHMgU2lnbmFsXG5cbiAgICBjb25zdHJ1Y3RvcjogKG5hbWUsIHBheWxvYWQsIHByb3BzKSAtPlxuICAgICAgICBwcm9wcyA9IHByb3BzIHx8IHt9XG4gICAgICAgIHBvcHMudHMgPSBuZXcgRGF0ZSgpLmdldFRpbWUoKVxuICAgICAgICBzdXBlcihuYW1lLCBwYXlsb2FkLCBwcm9wcylcblxuY2xhc3MgR2xpdGNoIGV4dGVuZHMgRGF0YVxuXG4gICAgY29uc3RydWN0b3I6IChuYW1lLCBwcm9wcykgLT5cbiAgICAgICAgcHJvcHMgPSBwcm9wcyB8fCB7fVxuICAgICAgICBwcm9wcy5uYW1lID0gbmFtZVxuICAgICAgICBzdXBlcihwcm9wcylcblxuRyA9IChuYW1lLCBwcm9wcykgLT5cbiAgICByZXR1cm4gbmV3IEdsaXRjaChuYW1lLCBwcm9wcylcblxuY2xhc3MgVG9rZW4gZXh0ZW5kcyBEYXRhXG5cbiAgICBjb25zdHJ1Y3RvcjogKHZhbHVlLCBzaWduLCBwcm9wcykgIC0+XG4gICAgICAgIHN1cGVyKHByb3BzKVxuICAgICAgICBAc2lnbnMgPSBbXVxuICAgICAgICBAc3RhbXAoc2lnbiwgdmFsdWUpXG5cbiAgICBpczogKHQpIC0+XG4gICAgICAgIGZhbHNlXG5cbiAgICB2YWx1ZTogLT5cbiAgICAgICAgQHZhbHVlXG5cbiAgICBzdGFtcF9ieTogKGluZGV4KSAtPlxuICAgICAgICBpZiBpbmRleD9cbiAgICAgICAgICAgaWYgQHNpZ25zW2luZGV4XT9cbiAgICAgICAgICAgICAgIHJldHVybiBAc2lnbnNbaW5kZXhdXG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICByZXR1cm4gUyhcIk5vdEZvdW5kXCIpXG5cbiAgICAgICAgaWYgQHNpZ25zLmxlbmd0aCA+IDBcbiAgICAgICAgICAgcmV0dXJuIEBzaWduc1tAc2lnbnMubGVuZ3RoIC0gMV1cbiAgICAgICAgZWxzZVxuICAgICAgICAgICByZXR1cm4gUyhcIk5vdEZvdW5kXCIpXG5cbiAgICBzdGFtcDogKHNpZ24sIHZhbHVlKSAtPlxuICAgICAgICBpZiB2YWx1ZVxuICAgICAgICAgICAgaWYgQFt2YWx1ZV1cbiAgICAgICAgICAgICAgICBkZWxldGUgQFt2YWx1ZV1cbiAgICAgICAgICAgIEB2YWx1ZSA9IHZhbHVlXG4gICAgICAgICAgICBpZiB0eXBlb2YgQHZhbHVlIGlzIFwic3RyaW5nXCJcbiAgICAgICAgICAgICAgICBAW0B2YWx1ZV0gPSB0cnVlXG4gICAgICAgIGlmIHNpZ24/XG4gICAgICAgICAgICBAc2lnbnMucHVzaChzaWduKVxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBAc2lnbnMucHVzaChTKFwiVW5rbm93blwiKSlcblxuXG5zdGFydCA9IChzaWduLCBwcm9wcykgLT5cbiAgICByZXR1cm4gbmV3IFRva2VuKFwic3RhcnRcIiwgc2lnbiwgcHJvcHMpXG5cbnN0b3AgPSAoc2lnbiwgcHJvcHMpIC0+XG4gICAgcmV0dXJuIG5ldyBUb2tlbihcInN0b3BcIiwgc2lnbiwgcHJvcHMpXG5cblQgPSAodmFsdWUsIHNpZ24sIHByb3BzKSAtPlxuICAgIHJldHVybiBuZXcgVG9rZW4odmFsdWUsIHNpZ24sIHByb3BzKVxuXG5jbGFzcyBQYXJ0IGV4dGVuZHMgRGF0YVxuXG4gICAgY29uc3RydWN0b3I6IChAbmFtZSwgcHJvcHMpIC0+XG4gICAgICAgIHN1cGVyKHByb3BzKVxuXG4gICAgc2VyaWFsaXplOiAtPlxuICAgICAgICB4bWwgKz0gXCI8cGFydCBuYW1lPScje0BuYW1lfSc+XCJcbiAgICAgICAgeG1sICs9IHN1cGVyKClcbiAgICAgICAgeG1sICs9ICc8L3BhcnQ+J1xuXG5QID0gKG5hbWUsIHByb3BzKSAtPlxuICAgIHJldHVybiBuZXcgUGFydChuYW1lLCBwcm9wcylcblxuY2xhc3MgRW50aXR5IGV4dGVuZHMgRGF0YVxuXG4gICAgY29uc3RydWN0b3I6ICh0YWdzLCBwcm9wcykgLT5cbiAgICAgICAgQHBhcnRzID0gbmV3IE5hbWVTcGFjZShcInBhcnRzXCIpXG4gICAgICAgIHByb3BzID0gcHJvcHMgfHwge31cbiAgICAgICAgcHJvcHMuaWQgPSBwcm9wcy5pZCB8fCB1dWlkLnY0KClcbiAgICAgICAgdGFncyA9IHRhZ3MgfHwgcHJvcHMudGFncyB8fCBbXVxuICAgICAgICBwcm9wcy50YWdzID0gdGFnc1xuICAgICAgICBzdXBlcihwcm9wcylcblxuICAgIGFkZDogKHN5bWJvbCwgcGFydCkgLT5cbiAgICAgICAgQHBhcnRzLmJpbmQoc3ltYm9sLCBwYXJ0KVxuXG4gICAgcmVtb3ZlOiAobmFtZSkgLT5cbiAgICAgICAgQHBhcnRzLnVuYmluZChuYW1lKVxuXG4gICAgaGFzUGFydDogKG5hbWUpIC0+XG4gICAgICAgIEBwYXJ0cy5oYXMobmFtZSlcblxuICAgIHBhcnQ6IChuYW1lKSAtPlxuICAgICAgICBAcGFydHMuc3ltYm9sKG5hbWUpXG5cbiAgICBzZXJpYWxpemU6IC0+XG4gICAgICAgIHhtbCA9IFwiPGVudGl0eT5cIlxuICAgICAgICB4bWwgKz0gJzxwYXJ0cz4nXG4gICAgICAgIGZvciBwYXJ0IG9mIEBwYXJ0cy5vYmplY3RzKClcbiAgICAgICAgICAgIHhtbCArPSBwYXJ0LnNlcmlhbGl6ZSgpXG4gICAgICAgIHhtbCArPSAnPC9wYXJ0cz4nXG4gICAgICAgIHhtbCArPSBzdXBlcigpXG4gICAgICAgIHhtbCArPSAnPC9lbnRpdHk+J1xuXG5FID0gKHRhZ3MsIHByb3BzKSAtPlxuICAgIHJldHVybiBuZXcgRW50aXR5KHRhZ3MsIHByb3BzKVxuXG5jbGFzcyBDZWxsIGV4dGVuZHMgRW50aXR5XG5cbiAgICBjb25zdHJ1Y3RvcjogKHRhZ3MsIHByb3BzKSAtPlxuICAgICAgICBzdXBlcih0YWdzLCBwcm9wcylcbiAgICAgICAgQG9ic2VydmVycz0gbmV3IE5hbWVTcGFjZShcIm9ic2VydmVyc1wiKVxuXG4gICAgbm90aWZ5OiAoZXZlbnQpIC0+XG4gICAgICAgZm9yIG9iIGluIEBvYnNlcnZlcnMub2JqZWN0cygpXG4gICAgICAgICAgICBvYi5yYWlzZShldmVudClcblxuICAgIGFkZDogKHBhcnQpIC0+XG4gICAgICAgIHN1cGVyIHBhcnRcbiAgICAgICAgZXZlbnQgPSBuZXcgRXZlbnQoXCJwYXJ0LWFkZGVkXCIsIHtwYXJ0OiBwYXJ0LCBjZWxsOiB0aGlzfSlcbiAgICAgICAgQG5vdGlmeShldmVudClcblxuICAgIHJlbW92ZTogKG5hbWUpIC0+XG4gICAgICAgIHN1cGVyIG5hbWVcbiAgICAgICAgZXZlbnQgPSBuZXcgRXZlbnQoXCJwYXJ0LXJlbW92ZWRcIiwge3BhcnQ6IHBhcnQsIGNlbGw6IHRoaXN9KVxuICAgICAgICBAbm90aWZ5KGV2ZW50KVxuXG4gICAgb2JzZXJ2ZTogKHN5bWJvbCwgc3lzdGVtKSAtPlxuICAgICAgICBAb2JzZXJ2ZXJzLmJpbmQoc3ltYm9sLCBzeXN0ZW0pXG5cbiAgICBmb3JnZXQ6IChuYW1lKSAtPlxuICAgICAgICBAb2JzZXJ2ZXJzLnVuYmluZChuYW1lKVxuXG4gICAgc3RlcDogKGZuLCBhcmdzLi4uKSAtPlxuICAgICAgICByZXR1cm4gZm4uYXBwbHkodGhpcywgYXJncylcblxuICAgIGNsb25lOiAoKSAtPlxuICAgICAgICByZXR1cm4gY2xvbmUodGhpcylcblxuQyA9ICh0YWdzLCBwcm9wcykgLT5cbiAgICByZXR1cm4gbmV3IENlbGwodGFncywgcHJvcHMpXG5cbmNsYXNzIFN5c3RlbVxuXG4gICAgY29uc3RydWN0b3I6IChAYiwgQGNvbmYpIC0+XG4gICAgICAgIEBpbmxldHMgPSBuZXcgTmFtZVNwYWNlKFwiaW5sZXRzXCIpXG4gICAgICAgIEBpbmxldHMuYmluZChuZXcgU3ltYm9sKFwic3lzaW5cIiksW10pXG4gICAgICAgIEBpbmxldHMuYmluZChuZXcgU3ltYm9sKFwiZmVlZGJhY2tcIiksW10pXG4gICAgICAgIEBvdXRsZXRzID0gbmV3IE5hbWVTcGFjZShcIm91dGxldHNcIilcbiAgICAgICAgQG91dGxldHMuYmluZChuZXcgU3ltYm9sKFwic3lzb3V0XCIpLFtdKVxuICAgICAgICBAb3V0bGV0cy5iaW5kKG5ldyBTeW1ib2woXCJzeXNlcnJcIiksW10pXG5cbiAgICAgICAgQHN0YXRlID0gW11cbiAgICAgICAgQHIgPSB7fVxuXG4gICAgdG9wOiAoaW5kZXgpIC0+XG4gICAgICAgIGlmIGluZGV4P1xuICAgICAgICAgICAgaWYgQHN0YXRlW2luZGV4XT9cbiAgICAgICAgICAgICAgICByZXR1cm4gQHN0YXRlW2luZGV4XVxuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIHJldHVybiBTKFwiTm90Rm91bmRcIilcblxuICAgICAgICBpZiBAc3RhdGUubGVuZ3RoID4gMFxuICAgICAgICAgICAgcmV0dXJuIEBzdGF0ZVtAc3RhdGUubGVuZ3RoIC0gMV1cbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgcmV0dXJuIFMoXCJOb3RGb3VuZFwiKVxuXG4gICAgaW5wdXQ6IChkYXRhLCBpbmxldCkgLT5cbiAgICAgICAgZGF0YVxuXG4gICAgb3V0cHV0OiAoZGF0YSwgb3V0bGV0KSAtPlxuICAgICAgICBkYXRhXG5cbiAgICBTVE9QOiAoc3RvcF90b2tlbikgLT5cblxuICAgIHB1c2g6IChkYXRhLCBpbmxldF9uYW1lKSAtPlxuXG4gICAgICAgIGlubGV0X25hbWUgPSBpbmxldF9uYW1lIHx8IFwic3lzaW5cIlxuXG4gICAgICAgIGlucHV0X2RhdGEgPSBAaW5wdXQoZGF0YSwgaW5sZXRfbmFtZSlcblxuICAgICAgICBpZiBpbnB1dF9kYXRhIGluc3RhbmNlb2YgR2xpdGNoXG4gICAgICAgICAgICBAZXJyb3IoaW5wdXRfZGF0YSlcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgQHByb2Nlc3MgaW5wdXRfZGF0YSwgaW5sZXRfbmFtZVxuXG4gICAgZ290b193aXRoOiAoaW5sZXRfbmFtZSwgZGF0YSkgLT5cbiAgICAgICAgQHB1c2goZGF0YSwgaW5sZXRfbmFtZSlcblxuICAgIHByb2Nlc3M6IChkYXRhLCBpbmxldF9uYW1lKSAtPlxuICAgICAgICBAZW1pdChkYXRhLCBcInN0ZG91dFwiKVxuXG4gICAgc2VuZDogKGRhdGEsIG91dGxldF9uYW1lKSAtPlxuICAgICAgICBmb3Igb3V0bGV0IGluIEBvdXRsZXRzLnN5bWJvbHMoKVxuICAgICAgICAgICAgaWYgb3V0bGV0Lm5hbWUgPT0gb3V0bGV0X25hbWVcbiAgICAgICAgICAgICAgICBmb3IgY29ubmVjdGlvbiBpbiBvdXRsZXQub2JqZWN0XG4gICAgICAgICAgICAgICAgICAgIGNvbm5lY3Rpb24ub2JqZWN0LnRyYW5zbWl0IGRhdGFcblxuICAgIGVtaXQ6IChkYXRhLCBvdXRsZXRfbmFtZSkgLT5cbiAgICAgICAgb3V0bGV0X25hbWUgPSBvdXRsZXRfbmFtZSB8fCBcInN5c291dFwiXG5cbiAgICAgICAgb3V0cHV0X2RhdGEgPSBAb3V0cHV0KGRhdGEsIG91dGxldF9uYW1lKVxuXG4gICAgICAgIGlmIG91dHB1dF9kYXRhIGluc3RhbmNlb2YgR2xpdGNoXG4gICAgICAgICAgICBAZXJyb3Iob3V0cHV0X2RhdGEpXG4gICAgICAgICAgICByZXR1cm5cblxuICAgICAgICBAc2VuZChvdXRwdXRfZGF0YSwgb3V0bGV0X25hbWUpXG5cblxuICAgIGVycm9yOiAoZGF0YSkgLT5cbiAgICAgICAgQHNlbmQoZGF0YSwgXCJzeXNlcnJcIilcblxuICAgIHJhaXNlOiAoc2lnbmFsKSAtPlxuICAgICAgICBAcmVhY3Qoc2lnbmFsKVxuXG4gICAgcmVhY3Q6IChzaWduYWwpIC0+XG5cbiAgICBzaG93OiAoZGF0YSkgLT5cblxuXG5jbGFzcyBXaXJlXG5cbiAgICBjb25zdHJ1Y3RvcjogKEBvdXRsZXQsIEBpbmxldCkgLT5cblxuXG5jbGFzcyBDb25uZWN0aW9uXG5cbiAgICBjb25zdHJ1Y3RvcjogKEBzb3VyY2UsIEBzaW5rLCBAYiwgQHdpcmUpIC0+XG5cblxuICAgIHRyYW5zbWl0OiAoZGF0YSkgLT5cbiAgICAgICAgQHNpbmsub2JqZWN0LnB1c2goZGF0YSwgQHdpcmUuaW5sZXQubmFtZSlcblxuXG5jbGFzcyBTdG9yZVxuXG4gICAgY29uc3RydWN0b3I6IC0+XG4gICAgICAgIEBlbnRpdGllcyA9IG5ldyBOYW1lU3BhY2UoXCJlbnRpdGllc1wiKVxuXG4gICAgYWRkOiAoZW50aXR5KSAtPlxuICAgICAgICBzeW1ib2wgPSBTKGVudGl0eS5pZClcbiAgICAgICAgQGVudGl0aWVzLmJpbmQoc3ltYm9sLCBlbnRpdHkpXG4gICAgICAgIHN5bWJvbFxuXG4gICAgc25hcHNob3Q6ICgpIC0+XG4gICAgICAgIHhtbCA9ICc8P3htbCB2ZXJzaW9uID0gXCIxLjBcIiBzdGFuZGFsb25lPVwieWVzXCI/PidcbiAgICAgICAgeG1sICs9IFwiPHNuYXBzaG90PlwiXG4gICAgICAgIGZvciBlbnRpdHkgaW4gQGVudGl0aWVzLm9iamVjdHMoKVxuICAgICAgICAgICAgeG1sICs9IGVudGl0eS5zZXJpYWxpemUoKVxuICAgICAgICB4bWwgKz0gXCI8L3NuYXBzaG90PlwiXG4gICAgICAgIHJldHVybiB4bWxcblxuICAgIG9wOiAoZiwgYXJncy4uLikgLT5cbiAgICAgICAgcmV0dXJuIGYuYXBwbHkodGhpcywgYXJncylcblxuICAgIF9fcHJvY2Vzc19zY2FsYXI6IChzY2FsYXIpIC0+XG4gICAgICAgIHR5cGUgPSBzY2FsYXIuZ2V0QXR0cmlidXRlKFwidHlwZVwiKVxuICAgICAgICB0ZXh0ID0gc2NhbGFyLnRleHRDb250ZW50XG4gICAgICAgIGlmIHR5cGUgaXMgXCJudW1iZXJcIlxuICAgICAgICAgICAgdmFsdWUgPSBOdW1iZXIodGV4dClcbiAgICAgICAgZWxzZSBpZiB0eXBlIGlzIFwic3RyaW5nXCJcbiAgICAgICAgICAgIHZhbHVlID0gU3RyaW5nKHRleHQpXG4gICAgICAgIGVsc2UgaWYgdHlwZSBpcyBcImJvb2xlYW5cIlxuICAgICAgICAgICAgdmFsdWUgPSBCb29sZWFuKHRleHQpXG4gICAgICAgIGVsc2UgaWYgdHlwZSBpcyBcImFycmF5XCJcbiAgICAgICAgICAgIGxpc3Rfc2NhbGFycyA9IHhwYXRoLnNlbGVjdChcImxpc3Qvc2NhbGFyXCIsIHNjYWxhcilcbiAgICAgICAgICAgIHZhbHVlID0gW11cbiAgICAgICAgICAgIGZvciBlbCBpbiBsaXN0X3NjYWxhcnNcbiAgICAgICAgICAgICAgICBlbF90eXBlID0gZWwuZ2V0QXR0cmlidXRlKFwidHlwZVwiKVxuICAgICAgICAgICAgICAgIGVsX3RleHQgPSBlbC50ZXh0Q29udGVudFxuICAgICAgICAgICAgICAgIGlmIGVsX3R5cGUgaXMgXCJudW1iZXJcIlxuICAgICAgICAgICAgICAgICAgICBlbF92YWx1ZSA9IE51bWJlcihlbF90ZXh0KVxuICAgICAgICAgICAgICAgIGVsc2UgaWYgZWxfdHlwZSBpcyBcInN0cmluZ1wiXG4gICAgICAgICAgICAgICAgICAgIGVsX3ZhbHVlID0gU3RyaW5nKGVsX3RleHQpXG4gICAgICAgICAgICAgICAgZWxzZSBpZiBlbF90eXBlIGlzIFwiYm9vbGVhblwiXG4gICAgICAgICAgICAgICAgICAgIGVsX3ZhbHVlID0gQm9vbGVhbihlbF90ZXh0KVxuICAgICAgICAgICAgICAgIHZhbHVlLnB1c2goZWxfdmFsdWUpXG5cbiAgICAgICAgcmV0dXJuIHZhbHVlXG5cbiAgICBfX3Byb2Nlc3NfcHJvcDogKHByb3ApIC0+XG4gICAgICAgIGVudGl0eV9wcm9wID0ge31cbiAgICAgICAgc2xvdCA9IHByb3AuZ2V0QXR0cmlidXRlKFwic2xvdFwiKVxuICAgICAgICBzY2FsYXIgPSB4cGF0aC5zZWxlY3QoXCJzY2FsYXJcIiwgcHJvcCApXG4gICAgICAgIHZhbHVlID0gQF9fcHJvY2Vzc19zY2FsYXIoc2NhbGFyWzBdKVxuICAgICAgICBlbnRpdHlfcHJvcC5zbG90ID0gc2xvdFxuICAgICAgICBlbnRpdHlfcHJvcC52YWx1ZSA9IHZhbHVlXG4gICAgICAgIGVudGl0eV9wcm9wXG5cbiAgICByZWNvdmVyOiAoeG1sKSAtPlxuICAgICAgICBkb2MgPSBuZXcgZG9tKCkucGFyc2VGcm9tU3RyaW5nKHhtbClcbiAgICAgICAgZW50aXRpZXMgPSB4cGF0aC5zZWxlY3QoXCIvL2VudGl0eVwiLCBkb2MpXG4gICAgICAgIGVudGl0aWVzX2xpc3QgPSBbXVxuICAgICAgICBmb3IgZW50aXR5IGluIGVudGl0aWVzXG4gICAgICAgICAgICBlbnRpdHlfcHJvcHMgPSB7fVxuICAgICAgICAgICAgcHJvcHMgPSB4cGF0aC5zZWxlY3QoXCJwcm9wZXJ0eVwiLCBlbnRpdHkpXG4gICAgICAgICAgICBmb3IgcHJvcCBpbiBwcm9wc1xuICAgICAgICAgICAgICAgIGVudGl0eV9wcm9wID0gQF9fcHJvY2Vzc19wcm9wKHByb3ApXG4gICAgICAgICAgICAgICAgZW50aXR5X3Byb3BzW2VudGl0eV9wcm9wLnNsb3RdID0gZW50aXR5X3Byb3AudmFsdWVcblxuICAgICAgICAgICAgbmV3X2VudGl0eSA9IG5ldyBFbnRpdHkobnVsbCwgZW50aXR5X3Byb3BzKVxuXG4gICAgICAgICAgICBwYXJ0cyA9IHhwYXRoLnNlbGVjdChcInBhcnRcIiwgZW50aXR5KVxuICAgICAgICAgICAgZm9yIHBhcnQgaW4gcGFydHNcbiAgICAgICAgICAgICAgICBuYW1lID0gcGFydC5nZXRBdHRyaWJ1dGUoXCJuYW1lXCIpXG4gICAgICAgICAgICAgICAgcGFydF9wcm9wcyA9IHt9XG4gICAgICAgICAgICAgICAgcHJvcHMgPSB4cGF0aC5zZWxlY3QoXCJwcm9wZXJ0eVwiLCBwYXJ0KVxuICAgICAgICAgICAgICAgIGZvciBwcm9wIGluIHByb3BzXG4gICAgICAgICAgICAgICAgICAgIHBhcnRfcHJvcCA9IEBfX3Byb2Nlc3NfcHJvcChwcm9wKVxuICAgICAgICAgICAgICAgICAgICBwYXJ0X3Byb3BzW3BhcnRfcHJvcC5zbG90XSA9IHBhcnRfcHJvcC52YWx1ZVxuICAgICAgICAgICAgICAgIGVudGl0eV9wYXJ0ID0gbmV3IFBhcnQobmFtZSwgcGFydF9wcm9wcylcbiAgICAgICAgICAgICAgICBuZXdfZW50aXR5LmFkZChlbnRpdHlfcGFydClcblxuICAgICAgICAgICAgZW50aXRpZXNfbGlzdC5wdXNoKG5ld19lbnRpdHkpXG5cbiAgICAgICAgZm9yIGVudGl0eSBpbiBlbnRpdGllc19saXN0XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhlbnRpdHkpXG4gICAgICAgICAgICBAYWRkKGVudGl0eSlcblxuICAgIGhhczogKGlkKSAtPlxuICAgICAgICBAZW50aXRpZXMuaGFzKGlkKVxuXG4gICAgZW50aXR5OiAoaWQpIC0+XG4gICAgICAgIEBlbnRpdGllcy5vYmplY3QoaWQpXG5cbiAgICByZW1vdmU6IChpZCkgLT5cbiAgICAgICAgQGVudGl0aWVzLnVuYmluZChpZClcblxuICAgIGJ5X3Byb3A6IChwcm9wKSAtPlxuICAgICAgICBlbnRpdGllcyA9IFtdXG4gICAgICAgIGZvciBlbnRpdHkgaW4gQGVudGl0aWVzLm9iamVjdHMoKVxuICAgICAgICAgICAgaWYgZW50aXR5Lmhhcyhwcm9wLnNsb3QpXG4gICAgICAgICAgICAgICAgaWYgZW50aXR5LnNsb3QocHJvcC5zbG90KSBpcyBwcm9wLnZhbHVlXG4gICAgICAgICAgICAgICAgICAgIGVudGl0aWVzLnB1c2goZW50aXR5KVxuXG4gICAgICAgIGlmIGVudGl0aWVzLmxlbmd0aCA+IDBcbiAgICAgICAgICAgIHJldHVybiBlbnRpdGllc1xuICAgICAgICBlbHNlXG4gICAgICAgICAgICBHKFwiTm90Rm91bmRcIilcblxuICAgIGZpcnN0X2J5X3Byb3A6IChwcm9wKSAtPlxuICAgICAgICBlbnRpdGllcyA9IEBieV9wcm9wKHByb3ApXG4gICAgICAgIGlmIGVudGl0aWVzIGluc3RhbmNlb2YgR2xpdGNoXG4gICAgICAgICAgICByZXR1cm4gZW50aXRpZXNcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgZW50aXRpZXNbMF1cblxuICAgIGJ5X3RhZ3M6ICh0YWdzKSAtPlxuICAgICAgICBlbnRpdGllcyA9IFtdXG4gICAgICAgIGZvciBlbnRpdHkgaW4gQGVudGl0aWVzLm9iamVjdHMoKVxuICAgICAgICAgICAgZm9yIHRhZyBpbiB0YWdzXG4gICAgICAgICAgICAgICAgaWYgdGFnIGluIGVudGl0eS50YWdzXG4gICAgICAgICAgICAgICAgICAgIGVudGl0aWVzLnB1c2ggZW50aXR5XG5cbiAgICAgICAgaWYgZW50aXRpZXMubGVuZ3RoID4gMFxuICAgICAgICAgICAgcmV0dXJuIGVudGl0aWVzXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIEcoXCJOb3RGb3VuZFwiKVxuXG4gICAgZmlyc3RfYnlfdGFnczogKHRhZ3MpIC0+XG4gICAgICAgIGVudGl0aWVzID0gQGJ5X3RhZ3ModGFncylcbiAgICAgICAgaWYgZW50aXRpZXMgaW5zdGFuY2VvZiBHbGl0Y2hcbiAgICAgICAgICAgIHJldHVybiBlbnRpdGllc1xuICAgICAgICBlbHNlXG4gICAgICAgICAgICBlbnRpdGllc1swXVxuXG5jbGFzcyBCdXMgZXh0ZW5kcyBOYW1lU3BhY2VcblxuICAgIGNvbnN0cnVjdG9yOiAoQG5hbWUsIHNlcCkgLT5cbiAgICAgICAgc3VwZXIoQG5hbWUsIHNlcClcblxuICAgIHRyaWdnZXI6IChzaWduYWwpIC0+XG4gICAgICAgIGZvciBvYmogaW4gQG9iamVjdHMoKVxuICAgICAgICAgICAgaWYgb2JqIGluc3RhbmNlb2YgU3lzdGVtXG4gICAgICAgICAgICAgICAgb2JqLnJhaXNlKHNpZ25hbClcblxuY2xhc3MgQm9hcmRcblxuICAgIGNvbnN0cnVjdG9yOiAobmFtZSwgY29ubmVjdGlvbkNsYXNzLCBzdG9yZUNsYXNzLCBidXNDbGFzcykgLT5cbiAgICAgICAgc3RvcmVDbGFzcyA9IHN0b3JlQ2xhc3MgfHwgU3RvcmVcbiAgICAgICAgYnVzQ2xhc3MgPSBidXNDbGFzcyB8fCBCdXNcblxuICAgICAgICBAY29ubmVjdGlvbkNsYXNzID0gY29ubmVjdGlvbkNsYXNzIHx8IENvbm5lY3Rpb25cbiAgICAgICAgQHN0b3JlID0gbmV3IHN0b3JlQ2xhc3MoKVxuICAgICAgICBAY29ubmVjdGlvbnMgPSBuZXcgTmFtZVNwYWNlKFwiYnVzLmNvbm5lY3Rpb25zXCIpXG5cbiAgICAgICAgQGJ1cyA9IG5ldyBidXNDbGFzcyhcInN5c3RlbXNcIilcbiAgICAgICAgQHN5c3RlbXMgPSBAYnVzXG4gICAgICAgIEBidXMuYmluZChTKFwiY29ubmVjdGlvbnNcIiksICBAY29ubmVjdGlvbnMpXG4gICAgICAgIEBidXMuYmluZChTKFwic3RvcmVcIiksIEBzdG9yZSlcblxuICAgIGNvbm5lY3Q6IChzb3VyY2UsIHNpbmssIHdpcmUsIHN5bWJvbCkgLT5cbiAgICAgICAgc291cmNlID0gQHN5c3RlbXMuc3ltYm9sKHNvdXJjZSlcbiAgICAgICAgc2luayA9IEBzeXN0ZW1zLnN5bWJvbChzaW5rKVxuICAgICAgICB3aXJlID0gd2lyZSB8fCBuZXcgV2lyZShzb3VyY2Uub2JqZWN0Lm91dGxldHMuc3ltYm9sKFwic3lzb3V0XCIpLCBzaW5rLm9iamVjdC5pbmxldHMuc3ltYm9sKFwic3lzaW5cIikpXG4gICAgICAgIGNvbm5lY3Rpb24gPSBuZXcgQGNvbm5lY3Rpb25DbGFzcyhzb3VyY2UsIHNpbmssIHRoaXMsIHdpcmUpXG4gICAgICAgIGlmICFzeW1ib2xcbiAgICAgICAgICAgIG5hbWUgPSBcIiN7c291cmNlfTo6I3tjb25uZWN0aW9uLndpcmUub3V0bGV0Lm5hbWV9LSN7c2lua306OiN7Y29ubmVjdGlvbi53aXJlLmlubGV0Lm5hbWV9XCJcbiAgICAgICAgICAgIHN5bWJvbCA9IG5ldyBTeW1ib2wobmFtZSlcbiAgICAgICAgQGNvbm5lY3Rpb25zLmJpbmQoc3ltYm9sLCBjb25uZWN0aW9uKVxuXG4gICAgICAgIGZvciBvdXRsZXQgaW4gY29ubmVjdGlvbi5zb3VyY2Uub2JqZWN0Lm91dGxldHMuc3ltYm9scygpXG4gICAgICAgICAgICBpZiBvdXRsZXQubmFtZSBpcyBjb25uZWN0aW9uLndpcmUub3V0bGV0Lm5hbWVcbiAgICAgICAgICAgICAgICBvdXRsZXQub2JqZWN0LnB1c2goc3ltYm9sKVxuXG4gICAgcGlwZTogKHNvdXJjZSwgd2lyZSwgc2luaykgLT5cbiAgICAgICAgQGNvbm5lY3Qoc291cmNlLCBzaW5rLCB3aXJlKVxuXG4gICAgZGlzY29ubmVjdDogKG5hbWUpIC0+XG4gICAgICAgIGNvbm5lY3Rpb24gPSBAY29ubmVjdGlvbihuYW1lKVxuICAgICAgICBAY29ubmVjdGlvbnMudW5iaW5kKG5hbWUpXG5cbiAgICAgICAgZm9yIG91dGxldCBpbiBjb25uZWN0aW9uLnNvdXJjZS5vYmplY3Qub3V0bGV0cy5zeW1ib2xzKClcbiAgICAgICAgICAgIGlmIG91dGxldC5uYW1lIGlzIGNvbm5lY3Rpb24ud2lyZS5vdXRsZXQubmFtZVxuICAgICAgICAgICAgICAgIGNvbm5lY3Rpb25zID0gW11cbiAgICAgICAgICAgICAgICBmb3IgY29ubiBpbiBvdXRsZXQub2JqZWN0XG4gICAgICAgICAgICAgICAgICAgIGlmIGNvbm4ubmFtZSAhPSBuYW1lXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25uZWN0aW9ucy5wdXNoKGNvbm4pXG4gICAgICAgICAgICAgICAgb3V0bGV0Lm9iamVjdCA9IGNvbm5lY3Rpb25zXG5cblxuICAgIGNvbm5lY3Rpb246IChuYW1lKSAtPlxuICAgICAgICBAY29ubmVjdGlvbnMub2JqZWN0KG5hbWUpXG5cbiAgICBoYXNDb25uZWN0aW9uOiAobmFtZSkgLT5cbiAgICAgICAgQGNvbm5lY3Rpb25zLmhhcyhuYW1lKVxuXG4gICAgYWRkOiAoc3ltYm9sLCBzeXN0ZW1DbGFzcywgY29uZikgLT5cbiAgICAgICAgc3lzdGVtID0gbmV3IHN5c3RlbUNsYXNzKHRoaXMsIGNvbmYpXG4gICAgICAgIEBidXMuYmluZChzeW1ib2wsIHN5c3RlbSlcblxuICAgIGhhczogKG5hbWUpIC0+XG4gICAgICAgIEBidXMuaGFzKG5hbWUpXG5cbiAgICBzeXN0ZW06IChuYW1lKSAtPlxuICAgICAgICBAYnVzLm9iamVjdChuYW1lKVxuXG4gICAgcmVtb3ZlOiAobmFtZSkgLT5cbiAgICAgICAgc3lzdGVtID0gQGJ1cy5vYmplY3QobmFtZSlcbiAgICAgICAgc3lzdGVtLnB1c2goQFNUT1ApXG4gICAgICAgIEBidXMudW5iaW5kKG5hbWUpXG5cbmV4cG9ydHMuU3ltYm9sID0gU3ltYm9sXG5leHBvcnRzLk5hbWVTcGFjZSA9IE5hbWVTcGFjZVxuZXhwb3J0cy5TID0gU1xuZXhwb3J0cy5EYXRhID0gRGF0YVxuZXhwb3J0cy5EID0gRFxuZXhwb3J0cy5TaWduYWwgPSBTaWduYWxcbmV4cG9ydHMuRXZlbnQgPSBFdmVudFxuZXhwb3J0cy5HbGl0Y2ggPSBHbGl0Y2hcbmV4cG9ydHMuRyA9IEdcbmV4cG9ydHMuVG9rZW4gPSBUb2tlblxuZXhwb3J0cy5zdGFydCA9IHN0YXJ0XG5leHBvcnRzLnN0b3AgPSBzdG9wXG5leHBvcnRzLlQgPSBUXG5leHBvcnRzLlBhcnQgPSBQYXJ0XG5leHBvcnRzLlAgPSBQXG5leHBvcnRzLkVudGl0eSA9IEVudGl0eVxuZXhwb3J0cy5FID0gRVxuZXhwb3J0cy5DZWxsID0gQ2VsbFxuZXhwb3J0cy5DID0gQ1xuZXhwb3J0cy5TeXN0ZW0gPSBTeXN0ZW1cbmV4cG9ydHMuV2lyZSA9IFdpcmVcbmV4cG9ydHMuQ29ubmVjdGlvbiA9IENvbm5lY3Rpb25cbmV4cG9ydHMuU3RvcmUgPSBTdG9yZVxuZXhwb3J0cy5CdXMgPSBCdXNcbmV4cG9ydHMuQm9hcmQgPSBCb2FyZFxuZXhwb3J0cy5taXhpbnMgPSBtaXhpbnNcblxuIl0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9