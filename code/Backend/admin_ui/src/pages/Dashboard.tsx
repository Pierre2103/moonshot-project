/**
 * Administrative Dashboard
 * 
 * Central monitoring and management interface for the book scanning system.
 * Provides real-time insights into system activity, user engagement, and content growth.
 * 
 * Key Features:
 * - Real-time system statistics and health monitoring
 * - Daily activity tracking with visual trends
 * - Recent activity feeds for immediate visibility
 * - Interactive charts for data analysis
 * - Quick access to administrative actions
 * - Responsive design for desktop and mobile viewing
 * 
 * Data Sources:
 * - System statistics from database aggregations
 * - Daily activity logs and scan tracking
 * - User engagement metrics
 * - Book collection growth analytics
 * 
 * Refresh Behavior:
 * - Auto-refreshes every 30 seconds for live monitoring
 * - Manual refresh capability
 * - Error handling with retry mechanisms
 */

import React, { useEffect, useState, useRef } from "react";
import { 
  Row, Col, Card, Statistic, Typography, List, Avatar, Progress, 
  Button, Space, Tag, Divider, message, Spin, Empty 
} from "antd";
import {
  BookOutlined,
  UserOutlined,
  ScanOutlined,
  FolderOutlined, // Fixed: Changed from CollectionOutlined
  TrophyOutlined,
  ClockCircleOutlined,
  ReloadOutlined,
  RiseOutlined,
  TeamOutlined,
  DatabaseOutlined
} from "@ant-design/icons";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, Legend
} from "recharts";
import axios from "axios";
import { API_BASE_URL } from "../config/api";

const { Text, Title } = Typography;

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Core system statistics from the database
 */
interface Stats {
  books: number;          // Total books in database
  pending: number;        // Books awaiting processing
  scans: number;          // Total scan attempts
  suggestions: number;    // Successful matches
}

/**
 * Daily activity data for trend visualization
 */
interface Activity {
  date: string;           // YYYY-MM-DD format
  books: number;          // Books added on this date
  scans: number;          // Scans performed on this date
  suggestions: number;    // Successful suggestions on this date
  users: number;          // Active users on this date
  collections: number;    // Collections created on this date
}

/**
 * Parsed log entry for display
 */
interface LogItem {
  timestamp: string;      // Formatted timestamp
  level: string;          // Log level (INFO, ERROR, SUCCESS, WARNING)
  message: string;        // Human-readable log message
}

/**
 * User activity information
 */
interface User {
  username: string;       // User identifier
  scan_count: number;     // Number of scans performed today
}

/**
 * Detailed today's activity breakdown
 */
interface DailyStats {
  scanned_books: Array<{
    isbn: string;
    title: string;
    authors: string | string[];
    time: string;         // HH:MM format
  }>;
  added_books: Array<{
    isbn: string;
    title: string;
    authors: string | string[];
    time: string;         // HH:MM format
  }>;
  active_users: User[];
  collections: Array<{
    name: string;
    username: string;
    time: string;         // HH:MM format
  }>;
}

// ============================================================================
// CONSTANTS
// ============================================================================

/** Color scheme for consistent visualization */
const CHART_COLORS = ["#8884d8", "#82ca9d", "#ffc658", "#ff7c7c", "#8dd1e1"];
const SUCCESS_COLOR = "#52c41a";
const WARNING_COLOR = "#faad14";
const ERROR_COLOR = "#ff4d4f";
const INFO_COLOR = "#1890ff";

/** Auto-refresh interval in milliseconds (30 seconds) */
const REFRESH_INTERVAL = 30000;

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Format author names for consistent display.
 * Handles both string and array formats from the API.
 * 
 * @param authors - Authors field (string or array)
 * @returns Formatted author string
 */
const formatAuthors = (authors: string | string[]): string => {
  if (Array.isArray(authors)) {
    return authors.join(", ");
  }
  return authors || "Unknown Author";
};

/**
 * Parse log entry to extract level and message.
 * Handles formatted log strings from the backend.
 * 
 * @param logEntry - Raw log string
 * @returns Parsed log object with timestamp, level, and message
 */
