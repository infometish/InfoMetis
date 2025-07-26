#!/bin/bash

# Busybox Init Container Utilities
# Common patterns for init container operations

set -e

# Color output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Fix permissions for a directory
fix_permissions() {
    local target_path="$1"
    local target_uid="${2:-1000}"
    local target_gid="${3:-1000}"
    
    if [[ -z "$target_path" ]]; then
        log_error "Usage: fix_permissions <path> [uid] [gid]"
        exit 1
    fi
    
    log_info "Fixing permissions for $target_path (${target_uid}:${target_gid})"
    
    if [[ ! -d "$target_path" ]]; then
        log_info "Creating directory: $target_path"
        mkdir -p "$target_path"
    fi
    
    chown -R "${target_uid}:${target_gid}" "$target_path"
    log_success "Permissions fixed for $target_path"
}

# Create directories with proper permissions
setup_directories() {
    local base_path="$1"
    local target_uid="${2:-1000}"
    local target_gid="${3:-1000}"
    shift 3
    local directories=("$@")
    
    if [[ -z "$base_path" ]] || [[ ${#directories[@]} -eq 0 ]]; then
        log_error "Usage: setup_directories <base_path> [uid] [gid] <dir1> [dir2] ..."
        exit 1
    fi
    
    log_info "Setting up directories under $base_path"
    
    for dir in "${directories[@]}"; do
        local full_path="$base_path/$dir"
        log_info "Creating: $full_path"
        mkdir -p "$full_path"
    done
    
    log_info "Setting ownership to ${target_uid}:${target_gid}"
    chown -R "${target_uid}:${target_gid}" "$base_path"
    
    log_info "Setting permissions to 755"
    chmod -R 755 "$base_path"
    
    log_success "Directory setup complete"
}

# Wait for a service to be available
wait_for_service() {
    local host="$1"
    local port="$2"
    local timeout="${3:-30}"
    
    if [[ -z "$host" ]] || [[ -z "$port" ]]; then
        log_error "Usage: wait_for_service <host> <port> [timeout]"
        exit 1
    fi
    
    log_info "Waiting for $host:$port (timeout: ${timeout}s)"
    
    local count=0
    while ! nc -z "$host" "$port" 2>/dev/null; do
        if [[ $count -ge $timeout ]]; then
            log_error "Timeout waiting for $host:$port"
            exit 1
        fi
        count=$((count + 1))
        sleep 1
    done
    
    log_success "Service $host:$port is available"
}

# Check if a file or directory exists
check_path() {
    local path="$1"
    local type="${2:-any}" # file, dir, any
    
    if [[ -z "$path" ]]; then
        log_error "Usage: check_path <path> [type]"
        exit 1
    fi
    
    case "$type" in
        "file")
            if [[ -f "$path" ]]; then
                log_success "File exists: $path"
                return 0
            else
                log_error "File not found: $path"
                return 1
            fi
            ;;
        "dir")
            if [[ -d "$path" ]]; then
                log_success "Directory exists: $path"
                return 0
            else
                log_error "Directory not found: $path"
                return 1
            fi
            ;;
        *)
            if [[ -e "$path" ]]; then
                log_success "Path exists: $path"
                return 0
            else
                log_error "Path not found: $path"
                return 1
            fi
            ;;
    esac
}

# Display help
show_help() {
    cat << EOF
Busybox Init Container Utilities

Usage: $0 <command> [arguments]

Commands:
  fix_permissions <path> [uid] [gid]
    Fix ownership and permissions for a directory
    
  setup_directories <base_path> [uid] [gid] <dir1> [dir2] ...
    Create multiple directories with proper permissions
    
  wait_for_service <host> <port> [timeout]
    Wait for a network service to become available
    
  check_path <path> [type]
    Check if a path exists (type: file, dir, any)

Examples:
  $0 fix_permissions /var/lib/kafka 1000 1000
  $0 setup_directories /data 1000 1000 logs config temp
  $0 wait_for_service kafka-service 9092 60
  $0 check_path /etc/config dir

EOF
}

# Main execution
case "${1:-help}" in
    "fix_permissions")
        shift
        fix_permissions "$@"
        ;;
    "setup_directories")
        shift
        setup_directories "$@"
        ;;
    "wait_for_service")
        shift
        wait_for_service "$@"
        ;;
    "check_path")
        shift
        check_path "$@"
        ;;
    "help"|*)
        show_help
        ;;
esac