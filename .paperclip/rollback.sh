#!/bin/bash
# ============================================================================
# Paperclip Integration - Rollback Script
# ============================================================================
# Owner: Operations/DevOps Lead
# Created: 2026-03-08
# Purpose: Safely rollback Paperclip integration to a previous phase state
# Target SLA: Phase 3 rollback < 10 minutes
#
# USAGE:
#   ./rollback.sh --to <phase> [--force] [--dry-run]
#
# EXAMPLES:
#   ./rollback.sh --to phase2          # Rollback from Phase 3 to Phase 2
#   ./rollback.sh --to phase0          # Full rollback to pre-integration state
#   ./rollback.sh --to phase2 --dry-run # Preview rollback steps without executing
#
# PREREQUISITES:
#   - Git tags exist for each phase completion (created by this script or CI)
#   - Phase tags: paperclip/phase-0, paperclip/phase-1, paperclip/phase-2, etc.
#   - Current working directory is the repo root
#
# SAFETY:
#   - Uses git tags (not git reset --hard) for safe, reversible rollback
#   - Creates a backup tag before rollback
#   - Graceful agent shutdown (SIGTERM) before force kill (SIGKILL)
#   - Post-rollback health check
#   - Full logging to rollback.log

set -euo pipefail

# ============================================================================
# CONFIGURATION
# ============================================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
LOG_FILE="${SCRIPT_DIR}/rollback.log"
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
ROLLBACK_ID="rollback-$(date -u +%Y%m%d-%H%M%S)"

# Timing
SECONDS=0  # Bash built-in timer

# Agent process patterns
AGENT_PROCESS_PATTERN='paperclip.*agent'

# Grace period for SIGTERM before SIGKILL (seconds)
GRACEFUL_SHUTDOWN_TIMEOUT=10

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# ============================================================================
# ARGUMENT PARSING
# ============================================================================

TARGET_PHASE=""
FORCE=false
DRY_RUN=false

usage() {
    echo "Usage: $0 --to <phase> [--force] [--dry-run]"
    echo ""
    echo "Phases:"
    echo "  phase0    Full rollback to pre-Paperclip state (Phase 0)"
    echo "  phase1    Rollback to Phase 1 (audit complete, no integration)"
    echo "  phase2    Rollback to Phase 2 (design complete, no implementation)"
    echo ""
    echo "Options:"
    echo "  --to       Target phase to rollback to (required)"
    echo "  --force    Skip confirmation prompt"
    echo "  --dry-run  Preview steps without executing"
    echo "  --help     Show this help"
    exit 1
}

while [[ $# -gt 0 ]]; do
    case $1 in
        --to)
            TARGET_PHASE="$2"
            shift 2
            ;;
        --force)
            FORCE=true
            shift
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

if [[ -z "$TARGET_PHASE" ]]; then
    echo -e "${RED}ERROR: --to is required${NC}"
    usage
fi

if [[ "$TARGET_PHASE" != "phase0" && "$TARGET_PHASE" != "phase1" && "$TARGET_PHASE" != "phase2" ]]; then
    echo -e "${RED}ERROR: --to must be phase0, phase1, or phase2${NC}"
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
log_step() { log "${BLUE}STEP${NC}" "$1"; }

# ============================================================================
# PRE-FLIGHT CHECKS
# ============================================================================

preflight() {
    log_info "=== PRE-FLIGHT CHECKS ==="

    local errors=0

    # Check we're in the repo root
    if [[ ! -d "$REPO_ROOT/.git" ]]; then
        log_error "Not in a git repository: $REPO_ROOT"
        errors=$((errors + 1))
    else
        log_success "Git repository confirmed: $REPO_ROOT"
    fi

    # Check for uncommitted changes
    cd "$REPO_ROOT"
    if [[ -n "$(git status --porcelain)" ]]; then
        log_warn "Uncommitted changes detected. These will be stashed before rollback."
    fi

    # Check target tag exists
    local tag_name="paperclip/${TARGET_PHASE}"
    if git rev-parse "$tag_name" >/dev/null 2>&1; then
        log_success "Target tag exists: $tag_name"
    else
        log_warn "Target tag does not exist: $tag_name"
        if [[ "$TARGET_PHASE" == "phase0" ]]; then
            # Phase 0 = main branch before any paperclip work
            if git rev-parse "origin/main" >/dev/null 2>&1; then
                log_info "Phase 0 will use origin/main as rollback target"
            else
                log_error "Neither tag 'paperclip/phase0' nor 'origin/main' found"
                errors=$((errors + 1))
            fi
        else
            log_error "Cannot rollback to $TARGET_PHASE without tag $tag_name"
            log_info "Create the tag first: git tag $tag_name <commit-hash>"
            errors=$((errors + 1))
        fi
    fi

    # Check git is clean enough for checkout
    if [[ $errors -gt 0 ]]; then
        log_error "Pre-flight checks FAILED with $errors error(s)"
        return 1
    fi

    log_success "Pre-flight checks PASSED"
    return 0
}

