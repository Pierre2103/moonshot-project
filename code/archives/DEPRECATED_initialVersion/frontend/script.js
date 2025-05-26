document.getElementById('searchForm').addEventListener('submit', function(event) {
    event.preventDefault();
    const isbn = document.getElementById('isbn').value;
    // fetch(`http://127.0.0.1:5000/search?isbn=${isbn}`)
    fetch(`http://127.20.10.5:5000/search?isbn=${isbn}`)
        .then(response => response.json())
        .then(data => {
            const resultDiv = document.getElementById('result');
            const resultCoverDiv = document.getElementById('result-cover');
            if (data.error) {
                resultDiv.innerHTML = `<p>Error: ${data.error}</p>`;
                resultCoverDiv.innerHTML = '';
                if (data.error === 'Book not found') {
                    fetch(`https://openlibrary.org/search.json?q=${isbn}`)
                        .then(response => response.json())
                        .then(data => {
                            if (data.numFound > 0) {
                                const book = data.docs[0];
                                const bookData = {
                                    ISBN: isbn,
                                    title: book.title,
                                    authors: book.author_name,
                                    cover: book.cover_i ? `http://covers.openlibrary.org/b/id/${book.cover_i}-L.jpg` : '',
                                    publicationYear: book.first_publish_year,
                                    publisher: book.publisher
                                };
                                resultDiv.innerHTML = `<pre>${JSON.stringify(bookData, null, 2)}</pre>`;
                                if (bookData.cover) {
                                    resultCoverDiv.innerHTML = `<img src="${bookData.cover}" alt="Book Cover">`;
                                }
                            } else {
                                resultDiv.innerHTML = `<p>Error: No book found in Open Library</p>`;
                            }
                        })
                        .catch(error => {
                            console.error('Error:', error);
                            resultDiv.innerHTML = `<p>Error: ${error.message}</p>`;
                        });
                }
            } else {
                resultDiv.innerHTML = `<pre>${JSON.stringify(data, null, 2)}</pre>`;
                if (data.cover) {
                    resultCoverDiv.innerHTML = `<img src="${data.cover}" alt="Book Cover">`;
                }
            }
        })
        .catch(error => {
            console.error('Error:', error);
            document.getElementById('result').innerHTML = `<p>Error: ${error.message}</p>`;
        });
});
