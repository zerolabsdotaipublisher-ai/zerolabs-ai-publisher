"use client";

import { useState, useRef, useTransition } from "react";
import { createCommunityPost } from "./actions";

export function PostComposer() {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const handleSubmit = async (formData: FormData) => {
    setError(null);
    startTransition(async () => {
      const result = await createCommunityPost(formData);
      if (result.error) {
        setError(result.error);
      } else {
        formRef.current?.reset();
      }
    });
  };

  return (
    <div className="app-card">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Create a Post</h2>
      <form ref={formRef} action={handleSubmit} className="flex flex-col gap-3">
        <input
          type="text"
          name="title"
          placeholder="Title (optional)"
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-mint-500"
          disabled={isPending}
        />
        <textarea
          name="body"
          placeholder="What's on your mind?"
          required
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-mint-500 resize-none"
          disabled={isPending}
        />
        <div className="flex justify-between items-center mt-2">
          <select
            name="visibility"
            className="px-3 py-1.5 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-mint-500"
            disabled={isPending}
          >
            <option value="public">Public</option>
            <option value="private">Private</option>
          </select>
          <button
            type="submit"
            disabled={isPending}
            className="px-4 py-2 bg-mint-600 hover:bg-mint-700 text-white rounded-md font-medium transition-colors disabled:opacity-50"
          >
            {isPending ? "Posting..." : "Post"}
          </button>
        </div>
        {error && <div className="text-red-500 text-sm mt-2">{error}</div>}
      </form>
    </div>
  );
}
