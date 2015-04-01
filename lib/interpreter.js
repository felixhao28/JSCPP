var Interpreter;

Interpreter = function(rt) {
  this.rt = rt;
  this.visitors = {
    TranslationUnit: function(interp, s, param) {
      var dec, i;
      i = 0;
      while (i < s.ExternalDeclarations.length) {
        dec = s.ExternalDeclarations[i];
        interp.visit(interp, dec);
        i++;
      }
    },
    FunctionDefinition: function(interp, s, param) {
      var _basetype, _name, _param, _pointer, _type, argNames, argTypes, basetype, dim, dimensions, i, j, name, pointer, ptl, retType, scope, stat, varargs;
      scope = param.scope;
      name = s.Declarator.left.Identifier;
      basetype = interp.rt.simpleType(s.DeclarationSpecifiers.join(" "));
      pointer = s.Declarator.Pointer;
      retType = interp.buildRecursivePointerType(pointer, basetype, 0);
      argTypes = [];
      argNames = [];
      if (s.Declarator.right.length !== 1) {
        interp.rt.raiseException("you cannot have " + s.Declarator.right.length + " parameter lists (1 expected)");
      }
      ptl = void 0;
      varargs = void 0;
      if (s.Declarator.right[0].type === "DirectDeclarator_modifier_ParameterTypeList") {
        ptl = s.Declarator.right[0].ParameterTypeList;
        varargs = ptl.varargs;
      } else if (s.Declarator.right[0].type === "DirectDeclarator_modifier_IdentifierList" && s.Declarator.right[0].IdentifierList === null) {
        ptl = {
          ParameterList: []
        };
        varargs = false;
      } else {
        interp.rt.raiseException("unacceptable argument list");
      }
      i = 0;
      while (i < ptl.ParameterList.length) {
        _param = ptl.ParameterList[i];
        _pointer = _param.Declarator.Pointer;
        _basetype = interp.rt.simpleType(_param.DeclarationSpecifiers.join(" "));
        _type = interp.buildRecursivePointerType(_pointer, _basetype, 0);
        _name = _param.Declarator.left.Identifier;
        if (_param.Declarator.right.length > 0) {
          dimensions = [];
          j = 0;
          while (j < _param.Declarator.right.length) {
            dim = _param.Declarator.right[j];
            if (dim.type !== "DirectDeclarator_modifier_array") {
              interp.rt.raiseException("unacceptable array initialization");
            }
            if (dim.Expression !== null) {
              dim = interp.rt.cast(interp.rt.intTypeLiteral, interp.visit(interp, dim.Expression, param)).v;
            } else if (j > 0) {
              interp.rt.raiseException("multidimensional array must have bounds for all dimensions except the first");
            } else {

            }
            dimensions.push(dim);
            j++;
          }
          _type = interp.arrayType(dimensions, 0, _type);
        }
        argTypes.push(_type);
        argNames.push(_name);
        i++;
      }
      stat = s.CompoundStatement;
      interp.rt.defFunc(scope, name, retType, argTypes, argNames, stat, interp);
    },
    Declaration: function(interp, s, param) {
      var basetype, dec, dim, dimensions, i, init, initializer, j, name, pointer, type;
      basetype = interp.rt.simpleType(s.DeclarationSpecifiers.join(" "));
      i = 0;
      while (i < s.InitDeclaratorList.length) {
        dec = s.InitDeclaratorList[i];
        pointer = dec.Declarator.Pointer;
        type = interp.buildRecursivePointerType(pointer, basetype, 0);
        name = dec.Declarator.left.Identifier;
        init = dec.Initializers;
        if (dec.Declarator.right.length > 0) {
          dimensions = [];
          j = 0;
          while (j < dec.Declarator.right.length) {
            dim = dec.Declarator.right[j];
            if (dim.type !== "DirectDeclarator_modifier_array") {
              interp.rt.raiseException("is interp really an array initialization?");
            }
            if (dim.Expression !== null) {
              dim = interp.rt.cast(interp.rt.intTypeLiteral, interp.visit(interp, dim.Expression, param)).v;
            } else if (j > 0) {
              interp.rt.raiseException("multidimensional array must have bounds for all dimensions except the first");
            } else {
              if (init.type === "Initializer_expr") {
                initializer = interp.visit(interp, init, param);
                if (interp.rt.isTypeEqualTo(type, interp.rt.charTypeLiteral) && interp.rt.isArrayType(initializer.t) && interp.rt.isTypeEqualTo(initializer.t.eleType, interp.rt.charTypeLiteral)) {
                  dim = initializer.v.target.length;
                  init = {
                    type: "Initializer_array",
                    Initializers: initializer.v.target.map(function(e) {
                      return {
                        type: "Initializer_expr",
                        shorthand: e
                      };
                    })
                  };
                } else {
                  interp.rt.raiseException("cannot initialize an array to " + interp.rt.makeValString(initializer));
                }
              } else {
                dim = init.Initializers.length;
              }
            }
            dimensions.push(dim);
            j++;
          }
          init = interp.arrayInit(dimensions, init, 0, type, param);
          interp.rt.defVar(name, init.t, init);
        } else {
          if (init === null) {
            init = interp.rt.defaultValue(type);
          } else {
            init = interp.visit(interp, init.Expression);
          }
          interp.rt.defVar(name, type, init);
        }
        i++;
      }
    },
    Initializer_expr: function(interp, s, param) {
      return interp.visit(interp, s.Expression, param);
    },
    Label_case: function(interp, s, param) {
      var ce;
      ce = interp.visit(interp, s.ConstantExpression);
      if (param["switch"] === void 0) {
        interp.rt.raiseException("you cannot use case outside switch block");
      }
      if (param.scope === "SelectionStatement_switch_cs") {
        return ["switch", interp.rt.cast(ce.t, param["switch"]).v === ce.v];
      } else {
        interp.rt.raiseException("you can only use case directly in a switch block");
      }
    },
    Label_default: function(interp, s, param) {
      if (param["switch"] === void 0) {
        interp.rt.raiseException("you cannot use default outside switch block");
      }
      if (param.scope === "SelectionStatement_switch_cs") {
        return ["switch", true];
      } else {
        interp.rt.raiseException("you can only use default directly in a switch block");
      }
    },
    CompoundStatement: function(interp, s, param) {
      var _scope, i, r, stmt, stmts, switchon;
      stmts = s.Statements;
      r = void 0;
      i = void 0;
      _scope = param.scope;
      if (param.scope === "SelectionStatement_switch") {
        param.scope = "SelectionStatement_switch_cs";
        interp.rt.enterScope(param.scope);
        switchon = false;
        i = 0;
        while (i < stmts.length) {
          stmt = stmts[i];
          if (stmt.type === "Label_case" || stmt.type === "Label_default") {
            r = interp.visit(interp, stmt, param);
            if (r[1]) {
              switchon = true;
            }
          } else if (switchon) {
            r = interp.visit(interp, stmt, param);
            if (r instanceof Array) {
              return r;
            }
          }
          i++;
        }
        interp.rt.exitScope(param.scope);
        param.scope = _scope;
      } else {
        param.scope = "CompoundStatement";
        interp.rt.enterScope(param.scope);
        i = 0;
        while (i < stmts.length) {
          r = interp.visit(interp, stmts[i], param);
          if (r instanceof Array) {
            return r;
          }
          i++;
        }
        interp.rt.exitScope(param.scope);
        param.scope = _scope;
      }
    },
    ExpressionStatement: function(interp, s, param) {
      interp.visit(interp, s.Expression, param);
    },
    SelectionStatement_if: function(interp, s, param) {
      var e, ret, scope_bak;
      scope_bak = param.scope;
      param.scope = "SelectionStatement_if";
      interp.rt.enterScope(param.scope);
      e = interp.visit(interp, s.Expression, param);
      ret = void 0;
      if (interp.rt.cast(interp.rt.boolTypeLiteral, e).v) {
        ret = interp.visit(interp, s.Statement, param);
      } else if (s.ElseStatement) {
        ret = interp.visit(interp, s.ElseStatement, param);
      }
      interp.rt.exitScope(param.scope);
      param.scope = scope_bak;
      return ret;
    },
    SelectionStatement_switch: function(interp, s, param) {
      var e, r, ret, scope_bak, switch_bak;
      scope_bak = param.scope;
      param.scope = "SelectionStatement_switch";
      interp.rt.enterScope(param.scope);
      e = interp.visit(interp, s.Expression, param);
      switch_bak = param["switch"];
      param["switch"] = e;
      r = interp.visit(interp, s.Statement, param);
      param["switch"] = switch_bak;
      ret = void 0;
      if (r instanceof Array) {
        if (r[0] !== "break") {
          ret = r;
        }
      }
      interp.rt.exitScope(param.scope);
      param.scope = scope_bak;
      return ret;
    },
    IterationStatement_while: function(interp, s, param) {
      var r, scope_bak;
      scope_bak = param.scope;
      param.scope = "IterationStatement_while";
      interp.rt.enterScope(param.scope);
      while (interp.rt.cast(interp.rt.boolTypeLiteral, interp.visit(interp, s.Expression, param)).v) {
        r = interp.visit(interp, s.Statement, param);
        if (r instanceof Array) {
          switch (r[0]) {
            case "continue":
              return;
            case "break":
              return;
            case "return":
              return r;
          }
        }
      }
      interp.rt.exitScope(param.scope);
      param.scope = scope_bak;
    },
    IterationStatement_do: function(interp, s, param) {
      var r, scope_bak;
      scope_bak = param.scope;
      param.scope = "IterationStatement_do";
      interp.rt.enterScope(param.scope);
      while (true) {
        r = parse(s.Statement);
        if (r instanceof Array) {
          switch (r[0]) {
            case "continue":
              return;
            case "break":
              return;
            case "return":
              return r;
          }
        }
        if (!interp.rt.cast(interp.rt.boolTypeLiteral, interp.visit(interp, s.Expression, param)).v) {
          break;
        }
      }
      interp.rt.exitScope(param.scope);
      param.scope = scope_bak;
    },
    IterationStatement_for: function(interp, s, param) {
      var r, scope_bak;
      scope_bak = param.scope;
      param.scope = "IterationStatement_for";
      interp.rt.enterScope(param.scope);
      if (s.Initializer) {
        if (s.Initializer.type === "Declaration") {
          interp.visit(interp, s.Initializer, param);
        } else {
          interp.visit(interp, s.Initializer, param);
        }
      }
      while (s.Expression === void 0 || interp.rt.cast(interp.rt.boolTypeLiteral, interp.visit(interp, s.Expression, param)).v) {
        r = interp.visit(interp, s.Statement, param);
        if (r instanceof Array) {
          switch (r[0]) {
            case "continue":
              return;
            case "break":
              return;
            case "return":
              return r;
          }
        }
        if (s.Loop) {
          interp.visit(interp, s.Loop, param);
        }
      }
      interp.rt.exitScope(param.scope);
      param.scope = scope_bak;
    },
    JumpStatement_goto: function(interp, s, param) {
      interp.rt.raiseException("not implemented");
    },
    JumpStatement_continue: function(interp, s, param) {
      return ["continue"];
    },
    JumpStatement_break: function(interp, s, param) {
      return ["break"];
    },
    JumpStatement_return: function(interp, s, param) {
      var ret;
      if (s.Expression) {
        ret = interp.visit(interp, s.Expression, param);
        return ["return", ret];
      }
      return ["return"];
    },
    IdentifierExpression: function(interp, s, param) {
      return interp.rt.readVar(s.Identifier);
    },
    ParenthesesExpression: function(interp, s, param) {
      return interp.visit(interp, s.Expression, param);
    },
    PostfixExpression_ArrayAccess: function(interp, s, param) {
      var index, ret;
      ret = interp.visit(interp, s.Expression, param);
      index = interp.visit(interp, s.index, param);
      return interp.rt.getFunc(ret.t, "[]", [index.t])(interp.rt, ret, index);
    },
    PostfixExpression_MethodInvocation: function(interp, s, param) {
      var ret;
      ret = interp.visit(interp, s.Expression, param);
      s.args = s.args.map(function(e) {
        return interp.visit(interp, e, param);
      });
      return interp.rt.getFunc(ret.t, "()", s.args.map(function(e) {
        return e.t;
      }))(interp.rt, ret, s.args);
    },
    PostfixExpression_MemberAccess: function(interp, s, param) {
      var ret;
      ret = interp.visit(interp, s.Expression, param);
      return interp.getMember(ret, s.member);
    },
    PostfixExpression_MemberPointerAccess: function(interp, s, param) {
      var member, ret;
      ret = interp.visit(interp, s.Expression, param);
      member = void 0;
      if (interp.rt.isPointerType(ret.t) && !interp.rt.isFunctionType(ret.t)) {
        member = s.member;
        return interp.rt.getFunc(ret.t, "->", [])(interp.rt, ret, member);
      } else {
        member = interp.visit(interp, {
          type: "IdentifierExpression",
          Identifier: s.member
        }, param);
        return interp.rt.getFunc(ret.t, "->", [member.t])(interp.rt, ret, member);
      }
    },
    PostfixExpression_PostIncrement: function(interp, s, param) {
      var ret;
      ret = interp.visit(interp, s.Expression, param);
      return interp.rt.getFunc(ret.t, "++", ["dummy"])(interp.rt, ret, {
        t: "dummy",
        v: null
      });
    },
    PostfixExpression_PostDecrement: function(interp, s, param) {
      var ret;
      ret = interp.visit(interp, s.Expression, param);
      return interp.rt.getFunc(ret.t, "--", ["dummy"])(interp.rt, ret, {
        t: "dummy",
        v: null
      });
    },
    UnaryExpression_PreIncrement: function(interp, s, param) {
      var ret;
      ret = interp.visit(interp, s.Expression, param);
      return interp.rt.getFunc(ret.t, "++", [])(interp.rt, ret);
    },
    UnaryExpression_PreDecrement: function(interp, s, param) {
      var ret;
      ret = interp.visit(interp, s.Expression, param);
      return interp.rt.getFunc(ret.t, "--", [])(interp.rt, ret);
    },
    UnaryExpression: function(interp, s, param) {
      var ret;
      ret = interp.visit(interp, s.Expression, param);
      return interp.rt.getFunc(ret.t, s.op, [])(interp.rt, ret);
    },
    UnaryExpression_Sizeof_Expr: function(interp, s, param) {
      var ret;
      ret = interp.visit(interp, s.Expression, param);
      return interp.rt.val(interp.rt.intTypeLiteral, interp.rt.getSize(ret));
    },
    UnaryExpression_Sizeof_Type: function(interp, s, param) {
      var type;
      type = interp.rt.simpleType(s.TypeName);
      return interp.rt.val(interp.rt.intTypeLiteral, interp.rt.getSizeByType(type));
    },
    CastExpression: function(interp, s, param) {
      var ret, type;
      ret = interp.visit(interp, s.Expression, param);
      type = interp.rt.simpleType(s.TypeName);
      return interp.rt.cast(type, ret);
    },
    BinOpExpression: function(interp, s, param) {
      var left, op, right;
      op = s.op;
      if (op === "&&") {
        s.type = "LogicalANDExpression";
        return interp.visit(interp, s, param);
      } else if (op === "||") {
        s.type = "LogicalORExpression";
        return interp.visit(interp, s, param);
      } else {
        left = interp.visit(interp, s.left, param);
        right = interp.visit(interp, s.right, param);
        return interp.rt.getFunc(left.t, op, [right.t])(interp.rt, left, right);
      }
    },
    LogicalANDExpression: function(interp, s, param) {
      var left, lt, right;
      left = interp.visit(interp, s.left, param);
      lt = interp.rt.types[interp.rt.getTypeSigniture(left.t)];
      if ("&&" in lt) {
        right = interp.visit(interp, s.right, param);
        return interp.rt.getFunc(left.t, "&&", [right.t])(interp.rt, left, right);
      } else {
        if (interp.rt.cast(interp.rt.boolTypeLiteral, left).v) {
          return interp.visit(interp, s.right, param);
        } else {
          return left;
        }
      }
    },
    LogicalORExpression: function(interp, s, param) {
      var left, lt, right;
      left = interp.visit(interp, s.left, param);
      lt = interp.rt.types[interp.rt.getTypeSigniture(left.t)];
      if ("||" in lt) {
        right = interp.visit(interp, s.right, param);
        return interp.rt.getFunc(left.t, "||", [right.t])(interp.rt, left, right);
      } else {
        if (interp.rt.cast(interp.rt.boolTypeLiteral, left).v) {
          return left;
        } else {
          return interp.visit(interp, s.right, param);
        }
      }
    },
    ConditionalExpression: function(interp, s, param) {
      var cond;
      cond = interp.rt.cast(interp.rt.boolTypeLiteral, interp.visit(interp, s.cond, param)).v;
      if (cond) {
        return interp.visit(interp, s.t, param);
      } else {
        return interp.visit(interp, s.f, param);
      }
    },
    ConstantExpression: function(interp, s, param) {
      return interp.visit(interp, s.Expression, param);
    },
    StringLiteralExpression: function(interp, s, param) {
      var str;
      str = s.value;
      return interp.rt.makeCharArrayFromString(str);
    },
    CharacterConstant: function(interp, s, param) {
      var a;
      a = s.Char;
      if (a.length !== 1) {
        interp.rt.raiseException("a character constant must have and only have one character.");
      }
      return interp.rt.val(interp.rt.charTypeLiteral, a[0].charCodeAt(0));
    },
    FloatConstant: function(interp, s, param) {
      var val;
      val = interp.visit(interp, s.Expression, param);
      return interp.rt.val(interp.rt.floatTypeLiteral, val.v);
    },
    DecimalConstant: function(interp, s, param) {
      return interp.rt.val(interp.rt.intTypeLiteral, parseInt(s.value, 10));
    },
    HexConstant: function(interp, s, param) {
      return interp.rt.val(interp.rt.intTypeLiteral, parseInt(s.value, 16));
    },
    DecimalFloatConstant: function(interp, s, param) {
      return interp.rt.val(interp.rt.doubleTypeLiteral, parseFloat(s.value));
    },
    HexFloatConstant: function(interp, s, param) {
      return interp.rt.val(interp.rt.doubleTypeLiteral, parseFloat(s.value, 16));
    },
    OctalConstant: function(interp, s, param) {
      return interp.rt.val(interp.rt.intTypeLiteral, parseInt(s.value, 8));
    },
    NamespaceDefinition: function(interp, s, param) {
      interp.rt.raiseException("not implemented");
    },
    UsingDirective: function(interp, s, param) {
      var id;
      id = s.Identifier;
    },
    UsingDeclaration: function(interp, s, param) {
      interp.rt.raiseException("not implemented");
    },
    NamespaceAliasDefinition: function(interp, s, param) {
      interp.rt.raiseException("not implemented");
    },
    unknown: function(interp, s, param) {
      interp.rt.raiseException("unhandled syntax " + s.type);
    }
  };
};

