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
    type: @rt.makeTypeString(v.t)
    value: v.v
  else
    usedName = new Set()
    ret = []
    for scopeIndex in [@rt.scope.length - 1..0] by -1
      for name, val of @rt.scope[scopeIndex] when typeof val is "object" and "t" of val and "v" of val
        if not usedName.has(name)
          usedName.add(name)
          ret.push
            name: name
            type: @rt.makeTypeString(val.t)
            value: @rt.makeValueString(val)
    ret

module.exports = Debugger