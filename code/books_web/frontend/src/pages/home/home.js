import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './home.scss';
import Header from '../../components/header/header';

function Home() {
  const [books, setBooks] = useState([]);
  const [search] = useState("");

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
    <div className='home-container'>
      <Header />

      <div className='books-container'>
        {filteredBooks.map((book, index) => (
          <Link to={`/book/${book._id}`} key={index} className="book-card">
            <div className="card-body">
              <img src={book.cover} alt={book.title} className="book-image" />
            </div>
            <div className="card-footer">
              <h3>{book.title}</h3>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

export default Home;
