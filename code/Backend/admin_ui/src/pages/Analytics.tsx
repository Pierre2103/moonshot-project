/**
 * Advanced Analytics Dashboard
 * 
 * Comprehensive data visualization and insights interface for the book scanning system.
 * Provides deep analytics across multiple dimensions including content analysis,
 * user behavior, temporal patterns, and system performance metrics.
 * 
 * Key Features:
 * - Publication timeline visualization with interactive charts
 * - Author and publisher analytics with ranking systems
 * - Language and genre distribution analysis
 * - Content metrics (page counts, metadata coverage)
 * - Interactive word clouds for content exploration
 * - Publication heatmaps for temporal analysis
 * - Metadata quality assessment tools
 * - Export capabilities for reports
 * - Real-time data refresh mechanisms
 * 
 * Data Sources:
 * - Book metadata from database aggregations
 * - Publication date analysis
 * - Author and publisher statistics
 * - Genre and language distributions
 * - Content quality metrics
 * 
 * Visualization Libraries:
 * - Recharts for charts and graphs
 * - React WordCloud for genre visualization
 * - Custom heatmap components
 * - Ant Design charts integration
 */

import React, { useState, useEffect } from "react";
import {
  Card, Row, Col, Typography, Spin, message, Button, Space, Select,
  Statistic, Progress, Tag, Divider, Empty, Tooltip
} from "antd";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
  ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend,
  Area, AreaChart
} from "recharts";
import {
  BookOutlined, UserOutlined, GlobalOutlined, FileTextOutlined,
  BarChartOutlined, PieChartOutlined, CalendarOutlined, ReloadOutlined,
  DownloadOutlined, SettingOutlined
} from "@ant-design/icons";
import WordCloud from "react-wordcloud";
import axios from "axios";
import { API_BASE_URL } from "../config/api";

const { Title, Text } = Typography;
const { Option } = Select;

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Overview analytics containing high-level metrics
 */
interface OverviewAnalytics {
  total_books: number;         // Total books in database
  total_authors: number;       // Unique author count
  total_publishers: number;    // Unique publisher count
  total_languages: number;     // Language variety count
  oldest_book: string;         // Earliest publication date
  newest_book: string;         // Latest publication date
  total_pages: number;         // Cumulative page count
}

/**
 * Timeline data for publication history visualization
 */
interface TimelineData {
  year: string;               // Publication year
  count: number;              // Number of books published
}

/**
 * Author ranking data with book counts
 */
interface AuthorData {
  author: string;             // Author name
  book_count: number;         // Number of books by author
}

/**
 * Language distribution statistics
 */
interface LanguageData {
  language: string;           // Language code
  count: number;              // Number of books in language
}

/**
 * Publisher ranking with book counts
 */
interface PublisherData {
  publisher: string;          // Publisher name
  count: number;              // Number of books published
}

/**
 * Page count statistics and distribution
 */
interface PageAnalytics {
  stats: {
    min_pages: number;        // Shortest book
    max_pages: number;        // Longest book
    avg_pages: number;        // Average page count
    books_with_pages: number; // Books with page data
  };
  distribution: Array<{
    range: string;            // Page range (e.g., "100-199")
    count: number;            // Books in range
  }>;
}

/**
 * Metadata coverage assessment
 */
interface MetadataCoverage {
  total_books: number;
  coverage_counts: Record<string, number>;     // Field completion counts
  coverage_percentages: Record<string, number>; // Field completion rates
}

/**
 * Genre data for word cloud visualization
 */
interface GenreData {
  text: string;               // Genre name
  value: number;              // Frequency count
}

/**
 * Heatmap data for publication calendar
 */
interface HeatmapData {
  year: number;               // Publication year
  month: number;              // Month (0-indexed)
  count: number;              // Number of publications
}

// ============================================================================
// CONSTANTS
// ============================================================================

/** Color schemes for consistent visualization */
const CHART_COLORS = [
  "#8884d8", "#82ca9d", "#ffc658", "#ff7c7c", "#8dd1e1",
  "#d084d0", "#ffb347", "#87ceeb", "#dda0dd", "#98fb98"
];

const PIE_COLORS = [
  "#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8",
  "#82CA9D", "#FFC658", "#FF7C7C", "#8DD1E1", "#D084D0"
];

