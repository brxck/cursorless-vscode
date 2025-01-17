import { SyntaxNode } from "web-tree-sitter";
import { getPojoMatchers } from "./getPojoMatchers";
import { notSupported } from "../nodeMatchers";
import { NodeMatcher, ScopeType } from "../Types";

// TODO figure out how to properly use super types
// Generated by the following command:
// > curl https://raw.githubusercontent.com/tree-sitter/tree-sitter-json/65bceef69c3b0f24c0b19ce67d79f57c96e90fcb/src/node-types.json \
//     | jq '.[] | select(.type == _value) | [.subtypes[].type]'
const VALUE_TYPES = [
  "array",
  "false",
  "null",
  "number",
  "object",
  "string",
  "true",
];

function isValue(node: SyntaxNode) {
  return VALUE_TYPES.includes(node.type);
}

const nodeMatchers: Record<ScopeType, NodeMatcher> = {
  ...getPojoMatchers(["object"], ["array"], isValue),
  ifStatement: notSupported,
  class: notSupported,
  statement: notSupported,
  arrowFunction: notSupported,
  functionCall: notSupported,
  argumentOrParameter: notSupported,
  namedFunction: notSupported,
  comment: notSupported,
  type: notSupported,
};

export default nodeMatchers;
