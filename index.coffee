class System

    constructor:(@name, @flow) ->
        @handlers = {}

    push: (inlet, data) ->

    whenReady: (outelt, handler) ->

        if @handlers.outlet is null
            @handlers.outlet = [handler]
        else
            @handlers.outlet.push handler

    emit: ->

    serialize: ->
        """
        <system name="#{@name}" />
        """

class Channel

    constructor: (@inlet, @outlet) ->

    serialize: ->
        "<channel inlet='#{@inlet}', outlet='#{@outlet}'/>"

class Connection

    constructor: (@name, @source, @sink, @channels)->

    serialize: ->
            xml = """
            <connection name='#{@name}'>"
                #{@source.serialize()}
                #{@sink.serialize()}
            """
            xml += "<channels>"
            for channel in @channels
                xml += channel.serialize()
            xml += """
                </channels>
            </connection>
            """

class Message

    constructor: (@event, @payload) ->

class StateBus

    constructor: ->
        @entities = {}
        @discreteSystems = {}

    addEntity: (entity) ->
        @entities[entiy.name] = entity

    addDiscreteSystem(discrete_system, events) ->

        for event in events

            if @discreteSystems[event].systems is null
                @discreteSystems[event].systems = [discrete_system]
            else
                @discreteSystems[event].systems.append(discrete_system)

        trigger: (event, message) ->

            for system in @discreteSystems[event]
                message =- Message(event, message)
                system.raise(message)

class Flow

    constructor: ->

        # could be a ordered map

        @connections = []
        @objectStore = new ObjectStore
        @bus = new StateBus
        @systems = {}

    addSystem: (name, inlets, outlets) ->
        @systems[name] = system

    connect: (connection) ->
        @connections[connection.name] = connection

    serialize: ->
        xml = "<xml>"
        xml += "<flow name='#{@name}'>"

        for connection in @connections
            xml += "<connection>"
            xml += connection.serialize()
            xml += "</connection>"

        xml = "</flow>"
        xml = "</xml>"

    start: ->

        for connection in connections
            A = connection.from
            B = connection.to

            for channel in connection.channels

                A.whenReady A.channel.outlet,  (data) ->
                    B.push(inlet, data)

