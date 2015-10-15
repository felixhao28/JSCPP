var Interpreter, isGenerator, isGeneratorFunction, sampleGenerator, sampleGeneratorFunction;

sampleGeneratorFunction = function*() {
  return (yield null);
};

sampleGenerator = sampleGeneratorFunction();

isGenerator = function(g) {
  return (g != null ? g.constructor : void 0) === sampleGenerator.constructor;
};

isGeneratorFunction = function(f) {
  return (f != null ? f.constructor : void 0) === sampleGeneratorFunction.constructor;
};

Interpreter = function(rt) {
  this.rt = rt;
  this.visitors = {
    TranslationUnit: function*(interp, s, param) {
      var dec, i;
      rt = interp.rt;
      i = 0;
      while (i < s.ExternalDeclarations.length) {
        dec = s.ExternalDeclarations[i];
        (yield* interp.visit(interp, dec));
        i++;
      }
    },
    DirectDeclarator: function*(interp, s, param) {
      var _basetype, _param, _pointer, _type, argTypes, basetype, dim, dimensions, j, k, l, len, len1, len2, m, ptl, ref, ref1, ref2, ret, right, varargs;
      rt = interp.rt;
      basetype = param.basetype;
      basetype = interp.buildRecursivePointerType(s.Pointer, basetype, 0);
      if (s.right.length === 1) {
        right = s.right[0];
        ptl = null;
        if (right.type === "DirectDeclarator_modifier_ParameterTypeList") {
          ptl = right.ParameterTypeList;
          varargs = ptl.varargs;
        } else if (right.type === "DirectDeclarator_modifier_IdentifierList" && right.IdentifierList === null) {
          ptl = right.ParameterTypeList;
          varargs = false;
        }
        if (ptl != null) {
          argTypes = [];
          ref = ptl.ParameterList;
          for (k = 0, len = ref.length; k < len; k++) {
            _param = ref[k];
            _basetype = rt.simpleType(_param.DeclarationSpecifiers);
            if (_param.Declarator != null) {
              _pointer = _param.Declarator.Pointer;
              _type = interp.buildRecursivePointerType(_pointer, _basetype, 0);
              if ((_param.Declarator.right != null) && _param.Declarator.right.length > 0) {
                dimensions = [];
                ref1 = _param.Declarator.right;
                for (j = l = 0, len1 = ref1.length; l < len1; j = ++l) {
                  dim = ref1[j];
                  dim = _param.Declarator.right[j];
                  if (dim.type !== "DirectDeclarator_modifier_array") {
                    rt.raiseException("unacceptable array initialization", dim);
                  }
                  if (dim.Expression !== null) {
                    dim = rt.cast(rt.intTypeLiteral, (yield* interp.visit(interp, dim.Expression, param))).v;
                  } else if (j > 0) {
                    rt.raiseException("multidimensional array must have bounds for all dimensions except the first", dim);
                  } else {
                    dim = -1;
                  }
                  dimensions.push(dim);
                }
                _type = interp.arrayType(dimensions, 0, _type);
              }
            } else {
              _type = _basetype;
            }
            argTypes.push(_type);
          }
          basetype = rt.functionType(basetype, argTypes);
        }
      }
      if (s.right.length > 0 && s.right[0].type === "DirectDeclarator_modifier_array") {
        dimensions = [];
        ref2 = s.right;
        for (j = m = 0, len2 = ref2.length; m < len2; j = ++m) {
          dim = ref2[j];
          if (dim.type !== "DirectDeclarator_modifier_array") {
            rt.raiseException("unacceptable array initialization", dim);
          }
          if (dim.Expression !== null) {
            dim = rt.cast(rt.intTypeLiteral, (yield* interp.visit(interp, dim.Expression, param))).v;
          } else if (j > 0) {
            rt.raiseException("multidimensional array must have bounds for all dimensions except the first", dim);
          } else {
            dim = -1;
          }
          dimensions.push(dim);
        }
        basetype = interp.arrayType(dimensions, 0, basetype);
      }
      if (s.left.type === "Identifier") {
        return {
          type: basetype,
          name: s.left.Identifier
        };
      } else {
        _basetype = param.basetype;
        param.basetype = basetype;
        ret = (yield* interp.visit(interp, s.left, param));
        param.basetype = _basetype;
        return ret;
      }
    },
    TypedefDeclaration: function*(interp, s, param) {
      var _basetype, basetype, declarator, k, len, name, ref, ref1, type;
      rt = interp.rt;
      basetype = rt.simpleType(s.DeclarationSpecifiers);
      _basetype = param.basetype;
      param.basetype = basetype;
      ref = s.Declarators;
      for (k = 0, len = ref.length; k < len; k++) {
        declarator = ref[k];
        ref1 = (yield* interp.visit(interp, declarator, param)), type = ref1.type, name = ref1.name;
        rt.registerTypedef(type, name);
      }
      param.basetype = _basetype;
    },
    FunctionDefinition: function*(interp, s, param) {
      var _basetype, _init, _name, _param, _pointer, _type, argNames, argTypes, basetype, dim, dimensions, i, j, name, optionalArgs, pointer, ptl, scope, stat, varargs;
      rt = interp.rt;
      scope = param.scope;
      name = s.Declarator.left.Identifier;
      basetype = rt.simpleType(s.DeclarationSpecifiers);
      pointer = s.Declarator.Pointer;
      basetype = interp.buildRecursivePointerType(pointer, basetype, 0);
      argTypes = [];
      argNames = [];
      optionalArgs = [];
      ptl = void 0;
      varargs = void 0;
      if (s.Declarator.right.type === "DirectDeclarator_modifier_ParameterTypeList") {
        ptl = s.Declarator.right.ParameterTypeList;
        varargs = ptl.varargs;
      } else if (s.Declarator.right.type === "DirectDeclarator_modifier_IdentifierList" && s.Declarator.right.IdentifierList === null) {
        ptl = {
          ParameterList: []
        };
        varargs = false;
      } else {
        rt.raiseException("unacceptable argument list", s.Declarator.right);
      }
      i = 0;
      while (i < ptl.ParameterList.length) {
        _param = ptl.ParameterList[i];
        if (_param.Declarator == null) {
          rt.raiseException("missing declarator for argument", _param);
        }
        _init = _param.Declarator.Initializers;
        _pointer = _param.Declarator.Declarator.Pointer;
        _basetype = rt.simpleType(_param.DeclarationSpecifiers);
        _type = interp.buildRecursivePointerType(_pointer, _basetype, 0);
        _name = _param.Declarator.Declarator.left.Identifier;
        if (_param.Declarator.Declarator.right.length > 0) {
          dimensions = [];
          j = 0;
          while (j < _param.Declarator.Declarator.right.length) {
            dim = _param.Declarator.Declarator.right[j];
            if (dim.type !== "DirectDeclarator_modifier_array") {
              rt.raiseException("unacceptable array initialization", dim);
            }
            if (dim.Expression !== null) {
              dim = rt.cast(rt.intTypeLiteral, (yield* interp.visit(interp, dim.Expression, param))).v;
            } else if (j > 0) {
              rt.raiseException("multidimensional array must have bounds for all dimensions except the first", dim);
            } else {
              dim = -1;
            }
            dimensions.push(dim);
            j++;
          }
          _type = interp.arrayType(dimensions, 0, _type);
        }
        if (_init != null) {
          optionalArgs.push({
            type: _type,
            name: _name,
            expression: _init.Expression
          });
        } else {
          if (optionalArgs.length > 0) {
            rt.raiseException("all default arguments must be at the end of arguments list", _param);
          }
          argTypes.push(_type);
          argNames.push(_name);
        }
        i++;
      }
      stat = s.CompoundStatement;
      rt.defFunc(scope, name, basetype, argTypes, argNames, stat, interp, optionalArgs);
    },
    Declaration: function*(interp, s, param) {
      var _basetype, basetype, dec, dim, dimensions, i, init, initializer, j, k, l, len, len1, name, ref, ref1, ref2, ref3, type;
      rt = interp.rt;
      basetype = rt.simpleType(s.DeclarationSpecifiers);
      ref = s.InitDeclaratorList;
      for (i = k = 0, len = ref.length; k < len; i = ++k) {
        dec = ref[i];
        init = dec.Initializers;
        if (dec.Declarator.right.length > 0 && dec.Declarator.right[0].type === "DirectDeclarator_modifier_array") {
          dimensions = [];
          ref1 = dec.Declarator.right;
          for (j = l = 0, len1 = ref1.length; l < len1; j = ++l) {
            dim = ref1[j];
            if (dim.Expression !== null) {
              dim = rt.cast(rt.intTypeLiteral, (yield* interp.visit(interp, dim.Expression, param))).v;
            } else if (j > 0) {
              rt.raiseException("multidimensional array must have bounds for all dimensions except the first", dim);
            } else {
              if (init.type === "Initializer_expr") {
                initializer = (yield* interp.visit(interp, init, param));
                if (rt.isCharType(basetype) && rt.isArrayType(initializer.t) && rt.isCharType(initializer.t.eleType)) {
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
                  rt.raiseException("cannot initialize an array to " + rt.makeValString(initializer), init);
                }
              } else {
                dim = init.Initializers.length;
              }
            }
            dimensions.push(dim);
          }
          init = (yield* interp.arrayInit(dimensions, init, 0, basetype, param));
          _basetype = param.basetype;
          param.basetype = basetype;
          ref2 = (yield* interp.visit(interp, dec.Declarator, param)), name = ref2.name, type = ref2.type;
          param.basetype = _basetype;
          rt.defVar(name, init.t, init);
        } else {
          _basetype = param.basetype;
          param.basetype = basetype;
          ref3 = (yield* interp.visit(interp, dec.Declarator, param)), name = ref3.name, type = ref3.type;
          param.basetype = _basetype;
          if (init == null) {
            init = rt.defaultValue(type, true);
          } else {
            init = (yield* interp.visit(interp, init.Expression));
          }
          rt.defVar(name, type, init);
        }
      }
    },
    Initializer_expr: function*(interp, s, param) {
      rt = interp.rt;
      return (yield* interp.visit(interp, s.Expression, param));
    },
    Label_case: function*(interp, s, param) {
      var ce;
      rt = interp.rt;
      ce = (yield* interp.visit(interp, s.ConstantExpression));
      if (param["switch"] === void 0) {
        rt.raiseException("you cannot use case outside switch block");
      }
      if (param.scope === "SelectionStatement_switch_cs") {
        return ["switch", rt.cast(ce.t, param["switch"]).v === ce.v];
      } else {
        rt.raiseException("you can only use case directly in a switch block");
      }
    },
    Label_default: function(interp, s, param) {
      rt = interp.rt;
      if (param["switch"] === void 0) {
        rt.raiseException("you cannot use default outside switch block");
      }
      if (param.scope === "SelectionStatement_switch_cs") {
        return ["switch", true];
      } else {
        rt.raiseException("you can only use default directly in a switch block");
      }
    },
    CompoundStatement: function*(interp, s, param) {
      var _scope, i, k, len, r, stmt, stmts, switchon;
      rt = interp.rt;
      stmts = s.Statements;
      r = void 0;
      i = void 0;
      _scope = param.scope;
      if (param.scope === "SelectionStatement_switch") {
        param.scope = "SelectionStatement_switch_cs";
        rt.enterScope(param.scope);
        switchon = false;
        i = 0;
        while (i < stmts.length) {
          stmt = stmts[i];
          if (stmt.type === "Label_case" || stmt.type === "Label_default") {
            r = (yield* interp.visit(interp, stmt, param));
            if (r[1]) {
              switchon = true;
            }
          } else if (switchon) {
            r = (yield* interp.visit(interp, stmt, param));
            if (r instanceof Array) {
              return r;
            }
          }
          i++;
        }
        rt.exitScope(param.scope);
        param.scope = _scope;
      } else {
        param.scope = "CompoundStatement";
        rt.enterScope(param.scope);
        for (k = 0, len = stmts.length; k < len; k++) {
          stmt = stmts[k];
          r = (yield* interp.visit(interp, stmt, param));
          if (r instanceof Array) {
            break;
          }
        }
        rt.exitScope(param.scope);
        param.scope = _scope;
        return r;
      }
    },
    ExpressionStatement: function*(interp, s, param) {
      rt = interp.rt;
      if (s.Expression != null) {
        (yield* interp.visit(interp, s.Expression, param));
      }
    },
    SelectionStatement_if: function*(interp, s, param) {
      var e, ret, scope_bak;
      rt = interp.rt;
      scope_bak = param.scope;
      param.scope = "SelectionStatement_if";
      rt.enterScope(param.scope);
      e = (yield* interp.visit(interp, s.Expression, param));
      ret = void 0;
      if (rt.cast(rt.boolTypeLiteral, e).v) {
        ret = (yield* interp.visit(interp, s.Statement, param));
      } else if (s.ElseStatement) {
        ret = (yield* interp.visit(interp, s.ElseStatement, param));
      }
      rt.exitScope(param.scope);
      param.scope = scope_bak;
      return ret;
    },
    SelectionStatement_switch: function*(interp, s, param) {
      var e, r, ret, scope_bak, switch_bak;
      rt = interp.rt;
      scope_bak = param.scope;
      param.scope = "SelectionStatement_switch";
      rt.enterScope(param.scope);
      e = (yield* interp.visit(interp, s.Expression, param));
      switch_bak = param["switch"];
      param["switch"] = e;
      r = (yield* interp.visit(interp, s.Statement, param));
      param["switch"] = switch_bak;
      ret = void 0;
      if (r instanceof Array) {
        if (r[0] !== "break") {
          ret = r;
        }
      }
      rt.exitScope(param.scope);
      param.scope = scope_bak;
      return ret;
    },
    IterationStatement_while: function*(interp, s, param) {
      var cond, end_loop, r, return_val, scope_bak;
      rt = interp.rt;
      scope_bak = param.scope;
      param.scope = "IterationStatement_while";
      rt.enterScope(param.scope);
      while (true) {
        if (s.Expression != null) {
          cond = (yield* interp.visit(interp, s.Expression, param));
          cond = rt.cast(rt.boolTypeLiteral, cond).v;
          if (!cond) {
            break;
          }
        }
        r = (yield* interp.visit(interp, s.Statement, param));
        if (r instanceof Array) {
          switch (r[0]) {
            case "continue":
              break;
            case "break":
              end_loop = true;
              break;
            case "return":
              return_val = r;
              end_loop = true;
          }
          if (end_loop) {
            break;
          }
        }
      }
      rt.exitScope(param.scope);
      param.scope = scope_bak;
      return return_val;
    },
    IterationStatement_do: function*(interp, s, param) {
      var cond, end_loop, r, return_val, scope_bak;
      rt = interp.rt;
      scope_bak = param.scope;
      param.scope = "IterationStatement_do";
      rt.enterScope(param.scope);
      while (true) {
        r = (yield* interp.visit(interp, s.Statement, param));
        if (r instanceof Array) {
          switch (r[0]) {
            case "continue":
              break;
            case "break":
              end_loop = true;
              break;
            case "return":
              return_val = r;
              end_loop = true;
          }
          if (end_loop) {
            break;
          }
        }
        if (s.Expression != null) {
          cond = (yield* interp.visit(interp, s.Expression, param));
          cond = rt.cast(rt.boolTypeLiteral, cond).v;
          if (!cond) {
            break;
          }
        }
      }
      rt.exitScope(param.scope);
      param.scope = scope_bak;
      return return_val;
    },
    IterationStatement_for: function*(interp, s, param) {
      var cond, end_loop, r, return_val, scope_bak;
      rt = interp.rt;
      scope_bak = param.scope;
      param.scope = "IterationStatement_for";
      rt.enterScope(param.scope);
      if (s.Initializer) {
        if (s.Initializer.type === "Declaration") {
          (yield* interp.visit(interp, s.Initializer, param));
        } else {
          (yield* interp.visit(interp, s.Initializer, param));
        }
      }
      while (true) {
        if (s.Expression != null) {
          cond = (yield* interp.visit(interp, s.Expression, param));
          cond = rt.cast(rt.boolTypeLiteral, cond).v;
          if (!cond) {
            break;
          }
        }
        r = (yield* interp.visit(interp, s.Statement, param));
        if (r instanceof Array) {
          switch (r[0]) {
            case "continue":
              break;
            case "break":
              end_loop = true;
              break;
            case "return":
              return_val = r;
              end_loop = true;
          }
          if (end_loop) {
            break;
          }
        }
        if (s.Loop) {
          (yield* interp.visit(interp, s.Loop, param));
        }
      }
      rt.exitScope(param.scope);
      param.scope = scope_bak;
      return return_val;
    },
    JumpStatement_goto: function(interp, s, param) {
      rt = interp.rt;
      rt.raiseException("not implemented");
    },
    JumpStatement_continue: function(interp, s, param) {
      rt = interp.rt;
      return ["continue"];
    },
    JumpStatement_break: function(interp, s, param) {
      rt = interp.rt;
      return ["break"];
    },
    JumpStatement_return: function*(interp, s, param) {
      var ret;
      rt = interp.rt;
      if (s.Expression) {
        ret = (yield* interp.visit(interp, s.Expression, param));
        return ["return", ret];
      }
      return ["return"];
    },
    IdentifierExpression: function(interp, s, param) {
      rt = interp.rt;
      return rt.readVar(s.Identifier);
    },
    ParenthesesExpression: function*(interp, s, param) {
      rt = interp.rt;
      return (yield* interp.visit(interp, s.Expression, param));
    },
    PostfixExpression_ArrayAccess: function*(interp, s, param) {
      var index, r, ret;
      rt = interp.rt;
      ret = (yield* interp.visit(interp, s.Expression, param));
      index = (yield* interp.visit(interp, s.index, param));
      r = rt.getFunc(ret.t, rt.makeOperatorFuncName("[]"), [index.t])(rt, ret, index);
      if (isGenerator(r)) {
        return (yield* r);
      } else {
        return r;
      }
    },
    PostfixExpression_MethodInvocation: function*(interp, s, param) {
      var args, bindThis, e, r, ret, thisArg;
      rt = interp.rt;
      ret = (yield* interp.visit(interp, s.Expression, param));
      args = (yield* (function*() {
        var k, len, ref, results;
        ref = s.args;
        results = [];
        for (k = 0, len = ref.length; k < len; k++) {
          e = ref[k];
          thisArg = (yield* interp.visit(interp, e, param));
          results.push(thisArg);
        }
        return results;
      })());
      if (ret.v.bindThis != null) {
        bindThis = ret.v.bindThis;
      } else {
        bindThis = ret;
      }
      r = rt.getFunc(ret.t, rt.makeOperatorFuncName("()"), args.map(function(e) {
        return e.t;
      }))(rt, ret, bindThis, args);
      if (isGenerator(r)) {
        return (yield* r);
      } else {
        return r;
      }
    },
    PostfixExpression_MemberAccess: function*(interp, s, param) {
      var ret;
      rt = interp.rt;
      ret = (yield* interp.visit(interp, s.Expression, param));
      return rt.getMember(ret, s.member);
    },
    PostfixExpression_MemberPointerAccess: function*(interp, s, param) {
      var member, r, ret;
      rt = interp.rt;
      ret = (yield* interp.visit(interp, s.Expression, param));
      member = void 0;
      if (rt.isPointerType(ret.t) && !rt.isFunctionType(ret.t)) {
        member = s.member;
        r = rt.getFunc(ret.t, rt.makeOperatorFuncName("->"), [])(rt, ret, member);
        if (isGenerator(r)) {
          return (yield* r);
        } else {
          return r;
        }
      } else {
        member = (yield* interp.visit(interp, {
          type: "IdentifierExpression",
          Identifier: s.member
        }, param));
        r = rt.getFunc(ret.t, rt.makeOperatorFuncName("->"), [member.t])(rt, ret, member);
        if (isGenerator(r)) {
          return (yield* r);
        } else {
          return r;
        }
      }
    },
    PostfixExpression_PostIncrement: function*(interp, s, param) {
      var r, ret;
      rt = interp.rt;
      ret = (yield* interp.visit(interp, s.Expression, param));
      r = rt.getFunc(ret.t, rt.makeOperatorFuncName("++"), ["dummy"])(rt, ret, {
        t: "dummy",
        v: null
      });
      if (isGenerator(r)) {
        return (yield* r);
      } else {
        return r;
      }
    },
    PostfixExpression_PostDecrement: function*(interp, s, param) {
      var r, ret;
      rt = interp.rt;
      ret = (yield* interp.visit(interp, s.Expression, param));
      r = rt.getFunc(ret.t, rt.makeOperatorFuncName("--"), ["dummy"])(rt, ret, {
        t: "dummy",
        v: null
      });
      if (isGenerator(r)) {
        return (yield* r);
      } else {
        return r;
      }
    },
    UnaryExpression_PreIncrement: function*(interp, s, param) {
      var r, ret;
      rt = interp.rt;
      ret = (yield* interp.visit(interp, s.Expression, param));
      r = rt.getFunc(ret.t, rt.makeOperatorFuncName("++"), [])(rt, ret);
      if (isGenerator(r)) {
        return (yield* r);
      } else {
        return r;
      }
    },
    UnaryExpression_PreDecrement: function*(interp, s, param) {
      var r, ret;
      rt = interp.rt;
      ret = (yield* interp.visit(interp, s.Expression, param));
      r = rt.getFunc(ret.t, rt.makeOperatorFuncName("--"), [])(rt, ret);
      if (isGenerator(r)) {
        return (yield* r);
      } else {
        return r;
      }
    },
    UnaryExpression: function*(interp, s, param) {
      var r, ret;
      rt = interp.rt;
      ret = (yield* interp.visit(interp, s.Expression, param));
      r = rt.getFunc(ret.t, rt.makeOperatorFuncName(s.op), [])(rt, ret);
      if (isGenerator(r)) {
        return (yield* r);
      } else {
        return r;
      }
    },
    UnaryExpression_Sizeof_Expr: function*(interp, s, param) {
      var ret;
      rt = interp.rt;
      ret = (yield* interp.visit(interp, s.Expression, param));
      return rt.val(rt.intTypeLiteral, rt.getSize(ret));
    },
    UnaryExpression_Sizeof_Type: function*(interp, s, param) {
      var type;
      rt = interp.rt;
      type = (yield* interp.visit(interp, s.TypeName, param));
      return rt.val(rt.intTypeLiteral, rt.getSizeByType(type));
    },
    CastExpression: function*(interp, s, param) {
      var ret, type;
      rt = interp.rt;
      ret = (yield* interp.visit(interp, s.Expression, param));
      type = (yield* interp.visit(interp, s.TypeName, param));
      return rt.cast(type, ret);
    },
    TypeName: function(interp, s, param) {
      var baseType, k, len, ref, typename;
      rt = interp.rt;
      typename = [];
      ref = s.base;
      for (k = 0, len = ref.length; k < len; k++) {
        baseType = ref[k];
        if (baseType !== "const") {
          typename.push(baseType);
        }
      }
      return rt.simpleType(typename);
    },
    BinOpExpression: function*(interp, s, param) {
      var left, op, r, right;
      rt = interp.rt;
      op = s.op;
      if (op === "&&") {
        s.type = "LogicalANDExpression";
        return (yield* interp.visit(interp, s, param));
      } else if (op === "||") {
        s.type = "LogicalORExpression";
        return (yield* interp.visit(interp, s, param));
      } else {
        left = (yield* interp.visit(interp, s.left, param));
        right = (yield* interp.visit(interp, s.right, param));
        r = rt.getFunc(left.t, rt.makeOperatorFuncName(op), [right.t])(rt, left, right);
        if (isGenerator(r)) {
          return (yield* r);
        } else {
          return r;
        }
      }
    },
    LogicalANDExpression: function*(interp, s, param) {
      var left, lt, r, right;
      rt = interp.rt;
      left = (yield* interp.visit(interp, s.left, param));
      lt = rt.types[rt.getTypeSignature(left.t)];
      if ("&&" in lt) {
        right = (yield* interp.visit(interp, s.right, param));
        r = rt.getFunc(left.t, rt.makeOperatorFuncName("&&"), [right.t])(rt, left, right);
        if (isGenerator(r)) {
          return (yield* r);
        } else {
          return r;
        }
      } else {
        if (rt.cast(rt.boolTypeLiteral, left).v) {
          return (yield* interp.visit(interp, s.right, param));
        } else {
          return left;
        }
      }
    },
    LogicalORExpression: function*(interp, s, param) {
      var left, lt, r, right;
      rt = interp.rt;
      left = (yield* interp.visit(interp, s.left, param));
      lt = rt.types[rt.getTypeSignature(left.t)];
      if ("||" in lt) {
        right = (yield* interp.visit(interp, s.right, param));
        r = rt.getFunc(left.t, rt.makeOperatorFuncName("||"), [right.t])(rt, left, right);
        if (isGenerator(r)) {
          return (yield* r);
        } else {
          return r;
        }
      } else {
        if (rt.cast(rt.boolTypeLiteral, left).v) {
          return left;
        } else {
          return (yield* interp.visit(interp, s.right, param));
        }
      }
    },
    ConditionalExpression: function*(interp, s, param) {
      var cond;
      rt = interp.rt;
      cond = rt.cast(rt.boolTypeLiteral, (yield* interp.visit(interp, s.cond, param))).v;
      if (cond) {
        return (yield* interp.visit(interp, s.t, param));
      } else {
        return (yield* interp.visit(interp, s.f, param));
      }
    },
    ConstantExpression: function*(interp, s, param) {
      rt = interp.rt;
      return (yield* interp.visit(interp, s.Expression, param));
    },
    StringLiteralExpression: function*(interp, s, param) {
      return (yield* interp.visit(interp, s.value, param));
    },
    StringLiteral: function(interp, s, param) {
      var code, i, k, len, limits, maxCode, minCode, ref, typeName;
      rt = interp.rt;
      switch (s.prefix) {
        case null:
          maxCode = -1;
          minCode = 1;
          ref = s.value;
          for (k = 0, len = ref.length; k < len; k++) {
            i = ref[k];
            code = i.charCodeAt(0);
            if (maxCode < code) {
              maxCode = code;
            }
            if (minCode > code) {
              minCode = code;
            }
          }
          limits = rt.config.limits;
          typeName = maxCode <= limits["char"].max && minCode >= limits["char"].min ? "char" : "wchar_t";
          return rt.makeCharArrayFromString(s.value, typeName);
        case "L":
          return rt.makeCharArrayFromString(s.value, "wchar_t");
        case "u8":
          return rt.makeCharArrayFromString(s.value, "char");
        case "u":
          return rt.makeCharArrayFromString(s.value, "char16_t");
        case "U":
          return rt.makeCharArrayFromString(s.value, "char32_t");
      }
    },
    BooleanConstant: function(interp, s, param) {
      rt = interp.rt;
      return rt.val(rt.boolTypeLiteral, s.value === "true" ? 1 : 0);
    },
    CharacterConstant: function(interp, s, param) {
      var a;
      rt = interp.rt;
      a = s.Char;
      if (a.length !== 1) {
        rt.raiseException("a character constant must have and only have one character.");
      }
      return rt.val(rt.charTypeLiteral, a[0].charCodeAt(0));
    },
    FloatConstant: function*(interp, s, param) {
      var val;
      rt = interp.rt;
      val = (yield* interp.visit(interp, s.Expression, param));
      return rt.val(rt.floatTypeLiteral, val.v);
    },
    DecimalConstant: function(interp, s, param) {
      rt = interp.rt;
      return rt.val(rt.unsignedintTypeLiteral, parseInt(s.value, 10));
    },
    HexConstant: function(interp, s, param) {
      rt = interp.rt;
      return rt.val(rt.unsignedintTypeLiteral, parseInt(s.value, 16));
    },
    BinaryConstant: function(interp, s, param) {
      rt = interp.rt;
      return rt.val(rt.unsignedintTypeLiteral, parseInt(s.value, 2));
    },
    DecimalFloatConstant: function(interp, s, param) {
      rt = interp.rt;
      return rt.val(rt.doubleTypeLiteral, parseFloat(s.value));
    },
    HexFloatConstant: function(interp, s, param) {
      rt = interp.rt;
      return rt.val(rt.doubleTypeLiteral, parseFloat(s.value, 16));
    },
    OctalConstant: function(interp, s, param) {
      rt = interp.rt;
      return rt.val(rt.unsignedintTypeLiteral, parseInt(s.value, 8));
    },
    NamespaceDefinition: function(interp, s, param) {
      rt = interp.rt;
      rt.raiseException("not implemented");
    },
    UsingDirective: function(interp, s, param) {
      var id;
      rt = interp.rt;
      id = s.Identifier;
    },
    UsingDeclaration: function(interp, s, param) {
      rt = interp.rt;
      rt.raiseException("not implemented");
    },
    NamespaceAliasDefinition: function(interp, s, param) {
      rt = interp.rt;
      rt.raiseException("not implemented");
    },
    unknown: function(interp, s, param) {
      rt = interp.rt;
      rt.raiseException("unhandled syntax " + s.type);
    }
  };
};

