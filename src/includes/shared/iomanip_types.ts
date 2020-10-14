import { ObjectValue, ObjectVariable, Variable } from "../../rt";

export interface IomanipConfig {
    setprecision?: number;
    fixed?: boolean;
    setw?: number;
    setfill?: string;
}

export interface IomanipOperator extends ObjectVariable {
    v: ObjectValue & {
        name: string;
        f(config: IomanipConfig): void;
    }
}

export interface Cin extends ObjectVariable {
    v: ObjectValue & {
        buf: string;
        eofbit: boolean;
        failbit: boolean;
    }
}

export interface Cout extends ObjectVariable {
    v: ObjectValue & {
        ostream: {
            drain?: () => string;
            write: (s: string) => void;
        }
    },
    manipulators?: {
        config: IomanipConfig;
        active: { [iomanipName: string]: (config: IomanipConfig) => void };
        use(o: Variable): Variable;
    }
}