/** Auto-refresh interval in milliseconds (5 minutes) */
const REFRESH_INTERVAL = 300000;

/** Default limits for data display */
const DEFAULT_AUTHOR_LIMIT = 20;
const DEFAULT_PUBLISHER_LIMIT = 15;

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Format large numbers with appropriate suffixes.
 * 
 * @param num - Number to format
 * @returns Formatted string with K/M/B suffixes
 */
const formatNumber = (num: number): string => {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toString();
};

/**
 * Calculate percentage with fallback for division by zero.
 * 
 * @param value - Numerator value
 * @param total - Denominator value
 * @returns Percentage rounded to 1 decimal place
 */
const calculatePercentage = (value: number, total: number): number => {
  return total > 0 ? Math.round((value / total) * 100 * 10) / 10 : 0;
};

/**
 * Format language codes to human-readable names.
 * 
 * @param languageCode - ISO language code
 * @returns Human-readable language name
 */
const formatLanguageName = (languageCode: string): string => {
  const languageMap: Record<string, string> = {
    'en': 'English',
    'fr': 'French',
    'es': 'Spanish',
    'de': 'German',
    'it': 'Italian',
    'pt': 'Portuguese',
    'ru': 'Russian',
    'ja': 'Japanese',
    'zh': 'Chinese',
    'ko': 'Korean',
    'ar': 'Arabic',
    'hi': 'Hindi'
  };
  return languageMap[languageCode] || languageCode.toUpperCase();
};

/**
 * Export analytics data to CSV format.
 * 
 * @param data - Array of objects to export
 * @param filename - Name for the downloaded file
 */
