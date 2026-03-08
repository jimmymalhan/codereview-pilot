#!/bin/bash
# Paperclip Integration - Monitoring Stack Deployment Script
# Owner: Operations/DevOps Lead
# Created: 2026-03-08
# Purpose: Deploy monitoring dashboards, alerting, and metrics collection
#
# PREREQUISITES:
#   1. CEO has approved monitoring stack selection (Datadog or Grafana+Prometheus)
#   2. Item #1 (Capability Gate) has confirmed Paperclip API metrics endpoints
#   3. Environment variables are configured (see .env.monitoring.example)
#
# USAGE:
#   ./monitoring-setup.sh --stack <datadog|grafana> --env <staging|production>
#
# PHASES:
#   Phase A: Validate prerequisites
#   Phase B: Deploy metrics collection
#   Phase C: Deploy dashboards
#   Phase D: Configure alerting
#   Phase E: Verify deployment

set -euo pipefail

# ============================================================================
# CONFIGURATION
# ============================================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CONFIG_FILE="${SCRIPT_DIR}/monitoring-config.yaml"
LOG_FILE="${SCRIPT_DIR}/monitoring-setup.log"
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# ============================================================================
# ARGUMENT PARSING
# ============================================================================

STACK=""
ENV=""
DRY_RUN=false

usage() {
    echo "Usage: $0 --stack <datadog|grafana> --env <staging|production> [--dry-run]"
    echo ""
    echo "Options:"
    echo "  --stack     Monitoring stack to deploy (datadog or grafana)"
    echo "  --env       Target environment (staging or production)"
    echo "  --dry-run   Validate prerequisites only, do not deploy"
    echo "  --help      Show this help message"
    exit 1
}

while [[ $# -gt 0 ]]; do
    case $1 in
        --stack)
            STACK="$2"
            shift 2
            ;;
        --env)
            ENV="$2"
            shift 2
            ;;
        --dry-run)
            DRY_RUN=true
            shift
            ;;
        --help)
            usage
            ;;
        *)
            echo -e "${RED}ERROR: Unknown option: $1${NC}"
            usage
            ;;
    esac
done

if [[ -z "$STACK" || -z "$ENV" ]]; then
    echo -e "${RED}ERROR: --stack and --env are required${NC}"
    usage
fi

if [[ "$STACK" != "datadog" && "$STACK" != "grafana" ]]; then
    echo -e "${RED}ERROR: --stack must be 'datadog' or 'grafana'${NC}"
    exit 1
fi

if [[ "$ENV" != "staging" && "$ENV" != "production" ]]; then
    echo -e "${RED}ERROR: --env must be 'staging' or 'production'${NC}"
    exit 1
fi

# ============================================================================
# LOGGING
# ============================================================================

log() {
    local level="$1"
    local message="$2"
    local ts
    ts=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
    echo -e "${ts} [${level}] ${message}" | tee -a "$LOG_FILE"
}

log_info() { log "INFO" "$1"; }
log_warn() { log "${YELLOW}WARN${NC}" "$1"; }
log_error() { log "${RED}ERROR${NC}" "$1"; }
log_success() { log "${GREEN}OK${NC}" "$1"; }

# ============================================================================
# PHASE A: VALIDATE PREREQUISITES
# ============================================================================

