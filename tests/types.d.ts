import 'jest-openapi';

declare global {
  namespace jest {
    interface Matchers<R> {
      toSatisfyApiSpec(): R;
    }
  }
}
