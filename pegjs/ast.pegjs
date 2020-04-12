{
function buildRecursiveBinop(a, b){
  var ret = a;
  for (var i=0; i<b.length; i++) {
    ret = addPositionInfo({type:'BinOpExpression', left:ret, op:b[i][0], right:b[i][1]});
  }
  return ret;
};

function addPositionInfo(r){
    var posDetails = peg$computePosDetails(peg$currPos);
    r.eLine = posDetails.line;
    r.eColumn = posDetails.column;
    r.eOffset = peg$currPos;
    posDetails = peg$computePosDetails(peg$savedPos);
    r.sLine = posDetails.line;
    r.sColumn = posDetails.column;
    r.sOffset = peg$savedPos;
    return r;
}
}

//-------------------------------------------------------------------------
//  A.2.4  External definitions
//-------------------------------------------------------------------------

TranslationUnit
    = Spacing a:ExternalDeclaration+ EOT {return addPositionInfo({type:'TranslationUnit', ExternalDeclarations: a});}
    ;

ExternalDeclaration
    = Namespace / TypedefDeclaration / FunctionDefinition / Declaration
    ;

Namespace
    =  NamespaceDefinition / UsingDirective / UsingDeclaration / NamespaceAliasDefinition
    ;

NamespaceDefinition
    = NAMESPACE a:Identifier LWING b:ExternalDeclaration+ RWING {
      return addPositionInfo({type: 'NamespaceDefinition', Identifier:a, ExternalDeclarations:b});
    }
    ;

UsingDirective
    = USING NAMESPACE a:ScopedIdentifier SEMI {
      return addPositionInfo({type: 'UsingDirective', Identifier:a});
    }
    ;

UsingDeclaration
    = USING a:ScopedIdentifier SCOPEOP b:Identifier SEMI {
      return addPositionInfo({type: 'UsingDeclaration', scope: a, Identifier: b});
    }
    ;

NamespaceAliasDefinition
    = NAMESPACE a:Identifier EQU b:ScopedIdentifier SEMI {
      return addPositionInfo({type: 'NamespaceAliasDefinition', target: b, Identifier: a})
    }
    ;

TypedefDeclaration
    = TYPEDEF a:DeclarationSpecifiers b:Declarator c:(COMMA a:Declarator {return a;})* SEMI {
      return addPositionInfo({type:'TypedefDeclaration', DeclarationSpecifiers:a, Declarators:[b].concat(c)});
    }
    ;

FunctionDefinition
    = a:DeclarationSpecifiers b_pointer:STAR? b:FunctionDirectDeclarator c:(SEMI {return null;} / CompoundStatement) {
      b.Pointer = b_pointer;
      return addPositionInfo({type:'FunctionDefinition', DeclarationSpecifiers:a, Declarator:b, CompoundStatement:c});
    }
    ;

DeclarationList
    = a:Declaration+ {return addPositionInfo({type:'DeclarationList', Declarations:a});}
    ;

//-------------------------------------------------------------------------
//  A.2.3  Statements
//-------------------------------------------------------------------------

StatementORDeclaration
    = Statement / Declaration

Statement
    = Label
    / CompoundStatement
    / ExpressionStatement
    / SelectionStatement
    / IterationStatement
    / JumpStatement
    ;

Label
    = CASE a:ConstantExpression COLON {return addPositionInfo({type: 'Label_case', ConstantExpression: a});}
    / DEFAULT COLON {return addPositionInfo({type: 'Label_default'});}

CompoundStatement
    = LWING a:(Statement / Declaration)* RWING {
        return addPositionInfo({type: 'CompoundStatement', Statements: a});
      }
    ;

ExpressionStatement
    = a:Expression? SEMI {
        return addPositionInfo({type: 'ExpressionStatement', Expression: a});
      }
    ;

SelectionStatement
    = IF LPAR a:Expression RPAR
      b:Statement c:(ELSE Statement)? {
        return addPositionInfo({type: 'SelectionStatement_if', Expression:a, Statement:b, ElseStatement:c?c[1]:null});
      }
    / SWITCH LPAR a:Expression RPAR b:Statement {
        return addPositionInfo({type: 'SelectionStatement_switch', Expression:a, Statement:b});
      }
    ;

