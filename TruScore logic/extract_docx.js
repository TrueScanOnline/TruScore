// Extract text from DOCX files
// DOCX files are ZIP archives - we can extract the document.xml and parse it

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const files = [
  'Tru_Score_Engine_Detailed_Specification_20251129_v2.docx',
  'TruScore_Methodology_Explainer_20251129.docx'
];

console.log('Extracting text from DOCX files...\n');

files.forEach(file => {
  const docxPath = path.join(__dirname, file);
  const txtPath = path.join(__dirname, file.replace('.docx', '.txt'));
  
  if (!fs.existsSync(docxPath)) {
    console.log(`✗ ${file} - NOT FOUND`);
    return;
  }
  
  try {
    // Method 1: Try using PowerShell with Word COM object
    console.log(`Extracting: ${file}`);
    const psScript = `
      $word = New-Object -ComObject Word.Application
      $word.Visible = $false
      $doc = $word.Documents.Open("${docxPath.replace(/\\/g, '\\\\')}")
      $text = $doc.Content.Text
      $doc.Close($false)
      $word.Quit()
      [System.Runtime.Interopservices.Marshal]::ReleaseComObject($word) | Out-Null
      $text | Out-File -FilePath "${txtPath.replace(/\\/g, '\\\\')}" -Encoding UTF8
      Write-Output "Extracted $($text.Length) characters"
    `;
    
    const result = execSync(`powershell -Command "${psScript.replace(/"/g, '\\"')}"`, { encoding: 'utf-8' });
    console.log(`  ✓ ${result.trim()}`);
    console.log(`  Saved to: ${txtPath}\n`);
  } catch (error) {
    console.log(`  ✗ Failed: ${error.message}`);
    console.log(`  Please convert manually:\n    1. Open ${file} in Word\n    2. Ctrl+A, Ctrl+C\n    3. Paste into ${file.replace('.docx', '.txt')}\n`);
  }
});

console.log('Done!');
