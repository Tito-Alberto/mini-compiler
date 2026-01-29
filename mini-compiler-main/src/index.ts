import Lexer from "./lexer/Lexer";
import Parser from "./parser/Parser";
import IRGenerator from "./ir/IRGenerator";
import toSSA from "./ir/SSA";
import optimizeIR from "./ir/Optimizer";
import IRExecutor from "./ir/IRExecutor";
import fs from "fs";
import path from "path";


const filePath = path.join(__dirname, "input", "code.nt");
const code = fs.readFileSync(filePath, "utf-8");

const lexer = new Lexer(code);
const parser = new Parser(lexer);
const ast = parser.parse();

const generator = new IRGenerator();
const ir = generator.generate(ast);
const ssaIR = toSSA(ir);
const optimizedIR = optimizeIR(ssaIR);

const formatOperand = (operand: { kind: string; name?: string; value?: number }): string => {
  switch (operand.kind) {
    case "const":
      return String(operand.value);
    case "temp":
    case "var":
      return String(operand.name);
    default:
      return "?";
  }
};

const formatIR = (instructions: typeof ir): string[] =>
  instructions.map((inst, index) => {
    switch (inst.op) {
      case "const":
        return `${index}: ${inst.dest} = ${inst.value}`;
      case "load":
        return `${index}: ${inst.dest} = ${inst.name}`;
      case "bin":
        return `${index}: ${inst.dest} = ${formatOperand(inst.left)} ${inst.operator} ${formatOperand(
          inst.right,
        )}`;
      case "store":
        return `${index}: ${inst.name} = ${formatOperand(inst.src)}`;
      case "print":
        return `${index}: print ${formatOperand(inst.value)}`;
    }
  });

console.log("IR (SSA, antes da otimizacao):");
console.log(formatIR(ssaIR).join("\n"));
console.log("IR (depois da otimizacao):");
console.log(formatIR(optimizedIR).join("\n"));

const executor = new IRExecutor();
executor.execute(optimizedIR);
