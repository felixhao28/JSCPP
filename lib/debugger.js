var Debugger, Runtime, diffpatch;

diffpatch = require('jsondiffpatch').create(null);

Runtime = require("./rt");

Debugger = function() {
  this.fakeRT = new Runtime();
  this.rt = {};
  this.snapshots = null;
  this.i = 0;
  this.src = "";
  return this;
};

Debugger.prototype.next = function() {
  var diff;
  if (this.i >= this.snapshots.length) {
    return false;
  }
  diff = this.snapshots[this.i].diff;
  console.log("patching " + this.i);
  diffpatch.patch(this.rt, diff);
  this.fakeRT.scope = this.rt.scope;
  this.i++;
  return this.i < this.snapshots.length;
};

Debugger.prototype.prev = function() {
  var diff;
  if (this.i <= 1) {
    return false;
  }
  this.i--;
  diff = this.snapshots[this.i].diff;
  console.log("unpatching " + this.i);
  diffpatch.unpatch(this.rt, diff);
  this.fakeRT.types = this.rt.types;
  this.fakeRT.scope = this.rt.scope;
  return this.i > 0;
};

Debugger.prototype.output = function() {
  return this.rt.debugOutput || "";
};

Debugger.prototype.nextLine = function() {
  var s;
  if (this.i >= this.snapshots.length) {
    return "<eof>";
  } else {
    s = this.snapshots[this.i].stmt;
    return this.src.slice(s.reportedPos, s.pos).trim();
  }
};

Debugger.prototype.nextStmt = function() {
  return this.snapshots[this.i].stmt;
};

Debugger.prototype.variable = function(name) {
  var k, ref, results, v;
  if (name) {
    v = this.fakeRT.readVar(name);
    return {
      type: this.fakeRT.makeTypeString(v.t),
      value: v.v
    };
  } else {
    ref = this.fakeRT.scope[this.fakeRT.scope.length - 1];
    results = [];
    for (k in ref) {
      v = ref[k];
      if (typeof v === "object" && "t" in v && "v" in v) {
        results.push({
          name: k,
          type: this.fakeRT.makeTypeString(v.t),
          value: v.v
        });
      }
    }
    return results;
  }
};

module.exports = Debugger;
