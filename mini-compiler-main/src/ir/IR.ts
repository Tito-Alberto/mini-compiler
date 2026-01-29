type Operand =
  | { kind: "const"; value: number }
  | { kind: "temp"; name: string }
  | { kind: "var"; name: string };

type BinaryOperator = "+" | "-" | "*" | "/";

type IRInstruction =
  | { op: "const"; dest: string; value: number }
  | { op: "load"; dest: string; name: string }
  | { op: "bin"; dest: string; operator: BinaryOperator; left: Operand; right: Operand }
  | { op: "store"; name: string; src: Operand }
  | { op: "print"; value: Operand };

export type { Operand, IRInstruction, BinaryOperator };