IterationStatement
    = WHILE LPAR a:Expression RPAR b:Statement {return addPositionInfo({type:'IterationStatement_while', Expression:a, Statement:b});}
    / DO a:Statement WHILE LPAR b:Expression RPAR SEMI {return addPositionInfo({type:'IterationStatement_do', Expression:b, Statement:a});}
    / FOR LPAR a:(Declaration/ExpressionStatement)? c:Expression? SEMI d:Expression? RPAR e:Statement {
      return addPositionInfo({type:'IterationStatement_for', Initializer:a, Expression:c, Loop:d, Statement:e});
    }
    ;

JumpStatement
    = GOTO a:Identifier SEMI {
      return addPositionInfo({type:'JumpStatement_goto', Identifier:a});
    }
    / CONTINUE SEMI {
      return addPositionInfo({type: 'JumpStatement_continue'});
    }
    / BREAK SEMI {
      return addPositionInfo({type: 'JumpStatement_break'});
    }
    / RETURN a:Expression? SEMI {
      return addPositionInfo({type: 'JumpStatement_return', Expression:a});
    }
    ;

//-------------------------------------------------------------------------
//  A.2.2  Declarations
//-------------------------------------------------------------------------

Declaration
    = a:DeclarationSpecifiers b:InitDeclaratorList? SEMI {
      return addPositionInfo({type: 'Declaration', DeclarationSpecifiers:a, InitDeclaratorList:b});
    }
    ;

DeclarationSpecifiers
    = a:(a:( StorageClassSpecifier
       / TypeQualifier
       / FunctionSpecifier
       )*
       b:TypedefName
       c:( StorageClassSpecifier
       / TypeQualifier
       / FunctionSpecifier
       )* {
        return a.concat([b]).concat(c);
       }
      ) {
          return a;
        }
    / a:( a:StorageClassSpecifier {return a;}
      / a:TypeSpecifier {return a;}
      / a:TypeQualifier {return a;}
      / a:FunctionSpecifier {return a;}
      )+ {
        return a;
      }
    ;

InitDeclaratorList
    = a:InitDeclarator b:(COMMA x:InitDeclarator {return x;})* {
      return [a].concat(b);
    }
    ;

InitDeclarator
    = a:Declarator b:(EQU x:Initializer {return x;})? {return addPositionInfo({type:'InitDeclarator', Declarator:a, Initializers:b});}
    ;

StorageClassSpecifier
    = a:(EXTERN
    / STATIC
    / AUTO
    / REGISTER
    / ATTRIBUTE LPAR LPAR (!RPAR _)* RPAR RPAR) {
      return a;
    }
    ;

TypeSpecifier
    = a: (VOID
    / CHAR
    / SHORT
    / INT
    / LONG
    / FLOAT
    / DOUBLE
    / SIGNED
    / UNSIGNED
    / BOOL
    / COMPLEX
    / StructOrUnionSpecifier
    / EnumSpecifier) {
      return a;
    }
    ;

StructOrUnionSpecifier
    = StructOrUnion
      ( a:Identifier? LWING StructDeclaration+ RWING {
        return a;
      }
      / Identifier
      )
    ;

StructOrUnion
    = a:(STRUCT
    / UNION) {return a;}
    ;

StructDeclaration
    = SpecifierQualifierList StructDeclaratorList SEMI
    ;

SpecifierQualifierList
    = ( TypeQualifier*
        TypedefName
        TypeQualifier*
      )
    / ( TypeSpecifier
      / TypeQualifier
      )+
    ;

StructDeclaratorList
    = StructDeclarator (COMMA StructDeclarator)*
    ;

StructDeclarator
    = Declarator? COLON ConstantExpression
    / Declarator
    ;

EnumSpecifier
    = ENUM
      ( Identifier? LWING EnumeratorList COMMA? RWING
      / Identifier
      )
    ;

EnumeratorList
    = Enumerator (COMMA Enumerator)*
    ;

