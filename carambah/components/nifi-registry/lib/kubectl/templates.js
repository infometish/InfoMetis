/**
 * InfoMetis v0.3.0 - Kubernetes YAML Templates
 * Generates Kubernetes manifests for InfoMetis components
 */

class KubernetesTemplates {
    constructor() {
        this.defaultLabels = {
            'app.kubernetes.io/part-of': 'infometis',
            'app.kubernetes.io/version': 'v0.3.0'
        };
    }

    /**
     * Create PersistentVolume manifest
     * @param {object} options - PV configuration
     * @returns {string} YAML manifest
     */
    createPersistentVolume(options) {
        const {
            name,
            capacity = '5Gi',
            storageClassName = 'local-storage',
            hostPath,
            accessModes = ['ReadWriteOnce'],
            reclaimPolicy = 'Retain'
        } = options;

        return `apiVersion: v1
kind: PersistentVolume
metadata:
  name: ${name}
  labels:
    ${this.formatLabels(this.defaultLabels)}
spec:
  capacity:
    storage: ${capacity}
  accessModes:
${accessModes.map(mode => `  - ${mode}`).join('\n')}
  persistentVolumeReclaimPolicy: ${reclaimPolicy}
  storageClassName: ${storageClassName}
  hostPath:
    path: ${hostPath}
    type: DirectoryOrCreate`;
    }

    /**
     * Create PersistentVolumeClaim manifest
     * @param {object} options - PVC configuration
     * @returns {string} YAML manifest
     */
    createPersistentVolumeClaim(options) {
        const {
            name,
            namespace,
            capacity = '5Gi',
            storageClassName = 'local-storage',
            accessModes = ['ReadWriteOnce'],
            labels = {}
        } = options;

        return `apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: ${name}
  namespace: ${namespace}
  labels:
    ${this.formatLabels({...this.defaultLabels, ...labels})}
spec:
  accessModes:
${accessModes.map(mode => `  - ${mode}`).join('\n')}
  resources:
    requests:
      storage: ${capacity}
  storageClassName: ${storageClassName}`;
    }

    /**
     * Create ConfigMap manifest
     * @param {object} options - ConfigMap configuration
     * @returns {string} YAML manifest
     */
    createConfigMap(options) {
        const {
            name,
            namespace,
            data = {},
            labels = {}
        } = options;

        const dataYaml = Object.entries(data).map(([key, value]) => {
            // Handle multi-line values with proper indentation
            const lines = value.split('\n');
            if (lines.length > 1) {
                return `  ${key}: |\n${lines.map(line => `    ${line}`).join('\n')}`;
            } else {
                return `  ${key}: ${value}`;
            }
        }).join('\n');

        return `apiVersion: v1
kind: ConfigMap
metadata:
  name: ${name}
  namespace: ${namespace}
  labels:
    ${this.formatLabels({...this.defaultLabels, ...labels})}
data:
${dataYaml}`;
    }

