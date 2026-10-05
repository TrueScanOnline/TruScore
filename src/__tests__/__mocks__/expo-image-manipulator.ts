export const manipulateAsync = jest.fn(async () => {
  throw new Error('`new NativeEventEmitter()` requires a non-null argument.');
});

export const SaveFormat = { JPEG: 'jpeg', PNG: 'png' };
