import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { trackPageView } from '../utils/analytics';

const AnalyticsTracker = () => {
    const location = useLocation();

    useEffect(() => {
        // Track page view with standardized helper (handling UTMs and Referrer)
        trackPageView(location.pathname);
    }, [location]);

    return null;
};
export default AnalyticsTracker;