Interpreter.prototype.visit = function*(interp, s, param) {
  var _node, f, ret, rt;
  rt = interp.rt;
  if ("type" in s) {
    if (param === void 0) {
      param = {
        scope: "global"
      };
    }
    _node = this.currentNode;
    this.currentNode = s;
    if (s.type in this.visitors) {
      f = this.visitors[s.type];
      if (isGeneratorFunction(f)) {
        ret = (yield* f(interp, s, param));
      } else {
        (yield (ret = f(interp, s, param)));
      }
    } else {
      ret = this.visitors["unknown"](interp, s, param);
    }
    this.currentNode = _node;
  } else {
    this.currentNode = s;
    this.rt.raiseException("untyped syntax structure");
  }
  return ret;
};

Interpreter.prototype.run = function*(tree) {
  this.rt.interp = this;
  return (yield* this.visit(this, tree));
};

Interpreter.prototype.arrayInit = function*(dimensions, init, level, type, param) {
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
              type: "Initializer_expr",
              shorthand: this.rt.defaultValue(type)
            };
            i++;
          }
          init.Initializers = arr;
        } else if (init.Initializers.length === 1 && this.rt.isIntegerType(type)) {
          val = this.rt.cast(type, (yield* this.visit(this, init.Initializers[0].Expression, param)));
          if (val.v === -1 || val.v === 0) {
            arr = new Array(curDim);
            i = 0;
            while (i < curDim) {
              arr[i] = {
                type: "Initializer_expr",
                shorthand: this.rt.val(type, val.v)
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
                type: "Initializer_expr",
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
                shorthand: (yield* this.visit(this, _init.Expression, param))
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
          initializer = (yield* this.visit(this, init, param));
        }
        if (this.rt.isCharType(type) && this.rt.isArrayType(initializer.t) && this.rt.isCharType(initializer.t.eleType)) {
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
          this.rt.raiseException("cannot initialize an array to " + this.rt.makeValString(initializer), init);
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
        arr[i] = (yield* this.arrayInit(dimensions, init.Initializers[i], level + 1, type, param));
      } else {
        arr[i] = (yield* this.arrayInit(dimensions, null, level + 1, type, param));
      }
      i++;
    }
    return ret;
  } else {
    if (init && init.type !== "Initializer_expr") {
      this.rt.raiseException("dimensions do not agree, too few initializers", init);
    }
    if (init) {
      if ("shorthand" in init) {
        initval = init.shorthand;
      } else {
        initval = (yield* this.visit(this, init.Expression, param));
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
