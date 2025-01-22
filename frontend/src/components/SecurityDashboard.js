import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { BarChart, LineChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Shield, AlertTriangle, Activity, RefreshCcw } from 'lucide-react';

const SecurityDashboard = () => {
  const [securityData, setSecurityData] = useState({
    anomalies: [],
    threats: [],
    threatLevel: 0
  });
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);

  // WebSocket connection for real-time updates
  useEffect(() => {
    const ws = new WebSocket('ws://localhost:8000/ws/security_feed');

    ws.onopen = () => {
      setIsConnected(true);
      console.log('Connected to security feed');
    };

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  setSecurityData(prevData => ({
    ...prevData,
    ...data // Merge incoming data with previous state
  }));

      setLastUpdate(new Date().toLocaleTimeString());
    };

    ws.onclose = () => {
      setIsConnected(false);
      console.log('Disconnected from security feed');
      // Attempt to reconnect after 5 seconds
      setTimeout(() => {
        console.log('Attempting to reconnect...');
      }, 5000);
    };

    return () => {
      ws.close();
    };
  }, []);

  // Function to manually refresh data
  const refreshData = useCallback(async () => {
    try {
      const response = await fetch('http://localhost:8000/api/security/summary');
      const data = await response.json();
      setSecurityData(prevData => ({
        ...prevData,
        threatLevel: data.threat_level
      }));
      setLastUpdate(new Date().toLocaleTimeString());
    } catch (error) {
      console.error('Error refreshing data:', error);
    }
  }, []);

  // Calculate threat level color
  const getThreatLevelColor = (level) => {
    if (level < 30) return 'text-green-500';
    if (level < 70) return 'text-yellow-500';
    return 'text-red-500';
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-4 space-y-6">
      {/* Header with Status */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Shield className="w-8 h-8 text-blue-500" />
          <h1 className="text-2xl font-bold">Security Operations Center</h1>
        </div>
        <div className="flex items-center space-x-4">
          <div className={`flex items-center space-x-2 px-4 py-2 rounded-lg ${isConnected ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
            <span>{isConnected ? 'Connected' : 'Disconnected'}</span>
          </div>
          <button 
            onClick={refreshData}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <RefreshCcw className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Last Update Timestamp */}
      <div className="text-sm text-gray-500">
        Last updated: {lastUpdate || 'Never'}
      </div>

      {/* Alert Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="hover:shadow-lg transition-shadow duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Threat Level
            </CardTitle>
            <AlertTriangle className={getThreatLevelColor(securityData.threatLevel)} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getThreatLevelColor(securityData.threatLevel)}`}>
              {securityData.threatLevel}%
            </div>
            <div className="mt-2 h-2 bg-gray-200 rounded-full">
              <div 
                className={`h-2 rounded-full transition-all duration-500 ${getThreatLevelColor(securityData.threatLevel)}`}
                style={{ width: `${securityData.threatLevel}%` }}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Active Threats
            </CardTitle>
            <Activity className="w-4 h-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {securityData.threats.reduce((acc, curr) => acc + curr.count, 0)}
            </div>
            <div className="text-xs text-muted-foreground">
              Real-time monitoring
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              System Status
            </CardTitle>
            <Shield className="w-4 h-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">Active</div>
            <div className="text-xs text-muted-foreground">
              All systems operational
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="hover:shadow-lg transition-shadow duration-300">
          <CardHeader>
            <CardTitle>Anomaly Detection Timeline</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={securityData.anomalies}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="count" 
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow duration-300">
          <CardHeader>
            <CardTitle>Threat Distribution</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={securityData.threats}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="category" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar 
                  dataKey="count" 
                  fill="#3b82f6"
                  animationDuration={1000}
                  animationBegin={0}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SecurityDashboard;