Enumerator
    = EnumerationConstant (EQU ConstantExpression)?
    ;

TypeQualifier
    = a:(CONST) {
      return a;
    }
    ;

FunctionSpecifier
    = a:(INLINE
    / STDCALL) {
      return a;
    }
    ;

FunctionDirectDeclarator
    = a:( a:Identifier {return addPositionInfo({type:'Identifier', Identifier:a});}
      / LPAR a:Declarator RPAR {return a;}
      )
      b:( LPAR a:ParameterTypeList RPAR {
        return addPositionInfo({type:'DirectDeclarator_modifier_ParameterTypeList', ParameterTypeList:a});
      }) {
        return addPositionInfo({type:'DirectDeclarator', left:a, right:b});
      }
    ;

Declarator
    = a:Pointer? b:DirectDeclarator {
      b.Pointer = a;
      return b;
    }
    ;

DirectDeclarator
    = a:( a:Identifier {return addPositionInfo({type:'Identifier', Identifier:a});}
      / LPAR a:Declarator RPAR {return a;}
      )
      b:( LBRK a:TypeQualifier* b:AssignmentExpression? RBRK {
        return addPositionInfo({type:'DirectDeclarator_modifier_array', Modifier:a||[], Expression: b});
      }
      / LBRK STATIC a:TypeQualifier* b:AssignmentExpression RBRK {
        return addPositionInfo({type:'DirectDeclarator_modifier_array', Modifier:['static'].concat(a), Expression: b});
      }
      / LBRK a:TypeQualifier+ STATIC b:AssignmentExpression RBRK {
        return addPositionInfo({type:'DirectDeclarator_modifier_array', Modifier:['static'].concat(a), Expression: b});
      }
      / LBRK a:TypeQualifier* STAR RBRK {
        return addPositionInfo({type:'DirectDeclarator_modifier_star_array', Modifier:a.concat['*']});
      }
      / LPAR a:ParameterTypeList RPAR {
        return addPositionInfo({type:'DirectDeclarator_modifier_ParameterTypeList', ParameterTypeList:a});
      }
      / LPAR a:IdentifierList? RPAR {
        return addPositionInfo({type:'DirectDeclarator_modifier_IdentifierList', IdentifierList:a});
      }
      )* {
        return addPositionInfo({type:'DirectDeclarator', left:a, right:b});
      }
    ;

Pointer
    = ( STAR a:TypeQualifier* {return a;} )+
    ;

ParameterTypeList
    = a:ParameterList b:(COMMA ELLIPSIS)? {
      return addPositionInfo({type:'ParameterTypeList', ParameterList:a, varargs:b!==null});
    }
    ;

ParameterList
    = a:ParameterDeclaration? b:(COMMA a:ParameterDeclaration {return a;})* {
      if (a)
        return [a].concat(b);
      else
        return b;
    }
    ;

ParameterDeclaration
    = a:DeclarationSpecifiers
      b:( InitDeclarator
      / AbstractDeclarator
      )? {
        return addPositionInfo({type:'ParameterDeclaration', DeclarationSpecifiers:a, Declarator:b});
      }
    ;

IdentifierList
    = a:Identifier b:(COMMA x:Identifier {return x;})* {
      return [a].concat(b);
    }
    ;

TypeName
    = a:SpecifierQualifierList b:AbstractDeclarator? {
      return addPositionInfo({type: 'TypeName', base: a, extra: b})
    }
    ;

AbstractDeclarator
    = a:Pointer? b:DirectAbstractDeclarator {
      b.Pointer = a;
      return b;
    }
    / a:Pointer {
      return addPositionInfo({type:'AbstractDeclarator', Pointer: a});
    }
    ;

DirectAbstractDeclarator
    = ( LPAR AbstractDeclarator RPAR
      / LBRK (AssignmentExpression / STAR)? RBRK
      / LPAR ParameterTypeList? RPAR
      )
      ( LBRK (AssignmentExpression / STAR)? RBRK
      / LPAR ParameterTypeList? RPAR
      )*
    ;

TypedefName
    = Identifier
    ;

