"use client";

import { useState, useEffect, useCallback } from 'react';

/**
 * Custom hook to fetch and manage data from a static JSON file.
 * Changes are kept in memory only and don't persist between sessions.
 * 
 * @returns {Object} { data, loading, error, saveData, resetData }
 */
export default function usePersistentData() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Initialize data on mount
  useEffect(() => {
    const initializeData = async () => {
      try {
        // Fetch seed data from public folder
        const response = await fetch('/data.json');
        if (!response.ok) {
          throw new Error('Failed to load data');
        }

        const seedData = await response.json();
        setData(seedData);
      } catch (err) {
        console.error('Error loading data:', err);
        setError(err.message || 'An unexpected error occurred');
      } finally {
        setLoading(false);
      }
    };

    initializeData();
  }, []);

  // Function to update data in memory only (no persistence)
  const saveData = useCallback((newData) => {
    try {
      setData(newData);
      return true;
    } catch (err) {
      console.error('Error updating data:', err);
      setError('Failed to update data');
      return false;
    }
  }, []);

  // Function to reset data back to the original seed
  const resetData = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch('/data.json');
      if (!response.ok) throw new Error('Failed to reload data');

      const seedData = await response.json();
      setData(seedData);
      setError(null);
    } catch (err) {
      console.error('Error resetting data:', err);
      setError('Failed to reset data');
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    data,
    loading,
    error,
    saveData,
    resetData
  };
}