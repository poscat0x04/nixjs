/// Codegen:
/// The function `codegen` (and `codegen_helper`) compiles a Nix AST into a JavaScript expression that evaluates
/// to the WHNF of the Nix code.
use std::fmt::{write, Write};

use ast::{AstNode, HasBindings};
use syntax::ast;

// Get the identifier to the runtime method
macro_rules! rt {
    ($method:expr) => {
        concat!("__12345_runtime.", $method)
    };
}

macro_rules! thunk {
    ($e:expr, $x: stmt) => {{
        $e.push_str(concat!(rt!("newThunk"), "(() => "));
        $x
        $e.push_str(")");
    }};
}

pub fn codegen(expr: &ast::Expr) -> String {
    let mut code = String::new();
    codegen_helper(expr, &mut code);
    code
}

fn apply(apply: &ast::Apply, buf: &mut String) {
    let f = apply.function().unwrap();
    let x = apply.argument().unwrap();
    codegen_helper(&f, buf);
    buf.push_str(".call(null,");
    thunk!(buf, codegen_helper(&x, buf));
    buf.push(')');
}

fn assert(assert: &ast::Assert, buf: &mut String) {
    buf.push_str("(() => {assert(");
    codegen_helper(&assert.condition().unwrap(), buf);
    buf.push_str(");return ");
    codegen_helper(&assert.body().unwrap(), buf);
    buf.push_str("})()");
}

fn attr(attr: &ast::Attr, buf: &mut String) {
    match attr {
        ast::Attr::Dynamic(dynamic) => {
            codegen_helper(&dynamic.expr().unwrap(), buf);
        }
        ast::Attr::String(string_) => {
            string(string_, buf);
        }
        ast::Attr::Name(name) => {
            write!(buf, "\"{}\"", name.token().unwrap().text()).unwrap();
        }
    }
}

fn attrset(attrset: &ast::AttrSet, buf: &mut String) {
    if attrset.let_token().is_some() {
        panic!("let attrset not supported")
    }
    let mut assign_attr = |name: &str, expr: &ast::Expr| {
        write!(buf, "self.{} = ", name).unwrap();
        codegen_helper(expr, buf);
        buf.push(';');
        if attrset.rec_token().is_some() {
            write!(buf, "let {} = self.{};", name, name).unwrap();
        }
    };
    buf.push_str("(new function() {");
    for binding in attrset.bindings() {
        match binding {
            ast::Binding::Inherit(inherit) => {
                for attr in inherit.attrs() {
                    match attr {
                        // dynamic and string attributes not allowed in inherit
                        ast::Attr::Dynamic(dynamic) => {
                            panic!("dynamic attribute not allowed in inherit")
                        }
                        ast::Attr::String(string) => {
                            panic!("string attribute not allowed in inherit")
                        }

                        ast::Attr::Name(name) => {
                            todo!()
                        }
                    }
                }
            }
            ast::Binding::AttrpathValue(attrpath_value) => {
                let path = attrpath_value
                    .attrpath()
                    .unwrap()
                    .attrs()
                    .collect::<Vec<_>>();
                let value = attrpath_value.value().unwrap();
                if path.is_empty() {
                    // TODO: better error message
                    panic!("impossible")
                }
                todo!();
            }
        }
    }
    buf.push_str("})");
}

fn binary_op(bin_op: &ast::BinaryOp, buf: &mut String) {
    macro_rules! delegate_to_runtime {
        ($method:expr) => {{
            write!(buf, "{}(", rt!($method)).unwrap();
            codegen_helper(&bin_op.lhs().unwrap(), buf);
            buf.push(',');
            codegen_helper(&bin_op.rhs().unwrap(), buf);
            buf.push(')');
        }};
    }
    match bin_op.op_kind().unwrap() {
        ast::BinaryOpKind::Imply => {
            delegate_to_runtime!("implies")
        }
        ast::BinaryOpKind::Or => {
            delegate_to_runtime!("or")
        }
        ast::BinaryOpKind::And => {
            delegate_to_runtime!("and")
        }
        ast::BinaryOpKind::Equal => {
            delegate_to_runtime!("equals")
        }
        ast::BinaryOpKind::NotEqual => {
            delegate_to_runtime!("notEquals")
        }
        ast::BinaryOpKind::Less => {
            delegate_to_runtime!("lessThan")
        }
        ast::BinaryOpKind::Greater => {
            delegate_to_runtime!("greaterThan")
        }
        ast::BinaryOpKind::LessEqual => {
            delegate_to_runtime!("lessThanEqual")
        }
        ast::BinaryOpKind::GreaterEqual => {
            delegate_to_runtime!("greaterThanEqual")
        }
        ast::BinaryOpKind::Update => {
            delegate_to_runtime!("update")
        }
        ast::BinaryOpKind::Concat => {
            delegate_to_runtime!("concat")
        }
        ast::BinaryOpKind::Add => {
            delegate_to_runtime!("add")
        }
        ast::BinaryOpKind::Sub => {
            delegate_to_runtime!("sub")
        }
        ast::BinaryOpKind::Mul => {
            delegate_to_runtime!("mul")
        }
        ast::BinaryOpKind::Div => {
            delegate_to_runtime!("div")
        }
    }
}