Initializer
    = a:AssignmentExpression {return addPositionInfo({type:'Initializer_expr', Expression:a});}
    / LWING a:InitializerList COMMA? RWING {return addPositionInfo({type:'Initializer_array', Initializers:a});}
    ;

InitializerList
    = a:Initializer b:(COMMA a:Initializer {return a;})* {return [a].concat(b);}
    ;


//-------------------------------------------------------------------------
//  A.2.1  Expressions
//-------------------------------------------------------------------------

PrimaryExpression
    = a:Identifier {return addPositionInfo({type:'IdentifierExpression', Identifier:a});}
    / a:Constant {return addPositionInfo({type:'ConstantExpression', Expression:a});}
    / a:StringLiteral {return addPositionInfo({type:'StringLiteralExpression', value:a});}
    / LPAR a:Expression RPAR {return addPositionInfo({type:'ParenthesesExpression', Expression:a});}
    ;

PostfixExpression
    = a:( PrimaryExpression
      )
      b:( LBRK c:Expression RBRK {return [0,c];}
      / LPAR c:ArgumentExpressionList? RPAR {return [1,c?c:[]];}
      / DOT c:Identifier {return [2,c];}
      / PTR c:Identifier {return [3,c];}
      / c:INC {return [4];}
      / c:DEC {return [5];}
      )* {
        if (b.length > 0) {
          var ret = addPositionInfo({
            Expression: a,
          });
          for (var i = 0; i < b.length; i++){
            var o = b[i][1];
            switch(b[i][0]){
            case 0:
              ret.type = 'PostfixExpression_ArrayAccess';
              ret.index = o;
              break;
            case 1:
              ret.type = 'PostfixExpression_MethodInvocation';
              ret.args = o;
              break;
            case 2:
              ret.type = 'PostfixExpression_MemberAccess';
              ret.member = o;
              break;
            case 3:
              ret.type = 'PostfixExpression_MemberPointerAccess';
              ret.member = o;
              break;
            case 4:
              ret.type = 'PostfixExpression_PostIncrement';
              break;
            case 5:
              ret.type = 'PostfixExpression_PostDecrement';
              break;
            }
            ret = addPositionInfo({Expression: ret});
          }
          return ret.Expression;
        } else
          return a;
      }
    ;

ArgumentExpressionList
    = a:AssignmentExpression b:(COMMA AssignmentExpression)* {
      var ret = [a];
      for (var i=0;i<b.length;i++)
        ret.push(b[i][1]);
      return ret;
    }
    ;

UnaryExpression
    = PostfixExpression
    / INC a:UnaryExpression {return addPositionInfo({type: 'UnaryExpression_PreIncrement', Expression:a});}
    / DEC a:UnaryExpression {return addPositionInfo({type: 'UnaryExpression_PreDecrement', Expression:a});}
    / a:UnaryOperator b:CastExpression {
      return addPositionInfo({type:'UnaryExpression', op:a, Expression:b});
    }
    / SIZEOF a:( a:UnaryExpression {return addPositionInfo({type:'UnaryExpression_Sizeof_Expr', Expression:a});}
      / LPAR a:TypeName RPAR {return addPositionInfo({type:'UnaryExpression_Sizeof_Type', TypeName:a});}
      ) {return a;}
    ;

UnaryOperator
    = AND
    / STAR
    / PLUS
    / MINUS
    / TILDA
    / BANG
    ;

CastExpression
    = UnaryExpression
    / a:(LPAR TypeName RPAR) b:CastExpression {
      return addPositionInfo({type:'CastExpression', TypeName:a[1], Expression:b});
    }
    ;

MultiplicativeExpression
    = a:CastExpression b:((STAR / DIV / MOD) CastExpression)* {
      return buildRecursiveBinop(a, b);
    }
    ;

AdditiveExpression
    = a:MultiplicativeExpression b:((PLUS / MINUS) MultiplicativeExpression)* {
      return buildRecursiveBinop(a, b);
    }
    ;

ShiftExpression
    = a:AdditiveExpression b:((LEFT / RIGHT) AdditiveExpression)* {
      return buildRecursiveBinop(a, b);
    }
    ;