phase_a_validate() {
    log_info "=== PHASE A: Validating Prerequisites ==="

    local errors=0

    # Check config file exists
    if [[ ! -f "$CONFIG_FILE" ]]; then
        log_error "monitoring-config.yaml not found at $CONFIG_FILE"
        errors=$((errors + 1))
    else
        log_success "monitoring-config.yaml found"
    fi

    # Check required environment variables
    local required_vars=()
    if [[ "$STACK" == "datadog" ]]; then
        required_vars=("DATADOG_API_KEY" "DATADOG_APP_KEY" "DATADOG_SITE")
    else
        required_vars=("GRAFANA_URL" "GRAFANA_API_KEY" "PROMETHEUS_URL")
    fi

    # Common required vars
    required_vars+=("PAPERCLIP_API_URL" "PAPERCLIP_API_KEY")
    required_vars+=("PAGERDUTY_SERVICE_KEY" "SLACK_OPS_WEBHOOK_URL")

    for var in "${required_vars[@]}"; do
        if [[ -z "${!var:-}" ]]; then
            log_error "Required environment variable not set: $var"
            errors=$((errors + 1))
        else
            log_success "Environment variable set: $var"
        fi
    done

    # Check Paperclip API metrics endpoint availability
    log_info "Checking Paperclip API metrics endpoint..."
    local metrics_url="${PAPERCLIP_API_URL:-http://localhost}/metrics"
    if command -v curl &> /dev/null; then
        local http_code
        http_code=$(curl -s -o /dev/null -w "%{http_code}" \
            -H "Authorization: Bearer ${PAPERCLIP_API_KEY:-none}" \
            --connect-timeout 5 \
            "$metrics_url" 2>/dev/null || echo "000")

        if [[ "$http_code" == "200" ]]; then
            log_success "Paperclip metrics endpoint reachable ($metrics_url)"
        elif [[ "$http_code" == "000" ]]; then
            log_warn "Paperclip metrics endpoint unreachable ($metrics_url) - will use fallback instrumentation"
        else
            log_warn "Paperclip metrics endpoint returned HTTP $http_code - may need fallback instrumentation"
        fi
    else
        log_warn "curl not available - cannot verify Paperclip metrics endpoint"
    fi

    # Check CLI tools
    if [[ "$STACK" == "datadog" ]]; then
        if ! command -v datadog-ci &> /dev/null; then
            log_warn "datadog-ci CLI not installed - install with: npm install -g @datadog/datadog-ci"
        else
            log_success "datadog-ci CLI available"
        fi
    else
        if ! command -v docker &> /dev/null; then
            log_error "docker not installed - required for Grafana+Prometheus stack"
            errors=$((errors + 1))
        else
            log_success "docker available"
        fi
        if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
            log_error "docker-compose not available - required for Grafana+Prometheus stack"
            errors=$((errors + 1))
        else
            log_success "docker-compose available"
        fi
    fi

    if [[ $errors -gt 0 ]]; then
        log_error "Prerequisite validation FAILED with $errors error(s)"
        return 1
    fi

    log_success "All prerequisites validated"
    return 0
}

# ============================================================================
# PHASE B: DEPLOY METRICS COLLECTION
# ============================================================================

phase_b_metrics_collection() {
    log_info "=== PHASE B: Deploying Metrics Collection ==="

    if [[ "$STACK" == "datadog" ]]; then
        deploy_datadog_agent
    else
        deploy_prometheus
    fi
}

deploy_datadog_agent() {
    log_info "Deploying Datadog agent for Paperclip metrics..."

    # Create Datadog agent configuration
    local dd_config_dir="${SCRIPT_DIR}/monitoring/datadog"
    mkdir -p "$dd_config_dir/conf.d"

    # Paperclip custom check configuration
    cat > "$dd_config_dir/conf.d/paperclip.yaml" << 'DDEOF'
init_config:

instances:
  - name: paperclip_agents
    url: "${PAPERCLIP_API_URL}/metrics"
    headers:
      Authorization: "Bearer ${PAPERCLIP_API_KEY}"
    metrics:
      - paperclip_agent_heartbeat_last_seen
      - paperclip_agent_response_duration_seconds
      - paperclip_agent_errors_total
      - paperclip_agent_uptime_ratio
      - paperclip_tasks_current
      - paperclip_tasks_completed_total
      - paperclip_task_duration_seconds
      - paperclip_budget_tokens_used
      - paperclip_budget_tokens_limit
      - paperclip_approval_stage_duration_seconds
      - paperclip_approval_longest_wait_seconds
      - paperclip_escalation_queue_depth
      - paperclip_escalation_oldest_age_seconds
      - paperclip_audit_events_total
      - paperclip_audit_gaps_detected
      - paperclip_audit_last_verification_timestamp
    min_collection_interval: 15
DDEOF

    log_success "Datadog agent configuration written to $dd_config_dir"
    log_info "Next: Install Datadog agent on host and point to this configuration"
    log_info "  DD_API_KEY=$DATADOG_API_KEY DD_SITE=$DATADOG_SITE bash -c \"\$(curl -L https://install.datadoghq.com/scripts/install_script_agent7.sh)\""
}

