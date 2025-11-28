import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { SavedLocation } from '../types';
export type { SavedLocation };

export interface LocationPoint {
    id: string;
    lat: number;
    lng: number;
    timestamp: number;
    speed?: number; // km/h
    heading?: number; // degrees
    accuracy?: number; // meters
}

export interface Trip {
    id: string;
    startTime: number;
    endTime?: number;
    points: LocationPoint[];
    distance: number; // km
    avgSpeed?: number; // km/h
    maxSpeed?: number; // km/h
    startAddress?: string;
    endAddress?: string;
    notes?: string;
}

interface MasariState {
    isTracking: boolean;
    currentLocation: LocationPoint | null;
    currentTrip: Trip | null;
    tripHistory: Trip[];
    savedLocations: SavedLocation[];
    settings: {
        minDistance: number; // meters
        minTime: number; // seconds
        highAccuracy: boolean;
        autoStop: boolean; // auto stop after x minutes of inactivity
    };

    // Actions
    startTracking: () => void;
    stopTracking: () => void;
    updateLocation: (location: LocationPoint) => void;
    saveTrip: (trip: Trip) => void;
    deleteTrip: (id: string) => void;
    updateSettings: (settings: Partial<MasariState['settings']>) => void;

    // Saved Locations Actions
    saveCurrentLocation: (
        name: string,
        category: SavedLocation['category'],
        icon?: SavedLocation['icon'],
        notes?: string,
        photo?: string
    ) => void;
    saveLocationFromCoords: (
        lat: number,
        lng: number,
        address?: string,
        category?: SavedLocation['category']
    ) => void;
    addSavedLocation: (location: Omit<SavedLocation, 'id' | 'savedAt'>) => void;
    updateSavedLocation: (id: string, updates: Partial<SavedLocation>) => void;
    deleteSavedLocation: (id: string) => void;
}

export const useMasariStore = create<MasariState>()(
    persist(
        (set, get) => ({
            isTracking: false,
            currentLocation: null,
            currentTrip: null,
            tripHistory: [],
            savedLocations: [],
            settings: {
                minDistance: 10,
                minTime: 5,
                highAccuracy: true,
                autoStop: true
            },

            startTracking: () => {
                const newTrip: Trip = {
                    id: crypto.randomUUID(),
                    startTime: Date.now(),
                    points: [],
                    distance: 0
                };
                set({ isTracking: true, currentTrip: newTrip });
            },

            stopTracking: () => {
                const { currentTrip, tripHistory } = get();
                if (currentTrip && currentTrip.points.length > 0) {
                    const completedTrip = {
                        ...currentTrip,
                        endTime: Date.now()
                    };
                    set({
                        isTracking: false,
                        currentTrip: null,
                        tripHistory: [completedTrip, ...tripHistory]
                    });
                } else {
                    set({ isTracking: false, currentTrip: null });
                }
            },

            updateLocation: (location) => {
                const { isTracking, currentTrip } = get();
                set({ currentLocation: location });

                if (isTracking && currentTrip) {
                    // Calculate distance from last point
                    let addedDistance = 0;
                    if (currentTrip.points.length > 0) {
                        const lastPoint = currentTrip.points[currentTrip.points.length - 1];
                        addedDistance = calculateDistance(
                            lastPoint.lat, lastPoint.lng,
                            location.lat, location.lng
                        );
                    }

                    const updatedTrip = {
                        ...currentTrip,
                        points: [...currentTrip.points, location],
                        distance: currentTrip.distance + addedDistance
                    };

                    set({ currentTrip: updatedTrip });
                }
            },

            saveTrip: (trip) => {
                set(state => ({
                    tripHistory: state.tripHistory.map(t => t.id === trip.id ? trip : t)
                }));
            },

            deleteTrip: (id) => {
                set(state => ({
                    tripHistory: state.tripHistory.filter(t => t.id !== id)
                }));
            },

            updateSettings: (newSettings) => {
                set(state => ({
                    settings: { ...state.settings, ...newSettings }
                }));
            },

            // Saved Locations Actions
            saveCurrentLocation: (name, category, icon = 'pin', notes = '', photo) => {
                const { currentLocation, savedLocations } = get();
                if (!currentLocation) return;

                const newLocation: SavedLocation = {
                    id: crypto.randomUUID(),
                    name,
                    lat: currentLocation.lat,
                    lng: currentLocation.lng,
                    category,
                    icon,
                    photo,
                    notes,
                    savedAt: Date.now()
                };

                set({ savedLocations: [...savedLocations, newLocation] });
            },

            saveLocationFromCoords: (lat, lng, address = '', category = 'place') => {
                const { savedLocations } = get();

                // Generate dynamic name from address or coordinates
                const generateName = () => {
                    if (address) {
                        // Extract meaningful part from address (first part before comma)
                        const parts = address.split(',');
                        return parts[0].trim() || `موقع ${savedLocations.length + 1}`;
                    }
                    return `موقع ${lat.toFixed(4)}, ${lng.toFixed(4)}`;
                };

                const newLocation: SavedLocation = {
                    id: crypto.randomUUID(),
                    name: generateName(),
                    lat,
                    lng,
                    category,
                    icon: category === 'parking' ? 'car' : 'pin',
                    address,
                    savedAt: Date.now()
                };

                set({ savedLocations: [...savedLocations, newLocation] });
            },

            addSavedLocation: (location) => {
                const newLocation: SavedLocation = {
                    ...location,
                    id: crypto.randomUUID(),
                    savedAt: Date.now()
                };

                set(state => ({
                    savedLocations: [...state.savedLocations, newLocation]
                }));
            },

            updateSavedLocation: (id, updates) => {
                set(state => ({
                    savedLocations: state.savedLocations.map(loc =>
                        loc.id === id ? { ...loc, ...updates } : loc
                    )
                }));
            },

            deleteSavedLocation: (id) => {
                set(state => ({
                    savedLocations: state.savedLocations.filter(loc => loc.id !== id)
                }));
            }
        }),
        {
            name: 'masari-storage',
            partialize: (state) => ({
                tripHistory: state.tripHistory,
                savedLocations: state.savedLocations,
                settings: state.settings
            })
        }
    )
);

// Helper function to calculate distance between two coordinates in km (Haversine formula)
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Radius of the earth in km
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c; // Distance in km
    return d;
}

function deg2rad(deg: number): number {
    return deg * (Math.PI / 180);
}
