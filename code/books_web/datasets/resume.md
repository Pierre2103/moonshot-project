# DS1.csv

## Contains the following columns

```csv
image,name,author,format,book_depository_stars,price,currency,old_price,isbn,category,img_paths
```

| Column                | Description                                                                                   | Utilities(1-5) |
| --------------------- | --------------------------------------------------------------------------------------------- | -------------- |
| image                 | Link to the image of the book (Broken Links)                                                  | 1              |
| name                  | Name of the book (Clean)                                                                      | 5              |
| author                | Author of the book (Clean), First name and last name, only 1 author                           | 5              |
| format                | Format of the book (Paperback, Hardback, Mixed media product, Sheet music, Notebook, etc... ) | 2              |
| book_depository_stars | Rating of the book (1-5)                                                                      | 3              |
| price                 | Price of the book                                                                             | 3              |
| currency              | Currency of the price                                                                         | 3              |
| old_price             | Old price of the book                                                                         | 1              |
| isbn                  | ISBN of the book                                                                              | 4              |
| category              | Category of the book                                                                          | 5              |
| img_paths             | Path to the image of the book                                                                 | 5              |

## Contains <ins>32 581</ins> books

---

# DS2.csv

## Contains the following columns

```csv
asin,ISBN10,answered_questions,availability,brand,currency,date_first_available,delivery,department,description,discount,domain,features,final_price,format,image_url,images_count,initial_price,item_weight,manufacturer,model_number,plus_content,product_dimensions,rating,reviews_count,root_bs_rank,seller_id,seller_name,timestamp,title,upc,url,video,video_count,categories,best_sellers_rank,buybox_seller,image,number_of_sellers,colors
```

| Column               | Description                                                            | Utilities(1-5) |
| -------------------- | ---------------------------------------------------------------------- | -------------- |
| asin                 | Amazon Standard Identification Number                                  | 4              |
| ISBN10               | ISBN10 of the book                                                     | 4              |
| answered_questions   | Number of answered questions                                           | 1              |
| availability         | Availability of the book                                               | 1              |
| brand                | Brand of the book                                                      | 1              |
| currency             | Currency of the price                                                  | 3              |
| date_first_available | Date of the first availability of the book (missing mostly everywhere) | 1              |
| delivery             | Delivery of the book                                                   | 1              |
| department           | Department of the book (missing mostly everywhere)                     | 1              |
| description          | Description of the book (missing mostly everywhere)                    | 4              |
| discount             | Discount of the book                                                   | 1              |
| domain               | Domain of the book                                                     | 1              |
| features             | Features of the book                                                   | 1              |
| final_price          | Final price of the book                                                | 3              |
| format               | Format of the book                                                     | 2              |
| image_url            | Link to the image of the book                                          | 5              |
| images_count         | Number of images of the book                                           | 1              |
| initial_price        | Initial price of the book                                              | 1              |
| item_weight          | Weight of the book                                                     | 1              |
| manufacturer         | Manufacturer of the book                                               | 1              |
| model_number         | Model number of the book                                               | 1              |
| plus_content         | Plus content of the book                                               | 1              |
| product_dimensions   | Dimensions of the book                                                 | 2              |
| rating               | Rating of the book (1-5)                                               | 3              |
| reviews_count        | Number of reviews of the book                                          | 1              |
| root_bs_rank         | Root best seller rank of the book                                      | 1              |
| seller_id            | Seller ID of the book                                                  | 1              |
| seller_name          | Seller name of the book                                                | 1              |
| timestamp            | Timestamp of the book                                                  | 1              |
| title                | Title of the book (not cleaned)                                        | 5              |
| upc                  | UPC of the book                                                        | 1              |
| url                  | Amazon link to the book                                                | 5              |
| video                | Video of the book                                                      | 1              |
| video_count          | Number of videos of the book                                           | 1              |
| categories           | Categories of the book                                                 | 5              |
| best_sellers_rank    | Best sellers rank of the book                                          | 1              |
| buybox_seller        | Buybox seller of the book                                              | 1              |
| image                | Image of the book (missing mostly everywhere)                          | 1              |
| number_of_sellers    | Number of sellers of the book                                          | 1              |
| colors               | Colors of the book                                                     | 1              |