    /**
     * Create Deployment manifest
     * @param {object} options - Deployment configuration
     * @returns {string} YAML manifest
     */
    createDeployment(options) {
        const {
            name,
            namespace,
            image,
            replicas = 1,
            ports = [],
            env = [],
            volumeMounts = [],
            volumes = [],
            labels = {},
            resources = {},
            probes = {},
            initContainers = [],
            serviceAccountName = null,
            hostNetwork = false,
            args = [],
            tolerations = []
        } = options;

        const deploymentLabels = {
            app: name,
            ...this.defaultLabels,
            ...labels
        };

        // Build metadata labels
        const metadataLabels = Object.entries(deploymentLabels)
            .map(([key, value]) => `    ${key}: "${value}"`)
            .join('\n');
        
        const templateLabels = Object.entries(deploymentLabels)
            .map(([key, value]) => `        ${key}: "${value}"`)
            .join('\n');

        let manifest = `apiVersion: apps/v1
kind: Deployment
metadata:
  name: ${name}
  namespace: ${namespace}
  labels:
${metadataLabels}
spec:
  replicas: ${replicas}
  selector:
    matchLabels:
      app: ${name}
  template:
    metadata:
      labels:
${templateLabels}
    spec:`;

        // Add init containers if provided
        if (initContainers.length > 0) {
            manifest += `\n      initContainers:`;
            initContainers.forEach(container => {
                manifest += `\n      - name: ${container.name}
        image: ${container.image}
        command: ${JSON.stringify(container.command)}
        args:
${container.args.map(arg => `        - ${arg}`).join('\n')}`;
                if (container.volumeMounts) {
                    manifest += `\n        volumeMounts:`;
                    container.volumeMounts.forEach(mount => {
                        manifest += `\n        - name: ${mount.name}
          mountPath: ${mount.mountPath}`;
                        if (mount.subPath) manifest += `\n          subPath: ${mount.subPath}`;
                    });
                }
            });
        }

        // Main container
        // Add service account if provided
        if (serviceAccountName) {
            manifest += `\n      serviceAccountName: ${serviceAccountName}`;
        }

        // Add host network if enabled
        if (hostNetwork) {
            manifest += `\n      hostNetwork: true`;
        }

        // Add tolerations if provided
        if (tolerations.length > 0) {
            manifest += `\n      tolerations:`;
            tolerations.forEach(toleration => {
                manifest += `\n      - key: ${toleration.key}
        effect: ${toleration.effect}`;
            });
        }

        manifest += `\n      containers:
      - name: ${name}
        image: ${image}
        imagePullPolicy: IfNotPresent`;

        // Add args if provided
        if (args.length > 0) {
            manifest += `\n        args:`;
            args.forEach(arg => {
                manifest += `\n        - ${arg}`;
            });
        }

        // Ports
        if (ports.length > 0) {
            manifest += `\n        ports:`;
            ports.forEach(port => {
                manifest += `\n        - containerPort: ${port.containerPort}
          name: ${port.name}`;
                if (port.hostPort) {
                    manifest += `\n          hostPort: ${port.hostPort}`;
                }
            });
        }

        // Environment variables
        if (env.length > 0) {
            manifest += `\n        env:`;
            env.forEach(envVar => {
                manifest += `\n        - name: ${envVar.name}
          value: "${envVar.value}"`;
            });
        }

        // Volume mounts
        if (volumeMounts.length > 0) {
            manifest += `\n        volumeMounts:`;
            volumeMounts.forEach(mount => {
                manifest += `\n        - name: ${mount.name}
          mountPath: ${mount.mountPath}`;
                if (mount.subPath) manifest += `\n          subPath: ${mount.subPath}`;
            });
        }

        // Resources
        if (Object.keys(resources).length > 0) {
            manifest += `\n        resources:`;
            if (resources.requests) {
                manifest += `\n          requests:
            memory: "${resources.requests.memory}"
            cpu: "${resources.requests.cpu}"`;
            }
            if (resources.limits) {
                manifest += `\n          limits:
            memory: "${resources.limits.memory}"
            cpu: "${resources.limits.cpu}"`;
            }
        }

        // Probes
        ['readinessProbe', 'livenessProbe'].forEach(probeType => {
            if (probes[probeType]) {
                const probe = probes[probeType];
                manifest += `\n        ${probeType}:
          httpGet:
            path: ${probe.path}
            port: ${probe.port}
            scheme: ${probe.scheme || 'HTTP'}
          initialDelaySeconds: ${probe.initialDelaySeconds || 30}
          periodSeconds: ${probe.periodSeconds || 30}
          timeoutSeconds: ${probe.timeoutSeconds || 10}`;
            }
        });

        // Volumes
        if (volumes.length > 0) {
            manifest += `\n      volumes:`;
            volumes.forEach(volume => {
                manifest += `\n      - name: ${volume.name}`;
                if (volume.persistentVolumeClaim) {
                    manifest += `\n        persistentVolumeClaim:
          claimName: ${volume.persistentVolumeClaim.claimName}`;
                } else if (volume.configMap) {
                    manifest += `\n        configMap:
          name: ${volume.configMap.name}`;
                }
            });
        }

        return manifest;
    }

