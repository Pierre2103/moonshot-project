/**
 * Testing Suite Interface
 * 
 * Comprehensive testing dashboard for validating API functionality and system health.
 * Provides automated test execution across all major system components:
 * 
 * Test Categories:
 * - User Management: Create, list, delete users and scan tracking
 * - Collections: CRUD operations and book management
 * - Search: Multi-field book search functionality  
 * - Scanning: Barcode and image recognition workflows
 * - Books: Individual book detail retrieval
 * - Analytics: Statistics and reporting endpoints
 * - Workers: Background process management
 * - Error Handling: Edge cases and failure scenarios
 * 
 * Features:
 * - Individual test execution with real-time results
 * - Sector-based test grouping for organization
 * - Bulk test execution (all tests or by sector)
 * - Performance timing for each test
 * - Detailed error reporting and debugging
 * - Test result export capabilities
 * - Manual testing tools for development
 * - Visual progress tracking and success/failure indicators
 */

import React, { useState } from "react";
import { 
  Card, Button, List, Tag, Space, Typography, Row, Col, Modal, 
  Divider, Input, Image, message as antdMessage, Progress
} from "antd";
import {
  PlayCircleOutlined, 
  CheckCircleOutlined, 
  CloseCircleOutlined, 
  InfoCircleOutlined,
  LoadingOutlined,
  FileTextOutlined
} from "@ant-design/icons";
import axios from "axios";
import { testCases, TestCase } from "../testing/testCases";
import { API_BASE_URL } from "../config/api";

const { Title, Text } = Typography;

// Type definitions for test execution results
type TestResult = {
  success: boolean;        // Whether the test passed
  details: string;         // Human-readable result description
  data?: any;             // Optional additional result data
  running?: boolean;       // Whether the test is currently executing
  timeMs?: number;         // Execution time in milliseconds
};

type Sector = string;

/**
 * Group test cases by their sector for organized display.
 * 
 * @param cases - Array of test cases to group
 * @returns Object mapping sector names to arrays of test cases
 */
const groupBySector = (cases: TestCase[]): Record<Sector, TestCase[]> => {
  const sectors: Record<Sector, TestCase[]> = {};
  for (const t of cases) {
    if (!sectors[t.sector]) sectors[t.sector] = [];
    sectors[t.sector].push(t);
  }
  return sectors;
};

/**
 * Get appropriate status icon based on test result.
 * 
 * @param result - Test result object
 * @returns React icon component with appropriate color
 */
const getStatusIcon = (result?: TestResult) => {
  if (!result) return <InfoCircleOutlined style={{ color: "#bdbdbd" }} />;
  if (result.running) return <LoadingOutlined style={{ color: "#1890ff" }} />;
  if (result.success) return <CheckCircleOutlined style={{ color: "#52c41a" }} />;
  return <CloseCircleOutlined style={{ color: "#ff4d4f" }} />;
};

// Color scheme for visual consistency
const COLORS = ["#52c41a", "#ff4d4f", "#bdbdbd"];

