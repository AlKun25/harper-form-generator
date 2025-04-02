/**
 * Conflict Test Generator
 * 
 * This utility creates test data with conflicting information to test
 * the system's ability to identify and resolve conflicts.
 */

const fs = require('fs');
const path = require('path');

/**
 * Generate a company data file with conflicting information
 * 
 * @param {string} companyId ID of the base company to modify
 * @param {string} outputId ID for the new test company with conflicts
 * @param {Array} conflicts Array of conflict definitions to apply
 */
function generateConflictData(companyId, outputId, conflicts = []) {
  try {
    // Load the original company data
    const companyDataPath = path.join(__dirname, '../data/memory', `${companyId}.json`);
    const companyData = JSON.parse(fs.readFileSync(companyDataPath, 'utf8'));
    
    // Apply each conflict to the data
    conflicts.forEach(conflict => {
      applyConflict(companyData, conflict);
    });
    
    // If no conflicts were specified, apply default conflicts
    if (conflicts.length === 0) {
      applyDefaultConflicts(companyData);
    }
    
    // Write the modified data to a new file
    const outputPath = path.join(__dirname, '../data/memory', `${outputId}.json`);
    fs.writeFileSync(outputPath, JSON.stringify(companyData, null, 2));
    
    return {
      success: true,
      message: `Created conflict test data at ${outputPath}`,
      conflicts: conflicts.length > 0 ? conflicts : 'default conflicts'
    };
  } catch (error) {
    console.error('Error generating conflict data:', error);
    return {
      success: false,
      message: error.message
    };
  }
}

/**
 * Apply a specific conflict to company data
 * 
 * @param {Object} companyData Company data to modify
 * @param {Object} conflict Conflict definition
 */
function applyConflict(companyData, conflict) {
  // Handle different types of conflicts
  switch (conflict.type) {
    case 'revenue':
      applyRevenueConflict(companyData, conflict);
      break;
    case 'coverage':
      applyCoverageConflict(companyData, conflict);
      break;
    case 'deductible':
      applyDeductibleConflict(companyData, conflict);
      break;
    case 'headquarters':
      applyHeadquartersConflict(companyData, conflict);
      break;
    default:
      // For unspecified conflict types, just add conflicting transcript
      companyData.unstructured.push({
        type: 'transcript',
        date: new Date().toISOString().split('T')[0],
        content: conflict.content || 'Conflicting information.'
      });
  }
}

/**
 * Apply conflicting revenue information
 */
function applyRevenueConflict(companyData, conflict) {
  // Store the original revenue
  const originalRevenue = companyData.structured.revenue;
  
  // Add newer transcript with different revenue information
  const newRevenue = conflict.value || getNextRevenue(originalRevenue);
  
  companyData.unstructured.push({
    type: 'transcript',
    date: conflict.date || new Date().toISOString().split('T')[0],
    content: `Our current annual revenue is ${newRevenue}, which is different from our previous report of ${originalRevenue}.`
  });
}

/**
 * Apply conflicting coverage information
 */
function applyCoverageConflict(companyData, conflict) {
  // Find existing coverage information in transcripts
  const existingCoverage = findCoverageInTranscripts(companyData.unstructured);
  
  // Add conflict transcript with different coverage
  const newCoverage = conflict.value || getNextCoverage(existingCoverage);
  
  companyData.unstructured.push({
    type: 'transcript',
    date: conflict.date || new Date().toISOString().split('T')[0],
    content: `We've reassessed our needs and now require liability coverage of ${newCoverage}.`
  });
}

/**
 * Apply conflicting deductible information
 */
function applyDeductibleConflict(companyData, conflict) {
  // Find existing deductible information in transcripts
  const existingDeductible = findDeductibleInTranscripts(companyData.unstructured);
  
  // Add conflict transcript with different deductible
  const newDeductible = conflict.value || getNextDeductible(existingDeductible);
  
  companyData.unstructured.push({
    type: 'transcript',
    date: conflict.date || new Date().toISOString().split('T')[0],
    content: `We'd like to update our deductible to ${newDeductible}, which is different from our previous request.`
  });
}

/**
 * Apply conflicting headquarters information
 */
function applyHeadquartersConflict(companyData, conflict) {
  // Store the original headquarters
  const originalHQ = companyData.structured.location.headquarters;
  
  // Create a new transcript with different headquarters
  const newHQ = conflict.value || getAlternativeLocation(originalHQ);
  
  companyData.unstructured.push({
    type: 'transcript',
    date: conflict.date || new Date().toISOString().split('T')[0],
    content: `We've recently relocated our headquarters to ${newHQ}.`
  });
}

/**
 * Apply a standard set of default conflicts
 */
function applyDefaultConflicts(companyData) {
  // Add revenue conflict
  applyRevenueConflict(companyData, {});
  
  // Add coverage conflict
  applyCoverageConflict(companyData, {});
  
  // Add deductible conflict
  applyDeductibleConflict(companyData, {});
}

// Helper functions

function findCoverageInTranscripts(transcripts) {
  for (const transcript of transcripts) {
    if (transcript.content.toLowerCase().includes('liability') && 
        transcript.content.toLowerCase().includes('coverage')) {
      const match = transcript.content.match(/\$\d+M/);
      if (match) return match[0];
    }
  }
  return '$1M'; // Default if not found
}

function findDeductibleInTranscripts(transcripts) {
  for (const transcript of transcripts) {
    if (transcript.content.toLowerCase().includes('deductible')) {
      const match = transcript.content.match(/\$\d+,\d+/);
      if (match) return match[0];
    }
  }
  return '$10,000'; // Default if not found
}

function getNextRevenue(revenue) {
  // Parse the revenue string and increase it
  const match = revenue.match(/\$(\d+)([KMB])/);
  if (!match) return '$15M';
  
  const value = parseInt(match[1], 10);
  const unit = match[2];
  
  const newValue = value * 1.5; // Increase by 50%
  return `$${Math.round(newValue)}${unit}`;
}

function getNextCoverage(coverage) {
  // Parse the coverage string and increase it
  const match = coverage.match(/\$(\d+)([KMB])/);
  if (!match) return '$2M';
  
  const value = parseInt(match[1], 10);
  const unit = match[2];
  
  const newValue = value * 2; // Double it
  return `$${newValue}${unit}`;
}

function getNextDeductible(deductible) {
  // Parse the deductible string and change it
  const match = deductible.match(/\$(\d+),(\d+)/);
  if (!match) return '$15,000';
  
  const value = parseInt(match[1] + match[2], 10);
  
  // Either increase or decrease by 50%
  const adjustment = Math.random() > 0.5 ? 1.5 : 0.5;
  const newValue = Math.round(value * adjustment);
  
  return `$${newValue.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`;
}

function getAlternativeLocation(location) {
  const locations = [
    'New York, NY',
    'San Francisco, CA',
    'Chicago, IL',
    'Austin, TX',
    'Seattle, WA',
    'Boston, MA',
    'Denver, CO'
  ];
  
  // Return a random location that's different from the original
  let newLocation;
  do {
    newLocation = locations[Math.floor(Math.random() * locations.length)];
  } while (newLocation === location);
  
  return newLocation;
}

// Main script execution when called directly
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.length < 2) {
    console.log('Usage: node conflict-test-generator.js <sourceCompanyId> <outputCompanyId>');
    process.exit(1);
  }
  
  const result = generateConflictData(args[0], args[1]);
  console.log(result.message);
}

module.exports = {
  generateConflictData
}; 