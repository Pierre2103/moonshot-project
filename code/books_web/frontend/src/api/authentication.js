import axios from 'axios';

const BASE_URL = 'http://localhost:5001/auth';

export const signup = async (data) => {
    try {
        const response = await axios.post(`${BASE_URL}/signup`, data);
        return response.data;
    } catch (error) {
        throw error.response.data;
    }
};

export const login = async (data) => {
    try {
        const response = await axios.post(`${BASE_URL}/login`, data);
        localStorage.setItem('token', response.data.token);  // Stockez le token ici
        return response.data;
    } catch (error) {
        throw error.response.data;
    }
};

export const getMe = async () => {
    try {
        const response = await axios.get(`${BASE_URL}/me`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        return response.data;
    } catch (error) {
        throw error.response.data;
    }
};