deploy_prometheus() {
    log_info "Deploying Prometheus for metrics collection..."

    local prom_config_dir="${SCRIPT_DIR}/monitoring/prometheus"
    mkdir -p "$prom_config_dir"

    # Prometheus configuration
    cat > "$prom_config_dir/prometheus.yml" << PROMEOF
global:
  scrape_interval: 15s
  evaluation_interval: 15s

rule_files:
  - "alerts.yml"

scrape_configs:
  - job_name: 'paperclip'
    scheme: https
    bearer_token: '${PAPERCLIP_API_KEY}'
    static_configs:
      - targets: ['${PAPERCLIP_API_URL#https://}']
    metrics_path: '/metrics'
    scrape_interval: 15s

  - job_name: 'claude-debug-copilot'
    static_configs:
      - targets: ['localhost:9090']
    metrics_path: '/metrics'
    scrape_interval: 15s
PROMEOF

    # Prometheus alert rules
    cat > "$prom_config_dir/alerts.yml" << 'ALERTEOF'
groups:
  - name: paperclip_critical
    rules:
      - alert: AgentHeartbeatMissed
        expr: paperclip_agent_heartbeat_last_seen > 120
        for: 0s
        labels:
          severity: critical
        annotations:
          summary: "Agent {{ $labels.agent_name }} heartbeat missed"
          description: "Agent has not sent heartbeat in {{ $value }}s (threshold: 120s)"
          runbook: "runbook-01-agent-timeout.md"

      - alert: BudgetWarning75
        expr: paperclip_budget_tokens_used / paperclip_budget_tokens_limit > 0.75
        for: 0s
        labels:
          severity: warning
        annotations:
          summary: "Budget at 75% consumption"
          description: "Token budget usage: {{ $value | humanizePercentage }}"

      - alert: BudgetCritical90
        expr: paperclip_budget_tokens_used / paperclip_budget_tokens_limit > 0.90
        for: 0s
        labels:
          severity: critical
        annotations:
          summary: "Budget at 90% consumption"
          description: "Token budget usage: {{ $value | humanizePercentage }}"
          runbook: "runbook-04-budget-exhausted.md"

      - alert: BudgetExhausted
        expr: paperclip_budget_tokens_used / paperclip_budget_tokens_limit >= 1.0
        for: 0s
        labels:
          severity: critical
        annotations:
          summary: "Budget EXHAUSTED - 100% consumed"
          description: "All token budget consumed. New tasks must be paused."
          runbook: "runbook-04-budget-exhausted.md"

      - alert: ApprovalQueueBottleneck
        expr: paperclip_escalation_queue_depth > 5
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "Escalation queue depth > 5"
          description: "{{ $value }} tasks waiting for approval"
          runbook: "runbook-03-approval-deadlock.md"

      - alert: AuditGapDetected
        expr: paperclip_audit_gaps_detected > 0
        for: 0s
        labels:
          severity: critical
        annotations:
          summary: "Audit trail gap detected"
          description: "{{ $value }} gap(s) in audit trail"
          runbook: "runbook-05-audit-trail-gap.md"

      - alert: AuditVerificationStale
        expr: time() - paperclip_audit_last_verification_timestamp > 3600
        for: 0s
        labels:
          severity: warning
        annotations:
          summary: "Audit verification stale"
          description: "Last audit integrity check was {{ $value | humanizeDuration }} ago"
ALERTEOF

    log_success "Prometheus configuration written to $prom_config_dir"
}

# ============================================================================
# PHASE C: DEPLOY DASHBOARDS
# ============================================================================

phase_c_deploy_dashboards() {
    log_info "=== PHASE C: Deploying Dashboards ==="

    if [[ "$STACK" == "datadog" ]]; then
        deploy_datadog_dashboards
    else
        deploy_grafana_dashboards
    fi
}

