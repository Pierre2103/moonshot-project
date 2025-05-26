import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { ref, onValue, push, set, update, remove } from 'firebase/database';
import database from '../../firebaseConfig';

const DatabaseManager = () => {
  const [users, setUsers] = useState({});
  const [newUser, setNewUser] = useState('');

  useEffect(() => {
    const usersRef = ref(database, 'users');
    onValue(usersRef, (snapshot) => {
      const data = snapshot.val();
      setUsers(data || {});
    });
  }, []);

  const addUser = () => {
    if (newUser.trim()) {
      const newUserRef = push(ref(database, 'users'));
      set(newUserRef, { name: newUser });
      setNewUser('');
    }
  };

  const updateUser = (id, newName) => {
    update(ref(database, `users/${id}`), { name: newName });
  };

  const deleteUser = (id) => {
    remove(ref(database, `users/${id}`));
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Database Manager</Text>
      <View style={styles.addContainer}>
        <TextInput
          style={styles.input}
          value={newUser}
          onChangeText={setNewUser}
          placeholder="Add new user"
        />
        <Button title="Add User" onPress={addUser} />
      </View>
      <FlatList
        data={Object.keys(users)}
        renderUser={({ user }) => (
          <View style={styles.listUser}>
            <TextInput
              style={styles.input}
              value={users[user].name}
              onChangeText={(text) => updateUser(user, text)}
            />
            <TouchableOpacity onPress={() => deleteUser(user)}>
              <Text style={styles.deleteButton}>Delete</Text>
            </TouchableOpacity>
          </View>
        )}
        keyExtractor={(user) => user}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    fontFamily: 'Arial, sans-serif',
    margin: '20px',
  },
  addContainer: {
    display: 'flex',
    flexDirection: 'row',
    marginBottom: '20px',
  },
  input: {
    borderColor: '#000',
    borderWidth: 1,
    padding: 8,
    marginRight: 8,
    flex: 1,
  },
  list: {
    listStyleType: 'none',
    padding: 0,
  },
  listUser: {
    display: 'flex',
    flexDirection: 'row',
    alignIs: 'center',
    marginBottom: '10px',
  },
  title: {
    fontSize: 24,
    marginBottom: 16,
  },
  deleteButton: {
    color: 'red',
    marginLeft: 8,
  },
});

export default DatabaseManager;
