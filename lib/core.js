var Board, Bus, C, Cell, D, Data, E, Entity, Event, G, Glitch, Mirror, NameSpace, P, Part, S, Signal, Store, Symbol, System, T, Token, Wire, clone, dom, dom2prop, lodash, start, stop, uuid, xpath,
  __slice = [].slice,
  __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; },
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

uuid = require("node-uuid");

lodash = require("lodash");

clone = require("clone");

xpath = require("xpath");

dom = require("xmldom").DOMParser;

dom2prop = require("./helpers").dom2prop;

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
    if (v != null) {
      this[k] = v;
      return this[k];
    } else {
      return this[k];
    }
  };

  Symbol.prototype.op = function() {
    var args, f;
    f = arguments[0], args = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
    return f.apply(this, args);
  };

  Symbol.prototype.has = function(k) {
    if (this[k] != null) {
      return true;
    } else {
      return false;
    }
  };

  Symbol.prototype.del = function(k) {
    if (this.has(k)) {
      return delete this[k];
    }
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
    this.__gensym = 0;
  }

  NameSpace.prototype.bind = function(symbol, object, class_name) {
    var name;
    symbol["class"] = class_name || object.constructor.name;
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
    symbol.object = void 0;
    return symbol["class"] = void 0;
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

  NameSpace.prototype.gensym = function(prefix) {
    prefix = prefix || "gensym";
    return prefix + ":" + (this.__gensym++);
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
      if (data.slot(name) !== this.slot(name)) {
        return false;
      }
    }
    return true;
  };

  Data.prototype.prop = function(k, v) {
    return this.slot(k, v);
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
    if (name != null) {
      return this.__slots.push(name);
    } else {
      return this.__slots;
    }
  };

  Data.prototype.slot = function(name, value) {
    if (value != null) {
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

  Data.prototype.del = function(name) {
    var n, slots_old, _i, _len;
    if (this.has(name)) {
      slots_old = this.__slots;
      this.__slots = [];
      for (_i = 0, _len = slots_old.length; _i < _len; _i++) {
        n = slots_old[_i];
        if (n !== name) {
          this.__slots.push(n);
        }
      }
      return delete this[name];
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

  Data.prototype.__serialize_scalar = function(scalar) {
    var e, type, xml, _i, _len;
    xml = "";
    if (Array.isArray(scalar)) {
      type = "array";
      xml += "<scalar type='" + type + "'>";
      xml += "<list>";
      for (_i = 0, _len = scalar.length; _i < _len; _i++) {
        e = scalar[_i];
        xml += this.__serialize_scalar(e);
      }
      xml += "</list>";
      xml += "</scalar>";
    } else {
      type = typeof scalar;
      if (type === "boolean" || type === "number" || type === "string" || type === "Symbol") {
        xml += "<scalar type='" + type + "'>" + (scalar.toString()) + "</scalar>";
      }
    }
    return xml;
  };

  Data.prototype.init = function(xml) {
    var data_prop, doc, prop, props, _i, _len, _results;
    doc = new dom().parseFromString(xml);
    props = xpath.select("property", doc);
    _results = [];
    for (_i = 0, _len = props.length; _i < _len; _i++) {
      prop = props[_i];
      data_prop = dom2prop(prop);
      _results.push(this.prop(data_prop.slot, data_prop.value));
    }
    return _results;
  };

  Data.prototype.serialize = function(to) {
    var name, scalar, xml, _i, _len, _ref;
    xml = "";
    _ref = this.slots();
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      name = _ref[_i];
      xml += "<property slot='" + name + "'>";
      scalar = this.slot(name);
      xml += this.__serialize_scalar(scalar);
      xml += '</property>';
    }
    return xml;
  };

  Data.prototype.toString = function() {};

  return Data;

})();

D = function(props) {
  return new Data(props);
};

Signal = (function(_super) {
  __extends(Signal, _super);

  function Signal(route, payload, props) {
    props = props || {};
    props.route = route;
    props.payload = payload;
    Signal.__super__.constructor.call(this, props);
  }

  return Signal;

})(Data);

Event = (function(_super) {
  __extends(Event, _super);

  function Event(route, payload, props) {
    props = props || {};
    pops.ts = new Date().getTime();
    Event.__super__.constructor.call(this, route, payload, props);
  }

  return Event;

})(Signal);

Glitch = (function(_super) {
  __extends(Glitch, _super);

  function Glitch(name, context, props) {
    props = props || {};
    props.name = name;
    props.contenxt = context;
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
    this.values = [];
    if (value != null) {
      this.stamp(sign, value);
    }
  }

  Token.prototype.is = function(t) {
    return false;
  };

  Token.prototype.value = function() {
    return this.prop("value");
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
    var old_value;
    if (value != null) {
      if (this.has("value")) {
        old_value = this.prop("value");
        this.del("value");
        this.del(value);
      }
      this.prop("value", value);
      if (typeof value === "string") {
        this.prop(value, true);
      }
      this.values.push(value);
    }
    if (sign) {
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

  Part.prototype.serialize = function(to) {
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
    props.ts = props.ts || new Date().getTime();
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

  Entity.prototype.serialize = function(to) {
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
      _results.push(ob.interrupt(event));
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
    this.inlets = new NameSpace("inlets");
    this.inlets.bind(new Symbol("sysin"), []);
    this.inlets.bind(new Symbol("feedback"), []);
    this.outlets = new NameSpace("outlets");
    this.outlets.bind(new Symbol("sysout"), []);
    this.outlets.bind(new Symbol("syserr"), []);
    this.outlets.bind(new Symbol("debug"), []);
    this.conf = conf || D();
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

  System.prototype.push = function(data, inlet) {
    var input_data;
    this.b.mirror.relay("push", this.symbol.name, data, inlet);
    inlet = inlet || this.inlets.symbol("sysin");
    input_data = this.input(data, inlet);
    if (input_data instanceof Glitch) {
      return this.error(input_data);
    } else {
      return this.process(input_data, inlet);
    }
  };

  System.prototype.goto_with = function(inlet, data) {
    return this.push(data, inlet);
  };

  System.prototype.process = function(data, inlet) {};

  System.prototype.dispatch = function(data, outlet) {
    var ol, wire, _i, _len, _ref, _results;
    _ref = this.outlets.symbols();
    _results = [];
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      ol = _ref[_i];
      if (ol.name === outlet.name) {
        _results.push((function() {
          var _j, _len1, _ref1, _results1;
          _ref1 = ol.object;
          _results1 = [];
          for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
            wire = _ref1[_j];
            _results1.push(wire.object.transmit(data));
          }
          return _results1;
        })());
      } else {
        _results.push(void 0);
      }
    }
    return _results;
  };

  System.prototype.emit = function(data, outlet) {
    var output_data;
    outlet = outlet || this.outlets.symbol("sysout");
    output_data = this.output(data, outlet);
    if (output_data instanceof Glitch) {
      this.error(output_data);
      return;
    }
    return this.dispatch(output_data, outlet);
  };

  System.prototype.debug = function(data) {
    return this.dispatch(data, this.outlets.symbol("debug"));
  };

  System.prototype.error = function(data) {
    return this.dispatch(data, this.outlets.symbol("syserr"));
  };

  System.prototype.interrupt = function(signal) {
    this.b.mirror.relay("interrupt", this.symbol.name, signal);
    return this.react(signal);
  };

  System.prototype.react = function(signal) {};

  System.prototype.show = function(data) {};

  System.prototype.serialize = function(to) {
    var xml;
    xml = "<system name='" + this.symbol.name + "' class='" + this.symbol["class"] + "'>";
    xml += "<configuration>";
    xml += this.conf.serialize();
    xml += "</configuration>";
    xml += "</system>";
    return xml;
  };

  return System;

})();

Wire = (function() {
  function Wire(b, source, sink, outlet, inlet) {
    this.b = b;
    outlet = outlet || "sysout";
    inlet = inlet || "sysin";
    this.source = this.b.systems.symbol(source);
    this.sink = this.b.systems.symbol(sink);
    this.outlet = this.source.object.outlets.symbol(outlet);
    this.inlet = this.sink.object.inlets.symbol(inlet);
  }

  Wire.prototype.transmit = function(data) {
    return this.sink.object.push(data, this.inlet);
  };

  Wire.prototype.serialize = function() {
    var xml;
    xml = "";
    xml += "<wire name='" + this.symbol.name + "'>";
    xml += "<source name='" + this.source.name + "'/>";
    xml += "<outlet name='" + this.outlet.name + "'/>";
    xml += "<sink name='" + this.sink.name + "'/>";
    xml += "<inlet name='" + this.inlet.name + "'/>";
    xml += "</wire>";
    return xml;
  };

  return Wire;

})();

Store = (function() {
  function Store() {
    this.entities = new NameSpace("entities");
  }

  Store.prototype.add = function(entity, symbol) {
    var name;
    if (!symbol) {
      name = this.entities.gensym("entity");
      symbol = new Symbol(name);
    }
    this.entities.bind(symbol, entity);
    return entity;
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
        entity_prop = dom2prop(prop);
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
          part_prop = dom2prop(prop);
          part_props[part_prop.slot] = part_prop.value;
        }
        entity_part = new Part(name, part_props);
        new_entity.add(entity_part);
      }
      entities_list.push(new_entity);
    }
    this.entities = new NameSpace("entities");
    _results = [];
    for (_m = 0, _len4 = entities_list.length; _m < _len4; _m++) {
      entity = entities_list[_m];
      _results.push(this.add(entity));
    }
    return _results;
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

  Store.prototype.by_prop = function(prop) {
    var entities, entity, entity_value, _i, _len, _ref, _ref1;
    entities = [];
    _ref = this.entities.objects();
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      entity = _ref[_i];
      if (entity.has(prop.slot)) {
        entity_value = entity.slot(prop.slot);
        if (Array.isArray(entity_value)) {
          if (_ref1 = prop.value, __indexOf.call(entity_value, _ref1) >= 0) {
            entities.push(entity);
          }
        } else if (entity_value === prop.value) {
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

  Bus.prototype.trigger = function(signal, broadcast) {
    var interrupts, sym, _i, _j, _len, _len1, _ref, _ref1;
    broadcast = broadcast || false;
    interrupts = 0;
    if (broadcast === false) {
      _ref = this.symbols();
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        sym = _ref[_i];
        if (sym.object instanceof System) {
          if (sym.has("route")) {
            if (sym.attr("route") === signal.route) {
              sym.object.interrupt(signal);
              interrupts++;
            }
          }
        }
      }
    } else if (interrupts === 0 || broadcast === "true") {
      _ref1 = this.symbols();
      for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
        sym = _ref1[_j];
        if (sym.object instanceof System) {
          sym.object.interrupt(signal);
          interrupts++;
        }
      }
    }
    return interrupts;
  };

  return Bus;

})(NameSpace);

Mirror = (function() {
  function Mirror(b) {
    this.b = b;
  }

  Mirror.prototype.reflect = function() {
    var args, op, sys, system;
    op = arguments[0], system = arguments[1], args = 3 <= arguments.length ? __slice.call(arguments, 2) : [];
    sys = this.b.systems.object(system);
    return sys[op].apply(sys, args);
  };

  Mirror.prototype.relay = function() {
    var args, op, system;
    op = arguments[0], system = arguments[1], args = 3 <= arguments.length ? __slice.call(arguments, 2) : [];
  };

  return Mirror;

})();

Board = (function() {
  function Board(wireClass, busClass, storeClass, mirrorClass) {
    this.wireClass = wireClass || Wire;
    this.busClass = busClass || Bus;
    this.storeClass = storeClass || Store;
    this.mirrorClass = mirrorClass || Mirror;
    this.init();
  }

  Board.prototype.init = function() {
    this.bus = new this.busClass("bus");
    this.store = new this.storeClass();
    this.mirror = new this.mirrorClass(this);
    this.systems = this.bus;
    this.wires = new NameSpace("wires");
    this.bus.bind(S("store"), this.store);
    return this.bus.bind(S("wires"), this.wires);
  };

  Board.prototype.setup = function(xml, clone) {
    var board, board_name, board_new, bus_class, conf_node, conn, data_prop, data_props, doc, inlet_name, klass, name, outlet_name, prop, props, sink_name, source_name, store_class, sys, syss, wire, wire_class, wires, _i, _j, _k, _l, _len, _len1, _len2, _len3, _len4, _m, _ref, _ref1, _ref2;
    if (xml != null) {
      doc = new dom().parseFromString(xml);
      board = xpath.select("board", doc)[0];
      board_name = board.getAttribute("name");
      bus_class = xpath.select("Bus", board)[0].getAttribute("class");
      store_class = xpath.select("Store", board)[0].getAttribute("class");
      wire_class = xpath.select("Wire", board)[0].getAttribute("class");
      if (clone != null) {
        board_new = new Board(board_name, global[wire_class], global[bus_class], global[store_class]);
      } else {
        board_new = this;
        board_new.init();
      }
      syss = xpath.select("system", board);
      for (_i = 0, _len = syss.length; _i < _len; _i++) {
        sys = syss[_i];
        name = sys.getAttribute("name");
        klass = sys.getAttribute("class");
        conf_node = xpath.select("configuration", sys)[0];
        data_props = {};
        props = xpath.select("//property", conf_node);
        for (_j = 0, _len1 = props.length; _j < _len1; _j++) {
          prop = props[_j];
          data_prop = dom2prop(prop);
          data_props[data_prop.slot] = data_prop.value;
        }
        board_new.add(S(name), global[klass], D(data_props));
      }
      wires = xpath.select("//wire", board);
      for (_k = 0, _len2 = wires.length; _k < _len2; _k++) {
        wire = wires[_k];
        source_name = xpath.select("source", wire)[0].getAttribute("name");
        outlet_name = xpath.select("outlet", wire)[0].getAttribute("name");
        sink_name = xpath.select("sink", wire)[0].getAttribute("name");
        inlet_name = xpath.select("inlet", wire)[0].getAttribute("name");
        board_new.connect(source_name, sink_name, outlet_name, inlet_name);
      }
      return board_new;
    } else {
      xml = '<?xml version = "1.0" standalone="yes"?>';
      if (this.symbol != null) {
        board_name = this.symbol.name;
      } else {
        board_name = "b";
      }
      xml += "<board name='" + board_name + "'>";
      xml += "<Bus class='" + this.bus.constructor.name + "'/>";
      xml += "<Store class='" + this.store.constructor.name + "'/>";
      xml += "<Wire class='" + this.wireClass.name + "'/>";
      _ref = this.systems.symbols();
      for (_l = 0, _len3 = _ref.length; _l < _len3; _l++) {
        sys = _ref[_l];
        if ((_ref1 = sys.name) !== "wires" && _ref1 !== "store") {
          xml += sys.object.serialize();
        }
      }
      _ref2 = this.wires.symbols();
      for (_m = 0, _len4 = _ref2.length; _m < _len4; _m++) {
        conn = _ref2[_m];
        xml += conn.object.serialize();
      }
      return xml += "</board>";
    }
  };

  Board.prototype.connect = function(source, sink, outlet, inlet, symbol) {
    var name, source_outlet, wire, _i, _len, _ref, _results;
    wire = new this.wireClass(this, source, sink, outlet, inlet);
    if (!symbol) {
      name = this.bus.gensym("wire");
      symbol = new Symbol(name);
    }
    this.wires.bind(symbol, wire);
    _ref = wire.source.object.outlets.symbols();
    _results = [];
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      source_outlet = _ref[_i];
      if (source_outlet.name === wire.outlet.name) {
        _results.push(source_outlet.object.push(symbol));
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
    var conn, outlet, wire, wires, _i, _j, _len, _len1, _ref, _ref1, _results;
    wire = this.wire(name);
    this.wires.unbind(name);
    _ref = wire.source.object.outlets.symbols();
    _results = [];
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      outlet = _ref[_i];
      if (outlet.name === wire.outlet.name) {
        wires = [];
        _ref1 = outlet.object;
        for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
          conn = _ref1[_j];
          if (conn.name !== name) {
            wires.push(conn);
          }
        }
        _results.push(outlet.object = wires);
      } else {
        _results.push(void 0);
      }
    }
    return _results;
  };

  Board.prototype.wire = function(name) {
    return this.wires.object(name);
  };

  Board.prototype.haswire = function(name) {
    return this.wires.has(name);
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

exports.Store = Store;

exports.Bus = Bus;

exports.Mirror = Mirror;

exports.Board = Board;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29yZS5qcyIsInNvdXJjZXMiOlsiY29yZS5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsSUFBQSwrTEFBQTtFQUFBOzs7aVNBQUE7O0FBQUEsSUFBQSxHQUFPLE9BQUEsQ0FBUSxXQUFSLENBQVAsQ0FBQTs7QUFBQSxNQUNBLEdBQVMsT0FBQSxDQUFRLFFBQVIsQ0FEVCxDQUFBOztBQUFBLEtBRUEsR0FBUSxPQUFBLENBQVEsT0FBUixDQUZSLENBQUE7O0FBQUEsS0FHQSxHQUFRLE9BQUEsQ0FBUSxPQUFSLENBSFIsQ0FBQTs7QUFBQSxHQUlBLEdBQU0sT0FBQSxDQUFRLFFBQVIsQ0FBaUIsQ0FBQyxTQUp4QixDQUFBOztBQUFBLFFBS0EsR0FBVyxPQUFBLENBQVEsV0FBUixDQUFvQixDQUFDLFFBTGhDLENBQUE7O0FBQUE7QUFTaUIsRUFBQSxnQkFBRSxJQUFGLEVBQVMsTUFBVCxFQUFrQixFQUFsQixFQUFzQixLQUF0QixHQUFBO0FBQ1QsSUFEVSxJQUFDLENBQUEsT0FBQSxJQUNYLENBQUE7QUFBQSxJQURpQixJQUFDLENBQUEsU0FBQSxNQUNsQixDQUFBO0FBQUEsSUFEMEIsSUFBQyxDQUFBLEtBQUEsRUFDM0IsQ0FBQTtBQUFBLElBQUEsSUFBRyxhQUFIO0FBQ0ksTUFBQSxJQUFDLENBQUEsS0FBRCxDQUFPLEtBQVAsQ0FBQSxDQURKO0tBRFM7RUFBQSxDQUFiOztBQUFBLG1CQUlBLElBQUEsR0FBTSxTQUFDLENBQUQsRUFBSSxDQUFKLEdBQUE7QUFDRixJQUFBLElBQUcsU0FBSDtBQUNJLE1BQUEsSUFBRSxDQUFBLENBQUEsQ0FBRixHQUFPLENBQVAsQ0FBQTthQUNBLElBQUUsQ0FBQSxDQUFBLEVBRk47S0FBQSxNQUFBO2FBSUksSUFBRSxDQUFBLENBQUEsRUFKTjtLQURFO0VBQUEsQ0FKTixDQUFBOztBQUFBLG1CQVdBLEVBQUEsR0FBSSxTQUFBLEdBQUE7QUFDQSxRQUFBLE9BQUE7QUFBQSxJQURDLGtCQUFHLDhEQUNKLENBQUE7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QXd3Qk8sQ0FBQyxNQUFSLEdBQWlCLE1BeHdCakIsQ0FBQTs7QUFBQSxPQXl3Qk8sQ0FBQyxLQUFSLEdBQWdCLEtBendCaEIsQ0FBQTs7QUFBQSxPQTB3Qk8sQ0FBQyxNQUFSLEdBQWlCLE1BMXdCakIsQ0FBQTs7QUFBQSxPQTJ3Qk8sQ0FBQyxDQUFSLEdBQVksQ0Ezd0JaLENBQUE7O0FBQUEsT0E0d0JPLENBQUMsS0FBUixHQUFnQixLQTV3QmhCLENBQUE7O0FBQUEsT0E2d0JPLENBQUMsS0FBUixHQUFnQixLQTd3QmhCLENBQUE7O0FBQUEsT0E4d0JPLENBQUMsSUFBUixHQUFlLElBOXdCZixDQUFBOztBQUFBLE9BK3dCTyxDQUFDLENBQVIsR0FBWSxDQS93QlosQ0FBQTs7QUFBQSxPQWd4Qk8sQ0FBQyxJQUFSLEdBQWUsSUFoeEJmLENBQUE7O0FBQUEsT0FpeEJPLENBQUMsQ0FBUixHQUFZLENBanhCWixDQUFBOztBQUFBLE9Ba3hCTyxDQUFDLE1BQVIsR0FBaUIsTUFseEJqQixDQUFBOztBQUFBLE9BbXhCTyxDQUFDLENBQVIsR0FBWSxDQW54QlosQ0FBQTs7QUFBQSxPQW94Qk8sQ0FBQyxJQUFSLEdBQWUsSUFweEJmLENBQUE7O0FBQUEsT0FxeEJPLENBQUMsQ0FBUixHQUFZLENBcnhCWixDQUFBOztBQUFBLE9Bc3hCTyxDQUFDLE1BQVIsR0FBaUIsTUF0eEJqQixDQUFBOztBQUFBLE9BdXhCTyxDQUFDLElBQVIsR0FBZSxJQXZ4QmYsQ0FBQTs7QUFBQSxPQXd4Qk8sQ0FBQyxLQUFSLEdBQWdCLEtBeHhCaEIsQ0FBQTs7QUFBQSxPQXl4Qk8sQ0FBQyxHQUFSLEdBQWMsR0F6eEJkLENBQUE7O0FBQUEsT0EweEJPLENBQUMsTUFBUixHQUFpQixNQTF4QmpCLENBQUE7O0FBQUEsT0EyeEJPLENBQUMsS0FBUixHQUFnQixLQTN4QmhCLENBQUEiLCJzb3VyY2VzQ29udGVudCI6WyJ1dWlkID0gcmVxdWlyZSBcIm5vZGUtdXVpZFwiIFxubG9kYXNoID0gcmVxdWlyZSBcImxvZGFzaFwiXG5jbG9uZSA9IHJlcXVpcmUgXCJjbG9uZVwiXG54cGF0aCA9IHJlcXVpcmUgXCJ4cGF0aFwiXG5kb20gPSByZXF1aXJlKFwieG1sZG9tXCIpLkRPTVBhcnNlclxuZG9tMnByb3AgPSByZXF1aXJlKFwiLi9oZWxwZXJzXCIpLmRvbTJwcm9wXG5cbmNsYXNzIFN5bWJvbFxuXG4gICAgY29uc3RydWN0b3I6IChAbmFtZSwgQG9iamVjdCwgQG5zLCBhdHRycykgLT5cbiAgICAgICAgaWYgYXR0cnM/XG4gICAgICAgICAgICBAYXR0cnMoYXR0cnMpXG5cbiAgICBhdHRyOiAoaywgdikgLT5cbiAgICAgICAgaWYgdj9cbiAgICAgICAgICAgIEBba10gPSB2XG4gICAgICAgICAgICBAW2tdXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIEBba11cblxuICAgIG9wOiAoZiwgYXJncy4uLikgLT5cbiAgICAgICAgcmV0dXJuIGYuYXBwbHkodGhpcywgYXJncylcblxuICAgIGhhczogKGspIC0+XG4gICAgICAgIGlmIEBba10/XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZVxuICAgICAgICBlbHNlXG4gICAgICAgICAgICByZXR1cm4gZmFsc2VcblxuICAgIGRlbDogKGspIC0+XG4gICAgICAgIGlmIEBoYXMoaylcbiAgICAgICAgICAgIGRlbGV0ZSBAW2tdXG5cblxuICAgIGF0dHJzOiAoa3YpIC0+XG4gICAgICAgIGZvciBrLCB2IGluIGt2XG4gICAgICAgICAgICBAW2tdID0gdlxuXG4gICAgaXM6IChzeW1ib2wpIC0+XG4gICAgICAgIGlmIHN5bWJvbC5uYW1lIGlzIEBuYW1lXG4gICAgICAgICAgICBpZiBzeW1ib2wub2JqZWN0IGlzIEBvYmplY3RcbiAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZVxuICAgICAgICAgICAgaWYgKHN5bWJvbC5vYmplY3QgaXMgbnVsbCkgYW5kIChAb2JqZWN0IGlzIG51bGwpXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRydWVcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlXG5cbiAgICB0b1N0cmluZzogLT5cbiAgICAgICBpZiBAbnM/XG4gICAgICAgICAgIHJldHVybiBAbnMubmFtZSArIEBucy5zZXAgKyBAbmFtZVxuICAgICAgICBlbHNlXG4gICAgICAgICAgIHJldHVybiBAbmFtZVxuXG5cblMgPSAobmFtZSwgb2JqZWN0LCBucywgYXR0cnMpIC0+XG4gICAgcmV0dXJuIG5ldyBTeW1ib2wobmFtZSwgb2JqZWN0LCBucywgYXR0cnMpXG5cbiMgc2hvdWxkIGJlIGEgc2V0XG5cbmNsYXNzIE5hbWVTcGFjZVxuXG4gICAgY29uc3RydWN0b3I6IChAbmFtZSwgc2VwKSAtPlxuICAgICAgICBAZWxlbWVudHMgPSB7fVxuICAgICAgICBAc2VwID0gc2VwIHx8IFwiLlwiXG4gICAgICAgIEBfX2dlbnN5bSA9IDBcblxuICAgIGJpbmQ6IChzeW1ib2wsIG9iamVjdCwgY2xhc3NfbmFtZSkgLT5cbiAgICAgICAgc3ltYm9sLmNsYXNzID0gY2xhc3NfbmFtZSB8fCBvYmplY3QuY29uc3RydWN0b3IubmFtZVxuICAgICAgICBuYW1lID0gc3ltYm9sLm5hbWVcbiAgICAgICAgc3ltYm9sLm9iamVjdCA9IG9iamVjdFxuICAgICAgICBvYmplY3Quc3ltYm9sID0gc3ltYm9sXG4gICAgICAgIEBlbGVtZW50c1tuYW1lXSA9IHN5bWJvbFxuICAgICAgICBzeW1ib2wubnMgPSB0aGlzXG4gICAgICAgIHN5bWJvbFxuXG4gICAgdW5iaW5kOiAobmFtZSkgLT5cbiAgICAgICAgc3ltYm9sID0gQGVsZW1lbnRzW25hbWVdXG4gICAgICAgIGRlbGV0ZSBAZWxlbWVudHNbbmFtZV1cbiAgICAgICAgc3ltYm9sLm5zID0gdW5kZWZpbmVkXG4gICAgICAgIHN5bWJvbC5vYmplY3QgPSB1bmRlZmluZWRcbiAgICAgICAgc3ltYm9sLmNsYXNzID0gdW5kZWZpbmVkXG5cbiAgICBzeW1ib2w6IChuYW1lKSAtPlxuICAgICAgICBpZiBAaGFzKG5hbWUpXG4gICAgICAgICAgICBAZWxlbWVudHNbbmFtZV1cbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgUyhcIk5vdEZvdW5kXCIpXG5cbiAgICBoYXM6IChuYW1lKSAtPlxuICAgICAgICBpZiBAZWxlbWVudHNbbmFtZV0/XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZVxuICAgICAgICBlbHNlXG4gICAgICAgICAgICByZXR1cm4gZmFsc2VcblxuICAgIG9iamVjdDogKG5hbWUpIC0+XG4gICAgICAgIGlmIEBoYXMobmFtZSlcbiAgICAgICAgICAgIEBlbGVtZW50c1tuYW1lXS5vYmplY3RcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgRyhcIk5vdEZvdW5kXCIpXG5cbiAgICBzeW1ib2xzOiAoKSAtPlxuICAgICAgIHN5bWJvbHMgPSBbXVxuXG4gICAgICAgZm9yIGssdiBvZiBAZWxlbWVudHNcbiAgICAgICAgICAgc3ltYm9scy5wdXNoKHYpXG5cbiAgICAgICBzeW1ib2xzXG5cbiAgICBvYmplY3RzOiAoKSAtPlxuICAgICAgIG9iamVjdHMgPSBbXVxuXG4gICAgICAgZm9yIGssdiBvZiBAZWxlbWVudHNcbiAgICAgICAgICAgb2JqZWN0cy5wdXNoKHYub2JqZWN0KVxuXG4gICAgICAgb2JqZWN0c1xuXG4gICAgZ2Vuc3ltOiAocHJlZml4KSAtPlxuICAgICAgICBwcmVmaXggPSBwcmVmaXggfHwgXCJnZW5zeW1cIlxuICAgICAgICBwcmVmaXggKyBcIjpcIiArIChAX19nZW5zeW0rKylcblxuXG5jbGFzcyBEYXRhXG5cbiAgICBjb25zdHJ1Y3RvcjogKHByb3BzKSAtPlxuICAgICAgICBAX19zbG90cyA9IFtdXG4gICAgICAgIGlmIHByb3BzP1xuICAgICAgICAgICAgQHByb3BzKHByb3BzKVxuXG4gICAgaXM6IChkYXRhKSAtPlxuICAgICAgICBhbGxfc2xvdHMgPSBAc2xvdHMoKVxuICAgICAgICBmb3IgbmFtZSBpbiBkYXRhLnNsb3RzKClcbiAgICAgICAgICAgIGlmIGRhdGEuc2xvdChuYW1lKSAhPSBAc2xvdChuYW1lKVxuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZVxuXG4gICAgICAgIHJldHVybiB0cnVlXG5cbiAgICBwcm9wOiAoaywgdikgLT5cbiAgICAgICAgQHNsb3Qoayx2KVxuXG4gICAgcHJvcHM6IChrdikgLT5cbiAgICAgICAgaWYga3ZcbiAgICAgICAgICAgIGZvciBrLCB2IG9mIGt2XG4gICAgICAgICAgICAgICAgQFtrXSA9IHZcbiAgICAgICAgICAgICAgICBpZiBrIG5vdCBpbiBAc2xvdHMoKVxuICAgICAgICAgICAgICAgICAgICBAc2xvdHMoaylcbiAgICAgICAgICAgIHJldHVybiBAdmFsaWRhdGUoKVxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBwcm9wZXJ0aWVzID0gW11cbiAgICAgICAgICAgIGZvciBuYW1lIGluIEBzbG90cygpXG4gICAgICAgICAgICAgICAgcHJvcGVydGllcy5wdXNoKEBbbmFtZV0pXG4gICAgICAgICAgICByZXR1cm4gcHJvcGVydGllc1xuXG4gICAgc2xvdHM6IChuYW1lKSAtPlxuICAgICAgICBpZiBuYW1lP1xuICAgICAgICAgICAgQF9fc2xvdHMucHVzaChuYW1lKVxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBAX19zbG90c1xuXG4gICAgc2xvdDogKG5hbWUsIHZhbHVlKSAtPlxuICAgICAgICBpZiB2YWx1ZT9cbiAgICAgICAgICAgIEBbbmFtZV0gPSB2YWx1ZVxuICAgICAgICAgICAgaWYgbmFtZSBub3QgaW4gQHNsb3RzKClcbiAgICAgICAgICAgICAgICBAc2xvdHMobmFtZSlcbiAgICAgICAgICAgIGlmIEB2YWxpZGF0ZSgpXG4gICAgICAgICAgICAgICAgcmV0dXJuIHZhbHVlXG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgRyhcIkludmFsaWRcIilcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgaWYgQGhhcyhuYW1lKVxuICAgICAgICAgICAgICAgIEBbbmFtZV1cbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICBHKFwiTm90Rm91bmRcIilcblxuICAgIGRlbDogKG5hbWUpIC0+XG4gICAgICAgIGlmIEBoYXMobmFtZSlcbiAgICAgICAgICAgIHNsb3RzX29sZCA9IEBfX3Nsb3RzXG4gICAgICAgICAgICBAX19zbG90cyA9IFtdXG4gICAgICAgICAgICBmb3IgbiBpbiBzbG90c19vbGRcbiAgICAgICAgICAgICAgICBpZiBuICE9IG5hbWVcbiAgICAgICAgICAgICAgICAgICAgQF9fc2xvdHMucHVzaChuKVxuXG4gICAgICAgICAgICBkZWxldGUgQFtuYW1lXVxuXG5cbiAgICBoYXM6IChuYW1lKSAtPlxuICAgICAgICBpZiBuYW1lIGluIEBzbG90cygpXG4gICAgICAgICAgICByZXR1cm4gdHJ1ZVxuICAgICAgICBlbHNlXG4gICAgICAgICAgICByZXR1cm4gZmFsc2VcblxuICAgIHZhbGlkYXRlOiAtPlxuICAgICAgICB0cnVlXG5cbiAgICBfX3NlcmlhbGl6ZV9zY2FsYXI6IChzY2FsYXIpIC0+XG4gICAgICAgIHhtbCA9IFwiXCJcbiAgICAgICAgaWYgQXJyYXkuaXNBcnJheShzY2FsYXIpXG4gICAgICAgICAgICB0eXBlID0gXCJhcnJheVwiXG4gICAgICAgICAgICB4bWwgKz0gXCI8c2NhbGFyIHR5cGU9JyN7dHlwZX0nPlwiXG4gICAgICAgICAgICB4bWwgKz0gXCI8bGlzdD5cIlxuICAgICAgICAgICAgZm9yIGUgaW4gc2NhbGFyXG4gICAgICAgICAgICAgICAgeG1sICs9IEBfX3NlcmlhbGl6ZV9zY2FsYXIoZSlcbiAgICAgICAgICAgIHhtbCArPSBcIjwvbGlzdD5cIlxuICAgICAgICAgICAgeG1sICs9IFwiPC9zY2FsYXI+XCJcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgdHlwZSA9IHR5cGVvZiBzY2FsYXJcbiAgICAgICAgICAgIGlmIHR5cGUgaW4gW1wiYm9vbGVhblwiLCBcIm51bWJlclwiLCBcInN0cmluZ1wiLCBcIlN5bWJvbFwiIF1cbiAgICAgICAgICAgICAgICB4bWwgKz0gXCI8c2NhbGFyIHR5cGU9JyN7dHlwZX0nPiN7c2NhbGFyLnRvU3RyaW5nKCl9PC9zY2FsYXI+XCJcbiAgICAgICAgeG1sXG5cbiAgICBpbml0OiAoeG1sKSAtPlxuICAgICAgICBkb2MgPSBuZXcgZG9tKCkucGFyc2VGcm9tU3RyaW5nKHhtbClcbiAgICAgICAgcHJvcHMgPSB4cGF0aC5zZWxlY3QoXCJwcm9wZXJ0eVwiLCBkb2MpXG4gICAgICAgIGZvciBwcm9wIGluIHByb3BzXG4gICAgICAgICAgICBkYXRhX3Byb3AgPSBkb20ycHJvcChwcm9wKVxuICAgICAgICAgICAgQHByb3AoZGF0YV9wcm9wLnNsb3QsIGRhdGFfcHJvcC52YWx1ZSlcblxuXG4gICAgc2VyaWFsaXplOiAodG8pIC0+XG4gICAgICAgIHhtbCA9IFwiXCJcbiAgICAgICAgZm9yIG5hbWUgaW4gQHNsb3RzKClcbiAgICAgICAgICAgIHhtbCArPSBcIjxwcm9wZXJ0eSBzbG90PScje25hbWV9Jz5cIlxuICAgICAgICAgICAgc2NhbGFyICA9IEBzbG90KG5hbWUpXG4gICAgICAgICAgICB4bWwgKz0gQF9fc2VyaWFsaXplX3NjYWxhcihzY2FsYXIpXG4gICAgICAgICAgICB4bWwgKz0gJzwvcHJvcGVydHk+J1xuICAgICAgICB4bWxcblxuICAgIHRvU3RyaW5nOiAtPlxuXG5EID0gKHByb3BzKSAtPlxuICAgIHJldHVybiBuZXcgRGF0YShwcm9wcylcblxuY2xhc3MgU2lnbmFsIGV4dGVuZHMgRGF0YVxuXG4gICAgY29uc3RydWN0b3I6IChyb3V0ZSwgcGF5bG9hZCwgcHJvcHMpIC0+XG4gICAgICAgIHByb3BzID0gcHJvcHMgfHwge31cbiAgICAgICAgcHJvcHMucm91dGUgPSByb3V0ZVxuICAgICAgICBwcm9wcy5wYXlsb2FkID0gcGF5bG9hZFxuICAgICAgICBzdXBlcihwcm9wcylcblxuY2xhc3MgRXZlbnQgZXh0ZW5kcyBTaWduYWxcblxuICAgIGNvbnN0cnVjdG9yOiAocm91dGUsIHBheWxvYWQsIHByb3BzKSAtPlxuICAgICAgICBwcm9wcyA9IHByb3BzIHx8IHt9XG4gICAgICAgIHBvcHMudHMgPSBuZXcgRGF0ZSgpLmdldFRpbWUoKVxuICAgICAgICBzdXBlcihyb3V0ZSwgcGF5bG9hZCwgcHJvcHMpXG5cbmNsYXNzIEdsaXRjaCBleHRlbmRzIERhdGFcblxuICAgIGNvbnN0cnVjdG9yOiAobmFtZSwgY29udGV4dCwgcHJvcHMpIC0+XG4gICAgICAgIHByb3BzID0gcHJvcHMgfHwge31cbiAgICAgICAgcHJvcHMubmFtZSA9IG5hbWVcbiAgICAgICAgcHJvcHMuY29udGVueHQgPSBjb250ZXh0XG4gICAgICAgIHN1cGVyKHByb3BzKVxuXG5HID0gKG5hbWUsIHByb3BzKSAtPlxuICAgIHJldHVybiBuZXcgR2xpdGNoKG5hbWUsIHByb3BzKVxuXG5jbGFzcyBUb2tlbiBleHRlbmRzIERhdGFcblxuICAgIGNvbnN0cnVjdG9yOiAodmFsdWUsIHNpZ24sIHByb3BzKSAgLT5cbiAgICAgICAgc3VwZXIocHJvcHMpXG4gICAgICAgIEBzaWducyA9IFtdXG4gICAgICAgIEB2YWx1ZXMgPSBbXVxuICAgICAgICBpZiB2YWx1ZT9cbiAgICAgICAgICAgIEBzdGFtcChzaWduLCB2YWx1ZSlcblxuICAgIGlzOiAodCkgLT5cbiAgICAgICAgZmFsc2VcblxuICAgIHZhbHVlOiAtPlxuICAgICAgICBAcHJvcChcInZhbHVlXCIpXG5cbiAgICBzdGFtcF9ieTogKGluZGV4KSAtPlxuICAgICAgICBpZiBpbmRleD9cbiAgICAgICAgICAgaWYgQHNpZ25zW2luZGV4XT9cbiAgICAgICAgICAgICAgIHJldHVybiBAc2lnbnNbaW5kZXhdXG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICByZXR1cm4gUyhcIk5vdEZvdW5kXCIpXG5cbiAgICAgICAgaWYgQHNpZ25zLmxlbmd0aCA+IDBcbiAgICAgICAgICAgcmV0dXJuIEBzaWduc1tAc2lnbnMubGVuZ3RoIC0gMV1cbiAgICAgICAgZWxzZVxuICAgICAgICAgICByZXR1cm4gUyhcIk5vdEZvdW5kXCIpXG5cbiAgICBzdGFtcDogKHNpZ24sIHZhbHVlKSAtPlxuICAgICAgICBpZiB2YWx1ZT9cbiAgICAgICAgICAgIGlmIEBoYXMoXCJ2YWx1ZVwiKVxuICAgICAgICAgICAgICAgIG9sZF92YWx1ZSA9IEBwcm9wKFwidmFsdWVcIilcbiAgICAgICAgICAgICAgICBAZGVsKFwidmFsdWVcIilcbiAgICAgICAgICAgICAgICBAZGVsKHZhbHVlKVxuICAgICAgICAgICAgQHByb3AoXCJ2YWx1ZVwiLCB2YWx1ZSlcbiAgICAgICAgICAgIGlmIHR5cGVvZiB2YWx1ZSBpcyBcInN0cmluZ1wiXG4gICAgICAgICAgICAgICAgQHByb3AodmFsdWUsIHRydWUpXG4gICAgICAgICAgICBAdmFsdWVzLnB1c2godmFsdWUpXG4gICAgICAgIGlmIHNpZ25cbiAgICAgICAgICAgIEBzaWducy5wdXNoKHNpZ24pXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIEBzaWducy5wdXNoKFMoXCJVbmtub3duXCIpKVxuXG5cbnN0YXJ0ID0gKHNpZ24sIHByb3BzKSAtPlxuICAgIHJldHVybiBuZXcgVG9rZW4oXCJzdGFydFwiLCBzaWduLCBwcm9wcylcblxuc3RvcCA9IChzaWduLCBwcm9wcykgLT5cbiAgICByZXR1cm4gbmV3IFRva2VuKFwic3RvcFwiLCBzaWduLCBwcm9wcylcblxuVCA9ICh2YWx1ZSwgc2lnbiwgcHJvcHMpIC0+XG4gICAgcmV0dXJuIG5ldyBUb2tlbih2YWx1ZSwgc2lnbiwgcHJvcHMpXG5cbmNsYXNzIFBhcnQgZXh0ZW5kcyBEYXRhXG5cbiAgICBjb25zdHJ1Y3RvcjogKEBuYW1lLCBwcm9wcykgLT5cbiAgICAgICAgc3VwZXIocHJvcHMpXG5cbiAgICBzZXJpYWxpemU6ICh0bykgLT5cbiAgICAgICAgeG1sICs9IFwiPHBhcnQgbmFtZT0nI3tAbmFtZX0nPlwiXG4gICAgICAgIHhtbCArPSBzdXBlcigpXG4gICAgICAgIHhtbCArPSAnPC9wYXJ0PidcblxuUCA9IChuYW1lLCBwcm9wcykgLT5cbiAgICByZXR1cm4gbmV3IFBhcnQobmFtZSwgcHJvcHMpXG5cbmNsYXNzIEVudGl0eSBleHRlbmRzIERhdGFcblxuICAgIGNvbnN0cnVjdG9yOiAodGFncywgcHJvcHMpIC0+XG4gICAgICAgIEBwYXJ0cyA9IG5ldyBOYW1lU3BhY2UoXCJwYXJ0c1wiKVxuICAgICAgICBwcm9wcyA9IHByb3BzIHx8IHt9XG4gICAgICAgIHByb3BzLnRzID0gcHJvcHMudHMgfHwgbmV3IERhdGUoKS5nZXRUaW1lKClcbiAgICAgICAgdGFncyA9IHRhZ3MgfHwgcHJvcHMudGFncyB8fCBbXVxuICAgICAgICBwcm9wcy50YWdzID0gdGFnc1xuICAgICAgICBzdXBlcihwcm9wcylcblxuICAgIGFkZDogKHN5bWJvbCwgcGFydCkgLT5cbiAgICAgICAgQHBhcnRzLmJpbmQoc3ltYm9sLCBwYXJ0KVxuXG4gICAgcmVtb3ZlOiAobmFtZSkgLT5cbiAgICAgICAgQHBhcnRzLnVuYmluZChuYW1lKVxuXG4gICAgaGFzUGFydDogKG5hbWUpIC0+XG4gICAgICAgIEBwYXJ0cy5oYXMobmFtZSlcblxuICAgIHBhcnQ6IChuYW1lKSAtPlxuICAgICAgICBAcGFydHMuc3ltYm9sKG5hbWUpXG5cbiAgICBzZXJpYWxpemU6ICh0bykgLT5cbiAgICAgICAgeG1sID0gXCI8ZW50aXR5PlwiXG4gICAgICAgIHhtbCArPSAnPHBhcnRzPidcbiAgICAgICAgZm9yIHBhcnQgb2YgQHBhcnRzLm9iamVjdHMoKVxuICAgICAgICAgICAgeG1sICs9IHBhcnQuc2VyaWFsaXplKClcbiAgICAgICAgeG1sICs9ICc8L3BhcnRzPidcbiAgICAgICAgeG1sICs9IHN1cGVyKClcbiAgICAgICAgeG1sICs9ICc8L2VudGl0eT4nXG5cbkUgPSAodGFncywgcHJvcHMpIC0+XG4gICAgcmV0dXJuIG5ldyBFbnRpdHkodGFncywgcHJvcHMpXG5cbmNsYXNzIENlbGwgZXh0ZW5kcyBFbnRpdHlcblxuICAgIGNvbnN0cnVjdG9yOiAodGFncywgcHJvcHMpIC0+XG4gICAgICAgIHN1cGVyKHRhZ3MsIHByb3BzKVxuICAgICAgICBAb2JzZXJ2ZXJzPSBuZXcgTmFtZVNwYWNlKFwib2JzZXJ2ZXJzXCIpXG5cbiAgICBub3RpZnk6IChldmVudCkgLT5cbiAgICAgICBmb3Igb2IgaW4gQG9ic2VydmVycy5vYmplY3RzKClcbiAgICAgICAgICAgIG9iLmludGVycnVwdChldmVudClcblxuICAgIGFkZDogKHBhcnQpIC0+XG4gICAgICAgIHN1cGVyIHBhcnRcbiAgICAgICAgZXZlbnQgPSBuZXcgRXZlbnQoXCJwYXJ0LWFkZGVkXCIsIHtwYXJ0OiBwYXJ0LCBjZWxsOiB0aGlzfSlcbiAgICAgICAgQG5vdGlmeShldmVudClcblxuICAgIHJlbW92ZTogKG5hbWUpIC0+XG4gICAgICAgIHN1cGVyIG5hbWVcbiAgICAgICAgZXZlbnQgPSBuZXcgRXZlbnQoXCJwYXJ0LXJlbW92ZWRcIiwge3BhcnQ6IHBhcnQsIGNlbGw6IHRoaXN9KVxuICAgICAgICBAbm90aWZ5KGV2ZW50KVxuXG4gICAgb2JzZXJ2ZTogKHN5bWJvbCwgc3lzdGVtKSAtPlxuICAgICAgICBAb2JzZXJ2ZXJzLmJpbmQoc3ltYm9sLCBzeXN0ZW0pXG5cbiAgICBmb3JnZXQ6IChuYW1lKSAtPlxuICAgICAgICBAb2JzZXJ2ZXJzLnVuYmluZChuYW1lKVxuXG4gICAgc3RlcDogKGZuLCBhcmdzLi4uKSAtPlxuICAgICAgICByZXR1cm4gZm4uYXBwbHkodGhpcywgYXJncylcblxuICAgIGNsb25lOiAoKSAtPlxuICAgICAgICByZXR1cm4gY2xvbmUodGhpcylcblxuQyA9ICh0YWdzLCBwcm9wcykgLT5cbiAgICByZXR1cm4gbmV3IENlbGwodGFncywgcHJvcHMpXG5cbmNsYXNzIFN5c3RlbVxuXG4gICAgY29uc3RydWN0b3I6IChAYiwgY29uZikgLT5cbiAgICAgICAgQGlubGV0cyA9IG5ldyBOYW1lU3BhY2UoXCJpbmxldHNcIilcbiAgICAgICAgQGlubGV0cy5iaW5kKG5ldyBTeW1ib2woXCJzeXNpblwiKSxbXSlcbiAgICAgICAgQGlubGV0cy5iaW5kKG5ldyBTeW1ib2woXCJmZWVkYmFja1wiKSxbXSlcbiAgICAgICAgQG91dGxldHMgPSBuZXcgTmFtZVNwYWNlKFwib3V0bGV0c1wiKVxuICAgICAgICBAb3V0bGV0cy5iaW5kKG5ldyBTeW1ib2woXCJzeXNvdXRcIiksW10pXG4gICAgICAgIEBvdXRsZXRzLmJpbmQobmV3IFN5bWJvbChcInN5c2VyclwiKSxbXSlcbiAgICAgICAgQG91dGxldHMuYmluZChuZXcgU3ltYm9sKFwiZGVidWdcIiksW10pXG5cbiAgICAgICAgQGNvbmYgPSBjb25mIHx8IEQoKVxuICAgICAgICBAc3RhdGUgPSBbXVxuICAgICAgICBAciA9IHt9XG5cbiAgICB0b3A6IChpbmRleCkgLT5cbiAgICAgICAgaWYgaW5kZXg/XG4gICAgICAgICAgICBpZiBAc3RhdGVbaW5kZXhdP1xuICAgICAgICAgICAgICAgIHJldHVybiBAc3RhdGVbaW5kZXhdXG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgcmV0dXJuIFMoXCJOb3RGb3VuZFwiKVxuXG4gICAgICAgIGlmIEBzdGF0ZS5sZW5ndGggPiAwXG4gICAgICAgICAgICByZXR1cm4gQHN0YXRlW0BzdGF0ZS5sZW5ndGggLSAxXVxuICAgICAgICBlbHNlXG4gICAgICAgICAgICByZXR1cm4gUyhcIk5vdEZvdW5kXCIpXG5cbiAgICBpbnB1dDogKGRhdGEsIGlubGV0KSAtPlxuICAgICAgICBkYXRhXG5cbiAgICBvdXRwdXQ6IChkYXRhLCBvdXRsZXQpIC0+XG4gICAgICAgIGRhdGFcblxuICAgIFNUT1A6IChzdG9wX3Rva2VuKSAtPlxuXG4gICAgcHVzaDogKGRhdGEsIGlubGV0KSAtPlxuICAgICAgICBAYi5taXJyb3IucmVsYXkoXCJwdXNoXCIsIEBzeW1ib2wubmFtZSwgZGF0YSwgaW5sZXQpXG5cbiAgICAgICAgaW5sZXQgPSBpbmxldCB8fCBAaW5sZXRzLnN5bWJvbChcInN5c2luXCIpXG5cbiAgICAgICAgaW5wdXRfZGF0YSA9IEBpbnB1dChkYXRhLCBpbmxldClcblxuICAgICAgICBpZiBpbnB1dF9kYXRhIGluc3RhbmNlb2YgR2xpdGNoXG4gICAgICAgICAgICBAZXJyb3IoaW5wdXRfZGF0YSlcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgQHByb2Nlc3MgaW5wdXRfZGF0YSwgaW5sZXRcblxuICAgIGdvdG9fd2l0aDogKGlubGV0LCBkYXRhKSAtPlxuICAgICAgICBAcHVzaChkYXRhLCBpbmxldClcblxuICAgIHByb2Nlc3M6IChkYXRhLCBpbmxldCkgLT5cblxuICAgIGRpc3BhdGNoOiAoZGF0YSwgb3V0bGV0KSAtPlxuICAgICAgICBmb3Igb2wgaW4gQG91dGxldHMuc3ltYm9scygpXG4gICAgICAgICAgICBpZiBvbC5uYW1lID09IG91dGxldC5uYW1lXG4gICAgICAgICAgICAgICAgZm9yIHdpcmUgaW4gb2wub2JqZWN0XG4gICAgICAgICAgICAgICAgICAgIHdpcmUub2JqZWN0LnRyYW5zbWl0IGRhdGFcblxuICAgIGVtaXQ6IChkYXRhLCBvdXRsZXQpIC0+XG4gICAgICAgIG91dGxldCA9IG91dGxldCB8fCBAb3V0bGV0cy5zeW1ib2woXCJzeXNvdXRcIilcblxuICAgICAgICBvdXRwdXRfZGF0YSA9IEBvdXRwdXQoZGF0YSwgb3V0bGV0KVxuXG4gICAgICAgIGlmIG91dHB1dF9kYXRhIGluc3RhbmNlb2YgR2xpdGNoXG4gICAgICAgICAgICBAZXJyb3Iob3V0cHV0X2RhdGEpXG4gICAgICAgICAgICByZXR1cm5cblxuICAgICAgICBAZGlzcGF0Y2gob3V0cHV0X2RhdGEsIG91dGxldClcblxuICAgIGRlYnVnOiAoZGF0YSkgLT5cbiAgICAgICAgQGRpc3BhdGNoKGRhdGEsIEBvdXRsZXRzLnN5bWJvbChcImRlYnVnXCIpKVxuXG4gICAgZXJyb3I6IChkYXRhKSAtPlxuICAgICAgICBAZGlzcGF0Y2goZGF0YSwgQG91dGxldHMuc3ltYm9sKFwic3lzZXJyXCIpKVxuXG4gICAgaW50ZXJydXB0OiAoc2lnbmFsKSAtPlxuICAgICAgICBAYi5taXJyb3IucmVsYXkoXCJpbnRlcnJ1cHRcIiwgQHN5bWJvbC5uYW1lLCBzaWduYWwpXG4gICAgICAgIEByZWFjdChzaWduYWwpXG5cbiAgICByZWFjdDogKHNpZ25hbCkgLT5cblxuICAgIHNob3c6IChkYXRhKSAtPlxuXG4gICAgc2VyaWFsaXplOiAodG8pIC0+XG4gICAgICAgIHhtbCA9IFwiPHN5c3RlbSBuYW1lPScje0BzeW1ib2wubmFtZX0nIGNsYXNzPScje0BzeW1ib2wuY2xhc3N9Jz5cIlxuICAgICAgICB4bWwgKz0gXCI8Y29uZmlndXJhdGlvbj5cIlxuICAgICAgICB4bWwgKz0gQGNvbmYuc2VyaWFsaXplKClcbiAgICAgICAgeG1sICs9IFwiPC9jb25maWd1cmF0aW9uPlwiXG4gICAgICAgIHhtbCArPSBcIjwvc3lzdGVtPlwiXG4gICAgICAgIHhtbFxuXG5cbmNsYXNzIFdpcmVcblxuICAgIGNvbnN0cnVjdG9yOiAoQGIsIHNvdXJjZSwgc2luaywgb3V0bGV0LCBpbmxldCkgLT5cbiAgICAgICAgb3V0bGV0ID0gb3V0bGV0IHx8IFwic3lzb3V0XCJcbiAgICAgICAgaW5sZXQgPSBpbmxldCB8fCBcInN5c2luXCJcbiAgICAgICAgQHNvdXJjZSA9IEBiLnN5c3RlbXMuc3ltYm9sKHNvdXJjZSlcbiAgICAgICAgQHNpbmsgPSBAYi5zeXN0ZW1zLnN5bWJvbChzaW5rKVxuICAgICAgICBAb3V0bGV0ID0gQHNvdXJjZS5vYmplY3Qub3V0bGV0cy5zeW1ib2wob3V0bGV0KVxuICAgICAgICBAaW5sZXQgPSBAc2luay5vYmplY3QuaW5sZXRzLnN5bWJvbChpbmxldClcblxuICAgIHRyYW5zbWl0OiAoZGF0YSkgLT5cbiAgICAgICAgQHNpbmsub2JqZWN0LnB1c2goZGF0YSwgQGlubGV0KVxuXG4gICAgc2VyaWFsaXplOiAtPlxuICAgICAgICB4bWwgPSBcIlwiXG4gICAgICAgIHhtbCArPSBcIjx3aXJlIG5hbWU9JyN7QHN5bWJvbC5uYW1lfSc+XCJcbiAgICAgICAgeG1sICs9IFwiPHNvdXJjZSBuYW1lPScje0Bzb3VyY2UubmFtZX0nLz5cIlxuICAgICAgICB4bWwgKz0gXCI8b3V0bGV0IG5hbWU9JyN7QG91dGxldC5uYW1lfScvPlwiXG4gICAgICAgIHhtbCArPSBcIjxzaW5rIG5hbWU9JyN7QHNpbmsubmFtZX0nLz5cIlxuICAgICAgICB4bWwgKz0gXCI8aW5sZXQgbmFtZT0nI3tAaW5sZXQubmFtZX0nLz5cIlxuICAgICAgICB4bWwgKz0gXCI8L3dpcmU+XCJcbiAgICAgICAgeG1sXG5cblxuXG5jbGFzcyBTdG9yZVxuXG4gICAgY29uc3RydWN0b3I6IC0+XG4gICAgICAgIEBlbnRpdGllcyA9IG5ldyBOYW1lU3BhY2UoXCJlbnRpdGllc1wiKVxuXG4gICAgYWRkOiAoZW50aXR5LCBzeW1ib2wpIC0+XG4gICAgICAgIGlmIG5vdCBzeW1ib2xcbiAgICAgICAgICAgIG5hbWUgPSBAZW50aXRpZXMuZ2Vuc3ltKFwiZW50aXR5XCIpXG4gICAgICAgICAgICBzeW1ib2wgPSBuZXcgU3ltYm9sKG5hbWUpXG4gICAgICAgIEBlbnRpdGllcy5iaW5kKHN5bWJvbCwgZW50aXR5KVxuICAgICAgICBlbnRpdHlcblxuICAgIHNuYXBzaG90OiAoKSAtPlxuICAgICAgICB4bWwgPSAnPD94bWwgdmVyc2lvbiA9IFwiMS4wXCIgc3RhbmRhbG9uZT1cInllc1wiPz4nXG4gICAgICAgIHhtbCArPSBcIjxzbmFwc2hvdD5cIlxuICAgICAgICBmb3IgZW50aXR5IGluIEBlbnRpdGllcy5vYmplY3RzKClcbiAgICAgICAgICAgIHhtbCArPSBlbnRpdHkuc2VyaWFsaXplKClcbiAgICAgICAgeG1sICs9IFwiPC9zbmFwc2hvdD5cIlxuICAgICAgICByZXR1cm4geG1sXG5cbiAgICBvcDogKGYsIGFyZ3MuLi4pIC0+XG4gICAgICAgIHJldHVybiBmLmFwcGx5KHRoaXMsIGFyZ3MpXG5cbiAgICByZWNvdmVyOiAoeG1sKSAtPlxuICAgICAgICBkb2MgPSBuZXcgZG9tKCkucGFyc2VGcm9tU3RyaW5nKHhtbClcbiAgICAgICAgZW50aXRpZXMgPSB4cGF0aC5zZWxlY3QoXCIvL2VudGl0eVwiLCBkb2MpXG4gICAgICAgIGVudGl0aWVzX2xpc3QgPSBbXVxuICAgICAgICBmb3IgZW50aXR5IGluIGVudGl0aWVzXG4gICAgICAgICAgICBlbnRpdHlfcHJvcHMgPSB7fVxuICAgICAgICAgICAgcHJvcHMgPSB4cGF0aC5zZWxlY3QoXCJwcm9wZXJ0eVwiLCBlbnRpdHkpXG4gICAgICAgICAgICBmb3IgcHJvcCBpbiBwcm9wc1xuICAgICAgICAgICAgICAgIGVudGl0eV9wcm9wID0gZG9tMnByb3AocHJvcClcbiAgICAgICAgICAgICAgICBlbnRpdHlfcHJvcHNbZW50aXR5X3Byb3Auc2xvdF0gPSBlbnRpdHlfcHJvcC52YWx1ZVxuXG4gICAgICAgICAgICBuZXdfZW50aXR5ID0gbmV3IEVudGl0eShudWxsLCBlbnRpdHlfcHJvcHMpXG5cbiAgICAgICAgICAgIHBhcnRzID0geHBhdGguc2VsZWN0KFwicGFydFwiLCBlbnRpdHkpXG4gICAgICAgICAgICBmb3IgcGFydCBpbiBwYXJ0c1xuICAgICAgICAgICAgICAgIG5hbWUgPSBwYXJ0LmdldEF0dHJpYnV0ZShcIm5hbWVcIilcbiAgICAgICAgICAgICAgICBwYXJ0X3Byb3BzID0ge31cbiAgICAgICAgICAgICAgICBwcm9wcyA9IHhwYXRoLnNlbGVjdChcInByb3BlcnR5XCIsIHBhcnQpXG4gICAgICAgICAgICAgICAgZm9yIHByb3AgaW4gcHJvcHNcbiAgICAgICAgICAgICAgICAgICAgcGFydF9wcm9wID0gZG9tMnByb3AocHJvcClcbiAgICAgICAgICAgICAgICAgICAgcGFydF9wcm9wc1twYXJ0X3Byb3Auc2xvdF0gPSBwYXJ0X3Byb3AudmFsdWVcbiAgICAgICAgICAgICAgICBlbnRpdHlfcGFydCA9IG5ldyBQYXJ0KG5hbWUsIHBhcnRfcHJvcHMpXG4gICAgICAgICAgICAgICAgbmV3X2VudGl0eS5hZGQoZW50aXR5X3BhcnQpXG5cbiAgICAgICAgICAgIGVudGl0aWVzX2xpc3QucHVzaChuZXdfZW50aXR5KVxuXG4gICAgICAgIEBlbnRpdGllcyA9IG5ldyBOYW1lU3BhY2UoXCJlbnRpdGllc1wiKVxuICAgICAgICBmb3IgZW50aXR5IGluIGVudGl0aWVzX2xpc3RcbiAgICAgICAgICAgIEBhZGQoZW50aXR5KVxuXG4gICAgaGFzOiAobmFtZSkgLT5cbiAgICAgICAgQGVudGl0aWVzLmhhcyhuYW1lKVxuXG4gICAgZW50aXR5OiAobmFtZSkgLT5cbiAgICAgICAgQGVudGl0aWVzLm9iamVjdChuYW1lKVxuXG4gICAgcmVtb3ZlOiAobmFtZSkgLT5cbiAgICAgICAgQGVudGl0aWVzLnVuYmluZChuYW1lKVxuXG4gICAgYnlfcHJvcDogKHByb3ApIC0+XG4gICAgICAgIGVudGl0aWVzID0gW11cbiAgICAgICAgZm9yIGVudGl0eSBpbiBAZW50aXRpZXMub2JqZWN0cygpXG4gICAgICAgICAgICBpZiBlbnRpdHkuaGFzKHByb3Auc2xvdClcbiAgICAgICAgICAgICAgICBlbnRpdHlfdmFsdWUgPSBlbnRpdHkuc2xvdChwcm9wLnNsb3QpXG4gICAgICAgICAgICAgICAgaWYgQXJyYXkuaXNBcnJheShlbnRpdHlfdmFsdWUpXG4gICAgICAgICAgICAgICAgICAgIGlmIHByb3AudmFsdWUgaW4gZW50aXR5X3ZhbHVlXG4gICAgICAgICAgICAgICAgICAgICAgICBlbnRpdGllcy5wdXNoKGVudGl0eSlcbiAgICAgICAgICAgICAgICBlbHNlIGlmIGVudGl0eV92YWx1ZSBpcyBwcm9wLnZhbHVlXG4gICAgICAgICAgICAgICAgICAgIGVudGl0aWVzLnB1c2goZW50aXR5KVxuXG4gICAgICAgIGlmIGVudGl0aWVzLmxlbmd0aCA+IDBcbiAgICAgICAgICAgIHJldHVybiBlbnRpdGllc1xuICAgICAgICBlbHNlXG4gICAgICAgICAgICBHKFwiTm90Rm91bmRcIilcblxuICAgIGZpcnN0X2J5X3Byb3A6IChwcm9wKSAtPlxuICAgICAgICBlbnRpdGllcyA9IEBieV9wcm9wKHByb3ApXG4gICAgICAgIGlmIGVudGl0aWVzIGluc3RhbmNlb2YgR2xpdGNoXG4gICAgICAgICAgICByZXR1cm4gZW50aXRpZXNcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgZW50aXRpZXNbMF1cblxuICAgIGJ5X3RhZ3M6ICh0YWdzKSAtPlxuICAgICAgICBlbnRpdGllcyA9IFtdXG4gICAgICAgIGZvciBlbnRpdHkgaW4gQGVudGl0aWVzLm9iamVjdHMoKVxuICAgICAgICAgICAgZm9yIHRhZyBpbiB0YWdzXG4gICAgICAgICAgICAgICAgaWYgdGFnIGluIGVudGl0eS50YWdzXG4gICAgICAgICAgICAgICAgICAgIGVudGl0aWVzLnB1c2ggZW50aXR5XG5cbiAgICAgICAgaWYgZW50aXRpZXMubGVuZ3RoID4gMFxuICAgICAgICAgICAgcmV0dXJuIGVudGl0aWVzXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIEcoXCJOb3RGb3VuZFwiKVxuXG4gICAgZmlyc3RfYnlfdGFnczogKHRhZ3MpIC0+XG4gICAgICAgIGVudGl0aWVzID0gQGJ5X3RhZ3ModGFncylcbiAgICAgICAgaWYgZW50aXRpZXMgaW5zdGFuY2VvZiBHbGl0Y2hcbiAgICAgICAgICAgIHJldHVybiBlbnRpdGllc1xuICAgICAgICBlbHNlXG4gICAgICAgICAgICBlbnRpdGllc1swXVxuXG5cbmNsYXNzIEJ1cyBleHRlbmRzIE5hbWVTcGFjZVxuXG4gICAgY29uc3RydWN0b3I6IChAbmFtZSwgc2VwKSAtPlxuICAgICAgICBzdXBlcihAbmFtZSwgc2VwKVxuXG4gICAgdHJpZ2dlcjogKHNpZ25hbCwgYnJvYWRjYXN0KSAtPlxuXG4gICAgICAgIGJyb2FkY2FzdCA9IGJyb2FkY2FzdCB8fCBmYWxzZVxuICAgICAgICBpbnRlcnJ1cHRzID0gMFxuXG4gICAgICAgIGlmIGJyb2FkY2FzdCA9PSBmYWxzZVxuICAgICAgICAgICAgZm9yIHN5bSBpbiBAc3ltYm9scygpXG4gICAgICAgICAgICAgICAgaWYgc3ltLm9iamVjdCBpbnN0YW5jZW9mIFN5c3RlbVxuICAgICAgICAgICAgICAgICAgICBpZiBzeW0uaGFzKFwicm91dGVcIilcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIHN5bS5hdHRyKFwicm91dGVcIikgaXMgc2lnbmFsLnJvdXRlXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc3ltLm9iamVjdC5pbnRlcnJ1cHQoc2lnbmFsKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGludGVycnVwdHMrK1xuXG4gICAgICAgIGVsc2UgaWYgaW50ZXJydXB0cyA9PSAwIHx8IGJyb2FkY2FzdCA9PSBcInRydWVcIlxuICAgICAgICAgICAgZm9yIHN5bSBpbiBAc3ltYm9scygpXG4gICAgICAgICAgICAgICAgaWYgc3ltLm9iamVjdCBpbnN0YW5jZW9mIFN5c3RlbVxuICAgICAgICAgICAgICAgICAgICBzeW0ub2JqZWN0LmludGVycnVwdChzaWduYWwpXG4gICAgICAgICAgICAgICAgICAgIGludGVycnVwdHMrK1xuXG4gICAgICAgIGludGVycnVwdHNcblxuY2xhc3MgTWlycm9yXG4gICAgY29uc3RydWN0b3I6IChAYikgLT5cblxuICAgIHJlZmxlY3Q6IChvcCwgc3lzdGVtLCBhcmdzLi4uKSAtPlxuICAgICAgICBzeXMgPSBAYi5zeXN0ZW1zLm9iamVjdChzeXN0ZW0pXG4gICAgICAgIHN5c1tvcF0uYXBwbHkoc3lzLCBhcmdzKVxuXG4gICAgcmVsYXk6IChvcCwgc3lzdGVtLCBhcmdzLi4uKSAtPlxuXG5jbGFzcyBCb2FyZFxuXG4gICAgY29uc3RydWN0b3I6ICh3aXJlQ2xhc3MsIGJ1c0NsYXNzLCBzdG9yZUNsYXNzLCBtaXJyb3JDbGFzcyApIC0+XG4gICAgICAgIEB3aXJlQ2xhc3MgPSB3aXJlQ2xhc3MgfHwgV2lyZVxuICAgICAgICBAYnVzQ2xhc3MgPSBidXNDbGFzcyB8fCBCdXNcbiAgICAgICAgQHN0b3JlQ2xhc3MgPSBzdG9yZUNsYXNzIHx8IFN0b3JlXG4gICAgICAgIEBtaXJyb3JDbGFzcyA9IG1pcnJvckNsYXNzIHx8IE1pcnJvclxuICAgICAgICBAaW5pdCgpXG5cbiAgICBpbml0OiAtPlxuICAgICAgICBAYnVzID0gbmV3IEBidXNDbGFzcyhcImJ1c1wiKVxuICAgICAgICBAc3RvcmUgPSBuZXcgQHN0b3JlQ2xhc3MoKVxuICAgICAgICBAbWlycm9yID0gbmV3IEBtaXJyb3JDbGFzcyh0aGlzKVxuICAgICAgICBAc3lzdGVtcyA9IEBidXNcbiAgICAgICAgQHdpcmVzID0gbmV3IE5hbWVTcGFjZShcIndpcmVzXCIpXG5cbiAgICAgICAgQGJ1cy5iaW5kKFMoXCJzdG9yZVwiKSwgQHN0b3JlKVxuICAgICAgICBAYnVzLmJpbmQoUyhcIndpcmVzXCIpLCBAd2lyZXMpXG5cbiAgICBzZXR1cDogKHhtbCwgY2xvbmUpIC0+XG4gICAgICAgIGlmIHhtbD9cbiAgICAgICAgICAgIGRvYyA9IG5ldyBkb20oKS5wYXJzZUZyb21TdHJpbmcoeG1sKVxuICAgICAgICAgICAgYm9hcmQgPSB4cGF0aC5zZWxlY3QoXCJib2FyZFwiLCBkb2MpWzBdXG4gICAgICAgICAgICBib2FyZF9uYW1lID0gYm9hcmQuZ2V0QXR0cmlidXRlKFwibmFtZVwiKVxuICAgICAgICAgICAgYnVzX2NsYXNzID0geHBhdGguc2VsZWN0KFwiQnVzXCIsIGJvYXJkKVswXS5nZXRBdHRyaWJ1dGUoXCJjbGFzc1wiKVxuICAgICAgICAgICAgc3RvcmVfY2xhc3MgPSB4cGF0aC5zZWxlY3QoXCJTdG9yZVwiLCBib2FyZClbMF0uZ2V0QXR0cmlidXRlKFwiY2xhc3NcIilcbiAgICAgICAgICAgIHdpcmVfY2xhc3MgPSB4cGF0aC5zZWxlY3QoXCJXaXJlXCIsIGJvYXJkKVswXS5nZXRBdHRyaWJ1dGUoXCJjbGFzc1wiKVxuXG4gICAgICAgICAgICBpZiBjbG9uZT9cbiAgICAgICAgICAgICAgICBib2FyZF9uZXcgPSBuZXcgQm9hcmQoYm9hcmRfbmFtZSwgZ2xvYmFsW3dpcmVfY2xhc3NdLCBnbG9iYWxbYnVzX2NsYXNzXSwgZ2xvYmFsW3N0b3JlX2NsYXNzXSlcbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICBib2FyZF9uZXcgPSBAXG4gICAgICAgICAgICAgICAgYm9hcmRfbmV3LmluaXQoKVxuXG4gICAgICAgICAgICBzeXNzID0geHBhdGguc2VsZWN0KFwic3lzdGVtXCIsIGJvYXJkKVxuICAgICAgICAgICAgZm9yIHN5cyBpbiBzeXNzXG4gICAgICAgICAgICAgICAgbmFtZSA9IHN5cy5nZXRBdHRyaWJ1dGUoXCJuYW1lXCIpXG4gICAgICAgICAgICAgICAga2xhc3MgPSBzeXMuZ2V0QXR0cmlidXRlKFwiY2xhc3NcIilcbiAgICAgICAgICAgICAgICBjb25mX25vZGUgPSB4cGF0aC5zZWxlY3QoXCJjb25maWd1cmF0aW9uXCIsIHN5cylbMF1cbiAgICAgICAgICAgICAgICBkYXRhX3Byb3BzID0ge31cbiAgICAgICAgICAgICAgICBwcm9wcyA9IHhwYXRoLnNlbGVjdChcIi8vcHJvcGVydHlcIiwgY29uZl9ub2RlKVxuICAgICAgICAgICAgICAgIGZvciBwcm9wIGluIHByb3BzXG4gICAgICAgICAgICAgICAgICAgIGRhdGFfcHJvcCA9IGRvbTJwcm9wKHByb3ApXG4gICAgICAgICAgICAgICAgICAgIGRhdGFfcHJvcHNbZGF0YV9wcm9wLnNsb3RdID0gZGF0YV9wcm9wLnZhbHVlXG5cbiAgICAgICAgICAgICAgICBib2FyZF9uZXcuYWRkKFMobmFtZSksIGdsb2JhbFtrbGFzc10sIEQoZGF0YV9wcm9wcykpXG5cbiAgICAgICAgICAgIHdpcmVzID0geHBhdGguc2VsZWN0KFwiLy93aXJlXCIsIGJvYXJkKVxuICAgICAgICAgICAgZm9yIHdpcmUgaW4gd2lyZXNcbiAgICAgICAgICAgICAgICBzb3VyY2VfbmFtZSA9IHhwYXRoLnNlbGVjdChcInNvdXJjZVwiLCB3aXJlKVswXS5nZXRBdHRyaWJ1dGUoXCJuYW1lXCIpXG4gICAgICAgICAgICAgICAgb3V0bGV0X25hbWUgPSB4cGF0aC5zZWxlY3QoXCJvdXRsZXRcIiwgd2lyZSlbMF0uZ2V0QXR0cmlidXRlKFwibmFtZVwiKVxuICAgICAgICAgICAgICAgIHNpbmtfbmFtZSA9IHhwYXRoLnNlbGVjdChcInNpbmtcIiwgd2lyZSlbMF0uZ2V0QXR0cmlidXRlKFwibmFtZVwiKVxuICAgICAgICAgICAgICAgIGlubGV0X25hbWUgPSB4cGF0aC5zZWxlY3QoXCJpbmxldFwiLCB3aXJlKVswXS5nZXRBdHRyaWJ1dGUoXCJuYW1lXCIpXG5cbiAgICAgICAgICAgICAgICBib2FyZF9uZXcuY29ubmVjdChzb3VyY2VfbmFtZSwgc2lua19uYW1lLCBvdXRsZXRfbmFtZSwgaW5sZXRfbmFtZSlcblxuICAgICAgICAgICAgcmV0dXJuIGJvYXJkX25ld1xuICAgICAgICBlbHNlXG4gICAgICAgICAgICB4bWwgPSAnPD94bWwgdmVyc2lvbiA9IFwiMS4wXCIgc3RhbmRhbG9uZT1cInllc1wiPz4nXG4gICAgICAgICAgICBpZiBAc3ltYm9sP1xuICAgICAgICAgICAgICAgIGJvYXJkX25hbWUgPSBAc3ltYm9sLm5hbWVcbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICBib2FyZF9uYW1lID0gXCJiXCJcbiAgICAgICAgICAgIHhtbCArPSBcIjxib2FyZCBuYW1lPScje2JvYXJkX25hbWV9Jz5cIlxuICAgICAgICAgICAgeG1sICs9IFwiPEJ1cyBjbGFzcz0nI3tAYnVzLmNvbnN0cnVjdG9yLm5hbWV9Jy8+XCJcbiAgICAgICAgICAgIHhtbCArPSBcIjxTdG9yZSBjbGFzcz0nI3tAc3RvcmUuY29uc3RydWN0b3IubmFtZX0nLz5cIlxuICAgICAgICAgICAgeG1sICs9IFwiPFdpcmUgY2xhc3M9JyN7QHdpcmVDbGFzcy5uYW1lfScvPlwiXG4gICAgICAgICAgICBmb3Igc3lzIGluIEBzeXN0ZW1zLnN5bWJvbHMoKVxuICAgICAgICAgICAgICAgIGlmIHN5cy5uYW1lIG5vdCBpbiBbXCJ3aXJlc1wiLCBcInN0b3JlXCJdXG4gICAgICAgICAgICAgICAgICAgIHhtbCArPSBzeXMub2JqZWN0LnNlcmlhbGl6ZSgpXG4gICAgICAgICAgICBmb3IgY29ubiBpbiBAd2lyZXMuc3ltYm9scygpXG4gICAgICAgICAgICAgICAgeG1sICs9IGNvbm4ub2JqZWN0LnNlcmlhbGl6ZSgpXG4gICAgICAgICAgICB4bWwgKz0gXCI8L2JvYXJkPlwiXG5cblxuICAgIGNvbm5lY3Q6IChzb3VyY2UsIHNpbmssIG91dGxldCwgaW5sZXQsIHN5bWJvbCkgLT5cbiAgICAgICAgd2lyZSA9IG5ldyBAd2lyZUNsYXNzKHRoaXMsIHNvdXJjZSwgc2luaywgb3V0bGV0LCBpbmxldClcbiAgICAgICAgaWYgIXN5bWJvbFxuICAgICAgICAgICAgbmFtZSA9IEBidXMuZ2Vuc3ltKFwid2lyZVwiKVxuICAgICAgICAgICAgc3ltYm9sID0gbmV3IFN5bWJvbChuYW1lKVxuICAgICAgICBAd2lyZXMuYmluZChzeW1ib2wsIHdpcmUpXG5cbiAgICAgICAgZm9yIHNvdXJjZV9vdXRsZXQgaW4gd2lyZS5zb3VyY2Uub2JqZWN0Lm91dGxldHMuc3ltYm9scygpXG4gICAgICAgICAgICBpZiBzb3VyY2Vfb3V0bGV0Lm5hbWUgaXMgd2lyZS5vdXRsZXQubmFtZVxuICAgICAgICAgICAgICAgIHNvdXJjZV9vdXRsZXQub2JqZWN0LnB1c2goc3ltYm9sKVxuXG4gICAgcGlwZTogKHNvdXJjZSwgd2lyZSwgc2luaykgLT5cbiAgICAgICAgQGNvbm5lY3Qoc291cmNlLCBzaW5rLCB3aXJlKVxuXG4gICAgZGlzY29ubmVjdDogKG5hbWUpIC0+XG4gICAgICAgIHdpcmUgPSBAd2lyZShuYW1lKVxuICAgICAgICBAd2lyZXMudW5iaW5kKG5hbWUpXG5cbiAgICAgICAgZm9yIG91dGxldCBpbiB3aXJlLnNvdXJjZS5vYmplY3Qub3V0bGV0cy5zeW1ib2xzKClcbiAgICAgICAgICAgIGlmIG91dGxldC5uYW1lIGlzIHdpcmUub3V0bGV0Lm5hbWVcbiAgICAgICAgICAgICAgICB3aXJlcyA9IFtdXG4gICAgICAgICAgICAgICAgZm9yIGNvbm4gaW4gb3V0bGV0Lm9iamVjdFxuICAgICAgICAgICAgICAgICAgICBpZiBjb25uLm5hbWUgIT0gbmFtZVxuICAgICAgICAgICAgICAgICAgICAgICAgd2lyZXMucHVzaChjb25uKVxuICAgICAgICAgICAgICAgIG91dGxldC5vYmplY3QgPSB3aXJlc1xuXG5cbiAgICB3aXJlOiAobmFtZSkgLT5cbiAgICAgICAgQHdpcmVzLm9iamVjdChuYW1lKVxuXG4gICAgaGFzd2lyZTogKG5hbWUpIC0+XG4gICAgICAgIEB3aXJlcy5oYXMobmFtZSlcblxuICAgIGFkZDogKHN5bWJvbCwgc3lzdGVtQ2xhc3MsIGNvbmYpIC0+XG4gICAgICAgIHN5c3RlbSA9IG5ldyBzeXN0ZW1DbGFzcyh0aGlzLCBjb25mKVxuICAgICAgICBAYnVzLmJpbmQoc3ltYm9sLCBzeXN0ZW0pXG5cbiAgICBoYXM6IChuYW1lKSAtPlxuICAgICAgICBAYnVzLmhhcyhuYW1lKVxuXG4gICAgc3lzdGVtOiAobmFtZSkgLT5cbiAgICAgICAgQGJ1cy5vYmplY3QobmFtZSlcblxuICAgIHJlbW92ZTogKG5hbWUpIC0+XG4gICAgICAgIHN5c3RlbSA9IEBidXMub2JqZWN0KG5hbWUpXG4gICAgICAgIHN5c3RlbS5wdXNoKEBTVE9QKVxuICAgICAgICBAYnVzLnVuYmluZChuYW1lKVxuXG5leHBvcnRzLlN5bWJvbCA9IFN5bWJvbFxuZXhwb3J0cy5OYW1lU3BhY2UgPSBOYW1lU3BhY2VcbmV4cG9ydHMuUyA9IFNcbmV4cG9ydHMuRGF0YSA9IERhdGFcbmV4cG9ydHMuRCA9IERcbmV4cG9ydHMuU2lnbmFsID0gU2lnbmFsXG5leHBvcnRzLkV2ZW50ID0gRXZlbnRcbmV4cG9ydHMuR2xpdGNoID0gR2xpdGNoXG5leHBvcnRzLkcgPSBHXG5leHBvcnRzLlRva2VuID0gVG9rZW5cbmV4cG9ydHMuc3RhcnQgPSBzdGFydFxuZXhwb3J0cy5zdG9wID0gc3RvcFxuZXhwb3J0cy5UID0gVFxuZXhwb3J0cy5QYXJ0ID0gUGFydFxuZXhwb3J0cy5QID0gUFxuZXhwb3J0cy5FbnRpdHkgPSBFbnRpdHlcbmV4cG9ydHMuRSA9IEVcbmV4cG9ydHMuQ2VsbCA9IENlbGxcbmV4cG9ydHMuQyA9IENcbmV4cG9ydHMuU3lzdGVtID0gU3lzdGVtXG5leHBvcnRzLldpcmUgPSBXaXJlXG5leHBvcnRzLlN0b3JlID0gU3RvcmVcbmV4cG9ydHMuQnVzID0gQnVzXG5leHBvcnRzLk1pcnJvciA9IE1pcnJvclxuZXhwb3J0cy5Cb2FyZCA9IEJvYXJkXG5cbiJdLCJzb3VyY2VSb290IjoiL3NvdXJjZS8ifQ==