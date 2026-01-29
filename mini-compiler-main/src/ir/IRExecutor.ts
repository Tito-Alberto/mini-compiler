import { IRInstruction, Operand } from "./IR";

class IRExecutor {
  private vars: Record<string, number> = {};
  private temps: Record<string, number> = {};

  public execute(instructions: IRInstruction[]): void {
    for (const inst of instructions) {
      switch (inst.op) {
        case "const":
          this.temps[inst.dest] = inst.value;
          break;
        case "load":
          if (!(inst.name in this.vars)) {
            throw new Error(`Erro semantico: variavel ${inst.name} nao foi declarada`);
          }
          const loaded = this.vars[inst.name];
          if (loaded === undefined) {
            throw new Error(`Erro semantico: variavel ${inst.name} nao foi declarada`);
          }
          this.temps[inst.dest] = loaded;
          break;
        case "bin": {
          const left = this.getValue(inst.left);
          const right = this.getValue(inst.right);
          if (inst.operator === "/" && right === 0) {
            throw new Error(
              `Expressao mal definida: ${left} ${inst.operator} ${right} . Nao e possivel dividir por zero`,
            );
          }
          let value = 0;
          switch (inst.operator) {
            case "+":
              value = left + right;
              break;
            case "-":
              value = left - right;
              break;
            case "*":
              value = left * right;
              break;
            case "/":
              value = left / right;
              break;
          }
          this.temps[inst.dest] = value;
          break;
        }
        case "store":
          this.vars[inst.name] = this.getValue(inst.src);
          break;
        case "print":
          console.log(this.getValue(inst.value));
          break;
      }
    }
  }

  private getValue(operand: Operand): number {
    switch (operand.kind) {
      case "const":
        return operand.value;
      case "temp":
        if (!(operand.name in this.temps)) {
          throw new Error(`Erro interno: temporario ${operand.name} nao definido`);
        }
        const tempValue = this.temps[operand.name];
        if (tempValue === undefined) {
          throw new Error(`Erro interno: temporario ${operand.name} nao definido`);
        }
        return tempValue;
      case "var":
        if (!(operand.name in this.vars)) {
          throw new Error(`Erro semantico: variavel ${operand.name} nao foi declarada`);
        }
        const varValue = this.vars[operand.name];
        if (varValue === undefined) {
          throw new Error(`Erro semantico: variavel ${operand.name} nao foi declarada`);
        }
        return varValue;
    }
  }
}

export default IRExecutor;
