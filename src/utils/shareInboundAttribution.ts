import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = '@truescan_share_inbound';

export interface InboundShareAttribution {
  barcode: string;
  ctx?: string;
  src?: string;
  ref?: string;
  t: number;
}

export async function storeInboundShareAttribution(data: {
  barcode: string;
  ctx?: string;
  src?: string;
  ref?: string;
}): Promise<void> {
  const payload: InboundShareAttribution = { ...data, t: Date.now() };
  await AsyncStorage.setItem(KEY, JSON.stringify(payload));
}