    /**
     * Create Service manifest
     * @param {object} options - Service configuration
     * @returns {string} YAML manifest
     */
    createService(options) {
        const {
            name,
            namespace,
            selector,
            ports = [],
            type = 'ClusterIP',
            labels = {}
        } = options;

        let manifest = `apiVersion: v1
kind: Service
metadata:
  name: ${name}
  namespace: ${namespace}
  labels:
    ${this.formatLabels({...this.defaultLabels, ...labels})}
spec:
  selector:
    ${this.formatLabels(selector)}
  ports:`;

        ports.forEach(port => {
            manifest += `\n  - name: ${port.name}
    port: ${port.port}
    targetPort: ${port.targetPort}`;
            if (port.protocol) manifest += `\n    protocol: ${port.protocol}`;
        });

        manifest += `\n  type: ${type}`;

        return manifest;
    }

    /**
     * Create Ingress manifest
     * @param {object} options - Ingress configuration
     * @returns {string} YAML manifest
     */
    createIngress(options) {
        const {
            name,
            namespace,
            rules = [],
            annotations = {},
            labels = {}
        } = options;

        let manifest = `apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: ${name}
  namespace: ${namespace}
  labels:
    ${this.formatLabels({...this.defaultLabels, ...labels})}`;

        if (Object.keys(annotations).length > 0) {
            manifest += `\n  annotations:
    ${this.formatLabels(annotations)}`;
        }

        manifest += `\nspec:
  rules:`;

        rules.forEach(rule => {
            manifest += `\n  - host: ${rule.host}
    http:
      paths:`;
            rule.paths.forEach(path => {
                manifest += `\n      - path: ${path.path}
        pathType: ${path.pathType}
        backend:
          service:
            name: ${path.service.name}
            port:
              number: ${path.service.port}`;
            });
        });

        return manifest;
    }

    /**
     * Format labels for YAML output
     * @param {object} labels - Label object
     * @returns {string} Formatted labels
     */
    formatLabels(labels) {
        return Object.entries(labels)
            .map(([key, value]) => `${key}: "${value}"`)
            .join('\n    ');
    }

    /**
     * Create ServiceAccount manifest
     * @param {object} options - ServiceAccount configuration
     * @returns {string} YAML manifest
     */
    createServiceAccount(options) {
        const {
            name,
            namespace,
            labels = {}
        } = options;

        return `apiVersion: v1
kind: ServiceAccount
metadata:
  name: ${name}
  namespace: ${namespace}
  labels:
    ${this.formatLabels({...this.defaultLabels, ...labels})}`;
    }

    /**
     * Create ClusterRole manifest
     * @param {object} options - ClusterRole configuration
     * @returns {string} YAML manifest
     */
    createClusterRole(options) {
        const {
            name,
            rules = [],
            labels = {}
        } = options;

        let manifest = `apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: ${name}
  labels:
    ${this.formatLabels({...this.defaultLabels, ...labels})}
rules:`;

        rules.forEach(rule => {
            manifest += `\n- apiGroups: ${JSON.stringify(rule.apiGroups)}
  resources: ${JSON.stringify(rule.resources)}
  verbs: ${JSON.stringify(rule.verbs)}`;
        });

        return manifest;
    }

    /**
     * Create ClusterRoleBinding manifest
     * @param {object} options - ClusterRoleBinding configuration
     * @returns {string} YAML manifest
     */
    createClusterRoleBinding(options) {
        const {
            name,
            roleRef,
            subjects = [],
            labels = {}
        } = options;

        let manifest = `apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
  name: ${name}
  labels:
    ${this.formatLabels({...this.defaultLabels, ...labels})}
roleRef:
  apiGroup: ${roleRef.apiGroup}
  kind: ${roleRef.kind}
  name: ${roleRef.name}
subjects:`;

        subjects.forEach(subject => {
            manifest += `\n- kind: ${subject.kind}
  name: ${subject.name}
  namespace: ${subject.namespace}`;
        });

        return manifest;
    }

