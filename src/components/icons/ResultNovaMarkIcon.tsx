/**
 * Shared NOVA mark icon for the Product Result Processing Level row.
 * NOVA 3 uses the jar-and-spoon pictogram; other groups keep Ionicons.
 */

import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import Nova3PreservedFoodIcon from './Nova3PreservedFoodIcon';

type Props = {
  novaGroup: number;
  color: string;
  size?: number;
};

export default function ResultNovaMarkIcon({ novaGroup, color, size = 26 }: Props) {
  if (novaGroup === 3) {
    return <Nova3PreservedFoodIcon size={size} color={color} />;
  }
  const name = novaGroup === 1 ? 'leaf' : novaGroup === 2 ? 'create' : 'warning';
  return <Ionicons name={name as 'leaf' | 'create' | 'warning'} size={size} color={color} />;
}
