import { AsyncLocalStorage } from 'async_hooks';

export interface RequestContext {
  requestId: string;
  [key: string]: any;
}

export const requestContext = new AsyncLocalStorage<RequestContext>();

export const getRequestId = (): string | undefined => {
  return requestContext.getStore()?.requestId;
};

export const runWithContext = (context: RequestContext, fn: () => void) => {
  return requestContext.run(context, fn);
};
