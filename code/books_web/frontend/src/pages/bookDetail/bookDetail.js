// BookDetail.js
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import './bookDetail.scss';
import Header from '../../components/header/header';

function BookDetail() {
    const { id } = useParams();
    const [book, setBook] = useState({});

    useEffect(() => {
        async function fetchBook() {
            // Utilisez l'ID pour récupérer les détails du livre
            const response = await fetch(`http://localhost:5001/books/${id}`);
            const data = await response.json();
            // Faites quelque chose avec les données, par exemple les mettre dans un état
            setBook(data);
        }
    
        fetchBook();
    }, [id]); // Notez que nous ajoutons l'ID comme dépendance
    
    const authors = book.authors ? book.authors.join(', ') : '';
    const genres = book.genres ? book.genres.join(', ') : '';

    // if book.language = fr, set language to 'Français', else if it's en, set language to 'English', else set language to 'Non-définis'
    const language = book.language === 'fr' ? 'Français' : book.language === 'en' ? 'Anglais' : 'Non-définis';
    
    useEffect(() => {
        if (!book.cover) return;  // S'assurer que la couverture du livre est disponible
    
        var imgUrl = book.cover;
        var coverCard = document.getElementById("cover");
        if (!coverCard) return;  // S'assurer que l'élément coverCard est dans le DOM
    
        function updateReflection(degree, percentage) {
            coverCard.style.background = `linear-gradient(${degree}deg, rgba(255,255,255,0) 0%,rgba(192,192,192,0.3) ${percentage}%,rgba(255,255,255,0) 100%), url('${imgUrl}')`
            coverCard.style.backgroundSize = "cover";
        }
    
        window.addEventListener("mousemove", (event) => {
            let mouseX = event.clientX;
            let mouseY = event.clientY;
            let halfWidth = window.innerWidth / 2;
            let halfHeight = window.innerHeight / 2;
            let xdeg = (mouseX - halfWidth) / halfWidth;
            let ydeg = (mouseY - halfHeight) / halfHeight;
            updateReflection(ydeg * 180, xdeg * 100);
            coverCard.style.transform = `rotateX(${ydeg * 10}deg) rotateY(${xdeg * 10}deg)`;
        });
    
        window.ondevicemotion = function(event) {
            var accelerationX = event.accelerationIncludingGravity.x;
            var accelerationY = event.accelerationIncludingGravity.y;
            let xdeg = accelerationX / 10;
            let ydeg = accelerationY / 10;
            updateReflection(ydeg * 180, xdeg * 100);
            coverCard.style.transform = `rotateX(${ydeg * 20}deg) rotateY(${xdeg * 20}deg)`;
        };
        
    }, [book]);    

    function changeSection(section) {
        const sections = ['information', 'summary', 'buy', 'similar'];
        sections.forEach((sec) => {
            if (sec === section) {
                document.getElementById(`${sec}Ctn`).classList.add('active');
                document.getElementById(`${sec}Nav`).classList.add('active');
            } else {
                document.getElementById(`${sec}Ctn`).classList.remove('active');
                document.getElementById(`${sec}Nav`).classList.remove('active');
            }
        });
    
        if (section === 'similar') {
            document.getElementById('titleCtn').classList.remove('visible');
            document.getElementById('buttonsContainer').classList.remove('visible');
        } else {
            document.getElementById('titleCtn').classList.add('visible');
            document.getElementById('buttonsContainer').classList.add('visible');
        }
    }


    return (
        <div className='globalDiv'>
            <Header />
            <div className='coverContainer'>
                <div className="scene">
                    <div className="cover" id="cover"></div>
                </div>
            </div>

            <div className='contentContainer'>
                <div className='navigationBar'>
                    <div className='navigationBarItem active' id='informationNav' onClick={() => changeSection('information')}>
                        Informations
                    </div>
                    <div className='navigationBarItem' id='summaryNav' onClick={() => changeSection('summary')}>
                        Résumé
                    </div>
                    <div className='navigationBarItem' id='buyNav' onClick={() => changeSection('buy')}>
                        Acheter
                    </div>
                    <div className='navigationBarItem' id='similarNav' onClick={() => changeSection('similar')}>
                        Similaires
                    </div>
                </div>

                <div className='titleCtn visible' id='titleCtn'>
                    <h1>{book.title}</h1>
                </div>

                <div className='section informations active' id='informationCtn'>
                    <h3 className='authorsTxt'>{authors}</h3>
                    <h3 className='languageTxt'>Langue: {language}</h3>
                    <h3 className='genresTxt'>Genre(s): {genres}</h3>
                    <h3 className='editorTxt'>Editeur: {book.editor}</h3>
                    <h3 className='publicationDateTxt'>Publier en: {book.publicationYear}</h3>
                </div>

                <div className='section summary' id='summaryCtn'>
                    <h3 className='pagesNumberTxt'>Nombre de Pages: {book.pagesNumber} Pages</h3>
                    <p className='summaryTxt'>{book.summary}</p>
                </div>

                <div className='section buy' id='buyCtn'>
                    <div className='buttonsGroup'>
                        <a href={book.amazonLink} target='_blank' className='buyAmazon'></a><br></br>
                        <a href={book.kindleLink} target='_blank' className='buyKindle'></a><br></br>
                        <a href={book.audibleLink} target='_blank' className='buyAudible'></a><br></br>
                        <a href={book.fnacLink} target='_blank' className='buyFnac'></a><br></br>
                    </div>
                </div>

                <div className='section similar' id='similarCtn'>
                    <h1>Similar books</h1>
                </div>

                <div className='buttonsContainer visible' id='buttonsContainer'>
                    <button className='button btn-like'>J'aime</button>
                    <button className='button btn-collection'>Ajouter à une collection</button>
                </div>
            </div>
        </div>
    );
}

export default BookDetail;
