var Board, Bus, C, Cell, D, Data, E, Entity, Event, G, Glitch, NameSpace, P, Part, S, Signal, Store, Symbol, System, T, Token, Wire, clone, dom, dom2prop, start, stop, xpath,
  __slice = [].slice,
  __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; },
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

clone = require("clone");

xpath = require('xpath');

dom = require('xmldom').DOMParser;

dom2prop = require('./helpers').dom2prop;

Symbol = (function() {
  function Symbol(name, object, ns, attrs) {
    this.name = name;
    this.object = object;
    this.ns = ns;
    if (attrs != null) {
      this.attrs(attrs);
    }
  }

  Symbol.prototype.full_name = function() {
    if (this.ns != null) {
      return this.ns.name + this.ns.sep + this.name;
    } else {
      return this.name;
    }
  };

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
    this.inlets = new NameSpace("inlets");
    this.inlets.bind(new Symbol("sysin"), []);
    this.inlets.bind(new Symbol("feedback"), []);
    this.outlets = new NameSpace("outlets");
    this.outlets.bind(new Symbol("sysout"), []);
    this.outlets.bind(new Symbol("syserr"), []);
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

  System.prototype.error = function(data) {
    return this.dispatch(data, this.outlets.symbol("syserr"));
  };

  System.prototype.raise = function(signal) {
    return this.react(signal);
  };

  System.prototype.interrupt = function(signal) {
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

  Store.prototype.add = function(entity) {
    var symbol;
    symbol = S(entity.id);
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
    _results = [];
    for (_m = 0, _len4 = entities_list.length; _m < _len4; _m++) {
      entity = entities_list[_m];
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
  function Board(wireClass, busClass, storeClass) {
    this.wireClass = wireClass || Wire;
    this.busClass = busClass || Bus;
    this.storeClass = storeClass || Store;
    this.init();
  }

  Board.prototype.init = function() {
    this.bus = new this.busClass("bus");
    this.store = new this.storeClass();
    this.systems = this.bus;
    this.wires = new NameSpace("wires");
    this.bus.bind(S("store"), this.store);
    return this.bus.bind(S("wires"), this.wires);
  };

  Board.prototype.setup = function(xml, clone) {
    var board, board_name, board_new, bus_class, conf_node, conn, data_prop, data_props, doc, inlet_name, klass, name, outlet_name, prop, props, sink_name, source_name, store_class, sys, syss, wire, wire_class, wires, _i, _j, _k, _l, _len, _len1, _len2, _len3, _len4, _m, _ref, _ref1, _ref2;
    if (xml) {
      doc = new dom().parseFromString(xml);
      board = xpath.select("board", doc)[0];
      board_name = board.getAttribute("name");
      bus_class = xpath.select("Bus", board)[0].getAttribute("class");
      store_class = xpath.select("Store", board)[0].getAttribute("class");
      wire_class = xpath.select("Wire", board)[0].getAttribute("class");
      if (clone) {
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

exports.Board = Board;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29yZS5qcyIsInNvdXJjZXMiOlsiY29yZS5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsSUFBQSx5S0FBQTtFQUFBOzs7aVNBQUE7O0FBQUEsS0FBQSxHQUFRLE9BQUEsQ0FBUSxPQUFSLENBQVIsQ0FBQTs7QUFBQSxLQUNBLEdBQVEsT0FBQSxDQUFRLE9BQVIsQ0FEUixDQUFBOztBQUFBLEdBRUEsR0FBTSxPQUFBLENBQVEsUUFBUixDQUFpQixDQUFDLFNBRnhCLENBQUE7O0FBQUEsUUFHQSxHQUFXLE9BQUEsQ0FBUSxXQUFSLENBQW9CLENBQUMsUUFIaEMsQ0FBQTs7QUFBQTtBQU9pQixFQUFBLGdCQUFFLElBQUYsRUFBUyxNQUFULEVBQWtCLEVBQWxCLEVBQXNCLEtBQXRCLEdBQUE7QUFDVCxJQURVLElBQUMsQ0FBQSxPQUFBLElBQ1gsQ0FBQTtBQUFBLElBRGlCLElBQUMsQ0FBQSxTQUFBLE1BQ2xCLENBQUE7QUFBQSxJQUQwQixJQUFDLENBQUEsS0FBQSxFQUMzQixDQUFBO0FBQUEsSUFBQSxJQUFHLGFBQUg7QUFDSSxNQUFBLElBQUMsQ0FBQSxLQUFELENBQU8sS0FBUCxDQUFBLENBREo7S0FEUztFQUFBLENBQWI7O0FBQUEsbUJBSUEsU0FBQSxHQUFXLFNBQUEsR0FBQTtBQUNSLElBQUEsSUFBRyxlQUFIO0FBQ0ksYUFBTyxJQUFDLENBQUEsRUFBRSxDQUFDLElBQUosR0FBVyxJQUFDLENBQUEsRUFBRSxDQUFDLEdBQWYsR0FBcUIsSUFBQyxDQUFBLElBQTdCLENBREo7S0FBQSxNQUFBO0FBR0ksYUFBTyxJQUFDLENBQUEsSUFBUixDQUhKO0tBRFE7RUFBQSxDQUpYLENBQUE7O0FBQUEsbUJBVUEsSUFBQSxHQUFNLFNBQUMsQ0FBRCxFQUFJLENBQUosR0FBQTtBQUNGLElBQUEsSUFBRyxDQUFIO2FBQ0ksSUFBRSxDQUFBLENBQUEsQ0FBRixHQUFPLEVBRFg7S0FBQSxNQUFBO2FBR0ksSUFBRSxDQUFBLENBQUEsRUFITjtLQURFO0VB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QixLQTFzQmhCLENBQUEiLCJzb3VyY2VzQ29udGVudCI6WyJjbG9uZSA9IHJlcXVpcmUgXCJjbG9uZVwiXG54cGF0aCA9IHJlcXVpcmUoJ3hwYXRoJylcbmRvbSA9IHJlcXVpcmUoJ3htbGRvbScpLkRPTVBhcnNlclxuZG9tMnByb3AgPSByZXF1aXJlKCcuL2hlbHBlcnMnKS5kb20ycHJvcFxuXG5jbGFzcyBTeW1ib2xcblxuICAgIGNvbnN0cnVjdG9yOiAoQG5hbWUsIEBvYmplY3QsIEBucywgYXR0cnMpIC0+XG4gICAgICAgIGlmIGF0dHJzP1xuICAgICAgICAgICAgQGF0dHJzKGF0dHJzKVxuXG4gICAgZnVsbF9uYW1lOiAtPlxuICAgICAgIGlmIEBucz9cbiAgICAgICAgICAgcmV0dXJuIEBucy5uYW1lICsgQG5zLnNlcCArIEBuYW1lXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgcmV0dXJuIEBuYW1lXG5cbiAgICBhdHRyOiAoaywgdikgLT5cbiAgICAgICAgaWYgdlxuICAgICAgICAgICAgQFtrXSA9IHZcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgQFtrXVxuXG4gICAgb3A6IChmLCBhcmdzLi4uKSAtPlxuICAgICAgICByZXR1cm4gZi5hcHBseSh0aGlzLCBhcmdzKVxuXG4gICAgYXR0cnM6IChrdikgLT5cbiAgICAgICAgZm9yIGssIHYgaW4ga3ZcbiAgICAgICAgICAgIEBba10gPSB2XG5cbiAgICBpczogKHN5bWJvbCkgLT5cbiAgICAgICAgaWYgc3ltYm9sLm5hbWUgaXMgQG5hbWVcbiAgICAgICAgICAgIGlmIHN5bWJvbC5vYmplY3QgaXMgQG9iamVjdFxuICAgICAgICAgICAgICAgIHJldHVybiB0cnVlXG4gICAgICAgICAgICBpZiAoc3ltYm9sLm9iamVjdCBpcyBudWxsKSBhbmQgKEBvYmplY3QgaXMgbnVsbClcbiAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZVxuICAgICAgICBlbHNlXG4gICAgICAgICAgICByZXR1cm4gZmFsc2VcblxuUyA9IChuYW1lLCBvYmplY3QsIG5zLCBhdHRycykgLT5cbiAgICByZXR1cm4gbmV3IFN5bWJvbChuYW1lLCBvYmplY3QsIG5zLCBhdHRycylcblxuIyBzaG91bGQgYmUgYSBzZXRcblxuY2xhc3MgTmFtZVNwYWNlXG5cbiAgICBjb25zdHJ1Y3RvcjogKEBuYW1lLCBzZXApIC0+XG4gICAgICAgIEBlbGVtZW50cyA9IHt9XG4gICAgICAgIEBzZXAgPSBzZXAgfHwgXCIuXCJcbiAgICAgICAgQF9fZ2Vuc3ltID0gMFxuXG4gICAgYmluZDogKHN5bWJvbCwgb2JqZWN0LCBjbGFzc19uYW1lKSAtPlxuICAgICAgICBzeW1ib2wuY2xhc3MgPSBjbGFzc19uYW1lIHx8IG9iamVjdC5jb25zdHJ1Y3Rvci5uYW1lXG4gICAgICAgIG5hbWUgPSBzeW1ib2wubmFtZVxuICAgICAgICBzeW1ib2wub2JqZWN0ID0gb2JqZWN0XG4gICAgICAgIG9iamVjdC5zeW1ib2wgPSBzeW1ib2xcbiAgICAgICAgQGVsZW1lbnRzW25hbWVdID0gc3ltYm9sXG4gICAgICAgIHN5bWJvbC5ucyA9IHRoaXNcbiAgICAgICAgc3ltYm9sXG5cbiAgICB1bmJpbmQ6IChuYW1lKSAtPlxuICAgICAgICBzeW1ib2wgPSBAZWxlbWVudHNbbmFtZV1cbiAgICAgICAgZGVsZXRlIEBlbGVtZW50c1tuYW1lXVxuICAgICAgICBzeW1ib2wubnMgPSB1bmRlZmluZWRcbiAgICAgICAgc3ltYm9sLm9iamVjdCA9IHVuZGVmaW5lZFxuICAgICAgICBzeW1ib2wuY2xhc3MgPSB1bmRlZmluZWRcblxuICAgIHN5bWJvbDogKG5hbWUpIC0+XG4gICAgICAgIGlmIEBoYXMobmFtZSlcbiAgICAgICAgICAgIEBlbGVtZW50c1tuYW1lXVxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBTKFwiTm90Rm91bmRcIilcblxuICAgIGhhczogKG5hbWUpIC0+XG4gICAgICAgIGlmIEBlbGVtZW50c1tuYW1lXT9cbiAgICAgICAgICAgIHJldHVybiB0cnVlXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIHJldHVybiBmYWxzZVxuXG4gICAgb2JqZWN0OiAobmFtZSkgLT5cbiAgICAgICAgaWYgQGhhcyhuYW1lKVxuICAgICAgICAgICAgQGVsZW1lbnRzW25hbWVdLm9iamVjdFxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBHKFwiTm90Rm91bmRcIilcblxuICAgIHN5bWJvbHM6ICgpIC0+XG4gICAgICAgc3ltYm9scyA9IFtdXG5cbiAgICAgICBmb3Igayx2IG9mIEBlbGVtZW50c1xuICAgICAgICAgICBzeW1ib2xzLnB1c2godilcblxuICAgICAgIHN5bWJvbHNcblxuICAgIG9iamVjdHM6ICgpIC0+XG4gICAgICAgb2JqZWN0cyA9IFtdXG5cbiAgICAgICBmb3Igayx2IG9mIEBlbGVtZW50c1xuICAgICAgICAgICBvYmplY3RzLnB1c2godi5vYmplY3QpXG5cbiAgICAgICBvYmplY3RzXG5cbiAgICBnZW5zeW06IChwcmVmaXgpIC0+XG4gICAgICAgIHByZWZpeCA9IHByZWZpeCB8fCBcImdlbnN5bVwiXG4gICAgICAgIHByZWZpeCArIFwiOlwiICsgKEBfX2dlbnN5bSsrKVxuXG5cbmNsYXNzIERhdGFcblxuICAgIGNvbnN0cnVjdG9yOiAocHJvcHMpIC0+XG4gICAgICAgIEBfX3Nsb3RzID0gW11cbiAgICAgICAgaWYgcHJvcHM/XG4gICAgICAgICAgICBAcHJvcHMocHJvcHMpXG5cbiAgICBpczogKGRhdGEpIC0+XG4gICAgICAgIGFsbF9zbG90cyA9IEBzbG90cygpXG4gICAgICAgIGZvciBuYW1lIGluIGRhdGEuc2xvdHMoKVxuICAgICAgICAgICAgaWYgZGF0YS5zbG90KG5hbWUpIGlzIG5vdCBAc2xvdChuYW1lKVxuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZVxuXG4gICAgICAgIHJldHVybiB0cnVlXG5cbiAgICBwcm9wczogKGt2KSAtPlxuICAgICAgICBpZiBrdlxuICAgICAgICAgICAgZm9yIGssIHYgb2Yga3ZcbiAgICAgICAgICAgICAgICBAW2tdID0gdlxuICAgICAgICAgICAgICAgIGlmIGsgbm90IGluIEBzbG90cygpXG4gICAgICAgICAgICAgICAgICAgIEBzbG90cyhrKVxuICAgICAgICAgICAgcmV0dXJuIEB2YWxpZGF0ZSgpXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIHByb3BlcnRpZXMgPSBbXVxuICAgICAgICAgICAgZm9yIG5hbWUgaW4gQHNsb3RzKClcbiAgICAgICAgICAgICAgICBwcm9wZXJ0aWVzLnB1c2goQFtuYW1lXSlcbiAgICAgICAgICAgIHJldHVybiBwcm9wZXJ0aWVzXG5cbiAgICBzbG90czogKG5hbWUpIC0+XG4gICAgICAgIGlmIG5hbWVcbiAgICAgICAgICAgIEBfX3Nsb3RzLnB1c2gobmFtZSlcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgQF9fc2xvdHNcblxuICAgIHNsb3Q6IChuYW1lLCB2YWx1ZSkgLT5cbiAgICAgICAgaWYgdmFsdWVcbiAgICAgICAgICAgIEBbbmFtZV0gPSB2YWx1ZVxuICAgICAgICAgICAgaWYgbmFtZSBub3QgaW4gQHNsb3RzKClcbiAgICAgICAgICAgICAgICBAc2xvdHMobmFtZSlcbiAgICAgICAgICAgIGlmIEB2YWxpZGF0ZSgpXG4gICAgICAgICAgICAgICAgcmV0dXJuIHZhbHVlXG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgRyhcIkludmFsaWRcIilcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgaWYgQGhhcyhuYW1lKVxuICAgICAgICAgICAgICAgIEBbbmFtZV1cbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICBHKFwiTm90Rm91bmRcIilcblxuICAgIGhhczogKG5hbWUpIC0+XG4gICAgICAgIGlmIG5hbWUgaW4gQHNsb3RzKClcbiAgICAgICAgICAgIHJldHVybiB0cnVlXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIHJldHVybiBmYWxzZVxuXG4gICAgdmFsaWRhdGU6IC0+XG4gICAgICAgIHRydWVcblxuICAgIF9fc2VyaWFsaXplX3NjYWxhcjogKHNjYWxhcikgLT5cbiAgICAgICAgeG1sID0gXCJcIlxuICAgICAgICBpZiBBcnJheS5pc0FycmF5KHNjYWxhcilcbiAgICAgICAgICAgIHR5cGUgPSBcImFycmF5XCJcbiAgICAgICAgICAgIHhtbCArPSBcIjxzY2FsYXIgdHlwZT0nI3t0eXBlfSc+XCJcbiAgICAgICAgICAgIHhtbCArPSBcIjxsaXN0PlwiXG4gICAgICAgICAgICBmb3IgZSBpbiBzY2FsYXJcbiAgICAgICAgICAgICAgICB4bWwgKz0gQF9fc2VyaWFsaXplX3NjYWxhcihlKVxuICAgICAgICAgICAgeG1sICs9IFwiPC9saXN0PlwiXG4gICAgICAgICAgICB4bWwgKz0gXCI8L3NjYWxhcj5cIlxuICAgICAgICBlbHNlXG4gICAgICAgICAgICB0eXBlID0gdHlwZW9mIHNjYWxhclxuICAgICAgICAgICAgeG1sICs9IFwiPHNjYWxhciB0eXBlPScje3R5cGV9Jz4je3NjYWxhci50b1N0cmluZygpfTwvc2NhbGFyPlwiXG4gICAgICAgIHhtbFxuXG4gICAgc2VyaWFsaXplOiAtPlxuICAgICAgICB4bWwgPSBcIlwiXG4gICAgICAgIGZvciBuYW1lIGluIEBzbG90cygpXG4gICAgICAgICAgICB4bWwgKz0gXCI8cHJvcGVydHkgc2xvdD0nI3tuYW1lfSc+XCJcbiAgICAgICAgICAgIHNjYWxhciAgPSBAc2xvdChuYW1lKVxuICAgICAgICAgICAgeG1sICs9IEBfX3NlcmlhbGl6ZV9zY2FsYXIoc2NhbGFyKVxuICAgICAgICAgICAgeG1sICs9ICc8L3Byb3BlcnR5PidcbiAgICAgICAgeG1sXG5cbkQgPSAocHJvcHMpIC0+XG4gICAgcmV0dXJuIG5ldyBEYXRhKHByb3BzKVxuXG5jbGFzcyBTaWduYWwgZXh0ZW5kcyBEYXRhXG5cbiAgICBjb25zdHJ1Y3RvcjogKG5hbWUsIHBheWxvYWQsIHByb3BzKSAtPlxuICAgICAgICBwcm9wcyA9IHByb3BzIHx8IHt9XG4gICAgICAgIHByb3BzLm5hbWUgPSBuYW1lXG4gICAgICAgIHByb3BzLnBheWxvYWQgPSBwYXlsb2FkXG4gICAgICAgIHN1cGVyKHByb3BzKVxuXG5jbGFzcyBFdmVudCBleHRlbmRzIFNpZ25hbFxuXG4gICAgY29uc3RydWN0b3I6IChuYW1lLCBwYXlsb2FkLCBwcm9wcykgLT5cbiAgICAgICAgcHJvcHMgPSBwcm9wcyB8fCB7fVxuICAgICAgICBwb3BzLnRzID0gbmV3IERhdGUoKS5nZXRUaW1lKClcbiAgICAgICAgc3VwZXIobmFtZSwgcGF5bG9hZCwgcHJvcHMpXG5cbmNsYXNzIEdsaXRjaCBleHRlbmRzIERhdGFcblxuICAgIGNvbnN0cnVjdG9yOiAobmFtZSwgY29udGV4dCwgcHJvcHMpIC0+XG4gICAgICAgIHByb3BzID0gcHJvcHMgfHwge31cbiAgICAgICAgcHJvcHMubmFtZSA9IG5hbWVcbiAgICAgICAgcHJvcHMuY29udGVueHQgPSBjb250ZXh0XG4gICAgICAgIHN1cGVyKHByb3BzKVxuXG5HID0gKG5hbWUsIHByb3BzKSAtPlxuICAgIHJldHVybiBuZXcgR2xpdGNoKG5hbWUsIHByb3BzKVxuXG5jbGFzcyBUb2tlbiBleHRlbmRzIERhdGFcblxuICAgIGNvbnN0cnVjdG9yOiAodmFsdWUsIHNpZ24sIHByb3BzKSAgLT5cbiAgICAgICAgc3VwZXIocHJvcHMpXG4gICAgICAgIEBzaWducyA9IFtdXG4gICAgICAgIEBzdGFtcChzaWduLCB2YWx1ZSlcblxuICAgIGlzOiAodCkgLT5cbiAgICAgICAgZmFsc2VcblxuICAgIHZhbHVlOiAtPlxuICAgICAgICBAdmFsdWVcblxuICAgIHN0YW1wX2J5OiAoaW5kZXgpIC0+XG4gICAgICAgIGlmIGluZGV4P1xuICAgICAgICAgICBpZiBAc2lnbnNbaW5kZXhdP1xuICAgICAgICAgICAgICAgcmV0dXJuIEBzaWduc1tpbmRleF1cbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgIHJldHVybiBTKFwiTm90Rm91bmRcIilcblxuICAgICAgICBpZiBAc2lnbnMubGVuZ3RoID4gMFxuICAgICAgICAgICByZXR1cm4gQHNpZ25zW0BzaWducy5sZW5ndGggLSAxXVxuICAgICAgICBlbHNlXG4gICAgICAgICAgIHJldHVybiBTKFwiTm90Rm91bmRcIilcblxuICAgIHN0YW1wOiAoc2lnbiwgdmFsdWUpIC0+XG4gICAgICAgIGlmIHZhbHVlXG4gICAgICAgICAgICBpZiBAW3ZhbHVlXVxuICAgICAgICAgICAgICAgIGRlbGV0ZSBAW3ZhbHVlXVxuICAgICAgICAgICAgQHZhbHVlID0gdmFsdWVcbiAgICAgICAgICAgIGlmIHR5cGVvZiBAdmFsdWUgaXMgXCJzdHJpbmdcIlxuICAgICAgICAgICAgICAgIEBbQHZhbHVlXSA9IHRydWVcbiAgICAgICAgaWYgc2lnbj9cbiAgICAgICAgICAgIEBzaWducy5wdXNoKHNpZ24pXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIEBzaWducy5wdXNoKFMoXCJVbmtub3duXCIpKVxuXG5cbnN0YXJ0ID0gKHNpZ24sIHByb3BzKSAtPlxuICAgIHJldHVybiBuZXcgVG9rZW4oXCJzdGFydFwiLCBzaWduLCBwcm9wcylcblxuc3RvcCA9IChzaWduLCBwcm9wcykgLT5cbiAgICByZXR1cm4gbmV3IFRva2VuKFwic3RvcFwiLCBzaWduLCBwcm9wcylcblxuVCA9ICh2YWx1ZSwgc2lnbiwgcHJvcHMpIC0+XG4gICAgcmV0dXJuIG5ldyBUb2tlbih2YWx1ZSwgc2lnbiwgcHJvcHMpXG5cbmNsYXNzIFBhcnQgZXh0ZW5kcyBEYXRhXG5cbiAgICBjb25zdHJ1Y3RvcjogKEBuYW1lLCBwcm9wcykgLT5cbiAgICAgICAgc3VwZXIocHJvcHMpXG5cbiAgICBzZXJpYWxpemU6IC0+XG4gICAgICAgIHhtbCArPSBcIjxwYXJ0IG5hbWU9JyN7QG5hbWV9Jz5cIlxuICAgICAgICB4bWwgKz0gc3VwZXIoKVxuICAgICAgICB4bWwgKz0gJzwvcGFydD4nXG5cblAgPSAobmFtZSwgcHJvcHMpIC0+XG4gICAgcmV0dXJuIG5ldyBQYXJ0KG5hbWUsIHByb3BzKVxuXG5jbGFzcyBFbnRpdHkgZXh0ZW5kcyBEYXRhXG5cbiAgICBjb25zdHJ1Y3RvcjogKHRhZ3MsIHByb3BzKSAtPlxuICAgICAgICBAcGFydHMgPSBuZXcgTmFtZVNwYWNlKFwicGFydHNcIilcbiAgICAgICAgcHJvcHMgPSBwcm9wcyB8fCB7fVxuICAgICAgICBwcm9wcy5pZCA9IHByb3BzLmlkIHx8IHV1aWQudjQoKVxuICAgICAgICB0YWdzID0gdGFncyB8fCBwcm9wcy50YWdzIHx8IFtdXG4gICAgICAgIHByb3BzLnRhZ3MgPSB0YWdzXG4gICAgICAgIHN1cGVyKHByb3BzKVxuXG4gICAgYWRkOiAoc3ltYm9sLCBwYXJ0KSAtPlxuICAgICAgICBAcGFydHMuYmluZChzeW1ib2wsIHBhcnQpXG5cbiAgICByZW1vdmU6IChuYW1lKSAtPlxuICAgICAgICBAcGFydHMudW5iaW5kKG5hbWUpXG5cbiAgICBoYXNQYXJ0OiAobmFtZSkgLT5cbiAgICAgICAgQHBhcnRzLmhhcyhuYW1lKVxuXG4gICAgcGFydDogKG5hbWUpIC0+XG4gICAgICAgIEBwYXJ0cy5zeW1ib2wobmFtZSlcblxuICAgIHNlcmlhbGl6ZTogLT5cbiAgICAgICAgeG1sID0gXCI8ZW50aXR5PlwiXG4gICAgICAgIHhtbCArPSAnPHBhcnRzPidcbiAgICAgICAgZm9yIHBhcnQgb2YgQHBhcnRzLm9iamVjdHMoKVxuICAgICAgICAgICAgeG1sICs9IHBhcnQuc2VyaWFsaXplKClcbiAgICAgICAgeG1sICs9ICc8L3BhcnRzPidcbiAgICAgICAgeG1sICs9IHN1cGVyKClcbiAgICAgICAgeG1sICs9ICc8L2VudGl0eT4nXG5cbkUgPSAodGFncywgcHJvcHMpIC0+XG4gICAgcmV0dXJuIG5ldyBFbnRpdHkodGFncywgcHJvcHMpXG5cbmNsYXNzIENlbGwgZXh0ZW5kcyBFbnRpdHlcblxuICAgIGNvbnN0cnVjdG9yOiAodGFncywgcHJvcHMpIC0+XG4gICAgICAgIHN1cGVyKHRhZ3MsIHByb3BzKVxuICAgICAgICBAb2JzZXJ2ZXJzPSBuZXcgTmFtZVNwYWNlKFwib2JzZXJ2ZXJzXCIpXG5cbiAgICBub3RpZnk6IChldmVudCkgLT5cbiAgICAgICBmb3Igb2IgaW4gQG9ic2VydmVycy5vYmplY3RzKClcbiAgICAgICAgICAgIG9iLnJhaXNlKGV2ZW50KVxuXG4gICAgYWRkOiAocGFydCkgLT5cbiAgICAgICAgc3VwZXIgcGFydFxuICAgICAgICBldmVudCA9IG5ldyBFdmVudChcInBhcnQtYWRkZWRcIiwge3BhcnQ6IHBhcnQsIGNlbGw6IHRoaXN9KVxuICAgICAgICBAbm90aWZ5KGV2ZW50KVxuXG4gICAgcmVtb3ZlOiAobmFtZSkgLT5cbiAgICAgICAgc3VwZXIgbmFtZVxuICAgICAgICBldmVudCA9IG5ldyBFdmVudChcInBhcnQtcmVtb3ZlZFwiLCB7cGFydDogcGFydCwgY2VsbDogdGhpc30pXG4gICAgICAgIEBub3RpZnkoZXZlbnQpXG5cbiAgICBvYnNlcnZlOiAoc3ltYm9sLCBzeXN0ZW0pIC0+XG4gICAgICAgIEBvYnNlcnZlcnMuYmluZChzeW1ib2wsIHN5c3RlbSlcblxuICAgIGZvcmdldDogKG5hbWUpIC0+XG4gICAgICAgIEBvYnNlcnZlcnMudW5iaW5kKG5hbWUpXG5cbiAgICBzdGVwOiAoZm4sIGFyZ3MuLi4pIC0+XG4gICAgICAgIHJldHVybiBmbi5hcHBseSh0aGlzLCBhcmdzKVxuXG4gICAgY2xvbmU6ICgpIC0+XG4gICAgICAgIHJldHVybiBjbG9uZSh0aGlzKVxuXG5DID0gKHRhZ3MsIHByb3BzKSAtPlxuICAgIHJldHVybiBuZXcgQ2VsbCh0YWdzLCBwcm9wcylcblxuY2xhc3MgU3lzdGVtXG5cbiAgICBjb25zdHJ1Y3RvcjogKEBiLCBjb25mKSAtPlxuICAgICAgICBAaW5sZXRzID0gbmV3IE5hbWVTcGFjZShcImlubGV0c1wiKVxuICAgICAgICBAaW5sZXRzLmJpbmQobmV3IFN5bWJvbChcInN5c2luXCIpLFtdKVxuICAgICAgICBAaW5sZXRzLmJpbmQobmV3IFN5bWJvbChcImZlZWRiYWNrXCIpLFtdKVxuICAgICAgICBAb3V0bGV0cyA9IG5ldyBOYW1lU3BhY2UoXCJvdXRsZXRzXCIpXG4gICAgICAgIEBvdXRsZXRzLmJpbmQobmV3IFN5bWJvbChcInN5c291dFwiKSxbXSlcbiAgICAgICAgQG91dGxldHMuYmluZChuZXcgU3ltYm9sKFwic3lzZXJyXCIpLFtdKVxuXG4gICAgICAgIEBjb25mID0gY29uZiB8fCBEKClcbiAgICAgICAgQHN0YXRlID0gW11cbiAgICAgICAgQHIgPSB7fVxuXG4gICAgdG9wOiAoaW5kZXgpIC0+XG4gICAgICAgIGlmIGluZGV4P1xuICAgICAgICAgICAgaWYgQHN0YXRlW2luZGV4XT9cbiAgICAgICAgICAgICAgICByZXR1cm4gQHN0YXRlW2luZGV4XVxuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIHJldHVybiBTKFwiTm90Rm91bmRcIilcblxuICAgICAgICBpZiBAc3RhdGUubGVuZ3RoID4gMFxuICAgICAgICAgICAgcmV0dXJuIEBzdGF0ZVtAc3RhdGUubGVuZ3RoIC0gMV1cbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgcmV0dXJuIFMoXCJOb3RGb3VuZFwiKVxuXG4gICAgaW5wdXQ6IChkYXRhLCBpbmxldCkgLT5cbiAgICAgICAgZGF0YVxuXG4gICAgb3V0cHV0OiAoZGF0YSwgb3V0bGV0KSAtPlxuICAgICAgICBkYXRhXG5cbiAgICBTVE9QOiAoc3RvcF90b2tlbikgLT5cblxuICAgIHB1c2g6IChkYXRhLCBpbmxldCkgLT5cblxuICAgICAgICBpbmxldCA9IGlubGV0IHx8IEBpbmxldHMuc3ltYm9sKFwic3lzaW5cIilcblxuICAgICAgICBpbnB1dF9kYXRhID0gQGlucHV0KGRhdGEsIGlubGV0KVxuXG4gICAgICAgIGlmIGlucHV0X2RhdGEgaW5zdGFuY2VvZiBHbGl0Y2hcbiAgICAgICAgICAgIEBlcnJvcihpbnB1dF9kYXRhKVxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBAcHJvY2VzcyBpbnB1dF9kYXRhLCBpbmxldFxuXG4gICAgZ290b193aXRoOiAoaW5sZXQsIGRhdGEpIC0+XG4gICAgICAgIEBwdXNoKGRhdGEsIGlubGV0KVxuXG4gICAgcHJvY2VzczogKGRhdGEsIGlubGV0KSAtPlxuXG4gICAgZGlzcGF0Y2g6IChkYXRhLCBvdXRsZXQpIC0+XG4gICAgICAgIGZvciBvbCBpbiBAb3V0bGV0cy5zeW1ib2xzKClcbiAgICAgICAgICAgIGlmIG9sLm5hbWUgPT0gb3V0bGV0Lm5hbWVcbiAgICAgICAgICAgICAgICBmb3Igd2lyZSBpbiBvbC5vYmplY3RcbiAgICAgICAgICAgICAgICAgICAgd2lyZS5vYmplY3QudHJhbnNtaXQgZGF0YVxuXG4gICAgZW1pdDogKGRhdGEsIG91dGxldCkgLT5cbiAgICAgICAgb3V0bGV0ID0gb3V0bGV0IHx8IEBvdXRsZXRzLnN5bWJvbChcInN5c291dFwiKVxuXG4gICAgICAgIG91dHB1dF9kYXRhID0gQG91dHB1dChkYXRhLCBvdXRsZXQpXG5cbiAgICAgICAgaWYgb3V0cHV0X2RhdGEgaW5zdGFuY2VvZiBHbGl0Y2hcbiAgICAgICAgICAgIEBlcnJvcihvdXRwdXRfZGF0YSlcbiAgICAgICAgICAgIHJldHVyblxuXG4gICAgICAgIEBkaXNwYXRjaChvdXRwdXRfZGF0YSwgb3V0bGV0KVxuXG5cbiAgICBlcnJvcjogKGRhdGEpIC0+XG4gICAgICAgIEBkaXNwYXRjaChkYXRhLCBAb3V0bGV0cy5zeW1ib2woXCJzeXNlcnJcIikpXG5cbiAgICByYWlzZTogKHNpZ25hbCkgLT5cbiAgICAgICAgQHJlYWN0KHNpZ25hbClcblxuICAgIGludGVycnVwdDogKHNpZ25hbCkgLT5cbiAgICAgICAgQHJlYWN0KHNpZ25hbClcblxuICAgIHJlYWN0OiAoc2lnbmFsKSAtPlxuXG4gICAgc2hvdzogKGRhdGEpIC0+XG5cbiAgICBzZXJpYWxpemU6IC0+XG4gICAgICAgIHhtbCA9IFwiPHN5c3RlbSBuYW1lPScje0BzeW1ib2wubmFtZX0nIGNsYXNzPScje0BzeW1ib2wuY2xhc3N9Jz5cIlxuICAgICAgICB4bWwgKz0gXCI8Y29uZmlndXJhdGlvbj5cIlxuICAgICAgICB4bWwgKz0gQGNvbmYuc2VyaWFsaXplKClcbiAgICAgICAgeG1sICs9IFwiPC9jb25maWd1cmF0aW9uPlwiXG4gICAgICAgIHhtbCArPSBcIjwvc3lzdGVtPlwiXG4gICAgICAgIHhtbFxuXG5cbmNsYXNzIFdpcmVcblxuICAgIGNvbnN0cnVjdG9yOiAoQGIsIHNvdXJjZSwgc2luaywgb3V0bGV0LCBpbmxldCkgLT5cbiAgICAgICAgb3V0bGV0ID0gb3V0bGV0IHx8IFwic3lzb3V0XCJcbiAgICAgICAgaW5sZXQgPSBpbmxldCB8fCBcInN5c2luXCJcbiAgICAgICAgQHNvdXJjZSA9IEBiLnN5c3RlbXMuc3ltYm9sKHNvdXJjZSlcbiAgICAgICAgQHNpbmsgPSBAYi5zeXN0ZW1zLnN5bWJvbChzaW5rKVxuICAgICAgICBAb3V0bGV0ID0gQHNvdXJjZS5vYmplY3Qub3V0bGV0cy5zeW1ib2wob3V0bGV0KVxuICAgICAgICBAaW5sZXQgPSBAc2luay5vYmplY3QuaW5sZXRzLnN5bWJvbChpbmxldClcblxuICAgIHRyYW5zbWl0OiAoZGF0YSkgLT5cbiAgICAgICAgQHNpbmsub2JqZWN0LnB1c2goZGF0YSwgQGlubGV0KVxuXG4gICAgc2VyaWFsaXplOiAtPlxuICAgICAgICB4bWwgPSBcIlwiXG4gICAgICAgIHhtbCArPSBcIjx3aXJlIG5hbWU9JyN7QHN5bWJvbC5uYW1lfSc+XCJcbiAgICAgICAgeG1sICs9IFwiPHNvdXJjZSBuYW1lPScje0Bzb3VyY2UubmFtZX0nLz5cIlxuICAgICAgICB4bWwgKz0gXCI8b3V0bGV0IG5hbWU9JyN7QG91dGxldC5uYW1lfScvPlwiXG4gICAgICAgIHhtbCArPSBcIjxzaW5rIG5hbWU9JyN7QHNpbmsubmFtZX0nLz5cIlxuICAgICAgICB4bWwgKz0gXCI8aW5sZXQgbmFtZT0nI3tAaW5sZXQubmFtZX0nLz5cIlxuICAgICAgICB4bWwgKz0gXCI8L3dpcmU+XCJcbiAgICAgICAgeG1sXG5cblxuXG5jbGFzcyBTdG9yZVxuXG4gICAgY29uc3RydWN0b3I6IC0+XG4gICAgICAgIEBlbnRpdGllcyA9IG5ldyBOYW1lU3BhY2UoXCJlbnRpdGllc1wiKVxuXG4gICAgYWRkOiAoZW50aXR5KSAtPlxuICAgICAgICBzeW1ib2wgPSBTKGVudGl0eS5pZClcbiAgICAgICAgQGVudGl0aWVzLmJpbmQoc3ltYm9sLCBlbnRpdHkpXG4gICAgICAgIGVudGl0eVxuXG4gICAgc25hcHNob3Q6ICgpIC0+XG4gICAgICAgIHhtbCA9ICc8P3htbCB2ZXJzaW9uID0gXCIxLjBcIiBzdGFuZGFsb25lPVwieWVzXCI/PidcbiAgICAgICAgeG1sICs9IFwiPHNuYXBzaG90PlwiXG4gICAgICAgIGZvciBlbnRpdHkgaW4gQGVudGl0aWVzLm9iamVjdHMoKVxuICAgICAgICAgICAgeG1sICs9IGVudGl0eS5zZXJpYWxpemUoKVxuICAgICAgICB4bWwgKz0gXCI8L3NuYXBzaG90PlwiXG4gICAgICAgIHJldHVybiB4bWxcblxuICAgIG9wOiAoZiwgYXJncy4uLikgLT5cbiAgICAgICAgcmV0dXJuIGYuYXBwbHkodGhpcywgYXJncylcblxuICAgIHJlY292ZXI6ICh4bWwpIC0+XG4gICAgICAgIGRvYyA9IG5ldyBkb20oKS5wYXJzZUZyb21TdHJpbmcoeG1sKVxuICAgICAgICBlbnRpdGllcyA9IHhwYXRoLnNlbGVjdChcIi8vZW50aXR5XCIsIGRvYylcbiAgICAgICAgZW50aXRpZXNfbGlzdCA9IFtdXG4gICAgICAgIGZvciBlbnRpdHkgaW4gZW50aXRpZXNcbiAgICAgICAgICAgIGVudGl0eV9wcm9wcyA9IHt9XG4gICAgICAgICAgICBwcm9wcyA9IHhwYXRoLnNlbGVjdChcInByb3BlcnR5XCIsIGVudGl0eSlcbiAgICAgICAgICAgIGZvciBwcm9wIGluIHByb3BzXG4gICAgICAgICAgICAgICAgZW50aXR5X3Byb3AgPSBkb20ycHJvcChwcm9wKVxuICAgICAgICAgICAgICAgIGVudGl0eV9wcm9wc1tlbnRpdHlfcHJvcC5zbG90XSA9IGVudGl0eV9wcm9wLnZhbHVlXG5cbiAgICAgICAgICAgIG5ld19lbnRpdHkgPSBuZXcgRW50aXR5KG51bGwsIGVudGl0eV9wcm9wcylcblxuICAgICAgICAgICAgcGFydHMgPSB4cGF0aC5zZWxlY3QoXCJwYXJ0XCIsIGVudGl0eSlcbiAgICAgICAgICAgIGZvciBwYXJ0IGluIHBhcnRzXG4gICAgICAgICAgICAgICAgbmFtZSA9IHBhcnQuZ2V0QXR0cmlidXRlKFwibmFtZVwiKVxuICAgICAgICAgICAgICAgIHBhcnRfcHJvcHMgPSB7fVxuICAgICAgICAgICAgICAgIHByb3BzID0geHBhdGguc2VsZWN0KFwicHJvcGVydHlcIiwgcGFydClcbiAgICAgICAgICAgICAgICBmb3IgcHJvcCBpbiBwcm9wc1xuICAgICAgICAgICAgICAgICAgICBwYXJ0X3Byb3AgPSBkb20ycHJvcChwcm9wKVxuICAgICAgICAgICAgICAgICAgICBwYXJ0X3Byb3BzW3BhcnRfcHJvcC5zbG90XSA9IHBhcnRfcHJvcC52YWx1ZVxuICAgICAgICAgICAgICAgIGVudGl0eV9wYXJ0ID0gbmV3IFBhcnQobmFtZSwgcGFydF9wcm9wcylcbiAgICAgICAgICAgICAgICBuZXdfZW50aXR5LmFkZChlbnRpdHlfcGFydClcblxuICAgICAgICAgICAgZW50aXRpZXNfbGlzdC5wdXNoKG5ld19lbnRpdHkpXG5cbiAgICAgICAgZm9yIGVudGl0eSBpbiBlbnRpdGllc19saXN0XG4gICAgICAgICAgICBAYWRkKGVudGl0eSlcblxuICAgIGhhczogKGlkKSAtPlxuICAgICAgICBAZW50aXRpZXMuaGFzKGlkKVxuXG4gICAgZW50aXR5OiAoaWQpIC0+XG4gICAgICAgIEBlbnRpdGllcy5vYmplY3QoaWQpXG5cbiAgICByZW1vdmU6IChpZCkgLT5cbiAgICAgICAgQGVudGl0aWVzLnVuYmluZChpZClcblxuICAgIGJ5X3Byb3A6IChwcm9wKSAtPlxuICAgICAgICBlbnRpdGllcyA9IFtdXG4gICAgICAgIGZvciBlbnRpdHkgaW4gQGVudGl0aWVzLm9iamVjdHMoKVxuICAgICAgICAgICAgaWYgZW50aXR5Lmhhcyhwcm9wLnNsb3QpXG4gICAgICAgICAgICAgICAgaWYgZW50aXR5LnNsb3QocHJvcC5zbG90KSBpcyBwcm9wLnZhbHVlXG4gICAgICAgICAgICAgICAgICAgIGVudGl0aWVzLnB1c2goZW50aXR5KVxuXG4gICAgICAgIGlmIGVudGl0aWVzLmxlbmd0aCA+IDBcbiAgICAgICAgICAgIHJldHVybiBlbnRpdGllc1xuICAgICAgICBlbHNlXG4gICAgICAgICAgICBHKFwiTm90Rm91bmRcIilcblxuICAgIGZpcnN0X2J5X3Byb3A6IChwcm9wKSAtPlxuICAgICAgICBlbnRpdGllcyA9IEBieV9wcm9wKHByb3ApXG4gICAgICAgIGlmIGVudGl0aWVzIGluc3RhbmNlb2YgR2xpdGNoXG4gICAgICAgICAgICByZXR1cm4gZW50aXRpZXNcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgZW50aXRpZXNbMF1cblxuICAgIGJ5X3RhZ3M6ICh0YWdzKSAtPlxuICAgICAgICBlbnRpdGllcyA9IFtdXG4gICAgICAgIGZvciBlbnRpdHkgaW4gQGVudGl0aWVzLm9iamVjdHMoKVxuICAgICAgICAgICAgZm9yIHRhZyBpbiB0YWdzXG4gICAgICAgICAgICAgICAgaWYgdGFnIGluIGVudGl0eS50YWdzXG4gICAgICAgICAgICAgICAgICAgIGVudGl0aWVzLnB1c2ggZW50aXR5XG5cbiAgICAgICAgaWYgZW50aXRpZXMubGVuZ3RoID4gMFxuICAgICAgICAgICAgcmV0dXJuIGVudGl0aWVzXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIEcoXCJOb3RGb3VuZFwiKVxuXG4gICAgZmlyc3RfYnlfdGFnczogKHRhZ3MpIC0+XG4gICAgICAgIGVudGl0aWVzID0gQGJ5X3RhZ3ModGFncylcbiAgICAgICAgaWYgZW50aXRpZXMgaW5zdGFuY2VvZiBHbGl0Y2hcbiAgICAgICAgICAgIHJldHVybiBlbnRpdGllc1xuICAgICAgICBlbHNlXG4gICAgICAgICAgICBlbnRpdGllc1swXVxuXG5cbmNsYXNzIEJ1cyBleHRlbmRzIE5hbWVTcGFjZVxuXG4gICAgY29uc3RydWN0b3I6IChAbmFtZSwgc2VwKSAtPlxuICAgICAgICBzdXBlcihAbmFtZSwgc2VwKVxuXG4gICAgdHJpZ2dlcjogKHNpZ25hbCkgLT5cbiAgICAgICAgZm9yIG9iaiBpbiBAb2JqZWN0cygpXG4gICAgICAgICAgICBpZiBvYmogaW5zdGFuY2VvZiBTeXN0ZW1cbiAgICAgICAgICAgICAgICBvYmoucmFpc2Uoc2lnbmFsKVxuXG5jbGFzcyBCb2FyZFxuXG4gICAgY29uc3RydWN0b3I6ICh3aXJlQ2xhc3MsIGJ1c0NsYXNzLCBzdG9yZUNsYXNzKSAtPlxuICAgICAgICBAd2lyZUNsYXNzID0gd2lyZUNsYXNzIHx8IFdpcmVcbiAgICAgICAgQGJ1c0NsYXNzID0gYnVzQ2xhc3MgfHwgQnVzXG4gICAgICAgIEBzdG9yZUNsYXNzID0gc3RvcmVDbGFzcyB8fCBTdG9yZVxuXG4gICAgICAgIEBpbml0KClcblxuICAgIGluaXQ6IC0+XG4gICAgICAgIEBidXMgPSBuZXcgQGJ1c0NsYXNzKFwiYnVzXCIpXG4gICAgICAgIEBzdG9yZSA9IG5ldyBAc3RvcmVDbGFzcygpXG4gICAgICAgIEBzeXN0ZW1zID0gQGJ1c1xuICAgICAgICBAd2lyZXMgPSBuZXcgTmFtZVNwYWNlKFwid2lyZXNcIilcblxuICAgICAgICBAYnVzLmJpbmQoUyhcInN0b3JlXCIpLCBAc3RvcmUpXG4gICAgICAgIEBidXMuYmluZChTKFwid2lyZXNcIiksIEB3aXJlcylcblxuICAgIHNldHVwOiAoeG1sLCBjbG9uZSkgLT5cbiAgICAgICAgaWYgeG1sXG4gICAgICAgICAgICBkb2MgPSBuZXcgZG9tKCkucGFyc2VGcm9tU3RyaW5nKHhtbClcbiAgICAgICAgICAgIGJvYXJkID0geHBhdGguc2VsZWN0KFwiYm9hcmRcIiwgZG9jKVswXVxuICAgICAgICAgICAgYm9hcmRfbmFtZSA9IGJvYXJkLmdldEF0dHJpYnV0ZShcIm5hbWVcIilcbiAgICAgICAgICAgIGJ1c19jbGFzcyA9IHhwYXRoLnNlbGVjdChcIkJ1c1wiLCBib2FyZClbMF0uZ2V0QXR0cmlidXRlKFwiY2xhc3NcIilcbiAgICAgICAgICAgIHN0b3JlX2NsYXNzID0geHBhdGguc2VsZWN0KFwiU3RvcmVcIiwgYm9hcmQpWzBdLmdldEF0dHJpYnV0ZShcImNsYXNzXCIpXG4gICAgICAgICAgICB3aXJlX2NsYXNzID0geHBhdGguc2VsZWN0KFwiV2lyZVwiLCBib2FyZClbMF0uZ2V0QXR0cmlidXRlKFwiY2xhc3NcIilcblxuICAgICAgICAgICAgaWYgY2xvbmVcbiAgICAgICAgICAgICAgICBib2FyZF9uZXcgPSBuZXcgQm9hcmQoYm9hcmRfbmFtZSwgZ2xvYmFsW3dpcmVfY2xhc3NdLCBnbG9iYWxbYnVzX2NsYXNzXSwgZ2xvYmFsW3N0b3JlX2NsYXNzXSlcbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICBib2FyZF9uZXcgPSBAXG4gICAgICAgICAgICAgICAgYm9hcmRfbmV3LmluaXQoKVxuXG4gICAgICAgICAgICBzeXNzID0geHBhdGguc2VsZWN0KFwic3lzdGVtXCIsIGJvYXJkKVxuICAgICAgICAgICAgZm9yIHN5cyBpbiBzeXNzXG4gICAgICAgICAgICAgICAgbmFtZSA9IHN5cy5nZXRBdHRyaWJ1dGUoXCJuYW1lXCIpXG4gICAgICAgICAgICAgICAga2xhc3MgPSBzeXMuZ2V0QXR0cmlidXRlKFwiY2xhc3NcIilcbiAgICAgICAgICAgICAgICBjb25mX25vZGUgPSB4cGF0aC5zZWxlY3QoXCJjb25maWd1cmF0aW9uXCIsIHN5cylbMF1cbiAgICAgICAgICAgICAgICBkYXRhX3Byb3BzID0ge31cbiAgICAgICAgICAgICAgICBwcm9wcyA9IHhwYXRoLnNlbGVjdChcIi8vcHJvcGVydHlcIiwgY29uZl9ub2RlKVxuICAgICAgICAgICAgICAgIGZvciBwcm9wIGluIHByb3BzXG4gICAgICAgICAgICAgICAgICAgIGRhdGFfcHJvcCA9IGRvbTJwcm9wKHByb3ApXG4gICAgICAgICAgICAgICAgICAgIGRhdGFfcHJvcHNbZGF0YV9wcm9wLnNsb3RdID0gZGF0YV9wcm9wLnZhbHVlXG5cbiAgICAgICAgICAgICAgICBib2FyZF9uZXcuYWRkKFMobmFtZSksIGdsb2JhbFtrbGFzc10sIEQoZGF0YV9wcm9wcykpXG5cbiAgICAgICAgICAgIHdpcmVzID0geHBhdGguc2VsZWN0KFwiLy93aXJlXCIsIGJvYXJkKVxuICAgICAgICAgICAgZm9yIHdpcmUgaW4gd2lyZXNcbiAgICAgICAgICAgICAgICBzb3VyY2VfbmFtZSA9IHhwYXRoLnNlbGVjdChcInNvdXJjZVwiLCB3aXJlKVswXS5nZXRBdHRyaWJ1dGUoXCJuYW1lXCIpXG4gICAgICAgICAgICAgICAgb3V0bGV0X25hbWUgPSB4cGF0aC5zZWxlY3QoXCJvdXRsZXRcIiwgd2lyZSlbMF0uZ2V0QXR0cmlidXRlKFwibmFtZVwiKVxuICAgICAgICAgICAgICAgIHNpbmtfbmFtZSA9IHhwYXRoLnNlbGVjdChcInNpbmtcIiwgd2lyZSlbMF0uZ2V0QXR0cmlidXRlKFwibmFtZVwiKVxuICAgICAgICAgICAgICAgIGlubGV0X25hbWUgPSB4cGF0aC5zZWxlY3QoXCJpbmxldFwiLCB3aXJlKVswXS5nZXRBdHRyaWJ1dGUoXCJuYW1lXCIpXG5cbiAgICAgICAgICAgICAgICBib2FyZF9uZXcuY29ubmVjdChzb3VyY2VfbmFtZSwgc2lua19uYW1lLCBvdXRsZXRfbmFtZSwgaW5sZXRfbmFtZSlcblxuICAgICAgICAgICAgcmV0dXJuIGJvYXJkX25ld1xuICAgICAgICBlbHNlXG4gICAgICAgICAgICB4bWwgPSAnPD94bWwgdmVyc2lvbiA9IFwiMS4wXCIgc3RhbmRhbG9uZT1cInllc1wiPz4nXG4gICAgICAgICAgICBpZiBAc3ltYm9sP1xuICAgICAgICAgICAgICAgIGJvYXJkX25hbWUgPSBAc3ltYm9sLm5hbWVcbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICBib2FyZF9uYW1lID0gXCJiXCJcbiAgICAgICAgICAgIHhtbCArPSBcIjxib2FyZCBuYW1lPScje2JvYXJkX25hbWV9Jz5cIlxuICAgICAgICAgICAgeG1sICs9IFwiPEJ1cyBjbGFzcz0nI3tAYnVzLmNvbnN0cnVjdG9yLm5hbWV9Jy8+XCJcbiAgICAgICAgICAgIHhtbCArPSBcIjxTdG9yZSBjbGFzcz0nI3tAc3RvcmUuY29uc3RydWN0b3IubmFtZX0nLz5cIlxuICAgICAgICAgICAgeG1sICs9IFwiPFdpcmUgY2xhc3M9JyN7QHdpcmVDbGFzcy5uYW1lfScvPlwiXG4gICAgICAgICAgICBmb3Igc3lzIGluIEBzeXN0ZW1zLnN5bWJvbHMoKVxuICAgICAgICAgICAgICAgIGlmIHN5cy5uYW1lIG5vdCBpbiBbXCJ3aXJlc1wiLCBcInN0b3JlXCJdXG4gICAgICAgICAgICAgICAgICAgIHhtbCArPSBzeXMub2JqZWN0LnNlcmlhbGl6ZSgpXG4gICAgICAgICAgICBmb3IgY29ubiBpbiBAd2lyZXMuc3ltYm9scygpXG4gICAgICAgICAgICAgICAgeG1sICs9IGNvbm4ub2JqZWN0LnNlcmlhbGl6ZSgpXG4gICAgICAgICAgICB4bWwgKz0gXCI8L2JvYXJkPlwiXG5cblxuICAgIGNvbm5lY3Q6IChzb3VyY2UsIHNpbmssIG91dGxldCwgaW5sZXQsIHN5bWJvbCkgLT5cbiAgICAgICAgd2lyZSA9IG5ldyBAd2lyZUNsYXNzKHRoaXMsIHNvdXJjZSwgc2luaywgb3V0bGV0LCBpbmxldClcbiAgICAgICAgaWYgIXN5bWJvbFxuICAgICAgICAgICAgbmFtZSA9IEBidXMuZ2Vuc3ltKFwid2lyZVwiKVxuICAgICAgICAgICAgc3ltYm9sID0gbmV3IFN5bWJvbChuYW1lKVxuICAgICAgICBAd2lyZXMuYmluZChzeW1ib2wsIHdpcmUpXG5cbiAgICAgICAgZm9yIHNvdXJjZV9vdXRsZXQgaW4gd2lyZS5zb3VyY2Uub2JqZWN0Lm91dGxldHMuc3ltYm9scygpXG4gICAgICAgICAgICBpZiBzb3VyY2Vfb3V0bGV0Lm5hbWUgaXMgd2lyZS5vdXRsZXQubmFtZVxuICAgICAgICAgICAgICAgIHNvdXJjZV9vdXRsZXQub2JqZWN0LnB1c2goc3ltYm9sKVxuXG4gICAgcGlwZTogKHNvdXJjZSwgd2lyZSwgc2luaykgLT5cbiAgICAgICAgQGNvbm5lY3Qoc291cmNlLCBzaW5rLCB3aXJlKVxuXG4gICAgZGlzY29ubmVjdDogKG5hbWUpIC0+XG4gICAgICAgIHdpcmUgPSBAd2lyZShuYW1lKVxuICAgICAgICBAd2lyZXMudW5iaW5kKG5hbWUpXG5cbiAgICAgICAgZm9yIG91dGxldCBpbiB3aXJlLnNvdXJjZS5vYmplY3Qub3V0bGV0cy5zeW1ib2xzKClcbiAgICAgICAgICAgIGlmIG91dGxldC5uYW1lIGlzIHdpcmUub3V0bGV0Lm5hbWVcbiAgICAgICAgICAgICAgICB3aXJlcyA9IFtdXG4gICAgICAgICAgICAgICAgZm9yIGNvbm4gaW4gb3V0bGV0Lm9iamVjdFxuICAgICAgICAgICAgICAgICAgICBpZiBjb25uLm5hbWUgIT0gbmFtZVxuICAgICAgICAgICAgICAgICAgICAgICAgd2lyZXMucHVzaChjb25uKVxuICAgICAgICAgICAgICAgIG91dGxldC5vYmplY3QgPSB3aXJlc1xuXG5cbiAgICB3aXJlOiAobmFtZSkgLT5cbiAgICAgICAgQHdpcmVzLm9iamVjdChuYW1lKVxuXG4gICAgaGFzd2lyZTogKG5hbWUpIC0+XG4gICAgICAgIEB3aXJlcy5oYXMobmFtZSlcblxuICAgIGFkZDogKHN5bWJvbCwgc3lzdGVtQ2xhc3MsIGNvbmYpIC0+XG4gICAgICAgIHN5c3RlbSA9IG5ldyBzeXN0ZW1DbGFzcyh0aGlzLCBjb25mKVxuICAgICAgICBAYnVzLmJpbmQoc3ltYm9sLCBzeXN0ZW0pXG5cbiAgICBoYXM6IChuYW1lKSAtPlxuICAgICAgICBAYnVzLmhhcyhuYW1lKVxuXG4gICAgc3lzdGVtOiAobmFtZSkgLT5cbiAgICAgICAgQGJ1cy5vYmplY3QobmFtZSlcblxuICAgIHJlbW92ZTogKG5hbWUpIC0+XG4gICAgICAgIHN5c3RlbSA9IEBidXMub2JqZWN0KG5hbWUpXG4gICAgICAgIHN5c3RlbS5wdXNoKEBTVE9QKVxuICAgICAgICBAYnVzLnVuYmluZChuYW1lKVxuXG5leHBvcnRzLlN5bWJvbCA9IFN5bWJvbFxuZXhwb3J0cy5OYW1lU3BhY2UgPSBOYW1lU3BhY2VcbmV4cG9ydHMuUyA9IFNcbmV4cG9ydHMuRGF0YSA9IERhdGFcbmV4cG9ydHMuRCA9IERcbmV4cG9ydHMuU2lnbmFsID0gU2lnbmFsXG5leHBvcnRzLkV2ZW50ID0gRXZlbnRcbmV4cG9ydHMuR2xpdGNoID0gR2xpdGNoXG5leHBvcnRzLkcgPSBHXG5leHBvcnRzLlRva2VuID0gVG9rZW5cbmV4cG9ydHMuc3RhcnQgPSBzdGFydFxuZXhwb3J0cy5zdG9wID0gc3RvcFxuZXhwb3J0cy5UID0gVFxuZXhwb3J0cy5QYXJ0ID0gUGFydFxuZXhwb3J0cy5QID0gUFxuZXhwb3J0cy5FbnRpdHkgPSBFbnRpdHlcbmV4cG9ydHMuRSA9IEVcbmV4cG9ydHMuQ2VsbCA9IENlbGxcbmV4cG9ydHMuQyA9IENcbmV4cG9ydHMuU3lzdGVtID0gU3lzdGVtXG5leHBvcnRzLldpcmUgPSBXaXJlXG5leHBvcnRzLlN0b3JlID0gU3RvcmVcbmV4cG9ydHMuQnVzID0gQnVzXG5leHBvcnRzLkJvYXJkID0gQm9hcmRcblxuIl0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9