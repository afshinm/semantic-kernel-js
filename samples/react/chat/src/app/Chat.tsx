"use client";

import { useChat } from '@semantic-kernel/react';
import { useState, useTransition } from 'react';
import { ChatMessage } from 'semantic-kernel';

export default function Chat() {
  const [prompt, setPrompt] = useState('');
  const [loading, startTransition] = useTransition();
  const { invoke, messages } = useChat();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    startTransition(async () => {
      await invoke(prompt);
      setPrompt('');
    });
  };

  return (
    <>
      <main style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 100px)' }}>
        <div style={{ flex: '1 0 auto' }}>
          {messages.length === 0 && (
            <article style={{ textAlign: 'center' }}>
              <b>Type a message to start the conversation ✨</b>
            </article>
          )}

          {messages.map((chatResponseUpdates, i) => {
            const isUser = chatResponseUpdates instanceof ChatMessage && chatResponseUpdates.role === 'user';

            return (
              <div className="grid">
                {isUser ? <div></div> : <></>}
                <article
                  key={i}
                  style={
                    isUser
                      ? { whiteSpace: 'pre-line', backgroundColor: 'var(--pico-primary)', color: '#fff' }
                      : { whiteSpace: 'pre-line' }
                  }
                >
                  {chatResponseUpdates instanceof Array
                    ? chatResponseUpdates
                        .map((u) => u.text)
                        .filter((u) => u !== '')
                        .join(' ')
                    : chatResponseUpdates.text}
                </article>
                {!isUser ? <div></div> : <></>}
              </div>
            );
          })}
          {loading && <progress />}
        </div>

        <footer>
          <form role="search" onSubmit={handleSubmit}>
            <input
              name="prompt"
              autoComplete="off"
              type="text"
              placeholder="Type your message here"
              value={prompt}
              onChange={(e) => setPrompt(e.currentTarget.value)}
            />
            <button type="submit" disabled={loading} aria-busy={loading}>
              {!loading ? (
                <svg
                  height="14"
                  strokeLinejoin="round"
                  viewBox="0 0 16 16"
                  width="14"
                  style={{ color: 'currentcolor' }}
                >
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M8.70711 1.39644C8.31659 1.00592 7.68342 1.00592 7.2929 1.39644L2.21968 6.46966L1.68935 6.99999L2.75001 8.06065L3.28034 7.53032L7.25001 3.56065V14.25V15H8.75001V14.25V3.56065L12.7197 7.53032L13.25 8.06065L14.3107 6.99999L13.7803 6.46966L8.70711 1.39644Z"
                    fill="currentColor"
                  ></path>
                </svg>
              ) : (
                ''
              )}
            </button>
          </form>
        </footer>
      </main>
    </>
  );
}