    /**
     * Create IngressClass manifest
     * @param {object} options - IngressClass configuration
     * @returns {string} YAML manifest
     */
    createIngressClass(options) {
        const {
            name,
            controller,
            labels = {}
        } = options;

        return `apiVersion: networking.k8s.io/v1
kind: IngressClass
metadata:
  name: ${name}
  labels:
    ${this.formatLabels({...this.defaultLabels, ...labels})}
spec:
  controller: ${controller}`;
    }

    /**
     * Create StatefulSet manifest
     * @param {object} options - StatefulSet configuration
     * @returns {string} YAML manifest
     */
    createStatefulSet(options) {
        const {
            name,
            namespace,
            image,
            replicas = 1,
            serviceName,
            ports = [],
            env = [],
            volumeMounts = [],
            volumes = [],
            labels = {},
            resources = {},
            probes = {},
            tolerations = [],
            restartPolicy = 'Always'
        } = options;

        const statefulSetLabels = {
            app: name,
            ...this.defaultLabels,
            ...labels
        };

        // Build metadata labels
        const metadataLabels = Object.entries(statefulSetLabels)
            .map(([key, value]) => `    ${key}: "${value}"`)
            .join('\n');
        
        const templateLabels = Object.entries(statefulSetLabels)
            .map(([key, value]) => `        ${key}: "${value}"`)
            .join('\n');

        let manifest = `apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: ${name}
  namespace: ${namespace}
  labels:
${metadataLabels}
spec:
  serviceName: ${serviceName}
  replicas: ${replicas}
  selector:
    matchLabels:
      app: ${name}
  template:
    metadata:
      labels:
${templateLabels}
    spec:
      containers:
      - name: ${name}
        image: ${image}
        imagePullPolicy: IfNotPresent`;

        // Ports
        if (ports.length > 0) {
            manifest += `\n        ports:`;
            ports.forEach(port => {
                manifest += `\n        - containerPort: ${port.containerPort}
          name: ${port.name}`;
                if (port.hostPort) {
                    manifest += `\n          hostPort: ${port.hostPort}`;
                }
            });
        }

        // Environment variables
        if (env.length > 0) {
            manifest += `\n        env:`;
            env.forEach(envVar => {
                manifest += `\n        - name: ${envVar.name}
          value: "${envVar.value}"`;
            });
        }

        // Volume mounts
        if (volumeMounts.length > 0) {
            manifest += `\n        volumeMounts:`;
            volumeMounts.forEach(mount => {
                manifest += `\n        - name: ${mount.name}
          mountPath: ${mount.mountPath}`;
                if (mount.subPath) manifest += `\n          subPath: ${mount.subPath}`;
            });
        }

        // Resources
        if (Object.keys(resources).length > 0) {
            manifest += `\n        resources:`;
            if (resources.requests) {
                manifest += `\n          requests:
            memory: "${resources.requests.memory}"
            cpu: "${resources.requests.cpu}"`;
            }
            if (resources.limits) {
                manifest += `\n          limits:
            memory: "${resources.limits.memory}"
            cpu: "${resources.limits.cpu}"`;
            }
        }

        // Probes
        ['readinessProbe', 'livenessProbe'].forEach(probeType => {
            if (probes[probeType]) {
                const probe = probes[probeType];
                manifest += `\n        ${probeType}:
          httpGet:
            path: ${probe.path}
            port: ${probe.port}
            scheme: ${probe.scheme || 'HTTP'}
          initialDelaySeconds: ${probe.initialDelaySeconds || 30}
          periodSeconds: ${probe.periodSeconds || 30}
          timeoutSeconds: ${probe.timeoutSeconds || 10}
          successThreshold: ${probe.successThreshold || 1}
          failureThreshold: ${probe.failureThreshold || 3}`;
            }
        });

        // Volumes
        if (volumes.length > 0) {
            manifest += `\n      volumes:`;
            volumes.forEach(volume => {
                manifest += `\n      - name: ${volume.name}`;
                if (volume.persistentVolumeClaim) {
                    manifest += `\n        persistentVolumeClaim:
          claimName: ${volume.persistentVolumeClaim.claimName}`;
                } else if (volume.configMap) {
                    manifest += `\n        configMap:
          name: ${volume.configMap.name}`;
                }
            });
        }

        // Add tolerations if provided
        if (tolerations.length > 0) {
            manifest += `\n      tolerations:`;
            tolerations.forEach(toleration => {
                manifest += `\n      - key: ${toleration.key}
        effect: ${toleration.effect}`;
            });
        }

        manifest += `\n      restartPolicy: ${restartPolicy}`;

        return manifest;
    }

