"""
Worker Process Management API

Provides endpoints for managing background worker processes that handle
book processing, collection merging, and other asynchronous tasks.

Workers are registered with their start commands and script paths, then
can be started/stopped via the admin interface.
"""

import subprocess
import threading

# Global registry for all worker processes
# Each worker has: start_cmd, script_path, process handle, and running status
WORKERS = {}


def register_worker(worker_id: str, start_cmd: list, script_path: str) -> None:
    """
    Register a new worker for management.

    Args:
        worker_id: Unique identifier for the worker
        start_cmd: Command array to start the worker (e.g., ["python", "worker.py"])
        script_path: Full path to the worker script file
    """
    WORKERS[worker_id] = {
        "start_cmd": start_cmd,
        "script_path": script_path,
        "process": None,  # subprocess.Popen instance when running
        "running": False,  # Current running status
    }


def start_worker(worker_id: str) -> bool:
    """
    Start a worker process.

    Args:
        worker_id: ID of the worker to start

    Returns:
        True if started successfully, False if already running or not found
    """
    worker = WORKERS.get(worker_id)
    if worker and not worker["running"]:
        # Start the worker as a subprocess
        proc = subprocess.Popen(["python", worker["script_path"]])
        worker["process"] = proc
        worker["running"] = True
        return True
    return False


def stop_worker(worker_id: str) -> bool:
    """
    Stop a running worker process.

    Args:
        worker_id: ID of the worker to stop

    Returns:
        True if stopped successfully, False if not running or not found
    """
    worker = WORKERS.get(worker_id)
    if worker and worker["running"] and worker["process"]:
        worker["process"].terminate()
        worker["process"].wait()  # Wait for process to fully terminate
        worker["process"] = None
        worker["running"] = False
        return True
    return False


def get_worker_status() -> dict:
    """
    Get current status of all registered workers.

    Returns:
        Dictionary mapping worker_id to status info (name, running)
    """
    status = {}
    for worker_id, worker in WORKERS.items():
        # Check if process is actually still running
        running = worker["process"] is not None and worker["process"].poll() is None
        worker["running"] = running  # Update cached status

        status[worker_id] = {
            "name": worker_id,
            "running": running,
        }
    return status


# Flask API endpoints for worker management
from flask import Blueprint, jsonify, request

workers_api = Blueprint("workers_api", __name__, url_prefix="/admin/api/workers")


@workers_api.route("/status", methods=["GET"])
def status():
    """
    Get status of all workers.

    Returns:
        200: Dictionary of worker statuses
    """
    return jsonify(get_worker_status())


@workers_api.route("/<worker_id>/start", methods=["POST"])
def start(worker_id):
    """
    Start a specific worker.

    Args:
        worker_id: ID of worker to start

    Returns:
        200: Worker started successfully
        400: Worker not found or already running
    """
    if start_worker(worker_id):
        return jsonify({"status": "started"})
    else:
        return jsonify({"error": "Failed to start worker or already running"}), 400


@workers_api.route("/<worker_id>/stop", methods=["POST"])
def stop(worker_id):
    """
    Stop a specific worker.

    Args:
        worker_id: ID of worker to stop

    Returns:
        200: Worker stopped successfully
        400: Worker not found or not running
    """
    if stop_worker(worker_id):
        return jsonify({"status": "stopped"})
    else:
        return jsonify({"error": "Failed to stop worker or not running"}), 400
