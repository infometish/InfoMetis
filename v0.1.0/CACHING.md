# InfoMetis v0.1.0 Image Caching

This version includes image caching functionality for low-bandwidth environments.

## Quick Start

### 1. Cache Images (requires internet)
```bash
./cache-images.sh cache
```

### 2. Deploy Offline
```bash
node console.js
# Select "Core Infrastructure" -> "Load cached images (optional)"
# Continue with normal deployment
```

## Commands

### Cache Images
```bash
./cache-images.sh cache
```
Downloads and saves all required images to `cache/images/` directory.

### Load Cached Images
```bash
./cache-images.sh load
```
Loads cached images into Docker for offline deployment.

### Check Cache Status
```bash
./cache-images.sh status
```
Shows which images are cached and total cache size.

## Images Cached

- `k0sproject/k0s:latest` - Kubernetes distribution
- `traefik:latest` - Ingress controller
- `apache/nifi:1.23.2` - NiFi application (version-specific)

## Cache Size

Expect approximately 1.5-2GB total cache size for all images.

## Integration with Console

The console includes an optional "Load cached images" step that:
- Automatically detects if cache exists
- Loads cached images if available
- Gracefully skips if cache not found
- Allows normal internet-based deployment as fallback

## Low-Bandwidth Workflow

1. **Preparation phase** (with internet):
   ```bash
   ./cache-images.sh cache
   ```

2. **Deployment phase** (offline):
   ```bash
   node console.js
   # Run "Load cached images" step
   # Continue with deployment
   ```

This ensures all container images are available locally before deployment begins.