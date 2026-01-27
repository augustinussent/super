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
 * Track Page View to Backend
 * @param {string} pagePath 
 */
export const trackPageView = async (pagePath) => {
    try {
        await fetch(`${API_URL}/analytics/track?page=${encodeURIComponent(pagePath)}`, {
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
 * @param {string} category - Event category (e.g., 'Contact', 'Engagement')
 * @param {string} action - Event action (e.g., 'Click WhatsApp', 'Scroll 75%')
 * @param {string} label - Event label (optional, e.g., 'Footer', 'Room Detail')
 */
export const trackEvent = (category, action, label) => {
    // GA4 Tracking
    if (GA_MEASUREMENT_ID) {
        ReactGA.event({
            category,
            action,
            label,
        });
    }

    // Backend Tracking (Optional: could extend /analytics/track to accept events)
    // For now, we mainly track page views for the dashboard chart
};

/**
 * Helper for WhatsApp Click
 * @param {string} location - Where the click happened (e.g., 'Footer', 'Room Card')
 */
export const trackWhatsAppClick = (location) => {
    trackEvent('Contact', 'click_whatsapp', location);
};

/**
 * Helper for Phone Click
 * @param {string} location - Where the click happened
 */
export const trackPhoneClick = (location) => {
    trackEvent('Contact', 'click_phone', location);
};

/**
 * Helper for Book Now Click
 * @param {string} roomName - Name of the room being booked (or 'General')
 */
export const trackBookNow = (roomName) => {
    trackEvent('Conversion', 'click_book_now', roomName);
};

/**
 * Helper for Room Detail View
 * @param {string} roomName 
 */
export const trackViewRoom = (roomName) => {
    trackEvent('Content', 'view_room_detail', roomName);
};