RelationalExpression
    = a:ShiftExpression b:((LE / GE / LT / GT) ShiftExpression)* {
      return buildRecursiveBinop(a, b);
    }
    ;

EqualityExpression
    = a:RelationalExpression b:((EQUEQU / BANGEQU) RelationalExpression)* {
      return buildRecursiveBinop(a, b);
    }
    ;

ANDExpression
    = a:EqualityExpression b:(AND EqualityExpression)* {
      return buildRecursiveBinop(a, b);
    }
    ;

ExclusiveORExpression
    = a:ANDExpression b:(HAT ANDExpression)* {
      return buildRecursiveBinop(a, b);
    }
    ;

InclusiveORExpression
    = a:ExclusiveORExpression b:(OR ExclusiveORExpression)* {
      return buildRecursiveBinop(a, b);
    }
    ;

LogicalANDExpression
    = a:InclusiveORExpression b:(ANDAND InclusiveORExpression)* {
      return buildRecursiveBinop(a, b);
    }
    ;

LogicalORExpression
    = a:LogicalANDExpression b:(OROR LogicalANDExpression)* {
      return buildRecursiveBinop(a, b);
    }
    ;

ConditionalExpression
    = a:LogicalORExpression b:(QUERY Expression COLON LogicalORExpression)* {
      var ret = a;
      for (var i=0;i<b.length;i++) {
        ret = addPositionInfo({type:'ConditionalExpression', cond:ret, t:b[i][1], f:b[i][3]});
      }
      return ret;
    }
    ;

AssignmentExpression
    = a:UnaryExpression b:AssignmentOperator c:AssignmentExpression {
      return addPositionInfo({type:'BinOpExpression', op:b, left:a, right:c});
    }
    / ConditionalExpression
    ;

AssignmentOperator
    = EQU
    / STAREQU
    / DIVEQU
    / MODEQU
    / PLUSEQU
    / MINUSEQU
    / LEFTEQU
    / RIGHTEQU
    / ANDEQU
    / HATEQU
    / OREQU
    ;

Expression
    = a:AssignmentExpression b:(COMMA AssignmentExpression)* {
      return buildRecursiveBinop(a, b);
    }
    ;

ConstantExpression
    = ConditionalExpression
    ;


//-------------------------------------------------------------------------
//  A.1.1  Lexical elements
//  Tokens are: Keyword, Identifier, Constant, StringLiteral, Punctuator.
//  Tokens are separated by Spacing.
//-------------------------------------------------------------------------

Spacing
    = a:( WhiteSpace
      / LongComment
      / LineComment
      )*{
        return a.join('');
      };

WhiteSpace  = a:[ \n\r\t\u000B\u000C] {return a;}; // 7.4.1.10

LongComment = "/*" a:(!"*/"_)* "*/" {return a.join('');};   // 6.4.9

LineComment = "//" a:(!"\n" _)*  {return a.join('');};     // 6.4.9


//-------------------------------------------------------------------------
//  A.1.2  Keywords
//-------------------------------------------------------------------------

