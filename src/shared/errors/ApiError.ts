export class ApiError extends Error {
  public code?: string;
  public details?: unknown;

  constructor(
    public statusCode: number,
    public message: string,
    public isOperational = true,
    public stack = ''
  ) {
    super(message);
    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}
