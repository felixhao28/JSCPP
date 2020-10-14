declare module 'pegjs-util' {
    interface PegErrorEx {
        line: number;
        column: number;
        message: string;
        found: string;
        expected: string;
        location: string;
    }
    export default class PEGUtil {
        static parse(parser: any, txt: string, options?: any): {
            ast: any;
            error: PegErrorEx;
        };
        static errorMessage(error: PegErrorEx, noFinalNewline: boolean): string;
    }
}