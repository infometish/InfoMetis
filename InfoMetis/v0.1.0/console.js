// console.js - InfoMetis Implementation Console
// Dead simple start (bare-migration ready)
const { execSync } = require('child_process');
const readline = require('readline');
const fs = require('fs');
const path = require('path');

// Load config - structure ready for bare runtime
const config = JSON.parse(fs.readFileSync('console-config.json', 'utf8'));

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

let currentSection = null;

function showMainMenu() {
    console.log(`\n${config.title}`);
    console.log('='.repeat(config.title.length));
    
    config.sections.forEach(section => {
        console.log(`\n${section.icon} ${section.name}`);
        section.steps.forEach((step, index) => {
            const status = getStepStatus(step.script);
            console.log(`  ${index + 1}. ${status} ${step.name}`);
        });
    });
    
    console.log('\nOptions:');
    console.log('• Enter section letter to enter section:');
    config.sections.forEach(section => {
        console.log(`  ${section.key.toUpperCase()} - ${section.name}`);
    });
    console.log('• Type "auto" for full sequential execution');
    console.log('• Type "status" for detailed status');
    console.log('• Type "q" to quit');
    
    rl.question('\nChoice: ', (answer) => {
        if (answer === 'q' || answer === 'quit') {
            rl.close();
            return;
        }
        
        if (answer === 'auto') {
            runFullSequential();
            return;
        }
        
        if (answer === 'status') {
            showDetailedStatus();
            return;
        }
        
        const section = config.sections.find(s => s.key.toLowerCase() === answer.toLowerCase());
        if (section) {
            showSectionMenu(section);
        } else {
            console.log('❌ Invalid choice');
            showMainMenu();
        }
    });
}

function showSectionMenu(section) {
    currentSection = section;
    console.log(`\n${section.icon} ${section.name} Section`);
    console.log('='.repeat(`${section.name} Section`.length));
    
    section.steps.forEach((step, index) => {
        const status = getStepStatus(step.script);
        console.log(`${index + 1}. ${status} ${step.name}`);
        console.log(`   📋 ${step.description}`);
        console.log(`   ⏱️  Est. time: ${step.estimated_time}`);
    });
    
    console.log('\nOptions:');
    console.log('• Enter step number (1-' + section.steps.length + ') to run step');
    console.log('• Type "auto" for section sequential execution');
    console.log('• Type "back" to return to main menu');
    console.log('• Type "q" to quit');
    
    rl.question('\nChoice: ', (answer) => {
        if (answer === 'q' || answer === 'quit') {
            rl.close();
            return;
        }
        
        if (answer === 'back') {
            currentSection = null;
            showMainMenu();
            return;
        }
        
        if (answer === 'auto') {
            runSectionSequential(section);
            return;
        }
        
        const choice = parseInt(answer) - 1;
        if (choice >= 0 && choice < section.steps.length) {
            runCommand(section.steps[choice]);
        } else {
            console.log('❌ Invalid choice');
            showSectionMenu(section);
        }
    });
}

function getStepStatus(scriptName) {
    // Simple heuristic: check if script exists and is executable
    const scriptPath = path.join('implementation', scriptName);
    try {
        fs.accessSync(scriptPath, fs.constants.F_OK);
        return '✅';
    } catch {
        return '❌';
    }
}

function runCommand(step) {
    console.log(`\n🔄 Running: ${step.name}...`);
    console.log(`📋 Script: ${step.script}`);
    console.log(`📝 Description: ${step.description}`);
    console.log('');
    
    // Execute the script
    try {
        const scriptPath = path.join('implementation', step.script);
        execSync(`bash "${scriptPath}"`, { 
            stdio: 'inherit',
            cwd: process.cwd()
        });
        
        console.log('\n✅ Script execution completed!');
        
        // Run validation if configured
        if (step.validation) {
            console.log(`\n🔍 Validating: ${step.validation.success_message}...`);
            if (validateStep(step.validation)) {
                console.log('✅ Validation passed!');
            } else {
                console.log('❌ Validation failed!');
                console.log('\nPress Enter to continue...');
                rl.question('', () => {
                    if (currentSection) {
                        showSectionMenu(currentSection);
                    } else {
                        showMainMenu();
                    }
                });
                return;
            }
        }
        
        console.log('\n🎉 Step completed successfully!');
        
    } catch (error) {
        console.log('\n❌ Step failed!');
        console.log(`Error: ${error.message}`);
    }
    
    console.log('\nPress Enter to continue...');
    rl.question('', () => {
        if (currentSection) {
            showSectionMenu(currentSection);
        } else {
            showMainMenu();
        }
    });
}

function validateStep(validation) {
    const startTime = Date.now();
    const timeoutMs = validation.timeout * 1000;
    
    while (Date.now() - startTime < timeoutMs) {
        try {
            execSync(validation.command, { stdio: 'pipe' });
            return true; // Command succeeded
        } catch (error) {
            // Command failed, wait and retry
            console.log('⏳ Waiting for condition...');
            execSync('sleep 2', { stdio: 'pipe' });
        }
    }
    
    return false; // Timeout reached
}

