export class UnsupportedFormatError extends Error {
  public readonly format: string;
  public readonly parserName?: string;

  constructor(format: string, parserName?: string) {
    const message = parserName
      ? `Parser '${parserName}' does not support format '${format}'.`
      : `No registered parser supports format '${format}'.`;
    super(message);
    this.name = 'UnsupportedFormatError';
    this.format = format;
    this.parserName = parserName;
    Object.setPrototypeOf(this, UnsupportedFormatError.prototype);
  }
}