AUTO      = a:"auto"          !IdChar Spacing {return a;};
BREAK     = a:"break"         !IdChar Spacing {return a;};
CASE      = a:"case"          !IdChar Spacing {return a;};
CHAR      = a:"char"          !IdChar Spacing {return a;};
CONST     = a:"const"         !IdChar Spacing {return a;};
CONTINUE  = a:"continue"      !IdChar Spacing {return a;};
DEFAULT   = a:"default"       !IdChar Spacing {return a;};
DOUBLE    = a:"double"        !IdChar Spacing {return a;};
DO        = a:"do"            !IdChar Spacing {return a;};
ELSE      = a:"else"          !IdChar Spacing {return a;};
ENUM      = a:"enum"          !IdChar Spacing {return a;};
EXTERN    = a:"extern"        !IdChar Spacing {return a;};
FLOAT     = a:"float"         !IdChar Spacing {return a;};
FOR       = a:"for"           !IdChar Spacing {return a;};
GOTO      = a:"goto"          !IdChar Spacing {return a;};
IF        = a:"if"            !IdChar Spacing {return a;};
INT       = a:"int"           !IdChar Spacing {return a;};
INLINE    = a:"inline"        !IdChar Spacing {return a;};
LONG      = a:"long"          !IdChar Spacing {return a;};
REGISTER  = a:"register"      !IdChar Spacing {return a;};
RESTRICT  = a:"restrict"      !IdChar Spacing {return a;};
RETURN    = a:"return"        !IdChar Spacing {return a;};
SHORT     = a:"short"         !IdChar Spacing {return a;};
SIGNED    = a:"signed"        !IdChar Spacing {return a;};
SIZEOF    = a:"sizeof"        !IdChar Spacing {return a;};
STATIC    = a:"static"        !IdChar Spacing {return a;};
STRUCT    = a:"struct"        !IdChar Spacing {return a;};
SWITCH    = a:"switch"        !IdChar Spacing {return a;};
TYPEDEF   = a:"typedef"       !IdChar Spacing {return a;};
UNION     = a:"union"         !IdChar Spacing {return a;};
UNSIGNED  = a:"unsigned"      !IdChar Spacing {return a;};
VOID      = a:"void"          !IdChar Spacing {return a;};
VOLATILE  = a:"volatile"      !IdChar Spacing {return a;};
WHILE     = a:"while"         !IdChar Spacing {return a;};
BOOL      = a:"_Bool"         !IdChar Spacing {return a;};
COMPLEX   = a:"_Complex"      !IdChar Spacing {return a;};
STDCALL   = a:"_stdcall"      !IdChar Spacing {return a;};
DECLSPEC  = a:"__declspec"    !IdChar Spacing {return a;};
ATTRIBUTE = a:"__attribute__" !IdChar Spacing {return a;};
NAMESPACE = a:"namespace"     !IdChar Spacing {return a;};
USING     = a:"using"         !IdChar Spacing {return a;};
TRUE      = a:"true"          !IdChar Spacing {return a;};
FALSE      = a:"false"          !IdChar Spacing {return a;};

Keyword
    = ( "auto"
      / "break"
      / "case"
      / "char"
      / "const"
      / "continue"
      / "default"
      / "double"
      / "do"
      / "else"
      / "enum"
      / "extern"
      / "float"
      / "for"
      / "goto"
      / "if"
      / "int"
      / "inline"
      / "long"
      / "register"
      / "restrict"
      / "return"
      / "short"
      / "signed"
      / "sizeof"
      / "static"
      / "struct"
      / "switch"
      / "typedef"
      / "union"
      / "unsigned"
      / "void"
      / "volatile"
      / "while"
      / "_Bool"
      / "_Complex"
      / "_Imaginary"
      / "_stdcall"
      / "__declspec"
      / "__attribute__"
      / "namespace"
      / "using"
      / "true"
      / "false"
      )
    !IdChar ;


//-------------------------------------------------------------------------
//  A.1.3  Identifiers
//  The standard does not explicitly state that identifiers must be
//  distinct from keywords, but it seems so.
//-------------------------------------------------------------------------

ScopedIdentifier
    = a:SCOPEOP? b:(a:Identifier SCOPEOP {return a;})* c:Identifier {
      var scope = a ? "global" : null;

      for (var i = 0;i<b.length;i++) {
        scope = addPositionInfo({type: "ScopedIdentifier", scope: scope, Identifier: b[i]})
      }

      return addPositionInfo({type: "ScopedIdentifier", scope:scope, Identifier: c});
    }
    ;

Identifier = !Keyword a:IdNondigit b:IdChar* Spacing {return a+b.join('')} ;

IdNondigit
    = [a-z] / [A-Z] / [_]
    / UniversalCharacter
    ;

IdChar
    = [a-z] / [A-Z] / [0-9] / [_]
    / UniversalCharacter
    ;


//-------------------------------------------------------------------------
//  A.1.4  Universal character names
//-------------------------------------------------------------------------

