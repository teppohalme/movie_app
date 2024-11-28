import React, { useState, createContext, useEffect, useContext } from 'react';
import { View, TextInput, FlatList, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/Ionicons';
import axios from 'axios';
import API_KEY from './config';

const MovieContext = createContext();

export default function App() {
  const [watchlist, setWatchlist] = useState([]);
  const [watchedMovies, setWatchedMovies] = useState([]);


  const fetchWatchlist = async () => {
    try {
      const response = await axios.get(
        'https://movieapp-67107-default-rtdb.europe-west1.firebasedatabase.app/watchlist.json'
      );
      const movieList = response.data
        ? Object.entries(response.data).map(([firebaseId, movie]) => ({ ...movie, firebaseId }))
        : [];
      setWatchlist(movieList);
    } catch (error) {
      console.error('Error fetching watchlist:', error.message);
    }
  };

  const addToWatchlist = async (movie) => {
    try {
      const response = await axios.post(
        'https://movieapp-67107-default-rtdb.europe-west1.firebasedatabase.app/watchlist.json',
        movie
      );
      const firebaseId = response.data.name;
      setWatchlist((prevList) => [...prevList, { ...movie, firebaseId }]);
    } catch (error) {
      console.error('Error adding movie to watchlist:', error.message);
    }
  };
  
  const addToWatched = async (movie) => {
    try {
      const response = await axios.post(
        'https://movieapp-67107-default-rtdb.europe-west1.firebasedatabase.app/watched.json',
        movie
      );
      const firebaseId = response.data.name;
      setWatchedMovies((prevMovies) => [...prevMovies, { ...movie, firebaseId }]);
    } catch (error) {
      console.error('Error adding movie to watched:', error.message);
    }
  };
  

  const fetchWatchedMovies = async () => {
    try {
      const response = await axios.get(
        'https://movieapp-67107-default-rtdb.europe-west1.firebasedatabase.app/watched.json'
      );
      const movieList = response.data
        ? Object.entries(response.data).map(([firebaseId, movie]) => ({ ...movie, firebaseId }))
        : [];
      setWatchedMovies(movieList);
    } catch (error) {
      console.error('Error fetching watched movies:', error.message);
    }
  };

  const deleteMovie = async (firebaseId, category) => {
    try {
      const endpoint = `https://movieapp-67107-default-rtdb.europe-west1.firebasedatabase.app/${category}/${firebaseId}.json`;
      await axios.delete(endpoint);

      if (category === 'watchlist') {
        setWatchlist((prevList) => prevList.filter((movie) => movie.firebaseId !== firebaseId));
      } else if (category === 'watched') {
        setWatchedMovies((prevMovies) => prevMovies.filter((movie) => movie.firebaseId !== firebaseId));
      }
    } catch (error) {
      console.error(`Error deleting movie from ${category}:`, error.message);
    }
  };

  return (
    <MovieContext.Provider
      value={{
        watchlist,
        watchedMovies,
        fetchWatchlist,
        fetchWatchedMovies,
        deleteMovie,
        addToWatchlist,
        addToWatched,
      }}
    >
      <NavigationContainer>
        <Tab.Navigator
          screenOptions={({ route }) => ({
            tabBarIcon: ({ focused, color, size }) => {
              let iconName;
              if (route.name === 'Watch-list') {
                iconName = focused ? 'list-circle' : 'list-circle-outline';
              } else if (route.name === 'Search') {
                iconName = focused ? 'search' : 'search-outline';
              } else if (route.name === 'My Movies') {
                iconName = focused ? 'film' : 'film-outline';
              }
              return <Icon name={iconName} size={size} color={color} />;
            },
            tabBarActiveTintColor: 'tomato',
            tabBarInactiveTintColor: 'gray',
          })}
        >
          <Tab.Screen name="Watch-list" component={WatchListScreen} />
          <Tab.Screen name="Search" component={SearchScreen} />
          <Tab.Screen name="My Movies" component={MyMoviesScreen} />
        </Tab.Navigator>
      </NavigationContainer>
    </MovieContext.Provider>
  );
}


const Tab = createBottomTabNavigator();

const WatchListScreen = () => {
  const { watchlist, fetchWatchlist, deleteMovie } = useContext(MovieContext);

  useEffect(() => {
    fetchWatchlist();
  }, []);

  const renderMovieItem = ({ item }) => (
    <View style={styles.movieItem}>
      <Image
        style={styles.poster}
        source={{
          uri: item.poster_path
            ? `https://image.tmdb.org/t/p/w500${item.poster_path}`
            : 'https://via.placeholder.com/100x150',
        }}
      />
      <View style={styles.movieDetails}>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.overview}>{item.overview?.substring(0, 100)}...</Text>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => deleteMovie(item.firebaseId, 'watchlist')}
        >
          <Text style={styles.deleteButtonText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.screen}>
      <Text style={styles.heading}>My Watch-list</Text>
      <FlatList
        data={watchlist}
        keyExtractor={(item) => item.firebaseId}
        renderItem={renderMovieItem}
      />
    </View>
  );
};


