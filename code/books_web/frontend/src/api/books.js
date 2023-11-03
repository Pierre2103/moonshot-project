export async function addBookToDB(book) {
    try {
        const response = await fetch('http://localhost:5001/books', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(book)
        });

        if (!response.ok) {
            throw new Error("Erreur lors de l'ajout du livre.");
        }

        const data = await response.json();
        console.log('Livre ajouté avec succès:', data);
    } catch (error) {
        console.error("Erreur lors de l'ajout du livre:", error);
    }
}

export async function getBooksFromDB() {
    try {
        const response = await fetch('http://localhost:5001/books');
        if (!response.ok) {
            throw new Error('Erreur lors de la récupération des livres.');
        }
        const data = await response.json();
        return data;
    } catch (error) {
        console.error("Erreur lors de la récupération des livres:", error);
    }
}

export async function getBookFromDB(id) {
    try {
        const response = await fetch(`http://localhost:5001/books/${id}`);
        if (!response.ok) {
            throw new Error('Erreur lors de la récupération du livre.');
        }
        const data = await response.json();
        return data;
    } catch (error) {
        console.error("Erreur lors de la récupération du livre:", error);
    }
}

export async function deleteBookFromDB(id) {
    try {
        const response = await fetch(`http://localhost:5001/books/${id}`, {
            method: 'DELETE'
        });
        if (!response.ok) {
            throw new Error('Erreur lors de la suppression du livre.');
        }
        const data = await response.json();
        return data;
    } catch (error) {
        console.error("Erreur lors de la suppression du livre:", error);
    }
}