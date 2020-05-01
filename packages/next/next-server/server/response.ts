export class NextServerResponse {
  val: string | null

  constructor(val: string | null) {
    this.val = val
  }

  static from(chunk: string | null): NextServerResponse {
    return new NextServerResponse(chunk)
  }

  async text(): Promise<string | null> {
    return this.val
  }
}