function runSectionSequential(section) {
    console.log(`\n🚀 Sequential Execution: ${section.name}`);
    console.log('='.repeat(`Sequential Execution: ${section.name}`.length));
    console.log('This will run all steps in this section. Continue?');
    
    rl.question('Type "yes" to proceed: ', (answer) => {
        if (answer.toLowerCase() === 'yes') {
            executeSectionSequential(section, 0);
        } else {
            showSectionMenu(section);
        }
    });
}

function runFullSequential() {
    console.log('\n🚀 Full Sequential Execution Mode');
    console.log('=================================');
    console.log('This will run ALL sections in order. Continue?');
    
    rl.question('Type "yes" to proceed: ', (answer) => {
        if (answer.toLowerCase() === 'yes') {
            executeFullSequential(0, 0);
        } else {
            showMainMenu();
        }
    });
}

function executeSectionSequential(section, stepIndex) {
    if (stepIndex >= section.steps.length) {
        console.log(`\n🎉 ${section.name} section completed!`);
        console.log('\nPress Enter to return to section menu...');
        rl.question('', () => {
            showSectionMenu(section);
        });
        return;
    }
    
    const step = section.steps[stepIndex];
    console.log(`\n📋 Step ${stepIndex + 1}/${section.steps.length}: ${step.name}`);
    console.log(`📝 ${step.description}`);
    
    rl.question('Press Enter to run, or "s" to skip: ', (answer) => {
        if (answer.toLowerCase() === 's') {
            console.log('⏭️  Skipped');
            executeSectionSequential(section, stepIndex + 1);
            return;
        }
        
        try {
            const scriptPath = path.join('implementation', step.script);
            execSync(`bash "${scriptPath}"`, { 
                stdio: 'inherit',
                cwd: process.cwd()
            });
            console.log('✅ Step completed!');
        } catch (error) {
            console.log('❌ Step failed!');
            rl.question('Continue anyway? (y/N): ', (continueAnswer) => {
                if (continueAnswer.toLowerCase() !== 'y') {
                    showSectionMenu(section);
                    return;
                }
            });
        }
        
        executeSectionSequential(section, stepIndex + 1);
    });
}

function executeFullSequential(sectionIndex, stepIndex) {
    if (sectionIndex >= config.sections.length) {
        console.log('\n🎉 All sections completed!');
        console.log('\nPress Enter to return to main menu...');
        rl.question('', () => {
            showMainMenu();
        });
        return;
    }
    
    const section = config.sections[sectionIndex];
    if (stepIndex >= section.steps.length) {
        console.log(`\n✅ ${section.name} section completed!`);
        executeFullSequential(sectionIndex + 1, 0);
        return;
    }
    
    const step = section.steps[stepIndex];
    console.log(`\n📋 [${section.name}] Step ${stepIndex + 1}/${section.steps.length}: ${step.name}`);
    console.log(`📝 ${step.description}`);
    
    rl.question('Press Enter to run, or "s" to skip: ', (answer) => {
        if (answer.toLowerCase() === 's') {
            console.log('⏭️  Skipped');
            executeFullSequential(sectionIndex, stepIndex + 1);
            return;
        }
        
        try {
            const scriptPath = path.join('implementation', step.script);
            execSync(`bash "${scriptPath}"`, { 
                stdio: 'inherit',
                cwd: process.cwd()
            });
            console.log('✅ Step completed!');
        } catch (error) {
            console.log('❌ Step failed!');
            rl.question('Continue anyway? (y/N): ', (continueAnswer) => {
                if (continueAnswer.toLowerCase() !== 'y') {
                    showMainMenu();
                    return;
                }
            });
        }
        
        executeFullSequential(sectionIndex, stepIndex + 1);
    });
}

function showDetailedStatus() {
    console.log('\n📊 Implementation Status Report');
    console.log('==============================');
    
    config.sections.forEach(section => {
        console.log(`\n${section.icon} ${section.name}:`);
        
        section.steps.forEach((step, index) => {
            const status = getStepStatus(step.script);
            console.log(`   ${index + 1}. ${status} ${step.name}`);
        });
    });
    
    console.log('\n📋 Access URLs:');
    config.urls.forEach(url => {
        console.log(`   • ${url.name}: ${url.url}`);
    });
    
    console.log('\nPress Enter to return to main menu...');
    rl.question('', () => {
        showMainMenu();
    });
}

// Handle Ctrl+C gracefully
process.on('SIGINT', () => {
    console.log('\n\n👋 Goodbye!');
    rl.close();
    process.exit(0);
});

// Start the console
console.log('🚀 InfoMetis Implementation Console Starting...');
showMainMenu();