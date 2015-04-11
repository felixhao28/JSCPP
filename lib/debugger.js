var Debugger, Runtime;

Runtime = require("./rt");

Debugger = function() {
  this.src = "";
  this.prevNode = null;
  this.done = false;
  this.conditions = {
    isStatement: function(prevNode, newStmt) {
      return newStmt != null ? newStmt.type.indexOf("Statement" >= 0) : void 0;
    },
    positionChanged: function(prevNode, newStmt) {
      return (prevNode != null ? prevNode.eOffset : void 0) !== newStmt.eOffset || (prevNode != null ? prevNode.sOffset : void 0) !== newStmt.sOffset;
    },
    lineChanged: function(prevNode, newStmt) {
      return (prevNode != null ? prevNode.sLine : void 0) !== newStmt.sLine;
    }
  };
  this.stopConditions = {
    isStatement: false,
    positionChanged: false,
    lineChanged: true
  };
  return this;
};

Debugger.prototype.start = function(rt, gen) {
  this.rt = rt;
  return this.gen = gen;
};

Debugger.prototype["continue"] = function() {
  var active, curStmt, done, name, ref;
  while (true) {
    done = this.next();
    if (done !== false) {
      return done;
    }
    curStmt = this.nextNode();
    ref = this.stopConditions;
    for (name in ref) {
      active = ref[name];
      if (active) {
        if (this.conditions[name](this.prevNode, curStmt)) {
          return false;
        }
      }
    }
  }
};

Debugger.prototype.next = function() {
  var ngen;
  this.prevNode = this.nextNode();
  ngen = this.gen.next();
  if (ngen.done) {
    this.done = true;
    return ngen.value;
  } else {
    return false;
  }
};

Debugger.prototype.nextLine = function() {
  var s;
  s = this.nextNode();
  return this.src.slice(s.sOffset, s.eOffset).trim();
};

Debugger.prototype.nextNode = function() {
  if (this.done) {
    return {
      sOffset: -1,
      sLine: -1,
      sColumn: -1,
      eOffset: -1,
      eLine: -1,
      eColumn: -1
    };
  } else {
    return this.rt.interp.currentNode;
  }
};

Debugger.prototype.variable = function(name) {
  var k, ref, results, v;
  if (name) {
    v = this.rt.readVar(name);
    return {
      type: this.rt.makeTypeString(v.t),
      value: v.v
    };
  } else {
    ref = this.rt.scope[this.rt.scope.length - 1];
    results = [];
    for (k in ref) {
      v = ref[k];
      if (typeof v === "object" && "t" in v && "v" in v) {
        results.push({
          name: k,
          type: this.rt.makeTypeString(v.t),
          value: v.v
        });
      }
    }
    return results;
  }
};

module.exports = Debugger;
