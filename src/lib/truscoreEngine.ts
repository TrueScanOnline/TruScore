/**
 * TruScore Engine - Legacy Wrapper
 * 
 * This file maintains backward compatibility while using the new modular pillar system.
 * The actual calculation logic has been moved to src/lib/truscoreEngine/pillars/
 * 
 * @deprecated Use src/lib/truscoreEngine/index.ts directly for new code
 */

// Re-export from the new modular system
export * from './truscoreEngine/index';

// Keep the old export for backward compatibility
import { calculateTruScore as calculateTruScoreNew } from './truscoreEngine/index';
export { calculateTruScoreNew as calculateTruScore };
