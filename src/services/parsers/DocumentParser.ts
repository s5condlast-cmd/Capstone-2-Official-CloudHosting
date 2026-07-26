import { ParserResult, ParserCapabilities } from '@/src/types/structuredDocument';

export interface DocumentParser {
  readonly name: string;
  readonly capabilities: ParserCapabilities;

  parse(fileBuffer: ArrayBuffer, fileName: string): Promise<ParserResult>;
}