const MyMoviesScreen = () => {
  const { watchedMovies, fetchWatchedMovies, deleteMovie } = useContext(MovieContext);

  useEffect(() => {
    fetchWatchedMovies();
  }, []);

  const renderMovieItem = ({ item }) => (
    <View style={styles.movieItem}>
      <Image
        style={styles.poster}
        source={{
          uri: item.poster_path
            ? `https://image.tmdb.org/t/p/w500${item.poster_path}`
            : 'https://via.placeholder.com/100x150',
        }}
      />
      <View style={styles.movieDetails}>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.overview}>{item.overview?.substring(0, 100)}...</Text>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => deleteMovie(item.firebaseId, 'watched')}
        >
          <Text style={styles.deleteButtonText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.screen}>
      <Text style={styles.heading}>Movies I've Watched</Text>
      <FlatList
        data={watchedMovies}
        keyExtractor={(item) => item.firebaseId}
        renderItem={renderMovieItem}
      />
    </View>
  );
};


const SearchScreen = () => {
  const [query, setQuery] = useState('');
  const [movies, setMovies] = useState([]);
  const { addToWatchlist, addToWatched } = useContext(MovieContext);

  const searchMovies = async () => {
    try {
      const response = await axios.get('https://api.themoviedb.org/3/search/movie', {
        params: {
          api_key: API_KEY,
          query: query,
        },
      });
      setMovies(response.data.results);
    } catch (error) {
      console.error('Error fetching movies:', error);
    }
  };

  const renderMovieItem = ({ item }) => (
    <View style={styles.movieItem}>
      <Image
        style={styles.poster}
        source={{
          uri: item.poster_path
            ? `https://image.tmdb.org/t/p/w500${item.poster_path}`
            : 'https://via.placeholder.com/100x150',
        }}
      />
      <View style={styles.movieDetails}>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.overview}>{item.overview?.substring(0, 100)}...</Text>
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.button}
            onPress={() => addToWatchlist(item)}
          >
            <Text style={styles.buttonText}>Add to Watchlist</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.button}
            onPress={() => addToWatched(item)}
          >
            <Text style={styles.buttonText}>Watched</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.searchBar}
        placeholder="Search for movies..."
        value={query}
        onChangeText={setQuery}
        onSubmitEditing={searchMovies}
      />
      <FlatList
        data={movies}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderMovieItem}
      />
    </View>
  );
};



const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
    backgroundColor: '#fff',
  },
  searchBar: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    marginBottom: 10,
  },
  movieItem: {
    flexDirection: 'row',
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    paddingBottom: 10,
  },
  poster: {
    width: 100,
    height: 150,
    borderRadius: 8,
    marginRight: 10,
  },
  movieDetails: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  overview: {
    fontSize: 14,
    color: '#555',
    marginBottom: 10,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  button: {
    backgroundColor: 'tomato',
    borderRadius: 5,
    paddingVertical: 5,
    paddingHorizontal: 10,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  screen: {
    flex: 1,
    padding: 10,
    backgroundColor: '#fff',
  },
  heading: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  deleteButton: {
    backgroundColor: 'red',
    borderRadius: 5,
    paddingVertical: 5,
    paddingHorizontal: 10,
    marginTop: 10,
    width: 60,
  },
  deleteButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});
