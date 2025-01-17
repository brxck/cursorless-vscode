import { SyntaxNode } from "web-tree-sitter";
import { TextEditor } from "vscode";
import { getPojoMatchers } from "./getPojoMatchers";
import {
  cascadingMatcher,
  delimitedMatcher,
  hasType,
  possiblyWrappedNode,
  simpleSelectionExtractor,
  getNodeWithLeadingDelimiter,
  childNodeMatcher,
} from "../nodeMatchers";
import { NodeMatcher, ScopeType } from "../Types";
import { getDeclarationNode, getValueNode } from "../treeSitterUtils";

// TODO figure out how to properly use super types
// Generated by the following command:
// > curl https://raw.githubusercontent.com/tree-sitter/tree-sitter-typescript/4c20b54771e4b390ee058af2930feb2cd55f2bf8/typescript/src/node-types.json \
//   | jq '.[] | select(.type == "primary_expression" or .type == "expression") | [.subtypes[].type]'
const EXPRESSION_TYPES = [
  "array",
  "arrow_function",
  "as_expression",
  "assignment_expression",
  "augmented_assignment_expression",
  "await_expression",
  "binary_expression",
  "call_expression",
  "class",
  "false",
  "function",
  "generator_function",
  "identifier",
  "import",
  "internal_module",
  "member_expression",
  "meta_property",
  "new_expression",
  "non_null_expression",
  "null",
  "number",
  "object",
  "parenthesized_expression",
  "primary_expression",
  "regex",
  "string",
  "subscript_expression",
  "super",
  "template_string",
  "ternary_expression",
  "this",
  "true",
  "type_assertion",
  "unary_expression",
  "undefined",
  "update_expression",
  "yield_expression",
];

function isExpression(node: SyntaxNode) {
  return EXPRESSION_TYPES.includes(node.type);
}

// Generated by the following command:
// > curl https://raw.githubusercontent.com/tree-sitter/tree-sitter-typescript/4c20b54771e4b390ee058af2930feb2cd55f2bf8/typescript/src/node-types.json \
//   | jq '[.[] | select(.type == "statement" or .type == "declaration") | .subtypes[].type]'
const STATEMENT_TYPES = [
  "abstract_class_declaration",
  "ambient_declaration",
  "break_statement",
  "class_declaration",
  "continue_statement",
  "debugger_statement",
  "declaration",
  "do_statement",
  "empty_statement",
  "enum_declaration",
  "export_statement",
  "expression_statement",
  "for_in_statement",
  "for_statement",
  "function_declaration",
  "function_signature",
  "generator_function_declaration",
  "if_statement",
  "import_alias",
  "import_statement",
  "interface_declaration",
  "internal_module",
  "labeled_statement",
  "lexical_declaration",
  "module",
  "return_statement",
  "statement_block",
  "switch_statement",
  "throw_statement",
  "try_statement",
  "type_alias_declaration",
  "variable_declaration",
  "while_statement",
  "with_statement",
];

function possiblyExportedDeclaration(...typeNames: string[]): NodeMatcher {
  return possiblyWrappedNode(
    (node) => node.type === "export_statement",
    (node) => typeNames.includes(node.type),
    (node) => [getDeclarationNode(node), getValueNode(node)]
  );
}

const isNamedArrowFunction = (node: SyntaxNode) => {
  if (node.type !== "lexical_declaration" || node.namedChildCount !== 1) {
    return false;
  }

  const child = node.firstNamedChild!;

  return (
    child.type === "variable_declarator" &&
    getValueNode(child)!.type === "arrow_function"
  );
};

export const getTypeNode = (node: SyntaxNode) => {
  const typeAnnotationNode = node.children.find((child) =>
    ["type_annotation", "opting_type_annotation"].includes(child.type)
  );
  return typeAnnotationNode?.lastChild ?? null;
};

const nodeMatchers: Record<ScopeType, NodeMatcher> = {
  ...getPojoMatchers(
    ["object"],
    ["array"],
    (node) => isExpression(node) || node.type === "spread_element"
  ),
  ifStatement: hasType("if_statement"),
  class: possiblyExportedDeclaration("class_declaration", "class"),
  statement: possiblyExportedDeclaration(...STATEMENT_TYPES),
  arrowFunction: hasType("arrow_function"),
  functionCall: hasType("call_expression", "new_expression"),
  type: cascadingMatcher(
    // Typed parameters, properties, and functions
    childNodeMatcher(getTypeNode, getNodeWithLeadingDelimiter),

    // Type alias/interface declarations
    possiblyExportedDeclaration(
      "type_alias_declaration",
      "interface_declaration"
    )
  ),
  argumentOrParameter: delimitedMatcher(
    (node) =>
      (node.parent?.type === "arguments" &&
        (isExpression(node) || node.type === "spread_element")) ||
      node.type === "optional_parameter" ||
      node.type === "required_parameter",
    (node) => node.type === "," || node.type === "(" || node.type === ")",
    ", "
  ),
  namedFunction: cascadingMatcher(
    // Simple case, eg
    // function foo() {}
    possiblyExportedDeclaration("function_declaration", "method_definition"),

    // Class property defined as field definition with arrow
    // eg:
    // class Foo {
    //   bar = () => "hello";
    // }
    (editor: TextEditor, node: SyntaxNode) =>
      node.type === "public_field_definition" &&
      getValueNode(node)!.type === "arrow_function"
        ? simpleSelectionExtractor(node)
        : null,

    // eg:
    // const foo = () => "hello"
    possiblyWrappedNode(
      (node) => node.type === "export_statement",
      isNamedArrowFunction,
      (node) => [getDeclarationNode(node)]
    )
  ),
  comment: hasType("comment"),
};

export default nodeMatchers;