const parseLogEntry = (logEntry: string): LogItem => {
  // Extract timestamp, level, and message from formatted log string
  const match = logEntry.match(/^(.+) \[(.+)\] (.+)$/);
  if (match) {
    return {
      timestamp: match[1],
      level: match[2],
      message: match[3]
    };
  }
  
  // Fallback for unformatted logs
  return {
    timestamp: "Unknown",
    level: "INFO",
    message: logEntry
  };
};

/**
 * Get appropriate color for log level visualization.
 * Maps log levels to Ant Design color names for consistent theming.
 * 
 * @param level - Log level string
 * @returns Ant Design color name
 */
const getLogLevelColor = (level: string): string => {
  switch (level.toUpperCase()) {
    case "SUCCESS": return "success";
    case "ERROR": return "error";
    case "WARNING": return "warning";
    case "INFO": 
    default: return "processing";
  }
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const Dashboard: React.FC = () => {
  // ----------------------------------------------------------------------------
  // STATE MANAGEMENT
  // ----------------------------------------------------------------------------
  
  const [stats, setStats] = useState<Stats>({ 
    books: 0, 
    pending: 0, 
    scans: 0, 
    suggestions: 0 
  });
  const [activity, setActivity] = useState<Activity[]>([]);
  const [logs, setLogs] = useState<string[]>([]);
  const [todayDetails, setTodayDetails] = useState<DailyStats>({
    scanned_books: [],
    added_books: [],
    active_users: [],
    collections: []
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Track last log for change detection
  const lastLogRef = useRef<string | null>(null);
  const initialLogsFetched = useRef(false);

  // ----------------------------------------------------------------------------
  // DATA FETCHING
  // ----------------------------------------------------------------------------

  /**
   * Fetch all dashboard data from multiple API endpoints.
   * Executes concurrent requests for better performance and handles errors gracefully.
   * 
   * @param isRefresh - Whether this is a manual refresh (affects loading state)
   */
  const fetchData = async (isRefresh = false): Promise<void> => {
    if (!API_BASE_URL) {
      message.error("API configuration missing");
      return;
    }

    try {
      // Set appropriate loading state
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      // Execute all API calls concurrently for better performance
      const [statsRes, activityRes, logsRes, todayRes] = await Promise.all([
        axios.get(`http://${API_BASE_URL}:5001/admin/api/stats`),
        axios.get(`http://${API_BASE_URL}:5001/admin/api/activity`),
        axios.get(`http://${API_BASE_URL}:5001/admin/api/logs?limit=30`),
        axios.get(`http://${API_BASE_URL}:5001/admin/api/today-details`)
      ]);

      // Update state with fetched data
      setStats(statsRes.data);
      setActivity(activityRes.data);
      setLogs(logsRes.data);
      setTodayDetails(todayRes.data);

      // Show success message for manual refreshes
      if (isRefresh) {
        message.success("Dashboard refreshed successfully");
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      message.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  /**
   * Manual refresh handler for user-initiated updates.
   * Triggered by the refresh button in the header.
   */
  const handleRefresh = (): void => {
    fetchData(true);
  };

  // ----------------------------------------------------------------------------
  // LIFECYCLE HOOKS
  // ----------------------------------------------------------------------------

  /**
   * Component mount and auto-refresh setup
   * - Fetches initial data
   * - Sets up auto-refresh interval
   * - Cleans up interval on unmount
   */
  useEffect(() => {
    fetchData();
    
    // Set up auto-refresh every 30 seconds for live monitoring
    const interval = setInterval(() => fetchData(true), REFRESH_INTERVAL);
    
    // Cleanup interval on component unmount
    return () => clearInterval(interval);
  }, []);

  // Poll logs every 2 seconds and refresh dashboard if new log appears
  useEffect(() => {
    let isMounted = true;
    const pollLogs = async () => {
      if (!API_BASE_URL) return;
      try {
        const res = await axios.get(`http://${API_BASE_URL}:5001/admin/api/logs?limit=30`);
        if (!isMounted) return;
        const newLogs: string[] = res.data || [];
        // On first fetch, just set logs
        if (!initialLogsFetched.current) {
          setLogs(newLogs);
          lastLogRef.current = newLogs[0] || null;
          initialLogsFetched.current = true;
        } else {
          // If new log detected, refresh dashboard
          if (newLogs[0] && newLogs[0] !== lastLogRef.current) {
            lastLogRef.current = newLogs[0];
            setLogs(newLogs);
            fetchData(true);
          } else {
            setLogs(newLogs);
          }
        }
      } catch (e) {
        // Ignore errors
      }
    };
    const pollInterval = setInterval(pollLogs, 2000);
    // Initial poll
    pollLogs();
    return () => {
      isMounted = false;
      clearInterval(pollInterval);
    };
  }, [API_BASE_URL]);

  // ----------------------------------------------------------------------------
  // COMPUTED VALUES
  // ----------------------------------------------------------------------------

  // Removed getSuccessRate function since Success Rate card was removed

  // ----------------------------------------------------------------------------
  // RENDER HELPERS
  // ----------------------------------------------------------------------------

  /**
   * Loading state component
   * Displayed while initial data is being fetched
   */
  if (loading) {
    return (
      <div style={{ 
        display: "flex", 
        justifyContent: "center", 
        alignItems: "center", 
        height: "60vh" 
      }}>
        <Spin size="large" tip="Loading dashboard data..." />
      </div>
    );
  }

  // ----------------------------------------------------------------------------
  // MAIN RENDER
  // ----------------------------------------------------------------------------

  const isTestUser = (username: string) => {
    return username && username.toLowerCase().includes("testuser_");
  };

  // Filter out test users from today's details
  const filteredActiveUsers = todayDetails.active_users.filter(
    (user) => !isTestUser(user.username)
  );
  const filteredCollections = todayDetails.collections.filter(
    (col) => !isTestUser(col.username)
  );
  const filteredAddedBooks = todayDetails.added_books; // No username info, can't filter
  // For scanned_books, try to match with filteredActiveUsers by username if possible
  // If scanned_books don't have username, show all
  let filteredScannedBooks = todayDetails.scanned_books;
  if (
    todayDetails.scanned_books.length > 0 &&
    (todayDetails.scanned_books[0] as any).username
  ) {
    filteredScannedBooks = todayDetails.scanned_books.filter((book: any) =>
      filteredActiveUsers.some((user) => user.username === book.username)
    );
  }

  // For "Today's Scans", count unique non-test users who scanned books
  // Use filteredActiveUsers for coherence
  const uniqueScanners = filteredActiveUsers.map((user) => user.username);

  // Patch today's activity in the chart to match filteredActiveUsers and their scan counts
  const filteredActivity = activity.map((day) => {
    // If today, override users and scans with filteredActiveUsers
    const todayStr = new Date().toISOString().slice(0, 10);
    if (day.date === todayStr) {
      return {
        ...day,
        users: filteredActiveUsers.length,
        scans: filteredActiveUsers.reduce((sum, user) => sum + user.scan_count, 0),
      };
    }
    return day;
  });

  return (
    <div style={{ padding: 24, background: "#f0f2f5", minHeight: "100vh" }}>
      {/* Dashboard Header */}
      <div style={{ marginBottom: 24 }}>
        <Space align="center" style={{ width: "100%", justifyContent: "space-between" }}>
          <div>
            <Title level={2} style={{ margin: 0, color: "#1890ff" }}>
              📊 System Dashboard
            </Title>
            <Text type="secondary" style={{ fontSize: 16 }}>
              Real-time monitoring and analytics for the book scanning system
            </Text>
          </div>
          <Button
            type="primary"
            icon={<ReloadOutlined />}
            onClick={handleRefresh}
            loading={refreshing}
            size="large"
            style={{ borderRadius: 8 }}
          >
            Refresh Data
          </Button>
        </Space>
      </div>

      {/* Key Metrics Cards */}
      <Row gutter={[24, 24]} style={{ marginBottom: 32 }}>
        {/* Total Books Metric */}
        <Col xs={24} sm={12} lg={8}>
          <Card
            bordered={false}
            style={{
              borderRadius: 12,
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              color: "white"
            }}
            bodyStyle={{ padding: 24 }}
          >
            <Statistic
              title={<span style={{ color: "rgba(255,255,255,0.8)" }}>Total Books</span>}
              value={stats.books}
              prefix={<BookOutlined style={{ color: "white" }} />}
              valueStyle={{ color: "white", fontSize: 28, fontWeight: 700 }}
            />
            <div style={{ marginTop: 8, fontSize: 12, color: "rgba(255,255,255,0.7)" }}>
              Books in database
            </div>
          </Card>
        </Col>

        {/* Pending Books Metric */}
        <Col xs={24} sm={12} lg={8}>
          <Card
            bordered={false}
            style={{
              borderRadius: 12,
              background: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
              color: "white"
            }}
            bodyStyle={{ padding: 24 }}
          >
            <Statistic
              title={<span style={{ color: "rgba(255,255,255,0.8)" }}>Pending Books</span>}
              value={stats.pending}
              prefix={<ClockCircleOutlined style={{ color: "white" }} />}
              valueStyle={{ color: "white", fontSize: 28, fontWeight: 700 }}
            />
            <div style={{ marginTop: 8, fontSize: 12, color: "rgba(255,255,255,0.7)" }}>
              Awaiting processing
            </div>
          </Card>
        </Col>

        {/* Total Scans Metric */}
        <Col xs={24} sm={12} lg={8}>
          <Card
            bordered={false}
            style={{
              borderRadius: 12,
              background: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
              color: "white"
            }}
            bodyStyle={{ padding: 24 }}
          >
            <Statistic
              title={<span style={{ color: "rgba(255,255,255,0.8)" }}>Total Scans</span>}
              value={stats.scans}
              prefix={<ScanOutlined style={{ color: "white" }} />}
              valueStyle={{ color: "white", fontSize: 28, fontWeight: 700 }}
            />
            <div style={{ marginTop: 8, fontSize: 12, color: "rgba(255,255,255,0.7)" }}>
              Scan attempts made
            </div>
          </Card>
        </Col>
      </Row>

      {/* Activity Charts and System Health */}
      <Row gutter={[24, 24]} style={{ marginBottom: 32 }}>
        {/* 7-Day Activity Trends Chart */}
        <Col xs={24} lg={18}>
          <Card
            title={
              <Space>
                <RiseOutlined style={{ color: "#1890ff" }} />
                <span>7-Day Activity Trends</span>
              </Space>
            }
            bordered={false}
            style={{ borderRadius: 12, height: 400 }}
            bodyStyle={{ padding: "16px 24px" }}
          >
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={filteredActivity}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis 
                  dataKey="date" 
                  stroke="#666"
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => new Date(value).toLocaleDateString()}
                />
                <YAxis stroke="#666" tick={{ fontSize: 12 }} />
                <Tooltip 
                  labelFormatter={(value) => new Date(value).toLocaleDateString()}
                  formatter={(value, name) => [value, String(name).charAt(0).toUpperCase() + String(name).slice(1)]}
                  contentStyle={{ 
                    borderRadius: 8, 
                    border: "none", 
                    boxShadow: "0 4px 12px rgba(0,0,0,0.1)" 
                  }}
                />
                <Legend />
                {/* Books Added Line */}
                <Line 
                  type="monotone" 
                  dataKey="books" 
                  stroke="#8884d8" 
                  strokeWidth={2}
                  dot={{ fill: "#8884d8", strokeWidth: 2, r: 4 }}
                  name="Books Added"
                />
                {/* Scans Performed Line */}
                <Line 
                  type="monotone" 
                  dataKey="scans" 
                  stroke="#82ca9d" 
                  strokeWidth={2}
                  dot={{ fill: "#82ca9d", strokeWidth: 2, r: 4 }}
                  name="Scans Performed"
                />
                {/* Active Users Line */}
                <Line 
                  type="monotone" 
                  dataKey="users" 
                  stroke="#ffc658" 
                  strokeWidth={2}
                  dot={{ fill: "#ffc658", strokeWidth: 2, r: 4 }}
                  name="Active Users"
                />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </Col>

        {/* Recent System Events */}
        <Col xs={24} lg={6}>
          <Card
            title={
              <Space>
                <DatabaseOutlined style={{ color: "#52c41a" }} />
                <span>Recent System Events</span>
              </Space>
            }
            bordered={false}
            style={{ borderRadius: 12, height: 400 }}
            bodyStyle={{ padding: "16px 24px", display: "flex", flexDirection: "column" }}
          >
            <div style={{ flex: 1, overflow: "hidden" }}>
              <div style={{ height: "320px", overflowY: "auto" }}>
                {logs.length > 0 ? (
                  <List
                    size="small"
                    dataSource={logs}
                    renderItem={log => {
                      const parsed = parseLogEntry(log);
                      return (
                        <List.Item style={{ padding: "8px 0", borderBottom: "1px solid #f0f0f0" }}>
                          <div style={{ width: "100%" }}>
                            {/* Log Header */}
                            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                              <Tag color={getLogLevelColor(parsed.level)}>
                                {parsed.level}
                              </Tag>
                              <Text type="secondary" style={{ fontSize: 11 }}>
                                {parsed.timestamp}
                              </Text>
                            </div>
                            {/* Log Message */}
                            <Text style={{ fontSize: 12 }} ellipsis={{ tooltip: parsed.message }}>
                              {parsed.message}
                            </Text>
                          </div>
                        </List.Item>
                      );
                    }}
                  />
                ) : (
                  <Empty 
                    image={Empty.PRESENTED_IMAGE_SIMPLE} 
                    description="No recent logs"
                    style={{ marginTop: 60 }}
                  />
                )}
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      {/* Today's Activity Details */}
      <Row gutter={[24, 24]}>
        {/* Today's Scanned Books */}
        <Col xs={24} md={12} lg={6}>
          <Card
            title={
              <Space>
                <ScanOutlined style={{ color: "#1890ff" }} />
                <span>Today's Scans</span>
              </Space>
            }
            bordered={false}
            style={{ borderRadius: 12, height: 350 }}
            bodyStyle={{ padding: "16px 24px" }}
          >
            <div style={{ height: 280, overflowY: "auto" }}>
              {filteredScannedBooks.length > 0 ? (
                <List
                  size="small"
                  dataSource={filteredScannedBooks}
                  renderItem={book => (
                    <List.Item style={{ padding: "8px 0" }}>
                      <List.Item.Meta
                        avatar={
                          <Avatar 
                            shape="square" 
                            size="small" 
                            style={{ backgroundColor: "#1890ff" }}
                          >
                            📖
                          </Avatar>
                        }
                        title={
                          <Text ellipsis={{ tooltip: book.title }} style={{ fontSize: 13 }}>
                            {book.title}
                          </Text>
                        }
                        description={
                          <div>
                            <Text type="secondary" style={{ fontSize: 11 }}>
                              {formatAuthors(book.authors)}
                            </Text>
                            <br />
                            <Text type="secondary" style={{ fontSize: 10 }}>
                              {book.time}
                            </Text>
                          </div>
                        }
                      />
                    </List.Item>
                  )}
                />
              ) : (
                <Empty 
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description="No scans today"
                  style={{ marginTop: 60 }}
                />
              )}
            </div>
          </Card>
        </Col>

        {/* Today's Added Books */}
        <Col xs={24} md={12} lg={6}>
          <Card
            title={
              <Space>
                <BookOutlined style={{ color: "#52c41a" }} />
                <span>Books Added Today</span>
              </Space>
            }
            bordered={false}
            style={{ borderRadius: 12, height: 350 }}
            bodyStyle={{ padding: "16px 24px" }}
          >
            <div style={{ height: 280, overflowY: "auto" }}>
              {filteredAddedBooks.length > 0 ? (
                <List
                  size="small"
                  dataSource={filteredAddedBooks}
                  renderItem={book => (
                    <List.Item style={{ padding: "8px 0" }}>
                      <List.Item.Meta
                        avatar={
                          <Avatar 
                            shape="square" 
                            size="small" 
                            style={{ backgroundColor: "#52c41a" }}
                          >
                            ✨
                          </Avatar>
                        }
                        title={
                          <Text ellipsis={{ tooltip: book.title }} style={{ fontSize: 13 }}>
                            {book.title}
                          </Text>
                        }
                        description={
                          <div>
                            <Text type="secondary" style={{ fontSize: 11 }}>
                              {formatAuthors(book.authors)}
                            </Text>
                            <br />
                            <Text type="secondary" style={{ fontSize: 10 }}>
                              {book.time}
                            </Text>
                          </div>
                        }
                      />
                    </List.Item>
                  )}
                />
              ) : (
                <Empty 
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description="No books added today"
                  style={{ marginTop: 60 }}
                />
              )}
            </div>
          </Card>
        </Col>

        {/* Active Users Today */}
        <Col xs={24} md={12} lg={6}>
          <Card
            title={
              <Space>
                <TeamOutlined style={{ color: "#722ed1" }} />
                <span>Active Users</span>
              </Space>
            }
            bordered={false}
            style={{ borderRadius: 12, height: 350 }}
            bodyStyle={{ padding: "16px 24px" }}
          >
            <div style={{ height: 280, overflowY: "auto" }}>
              {filteredActiveUsers.length > 0 ? (
                <List
                  size="small"
                  dataSource={filteredActiveUsers}
                  renderItem={user => (
                    <List.Item style={{ padding: "12px 0" }}>
                      <List.Item.Meta
                        avatar={
                          <Avatar 
                            style={{ backgroundColor: "#722ed1" }}
                            icon={<UserOutlined />}
                            size="small"
                          />
                        }
                        title={
                          <Text style={{ fontSize: 13 }}>
                            {user.username}
                          </Text>
                        }
                        description={
                          <Tag color="blue"> {/* Fixed: Removed size prop */}
                            {user.scan_count} scan{user.scan_count !== 1 ? 's' : ''}
                          </Tag>
                        }
                      />
                    </List.Item>
                  )}
                />
              ) : (
                <Empty 
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description="No active users today"
                  style={{ marginTop: 60 }}
                />
              )}
            </div>
          </Card>
        </Col>

        {/* Collections Created Today */}
        <Col xs={24} md={12} lg={6}>
          <Card
            title={
              <Space>
                <FolderOutlined style={{ color: "#fa8c16" }} /> {/* Fixed: Changed from CollectionOutlined */}
                <span>New Collections</span>
              </Space>
            }
            bordered={false}
            style={{ borderRadius: 12, height: 350 }}
            bodyStyle={{ padding: "16px 24px" }}
          >
            <div style={{ height: 280, overflowY: "auto" }}>
              {filteredCollections.length > 0 ? (
                <List
                  size="small"
                  dataSource={filteredCollections}
                  renderItem={collection => (
                    <List.Item style={{ padding: "12px 0" }}>
                      <List.Item.Meta
                        avatar={
                          <Avatar 
                            shape="square" 
                            size="small" 
                            style={{ backgroundColor: "#fa8c16" }}
                          >
                            📚
                          </Avatar>
                        }
                        title={
                          <Text ellipsis={{ tooltip: collection.name }} style={{ fontSize: 13 }}>
                            {collection.name}
                          </Text>
                        }
                        description={
                          <div>
                            <Text type="secondary" style={{ fontSize: 11 }}>
                              by {collection.username}
                            </Text>
                            <br />
                            <Text type="secondary" style={{ fontSize: 10 }}>
                              {collection.time}
                            </Text>
                          </div>
                        }
                      />
                    </List.Item>
                  )}
                />
              ) : (
                <Empty 
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description="No collections created today"
                  style={{ marginTop: 60 }}
                />
              )}
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;
