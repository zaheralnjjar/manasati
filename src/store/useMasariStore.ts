import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '../services/supabase';
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
    selectedTrip: Trip | null;
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
    selectTrip: (trip: Trip | null) => void;
    deleteTrip: (id: string) => void;
    updateSettings: (settings: Partial<MasariState['settings']>) => void;

    // Saved Locations Actions
    saveCurrentLocation: (
        name: string,
        category: SavedLocation['category'],
        icon?: SavedLocation['icon'],
        notes?: string,
        photo?: string
    ) => Promise<void>;
    saveLocationFromCoords: (
        lat: number,
        lng: number,
        address?: string,
        category?: SavedLocation['category']
    ) => Promise<void>;
    addSavedLocation: (location: Omit<SavedLocation, 'id' | 'savedAt'>) => Promise<void>;
    updateSavedLocation: (id: string, updates: Partial<SavedLocation>) => Promise<void>;
    deleteSavedLocation: (id: string) => Promise<void>;
    initialize: () => Promise<void>;
}

export const useMasariStore = create<MasariState>()(
    persist(
        (set, get) => ({
            isTracking: false,
            currentLocation: null,
            currentTrip: null,
            selectedTrip: null,
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
                    id: Date.now().toString() + Math.random().toString(36).substring(2),
                    startTime: Date.now(),
                    points: [],
                    distance: 0
                };
                set({ isTracking: true, currentTrip: newTrip, selectedTrip: null });
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

            selectTrip: (trip) => {
                set({ selectedTrip: trip });
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
            saveCurrentLocation: async (name, category, icon = 'pin', notes = '', photo) => {
                try {
                    const { currentLocation, savedLocations } = get();
                    if (!currentLocation) return;

                    const { data: { user } } = await supabase.auth.getUser();
                    if (!user) return;

                    const newLocation = {
                        user_id: user.id,
                        name,
                        lat: currentLocation.lat,
                        lng: currentLocation.lng,
                        category,
                        icon,
                        photo,
                        notes,
                        saved_at: new Date().toISOString()
                    };

                    const { data, error } = await supabase
                        .from('saved_locations')
                        .insert(newLocation)
                        .select()
                        .single();

                    if (error) throw error;

                    if (data) {
                        const saved: SavedLocation = {
                            id: data.id,
                            name: data.name,
                            lat: data.lat,
                            lng: data.lng,
                            category: data.category,
                            icon: data.icon,
                            photo: data.photo,
                            notes: data.notes,
                            savedAt: new Date(data.saved_at).getTime()
                        };
                        set({ savedLocations: [...savedLocations, saved] });
                    }
                } catch (error) {
                    console.error('Error saving current location:', error);
                }
            },

            saveLocationFromCoords: async (lat, lng, address = '', category = 'place') => {
                try {
                    const { savedLocations } = get();
                    const { data: { user } } = await supabase.auth.getUser();
                    if (!user) return;

                    // Generate dynamic name from address or coordinates
                    const generateName = () => {
                        if (address) {
                            const parts = address.split(',');
                            return parts[0].trim() || `موقع ${savedLocations.length + 1}`;
                        }
                        return `موقع ${lat.toFixed(4)}, ${lng.toFixed(4)}`;
                    };

                    const newLocation = {
                        user_id: user.id,
                        name: generateName(),
                        lat,
                        lng,
                        category,
                        icon: category === 'parking' ? 'car' : 'pin',
                        address,
                        saved_at: new Date().toISOString()
                    };

                    const { data, error } = await supabase
                        .from('saved_locations')
                        .insert(newLocation)
                        .select()
                        .single();

                    if (error) throw error;

                    if (data) {
                        const saved: SavedLocation = {
                            id: data.id,
                            name: data.name,
                            lat: data.lat,
                            lng: data.lng,
                            category: data.category,
                            icon: data.icon,
                            address: data.address,
                            photo: data.photo,
                            notes: data.notes,
                            savedAt: new Date(data.saved_at).getTime()
                        };
                        set({ savedLocations: [...savedLocations, saved] });
                    }
                } catch (error) {
                    console.error('Error saving location from coords:', error);
                }
            },

            addSavedLocation: async (location) => {
                try {
                    const { data: { user } } = await supabase.auth.getUser();
                    if (!user) return;

                    const newLocation = {
                        user_id: user.id,
                        name: location.name,
                        lat: location.lat,
                        lng: location.lng,
                        category: location.category,
                        icon: location.icon,
                        address: location.address,
                        photo: location.photo,
                        notes: location.notes,
                        saved_at: new Date().toISOString()
                    };

                    const { data, error } = await supabase
                        .from('saved_locations')
                        .insert(newLocation)
                        .select()
                        .single();

                    if (error) throw error;

                    if (data) {
                        const saved: SavedLocation = {
                            id: data.id,
                            name: data.name,
                            lat: data.lat,
                            lng: data.lng,
                            category: data.category,
                            icon: data.icon,
                            address: data.address,
                            photo: data.photo,
                            notes: data.notes,
                            savedAt: new Date(data.saved_at).getTime()
                        };
                        set(state => ({
                            savedLocations: [...state.savedLocations, saved]
                        }));
                    }
                } catch (error) {
                    console.error('Error adding saved location:', error);
                }
            },

            updateSavedLocation: async (id, updates) => {
                try {
                    const dbUpdates: Partial<SavedLocation> = {};
                    if (updates.name !== undefined) dbUpdates.name = updates.name;
                    if (updates.category !== undefined) dbUpdates.category = updates.category;
                    if (updates.icon !== undefined) dbUpdates.icon = updates.icon;
                    if (updates.notes !== undefined) dbUpdates.notes = updates.notes;
                    if (updates.photo !== undefined) dbUpdates.photo = updates.photo;
                    if (updates.address !== undefined) dbUpdates.address = updates.address;

                    const { error } = await supabase
                        .from('saved_locations')
                        .update(dbUpdates)
                        .eq('id', id);

                    if (error) throw error;

                    set(state => ({
                        savedLocations: state.savedLocations.map(loc =>
                            loc.id === id ? { ...loc, ...updates } : loc
                        )
                    }));
                } catch (error) {
                    console.error('Error updating saved location:', error);
                }
            },

            deleteSavedLocation: async (id) => {
                try {
                    const { error } = await supabase
                        .from('saved_locations')
                        .delete()
                        .eq('id', id);

                    if (error) throw error;

                    set(state => ({
                        savedLocations: state.savedLocations.filter(loc => loc.id !== id)
                    }));
                } catch (error) {
                    console.error('Error deleting saved location:', error);
                }
            },

            initialize: async () => {
                try {
                    const { data: { user } } = await supabase.auth.getUser();
                    if (!user) return;

                    const { data, error } = await supabase
                        .from('saved_locations')
                        .select('*')
                        .order('saved_at', { ascending: false });

                    if (error) throw error;

                    if (data) {
                        const locations: SavedLocation[] = data.map(item => ({
                            id: item.id,
                            name: item.name,
                            lat: item.lat,
                            lng: item.lng,
                            category: item.category,
                            icon: item.icon,
                            address: item.address,
                            photo: item.photo,
                            notes: item.notes,
                            savedAt: new Date(item.saved_at).getTime()
                        }));
                        set({ savedLocations: locations });
                    }
                } catch (error) {
                    console.error('Error initializing saved locations:', error);
                }
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
