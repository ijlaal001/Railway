// Firebase Configuration
// Replace with your actual Firebase config
const firebaseConfig = {
    apiKey: "your-api-key",
    authDomain: "your-project.firebaseapp.com",
    projectId: "your-project-id",
    storageBucket: "your-project.appspot.com",
    messagingSenderId: "123456789",
    appId: "your-app-id"
};

// Initialize Firebase
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js';
import { getAuth, signInWithPopup, GoogleAuthProvider, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js';
import { getFirestore, doc, setDoc, getDoc, getDocs, collection, addDoc, deleteDoc } from 'https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js';

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

// Global user state
let currentUser = null;

// Auth state observer
onAuthStateChanged(auth, (user) => {
    currentUser = user;
    updateAuthUI();
});

// Update authentication UI across all pages
function updateAuthUI() {
    const authSection = document.getElementById('auth-section');
    if (!authSection) return;
    
    if (currentUser) {
        authSection.innerHTML = `
            <div class="auth-container">
                <div class="user-info">
                    <span>Hello, ${currentUser.displayName || currentUser.email}</span>
                </div>
                <button class="btn btn-secondary" onclick="handleLogout()">Logout</button>
            </div>
        `;
    } else {
        authSection.innerHTML = `
            <div class="login-section">
                <button class="btn" onclick="handleGoogleLogin()">Login with Google</button>
                <button class="btn btn-secondary" onclick="showEmailLogin()">Email Login</button>
            </div>
        `;
    }
}

// Authentication functions
async function handleGoogleLogin() {
    try {
        await signInWithPopup(auth, googleProvider);
    } catch (error) {
        alert('Login failed: ' + error.message);
    }
}

async function handleLogout() {
    try {
        await signOut(auth);
    } catch (error) {
        alert('Logout failed: ' + error.message);
    }
}

function showEmailLogin() {
    const email = prompt('Enter your email:');
    const password = prompt('Enter your password:');
    
    if (email && password) {
        signInWithEmailAndPassword(auth, email, password)
            .catch(() => {
                // If login fails, try creating account
                createUserWithEmailAndPassword(auth, email, password)
                    .catch(error => alert('Authentication failed: ' + error.message));
            });
    }
}

// Firestore operations
async function addToFavorites(train) {
    if (!currentUser) {
        alert('Please login to add favorites');
        return;
    }
    
    try {
        const favoritesRef = collection(db, 'users', currentUser.uid, 'favorites');
        await addDoc(favoritesRef, {
            trainNumber: train.number,
            trainName: train.name,
            from: train.from,
            to: train.to,
            createdAt: new Date()
        });
        alert('Train added to favorites!');
    } catch (error) {
        alert('Failed to add favorite: ' + error.message);
    }
}

async function getFavorites() {
    if (!currentUser) return [];
    
    try {
        const favoritesRef = collection(db, 'users', currentUser.uid, 'favorites');
        const snapshot = await getDocs(favoritesRef);
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    } catch (error) {
        console.error('Failed to fetch favorites:', error);
        return [];
    }
}

async function removeFavorite(favoriteId) {
    if (!currentUser) return;
    
    try {
        const favoriteRef = doc(db, 'users', currentUser.uid, 'favorites', favoriteId);
        await deleteDoc(favoriteRef);
        alert('Removed from favorites!');
    } catch (error) {
        alert('Failed to remove favorite: ' + error.message);
    }
}

// API functions
async function searchTrains(from, to) {
    try {
        const response = await fetch(`/search_trains?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`);
        const data = await response.json();
        return data;
    } catch (error) {
        throw new Error('Failed to search trains');
    }
}

async function getPNRStatus(pnr) {
    try {
        const response = await fetch(`/pnr_status?pnr=${encodeURIComponent(pnr)}`);
        const data = await response.json();
        return data;
    } catch (error) {
        throw new Error('Failed to get PNR status');
    }
}

async function getLiveStatus(trainNumber) {
    try {
        const response = await fetch(`/live_status?train=${encodeURIComponent(trainNumber)}`);
        const data = await response.json();
        return data;
    } catch (error) {
        throw new Error('Failed to get live status');
    }
}

// Train Search Vue App
if (document.getElementById('train-search-app')) {
    const { createApp } = Vue;
    
    createApp({
        data() {
            return {
                from: '',
                to: '',
                trains: [],
                loading: false,
                error: null
            };
        },
        methods: {
            async searchTrains() {
                if (!this.from.trim() || !this.to.trim()) {
                    this.error = 'Please enter both from and to stations';
                    return;
                }
                
                this.loading = true;
                this.error = null;
                
                try {
                    const result = await searchTrains(this.from, this.to);
                    if (result.error) {
                        this.error = result.error;
                    } else {
                        this.trains = result.trains || [];
                    }
                } catch (error) {
                    this.error = error.message;
                } finally {
                    this.loading = false;
                }
            },
            async addToFavorites(train) {
                await addToFavorites(train);
            },
            swapStations() {
                const temp = this.from;
                this.from = this.to;
                this.to = temp;
            }
        },
        template: `
            <div class="container">
                <div class="card">
                    <h2>Search Trains</h2>
                    <form @submit.prevent="searchTrains">
                        <div class="form-row">
                            <div class="form-group">
                                <label for="from">From Station</label>
                                <input 
                                    type="text" 
                                    id="from"
                                    class="form-control" 
                                    v-model="from" 
                                    placeholder="Enter departure station"
                                    required
                                >
                            </div>
                            <div class="form-group">
                                <label for="to">To Station</label>
                                <input 
                                    type="text" 
                                    id="to"
                                    class="form-control" 
                                    v-model="to" 
                                    placeholder="Enter destination station"
                                    required
                                >
                            </div>
                        </div>
                        <div class="form-group">
                            <button type="submit" class="btn" :disabled="loading">
                                {{ loading ? 'Searching...' : 'Search Trains' }}
                            </button>
                            <button type="button" class="btn btn-secondary" @click="swapStations">
                                Swap Stations
                            </button>
                        </div>
                    </form>
                    
                    <div v-if="error" class="error">{{ error }}</div>
                    
                    <div v-if="loading" class="loading">Searching for trains...</div>
                    
                    <div v-if="trains.length > 0" class="train-list">
                        <div v-for="train in trains" :key="train.number" class="train-item">
                            <div class="train-info">
                                <h3>{{ train.name }}</h3>
                                <div class="train-number">{{ train.number }}</div>
                            </div>
                            <div class="time-info">
                                <div class="time">{{ train.departure }}</div>
                                <div>{{ train.from }}</div>
                            </div>
                            <div class="time-info">
                                <div class="time">{{ train.arrival }}</div>
                                <div>{{ train.to }}</div>
                            </div>
                            <div class="duration">{{ train.duration }}</div>
                            <div>
                                <button class="btn btn-success" @click="addToFavorites(train)">
                                    Add to Favorites
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `
    }).mount('#train-search-app');
}

// PNR Status Vue App
if (document.getElementById('pnr-app')) {
    const { createApp } = Vue;
    
    createApp({
        data() {
            return {
                pnr: '',
                pnrResult: null,
                loading: false,
                error: null
            };
        },
        methods: {
            async checkPNR() {
                if (!this.pnr.trim()) {
                    this.error = 'Please enter PNR number';
                    return;
                }
                
                if (this.pnr.length !== 10) {
                    this.error = 'PNR number must be 10 digits';
                    return;
                }
                
                this.loading = true;
                this.error = null;
                this.pnrResult = null;
                
                try {
                    const result = await getPNRStatus(this.pnr);
                    if (result.error) {
                        this.error = result.error;
                    } else {
                        this.pnrResult = result;
                    }
                } catch (error) {
                    this.error = error.message;
                } finally {
                    this.loading = false;
                }
            },
            getStatusClass(status) {
                if (status === 'Confirmed') return 'status confirmed';
                if (status.includes('RAC')) return 'status rac';
                if (status.includes('WL')) return 'status waiting';
                if (status === 'Cancelled') return 'status cancelled';
                return 'status';
            }
        },
        template: `
            <div class="container">
                <div class="card">
                    <h2>PNR Status</h2>
                    <form @submit.prevent="checkPNR">
                        <div class="form-group">
                            <label for="pnr">PNR Number</label>
                            <input 
                                type="text" 
                                id="pnr"
                                class="form-control" 
                                v-model="pnr" 
                                placeholder="Enter 10-digit PNR number"
                                maxlength="10"
                                pattern="[0-9]{10}"
                                required
                            >
                        </div>
                        <div class="form-group">
                            <button type="submit" class="btn" :disabled="loading">
                                {{ loading ? 'Checking...' : 'Check PNR Status' }}
                            </button>
                        </div>
                    </form>
                    
                    <div v-if="error" class="error">{{ error }}</div>
                    
                    <div v-if="loading" class="loading">Checking PNR status...</div>
                    
                    <div v-if="pnrResult" class="train-item mt-2">
                        <div class="train-info">
                            <h3>{{ pnrResult.train_name }}</h3>
                            <div class="train-number">{{ pnrResult.train_number }}</div>
                            <div>PNR: {{ pnrResult.pnr }}</div>
                        </div>
                        <div>
                            <strong>Date:</strong> {{ pnrResult.date }}<br>
                            <strong>Route:</strong> {{ pnrResult.from }} → {{ pnrResult.to }}<br>
                            <strong>Class:</strong> {{ pnrResult.class }}
                        </div>
                        <div>
                            <div :class="getStatusClass(pnrResult.status)">{{ pnrResult.status }}</div>
                            <div v-if="pnrResult.seat" class="mt-1">
                                <strong>Seat:</strong> {{ pnrResult.seat }}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `
    }).mount('#pnr-app');
}

// Live Status Vue App
if (document.getElementById('live-status-app')) {
    const { createApp } = Vue;
    
    createApp({
        data() {
            return {
                trainNumber: '',
                statusResult: null,
                loading: false,
                error: null
            };
        },
        methods: {
            async checkLiveStatus() {
                if (!this.trainNumber.trim()) {
                    this.error = 'Please enter train number';
                    return;
                }
                
                this.loading = true;
                this.error = null;
                this.statusResult = null;
                
                try {
                    const result = await getLiveStatus(this.trainNumber);
                    if (result.error) {
                        this.error = result.error;
                    } else {
                        this.statusResult = result;
                    }
                } catch (error) {
                    this.error = error.message;
                } finally {
                    this.loading = false;
                }
            },
            getStatusClass(status) {
                if (status === 'On Time') return 'status on-time';
                if (status.includes('Late')) return 'status delayed';
                if (status === 'Cancelled') return 'status cancelled';
                return 'status';
            }
        },
        template: `
            <div class="container">
                <div class="card">
                    <h2>Live Train Status</h2>
                    <form @submit.prevent="checkLiveStatus">
                        <div class="form-group">
                            <label for="trainNumber">Train Number</label>
                            <input 
                                type="text" 
                                id="trainNumber"
                                class="form-control" 
                                v-model="trainNumber" 
                                placeholder="Enter train number (e.g., 12345)"
                                required
                            >
                        </div>
                        <div class="form-group">
                            <button type="submit" class="btn" :disabled="loading">
                                {{ loading ? 'Checking...' : 'Check Live Status' }}
                            </button>
                        </div>
                    </form>
                    
                    <div v-if="error" class="error">{{ error }}</div>
                    
                    <div v-if="loading" class="loading">Checking live status...</div>
                    
                    <div v-if="statusResult" class="train-item mt-2">
                        <div class="train-info">
                            <h3>{{ statusResult.train_name }}</h3>
                            <div class="train-number">{{ statusResult.train_number }}</div>
                            <div>Last Updated: {{ statusResult.last_updated }}</div>
                        </div>
                        <div>
                            <strong>Current Station:</strong> {{ statusResult.current_station }}<br>
                            <strong>Next Station:</strong> {{ statusResult.next_station }}<br>
                            <strong>Scheduled:</strong> {{ statusResult.scheduled_arrival }}<br>
                            <strong>Expected:</strong> {{ statusResult.expected_arrival }}
                        </div>
                        <div>
                            <div :class="getStatusClass(statusResult.status)">{{ statusResult.status }}</div>
                        </div>
                    </div>
                </div>
            </div>
        `
    }).mount('#live-status-app');
}

// Favorites Vue App
if (document.getElementById('favorites-app')) {
    const { createApp } = Vue;
    
    createApp({
        data() {
            return {
                favorites: [],
                loading: false,
                error: null
            };
        },
        async mounted() {
            // Watch for auth state changes
            onAuthStateChanged(auth, async (user) => {
                if (user) {
                    await this.loadFavorites();
                } else {
                    this.favorites = [];
                }
            });
            
            // Load favorites if already logged in
            if (currentUser) {
                await this.loadFavorites();
            }
        },
        methods: {
            async loadFavorites() {
                this.loading = true;
                this.error = null;
                
                try {
                    this.favorites = await getFavorites();
                } catch (error) {
                    this.error = 'Failed to load favorites';
                } finally {
                    this.loading = false;
                }
            },
            async removeFavorite(favoriteId) {
                if (confirm('Remove this train from favorites?')) {
                    await removeFavorite(favoriteId);
                    await this.loadFavorites();
                }
            }
        },
        template: `
            <div class="container">
                <div class="card">
                    <h2>My Favorites</h2>
                    
                    <div v-if="!currentUser" class="empty-state">
                        <h3>Please login to view your favorites</h3>
                        <p>Login using the button in the navigation bar</p>
                    </div>
                    
                    <div v-else-if="loading" class="loading">Loading favorites...</div>
                    
                    <div v-else-if="error" class="error">{{ error }}</div>
                    
                    <div v-else-if="favorites.length === 0" class="empty-state">
                        <h3>No favorites yet</h3>
                        <p>Search for trains and add them to your favorites!</p>
                        <a href="/" class="btn">Search Trains</a>
                    </div>
                    
                    <div v-else class="train-list">
                        <div v-for="favorite in favorites" :key="favorite.id" class="train-item">
                            <div class="train-info">
                                <h3>{{ favorite.trainName }}</h3>
                                <div class="train-number">{{ favorite.trainNumber }}</div>
                            </div>
                            <div>
                                <strong>Route:</strong><br>
                                {{ favorite.from }} → {{ favorite.to }}
                            </div>
                            <div>
                                <strong>Added:</strong><br>
                                {{ new Date(favorite.createdAt.seconds * 1000).toLocaleDateString() }}
                            </div>
                            <div>
                                <button class="btn btn-danger" @click="removeFavorite(favorite.id)">
                                    Remove
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `
    }).mount('#favorites-app');
}

// Make functions globally available
window.handleGoogleLogin = handleGoogleLogin;
window.handleLogout = handleLogout;
window.showEmailLogin = showEmailLogin;