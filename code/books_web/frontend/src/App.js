import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Home from './pages/home/home';
import ViewBooks from './pages/viewBooks/viewBooks';
import AddBook from './pages/addBook/addBook';
import BookDetail from './pages/bookDetail/bookDetail';
import Authentication from './pages/authentication/authentication';
import Account from './pages/account/account';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/viewBooks" element={<ViewBooks />} />
        <Route path="/addBook" element={<AddBook />} />
        <Route path="/book/:id" element={<BookDetail />} />
        <Route path="/authentication" element={<Authentication />} />
        <Route path="/account" element={<Account />} />
        <Route path="*" element={<h1>404</h1>} />
      </Routes>
    </Router>
  );
}

export default App;
