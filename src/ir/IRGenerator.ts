import ASTNode from "../parser/IParser";
import { IRInstruction, Operand } from "./IR";

class IRGenerator {
  private tempIndex = 0;
  private instructions: IRInstruction[] = [];

  public generate(ast: ASTNode[]): IRInstruction[] {
    this.tempIndex = 0;
    this.instructions = [];

    for (const node of ast) {
      this.emitStatement(node);
    }

    return this.instructions;
  }

  private newTemp(): string {
    const name = `t${this.tempIndex}`;
    this.tempIndex += 1;
    return name;
  }

  private emitStatement(node: ASTNode): void {
    switch (node.type) {
      case "VariableDeclaration": {
        const value = this.emitExpression(node.value);
        this.instructions.push({ op: "store", name: node.id, src: value });
        return;
      }
      case "PrintStatement": {
        const value = this.emitExpression(node.value);
        this.instructions.push({ op: "print", value });
        return;
      }
      default:
        throw new Error(`IR generation: unsupported statement ${node.type}`);
    }
  }

  private emitExpression(node: ASTNode): Operand {
    switch (node.type) {
      case "NumberLiteral": {
        const dest = this.newTemp();
        this.instructions.push({ op: "const", dest, value: Number(node.value) });
        return { kind: "temp", name: dest };
      }
      case "Identifier": {
        const dest = this.newTemp();
        this.instructions.push({ op: "load", dest, name: node.name });
        return { kind: "temp", name: dest };
      }
      case "BinaryExpression": {
        const left = this.emitExpression(node.left);
        const right = this.emitExpression(node.right);
        const dest = this.newTemp();
        this.instructions.push({
          op: "bin",
          dest,
          operator: node.operator,
          left,
          right,
        });
        return { kind: "temp", name: dest };
      }
      default:
        throw new Error(`IR generation: unsupported expression ${node.type}`);
    }
  }
}

export default IRGenerator;
