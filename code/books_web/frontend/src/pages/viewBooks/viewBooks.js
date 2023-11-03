import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './viewBooks.scss';

function ViewBooks() {
  const [books, setBooks] = useState([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch('http://localhost:5001/books')
      .then(response => response.json())
      .then(data => setBooks(data))
      .catch(error => console.error('Erreur lors de la récupération des livres:', error));
  }, []);

  const filteredBooks = books.filter(book => 
    book.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="view-books-container"> 
      <Link to="/">
        <button>Retour à l'accueil</button>
      </Link>
      <input 
        type="text" 
        placeholder="Rechercher un livre" 
        value={search}
        onChange={e => setSearch(e.target.value)}
      />
      <table>
        <thead>
          <tr>
            <th>Ouvrir</th>
            <th>Supprimer</th>
            <th>ID</th>
            <th>UUID</th>
            <th>Titre</th>
            <th>Auteur(s)</th>
            <th>Couverture</th>
            <th>Résumé</th>
            <th>Langue</th>
            <th>Genre(s)</th>
            <th>Editeur</th>
            <th>Date de publication</th>
            <th>Nombre de pages</th>
            <th>Lien Amazon</th>
            <th>Lien Kindle</th>
            <th>Lien Audible</th>
            <th>Lien Fnac</th>
          </tr>
        </thead>
        <tbody>
          {filteredBooks.map((book) => (
            <tr key={book._id}>
              <td><button onClick={
                () => {
                  window.open(`/book/${book._id}`, '_blank');
                }
              }>Ouvrir</button></td>
              <td>
                <button
                  onClick={() => {
                    fetch(`http://localhost:5001/books/${book._id}`, { method: 'DELETE' })
                      .then(() => {
                        const updatedBooks = books.filter(b => b._id !== book._id);
                        setBooks(updatedBooks);
                      })
                      .catch(error => console.error('Erreur lors de la suppression du livre:', error));
                  }}
                >
                  Supprimer
                </button>
              </td>
              <td>{book._id}</td>
              <td>{book.uuid}</td>
              <td>{book.title}</td>
              <td>{book.authors.join(', ')}</td> {/* Affiche les auteurs comme une liste séparée par des virgules */}
              <td>
                <img 
                  src={book.cover} 
                  alt={book.title} 
                  style={{ height: 150 }}
                />
              </td>
              <td>{book.summary}</td>
              <td>{book.language}</td>
              <td>{book.genres.join(', ')}</td> {/* Affiche les genres comme une liste séparée par des virgules */}
              <td>{book.editor}</td>
              <td>{book.publicationYear}</td>
              <td>{book.pagesNumber}</td>
              <td>
                <a href={book.amazonLink} target="_blank" rel="noopener noreferrer">
                  Lien Amazon
                </a>
              </td>
              <td>
                <a href={book.kindleLink} target="_blank" rel="noopener noreferrer">
                  Lien Kindle
                </a>
              </td>
              <td>
                <a href={book.audibleLink} target="_blank" rel="noopener noreferrer">
                  Lien Audible
                </a>
              </td>
              <td>
                <a href={book.fnacLink} target="_blank" rel="noopener noreferrer">
                  Lien Fnac
                </a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default ViewBooks;
