#!/usr/bin/env node

/**
 * GitHub Projects v2 Automation Script
 * Programmatically manages project fields, views, and issue assignments
 */

const { execSync } = require('child_process');

// Project configuration
const PROJECT_NUMBER = 1;
const ORG = 'SPlectrum';

// Helper function to execute GraphQL queries
function graphql(query, variables = {}) {
  const cmd = `gh api graphql -f query='${query.replace(/'/g, "\\'")}' ${
    Object.entries(variables).map(([k, v]) => `-F ${k}='${v}'`).join(' ')
  }`;
  
  try {
    const result = execSync(cmd, { encoding: 'utf8' });
    return JSON.parse(result);
  } catch (error) {
    console.error('GraphQL Error:', error.message);
    throw error;
  }
}

// Get project ID and field information
function getProjectInfo() {
  const query = `
    query {
      organization(login: "${ORG}") {
        projectV2(number: ${PROJECT_NUMBER}) {
          id
          fields(first: 50) {
            nodes {
              ... on ProjectV2Field {
                id
                name
                dataType
              }
              ... on ProjectV2SingleSelectField {
                id
                name
                dataType
                options {
                  id
                  name
                }
              }
            }
          }
        }
      }
    }
  `;
  
  return graphql(query);
}

// Update issue field value
function updateIssueField(projectId, itemId, fieldId, value, optionId = null) {
  const mutation = `
    mutation {
      updateProjectV2ItemFieldValue(
        input: {
          projectId: "${projectId}"
          itemId: "${itemId}"
          fieldId: "${fieldId}"
          value: ${optionId ? `{singleSelectOptionId: "${optionId}"}` : `{number: ${value}}`}
        }
      ) {
        projectV2Item {
          id
        }
      }
    }
  `;
  
  return graphql(mutation);
}

// Bulk update issues with decision-making field values
function configureDecisionMakingFields() {
  console.log('🔧 Configuring decision-making fields...');
  
  const projectInfo = getProjectInfo();
  const project = projectInfo.data.organization.projectV2;
  const projectId = project.id;
  
  // Find our custom fields
  const sessionTypeField = project.fields.nodes.find(f => f.name === 'Session Type');
  const decisionScoreField = project.fields.nodes.find(f => f.name === 'Decision Score');
  const contextSwitchField = project.fields.nodes.find(f => f.name === 'Context Switch Cost');
  
  if (!sessionTypeField || !decisionScoreField || !contextSwitchField) {
    console.error('❌ Custom fields not found. Please ensure they are created first.');
    return;
  }
  
  // Issue classification for 0.6.1 focus
  const issueConfig = {
    // Analysis/Planning issues (current version priority)
    planning: {
      issues: [10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21],
      sessionType: 'Planning',
      contextSwitchCost: 'Low',
      decisionScore: 85
    },
    
    // Infrastructure/Tools 
    infrastructure: {
      issues: [9, 24, 25, 26],
      sessionType: 'Deep Work',
      contextSwitchCost: 'Medium', 
      decisionScore: 75
    },
    
    // Implementation (future versions)
    implementation: {
      issues: [1, 2, 3, 4, 5, 6, 7],
      sessionType: 'Deep Work',
      contextSwitchCost: 'High',
      decisionScore: 60
    }
  };
  
  // Apply configuration
  Object.entries(issueConfig).forEach(([category, config]) => {
    console.log(`📋 Configuring ${category} issues...`);
    
    config.issues.forEach(issueNumber => {
      try {
        // Get item ID for issue
        const itemQuery = `
          query {
            organization(login: "${ORG}") {
              projectV2(number: ${PROJECT_NUMBER}) {
                items(first: 100) {
                  nodes {
                    id
                    content {
                      ... on Issue {
                        number
                      }
                    }
                  }
                }
              }
            }
          }
        `;
        
        const itemResult = graphql(itemQuery);
        const item = itemResult.data.organization.projectV2.items.nodes
          .find(item => item.content?.number === issueNumber);
          
        if (!item) {
          console.warn(`⚠️  Issue #${issueNumber} not found in project`);
          return;
        }
        
        // Update Session Type
        const sessionOption = sessionTypeField.options.find(opt => opt.name === config.sessionType);
        if (sessionOption) {
          updateIssueField(projectId, item.id, sessionTypeField.id, null, sessionOption.id);
        }
        
        // Update Context Switch Cost
        const contextOption = contextSwitchField.options.find(opt => opt.name === config.contextSwitchCost);
        if (contextOption) {
          updateIssueField(projectId, item.id, contextSwitchField.id, null, contextOption.id);
        }
        
        // Update Decision Score
        updateIssueField(projectId, item.id, decisionScoreField.id, config.decisionScore);
        
        console.log(`✅ Updated issue #${issueNumber}`);
        
      } catch (error) {
        console.error(`❌ Failed to update issue #${issueNumber}:`, error.message);
      }
    });
  });
  
  console.log('🎉 Decision-making fields configured!');
}

