import React, { useState } from 'react';
import { signup } from '../../api/authentication';
import { login } from '../../api/authentication';
import './authentication.scss';

const Authentication = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [email, setEmail] = useState('');
    const [error, setError] = useState(null);

    const handleSignup = async (e) => {
        e.preventDefault();
        try {
            const data = { username, password, email };
            await signup(data);
            alert('Vous êtes inscrit');
        } catch (err) {
            if (err.response && err.response.data) {
                setError(err.response.data.message);
            }
            setError(err.message || 'Une erreur est survenue lors de l’inscription');
        }
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            const data = { username, password };
            await login(data);
            alert('Vous êtes connecté');
        } catch (err) {
            setError(err.message || 'Une erreur est survenue lors de la connexion');
        }
    }

    const handleLogout = () => {
        localStorage.removeItem('token');
        alert('Vous êtes déconnecté');
    }

    const toggleForms = () => {
        const signupContainer = document.querySelector('.signup-container');
        const loginContainer = document.querySelector('.login-container');
        const signupButton = document.querySelector('.signup-button');
        const loginButton = document.querySelector('.login-button');
        signupContainer.classList.toggle('visibleCtn');
        loginContainer.classList.toggle('visibleCtn');
        signupButton.classList.toggle('visibleBtn');
        loginButton.classList.toggle('visibleBtn');
    }

    return (
        <div className="authentication-container">
            <div className="authentication-container__toggle">
                <button onClick={toggleForms} className='signup-button'>S'inscrire</button>
                <button onClick={toggleForms} className='login-button visibleBtn'>Se connecter</button>
            </div>

            <div className="separator"></div>

            <div className="signup-container visibleCtn">
                <h2>Inscription</h2>
                {error && <p className="error-message">{error}</p>}
                <form onSubmit={handleSignup}>
                    <input 
                        type="text" 
                        placeholder="Nom d’utilisateur" 
                        value={username} 
                        onChange={(e) => setUsername(e.target.value)} 
                    />
                    <input 
                        type="email" 
                        placeholder="E-mail" 
                        value={email} 
                        onChange={(e) => setEmail(e.target.value)} 
                    />
                    <input 
                        type="password" 
                        placeholder="Mot de passe" 
                        value={password} 
                        onChange={(e) => setPassword(e.target.value)} 
                    />
                    <button type="submit">S'inscrire</button>
                </form>
            </div>

            <div className="login-container">
                <h2>Connexion</h2>
                {error && <p className="error-message">{error}</p>}
                <form onSubmit={handleLogin}>
                    <input 
                        type="text" 
                        placeholder="Nom d’utilisateur" 
                        value={username} 
                        onChange={(e) => setUsername(e.target.value)} 
                    />
                    <input 
                        type="password" 
                        placeholder="Mot de passe" 
                        value={password} 
                        onChange={(e) => setPassword(e.target.value)} 
                    />
                    <button type="submit">Se connecter</button>
                </form>
            </div>

            <div className="separator"></div>

            <div>
                <button onClick={handleLogout}>Se déconnecter</button>
            </div>
        </div>
    );
}

export default Authentication;