const Testing: React.FC = () => {
  // State management for test execution and results
  const [results, setResults] = useState<Record<string, TestResult>>({});
  const [running, setRunning] = useState<string[]>([]);
  
  // Manual testing tool states
  const [barcodeUrl, setBarcodeUrl] = useState<string>("");
  const [barcodeLabel, setBarcodeLabel] = useState<string>("");
  const [coverUrl, setCoverUrl] = useState<string>("");
  const [coverLabel, setCoverLabel] = useState<string>("");
  const [manualIsbn, setManualIsbn] = useState<string>("");
  
  // Modal state for test detail view
  const [modalOpen, setModalOpen] = useState(false);
  const [modalTest, setModalTest] = useState<TestCase | null>(null);

  const sectors = groupBySector(testCases);

  /**
   * Execute a single test and measure execution time.
   * Updates the UI with real-time progress and results.
   * 
   * @param test - Test case to execute
   */
  const runTest = async (test: TestCase) => {
    setRunning(r => [...r, test.id]);
    setResults(r => ({ ...r, [test.id]: { running: true, success: false, details: "Running..." } }));
    
    const start = performance.now();
    try {
      const res = await test.run();
      const timeMs = performance.now() - start;
      setResults(r => ({ ...r, [test.id]: { ...res, running: false, timeMs } }));
    } catch (e: any) {
      const timeMs = performance.now() - start;
      setResults(r => ({ ...r, [test.id]: { success: false, details: e.message, running: false, timeMs } }));
    }
    setRunning(r => r.filter(id => id !== test.id));
  };

  /**
   * Execute all test cases sequentially.
   * Provides comprehensive system validation.
   */
  const runAll = async () => {
    for (const test of testCases) {
      await runTest(test);
    }
  };

  /**
   * Execute all tests within a specific sector.
   * 
   * @param sector - Sector name to run tests for
   */
  const runSector = async (sector: string) => {
    for (const test of sectors[sector]) {
      await runTest(test);
    }
  };

  // Calculate test execution statistics
  const total = testCases.length;
  const passed = Object.values(results).filter(r => r.success).length;
  const failed = Object.values(results).filter(r => !r.success && !r.running && r.details).length;
  const completed = passed + failed;
  const totalTime = Object.values(results).reduce((sum, r) => sum + (r.timeMs || 0), 0);

  // Manual testing tool functions for development workflow
  const handleExistingIsbn = async () => {
    if (!API_BASE_URL) {
      antdMessage.error("API configuration missing");
      return;
    }
    setBarcodeUrl("");
    setBarcodeLabel("");
    try {
      const res = await axios.get(`${API_BASE_URL}/admin/api/testing/random_isbn13`);
      setBarcodeUrl(res.data.url);
      setBarcodeLabel(res.data.isbn);
    } catch {
      antdMessage.error("Error fetching existing ISBN.");
    }
  };

  const handleUnknownIsbn = async () => {
    if (!API_BASE_URL) {
      antdMessage.error("API configuration missing");
      return;
    }
    setBarcodeUrl("");
    setBarcodeLabel("");
    try {
      const res = await axios.get(`${API_BASE_URL}/admin/api/testing/random_isbn13_unknown`);
      setBarcodeUrl(res.data.url);
      setBarcodeLabel(res.data.isbn);
    } catch {
      antdMessage.error("Error generating unknown ISBN.");
    }
  };

  const handleRandomCover = async () => {
    if (!API_BASE_URL) {
      antdMessage.error("API configuration missing");
      return;
    }
    setCoverUrl("");
    setCoverLabel("");
    try {
      const res = await axios.get(`${API_BASE_URL}/admin/api/testing/random_cover`);
      setCoverUrl(res.data.url);
      setCoverLabel(res.data.isbn);
    } catch {
      antdMessage.error("Error fetching cover image.");
    }
  };

  const handleManualBarcode = async () => {
    if (!API_BASE_URL) {
      antdMessage.error("API configuration missing");
      return;
    }
    setBarcodeUrl("");
    setBarcodeLabel("");
    if (!manualIsbn) {
      antdMessage.warning("Please enter an ISBN13.");
      return;
    }
    try {
      const url = `${API_BASE_URL}/admin/api/testing/barcode/${manualIsbn}`;
      setBarcodeUrl(url);
      setBarcodeLabel(manualIsbn);
    } catch {
      antdMessage.error("Error generating barcode.");
    }
  };

  // Modal management for test detail view
  const openModal = (test: TestCase) => {
    setModalTest(test);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setModalTest(null);
  };

  /**
   * Get card styling based on test result status.
   */
  const getCardStyle = (result?: TestResult) => {
    if (!result) return { background: "#fff" };
    if (result.running) return { background: "#e6f7ff" };
    if (result.success) return { background: "#f6ffed" };
    return { background: "#fff1f0" };
  };

  /**
   * Copy test summary to clipboard for reporting.
   */
  const handleCopySummary = async () => {
    const summary = Object.entries(results)
      .map(([id, result]) => {
        const status = result.success ? "PASS" : `FAIL${result.details ? ` [${result.details}]` : ""}`;
        const time = result.timeMs ? ` (${Math.round(result.timeMs)}ms)` : "";
        return `${id} : ${status}${time}`;
      })
      .join("\n");
    try {
      await navigator.clipboard.writeText(summary);
      antdMessage.success("Summary copied to clipboard!");
    } catch {
      antdMessage.error("Failed to copy summary.");
    }
  };

  /**
   * Copy only failed test details for debugging.
   */
  const handleCopyFailed = async () => {
    const failed = Object.entries(results)
      .filter(([_, result]) => !result.success && !result.running && result.details)
      .map(([id, result]) => {
        const time = result.timeMs ? ` (${Math.round(result.timeMs)}ms)` : "";
        return `${id} : FAIL${result.details ? ` [${result.details}]` : ""}${time}`;
      })
      .join("\n");
    try {
      await navigator.clipboard.writeText(failed || "No failed tests.");
      antdMessage.success("Failed tests copied to clipboard!");
    } catch {
      antdMessage.error("Failed to copy failed tests.");
    }
  };

  // Summary cards for quick overview and test execution
  const summaryCards = (
    <Row gutter={[24, 24]} style={{ marginBottom: 0 }}>
      <Col xs={24} sm={12} md={6}>
        <Card
          hoverable
          style={{
            borderRadius: 16,
            background: "linear-gradient(135deg, #6366f1 0%, #4f8cff 100%)",
            color: "white",
            minHeight: 120,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center"
          }}
          bodyStyle={{ padding: 24 }}
        >
          <Space direction="vertical" style={{ width: "100%" }}>
            <span style={{ color: "rgba(255,255,255,0.8)", fontSize: 14 }}>Execute All Tests</span>
            <Button
              type="primary"
              icon={<PlayCircleOutlined />}
              onClick={runAll}
              disabled={running.length > 0}
              size="large"
              style={{ borderRadius: 8, width: "100%" }}
            >
              Run All Tests
            </Button>
          </Space>
        </Card>
      </Col>
      <Col xs={24} sm={12} md={6}>
        <Card
          hoverable
          style={{
            borderRadius: 16,
            background: "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)",
            color: "white",
            minHeight: 120,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center"
          }}
          bodyStyle={{ padding: 24 }}
        >
          <div>
            <span style={{ color: "rgba(255,255,255,0.8)", fontSize: 14 }}>Tests Passed</span>
            <div style={{ fontSize: 28, fontWeight: 700 }}>{passed}</div>
          </div>
        </Card>
      </Col>
      <Col xs={24} sm={12} md={6}>
        <Card
          hoverable
          style={{
            borderRadius: 16,
            background: "linear-gradient(135deg, #ff4d4f 0%, #f5576c 100%)",
            color: "white",
            minHeight: 120,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center"
          }}
          bodyStyle={{ padding: 24 }}
        >
          <div>
            <span style={{ color: "rgba(255,255,255,0.8)", fontSize: 14 }}>Tests Failed</span>
            <div style={{ fontSize: 28, fontWeight: 700 }}>{failed}</div>
          </div>
        </Card>
      </Col>
      <Col xs={24} sm={12} md={6}>
        <Card
          hoverable
          style={{
            borderRadius: 16,
            background: "linear-gradient(135deg, #a78bfa 0%, #c084fc 100%)",
            color: "white",
            minHeight: 120,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center"
          }}
          bodyStyle={{ padding: 24 }}
        >
          <div>
            <span style={{ color: "rgba(255,255,255,0.8)", fontSize: 14 }}>Completion</span>
            <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>{completed}/{total}</div>
            <Progress 
              percent={total > 0 ? Math.round((completed / total) * 100) : 0} 
              strokeColor="rgba(255,255,255,0.8)"
              trailColor="rgba(255,255,255,0.3)"
              showInfo={false}
              size="small"
            />
          </div>
        </Card>
      </Col>
    </Row>
  );

  // Suite summary header with performance metrics
  const suiteSummaryHeader = (
    <div style={{ margin: "24px 0 8px 0", display: "flex", alignItems: "center", gap: 24 }}>
      <Title level={4} style={{ margin: 0, color: "#6366f1" }}>Test Suite Summary</Title>
      <span style={{ color: "#888", fontSize: 15 }}>
        {completed}/{total} completed &nbsp;|&nbsp; Total time: {Math.round(totalTime)} ms
      </span>
    </div>
  );

  return (
    <div style={{ padding: 24, background: "#f8fafc", minHeight: "100vh" }}>
      <Title level={2} style={{ marginBottom: 8, color: "#1890ff" }}>
        🧪 Testing Suite
      </Title>
      <Text type="secondary" style={{ fontSize: 16, marginBottom: 24, display: 'block' }}>
        Comprehensive API and integration testing suite. Run individual tests, entire sectors, or the complete test suite to validate system functionality.
      </Text>
      
      <Divider />
      {suiteSummaryHeader}
      {summaryCards}
      
      {/* Test Sectors Grid */}
      <Row gutter={[24, 24]} style={{ marginTop: 32 }}>
        {Object.entries(sectors).map(([sector, tests]) => (
          <Col xs={24} md={12} lg={6} key={sector}>
            <Card
              title={<span style={{ fontWeight: 600, color: "#6366f1" }}>{sector}</span>}
              style={{
                borderRadius: 16,
                boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
                minHeight: 420,
                display: "flex",
                flexDirection: "column",
                overflow: "hidden"
              }}
              bodyStyle={{
                padding: 0,
                display: "flex",
                flexDirection: "column",
                height: "100%",
                maxHeight: 420,
                overflowY: "auto"
              }}
              extra={
                <Button
                  icon={<PlayCircleOutlined />}
                  onClick={e => { e.stopPropagation(); runSector(sector); }}
                  disabled={running.length > 0}
                  size="small"
                  style={{ borderRadius: 6 }}
                >
                  Run Sector
                </Button>
              }
            >
              <List
                size="small"
                dataSource={tests}
                renderItem={test => {
                  const result = results[test.id];
                  return (
                    <List.Item
                      key={test.id}
                      style={{
                        cursor: "pointer",
                        background: result?.success
                          ? "#f6ffed"
                          : result?.running
                          ? "#e6f7ff"
                          : result
                          ? "#fff1f0"
                          : "white",
                        transition: "background 0.2s",
                        padding: "12px 20px",
                        borderBottom: "1px solid #f0f0f0"
                      }}
                      onClick={() => openModal(test)}
                    >
                      <Space style={{ width: "100%", justifyContent: "space-between" }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 500, marginBottom: 4, fontSize: 13 }}>
                            {test.name}
                          </div>
                          <Text type="secondary" style={{ fontSize: 11 }}>
                            {test.id}
                          </Text>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          {result?.timeMs && (
                            <Tag color="default" style={{ fontSize: 10, margin: 0 }}>
                              {Math.round(result.timeMs)}ms
                            </Tag>
                          )}
                          {getStatusIcon(result)}
                        </div>
                      </Space>
                    </List.Item>
                  );
                }}
              />
            </Card>
          </Col>
        ))}
      </Row>

      {/* Test Detail Modal */}
      <Modal
        open={modalOpen}
        onCancel={closeModal}
        title={modalTest ? modalTest.name : ""}
        footer={null}
        width={700}
        bodyStyle={{ padding: 24 }}
        destroyOnClose
      >
        {modalTest && (
          <>
            <Space style={{ marginBottom: 16 }} wrap>
              <Tag color="blue">{modalTest.id}</Tag>
              <Tag color="purple">{modalTest.sector}</Tag>
              {results[modalTest.id]?.timeMs !== undefined && (
                <Tag color="green">{Math.round(results[modalTest.id]?.timeMs!)} ms</Tag>
              )}
            </Space>
            
            <div style={{ marginBottom: 16 }}>
              <Text style={{ fontSize: 14, lineHeight: 1.6 }}>{modalTest.description}</Text>
            </div>
            
            <Divider />
            
            <div>
              <Button
                icon={<PlayCircleOutlined />}
                onClick={() => runTest(modalTest)}
                loading={!!results[modalTest.id]?.running}
                disabled={!!results[modalTest.id]?.running}
                style={{ borderRadius: 6, marginBottom: 16 }}
                type="primary"
              >
                Run This Test
              </Button>
              
              {results[modalTest.id] && (
                <div style={{ 
                  padding: 16, 
                  borderRadius: 8, 
                  background: results[modalTest.id].success ? "#f6ffed" : "#fff1f0",
                  border: `1px solid ${results[modalTest.id].success ? "#b7eb8f" : "#ffccc7"}`,
                  marginBottom: 16
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    {getStatusIcon(results[modalTest.id])}
                    <Text strong style={{ 
                      color: results[modalTest.id].success ? "#52c41a" : "#ff4d4f" 
                    }}>
                      {results[modalTest.id].success ? "PASSED" : "FAILED"}
                    </Text>
                    {results[modalTest.id].timeMs && (
                      <Tag color="default">{Math.round(results[modalTest.id].timeMs!)}ms</Tag>
                    )}
                  </div>
                  <Text style={{ fontSize: 13 }}>{results[modalTest.id].details}</Text>
                </div>
              )}
              
              {results[modalTest.id]?.data && (
                <div style={{ marginTop: 16 }}>
                  <Text strong>Response Data:</Text>
                  <pre style={{ 
                    background: "#f5f5f5", 
                    padding: 12, 
                    borderRadius: 6, 
                    fontSize: 11,
                    overflow: "auto",
                    maxHeight: 200,
                    marginTop: 8
                  }}>
                    {JSON.stringify(results[modalTest.id].data, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </>
        )}
      </Modal>

      {/* Manual Testing Tools */}
      <div style={{ marginTop: 48 }}>
        <Title level={3} style={{ color: "#6366f1", marginBottom: 24 }}>
          🛠️ Manual Testing Tools
        </Title>
        <Text type="secondary" style={{ fontSize: 14, marginBottom: 24, display: 'block' }}>
          Generate test data and verify API endpoints manually during development.
        </Text>

        <Space direction="vertical" style={{ width: "100%" }} size="large">
          {/* ISBN Testing Tools */}
          <Card title="ISBN Testing" style={{ borderRadius: 12 }}>
            <Space wrap style={{ marginBottom: 16 }}>
              <Button type="primary" onClick={handleExistingIsbn}>
                Get Existing ISBN
              </Button>
              <Button onClick={handleUnknownIsbn}>
                Generate Unknown ISBN
              </Button>
              <Button onClick={handleRandomCover}>
                Get Random Cover
              </Button>
            </Space>
            
            <Space style={{ marginBottom: 16 }}>
              <Input
                placeholder="Enter ISBN13 for manual barcode"
                value={manualIsbn}
                onChange={e => setManualIsbn(e.target.value)}
                style={{ width: 250 }}
                maxLength={13}
              />
              <Button onClick={handleManualBarcode}>
                Generate Barcode
              </Button>
            </Space>

            {/* Generated Test Data Display */}
            <div>
              {barcodeUrl && (
                <Card 
                  title={`Generated Barcode - ISBN13: ${barcodeLabel}`} 
                  style={{ marginBottom: 16 }}
                  size="small"
                >
                  <Image src={barcodeUrl} alt="Generated barcode" height={100} preview={false} />
                </Card>
              )}
              {coverUrl && (
                <Card 
                  title={`Random Cover - ISBN10: ${coverLabel}`}
                  size="small"
                >
                  <Image src={coverUrl} alt="Random book cover" height={300} style={{ borderRadius: 8 }} />
                </Card>
              )}
            </div>
          </Card>
        </Space>
      </div>

      {/* Export and Utility Actions */}
      <div style={{ marginTop: 32, textAlign: "right" }}>
        <Space size="large">
          <Button
            icon={<FileTextOutlined />}
            onClick={handleCopySummary}
            size="large"
            style={{ borderRadius: 8 }}
          >
            Copy Full Summary
          </Button>
          <Button
            icon={<CloseCircleOutlined />}
            onClick={handleCopyFailed}
            size="large"
            style={{ borderRadius: 8 }}
            danger
          >
            Copy Failed Tests Only
          </Button>
        </Space>
      </div>
    </div>
  );
};

export default Testing;
