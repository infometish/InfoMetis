# InfoMetis - FluxCD + Kustomize Integration Design

[← Back to Home](../../README.md)

## Overview

InfoMetis will integrate with existing FluxCD + Kustomize infrastructure to provide GitOps deployment capabilities while maintaining the disciplined separation of concerns between core services and environment adaptation.

## FluxCD + Kustomize Background

### Current Team Setup
- **FluxCD**: GitOps operator for continuous deployment
- **Kustomize**: YAML-based configuration management already in use by team
- **Plain YAML**: Team familiar with YAML-based configurations
- **Proven Workflow**: Existing experience with environment management

### FluxCD Workflow
```
[Git Repository - InfoMetis Configurations]
  ↓ [FluxCD watches for changes]
[Kubernetes Cluster - Desired State Applied]
  ↓ [Continuous reconciliation]
[Drift Detection and Correction]
```

## InfoMetis Kustomize Structure Design

### Directory Structure
```
infometis/
├── core/                           # Self-contained InfoMetis core
│   ├── services/
│   │   ├── kafka/
│   │   │   ├── deployment.yaml
│   │   │   ├── service.yaml
│   │   │   └── configmap.yaml
│   │   ├── elasticsearch/
│   │   │   ├── deployment.yaml
│   │   │   ├── service.yaml
│   │   │   └── configmap.yaml
│   │   └── nifi/
│   │       ├── deployment.yaml
│   │       ├── service.yaml
│   │       └── configmap.yaml
│   ├── networking/
│   │   └── traefik-internal.yaml   # Internal routing configuration
│   └── kustomization.yaml          # Core service definitions
│
├── adaptations/                    # Deployment mode adaptations
│   ├── independent/                # k0s deployment mode
│   │   ├── traefik-external.yaml  # LoadBalancer ingress setup
│   │   ├── cluster-setup.yaml     # k0s specific configurations
│   │   └── kustomization.yaml     # base: ../../core
│   │
│   └── shared-cluster/             # Shared k8s deployment mode
│       ├── traefik-external.yaml  # ClusterIP + existing ingress integration
│       ├── rbac.yaml              # Namespace-specific RBAC restrictions
│       ├── network-policies.yaml  # Network policies if cluster allows
│       └── kustomization.yaml     # base: ../../core
│
└── environments/                   # Environment-specific configurations
    ├── dev/
    │   ├── resource-limits.yaml   # Development resource constraints
    │   ├── replica-counts.yaml    # Lower replica counts for dev
    │   └── kustomization.yaml     # base: ../../adaptations/independent
    ├── uat/
    │   ├── resource-limits.yaml   # UAT resource allocation
    │   ├── replica-counts.yaml    # UAT-appropriate scaling
    │   └── kustomization.yaml     # base: ../../adaptations/shared-cluster
    └── prod/
        ├── resource-limits.yaml   # Production resource requirements
        ├── replica-counts.yaml    # Production scaling configuration
        ├── security-policies.yaml # Production-specific security policies
        └── kustomization.yaml     # base: ../../adaptations/shared-cluster
```

## Architectural Alignment

### Core Services (Environment-Agnostic)
**Location**: `core/services/`
- **Principle**: Never changes regardless of deployment environment
- **Contents**: Service deployments, internal services, configuration maps
- **Kustomize Role**: Base layer for all deployments
- **FluxCD Impact**: Core changes propagate to all environments automatically

### Adaptation Layer (Deployment-Mode Specific)
**Location**: `adaptations/`
- **Principle**: Only contains deployment mode differences
- **Contents**: External connectivity, ingress configuration, mode-specific setup
- **Kustomize Role**: Overlay that adds deployment mode capabilities to core
- **FluxCD Impact**: Different adaptations can be tested independently

### Environment Configuration (Environment-Specific)
**Location**: `environments/`
- **Principle**: Only scaling, resource, and compliance differences
- **Contents**: Resource limits, replica counts, environment-specific policies
- **Kustomize Role**: Final overlay that applies environment-specific parameters
- **FluxCD Impact**: Environment promotion through Git workflow

## FluxCD Integration Patterns

### Development Environment
```yaml
# dev/kustomization.yaml
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization
resources:
- ../../adaptations/independent  # Uses k0s deployment mode
patchesStrategicMerge:
- resource-limits.yaml           # Dev-specific resource constraints
- replica-counts.yaml            # Lower replica counts
```

### Production Environment
```yaml
# prod/kustomization.yaml
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization
resources:
- ../../adaptations/shared-cluster  # Uses shared k8s deployment mode
patchesStrategicMerge:
- resource-limits.yaml              # Production resource requirements
- replica-counts.yaml               # Production scaling
- security-policies.yaml            # Production security policies
```

## GitOps Workflow Integration

### Repository Structure
```
infometis-config/
├── clusters/
│   ├── dev-cluster/
│   │   └── infometis/
│   │       └── kustomization.yaml -> ../../../../infometis/environments/dev/
│   ├── uat-cluster/
│   └── prod-cluster/
└── infometis/                     # InfoMetis configurations (as above)
```

### FluxCD Configuration
- **Source**: Git repository containing InfoMetis configurations
- **Kustomize Controller**: Applies appropriate environment overlay
- **Reconciliation**: Continuous monitoring and drift correction
- **Notifications**: Deployment status and error alerts

## Benefits

### Architectural Benefits
- **Clear Separation**: Core, adaptation, and environment concerns clearly separated
- **Reusability**: Core services reused across all environments
- **Maintainability**: Changes to core automatically propagate appropriately
- **Testability**: Each layer can be tested independently

### Operational Benefits
- **Team Familiarity**: Leverages existing Kustomize expertise
- **GitOps Workflow**: Integrates with existing FluxCD infrastructure
- **Environment Promotion**: Standard Git-based promotion workflow
- **Rollback Capability**: Git history provides rollback mechanism

### Development Benefits
- **Independent Development**: Core can be developed without environment concerns
- **Rapid Iteration**: Development environment uses simple independent mode
- **Production Readiness**: Same core automatically works in production adaptation
- **Configuration Clarity**: Clear understanding of what changes between environments

## Implementation Strategy

### Phase 1: Core + Independent Adaptation
- Implement `core/` with essential services (Kafka, Elasticsearch, NiFi)
- Create `adaptations/independent/` for k0s deployment
- Set up basic FluxCD integration for development environment

### Phase 2: Shared Cluster Adaptation
- Implement `adaptations/shared-cluster/` for shared Kubernetes deployment
- Add environment-specific configurations in `environments/`
- Extend FluxCD integration for UAT and production environments

### Phase 3: Advanced Environment Management
- Add sophisticated environment-specific policies
- Implement advanced security and compliance configurations
- Optimize GitOps workflow for enterprise requirements

## Success Criteria

### Technical Validation
- **Core Consistency**: Same core services run identically across all environments
- **Adaptation Effectiveness**: Deployment modes work correctly in their target environments
- **Environment Isolation**: Environment-specific changes don't affect other environments
- **GitOps Integration**: FluxCD successfully manages deployments across all environments

### Operational Validation
- **Team Adoption**: Development team can easily work with Kustomize structure
- **Deployment Reliability**: Consistent and reliable deployments across environments
- **Troubleshooting Clarity**: Issues can be quickly isolated to appropriate layer
- **Change Management**: Changes propagate correctly through GitOps workflow

---

*FluxCD + Kustomize integration design during preliminary discussion phase*
*Date: 2025-06-24*