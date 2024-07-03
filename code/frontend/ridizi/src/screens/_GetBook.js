// import React, { useState } from 'react';
// import { StyleSheet, Text, TextInput, View, Button, Image, ScrollView } from 'react-native';

// export default function HomeScreen({ navigation }) {
//   const [isbn, setIsbn] = useState('');
//   const [result, setResult] = useState(null);
//   const [cover, setCover] = useState('');
//   const [error, setError] = useState('');
//   const [scanned, setScanned] = useState(false);

//   const handleSearch = async () => {
//     setError('');
//     try {
//       const response = await fetch(`http://172.20.10.5:5008/search?isbn=${isbn}`);
//       const data = await response.json();
//       if (data.error) {
//         setResult(null);
//         setCover('');
//         setError(data.error);
//         if (data.error === 'Book not found') {
//           const openLibraryResponse = await fetch(`https://openlibrary.org/search.json?q=${isbn}`);
//           const openLibraryData = await openLibraryResponse.json();
//           if (openLibraryData.numFound > 0) {
//             const book = openLibraryData.docs[0];
//             const bookData = {
//               ISBN: isbn,
//               title: book.title,
//               authors: book.author_name,
//               cover: book.cover_i ? `http://covers.openlibrary.org/b/id/${book.cover_i}-L.jpg` : '',
//               publicationYear: book.first_publish_year,
//               publisher: book.publisher
//             };
//             console.log('bookData:', bookData);
//             setResult(bookData);
//             setCover(bookData.cover);
//           } else {
//             setError('No book found in Open Library');
//           }
//         }
//       } else {
//         console.log('data:', data);
//         setResult(data);
//         setCover(data.cover);
//       }
//     } catch (error) {
//       setError(error.message);
//     }
//   };

//   const handleBarCodeScanned = ({ type, data }) => {
//     setIsbn(data);
//     setScanned(false);
//     handleSearch();
//   };

//   return (
//     <View style={styles.container}>
//       <Text style={styles.title}>Search for a Book by ISBN</Text>
//       <TextInput
//         style={styles.input}
//         placeholder="Enter ISBN"
//         value={isbn}
//         onChangeText={setIsbn}
//       />
//       <Button title="Search" onPress={handleSearch} />
//       <Button title="TEST 1" onPress={() => { setIsbn('1449372864'); handleSearch(); }} />
//       <Button title="TEST 2" onPress={() => { setIsbn('9780359816316'); handleSearch(); }} />
//       <Button title="Clear" onPress={() => { setIsbn(''); setResult(null); setCover(''); setError(''); }} />
//       <Button title="Toggle Barcode Scanner" onPress={() => setScanned(!scanned)} />
//       <Button title="Go to Details" onPress={() => navigation.navigate('Details')} />

//       <ScrollView contentContainerStyle={styles.resultContainer}>
//         {error ? (
//           <Text style={styles.error}>{error}</Text>
//         ) : (
//           result && (
//             <>
//               <Text style={styles.resultText}>{JSON.stringify(result, null, 2)}</Text>
//               {cover ? <Image source={{ uri: cover }} style={styles.cover} /> : null}
//             </>
//           )
//         )}
//       </ScrollView>
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#fff',
//     padding: 20,
//     justifyContent: 'center',
//   },
//   title: {
//     fontSize: 24,
//     textAlign: 'center',
//     marginBottom: 20,
//   },
//   input: {
//     height: 40,
//     borderColor: 'gray',
//     borderWidth: 1,
//     marginBottom: 20,
//     paddingHorizontal: 10,
//     borderRadius: 5,
//   },
//   resultContainer: {
//     marginTop: 20,
//   },
//   resultText: {
//     fontSize: 16,
//     backgroundColor: '#f4f4f4',
//     padding: 10,
//     borderRadius: 5,
//   },
//   cover: {
//     width: 200,
//     height: 300,
//     marginTop: 20,
//     alignSelf: 'center',
//   },
//   error: {
//     color: 'red',
//     fontSize: 16,
//   },
// });
