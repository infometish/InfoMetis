# Configurable Console UI - Simple Start, Big Vision

## Start Simple: Basic Menu Console

**First Goal**: Replace manual script execution with a dead-simple numbered menu.

```
InfoMetis Console
=================
1. Check prerequisites
2. Create k0s container
3. Wait for k0s API
...
20. Clean up CAI pipeline

Enter number (1-20) or 'q' to quit: _
```

**That's it.** Just a menu that runs the existing bash scripts.

## Simple Implementation (Week 1)

### Minimal JavaScript Script
```javascript
// console.js - Dead simple start (bare-migration ready)
const { execSync } = require('child_process');
const readline = require('readline');
const fs = require('fs');

// Load config - structure ready for bare runtime
const config = JSON.parse(fs.readFileSync('console-config.json', 'utf8'));

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function showMenu() {
    console.log(`\n${config.title}`);
    console.log('='.repeat(config.title.length));
    
    config.items.forEach((item, index) => {
        console.log(`${index + 1}. ${item.name}`);
    });
    
    rl.question('\nEnter number or "q" to quit: ', (answer) => {
        if (answer === 'q') {
            rl.close();
            return;
        }
        
        const choice = parseInt(answer) - 1;
        if (choice >= 0 && choice < config.items.length) {
            runCommand(config.items[choice]);
        } else {
            console.log('❌ Invalid choice');
            showMenu();
        }
    });
}

function runCommand(item) {
    try {
        console.log(`\n🔄 Running: ${item.name}...`);
        execSync(item.command, { stdio: 'inherit' });
        console.log('✅ Step completed!');
    } catch (error) {
        console.log('❌ Step failed!');
    }
    showMenu();
}

showMenu();
```

### Simple Config File
```json
{
  "title": "InfoMetis Console",
  "items": [
    {"name": "Check prerequisites", "command": "bash step-01-check-prerequisites.sh"},
    {"name": "Create k0s container", "command": "bash step-02-create-k0s-container.sh"},
    {"name": "Wait for k0s API", "command": "bash step-03-wait-for-k0s-api.sh"},
    {"name": "Configure kubectl", "command": "bash step-04-configure-kubectl.sh"},
    {"name": "Create namespace", "command": "bash step-05-create-namespace.sh"}
  ]
}
```

### Usage
```bash
# Simple as:
node console.js

# Or with npm (add package.json later):
npm start
```

## Evolution Path (Configuration-Driven)

### Phase 2: Make It Configurable
- **Any workflow**: Change JSON config = different console
- **Any commands**: Not just bash scripts
- **Any title**: "Database Setup Console", "Testing Console", etc.

### Phase 3: Add Simple Features
- **Status tracking**: Remember what's been run
- **Categories**: Group related items
- **Prerequisites**: Simple dependency checking

### Phase 4: Rich UI
- **Colors and icons**: Visual status indicators
- **Help text**: Descriptions for each item
- **Progress bars**: For long-running tasks

### Phase 5: Advanced Features
- **Multi-config support**: Switch between different workflows
- **Parameter input**: Dynamic command parameters
- **Parallel execution**: Run multiple items simultaneously

### Phase 6: SPlectrum Integration
- **Plugin system**: Extend with custom modules
- **API integration**: Remote command execution
- **Workflow orchestration**: Complex multi-step processes

## Core Philosophy

### Start With One Use Case
- **Current need**: InfoMetis implementation steps
- **Simple solution**: Numbered menu + existing scripts
- **Zero complexity**: Just makes current process easier

### Configuration-Driven Growth
- **Different configs** = different console applications
- **Same engine** powers database setup, testing, deployments, etc.
- **Natural evolution** from simple menu to sophisticated workflows

### Examples of Future Configurations

#### Database Management Console
```json
{
  "title": "Database Management",
  "categories": {
    "setup": ["Create database", "Run migrations", "Seed data"],
    "maintenance": ["Backup database", "Optimize tables", "Check health"]
  }
}
```

#### Testing Console  
```json
{
  "title": "Test Suite Runner",
  "items": [
    {"name": "Unit tests", "command": "npm test", "parallel": true},
    {"name": "Integration tests", "command": "npm run test:integration"},
    {"name": "E2E tests", "command": "npm run test:e2e", "depends": ["Unit tests"]}
  ]
}
```

