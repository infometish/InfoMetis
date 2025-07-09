# InfoMetis Platform

This directory contains version-specific releases of the InfoMetis platform, organized by semantic version, along with shared resources.

## Directory Structure

```
InfoMetis/
├── cache/          # Shared container image cache (gitignored)
├── data/           # Shared runtime data (gitignored)
├── v0.1.0/         # Version-specific releases
├── v0.2.0/
└── README.md
```

## Version Structure

Each version folder contains:
- Complete platform components for that release
- Version-specific documentation
- Scripts and automation tools
- Configuration files
- Test suites

## Available Versions

### v0.1.0 - WSL NiFi Dev Platform with CAI
- **Status**: Current Release
- **Features**: NiFi deployment, CAI automation, monitoring dashboard
- **Platform**: WSL with kind/k0s support

## Version Naming Convention

- **Major Version (X.0.0)**: Architecture changes, breaking compatibility
- **Minor Version (0.X.0)**: New services and features
- **Patch Version (0.0.X)**: Bug fixes and improvements

## Usage

To use a specific version:
1. Navigate to the version folder: `cd InfoMetis/v0.1.0/`
2. Follow the README.md in that version folder
3. Use the scripts and configurations from that version

## Future Versions

- **v0.2.0**: NiFi Registry with Git Integration
- **v0.3.0**: Elasticsearch Integration
- **v0.4.0**: Grafana Monitoring and Visualization
- **v0.5.0**: Kafka Streaming Integration

---

*This versioning system enables prototyping with specific release packages while maintaining development continuity.*