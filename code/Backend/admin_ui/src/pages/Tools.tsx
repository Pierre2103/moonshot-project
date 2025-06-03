/**
 * Worker Management Tools
 * 
 * Provides administrative controls for managing background worker processes.
 * Workers handle asynchronous tasks like:
 * - Book processing and metadata fetching
 * - Collection merging and optimization
 * - Index building and maintenance
 * 
 * Features:
 * - Real-time worker status monitoring
 * - Start/stop controls for individual workers
 * - Auto-refresh status updates every 10 seconds
 * - Visual indicators for worker health
 */

import React, { useEffect, useState } from "react";
import { Card, Button, Tag, Space, message, Spin } from "antd";
import axios from "axios";
import { API_BASE_URL } from "../config/api";

interface WorkerStatus {
  name: string;     // Worker identifier
  running: boolean; // Current running state
}

/**
 * Configuration for all registered worker processes.
 * Each worker has a display name and unique identifier for API calls.
 */
const WORKERS = [
  { name: "Book Processing Worker", id: "book_worker" },
  { name: "Collection Merge Worker", id: "merge_collection_worker" },
  // Additional workers can be added here as the system expands
];

const Tools: React.FC = () => {
  const [statuses, setStatuses] = useState<Record<string, WorkerStatus>>({});
  const [loading, setLoading] = useState(false);

  /**
   * Fetch current status of all workers from the API.
   * Updates the local state with running/stopped status for each worker.
   */
  const fetchStatus = async (): Promise<void> => {
    if (!API_BASE_URL) {
      message.error("API configuration missing");
      return;
    }
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/admin/api/workers/status`);
      setStatuses(res.data);
    } catch {
      message.error("Unable to retrieve worker status");
    }
    setLoading(false);
  };

  /**
   * Start or stop a worker process.
   * 
   * @param id - Worker identifier
   * @param action - Action to perform ("start" or "stop")
   */
  const handleAction = async (id: string, action: "start" | "stop"): Promise<void> => {
    if (!API_BASE_URL) {
      message.error("API configuration missing");
      return;
    }
    setLoading(true);
    try {
      await axios.post(`${API_BASE_URL}/admin/api/workers/${id}/${action}`);
      message.success(`Worker ${action === "start" ? "started" : "stopped"} successfully!`);
      fetchStatus(); // Refresh status after action
    } catch {
      message.error("Action failed - please check worker configuration");
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    // Auto-refresh worker status every 10 seconds to keep UI current
    const interval = setInterval(fetchStatus, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <Card title="Worker Management">
      <Spin spinning={loading}>
        <Space direction="vertical" style={{ width: "100%" }}>
          {WORKERS.map(worker => (
            <Card key={worker.id} type="inner" style={{ marginBottom: 12 }}>
              <Space>
                <b>{worker.name}</b>
                <Tag color={statuses[worker.id]?.running ? "green" : "red"}>
                  {statuses[worker.id]?.running ? "Running" : "Stopped"}
                </Tag>
                <Button
                  type="primary"
                  onClick={() => handleAction(worker.id, "start")}
                  disabled={statuses[worker.id]?.running}
                >
                  Start
                </Button>
                <Button
                  danger
                  onClick={() => handleAction(worker.id, "stop")}
                  disabled={!statuses[worker.id]?.running}
                >
                  Stop
                </Button>
              </Space>
            </Card>
          ))}
        </Space>
      </Spin>
    </Card>
  );
};

export default Tools;
