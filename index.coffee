class NameSpace

    constructor: (@name, sep) ->
        @names = []
        @symbols = {}
        @sep = sep || "."

    intern: (symbol) ->
        if not @symbols[symbol.name]
            @names.push(symbol.name)
            @symbols[symbol.name] = symbol
        else
            @symbols[symbol.name] = symbol

        symbol.ns = this

    unintern: (symbol) ->
        delete @symbols[symbol.name]
        @names = (item for item in @names when item != symbol.name)
        symbol.ns = undefined

    getSymbol: (name) ->
        @symbols[name]

    get: (name) ->
        @symbols[name].value

    allSymbols: () ->
        symbols = []

        for name in @names
            symbols.push(@symbols[name])

        return symbols

    all: () ->
        values = []

        for name in @names
            values.push(@symbols[name].value)

        return values


class Symbol

    constructor: (@name, @value, @ns) ->

    is: (symbol, deep) ->
       equality = {
           names: -1
           namespaces: -1
           attrs: -1
       }

       if @name == symbol.name
           equality.names = 1

       if !@ns
           equality.namespaces = 1
       else if @ns and @ns.id is symbol.id
           equality.namespaces = 1

       equality.attrs = 1

       for k,v in this
           if v != symbol[k]
               equality.attrs = -1

       if deep
           if equality.names == 1 and equality.namespaces ==1 and equality.attrs == 1
               return true
       else
           if equality.names == 1 and equality.namespaces ==1
               return true

       return false

    toString: ->
       if @ns
           return @ns.id + @ns.sep + @name
        else
           return @name

S = (name) ->
    return new Symbol(name)


class Token extends Symbol

    constructor: (@name) ->
        @value = @name
        if typeof @name is "string"
            this[@name] = true

T = (name) ->
    return new Token(name)

class Event extends Symbol

    constructor: (@name, @payload) ->

class Entity extends Symbol

    constructor: (@name, @tags, @value) ->

class Component extends Symbol

    constructor: (@name, attrs) ->
        for k, v in attrs
            this[k] = v

class System

    constructor:(@flow) ->
        @handlers = null

    push: (data, inlet) ->

    # just data for single inlet
    whenReady: (handler, outlet) ->

        if not outlet
            if @handlers
               @handlers.push(handler)
            else
               console.log(this)
               @handlers = [handler]

        else
            if @handlers
                @handlers.outlet.push(handler)
            else
                @handlers.outlet = [handler]



    emit: (data, outlet) ->
        if not outlet
            for handler in @handlers
                handler(data)
        else
            for handler in @handlers[outlet]
                handler(data)

class DiscreteSystem

    constructor: (@flow, @events) ->

    raise: (event) ->

class Channel

    constructor: (@inlet, @outlet) ->

class Connection

    constructor: (source, sink, @flow, @channels) ->
        @source = @flow.systems.get(source)
        @sink = @flow.systems.get(sink)


class Bus

    constructor: ->
        @entities = new NameSpace()
        @discreteSystems = new NameSpace()

    addDiscreteSystem: (id, discreteSystemClass) ->
        discrete_sytem = new discreteSystemClass(this)
        id.value = discrete_sytem
        @discreteSystems.intern(id)

    createEntity: (name, tags, value) ->
        tags = tags || []
        value = value || undefined
        entity = new Entity(name, tags, value)
        @entities.intern(entity)
        entity

    getEntity: (name, create) ->
        if @entities.getSymbol(name)
            return @entities.getSymbol(name)
        else if create
            return @createEntity(name)
        else
            return null

    getEntitiesByTags: (tags) ->
        entities = []
        for entity in @entities.all()
            for tag in tags
                if tag in entity.tags
                    entities.push entity

        return entities


    trigger: (event) ->

        for symbol in @discreteSystems.allSymbols()
            if event.name in symbol.events
                symbol.value.raise(event)

class Flow

    constructor: (@id) ->
        @bus = new Bus
        @systems = new NameSpace("systems")
        @connections = new NameSpace("systems.connections")

    connect: (id, source, sink, channels) ->
        connection = new Connection(source, sink, this, channels)

        if connection.channels
            for channel in connection.channels
                connection.source.prototype.whenReady.call(connection.source, (((data) ->
                    connection.sink.prototype.push.call(connection.sink, channel.inlet, data))),
                    channel.outlet)
        else
            connection.source.prototype.whenReady.call(connection.source, ((data) ->
                connection.sink.push(data)))

        id.value = connection
        @connections.intern(id)

    addSystem: (id, systemClass) ->
        system = new systemClass(this)
        id.value = system
        @systems.intern(id)

    serialize: ->
        xml = "<xml>"
        xml += "<flow name='#{@id.name}'>"

        for system in @systems.all()
            xml += "<system>"
            xml += "</system>"

        for connection in @connections.all()
            xml += "<connection>"
            xml += "</connection>"

        xml = "</flow>"
        xml = "</xml>"

    log: (x) ->
        console.log(x)


exports.Symbol = Symbol
exports.S = S
exports.Token = Token
exports.T = T
exports.NameSpace = NameSpace
exports.System = System
exports.Channel = Channel
exports.Connection = Connection
exports.Event = Event
exports.Entity = Entity
exports.Bus = Bus
exports.Flow = Flow

