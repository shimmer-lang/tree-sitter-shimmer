; Keywords
[
  "fn"
  "let"
  "type"
  "impl"
  "trait"
  "use"
  "as"
  "return"
  "if"
  "else"
  "while"
  "for"
  "in"
  "loop"
  "match"
  "mut"
  "where"
] @keyword

; break/continue are anonymous nodes, match via parent
(break_expression) @keyword
(continue_expression) @keyword

; self
(self_parameter) @variable.special

; true/false
(boolean_literal) @boolean

; Wildcard pattern
(wildcard_pattern) @variable.special

; Operators
; The "+" in type bounds (A + B) is also matched here
[
  "+"
  "-"
  "*"
  "/"
  "%"
  "="
  "+="
  "-="
  "*="
  "/="
  "%="
  "=="
  "!="
  "<"
  ">"
  "<="
  ">="
  "&&"
  "||"
  "!"
  ".."
  "..="
] @operator

; Punctuation
[
  "("
  ")"
  "{"
  "}"
] @punctuation.bracket

[
  ","
  ";"
  ":"
  "::"
  "->"
  "=>"
  "."
  "|"
] @punctuation.delimiter

; Literals
(integer_literal) @number
(float_literal) @number
(string_literal) @string

; Comments
(line_comment) @comment
(block_comment) @comment

; Function declarations
(function_declaration
  name: (identifier) @function)

; Function calls
(call_expression
  function: (identifier_expression
    (identifier) @function))

; Method calls
(method_call_expression
  method: (identifier) @function)

; Type declarations
(product_type_declaration
  name: (identifier) @type)

(sum_type_declaration
  name: (identifier) @type)

; Type references
(simple_type
  (identifier) @type)

(generic_type
  name: (identifier) @type)

; Impl target
(impl_declaration
  target: (identifier) @type)

; Impl trait
(impl_declaration
  trait: (identifier) @type)

; Trait declarations
(trait_declaration
  name: (identifier) @type)

; Trait method names
(trait_method
  name: (identifier) @function)

; Type parameters
(type_parameter
  name: (identifier) @type)

; Trait bounds
(type_bound
  (identifier) @type)

; Variant names
(variant
  name: (identifier) @variant)

; Path expressions (Type::method)
(path_expression
  (identifier) @type
  .
  (identifier) @function)

; Path patterns (Type::Variant)
(path_pattern
  (identifier) @type
  (identifier) @variant)

; Tuple struct patterns (Type::Variant(args))
(tuple_struct_pattern
  (identifier) @type
  (identifier) @variant)

; Struct expression name
(struct_expression
  name: (identifier) @type)

; Field declarations
(field_declaration
  name: (identifier) @property)

; Field initializers
(field_initializer
  name: (identifier) @property)

; Field access
(field_expression
  field: (identifier) @property)

; Parameters
(parameter
  name: (identifier) @variable.parameter)

; Interpolated strings
(interpolated_string) @string
(interpolated_fragment) @string
(escape_sequence) @string.escape

; Interpolation braces
(interpolation
  "{" @punctuation.special
  "}" @punctuation.special)

; Pattern guard keyword
(match_arm
  "if" @keyword)
