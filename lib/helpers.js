var dom2prop, dom2scalar, randomElement, randomInt, xpath;

xpath = require("xpath");

randomInt = function(min, max) {
  return Math.floor(Math.random() * (max - min)) + min;
};

randomElement = function(array) {
  var max, min;
  min = 0;
  max = array.length;
  return array[randomInt(min, max)];
};

dom2scalar = function(scalar) {
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
      el_value = dom2scalar(el);
      value.push(el_value);
    }
  }
  return value;
};

dom2prop = function(prop) {
  var entity_prop, scalar, slot, value;
  entity_prop = {};
  slot = prop.getAttribute("slot");
  scalar = xpath.select("scalar", prop);
  value = dom2scalar(scalar[0]);
  entity_prop.slot = slot;
  entity_prop.value = value;
  return entity_prop;
};

exports.randomInt = randomInt;

exports.randomElement = randomElement;

exports.dom2scalar = dom2scalar;

exports.dom2prop = dom2prop;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaGVscGVycy5qcyIsInNvdXJjZXMiOlsiaGVscGVycy5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsSUFBQSxxREFBQTs7QUFBQSxLQUFBLEdBQVEsT0FBQSxDQUFRLE9BQVIsQ0FBUixDQUFBOztBQUFBLFNBRUEsR0FBWSxTQUFDLEdBQUQsRUFBTSxHQUFOLEdBQUE7QUFDVixTQUFPLElBQUksQ0FBQyxLQUFMLENBQVcsSUFBSSxDQUFDLE1BQUwsQ0FBQSxDQUFBLEdBQWdCLENBQUMsR0FBQSxHQUFNLEdBQVAsQ0FBM0IsQ0FBQSxHQUEwQyxHQUFqRCxDQURVO0FBQUEsQ0FGWixDQUFBOztBQUFBLGFBS0EsR0FBZ0IsU0FBQyxLQUFELEdBQUE7QUFDZCxNQUFBLFFBQUE7QUFBQSxFQUFBLEdBQUEsR0FBTSxDQUFOLENBQUE7QUFBQSxFQUNBLEdBQUEsR0FBTSxLQUFLLENBQUMsTUFEWixDQUFBO0FBRUEsU0FBTyxLQUFNLENBQUEsU0FBQSxDQUFVLEdBQVYsRUFBZSxHQUFmLENBQUEsQ0FBYixDQUhjO0FBQUEsQ0FMaEIsQ0FBQTs7QUFBQSxVQVVBLEdBQWEsU0FBQyxNQUFELEdBQUE7QUFDVCxNQUFBLHVEQUFBO0FBQUEsRUFBQSxJQUFBLEdBQU8sTUFBTSxDQUFDLFlBQVAsQ0FBb0IsTUFBcEIsQ0FBUCxDQUFBO0FBQUEsRUFDQSxJQUFBLEdBQU8sTUFBTSxDQUFDLFdBRGQsQ0FBQTtBQUVBLEVBQUEsSUFBRyxJQUFBLEtBQVEsUUFBWDtBQUNJLElBQUEsS0FBQSxHQUFRLE1BQUEsQ0FBTyxJQUFQLENBQVIsQ0FESjtHQUFBLE1BRUssSUFBRyxJQUFBLEtBQVEsUUFBWDtBQUNELElBQUEsS0FBQSxHQUFRLE1BQUEsQ0FBTyxJQUFQLENBQVIsQ0FEQztHQUFBLE1BRUEsSUFBRyxJQUFBLEtBQVEsU0FBWDtBQUNELElBQUEsS0FBQSxHQUFRLE9BQUEsQ0FBUSxJQUFSLENBQVIsQ0FEQztHQUFBLE1BRUEsSUFBRyxJQUFBLEtBQVEsT0FBWDtBQUNELElBQUEsWUFBQSxHQUFlLEtBQUssQ0FBQyxNQUFOLENBQWEsYUFBYixFQUE0QixNQUE1QixDQUFmLENBQUE7QUFBQSxJQUNBLEtBQUEsR0FBUSxFQURSLENBQUE7QUFFQSxTQUFBLG1EQUFBOzRCQUFBO0FBQ0ksTUFBQSxRQUFBLEdBQVcsVUFBQSxDQUFXLEVBQVgsQ0FBWCxDQUFBO0FBQUEsTUFDQSxLQUFLLENBQUMsSUFBTixDQUFXLFFBQVgsQ0FEQSxDQURKO0FBQUEsS0FIQztHQVJMO0FBZUEsU0FBTyxLQUFQLENBaEJTO0FBQUEsQ0FWYixDQUFBOztBQUFBLFFBNEJBLEdBQVcsU0FBQyxJQUFELEdBQUE7QUFDUCxNQUFBLGdDQUFBO0FBQUEsRUFBQSxXQUFBLEdBQWMsRUFBZCxDQUFBO0FBQUEsRUFDQSxJQUFBLEdBQU8sSUFBSSxDQUFDLFlBQUwsQ0FBa0IsTUFBbEIsQ0FEUCxDQUFBO0FBQUEsRUFFQSxNQUFBLEdBQVMsS0FBSyxDQUFDLE1BQU4sQ0FBYSxRQUFiLEVBQXVCLElBQXZCLENBRlQsQ0FBQTtBQUFBLEVBR0EsS0FBQSxHQUFRLFVBQUEsQ0FBVyxNQUFPLENBQUEsQ0FBQSxDQUFsQixDQUhSLENBQUE7QUFBQSxFQUlBLFdBQVcsQ0FBQyxJQUFaLEdBQW1CLElBSm5CLENBQUE7QUFBQSxFQUtBLFdBQVcsQ0FBQyxLQUFaLEdBQW9CLEtBTHBCLENBQUE7U0FNQSxZQVBPO0FBQUEsQ0E1QlgsQ0FBQTs7QUFBQSxPQXFDTyxDQUFDLFNBQVIsR0FBb0IsU0FyQ3BCLENBQUE7O0FBQUEsT0FzQ08sQ0FBQyxhQUFSLEdBQXdCLGFBdEN4QixDQUFBOztBQUFBLE9BdUNPLENBQUMsVUFBUixHQUFxQixVQXZDckIsQ0FBQTs7QUFBQSxPQXdDTyxDQUFDLFFBQVIsR0FBbUIsUUF4Q25CLENBQUEiLCJzb3VyY2VzQ29udGVudCI6WyJ4cGF0aCA9IHJlcXVpcmUgXCJ4cGF0aFwiXG5cbnJhbmRvbUludCA9IChtaW4sIG1heCkgLT5cbiAgcmV0dXJuIE1hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIChtYXggLSBtaW4pKSArIG1pbjtcblxucmFuZG9tRWxlbWVudCA9IChhcnJheSkgLT5cbiAgbWluID0gMFxuICBtYXggPSBhcnJheS5sZW5ndGhcbiAgcmV0dXJuIGFycmF5W3JhbmRvbUludChtaW4sIG1heCldXG5cbmRvbTJzY2FsYXIgPSAoc2NhbGFyKSAtPlxuICAgIHR5cGUgPSBzY2FsYXIuZ2V0QXR0cmlidXRlKFwidHlwZVwiKVxuICAgIHRleHQgPSBzY2FsYXIudGV4dENvbnRlbnRcbiAgICBpZiB0eXBlIGlzIFwibnVtYmVyXCJcbiAgICAgICAgdmFsdWUgPSBOdW1iZXIodGV4dClcbiAgICBlbHNlIGlmIHR5cGUgaXMgXCJzdHJpbmdcIlxuICAgICAgICB2YWx1ZSA9IFN0cmluZyh0ZXh0KVxuICAgIGVsc2UgaWYgdHlwZSBpcyBcImJvb2xlYW5cIlxuICAgICAgICB2YWx1ZSA9IEJvb2xlYW4odGV4dClcbiAgICBlbHNlIGlmIHR5cGUgaXMgXCJhcnJheVwiXG4gICAgICAgIGxpc3Rfc2NhbGFycyA9IHhwYXRoLnNlbGVjdChcImxpc3Qvc2NhbGFyXCIsIHNjYWxhcilcbiAgICAgICAgdmFsdWUgPSBbXVxuICAgICAgICBmb3IgZWwgaW4gbGlzdF9zY2FsYXJzXG4gICAgICAgICAgICBlbF92YWx1ZSA9IGRvbTJzY2FsYXIoZWwpXG4gICAgICAgICAgICB2YWx1ZS5wdXNoKGVsX3ZhbHVlKVxuXG4gICAgcmV0dXJuIHZhbHVlXG5cbmRvbTJwcm9wID0gKHByb3ApIC0+XG4gICAgZW50aXR5X3Byb3AgPSB7fVxuICAgIHNsb3QgPSBwcm9wLmdldEF0dHJpYnV0ZShcInNsb3RcIilcbiAgICBzY2FsYXIgPSB4cGF0aC5zZWxlY3QoXCJzY2FsYXJcIiwgcHJvcClcbiAgICB2YWx1ZSA9IGRvbTJzY2FsYXIoc2NhbGFyWzBdKVxuICAgIGVudGl0eV9wcm9wLnNsb3QgPSBzbG90XG4gICAgZW50aXR5X3Byb3AudmFsdWUgPSB2YWx1ZVxuICAgIGVudGl0eV9wcm9wXG5cbmV4cG9ydHMucmFuZG9tSW50ID0gcmFuZG9tSW50O1xuZXhwb3J0cy5yYW5kb21FbGVtZW50ID0gcmFuZG9tRWxlbWVudDtcbmV4cG9ydHMuZG9tMnNjYWxhciA9IGRvbTJzY2FsYXJcbmV4cG9ydHMuZG9tMnByb3AgPSBkb20ycHJvcFxuXG4iXSwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=