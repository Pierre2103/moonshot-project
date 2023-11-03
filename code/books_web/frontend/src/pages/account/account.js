// frontend/src/pages/account/Account.js

import React, { useState, useEffect } from 'react';
import { getMe } from '../../api/authentication';
import './account.scss';

const Account = () => {
    const [userDetails, setUserDetails] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const data = await getMe();
                setUserDetails(data);
            } catch (err) {
                setError(err.message || 'Une erreur est survenue lors de la récupération des détails de l’utilisateur');
            }
        };

        fetchUserData();
    }, []);

    return (
        <div className="account-container">
            <h2>Détails du compte</h2>
            {error && <p className="error-message">{error}</p>}
            {userDetails && (
                <div>
                    <p><strong>Nom d'utilisateur :</strong> {userDetails.username}</p>
                    <p><strong>Email :</strong> {userDetails.email}</p>
                    {/* Ajoutez d'autres détails selon vos besoins */}
                </div>
            )}
        </div>
    );
}

export default Account;
