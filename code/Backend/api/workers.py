import subprocess
import threading

# Registry for workers
WORKERS = {}

def register_worker(worker_id, start_cmd, script_path):
    WORKERS[worker_id] = {
        "start_cmd": start_cmd,
        "script_path": script_path,
        "process": None,
        "running": False,
    }

def start_worker(worker_id):
    worker = WORKERS.get(worker_id)
    if worker and not worker["running"]:
        # Start the worker as a subprocess
        proc = subprocess.Popen(["python", worker["script_path"]])
        worker["process"] = proc
        worker["running"] = True

def stop_worker(worker_id):
    worker = WORKERS.get(worker_id)
    if worker and worker["running"] and worker["process"]:
        worker["process"].terminate()
        worker["process"].wait()
        worker["process"] = None
        worker["running"] = False

def get_worker_status():
    status = {}
    for worker_id, worker in WORKERS.items():
        running = worker["process"] is not None and worker["process"].poll() is None
        worker["running"] = running
        status[worker_id] = {
            "name": worker_id,
            "running": running,
        }
    return status

# Flask endpoints for admin API
from flask import Blueprint, jsonify, request

workers_api = Blueprint("workers_api", __name__, url_prefix="/admin/api/workers")

@workers_api.route("/status", methods=["GET"])
def status():
    return jsonify(get_worker_status())

@workers_api.route("/<worker_id>/start", methods=["POST"])
def start(worker_id):
    start_worker(worker_id)
    return jsonify({"status": "started"})

@workers_api.route("/<worker_id>/stop", methods=["POST"])
def stop(worker_id):
    stop_worker(worker_id)
    return jsonify({"status": "stopped"})
