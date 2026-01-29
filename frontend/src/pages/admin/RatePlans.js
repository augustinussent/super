import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Tag, Percent, DollarSign, List } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Switch } from '../../components/ui/switch';

// Fallback to localhost in development if env var points to production or is missing
const API_URL = (process.env.NODE_ENV === 'development' && (!process.env.REACT_APP_BACKEND_URL || process.env.REACT_APP_BACKEND_URL.includes('onrender')))
    ? 'http://localhost:8000/api'
    : (process.env.REACT_APP_BACKEND_URL || 'http://localhost:8000') + '/api';

const RatePlans = () => {
    const [ratePlans, setRatePlans] = useState([]);
    const [rooms, setRooms] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingPlan, setEditingPlan] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        room_type_id: 'all',
        price_modifier_type: 'percent',
        price_modifier_val: '',
        is_active: true,
        conditions: ''
    });

    useEffect(() => {
        fetchRatePlans();
        fetchRooms();
    }, []);

    const fetchRatePlans = async () => {
        try {
            const response = await axios.get(`${API_URL}/admin/rate-plans`);
            setRatePlans(response.data);
        } catch (error) {
            toast.error('Error fetching rate plans');
        } finally {
            setIsLoading(false);
        }
    };

    const fetchRooms = async () => {
        try {
            const response = await axios.get(`${API_URL}/rooms`);
            setRooms(response.data);
        } catch (error) {
            console.error('Error fetching rooms:', error);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.name || !formData.price_modifier_val) {
            toast.error('Please fill in all required fields');
            return;
        }

        try {
            const payload = {
                ...formData,
                room_type_id: formData.room_type_id === 'all' ? null : formData.room_type_id,
                price_modifier_val: Number(formData.price_modifier_val),
                conditions: formData.conditions ? formData.conditions.split(',').map(c => c.trim()).filter(c => c) : []
            };

            if (editingPlan) {
                await axios.put(`${API_URL}/admin/rate-plans/${editingPlan.rate_plan_id}`, payload);
                toast.success('Rate plan updated');
            } else {
                await axios.post(`${API_URL}/admin/rate-plans`, payload);
                toast.success('Rate plan created');
            }

            setShowModal(false);
            setEditingPlan(null);
            resetForm();
            fetchRatePlans();
        } catch (error) {
            toast.error(error.response?.data?.detail || 'Operation failed');
        }
    };

    const resetForm = () => {
        setFormData({
            name: '',
            description: '',
            room_type_id: 'all',
            price_modifier_type: 'percent',
            price_modifier_val: '',
            is_active: true,
            conditions: ''
        });
    };

    const handleEdit = (plan) => {
        setEditingPlan(plan);
        setFormData({
            name: plan.name,
            description: plan.description,
            room_type_id: plan.room_type_id || 'all',
            price_modifier_type: plan.price_modifier_type,
            price_modifier_val: plan.price_modifier_val.toString(),
            is_active: plan.is_active,
            conditions: plan.conditions ? plan.conditions.join(', ') : ''
        });
        setShowModal(true);
    };

    const handleDelete = async (planId) => {
        if (!window.confirm('Are you sure you want to delete this rate plan?')) return;

        try {
            await axios.delete(`${API_URL}/admin/rate-plans/${planId}`);
            toast.success('Rate plan deleted');
            fetchRatePlans();
        } catch (error) {
            toast.error('Failed to delete rate plan');
        }
    };

    const toggleActive = async (plan) => {
        try {
            await axios.put(`${API_URL}/admin/rate-plans/${plan.rate_plan_id}`, {
                ...plan, // send all fields or just updates? PUT usually requires full object or PATCH for partial. 
                // My backend route does $set so partial is fine if I send partial.
                // But the backend route implementation of PUT: `plan_update: dict`. 
                // It does `plan_update.pop("rate_plan_id", None)` then update_one $set.
                // It seems safe to send just is_active.
                is_active: !plan.is_active
            });
            toast.success('Status updated');
            fetchRatePlans();
        } catch (error) {
            toast.error('Failed to update status');
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600" />
            </div>
        );
    }

    return (
        <div data-testid="rate-plans-page">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="font-display text-3xl font-bold text-gray-900">Rate Plans</h1>
                    <p className="text-gray-500">Manage rate plans (e.g. Breakfast Included, Room Only)</p>
                </div>
                <Button
                    onClick={() => {
                        setEditingPlan(null);
                        resetForm();
                        setShowModal(true);
                    }}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white"
                    data-testid="add-plan-btn"
                >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Rate Plan
                </Button>
            </div>

            <div className="bg-white rounded-xl shadow-soft overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Modifier</TableHead>
                            <TableHead>Applies To</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {ratePlans.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                                    No rate plans found
                                </TableCell>
                            </TableRow>
                        ) : (
                            ratePlans.map((plan) => (
                                <TableRow key={plan.rate_plan_id} data-testid={`plan-row-${plan.rate_plan_id}`}>
                                    <TableCell>
                                        <div className="font-medium text-gray-900">{plan.name}</div>
                                        <div className="text-sm text-gray-500">{plan.description}</div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-1 font-mono">
                                            {plan.price_modifier_type === 'percent' ? (
                                                <span className={plan.price_modifier_val >= 0 ? "text-emerald-600" : "text-emerald-600"}>
                                                    {plan.price_modifier_val > 0 ? '+' : ''}{plan.price_modifier_val}%
                                                </span>
                                            ) : (
                                                <span className={plan.price_modifier_val >= 0 ? "text-emerald-600" : "text-emerald-600"}>
                                                    {plan.price_modifier_val > 0 ? '+' : ''}Rp {plan.price_modifier_val.toLocaleString('id-ID')}
                                                    {plan.price_modifier_type === 'absolute_add' ? '/night' : '/total'}
                                                </span>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        {plan.room_type_id ? (
                                            <span className="inline-flex items-center px-2 py-1 rounded bg-gray-100 text-gray-700 text-xs">
                                                Specific Room
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center px-2 py-1 rounded bg-blue-50 text-blue-700 text-xs">
                                                All Rooms
                                            </span>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <Switch
                                            checked={plan.is_active}
                                            onCheckedChange={() => toggleActive(plan)}
                                            data-testid={`toggle-plan-${plan.rate_plan_id}`}
                                        />
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleEdit(plan)}
                                                data-testid={`edit-plan-${plan.rate_plan_id}`}
                                            >
                                                <Edit2 className="w-4 h-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleDelete(plan.rate_plan_id)}
                                                className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                                data-testid={`delete-plan-${plan.rate_plan_id}`}
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Add/Edit Modal */}
            <Dialog open={showModal} onOpenChange={setShowModal}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{editingPlan ? 'Edit Rate Plan' : 'Add New Rate Plan'}</DialogTitle>
                    </DialogHeader>

                    <form onSubmit={handleSubmit} className="space-y-4 py-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="md:col-span-2">
                                <Label htmlFor="name">Plan Name *</Label>
                                <Input
                                    id="name"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="e.g., Breakfast Included"
                                    data-testid="plan-name-input"
                                />
                            </div>

                            <div className="md:col-span-2">
                                <Label htmlFor="description">Description</Label>
                                <Textarea
                                    id="description"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="What does this plan include?"
                                    rows={2}
                                    data-testid="plan-description-input"
                                />
                            </div>

                            <div>
                                <Label>Modifier Type</Label>
                                <Select
                                    value={formData.price_modifier_type}
                                    onValueChange={(v) => setFormData({ ...formData, price_modifier_type: v })}
                                >
                                    <SelectTrigger data-testid="modifier-type-select">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="percent">Percentage (%)</SelectItem>
                                        <SelectItem value="absolute_add">Add Amount (Per Night)</SelectItem>
                                        <SelectItem value="absolute_total">Add Amount (Total)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div>
                                <Label htmlFor="price_modifier_val">Modifier Value *</Label>
                                <Input
                                    id="price_modifier_val"
                                    type="number"
                                    value={formData.price_modifier_val}
                                    onChange={(e) => setFormData({ ...formData, price_modifier_val: e.target.value })}
                                    placeholder="e.g., 20 or 150000"
                                    data-testid="modifier-value-input"
                                />
                                <p className="text-xs text-gray-500 mt-1">Use negative values for discounts.</p>
                            </div>

                            <div className="md:col-span-2">
                                <Label>Applies To</Label>
                                <Select
                                    value={formData.room_type_id}
                                    onValueChange={(v) => setFormData({ ...formData, room_type_id: v })}
                                >
                                    <SelectTrigger data-testid="room-select">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Rooms</SelectItem>
                                        {rooms.map(room => (
                                            <SelectItem key={room.room_type_id} value={room.room_type_id}>{room.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="md:col-span-2">
                                <Label htmlFor="conditions">Conditions (comma separated tags)</Label>
                                <Input
                                    id="conditions"
                                    value={formData.conditions}
                                    onChange={(e) => setFormData({ ...formData, conditions: e.target.value })}
                                    placeholder="e.g., non-refundable, breakfast"
                                />
                            </div>

                            <div className="flex items-center space-x-2 pt-2">
                                <Switch
                                    id="is_active"
                                    checked={formData.is_active}
                                    onCheckedChange={(v) => setFormData({ ...formData, is_active: v })}
                                    data-testid="is-active-switch"
                                />
                                <Label htmlFor="is_active">Active</Label>
                            </div>
                        </div>

                        <div className="pt-4 sticky bottom-0 bg-white">
                            <Button
                                type="submit"
                                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                                data-testid="save-plan-btn"
                            >
                                {editingPlan ? 'Save Changes' : 'Create Rate Plan'}
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default RatePlans;
