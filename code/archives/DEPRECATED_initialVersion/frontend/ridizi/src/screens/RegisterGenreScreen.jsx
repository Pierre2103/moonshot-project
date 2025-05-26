import React, { useState } from 'react';
import { StyleSheet, View, ScrollView } from 'react-native';
import { Text } from 'react-native-paper';
import { ref, set } from 'firebase/database';
import { auth, database } from '../../firebaseConfig';
import CustomChip from '../components/CustomChips';
import HeaderTexts from '../components/HeaderTexts';
import FooterButton from '../components/FooterButton';

const genres = [
  "Anime", "Archaeology", "Art", "Biography", "Body", "Business", 
  "Children's Books", "Comics", "Computing", "Crafts", "Crime",
  "Dictionaries",  "Drama", "Drink", "Education", "Engineering", "Entertainment", 
  "Fantasy", "Finance", "Food", "Garden", "Geography", "Graphic Novels", "Guides", 
  "Health", "History", "Hobbies", "Holiday", "Home", "Horror", "Humour", 
  "Languages", "Law", "Manga", "Medical", "Mind", "Natural History", 
  "Personal Development", "Photography", "Poetry", "Reference", "Religion", "Romance",
  "Science", "Science Fiction", "Social Sciences", "Society", "Spirit", "Sport", "Stationery",
  "Teaching Resources", "Technology", "Teen", "Thriller", "Transport", "Travel", "Young Adult" 
];

export default function GenreSelectionScreen({ navigation }) {
  const [selectedGenres, setSelectedGenres] = useState([]);
  const [error, setError] = useState('');

  const toggleGenre = (genre) => {
    setSelectedGenres((prev) =>
      prev.includes(genre) ? prev.filter((g) => g !== genre) : [...prev, genre]
    );
  };

  const saveGenres = async () => {
    if (selectedGenres.length < 3 || selectedGenres.length > 10) {
      setError('Please select between 3 and 10 genres.');
      return;
    }

    try {
      const userId = auth.currentUser.uid;
      await set(ref(database, `users/${userId}/genres`), selectedGenres);
      navigation.navigate('NextScreen');
    } catch (err) {
      setError(`Error: ${err.message}`);
    }
  };

  return (
    <View style={styles.globalContainer}>
      <HeaderTexts title="What do you like to read?" subtitle="Select between 3 and 10 genres." />

      <View style={styles.contentContainer}>
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <View style={styles.genreContainer}>
            {genres.map((genre) => (
              <CustomChip
                key={genre}
                genre={genre}
                selected={selectedGenres.includes(genre)}
                onPress={() => toggleGenre(genre)}
              />
            ))}
          </View>
        </ScrollView>
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
      </View>

      <FooterButton 
        content="Continue" 
        navigation={navigation}
        onPress={saveGenres}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  // =====================
  // Full screen container
  globalContainer: {
    width: '100%',
    height: '100%',
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    backgroundColor: '#fff',
  },

  // =====================
  // Content container
  contentContainer: {
    width: '100%',
    height: '65%',
    paddingTop: "15%",
    paddingBottom: "15%",
    alignItems: 'center',
    justifyContent: 'center',
    borderColor: '#0F0',  // Debug
    borderWidth: 1,
  },
  scrollContainer: {},
  genreContainer: {
    width: '95%',
    height: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginBottom: 100,
    marginLeft: '2.5%',
    borderColor: '#FF0',  // Debug
    borderWidth: 1,
  },
  errorText: {
    color: 'red',
    marginTop: 10,
  },
});
