Runtime = require "./rt"

Debugger = ->
    @src = ""
    @prevNode = null
    @done = false
    @conditions =
        isStatement: (prevNode, newStmt) ->
            newStmt?.type.indexOf "Statement" >= 0
        positionChanged: (prevNode, newStmt) ->
            prevNode?.eOffset isnt newStmt.eOffset or prevNode?.sOffset isnt newStmt.sOffset
        lineChanged: (prevNode, newStmt) ->
            prevNode?.sLine isnt newStmt.sLine

    @stopConditions =
        isStatement: false
        positionChanged: false
        lineChanged: true
    
    return this

Debugger::start = (rt, gen) ->
    @rt = rt
    @gen = gen

Debugger::continue = ->
    loop
        done = @next()
        return done if done isnt false
        curStmt = @nextNode()
        for name, active of @stopConditions when active
            if @conditions[name](@prevNode, curStmt)
                return false

Debugger::next = ->
    @prevNode = @nextNode()
    ngen = @gen.next()
    if ngen.done
        @done = true
        ngen.value
    else
        false

Debugger::nextLine = ->
    s = @nextNode()
    @src.slice(s.sOffset, s.eOffset).trim()

Debugger::nextNode = ->
    if @done
        sOffset: -1
        sLine: -1
        sColumn: -1
        eOffset: -1
        eLine: -1
        eColumn: -1
    else
        @rt.interp.currentNode

Debugger::variable = (name) ->
    if name
        v = @rt.readVar(name)
        {
            type: @rt.makeTypeString(v.t)
            value: v.v
        }
    else
        for k, v of @rt.scope[@rt.scope.length-1] when typeof v is "object" and "t" of v and "v" of v
                {
                    name: k
                    type: @rt.makeTypeString(v.t)
                    value: v.v
                }


module.exports = Debugger