deploy_datadog_dashboards() {
    log_info "Creating Datadog dashboard definitions..."

    local dd_dir="${SCRIPT_DIR}/monitoring/datadog/dashboards"
    mkdir -p "$dd_dir"

    # Datadog dashboard JSON (simplified - full version would be generated via API)
    cat > "$dd_dir/paperclip-overview.json" << 'DDJSON'
{
  "title": "Paperclip Integration - Overview",
  "description": "Real-time monitoring for Paperclip agent orchestration",
  "layout_type": "ordered",
  "widgets": [
    {
      "definition": {
        "title": "Agent Health Status",
        "type": "check_status",
        "group_by": ["agent_name"],
        "tags": ["service:paperclip"]
      }
    },
    {
      "definition": {
        "title": "Tasks by State",
        "type": "query_value",
        "requests": [
          {"q": "sum:paperclip_tasks_current{*} by {state}"}
        ]
      }
    },
    {
      "definition": {
        "title": "Budget Consumption",
        "type": "query_value",
        "requests": [
          {"q": "avg:paperclip_budget_tokens_used{scope:org} / avg:paperclip_budget_tokens_limit{scope:org} * 100"}
        ],
        "precision": 1,
        "custom_unit": "%"
      }
    },
    {
      "definition": {
        "title": "Approval Pipeline Latency",
        "type": "timeseries",
        "requests": [
          {"q": "avg:paperclip_approval_stage_duration_seconds{*} by {stage}"}
        ]
      }
    },
    {
      "definition": {
        "title": "Escalation Queue Depth",
        "type": "query_value",
        "requests": [
          {"q": "sum:paperclip_escalation_queue_depth{*}"}
        ],
        "conditional_formats": [
          {"comparator": ">", "value": 5, "palette": "white_on_red"},
          {"comparator": ">=", "value": 3, "palette": "white_on_yellow"},
          {"comparator": "<", "value": 3, "palette": "white_on_green"}
        ]
      }
    },
    {
      "definition": {
        "title": "Audit Trail Gaps",
        "type": "query_value",
        "requests": [
          {"q": "sum:paperclip_audit_gaps_detected{*}"}
        ],
        "conditional_formats": [
          {"comparator": ">", "value": 0, "palette": "white_on_red"},
          {"comparator": "==", "value": 0, "palette": "white_on_green"}
        ]
      }
    },
    {
      "definition": {
        "title": "Agent Response Time (p95)",
        "type": "timeseries",
        "requests": [
          {"q": "p95:paperclip_agent_response_duration_seconds{*} by {agent_name}"}
        ]
      }
    },
    {
      "definition": {
        "title": "Agent Error Rate",
        "type": "timeseries",
        "requests": [
          {"q": "sum:paperclip_agent_errors_total{*}.as_rate() by {agent_name}"}
        ]
      }
    }
  ]
}
DDJSON

    log_success "Datadog dashboard definition written to $dd_dir/paperclip-overview.json"
    log_info "Deploy with: datadog-ci dashboards import $dd_dir/paperclip-overview.json"
}

