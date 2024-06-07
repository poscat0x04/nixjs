use syntax::ast;
use syntax::ast::AstNode;
use syntax::parser;

mod codegen;

fn main() {
    let l = parser::parse_file("1")
        .syntax_node()
        .descendants()
        .find_map(ast::Literal::cast)
        .unwrap();
    println!("{}", l.token().unwrap().text());
}
