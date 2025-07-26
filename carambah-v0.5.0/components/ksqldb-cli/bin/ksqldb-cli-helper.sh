#!/bin/bash
# ksqlDB CLI Helper Script
# Provides convenient commands for interacting with ksqlDB CLI

set -e

NAMESPACE="infometis"
DEPLOYMENT="ksqldb-cli"
SERVER_URL="http://ksqldb-server-service:8088"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if ksqlDB CLI pod is running
check_cli_pod() {
    log_info "Checking ksqlDB CLI pod status..."
    
    if kubectl get pods -n $NAMESPACE -l app=ksqldb-cli --no-headers | grep -q "Running"; then
        log_success "ksqlDB CLI pod is running"
        return 0
    else
        log_error "ksqlDB CLI pod is not running. Deploy it first."
        return 1
    fi
}

# Connect to ksqlDB CLI interactively
connect() {
    log_info "Connecting to ksqlDB CLI..."
    check_cli_pod || return 1
    
    log_info "Executing: kubectl exec -it -n $NAMESPACE deployment/$DEPLOYMENT -- ksql $SERVER_URL"
    kubectl exec -it -n $NAMESPACE deployment/$DEPLOYMENT -- ksql $SERVER_URL
}

# Execute a single ksqlDB command
execute() {
    if [ $# -eq 0 ]; then
        log_error "Usage: $0 execute '<ksql_command>'"
        return 1
    fi
    
    local command="$1"
    log_info "Executing ksqlDB command: $command"
    check_cli_pod || return 1
    
    kubectl exec -n $NAMESPACE deployment/$DEPLOYMENT -- bash -c "echo \"$command\" | ksql $SERVER_URL"
}

# Show streams
show_streams() {
    log_info "Showing all streams..."
    execute "SHOW STREAMS;"
}

# Show tables
show_tables() {
    log_info "Showing all tables..."
    execute "SHOW TABLES;"
}

# Show topics
show_topics() {
    log_info "Showing all topics..."
    execute "SHOW TOPICS;"
}

# Show connectors
show_connectors() {
    log_info "Showing all connectors..."
    execute "SHOW CONNECTORS;"
}

# Describe a stream or table
describe() {
    if [ $# -eq 0 ]; then
        log_error "Usage: $0 describe <stream_or_table_name>"
        return 1
    fi
    
    local name="$1"
    log_info "Describing $name..."
    execute "DESCRIBE $name;"
}

# Create example stream
create_example_stream() {
    log_info "Creating example stream 'users'..."
    local command="CREATE STREAM users (id INT, name STRING, email STRING, created_at BIGINT) WITH (kafka_topic='users', value_format='JSON');"
    execute "$command"
}

# Create example table
create_example_table() {
    log_info "Creating example table 'user_counts'..."
    local command="CREATE TABLE user_counts AS SELECT name, COUNT(*) as count FROM users GROUP BY name;"
    execute "$command"
}

# Run example queries
run_examples() {
    log_info "Running example ksqlDB operations..."
    
    # Show existing streams and tables
    show_streams
    show_tables
    show_topics
    
    # Create example stream (will fail if already exists, which is ok)
    log_info "Attempting to create example stream..."
    create_example_stream || log_warn "Stream may already exist or Kafka topic not available"
    
    # Show streams again
    show_streams
}

# Get ksqlDB server info
server_info() {
    log_info "Getting ksqlDB server information..."
    execute "SHOW PROPERTIES;"
}

# Check connection to ksqlDB server
test_connection() {
    log_info "Testing connection to ksqlDB server..."
    check_cli_pod || return 1
    
    if kubectl exec -n $NAMESPACE deployment/$DEPLOYMENT -- bash -c "timeout 10 ksql $SERVER_URL --execute 'SHOW STREAMS;'" > /dev/null 2>&1; then
        log_success "Connection to ksqlDB server successful"
        return 0
    else
        log_error "Cannot connect to ksqlDB server at $SERVER_URL"
        log_info "Make sure ksqlDB server is running and accessible"
        return 1
    fi
}

# Get pod logs
logs() {
    log_info "Getting ksqlDB CLI pod logs..."
    kubectl logs -n $NAMESPACE deployment/$DEPLOYMENT --tail=100 -f
}

# Get pod shell access
shell() {
    log_info "Getting shell access to ksqlDB CLI pod..."
    check_cli_pod || return 1
    
    kubectl exec -it -n $NAMESPACE deployment/$DEPLOYMENT -- bash
}

# Show help
show_help() {
    cat << EOF
ksqlDB CLI Helper Script

Usage: $0 <command>

Commands:
  connect           - Connect to ksqlDB CLI interactively
  execute '<cmd>'   - Execute a single ksqlDB command
  show-streams      - Show all streams
  show-tables       - Show all tables
  show-topics       - Show all Kafka topics
  show-connectors   - Show all connectors
  describe <name>   - Describe a stream or table
  examples          - Run example operations
  server-info       - Get ksqlDB server information
  test-connection   - Test connection to ksqlDB server
  logs              - Show pod logs (follow mode)
  shell             - Get shell access to CLI pod
  help              - Show this help message

Examples:
  $0 connect
  $0 execute "CREATE STREAM test_stream (id INT) WITH (kafka_topic='test', value_format='JSON');"
  $0 show-streams
  $0 describe users
  $0 test-connection

Prerequisites:
  - ksqlDB CLI pod must be running in namespace '$NAMESPACE'
  - ksqlDB Server must be accessible at '$SERVER_URL'
  - kubectl must be configured and accessible

EOF
}

# Main script logic
case "${1:-help}" in
    connect)
        connect
        ;;
    execute)
        execute "$2"
        ;;
    show-streams)
        show_streams
        ;;
    show-tables)
        show_tables
        ;;
    show-topics)
        show_topics
        ;;
    show-connectors)
        show_connectors
        ;;
    describe)
        describe "$2"
        ;;
    create-example-stream)
        create_example_stream
        ;;
    create-example-table)
        create_example_table
        ;;
    examples)
        run_examples
        ;;
    server-info)
        server_info
        ;;
    test-connection)
        test_connection
        ;;
    logs)
        logs
        ;;
    shell)
        shell
        ;;
    help|--help|-h)
        show_help
        ;;
    *)
        log_error "Unknown command: $1"
        echo
        show_help
        exit 1
        ;;
esac