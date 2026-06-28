/**
 * @file Tree-sitter grammar for the Shimmer programming language
 * @author Jeff Williams <jeffw@wherethebitsroam.com>
 * @license MIT
 */

/// <reference types="tree-sitter-cli/dsl" />
// @ts-check

const PREC = {
  CLOSURE: 0,
  ASSIGN: 1,
  OR: 2,
  AND: 3,
  EQUAL: 4,
  COMPARE: 5,
  RANGE: 6,
  ADD: 7,
  MULTIPLY: 8,
  UNARY: 9,
  CALL: 10,
  FIELD: 11,
};

export default grammar({
  name: "shimmer",

  extras: ($) => [/\s/, $.line_comment, $.block_comment],

  word: ($) => $.identifier,

  conflicts: ($) => [
    // obj.field vs obj.method()
    [$.method_call_expression, $.field_expression],
    // identifier { ... } could be struct literal or identifier followed by block
    [$.identifier_expression, $.struct_expression],
    // block-bodied expression at end of block could be statement or final value
    [$.block_expression_statement, $._expression],
  ],

  rules: {
    source_file: ($) => repeat($._declaration),

    // ==================== Declarations ====================

    _declaration: ($) =>
      choice(
        $.function_declaration,
        $.type_declaration,
        $.impl_declaration,
        $.trait_declaration,
      ),

    function_declaration: ($) =>
      seq(
        "fn",
        field("name", $.identifier),
        optional(field("type_parameters", $.type_parameter_list)),
        field("parameters", $.parameter_list),
        optional(seq("->", field("return_type", $._type))),
        optional(field("where_clause", $.where_clause)),
        field("body", $.block),
      ),

    type_declaration: ($) =>
      choice($.product_type_declaration, $.sum_type_declaration),

    product_type_declaration: ($) =>
      seq(
        "type",
        field("name", $.identifier),
        optional(field("type_parameters", $.type_parameter_list)),
        optional(field("where_clause", $.where_clause)),
        "=",
        "{",
        sepBy(",", $.field_declaration),
        optional(","),
        "}",
      ),

    sum_type_declaration: ($) =>
      seq(
        "type",
        field("name", $.identifier),
        optional(field("type_parameters", $.type_parameter_list)),
        optional(field("where_clause", $.where_clause)),
        "=",
        optional("|"),
        sepBy1("|", $.variant),
        ";",
      ),

    variant: ($) =>
      seq(
        field("name", $.identifier),
        optional(seq("(", sepBy(",", $._type), optional(","), ")")),
      ),

    field_declaration: ($) =>
      seq(field("name", $.identifier), ":", field("type", $._type)),

    impl_declaration: ($) =>
      seq(
        "impl",
        optional(field("type_parameters", $.type_parameter_list)),
        optional(seq(field("trait", $.identifier), "for")),
        field("target", $.identifier),
        optional(field("target_type_arguments", $.type_argument_list)),
        optional(field("where_clause", $.where_clause)),
        "{",
        repeat($.function_declaration),
        "}",
      ),

    trait_declaration: ($) =>
      seq(
        "trait",
        field("name", $.identifier),
        "{",
        repeat($.trait_method),
        "}",
      ),

    trait_method: ($) =>
      seq(
        "fn",
        field("name", $.identifier),
        field("parameters", $.parameter_list),
        optional(seq("->", field("return_type", $._type))),
        ";",
      ),

    // ==================== Parameters ====================

    parameter_list: ($) =>
      seq("(", sepBy(",", $._parameter), optional(","), ")"),

    _parameter: ($) => choice($.self_parameter, $.parameter),

    self_parameter: ($) => seq(optional("mut"), "self"),

    parameter: ($) =>
      seq(field("name", $.identifier), ":", field("type", $._type)),

    // ==================== Type Parameters & Arguments ====================

    type_parameter_list: ($) =>
      seq("<", sepBy1(",", $.type_parameter), optional(","), ">"),

    type_parameter: ($) =>
      seq(
        field("name", $.identifier),
        optional(seq(":", field("bounds", $.type_bound_list))),
      ),

    type_bound_list: ($) => sepBy1("+", $.type_bound),

    type_bound: ($) => sepBy1("::", $.identifier),

    where_clause: ($) =>
      seq("where", sepBy1(",", $.where_predicate), optional(",")),

    where_predicate: ($) =>
      seq(
        field("type_parameter", $.identifier),
        ":",
        field("bounds", $.type_bound_list),
      ),

    type_argument_list: ($) =>
      seq("<", sepBy1(",", $._type), optional(","), ">"),

    // ==================== Types ====================

    _type: ($) =>
      choice($.simple_type, $.generic_type, $.tuple_type, $.unit_type, $.function_type),

    simple_type: ($) => sepBy1("::", $.identifier),

    generic_type: ($) =>
      seq(
        field("name", sepBy1("::", $.identifier)),
        field("type_arguments", $.type_argument_list),
      ),

    tuple_type: ($) => seq("(", sepBy1(",", $._type), optional(","), ")"),

    unit_type: (_$) => seq("(", ")"),

    function_type: ($) =>
      seq(
        "fn",
        "(",
        sepBy(",", $._type),
        optional(","),
        ")",
        "->",
        field("return_type", $._type),
      ),

    // ==================== Statements ====================

    _statement: ($) =>
      choice(
        $.let_statement,
        $.return_statement,
        $.block_expression_statement,
        $.expression_statement,
      ),

    // Block-bodied expressions don't need semicolons when used as statements
    block_expression_statement: ($) =>
      choice(
        $.if_expression,
        $.while_expression,
        $.for_expression,
        $.loop_expression,
        $.match_expression,
        $.block,
      ),

    let_statement: ($) =>
      seq(
        "let",
        optional("mut"),
        field("name", $.identifier),
        optional(seq(":", field("type", $._type))),
        optional(seq("=", field("value", $._expression))),
        ";",
      ),

    return_statement: ($) =>
      seq("return", optional(field("value", $._expression)), ";"),

    expression_statement: ($) => seq($._expression, ";"),

    // ==================== Expressions ====================

    _expression: ($) =>
      choice(
        $.identifier_expression,
        $.path_expression,
        $.literal,
        $.string_literal,
        $.interpolated_string,
        $.boolean_literal,
        $.unit_expression,
        $.tuple_expression,
        $.unary_expression,
        $.binary_expression,
        $.parenthesized_expression,
        $.call_expression,
        $.method_call_expression,
        $.field_expression,
        $.tuple_index_expression,
        $.struct_expression,
        $.if_expression,
        $.while_expression,
        $.for_expression,
        $.loop_expression,
        $.match_expression,
        $.block,
        $.break_expression,
        $.continue_expression,
        $.closure_expression,
      ),

    identifier_expression: ($) => prec(-1, $.identifier),

    path_expression: ($) =>
      prec(
        1,
        seq(
          $.identifier,
          repeat1(seq("::", $.identifier)),
          optional(seq("::", $.type_argument_list)),
        ),
      ),

    literal: ($) => choice($.integer_literal, $.float_literal),

    integer_literal: (_$) => /[0-9]+/,

    float_literal: (_$) => /[0-9]+\.[0-9]+/,

    string_literal: (_$) => seq('"', repeat(choice(/[^"\\]+/, /\\./)), '"'),

    interpolated_string: ($) =>
      seq(
        '$"',
        repeat(
          choice($.interpolated_fragment, $.interpolation, $.escape_sequence),
        ),
        '"',
      ),

    interpolated_fragment: (_$) => /[^"\\{}]+/,

    interpolation: ($) => seq("{", field("expression", $._expression), "}"),

    escape_sequence: (_$) => choice(/\\./, "{{", "}}"),

    boolean_literal: (_$) => choice("true", "false"),

    unit_expression: (_$) => prec(1, seq("(", ")")),

    tuple_expression: ($) =>
      seq(
        "(",
        $._expression,
        ",",
        sepBy(",", $._expression),
        optional(","),
        ")",
      ),

    parenthesized_expression: ($) => seq("(", $._expression, ")"),

    unary_expression: ($) =>
      prec(
        PREC.UNARY,
        seq(
          field("operator", choice("-", "!")),
          field("operand", $._expression),
        ),
      ),

    binary_expression: ($) => {
      /** @type {[number, RuleOrLiteral, string][]} */
      const table = [
        [PREC.ASSIGN, choice("=", "+=", "-=", "*=", "/=", "%="), "right"],
        [PREC.OR, "||", "left"],
        [PREC.AND, "&&", "left"],
        [PREC.EQUAL, choice("==", "!="), "left"],
        [PREC.COMPARE, choice("<", ">", "<=", ">="), "left"],
        [PREC.RANGE, choice("..", "..="), "left"],
        [PREC.ADD, choice("+", "-"), "left"],
        [PREC.MULTIPLY, choice("*", "/", "%"), "left"],
      ];

      return choice(
        ...table.map(([prec_val, op, assoc]) => {
          const rule = seq(
            field("left", $._expression),
            field("operator", op),
            field("right", $._expression),
          );
          return assoc === "right"
            ? prec.right(prec_val, rule)
            : prec.left(prec_val, rule);
        }),
      );
    },

    call_expression: ($) =>
      prec(
        PREC.CALL,
        seq(
          field("function", $._expression),
          field("arguments", $.argument_list),
        ),
      ),

    method_call_expression: ($) =>
      prec(
        PREC.FIELD,
        seq(
          field("receiver", $._expression),
          ".",
          field("method", $.identifier),
          field("arguments", $.argument_list),
        ),
      ),

    field_expression: ($) =>
      prec(
        PREC.FIELD,
        seq(
          field("receiver", $._expression),
          ".",
          field("field", $.identifier),
        ),
      ),

    tuple_index_expression: ($) =>
      prec(
        PREC.FIELD,
        seq(
          field("receiver", $._expression),
          ".",
          field("index", $.integer_literal),
        ),
      ),

    argument_list: ($) =>
      seq("(", sepBy(",", $._expression), optional(","), ")"),

    struct_expression: ($) =>
      prec(
        -1,
        seq(
          field("name", choice($.identifier, $.path_expression)),
          "{",
          sepBy(",", $.field_initializer),
          optional(","),
          "}",
        ),
      ),

    field_initializer: ($) =>
      seq(field("name", $.identifier), ":", field("value", $._expression)),

    if_expression: ($) =>
      prec.right(
        seq(
          "if",
          field("condition", $._expression),
          field("consequence", $.block),
          optional(
            seq("else", field("alternative", choice($.block, $.if_expression))),
          ),
        ),
      ),

    while_expression: ($) =>
      seq("while", field("condition", $._expression), field("body", $.block)),

    for_expression: ($) =>
      seq(
        "for",
        field("variable", $.identifier),
        "in",
        field("iterator", $._expression),
        field("body", $.block),
      ),

    loop_expression: ($) => seq("loop", field("body", $.block)),

    match_expression: ($) =>
      seq(
        "match",
        field("scrutinee", $._expression),
        "{",
        sepBy(",", $.match_arm),
        optional(","),
        "}",
      ),

    match_arm: ($) =>
      seq(
        field("pattern", $._pattern),
        optional(seq("if", field("guard", $._expression))),
        "=>",
        field("value", $._expression),
      ),

    block: ($) =>
      seq(
        "{",
        repeat($._statement),
        optional(field("value", $._expression)),
        "}",
      ),

    closure_expression: ($) =>
      prec.right(
        PREC.CLOSURE,
        seq(
          field("parameters", $.closure_parameters),
          "->",
          field("body", $._expression),
        ),
      ),

    closure_parameters: ($) =>
      choice(
        $.identifier,                                                    // x -> ...
        seq("(", ")"),                                                   // () -> ...
        seq("(", sepBy1(",", $.identifier), optional(","), ")"),         // (x, y) -> ...
      ),

    break_expression: (_$) => "break",

    continue_expression: (_$) => "continue",

    // ==================== Patterns ====================

    _pattern: ($) =>
      choice(
        $.or_pattern,
        $.wildcard_pattern,
        $.literal_pattern,
        $.identifier_pattern,
        $.path_pattern,
        $.tuple_struct_pattern,
      ),

    wildcard_pattern: (_$) => "_",

    identifier_pattern: ($) => $.identifier,

    path_pattern: ($) => seq($.identifier, "::", $.identifier),

    tuple_struct_pattern: ($) =>
      seq(
        $.identifier,
        "::",
        $.identifier,
        "(",
        sepBy(",", $._pattern),
        optional(","),
        ")",
      ),

    or_pattern: ($) =>
      seq(
        optional("|"),
        $._single_pattern,
        repeat1(seq("|", $._single_pattern)),
      ),

    _single_pattern: ($) =>
      choice(
        $.wildcard_pattern,
        $.literal_pattern,
        $.identifier_pattern,
        $.path_pattern,
        $.tuple_struct_pattern,
      ),

    literal_pattern: ($) =>
      choice(
        $.integer_literal,
        $.float_literal,
        $.string_literal,
        $.boolean_literal,
      ),

    // ==================== Comments ====================

    line_comment: (_$) => token(seq("//", /.*/)),

    block_comment: (_$) => token(seq("/*", /[^*]*\*+([^/*][^*]*\*+)*/, "/")),

    // ==================== Identifiers ====================

    identifier: (_$) => /[a-zA-Z_][a-zA-Z0-9_]*/,
  },
});

/**
 * Comma-separated list with zero or more elements.
 * @param {string} sep
 * @param {RuleOrLiteral} rule
 * @returns {SeqRule}
 */
function sepBy(sep, rule) {
  return seq(optional(seq(rule, repeat(seq(sep, rule)))));
}

/**
 * Comma-separated list with one or more elements.
 * @param {string} sep
 * @param {RuleOrLiteral} rule
 * @returns {SeqRule}
 */
function sepBy1(sep, rule) {
  return seq(rule, repeat(seq(sep, rule)));
}
