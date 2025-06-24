# ESSENTIAL_COMMANDS

## Main Execution
```bash
./spl_execute <install-folder> <app-name> <command> [options] [args]
./spl_execute spl test-suite spl/console/log hello world
```

## From App Directory
```bash
./spl <command>                                 # Direct execution
./spl spl/app/exec -f {file}.batch             # Test batch files
./spl spl/app/create -f {file}.batch           # Generate usr/ methods
./spl spl/app/run -f {script} -a {args}        # Run script with arguments
./spl spl/app/wrap -f {script}                 # Wrap script as usr/ method
```

## Four-Step Release Process
1. `./spl_execute spl boot usr/apps_to_release` (Update app packages)
2. `./spl_execute spl boot usr/release_to_install -a {folder}` (Release → Install)
3. `./spl_execute spl boot usr/modules_to_boot` (Install → Boot)  
4. `./spl_execute spl boot usr/boot_to_release` (Boot → Release)

## Quick Debugging
- **Use debug flag**: `./spl_execute spl app-name -d command` 
- **Check modules**: Read app's `spl.js` for module path resolution
- **Test help**: All commands support `-h` or `--help`
- **Path issues**: Use `spl.context(input, "cwd")` for install root