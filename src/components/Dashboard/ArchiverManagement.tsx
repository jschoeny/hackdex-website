"use client";

import React from "react";
import { FiX, FiPlus, FiSearch, FiLoader } from "react-icons/fi";
import { getArchivers, searchUsersForArchiver, addArchiverRole, removeArchiverRole } from "@/app/dashboard/archiver-actions";

export default function ArchiverManagement() {
  const [archivers, setArchivers] = React.useState<{ id: string; username: string | null }[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [searchResults, setSearchResults] = React.useState<{ id: string; username: string | null }[]>([]);
  const [searching, setSearching] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Load current archivers
  React.useEffect(() => {
    loadArchivers();
  }, []);

  // Debounce search query
  React.useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setSearching(false);
      return;
    }

    setSearching(true);
    const timer = setTimeout(async () => {
      try {
        setSearching(true);
        setError(null);
        const result = await searchUsersForArchiver(searchQuery);
        if (!result.ok) {
          throw new Error(result.error);
        }
        setSearchResults([...result.users]);
      } catch (err: any) {
        setError(err?.message || "Failed to search users");
      } finally {
        setSearching(false);
      }
    }, 300);

    return () => {
      clearTimeout(timer);
      setSearching(false);
    };
  }, [searchQuery]);

  async function loadArchivers() {
    try {
      setLoading(true);
      setError(null);
      const result = await getArchivers();
      if (!result.ok) {
        throw new Error(result.error);
      }
      setArchivers(result.archivers);
    } catch (err: any) {
      setError(err?.message || "Failed to load archivers");
    } finally {
      setLoading(false);
    }
  }

  async function addArchiver(userId: string) {
    try {
      setError(null);
      const result = await addArchiverRole(userId);
      if (!result.ok) {
        throw new Error(result.error);
      }
      await loadArchivers();
      setSearchQuery("");
      setSearchResults([]);
    } catch (err: any) {
      setError(err?.message || "Failed to add archiver");
    }
  }

  async function removeArchiver(userId: string) {
    try {
      setError(null);
      const result = await removeArchiverRole(userId);
      if (!result.ok) {
        throw new Error(result.error);
      }
      await loadArchivers();
    } catch (err: any) {
      setError(err?.message || "Failed to remove archiver");
    }
  }

  const handleSearchChange = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setSearchQuery(e.target.value);
    },
    []
  );

  const isArchiver = (userId: string) => archivers.some((a) => a.id === userId);

  return (
    <div className="mt-12">
      <h2 className="text-xl font-semibold mb-4">Archiver Role Management</h2>
      <div className="rounded-lg border border-[var(--border)] bg-[var(--surface-2)] p-5">
        {error && (
          <div className="mb-4 rounded-md border border-red-600/30 bg-red-500/10 p-3 text-sm text-red-600 dark:text-red-400">
            {error}
          </div>
        )}

        {/* Search for users */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-foreground/80 mb-2">Add archiver</label>
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground/50" />
            <input
              type="text"
              value={searchQuery}
              onChange={handleSearchChange}
              placeholder="Search by username or user ID..."
              className="w-full rounded-md bg-[var(--background)] px-10 py-2 text-sm ring-1 ring-inset ring-[var(--border)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
            />
            {searching && (
              <FiLoader className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground/50 animate-spin" />
            )}
          </div>
          {searchResults.length > 0 && (
            <div className="mt-2 rounded-md border border-[var(--border)] bg-[var(--background)] max-h-48 overflow-y-auto">
              {searchResults.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between px-3 py-2 hover:bg-[var(--surface-2)] border-b border-[var(--border)] last:border-b-0"
                >
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">{user.username ? `@${user.username}` : "No username"}</span>
                    <span className="text-xs text-foreground/60">{user.id}</span>
                  </div>
                  {isArchiver(user.id) ? (
                    <span className="text-xs text-foreground/60">Already archiver</span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => addArchiver(user.id)}
                      className="inline-flex items-center gap-1 rounded-md border border-[var(--border)] bg-[var(--surface-2)] px-2 py-1 text-xs font-medium hover:bg-black/5 dark:hover:bg-white/10"
                    >
                      <FiPlus className="h-3 w-3" />
                      Add
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Current archivers list */}
        <div>
          <label className="block text-sm font-medium text-foreground/80 mb-2">
            Current archivers ({archivers.length})
          </label>
          {loading ? (
            <div className="text-sm text-foreground/60">Loading...</div>
          ) : archivers.length === 0 ? (
            <div className="text-sm text-foreground/60">No archivers assigned</div>
          ) : (
            <div className="space-y-2">
              {archivers.map((archiver) => (
                <div
                  key={archiver.id}
                  className="flex items-center justify-between rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2"
                >
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">{archiver.username ? `@${archiver.username}` : "No username"}</span>
                    <span className="text-xs text-foreground/60">{archiver.id}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeArchiver(archiver.id)}
                    className="inline-flex items-center gap-1 rounded-md border border-red-600/40 bg-red-600/5 dark:border-red-400/40 dark:bg-red-400/5 px-2 py-1 text-xs font-medium text-red-600/90 dark:text-red-400/80 hover:bg-red-600/10 dark:hover:bg-red-400/10"
                  >
                    <FiX className="h-3 w-3" />
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
