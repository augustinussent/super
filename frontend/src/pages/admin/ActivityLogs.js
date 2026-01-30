import { useState, useEffect } from 'react';
import axios from 'axios';
import { format } from 'date-fns';
import { Search, Filter, Clock, User, Shield, Activity, ChevronLeft, ChevronRight } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Badge } from '../../components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog';

const API_URL = process.env.REACT_APP_BACKEND_URL + '/api';

const ActivityLogs = () => {
    const [logs, setLogs] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [selectedLog, setSelectedLog] = useState(null);
    const [filters, setFilters] = useState({
        resource: 'all',
        action: 'all',
        search: '' // not used yet in backend but prepared
    });

    const getToken = () => localStorage.getItem('token');

    const fetchLogs = async () => {
        setIsLoading(true);
        try {
            const params = {
                page: page,
                limit: 20
            };

            if (filters.resource !== 'all') params.resource = filters.resource;
            if (filters.action !== 'all') params.action = filters.action;

            const response = await axios.get(`${API_URL}/admin/logs`, {
                headers: { Authorization: `Bearer ${getToken()}` },
                params
            });

            setLogs(response.data.logs);
            setTotalPages(response.data.pages);
        } catch (error) {
            console.error('Error fetching logs:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs();
    }, [page, filters]);

    const getActionColor = (action) => {
        switch (action.toLowerCase()) {
            case 'create': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
            case 'update': return 'bg-blue-100 text-blue-800 border-blue-200';
            case 'delete': return 'bg-red-100 text-red-800 border-red-200';
            case 'login': return 'bg-gray-100 text-gray-800 border-gray-200';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const formatDetails = (details) => {
        if (!details) return null;

        const formatValue = (key, value) => {
            if (value === null || value === undefined) return 'N/A';

            // Boolean
            if (typeof value === 'boolean') return value ? 'Yes' : 'No';

            // Currency fields
            if (['price', 'rate', 'amount', 'total', 'discount_value'].some(k => key.includes(k)) && typeof value === 'number') {
                return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(value);
            }

            // Date processing (simple check)
            if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value)) {
                try {
                    return format(new Date(value), 'dd MMM yyyy HH:mm');
                } catch (e) { return value; }
            }

            return String(value);
        };

        const renderValue = (key, value) => {
            if (typeof value === 'object' && value !== null) {
                // Handle "old" and "new" comparison specifically
                if ('old' in value && 'new' in value) {
                    return (
                        <div className="bg-gray-50 p-2 rounded text-sm">
                            <div className="flex items-center gap-2 text-red-600 line-through text-xs mb-1 opacity-70">
                                <span className="w-8 font-semibold">Old:</span>
                                {formatValue(key, value.old)}
                            </div>
                            <div className="flex items-center gap-2 text-emerald-600 font-medium">
                                <span className="w-8 font-semibold">New:</span>
                                {formatValue(key, value.new)}
                            </div>
                        </div>
                    );
                }
                // Recursive for other objects
                return (
                    <div className="pl-4 border-l-2 border-gray-100">
                        {Object.entries(value).map(([k, v]) => (
                            <div key={k} className="mb-1">
                                <span className="text-gray-500 text-xs mr-2">{k}:</span>
                                {renderValue(k, v)}
                            </div>
                        ))}
                    </div>
                );
            }
            return formatValue(key, value);
        };

        return (
            <div className="space-y-3 text-sm">
                {Object.entries(details).map(([key, value]) => (
                    <div key={key} className="grid grid-cols-1 gap-1 border-b pb-2 last:border-0 last:pb-0">
                        <span className="font-medium text-gray-700 capitalize">{key.replace(/_/g, ' ')}</span>
                        <div className="text-gray-900 break-words">
                            {renderValue(key, value)}
                        </div>
                    </div>
                ))}
            </div>
        );
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Activity Logs</h1>
                    <p className="text-gray-500">Monitor all system activities and changes</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={fetchLogs}>
                        <Clock className="w-4 h-4 mr-2" />
                        Refresh
                    </Button>
                </div>
            </div>

            <Card className="shadow-sm">
                <CardHeader className="pb-4">
                    <div className="flex gap-4">
                        <div className="w-48">
                            <Select
                                value={filters.resource}
                                onValueChange={(v) => setFilters(prev => ({ ...prev, resource: v }))}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="All Resources" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Resources</SelectItem>
                                    <SelectItem value="rooms">Rooms</SelectItem>
                                    <SelectItem value="users">Users</SelectItem>
                                    <SelectItem value="reservations">Reservations</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="w-48">
                            <Select
                                value={filters.action}
                                onValueChange={(v) => setFilters(prev => ({ ...prev, action: v }))}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="All Actions" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Actions</SelectItem>
                                    <SelectItem value="create">Create</SelectItem>
                                    <SelectItem value="update">Update</SelectItem>
                                    <SelectItem value="delete">Delete</SelectItem>
                                    <SelectItem value="login">Login</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex justify-center py-12">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600" />
                        </div>
                    ) : (
                        <div className="relative overflow-x-auto">
                            <table className="w-full text-sm text-left text-gray-500">
                                <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3">Time</th>
                                        <th className="px-6 py-3">User</th>
                                        <th className="px-6 py-3">Action</th>
                                        <th className="px-6 py-3">Resource</th>
                                        <th className="px-6 py-3">Details</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {logs.length === 0 ? (
                                        <tr>
                                            <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                                                No logs found matching your filters
                                            </td>
                                        </tr>
                                    ) : (
                                        logs.map((log) => (
                                            <tr
                                                key={log.log_id}
                                                className="bg-white border-b hover:bg-gray-50 cursor-pointer transition-colors"
                                                onClick={() => setSelectedLog(log)}
                                            >
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    {format(new Date(log.created_at), 'dd MMM yyyy HH:mm')}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 text-xs font-bold">
                                                            {log.user_name.charAt(0)}
                                                        </div>
                                                        <div>
                                                            <div className="font-medium text-gray-900">{log.user_name}</div>
                                                            <div className="text-xs text-gray-500 capitalize">{log.user_role}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-2 py-1 rounded-full text-xs border ${getActionColor(log.action)} capitalize font-medium`}>
                                                        {log.action}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 capitalize">
                                                    {log.resource}
                                                </td>
                                                <td className="px-6 py-4 max-w-xs truncate text-gray-400">
                                                    Click to view details
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* Pagination */}
                    <div className="flex items-center justify-between pt-4 mt-4 border-t">
                        <div className="text-sm text-gray-500">
                            Page {page} of {totalPages}
                        </div>
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1}
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                disabled={page === totalPages}
                            >
                                <ChevronRight className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Log Detail Modal */}
            <Dialog open={!!selectedLog} onOpenChange={(open) => !open && setSelectedLog(null)}>
                <DialogContent className="max-w-xl">
                    <DialogHeader>
                        <DialogTitle>Activity Details</DialogTitle>
                    </DialogHeader>

                    {selectedLog && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <label className="text-xs text-gray-500">Timestamp</label>
                                    <div className="font-medium">{format(new Date(selectedLog.created_at), 'dd MMM yyyy HH:mm:ss')}</div>
                                </div>
                                <div>
                                    <label className="text-xs text-gray-500">User</label>
                                    <div className="font-medium">{selectedLog.user_name} ({selectedLog.user_role})</div>
                                </div>
                                <div>
                                    <label className="text-xs text-gray-500">Action</label>
                                    <div className="capitalize">{selectedLog.action} on {selectedLog.resource}</div>
                                </div>
                                <div>
                                    <label className="text-xs text-gray-500">IP Address</label>
                                    <div>{selectedLog.ip_address || 'N/A'}</div>
                                </div>
                            </div>

                            <div className="border rounded-lg p-4 bg-white">
                                <h4 className="font-medium mb-2 text-sm text-gray-900 border-b pb-2">Changes / Payload</h4>
                                {formatDetails(selectedLog.details)}
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default ActivityLogs;