fn has_attr(has_attr: &ast::HasAttr, buf: &mut String) {
    todo!()
}

fn if_then_else(if_then_else: &ast::IfThenElse, buf: &mut String) {
    buf.push_str("(() => {if (");
    codegen_helper(&if_then_else.condition().unwrap(), buf);
    buf.push_str(") { return ");
    codegen_helper(&if_then_else.then_body().unwrap(), buf);
    buf.push_str("} else { return ");
    codegen_helper(&if_then_else.else_body().unwrap(), buf);
    buf.push_str("}})()");
}

fn indent_string(indent_string: &ast::IndentString, buf: &mut String) {
    todo!()
}

fn lambda(lambda: &ast::Lambda, buf: &mut String) {
    todo!()
}

fn let_in(let_in: &ast::LetIn, buf: &mut String) {
    todo!()
}

fn list(list: &ast::List, buf: &mut String) {
    buf.push('[');
    for e in list.elements() {
        thunk!(buf, codegen_helper(&e, buf));
        buf.push(',');
    }
    buf.push(']');
}

fn literal(lit: &ast::Literal, buf: &mut String) {
    match lit.kind().unwrap() {
        ast::LiteralKind::Int => write!(buf, "{}n", lit.token().unwrap().text()).unwrap(),
        ast::LiteralKind::Float => write!(buf, "{}", lit.token().unwrap().text()).unwrap(),
        ast::LiteralKind::Uri => write!(buf, "\"{}\"", lit.token().unwrap().text()).unwrap(),
        ast::LiteralKind::Path => todo!(),
        ast::LiteralKind::SearchPath => todo!(),
    }
}

fn path_interpolation(path_interpolation: &ast::PathInterpolation, buf: &mut String) {
    todo!()
}

fn reference(ref_: &ast::Ref, buf: &mut String) {
    todo!()
}

fn select(select: &ast::Select, buf: &mut String) {
    todo!()
}

fn string(str: &ast::String, buf: &mut String) {
    todo!()
}

fn unary_op(unary_op: &ast::UnaryOp, buf: &mut String) {
    todo!()
}

fn with(with: &ast::With, buf: &mut String) {
    todo!()
}

fn codegen_helper(expr: &ast::Expr, buf: &mut String) {
    match expr {
        ast::Expr::Apply(apply_) => apply(apply_, buf),

        ast::Expr::Assert(assert_) => assert(assert_, buf),

        ast::Expr::AttrSet(attrset_) => attrset(attrset_, buf),

        ast::Expr::BinaryOp(bin_op) => binary_op(bin_op, buf),
        ast::Expr::HasAttr(has_attr_) => has_attr(has_attr_, buf),
        ast::Expr::IfThenElse(if_then_else_) => if_then_else(if_then_else_, buf),
        ast::Expr::IndentString(indent_string_) => indent_string(indent_string_, buf),
        ast::Expr::Lambda(lambda_) => lambda(lambda_, buf),
        ast::Expr::LetIn(let_in_) => let_in(let_in_, buf),
        ast::Expr::List(list_) => list(list_, buf),

        ast::Expr::Literal(lit) => literal(lit, buf),
        ast::Expr::Paren(paren) => codegen_helper(&paren.expr().unwrap(), buf),
        ast::Expr::PathInterpolation(path_interpolation_) => {
            path_interpolation(path_interpolation_, buf)
        }
        ast::Expr::Ref(ref_) => reference(ref_, buf),
        ast::Expr::Select(select_) => select(select_, buf),
        ast::Expr::String(string_) => string(string_, buf),
        ast::Expr::UnaryOp(unary_op_) => unary_op(unary_op_, buf),
        ast::Expr::With(with_) => with(with_, buf),
    }
}

#[cfg(test)]
mod test {
    #[test]
    fn test() {
        println!(rt!("abc"))
    }
}
