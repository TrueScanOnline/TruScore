# FSANZ Database Investigation Report

## Current Status

- **Standard DATA.AP**: Contains ~2,857 unique foods
- **Unabridged DATA.AP**: Needs investigation to determine structure
- **User Expectation**: 221,000+ foods

## Investigation Needed

The Unabridged file may have one of two structures:

1. **Food-based** (same as Standard): One row per food with all nutrients in columns
   - If this is the case, we should have ~221,000 unique foods
   - Current parsing should work but may need optimization

2. **Component-based**: One row per nutrient component per food
   - Multiple rows per food (one for each nutrient)
   - Would explain 221,000+ rows but fewer unique foods
   - Would require aggregation logic to combine rows by FoodID

## Next Steps

1. Analyze Unabridged file structure
2. Determine if it's food-based or component-based
3. If component-based, create aggregation script
4. Generate full database with all 221,000+ foods
5. Test with real barcodes
6. Deploy to Vercel

## Files to Check

- `Unabridged DATA.AP` - Main data file
- `Unabridged DATA.FT` - May contain different structure
- `Standard DATA.FT` - May provide clues about structure