deploy_grafana_dashboards() {
    log_info "Creating Grafana dashboard and docker-compose setup..."

    local grafana_dir="${SCRIPT_DIR}/monitoring/grafana"
    mkdir -p "$grafana_dir/provisioning/dashboards"
    mkdir -p "$grafana_dir/provisioning/datasources"

    # Grafana datasource provisioning
    cat > "$grafana_dir/provisioning/datasources/prometheus.yml" << 'DSEOF'
apiVersion: 1
datasources:
  - name: Prometheus
    type: prometheus
    access: proxy
    url: http://prometheus:9090
    isDefault: true
    editable: false
DSEOF

    # Grafana dashboard provisioning
    cat > "$grafana_dir/provisioning/dashboards/provider.yml" << 'DPEOF'
apiVersion: 1
providers:
  - name: 'Paperclip'
    orgId: 1
    folder: 'Paperclip Integration'
    type: file
    disableDeletion: false
    editable: true
    options:
      path: /var/lib/grafana/dashboards
      foldersFromFilesStructure: false
DPEOF

    # Docker Compose for Grafana + Prometheus + Alertmanager
    cat > "${SCRIPT_DIR}/monitoring/docker-compose.yml" << 'DCEOF'
version: '3.8'

services:
  prometheus:
    image: prom/prometheus:v2.51.0
    container_name: paperclip-prometheus
    ports:
      - "9090:9090"
    volumes:
      - ./prometheus/prometheus.yml:/etc/prometheus/prometheus.yml:ro
      - ./prometheus/alerts.yml:/etc/prometheus/alerts.yml:ro
      - prometheus_data:/prometheus
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.retention.time=30d'
      - '--web.enable-lifecycle'
    restart: unless-stopped

  grafana:
    image: grafana/grafana:10.4.0
    container_name: paperclip-grafana
    ports:
      - "3000:3000"
    volumes:
      - ./grafana/provisioning:/etc/grafana/provisioning:ro
      - grafana_data:/var/lib/grafana
    environment:
      - GF_SECURITY_ADMIN_USER=${GRAFANA_ADMIN_USER:-admin}
      - GF_SECURITY_ADMIN_PASSWORD=${GRAFANA_ADMIN_PASSWORD:-changeme}
      - GF_USERS_ALLOW_SIGN_UP=false
    depends_on:
      - prometheus
    restart: unless-stopped

  alertmanager:
    image: prom/alertmanager:v0.27.0
    container_name: paperclip-alertmanager
    ports:
      - "9093:9093"
    volumes:
      - ./alertmanager/alertmanager.yml:/etc/alertmanager/alertmanager.yml:ro
    restart: unless-stopped

volumes:
  prometheus_data:
  grafana_data:
DCEOF

    # Alertmanager configuration
    local am_dir="${SCRIPT_DIR}/monitoring/alertmanager"
    mkdir -p "$am_dir"

    cat > "$am_dir/alertmanager.yml" << 'AMEOF'
global:
  resolve_timeout: 5m

route:
  group_by: ['alertname', 'severity']
  group_wait: 10s
  group_interval: 5m
  repeat_interval: 1h
  receiver: 'slack-ops'

  routes:
    - match:
        severity: critical
      receiver: 'pagerduty-oncall'
      continue: true

    - match:
        severity: critical
      receiver: 'slack-ops'

    - match:
        severity: warning
      receiver: 'slack-ops'

receivers:
  - name: 'slack-ops'
    slack_configs:
      - api_url: '${SLACK_OPS_WEBHOOK_URL}'
        channel: '#paperclip-ops'
        title: '{{ .GroupLabels.alertname }}'
        text: '{{ range .Alerts }}{{ .Annotations.description }}{{ end }}'
        send_resolved: true

  - name: 'pagerduty-oncall'
    pagerduty_configs:
      - service_key: '${PAGERDUTY_SERVICE_KEY}'
        severity: '{{ .GroupLabels.severity }}'

inhibit_rules:
  - source_match:
      severity: 'critical'
    target_match:
      severity: 'warning'
    equal: ['alertname']
AMEOF

    log_success "Grafana + Prometheus + Alertmanager configuration written to ${SCRIPT_DIR}/monitoring/"
}

# ============================================================================
# PHASE D: CONFIGURE ALERTING
# ============================================================================

phase_d_alerting() {
    log_info "=== PHASE D: Configuring Alerting ==="

    if [[ "$STACK" == "datadog" ]]; then
        log_info "Datadog alerting is configured via dashboard monitors"
        log_info "Create monitors using Datadog UI or Terraform provider"
        log_info "Alert rules defined in monitoring-config.yaml"
    else
        log_info "Prometheus alerting configured in alerts.yml"
        log_info "Alertmanager routing configured in alertmanager.yml"
    fi

    log_success "Alerting configuration complete"
}

# ============================================================================
# PHASE E: VERIFY DEPLOYMENT
# ============================================================================

