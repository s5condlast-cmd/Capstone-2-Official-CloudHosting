import { DocumentParser } from './DocumentParser';
import { UnsupportedFormatError } from './ParserErrors';

export class ParserManager {
  private static parsers: Map<string, DocumentParser> = new Map();
  private static defaultParserName: string | null = null;

  public static registerParser(parser: DocumentParser, isDefault: boolean = false): void {
    this.parsers.set(parser.name, parser);
    if (isDefault || !this.defaultParserName) {
      this.defaultParserName = parser.name;
    }
  }

  public static selectParser(fileName: string, overrideName?: string): DocumentParser {
    const ext = fileName.split('.').pop()?.toLowerCase() || '';

    // 1. Explicit Admin Override Selection
    if (overrideName) {
      const overrideParser = this.parsers.get(overrideName);
      if (!overrideParser) {
        throw new Error(`Overridden parser '${overrideName}' is not registered.`);
      }
      if (!overrideParser.capabilities.supportedFormats.includes(ext)) {
        throw new UnsupportedFormatError(ext, overrideName);
      }
      return overrideParser;
    }

    // 2. Default Configured Parser Selection
    if (this.defaultParserName) {
      const defaultP = this.parsers.get(this.defaultParserName);
      if (defaultP && defaultP.capabilities.supportedFormats.includes(ext)) {
        return defaultP;
      }
    }

    // 3. Capability Match Scoring (Filter by supportedFormats first)
    const compatibleParsers = Array.from(this.parsers.values()).filter(p =>
      p.capabilities.supportedFormats.includes(ext)
    );

    if (compatibleParsers.length === 0) {
      throw new UnsupportedFormatError(ext);
    }

    // TODO: Implement full capability score weighting (tables, OCR, forms)
    compatibleParsers.sort((a, b) => {
      const scoreA = (a.capabilities.supportsTables ? 2 : 0) + (a.capabilities.supportsForms ? 1 : 0);
      const scoreB = (b.capabilities.supportsTables ? 2 : 0) + (b.capabilities.supportsForms ? 1 : 0);
      return scoreB - scoreA;
    });

    return compatibleParsers[0];
  }
}
