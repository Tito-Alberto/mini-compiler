import { IRInstruction, Operand } from "./IR";

type ConstMap = Record<string, number>;

const replaceOperand = (
  operand: Operand,
  tempConsts: ConstMap,
  varConsts: ConstMap,
): Operand => {
  if (operand.kind === "temp" && operand.name in tempConsts) {
    const value = tempConsts[operand.name];
    if (value !== undefined) {
      return { kind: "const", value };
    }
  }
  if (operand.kind === "var" && operand.name in varConsts) {
    const value = varConsts[operand.name];
    if (value !== undefined) {
      return { kind: "const", value };
    }
  }
  return operand;
};

const isConstOperand = (operand: Operand): operand is { kind: "const"; value: number } =>
  operand.kind === "const";

const simplifyOnce = (instructions: IRInstruction[]): { changed: boolean; result: IRInstruction[] } => {
  const tempConsts: ConstMap = {};
  const varConsts: ConstMap = {};
  let changed = false;

  const result: IRInstruction[] = instructions.map((inst): IRInstruction => {
    switch (inst.op) {
      case "const":
        tempConsts[inst.dest] = inst.value;
        return inst;
      case "load": {
        if (inst.name in varConsts) {
          const value = varConsts[inst.name];
          if (value === undefined) {
            delete tempConsts[inst.dest];
            return inst;
          }
          tempConsts[inst.dest] = value;
          changed = true;
          return { op: "const", dest: inst.dest, value };
        }
        delete tempConsts[inst.dest];
        return inst;
      }
      case "bin": {
        const left = replaceOperand(inst.left, tempConsts, varConsts);
        const right = replaceOperand(inst.right, tempConsts, varConsts);
        if (left !== inst.left || right !== inst.right) {
          changed = true;
        }

        if (inst.operator === "/" && isConstOperand(right) && right.value === 0) {
          console.warn("Aviso: divisao por zero detectada e substituida por 0.");
          tempConsts[inst.dest] = 0;
          changed = true;
          return { op: "const", dest: inst.dest, value: 0 };
        }

        if (isConstOperand(left) && isConstOperand(right)) {
          let value = 0;
          switch (inst.operator) {
            case "+":
              value = left.value + right.value;
              break;
            case "-":
              value = left.value - right.value;
              break;
            case "*":
              value = left.value * right.value;
              break;
            case "/":
              value = left.value / right.value;
              break;
          }
          tempConsts[inst.dest] = value;
          changed = true;
          return { op: "const", dest: inst.dest, value };
        }

        delete tempConsts[inst.dest];
        return { ...inst, left, right };
      }
      case "store": {
        const src = replaceOperand(inst.src, tempConsts, varConsts);
        if (src !== inst.src) {
          changed = true;
        }
        if (isConstOperand(src)) {
          varConsts[inst.name] = src.value;
        } else {
          delete varConsts[inst.name];
        }
        return { ...inst, src };
      }
      case "print": {
        const value = replaceOperand(inst.value, tempConsts, varConsts);
        if (value !== inst.value) {
          changed = true;
        }
        return { ...inst, value };
      }
      default:
        return inst;
    }
  });

  return { changed, result };
};

const eliminateDeadTemps = (instructions: IRInstruction[]): { changed: boolean; result: IRInstruction[] } => {
  const usedTemps = new Set<string>();

  for (const inst of instructions) {
    const addOperand = (operand: Operand) => {
      if (operand.kind === "temp") {
        usedTemps.add(operand.name);
      }
    };

    switch (inst.op) {
      case "bin":
        addOperand(inst.left);
        addOperand(inst.right);
        break;
      case "store":
        addOperand(inst.src);
        break;
      case "print":
        addOperand(inst.value);
        break;
      case "const":
      case "load":
        break;
    }
  }

  let changed = false;
  const result = instructions.filter((inst) => {
    if (inst.op === "const" || inst.op === "bin") {
      if (!usedTemps.has(inst.dest)) {
        changed = true;
        return false;
      }
    }
    return true;
  });

  return { changed, result };
};

const optimizeIR = (instructions: IRInstruction[]): IRInstruction[] => {
  let current = instructions;
  let changed = true;
  let guard = 0;

  while (changed && guard < 8) {
    guard += 1;
    const simplified = simplifyOnce(current);
    const eliminated = eliminateDeadTemps(simplified.result);
    changed = simplified.changed || eliminated.changed;
    current = eliminated.result;
  }

  return current;
};

export default optimizeIR;