phase_e_verify() {
    log_info "=== PHASE E: Verifying Deployment ==="

    local checks_passed=0
    local checks_total=0

    # Check 1: Monitoring config exists
    checks_total=$((checks_total + 1))
    if [[ -f "$CONFIG_FILE" ]]; then
        log_success "VERIFY: monitoring-config.yaml exists"
        checks_passed=$((checks_passed + 1))
    else
        log_error "VERIFY: monitoring-config.yaml MISSING"
    fi

    # Check 2: Stack-specific configs exist
    checks_total=$((checks_total + 1))
    if [[ "$STACK" == "datadog" ]]; then
        if [[ -f "${SCRIPT_DIR}/monitoring/datadog/dashboards/paperclip-overview.json" ]]; then
            log_success "VERIFY: Datadog dashboard definition exists"
            checks_passed=$((checks_passed + 1))
        else
            log_error "VERIFY: Datadog dashboard definition MISSING"
        fi
    else
        if [[ -f "${SCRIPT_DIR}/monitoring/docker-compose.yml" ]]; then
            log_success "VERIFY: docker-compose.yml exists"
            checks_passed=$((checks_passed + 1))
        else
            log_error "VERIFY: docker-compose.yml MISSING"
        fi
    fi

    # Check 3: Alert rules exist
    checks_total=$((checks_total + 1))
    if [[ "$STACK" == "grafana" && -f "${SCRIPT_DIR}/monitoring/prometheus/alerts.yml" ]]; then
        log_success "VERIFY: Prometheus alert rules exist"
        checks_passed=$((checks_passed + 1))
    elif [[ "$STACK" == "datadog" && -f "${SCRIPT_DIR}/monitoring/datadog/conf.d/paperclip.yaml" ]]; then
        log_success "VERIFY: Datadog agent config exists"
        checks_passed=$((checks_passed + 1))
    else
        log_error "VERIFY: Alert configuration MISSING"
    fi

    # Check 4: For Grafana stack, verify containers are running
    if [[ "$STACK" == "grafana" && "$DRY_RUN" == "false" ]]; then
        checks_total=$((checks_total + 1))
        if docker ps --format '{{.Names}}' 2>/dev/null | grep -q "paperclip-grafana"; then
            log_success "VERIFY: Grafana container is running"
            checks_passed=$((checks_passed + 1))
        else
            log_warn "VERIFY: Grafana container not running (start with: cd monitoring && docker compose up -d)"
        fi

        checks_total=$((checks_total + 1))
        if docker ps --format '{{.Names}}' 2>/dev/null | grep -q "paperclip-prometheus"; then
            log_success "VERIFY: Prometheus container is running"
            checks_passed=$((checks_passed + 1))
        else
            log_warn "VERIFY: Prometheus container not running"
        fi
    fi

    log_info "================================================"
    log_info "Verification: ${checks_passed}/${checks_total} checks passed"
    log_info "================================================"

    if [[ $checks_passed -eq $checks_total ]]; then
        log_success "DEPLOYMENT VERIFICATION: PASSED"
    else
        log_warn "DEPLOYMENT VERIFICATION: PARTIAL (${checks_passed}/${checks_total})"
    fi
}

# ============================================================================
# MAIN EXECUTION
# ============================================================================

main() {
    echo "============================================================"
    echo "Paperclip Monitoring Stack Deployment"
    echo "Stack: $STACK | Environment: $ENV | Dry Run: $DRY_RUN"
    echo "Timestamp: $TIMESTAMP"
    echo "============================================================"

    log_info "Starting monitoring deployment..."

    # Phase A: Prerequisites
    if ! phase_a_validate; then
        log_error "Prerequisites not met. Fix errors above and re-run."
        exit 1
    fi

    if [[ "$DRY_RUN" == "true" ]]; then
        log_info "DRY RUN: Prerequisites validated. Exiting without deployment."
        exit 0
    fi

    # Phase B: Metrics Collection
    phase_b_metrics_collection

    # Phase C: Dashboards
    phase_c_deploy_dashboards

    # Phase D: Alerting
    phase_d_alerting

    # Phase E: Verification
    phase_e_verify

    echo ""
    echo "============================================================"
    log_success "Monitoring deployment COMPLETE"
    echo "============================================================"
    echo ""
    echo "NEXT STEPS:"
    if [[ "$STACK" == "grafana" ]]; then
        echo "  1. Set environment variables (see prerequisites)"
        echo "  2. cd ${SCRIPT_DIR}/monitoring && docker compose up -d"
        echo "  3. Open Grafana at http://localhost:3000 (admin/changeme)"
        echo "  4. Verify dashboards load and metrics appear"
        echo "  5. Trigger test alert to verify notification channels"
    else
        echo "  1. Set environment variables (DATADOG_API_KEY, DATADOG_APP_KEY, etc.)"
        echo "  2. Install Datadog agent on host"
        echo "  3. Import dashboard: datadog-ci dashboards import monitoring/datadog/dashboards/"
        echo "  4. Create monitors from alert rules in monitoring-config.yaml"
        echo "  5. Verify metrics appear in Datadog UI"
    fi
    echo ""
    echo "  After deployment, run verification:"
    echo "    $0 --stack $STACK --env $ENV  (re-run to verify)"
    echo ""
}

main
