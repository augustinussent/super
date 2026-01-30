import ReactGA from 'react-ga4';
import { clarity } from 'react-microsoft-clarity';

const GA_MEASUREMENT_ID = process.env.REACT_APP_GA_MEASUREMENT_ID;
const CLARITY_ID = process.env.REACT_APP_CLARITY_ID;

/**
 * Initialize Analytics (GA4 & Clarity)
 */
export const initAnalytics = () => {
    if (GA_MEASUREMENT_ID) {
        ReactGA.initialize(GA_MEASUREMENT_ID);
        console.log('GA4 Initialized');
    } else {
        console.warn('GA4 Measurement ID not found in environment variables');
    }

    if (CLARITY_ID) {
        clarity.init(CLARITY_ID);
        console.log('Clarity Initialized');
    } else {
        console.warn('Clarity ID not found in environment variables');
    }
};

const API_URL = process.env.REACT_APP_BACKEND_URL + '/api';

/**
 * Track Page View to Backend with Referrer and UTM
 * @param {string} pagePath 
 */
export const trackPageView = async (pagePath) => {
    try {
        const queryParams = new URLSearchParams(window.location.search);
        const utmSource = queryParams.get('utm_source');
        const utmMedium = queryParams.get('utm_medium');
        const utmCampaign = queryParams.get('utm_campaign');
        const referrer = document.referrer;

        let url = `${API_URL}/analytics/track?page=${encodeURIComponent(pagePath)}`;
        if (referrer) url += `&referrer=${encodeURIComponent(referrer)}`;
        if (utmSource) url += `&utm_source=${encodeURIComponent(utmSource)}`;
        if (utmMedium) url += `&utm_medium=${encodeURIComponent(utmMedium)}`;
        if (utmCampaign) url += `&utm_campaign=${encodeURIComponent(utmCampaign)}`;

        await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });
    } catch (error) {
        console.error('Failed to track page view:', error);
    }
};

/**
 * Track Custom Event in GA4 & Backend
 * @param {string} eventName - Internal event name (e.g., 'view_room_detail')
 * @param {string} category - Event category (e.g., 'Content', 'Ecommerce')
 * @param {string} label - Event label (optional, e.g., 'Room Name')
 * @param {object} metadata - Extra data
 */
export const trackEvent = async (eventName, category, label, metadata = {}) => {
    // GA4 Tracking (Use standard event structure)
    if (GA_MEASUREMENT_ID) {
        ReactGA.event({
            category: category || 'General',
            action: eventName,
            label: label,
        });
    }

    // Backend Tracking
    try {
        await fetch(`${API_URL}/analytics/event`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                event_name: eventName,
                category,
                label,
                metadata
            })
        });
    } catch (error) {
        // fail silently
    }
};

/**
 * Track Funnel Step
 * @param {string} step - 'view_room', 'click_book', 'guest_info', 'payment', 'success'
 * @param {object} details 
 */
export const trackFunnelStep = (step, details = {}) => {
    const eventMap = {
        'view_room': 'view_room_detail',
        'click_book': 'click_book_now',
        'guest_info': 'view_guest_info',
        'payment': 'view_payment',
        'success': 'booking_success'
    };

    const eventName = eventMap[step] || step;
    trackEvent(eventName, 'Funnel', details.room_name || null, details);
};

export const trackWhatsAppClick = (location) => {
    trackEvent('click_whatsapp', 'Contact', location);
};

export const trackPhoneClick = (location) => {
    trackEvent('click_phone', 'Contact', location);
};

export const trackBookNow = (roomName) => {
    trackFunnelStep('click_book', { room_name: roomName });
};

export const trackViewRoom = (roomName) => {
    trackFunnelStep('view_room', { room_name: roomName });
};
