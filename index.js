var Channel, Connection, Flow, Message, StateBus, System;

System = (function() {
  function System(name, flow) {
    this.name = name;
    this.flow = flow;
    this.handlers = {};
  }

  System.prototype.push = function(inlet, data) {};

  System.prototype.whenReady = function(outelt, handler) {
    if (this.handlers.outlet === null) {
      return this.handlers.outlet = [handler];
    } else {
      return this.handlers.outlet.push(handler);
    }
  };

  System.prototype.emit = function() {};

  System.prototype.serialize = function() {
    return "<system name=\"" + this.name + "\" />";
  };

  return System;

})();

Channel = (function() {
  function Channel(inlet, outlet) {
    this.inlet = inlet;
    this.outlet = outlet;
  }

  Channel.prototype.serialize = function() {
    return "<channel inlet='" + this.inlet + "', outlet='" + this.outlet + "'/>";
  };

  return Channel;

})();

Connection = (function() {
  function Connection(name, source, sink, channels) {
    this.name = name;
    this.source = source;
    this.sink = sink;
    this.channels = channels;
  }

  Connection.prototype.serialize = function() {
    var channel, xml, _i, _len, _ref;
    xml = "<connection name='" + this.name + "'>\"\n    " + (this.source.serialize()) + "\n    " + (this.sink.serialize());
    xml += "<channels>";
    _ref = this.channels;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      channel = _ref[_i];
      xml += channel.serialize();
    }
    return xml += "    </channels>\n</connection>";
  };

  return Connection;

})();

Message = (function() {
  function Message(event, payload) {
    this.event = event;
    this.payload = payload;
  }

  return Message;

})();

StateBus = (function() {
  function StateBus() {
    this.entities = {};
    this.discreteSystems = {};
  }

  StateBus.prototype.addEntity = function(entity) {
    return this.entities[entiy.name] = entity;
  };

  addDiscreteSystem(discrete_system, events)(function() {
    var event, _i, _len;
    for (_i = 0, _len = events.length; _i < _len; _i++) {
      event = events[_i];
      if (this.discreteSystems[event].systems === null) {
        this.discreteSystems[event].systems = [discrete_system];
      } else {
        this.discreteSystems[event].systems.append(discrete_system);
      }
    }
    return {
      trigger: function(event, message) {
        var system, _j, _len1, _ref, _results;
        _ref = this.discreteSystems[event];
        _results = [];
        for (_j = 0, _len1 = _ref.length; _j < _len1; _j++) {
          system = _ref[_j];
          message = -Message(event, message);
          _results.push(system.raise(message));
        }
        return _results;
      }
    };
  });

  return StateBus;

})();

Flow = (function() {
  function Flow() {
    this.connections = [];
    this.objectStore = new ObjectStore;
    this.bus = new StateBus;
    this.systems = {};
  }

  Flow.prototype.addSystem = function(name, inlets, outlets) {
    return this.systems[name] = system;
  };

  Flow.prototype.connect = function(connection) {
    return this.connections[connection.name] = connection;
  };

  Flow.prototype.serialize = function() {
    var connection, xml, _i, _len, _ref;
    xml = "<xml>";
    xml += "<flow name='" + this.name + "'>";
    _ref = this.connections;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      connection = _ref[_i];
      xml += "<connection>";
      xml += connection.serialize();
      xml += "</connection>";
    }
    xml = "</flow>";
    return xml = "</xml>";
  };

  Flow.prototype.start = function() {
    var A, B, channel, connection, _i, _len, _results;
    _results = [];
    for (_i = 0, _len = connections.length; _i < _len; _i++) {
      connection = connections[_i];
      A = connection.from;
      B = connection.to;
      _results.push((function() {
        var _j, _len1, _ref, _results1;
        _ref = connection.channels;
        _results1 = [];
        for (_j = 0, _len1 = _ref.length; _j < _len1; _j++) {
          channel = _ref[_j];
          _results1.push(A.whenReady(A.channel.outlet, function(data) {
            return B.push(inlet, data);
          }));
        }
        return _results1;
      })());
    }
    return _results;
  };

  return Flow;

})();

exports.System = System;

exports.Channel = Channel;

exports.Connection = Connection;

exports.Message = Message;

exports.StateBus = StateBus;

