var Board, Bus, C, Cell, D, Data, E, Entity, Event, G, Glitch, NameSpace, P, Part, S, Signal, Store, Symbol, System, T, Token, Wire, clone, dom, start, stop, uuid, xpath, __process_scalar,
  __slice = [].slice,
  __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; },
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

uuid = require("node-uuid");

clone = require("clone");

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

  NameSpace.prototype.gensym = function() {
    return "gensym:" + (this.__gensym++);
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
    outlet = outlet || "stdout";
    inlet = inlet || "stdin";
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
    xml += "<outlet name='" + this.inlet.name + "'/>";
    xml += "<sink name='" + this.sink.name + "'/>";
    xml += "<inlet name='" + this.inlet.name + "'/>";
    xml += "</wire>";
    return xml;
  };

  return Wire;

})();

__process_scalar = function(scalar) {
  var el, el_value, list_scalars, text, type, value, _i, _len;
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
      el_value = __process_scalar(el);
      value.push(el_value);
    }
  }
  return value;
};

({
  __process_prop: function(prop) {
    var entity_prop, scalar, slot, value;
    entity_prop = {};
    slot = prop.getAttribute("slot");
    scalar = xpath.select("scalar", prop);
    value = __process_scalar(scalar[0]);
    entity_prop.slot = slot;
    entity_prop.value = value;
    return entity_prop;
  }
});

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
        entity_prop = __process_prop(prop);
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
          part_prop = __process_prop(prop);
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
  function Board(name, wireClass, busClass, storeClass) {
    this.wireClass = wireClass || Wire;
    this.busClass = busClass || Bus;
    this.storeClass = storeClass || Store;
    this.store = new this.storeClass();
    this.wires = new NameSpace("bus.wires");
    this.bus = new this.busClass("systems");
    this.systems = this.bus;
    this.bus.bind(S("wires"), this.wires);
    this.bus.bind(S("store"), this.store);
  }

  Board.prototype.setup = function(xml) {
    var board, board_name, board_new, bus_class, conf_node, conn, data_prop, data_props, doc, inlet_name, klass, name, outlet_name, prop, props, sink_name, source_name, store_class, sys, syss, wire_class, wires, _i, _j, _k, _l, _len, _len1, _len2, _len3, _len4, _m, _ref, _ref1, _ref2;
    if (xml) {
      doc = new dom().parseFromString(xml);
      board = xpath.select("board", doc);
      board_name = board.getAttribute("name");
      bus_class = xpath.select("Bus", doc).getAttribute("class");
      store_class = xpath.select("Store", doc).getAttribute("class");
      wire_class = xpath.select("Wire", doc).getAttribute("class");
      board_new = new Board(board_nam, global[wire_class], global[bus_class], global[store_class]);
      syss = xpath.select("//system", doc);
      for (_i = 0, _len = syss.length; _i < _len; _i++) {
        sys = syss[_i];
        name = sys.getAttribute("name");
        klass = sys.getAttribute("class");
        conf_node = xpath.select("/configuration", sys);
        data_props = {};
        props = xpath.select("/property", conf_node);
        for (_j = 0, _len1 = props.length; _j < _len1; _j++) {
          prop = props[_j];
          data_prop = __process_prop(prop);
          data_props[data_prop.slot] = data_prop.value;
        }
        board_new.add(O_O.S(name), global[klass], D(props));
      }
      wires = xpath.select("//wire", doc);
      for (_k = 0, _len2 = conns.length; _k < _len2; _k++) {
        conn = conns[_k];
        source_name = xpath.select("source", conn).getAttribute("name");
        outlet_name = xpath.select("outlet", conn).getAttribute("name");
        sink_name = xpath.select("sink", conn).getAttribute("name");
        inlet_name = xpath.select("inlet", conn).getAttribute("name");
        board_new.add(source_name, sink_name, outlet_name, inlet_name);
      }
      return board_new;
    } else {
      xml = '<?xml version = "1.0" standalone="yes"?>';
      xml += "<board name='" + this.name + "'>";
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
      name = this.bus.gensym();
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29yZS5qcyIsInNvdXJjZXMiOlsiY29yZS5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsSUFBQSx1TEFBQTtFQUFBOzs7aVNBQUE7O0FBQUEsSUFBQSxHQUFPLE9BQUEsQ0FBUSxXQUFSLENBQVAsQ0FBQTs7QUFBQSxLQUNBLEdBQVEsT0FBQSxDQUFRLE9BQVIsQ0FEUixDQUFBOztBQUFBLEtBR0EsR0FBUSxPQUFBLENBQVEsT0FBUixDQUhSLENBQUE7O0FBQUEsR0FJQSxHQUFNLE9BQUEsQ0FBUSxRQUFSLENBQWlCLENBQUMsU0FKeEIsQ0FBQTs7QUFBQTtBQVFpQixFQUFBLGdCQUFFLElBQUYsRUFBUyxNQUFULEVBQWtCLEVBQWxCLEVBQXNCLEtBQXRCLEdBQUE7QUFDVCxJQURVLElBQUMsQ0FBQSxPQUFBLElBQ1gsQ0FBQTtBQUFBLElBRGlCLElBQUMsQ0FBQSxTQUFBLE1BQ2xCLENBQUE7QUFBQSxJQUQwQixJQUFDLENBQUEsS0FBQSxFQUMzQixDQUFBO0FBQUEsSUFBQSxJQUFHLGFBQUg7QUFDSSxNQUFBLElBQUMsQ0FBQSxLQUFELENBQU8sS0FBUCxDQUFBLENBREo7S0FEUztFQUFBLENBQWI7O0FBQUEsbUJBSUEsU0FBQSxHQUFXLFNBQUEsR0FBQTtBQUNSLElBQUEsSUFBRyxlQUFIO0FBQ0ksYUFBTyxJQUFDLENBQUEsRUFBRSxDQUFDLElBQUosR0FBVyxJQUFDLENBQUEsRUFBRSxDQUFDLEdBQWYsR0FBcUIsSUFBQyxDQUFBLElBQTdCLENBREo7S0FBQSxNQUFBO0FBR0ksYUFBTyxJQUFDLENBQUEsSUFBUixDQUhKO0tBRFE7RUFBQSxDQUpYLENBQUE7O0FBQUEsbUJBVUEsSUFBQSxHQUFNLFNBQUMsQ0FBRCxFQUFJLENBQUosR0FBQTtBQUNGLElBQUEsSUFBRyxDQUFIO2FBQ0ksSUFBRSxDQUFBLENBQUEsQ0FBRixHQUFPLEVBRFg7S0FBQSxNQUFBO2FBR0ksSUFBRSxDQUFBLENBQUEsRUFITjtLQURFO0VBQUEsQ0FWTixDQUFB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QVIsR0FBZ0IsS0Ezc0JoQixDQUFBOztBQUFBLE9BNHNCTyxDQUFDLEtBQVIsR0FBZ0IsS0E1c0JoQixDQUFBOztBQUFBLE9BNnNCTyxDQUFDLElBQVIsR0FBZSxJQTdzQmYsQ0FBQTs7QUFBQSxPQThzQk8sQ0FBQyxDQUFSLEdBQVksQ0E5c0JaLENBQUE7O0FBQUEsT0Erc0JPLENBQUMsSUFBUixHQUFlLElBL3NCZixDQUFBOztBQUFBLE9BZ3RCTyxDQUFDLENBQVIsR0FBWSxDQWh0QlosQ0FBQTs7QUFBQSxPQWl0Qk8sQ0FBQyxNQUFSLEdBQWlCLE1BanRCakIsQ0FBQTs7QUFBQSxPQWt0Qk8sQ0FBQyxDQUFSLEdBQVksQ0FsdEJaLENBQUE7O0FBQUEsT0FtdEJPLENBQUMsSUFBUixHQUFlLElBbnRCZixDQUFBOztBQUFBLE9Bb3RCTyxDQUFDLENBQVIsR0FBWSxDQXB0QlosQ0FBQTs7QUFBQSxPQXF0Qk8sQ0FBQyxNQUFSLEdBQWlCLE1BcnRCakIsQ0FBQTs7QUFBQSxPQXN0Qk8sQ0FBQyxJQUFSLEdBQWUsSUF0dEJmLENBQUE7O0FBQUEsT0F1dEJPLENBQUMsS0FBUixHQUFnQixLQXZ0QmhCLENBQUE7O0FBQUEsT0F3dEJPLENBQUMsR0FBUixHQUFjLEdBeHRCZCxDQUFBOztBQUFBLE9BeXRCTyxDQUFDLEtBQVIsR0FBZ0IsS0F6dEJoQixDQUFBIiwic291cmNlc0NvbnRlbnQiOlsidXVpZCA9IHJlcXVpcmUgXCJub2RlLXV1aWRcIlxuY2xvbmUgPSByZXF1aXJlIFwiY2xvbmVcIlxuXG54cGF0aCA9IHJlcXVpcmUoJ3hwYXRoJylcbmRvbSA9IHJlcXVpcmUoJ3htbGRvbScpLkRPTVBhcnNlclxuXG5jbGFzcyBTeW1ib2xcblxuICAgIGNvbnN0cnVjdG9yOiAoQG5hbWUsIEBvYmplY3QsIEBucywgYXR0cnMpIC0+XG4gICAgICAgIGlmIGF0dHJzP1xuICAgICAgICAgICAgQGF0dHJzKGF0dHJzKVxuXG4gICAgZnVsbF9uYW1lOiAtPlxuICAgICAgIGlmIEBucz9cbiAgICAgICAgICAgcmV0dXJuIEBucy5uYW1lICsgQG5zLnNlcCArIEBuYW1lXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgcmV0dXJuIEBuYW1lXG5cbiAgICBhdHRyOiAoaywgdikgLT5cbiAgICAgICAgaWYgdlxuICAgICAgICAgICAgQFtrXSA9IHZcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgQFtrXVxuXG4gICAgb3A6IChmLCBhcmdzLi4uKSAtPlxuICAgICAgICByZXR1cm4gZi5hcHBseSh0aGlzLCBhcmdzKVxuXG4gICAgYXR0cnM6IChrdikgLT5cbiAgICAgICAgZm9yIGssIHYgaW4ga3ZcbiAgICAgICAgICAgIEBba10gPSB2XG5cbiAgICBpczogKHN5bWJvbCkgLT5cbiAgICAgICAgaWYgc3ltYm9sLm5hbWUgaXMgQG5hbWVcbiAgICAgICAgICAgIGlmIHN5bWJvbC5vYmplY3QgaXMgQG9iamVjdFxuICAgICAgICAgICAgICAgIHJldHVybiB0cnVlXG4gICAgICAgICAgICBpZiAoc3ltYm9sLm9iamVjdCBpcyBudWxsKSBhbmQgKEBvYmplY3QgaXMgbnVsbClcbiAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZVxuICAgICAgICBlbHNlXG4gICAgICAgICAgICByZXR1cm4gZmFsc2VcblxuUyA9IChuYW1lLCBvYmplY3QsIG5zLCBhdHRycykgLT5cbiAgICByZXR1cm4gbmV3IFN5bWJvbChuYW1lLCBvYmplY3QsIG5zLCBhdHRycylcblxuIyBzaG91bGQgYmUgYSBzZXRcblxuY2xhc3MgTmFtZVNwYWNlXG5cbiAgICBjb25zdHJ1Y3RvcjogKEBuYW1lLCBzZXApIC0+XG4gICAgICAgIEBlbGVtZW50cyA9IHt9XG4gICAgICAgIEBzZXAgPSBzZXAgfHwgXCIuXCJcbiAgICAgICAgQF9fZ2Vuc3ltID0gMFxuXG4gICAgYmluZDogKHN5bWJvbCwgb2JqZWN0LCBjbGFzc19uYW1lKSAtPlxuICAgICAgICBzeW1ib2wuY2xhc3MgPSBjbGFzc19uYW1lIHx8IG9iamVjdC5jb25zdHJ1Y3Rvci5uYW1lXG4gICAgICAgIG5hbWUgPSBzeW1ib2wubmFtZVxuICAgICAgICBzeW1ib2wub2JqZWN0ID0gb2JqZWN0XG4gICAgICAgIG9iamVjdC5zeW1ib2wgPSBzeW1ib2xcbiAgICAgICAgQGVsZW1lbnRzW25hbWVdID0gc3ltYm9sXG4gICAgICAgIHN5bWJvbC5ucyA9IHRoaXNcbiAgICAgICAgc3ltYm9sXG5cbiAgICB1bmJpbmQ6IChuYW1lKSAtPlxuICAgICAgICBzeW1ib2wgPSBAZWxlbWVudHNbbmFtZV1cbiAgICAgICAgZGVsZXRlIEBlbGVtZW50c1tuYW1lXVxuICAgICAgICBzeW1ib2wubnMgPSB1bmRlZmluZWRcbiAgICAgICAgc3ltYm9sLm9iamVjdCA9IHVuZGVmaW5lZFxuICAgICAgICBzeW1ib2wuY2xhc3MgPSB1bmRlZmluZWRcblxuICAgIHN5bWJvbDogKG5hbWUpIC0+XG4gICAgICAgIGlmIEBoYXMobmFtZSlcbiAgICAgICAgICAgIEBlbGVtZW50c1tuYW1lXVxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBTKFwiTm90Rm91bmRcIilcblxuICAgIGhhczogKG5hbWUpIC0+XG4gICAgICAgIGlmIEBlbGVtZW50c1tuYW1lXT9cbiAgICAgICAgICAgIHJldHVybiB0cnVlXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIHJldHVybiBmYWxzZVxuXG4gICAgb2JqZWN0OiAobmFtZSkgLT5cbiAgICAgICAgaWYgQGhhcyhuYW1lKVxuICAgICAgICAgICAgQGVsZW1lbnRzW25hbWVdLm9iamVjdFxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBHKFwiTm90Rm91bmRcIilcblxuICAgIHN5bWJvbHM6ICgpIC0+XG4gICAgICAgc3ltYm9scyA9IFtdXG5cbiAgICAgICBmb3Igayx2IG9mIEBlbGVtZW50c1xuICAgICAgICAgICBzeW1ib2xzLnB1c2godilcblxuICAgICAgIHN5bWJvbHNcblxuICAgIG9iamVjdHM6ICgpIC0+XG4gICAgICAgb2JqZWN0cyA9IFtdXG5cbiAgICAgICBmb3Igayx2IG9mIEBlbGVtZW50c1xuICAgICAgICAgICBvYmplY3RzLnB1c2godi5vYmplY3QpXG5cbiAgICAgICBvYmplY3RzXG5cbiAgICBnZW5zeW06IC0+XG4gICAgICAgIFwiZ2Vuc3ltOlwiICsgKEBfX2dlbnN5bSsrKVxuXG5cbmNsYXNzIERhdGFcblxuICAgIGNvbnN0cnVjdG9yOiAocHJvcHMpIC0+XG4gICAgICAgIEBfX3Nsb3RzID0gW11cbiAgICAgICAgaWYgcHJvcHM/XG4gICAgICAgICAgICBAcHJvcHMocHJvcHMpXG5cbiAgICBpczogKGRhdGEpIC0+XG4gICAgICAgIGFsbF9zbG90cyA9IEBzbG90cygpXG4gICAgICAgIGZvciBuYW1lIGluIGRhdGEuc2xvdHMoKVxuICAgICAgICAgICAgaWYgZGF0YS5zbG90KG5hbWUpIGlzIG5vdCBAc2xvdChuYW1lKVxuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZVxuXG4gICAgICAgIHJldHVybiB0cnVlXG5cbiAgICBwcm9wczogKGt2KSAtPlxuICAgICAgICBpZiBrdlxuICAgICAgICAgICAgZm9yIGssIHYgb2Yga3ZcbiAgICAgICAgICAgICAgICBAW2tdID0gdlxuICAgICAgICAgICAgICAgIGlmIGsgbm90IGluIEBzbG90cygpXG4gICAgICAgICAgICAgICAgICAgIEBzbG90cyhrKVxuICAgICAgICAgICAgcmV0dXJuIEB2YWxpZGF0ZSgpXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIHByb3BlcnRpZXMgPSBbXVxuICAgICAgICAgICAgZm9yIG5hbWUgaW4gQHNsb3RzKClcbiAgICAgICAgICAgICAgICBwcm9wZXJ0aWVzLnB1c2goQFtuYW1lXSlcbiAgICAgICAgICAgIHJldHVybiBwcm9wZXJ0aWVzXG5cbiAgICBzbG90czogKG5hbWUpIC0+XG4gICAgICAgIGlmIG5hbWVcbiAgICAgICAgICAgIEBfX3Nsb3RzLnB1c2gobmFtZSlcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgQF9fc2xvdHNcblxuICAgIHNsb3Q6IChuYW1lLCB2YWx1ZSkgLT5cbiAgICAgICAgaWYgdmFsdWVcbiAgICAgICAgICAgIEBbbmFtZV0gPSB2YWx1ZVxuICAgICAgICAgICAgaWYgbmFtZSBub3QgaW4gQHNsb3RzKClcbiAgICAgICAgICAgICAgICBAc2xvdHMobmFtZSlcbiAgICAgICAgICAgIGlmIEB2YWxpZGF0ZSgpXG4gICAgICAgICAgICAgICAgcmV0dXJuIHZhbHVlXG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgRyhcIkludmFsaWRcIilcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgaWYgQGhhcyhuYW1lKVxuICAgICAgICAgICAgICAgIEBbbmFtZV1cbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICBHKFwiTm90Rm91bmRcIilcblxuICAgIGhhczogKG5hbWUpIC0+XG4gICAgICAgIGlmIG5hbWUgaW4gQHNsb3RzKClcbiAgICAgICAgICAgIHJldHVybiB0cnVlXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIHJldHVybiBmYWxzZVxuXG4gICAgdmFsaWRhdGU6IC0+XG4gICAgICAgIHRydWVcblxuICAgIF9fc2VyaWFsaXplX3NjYWxhcjogKHNjYWxhcikgLT5cbiAgICAgICAgeG1sID0gXCJcIlxuICAgICAgICBpZiBBcnJheS5pc0FycmF5KHNjYWxhcilcbiAgICAgICAgICAgIHR5cGUgPSBcImFycmF5XCJcbiAgICAgICAgICAgIHhtbCArPSBcIjxzY2FsYXIgdHlwZT0nI3t0eXBlfSc+XCJcbiAgICAgICAgICAgIHhtbCArPSBcIjxsaXN0PlwiXG4gICAgICAgICAgICBmb3IgZSBpbiBzY2FsYXJcbiAgICAgICAgICAgICAgICB4bWwgKz0gQF9fc2VyaWFsaXplX3NjYWxhcihlKVxuICAgICAgICAgICAgeG1sICs9IFwiPC9saXN0PlwiXG4gICAgICAgICAgICB4bWwgKz0gXCI8L3NjYWxhcj5cIlxuICAgICAgICBlbHNlXG4gICAgICAgICAgICB0eXBlID0gdHlwZW9mIHNjYWxhclxuICAgICAgICAgICAgeG1sICs9IFwiPHNjYWxhciB0eXBlPScje3R5cGV9Jz4je3NjYWxhci50b1N0cmluZygpfTwvc2NhbGFyPlwiXG4gICAgICAgIHhtbFxuXG4gICAgc2VyaWFsaXplOiAtPlxuICAgICAgICB4bWwgPSBcIlwiXG4gICAgICAgIGZvciBuYW1lIGluIEBzbG90cygpXG4gICAgICAgICAgICB4bWwgKz0gXCI8cHJvcGVydHkgc2xvdD0nI3tuYW1lfSc+XCJcbiAgICAgICAgICAgIHNjYWxhciAgPSBAc2xvdChuYW1lKVxuICAgICAgICAgICAgeG1sICs9IEBfX3NlcmlhbGl6ZV9zY2FsYXIoc2NhbGFyKVxuICAgICAgICAgICAgeG1sICs9ICc8L3Byb3BlcnR5PidcbiAgICAgICAgeG1sXG5cbkQgPSAocHJvcHMpIC0+XG4gICAgcmV0dXJuIG5ldyBEYXRhKHByb3BzKVxuXG5jbGFzcyBTaWduYWwgZXh0ZW5kcyBEYXRhXG5cbiAgICBjb25zdHJ1Y3RvcjogKG5hbWUsIHBheWxvYWQsIHByb3BzKSAtPlxuICAgICAgICBwcm9wcyA9IHByb3BzIHx8IHt9XG4gICAgICAgIHByb3BzLm5hbWUgPSBuYW1lXG4gICAgICAgIHByb3BzLnBheWxvYWQgPSBwYXlsb2FkXG4gICAgICAgIHN1cGVyKHByb3BzKVxuXG5jbGFzcyBFdmVudCBleHRlbmRzIFNpZ25hbFxuXG4gICAgY29uc3RydWN0b3I6IChuYW1lLCBwYXlsb2FkLCBwcm9wcykgLT5cbiAgICAgICAgcHJvcHMgPSBwcm9wcyB8fCB7fVxuICAgICAgICBwb3BzLnRzID0gbmV3IERhdGUoKS5nZXRUaW1lKClcbiAgICAgICAgc3VwZXIobmFtZSwgcGF5bG9hZCwgcHJvcHMpXG5cbmNsYXNzIEdsaXRjaCBleHRlbmRzIERhdGFcblxuICAgIGNvbnN0cnVjdG9yOiAobmFtZSwgY29udGV4dCwgcHJvcHMpIC0+XG4gICAgICAgIHByb3BzID0gcHJvcHMgfHwge31cbiAgICAgICAgcHJvcHMubmFtZSA9IG5hbWVcbiAgICAgICAgcHJvcHMuY29udGVueHQgPSBjb250ZXh0XG4gICAgICAgIHN1cGVyKHByb3BzKVxuXG5HID0gKG5hbWUsIHByb3BzKSAtPlxuICAgIHJldHVybiBuZXcgR2xpdGNoKG5hbWUsIHByb3BzKVxuXG5jbGFzcyBUb2tlbiBleHRlbmRzIERhdGFcblxuICAgIGNvbnN0cnVjdG9yOiAodmFsdWUsIHNpZ24sIHByb3BzKSAgLT5cbiAgICAgICAgc3VwZXIocHJvcHMpXG4gICAgICAgIEBzaWducyA9IFtdXG4gICAgICAgIEBzdGFtcChzaWduLCB2YWx1ZSlcblxuICAgIGlzOiAodCkgLT5cbiAgICAgICAgZmFsc2VcblxuICAgIHZhbHVlOiAtPlxuICAgICAgICBAdmFsdWVcblxuICAgIHN0YW1wX2J5OiAoaW5kZXgpIC0+XG4gICAgICAgIGlmIGluZGV4P1xuICAgICAgICAgICBpZiBAc2lnbnNbaW5kZXhdP1xuICAgICAgICAgICAgICAgcmV0dXJuIEBzaWduc1tpbmRleF1cbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgIHJldHVybiBTKFwiTm90Rm91bmRcIilcblxuICAgICAgICBpZiBAc2lnbnMubGVuZ3RoID4gMFxuICAgICAgICAgICByZXR1cm4gQHNpZ25zW0BzaWducy5sZW5ndGggLSAxXVxuICAgICAgICBlbHNlXG4gICAgICAgICAgIHJldHVybiBTKFwiTm90Rm91bmRcIilcblxuICAgIHN0YW1wOiAoc2lnbiwgdmFsdWUpIC0+XG4gICAgICAgIGlmIHZhbHVlXG4gICAgICAgICAgICBpZiBAW3ZhbHVlXVxuICAgICAgICAgICAgICAgIGRlbGV0ZSBAW3ZhbHVlXVxuICAgICAgICAgICAgQHZhbHVlID0gdmFsdWVcbiAgICAgICAgICAgIGlmIHR5cGVvZiBAdmFsdWUgaXMgXCJzdHJpbmdcIlxuICAgICAgICAgICAgICAgIEBbQHZhbHVlXSA9IHRydWVcbiAgICAgICAgaWYgc2lnbj9cbiAgICAgICAgICAgIEBzaWducy5wdXNoKHNpZ24pXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIEBzaWducy5wdXNoKFMoXCJVbmtub3duXCIpKVxuXG5cbnN0YXJ0ID0gKHNpZ24sIHByb3BzKSAtPlxuICAgIHJldHVybiBuZXcgVG9rZW4oXCJzdGFydFwiLCBzaWduLCBwcm9wcylcblxuc3RvcCA9IChzaWduLCBwcm9wcykgLT5cbiAgICByZXR1cm4gbmV3IFRva2VuKFwic3RvcFwiLCBzaWduLCBwcm9wcylcblxuVCA9ICh2YWx1ZSwgc2lnbiwgcHJvcHMpIC0+XG4gICAgcmV0dXJuIG5ldyBUb2tlbih2YWx1ZSwgc2lnbiwgcHJvcHMpXG5cbmNsYXNzIFBhcnQgZXh0ZW5kcyBEYXRhXG5cbiAgICBjb25zdHJ1Y3RvcjogKEBuYW1lLCBwcm9wcykgLT5cbiAgICAgICAgc3VwZXIocHJvcHMpXG5cbiAgICBzZXJpYWxpemU6IC0+XG4gICAgICAgIHhtbCArPSBcIjxwYXJ0IG5hbWU9JyN7QG5hbWV9Jz5cIlxuICAgICAgICB4bWwgKz0gc3VwZXIoKVxuICAgICAgICB4bWwgKz0gJzwvcGFydD4nXG5cblAgPSAobmFtZSwgcHJvcHMpIC0+XG4gICAgcmV0dXJuIG5ldyBQYXJ0KG5hbWUsIHByb3BzKVxuXG5jbGFzcyBFbnRpdHkgZXh0ZW5kcyBEYXRhXG5cbiAgICBjb25zdHJ1Y3RvcjogKHRhZ3MsIHByb3BzKSAtPlxuICAgICAgICBAcGFydHMgPSBuZXcgTmFtZVNwYWNlKFwicGFydHNcIilcbiAgICAgICAgcHJvcHMgPSBwcm9wcyB8fCB7fVxuICAgICAgICBwcm9wcy5pZCA9IHByb3BzLmlkIHx8IHV1aWQudjQoKVxuICAgICAgICB0YWdzID0gdGFncyB8fCBwcm9wcy50YWdzIHx8IFtdXG4gICAgICAgIHByb3BzLnRhZ3MgPSB0YWdzXG4gICAgICAgIHN1cGVyKHByb3BzKVxuXG4gICAgYWRkOiAoc3ltYm9sLCBwYXJ0KSAtPlxuICAgICAgICBAcGFydHMuYmluZChzeW1ib2wsIHBhcnQpXG5cbiAgICByZW1vdmU6IChuYW1lKSAtPlxuICAgICAgICBAcGFydHMudW5iaW5kKG5hbWUpXG5cbiAgICBoYXNQYXJ0OiAobmFtZSkgLT5cbiAgICAgICAgQHBhcnRzLmhhcyhuYW1lKVxuXG4gICAgcGFydDogKG5hbWUpIC0+XG4gICAgICAgIEBwYXJ0cy5zeW1ib2wobmFtZSlcblxuICAgIHNlcmlhbGl6ZTogLT5cbiAgICAgICAgeG1sID0gXCI8ZW50aXR5PlwiXG4gICAgICAgIHhtbCArPSAnPHBhcnRzPidcbiAgICAgICAgZm9yIHBhcnQgb2YgQHBhcnRzLm9iamVjdHMoKVxuICAgICAgICAgICAgeG1sICs9IHBhcnQuc2VyaWFsaXplKClcbiAgICAgICAgeG1sICs9ICc8L3BhcnRzPidcbiAgICAgICAgeG1sICs9IHN1cGVyKClcbiAgICAgICAgeG1sICs9ICc8L2VudGl0eT4nXG5cbkUgPSAodGFncywgcHJvcHMpIC0+XG4gICAgcmV0dXJuIG5ldyBFbnRpdHkodGFncywgcHJvcHMpXG5cbmNsYXNzIENlbGwgZXh0ZW5kcyBFbnRpdHlcblxuICAgIGNvbnN0cnVjdG9yOiAodGFncywgcHJvcHMpIC0+XG4gICAgICAgIHN1cGVyKHRhZ3MsIHByb3BzKVxuICAgICAgICBAb2JzZXJ2ZXJzPSBuZXcgTmFtZVNwYWNlKFwib2JzZXJ2ZXJzXCIpXG5cbiAgICBub3RpZnk6IChldmVudCkgLT5cbiAgICAgICBmb3Igb2IgaW4gQG9ic2VydmVycy5vYmplY3RzKClcbiAgICAgICAgICAgIG9iLnJhaXNlKGV2ZW50KVxuXG4gICAgYWRkOiAocGFydCkgLT5cbiAgICAgICAgc3VwZXIgcGFydFxuICAgICAgICBldmVudCA9IG5ldyBFdmVudChcInBhcnQtYWRkZWRcIiwge3BhcnQ6IHBhcnQsIGNlbGw6IHRoaXN9KVxuICAgICAgICBAbm90aWZ5KGV2ZW50KVxuXG4gICAgcmVtb3ZlOiAobmFtZSkgLT5cbiAgICAgICAgc3VwZXIgbmFtZVxuICAgICAgICBldmVudCA9IG5ldyBFdmVudChcInBhcnQtcmVtb3ZlZFwiLCB7cGFydDogcGFydCwgY2VsbDogdGhpc30pXG4gICAgICAgIEBub3RpZnkoZXZlbnQpXG5cbiAgICBvYnNlcnZlOiAoc3ltYm9sLCBzeXN0ZW0pIC0+XG4gICAgICAgIEBvYnNlcnZlcnMuYmluZChzeW1ib2wsIHN5c3RlbSlcblxuICAgIGZvcmdldDogKG5hbWUpIC0+XG4gICAgICAgIEBvYnNlcnZlcnMudW5iaW5kKG5hbWUpXG5cbiAgICBzdGVwOiAoZm4sIGFyZ3MuLi4pIC0+XG4gICAgICAgIHJldHVybiBmbi5hcHBseSh0aGlzLCBhcmdzKVxuXG4gICAgY2xvbmU6ICgpIC0+XG4gICAgICAgIHJldHVybiBjbG9uZSh0aGlzKVxuXG5DID0gKHRhZ3MsIHByb3BzKSAtPlxuICAgIHJldHVybiBuZXcgQ2VsbCh0YWdzLCBwcm9wcylcblxuY2xhc3MgU3lzdGVtXG5cbiAgICBjb25zdHJ1Y3RvcjogKEBiLCBjb25mKSAtPlxuICAgICAgICBAaW5sZXRzID0gbmV3IE5hbWVTcGFjZShcImlubGV0c1wiKVxuICAgICAgICBAaW5sZXRzLmJpbmQobmV3IFN5bWJvbChcInN5c2luXCIpLFtdKVxuICAgICAgICBAaW5sZXRzLmJpbmQobmV3IFN5bWJvbChcImZlZWRiYWNrXCIpLFtdKVxuICAgICAgICBAb3V0bGV0cyA9IG5ldyBOYW1lU3BhY2UoXCJvdXRsZXRzXCIpXG4gICAgICAgIEBvdXRsZXRzLmJpbmQobmV3IFN5bWJvbChcInN5c291dFwiKSxbXSlcbiAgICAgICAgQG91dGxldHMuYmluZChuZXcgU3ltYm9sKFwic3lzZXJyXCIpLFtdKVxuXG4gICAgICAgIEBjb25mID0gY29uZiB8fCBEKClcbiAgICAgICAgQHN0YXRlID0gW11cbiAgICAgICAgQHIgPSB7fVxuXG4gICAgdG9wOiAoaW5kZXgpIC0+XG4gICAgICAgIGlmIGluZGV4P1xuICAgICAgICAgICAgaWYgQHN0YXRlW2luZGV4XT9cbiAgICAgICAgICAgICAgICByZXR1cm4gQHN0YXRlW2luZGV4XVxuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIHJldHVybiBTKFwiTm90Rm91bmRcIilcblxuICAgICAgICBpZiBAc3RhdGUubGVuZ3RoID4gMFxuICAgICAgICAgICAgcmV0dXJuIEBzdGF0ZVtAc3RhdGUubGVuZ3RoIC0gMV1cbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgcmV0dXJuIFMoXCJOb3RGb3VuZFwiKVxuXG4gICAgaW5wdXQ6IChkYXRhLCBpbmxldCkgLT5cbiAgICAgICAgZGF0YVxuXG4gICAgb3V0cHV0OiAoZGF0YSwgb3V0bGV0KSAtPlxuICAgICAgICBkYXRhXG5cbiAgICBTVE9QOiAoc3RvcF90b2tlbikgLT5cblxuICAgIHB1c2g6IChkYXRhLCBpbmxldCkgLT5cblxuICAgICAgICBpbmxldCA9IGlubGV0IHx8IEBpbmxldHMuc3ltYm9sKFwic3lzaW5cIilcblxuICAgICAgICBpbnB1dF9kYXRhID0gQGlucHV0KGRhdGEsIGlubGV0KVxuXG4gICAgICAgIGlmIGlucHV0X2RhdGEgaW5zdGFuY2VvZiBHbGl0Y2hcbiAgICAgICAgICAgIEBlcnJvcihpbnB1dF9kYXRhKVxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBAcHJvY2VzcyBpbnB1dF9kYXRhLCBpbmxldFxuXG4gICAgZ290b193aXRoOiAoaW5sZXQsIGRhdGEpIC0+XG4gICAgICAgIEBwdXNoKGRhdGEsIGlubGV0KVxuXG4gICAgcHJvY2VzczogKGRhdGEsIGlubGV0KSAtPlxuXG4gICAgZGlzcGF0Y2g6IChkYXRhLCBvdXRsZXQpIC0+XG4gICAgICAgIGZvciBvbCBpbiBAb3V0bGV0cy5zeW1ib2xzKClcbiAgICAgICAgICAgIGlmIG9sLm5hbWUgPT0gb3V0bGV0Lm5hbWVcbiAgICAgICAgICAgICAgICBmb3Igd2lyZSBpbiBvbC5vYmplY3RcbiAgICAgICAgICAgICAgICAgICAgd2lyZS5vYmplY3QudHJhbnNtaXQgZGF0YVxuXG4gICAgZW1pdDogKGRhdGEsIG91dGxldCkgLT5cbiAgICAgICAgb3V0bGV0ID0gb3V0bGV0IHx8IEBvdXRsZXRzLnN5bWJvbChcInN5c291dFwiKVxuXG4gICAgICAgIG91dHB1dF9kYXRhID0gQG91dHB1dChkYXRhLCBvdXRsZXQpXG5cbiAgICAgICAgaWYgb3V0cHV0X2RhdGEgaW5zdGFuY2VvZiBHbGl0Y2hcbiAgICAgICAgICAgIEBlcnJvcihvdXRwdXRfZGF0YSlcbiAgICAgICAgICAgIHJldHVyblxuXG4gICAgICAgIEBkaXNwYXRjaChvdXRwdXRfZGF0YSwgb3V0bGV0KVxuXG5cbiAgICBlcnJvcjogKGRhdGEpIC0+XG4gICAgICAgIEBkaXNwYXRjaChkYXRhLCBAb3V0bGV0cy5zeW1ib2woXCJzeXNlcnJcIikpXG5cbiAgICByYWlzZTogKHNpZ25hbCkgLT5cbiAgICAgICAgQHJlYWN0KHNpZ25hbClcblxuICAgIGludGVycnVwdDogKHNpZ25hbCkgLT5cbiAgICAgICAgQHJlYWN0KHNpZ25hbClcblxuICAgIHJlYWN0OiAoc2lnbmFsKSAtPlxuXG4gICAgc2hvdzogKGRhdGEpIC0+XG5cbiAgICBzZXJpYWxpemU6IC0+XG4gICAgICAgIHhtbCA9IFwiPHN5c3RlbSBuYW1lPScje0BzeW1ib2wubmFtZX0nIGNsYXNzPScje0BzeW1ib2wuY2xhc3N9Jz5cIlxuICAgICAgICB4bWwgKz0gXCI8Y29uZmlndXJhdGlvbj5cIlxuICAgICAgICB4bWwgKz0gQGNvbmYuc2VyaWFsaXplKClcbiAgICAgICAgeG1sICs9IFwiPC9jb25maWd1cmF0aW9uPlwiXG4gICAgICAgIHhtbCArPSBcIjwvc3lzdGVtPlwiXG4gICAgICAgIHhtbFxuXG5cbmNsYXNzIFdpcmVcblxuICAgIGNvbnN0cnVjdG9yOiAoQGIsIHNvdXJjZSwgc2luaywgb3V0bGV0LCBpbmxldCkgLT5cbiAgICAgICAgb3V0bGV0ID0gb3V0bGV0IHx8IFwic3Rkb3V0XCJcbiAgICAgICAgaW5sZXQgPSBpbmxldCB8fCBcInN0ZGluXCJcbiAgICAgICAgQHNvdXJjZSA9IEBiLnN5c3RlbXMuc3ltYm9sKHNvdXJjZSlcbiAgICAgICAgQHNpbmsgPSBAYi5zeXN0ZW1zLnN5bWJvbChzaW5rKVxuICAgICAgICBAb3V0bGV0ID0gQHNvdXJjZS5vYmplY3Qub3V0bGV0cy5zeW1ib2wob3V0bGV0KVxuICAgICAgICBAaW5sZXQgPSBAc2luay5vYmplY3QuaW5sZXRzLnN5bWJvbChpbmxldClcblxuICAgIHRyYW5zbWl0OiAoZGF0YSkgLT5cbiAgICAgICAgQHNpbmsub2JqZWN0LnB1c2goZGF0YSwgQGlubGV0KVxuXG4gICAgc2VyaWFsaXplOiAtPlxuICAgICAgICB4bWwgPSBcIlwiXG4gICAgICAgIHhtbCArPSBcIjx3aXJlIG5hbWU9JyN7QHN5bWJvbC5uYW1lfSc+XCJcbiAgICAgICAgeG1sICs9IFwiPHNvdXJjZSBuYW1lPScje0Bzb3VyY2UubmFtZX0nLz5cIlxuICAgICAgICB4bWwgKz0gXCI8b3V0bGV0IG5hbWU9JyN7QGlubGV0Lm5hbWV9Jy8+XCJcbiAgICAgICAgeG1sICs9IFwiPHNpbmsgbmFtZT0nI3tAc2luay5uYW1lfScvPlwiXG4gICAgICAgIHhtbCArPSBcIjxpbmxldCBuYW1lPScje0BpbmxldC5uYW1lfScvPlwiXG4gICAgICAgIHhtbCArPSBcIjwvd2lyZT5cIlxuICAgICAgICB4bWxcblxuX19wcm9jZXNzX3NjYWxhciA9IChzY2FsYXIpIC0+XG4gICAgICAgIHR5cGUgPSBzY2FsYXIuZ2V0QXR0cmlidXRlKFwidHlwZVwiKVxuICAgICAgICB0ZXh0ID0gc2NhbGFyLnRleHRDb250ZW50XG4gICAgICAgIGlmIHR5cGUgaXMgXCJudW1iZXJcIlxuICAgICAgICAgICAgdmFsdWUgPSBOdW1iZXIodGV4dClcbiAgICAgICAgZWxzZSBpZiB0eXBlIGlzIFwic3RyaW5nXCJcbiAgICAgICAgICAgIHZhbHVlID0gU3RyaW5nKHRleHQpXG4gICAgICAgIGVsc2UgaWYgdHlwZSBpcyBcImJvb2xlYW5cIlxuICAgICAgICAgICAgdmFsdWUgPSBCb29sZWFuKHRleHQpXG4gICAgICAgIGVsc2UgaWYgdHlwZSBpcyBcImFycmF5XCJcbiAgICAgICAgICAgIGxpc3Rfc2NhbGFycyA9IHhwYXRoLnNlbGVjdChcImxpc3Qvc2NhbGFyXCIsIHNjYWxhcilcbiAgICAgICAgICAgIHZhbHVlID0gW11cbiAgICAgICAgICAgIGZvciBlbCBpbiBsaXN0X3NjYWxhcnNcbiAgICAgICAgICAgICAgICBlbF92YWx1ZSA9IF9fcHJvY2Vzc19zY2FsYXIoZWwpXG4gICAgICAgICAgICAgICAgdmFsdWUucHVzaChlbF92YWx1ZSlcblxuICAgICAgICByZXR1cm4gdmFsdWVcblxuX19wcm9jZXNzX3Byb3A6IChwcm9wKSAtPlxuICAgICAgICBlbnRpdHlfcHJvcCA9IHt9XG4gICAgICAgIHNsb3QgPSBwcm9wLmdldEF0dHJpYnV0ZShcInNsb3RcIilcbiAgICAgICAgc2NhbGFyID0geHBhdGguc2VsZWN0KFwic2NhbGFyXCIsIHByb3ApXG4gICAgICAgIHZhbHVlID0gX19wcm9jZXNzX3NjYWxhcihzY2FsYXJbMF0pXG4gICAgICAgIGVudGl0eV9wcm9wLnNsb3QgPSBzbG90XG4gICAgICAgIGVudGl0eV9wcm9wLnZhbHVlID0gdmFsdWVcbiAgICAgICAgZW50aXR5X3Byb3BcblxuY2xhc3MgU3RvcmVcblxuICAgIGNvbnN0cnVjdG9yOiAtPlxuICAgICAgICBAZW50aXRpZXMgPSBuZXcgTmFtZVNwYWNlKFwiZW50aXRpZXNcIilcblxuICAgIGFkZDogKGVudGl0eSkgLT5cbiAgICAgICAgc3ltYm9sID0gUyhlbnRpdHkuaWQpXG4gICAgICAgIEBlbnRpdGllcy5iaW5kKHN5bWJvbCwgZW50aXR5KVxuICAgICAgICBlbnRpdHlcblxuICAgIHNuYXBzaG90OiAoKSAtPlxuICAgICAgICB4bWwgPSAnPD94bWwgdmVyc2lvbiA9IFwiMS4wXCIgc3RhbmRhbG9uZT1cInllc1wiPz4nXG4gICAgICAgIHhtbCArPSBcIjxzbmFwc2hvdD5cIlxuICAgICAgICBmb3IgZW50aXR5IGluIEBlbnRpdGllcy5vYmplY3RzKClcbiAgICAgICAgICAgIHhtbCArPSBlbnRpdHkuc2VyaWFsaXplKClcbiAgICAgICAgeG1sICs9IFwiPC9zbmFwc2hvdD5cIlxuICAgICAgICByZXR1cm4geG1sXG5cbiAgICBvcDogKGYsIGFyZ3MuLi4pIC0+XG4gICAgICAgIHJldHVybiBmLmFwcGx5KHRoaXMsIGFyZ3MpXG5cbiAgICByZWNvdmVyOiAoeG1sKSAtPlxuICAgICAgICBkb2MgPSBuZXcgZG9tKCkucGFyc2VGcm9tU3RyaW5nKHhtbClcbiAgICAgICAgZW50aXRpZXMgPSB4cGF0aC5zZWxlY3QoXCIvL2VudGl0eVwiLCBkb2MpXG4gICAgICAgIGVudGl0aWVzX2xpc3QgPSBbXVxuICAgICAgICBmb3IgZW50aXR5IGluIGVudGl0aWVzXG4gICAgICAgICAgICBlbnRpdHlfcHJvcHMgPSB7fVxuICAgICAgICAgICAgcHJvcHMgPSB4cGF0aC5zZWxlY3QoXCJwcm9wZXJ0eVwiLCBlbnRpdHkpXG4gICAgICAgICAgICBmb3IgcHJvcCBpbiBwcm9wc1xuICAgICAgICAgICAgICAgIGVudGl0eV9wcm9wID0gX19wcm9jZXNzX3Byb3AocHJvcClcbiAgICAgICAgICAgICAgICBlbnRpdHlfcHJvcHNbZW50aXR5X3Byb3Auc2xvdF0gPSBlbnRpdHlfcHJvcC52YWx1ZVxuXG4gICAgICAgICAgICBuZXdfZW50aXR5ID0gbmV3IEVudGl0eShudWxsLCBlbnRpdHlfcHJvcHMpXG5cbiAgICAgICAgICAgIHBhcnRzID0geHBhdGguc2VsZWN0KFwicGFydFwiLCBlbnRpdHkpXG4gICAgICAgICAgICBmb3IgcGFydCBpbiBwYXJ0c1xuICAgICAgICAgICAgICAgIG5hbWUgPSBwYXJ0LmdldEF0dHJpYnV0ZShcIm5hbWVcIilcbiAgICAgICAgICAgICAgICBwYXJ0X3Byb3BzID0ge31cbiAgICAgICAgICAgICAgICBwcm9wcyA9IHhwYXRoLnNlbGVjdChcInByb3BlcnR5XCIsIHBhcnQpXG4gICAgICAgICAgICAgICAgZm9yIHByb3AgaW4gcHJvcHNcbiAgICAgICAgICAgICAgICAgICAgcGFydF9wcm9wID0gX19wcm9jZXNzX3Byb3AocHJvcClcbiAgICAgICAgICAgICAgICAgICAgcGFydF9wcm9wc1twYXJ0X3Byb3Auc2xvdF0gPSBwYXJ0X3Byb3AudmFsdWVcbiAgICAgICAgICAgICAgICBlbnRpdHlfcGFydCA9IG5ldyBQYXJ0KG5hbWUsIHBhcnRfcHJvcHMpXG4gICAgICAgICAgICAgICAgbmV3X2VudGl0eS5hZGQoZW50aXR5X3BhcnQpXG5cbiAgICAgICAgICAgIGVudGl0aWVzX2xpc3QucHVzaChuZXdfZW50aXR5KVxuXG4gICAgICAgIGZvciBlbnRpdHkgaW4gZW50aXRpZXNfbGlzdFxuICAgICAgICAgICAgQGFkZChlbnRpdHkpXG5cbiAgICBoYXM6IChpZCkgLT5cbiAgICAgICAgQGVudGl0aWVzLmhhcyhpZClcblxuICAgIGVudGl0eTogKGlkKSAtPlxuICAgICAgICBAZW50aXRpZXMub2JqZWN0KGlkKVxuXG4gICAgcmVtb3ZlOiAoaWQpIC0+XG4gICAgICAgIEBlbnRpdGllcy51bmJpbmQoaWQpXG5cbiAgICBieV9wcm9wOiAocHJvcCkgLT5cbiAgICAgICAgZW50aXRpZXMgPSBbXVxuICAgICAgICBmb3IgZW50aXR5IGluIEBlbnRpdGllcy5vYmplY3RzKClcbiAgICAgICAgICAgIGlmIGVudGl0eS5oYXMocHJvcC5zbG90KVxuICAgICAgICAgICAgICAgIGlmIGVudGl0eS5zbG90KHByb3Auc2xvdCkgaXMgcHJvcC52YWx1ZVxuICAgICAgICAgICAgICAgICAgICBlbnRpdGllcy5wdXNoKGVudGl0eSlcblxuICAgICAgICBpZiBlbnRpdGllcy5sZW5ndGggPiAwXG4gICAgICAgICAgICByZXR1cm4gZW50aXRpZXNcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgRyhcIk5vdEZvdW5kXCIpXG5cbiAgICBmaXJzdF9ieV9wcm9wOiAocHJvcCkgLT5cbiAgICAgICAgZW50aXRpZXMgPSBAYnlfcHJvcChwcm9wKVxuICAgICAgICBpZiBlbnRpdGllcyBpbnN0YW5jZW9mIEdsaXRjaFxuICAgICAgICAgICAgcmV0dXJuIGVudGl0aWVzXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIGVudGl0aWVzWzBdXG5cbiAgICBieV90YWdzOiAodGFncykgLT5cbiAgICAgICAgZW50aXRpZXMgPSBbXVxuICAgICAgICBmb3IgZW50aXR5IGluIEBlbnRpdGllcy5vYmplY3RzKClcbiAgICAgICAgICAgIGZvciB0YWcgaW4gdGFnc1xuICAgICAgICAgICAgICAgIGlmIHRhZyBpbiBlbnRpdHkudGFnc1xuICAgICAgICAgICAgICAgICAgICBlbnRpdGllcy5wdXNoIGVudGl0eVxuXG4gICAgICAgIGlmIGVudGl0aWVzLmxlbmd0aCA+IDBcbiAgICAgICAgICAgIHJldHVybiBlbnRpdGllc1xuICAgICAgICBlbHNlXG4gICAgICAgICAgICBHKFwiTm90Rm91bmRcIilcblxuICAgIGZpcnN0X2J5X3RhZ3M6ICh0YWdzKSAtPlxuICAgICAgICBlbnRpdGllcyA9IEBieV90YWdzKHRhZ3MpXG4gICAgICAgIGlmIGVudGl0aWVzIGluc3RhbmNlb2YgR2xpdGNoXG4gICAgICAgICAgICByZXR1cm4gZW50aXRpZXNcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgZW50aXRpZXNbMF1cblxuXG5jbGFzcyBCdXMgZXh0ZW5kcyBOYW1lU3BhY2VcblxuICAgIGNvbnN0cnVjdG9yOiAoQG5hbWUsIHNlcCkgLT5cbiAgICAgICAgc3VwZXIoQG5hbWUsIHNlcClcblxuICAgIHRyaWdnZXI6IChzaWduYWwpIC0+XG4gICAgICAgIGZvciBvYmogaW4gQG9iamVjdHMoKVxuICAgICAgICAgICAgaWYgb2JqIGluc3RhbmNlb2YgU3lzdGVtXG4gICAgICAgICAgICAgICAgb2JqLnJhaXNlKHNpZ25hbClcblxuY2xhc3MgQm9hcmRcblxuICAgIGNvbnN0cnVjdG9yOiAobmFtZSwgd2lyZUNsYXNzLCBidXNDbGFzcywgc3RvcmVDbGFzcykgLT5cbiAgICAgICAgQHdpcmVDbGFzcyA9IHdpcmVDbGFzcyB8fCBXaXJlXG4gICAgICAgIEBidXNDbGFzcyA9IGJ1c0NsYXNzIHx8IEJ1c1xuICAgICAgICBAc3RvcmVDbGFzcyA9IHN0b3JlQ2xhc3MgfHwgU3RvcmVcblxuICAgICAgICBAc3RvcmUgPSBuZXcgQHN0b3JlQ2xhc3MoKVxuICAgICAgICBAd2lyZXMgPSBuZXcgTmFtZVNwYWNlKFwiYnVzLndpcmVzXCIpXG5cbiAgICAgICAgQGJ1cyA9IG5ldyBAYnVzQ2xhc3MoXCJzeXN0ZW1zXCIpXG4gICAgICAgIEBzeXN0ZW1zID0gQGJ1c1xuICAgICAgICBAYnVzLmJpbmQoUyhcIndpcmVzXCIpLCAgQHdpcmVzKVxuICAgICAgICBAYnVzLmJpbmQoUyhcInN0b3JlXCIpLCBAc3RvcmUpXG5cbiAgICBzZXR1cDogKHhtbCkgLT5cbiAgICAgICAgaWYgeG1sXG4gICAgICAgICAgICBkb2MgPSBuZXcgZG9tKCkucGFyc2VGcm9tU3RyaW5nKHhtbClcbiAgICAgICAgICAgIGJvYXJkID0geHBhdGguc2VsZWN0KFwiYm9hcmRcIiwgZG9jKVxuICAgICAgICAgICAgYm9hcmRfbmFtZSA9IGJvYXJkLmdldEF0dHJpYnV0ZShcIm5hbWVcIilcbiAgICAgICAgICAgIGJ1c19jbGFzcyA9IHhwYXRoLnNlbGVjdChcIkJ1c1wiLCBkb2MpLmdldEF0dHJpYnV0ZShcImNsYXNzXCIpXG4gICAgICAgICAgICBzdG9yZV9jbGFzcyA9IHhwYXRoLnNlbGVjdChcIlN0b3JlXCIsIGRvYykuZ2V0QXR0cmlidXRlKFwiY2xhc3NcIilcbiAgICAgICAgICAgIHdpcmVfY2xhc3MgPSB4cGF0aC5zZWxlY3QoXCJXaXJlXCIsIGRvYykuZ2V0QXR0cmlidXRlKFwiY2xhc3NcIilcblxuICAgICAgICAgICAgYm9hcmRfbmV3ID0gbmV3IEJvYXJkKGJvYXJkX25hbSwgZ2xvYmFsW3dpcmVfY2xhc3NdLCBnbG9iYWxbYnVzX2NsYXNzXSwgZ2xvYmFsW3N0b3JlX2NsYXNzXSlcblxuICAgICAgICAgICAgc3lzcyA9IHhwYXRoLnNlbGVjdChcIi8vc3lzdGVtXCIsIGRvYylcbiAgICAgICAgICAgIGZvciBzeXMgaW4gc3lzc1xuICAgICAgICAgICAgICAgIG5hbWUgPSBzeXMuZ2V0QXR0cmlidXRlKFwibmFtZVwiKVxuICAgICAgICAgICAgICAgIGtsYXNzID0gc3lzLmdldEF0dHJpYnV0ZShcImNsYXNzXCIpXG4gICAgICAgICAgICAgICAgY29uZl9ub2RlID0geHBhdGguc2VsZWN0KFwiL2NvbmZpZ3VyYXRpb25cIiwgc3lzKVxuICAgICAgICAgICAgICAgIGRhdGFfcHJvcHMgPSB7fVxuICAgICAgICAgICAgICAgIHByb3BzID0geHBhdGguc2VsZWN0KFwiL3Byb3BlcnR5XCIsIGNvbmZfbm9kZSlcbiAgICAgICAgICAgICAgICBmb3IgcHJvcCBpbiBwcm9wc1xuICAgICAgICAgICAgICAgICAgICBkYXRhX3Byb3AgPSBfX3Byb2Nlc3NfcHJvcChwcm9wKVxuICAgICAgICAgICAgICAgICAgICBkYXRhX3Byb3BzW2RhdGFfcHJvcC5zbG90XSA9IGRhdGFfcHJvcC52YWx1ZVxuXG4gICAgICAgICAgICAgICAgYm9hcmRfbmV3LmFkZChPX08uUyhuYW1lKSwgZ2xvYmFsW2tsYXNzXSwgRChwcm9wcykpXG5cbiAgICAgICAgICAgIHdpcmVzID0geHBhdGguc2VsZWN0KFwiLy93aXJlXCIsIGRvYylcbiAgICAgICAgICAgIGZvciBjb25uIGluIGNvbm5zXG4gICAgICAgICAgICAgICAgc291cmNlX25hbWUgPSB4cGF0aC5zZWxlY3QoXCJzb3VyY2VcIiwgY29ubikuZ2V0QXR0cmlidXRlKFwibmFtZVwiKVxuICAgICAgICAgICAgICAgIG91dGxldF9uYW1lID0geHBhdGguc2VsZWN0KFwib3V0bGV0XCIsIGNvbm4pLmdldEF0dHJpYnV0ZShcIm5hbWVcIilcbiAgICAgICAgICAgICAgICBzaW5rX25hbWUgPSB4cGF0aC5zZWxlY3QoXCJzaW5rXCIsIGNvbm4pLmdldEF0dHJpYnV0ZShcIm5hbWVcIilcbiAgICAgICAgICAgICAgICBpbmxldF9uYW1lID0geHBhdGguc2VsZWN0KFwiaW5sZXRcIiwgY29ubikuZ2V0QXR0cmlidXRlKFwibmFtZVwiKVxuXG4gICAgICAgICAgICAgICAgYm9hcmRfbmV3LmFkZChzb3VyY2VfbmFtZSwgc2lua19uYW1lLCBvdXRsZXRfbmFtZSwgaW5sZXRfbmFtZSlcblxuICAgICAgICAgICAgcmV0dXJuIGJvYXJkX25ld1xuXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIHhtbCA9ICc8P3htbCB2ZXJzaW9uID0gXCIxLjBcIiBzdGFuZGFsb25lPVwieWVzXCI/PidcbiAgICAgICAgICAgIHhtbCArPSBcIjxib2FyZCBuYW1lPScje0BuYW1lfSc+XCJcbiAgICAgICAgICAgIHhtbCArPSBcIjxCdXMgY2xhc3M9JyN7QGJ1cy5jb25zdHJ1Y3Rvci5uYW1lfScvPlwiXG4gICAgICAgICAgICB4bWwgKz0gXCI8U3RvcmUgY2xhc3M9JyN7QHN0b3JlLmNvbnN0cnVjdG9yLm5hbWV9Jy8+XCJcbiAgICAgICAgICAgIHhtbCArPSBcIjxXaXJlIGNsYXNzPScje0B3aXJlQ2xhc3MubmFtZX0nLz5cIlxuICAgICAgICAgICAgZm9yIHN5cyBpbiBAc3lzdGVtcy5zeW1ib2xzKClcbiAgICAgICAgICAgICAgICBpZiBzeXMubmFtZSBub3QgaW4gW1wid2lyZXNcIiwgXCJzdG9yZVwiXVxuICAgICAgICAgICAgICAgICAgICB4bWwgKz0gc3lzLm9iamVjdC5zZXJpYWxpemUoKVxuICAgICAgICAgICAgZm9yIGNvbm4gaW4gQHdpcmVzLnN5bWJvbHMoKVxuICAgICAgICAgICAgICAgIHhtbCArPSBjb25uLm9iamVjdC5zZXJpYWxpemUoKVxuICAgICAgICAgICAgeG1sICs9IFwiPC9ib2FyZD5cIlxuXG5cbiAgICBjb25uZWN0OiAoc291cmNlLCBzaW5rLCBvdXRsZXQsIGlubGV0LCBzeW1ib2wpIC0+XG4gICAgICAgIHdpcmUgPSBuZXcgQHdpcmVDbGFzcyh0aGlzLCBzb3VyY2UsIHNpbmssIG91dGxldCwgaW5sZXQpXG4gICAgICAgIGlmICFzeW1ib2xcbiAgICAgICAgICAgIG5hbWUgPSBAYnVzLmdlbnN5bSgpXG4gICAgICAgICAgICBzeW1ib2wgPSBuZXcgU3ltYm9sKG5hbWUpXG4gICAgICAgIEB3aXJlcy5iaW5kKHN5bWJvbCwgd2lyZSlcblxuICAgICAgICBmb3Igc291cmNlX291dGxldCBpbiB3aXJlLnNvdXJjZS5vYmplY3Qub3V0bGV0cy5zeW1ib2xzKClcbiAgICAgICAgICAgIGlmIHNvdXJjZV9vdXRsZXQubmFtZSBpcyB3aXJlLm91dGxldC5uYW1lXG4gICAgICAgICAgICAgICAgc291cmNlX291dGxldC5vYmplY3QucHVzaChzeW1ib2wpXG5cbiAgICBwaXBlOiAoc291cmNlLCB3aXJlLCBzaW5rKSAtPlxuICAgICAgICBAY29ubmVjdChzb3VyY2UsIHNpbmssIHdpcmUpXG5cbiAgICBkaXNjb25uZWN0OiAobmFtZSkgLT5cbiAgICAgICAgd2lyZSA9IEB3aXJlKG5hbWUpXG4gICAgICAgIEB3aXJlcy51bmJpbmQobmFtZSlcblxuICAgICAgICBmb3Igb3V0bGV0IGluIHdpcmUuc291cmNlLm9iamVjdC5vdXRsZXRzLnN5bWJvbHMoKVxuICAgICAgICAgICAgaWYgb3V0bGV0Lm5hbWUgaXMgd2lyZS5vdXRsZXQubmFtZVxuICAgICAgICAgICAgICAgIHdpcmVzID0gW11cbiAgICAgICAgICAgICAgICBmb3IgY29ubiBpbiBvdXRsZXQub2JqZWN0XG4gICAgICAgICAgICAgICAgICAgIGlmIGNvbm4ubmFtZSAhPSBuYW1lXG4gICAgICAgICAgICAgICAgICAgICAgICB3aXJlcy5wdXNoKGNvbm4pXG4gICAgICAgICAgICAgICAgb3V0bGV0Lm9iamVjdCA9IHdpcmVzXG5cblxuICAgIHdpcmU6IChuYW1lKSAtPlxuICAgICAgICBAd2lyZXMub2JqZWN0KG5hbWUpXG5cbiAgICBoYXN3aXJlOiAobmFtZSkgLT5cbiAgICAgICAgQHdpcmVzLmhhcyhuYW1lKVxuXG4gICAgYWRkOiAoc3ltYm9sLCBzeXN0ZW1DbGFzcywgY29uZikgLT5cbiAgICAgICAgc3lzdGVtID0gbmV3IHN5c3RlbUNsYXNzKHRoaXMsIGNvbmYpXG4gICAgICAgIEBidXMuYmluZChzeW1ib2wsIHN5c3RlbSlcblxuICAgIGhhczogKG5hbWUpIC0+XG4gICAgICAgIEBidXMuaGFzKG5hbWUpXG5cbiAgICBzeXN0ZW06IChuYW1lKSAtPlxuICAgICAgICBAYnVzLm9iamVjdChuYW1lKVxuXG4gICAgcmVtb3ZlOiAobmFtZSkgLT5cbiAgICAgICAgc3lzdGVtID0gQGJ1cy5vYmplY3QobmFtZSlcbiAgICAgICAgc3lzdGVtLnB1c2goQFNUT1ApXG4gICAgICAgIEBidXMudW5iaW5kKG5hbWUpXG5cbmV4cG9ydHMuU3ltYm9sID0gU3ltYm9sXG5leHBvcnRzLk5hbWVTcGFjZSA9IE5hbWVTcGFjZVxuZXhwb3J0cy5TID0gU1xuZXhwb3J0cy5EYXRhID0gRGF0YVxuZXhwb3J0cy5EID0gRFxuZXhwb3J0cy5TaWduYWwgPSBTaWduYWxcbmV4cG9ydHMuRXZlbnQgPSBFdmVudFxuZXhwb3J0cy5HbGl0Y2ggPSBHbGl0Y2hcbmV4cG9ydHMuRyA9IEdcbmV4cG9ydHMuVG9rZW4gPSBUb2tlblxuZXhwb3J0cy5zdGFydCA9IHN0YXJ0XG5leHBvcnRzLnN0b3AgPSBzdG9wXG5leHBvcnRzLlQgPSBUXG5leHBvcnRzLlBhcnQgPSBQYXJ0XG5leHBvcnRzLlAgPSBQXG5leHBvcnRzLkVudGl0eSA9IEVudGl0eVxuZXhwb3J0cy5FID0gRVxuZXhwb3J0cy5DZWxsID0gQ2VsbFxuZXhwb3J0cy5DID0gQ1xuZXhwb3J0cy5TeXN0ZW0gPSBTeXN0ZW1cbmV4cG9ydHMuV2lyZSA9IFdpcmVcbmV4cG9ydHMuU3RvcmUgPSBTdG9yZVxuZXhwb3J0cy5CdXMgPSBCdXNcbmV4cG9ydHMuQm9hcmQgPSBCb2FyZFxuXG4iXSwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=