import axios from 'axios';

// Create a highly configurable Axios instance
const api = axios.create({
    // NEXT.JS CLIENT REQUIRES "NEXT_PUBLIC_" PREFIX TO READ ENV VARS!
    baseURL: process.env.NEXT_PUBLIC_BACKEND_URL || 'https://secureshare-fsuk.onrender.com/api',
    timeout: 240000, // 240-second timeout avoids hanging requests
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    },
});

// Request Interceptor: Perfect place to automatically inject Auth tokens
api.interceptors.request.use(
    (config) => {
        if (typeof window !== 'undefined') {
            let token = null;
            const match = document.cookie.match(new RegExp('(^| )securestore-dev-token=([^;]+)'));
            if (match) token = match[2];
            else token = localStorage.getItem('securestore-dev-token');

            if (token) config.headers.Authorization = `Bearer ${token}`;
        }

        // Remove Content-Type if sending FormData so Axios can set the boundary automatically
        if (config.data instanceof FormData) {
            delete config.headers['Content-Type'];
        }

        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response Interceptor: Clean data unpacking and global error handling
api.interceptors.response.use(
    (response) => {
        // Return full response instead of response.data since the rest of the app expects res.data
        return response;
    },
    (error) => {
        // Normalise error tracking
        const customError = {
            message: error.response?.data?.message || error.message || 'An unexpected error occurred',
            status: error.response?.status || null,
            data: error.response?.data || null,
        };

        // Centralised handling hooks
        if (customError.status === 401) {
            // Clear tokens and redirect to login if necessary
        }

        // Always return a rejected promise to let local try/catch blocks handle specific UI states
        return Promise.reject(customError);
    }
);

export default api;
