import { ZibalProvider } from '../src/modules/payments/zibal.provider';
import Zibal from 'zibal';

jest.mock('zibal');

describe('ZibalProvider', () => {
  let provider: ZibalProvider;
  let mockZibalInstance: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockZibalInstance = {
      request: jest.fn(),
      verify: jest.fn(),
    };
    (Zibal as unknown as jest.Mock).mockImplementation(() => mockZibalInstance);
    provider = new ZibalProvider();
  });

  it('should call zibal.request with correct parameters', async () => {
    const options = { amount: 1000, orderId: '123' };
    mockZibalInstance.request.mockResolvedValue({ result: 100, trackId: 12345, paymentUrl: 'http://zibal.ir/start/12345', message: 'success' });

    const result = await provider.request(options);

    expect(mockZibalInstance.request).toHaveBeenCalledWith(options);
    expect(result.result).toBe(100);
    expect(result.trackId).toBe(12345);
  });

  it('should call zibal.verify with correct parameters', async () => {
    const options = { trackId: 12345 };
    mockZibalInstance.verify.mockResolvedValue({ result: 100, refNumber: 67890, message: 'success' });

    const result = await provider.verify(options);

    expect(mockZibalInstance.verify).toHaveBeenCalledWith(options);
    expect(result.result).toBe(100);
    expect(result.refNumber).toBe(67890);
  });
});
