xpath = require "xpath"

randomInt = (min, max) ->
  return Math.floor(Math.random() * (max - min)) + min;

randomElement = (array) ->
  min = 0
  max = array.length
  return array[randomInt(min, max)]

dom2scalar = (scalar) ->
    type = scalar.getAttribute("type")
    text = scalar.textContent
    if type is "number"
        value = Number(text)
    else if type is "string"
        value = String(text)
    else if type is "boolean"
        value = Boolean(text)
    else if type is "array"
        list_scalars = xpath.select("list/scalar", scalar)
        value = []
        for el in list_scalars
            el_value = dom2scalar(el)
            value.push(el_value)

    return value

dom2prop = (prop) ->
    entity_prop = {}
    slot = prop.getAttribute("slot")
    scalar = xpath.select("scalar", prop)
    value = dom2scalar(scalar[0])
    entity_prop.slot = slot
    entity_prop.value = value
    entity_prop

exports.randomInt = randomInt;
exports.randomElement = randomElement;
exports.dom2scalar = dom2scalar
exports.dom2prop = dom2prop