UniversalCharacter
    = "\\u" a:HexQuad { return eval('"\\u' + a.join('') + '"'); }
    / "\\U" a:HexQuad b:HexQuad { return eval('"\\U' + a.join('') + b.join('') + '"'); }
    ;

HexQuad = HexDigit HexDigit HexDigit HexDigit ;


//-------------------------------------------------------------------------
//  A.1.5  Constants
//-------------------------------------------------------------------------

Constant
    = a:(FloatConstant 
    / IntegerConstant 
    / EnumerationConstant 
    / CharacterConstant
    / BooleanConstant) {return a;}
    ;

BooleanConstant
    = a:(TRUE / FALSE) {
      return addPositionInfo({type:'BooleanConstant', value:a});
    }

IntegerConstant
    = a:( BinaryConstant
      / DecimalConstant
      / HexConstant
      / OctalConstant
      )
    IntegerSuffix? Spacing {return a;}
    ;

DecimalConstant = a:[1-9] b:[0-9]* {return addPositionInfo({type:'DecimalConstant', value:a + b.join("")});};

OctalConstant   = "0" a:[0-7]* {
  if (a.length>0)
    return addPositionInfo({type:'OctalConstant', value:a.join("")});
  else
    return addPositionInfo({type:'OctalConstant', value:'0'});
};

HexConstant     = HexPrefix a:HexDigit+ {return addPositionInfo({type:'HexConstant', value:a.join("")});};

HexPrefix       = "0x" / "0X" ;

HexDigit        = [a-f] / [A-F] / [0-9] ;

BinaryPrefix    = "0b" ;

BinaryDigit     = [0-1] ;

BinaryConstant  = BinaryPrefix a:BinaryDigit+ {return addPositionInfo({type:'BinaryConstant', value:a.join("")});};

IntegerSuffix
    = [uU] Lsuffix?
    / Lsuffix [uU]?
    ;

Lsuffix
    = "ll"
    / "LL"
    / [lL]
    ;

FloatConstant
    = a:( DecimalFloatConstant
      / HexFloatConstant
      )
    b:FloatSuffix? Spacing {
      if (b)
        return addPositionInfo({type:'FloatConstant', Expression:a});
      else
        return a;
    }
    ;

DecimalFloatConstant
    = a:Fraction b:Exponent? {return addPositionInfo({type:'DecimalFloatConstant', value:a+b||''});}
    / a:[0-9]+ b:Exponent {return addPositionInfo({type:'DecimalFloatConstant', value:a.join('')+b});}
    ;

HexFloatConstant
    = a:HexPrefix b:HexFraction c:BinaryExponent? {return addPositionInfo({type:'HexFloatConstant', value:a+b+c||''});}
    / a:HexPrefix b:HexDigit+ c:BinaryExponent {return addPositionInfo({type:'HexFloatConstant', value:a+b.join('')+c});}
    ;

Fraction
    = a:[0-9]* "." b:[0-9]+ {return a.join('')+'.'+b.join('');}
    / a:[0-9]+ "." {return a.join('');}
    ;

HexFraction
    = a:HexDigit* "." b:HexDigit+ {return a.join('')+'.'+b.join('');}
    / a:HexDigit+ "." {return a.join('')+'.';}
    ;

Exponent = a:[eE] b:[+\-]? c:[0-9]+ {return a+(b||"")+c.join('');};

BinaryExponent = a:[pP][+\-]? b:[0-9]+ {return a+b.join('');};

FloatSuffix = a:[flFL] {return a;};

EnumerationConstant = a:Identifier {return addPositionInfo({type:'EnumerationConstant', Identifier:a});};

CharacterConstant = "L"? "'" a:Char* "'" Spacing {
  return addPositionInfo({type:'CharacterConstant', Char: a});
};