// Configure Epic and Version fields
function configureEpicAndVersionFields() {
  console.log('🔧 Configuring Epic and Version fields...');
  
  const projectInfo = getProjectInfo();
  const project = projectInfo.data.organization.projectV2;
  const projectId = project.id;
  
  // Find Epic and Version fields
  const epicField = project.fields.nodes.find(f => f.name === 'Epic');
  const versionField = project.fields.nodes.find(f => f.name === 'Version');
  
  if (!epicField || !versionField) {
    console.error('❌ Epic or Version fields not found.');
    return;
  }
  
  // Epic mapping based on issue numbers
  const epicMapping = {
    // RR issues
    10: 'RR', 11: 'RR',
    // SE issues  
    12: 'SE', 13: 'SE',
    // CAE issues
    14: 'CAE', 15: 'CAE',
    // TDD issues
    16: 'TDD', 17: 'TDD',
    // BARE issues
    18: 'BARE', 19: 'BARE',
    // AVRO issues
    20: 'AVRO', 21: 'AVRO',
    // NFD issues
    9: 'NFD', 24: 'NFD', 25: 'NFD', 26: 'NFD',
    // Legacy/Implementation (assign to appropriate epics)
    1: 'CAE', 2: 'CAE', 3: 'CAE', 4: 'CAE', 5: 'CAE', 6: 'CAE', 7: 'CAE'
  };
  
  // Version assignment (0.6.1 for analysis, 0.6.2+ for implementation)
  const versionMapping = {
    // 0.6.1 - Analysis phase
    10: '0.6.1', 11: '0.6.1', 12: '0.6.1', 13: '0.6.1', 14: '0.6.1', 15: '0.6.1',
    16: '0.6.1', 17: '0.6.1', 18: '0.6.1', 19: '0.6.1', 20: '0.6.1', 21: '0.6.1',
    9: '0.6.1', 25: '0.6.1', 26: '0.6.3', // Project infrastructure
    // 0.6.2+ - Implementation phase
    1: '0.6.2', 2: '0.6.2', 3: '0.6.2', 4: '0.6.2', 5: '0.6.2', 6: '0.6.2', 7: '0.6.2',
    24: '0.6.3' // tools/gh API (future enhancement)
  };
  
  Object.entries(epicMapping).forEach(([issueNumber, epicName]) => {
    try {
      // Get item ID for issue
      const itemQuery = `
        query {
          organization(login: "${ORG}") {
            projectV2(number: ${PROJECT_NUMBER}) {
              items(first: 100) {
                nodes {
                  id
                  content {
                    ... on Issue {
                      number
                    }
                  }
                }
              }
            }
          }
        }
      `;
      
      const itemResult = graphql(itemQuery);
      const item = itemResult.data.organization.projectV2.items.nodes
        .find(item => item.content?.number === parseInt(issueNumber));
        
      if (!item) {
        console.warn(`⚠️  Issue #${issueNumber} not found in project`);
        return;
      }
      
      // Update Epic field
      const epicOption = epicField.options.find(opt => opt.name === epicName);
      if (epicOption) {
        updateIssueField(projectId, item.id, epicField.id, null, epicOption.id);
      }
      
      // Update Version field (text field)
      const version = versionMapping[issueNumber];
      if (version) {
        const versionMutation = `
          mutation {
            updateProjectV2ItemFieldValue(
              input: {
                projectId: "${projectId}"
                itemId: "${item.id}"
                fieldId: "${versionField.id}"
                value: {text: "${version}"}
              }
            ) {
              projectV2Item {
                id
              }
            }
          }
        `;
        graphql(versionMutation);
      }
      
      console.log(`✅ Updated issue #${issueNumber}: ${epicName} v${version}`);
      
    } catch (error) {
      console.error(`❌ Failed to update issue #${issueNumber}:`, error.message);
    }
  });
  
  console.log('🎉 Epic and Version fields configured!');
}