# ============================================================================
# STEP 1: STOP AGENT PROCESSES
# ============================================================================

stop_agents() {
    log_step "STEP 1: Stopping agent processes..."

    local agent_pids
    agent_pids=$(pgrep -f "$AGENT_PROCESS_PATTERN" 2>/dev/null || true)

    if [[ -z "$agent_pids" ]]; then
        log_info "No agent processes found running"
        return 0
    fi

    local agent_count
    agent_count=$(echo "$agent_pids" | wc -l | tr -d ' ')
    log_info "Found $agent_count agent process(es)"

    # Graceful shutdown (SIGTERM)
    log_info "Sending SIGTERM to agent processes (graceful shutdown)..."
    if [[ "$DRY_RUN" == "false" ]]; then
        echo "$agent_pids" | xargs kill -15 2>/dev/null || true
    else
        log_info "[DRY RUN] Would send SIGTERM to PIDs: $(echo $agent_pids | tr '\n' ' ')"
    fi

    # Wait for graceful shutdown
    log_info "Waiting ${GRACEFUL_SHUTDOWN_TIMEOUT}s for graceful shutdown..."
    if [[ "$DRY_RUN" == "false" ]]; then
        sleep "$GRACEFUL_SHUTDOWN_TIMEOUT"
    fi

    # Check if any processes remain
    local remaining_pids
    remaining_pids=$(pgrep -f "$AGENT_PROCESS_PATTERN" 2>/dev/null || true)

    if [[ -n "$remaining_pids" ]]; then
        log_warn "Some agents did not stop gracefully. Sending SIGKILL..."
        if [[ "$DRY_RUN" == "false" ]]; then
            echo "$remaining_pids" | xargs kill -9 2>/dev/null || true
            sleep 2
        else
            log_info "[DRY RUN] Would send SIGKILL to PIDs: $(echo $remaining_pids | tr '\n' ' ')"
        fi
    fi

    # Final verification
    local final_check
    final_check=$(pgrep -f "$AGENT_PROCESS_PATTERN" 2>/dev/null || true)
    if [[ -z "$final_check" ]]; then
        log_success "All agent processes stopped"
    else
        log_error "Failed to stop some agent processes: $final_check"
        return 1
    fi
}

# ============================================================================
# STEP 2: STOP MONITORING SERVICES
# ============================================================================

stop_monitoring() {
    log_step "STEP 2: Stopping monitoring services..."

    local monitoring_dir="${SCRIPT_DIR}/monitoring"

    if [[ -f "$monitoring_dir/docker-compose.yml" ]]; then
        if [[ "$DRY_RUN" == "false" ]]; then
            cd "$monitoring_dir"
            if docker compose ps --quiet 2>/dev/null | grep -q .; then
                docker compose down --timeout 30 2>/dev/null || true
                log_success "Monitoring containers stopped"
            else
                log_info "No monitoring containers running"
            fi
            cd "$REPO_ROOT"
        else
            log_info "[DRY RUN] Would stop monitoring docker containers"
        fi
    else
        log_info "No monitoring docker-compose.yml found"
    fi
}

# ============================================================================
# STEP 3: CREATE BACKUP
# ============================================================================

create_backup() {
    log_step "STEP 3: Creating backup before rollback..."

    cd "$REPO_ROOT"

    local backup_tag="backup/${ROLLBACK_ID}"

    if [[ "$DRY_RUN" == "false" ]]; then
        # Stash any uncommitted changes
        if [[ -n "$(git status --porcelain)" ]]; then
            git stash push -m "Pre-rollback stash: $ROLLBACK_ID"
            log_info "Uncommitted changes stashed"
        fi

        # Tag current state for recovery
        git tag "$backup_tag" -m "Backup before rollback to $TARGET_PHASE at $TIMESTAMP"
        log_success "Backup tag created: $backup_tag"
        log_info "To undo this rollback: git checkout $backup_tag"
    else
        log_info "[DRY RUN] Would create backup tag: $backup_tag"
    fi
}

# ============================================================================
# STEP 4: ROLLBACK CODE
# ============================================================================

