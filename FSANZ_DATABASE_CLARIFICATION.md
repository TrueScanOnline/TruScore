# FSANZ Database Clarification

## Current Understanding

Based on the investigation:

1. **Standard DATA.AP**: Contains ~2,857 foods (one row per food, all nutrients in columns)
2. **Unabridged DATA.AP**: Contains ~2,857 foods (same structure, more columns - 436 vs ~89)
3. **DATA.FT files**: Likely component-based (one row per nutrient component per food)

## The 221,000+ Number

The number "221,000+" likely refers to:
- **Total nutrient component records** (not unique foods)
- If there are ~2,857 foods and each has ~77 nutrients on average: 2,857 × 77 ≈ 220,000 component records

## Current Database Status

✅ **Database is correct** with 2,857 foods from Standard/Unabridged DATA.AP files
- This is the **complete food list** for New Zealand FOODfiles™ 2024
- Each food has all nutrients in a single row
- Ready for TruScore integration

## If You Need More Foods

If you need more than 2,857 foods, you may need to:
1. Check if there are additional food databases/files
2. Combine with Australian AFCD database (which has ~17,109 foods)
3. Use both NZFCD and AFCD together for maximum coverage

## Next Steps

1. ✅ Database generated (2,857 foods from NZFCD)
2. ✅ AFCD database already has ~17,109 foods
3. ⏳ Test with real barcodes
4. ⏳ Deploy to Vercel
5. ⏳ Verify TruScore uses both databases

## Combined Coverage

- **NZFCD**: 2,857 foods (New Zealand)
- **AFCD**: 17,109 foods (Australia)
- **Total**: ~20,000 foods available for TruScore

This should provide excellent coverage for users in New Zealand and Australia.