Char = a:Escape {return a;} / !['\n\\] a:_ {return a;};

Escape
    = a:(SimpleEscape
    / OctalEscape
    / HexEscape
    / UniversalCharacter) {return a;}
    ;

SimpleEscape = a:"\\" b:['\"?\\abfnrtv] {return eval('"' + a + b +'"');};
OctalEscape  = a:"\\" b:[0-7] c:[0-7]? d:[0-7]? {
  var ret = "\"";
  ret += a;
  ret += b;
  if (c)
    ret += c;
  if (d)
    ret += d;
  ret += "\"";
  return eval(ret);
};
HexEscape    = a:"\\x" b:HexDigit+ {return eval('"'+a+b.join('')+'"');};


//-------------------------------------------------------------------------
//  A.1.6  String Literals
//-------------------------------------------------------------------------

StringLiteral = a:("L" / "u8" / "u" / "U")? b:(RawStringLiteral / EscapedStringLiteral) {
  return addPositionInfo({type: 'StringLiteral', prefix:a, value:b});
};

RawStringLiteral = "R" a:(["] a:RawStringChar* ["] Spacing {return a.join('');})+ {
  return a.join('');
};

EscapedStringLiteral = a:(["] a:StringChar* ["] Spacing {return a.join('');})+ {
  return a.join('');
};

RawStringChar = ![\"\n] a:_ {return a;};

StringChar = Escape / ![\"\n\\] a:_ {return a;};


//-------------------------------------------------------------------------
//  A.1.7  Punctuators
//-------------------------------------------------------------------------

LBRK       =  a:"["         Spacing {return a;};
RBRK       =  a:"]"         Spacing {return a;};
LPAR       =  a:"("         Spacing {return a;};
RPAR       =  a:")"         Spacing {return a;};
LWING      =  a:"{"         Spacing {return a;};
RWING      =  a:"}"         Spacing {return a;};
DOT        =  a:"."         Spacing {return a;};
PTR        =  a:"->"        Spacing {return a;};
INC        =  a:"++"        Spacing {return a;};
DEC        =  a:"--"        Spacing {return a;};
AND        =  a:"&"  ![&]   Spacing {return a;};
STAR       =  a:"*"  ![=]   Spacing {return a;};
PLUS       =  a:"+"  ![+=]  Spacing {return a;};
MINUS      =  a:"-"  ![\-=>]Spacing {return a;};
TILDA      =  a:"~"         Spacing {return a;};
BANG       =  a:"!"  ![=]   Spacing {return a;};
DIV        =  a:"/"  ![=]   Spacing {return a;};
MOD        =  a:"%"  ![=>]  Spacing {return a;};
LEFT       =  a:"<<" ![=]   Spacing {return a;};
RIGHT      =  a:">>" ![=]   Spacing {return a;};
LT         =  a:"<"  ![=]   Spacing {return a;};
GT         =  a:">"  ![=]   Spacing {return a;};
LE         =  a:"<="        Spacing {return a;};
GE         =  a:">="        Spacing {return a;};
EQUEQU     =  a:"=="        Spacing {return a;};
BANGEQU    =  a:"!="        Spacing {return a;};
HAT        =  a:"^"  ![=]   Spacing {return a;};
OR         =  a:"|"  ![=]   Spacing {return a;};
ANDAND     =  a:"&&"        Spacing {return a;};
OROR       =  a:"||"        Spacing {return a;};
QUERY      =  a:"?"         Spacing {return a;};
COLON      =  a:":"  ![>]   Spacing {return a;};
SEMI       =  a:";"         Spacing {return a;};
ELLIPSIS   =  a:"..."       Spacing {return a;};
EQU        =  a:"="  !"="   Spacing {return a;};
STAREQU    =  a:"*="        Spacing {return a;};
DIVEQU     =  a:"/="        Spacing {return a;};
MODEQU     =  a:"%="        Spacing {return a;};
PLUSEQU    =  a:"+="        Spacing {return a;};
MINUSEQU   =  a:"-="        Spacing {return a;};
LEFTEQU    =  a:"<<="       Spacing {return a;};
RIGHTEQU   =  a:">>="       Spacing {return a;};
ANDEQU     =  a:"&="        Spacing {return a;};
HATEQU     =  a:"^="        Spacing {return a;};
OREQU      =  a:"|="        Spacing {return a;};
COMMA      =  a:","         Spacing {return a;};
SCOPEOP    =  a:"::"        Spacing {return a;};

EOT        =  !_    ;

_          =  . ;