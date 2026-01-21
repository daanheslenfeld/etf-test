import React, { createContext, useContext, useReducer, useCallback, useMemo } from 'react';
import { getDefaultFilters, getFilterChips, hasActiveFilters } from '../data/filterDefinitions';

/**
 * FilterContext
 *
 * Centralized filter state management for ETF browsing
 * Can be used across multiple components without prop drilling
 */

const FilterContext = createContext(null);

// Initial state
const initialState = {
  category: 'equity',
  filters: getDefaultFilters('equity'),
  searchTerm: '',
  sortBy: 'name',
  sortDir: 'asc',
};

// Action types
const ACTIONS = {
  SET_CATEGORY: 'SET_CATEGORY',
  SET_FILTER: 'SET_FILTER',
  RESET_FILTERS: 'RESET_FILTERS',
  SET_SEARCH: 'SET_SEARCH',
  SET_SORT: 'SET_SORT',
  TOGGLE_SORT_DIR: 'TOGGLE_SORT_DIR',
  TOGGLE_PROVIDER: 'TOGGLE_PROVIDER',
  REMOVE_FILTER: 'REMOVE_FILTER',
};

// Reducer
function filterReducer(state, action) {
  switch (action.type) {
    case ACTIONS.SET_CATEGORY:
      return {
        ...state,
        category: action.payload,
        filters: getDefaultFilters(action.payload),
        searchTerm: '',
      };

    case ACTIONS.SET_FILTER:
      return {
        ...state,
        filters: {
          ...state.filters,
          [action.payload.filterId]: action.payload.value,
        },
      };

    case ACTIONS.TOGGLE_PROVIDER: {
      const currentProviders = state.filters.providers || [];
      const provider = action.payload;
      const newProviders = currentProviders.includes(provider)
        ? currentProviders.filter(p => p !== provider)
        : [...currentProviders, provider];
      return {
        ...state,
        filters: {
          ...state.filters,
          providers: newProviders,
        },
      };
    }

    case ACTIONS.REMOVE_FILTER: {
      const { filterId, value } = action.payload;
      if (filterId === 'providers') {
        return {
          ...state,
          filters: {
            ...state.filters,
            providers: (state.filters.providers || []).filter(p => p !== value),
          },
        };
      }
      return {
        ...state,
        filters: {
          ...state.filters,
          [filterId]: 'all',
        },
      };
    }

    case ACTIONS.RESET_FILTERS:
      return {
        ...state,
        filters: getDefaultFilters(state.category),
        searchTerm: '',
      };

    case ACTIONS.SET_SEARCH:
      return {
        ...state,
        searchTerm: action.payload,
      };

    case ACTIONS.SET_SORT:
      return {
        ...state,
        sortBy: action.payload,
        sortDir: state.sortBy === action.payload
          ? (state.sortDir === 'asc' ? 'desc' : 'asc')
          : 'asc',
      };

    case ACTIONS.TOGGLE_SORT_DIR:
      return {
        ...state,
        sortDir: state.sortDir === 'asc' ? 'desc' : 'asc',
      };

    default:
      return state;
  }
}

/**
 * FilterProvider Component
 */
export function FilterProvider({ children, initialCategory = 'equity' }) {
  const [state, dispatch] = useReducer(filterReducer, {
    ...initialState,
    category: initialCategory,
    filters: getDefaultFilters(initialCategory),
  });

  // Actions
  const setCategory = useCallback((category) => {
    dispatch({ type: ACTIONS.SET_CATEGORY, payload: category });
  }, []);

  const setFilter = useCallback((filterId, value) => {
    dispatch({ type: ACTIONS.SET_FILTER, payload: { filterId, value } });
  }, []);

  const toggleProvider = useCallback((provider) => {
    dispatch({ type: ACTIONS.TOGGLE_PROVIDER, payload: provider });
  }, []);

  const removeFilter = useCallback((filterId, value) => {
    dispatch({ type: ACTIONS.REMOVE_FILTER, payload: { filterId, value } });
  }, []);

  const resetFilters = useCallback(() => {
    dispatch({ type: ACTIONS.RESET_FILTERS });
  }, []);

  const setSearchTerm = useCallback((term) => {
    dispatch({ type: ACTIONS.SET_SEARCH, payload: term });
  }, []);

  const handleSort = useCallback((field) => {
    dispatch({ type: ACTIONS.SET_SORT, payload: field });
  }, []);

  // Derived state
  const chips = useMemo(() =>
    getFilterChips(state.filters, state.category),
    [state.filters, state.category]
  );

  const hasFilters = useMemo(() =>
    hasActiveFilters(state.filters) || state.searchTerm.trim() !== '',
    [state.filters, state.searchTerm]
  );

  const value = {
    // State
    ...state,

    // Derived
    chips,
    hasFilters,

    // Actions
    setCategory,
    setFilter,
    toggleProvider,
    removeFilter,
    resetFilters,
    setSearchTerm,
    handleSort,
  };

  return (
    <FilterContext.Provider value={value}>
      {children}
    </FilterContext.Provider>
  );
}

/**
 * useFilter Hook
 */
export function useFilter() {
  const context = useContext(FilterContext);
  if (!context) {
    throw new Error('useFilter must be used within a FilterProvider');
  }
  return context;
}

export default FilterContext;
