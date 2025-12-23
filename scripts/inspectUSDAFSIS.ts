/**
 * Inspect USDA FSIS data structure
 */

async function inspect() {
  const response = await fetch('https://www.fsis.usda.gov/fsis/api/recall/v/1');
  const data = await response.json();
  
  console.log(`Total recalls: ${data.length}`);
  console.log('\nFirst 5 recalls:');
  
  for (let i = 0; i < Math.min(5, data.length); i++) {
    const recall = data[i];
    console.log(`\nRecall ${i + 1}:`);
    console.log(`  Title: ${recall.field_title}`);
    console.log(`  Establishment: ${recall.field_establishment}`);
    console.log(`  Product Items: ${recall.field_product_items}`);
    console.log(`  Recall Reason: ${recall.field_recall_reason}`);
    console.log(`  Summary: ${recall.field_summary?.substring(0, 100)}`);
    console.log(`  Active: ${recall.field_active_notice}`);
    console.log(`  Recall Date: ${recall.field_recall_date}`);
    console.log(`  Closed Date: ${recall.field_closed_date}`);
  }
  
  // Search for "chicken" in the data
  console.log('\n\nSearching for "chicken" in recalls...');
  const chickenRecalls = data.filter((r: any) => {
    const title = (r.field_title || '').toLowerCase();
    const product = (r.field_product_items || '').toLowerCase();
    const establishment = (r.field_establishment || '').toLowerCase();
    const reason = (r.field_recall_reason || '').toLowerCase();
    return title.includes('chicken') || product.includes('chicken') || establishment.includes('chicken') || reason.includes('chicken');
  });
  
  console.log(`Found ${chickenRecalls.length} recalls with "chicken"`);
  if (chickenRecalls.length > 0) {
    console.log(`\nFirst chicken recall:`);
    console.log(`  Title: ${chickenRecalls[0].field_title}`);
    console.log(`  Establishment: ${chickenRecalls[0].field_establishment}`);
    console.log(`  Product Items: ${chickenRecalls[0].field_product_items}`);
  }
}

inspect().catch(console.error);