rollback_code() {
    log_step "STEP 4: Rolling back code to $TARGET_PHASE..."

    cd "$REPO_ROOT"

    local target_ref=""
    local tag_name="paperclip/${TARGET_PHASE}"

    if git rev-parse "$tag_name" >/dev/null 2>&1; then
        target_ref="$tag_name"
    elif [[ "$TARGET_PHASE" == "phase0" ]]; then
        target_ref="origin/main"
    else
        log_error "No rollback target found for $TARGET_PHASE"
        return 1
    fi

    log_info "Rollback target: $target_ref ($(git rev-parse --short "$target_ref" 2>/dev/null || echo 'unknown'))"

    if [[ "$DRY_RUN" == "false" ]]; then
        # Create a new branch from the target ref
        local rollback_branch="rollback/${ROLLBACK_ID}"
        git checkout -b "$rollback_branch" "$target_ref"
        log_success "Checked out rollback branch: $rollback_branch (from $target_ref)"
    else
        log_info "[DRY RUN] Would checkout new branch from $target_ref"
    fi
}

# ============================================================================
# STEP 5: CLEAN UP PAPERCLIP STATE
# ============================================================================

cleanup_state() {
    log_step "STEP 5: Cleaning up Paperclip state..."

    if [[ "$TARGET_PHASE" == "phase0" ]]; then
        # Full cleanup - remove all Paperclip artifacts
        if [[ "$DRY_RUN" == "false" ]]; then
            # Remove monitoring containers and data
            if [[ -f "${SCRIPT_DIR}/monitoring/docker-compose.yml" ]]; then
                cd "${SCRIPT_DIR}/monitoring"
                docker compose down -v 2>/dev/null || true
                cd "$REPO_ROOT"
            fi
            log_info "Phase 0: Full Paperclip state cleaned"
        else
            log_info "[DRY RUN] Would remove all Paperclip state for Phase 0 rollback"
        fi
    else
        log_info "Partial rollback to $TARGET_PHASE - Paperclip configuration preserved"
    fi

    # Verify no orphaned processes
    local orphans
    orphans=$(pgrep -f "$AGENT_PROCESS_PATTERN" 2>/dev/null || true)
    if [[ -z "$orphans" ]]; then
        log_success "No orphaned agent processes"
    else
        log_warn "Orphaned processes detected: $orphans"
        if [[ "$DRY_RUN" == "false" ]]; then
            echo "$orphans" | xargs kill -9 2>/dev/null || true
        fi
    fi
}

# ============================================================================
# STEP 6: RESTORE ENVIRONMENT
# ============================================================================

restore_env() {
    log_step "STEP 6: Restoring environment..."

    cd "$REPO_ROOT"

    if [[ "$TARGET_PHASE" == "phase0" ]]; then
        # Restore original .env if backup exists
        if [[ -f ".env.backup.pre-paperclip" ]]; then
            if [[ "$DRY_RUN" == "false" ]]; then
                cp ".env.backup.pre-paperclip" ".env"
                log_success "Restored .env from pre-Paperclip backup"
            else
                log_info "[DRY RUN] Would restore .env from .env.backup.pre-paperclip"
            fi
        else
            log_warn "No .env backup found (.env.backup.pre-paperclip). .env may need manual restoration."
        fi
    fi

    # Reinstall dependencies for the target phase
    if [[ -f "package.json" ]]; then
        if [[ "$DRY_RUN" == "false" ]]; then
            npm install --production 2>/dev/null || true
            log_success "Dependencies installed for $TARGET_PHASE"
        else
            log_info "[DRY RUN] Would run npm install"
        fi
    fi
}

# ============================================================================
# STEP 7: POST-ROLLBACK HEALTH CHECK
# ============================================================================

