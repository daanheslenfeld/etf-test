/**
 * CompetitionBanner Component
 *
 * Displays the currently active competition with countdown and info.
 * Shows on the Community page header.
 */

import React, { useState, useEffect } from 'react';
import {
  Trophy,
  Clock,
  Users,
  ChevronRight,
  Crown,
  Medal,
  Award,
  Loader2,
} from 'lucide-react';

// API base URL
const API_BASE = 'http://localhost:8002';

function formatTimeRemaining(endDate) {
  const end = new Date(endDate);
  const now = new Date();
  const diff = end - now;

  if (diff <= 0) return 'Afgelopen';

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

  if (days > 0) {
    return `${days}d ${hours}u`;
  }
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  return `${hours}u ${minutes}m`;
}

function formatDateRange(startDate, endDate) {
  const start = new Date(startDate);
  const end = new Date(endDate);

  const options = { day: 'numeric', month: 'short' };
  return `${start.toLocaleDateString('nl-NL', options)} - ${end.toLocaleDateString('nl-NL', options)}`;
}

export default function CompetitionBanner({ onViewStandings }) {
  const [competition, setCompetition] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeRemaining, setTimeRemaining] = useState('');

  // Load active competition
  useEffect(() => {
    async function loadCompetition() {
      setLoading(true);
      try {
        const response = await fetch(`${API_BASE}/competitions/active`);
        if (response.ok) {
          const data = await response.json();
          setCompetition(data);
          if (data) {
            setTimeRemaining(formatTimeRemaining(data.end_date));
          }
        } else if (response.status === 404 || response.status === 204) {
          setCompetition(null);
        } else {
          throw new Error('Failed to load competition');
        }
      } catch (err) {
        console.error('Error loading competition:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    loadCompetition();
  }, []);

  // Update countdown every minute
  useEffect(() => {
    if (!competition) return;

    const interval = setInterval(() => {
      setTimeRemaining(formatTimeRemaining(competition.end_date));
    }, 60000);

    return () => clearInterval(interval);
  }, [competition]);

  if (loading) {
    return (
      <div className="bg-gradient-to-r from-[#C9A962]/10 via-[#C9A962]/5 to-transparent rounded-2xl p-4 border border-[#C9A962]/20 animate-pulse">
        <div className="h-6 bg-[#ECEEED] rounded w-48 mb-2"></div>
        <div className="h-4 bg-[#ECEEED] rounded w-32"></div>
      </div>
    );
  }

  if (error || !competition) {
    return null; // Don't show banner if no active competition
  }

  const typeLabels = {
    monthly: 'Maandelijks',
    quarterly: 'Kwartaal',
    yearly: 'Jaarlijks',
  };

  return (
    <div className="bg-gradient-to-r from-[#C9A962]/10 via-[#C9A962]/5 to-transparent rounded-2xl p-5 border border-[#C9A962]/30 shadow-[0_2px_8px_rgba(201,169,98,0.1)]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Competition Info */}
        <div className="flex items-start gap-4">
          <div className="p-3 bg-[#C9A962]/20 rounded-xl">
            <Trophy className="w-6 h-6 text-[#C9A962]" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-bold text-[#2D3436] text-lg">
                {competition.name}
              </h3>
              <span className="text-xs px-2 py-0.5 bg-[#C9A962]/20 text-[#C9A962] rounded-full font-medium">
                {typeLabels[competition.type] || competition.type}
              </span>
            </div>
            {competition.description && (
              <p className="text-sm text-[#636E72] mb-2 line-clamp-1">
                {competition.description}
              </p>
            )}
            <div className="flex items-center gap-4 text-sm text-[#636E72]">
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4 text-[#C9A962]" />
                {timeRemaining} resterend
              </span>
              <span className="text-[#B2BEC3]">|</span>
              <span>{formatDateRange(competition.start_date, competition.end_date)}</span>
            </div>
          </div>
        </div>

        {/* Prize & Action */}
        <div className="flex items-center gap-4">
          {/* Prize Icons */}
          <div className="hidden sm:flex items-center gap-1">
            <div className="p-1.5 bg-[#C9A962]/20 rounded-lg">
              <Crown className="w-4 h-4 text-[#C9A962]" />
            </div>
            <div className="p-1.5 bg-[#6B7B8A]/20 rounded-lg">
              <Medal className="w-4 h-4 text-[#6B7B8A]" />
            </div>
            <div className="p-1.5 bg-[#B8956B]/20 rounded-lg">
              <Award className="w-4 h-4 text-[#B8956B]" />
            </div>
          </div>

          {/* View Standings Button */}
          <button
            onClick={() => onViewStandings?.(competition)}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#C9A962] text-white rounded-xl font-semibold hover:bg-[#B8956B] transition-colors shadow-sm"
          >
            Bekijk stand
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Prize Description */}
      {competition.prize_description && (
        <div className="mt-3 pt-3 border-t border-[#C9A962]/20">
          <p className="text-xs text-[#636E72] flex items-center gap-2">
            <Trophy className="w-3.5 h-3.5 text-[#C9A962]" />
            {competition.prize_description}
          </p>
        </div>
      )}
    </div>
  );
}