const exportToCSV = (data: any[], filename: string): void => {
  if (!data.length) return;
  
  const headers = Object.keys(data[0]).join(',');
  const rows = data.map(row => 
    Object.values(row).map(value => 
      typeof value === 'string' ? `"${value}"` : value
    ).join(',')
  );
  
  const csvContent = [headers, ...rows].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const Analytics: React.FC = () => {
  // ----------------------------------------------------------------------------
  // STATE MANAGEMENT
  // ----------------------------------------------------------------------------
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Analytics data state
  const [overview, setOverview] = useState<OverviewAnalytics | null>(null);
  const [timeline, setTimeline] = useState<TimelineData[]>([]);
  const [authors, setAuthors] = useState<AuthorData[]>([]);
  const [languages, setLanguages] = useState<LanguageData[]>([]);
  const [publishers, setPublishers] = useState<PublisherData[]>([]);
  const [pageAnalytics, setPageAnalytics] = useState<PageAnalytics | null>(null);
  const [metadataCoverage, setMetadataCoverage] = useState<MetadataCoverage | null>(null);
  const [genres, setGenres] = useState<GenreData[]>([]);
  const [heatmapData, setHeatmapData] = useState<HeatmapData[]>([]);
  
  // UI state
  const [authorLimit, setAuthorLimit] = useState(DEFAULT_AUTHOR_LIMIT);
  const [publisherLimit, setPublisherLimit] = useState(DEFAULT_PUBLISHER_LIMIT);
  const [selectedView, setSelectedView] = useState<'overview' | 'content' | 'temporal'>('overview');

  // ----------------------------------------------------------------------------
  // DATA FETCHING
  // ----------------------------------------------------------------------------

  /**
   * Fetch all analytics data from multiple API endpoints.
   * Executes concurrent requests for better performance.
   * 
   * @param isRefresh - Whether this is a manual refresh
   */
  const fetchAnalyticsData = async (isRefresh = false): Promise<void> => {
    if (!API_BASE_URL) {
      message.error("API configuration missing");
      return;
    }

    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      // Execute all analytics API calls concurrently
      const [
        overviewRes,
        timelineRes,
        authorsRes,
        languagesRes,
        publishersRes,
        pagesRes,
        metadataRes,
        genresRes,
        heatmapRes
      ] = await Promise.all([
        axios.get(`${API_BASE_URL}/admin/api/analytics/overview`),
        axios.get(`${API_BASE_URL}/admin/api/analytics/timeline`),
        axios.get(`${API_BASE_URL}/admin/api/analytics/authors?limit=${authorLimit}`),
        axios.get(`${API_BASE_URL}/admin/api/analytics/languages`),
        axios.get(`${API_BASE_URL}/admin/api/analytics/publishers?limit=${publisherLimit}`),
        axios.get(`${API_BASE_URL}/admin/api/analytics/pages`),
        axios.get(`${API_BASE_URL}/admin/api/analytics/metadata-coverage`),
        axios.get(`${API_BASE_URL}/admin/api/analytics/genres`),
        axios.get(`${API_BASE_URL}/admin/api/analytics/publication-heatmap`)
      ]);

      // Update all state with fetched data
      setOverview(overviewRes.data);
      setTimeline(timelineRes.data);
      setAuthors(authorsRes.data);
      setLanguages(languagesRes.data);
      setPublishers(publishersRes.data);
      setPageAnalytics(pagesRes.data);
      setMetadataCoverage(metadataRes.data);
      setGenres(genresRes.data);
      setHeatmapData(heatmapRes.data);

      if (isRefresh) {
        message.success("Analytics data refreshed successfully");
      }
    } catch (error) {
      console.error("Error fetching analytics data:", error);
      message.error("Failed to load analytics data");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  /**
   * Manual refresh handler for user-initiated updates.
   */
  const handleRefresh = (): void => {
    fetchAnalyticsData(true);
  };

  /**
   * Trigger analytics calculation on the backend.
   */
  const handleCalculateAnalytics = async (): Promise<void> => {
    try {
      await axios.post(`${API_BASE_URL}/admin/api/analytics/calculate`);
      message.success("Analytics calculation triggered");
      // Refresh data after calculation
      setTimeout(() => fetchAnalyticsData(true), 2000);
    } catch (error) {
      message.error("Failed to trigger analytics calculation");
    }
  };

  // ----------------------------------------------------------------------------
  // LIFECYCLE HOOKS
  // ----------------------------------------------------------------------------

  /**
   * Component mount and auto-refresh setup
   */
  useEffect(() => {
    fetchAnalyticsData();
    
    // Set up auto-refresh every 5 minutes
    const interval = setInterval(() => fetchAnalyticsData(true), REFRESH_INTERVAL);
    
    return () => clearInterval(interval);
  }, []);

  /**
   * Refetch data when limits change
   */
  useEffect(() => {
    if (!loading) {
      fetchAnalyticsData();
    }
  }, [authorLimit, publisherLimit]);

  // ----------------------------------------------------------------------------
  // RENDER HELPERS
  // ----------------------------------------------------------------------------

  /**
   * Loading state component
   */
  if (loading) {
    return (
      <div style={{ 
        display: "flex", 
        justifyContent: "center", 
        alignItems: "center", 
        height: "60vh" 
      }}>
        <Spin size="large" tip="Loading analytics data..." />
      </div>
    );
  }

  // ----------------------------------------------------------------------------
  // MAIN RENDER
  // ----------------------------------------------------------------------------

  return (
    <div style={{ padding: 24, background: "#f0f2f5", minHeight: "100vh" }}>
      {/* Analytics Header */}
      <div style={{ marginBottom: 24 }}>
        <Space align="center" style={{ width: "100%", justifyContent: "space-between" }}>
          <div>
            <Title level={2} style={{ margin: 0, color: "#1890ff" }}>
              📈 Advanced Analytics
            </Title>
            <Text type="secondary" style={{ fontSize: 16 }}>
              Comprehensive insights and data visualization for the book collection
            </Text>
          </div>
          <Space size="large">
            <Select
              value={selectedView}
              onChange={setSelectedView}
              style={{ width: 160 }}
            >
              <Option value="overview">Overview</Option>
              <Option value="content">Content Analysis</Option>
              <Option value="temporal">Temporal Patterns</Option>
            </Select>
            <Button
              icon={<SettingOutlined />}
              onClick={handleCalculateAnalytics}
              size="large"
            >
              Calculate
            </Button>
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
        </Space>
      </div>

      {/* Overview Statistics Cards */}
      <Row gutter={[24, 24]} style={{ marginBottom: 32 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card
            bordered={false}
            style={{
              borderRadius: 12,
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              color: "white"
            }}
            bodyStyle={{ padding: 20 }}
          >
            <Statistic
              title={<span style={{ color: "rgba(255,255,255,0.8)" }}>Total Books</span>}
              value={overview?.total_books || 0}
              prefix={<BookOutlined style={{ color: "white" }} />}
              valueStyle={{ color: "white", fontSize: 24, fontWeight: 700 }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card
            bordered={false}
            style={{
              borderRadius: 12,
              background: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
              color: "white"
            }}
            bodyStyle={{ padding: 20 }}
          >
            <Statistic
              title={<span style={{ color: "rgba(255,255,255,0.8)" }}>Unique Authors</span>}
              value={overview?.total_authors || 0}
              prefix={<UserOutlined style={{ color: "white" }} />}
              valueStyle={{ color: "white", fontSize: 24, fontWeight: 700 }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card
            bordered={false}
            style={{
              borderRadius: 12,
              background: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
              color: "white"
            }}
            bodyStyle={{ padding: 20 }}
          >
            <Statistic
              title={<span style={{ color: "rgba(255,255,255,0.8)" }}>Languages</span>}
              value={overview?.total_languages || 0}
              prefix={<GlobalOutlined style={{ color: "white" }} />}
              valueStyle={{ color: "white", fontSize: 24, fontWeight: 700 }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card
            bordered={false}
            style={{
              borderRadius: 12,
              background: "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)",
              color: "white"
            }}
            bodyStyle={{ padding: 20 }}
          >
            <Statistic
              title={<span style={{ color: "rgba(255,255,255,0.8)" }}>Total Pages</span>}
              value={formatNumber(overview?.total_pages || 0)}
              prefix={<FileTextOutlined style={{ color: "white" }} />}
              valueStyle={{ color: "white", fontSize: 24, fontWeight: 700 }}
            />
          </Card>
        </Col>
      </Row>

      {/* Conditional View Rendering */}
      {selectedView === 'overview' && (
        <>
          {/* Publication Timeline and Language Distribution */}
          <Row gutter={[24, 24]} style={{ marginBottom: 32 }}>
            <Col xs={24} lg={16}>
              <Card
                title={
                  <Space>
                    <BarChartOutlined style={{ color: "#1890ff" }} />
                    <span>Publication Timeline</span>
                  </Space>
                }
                bordered={false}
                style={{ borderRadius: 12, height: 400 }}
                extra={
                  <Button
                    icon={<DownloadOutlined />}
                    onClick={() => exportToCSV(timeline, 'publication_timeline')}
                    size="small"
                  >
                    Export
                  </Button>
                }
              >
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={timeline}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis 
                      dataKey="year" 
                      stroke="#666"
                      tick={{ fontSize: 12 }}
                    />
                    <YAxis stroke="#666" tick={{ fontSize: 12 }} />
                    <RechartsTooltip 
                      formatter={(value: any) => [value, "Books Published"]}
                      labelFormatter={(year: any) => `Year: ${year}`}
                      contentStyle={{ 
                        borderRadius: 8, 
                        border: "none", 
                        boxShadow: "0 4px 12px rgba(0,0,0,0.1)" 
                      }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="count" 
                      stroke="#8884d8" 
                      fill="#8884d8"
                      fillOpacity={0.3}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </Card>
            </Col>
            <Col xs={24} lg={8}>
              <Card
                title={
                  <Space>
                    <PieChartOutlined style={{ color: "#52c41a" }} />
                    <span>Language Distribution</span>
                  </Space>
                }
                bordered={false}
                style={{ borderRadius: 12, height: 400 }}
              >
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={languages.slice(0, 8)}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                      label={({ language, percent }) => 
                        `${formatLanguageName(language)} ${(percent * 100).toFixed(0)}%`
                      }
                    >
                      {languages.slice(0, 8).map((_, index) => (
                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip 
                      formatter={(value: any) => [value, "Books"]}
                      labelFormatter={(language: any) => formatLanguageName(language)}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </Card>
            </Col>
          </Row>

          {/* Top Authors and Publishers */}
          <Row gutter={[24, 24]} style={{ marginBottom: 32 }}>
            <Col xs={24} lg={12}>
              <Card
                title={
                  <Space>
                    <UserOutlined style={{ color: "#722ed1" }} />
                    <span>Top Authors</span>
                  </Space>
                }
                bordered={false}
                style={{ borderRadius: 12, height: 400 }}
                extra={
                  <Space>
                    <Select
                      value={authorLimit}
                      onChange={setAuthorLimit}
                      size="small"
                      style={{ width: 80 }}
                    >
                      <Option value={10}>Top 10</Option>
                      <Option value={20}>Top 20</Option>
                      <Option value={50}>Top 50</Option>
                    </Select>
                    <Button
                      icon={<DownloadOutlined />}
                      onClick={() => exportToCSV(authors, 'top_authors')}
                      size="small"
                    >
                      Export
                    </Button>
                  </Space>
                }
              >
                <div style={{ height: 320, overflowY: "auto" }}>
                  {authors.length > 0 ? (
                    authors.map((author, index) => (
                      <div
                        key={author.author}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          padding: "8px 0",
                          borderBottom: index < authors.length - 1 ? "1px solid #f0f0f0" : "none"
                        }}
                      >
                        <div>
                          <Text strong style={{ fontSize: 13 }}>
                            {index + 1}. {author.author}
                          </Text>
                        </div>
                        <Tag color="blue">{author.book_count} books</Tag>
                      </div>
                    ))
                  ) : (
                    <Empty description="No author data available" />
                  )}
                </div>
              </Card>
            </Col>
            <Col xs={24} lg={12}>
              <Card
                title={
                  <Space>
                    <BookOutlined style={{ color: "#fa8c16" }} />
                    <span>Top Publishers</span>
                  </Space>
                }
                bordered={false}
                style={{ borderRadius: 12, height: 400 }}
                extra={
                  <Space>
                    <Select
                      value={publisherLimit}
                      onChange={setPublisherLimit}
                      size="small"
                      style={{ width: 80 }}
                    >
                      <Option value={10}>Top 10</Option>
                      <Option value={15}>Top 15</Option>
                      <Option value={25}>Top 25</Option>
                    </Select>
                    <Button
                      icon={<DownloadOutlined />}
                      onClick={() => exportToCSV(publishers, 'top_publishers')}
                      size="small"
                    >
                      Export
                    </Button>
                  </Space>
                }
              >
                <div style={{ height: 320, overflowY: "auto" }}>
                  {publishers.length > 0 ? (
                    publishers.map((publisher, index) => (
                      <div
                        key={publisher.publisher}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          padding: "8px 0",
                          borderBottom: index < publishers.length - 1 ? "1px solid #f0f0f0" : "none"
                        }}
                      >
                        <div>
                          <Text strong style={{ fontSize: 13 }}>
                            {index + 1}. {publisher.publisher}
                          </Text>
                        </div>
                        <Tag color="orange">{publisher.count} books</Tag>
                      </div>
                    ))
                  ) : (
                    <Empty description="No publisher data available" />
                  )}
                </div>
              </Card>
            </Col>
          </Row>
        </>
      )}

      {selectedView === 'content' && (
        <>
          {/* Page Analytics and Metadata Coverage */}
          <Row gutter={[24, 24]} style={{ marginBottom: 32 }}>
            <Col xs={24} lg={12}>
              <Card
                title={
                  <Space>
                    <FileTextOutlined style={{ color: "#1890ff" }} />
                    <span>Page Distribution</span>
                  </Space>
                }
                bordered={false}
                style={{ borderRadius: 12, height: 400 }}
              >
                {pageAnalytics && (
                  <>
                    <div style={{ marginBottom: 16 }}>
                      <Space size="large">
                        <Statistic
                          title="Average Pages"
                          value={pageAnalytics.stats.avg_pages}
                          precision={0}
                          style={{ textAlign: "center" }}
                        />
                        <Statistic
                          title="Shortest"
                          value={pageAnalytics.stats.min_pages}
                          style={{ textAlign: "center" }}
                        />
                        <Statistic
                          title="Longest"
                          value={pageAnalytics.stats.max_pages}
                          style={{ textAlign: "center" }}
                        />
                      </Space>
                    </div>
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart data={pageAnalytics.distribution}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="range" />
                        <YAxis />
                        <RechartsTooltip />
                        <Bar dataKey="count" fill="#8884d8" />
                      </BarChart>
                    </ResponsiveContainer>
                  </>
                )}
              </Card>
            </Col>
            <Col xs={24} lg={12}>
              <Card
                title={
                  <Space>
                    <BarChartOutlined style={{ color: "#52c41a" }} />
                    <span>Metadata Coverage</span>
                  </Space>
                }
                bordered={false}
                style={{ borderRadius: 12, height: 400 }}
              >
                {metadataCoverage && (
                  <div style={{ height: 320, overflowY: "auto" }}>
                    {Object.entries(metadataCoverage.coverage_percentages).map(([field, percentage]) => (
                      <div key={field} style={{ marginBottom: 16 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                          <Text strong>{field.replace(/_/g, ' ').toUpperCase()}</Text>
                          <Text>{percentage}%</Text>
                        </div>
                        <Progress
                          percent={percentage}
                          status={percentage > 80 ? "success" : percentage > 50 ? "normal" : "exception"}
                          strokeColor={percentage > 80 ? "#52c41a" : percentage > 50 ? "#1890ff" : "#ff4d4f"}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </Col>
          </Row>

          {/* Genre Word Cloud */}
          <Row gutter={[24, 24]}>
            <Col xs={24}>
              <Card
                title={
                  <Space>
                    <PieChartOutlined style={{ color: "#722ed1" }} />
                    <span>Genre Word Cloud</span>
                  </Space>
                }
                bordered={false}
                style={{ borderRadius: 12, height: 400 }}
              >
                {genres.length > 0 ? (
                  <div style={{ height: 320 }}>
                    <WordCloud
                      words={genres}
                      options={{
                        rotations: 2,
                        rotationAngles: [0, 90],
                        fontSizes: [12, 60],
                        padding: 2,
                        deterministic: true,
                        fontFamily: "Arial, sans-serif",
                        scale: "sqrt"
                      }}
                    />
                  </div>
                ) : (
                  <Empty description="No genre data available" style={{ marginTop: 100 }} />
                )}
              </Card>
            </Col>
          </Row>
        </>
      )}

      {selectedView === 'temporal' && (
        <>
          {/* Publication Heatmap and Timeline Trends */}
          <Row gutter={[24, 24]}>
            <Col xs={24}>
              <Card
                title={
                  <Space>
                    <CalendarOutlined style={{ color: "#fa8c16" }} />
                    <span>Publication Calendar Heatmap</span>
                  </Space>
                }
                bordered={false}
                style={{ borderRadius: 12, height: 600 }}
              >
                {heatmapData.length > 0 ? (
                  <div style={{ height: 520, padding: 20 }}>
                    <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
                      Publications by year and month (darker colors indicate more publications)
                    </Text>
                    {/* Custom heatmap visualization would go here */}
                    <div style={{ 
                      display: "grid", 
                      gridTemplateColumns: "repeat(12, 1fr)", 
                      gap: 2,
                      height: 400
                    }}>
                      {/* Heatmap implementation placeholder */}
                      <Text type="secondary" style={{ gridColumn: "1 / -1", textAlign: "center", marginTop: 180 }}>
                        Interactive heatmap visualization coming soon
                      </Text>
                    </div>
                  </div>
                ) : (
                  <Empty description="No temporal data available" style={{ marginTop: 200 }} />
                )}
              </Card>
            </Col>
          </Row>
        </>
      )}

      {/* Export Actions */}
      <div style={{ marginTop: 32, textAlign: "center" }}>
        <Space size="large">
          <Button
            type="primary"
            icon={<DownloadOutlined />}
            onClick={() => {
              // Export all analytics data
              const allData = {
                overview,
                timeline,
                authors: authors.slice(0, 50),
                publishers: publishers.slice(0, 30),
                languages,
                pageAnalytics,
                metadataCoverage
              };
              const blob = new Blob([JSON.stringify(allData, null, 2)], { type: 'application/json' });
              const url = URL.createObjectURL(blob);
              const link = document.createElement('a');
              link.href = url;
              link.download = 'analytics_complete_export.json';
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
              URL.revokeObjectURL(url);
            }}
            size="large"
            style={{ borderRadius: 8 }}
          >
            Export Complete Analytics
          </Button>
        </Space>
      </div>
    </div>
  );
};

export default Analytics;
