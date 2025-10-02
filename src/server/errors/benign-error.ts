/**
 * Error class for representing benign errors.
 * These are errors caused by user interactions and are safe to show to them.
 */
export default class BenignError extends Error {
  public override name: string;
  public override message: string;
  public override stack!: string;

  constructor(message: string) {
    super(message);
    this.name = 'BenignError';
    this.message = message;
  }

  public override toString(): string {
    return `${this.name}: ${this.message}`;
  }

  public toJSON(): { name: string; message: string; stack: string } {
    return {
      name: this.name,
      message: this.message,
      stack: this.stack,
    };
  }
}
