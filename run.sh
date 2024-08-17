#!/usr/bin/env bash
set -eu

backend_log="backend.log"
frontend_log="frontend.log"

function run_with_logging() {
  local command="$1"
  local log_file="$2"

  echo "Starting $command" > "$log_file"
  $command 2>&1 | tee -a "$log_file"
  local exit_code=$?

  if [ $exit_code -ne 0 ]; then
    echo "Error running $command: Exit code $exit_code"
    exit $exit_code
  fi
}

run_with_logging "cd backend && npm start" "$backend_log" &
run_with_logging "cd frontend && npm start" "$frontend_log" &

wait