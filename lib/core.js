var Board, Bus, C, Cell, D, Data, E, Entity, Event, G, Glitch, NameSpace, P, Part, S, Signal, Store, Symbol, System, T, Token, Wire, clone, dom, dom2prop, lodash, start, stop, uuid, xpath,
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

  Symbol.prototype.full_name = function() {
    if (this.ns != null) {
      return this.ns.name + this.ns.sep + this.name;
    } else {
      return this.name;
    }
  };

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
    this.values = [];
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
    if (value != null) {
      if (this[value]) {
        delete this[value];
      }
      this.value = value;
      if (typeof this.value === "string") {
        this[this.value] = true;
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
    props.id = props.id || uuid.v4();
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

exports.Board = Board;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29yZS5qcyIsInNvdXJjZXMiOlsiY29yZS5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsSUFBQSx1TEFBQTtFQUFBOzs7aVNBQUE7O0FBQUEsSUFBQSxHQUFPLE9BQUEsQ0FBUSxXQUFSLENBQVAsQ0FBQTs7QUFBQSxNQUNBLEdBQVMsT0FBQSxDQUFRLFFBQVIsQ0FEVCxDQUFBOztBQUFBLEtBRUEsR0FBUSxPQUFBLENBQVEsT0FBUixDQUZSLENBQUE7O0FBQUEsS0FHQSxHQUFRLE9BQUEsQ0FBUSxPQUFSLENBSFIsQ0FBQTs7QUFBQSxHQUlBLEdBQU0sT0FBQSxDQUFRLFFBQVIsQ0FBaUIsQ0FBQyxTQUp4QixDQUFBOztBQUFBLFFBS0EsR0FBVyxPQUFBLENBQVEsV0FBUixDQUFvQixDQUFDLFFBTGhDLENBQUE7O0FBQUE7QUFTaUIsRUFBQSxnQkFBRSxJQUFGLEVBQVMsTUFBVCxFQUFrQixFQUFsQixFQUFzQixLQUF0QixHQUFBO0FBQ1QsSUFEVSxJQUFDLENBQUEsT0FBQSxJQUNYLENBQUE7QUFBQSxJQURpQixJQUFDLENBQUEsU0FBQSxNQUNsQixDQUFBO0FBQUEsSUFEMEIsSUFBQyxDQUFBLEtBQUEsRUFDM0IsQ0FBQTtBQUFBLElBQUEsSUFBRyxhQUFIO0FBQ0ksTUFBQSxJQUFDLENBQUEsS0FBRCxDQUFPLEtBQVAsQ0FBQSxDQURKO0tBRFM7RUFBQSxDQUFiOztBQUFBLG1CQUlBLFNBQUEsR0FBVyxTQUFBLEdBQUE7QUFDUixJQUFBLElBQUcsZUFBSDtBQUNJLGFBQU8sSUFBQyxDQUFBLEVBQUUsQ0FBQyxJQUFKLEdBQVcsSUFBQyxDQUFBLEVBQUUsQ0FBQyxHQUFmLEdBQXFCLElBQUMsQ0FBQSxJQUE3QixDQURKO0tBQUEsTUFBQTtBQUdJLGFBQU8sSUFBQyxDQUFBLElBQVIsQ0FISjtLQURRO0VBQUEsQ0FKWCxDQUFBOztBQUFBLG1CQVVBLElBQUEsR0FBTSxTQUFDLENBQUQsRUFBSSxDQUFKLEdBQUE7QUFDRixJQUFBLElBQUcs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QUFlLElBeHNCZixDQUFBOztBQUFBLE9BeXNCTyxDQUFDLENBQVIsR0FBWSxDQXpzQlosQ0FBQTs7QUFBQSxPQTBzQk8sQ0FBQyxJQUFSLEdBQWUsSUExc0JmLENBQUE7O0FBQUEsT0Eyc0JPLENBQUMsQ0FBUixHQUFZLENBM3NCWixDQUFBOztBQUFBLE9BNHNCTyxDQUFDLE1BQVIsR0FBaUIsTUE1c0JqQixDQUFBOztBQUFBLE9BNnNCTyxDQUFDLENBQVIsR0FBWSxDQTdzQlosQ0FBQTs7QUFBQSxPQThzQk8sQ0FBQyxJQUFSLEdBQWUsSUE5c0JmLENBQUE7O0FBQUEsT0Erc0JPLENBQUMsQ0FBUixHQUFZLENBL3NCWixDQUFBOztBQUFBLE9BZ3RCTyxDQUFDLE1BQVIsR0FBaUIsTUFodEJqQixDQUFBOztBQUFBLE9BaXRCTyxDQUFDLElBQVIsR0FBZSxJQWp0QmYsQ0FBQTs7QUFBQSxPQWt0Qk8sQ0FBQyxLQUFSLEdBQWdCLEtBbHRCaEIsQ0FBQTs7QUFBQSxPQW10Qk8sQ0FBQyxHQUFSLEdBQWMsR0FudEJkLENBQUE7O0FBQUEsT0FvdEJPLENBQUMsS0FBUixHQUFnQixLQXB0QmhCLENBQUEiLCJzb3VyY2VzQ29udGVudCI6WyJ1dWlkID0gcmVxdWlyZSBcIm5vZGUtdXVpZFwiIFxubG9kYXNoID0gcmVxdWlyZSBcImxvZGFzaFwiXG5jbG9uZSA9IHJlcXVpcmUgXCJjbG9uZVwiXG54cGF0aCA9IHJlcXVpcmUgXCJ4cGF0aFwiXG5kb20gPSByZXF1aXJlKFwieG1sZG9tXCIpLkRPTVBhcnNlclxuZG9tMnByb3AgPSByZXF1aXJlKFwiLi9oZWxwZXJzXCIpLmRvbTJwcm9wXG5cbmNsYXNzIFN5bWJvbFxuXG4gICAgY29uc3RydWN0b3I6IChAbmFtZSwgQG9iamVjdCwgQG5zLCBhdHRycykgLT5cbiAgICAgICAgaWYgYXR0cnM/XG4gICAgICAgICAgICBAYXR0cnMoYXR0cnMpXG5cbiAgICBmdWxsX25hbWU6IC0+XG4gICAgICAgaWYgQG5zP1xuICAgICAgICAgICByZXR1cm4gQG5zLm5hbWUgKyBAbnMuc2VwICsgQG5hbWVcbiAgICAgICAgZWxzZVxuICAgICAgICAgICByZXR1cm4gQG5hbWVcblxuICAgIGF0dHI6IChrLCB2KSAtPlxuICAgICAgICBpZiB2P1xuICAgICAgICAgICAgQFtrXSA9IHZcbiAgICAgICAgICAgIEBba11cbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgQFtrXVxuXG4gICAgb3A6IChmLCBhcmdzLi4uKSAtPlxuICAgICAgICByZXR1cm4gZi5hcHBseSh0aGlzLCBhcmdzKVxuXG4gICAgYXR0cnM6IChrdikgLT5cbiAgICAgICAgZm9yIGssIHYgaW4ga3ZcbiAgICAgICAgICAgIEBba10gPSB2XG5cbiAgICBpczogKHN5bWJvbCkgLT5cbiAgICAgICAgaWYgc3ltYm9sLm5hbWUgaXMgQG5hbWVcbiAgICAgICAgICAgIGlmIHN5bWJvbC5vYmplY3QgaXMgQG9iamVjdFxuICAgICAgICAgICAgICAgIHJldHVybiB0cnVlXG4gICAgICAgICAgICBpZiAoc3ltYm9sLm9iamVjdCBpcyBudWxsKSBhbmQgKEBvYmplY3QgaXMgbnVsbClcbiAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZVxuICAgICAgICBlbHNlXG4gICAgICAgICAgICByZXR1cm4gZmFsc2VcblxuUyA9IChuYW1lLCBvYmplY3QsIG5zLCBhdHRycykgLT5cbiAgICByZXR1cm4gbmV3IFN5bWJvbChuYW1lLCBvYmplY3QsIG5zLCBhdHRycylcblxuIyBzaG91bGQgYmUgYSBzZXRcblxuY2xhc3MgTmFtZVNwYWNlXG5cbiAgICBjb25zdHJ1Y3RvcjogKEBuYW1lLCBzZXApIC0+XG4gICAgICAgIEBlbGVtZW50cyA9IHt9XG4gICAgICAgIEBzZXAgPSBzZXAgfHwgXCIuXCJcbiAgICAgICAgQF9fZ2Vuc3ltID0gMFxuXG4gICAgYmluZDogKHN5bWJvbCwgb2JqZWN0LCBjbGFzc19uYW1lKSAtPlxuICAgICAgICBzeW1ib2wuY2xhc3MgPSBjbGFzc19uYW1lIHx8IG9iamVjdC5jb25zdHJ1Y3Rvci5uYW1lXG4gICAgICAgIG5hbWUgPSBzeW1ib2wubmFtZVxuICAgICAgICBzeW1ib2wub2JqZWN0ID0gb2JqZWN0XG4gICAgICAgIG9iamVjdC5zeW1ib2wgPSBzeW1ib2xcbiAgICAgICAgQGVsZW1lbnRzW25hbWVdID0gc3ltYm9sXG4gICAgICAgIHN5bWJvbC5ucyA9IHRoaXNcbiAgICAgICAgc3ltYm9sXG5cbiAgICB1bmJpbmQ6IChuYW1lKSAtPlxuICAgICAgICBzeW1ib2wgPSBAZWxlbWVudHNbbmFtZV1cbiAgICAgICAgZGVsZXRlIEBlbGVtZW50c1tuYW1lXVxuICAgICAgICBzeW1ib2wubnMgPSB1bmRlZmluZWRcbiAgICAgICAgc3ltYm9sLm9iamVjdCA9IHVuZGVmaW5lZFxuICAgICAgICBzeW1ib2wuY2xhc3MgPSB1bmRlZmluZWRcblxuICAgIHN5bWJvbDogKG5hbWUpIC0+XG4gICAgICAgIGlmIEBoYXMobmFtZSlcbiAgICAgICAgICAgIEBlbGVtZW50c1tuYW1lXVxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBTKFwiTm90Rm91bmRcIilcblxuICAgIGhhczogKG5hbWUpIC0+XG4gICAgICAgIGlmIEBlbGVtZW50c1tuYW1lXT9cbiAgICAgICAgICAgIHJldHVybiB0cnVlXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIHJldHVybiBmYWxzZVxuXG4gICAgb2JqZWN0OiAobmFtZSkgLT5cbiAgICAgICAgaWYgQGhhcyhuYW1lKVxuICAgICAgICAgICAgQGVsZW1lbnRzW25hbWVdLm9iamVjdFxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBHKFwiTm90Rm91bmRcIilcblxuICAgIHN5bWJvbHM6ICgpIC0+XG4gICAgICAgc3ltYm9scyA9IFtdXG5cbiAgICAgICBmb3Igayx2IG9mIEBlbGVtZW50c1xuICAgICAgICAgICBzeW1ib2xzLnB1c2godilcblxuICAgICAgIHN5bWJvbHNcblxuICAgIG9iamVjdHM6ICgpIC0+XG4gICAgICAgb2JqZWN0cyA9IFtdXG5cbiAgICAgICBmb3Igayx2IG9mIEBlbGVtZW50c1xuICAgICAgICAgICBvYmplY3RzLnB1c2godi5vYmplY3QpXG5cbiAgICAgICBvYmplY3RzXG5cbiAgICBnZW5zeW06IChwcmVmaXgpIC0+XG4gICAgICAgIHByZWZpeCA9IHByZWZpeCB8fCBcImdlbnN5bVwiXG4gICAgICAgIHByZWZpeCArIFwiOlwiICsgKEBfX2dlbnN5bSsrKVxuXG5cbmNsYXNzIERhdGFcblxuICAgIGNvbnN0cnVjdG9yOiAocHJvcHMpIC0+XG4gICAgICAgIEBfX3Nsb3RzID0gW11cbiAgICAgICAgaWYgcHJvcHM/XG4gICAgICAgICAgICBAcHJvcHMocHJvcHMpXG5cbiAgICBpczogKGRhdGEpIC0+XG4gICAgICAgIGFsbF9zbG90cyA9IEBzbG90cygpXG4gICAgICAgIGZvciBuYW1lIGluIGRhdGEuc2xvdHMoKVxuICAgICAgICAgICAgaWYgZGF0YS5zbG90KG5hbWUpICE9IEBzbG90KG5hbWUpXG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlXG5cbiAgICAgICAgcmV0dXJuIHRydWVcblxuICAgIHByb3BzOiAoa3YpIC0+XG4gICAgICAgIGlmIGt2XG4gICAgICAgICAgICBmb3IgaywgdiBvZiBrdlxuICAgICAgICAgICAgICAgIEBba10gPSB2XG4gICAgICAgICAgICAgICAgaWYgayBub3QgaW4gQHNsb3RzKClcbiAgICAgICAgICAgICAgICAgICAgQHNsb3RzKGspXG4gICAgICAgICAgICByZXR1cm4gQHZhbGlkYXRlKClcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgcHJvcGVydGllcyA9IFtdXG4gICAgICAgICAgICBmb3IgbmFtZSBpbiBAc2xvdHMoKVxuICAgICAgICAgICAgICAgIHByb3BlcnRpZXMucHVzaChAW25hbWVdKVxuICAgICAgICAgICAgcmV0dXJuIHByb3BlcnRpZXNcblxuICAgIHNsb3RzOiAobmFtZSkgLT5cbiAgICAgICAgaWYgbmFtZT9cbiAgICAgICAgICAgIEBfX3Nsb3RzLnB1c2gobmFtZSlcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgQF9fc2xvdHNcblxuICAgIHNsb3Q6IChuYW1lLCB2YWx1ZSkgLT5cbiAgICAgICAgaWYgdmFsdWU/XG4gICAgICAgICAgICBAW25hbWVdID0gdmFsdWVcbiAgICAgICAgICAgIGlmIG5hbWUgbm90IGluIEBzbG90cygpXG4gICAgICAgICAgICAgICAgQHNsb3RzKG5hbWUpXG4gICAgICAgICAgICBpZiBAdmFsaWRhdGUoKVxuICAgICAgICAgICAgICAgIHJldHVybiB2YWx1ZVxuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIEcoXCJJbnZhbGlkXCIpXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIGlmIEBoYXMobmFtZSlcbiAgICAgICAgICAgICAgICBAW25hbWVdXG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgRyhcIk5vdEZvdW5kXCIpXG5cbiAgICBoYXM6IChuYW1lKSAtPlxuICAgICAgICBpZiBuYW1lIGluIEBzbG90cygpXG4gICAgICAgICAgICByZXR1cm4gdHJ1ZVxuICAgICAgICBlbHNlXG4gICAgICAgICAgICByZXR1cm4gZmFsc2VcblxuICAgIHZhbGlkYXRlOiAtPlxuICAgICAgICB0cnVlXG5cbiAgICBfX3NlcmlhbGl6ZV9zY2FsYXI6IChzY2FsYXIpIC0+XG4gICAgICAgIHhtbCA9IFwiXCJcbiAgICAgICAgaWYgQXJyYXkuaXNBcnJheShzY2FsYXIpXG4gICAgICAgICAgICB0eXBlID0gXCJhcnJheVwiXG4gICAgICAgICAgICB4bWwgKz0gXCI8c2NhbGFyIHR5cGU9JyN7dHlwZX0nPlwiXG4gICAgICAgICAgICB4bWwgKz0gXCI8bGlzdD5cIlxuICAgICAgICAgICAgZm9yIGUgaW4gc2NhbGFyXG4gICAgICAgICAgICAgICAgeG1sICs9IEBfX3NlcmlhbGl6ZV9zY2FsYXIoZSlcbiAgICAgICAgICAgIHhtbCArPSBcIjwvbGlzdD5cIlxuICAgICAgICAgICAgeG1sICs9IFwiPC9zY2FsYXI+XCJcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgdHlwZSA9IHR5cGVvZiBzY2FsYXJcbiAgICAgICAgICAgIHhtbCArPSBcIjxzY2FsYXIgdHlwZT0nI3t0eXBlfSc+I3tzY2FsYXIudG9TdHJpbmcoKX08L3NjYWxhcj5cIlxuICAgICAgICB4bWxcblxuICAgIHNlcmlhbGl6ZTogLT5cbiAgICAgICAgeG1sID0gXCJcIlxuICAgICAgICBmb3IgbmFtZSBpbiBAc2xvdHMoKVxuICAgICAgICAgICAgeG1sICs9IFwiPHByb3BlcnR5IHNsb3Q9JyN7bmFtZX0nPlwiXG4gICAgICAgICAgICBzY2FsYXIgID0gQHNsb3QobmFtZSlcbiAgICAgICAgICAgIHhtbCArPSBAX19zZXJpYWxpemVfc2NhbGFyKHNjYWxhcilcbiAgICAgICAgICAgIHhtbCArPSAnPC9wcm9wZXJ0eT4nXG4gICAgICAgIHhtbFxuXG5EID0gKHByb3BzKSAtPlxuICAgIHJldHVybiBuZXcgRGF0YShwcm9wcylcblxuY2xhc3MgU2lnbmFsIGV4dGVuZHMgRGF0YVxuXG4gICAgY29uc3RydWN0b3I6IChuYW1lLCBwYXlsb2FkLCBwcm9wcykgLT5cbiAgICAgICAgcHJvcHMgPSBwcm9wcyB8fCB7fVxuICAgICAgICBwcm9wcy5uYW1lID0gbmFtZVxuICAgICAgICBwcm9wcy5wYXlsb2FkID0gcGF5bG9hZFxuICAgICAgICBzdXBlcihwcm9wcylcblxuY2xhc3MgRXZlbnQgZXh0ZW5kcyBTaWduYWxcblxuICAgIGNvbnN0cnVjdG9yOiAobmFtZSwgcGF5bG9hZCwgcHJvcHMpIC0+XG4gICAgICAgIHByb3BzID0gcHJvcHMgfHwge31cbiAgICAgICAgcG9wcy50cyA9IG5ldyBEYXRlKCkuZ2V0VGltZSgpXG4gICAgICAgIHN1cGVyKG5hbWUsIHBheWxvYWQsIHByb3BzKVxuXG5jbGFzcyBHbGl0Y2ggZXh0ZW5kcyBEYXRhXG5cbiAgICBjb25zdHJ1Y3RvcjogKG5hbWUsIGNvbnRleHQsIHByb3BzKSAtPlxuICAgICAgICBwcm9wcyA9IHByb3BzIHx8IHt9XG4gICAgICAgIHByb3BzLm5hbWUgPSBuYW1lXG4gICAgICAgIHByb3BzLmNvbnRlbnh0ID0gY29udGV4dFxuICAgICAgICBzdXBlcihwcm9wcylcblxuRyA9IChuYW1lLCBwcm9wcykgLT5cbiAgICByZXR1cm4gbmV3IEdsaXRjaChuYW1lLCBwcm9wcylcblxuY2xhc3MgVG9rZW4gZXh0ZW5kcyBEYXRhXG5cbiAgICBjb25zdHJ1Y3RvcjogKHZhbHVlLCBzaWduLCBwcm9wcykgIC0+XG4gICAgICAgIHN1cGVyKHByb3BzKVxuICAgICAgICBAc2lnbnMgPSBbXVxuICAgICAgICBAdmFsdWVzID0gW11cbiAgICAgICAgQHN0YW1wKHNpZ24sIHZhbHVlKVxuXG4gICAgaXM6ICh0KSAtPlxuICAgICAgICBmYWxzZVxuXG4gICAgdmFsdWU6IC0+XG4gICAgICAgIEB2YWx1ZVxuXG4gICAgc3RhbXBfYnk6IChpbmRleCkgLT5cbiAgICAgICAgaWYgaW5kZXg/XG4gICAgICAgICAgIGlmIEBzaWduc1tpbmRleF0/XG4gICAgICAgICAgICAgICByZXR1cm4gQHNpZ25zW2luZGV4XVxuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgcmV0dXJuIFMoXCJOb3RGb3VuZFwiKVxuXG4gICAgICAgIGlmIEBzaWducy5sZW5ndGggPiAwXG4gICAgICAgICAgIHJldHVybiBAc2lnbnNbQHNpZ25zLmxlbmd0aCAtIDFdXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgcmV0dXJuIFMoXCJOb3RGb3VuZFwiKVxuXG4gICAgc3RhbXA6IChzaWduLCB2YWx1ZSkgLT5cbiAgICAgICAgaWYgdmFsdWU/XG4gICAgICAgICAgICBpZiBAW3ZhbHVlXVxuICAgICAgICAgICAgICAgIGRlbGV0ZSBAW3ZhbHVlXVxuICAgICAgICAgICAgQHZhbHVlID0gdmFsdWVcbiAgICAgICAgICAgIGlmIHR5cGVvZiBAdmFsdWUgaXMgXCJzdHJpbmdcIlxuICAgICAgICAgICAgICAgIEBbQHZhbHVlXSA9IHRydWVcbiAgICAgICAgICAgIEB2YWx1ZXMucHVzaCh2YWx1ZSlcbiAgICAgICAgaWYgc2lnblxuICAgICAgICAgICAgQHNpZ25zLnB1c2goc2lnbilcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgQHNpZ25zLnB1c2goUyhcIlVua25vd25cIikpXG5cblxuc3RhcnQgPSAoc2lnbiwgcHJvcHMpIC0+XG4gICAgcmV0dXJuIG5ldyBUb2tlbihcInN0YXJ0XCIsIHNpZ24sIHByb3BzKVxuXG5zdG9wID0gKHNpZ24sIHByb3BzKSAtPlxuICAgIHJldHVybiBuZXcgVG9rZW4oXCJzdG9wXCIsIHNpZ24sIHByb3BzKVxuXG5UID0gKHZhbHVlLCBzaWduLCBwcm9wcykgLT5cbiAgICByZXR1cm4gbmV3IFRva2VuKHZhbHVlLCBzaWduLCBwcm9wcylcblxuY2xhc3MgUGFydCBleHRlbmRzIERhdGFcblxuICAgIGNvbnN0cnVjdG9yOiAoQG5hbWUsIHByb3BzKSAtPlxuICAgICAgICBzdXBlcihwcm9wcylcblxuICAgIHNlcmlhbGl6ZTogLT5cbiAgICAgICAgeG1sICs9IFwiPHBhcnQgbmFtZT0nI3tAbmFtZX0nPlwiXG4gICAgICAgIHhtbCArPSBzdXBlcigpXG4gICAgICAgIHhtbCArPSAnPC9wYXJ0PidcblxuUCA9IChuYW1lLCBwcm9wcykgLT5cbiAgICByZXR1cm4gbmV3IFBhcnQobmFtZSwgcHJvcHMpXG5cbmNsYXNzIEVudGl0eSBleHRlbmRzIERhdGFcblxuICAgIGNvbnN0cnVjdG9yOiAodGFncywgcHJvcHMpIC0+XG4gICAgICAgIEBwYXJ0cyA9IG5ldyBOYW1lU3BhY2UoXCJwYXJ0c1wiKVxuICAgICAgICBwcm9wcyA9IHByb3BzIHx8IHt9XG4gICAgICAgIHByb3BzLmlkID0gcHJvcHMuaWQgfHwgdXVpZC52NCgpXG4gICAgICAgIHByb3BzLnRzID0gcHJvcHMudHMgfHwgbmV3IERhdGUoKS5nZXRUaW1lKClcbiAgICAgICAgdGFncyA9IHRhZ3MgfHwgcHJvcHMudGFncyB8fCBbXVxuICAgICAgICBwcm9wcy50YWdzID0gdGFnc1xuICAgICAgICBzdXBlcihwcm9wcylcblxuICAgIGFkZDogKHN5bWJvbCwgcGFydCkgLT5cbiAgICAgICAgQHBhcnRzLmJpbmQoc3ltYm9sLCBwYXJ0KVxuXG4gICAgcmVtb3ZlOiAobmFtZSkgLT5cbiAgICAgICAgQHBhcnRzLnVuYmluZChuYW1lKVxuXG4gICAgaGFzUGFydDogKG5hbWUpIC0+XG4gICAgICAgIEBwYXJ0cy5oYXMobmFtZSlcblxuICAgIHBhcnQ6IChuYW1lKSAtPlxuICAgICAgICBAcGFydHMuc3ltYm9sKG5hbWUpXG5cbiAgICBzZXJpYWxpemU6IC0+XG4gICAgICAgIHhtbCA9IFwiPGVudGl0eT5cIlxuICAgICAgICB4bWwgKz0gJzxwYXJ0cz4nXG4gICAgICAgIGZvciBwYXJ0IG9mIEBwYXJ0cy5vYmplY3RzKClcbiAgICAgICAgICAgIHhtbCArPSBwYXJ0LnNlcmlhbGl6ZSgpXG4gICAgICAgIHhtbCArPSAnPC9wYXJ0cz4nXG4gICAgICAgIHhtbCArPSBzdXBlcigpXG4gICAgICAgIHhtbCArPSAnPC9lbnRpdHk+J1xuXG5FID0gKHRhZ3MsIHByb3BzKSAtPlxuICAgIHJldHVybiBuZXcgRW50aXR5KHRhZ3MsIHByb3BzKVxuXG5jbGFzcyBDZWxsIGV4dGVuZHMgRW50aXR5XG5cbiAgICBjb25zdHJ1Y3RvcjogKHRhZ3MsIHByb3BzKSAtPlxuICAgICAgICBzdXBlcih0YWdzLCBwcm9wcylcbiAgICAgICAgQG9ic2VydmVycz0gbmV3IE5hbWVTcGFjZShcIm9ic2VydmVyc1wiKVxuXG4gICAgbm90aWZ5OiAoZXZlbnQpIC0+XG4gICAgICAgZm9yIG9iIGluIEBvYnNlcnZlcnMub2JqZWN0cygpXG4gICAgICAgICAgICBvYi5yYWlzZShldmVudClcblxuICAgIGFkZDogKHBhcnQpIC0+XG4gICAgICAgIHN1cGVyIHBhcnRcbiAgICAgICAgZXZlbnQgPSBuZXcgRXZlbnQoXCJwYXJ0LWFkZGVkXCIsIHtwYXJ0OiBwYXJ0LCBjZWxsOiB0aGlzfSlcbiAgICAgICAgQG5vdGlmeShldmVudClcblxuICAgIHJlbW92ZTogKG5hbWUpIC0+XG4gICAgICAgIHN1cGVyIG5hbWVcbiAgICAgICAgZXZlbnQgPSBuZXcgRXZlbnQoXCJwYXJ0LXJlbW92ZWRcIiwge3BhcnQ6IHBhcnQsIGNlbGw6IHRoaXN9KVxuICAgICAgICBAbm90aWZ5KGV2ZW50KVxuXG4gICAgb2JzZXJ2ZTogKHN5bWJvbCwgc3lzdGVtKSAtPlxuICAgICAgICBAb2JzZXJ2ZXJzLmJpbmQoc3ltYm9sLCBzeXN0ZW0pXG5cbiAgICBmb3JnZXQ6IChuYW1lKSAtPlxuICAgICAgICBAb2JzZXJ2ZXJzLnVuYmluZChuYW1lKVxuXG4gICAgc3RlcDogKGZuLCBhcmdzLi4uKSAtPlxuICAgICAgICByZXR1cm4gZm4uYXBwbHkodGhpcywgYXJncylcblxuICAgIGNsb25lOiAoKSAtPlxuICAgICAgICByZXR1cm4gY2xvbmUodGhpcylcblxuQyA9ICh0YWdzLCBwcm9wcykgLT5cbiAgICByZXR1cm4gbmV3IENlbGwodGFncywgcHJvcHMpXG5cbmNsYXNzIFN5c3RlbVxuXG4gICAgY29uc3RydWN0b3I6IChAYiwgY29uZikgLT5cbiAgICAgICAgQGlubGV0cyA9IG5ldyBOYW1lU3BhY2UoXCJpbmxldHNcIilcbiAgICAgICAgQGlubGV0cy5iaW5kKG5ldyBTeW1ib2woXCJzeXNpblwiKSxbXSlcbiAgICAgICAgQGlubGV0cy5iaW5kKG5ldyBTeW1ib2woXCJmZWVkYmFja1wiKSxbXSlcbiAgICAgICAgQG91dGxldHMgPSBuZXcgTmFtZVNwYWNlKFwib3V0bGV0c1wiKVxuICAgICAgICBAb3V0bGV0cy5iaW5kKG5ldyBTeW1ib2woXCJzeXNvdXRcIiksW10pXG4gICAgICAgIEBvdXRsZXRzLmJpbmQobmV3IFN5bWJvbChcInN5c2VyclwiKSxbXSlcblxuICAgICAgICBAY29uZiA9IGNvbmYgfHwgRCgpXG4gICAgICAgIEBzdGF0ZSA9IFtdXG4gICAgICAgIEByID0ge31cblxuICAgIHRvcDogKGluZGV4KSAtPlxuICAgICAgICBpZiBpbmRleD9cbiAgICAgICAgICAgIGlmIEBzdGF0ZVtpbmRleF0/XG4gICAgICAgICAgICAgICAgcmV0dXJuIEBzdGF0ZVtpbmRleF1cbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICByZXR1cm4gUyhcIk5vdEZvdW5kXCIpXG5cbiAgICAgICAgaWYgQHN0YXRlLmxlbmd0aCA+IDBcbiAgICAgICAgICAgIHJldHVybiBAc3RhdGVbQHN0YXRlLmxlbmd0aCAtIDFdXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIHJldHVybiBTKFwiTm90Rm91bmRcIilcblxuICAgIGlucHV0OiAoZGF0YSwgaW5sZXQpIC0+XG4gICAgICAgIGRhdGFcblxuICAgIG91dHB1dDogKGRhdGEsIG91dGxldCkgLT5cbiAgICAgICAgZGF0YVxuXG4gICAgU1RPUDogKHN0b3BfdG9rZW4pIC0+XG5cbiAgICBwdXNoOiAoZGF0YSwgaW5sZXQpIC0+XG5cbiAgICAgICAgaW5sZXQgPSBpbmxldCB8fCBAaW5sZXRzLnN5bWJvbChcInN5c2luXCIpXG5cbiAgICAgICAgaW5wdXRfZGF0YSA9IEBpbnB1dChkYXRhLCBpbmxldClcblxuICAgICAgICBpZiBpbnB1dF9kYXRhIGluc3RhbmNlb2YgR2xpdGNoXG4gICAgICAgICAgICBAZXJyb3IoaW5wdXRfZGF0YSlcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgQHByb2Nlc3MgaW5wdXRfZGF0YSwgaW5sZXRcblxuICAgIGdvdG9fd2l0aDogKGlubGV0LCBkYXRhKSAtPlxuICAgICAgICBAcHVzaChkYXRhLCBpbmxldClcblxuICAgIHByb2Nlc3M6IChkYXRhLCBpbmxldCkgLT5cblxuICAgIGRpc3BhdGNoOiAoZGF0YSwgb3V0bGV0KSAtPlxuICAgICAgICBmb3Igb2wgaW4gQG91dGxldHMuc3ltYm9scygpXG4gICAgICAgICAgICBpZiBvbC5uYW1lID09IG91dGxldC5uYW1lXG4gICAgICAgICAgICAgICAgZm9yIHdpcmUgaW4gb2wub2JqZWN0XG4gICAgICAgICAgICAgICAgICAgIHdpcmUub2JqZWN0LnRyYW5zbWl0IGRhdGFcblxuICAgIGVtaXQ6IChkYXRhLCBvdXRsZXQpIC0+XG4gICAgICAgIG91dGxldCA9IG91dGxldCB8fCBAb3V0bGV0cy5zeW1ib2woXCJzeXNvdXRcIilcblxuICAgICAgICBvdXRwdXRfZGF0YSA9IEBvdXRwdXQoZGF0YSwgb3V0bGV0KVxuXG4gICAgICAgIGlmIG91dHB1dF9kYXRhIGluc3RhbmNlb2YgR2xpdGNoXG4gICAgICAgICAgICBAZXJyb3Iob3V0cHV0X2RhdGEpXG4gICAgICAgICAgICByZXR1cm5cblxuICAgICAgICBAZGlzcGF0Y2gob3V0cHV0X2RhdGEsIG91dGxldClcblxuXG4gICAgZXJyb3I6IChkYXRhKSAtPlxuICAgICAgICBAZGlzcGF0Y2goZGF0YSwgQG91dGxldHMuc3ltYm9sKFwic3lzZXJyXCIpKVxuXG4gICAgcmFpc2U6IChzaWduYWwpIC0+XG4gICAgICAgIEByZWFjdChzaWduYWwpXG5cbiAgICBpbnRlcnJ1cHQ6IChzaWduYWwpIC0+XG4gICAgICAgIEByZWFjdChzaWduYWwpXG5cbiAgICByZWFjdDogKHNpZ25hbCkgLT5cblxuICAgIHNob3c6IChkYXRhKSAtPlxuXG4gICAgc2VyaWFsaXplOiAtPlxuICAgICAgICB4bWwgPSBcIjxzeXN0ZW0gbmFtZT0nI3tAc3ltYm9sLm5hbWV9JyBjbGFzcz0nI3tAc3ltYm9sLmNsYXNzfSc+XCJcbiAgICAgICAgeG1sICs9IFwiPGNvbmZpZ3VyYXRpb24+XCJcbiAgICAgICAgeG1sICs9IEBjb25mLnNlcmlhbGl6ZSgpXG4gICAgICAgIHhtbCArPSBcIjwvY29uZmlndXJhdGlvbj5cIlxuICAgICAgICB4bWwgKz0gXCI8L3N5c3RlbT5cIlxuICAgICAgICB4bWxcblxuXG5jbGFzcyBXaXJlXG5cbiAgICBjb25zdHJ1Y3RvcjogKEBiLCBzb3VyY2UsIHNpbmssIG91dGxldCwgaW5sZXQpIC0+XG4gICAgICAgIG91dGxldCA9IG91dGxldCB8fCBcInN5c291dFwiXG4gICAgICAgIGlubGV0ID0gaW5sZXQgfHwgXCJzeXNpblwiXG4gICAgICAgIEBzb3VyY2UgPSBAYi5zeXN0ZW1zLnN5bWJvbChzb3VyY2UpXG4gICAgICAgIEBzaW5rID0gQGIuc3lzdGVtcy5zeW1ib2woc2luaylcbiAgICAgICAgQG91dGxldCA9IEBzb3VyY2Uub2JqZWN0Lm91dGxldHMuc3ltYm9sKG91dGxldClcbiAgICAgICAgQGlubGV0ID0gQHNpbmsub2JqZWN0LmlubGV0cy5zeW1ib2woaW5sZXQpXG5cbiAgICB0cmFuc21pdDogKGRhdGEpIC0+XG4gICAgICAgIEBzaW5rLm9iamVjdC5wdXNoKGRhdGEsIEBpbmxldClcblxuICAgIHNlcmlhbGl6ZTogLT5cbiAgICAgICAgeG1sID0gXCJcIlxuICAgICAgICB4bWwgKz0gXCI8d2lyZSBuYW1lPScje0BzeW1ib2wubmFtZX0nPlwiXG4gICAgICAgIHhtbCArPSBcIjxzb3VyY2UgbmFtZT0nI3tAc291cmNlLm5hbWV9Jy8+XCJcbiAgICAgICAgeG1sICs9IFwiPG91dGxldCBuYW1lPScje0BvdXRsZXQubmFtZX0nLz5cIlxuICAgICAgICB4bWwgKz0gXCI8c2luayBuYW1lPScje0BzaW5rLm5hbWV9Jy8+XCJcbiAgICAgICAgeG1sICs9IFwiPGlubGV0IG5hbWU9JyN7QGlubGV0Lm5hbWV9Jy8+XCJcbiAgICAgICAgeG1sICs9IFwiPC93aXJlPlwiXG4gICAgICAgIHhtbFxuXG5cblxuY2xhc3MgU3RvcmVcblxuICAgIGNvbnN0cnVjdG9yOiAtPlxuICAgICAgICBAZW50aXRpZXMgPSBuZXcgTmFtZVNwYWNlKFwiZW50aXRpZXNcIilcblxuICAgIGFkZDogKGVudGl0eSkgLT5cbiAgICAgICAgc3ltYm9sID0gUyhlbnRpdHkuaWQpXG4gICAgICAgIEBlbnRpdGllcy5iaW5kKHN5bWJvbCwgZW50aXR5KVxuICAgICAgICBlbnRpdHlcblxuICAgIHNuYXBzaG90OiAoKSAtPlxuICAgICAgICB4bWwgPSAnPD94bWwgdmVyc2lvbiA9IFwiMS4wXCIgc3RhbmRhbG9uZT1cInllc1wiPz4nXG4gICAgICAgIHhtbCArPSBcIjxzbmFwc2hvdD5cIlxuICAgICAgICBmb3IgZW50aXR5IGluIEBlbnRpdGllcy5vYmplY3RzKClcbiAgICAgICAgICAgIHhtbCArPSBlbnRpdHkuc2VyaWFsaXplKClcbiAgICAgICAgeG1sICs9IFwiPC9zbmFwc2hvdD5cIlxuICAgICAgICByZXR1cm4geG1sXG5cbiAgICBvcDogKGYsIGFyZ3MuLi4pIC0+XG4gICAgICAgIHJldHVybiBmLmFwcGx5KHRoaXMsIGFyZ3MpXG5cbiAgICByZWNvdmVyOiAoeG1sKSAtPlxuICAgICAgICBkb2MgPSBuZXcgZG9tKCkucGFyc2VGcm9tU3RyaW5nKHhtbClcbiAgICAgICAgZW50aXRpZXMgPSB4cGF0aC5zZWxlY3QoXCIvL2VudGl0eVwiLCBkb2MpXG4gICAgICAgIGVudGl0aWVzX2xpc3QgPSBbXVxuICAgICAgICBmb3IgZW50aXR5IGluIGVudGl0aWVzXG4gICAgICAgICAgICBlbnRpdHlfcHJvcHMgPSB7fVxuICAgICAgICAgICAgcHJvcHMgPSB4cGF0aC5zZWxlY3QoXCJwcm9wZXJ0eVwiLCBlbnRpdHkpXG4gICAgICAgICAgICBmb3IgcHJvcCBpbiBwcm9wc1xuICAgICAgICAgICAgICAgIGVudGl0eV9wcm9wID0gZG9tMnByb3AocHJvcClcbiAgICAgICAgICAgICAgICBlbnRpdHlfcHJvcHNbZW50aXR5X3Byb3Auc2xvdF0gPSBlbnRpdHlfcHJvcC52YWx1ZVxuXG4gICAgICAgICAgICBuZXdfZW50aXR5ID0gbmV3IEVudGl0eShudWxsLCBlbnRpdHlfcHJvcHMpXG5cbiAgICAgICAgICAgIHBhcnRzID0geHBhdGguc2VsZWN0KFwicGFydFwiLCBlbnRpdHkpXG4gICAgICAgICAgICBmb3IgcGFydCBpbiBwYXJ0c1xuICAgICAgICAgICAgICAgIG5hbWUgPSBwYXJ0LmdldEF0dHJpYnV0ZShcIm5hbWVcIilcbiAgICAgICAgICAgICAgICBwYXJ0X3Byb3BzID0ge31cbiAgICAgICAgICAgICAgICBwcm9wcyA9IHhwYXRoLnNlbGVjdChcInByb3BlcnR5XCIsIHBhcnQpXG4gICAgICAgICAgICAgICAgZm9yIHByb3AgaW4gcHJvcHNcbiAgICAgICAgICAgICAgICAgICAgcGFydF9wcm9wID0gZG9tMnByb3AocHJvcClcbiAgICAgICAgICAgICAgICAgICAgcGFydF9wcm9wc1twYXJ0X3Byb3Auc2xvdF0gPSBwYXJ0X3Byb3AudmFsdWVcbiAgICAgICAgICAgICAgICBlbnRpdHlfcGFydCA9IG5ldyBQYXJ0KG5hbWUsIHBhcnRfcHJvcHMpXG4gICAgICAgICAgICAgICAgbmV3X2VudGl0eS5hZGQoZW50aXR5X3BhcnQpXG5cbiAgICAgICAgICAgIGVudGl0aWVzX2xpc3QucHVzaChuZXdfZW50aXR5KVxuXG4gICAgICAgIGZvciBlbnRpdHkgaW4gZW50aXRpZXNfbGlzdFxuICAgICAgICAgICAgQGFkZChlbnRpdHkpXG5cbiAgICBoYXM6IChpZCkgLT5cbiAgICAgICAgQGVudGl0aWVzLmhhcyhpZClcblxuICAgIGVudGl0eTogKGlkKSAtPlxuICAgICAgICBAZW50aXRpZXMub2JqZWN0KGlkKVxuXG4gICAgcmVtb3ZlOiAoaWQpIC0+XG4gICAgICAgIEBlbnRpdGllcy51bmJpbmQoaWQpXG5cbiAgICBieV9wcm9wOiAocHJvcCkgLT5cbiAgICAgICAgZW50aXRpZXMgPSBbXVxuICAgICAgICBmb3IgZW50aXR5IGluIEBlbnRpdGllcy5vYmplY3RzKClcbiAgICAgICAgICAgIGlmIGVudGl0eS5oYXMocHJvcC5zbG90KVxuICAgICAgICAgICAgICAgIGVudGl0eV92YWx1ZSA9IGVudGl0eS5zbG90KHByb3Auc2xvdClcbiAgICAgICAgICAgICAgICBpZiBBcnJheS5pc0FycmF5KGVudGl0eV92YWx1ZSlcbiAgICAgICAgICAgICAgICAgICAgaWYgcHJvcC52YWx1ZSBpbiBlbnRpdHlfdmFsdWVcbiAgICAgICAgICAgICAgICAgICAgICAgIGVudGl0aWVzLnB1c2goZW50aXR5KVxuICAgICAgICAgICAgICAgIGVsc2UgaWYgZW50aXR5X3ZhbHVlIGlzIHByb3AudmFsdWVcbiAgICAgICAgICAgICAgICAgICAgZW50aXRpZXMucHVzaChlbnRpdHkpXG5cbiAgICAgICAgaWYgZW50aXRpZXMubGVuZ3RoID4gMFxuICAgICAgICAgICAgcmV0dXJuIGVudGl0aWVzXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIEcoXCJOb3RGb3VuZFwiKVxuXG4gICAgZmlyc3RfYnlfcHJvcDogKHByb3ApIC0+XG4gICAgICAgIGVudGl0aWVzID0gQGJ5X3Byb3AocHJvcClcbiAgICAgICAgaWYgZW50aXRpZXMgaW5zdGFuY2VvZiBHbGl0Y2hcbiAgICAgICAgICAgIHJldHVybiBlbnRpdGllc1xuICAgICAgICBlbHNlXG4gICAgICAgICAgICBlbnRpdGllc1swXVxuXG4gICAgYnlfdGFnczogKHRhZ3MpIC0+XG4gICAgICAgIGVudGl0aWVzID0gW11cbiAgICAgICAgZm9yIGVudGl0eSBpbiBAZW50aXRpZXMub2JqZWN0cygpXG4gICAgICAgICAgICBmb3IgdGFnIGluIHRhZ3NcbiAgICAgICAgICAgICAgICBpZiB0YWcgaW4gZW50aXR5LnRhZ3NcbiAgICAgICAgICAgICAgICAgICAgZW50aXRpZXMucHVzaCBlbnRpdHlcblxuICAgICAgICBpZiBlbnRpdGllcy5sZW5ndGggPiAwXG4gICAgICAgICAgICByZXR1cm4gZW50aXRpZXNcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgRyhcIk5vdEZvdW5kXCIpXG5cbiAgICBmaXJzdF9ieV90YWdzOiAodGFncykgLT5cbiAgICAgICAgZW50aXRpZXMgPSBAYnlfdGFncyh0YWdzKVxuICAgICAgICBpZiBlbnRpdGllcyBpbnN0YW5jZW9mIEdsaXRjaFxuICAgICAgICAgICAgcmV0dXJuIGVudGl0aWVzXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIGVudGl0aWVzWzBdXG5cblxuY2xhc3MgQnVzIGV4dGVuZHMgTmFtZVNwYWNlXG5cbiAgICBjb25zdHJ1Y3RvcjogKEBuYW1lLCBzZXApIC0+XG4gICAgICAgIHN1cGVyKEBuYW1lLCBzZXApXG5cbiAgICB0cmlnZ2VyOiAoc2lnbmFsKSAtPlxuICAgICAgICBmb3Igb2JqIGluIEBvYmplY3RzKClcbiAgICAgICAgICAgIGlmIG9iaiBpbnN0YW5jZW9mIFN5c3RlbVxuICAgICAgICAgICAgICAgIG9iai5yYWlzZShzaWduYWwpXG5cbmNsYXNzIEJvYXJkXG5cbiAgICBjb25zdHJ1Y3RvcjogKHdpcmVDbGFzcywgYnVzQ2xhc3MsIHN0b3JlQ2xhc3MpIC0+XG4gICAgICAgIEB3aXJlQ2xhc3MgPSB3aXJlQ2xhc3MgfHwgV2lyZVxuICAgICAgICBAYnVzQ2xhc3MgPSBidXNDbGFzcyB8fCBCdXNcbiAgICAgICAgQHN0b3JlQ2xhc3MgPSBzdG9yZUNsYXNzIHx8IFN0b3JlXG5cbiAgICAgICAgQGluaXQoKVxuXG4gICAgaW5pdDogLT5cbiAgICAgICAgQGJ1cyA9IG5ldyBAYnVzQ2xhc3MoXCJidXNcIilcbiAgICAgICAgQHN0b3JlID0gbmV3IEBzdG9yZUNsYXNzKClcbiAgICAgICAgQHN5c3RlbXMgPSBAYnVzXG4gICAgICAgIEB3aXJlcyA9IG5ldyBOYW1lU3BhY2UoXCJ3aXJlc1wiKVxuXG4gICAgICAgIEBidXMuYmluZChTKFwic3RvcmVcIiksIEBzdG9yZSlcbiAgICAgICAgQGJ1cy5iaW5kKFMoXCJ3aXJlc1wiKSwgQHdpcmVzKVxuXG4gICAgc2V0dXA6ICh4bWwsIGNsb25lKSAtPlxuICAgICAgICBpZiB4bWw/XG4gICAgICAgICAgICBkb2MgPSBuZXcgZG9tKCkucGFyc2VGcm9tU3RyaW5nKHhtbClcbiAgICAgICAgICAgIGJvYXJkID0geHBhdGguc2VsZWN0KFwiYm9hcmRcIiwgZG9jKVswXVxuICAgICAgICAgICAgYm9hcmRfbmFtZSA9IGJvYXJkLmdldEF0dHJpYnV0ZShcIm5hbWVcIilcbiAgICAgICAgICAgIGJ1c19jbGFzcyA9IHhwYXRoLnNlbGVjdChcIkJ1c1wiLCBib2FyZClbMF0uZ2V0QXR0cmlidXRlKFwiY2xhc3NcIilcbiAgICAgICAgICAgIHN0b3JlX2NsYXNzID0geHBhdGguc2VsZWN0KFwiU3RvcmVcIiwgYm9hcmQpWzBdLmdldEF0dHJpYnV0ZShcImNsYXNzXCIpXG4gICAgICAgICAgICB3aXJlX2NsYXNzID0geHBhdGguc2VsZWN0KFwiV2lyZVwiLCBib2FyZClbMF0uZ2V0QXR0cmlidXRlKFwiY2xhc3NcIilcblxuICAgICAgICAgICAgaWYgY2xvbmU/XG4gICAgICAgICAgICAgICAgYm9hcmRfbmV3ID0gbmV3IEJvYXJkKGJvYXJkX25hbWUsIGdsb2JhbFt3aXJlX2NsYXNzXSwgZ2xvYmFsW2J1c19jbGFzc10sIGdsb2JhbFtzdG9yZV9jbGFzc10pXG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgYm9hcmRfbmV3ID0gQFxuICAgICAgICAgICAgICAgIGJvYXJkX25ldy5pbml0KClcblxuICAgICAgICAgICAgc3lzcyA9IHhwYXRoLnNlbGVjdChcInN5c3RlbVwiLCBib2FyZClcbiAgICAgICAgICAgIGZvciBzeXMgaW4gc3lzc1xuICAgICAgICAgICAgICAgIG5hbWUgPSBzeXMuZ2V0QXR0cmlidXRlKFwibmFtZVwiKVxuICAgICAgICAgICAgICAgIGtsYXNzID0gc3lzLmdldEF0dHJpYnV0ZShcImNsYXNzXCIpXG4gICAgICAgICAgICAgICAgY29uZl9ub2RlID0geHBhdGguc2VsZWN0KFwiY29uZmlndXJhdGlvblwiLCBzeXMpWzBdXG4gICAgICAgICAgICAgICAgZGF0YV9wcm9wcyA9IHt9XG4gICAgICAgICAgICAgICAgcHJvcHMgPSB4cGF0aC5zZWxlY3QoXCIvL3Byb3BlcnR5XCIsIGNvbmZfbm9kZSlcbiAgICAgICAgICAgICAgICBmb3IgcHJvcCBpbiBwcm9wc1xuICAgICAgICAgICAgICAgICAgICBkYXRhX3Byb3AgPSBkb20ycHJvcChwcm9wKVxuICAgICAgICAgICAgICAgICAgICBkYXRhX3Byb3BzW2RhdGFfcHJvcC5zbG90XSA9IGRhdGFfcHJvcC52YWx1ZVxuXG4gICAgICAgICAgICAgICAgYm9hcmRfbmV3LmFkZChTKG5hbWUpLCBnbG9iYWxba2xhc3NdLCBEKGRhdGFfcHJvcHMpKVxuXG4gICAgICAgICAgICB3aXJlcyA9IHhwYXRoLnNlbGVjdChcIi8vd2lyZVwiLCBib2FyZClcbiAgICAgICAgICAgIGZvciB3aXJlIGluIHdpcmVzXG4gICAgICAgICAgICAgICAgc291cmNlX25hbWUgPSB4cGF0aC5zZWxlY3QoXCJzb3VyY2VcIiwgd2lyZSlbMF0uZ2V0QXR0cmlidXRlKFwibmFtZVwiKVxuICAgICAgICAgICAgICAgIG91dGxldF9uYW1lID0geHBhdGguc2VsZWN0KFwib3V0bGV0XCIsIHdpcmUpWzBdLmdldEF0dHJpYnV0ZShcIm5hbWVcIilcbiAgICAgICAgICAgICAgICBzaW5rX25hbWUgPSB4cGF0aC5zZWxlY3QoXCJzaW5rXCIsIHdpcmUpWzBdLmdldEF0dHJpYnV0ZShcIm5hbWVcIilcbiAgICAgICAgICAgICAgICBpbmxldF9uYW1lID0geHBhdGguc2VsZWN0KFwiaW5sZXRcIiwgd2lyZSlbMF0uZ2V0QXR0cmlidXRlKFwibmFtZVwiKVxuXG4gICAgICAgICAgICAgICAgYm9hcmRfbmV3LmNvbm5lY3Qoc291cmNlX25hbWUsIHNpbmtfbmFtZSwgb3V0bGV0X25hbWUsIGlubGV0X25hbWUpXG5cbiAgICAgICAgICAgIHJldHVybiBib2FyZF9uZXdcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgeG1sID0gJzw/eG1sIHZlcnNpb24gPSBcIjEuMFwiIHN0YW5kYWxvbmU9XCJ5ZXNcIj8+J1xuICAgICAgICAgICAgaWYgQHN5bWJvbD9cbiAgICAgICAgICAgICAgICBib2FyZF9uYW1lID0gQHN5bWJvbC5uYW1lXG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgYm9hcmRfbmFtZSA9IFwiYlwiXG4gICAgICAgICAgICB4bWwgKz0gXCI8Ym9hcmQgbmFtZT0nI3tib2FyZF9uYW1lfSc+XCJcbiAgICAgICAgICAgIHhtbCArPSBcIjxCdXMgY2xhc3M9JyN7QGJ1cy5jb25zdHJ1Y3Rvci5uYW1lfScvPlwiXG4gICAgICAgICAgICB4bWwgKz0gXCI8U3RvcmUgY2xhc3M9JyN7QHN0b3JlLmNvbnN0cnVjdG9yLm5hbWV9Jy8+XCJcbiAgICAgICAgICAgIHhtbCArPSBcIjxXaXJlIGNsYXNzPScje0B3aXJlQ2xhc3MubmFtZX0nLz5cIlxuICAgICAgICAgICAgZm9yIHN5cyBpbiBAc3lzdGVtcy5zeW1ib2xzKClcbiAgICAgICAgICAgICAgICBpZiBzeXMubmFtZSBub3QgaW4gW1wid2lyZXNcIiwgXCJzdG9yZVwiXVxuICAgICAgICAgICAgICAgICAgICB4bWwgKz0gc3lzLm9iamVjdC5zZXJpYWxpemUoKVxuICAgICAgICAgICAgZm9yIGNvbm4gaW4gQHdpcmVzLnN5bWJvbHMoKVxuICAgICAgICAgICAgICAgIHhtbCArPSBjb25uLm9iamVjdC5zZXJpYWxpemUoKVxuICAgICAgICAgICAgeG1sICs9IFwiPC9ib2FyZD5cIlxuXG5cbiAgICBjb25uZWN0OiAoc291cmNlLCBzaW5rLCBvdXRsZXQsIGlubGV0LCBzeW1ib2wpIC0+XG4gICAgICAgIHdpcmUgPSBuZXcgQHdpcmVDbGFzcyh0aGlzLCBzb3VyY2UsIHNpbmssIG91dGxldCwgaW5sZXQpXG4gICAgICAgIGlmICFzeW1ib2xcbiAgICAgICAgICAgIG5hbWUgPSBAYnVzLmdlbnN5bShcIndpcmVcIilcbiAgICAgICAgICAgIHN5bWJvbCA9IG5ldyBTeW1ib2wobmFtZSlcbiAgICAgICAgQHdpcmVzLmJpbmQoc3ltYm9sLCB3aXJlKVxuXG4gICAgICAgIGZvciBzb3VyY2Vfb3V0bGV0IGluIHdpcmUuc291cmNlLm9iamVjdC5vdXRsZXRzLnN5bWJvbHMoKVxuICAgICAgICAgICAgaWYgc291cmNlX291dGxldC5uYW1lIGlzIHdpcmUub3V0bGV0Lm5hbWVcbiAgICAgICAgICAgICAgICBzb3VyY2Vfb3V0bGV0Lm9iamVjdC5wdXNoKHN5bWJvbClcblxuICAgIHBpcGU6IChzb3VyY2UsIHdpcmUsIHNpbmspIC0+XG4gICAgICAgIEBjb25uZWN0KHNvdXJjZSwgc2luaywgd2lyZSlcblxuICAgIGRpc2Nvbm5lY3Q6IChuYW1lKSAtPlxuICAgICAgICB3aXJlID0gQHdpcmUobmFtZSlcbiAgICAgICAgQHdpcmVzLnVuYmluZChuYW1lKVxuXG4gICAgICAgIGZvciBvdXRsZXQgaW4gd2lyZS5zb3VyY2Uub2JqZWN0Lm91dGxldHMuc3ltYm9scygpXG4gICAgICAgICAgICBpZiBvdXRsZXQubmFtZSBpcyB3aXJlLm91dGxldC5uYW1lXG4gICAgICAgICAgICAgICAgd2lyZXMgPSBbXVxuICAgICAgICAgICAgICAgIGZvciBjb25uIGluIG91dGxldC5vYmplY3RcbiAgICAgICAgICAgICAgICAgICAgaWYgY29ubi5uYW1lICE9IG5hbWVcbiAgICAgICAgICAgICAgICAgICAgICAgIHdpcmVzLnB1c2goY29ubilcbiAgICAgICAgICAgICAgICBvdXRsZXQub2JqZWN0ID0gd2lyZXNcblxuXG4gICAgd2lyZTogKG5hbWUpIC0+XG4gICAgICAgIEB3aXJlcy5vYmplY3QobmFtZSlcblxuICAgIGhhc3dpcmU6IChuYW1lKSAtPlxuICAgICAgICBAd2lyZXMuaGFzKG5hbWUpXG5cbiAgICBhZGQ6IChzeW1ib2wsIHN5c3RlbUNsYXNzLCBjb25mKSAtPlxuICAgICAgICBzeXN0ZW0gPSBuZXcgc3lzdGVtQ2xhc3ModGhpcywgY29uZilcbiAgICAgICAgQGJ1cy5iaW5kKHN5bWJvbCwgc3lzdGVtKVxuXG4gICAgaGFzOiAobmFtZSkgLT5cbiAgICAgICAgQGJ1cy5oYXMobmFtZSlcblxuICAgIHN5c3RlbTogKG5hbWUpIC0+XG4gICAgICAgIEBidXMub2JqZWN0KG5hbWUpXG5cbiAgICByZW1vdmU6IChuYW1lKSAtPlxuICAgICAgICBzeXN0ZW0gPSBAYnVzLm9iamVjdChuYW1lKVxuICAgICAgICBzeXN0ZW0ucHVzaChAU1RPUClcbiAgICAgICAgQGJ1cy51bmJpbmQobmFtZSlcblxuZXhwb3J0cy5TeW1ib2wgPSBTeW1ib2xcbmV4cG9ydHMuTmFtZVNwYWNlID0gTmFtZVNwYWNlXG5leHBvcnRzLlMgPSBTXG5leHBvcnRzLkRhdGEgPSBEYXRhXG5leHBvcnRzLkQgPSBEXG5leHBvcnRzLlNpZ25hbCA9IFNpZ25hbFxuZXhwb3J0cy5FdmVudCA9IEV2ZW50XG5leHBvcnRzLkdsaXRjaCA9IEdsaXRjaFxuZXhwb3J0cy5HID0gR1xuZXhwb3J0cy5Ub2tlbiA9IFRva2VuXG5leHBvcnRzLnN0YXJ0ID0gc3RhcnRcbmV4cG9ydHMuc3RvcCA9IHN0b3BcbmV4cG9ydHMuVCA9IFRcbmV4cG9ydHMuUGFydCA9IFBhcnRcbmV4cG9ydHMuUCA9IFBcbmV4cG9ydHMuRW50aXR5ID0gRW50aXR5XG5leHBvcnRzLkUgPSBFXG5leHBvcnRzLkNlbGwgPSBDZWxsXG5leHBvcnRzLkMgPSBDXG5leHBvcnRzLlN5c3RlbSA9IFN5c3RlbVxuZXhwb3J0cy5XaXJlID0gV2lyZVxuZXhwb3J0cy5TdG9yZSA9IFN0b3JlXG5leHBvcnRzLkJ1cyA9IEJ1c1xuZXhwb3J0cy5Cb2FyZCA9IEJvYXJkXG5cbiJdLCJzb3VyY2VSb290IjoiL3NvdXJjZS8ifQ==