export class GranularTokenCount {
  constructor(
    public readonly prompt: number,
    public readonly output: number,
    public readonly cached: number,
    public readonly thinking: number
  ) {
    if (prompt < 0 || output < 0 || cached < 0 || thinking < 0) {
      throw new Error("El conteo de tokens no puede ser negativo");
    }
  }

  get totalAccumulated(): number {
    return this.prompt + this.output + this.cached + this.thinking;
  }

  get totalBillable(): number {
    // La fórmula exacta depende del modelo, pero generalmente:
    // thinking cuesta como output
    return this.prompt + this.output + this.cached + this.thinking;
  }

  add(other: GranularTokenCount): GranularTokenCount {
    return new GranularTokenCount(
      this.prompt + other.prompt,
      this.output + other.output,
      this.cached + other.cached,
      this.thinking + other.thinking
    );
  }

  static empty(): GranularTokenCount {
    return new GranularTokenCount(0, 0, 0, 0);
  }
}
