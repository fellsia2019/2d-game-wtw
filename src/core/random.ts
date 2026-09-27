export class Random {
  constructor(public state: number) { this.state >>>= 0; if (!this.state) this.state = 0x9e3779b9; }
  next(): number {
    let x = this.state;
    x ^= x << 13; x ^= x >>> 17; x ^= x << 5;
    this.state = x >>> 0;
    return this.state / 0x100000000;
  }
  int(max: number): number { return Math.floor(this.next() * max); }
}
