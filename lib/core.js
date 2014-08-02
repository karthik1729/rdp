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
      xml += "<scalar type='" + type + "'>" + (scalar.toString()) + "</scalar>";
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

  Data.prototype.serialize = function() {
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

  System.prototype.serialize = function() {
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

  Bus.prototype.trigger = function(signal) {
    var obj, _i, _len, _ref, _results;
    _ref = this.objects();
    _results = [];
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      obj = _ref[_i];
      if (obj instanceof System) {
        _results.push(obj.interrupt(signal));
      } else {
        _results.push(void 0);
      }
    }
    return _results;
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29yZS5qcyIsInNvdXJjZXMiOlsiY29yZS5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsSUFBQSwrTEFBQTtFQUFBOzs7aVNBQUE7O0FBQUEsSUFBQSxHQUFPLE9BQUEsQ0FBUSxXQUFSLENBQVAsQ0FBQTs7QUFBQSxNQUNBLEdBQVMsT0FBQSxDQUFRLFFBQVIsQ0FEVCxDQUFBOztBQUFBLEtBRUEsR0FBUSxPQUFBLENBQVEsT0FBUixDQUZSLENBQUE7O0FBQUEsS0FHQSxHQUFRLE9BQUEsQ0FBUSxPQUFSLENBSFIsQ0FBQTs7QUFBQSxHQUlBLEdBQU0sT0FBQSxDQUFRLFFBQVIsQ0FBaUIsQ0FBQyxTQUp4QixDQUFBOztBQUFBLFFBS0EsR0FBVyxPQUFBLENBQVEsV0FBUixDQUFvQixDQUFDLFFBTGhDLENBQUE7O0FBQUE7QUFTaUIsRUFBQSxnQkFBRSxJQUFGLEVBQVMsTUFBVCxFQUFrQixFQUFsQixFQUFzQixLQUF0QixHQUFBO0FBQ1QsSUFEVSxJQUFDLENBQUEsT0FBQSxJQUNYLENBQUE7QUFBQSxJQURpQixJQUFDLENBQUEsU0FBQSxNQUNsQixDQUFBO0FBQUEsSUFEMEIsSUFBQyxDQUFBLEtBQUEsRUFDM0IsQ0FBQTtBQUFBLElBQUEsSUFBRyxhQUFIO0FBQ0ksTUFBQSxJQUFDLENBQUEsS0FBRCxDQUFPLEtBQVAsQ0FBQSxDQURKO0tBRFM7RUFBQSxDQUFiOztBQUFBLG1CQUlBLElBQUEsR0FBTSxTQUFDLENBQUQsRUFBSSxDQUFKLEdBQUE7QUFDRixJQUFBLElBQUcsU0FBSDtBQUNJLE1BQUEsSUFBRSxDQUFBLENBQUEsQ0FBRixHQUFPLENBQVAsQ0FBQTthQUNBLElBQUUsQ0FBQSxDQUFBLEVBRk47S0FBQSxNQUFBO2FBSUksSUFBRSxDQUFBLENBQUEsRUFKTjtLQURFO0VBQUEsQ0FKTixDQUFBOztBQUFBLG1CQVdBLEVBQUEsR0FBSSxTQUFBLEdBQUE7QUFDQSxRQUFBLE9BQUE7QUFBQSxJQURDLGtCQUFHLDhEQUNKLENBQUE7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QTJ1Qk8sQ0FBQyxLQUFSLEdBQWdCLEtBM3VCaEIsQ0FBQTs7QUFBQSxPQTR1Qk8sQ0FBQyxNQUFSLEdBQWlCLE1BNXVCakIsQ0FBQTs7QUFBQSxPQTZ1Qk8sQ0FBQyxDQUFSLEdBQVksQ0E3dUJaLENBQUE7O0FBQUEsT0E4dUJPLENBQUMsS0FBUixHQUFnQixLQTl1QmhCLENBQUE7O0FBQUEsT0ErdUJPLENBQUMsS0FBUixHQUFnQixLQS91QmhCLENBQUE7O0FBQUEsT0FndkJPLENBQUMsSUFBUixHQUFlLElBaHZCZixDQUFBOztBQUFBLE9BaXZCTyxDQUFDLENBQVIsR0FBWSxDQWp2QlosQ0FBQTs7QUFBQSxPQWt2Qk8sQ0FBQyxJQUFSLEdBQWUsSUFsdkJmLENBQUE7O0FBQUEsT0FtdkJPLENBQUMsQ0FBUixHQUFZLENBbnZCWixDQUFBOztBQUFBLE9Bb3ZCTyxDQUFDLE1BQVIsR0FBaUIsTUFwdkJqQixDQUFBOztBQUFBLE9BcXZCTyxDQUFDLENBQVIsR0FBWSxDQXJ2QlosQ0FBQTs7QUFBQSxPQXN2Qk8sQ0FBQyxJQUFSLEdBQWUsSUF0dkJmLENBQUE7O0FBQUEsT0F1dkJPLENBQUMsQ0FBUixHQUFZLENBdnZCWixDQUFBOztBQUFBLE9Bd3ZCTyxDQUFDLE1BQVIsR0FBaUIsTUF4dkJqQixDQUFBOztBQUFBLE9BeXZCTyxDQUFDLElBQVIsR0FBZSxJQXp2QmYsQ0FBQTs7QUFBQSxPQTB2Qk8sQ0FBQyxLQUFSLEdBQWdCLEtBMXZCaEIsQ0FBQTs7QUFBQSxPQTJ2Qk8sQ0FBQyxHQUFSLEdBQWMsR0EzdkJkLENBQUE7O0FBQUEsT0E0dkJPLENBQUMsTUFBUixHQUFpQixNQTV2QmpCLENBQUE7O0FBQUEsT0E2dkJPLENBQUMsS0FBUixHQUFnQixLQTd2QmhCLENBQUEiLCJzb3VyY2VzQ29udGVudCI6WyJ1dWlkID0gcmVxdWlyZSBcIm5vZGUtdXVpZFwiIFxubG9kYXNoID0gcmVxdWlyZSBcImxvZGFzaFwiXG5jbG9uZSA9IHJlcXVpcmUgXCJjbG9uZVwiXG54cGF0aCA9IHJlcXVpcmUgXCJ4cGF0aFwiXG5kb20gPSByZXF1aXJlKFwieG1sZG9tXCIpLkRPTVBhcnNlclxuZG9tMnByb3AgPSByZXF1aXJlKFwiLi9oZWxwZXJzXCIpLmRvbTJwcm9wXG5cbmNsYXNzIFN5bWJvbFxuXG4gICAgY29uc3RydWN0b3I6IChAbmFtZSwgQG9iamVjdCwgQG5zLCBhdHRycykgLT5cbiAgICAgICAgaWYgYXR0cnM/XG4gICAgICAgICAgICBAYXR0cnMoYXR0cnMpXG5cbiAgICBhdHRyOiAoaywgdikgLT5cbiAgICAgICAgaWYgdj9cbiAgICAgICAgICAgIEBba10gPSB2XG4gICAgICAgICAgICBAW2tdXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIEBba11cblxuICAgIG9wOiAoZiwgYXJncy4uLikgLT5cbiAgICAgICAgcmV0dXJuIGYuYXBwbHkodGhpcywgYXJncylcblxuICAgIGF0dHJzOiAoa3YpIC0+XG4gICAgICAgIGZvciBrLCB2IGluIGt2XG4gICAgICAgICAgICBAW2tdID0gdlxuXG4gICAgaXM6IChzeW1ib2wpIC0+XG4gICAgICAgIGlmIHN5bWJvbC5uYW1lIGlzIEBuYW1lXG4gICAgICAgICAgICBpZiBzeW1ib2wub2JqZWN0IGlzIEBvYmplY3RcbiAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZVxuICAgICAgICAgICAgaWYgKHN5bWJvbC5vYmplY3QgaXMgbnVsbCkgYW5kIChAb2JqZWN0IGlzIG51bGwpXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRydWVcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlXG5cbiAgICB0b1N0cmluZzogLT5cbiAgICAgICBpZiBAbnM/XG4gICAgICAgICAgIHJldHVybiBAbnMubmFtZSArIEBucy5zZXAgKyBAbmFtZVxuICAgICAgICBlbHNlXG4gICAgICAgICAgIHJldHVybiBAbmFtZVxuXG5cblMgPSAobmFtZSwgb2JqZWN0LCBucywgYXR0cnMpIC0+XG4gICAgcmV0dXJuIG5ldyBTeW1ib2wobmFtZSwgb2JqZWN0LCBucywgYXR0cnMpXG5cbiMgc2hvdWxkIGJlIGEgc2V0XG5cbmNsYXNzIE5hbWVTcGFjZVxuXG4gICAgY29uc3RydWN0b3I6IChAbmFtZSwgc2VwKSAtPlxuICAgICAgICBAZWxlbWVudHMgPSB7fVxuICAgICAgICBAc2VwID0gc2VwIHx8IFwiLlwiXG4gICAgICAgIEBfX2dlbnN5bSA9IDBcblxuICAgIGJpbmQ6IChzeW1ib2wsIG9iamVjdCwgY2xhc3NfbmFtZSkgLT5cbiAgICAgICAgc3ltYm9sLmNsYXNzID0gY2xhc3NfbmFtZSB8fCBvYmplY3QuY29uc3RydWN0b3IubmFtZVxuICAgICAgICBuYW1lID0gc3ltYm9sLm5hbWVcbiAgICAgICAgc3ltYm9sLm9iamVjdCA9IG9iamVjdFxuICAgICAgICBvYmplY3Quc3ltYm9sID0gc3ltYm9sXG4gICAgICAgIEBlbGVtZW50c1tuYW1lXSA9IHN5bWJvbFxuICAgICAgICBzeW1ib2wubnMgPSB0aGlzXG4gICAgICAgIHN5bWJvbFxuXG4gICAgdW5iaW5kOiAobmFtZSkgLT5cbiAgICAgICAgc3ltYm9sID0gQGVsZW1lbnRzW25hbWVdXG4gICAgICAgIGRlbGV0ZSBAZWxlbWVudHNbbmFtZV1cbiAgICAgICAgc3ltYm9sLm5zID0gdW5kZWZpbmVkXG4gICAgICAgIHN5bWJvbC5vYmplY3QgPSB1bmRlZmluZWRcbiAgICAgICAgc3ltYm9sLmNsYXNzID0gdW5kZWZpbmVkXG5cbiAgICBzeW1ib2w6IChuYW1lKSAtPlxuICAgICAgICBpZiBAaGFzKG5hbWUpXG4gICAgICAgICAgICBAZWxlbWVudHNbbmFtZV1cbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgUyhcIk5vdEZvdW5kXCIpXG5cbiAgICBoYXM6IChuYW1lKSAtPlxuICAgICAgICBpZiBAZWxlbWVudHNbbmFtZV0/XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZVxuICAgICAgICBlbHNlXG4gICAgICAgICAgICByZXR1cm4gZmFsc2VcblxuICAgIG9iamVjdDogKG5hbWUpIC0+XG4gICAgICAgIGlmIEBoYXMobmFtZSlcbiAgICAgICAgICAgIEBlbGVtZW50c1tuYW1lXS5vYmplY3RcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgRyhcIk5vdEZvdW5kXCIpXG5cbiAgICBzeW1ib2xzOiAoKSAtPlxuICAgICAgIHN5bWJvbHMgPSBbXVxuXG4gICAgICAgZm9yIGssdiBvZiBAZWxlbWVudHNcbiAgICAgICAgICAgc3ltYm9scy5wdXNoKHYpXG5cbiAgICAgICBzeW1ib2xzXG5cbiAgICBvYmplY3RzOiAoKSAtPlxuICAgICAgIG9iamVjdHMgPSBbXVxuXG4gICAgICAgZm9yIGssdiBvZiBAZWxlbWVudHNcbiAgICAgICAgICAgb2JqZWN0cy5wdXNoKHYub2JqZWN0KVxuXG4gICAgICAgb2JqZWN0c1xuXG4gICAgZ2Vuc3ltOiAocHJlZml4KSAtPlxuICAgICAgICBwcmVmaXggPSBwcmVmaXggfHwgXCJnZW5zeW1cIlxuICAgICAgICBwcmVmaXggKyBcIjpcIiArIChAX19nZW5zeW0rKylcblxuXG5jbGFzcyBEYXRhXG5cbiAgICBjb25zdHJ1Y3RvcjogKHByb3BzKSAtPlxuICAgICAgICBAX19zbG90cyA9IFtdXG4gICAgICAgIGlmIHByb3BzP1xuICAgICAgICAgICAgQHByb3BzKHByb3BzKVxuXG4gICAgaXM6IChkYXRhKSAtPlxuICAgICAgICBhbGxfc2xvdHMgPSBAc2xvdHMoKVxuICAgICAgICBmb3IgbmFtZSBpbiBkYXRhLnNsb3RzKClcbiAgICAgICAgICAgIGlmIGRhdGEuc2xvdChuYW1lKSAhPSBAc2xvdChuYW1lKVxuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZVxuXG4gICAgICAgIHJldHVybiB0cnVlXG5cbiAgICBwcm9wOiAoaywgdikgLT5cbiAgICAgICAgQHNsb3Qoayx2KVxuXG4gICAgcHJvcHM6IChrdikgLT5cbiAgICAgICAgaWYga3ZcbiAgICAgICAgICAgIGZvciBrLCB2IG9mIGt2XG4gICAgICAgICAgICAgICAgQFtrXSA9IHZcbiAgICAgICAgICAgICAgICBpZiBrIG5vdCBpbiBAc2xvdHMoKVxuICAgICAgICAgICAgICAgICAgICBAc2xvdHMoaylcbiAgICAgICAgICAgIHJldHVybiBAdmFsaWRhdGUoKVxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBwcm9wZXJ0aWVzID0gW11cbiAgICAgICAgICAgIGZvciBuYW1lIGluIEBzbG90cygpXG4gICAgICAgICAgICAgICAgcHJvcGVydGllcy5wdXNoKEBbbmFtZV0pXG4gICAgICAgICAgICByZXR1cm4gcHJvcGVydGllc1xuXG4gICAgc2xvdHM6IChuYW1lKSAtPlxuICAgICAgICBpZiBuYW1lP1xuICAgICAgICAgICAgQF9fc2xvdHMucHVzaChuYW1lKVxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBAX19zbG90c1xuXG4gICAgc2xvdDogKG5hbWUsIHZhbHVlKSAtPlxuICAgICAgICBpZiB2YWx1ZT9cbiAgICAgICAgICAgIEBbbmFtZV0gPSB2YWx1ZVxuICAgICAgICAgICAgaWYgbmFtZSBub3QgaW4gQHNsb3RzKClcbiAgICAgICAgICAgICAgICBAc2xvdHMobmFtZSlcbiAgICAgICAgICAgIGlmIEB2YWxpZGF0ZSgpXG4gICAgICAgICAgICAgICAgcmV0dXJuIHZhbHVlXG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgRyhcIkludmFsaWRcIilcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgaWYgQGhhcyhuYW1lKVxuICAgICAgICAgICAgICAgIEBbbmFtZV1cbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICBHKFwiTm90Rm91bmRcIilcblxuICAgIGRlbDogKG5hbWUpIC0+XG4gICAgICAgIGlmIEBoYXMobmFtZSlcbiAgICAgICAgICAgIHNsb3RzX29sZCA9IEBfX3Nsb3RzXG4gICAgICAgICAgICBAX19zbG90cyA9IFtdXG4gICAgICAgICAgICBmb3IgbiBpbiBzbG90c19vbGRcbiAgICAgICAgICAgICAgICBpZiBuICE9IG5hbWVcbiAgICAgICAgICAgICAgICAgICAgQF9fc2xvdHMucHVzaChuKVxuXG4gICAgICAgICAgICBkZWxldGUgQFtuYW1lXVxuXG5cbiAgICBoYXM6IChuYW1lKSAtPlxuICAgICAgICBpZiBuYW1lIGluIEBzbG90cygpXG4gICAgICAgICAgICByZXR1cm4gdHJ1ZVxuICAgICAgICBlbHNlXG4gICAgICAgICAgICByZXR1cm4gZmFsc2VcblxuICAgIHZhbGlkYXRlOiAtPlxuICAgICAgICB0cnVlXG5cbiAgICBfX3NlcmlhbGl6ZV9zY2FsYXI6IChzY2FsYXIpIC0+XG4gICAgICAgIHhtbCA9IFwiXCJcbiAgICAgICAgaWYgQXJyYXkuaXNBcnJheShzY2FsYXIpXG4gICAgICAgICAgICB0eXBlID0gXCJhcnJheVwiXG4gICAgICAgICAgICB4bWwgKz0gXCI8c2NhbGFyIHR5cGU9JyN7dHlwZX0nPlwiXG4gICAgICAgICAgICB4bWwgKz0gXCI8bGlzdD5cIlxuICAgICAgICAgICAgZm9yIGUgaW4gc2NhbGFyXG4gICAgICAgICAgICAgICAgeG1sICs9IEBfX3NlcmlhbGl6ZV9zY2FsYXIoZSlcbiAgICAgICAgICAgIHhtbCArPSBcIjwvbGlzdD5cIlxuICAgICAgICAgICAgeG1sICs9IFwiPC9zY2FsYXI+XCJcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgdHlwZSA9IHR5cGVvZiBzY2FsYXJcbiAgICAgICAgICAgIHhtbCArPSBcIjxzY2FsYXIgdHlwZT0nI3t0eXBlfSc+I3tzY2FsYXIudG9TdHJpbmcoKX08L3NjYWxhcj5cIlxuICAgICAgICB4bWxcblxuICAgIGluaXQ6ICh4bWwpIC0+XG4gICAgICAgIGRvYyA9IG5ldyBkb20oKS5wYXJzZUZyb21TdHJpbmcoeG1sKVxuICAgICAgICBwcm9wcyA9IHhwYXRoLnNlbGVjdChcInByb3BlcnR5XCIsIGRvYylcbiAgICAgICAgZm9yIHByb3AgaW4gcHJvcHNcbiAgICAgICAgICAgIGRhdGFfcHJvcCA9IGRvbTJwcm9wKHByb3ApXG4gICAgICAgICAgICBAcHJvcChkYXRhX3Byb3Auc2xvdCwgZGF0YV9wcm9wLnZhbHVlKVxuXG5cbiAgICBzZXJpYWxpemU6IC0+XG4gICAgICAgIHhtbCA9IFwiXCJcbiAgICAgICAgZm9yIG5hbWUgaW4gQHNsb3RzKClcbiAgICAgICAgICAgIHhtbCArPSBcIjxwcm9wZXJ0eSBzbG90PScje25hbWV9Jz5cIlxuICAgICAgICAgICAgc2NhbGFyICA9IEBzbG90KG5hbWUpXG4gICAgICAgICAgICB4bWwgKz0gQF9fc2VyaWFsaXplX3NjYWxhcihzY2FsYXIpXG4gICAgICAgICAgICB4bWwgKz0gJzwvcHJvcGVydHk+J1xuICAgICAgICB4bWxcblxuRCA9IChwcm9wcykgLT5cbiAgICByZXR1cm4gbmV3IERhdGEocHJvcHMpXG5cbmNsYXNzIFNpZ25hbCBleHRlbmRzIERhdGFcblxuICAgIGNvbnN0cnVjdG9yOiAobmFtZSwgcGF5bG9hZCwgcHJvcHMpIC0+XG4gICAgICAgIHByb3BzID0gcHJvcHMgfHwge31cbiAgICAgICAgcHJvcHMubmFtZSA9IG5hbWVcbiAgICAgICAgcHJvcHMucGF5bG9hZCA9IHBheWxvYWRcbiAgICAgICAgc3VwZXIocHJvcHMpXG5cbmNsYXNzIEV2ZW50IGV4dGVuZHMgU2lnbmFsXG5cbiAgICBjb25zdHJ1Y3RvcjogKG5hbWUsIHBheWxvYWQsIHByb3BzKSAtPlxuICAgICAgICBwcm9wcyA9IHByb3BzIHx8IHt9XG4gICAgICAgIHBvcHMudHMgPSBuZXcgRGF0ZSgpLmdldFRpbWUoKVxuICAgICAgICBzdXBlcihuYW1lLCBwYXlsb2FkLCBwcm9wcylcblxuY2xhc3MgR2xpdGNoIGV4dGVuZHMgRGF0YVxuXG4gICAgY29uc3RydWN0b3I6IChuYW1lLCBjb250ZXh0LCBwcm9wcykgLT5cbiAgICAgICAgcHJvcHMgPSBwcm9wcyB8fCB7fVxuICAgICAgICBwcm9wcy5uYW1lID0gbmFtZVxuICAgICAgICBwcm9wcy5jb250ZW54dCA9IGNvbnRleHRcbiAgICAgICAgc3VwZXIocHJvcHMpXG5cbkcgPSAobmFtZSwgcHJvcHMpIC0+XG4gICAgcmV0dXJuIG5ldyBHbGl0Y2gobmFtZSwgcHJvcHMpXG5cbmNsYXNzIFRva2VuIGV4dGVuZHMgRGF0YVxuXG4gICAgY29uc3RydWN0b3I6ICh2YWx1ZSwgc2lnbiwgcHJvcHMpICAtPlxuICAgICAgICBzdXBlcihwcm9wcylcbiAgICAgICAgQHNpZ25zID0gW11cbiAgICAgICAgQHZhbHVlcyA9IFtdXG4gICAgICAgIGlmIHZhbHVlP1xuICAgICAgICAgICAgQHN0YW1wKHNpZ24sIHZhbHVlKVxuXG4gICAgaXM6ICh0KSAtPlxuICAgICAgICBmYWxzZVxuXG4gICAgdmFsdWU6IC0+XG4gICAgICAgIEBwcm9wKFwidmFsdWVcIilcblxuICAgIHN0YW1wX2J5OiAoaW5kZXgpIC0+XG4gICAgICAgIGlmIGluZGV4P1xuICAgICAgICAgICBpZiBAc2lnbnNbaW5kZXhdP1xuICAgICAgICAgICAgICAgcmV0dXJuIEBzaWduc1tpbmRleF1cbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgIHJldHVybiBTKFwiTm90Rm91bmRcIilcblxuICAgICAgICBpZiBAc2lnbnMubGVuZ3RoID4gMFxuICAgICAgICAgICByZXR1cm4gQHNpZ25zW0BzaWducy5sZW5ndGggLSAxXVxuICAgICAgICBlbHNlXG4gICAgICAgICAgIHJldHVybiBTKFwiTm90Rm91bmRcIilcblxuICAgIHN0YW1wOiAoc2lnbiwgdmFsdWUpIC0+XG4gICAgICAgIGlmIHZhbHVlP1xuICAgICAgICAgICAgaWYgQGhhcyhcInZhbHVlXCIpXG4gICAgICAgICAgICAgICAgb2xkX3ZhbHVlID0gQHByb3AoXCJ2YWx1ZVwiKVxuICAgICAgICAgICAgICAgIEBkZWwoXCJ2YWx1ZVwiKVxuICAgICAgICAgICAgICAgIEBkZWwodmFsdWUpXG4gICAgICAgICAgICBAcHJvcChcInZhbHVlXCIsIHZhbHVlKVxuICAgICAgICAgICAgaWYgdHlwZW9mIHZhbHVlIGlzIFwic3RyaW5nXCJcbiAgICAgICAgICAgICAgICBAcHJvcCh2YWx1ZSwgdHJ1ZSlcbiAgICAgICAgICAgIEB2YWx1ZXMucHVzaCh2YWx1ZSlcbiAgICAgICAgaWYgc2lnblxuICAgICAgICAgICAgQHNpZ25zLnB1c2goc2lnbilcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgQHNpZ25zLnB1c2goUyhcIlVua25vd25cIikpXG5cblxuc3RhcnQgPSAoc2lnbiwgcHJvcHMpIC0+XG4gICAgcmV0dXJuIG5ldyBUb2tlbihcInN0YXJ0XCIsIHNpZ24sIHByb3BzKVxuXG5zdG9wID0gKHNpZ24sIHByb3BzKSAtPlxuICAgIHJldHVybiBuZXcgVG9rZW4oXCJzdG9wXCIsIHNpZ24sIHByb3BzKVxuXG5UID0gKHZhbHVlLCBzaWduLCBwcm9wcykgLT5cbiAgICByZXR1cm4gbmV3IFRva2VuKHZhbHVlLCBzaWduLCBwcm9wcylcblxuY2xhc3MgUGFydCBleHRlbmRzIERhdGFcblxuICAgIGNvbnN0cnVjdG9yOiAoQG5hbWUsIHByb3BzKSAtPlxuICAgICAgICBzdXBlcihwcm9wcylcblxuICAgIHNlcmlhbGl6ZTogLT5cbiAgICAgICAgeG1sICs9IFwiPHBhcnQgbmFtZT0nI3tAbmFtZX0nPlwiXG4gICAgICAgIHhtbCArPSBzdXBlcigpXG4gICAgICAgIHhtbCArPSAnPC9wYXJ0PidcblxuUCA9IChuYW1lLCBwcm9wcykgLT5cbiAgICByZXR1cm4gbmV3IFBhcnQobmFtZSwgcHJvcHMpXG5cbmNsYXNzIEVudGl0eSBleHRlbmRzIERhdGFcblxuICAgIGNvbnN0cnVjdG9yOiAodGFncywgcHJvcHMpIC0+XG4gICAgICAgIEBwYXJ0cyA9IG5ldyBOYW1lU3BhY2UoXCJwYXJ0c1wiKVxuICAgICAgICBwcm9wcyA9IHByb3BzIHx8IHt9XG4gICAgICAgIHByb3BzLnRzID0gcHJvcHMudHMgfHwgbmV3IERhdGUoKS5nZXRUaW1lKClcbiAgICAgICAgdGFncyA9IHRhZ3MgfHwgcHJvcHMudGFncyB8fCBbXVxuICAgICAgICBwcm9wcy50YWdzID0gdGFnc1xuICAgICAgICBzdXBlcihwcm9wcylcblxuICAgIGFkZDogKHN5bWJvbCwgcGFydCkgLT5cbiAgICAgICAgQHBhcnRzLmJpbmQoc3ltYm9sLCBwYXJ0KVxuXG4gICAgcmVtb3ZlOiAobmFtZSkgLT5cbiAgICAgICAgQHBhcnRzLnVuYmluZChuYW1lKVxuXG4gICAgaGFzUGFydDogKG5hbWUpIC0+XG4gICAgICAgIEBwYXJ0cy5oYXMobmFtZSlcblxuICAgIHBhcnQ6IChuYW1lKSAtPlxuICAgICAgICBAcGFydHMuc3ltYm9sKG5hbWUpXG5cbiAgICBzZXJpYWxpemU6IC0+XG4gICAgICAgIHhtbCA9IFwiPGVudGl0eT5cIlxuICAgICAgICB4bWwgKz0gJzxwYXJ0cz4nXG4gICAgICAgIGZvciBwYXJ0IG9mIEBwYXJ0cy5vYmplY3RzKClcbiAgICAgICAgICAgIHhtbCArPSBwYXJ0LnNlcmlhbGl6ZSgpXG4gICAgICAgIHhtbCArPSAnPC9wYXJ0cz4nXG4gICAgICAgIHhtbCArPSBzdXBlcigpXG4gICAgICAgIHhtbCArPSAnPC9lbnRpdHk+J1xuXG5FID0gKHRhZ3MsIHByb3BzKSAtPlxuICAgIHJldHVybiBuZXcgRW50aXR5KHRhZ3MsIHByb3BzKVxuXG5jbGFzcyBDZWxsIGV4dGVuZHMgRW50aXR5XG5cbiAgICBjb25zdHJ1Y3RvcjogKHRhZ3MsIHByb3BzKSAtPlxuICAgICAgICBzdXBlcih0YWdzLCBwcm9wcylcbiAgICAgICAgQG9ic2VydmVycz0gbmV3IE5hbWVTcGFjZShcIm9ic2VydmVyc1wiKVxuXG4gICAgbm90aWZ5OiAoZXZlbnQpIC0+XG4gICAgICAgZm9yIG9iIGluIEBvYnNlcnZlcnMub2JqZWN0cygpXG4gICAgICAgICAgICBvYi5pbnRlcnJ1cHQoZXZlbnQpXG5cbiAgICBhZGQ6IChwYXJ0KSAtPlxuICAgICAgICBzdXBlciBwYXJ0XG4gICAgICAgIGV2ZW50ID0gbmV3IEV2ZW50KFwicGFydC1hZGRlZFwiLCB7cGFydDogcGFydCwgY2VsbDogdGhpc30pXG4gICAgICAgIEBub3RpZnkoZXZlbnQpXG5cbiAgICByZW1vdmU6IChuYW1lKSAtPlxuICAgICAgICBzdXBlciBuYW1lXG4gICAgICAgIGV2ZW50ID0gbmV3IEV2ZW50KFwicGFydC1yZW1vdmVkXCIsIHtwYXJ0OiBwYXJ0LCBjZWxsOiB0aGlzfSlcbiAgICAgICAgQG5vdGlmeShldmVudClcblxuICAgIG9ic2VydmU6IChzeW1ib2wsIHN5c3RlbSkgLT5cbiAgICAgICAgQG9ic2VydmVycy5iaW5kKHN5bWJvbCwgc3lzdGVtKVxuXG4gICAgZm9yZ2V0OiAobmFtZSkgLT5cbiAgICAgICAgQG9ic2VydmVycy51bmJpbmQobmFtZSlcblxuICAgIHN0ZXA6IChmbiwgYXJncy4uLikgLT5cbiAgICAgICAgcmV0dXJuIGZuLmFwcGx5KHRoaXMsIGFyZ3MpXG5cbiAgICBjbG9uZTogKCkgLT5cbiAgICAgICAgcmV0dXJuIGNsb25lKHRoaXMpXG5cbkMgPSAodGFncywgcHJvcHMpIC0+XG4gICAgcmV0dXJuIG5ldyBDZWxsKHRhZ3MsIHByb3BzKVxuXG5jbGFzcyBTeXN0ZW1cblxuICAgIGNvbnN0cnVjdG9yOiAoQGIsIGNvbmYpIC0+XG4gICAgICAgIEBpbmxldHMgPSBuZXcgTmFtZVNwYWNlKFwiaW5sZXRzXCIpXG4gICAgICAgIEBpbmxldHMuYmluZChuZXcgU3ltYm9sKFwic3lzaW5cIiksW10pXG4gICAgICAgIEBpbmxldHMuYmluZChuZXcgU3ltYm9sKFwiZmVlZGJhY2tcIiksW10pXG4gICAgICAgIEBvdXRsZXRzID0gbmV3IE5hbWVTcGFjZShcIm91dGxldHNcIilcbiAgICAgICAgQG91dGxldHMuYmluZChuZXcgU3ltYm9sKFwic3lzb3V0XCIpLFtdKVxuICAgICAgICBAb3V0bGV0cy5iaW5kKG5ldyBTeW1ib2woXCJzeXNlcnJcIiksW10pXG4gICAgICAgIEBvdXRsZXRzLmJpbmQobmV3IFN5bWJvbChcImRlYnVnXCIpLFtdKVxuXG4gICAgICAgIEBjb25mID0gY29uZiB8fCBEKClcbiAgICAgICAgQHN0YXRlID0gW11cbiAgICAgICAgQHIgPSB7fVxuXG4gICAgdG9wOiAoaW5kZXgpIC0+XG4gICAgICAgIGlmIGluZGV4P1xuICAgICAgICAgICAgaWYgQHN0YXRlW2luZGV4XT9cbiAgICAgICAgICAgICAgICByZXR1cm4gQHN0YXRlW2luZGV4XVxuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIHJldHVybiBTKFwiTm90Rm91bmRcIilcblxuICAgICAgICBpZiBAc3RhdGUubGVuZ3RoID4gMFxuICAgICAgICAgICAgcmV0dXJuIEBzdGF0ZVtAc3RhdGUubGVuZ3RoIC0gMV1cbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgcmV0dXJuIFMoXCJOb3RGb3VuZFwiKVxuXG4gICAgaW5wdXQ6IChkYXRhLCBpbmxldCkgLT5cbiAgICAgICAgZGF0YVxuXG4gICAgb3V0cHV0OiAoZGF0YSwgb3V0bGV0KSAtPlxuICAgICAgICBkYXRhXG5cbiAgICBTVE9QOiAoc3RvcF90b2tlbikgLT5cblxuICAgIHB1c2g6IChkYXRhLCBpbmxldCkgLT5cbiAgICAgICAgQGIubWlycm9yLnJlbGF5KFwicHVzaFwiLCBAc3ltYm9sLm5hbWUsIGRhdGEsIGlubGV0KVxuXG4gICAgICAgIGlubGV0ID0gaW5sZXQgfHwgQGlubGV0cy5zeW1ib2woXCJzeXNpblwiKVxuXG4gICAgICAgIGlucHV0X2RhdGEgPSBAaW5wdXQoZGF0YSwgaW5sZXQpXG5cbiAgICAgICAgaWYgaW5wdXRfZGF0YSBpbnN0YW5jZW9mIEdsaXRjaFxuICAgICAgICAgICAgQGVycm9yKGlucHV0X2RhdGEpXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIEBwcm9jZXNzIGlucHV0X2RhdGEsIGlubGV0XG5cbiAgICBnb3RvX3dpdGg6IChpbmxldCwgZGF0YSkgLT5cbiAgICAgICAgQHB1c2goZGF0YSwgaW5sZXQpXG5cbiAgICBwcm9jZXNzOiAoZGF0YSwgaW5sZXQpIC0+XG5cbiAgICBkaXNwYXRjaDogKGRhdGEsIG91dGxldCkgLT5cbiAgICAgICAgZm9yIG9sIGluIEBvdXRsZXRzLnN5bWJvbHMoKVxuICAgICAgICAgICAgaWYgb2wubmFtZSA9PSBvdXRsZXQubmFtZVxuICAgICAgICAgICAgICAgIGZvciB3aXJlIGluIG9sLm9iamVjdFxuICAgICAgICAgICAgICAgICAgICB3aXJlLm9iamVjdC50cmFuc21pdCBkYXRhXG5cbiAgICBlbWl0OiAoZGF0YSwgb3V0bGV0KSAtPlxuICAgICAgICBvdXRsZXQgPSBvdXRsZXQgfHwgQG91dGxldHMuc3ltYm9sKFwic3lzb3V0XCIpXG5cbiAgICAgICAgb3V0cHV0X2RhdGEgPSBAb3V0cHV0KGRhdGEsIG91dGxldClcblxuICAgICAgICBpZiBvdXRwdXRfZGF0YSBpbnN0YW5jZW9mIEdsaXRjaFxuICAgICAgICAgICAgQGVycm9yKG91dHB1dF9kYXRhKVxuICAgICAgICAgICAgcmV0dXJuXG5cbiAgICAgICAgQGRpc3BhdGNoKG91dHB1dF9kYXRhLCBvdXRsZXQpXG5cbiAgICBkZWJ1ZzogKGRhdGEpIC0+XG4gICAgICAgIEBkaXNwYXRjaChkYXRhLCBAb3V0bGV0cy5zeW1ib2woXCJkZWJ1Z1wiKSlcblxuICAgIGVycm9yOiAoZGF0YSkgLT5cbiAgICAgICAgQGRpc3BhdGNoKGRhdGEsIEBvdXRsZXRzLnN5bWJvbChcInN5c2VyclwiKSlcblxuICAgIGludGVycnVwdDogKHNpZ25hbCkgLT5cbiAgICAgICAgQGIubWlycm9yLnJlbGF5KFwiaW50ZXJydXB0XCIsIEBzeW1ib2wubmFtZSwgc2lnbmFsKVxuICAgICAgICBAcmVhY3Qoc2lnbmFsKVxuXG4gICAgcmVhY3Q6IChzaWduYWwpIC0+XG5cbiAgICBzaG93OiAoZGF0YSkgLT5cblxuICAgIHNlcmlhbGl6ZTogLT5cbiAgICAgICAgeG1sID0gXCI8c3lzdGVtIG5hbWU9JyN7QHN5bWJvbC5uYW1lfScgY2xhc3M9JyN7QHN5bWJvbC5jbGFzc30nPlwiXG4gICAgICAgIHhtbCArPSBcIjxjb25maWd1cmF0aW9uPlwiXG4gICAgICAgIHhtbCArPSBAY29uZi5zZXJpYWxpemUoKVxuICAgICAgICB4bWwgKz0gXCI8L2NvbmZpZ3VyYXRpb24+XCJcbiAgICAgICAgeG1sICs9IFwiPC9zeXN0ZW0+XCJcbiAgICAgICAgeG1sXG5cblxuY2xhc3MgV2lyZVxuXG4gICAgY29uc3RydWN0b3I6IChAYiwgc291cmNlLCBzaW5rLCBvdXRsZXQsIGlubGV0KSAtPlxuICAgICAgICBvdXRsZXQgPSBvdXRsZXQgfHwgXCJzeXNvdXRcIlxuICAgICAgICBpbmxldCA9IGlubGV0IHx8IFwic3lzaW5cIlxuICAgICAgICBAc291cmNlID0gQGIuc3lzdGVtcy5zeW1ib2woc291cmNlKVxuICAgICAgICBAc2luayA9IEBiLnN5c3RlbXMuc3ltYm9sKHNpbmspXG4gICAgICAgIEBvdXRsZXQgPSBAc291cmNlLm9iamVjdC5vdXRsZXRzLnN5bWJvbChvdXRsZXQpXG4gICAgICAgIEBpbmxldCA9IEBzaW5rLm9iamVjdC5pbmxldHMuc3ltYm9sKGlubGV0KVxuXG4gICAgdHJhbnNtaXQ6IChkYXRhKSAtPlxuICAgICAgICBAc2luay5vYmplY3QucHVzaChkYXRhLCBAaW5sZXQpXG5cbiAgICBzZXJpYWxpemU6IC0+XG4gICAgICAgIHhtbCA9IFwiXCJcbiAgICAgICAgeG1sICs9IFwiPHdpcmUgbmFtZT0nI3tAc3ltYm9sLm5hbWV9Jz5cIlxuICAgICAgICB4bWwgKz0gXCI8c291cmNlIG5hbWU9JyN7QHNvdXJjZS5uYW1lfScvPlwiXG4gICAgICAgIHhtbCArPSBcIjxvdXRsZXQgbmFtZT0nI3tAb3V0bGV0Lm5hbWV9Jy8+XCJcbiAgICAgICAgeG1sICs9IFwiPHNpbmsgbmFtZT0nI3tAc2luay5uYW1lfScvPlwiXG4gICAgICAgIHhtbCArPSBcIjxpbmxldCBuYW1lPScje0BpbmxldC5uYW1lfScvPlwiXG4gICAgICAgIHhtbCArPSBcIjwvd2lyZT5cIlxuICAgICAgICB4bWxcblxuXG5cbmNsYXNzIFN0b3JlXG5cbiAgICBjb25zdHJ1Y3RvcjogLT5cbiAgICAgICAgQGVudGl0aWVzID0gbmV3IE5hbWVTcGFjZShcImVudGl0aWVzXCIpXG5cbiAgICBhZGQ6IChlbnRpdHksIHN5bWJvbCkgLT5cbiAgICAgICAgaWYgbm90IHN5bWJvbFxuICAgICAgICAgICAgbmFtZSA9IEBlbnRpdGllcy5nZW5zeW0oXCJlbnRpdHlcIilcbiAgICAgICAgICAgIHN5bWJvbCA9IG5ldyBTeW1ib2wobmFtZSlcbiAgICAgICAgQGVudGl0aWVzLmJpbmQoc3ltYm9sLCBlbnRpdHkpXG4gICAgICAgIGVudGl0eVxuXG4gICAgc25hcHNob3Q6ICgpIC0+XG4gICAgICAgIHhtbCA9ICc8P3htbCB2ZXJzaW9uID0gXCIxLjBcIiBzdGFuZGFsb25lPVwieWVzXCI/PidcbiAgICAgICAgeG1sICs9IFwiPHNuYXBzaG90PlwiXG4gICAgICAgIGZvciBlbnRpdHkgaW4gQGVudGl0aWVzLm9iamVjdHMoKVxuICAgICAgICAgICAgeG1sICs9IGVudGl0eS5zZXJpYWxpemUoKVxuICAgICAgICB4bWwgKz0gXCI8L3NuYXBzaG90PlwiXG4gICAgICAgIHJldHVybiB4bWxcblxuICAgIG9wOiAoZiwgYXJncy4uLikgLT5cbiAgICAgICAgcmV0dXJuIGYuYXBwbHkodGhpcywgYXJncylcblxuICAgIHJlY292ZXI6ICh4bWwpIC0+XG4gICAgICAgIGRvYyA9IG5ldyBkb20oKS5wYXJzZUZyb21TdHJpbmcoeG1sKVxuICAgICAgICBlbnRpdGllcyA9IHhwYXRoLnNlbGVjdChcIi8vZW50aXR5XCIsIGRvYylcbiAgICAgICAgZW50aXRpZXNfbGlzdCA9IFtdXG4gICAgICAgIGZvciBlbnRpdHkgaW4gZW50aXRpZXNcbiAgICAgICAgICAgIGVudGl0eV9wcm9wcyA9IHt9XG4gICAgICAgICAgICBwcm9wcyA9IHhwYXRoLnNlbGVjdChcInByb3BlcnR5XCIsIGVudGl0eSlcbiAgICAgICAgICAgIGZvciBwcm9wIGluIHByb3BzXG4gICAgICAgICAgICAgICAgZW50aXR5X3Byb3AgPSBkb20ycHJvcChwcm9wKVxuICAgICAgICAgICAgICAgIGVudGl0eV9wcm9wc1tlbnRpdHlfcHJvcC5zbG90XSA9IGVudGl0eV9wcm9wLnZhbHVlXG5cbiAgICAgICAgICAgIG5ld19lbnRpdHkgPSBuZXcgRW50aXR5KG51bGwsIGVudGl0eV9wcm9wcylcblxuICAgICAgICAgICAgcGFydHMgPSB4cGF0aC5zZWxlY3QoXCJwYXJ0XCIsIGVudGl0eSlcbiAgICAgICAgICAgIGZvciBwYXJ0IGluIHBhcnRzXG4gICAgICAgICAgICAgICAgbmFtZSA9IHBhcnQuZ2V0QXR0cmlidXRlKFwibmFtZVwiKVxuICAgICAgICAgICAgICAgIHBhcnRfcHJvcHMgPSB7fVxuICAgICAgICAgICAgICAgIHByb3BzID0geHBhdGguc2VsZWN0KFwicHJvcGVydHlcIiwgcGFydClcbiAgICAgICAgICAgICAgICBmb3IgcHJvcCBpbiBwcm9wc1xuICAgICAgICAgICAgICAgICAgICBwYXJ0X3Byb3AgPSBkb20ycHJvcChwcm9wKVxuICAgICAgICAgICAgICAgICAgICBwYXJ0X3Byb3BzW3BhcnRfcHJvcC5zbG90XSA9IHBhcnRfcHJvcC52YWx1ZVxuICAgICAgICAgICAgICAgIGVudGl0eV9wYXJ0ID0gbmV3IFBhcnQobmFtZSwgcGFydF9wcm9wcylcbiAgICAgICAgICAgICAgICBuZXdfZW50aXR5LmFkZChlbnRpdHlfcGFydClcblxuICAgICAgICAgICAgZW50aXRpZXNfbGlzdC5wdXNoKG5ld19lbnRpdHkpXG5cbiAgICAgICAgQGVudGl0aWVzID0gbmV3IE5hbWVTcGFjZShcImVudGl0aWVzXCIpXG4gICAgICAgIGZvciBlbnRpdHkgaW4gZW50aXRpZXNfbGlzdFxuICAgICAgICAgICAgQGFkZChlbnRpdHkpXG5cbiAgICBoYXM6IChuYW1lKSAtPlxuICAgICAgICBAZW50aXRpZXMuaGFzKG5hbWUpXG5cbiAgICBlbnRpdHk6IChuYW1lKSAtPlxuICAgICAgICBAZW50aXRpZXMub2JqZWN0KG5hbWUpXG5cbiAgICByZW1vdmU6IChuYW1lKSAtPlxuICAgICAgICBAZW50aXRpZXMudW5iaW5kKG5hbWUpXG5cbiAgICBieV9wcm9wOiAocHJvcCkgLT5cbiAgICAgICAgZW50aXRpZXMgPSBbXVxuICAgICAgICBmb3IgZW50aXR5IGluIEBlbnRpdGllcy5vYmplY3RzKClcbiAgICAgICAgICAgIGlmIGVudGl0eS5oYXMocHJvcC5zbG90KVxuICAgICAgICAgICAgICAgIGVudGl0eV92YWx1ZSA9IGVudGl0eS5zbG90KHByb3Auc2xvdClcbiAgICAgICAgICAgICAgICBpZiBBcnJheS5pc0FycmF5KGVudGl0eV92YWx1ZSlcbiAgICAgICAgICAgICAgICAgICAgaWYgcHJvcC52YWx1ZSBpbiBlbnRpdHlfdmFsdWVcbiAgICAgICAgICAgICAgICAgICAgICAgIGVudGl0aWVzLnB1c2goZW50aXR5KVxuICAgICAgICAgICAgICAgIGVsc2UgaWYgZW50aXR5X3ZhbHVlIGlzIHByb3AudmFsdWVcbiAgICAgICAgICAgICAgICAgICAgZW50aXRpZXMucHVzaChlbnRpdHkpXG5cbiAgICAgICAgaWYgZW50aXRpZXMubGVuZ3RoID4gMFxuICAgICAgICAgICAgcmV0dXJuIGVudGl0aWVzXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIEcoXCJOb3RGb3VuZFwiKVxuXG4gICAgZmlyc3RfYnlfcHJvcDogKHByb3ApIC0+XG4gICAgICAgIGVudGl0aWVzID0gQGJ5X3Byb3AocHJvcClcbiAgICAgICAgaWYgZW50aXRpZXMgaW5zdGFuY2VvZiBHbGl0Y2hcbiAgICAgICAgICAgIHJldHVybiBlbnRpdGllc1xuICAgICAgICBlbHNlXG4gICAgICAgICAgICBlbnRpdGllc1swXVxuXG4gICAgYnlfdGFnczogKHRhZ3MpIC0+XG4gICAgICAgIGVudGl0aWVzID0gW11cbiAgICAgICAgZm9yIGVudGl0eSBpbiBAZW50aXRpZXMub2JqZWN0cygpXG4gICAgICAgICAgICBmb3IgdGFnIGluIHRhZ3NcbiAgICAgICAgICAgICAgICBpZiB0YWcgaW4gZW50aXR5LnRhZ3NcbiAgICAgICAgICAgICAgICAgICAgZW50aXRpZXMucHVzaCBlbnRpdHlcblxuICAgICAgICBpZiBlbnRpdGllcy5sZW5ndGggPiAwXG4gICAgICAgICAgICByZXR1cm4gZW50aXRpZXNcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgRyhcIk5vdEZvdW5kXCIpXG5cbiAgICBmaXJzdF9ieV90YWdzOiAodGFncykgLT5cbiAgICAgICAgZW50aXRpZXMgPSBAYnlfdGFncyh0YWdzKVxuICAgICAgICBpZiBlbnRpdGllcyBpbnN0YW5jZW9mIEdsaXRjaFxuICAgICAgICAgICAgcmV0dXJuIGVudGl0aWVzXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIGVudGl0aWVzWzBdXG5cblxuY2xhc3MgQnVzIGV4dGVuZHMgTmFtZVNwYWNlXG5cbiAgICBjb25zdHJ1Y3RvcjogKEBuYW1lLCBzZXApIC0+XG4gICAgICAgIHN1cGVyKEBuYW1lLCBzZXApXG5cbiAgICB0cmlnZ2VyOiAoc2lnbmFsKSAtPlxuICAgICAgICBmb3Igb2JqIGluIEBvYmplY3RzKClcbiAgICAgICAgICAgIGlmIG9iaiBpbnN0YW5jZW9mIFN5c3RlbVxuICAgICAgICAgICAgICAgIG9iai5pbnRlcnJ1cHQoc2lnbmFsKVxuXG5jbGFzcyBNaXJyb3JcbiAgICBjb25zdHJ1Y3RvcjogKEBiKSAtPlxuXG4gICAgcmVmbGVjdDogKG9wLCBzeXN0ZW0sIGFyZ3MuLi4pIC0+XG4gICAgICAgIHN5cyA9IEBiLnN5c3RlbXMub2JqZWN0KHN5c3RlbSlcbiAgICAgICAgc3lzW29wXS5hcHBseShzeXMsIGFyZ3MpXG5cbiAgICByZWxheTogKG9wLCBzeXN0ZW0sIGFyZ3MuLi4pIC0+XG5cbmNsYXNzIEJvYXJkXG5cbiAgICBjb25zdHJ1Y3RvcjogKHdpcmVDbGFzcywgYnVzQ2xhc3MsIHN0b3JlQ2xhc3MsIG1pcnJvckNsYXNzICkgLT5cbiAgICAgICAgQHdpcmVDbGFzcyA9IHdpcmVDbGFzcyB8fCBXaXJlXG4gICAgICAgIEBidXNDbGFzcyA9IGJ1c0NsYXNzIHx8IEJ1c1xuICAgICAgICBAc3RvcmVDbGFzcyA9IHN0b3JlQ2xhc3MgfHwgU3RvcmVcbiAgICAgICAgQG1pcnJvckNsYXNzID0gbWlycm9yQ2xhc3MgfHwgTWlycm9yXG4gICAgICAgIEBpbml0KClcblxuICAgIGluaXQ6IC0+XG4gICAgICAgIEBidXMgPSBuZXcgQGJ1c0NsYXNzKFwiYnVzXCIpXG4gICAgICAgIEBzdG9yZSA9IG5ldyBAc3RvcmVDbGFzcygpXG4gICAgICAgIEBtaXJyb3IgPSBuZXcgQG1pcnJvckNsYXNzKHRoaXMpXG4gICAgICAgIEBzeXN0ZW1zID0gQGJ1c1xuICAgICAgICBAd2lyZXMgPSBuZXcgTmFtZVNwYWNlKFwid2lyZXNcIilcblxuICAgICAgICBAYnVzLmJpbmQoUyhcInN0b3JlXCIpLCBAc3RvcmUpXG4gICAgICAgIEBidXMuYmluZChTKFwid2lyZXNcIiksIEB3aXJlcylcblxuICAgIHNldHVwOiAoeG1sLCBjbG9uZSkgLT5cbiAgICAgICAgaWYgeG1sP1xuICAgICAgICAgICAgZG9jID0gbmV3IGRvbSgpLnBhcnNlRnJvbVN0cmluZyh4bWwpXG4gICAgICAgICAgICBib2FyZCA9IHhwYXRoLnNlbGVjdChcImJvYXJkXCIsIGRvYylbMF1cbiAgICAgICAgICAgIGJvYXJkX25hbWUgPSBib2FyZC5nZXRBdHRyaWJ1dGUoXCJuYW1lXCIpXG4gICAgICAgICAgICBidXNfY2xhc3MgPSB4cGF0aC5zZWxlY3QoXCJCdXNcIiwgYm9hcmQpWzBdLmdldEF0dHJpYnV0ZShcImNsYXNzXCIpXG4gICAgICAgICAgICBzdG9yZV9jbGFzcyA9IHhwYXRoLnNlbGVjdChcIlN0b3JlXCIsIGJvYXJkKVswXS5nZXRBdHRyaWJ1dGUoXCJjbGFzc1wiKVxuICAgICAgICAgICAgd2lyZV9jbGFzcyA9IHhwYXRoLnNlbGVjdChcIldpcmVcIiwgYm9hcmQpWzBdLmdldEF0dHJpYnV0ZShcImNsYXNzXCIpXG5cbiAgICAgICAgICAgIGlmIGNsb25lP1xuICAgICAgICAgICAgICAgIGJvYXJkX25ldyA9IG5ldyBCb2FyZChib2FyZF9uYW1lLCBnbG9iYWxbd2lyZV9jbGFzc10sIGdsb2JhbFtidXNfY2xhc3NdLCBnbG9iYWxbc3RvcmVfY2xhc3NdKVxuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIGJvYXJkX25ldyA9IEBcbiAgICAgICAgICAgICAgICBib2FyZF9uZXcuaW5pdCgpXG5cbiAgICAgICAgICAgIHN5c3MgPSB4cGF0aC5zZWxlY3QoXCJzeXN0ZW1cIiwgYm9hcmQpXG4gICAgICAgICAgICBmb3Igc3lzIGluIHN5c3NcbiAgICAgICAgICAgICAgICBuYW1lID0gc3lzLmdldEF0dHJpYnV0ZShcIm5hbWVcIilcbiAgICAgICAgICAgICAgICBrbGFzcyA9IHN5cy5nZXRBdHRyaWJ1dGUoXCJjbGFzc1wiKVxuICAgICAgICAgICAgICAgIGNvbmZfbm9kZSA9IHhwYXRoLnNlbGVjdChcImNvbmZpZ3VyYXRpb25cIiwgc3lzKVswXVxuICAgICAgICAgICAgICAgIGRhdGFfcHJvcHMgPSB7fVxuICAgICAgICAgICAgICAgIHByb3BzID0geHBhdGguc2VsZWN0KFwiLy9wcm9wZXJ0eVwiLCBjb25mX25vZGUpXG4gICAgICAgICAgICAgICAgZm9yIHByb3AgaW4gcHJvcHNcbiAgICAgICAgICAgICAgICAgICAgZGF0YV9wcm9wID0gZG9tMnByb3AocHJvcClcbiAgICAgICAgICAgICAgICAgICAgZGF0YV9wcm9wc1tkYXRhX3Byb3Auc2xvdF0gPSBkYXRhX3Byb3AudmFsdWVcblxuICAgICAgICAgICAgICAgIGJvYXJkX25ldy5hZGQoUyhuYW1lKSwgZ2xvYmFsW2tsYXNzXSwgRChkYXRhX3Byb3BzKSlcblxuICAgICAgICAgICAgd2lyZXMgPSB4cGF0aC5zZWxlY3QoXCIvL3dpcmVcIiwgYm9hcmQpXG4gICAgICAgICAgICBmb3Igd2lyZSBpbiB3aXJlc1xuICAgICAgICAgICAgICAgIHNvdXJjZV9uYW1lID0geHBhdGguc2VsZWN0KFwic291cmNlXCIsIHdpcmUpWzBdLmdldEF0dHJpYnV0ZShcIm5hbWVcIilcbiAgICAgICAgICAgICAgICBvdXRsZXRfbmFtZSA9IHhwYXRoLnNlbGVjdChcIm91dGxldFwiLCB3aXJlKVswXS5nZXRBdHRyaWJ1dGUoXCJuYW1lXCIpXG4gICAgICAgICAgICAgICAgc2lua19uYW1lID0geHBhdGguc2VsZWN0KFwic2lua1wiLCB3aXJlKVswXS5nZXRBdHRyaWJ1dGUoXCJuYW1lXCIpXG4gICAgICAgICAgICAgICAgaW5sZXRfbmFtZSA9IHhwYXRoLnNlbGVjdChcImlubGV0XCIsIHdpcmUpWzBdLmdldEF0dHJpYnV0ZShcIm5hbWVcIilcblxuICAgICAgICAgICAgICAgIGJvYXJkX25ldy5jb25uZWN0KHNvdXJjZV9uYW1lLCBzaW5rX25hbWUsIG91dGxldF9uYW1lLCBpbmxldF9uYW1lKVxuXG4gICAgICAgICAgICByZXR1cm4gYm9hcmRfbmV3XG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIHhtbCA9ICc8P3htbCB2ZXJzaW9uID0gXCIxLjBcIiBzdGFuZGFsb25lPVwieWVzXCI/PidcbiAgICAgICAgICAgIGlmIEBzeW1ib2w/XG4gICAgICAgICAgICAgICAgYm9hcmRfbmFtZSA9IEBzeW1ib2wubmFtZVxuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIGJvYXJkX25hbWUgPSBcImJcIlxuICAgICAgICAgICAgeG1sICs9IFwiPGJvYXJkIG5hbWU9JyN7Ym9hcmRfbmFtZX0nPlwiXG4gICAgICAgICAgICB4bWwgKz0gXCI8QnVzIGNsYXNzPScje0BidXMuY29uc3RydWN0b3IubmFtZX0nLz5cIlxuICAgICAgICAgICAgeG1sICs9IFwiPFN0b3JlIGNsYXNzPScje0BzdG9yZS5jb25zdHJ1Y3Rvci5uYW1lfScvPlwiXG4gICAgICAgICAgICB4bWwgKz0gXCI8V2lyZSBjbGFzcz0nI3tAd2lyZUNsYXNzLm5hbWV9Jy8+XCJcbiAgICAgICAgICAgIGZvciBzeXMgaW4gQHN5c3RlbXMuc3ltYm9scygpXG4gICAgICAgICAgICAgICAgaWYgc3lzLm5hbWUgbm90IGluIFtcIndpcmVzXCIsIFwic3RvcmVcIl1cbiAgICAgICAgICAgICAgICAgICAgeG1sICs9IHN5cy5vYmplY3Quc2VyaWFsaXplKClcbiAgICAgICAgICAgIGZvciBjb25uIGluIEB3aXJlcy5zeW1ib2xzKClcbiAgICAgICAgICAgICAgICB4bWwgKz0gY29ubi5vYmplY3Quc2VyaWFsaXplKClcbiAgICAgICAgICAgIHhtbCArPSBcIjwvYm9hcmQ+XCJcblxuXG4gICAgY29ubmVjdDogKHNvdXJjZSwgc2luaywgb3V0bGV0LCBpbmxldCwgc3ltYm9sKSAtPlxuICAgICAgICB3aXJlID0gbmV3IEB3aXJlQ2xhc3ModGhpcywgc291cmNlLCBzaW5rLCBvdXRsZXQsIGlubGV0KVxuICAgICAgICBpZiAhc3ltYm9sXG4gICAgICAgICAgICBuYW1lID0gQGJ1cy5nZW5zeW0oXCJ3aXJlXCIpXG4gICAgICAgICAgICBzeW1ib2wgPSBuZXcgU3ltYm9sKG5hbWUpXG4gICAgICAgIEB3aXJlcy5iaW5kKHN5bWJvbCwgd2lyZSlcblxuICAgICAgICBmb3Igc291cmNlX291dGxldCBpbiB3aXJlLnNvdXJjZS5vYmplY3Qub3V0bGV0cy5zeW1ib2xzKClcbiAgICAgICAgICAgIGlmIHNvdXJjZV9vdXRsZXQubmFtZSBpcyB3aXJlLm91dGxldC5uYW1lXG4gICAgICAgICAgICAgICAgc291cmNlX291dGxldC5vYmplY3QucHVzaChzeW1ib2wpXG5cbiAgICBwaXBlOiAoc291cmNlLCB3aXJlLCBzaW5rKSAtPlxuICAgICAgICBAY29ubmVjdChzb3VyY2UsIHNpbmssIHdpcmUpXG5cbiAgICBkaXNjb25uZWN0OiAobmFtZSkgLT5cbiAgICAgICAgd2lyZSA9IEB3aXJlKG5hbWUpXG4gICAgICAgIEB3aXJlcy51bmJpbmQobmFtZSlcblxuICAgICAgICBmb3Igb3V0bGV0IGluIHdpcmUuc291cmNlLm9iamVjdC5vdXRsZXRzLnN5bWJvbHMoKVxuICAgICAgICAgICAgaWYgb3V0bGV0Lm5hbWUgaXMgd2lyZS5vdXRsZXQubmFtZVxuICAgICAgICAgICAgICAgIHdpcmVzID0gW11cbiAgICAgICAgICAgICAgICBmb3IgY29ubiBpbiBvdXRsZXQub2JqZWN0XG4gICAgICAgICAgICAgICAgICAgIGlmIGNvbm4ubmFtZSAhPSBuYW1lXG4gICAgICAgICAgICAgICAgICAgICAgICB3aXJlcy5wdXNoKGNvbm4pXG4gICAgICAgICAgICAgICAgb3V0bGV0Lm9iamVjdCA9IHdpcmVzXG5cblxuICAgIHdpcmU6IChuYW1lKSAtPlxuICAgICAgICBAd2lyZXMub2JqZWN0KG5hbWUpXG5cbiAgICBoYXN3aXJlOiAobmFtZSkgLT5cbiAgICAgICAgQHdpcmVzLmhhcyhuYW1lKVxuXG4gICAgYWRkOiAoc3ltYm9sLCBzeXN0ZW1DbGFzcywgY29uZikgLT5cbiAgICAgICAgc3lzdGVtID0gbmV3IHN5c3RlbUNsYXNzKHRoaXMsIGNvbmYpXG4gICAgICAgIEBidXMuYmluZChzeW1ib2wsIHN5c3RlbSlcblxuICAgIGhhczogKG5hbWUpIC0+XG4gICAgICAgIEBidXMuaGFzKG5hbWUpXG5cbiAgICBzeXN0ZW06IChuYW1lKSAtPlxuICAgICAgICBAYnVzLm9iamVjdChuYW1lKVxuXG4gICAgcmVtb3ZlOiAobmFtZSkgLT5cbiAgICAgICAgc3lzdGVtID0gQGJ1cy5vYmplY3QobmFtZSlcbiAgICAgICAgc3lzdGVtLnB1c2goQFNUT1ApXG4gICAgICAgIEBidXMudW5iaW5kKG5hbWUpXG5cbmV4cG9ydHMuU3ltYm9sID0gU3ltYm9sXG5leHBvcnRzLk5hbWVTcGFjZSA9IE5hbWVTcGFjZVxuZXhwb3J0cy5TID0gU1xuZXhwb3J0cy5EYXRhID0gRGF0YVxuZXhwb3J0cy5EID0gRFxuZXhwb3J0cy5TaWduYWwgPSBTaWduYWxcbmV4cG9ydHMuRXZlbnQgPSBFdmVudFxuZXhwb3J0cy5HbGl0Y2ggPSBHbGl0Y2hcbmV4cG9ydHMuRyA9IEdcbmV4cG9ydHMuVG9rZW4gPSBUb2tlblxuZXhwb3J0cy5zdGFydCA9IHN0YXJ0XG5leHBvcnRzLnN0b3AgPSBzdG9wXG5leHBvcnRzLlQgPSBUXG5leHBvcnRzLlBhcnQgPSBQYXJ0XG5leHBvcnRzLlAgPSBQXG5leHBvcnRzLkVudGl0eSA9IEVudGl0eVxuZXhwb3J0cy5FID0gRVxuZXhwb3J0cy5DZWxsID0gQ2VsbFxuZXhwb3J0cy5DID0gQ1xuZXhwb3J0cy5TeXN0ZW0gPSBTeXN0ZW1cbmV4cG9ydHMuV2lyZSA9IFdpcmVcbmV4cG9ydHMuU3RvcmUgPSBTdG9yZVxuZXhwb3J0cy5CdXMgPSBCdXNcbmV4cG9ydHMuTWlycm9yID0gTWlycm9yXG5leHBvcnRzLkJvYXJkID0gQm9hcmRcblxuIl0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9