// Get current recommendations
function getNextActionRecommendations(timeAvailable = 60, recentContext = null) {
  console.log('🤔 Analyzing next action recommendations...');
  
  const query = `
    query {
      organization(login: "${ORG}") {
        projectV2(number: ${PROJECT_NUMBER}) {
          items(first: 100) {
            nodes {
              id
              fieldValues(first: 20) {
                nodes {
                  ... on ProjectV2ItemFieldTextValue {
                    field {
                      ... on ProjectV2Field {
                        name
                      }
                    }
                    text
                  }
                  ... on ProjectV2ItemFieldNumberValue {
                    field {
                      ... on ProjectV2Field {
                        name
                      }
                    }
                    number
                  }
                  ... on ProjectV2ItemFieldSingleSelectValue {
                    field {
                      ... on ProjectV2SingleSelectField {
                        name
                      }
                    }
                    name
                  }
                }
              }
              content {
                ... on Issue {
                  number
                  title
                  labels(first: 10) {
                    nodes {
                      name
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  `;
  
  const result = graphql(query);
  const items = result.data.organization.projectV2.items.nodes;
  
  // Process and rank items
  const recommendations = items
    .filter(item => item.content?.number) // Only issues
    .map(item => {
      const fields = {};
      item.fieldValues.nodes.forEach(fieldValue => {
        const fieldName = fieldValue.field?.name;
        if (fieldName) {
          fields[fieldName] = fieldValue.text || fieldValue.number || fieldValue.name;
        }
      });
      
      return {
        number: item.content.number,
        title: item.content.title,
        sessionType: fields['Session Type'],
        contextSwitchCost: fields['Context Switch Cost'],
        decisionScore: fields['Decision Score'] || 0,
        status: fields['Status'],
        epic: fields['Epic']
      };
    })
    .filter(item => item.status !== 'Done') // Only active items
    .sort((a, b) => (b.decisionScore || 0) - (a.decisionScore || 0)); // Sort by decision score
  
  console.log('📊 Top recommendations:');
  recommendations.slice(0, 5).forEach((item, index) => {
    console.log(`${index + 1}. #${item.number}: ${item.title}`);
    console.log(`   Epic: ${item.epic} | Session: ${item.sessionType} | Score: ${item.decisionScore}`);
  });
  
  return recommendations;
}

// Main execution
if (require.main === module) {
  const command = process.argv[2];
  
  switch (command) {
    case 'configure':
      configureDecisionMakingFields();
      break;
      
    case 'configure-all':
      configureDecisionMakingFields();
      configureEpicAndVersionFields();
      break;
      
    case 'epics':
      configureEpicAndVersionFields();
      break;
      
    case 'recommend':
      const timeAvailable = parseInt(process.argv[3]) || 60;
      getNextActionRecommendations(timeAvailable);
      break;
      
    case 'info':
      console.log(JSON.stringify(getProjectInfo(), null, 2));
      break;
      
    default:
      console.log(`
Usage: node project-automation.js <command>

Commands:
  configure      - Set up decision-making field values for all issues
  configure-all  - Set up all fields (decision-making + epics + versions)
  epics          - Configure Epic and Version fields only
  recommend      - Get next action recommendations
  info           - Show project structure information

Examples:
  node project-automation.js configure-all
  node project-automation.js recommend 90
      `);
  }
}

module.exports = {
  getProjectInfo,
  configureDecisionMakingFields,
  getNextActionRecommendations
};