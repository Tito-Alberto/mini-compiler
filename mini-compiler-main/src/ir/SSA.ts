import { IRInstruction } from "./IR";

const toSSA = (instructions: IRInstruction[]): IRInstruction[] => {
  const versions: Record<string, number> = {};

  const currentName = (base: string): string | null => {
    const version = versions[base];
    if (version === undefined) {
      return null;
    }
    return `${base}_${version}`;
  };

  const nextName = (base: string): string => {
    const version = (versions[base] ?? 0) + 1;
    versions[base] = version;
    return `${base}_${version}`;
  };

  return instructions.map((inst) => {
    switch (inst.op) {
      case "load": {
        const name = currentName(inst.name);
        if (!name) {
          throw new Error(`Erro semantico: variavel ${inst.name} nao foi declarada`);
        }
        return { ...inst, name };
      }
      case "store": {
        const name = nextName(inst.name);
        return { ...inst, name };
      }
      default:
        return inst;
    }
  });
};

export default toSSA;