exports.Flow = Flow;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VzIjpbImluZGV4LmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxJQUFBLG9EQUFBOztBQUFBO0FBRWdCLEVBQUEsZ0JBQUUsSUFBRixFQUFTLElBQVQsR0FBQTtBQUNSLElBRFMsSUFBQyxDQUFBLE9BQUEsSUFDVixDQUFBO0FBQUEsSUFEZ0IsSUFBQyxDQUFBLE9BQUEsSUFDakIsQ0FBQTtBQUFBLElBQUEsSUFBQyxDQUFBLFFBQUQsR0FBWSxFQUFaLENBRFE7RUFBQSxDQUFaOztBQUFBLG1CQUdBLElBQUEsR0FBTSxTQUFDLEtBQUQsRUFBUSxJQUFSLEdBQUEsQ0FITixDQUFBOztBQUFBLG1CQUtBLFNBQUEsR0FBVyxTQUFDLE1BQUQsRUFBUyxPQUFULEdBQUE7QUFFUCxJQUFBLElBQUcsSUFBQyxDQUFBLFFBQVEsQ0FBQyxNQUFWLEtBQW9CLElBQXZCO2FBQ0ksSUFBQyxDQUFBLFFBQVEsQ0FBQyxNQUFWLEdBQW1CLENBQUMsT0FBRCxFQUR2QjtLQUFBLE1BQUE7YUFHSSxJQUFDLENBQUEsUUFBUSxDQUFDLE1BQU0sQ0FBQyxJQUFqQixDQUFzQixPQUF0QixFQUhKO0tBRk87RUFBQSxDQUxYLENBQUE7O0FBQUEsbUJBWUEsSUFBQSxHQUFNLFNBQUEsR0FBQSxDQVpOLENBQUE7O0FBQUEsbUJBY0EsU0FBQSxHQUFXLFNBQUEsR0FBQTtXQUNKLGlCQUFBLEdBQ0csSUFBQyxDQUFBLElBREosR0FDVSxRQUZOO0VBQUEsQ0FkWCxDQUFBOztnQkFBQTs7SUFGSixDQUFBOztBQUFBO0FBdUJpQixFQUFBLGlCQUFFLEtBQUYsRUFBVSxNQUFWLEdBQUE7QUFBbUIsSUFBbEIsSUFBQyxDQUFBLFFBQUEsS0FBaUIsQ0FBQTtBQUFBLElBQVYsSUFBQyxDQUFBLFNBQUEsTUFBUyxDQUFuQjtFQUFBLENBQWI7O0FBQUEsb0JBRUEsU0FBQSxHQUFXLFNBQUEsR0FBQTtXQUNOLGtCQUFBLEdBQWlCLElBQUMsQ0FBQSxLQUFsQixH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QUYsQ0FBWSxDQUFDLENBQUMsT0FBTyxDQUFDLE1BQXRCLEVBQStCLFNBQUMsSUFBRCxHQUFBO21CQUMzQixDQUFDLENBQUMsSUFBRixDQUFPLEtBQVAsRUFBYyxJQUFkLEVBRDJCO1VBQUEsQ0FBL0IsRUFBQSxDQUZKO0FBQUE7O1dBSEEsQ0FESjtBQUFBO29CQUZHO0VBQUEsQ0EzQlAsQ0FBQTs7Y0FBQTs7SUE1RUosQ0FBQTs7QUFBQSxPQW1ITyxDQUFDLE1BQVIsR0FBaUIsTUFuSGpCLENBQUE7O0FBQUEsT0FvSE8sQ0FBQyxPQUFSLEdBQWtCLE9BcEhsQixDQUFBOztBQUFBLE9BcUhPLENBQUMsVUFBUixHQUFxQixVQXJIckIsQ0FBQTs7QUFBQSxPQXNITyxDQUFDLE9BQVIsR0FBa0IsT0F0SGxCLENBQUE7O0FBQUEsT0F1SE8sQ0FBQyxRQUFSLEdBQW1CLFFBdkhuQixDQUFBOztBQUFBLE9Bd0hPLENBQUMsSUFBUixHQUFlLElBeEhmLENBQUEiLCJzb3VyY2VzQ29udGVudCI6WyJjbGFzcyBTeXN0ZW1cblxuICAgIGNvbnN0cnVjdG9yOihAbmFtZSwgQGZsb3cpIC0+XG4gICAgICAgIEBoYW5kbGVycyA9IHt9XG5cbiAgICBwdXNoOiAoaW5sZXQsIGRhdGEpIC0+XG5cbiAgICB3aGVuUmVhZHk6IChvdXRlbHQsIGhhbmRsZXIpIC0+XG5cbiAgICAgICAgaWYgQGhhbmRsZXJzLm91dGxldCBpcyBudWxsXG4gICAgICAgICAgICBAaGFuZGxlcnMub3V0bGV0ID0gW2hhbmRsZXJdXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIEBoYW5kbGVycy5vdXRsZXQucHVzaCBoYW5kbGVyXG5cbiAgICBlbWl0OiAtPlxuXG4gICAgc2VyaWFsaXplOiAtPlxuICAgICAgICBcIlwiXCJcbiAgICAgICAgPHN5c3RlbSBuYW1lPVwiI3tAbmFtZX1cIiAvPlxuICAgICAgICBcIlwiXCJcblxuY2xhc3MgQ2hhbm5lbFxuXG4gICAgY29uc3RydWN0b3I6IChAaW5sZXQsIEBvdXRsZXQpIC0+XG5cbiAgICBzZXJpYWxpemU6IC0+XG4gICAgICAgIFwiPGNoYW5uZWwgaW5sZXQ9JyN7QGlubGV0fScsIG91dGxldD0nI3tAb3V0bGV0fScvPlwiXG5cbmNsYXNzIENvbm5lY3Rpb25cblxuICAgIGNvbnN0cnVjdG9yOiAoQG5hbWUsIEBzb3VyY2UsIEBzaW5rLCBAY2hhbm5lbHMpLT5cblxuICAgIHNlcmlhbGl6ZTogLT5cbiAgICAgICAgICAgIHhtbCA9IFwiXCJcIlxuICAgICAgICAgICAgPGNvbm5lY3Rpb24gbmFtZT0nI3tAbmFtZX0nPlwiXG4gICAgICAgICAgICAgICAgI3tAc291cmNlLnNlcmlhbGl6ZSgpfVxuICAgICAgICAgICAgICAgICN7QHNpbmsuc2VyaWFsaXplKCl9XG4gICAgICAgICAgICBcIlwiXCJcbiAgICAgICAgICAgIHhtbCArPSBcIjxjaGFubmVscz5cIlxuICAgICAgICAgICAgZm9yIGNoYW5uZWwgaW4gQGNoYW5uZWxzXG4gICAgICAgICAgICAgICAgeG1sICs9IGNoYW5uZWwuc2VyaWFsaXplKClcbiAgICAgICAgICAgIHhtbCArPSBcIlwiXCJcbiAgICAgICAgICAgICAgICA8L2NoYW5uZWxzPlxuICAgICAgICAgICAgPC9jb25uZWN0aW9uPlxuICAgICAgICAgICAgXCJcIlwiXG5cbmNsYXNzIE1lc3NhZ2VcblxuICAgIGNvbnN0cnVjdG9yOiAoQGV2ZW50LCBAcGF5bG9hZCkgLT5cblxuY2xhc3MgU3RhdGVCdXNcblxuICAgIGNvbnN0cnVjdG9yOiAtPlxuICAgICAgICBAZW50aXRpZXMgPSB7fVxuICAgICAgICBAZGlzY3JldGVTeXN0ZW1zID0ge31cblxuICAgIGFkZEVudGl0eTogKGVudGl0eSkgLT5cbiAgICAgICAgQGVudGl0aWVzW2VudGl5Lm5hbWVdID0gZW50aXR5XG5cbiAgICBhZGREaXNjcmV0ZVN5c3RlbShkaXNjcmV0ZV9zeXN0ZW0sIGV2ZW50cykgLT5cblxuICAgICAgICBmb3IgZXZlbnQgaW4gZXZlbnRzXG5cbiAgICAgICAgICAgIGlmIEBkaXNjcmV0ZVN5c3RlbXNbZXZlbnRdLnN5c3RlbXMgaXMgbnVsbFxuICAgICAgICAgICAgICAgIEBkaXNjcmV0ZVN5c3RlbXNbZXZlbnRdLnN5c3RlbXMgPSBbZGlzY3JldGVfc3lzdGVtXVxuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIEBkaXNjcmV0ZVN5c3RlbXNbZXZlbnRdLnN5c3RlbXMuYXBwZW5kKGRpc2NyZXRlX3N5c3RlbSlcblxuICAgICAgICB0cmlnZ2VyOiAoZXZlbnQsIG1lc3NhZ2UpIC0+XG5cbiAgICAgICAgICAgIGZvciBzeXN0ZW0gaW4gQGRpc2NyZXRlU3lzdGVtc1tldmVudF1cbiAgICAgICAgICAgICAgICBtZXNzYWdlID0tIE1lc3NhZ2UoZXZlbnQsIG1lc3NhZ2UpXG4gICAgICAgICAgICAgICAgc3lzdGVtLnJhaXNlKG1lc3NhZ2UpXG5cbmNsYXNzIEZsb3dcblxuICAgIGNvbnN0cnVjdG9yOiAtPlxuXG4gICAgICAgICMgY291bGQgYmUgYSBvcmRlcmVkIG1hcFxuXG4gICAgICAgIEBjb25uZWN0aW9ucyA9IFtdXG4gICAgICAgIEBvYmplY3RTdG9yZSA9IG5ldyBPYmplY3RTdG9yZVxuICAgICAgICBAYnVzID0gbmV3IFN0YXRlQnVzXG4gICAgICAgIEBzeXN0ZW1zID0ge31cblxuICAgIGFkZFN5c3RlbTogKG5hbWUsIGlubGV0cywgb3V0bGV0cykgLT5cbiAgICAgICAgQHN5c3RlbXNbbmFtZV0gPSBzeXN0ZW1cblxuICAgIGNvbm5lY3Q6IChjb25uZWN0aW9uKSAtPlxuICAgICAgICBAY29ubmVjdGlvbnNbY29ubmVjdGlvbi5uYW1lXSA9IGNvbm5lY3Rpb25cblxuICAgIHNlcmlhbGl6ZTogLT5cbiAgICAgICAgeG1sID0gXCI8eG1sPlwiXG4gICAgICAgIHhtbCArPSBcIjxmbG93IG5hbWU9JyN7QG5hbWV9Jz5cIlxuXG4gICAgICAgIGZvciBjb25uZWN0aW9uIGluIEBjb25uZWN0aW9uc1xuICAgICAgICAgICAgeG1sICs9IFwiPGNvbm5lY3Rpb24+XCJcbiAgICAgICAgICAgIHhtbCArPSBjb25uZWN0aW9uLnNlcmlhbGl6ZSgpXG4gICAgICAgICAgICB4bWwgKz0gXCI8L2Nvbm5lY3Rpb24+XCJcblxuICAgICAgICB4bWwgPSBcIjwvZmxvdz5cIlxuICAgICAgICB4bWwgPSBcIjwveG1sPlwiXG5cbiAgICBzdGFydDogLT5cblxuICAgICAgICBmb3IgY29ubmVjdGlvbiBpbiBjb25uZWN0aW9uc1xuICAgICAgICAgICAgQSA9IGNvbm5lY3Rpb24uZnJvbVxuICAgICAgICAgICAgQiA9IGNvbm5lY3Rpb24udG9cblxuICAgICAgICAgICAgZm9yIGNoYW5uZWwgaW4gY29ubmVjdGlvbi5jaGFubmVsc1xuXG4gICAgICAgICAgICAgICAgQS53aGVuUmVhZHkgQS5jaGFubmVsLm91dGxldCwgIChkYXRhKSAtPlxuICAgICAgICAgICAgICAgICAgICBCLnB1c2goaW5sZXQsIGRhdGEpXG5cblxuZXhwb3J0cy5TeXN0ZW0gPSBTeXN0ZW1cbmV4cG9ydHMuQ2hhbm5lbCA9IENoYW5uZWxcbmV4cG9ydHMuQ29ubmVjdGlvbiA9IENvbm5lY3Rpb25cbmV4cG9ydHMuTWVzc2FnZSA9IE1lc3NhZ2VcbmV4cG9ydHMuU3RhdGVCdXMgPSBTdGF0ZUJ1c1xuZXhwb3J0cy5GbG93ID0gRmxvd1xuXG4iXSwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=