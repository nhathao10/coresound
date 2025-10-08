const mongoose = require('mongoose');
const Artist = require('./models/Artist');

// Connect to MongoDB
const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/coresound';
mongoose.connect(mongoURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('MongoDB connected!'))
.catch(err => console.error('MongoDB connection error:', err));

const sampleArtists = [
  {
    name: 'The Weeknd',
    avatar: '/uploads/artists/the-weeknd.jpg',
    bio: 'Canadian singer, songwriter, and record producer known for his distinctive voice and dark R&B style.',
    genre: 'R&B',
    followers: 0
  },
  {
    name: 'Taylor Swift',
    avatar: '/uploads/artists/taylor-swift.jpg',
    bio: 'American singer-songwriter known for her narrative songwriting and genre-spanning discography.',
    genre: 'Pop',
    followers: 0
  },
  {
    name: 'Drake',
    avatar: '/uploads/artists/drake.jpg',
    bio: 'Canadian rapper, singer, and actor known for his melodic rap style and commercial success.',
    genre: 'Hip-Hop',
    followers: 0
  },
  {
    name: 'Billie Eilish',
    avatar: '/uploads/artists/billie-eilish.jpg',
    bio: 'American singer-songwriter known for her unique style and whispery vocals.',
    genre: 'Alternative',
    followers: 0
  },
  {
    name: 'Ed Sheeran',
    avatar: '/uploads/artists/ed-sheeran.jpg',
    bio: 'English singer-songwriter known for his acoustic guitar and loop pedal performances.',
    genre: 'Pop',
    followers: 0
  },
  {
    name: 'Ariana Grande',
    avatar: '/uploads/artists/ariana-grande.jpg',
    bio: 'American singer, songwriter, and actress known for her four-octave vocal range.',
    genre: 'Pop',
    followers: 0
  },
  {
    name: 'Post Malone',
    avatar: '/uploads/artists/post-malone.jpg',
    bio: 'American rapper, singer, and songwriter known for blending hip-hop and pop.',
    genre: 'Hip-Hop',
    followers: 0
  },
  {
    name: 'Dua Lipa',
    avatar: '/uploads/artists/dua-lipa.jpg',
    bio: 'English-Albanian singer and songwriter known for her disco-influenced pop music.',
    genre: 'Pop',
    followers: 0
  }
];

async function createSampleArtists() {
  try {
    // Clear existing artists
    await Artist.deleteMany({});
    console.log('Cleared existing artists');

    // Create sample artists
    const createdArtists = await Artist.insertMany(sampleArtists);
    console.log(`Created ${createdArtists.length} sample artists`);

    // Print created artists
    createdArtists.forEach(artist => {
      console.log(`- ${artist.name} (${artist.genre})`);
    });

    console.log('\nSample artists created successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error creating sample artists:', error);
    process.exit(1);
  }
}

createSampleArtists();


