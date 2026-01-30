import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    LineChart, Line, PieChart, Pie, Cell, ComposedChart, Area
} from 'recharts';
import {
    TrendingUp, Users, DollarSign, Calendar, Activity,
    Monitor, Globe, MapPin, Clock
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

const API_URL = process.env.REACT_APP_BACKEND_URL + '/api';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

const AnalyticsDashboard = () => {
    const { getToken } = useAuth();
    const [data, setData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [timeRange, setTimeRange] = useState(30);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    useEffect(() => {
        fetchDashboardData();
    }, [timeRange, startDate, endDate]);

    const fetchDashboardData = async () => {
        // Only fetch if using preset OR both dates are selected
        if (timeRange === 'custom' && (!startDate || !endDate)) return;

        setIsLoading(true);
        try {
            const params = { days: timeRange !== 'custom' ? timeRange : undefined };
            if (timeRange === 'custom' && startDate && endDate) {
                params.start_date = startDate;
                params.end_date = endDate;
            }

            const response = await axios.get(`${API_URL}/admin/dashboard-stats`, {
                headers: { Authorization: `Bearer ${getToken()}` },
                params
            });
            setData(response.data);
        } catch (error) {
            console.error('Error fetching analytics:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handlePresetClick = (days) => {
        setTimeRange(days);
        setStartDate('');
        setEndDate('');
    };

    const handleDateChange = (type, value) => {
        if (type === 'start') setStartDate(value);
        else setEndDate(value);
        setTimeRange('custom');
    };

    if (isLoading && !data) {
        // Show spinner only on initial load or if we want to block UI
        // Better to show spinner overlay or just loading state
    }

    // ... (Loading check moved inside render or separate component if needed, 
    // but the existing logic 'if (isLoading) return ...' is fine for full page load. 
    // For updates, maybe just opacity change? Keeping simple for now.)

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
            </div>
        );
    }

    if (!data) return null;

    const { kpi, demographics, revenue_trend, room_stats, recent_activity } = data;

    // Prepare data for charts
    const browserData = demographics?.browsers || [];
    const locationData = demographics?.locations || [];
    const osData = demographics?.os || [];

    // KPICard Component
    const KPICard = ({ title, value, subtext, icon: Icon, color }) => (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">
                    {title}
                </CardTitle>
                <Icon className={`h-4 w-4 text-${color}-500`} />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{value}</div>
                <p className="text-xs text-gray-500 mt-1">{subtext}</p>
            </CardContent>
        </Card>
    );

    return (
        <div className="space-y-8 p-6">
            <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-gray-900">Dashboard Analytics</h2>
                    <p className="text-gray-500">Overview of your hotel performance and visitor insights.</p>
                </div>
                <div className="flex flex-col sm:flex-row items-center gap-3 bg-white p-2 rounded-lg shadow-sm">
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-500">From:</span>
                        <input
                            type="date"
                            className="text-sm border rounded px-2 py-1 outline-none focus:ring-1 focus:ring-emerald-500"
                            value={startDate}
                            onChange={(e) => handleDateChange('start', e.target.value)}
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-500">To:</span>
                        <input
                            type="date"
                            className="text-sm border rounded px-2 py-1 outline-none focus:ring-1 focus:ring-emerald-500"
                            value={endDate}
                            onChange={(e) => handleDateChange('end', e.target.value)}
                        />
                    </div>
                    <div className="h-4 w-px bg-gray-300 mx-2 hidden sm:block"></div>
                    <div className="flex gap-2 w-full sm:w-auto">
                        <Button
                            variant={timeRange === 7 ? "default" : "outline"}
                            onClick={() => handlePresetClick(7)}
                            size="sm"
                            className="flex-1 sm:flex-none"
                        >
                            7 Days
                        </Button>
                        <Button
                            variant={timeRange === 30 ? "default" : "outline"}
                            onClick={() => handlePresetClick(30)}
                            size="sm"
                            className="flex-1 sm:flex-none"
                        >
                            30 Days
                        </Button>
                    </div>
                </div>
            </div>

            {/* KPI Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <KPICard
                    title="Total Revenue"
                    value={`Rp ${kpi.total_revenue.toLocaleString('id-ID')}`}
                    subtext="Last 30 days"
                    icon={DollarSign}
                    color="emerald"
                />
                <KPICard
                    title="Total Bookings"
                    value={kpi.total_bookings}
                    subtext={`${kpi.confirmed_bookings} confirmed`}
                    icon={Calendar}
                    color="blue"
                />
                <KPICard
                    title="Avg Daily Rate (ADR)"
                    value={`Rp ${Math.round(kpi.adr).toLocaleString('id-ID')}`}
                    subtext="Per confirmed booking"
                    icon={TrendingUp}
                    color="purple"
                />
                <KPICard
                    title="Visitors"
                    value={data.daily_traffic.reduce((acc, d) => acc + d.total_visits, 0)}
                    subtext="Page views tracked"
                    icon={Users}
                    color="orange"
                />
            </div>

            {/* Revenue Trend Chart */}
            <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-7">
                <Card className="col-span-4">
                    <CardHeader>
                        <CardTitle>Revenue & Bookings Trend</CardTitle>
                        <CardDescription>Daily performance over the last period</CardDescription>
                    </CardHeader>
                    <CardContent className="pl-2">
                        <ResponsiveContainer width="100%" height={350}>
                            <ComposedChart data={revenue_trend}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis
                                    dataKey="_id"
                                    tickFormatter={(val) => format(new Date(val), 'dd MMM')}
                                    tick={{ fontSize: 12 }}
                                />
                                <YAxis yAxisId="left" tickFormatter={(val) => `Rp${(val / 1000000).toFixed(1)}M`} />
                                <YAxis yAxisId="right" orientation="right" />
                                <Tooltip
                                    formatter={(value, name) => [
                                        name === 'daily_revenue' ? `Rp ${value.toLocaleString()}` : value,
                                        name === 'daily_revenue' ? 'Revenue' : 'Bookings'
                                    ]}
                                    labelFormatter={(label) => format(new Date(label), 'dd MMMM yyyy')}
                                />
                                <Legend />
                                <Bar yAxisId="right" dataKey="daily_bookings" name="Bookings" fill="#94a3b8" radius={[4, 4, 0, 0]} barSize={20} />
                                <Line yAxisId="left" type="monotone" dataKey="daily_revenue" name="Revenue" stroke="#059669" strokeWidth={2} dot={false} />
                            </ComposedChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Room Popularity */}
                <Card className="col-span-3">
                    <CardHeader>
                        <CardTitle>Room Popularity</CardTitle>
                        <CardDescription>Most booked room types</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={350}>
                            <BarChart data={room_stats} layout="vertical" margin={{ left: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                                <XAxis type="number" hide />
                                <YAxis dataKey="_id" type="category" width={100} tick={{ fontSize: 12 }} />
                                <Tooltip />
                                <Bar dataKey="count" fill="#3b82f6" radius={[0, 4, 4, 0]} background={{ fill: '#f1f5f9' }}>
                                    {room_stats.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>

            {/* Demographics Row */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {/* Traffic Sources - Modified from Browser Stats */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Globe className="w-4 h-4" /> Traffic Sources
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[250px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={data.demographics.sources || []}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {(data.demographics.sources || []).map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                    <Legend layout="vertical" align="right" verticalAlign="middle" />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                {/* Conversion Funnel */}
                <Card className="col-span-1 lg:col-span-1">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <TrendingUp className="w-4 h-4" /> Conversion Funnel
                        </CardTitle>
                        <CardDescription>User journey drop-off</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={250}>
                            <BarChart data={data.funnel || []} layout="vertical" margin={{ left: 0, right: 30 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                                <XAxis type="number" hide />
                                <YAxis dataKey="name" type="category" width={80} tick={{ fontSize: 11 }} />
                                <Tooltip cursor={{ fill: 'transparent' }} />
                                <Bar dataKey="value" fill="#10b981" radius={[0, 4, 4, 0]} barSize={30}>
                                    {/* Add label list if needed, or just relying on tooltip */}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Location Stats */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <MapPin className="w-4 h-4" /> User Locations
                        </CardTitle>
                        <CardDescription>Estimated metrics</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={250}>
                            <BarChart data={locationData} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                                <XAxis type="number" hide />
                                <YAxis dataKey="name" type="category" width={80} tick={{ fontSize: 11 }} />
                                <Tooltip />
                                <Bar dataKey="value" fill="#6366f1" radius={[0, 4, 4, 0]} barSize={20} />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>

            {/* Advanced Metrics Row */}
            <div className="grid gap-4 md:grid-cols-3">
                <KPICard
                    title="Avg Lead Time"
                    value={`${kpi.avg_lead_time || 0} Days`}
                    subtext="Booking in advance"
                    icon={Clock}
                    color="blue"
                />
                <KPICard
                    title="Look-to-Book"
                    value={`${(kpi.look_to_book || 0).toFixed(1)}%`}
                    subtext="View to Booking Conversion"
                    icon={Activity}
                    color="purple"
                />
                <KPICard
                    title="ARPU"
                    value={`Rp ${(Math.round(kpi.arpu || 0) / 1000).toFixed(0)}k`}
                    subtext="Rev per Visitor"
                    icon={DollarSign}
                    color="green"
                />
            </div>

            {/* Recent Activity */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Clock className="w-4 h-4" /> Recent System Activity
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {recent_activity.length > 0 ? (
                            recent_activity.map((log, i) => (
                                <div key={i} className="flex items-start gap-4 pb-4 border-b last:border-0 last:pb-0">
                                    <div className="bg-gray-100 p-2 rounded-full">
                                        <Activity className="w-4 h-4 text-gray-500" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-medium text-sm text-gray-900">
                                            {log.user_name} <span className="text-gray-500 font-normal">performed</span> {log.action}
                                        </p>
                                        <div className="flex justify-between items-center mt-1">
                                            <p className="text-xs text-gray-500 truncate max-w-[300px]">
                                                {log.resource} ({log.resource_id})
                                            </p>
                                            <span className="text-xs text-gray-400">
                                                {format(new Date(log.created_at), 'dd MMM HH:mm')}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="text-gray-500 text-sm text-center py-4">No recent activity</p>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default AnalyticsDashboard;
