import { useEffect, useRef } from 'react';
import { trackEvent } from '../../utils/analytics';
import { useLocation } from 'react-router-dom';

const ScrollTracker = () => {
    const location = useLocation();
    const trackedDepths = useRef(new Set());

    useEffect(() => {
        // Reset tracked depths on route change
        trackedDepths.current = new Set();

        const handleScroll = () => {
            const scrollTop = window.scrollY;
            const winHeight = window.innerHeight;
            const docHeight = document.documentElement.scrollHeight;
            const scrollPercent = (scrollTop + winHeight) / docHeight;

            if (scrollPercent > 0.75 && !trackedDepths.current.has(75)) {
                trackedDepths.current.add(75);
                trackEvent('Engagement', 'scroll_75_percent', location.pathname);
            }
        };

        // Throttle scroll event
        let timeoutId;
        const throttledScroll = () => {
            if (timeoutId) return;
            timeoutId = setTimeout(() => {
                handleScroll();
                timeoutId = null;
            }, 500);
        };

        window.addEventListener('scroll', throttledScroll);
        return () => {
            window.removeEventListener('scroll', throttledScroll);
            if (timeoutId) clearTimeout(timeoutId);
        };
    }, [location.pathname]);

    return null;
};

export default ScrollTracker;
