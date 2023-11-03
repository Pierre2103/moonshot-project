// Path: code/books_web/frontend/src/components/header.js
import React from 'react';
import { Link } from 'react-router-dom';
import './header.scss';

const Header = () => {
    const token = localStorage.getItem('token');

    return (
        <div className="header-container">
            <Link to="/">
                <h1>Books</h1>
            </Link>
            <div className="header-container__links">
                <Link to="/viewBooks">Voir les livres</Link>
                <Link to="/addBook">Ajouter un livre</Link>
                {token ? (
                    <Link to="/account">Mon compte</Link>
                ) : (
                    <Link to="/authentication">Se connecter</Link>
                )}
            </div>
        </div>
    );
}

export default Header;