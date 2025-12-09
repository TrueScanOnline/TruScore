// Convert IARC Excel Database to TypeScript
const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'TruScore logic', 'Agents Classified by the IARC Monographs, Volumes 1–140 (1).xlsx');

console.log('Converting IARC Excel database to TypeScript...');

try {
  const workbook = XLSX.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  
  // Read data with proper headers
  const data = XLSX.utils.sheet_to_json(worksheet, { 
    header: ['casNo', 'agent', 'group', 'volume', 'publicationYear', 'evaluationYear', 'additionalInfo'],
    defval: null 
  });
  
  // Filter out header row and invalid entries
  const agents = data.filter(row => 
    row.agent && 
    row.group && 
    row.agent !== 'Agent' && 
    row.casNo !== 'CAS No.' &&
    String(row.group).trim() !== ''
  );
  
  console.log(`Found ${agents.length} IARC agents`);
  
  // Normalize data - convert null to undefined for optional fields
  const normalizedAgents = agents.map(row => {
    const pubYear = row.publicationYear;
    const evalYear = row.evaluationYear;
    
    return {
      casNo: row.casNo && String(row.casNo).trim() !== '' ? String(row.casNo).trim() : undefined,
      agent: String(row.agent).trim(),
      group: String(row.group).trim().toUpperCase().replace(/GROUP\s*/i, ''),
      volume: row.volume && String(row.volume).trim() !== '' ? String(row.volume).trim() : undefined,
      publicationYear: pubYear && pubYear !== null && String(pubYear).trim() !== '' ? parseInt(String(pubYear)) : undefined,
      evaluationYear: evalYear && evalYear !== null && String(evalYear).trim() !== '' ? parseInt(String(evalYear)) : undefined,
      additionalInfo: row.additionalInfo && String(row.additionalInfo).trim() !== '' ? String(row.additionalInfo).trim() : undefined,
    };
  }).filter(agent => {
    // Only include valid IARC groups
    const validGroups = ['1', '2A', '2B', '3', '4'];
    return validGroups.includes(agent.group);
  });
  
  // Group distribution
  const groups = {};
  normalizedAgents.forEach(agent => {
    groups[agent.group] = (groups[agent.group] || 0) + 1;
  });
  
  console.log('\nGroup distribution:');
  Object.entries(groups).sort().forEach(([group, count]) => {
    console.log(`  Group ${group}: ${count}`);
  });
  
  // Generate TypeScript file - carefully escape template literals
  const tsContent = `// IARC Monographs Database
// Generated from: Agents Classified by the IARC Monographs, Volumes 1–140 (1).xlsx
// Total agents: ${normalizedAgents.length}
// Generated: ${new Date().toISOString()}

export interface IARCAgent {
  casNo?: string;
  agent: string;
  group: '1' | '2A' | '2B' | '3' | '4';
  volume?: string;
  publicationYear?: number;
  evaluationYear?: number;
  additionalInfo?: string;
}

/**
 * IARC Monographs Database
 * Contains ${normalizedAgents.length} agents classified by IARC
 * 
 * Groups:
 * - 1: Carcinogenic to humans
 * - 2A: Probably carcinogenic to humans
 * - 2B: Possibly carcinogenic to humans
 * - 3: Not classifiable as to carcinogenicity
 * - 4: Probably not carcinogenic to humans
 */
export const IARC_AGENT_DATABASE: IARCAgent[] = ${JSON.stringify(normalizedAgents.map(agent => {
    // Remove null/undefined values (JSON.stringify will omit undefined)
    const cleaned = {};
    if (agent.casNo) cleaned.casNo = agent.casNo;
    cleaned.agent = agent.agent;
    cleaned.group = agent.group;
    if (agent.volume) cleaned.volume = agent.volume;
    if (agent.publicationYear !== null && agent.publicationYear !== undefined && !isNaN(agent.publicationYear)) {
      cleaned.publicationYear = agent.publicationYear;
    }
    if (agent.evaluationYear !== null && agent.evaluationYear !== undefined && !isNaN(agent.evaluationYear)) {
      cleaned.evaluationYear = agent.evaluationYear;
    }
    if (agent.additionalInfo) cleaned.additionalInfo = agent.additionalInfo;
    return cleaned;
  }), (key, value) => value === null ? undefined : value, 2)};

/**
 * Index by normalized agent name for fast lookup
 */
const AGENT_NAME_INDEX: Map<string, IARCAgent[]> = new Map();

/**
 * Index by CAS number for fast lookup
 */
const CAS_INDEX: Map<string, IARCAgent> = new Map();

// Build indices
IARC_AGENT_DATABASE.forEach(agent => {
  // Index by normalized agent name
  const normalizedName = normalizeAgentName(agent.agent);
  if (!AGENT_NAME_INDEX.has(normalizedName)) {
    AGENT_NAME_INDEX.set(normalizedName, []);
  }
  AGENT_NAME_INDEX.get(normalizedName)!.push(agent);
  
  // Index by CAS number if available
  if (agent.casNo) {
    CAS_INDEX.set(agent.casNo, agent);
  }
});

/**
 * Normalize agent name for matching
 */
function normalizeAgentName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^\\w\\s]/g, ' ') // Replace punctuation with spaces
    .replace(/\\s+/g, ' ') // Normalize whitespace
    .trim();
}

/**
 * Get IARC information for an agent by exact name match
 */
export function getIARCInfo(agentName: string): IARCAgent | null {
  const normalized = normalizeAgentName(agentName);
  const matches = AGENT_NAME_INDEX.get(normalized);
  return matches && matches.length > 0 ? matches[0] : null;
}

/**
 * Get IARC information by CAS number
 */
export function getIARCByCAS(casNo: string): IARCAgent | null {
  return CAS_INDEX.get(casNo) || null;
}

/**
 * Escape special regex characters
 */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^\\$\\{}\\()|[\\]\\\\]/g, '\\\\$&');
}

/**
 * Search for IARC agents in ingredient text
 * Returns all matching agents found in the text
 */
export function findIARCInIngredients(ingredientsText: string): IARCAgent[] {
  if (!ingredientsText || ingredientsText.trim().length === 0) {
    return [];
  }
  
  const normalized = normalizeAgentName(ingredientsText);
  const found: IARCAgent[] = [];
  const foundAgents = new Set<string>(); // Prevent duplicates
  
  // Check each agent in database
  for (const agent of IARC_AGENT_DATABASE) {
    const agentNormalized = normalizeAgentName(agent.agent);
    
    // Exact match or contains match (word boundary)
    const escaped = escapeRegex(agentNormalized);
    const regexPattern = '\\\\b' + escaped + '\\\\b';
    const regex = new RegExp(regexPattern, 'i');
    if (normalized === agentNormalized || regex.test(normalized)) {
      const key = agent.agent + '|' + agent.group;
      if (!foundAgents.has(key)) {
        found.push(agent);
        foundAgents.add(key);
      }
    }
  }
  
  return found;
}

/**
 * Get all agents in a specific IARC group
 */
export function getAgentsByGroup(group: '1' | '2A' | '2B' | '3' | '4'): IARCAgent[] {
  return IARC_AGENT_DATABASE.filter(agent => agent.group === group);
}

/**
 * Get total count of agents
 */
export function getTotalAgentCount(): number {
  return IARC_AGENT_DATABASE.length;
}
`;

  // Write TypeScript file
  const outputPath = path.join(__dirname, 'src', 'data', 'iarcAgents.ts');
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, tsContent, 'utf8');
  
  console.log(`\n✅ TypeScript file generated: ${outputPath}`);
  console.log(`   Total agents: ${normalizedAgents.length}`);
  
  // Also create JSON for reference
  const jsonPath = path.join(__dirname, 'src', 'data', 'iarcAgents.json');
  fs.writeFileSync(jsonPath, JSON.stringify(normalizedAgents, null, 2), 'utf8');
  console.log(`✅ JSON file generated: ${jsonPath}`);
  
} catch (error) {
  console.error('❌ Error:', error.message);
  process.exit(1);
}
