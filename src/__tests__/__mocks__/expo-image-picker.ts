/**
 * Mock for expo-image-picker
 */

export const MediaTypeOptions = {
  Images: 'images',
  Videos: 'videos',
  All: 'all',
};

export const launchImageLibraryAsync = jest.fn(() =>
  Promise.resolve({
    cancelled: false,
    assets: [
      {
        uri: 'file:///mock/image.jpg',
        width: 100,
        height: 100,
        type: 'image',
      },
    ],
  })
);

export const launchCameraAsync = jest.fn(() =>
  Promise.resolve({
    cancelled: false,
    assets: [
      {
        uri: 'file:///mock/image.jpg',
        width: 100,
        height: 100,
        type: 'image',
      },
    ],
  })
);

export default {
  MediaTypeOptions,
  launchImageLibraryAsync,
  launchCameraAsync,
};