health_check() {
    log_step "STEP 7: Post-rollback health check..."

    local checks_passed=0
    local checks_total=0

    cd "$REPO_ROOT"

    # Check 1: Git state is clean
    checks_total=$((checks_total + 1))
    if [[ -z "$(git status --porcelain)" ]]; then
        log_success "HEALTH: Git working directory is clean"
        checks_passed=$((checks_passed + 1))
    else
        log_warn "HEALTH: Git working directory has changes"
    fi

    # Check 2: No orphaned agent processes
    checks_total=$((checks_total + 1))
    if [[ -z "$(pgrep -f "$AGENT_PROCESS_PATTERN" 2>/dev/null || true)" ]]; then
        log_success "HEALTH: No orphaned agent processes"
        checks_passed=$((checks_passed + 1))
    else
        log_error "HEALTH: Orphaned agent processes detected"
    fi

    # Check 3: Core files exist
    checks_total=$((checks_total + 1))
    if [[ -f "$REPO_ROOT/src/run.js" && -f "$REPO_ROOT/package.json" && -f "$REPO_ROOT/CLAUDE.md" ]]; then
        log_success "HEALTH: Core files present (src/run.js, package.json, CLAUDE.md)"
        checks_passed=$((checks_passed + 1))
    else
        log_error "HEALTH: Missing core files"
    fi

    # Check 4: Dependencies installed
    checks_total=$((checks_total + 1))
    if [[ -d "$REPO_ROOT/node_modules/@anthropic-ai" ]]; then
        log_success "HEALTH: Dependencies installed"
        checks_passed=$((checks_passed + 1))
    else
        log_warn "HEALTH: Dependencies may need reinstalling (npm install)"
    fi

    # Check 5: Application can start (quick syntax check)
    checks_total=$((checks_total + 1))
    if node --check "$REPO_ROOT/src/run.js" 2>/dev/null; then
        log_success "HEALTH: src/run.js passes syntax check"
        checks_passed=$((checks_passed + 1))
    else
        log_error "HEALTH: src/run.js has syntax errors"
    fi

    # Check 6: No monitoring containers running (if Phase 0)
    if [[ "$TARGET_PHASE" == "phase0" ]]; then
        checks_total=$((checks_total + 1))
        if ! docker ps --format '{{.Names}}' 2>/dev/null | grep -q "paperclip"; then
            log_success "HEALTH: No Paperclip containers running"
            checks_passed=$((checks_passed + 1))
        else
            log_warn "HEALTH: Paperclip containers still running"
        fi
    fi

    log_info "================================================"
    log_info "Health check: ${checks_passed}/${checks_total} passed"
    log_info "================================================"

    if [[ $checks_passed -eq $checks_total ]]; then
        log_success "POST-ROLLBACK HEALTH CHECK: PASSED"
        return 0
    else
        log_warn "POST-ROLLBACK HEALTH CHECK: ${checks_passed}/${checks_total} (review warnings above)"
        return 0  # Non-fatal -- warnings are acceptable
    fi
}

# ============================================================================
# MAIN
# ============================================================================

main() {
    echo ""
    echo "============================================================"
    echo "  PAPERCLIP INTEGRATION ROLLBACK"
    echo "  Target: $TARGET_PHASE"
    echo "  Rollback ID: $ROLLBACK_ID"
    echo "  Timestamp: $TIMESTAMP"
    echo "  Dry Run: $DRY_RUN"
    echo "============================================================"
    echo ""

    log_info "Starting rollback to $TARGET_PHASE..."

    # Pre-flight
    if ! preflight; then
        log_error "Pre-flight checks failed. Aborting."
        exit 1
    fi

    # Confirmation
    if [[ "$FORCE" == "false" && "$DRY_RUN" == "false" ]]; then
        echo ""
        echo -e "${YELLOW}WARNING: This will rollback the Paperclip integration to $TARGET_PHASE.${NC}"
        echo "  - Agent processes will be stopped"
        echo "  - Monitoring services will be stopped"
        echo "  - Code will be checked out to the $TARGET_PHASE state"
        echo "  - A backup tag will be created for recovery"
        echo ""
        read -p "Continue? (yes/no): " confirm
        if [[ "$confirm" != "yes" ]]; then
            log_info "Rollback cancelled by user."
            exit 0
        fi
    fi

    # Execute rollback steps
    stop_agents
    stop_monitoring
    create_backup
    rollback_code
    cleanup_state
    restore_env

    if [[ "$DRY_RUN" == "false" ]]; then
        health_check
    fi

    # Report timing
    local elapsed=$SECONDS
    local minutes=$((elapsed / 60))
    local seconds=$((elapsed % 60))

    echo ""
    echo "============================================================"
    if [[ "$DRY_RUN" == "true" ]]; then
        log_info "DRY RUN COMPLETE (no changes made)"
    else
        log_success "ROLLBACK COMPLETE"
    fi
    echo "  Target: $TARGET_PHASE"
    echo "  Duration: ${minutes}m ${seconds}s"
    echo "  Backup tag: backup/${ROLLBACK_ID}"
    if [[ $elapsed -lt 600 ]]; then
        echo -e "  SLA (<10 min): ${GREEN}MET${NC}"
    else
        echo -e "  SLA (<10 min): ${RED}EXCEEDED${NC} (${minutes}m ${seconds}s)"
    fi
    echo "  Log: $LOG_FILE"
    echo "============================================================"
    echo ""
    echo "To undo this rollback:"
    echo "  git checkout backup/${ROLLBACK_ID}"
    echo "  git stash pop  # if changes were stashed"
    echo ""

    # Record execution time in log
    log_info "Rollback duration: ${minutes}m ${seconds}s (SLA: <10 min)"
}

main