    /**
     * Create Registry configuration properties
     * @returns {string} Properties file content
     */
    createRegistryProperties() {
        return `# Core Properties
nifi.registry.web.http.host=0.0.0.0
nifi.registry.web.http.port=18080
nifi.registry.web.https.host=
nifi.registry.web.https.port=

# Database Properties
nifi.registry.db.url=jdbc:h2:./database/nifi-registry-primary;AUTOCOMMIT=OFF;DB_CLOSE_ON_EXIT=FALSE;LOCK_MODE=3;LOCK_TIMEOUT=25000;WRITE_DELAY=0;AUTO_SERVER=FALSE
nifi.registry.db.driver.class=org.h2.Driver
nifi.registry.db.driver.directory=
nifi.registry.db.username=nifireg
nifi.registry.db.password=nifireg
nifi.registry.db.maxConnections=5
nifi.registry.db.sql.debug=false

# Extension Directories
nifi.registry.extension.dir.default=./lib

# Identity Mapping Properties
nifi.registry.security.identity.mapping.pattern.dn=
nifi.registry.security.identity.mapping.value.dn=
nifi.registry.security.identity.mapping.transform.dn=NONE

# Group Mapping Properties
nifi.registry.security.group.mapping.pattern.anygroup=
nifi.registry.security.group.mapping.value.anygroup=
nifi.registry.security.group.mapping.transform.anygroup=NONE

# Providers Properties
nifi.registry.providers.configuration.file=./conf/providers.xml

# Extensions Working Directory
nifi.registry.extensions.working.directory=./work/extensions

# Kerberos Properties
nifi.registry.kerberos.default.realm=
nifi.registry.kerberos.service.principal=
nifi.registry.kerberos.service.keytab.location=
nifi.registry.kerberos.spnego.principal=
nifi.registry.kerberos.spnego.keytab.location=
nifi.registry.kerberos.authentication.expiration=12 hours

# LDAP Properties
nifi.registry.security.ldap.manager.dn=
nifi.registry.security.ldap.manager.password=
nifi.registry.security.ldap.tls.keystore=
nifi.registry.security.ldap.tls.keystorePassword=
nifi.registry.security.ldap.tls.keystoreType=
nifi.registry.security.ldap.tls.truststore=
nifi.registry.security.ldap.tls.truststorePassword=
nifi.registry.security.ldap.tls.truststoreType=

# Security Properties - DISABLED FOR PROTOTYPE USE
nifi.registry.security.authorizer=
nifi.registry.security.authorizers.configuration.file=
nifi.registry.security.identity.provider=
nifi.registry.security.identity.providers.configuration.file=

# Revision Management
nifi.registry.revisions.enabled=false

# Event Reporting
nifi.registry.security.user.login.identity.provider=
nifi.registry.security.user.jws.key.rotation.period=PT1H
nifi.registry.security.user.oidc.discovery.url=
nifi.registry.security.user.oidc.connect.timeout=5 secs
nifi.registry.security.user.oidc.read.timeout=5 secs
nifi.registry.security.user.oidc.client.id=
nifi.registry.security.user.oidc.client.secret=
nifi.registry.security.user.oidc.preferred.jwsalgorithm=
nifi.registry.security.user.oidc.additional.scopes=
nifi.registry.security.user.oidc.claim.identifying.user=

# Web Properties
nifi.registry.web.war.directory=./lib
nifi.registry.web.jetty.working.directory=./work/jetty
nifi.registry.web.jetty.threads=200
nifi.registry.web.should.send.server.version=true

# H2 Settings
nifi.registry.h2.url.append=;LOCK_TIMEOUT=25000;WRITE_DELAY=0;AUTO_SERVER=FALSE`;
    }
}

module.exports = KubernetesTemplates;