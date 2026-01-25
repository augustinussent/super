import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL + '/api';

const AnalyticsTracker = () => {
    const location = useLocation();

    useEffect(() => {
        // track page view
        const track = async () => {
            try {
                await axios.post(`${API_URL}/analytics/track`, null, {
                    params: { page: location.pathname }
                });
            } catch (error) {
                // fail silently
            }
        };

        track();
    }, [location]);

    return null;
};

export default AnalyticsTracker;
