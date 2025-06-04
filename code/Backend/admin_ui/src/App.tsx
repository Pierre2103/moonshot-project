import React from "react";
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import Analytics from "./pages/Analytics";
import Tools from "./pages/Tools";
import Testing from "./pages/Testing";
// import Precision from "./pages/Precision";
import { Layout, Menu } from "antd";

const { Header, Content } = Layout;

const App: React.FC = () => (
  <BrowserRouter>
    <Layout style={{ minHeight: "100vh" }}>
      <Header style={{ background: "#fff", padding: 0 }}>
        <Menu mode="horizontal" defaultSelectedKeys={["dashboard"]}>
          <Menu.Item key="dashboard">
            <Link to="/">Dashboard</Link>
          </Menu.Item>
          <Menu.Item key="analytics">
            <Link to="/analytics">Analytics</Link>
          </Menu.Item>
          {/* <Menu.Item key="tools">
            <Link to="/tools">Outils</Link>
          </Menu.Item> */}
          <Menu.Item key="testing">
            <Link to="/testing">Testing</Link>
          </Menu.Item>
          {/* <Menu.Item key="precision">
            <Link to="/precision">Precision</Link>
          </Menu.Item> */}
        </Menu>
      </Header>
      <Content style={{ margin: "24px 16px 0" }}>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/tools" element={<Tools />} />
          <Route path="/testing" element={<Testing />} />
          {/* <Route path="/precision" element={<Precision />} /> */}
          {/* Add more routes as needed */}
        </Routes>
      </Content>
    </Layout>
  </BrowserRouter>
);

export default App;