#### SPlectrum Deployment Console
```json
{
  "title": "SPlectrum Deployments",
  "environments": ["dev", "staging", "prod"],
  "workflows": {
    "deploy": ["Build", "Test", "Deploy", "Verify"],
    "rollback": ["Stop services", "Restore backup", "Restart"]
  }
}
```

## Bare Runtime Compatibility Strategy

### Design Principles for SPlectrum Migration
- **Minimal Node.js dependencies**: Use only APIs available in bare runtime
- **Module isolation**: Each component as standalone bare-compatible module
- **Configuration-driven**: All behavior controlled via JSON/config, not code
- **Progressive enhancement**: Features degrade gracefully in bare environment

### Bare-Compatible Architecture
```javascript
// console-engine.js - Bare-compatible core
export class ConsoleEngine {
    constructor(config, runtime = 'node') {
        this.config = config;
        this.runtime = runtime; // 'node' or 'bare'
        this.modules = this.loadModules();
    }
    
    loadModules() {
        // Runtime-specific module loading
        if (this.runtime === 'bare') {
            return {
                exec: import('bare-subprocess'),
                fs: import('bare-fs'),
                console: import('bare-console')
            };
        } else {
            return {
                exec: require('child_process'),
                fs: require('fs'),
                console: console
            };
        }
    }
}
```

### Migration Path to Bare
1. **Phase 1**: Build with Node.js, keep bare compatibility in mind
2. **Phase 2**: Abstract runtime dependencies behind interfaces
3. **Phase 3**: Add bare module implementations
4. **Phase 4**: Full SPlectrum bare runtime deployment

## Implementation Roadmap

### Week 1: Proof of Concept
- **40 lines of JavaScript**: Basic numbered menu
- **JSON config**: List of InfoMetis steps  
- **Bare-compatible design**: Pure JavaScript, minimal Node.js dependencies
- **SPlectrum migration ready**: Module structure compatible with bare runtime
- **Works immediately**: Replaces manual script execution

### Week 2-3: Configuration Engine
- **Config validation**: Ensure commands exist
- **Error handling**: Graceful failure recovery
- **Status persistence**: Remember completed steps

### Month 2: Enhanced UI
- **Rich console**: Colors, progress indicators
- **Help system**: Descriptions and usage guides
- **Multiple configs**: Switch between different workflows

### Month 3: Advanced Features
- **Dependency management**: Smart execution ordering
- **Parameter input**: Dynamic command customization
- **Parallel execution**: Concurrent task processing

### Quarter 2: SPlectrum Migration & Platform Foundation
- **Bare runtime migration**: Port to bare-compatible modules
- **SPlectrum integration**: Native SPlectrum workflow orchestration
- **Plugin architecture**: Bare-compatible extensible functionality
- **Remote execution**: Distributed command processing with bare modules

## Success Metrics

### Week 1 Success
- [ ] Replace manual InfoMetis script execution
- [ ] 100% feature parity with current process
- [ ] Zero learning curve for existing users

### Month 1 Success  
- [ ] Support 3+ different workflow configurations
- [ ] Reduce task execution time by 50%
- [ ] Enable non-technical users to run complex workflows

### Quarter 1 Success
- [ ] 10+ different console configurations in use
- [ ] Community adoption for other automation workflows
- [ ] Foundation ready for SPlectrum integration

## The Big Picture

**Start**: Simple menu for InfoMetis steps  
**Evolve**: Configurable console for any workflow  
**Migrate**: Bare-compatible SPlectrum modules
**Destination**: Universal SPlectrum automation platform

**Key Insight**: The console UI becomes a **configuration-driven automation interface** that can adapt to any domain while being **SPlectrum migration ready** from day one.

### SPlectrum Evolution Path
```
Week 1:    Node.js console → InfoMetis automation
Month 1:   Multi-config → Universal workflows  
Quarter 1: Runtime abstraction → Bare-compatible modules
Quarter 2: SPlectrum integration → Enterprise platform
```

**Every improvement serves the bigger vision while maintaining bare compatibility and simplicity.**

---

**Next Action**: Build the 40-line JavaScript prototype and JSON config for InfoMetis steps.

**Timeline**: Prototype working by end of week.

**Philosophy**: Start simple, evolve continuously, configuration drives everything.