import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';

/** Each primary tab (except Settings) stacks product result on top of its home screen when relevant. */
export type ScanStackParamList = {
  ScanHome: undefined;
  Result: { barcode: string };
};

export type SearchStackParamList = {
  SearchHome: undefined;
  Result: { barcode: string };
};

export type HistoryStackParamList = {
  HistoryHome: undefined;
  Result: { barcode: string };
};

export type FavouritesStackParamList = {
  FavouritesHome: undefined;
  Result: { barcode: string };
};

export type AlertsStackParamList = {
  AlertsHome: undefined;
  Result: { barcode: string };
};

/** Shared route typing for `app/result/[barcode].tsx` mounted in any tab stack. */
export type ResultScreenRouteProp = RouteProp<{ Result: { barcode: string } }, 'Result'>;

export type ResultScreenNavigationProp = NativeStackNavigationProp<
  {
    Result: { barcode: string };
    ScanHome?: undefined;
    SearchHome?: undefined;
    HistoryHome?: undefined;
    FavouritesHome?: undefined;
    AlertsHome?: undefined;
  },
  'Result'
>;
