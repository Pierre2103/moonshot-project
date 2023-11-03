import React, { useState } from 'react';
import { Link } from 'react-router-dom';

import './addBook.scss';

function AddBook() {
  async function convertCoverToBase64(cover) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.src = URL.createObjectURL(cover);

        img.onload = function() {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            // Ajustez la taille si nécessaire
            canvas.width = img.width;
            canvas.height = img.height;

            ctx.drawImage(img, 0, 0);
            

            canvas.toBlob((blob) => {
                const reader = new FileReader();
                reader.readAsDataURL(blob);
                reader.onload = function() {
                    resolve(reader.result);
                };
                reader.onerror = function(error) {
                    reject('Erreur lors de la conversion en base64: ' + error);
                };
            }, 'image/jpeg', 0.5); // 0.5 = qualité de l'image
        };

        img.onerror = function() {
            reject('Erreur lors du chargement de l\'image.');
        };
    });
}

  async function addToVariable() {
    const title = document.querySelector('input[name="title"]').value;
    const authors = document.querySelector('input[name="author"]').value;
    const summary = document.querySelector('textarea[name="summary"]').value;
    const cover = document.querySelector('input[name="cover"]').files[0];
    const language = document.querySelector('select[name="language"]').value;
    const genre = document.querySelector('input[name="genre"]').value;
    const editor = document.querySelector('input[name="editor"]').value;
    const publicationYear = document.querySelector('input[name="publicationYear"]').value;
    const pagesNumber = document.querySelector('input[name="pagesNumber"]').value;
    const amazonLink = document.querySelector('input[name="amazonLink"]').value;
    const kindleLink = document.querySelector('input[name="kindleLink"]').value;
    const audibleLink = document.querySelector('input[name="audibleLink"]').value;
    const fnacLink = document.querySelector('input[name="fnacLink"]').value;

    var authorsArray = authors.split(',');
    var genresArray = genre.split(',');

    function cleanArray(array) {
      var tempArray = [];
      for (var i = 0; i < array.length; i++) {
        tempArray.push(array[i].trim());
      }
      return tempArray;
    }

    var coverBase64 = await convertCoverToBase64(cover);

    var aBook = {
      title: title,
      authors: cleanArray(authorsArray),
      cover: coverBase64,
      summary: summary,
      language: language,
      genres: cleanArray(genresArray),
      editor: editor,
      publicationYear: parseInt(publicationYear),
      pagesNumber: parseInt(pagesNumber),
      amazonLink: amazonLink,
      kindleLink: kindleLink,
      audibleLink: audibleLink,
      fnacLink: fnacLink
    };

    // put the book in the database
    async function addBookToDB(book) {
      try {
        const response = await fetch('http://localhost:5001/books', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(book)
        });

        if (!response.ok) {
          throw new Error('Error while adding the book.');
        }

        const data = await response.json();
        console.log('Book successfully added:', data);
      } catch (error) {
        console.error("Error during the book's addition:", error);
      }
    };

    addBookToDB(aBook);
  }

  function displayCoverPreview() {
    var input = document.querySelector('input[name="cover"]');
    var preview = document.querySelector('.coverPreview img');

    if (input.files && input.files[0]) {
      var reader = new FileReader();
      reader.onload = function (e) {
        preview.src = e.target.result;
      }
      reader.readAsDataURL(input.files[0]);
    }
  }

  return (
    <div className="addBook">
      <Link to="/">
        <button>Retour à l'accueil</button>
      </Link>

      <div className='a' onClick={addToVariable}>Ajouter à la DB</div>

      <form>
        <div className='formElement'>
          <label htmlFor="title">Titre</label>
          <input name="title" placeholder="Titre" />
        </div>

        <div className='formElement'>
          <label htmlFor="author">Auteur(s)</label>
          <input name="author" placeholder="Auteur(s)" />
        </div>

        <div className='formElement'>
          <label htmlFor="summary">Résumé</label>
          <textarea name="summary" placeholder="Résumé"></textarea>
        </div>

        <div className='formElement'>
          <label htmlFor="cover">Couverture</label>
          <input type="file" name="cover" onChange={displayCoverPreview} />

          <div className="coverPreview">
            <img src="" alt="" width={100} />
          </div>
        </div>

        <div className='formElement'>
          <label htmlFor="language">Langue</label>
          <select name="language">
            <option value="fr">Français</option>
            <option value="en">Anglais</option>
            <option value="es">Espagnol</option>
            <option value="other">Autre</option>
          </select>
        </div>

        <div className='formElement'>
          <label htmlFor="genre">Genre</label>
          <input name="genre" placeholder="Genre" />
        </div>

        <div className='formElement'>
          <label htmlFor="editor">Editeur</label>
          <input name="editor" placeholder="Editeur" />
        </div>

        <div className='formElement'>
          <label htmlFor="publicationYear">Année de publication</label>
          <input name="publicationYear" placeholder="Année de publication" />
        </div>

        <div className='formElement'>
          <label htmlFor="pagesNumber">Nombre de pages</label>
          <input name="pagesNumber" placeholder="Nombre de pages" />
        </div>

        <div className='formElement'>
          <label htmlFor="amazonLink">Lien Amazon</label>
          <input name="amazonLink" placeholder="Lien Amazon" />
        </div>

        <div className='formElement'>
          <label htmlFor="kindleLink">Lien Kindle</label>
          <input name="kindleLink" placeholder="Lien Kindle" />
        </div>

        <div className='formElement'>
          <label htmlFor="audibleLink">Lien Audible</label>
          <input name="audibleLink" placeholder="Lien Audible" />
        </div>

        <div className='formElement'>
          <label htmlFor="fnacLink">Lien Fnac</label>
          <input name="fnacLink" placeholder="Lien Fnac" />
        </div>

      </form>

    </div>
  )

};

export default AddBook;