Interpreter.prototype.visit = function(interp, s, param) {
  var _node;
  if ("type" in s) {
    if (param === void 0) {
      param = {
        scope: "global"
      };
    }
    _node = this.currentNode;
    this.currentNode = s;
    if (s.type in this.visitors) {
      return this.visitors[s.type](interp, s, param);
    } else {
      return this.visitors["unknown"](interp, s, param);
    }
    this.currentNode = _node;
  } else {
    this.currentNode = s;
    this.rt.raiseException("untyped syntax structure");
  }
};

Interpreter.prototype.run = function(tree) {
  this.rt.interp = this;
  return this.visit(this, tree);
};

Interpreter.prototype.arrayInit = function(dimensions, init, level, type, param) {
  var _init, arr, curDim, i, initializer, initval, ret, val;
  arr = void 0;
  i = void 0;
  ret = void 0;
  initval = void 0;
  if (dimensions.length > level) {
    curDim = dimensions[level];
    if (init) {
      if (init.type === "Initializer_array" && curDim >= init.Initializers.length && (init.Initializers.length === 0 || init.Initializers[0].type === "Initializer_expr")) {
        if (init.Initializers.length === 0) {
          arr = new Array(curDim);
          i = 0;
          while (i < curDim) {
            arr[i] = {
              shorthand: this.rt.defaultValue(type)
            };
            i++;
          }
          init.Initializers = arr;
        } else if (init.Initializers.length === 1 && this.rt.isIntegerType(type)) {
          val = this.rt.cast(type, this.visit(this, init.Initializers[0].Expression, param));
          if (val.v === -1 || val.v === 0) {
            arr = new Array(curDim);
            i = 0;
            while (i < curDim) {
              arr[i] = {
                shorthand: this.rt.val(type, -1)
              };
              i++;
            }
            init.Initializers = arr;
          } else {
            arr = new Array(curDim);
            arr[0] = this.rt.val(type, -1);
            i = 1;
            while (i < curDim) {
              arr[i] = {
                shorthand: this.rt.defaultValue(type)
              };
              i++;
            }
            init.Initializers = arr;
          }
        } else {
          arr = new Array(curDim);
          i = 0;
          while (i < init.Initializers.length) {
            _init = init.Initializers[i];
            if ("shorthand" in _init) {
              initval = _init;
            } else {
              initval = {
                type: "Initializer_expr",
                shorthand: this.visit(this, _init.Expression, param)
              };
            }
            arr[i] = initval;
            i++;
          }
          i = init.Initializers.length;
          while (i < curDim) {
            arr[i] = {
              type: "Initializer_expr",
              shorthand: this.rt.defaultValue(type)
            };
            i++;
          }
          init.Initializers = arr;
        }
      } else if (init.type === "Initializer_expr") {
        initializer = void 0;
        if ("shorthand" in init) {
          initializer = init.shorthand;
        } else {
          initializer = this.visit(this, init, param);
        }
        if (this.rt.isTypeEqualTo(type, this.rt.charTypeLiteral) && this.rt.isArrayType(initializer.t) && this.rt.isTypeEqualTo(initializer.t.eleType, this.rt.charTypeLiteral)) {
          init = {
            type: "Initializer_array",
            Initializers: initializer.v.target.map(function(e) {
              return {
                type: "Initializer_expr",
                shorthand: e
              };
            })
          };
        } else {
          this.rt.raiseException("cannot initialize an array to " + this.rt.makeValString(initializer));
        }
      } else {
        this.rt.raiseException("dimensions do not agree, " + curDim + " != " + init.Initializers.length);
      }
    }
    arr = [];
    ret = this.rt.val(this.arrayType(dimensions, level, type), this.rt.makeArrayPointerValue(arr, 0), true);
    i = 0;
    while (i < curDim) {
      if (init && i < init.Initializers.length) {
        arr[i] = this.arrayInit(dimensions, init.Initializers[i], level + 1, type, param);
      } else {
        arr[i] = this.arrayInit(dimensions, null, level + 1, type, param);
      }
      i++;
    }
    return ret;
  } else {
    if (init && init.type !== "Initializer_expr") {
      this.rt.raiseException("dimensions do not agree, too few initializers");
    }
    initval;
    if (init) {
      if ("shorthand" in init) {
        initval = init.shorthand;
      } else {
        initval = this.visit(this, init.Expression, param);
      }
    } else {
      initval = this.rt.defaultValue(type);
    }
    ret = this.rt.cast(type, initval);
    ret.left = true;
    return ret;
  }
};

Interpreter.prototype.arrayType = function(dimensions, level, type) {
  if (dimensions.length > level) {
    return this.rt.arrayPointerType(this.arrayType(dimensions, level + 1, type), dimensions[level]);
  } else {
    return type;
  }
};

Interpreter.prototype.buildRecursivePointerType = function(pointer, basetype, level) {
  var type;
  if (pointer && pointer.length > level) {
    type = this.rt.normalPointerType(basetype);
    return this.buildRecursivePointerType(pointer, type, level + 1);
  } else {
    return basetype;
  }
};

module.exports = Interpreter;
