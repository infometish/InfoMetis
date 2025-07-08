[← Back to Project Home](../README.md)

# Component Extraction Strategy

## Purpose

As InfoMetis progresses through its roadmap (v0.1.0 → v0.5.0), each service **evolves** from prototype to extractable component. This is a prototyping ground - we learn by doing.

## Evolution Pattern

### Starting Point (Prototype)
Services start messy and mixed:
```
deploy/
├── nifi-k8s.yaml           ← Mixed configs
├── setup-cluster.sh        ← Tangled scripts
└── automation/             ← Coupled logic
```

### Evolution Process
Through iterations, we discover natural boundaries:
1. **v0.1**: Get it working (messy is OK)
2. **v0.2-0.4**: Identify patterns and boundaries
3. **v0.5**: Refactor into clean components

### Target Structure (Extractable Component)

By roadmap completion, each service evolves to:

```
components/
├── nifi/                    (v0.1.0)
│   ├── container/
│   │   └── Dockerfile
│   ├── configs/
│   │   └── nifi-defaults.xml
│   ├── k8s-templates/
│   │   ├── deployment.yaml
│   │   └── service.yaml
│   ├── api-wrappers/
│   │   └── nifi-api.sh
│   └── component.yaml       ← Component metadata
│
├── nifi-registry/          (v0.2.0)
│   └── [same structure]
│
├── elasticsearch/          (v0.3.0)
│   └── [same structure]
│
├── grafana/               (v0.4.0)
│   └── [same structure]
│
└── kafka/                 (v0.5.0)
    └── [same structure]
```

## Component Metadata (component.yaml)

```yaml
component:
  name: nifi
  version: 2.0.0
  type: data-processing
  
quartet-mapping:
  packaging: infometish      # Container + configs
  execution: splectrum       # API wrappers
  composition: carambah      # Solution templates
  
capabilities:
  - data-flow
  - pipeline-creation
  - rest-api
  
platforms:
  - k8s
  - docker
  - p2p-k8s
```

## Extraction Rules

### 1. Clear Separation
- **No cross-component dependencies** in configs
- **Self-contained** deployment manifests
- **Independent** API wrappers

### 2. Platform Agnostic
- Generic configs with **environment variables**
- Platform-specific templates in **separate folders**
- Runtime detection for **platform adaptation**

### 3. Capability Declaration
- Explicit capability listing in metadata
- Presence-based detection ready
- No hidden dependencies

## Implementation Guidelines

### Prototyping Approach:

1. **Start simple** - Get it working first
2. **Document learnings** - What patterns emerge?
3. **Identify boundaries** - Where do concerns separate?
4. **Refactor gradually** - Move toward component structure
5. **Extract when ready** - Clean components emerge naturally

### Key Principle:
**Don't force structure prematurely** - Let it emerge through implementation

### Example: Adding Elasticsearch (v0.3.0)

```bash
# Create component structure
mkdir -p components/elasticsearch/{container,configs,k8s-templates,api-wrappers}

# Add component metadata
cat > components/elasticsearch/component.yaml << EOF
component:
  name: elasticsearch
  version: 8.x
  type: search-analytics
...
EOF

# Keep deployment isolated
# NO references to other components in base configs
```

## Quartet Extraction Mapping

When InfoMetis is complete, components extract to:

### InfoMetish Packages
- Container definitions
- Configuration templates
- Deployment manifests

### SPlectrum Modules
- API wrapper scripts
- Execution utilities
- Platform adapters

### Carambah Solutions
- Component compositions
- Business workflows
- Integration patterns

### Sesameh Intelligence
- Orchestration logic
- Optimization rules
- Adaptation patterns

## Benefits

1. **Clean extraction** when prototyping complete
2. **Reusable components** across projects
3. **Clear ownership** in quartet architecture
4. **Testable boundaries** from the start

---

*Structure services for extraction from day one - InfoMetis is temporary, components are permanent.*