## Contains <ins>2 269</ins> Articles

---

# DS3.csv

## Contains the following columns

```csv
book_id,goodreads_book_id,best_book_id,work_id,books_count,isbn,isbn13,authors,original_publication_year,original_title,title,language_code,average_rating,ratings_count,work_ratings_count,work_text_reviews_count,ratings_1,ratings_2,ratings_3,ratings_4,ratings_5,image_url,small_image_url
```

| Column                    | Description                                                                               | Utilities(1-5) |
| ------------------------- | ----------------------------------------------------------------------------------------- | -------------- |
| book_id                   | Book ID                                                                                   | 1              |
| goodreads_book_id         | Goodreads book ID                                                                         | 1              |
| best_book_id              | Best book ID                                                                              | 1              |
| work_id                   | Work ID                                                                                   | 1              |
| books_count               | Books count                                                                               | 1              |
| isbn                      | ISBN of the book                                                                          | 4              |
| isbn13                    | ISBN13 of the book                                                                        | 4              |
| authors                   | Authors of the book(when there is several it's formatted like this: "author 1, author 2") | 5              |
| original_publication_year | Original publication year of the book                                                     | 4              |
| original_title            | Original title of the book                                                                | 2              |
| title                     | Title of the book                                                                         | 5              |
| language_code             | Language code of the book(eng, en-US, en-CA, spa, fre, ara, etc...)                       | 4              |
| average_rating            | Average rating of the book                                                                | 3              |
| ratings_count             | Ratings count of the book                                                                 | 1              |
| work_ratings_count        | Work ratings count of the book                                                            | 1              |
| work_text_reviews_count   | Work text reviews count of the book                                                       | 1              |
| ratings_1                 | Ratings 1 of the book                                                                     | 1              |
| ratings_2                 | Ratings 2 of the book                                                                     | 1              |
| ratings_3                 | Ratings 3 of the book                                                                     | 1              |
| ratings_4                 | Ratings 4 of the book                                                                     | 1              |
| ratings_5                 | Ratings 5 of the book                                                                     | 1              |
| image_url                 | Image URL of the book                                                                     | 5              |
| small_image_url           | Small image URL of the book                                                               | 2              |

## Contains <ins>10 000</ins> Articles

---

# DS4.csv

## Contains the following columns

```csv
ISBN_010a;Titre_200a;Complement_du_titre_200e;Auteur_principal_nom_700a;Auteur_principal_prenom_700b;Auteur_principal_qualificatif_700c;Autre_auteur_principal_nom_701a;Autre_auteur_principal_prenom_702b;Autre_auteur_principal_qualificatif_702b;Editeur_210c;Annee_edition_210d;Pagination_215a;Format_215d;Agence_de_catalogage_801b;Numero_de_code_a_barres_915b;Type_de_document_920t;Section_997e;Cote_1_997h;Cote_2_997i;Nom_de_l_emprunteur;longitude;Latitude
```

| Column                                   | Description                                            | Utilities(1-5) |
| ---------------------------------------- | ------------------------------------------------------ | -------------- |
| ISBN_010a                                | ISBN of the book                                       | 4              |
| Titre_200a                               | Title of the book (special characters are not working) | 5              |
| Complement_du_titre_200e                 | Complement of the title of the book                    | 1              |
| Auteur_principal_nom_700a                | Author's last name of the book                         | 5              |
| Auteur_principal_prenom_700b             | Author's first name of the book                        | 5              |
| Auteur_principal_qualificatif_700c       | Author's qualification of the book                     | 1              |
| Autre_auteur_principal_nom_701a          | Other author's last name of the book                   | 5              |
| Autre_auteur_principal_prenom_702b       | Other author's first name of the book                  | 5              |
| Autre_auteur_principal_qualificatif_702b | Other author's qualification of the book               | 1              |
| Editeur_210c                             | Editor of the book                                     | 1              |
| Annee_edition_210d                       | Year of edition of the book                            | 4              |
| Pagination_215a                          | Pagination of the book                                 | 4              |
| Format_215d                              | Format of the book                                     | 2              |
| Agence_de_catalogage_801b                | Cataloging agency of the book                          | 1              |
| Numero_de_code_a_barres_915b             | Barcode number of the book                             | 1              |
| Type_de_document_920t                    | Type of document (book, CD, Magazine, )                | 1              |
| Section_997e                             | Section of the book                                    | 5              |
| Cote_1_997h                              | Cote 1 of the book                                     | 1              |
| Cote_2_997i                              | Cote 2 of the book                                     | 1              |
| Nom_de_l_emprunteur                      | Name of the borrower                                   | 1              |
| longitude                                | Longitude of the book                                  | 1              |
| Latitude                                 | Latitude of the book                                   | 1              |

## Contains <ins>214 397</ins> Articles

---

# DS5.csv

## Contains the following columns

```csv
"ISBN";"Book-Title";"Book-Author";"Year-Of-Publication";"Publisher";"Image-URL-S";"Image-URL-M";"Image-URL-L"
```

| Column              | Description                     | Utilities(1-5) |
| ------------------- | ------------------------------- | -------------- |
| ISBN                | ISBN of the book                | 4              |
| Book-Title          | Title of the book               | 5              |
| Book-Author         | Author of the book              | 5              |
| Year-Of-Publication | Year of publication of the book | 4              |
| Publisher           | Publisher of the book           | 1              |
| Image-URL-S         | Image URL S of the book         | 2              |
| Image-URL-M         | Image URL M of the book         | 2              |
| Image-URL-L         | Image URL L of the book         | 5              |

## Contains <ins>271 379</ins> Articles

---

# Total

## Summary

| Utility | Number of columns |
| ------- | ----------------- |
| 1       | 57                |
| 2       | 8                 |
| 3       | 7                 |
| 4       | 13                |
| 5       | 19                |
| Total   | 104               |

# What will compose the final dataset?

<details>
<summary>Click to expand</summary>

### Related to Image

| column          | description                                   | utilities(1-5) | Dataset |
| --------------- | --------------------------------------------- | -------------- | ------- |
| image           | Link to the image of the book (Broken Links)  | 1              | DS1     |
| img_paths       | Path to the image of the book                 | 5              | DS1     |
| image_url       | Link to the image of the book                 | 5              | DS2     |
| images_count    | Number of images of the book                  | 1              | DS2     |
| image           | Image of the book (missing mostly everywhere) | 1              | DS2     |
| image_url       | Image URL of the book                         | 5              | DS5     |
| small_image_url | Small image URL of the book                   | 2              | DS5     |
| Image-URL-S     | Image URL S of the book                       | 2              | DS5     |
| Image-URL-M     | Image URL M of the book                       | 2              | DS5     |
| Image-URL-L     | Image URL L of the book                       | 5              | DS5     |
| video           | Video of the book                             | 1              | DS2     |
| video_count     | Number of videos of the book                  | 1              | DS2     |

**Output Format `"data:image/jpeg;base64"`**

# Related to Title

| column                   | description                                            | utilities(1-5) | Dataset |
| ------------------------ | ------------------------------------------------------ | -------------- | ------- |
| name                     | Name of the book (Clean)                               | 5              | DS1     |
| title                    | Title of the book (not cleaned)                        | 5              | DS2     |
| original_title           | Original title of the book                             | 2              | DS3     |
| title                    | Title of the book                                      | 5              | DS3     |
| Titre_200a               | Title of the book (special characters are not working) | 5              | DS4     |
| Complement_du_titre_200e | Complement of the title of the book                    | 1              | DS4     |
| Book-Title               | Title of the book                                      | 5              | DS5     |

**Output Format `"title"`**

# Related to Author(s)

| column                                   | description                                                                               | utilities(1-5) | Dataset |
| ---------------------------------------- | ----------------------------------------------------------------------------------------- | -------------- | ------- |
| author                                   | Author of the book (Clean), First name and last name, only 1 author                       | 5              | DS1     |
| authors                                  | Authors of the book(when there is several it's formatted like this: "author 1, author 2") | 5              | DS3     |
| Auteur_principal_nom_700a                | Author's last name of the book                                                            | 5              | DS4     |
| Auteur_principal_prenom_700b             | Author's first name of the book                                                           | 5              | DS4     |
| Auteur_principal_qualificatif_700c       | Author's qualification of the book                                                        | 1              | DS4     |
| Autre_auteur_principal_nom_701a          | Other author's last name of the book                                                      | 5              | DS4     |
| Autre_auteur_principal_prenom_702b       | Other author's first name of the book                                                     | 5              | DS4     |
| Autre_auteur_principal_qualificatif_702b | Other author's qualification of the book                                                  | 1              | DS4     |
| Book-Author                              | Author of the book                                                                        | 5              | DS5     |

**Output Format `["author 1"; "author 2"]`**

# Related to Format

| column                | description                                                                                   | utilities(1-5) | Dataset |
| --------------------- | --------------------------------------------------------------------------------------------- | -------------- | ------- |
| format                | Format of the book (Paperback, Hardback, Mixed media product, Sheet music, Notebook, etc... ) | 2              | DS1     |
| format                | Format of the book                                                                            | 2              | DS2     |
| Type_de_document_920t | Type of document (book, CD, Magazine, )                                                       | 1              | DS4     |

**Output Format `"format"`**

*Types of format: Book, Audio*

# Related to Price

| column        | description               | utilities(1-5) | Dataset |
| ------------- | ------------------------- | -------------- | ------- |
| price         | Price of the book         | 3              | DS1     |
| currency      | Currency of the price     | 3              | DS1     |
| old_price     | Old price of the book     | 1              | DS1     |
| currency      | Currency of the price     | 3              | DS2     |
| final_price   | Final price of the book   | 3              | DS2     |
| initial_price | Initial price of the book | 1              | DS2     |

**Output Format `00.00`**

# Related to Rating

| column                | description                | utilities(1-5) | Dataset |
| --------------------- | -------------------------- | -------------- | ------- |
| book_depository_stars | Rating of the book (1-5)   | 3              | DS1     |
| rating                | Rating of the book (1-5)   | 3              | DS2     |
| average_rating        | Average rating of the book | 3              | DS3     |
| ratings_count         | Ratings count of the book  | 1              | DS3     |
| ratings_1             | Ratings 1 of the book      | 1              | DS3     |
| ratings_2             | Ratings 2 of the book      | 1              | DS3     |
| ratings_3             | Ratings 3 of the book      | 1              | DS3     |
| ratings_4             | Ratings 4 of the book      | 1              | DS3     |
| ratings_5             | Ratings 5 of the book      | 1              | DS3     |

**Output Format `0.0`**

# Related to ISBN

| column    | description        | utilities(1-5) | Dataset |
| --------- | ------------------ | -------------- | ------- |
| isbn      | ISBN of the book   | 4              | DS1     |
| ISBN10    | ISBN10 of the book | 4              | DS2     |
| isbn      | ISBN of the book   | 4              | DS3     |
| isbn13    | ISBN13 of the book | 4              | DS3     |
| ISBN_010a | ISBN of the book   | 4              | DS4     |
| ISBN      | ISBN of the book   | 4              | DS5     |

**Output Format `"0123456789"`**

# Related to Categories

| column       | description            | utilities(1-5) | Dataset |
| ------------ | ---------------------- | -------------- | ------- |
| category     | Category of the book   | 5              | DS1     |
| categories   | Categories of the book | 5              | DS2     |
| Section_997e | Section of the book    | 5              | DS4     |

**Output Format `["category 1"; "category 2"]`**

# Related to Description

| column      | description                                         | utilities(1-5) | Dataset |
| ----------- | --------------------------------------------------- | -------------- | ------- |
| description | Description of the book (missing mostly everywhere) | 4              | DS2     |

**Output Format `"Lorem ipsum doloreat"`**

# Related to Amazon

| column | description                           | utilities(1-5) | Dataset |
| ------ | ------------------------------------- | -------------- | ------- |
| asin   | Amazon Standard Identification Number | 4              | DS2     |
| url    | Amazon link to the book               | 5              | DS2     |

**Output Format `"https://www.amazon.com/..."`**

# Related to Publication date

| column                    | description                           | utilities(1-5) | Dataset |
| ------------------------- | ------------------------------------- | -------------- | ------- |
| original_publication_year | Original publication year of the book | 4              | DS3     |
| Annee_edition_210d        | Year of edition of the book           | 4              | DS4     |
| Year-Of-Publication       | Year of publication of the book       | 4              | DS5     |

**Output Format `0000`**

# Related to the number of pages

| column          | description            | utilities(1-5) | Dataset |
| --------------- | ---------------------- | -------------- | ------- |
| Pagination_215a | Pagination of the book | 4              | DS4     |

**Output Format `000`**

# Related to the language

| column        | description                                                         | utilities(1-5) | Dataset |
| ------------- | ------------------------------------------------------------------- | -------------- | ------- |
| language_code | Language code of the book(eng, en-US, en-CA, spa, fre, ara, etc...) | 4              | DS3     |

**Output Format `"en-us"`, `fr-fr`**

# Other

| column                       | description                                                            | utilities(1-5) | Dataset |
| ---------------------------- | ---------------------------------------------------------------------- | -------------- | ------- |
| answered_questions           | Number of answered questions                                           | 1              | DS2     |
| availability                 | Availability of the book                                               | 1              | DS2     |
| brand                        | Brand of the book                                                      | 1              | DS2     |
| date_first_available         | Date of the first availability of the book (missing mostly everywhere) | 1              | DS2     |
| delivery                     | Delivery of the book                                                   | 1              | DS2     |
| department                   | Department of the book (missing mostly everywhere)                     | 1              | DS2     |
| discount                     | Discount of the book                                                   | 1              | DS2     |
| domain                       | Domain of the book                                                     | 1              | DS2     |
| features                     | Features of the book                                                   | 1              | DS2     |
| item_weight                  | Weight of the book                                                     | 1              | DS2     |
| manufacturer                 | Manufacturer of the book                                               | 1              | DS2     |
| model_number                 | Model number of the book                                               | 1              | DS2     |
| plus_content                 | Plus content of the book                                               | 1              | DS2     |
| product_dimensions           | Dimensions of the book                                                 | 2              | DS2     |
| reviews_count                | Number of reviews of the book                                          | 1              | DS2     |
| root_bs_rank                 | Root best seller rank of the book                                      | 1              | DS2     |
| seller_id                    | Seller ID of the book                                                  | 1              | DS2     |
| seller_name                  | Seller name of the book                                                | 1              | DS2     |
| timestamp                    | Timestamp of the book                                                  | 1              | DS2     |
| upc                          | UPC of the book                                                        | 1              | DS2     |
| best_sellers_rank            | Best sellers rank of the book                                          | 1              | DS2     |
| buybox_seller                | Buybox seller of the book                                              | 1              | DS2     |
| number_of_sellers            | Number of sellers of the book                                          | 1              | DS2     |
| colors                       | Colors of the book                                                     | 1              | DS2     |
| book_id                      | Book ID                                                                | 1              | DS3     |
| goodreads_book_id            | Goodreads book ID                                                      | 1              | DS3     |
| best_book_id                 | Best book ID                                                           | 1              | DS3     |
| work_id                      | Work ID                                                                | 1              | DS3     |
| books_count                  | Books count                                                            | 1              | DS3     |
| work_ratings_count           | Work ratings count of the book                                         | 1              | DS3     |
| work_text_reviews_count      | Work text reviews count of the book                                    | 1              | DS3     |
| Editeur_210c                 | Editor of the book                                                     | 1              | DS4     |
| Format_215d                  | Format of the book                                                     | 2              | DS4     |
| Agence_de_catalogage_801b    | Cataloging agency of the book                                          | 1              | DS4     |
| Numero_de_code_a_barres_915b | Barcode number of the book                                             | 1              | DS4     |
| Cote_1_997h                  | Cote 1 of the book                                                     | 1              | DS4     |
| Cote_2_997i                  | Cote 2 of the book                                                     | 1              | DS4     |
| Nom_de_l_emprunteur          | Name of the borrower                                                   | 1              | DS4     |
| longitude                    | Longitude of the book                                                  | 1              | DS4     |
| Latitude                     | Latitude of the book                                                   | 1              | DS4     |
| Publisher                    | Publisher of the book                                                  | 1              | DS5     |

**Will be ignored**
</details>

## Contains <ins>531 626</ins> Articles
